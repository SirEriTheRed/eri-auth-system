import { JWT, VerifyOptions } from "@fastify/jwt";
import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";

type JwtVerifyOptions = Partial<VerifyOptions> & { onlyCookie?: boolean };

declare module "@fastify/jwt" {
  interface JWT {
    access: JWT;
    refresh: JWT;
    reset: JWT;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
    prisma: PrismaClient;

    sendResetEmail: (to: string, reserLink: string) => Promise<void>;
    siteUrl: string;
  }

  interface FastifyRequest {
    accessJwtVerify: (options?: JwtVerifyOptions) => Promise<void>;
    refreshJwtVerify: (options?: JwtVerifyOptions) => Promise<void>;
    resetJwtVerify: (options?: JwtVerifyOptions) => Promise<void>;
    accessUser: { userId: string };
    refreshUser: { userId: string };
  }

  interface FastifyReply {
    accessJwtSign: (payload: { userId: string }) => Promise<string>;
    refreshJwtSign: (payload: { userId: string }) => Promise<string>;
    resetJwtSign: (payload: { userId: string }) => Promise<string>;
  }
}

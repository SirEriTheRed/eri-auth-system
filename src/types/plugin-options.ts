import { PrismaClient } from "@prisma/client";

export interface PluginOptions {
  prisma: PrismaClient;
  accessSecret: string;
  refreshSecret: string;
  resetSecret: string;
  siteUrl: string;
  sendResetEmail: (to: string, reserLink: string) => Promise<void>;
}

const STATUS_LABELS: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
};

/**
 * Returns the standard HTTP status text for a given status code.
 *
 * @param statusCode - An HTTP response status code
 * @returns The corresponding label (e.g. 409 → "Conflict"), defaults to
 * "Internal Server Error" for unrecognised codes
 */
export function httpStatusLabel(statusCode: number): string {
  return STATUS_LABELS[statusCode] ?? 'Internal Server Error';
}

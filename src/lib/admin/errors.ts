export class ConfigurationError extends Error {}
export class AuthorizationError extends Error {}
export class VersionConflictError extends Error {}

export function messageFromError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return '알 수 없는 오류가 발생했습니다.';
}

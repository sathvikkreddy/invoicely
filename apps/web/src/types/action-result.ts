export type ActionErrorCode =
  | "UNAUTHORIZED"
  | "VALIDATION"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PAYLOAD_TOO_LARGE"
  | "LIMIT_REACHED"
  | "INTERNAL";

export interface ActionError {
  code: ActionErrorCode;
  message: string;
}

export type ActionResult<T = null> = { success: true; data: T } | { success: false; error: ActionError };

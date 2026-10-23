import type { ActionErrorCode, ActionResult } from "@/types/action-result";

function actionFailure(code: ActionErrorCode, message: string): ActionResult<never> {
  return {
    success: false,
    error: { code, message },
  };
}

export { actionFailure };

function parseCatchError(error: unknown, defaultMessage = "An unexpected error occurred"): string {
  return error instanceof Error ? error.message : defaultMessage;
}

export { parseCatchError };

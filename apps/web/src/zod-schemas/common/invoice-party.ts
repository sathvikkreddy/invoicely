import { z } from "zod";

export const gstinSchema = z
  .string({ invalid_type_error: "GSTIN must be a string" })
  .trim()
  .min(1, { message: "GSTIN cannot be empty" })
  .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i, {
    message: "GSTIN must be a valid 15-character GSTIN",
  });

export const stateSchema = z.string({ invalid_type_error: "State must be a string" }).trim().min(1, {
  message: "State cannot be empty",
});

export const stateCodeSchema = z
  .string({ invalid_type_error: "State code must be a string" })
  .trim()
  .min(1, { message: "State code cannot be empty" })
  .regex(/^[0-9]{2}$/, { message: "State code must be 2 digits" });

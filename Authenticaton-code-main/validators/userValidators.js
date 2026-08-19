import { z } from 'zod';

export const signupSchema = z.object({
  name: z
    .string({ required_error: "Full name is required" })
    .trim()
    .min(3, { message: "Name must be at least 3 characters long" })
    .max(80, { message: "Name must be at most 80 characters long" }),
  age: z
    .number()
    .min(10, { message: "Age must be at least 10" })
    .max(120, { message: "Age must be at most 120" })
    .optional(),
  email: z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
    z.string({ required_error: "Email is required" }).email({ message: "Invalid email address" })
  ),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(64, { message: "Password must be at most 64 characters long" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter (A-Z)" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter (a-z)" })
    .regex(/[0-9]/, { message: "Password must contain at least one number (0-9)" })
    .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character (@!#$% etc.)" }),
  role: z
    .enum(['PATIENT', 'DOCTOR', 'PHARMACY', 'ADMIN', 'AMBULANCE_PARTNER'])
    .optional()
    .default('PATIENT'),
  nmcRegistrationNumber: z.string().optional(),
  stateMedicalCouncil: z.string().optional(),
  vehicleNumber: z.string().optional(),
  drugLicenseNumber: z.string().optional(),
  gstin: z.string().optional()
});

export const loginSchema = z.object({
  email: z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
    z.string({ required_error: "Email is required" }).email({ message: "Invalid email address" })
  ),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, { message: "Password is required" }),
  role: z
    .enum(['PATIENT', 'DOCTOR', 'PHARMACY', 'ADMIN', 'AMBULANCE_PARTNER'])
    .optional()
});
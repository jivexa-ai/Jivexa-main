import { z } from 'zod';

export const signupSchema = z.object({
  name: 
      z.string()
      .trim()
      .min(3, { message: "Name must be at least 3 characters long" })
      .max(80, { message: "Name must be at most 80characters long" }),
  age: 
      z.number()
      .min(10, { message: "Age must be at least 18" })
      .max(100, { message: "Age must be at most 100" })
      .optional(),
  email: z.preprocess((value) => typeof value === "string" ? value.toLowerCase() : value, 
  z.string().email({ message: "Invalid email address" })),
  password: z.string()
      .min(8, { message: "Password must be at least 8 characters long" })
      .max(20, { message: "Password must be at most 20 characters long" })
      .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
      .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
      .regex(/[0-9]/, { message: "Password must contain at least one number" })
      .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" }),
});


export const loginSchema = z.object({
    email: z.preprocess((value) => typeof value === "string" ? value.toLowerCase() : value, 
  z.string().email({ message: "Invalid email address" })),
  password: z.string()
      .min(8, { message: "Password must be at least 8 characters long" })
      .max(20, { message: "Password must be at most 20 characters long" })
      .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
      .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
      .regex(/[0-9]/, { message: "Password must contain at least one number" })
      .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" }),
});
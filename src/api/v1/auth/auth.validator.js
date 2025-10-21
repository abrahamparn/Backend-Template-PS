import { z } from "zod";

const unexpectedFieldMessage =
  "Unexpected field(s) provided. Please contact us before sending additional data.";

export const loginSchema = z
  .object({
    body: z
      .object({
        username: z.string().min(3, "Username must be at least 3 characters"),
        password: z.string().min(1, "Password is required"),
      })
      .strict({ message: unexpectedFieldMessage }),
  })
  .strict({ message: unexpectedFieldMessage });

export const refreshTokenSchema = z
  .object({
    body: z.object({}).strict({ message: unexpectedFieldMessage }).optional(),
  })
  .strict({ message: unexpectedFieldMessage });

export const registerationSchema = z
  .object({
    body: z
      .object({
        email: z.email("Invalid email address"),
        username: z.string().min(3, "Username must be at least 3"),
        name: z.string().min(3, "Name must be at least 3 characters"),
        phoneNumber: z.string().min(12, "Phone number must be at least 12 characters").optional(),
        password: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
      })
      .strict({ message: unexpectedFieldMessage }),
  })
  .refine((data) => data.body.password === data.body.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .strict({ message: unexpectedFieldMessage });

import { z } from "zod";

export const businessSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must only contain lowercase letters, numbers, and hyphens",
    ),
  description: z.string().optional(),
  contact_phone: z.string().min(10, "Phone number must be at least 10 digits"),
  contact_email: z.string().email("Invalid email address"),
});

export const serviceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be positive"),
  duration_minutes: z.coerce
    .number()
    .min(15, "Duration must be at least 15 minutes"),
  max_capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
});

export type BusinessFormValues = z.infer<typeof businessSchema>;
export type ServiceFormValues = z.infer<typeof serviceSchema>;

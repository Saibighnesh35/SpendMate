import { z } from "zod";

export const transactionSchema = z.object({
  amountMinor: z.number().int().positive().max(100_000_000),
  type: z.enum(["CREDIT", "DEBIT"]),
  transactionDate: z.string().date(),
  paymentMethodId: z.string().uuid().or(z.string().min(1)),
  categoryId: z.string().uuid().or(z.string().min(1)).optional(),
  merchant: z.string().trim().max(120).optional(), note: z.string().trim().max(500).optional(),
  source: z.enum(["MANUAL", "SCREENSHOT"]),
});

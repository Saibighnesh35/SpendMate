import type { Transaction, TransactionInput } from "@/types";

export function findPotentialDuplicate(input: TransactionInput, transactions: Transaction[]) {
  return transactions.find(t => !t.deletedAt && t.amountMinor === input.amountMinor && t.paymentMethodId === input.paymentMethodId && t.transactionDate === input.transactionDate && (t.merchant ?? "").trim().toLowerCase() === (input.merchant ?? "").trim().toLowerCase());
}

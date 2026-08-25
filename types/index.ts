export type TransactionType = "CREDIT" | "DEBIT";
export type TransactionSource = "MANUAL" | "SCREENSHOT";

export interface Category { id: string; name: string; color: string; active?: boolean; }
export interface PaymentMethod { id: string; name: string; icon: string; active?: boolean; }
export interface Transaction {
  id: string; amountMinor: number; currency: string; type: TransactionType; transactionDate: string;
  categoryId?: string; paymentMethodId: string; merchant?: string; note?: string; source: TransactionSource;
  createdAt: string; deletedAt?: string;
}
export interface TransactionInput {
  amountMinor: number; type: TransactionType; transactionDate: string; categoryId?: string;
  paymentMethodId: string; merchant?: string; note?: string; source: TransactionSource;
}
export interface Analytics { credits: number; debits: number; net: number; count: number; categoryTotals: { name: string; amount: number; color: string }[]; paymentTotals: { name: string; amount: number }[]; dailyTotals: { day: string; amount: number }[]; }

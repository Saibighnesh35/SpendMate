"use client";
import { Fragment } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Trash2, Pencil, Camera } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useSpendMate } from "@/components/demo-provider";
import { formatMoney } from "@/lib/money";

export default function Page() {
  const { id } = useParams<{ id: string }>(); const router = useRouter();
  const { transactions, categories, methods, deleteTransaction } = useSpendMate();
  const transaction = transactions.find((item) => item.id === id && !item.deletedAt);
  if (!transaction) return <AppShell><div className="card" style={{ padding: 35, textAlign: "center" }}><h1>Transaction not found</h1><button className="btn btn-primary" onClick={() => router.push("/transactions")}>Back to history</button></div></AppShell>;
  const category = categories.find((item) => item.id === transaction.categoryId)?.name ?? "Uncategorized";
  const method = methods.find((item) => item.id === transaction.paymentMethodId)?.name ?? "—";
  const details = [["Category", category], ["Merchant", transaction.merchant || "—"], ["Payment method", method], ["Date", format(parseISO(transaction.transactionDate), "d MMMM yyyy")], ["Note", transaction.note || "—"]];
  return <AppShell><div style={{ maxWidth: 670, margin: "15px auto" }}><button className="btn btn-secondary" onClick={() => router.push("/transactions")}>← Transactions</button><div className="card" style={{ padding: "clamp(20px,4vw,34px)", marginTop: 15 }}>
    <p className="eyebrow">{transaction.source === "SCREENSHOT" ? "Added via screenshot" : "Added manually"}</p><h1 style={{ fontSize: "3rem", letterSpacing: "-.07em", margin: "8px 0" }}>{transaction.type === "DEBIT" ? "−" : "+"}{formatMoney(transaction.amountMinor)}</h1><span style={{ display: "inline-block", padding: "6px 9px", borderRadius: 999, background: transaction.type === "DEBIT" ? "#fff0eb" : "var(--brand-soft)", fontSize: ".78rem", fontWeight: 700 }}>{transaction.type === "DEBIT" ? "Money out" : "Money in"}</span>
    <dl style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "15px 12px", paddingTop: 28, margin: 0 }}>{details.map(([label, value]) => <Fragment key={label}><dt className="muted">{label}</dt><dd style={{ margin: 0, fontWeight: 700 }}>{value}</dd></Fragment>)}</dl>
    {transaction.source === "SCREENSHOT" && <div style={{ marginTop: 25, padding: 14, borderRadius: 12, background: "var(--brand-soft)", display: "flex", gap: 9, alignItems: "center" }}><Camera size={18} color="var(--brand)" /> Screenshot attachment is private. Retention controls live in Privacy settings.</div>}
    <div style={{ display: "flex", gap: 10, marginTop: 30, flexWrap: "wrap" }}><button className="btn btn-secondary" onClick={() => router.push(`/transactions/${transaction.id}/edit`)}><Pencil size={17} /> Edit</button><button className="btn btn-danger" onClick={() => { if (confirm("Delete this transaction? It will be removed from all summaries.")) { deleteTransaction(transaction.id); router.push("/transactions"); } }}><Trash2 size={17} /> Delete</button></div>
  </div></div></AppShell>;
}

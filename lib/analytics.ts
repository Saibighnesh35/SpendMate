import { differenceInCalendarDays, format, isSameMonth, parseISO, startOfMonth } from "date-fns";
import type { Analytics, Category, PaymentMethod, Transaction } from "@/types";

export function getMonthAnalytics(transactions: Transaction[], categories: Category[], methods: PaymentMethod[], month = new Date()): Analytics {
  const active = transactions.filter((t) => !t.deletedAt && isSameMonth(parseISO(t.transactionDate), month));
  const credits = active.filter((t) => t.type === "CREDIT").reduce((sum, t) => sum + t.amountMinor, 0);
  const debits = active.filter((t) => t.type === "DEBIT").reduce((sum, t) => sum + t.amountMinor, 0);
  const group = (key: "categoryId" | "paymentMethodId", lookup: { id: string; name: string; color?: string }[]) => Object.entries(active.filter(t => t.type === "DEBIT").reduce<Record<string, number>>((acc, t) => { const id = t[key] ?? "uncategorized"; acc[id] = (acc[id] ?? 0) + t.amountMinor; return acc; }, {})).map(([id, amount]) => { const entity = lookup.find(x => x.id === id); return { name: entity?.name ?? "Uncategorized", amount, color: entity?.color ?? "#9ca8a1" }; }).sort((a,b)=>b.amount-a.amount);
  const dailyMap = active.filter(t=>t.type === "DEBIT").reduce<Record<string, number>>((acc,t)=> { const day=format(parseISO(t.transactionDate),"d MMM"); acc[day]=(acc[day]??0)+t.amountMinor; return acc;},{});
  return { credits, debits, net: credits-debits, count: active.length, categoryTotals: group("categoryId", categories), paymentTotals: group("paymentMethodId", methods), dailyTotals: Object.entries(dailyMap).map(([day,amount])=>({day,amount})) };
}

export function createInsights(current: Analytics, prior: Analytics, date = new Date()): string[] {
  const insights: string[] = [];
  const top = current.categoryTotals[0]; if (top && current.debits) insights.push(`${top.name} is your biggest expense this month, accounting for ${Math.round((top.amount / current.debits) * 100)}% of spending.`);
  if (prior.debits > 0) { const delta = ((current.debits-prior.debits)/prior.debits)*100; if (Math.abs(delta)>=10) insights.push(`You spent ${Math.abs(Math.round(delta))}% ${delta>0?"more":"less"} than last month.`); }
  return insights;
}

export function averageDailySpend(debits: number, period = new Date()) { return Math.round(debits / Math.max(1, differenceInCalendarDays(period, startOfMonth(period)) + 1)); }

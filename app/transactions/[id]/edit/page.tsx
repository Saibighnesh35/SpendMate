"use client";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { useSpendMate } from "@/components/demo-provider";
import { TransactionForm } from "@/components/transaction-form";
export default function Page(){const {id}=useParams<{id:string}>();const {transactions}=useSpendMate();const router=useRouter();const found=transactions.find(t=>t.id===id&&!t.deletedAt);if(!found){router.replace("/transactions");return null;}return <AppShell><TransactionForm existing={found}/></AppShell>}

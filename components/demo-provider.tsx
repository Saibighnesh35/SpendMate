"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Category, PaymentMethod, Transaction, TransactionInput } from "@/types";
import { findPotentialDuplicate } from "@/lib/duplicates";

const categories: Category[] = [
  ["Food","#f59e5b"],["Groceries","#eab308"],["Travel","#5a9cf5"],["Shopping","#b578e9"],["Education","#38a996"],["Entertainment","#ed7294"],["Bills","#64748b"],["Health","#ef6262"],["Hostel / Rent","#a07256"],["Personal","#4ab7c9"],["Others","#94a3b8"],
].map(([name,color], i) => ({ id: `cat-${i+1}`, name, color }));
const methods: PaymentMethod[] = ["GPay","PhonePe","Paytm","Cash","Debit Card","Credit Card","Bank Transfer","UPI","Other"].map((name, i)=>({id:`method-${i+1}`,name,icon:name === "Cash" ? "₹" : "◉"}));

type AppUser = { name: string; email: string } | null;
type Store = { user: AppUser; transactions: Transaction[]; categories: Category[]; methods: PaymentMethod[]; addTransaction(input: TransactionInput, allowDuplicate?: boolean): { transaction?: Transaction; duplicate?: Transaction }; updateTransaction(id: string,input: TransactionInput): void; deleteTransaction(id: string): void; addCategory(name:string): void; renameCategory(id:string,name:string):void; addMethod(name:string):void; deleteAttachment(id:string):void; login(name:string,email:string):void; logout():void; clearRecent():void; };
const Ctx = createContext<Store | null>(null);
const key = "spendmate-local-v1";

function sampleTransactions(): Transaction[] {
  const m = new Date(); const y=m.getFullYear(), mo=String(m.getMonth()+1).padStart(2,"0"); const d=(day:number)=>`${y}-${mo}-${String(day).padStart(2,"0")}`;
  const today=Math.max(1,m.getDate());
  return [
    [12000,"CREDIT",1,"method-7",undefined,"Monthly allowance","From parents"], [24000,"DEBIT",Math.max(1,today-1),"method-1","cat-1","Campus Cafe","Dinner"], [6000,"DEBIT",Math.max(1,today-2),"method-4","cat-3","Auto","College commute"], [35000,"DEBIT",Math.max(1,today-3),"method-2","cat-4","Amazon","Headphones"], [12000,"DEBIT",Math.max(1,today-5),"method-1","cat-1","Swiggy","Lunch"], [45000,"DEBIT",Math.max(1,today-7),"method-5","cat-5","Bookstore","Semester books"],
  ].map(([amount,type,day,paymentMethodId,categoryId,merchant,note],i)=>({id:`sample-${i}`,amountMinor:amount as number,type:type as Transaction["type"],transactionDate:d(day as number),paymentMethodId:paymentMethodId as string,categoryId:categoryId as string|undefined,merchant:merchant as string,note:note as string,currency:"INR",source:"MANUAL",createdAt:new Date().toISOString()}));
}

export function DemoProvider({children}:{children:React.ReactNode}) {
  const [hydrated,setHydrated]=useState(false); const [user,setUser]=useState<AppUser>(null); const [items,setItems]=useState<Transaction[]>([]); const [cats,setCats]=useState(categories); const [pays,setPays]=useState(methods);
  useEffect(()=>{ const saved=localStorage.getItem(key); if(saved){ const data=JSON.parse(saved);setUser(data.user);setItems(data.items ?? []);setCats(data.cats ?? categories);setPays(data.pays ?? methods); } setHydrated(true); },[]);
  useEffect(()=>{ if(hydrated) localStorage.setItem(key, JSON.stringify({user,items,cats,pays})); },[hydrated,user,items,cats,pays]);
  const login=useCallback((name:string,email:string)=>{setUser({name,email}); setItems(current=>current.length ? current : sampleTransactions());},[]);
  const addTransaction=useCallback((input:TransactionInput,allowDuplicate=false)=>{const duplicate=findPotentialDuplicate(input,items);if(duplicate&&!allowDuplicate)return {duplicate};const transaction:Transaction={...input,id:crypto.randomUUID(),currency:"INR",createdAt:new Date().toISOString()};setItems(c=>[transaction,...c]);return {transaction};},[items]);
  const value=useMemo<Store>(()=>({user,transactions:items,categories:cats,methods:pays,addTransaction,updateTransaction:(id,input)=>setItems(all=>all.map(t=>t.id===id?{...t,...input}:t)),deleteTransaction:(id)=>setItems(all=>all.map(t=>t.id===id?{...t,deletedAt:new Date().toISOString()}:t)),addCategory:(name)=>setCats(all=>[...all,{id:crypto.randomUUID(),name:name.trim(),color:"#1e8b62"}]),renameCategory:(id,name)=>setCats(all=>all.map(c=>c.id===id?{...c,name:name.trim()}:c)),addMethod:(name)=>setPays(all=>[...all,{id:crypto.randomUUID(),name:name.trim(),icon:"◉"}]),deleteAttachment:()=>undefined,login,logout:()=>setUser(null),clearRecent:()=>undefined}),[user,items,cats,pays,addTransaction,login]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useSpendMate(){const value=useContext(Ctx);if(!value)throw new Error("SpendMate provider missing");return value;}

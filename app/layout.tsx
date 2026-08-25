import type { Metadata } from "next";
import "./globals.css";
import { DemoProvider } from "@/components/demo-provider";

export const metadata: Metadata = { title: "SpendMate", description: "Track it in seconds. Understand it every month." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><DemoProvider>{children}</DemoProvider></body></html>;
}

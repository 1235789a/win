import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = {
  title: "AI Intel · 商业机会发现系统",
  description: "本地优先的 AI 创业情报系统：从真实需求中挖掘可落地的机会",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen font-sans antialiased">
        <Sidebar />
        <main className="md:pl-56">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}

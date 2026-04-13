import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";

export const metadata: Metadata = {
  title: "DealerPulse — Dealership Performance Dashboard",
  description: "Real-time performance insights for automotive dealership networks. Track sales, pipeline, targets, and team performance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="app-layout">
          <Sidebar />
          <MobileNav />
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

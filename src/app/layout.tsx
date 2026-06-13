import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BusinessProvider } from "@/context/business-context";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-geist-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SkyPulse",
  description: "Smart local operations recommendation agent",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="h-full flex overflow-hidden bg-[var(--background)]">
        <BusinessProvider>
          <TooltipProvider>
            <Sidebar />
            <div className="flex flex-col flex-1 min-w-0">
              <Header />
              <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
          </TooltipProvider>
        </BusinessProvider>
      </body>
    </html>
  );
}

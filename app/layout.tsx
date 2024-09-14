import React from 'react';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toast"

// Define font with more options
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// Define metadata with more details
export const metadata: Metadata = {
  title: {
    default: "My Awesome Next.js App",
    template: "%s | My Awesome Next.js App",
  },
  description: "A cutting-edge web application built with Next.js",
  keywords: ["Next.js", "React", "JavaScript", "Web Development"],
  authors: [{ name: "Your Name", url: "https://yourwebsite.com" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  themeColor: "#000000",
};

// Improved props typing
interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
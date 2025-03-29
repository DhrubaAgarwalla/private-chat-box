import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ChatProvider } from "@/context/ChatContext";
import React from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Private Chat Box",
  description: "A secure private chat application with video calling capabilities",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ChatProvider>
          <Toaster position="top-right" />
          {children}
        </ChatProvider>
      </body>
    </html>
  );
}

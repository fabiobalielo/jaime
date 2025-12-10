import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jaime Whats - WhatsApp Business Messaging",
  description: "Send WhatsApp messages via our Business account",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

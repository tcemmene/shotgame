import { Inter } from "next/font/google";
import "./globals.css";
import { Metadata } from "next/types";
import { Header } from "./components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shots",
  description: "by BBF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        <main className={`${inter.className} `}>{children}</main>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MarksKhata",
    template: "%s · MarksKhata",
  },
  description:
    "MarksKhata is the digital khata for school and tuition test marks: enter marks in about 3 minutes, get a class report, a parent report card on WhatsApp, and every student's progress for the year.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

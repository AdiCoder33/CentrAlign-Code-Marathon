import "./globals.css";
import type { ReactNode } from "react";
import { Navbar } from "../components/Navbar";

export const metadata = {
  title: "AI Form Generator",
  description: "Generate and share dynamic forms with AI.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <div className="container">{children}</div>
      </body>
    </html>
  );
}

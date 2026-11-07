import "./globals.css";
import { Fraunces, DM_Sans } from "next/font/google";

const serif = Fraunces({ subsets: ["latin"], variable: "--serif" });
const sans = DM_Sans({ subsets: ["latin"], variable: "--sans" });

export const metadata = { title: "Kafe Lilim", description: "Order ahead, pick up at the café." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}

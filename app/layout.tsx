import type { Metadata } from "next";
import { Syne, Geist } from "next/font/google";
import "./globals.css";
import GSAPProvider from "@/components/GSAPProvider";
import SmoothScroll from "@/components/SmoothScroll";
import { LoadingProvider } from "@/components/LoadingContext";
import Preloader from "@/components/Preloader";
import ScrollCinema from "@/components/ScrollCinema";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AURA | Cinematic 3D Experience",
  description: "A premium cinematic web experience powered by Next.js 15, React Three Fiber, GSAP, and Tailwind CSS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${geist.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#030303] text-[#fafafa] selection:bg-[#ff4500] selection:text-[#030303] antialiased overflow-x-hidden">
        <LoadingProvider>
          {/* Preloader Overlay Sheet */}
          <Preloader />

          <GSAPProvider>
            <SmoothScroll>
              {/* Global Scroll Cinema Backdrop */}
              <div className="fixed inset-0 -z-10 w-full h-full pointer-events-none overflow-hidden">
                <ScrollCinema />
              </div>

              {/* Main scrollable page content */}
              <div className="relative z-10 w-full min-h-full">
                {children}
              </div>
            </SmoothScroll>
          </GSAPProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}

import Link from "next/link";
import {Sprout, ArrowRight} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen font-sans bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50">
      {/* --- HEADER --- */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b bg-white/80 dark:bg-black/80 backdrop-blur-md border-zinc-200 dark:border-zinc-800 sm:px-12">
        <div className="flex items-center gap-3">
          {/* Logo Sementara */}
          <div className="flex items-center justify-center w-10 h-10 font-bold text-white bg-green-600 rounded-xl shadow-sm">
            <Sprout className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">GH-System</span>
        </div>

        <nav className="flex items-center gap-4">
          <Link
            href="/signin"
            className="hidden text-sm font-medium transition-colors sm:block text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2 text-sm font-medium text-white transition-colors bg-green-600 rounded-full hover:bg-green-700 shadow-sm"
          >
            Get Started
          </Link>
        </nav>
      </header>

      {/* --- HERO SECTION --- */}
      <main className="flex flex-col items-center justify-center w-full max-w-5xl px-6 mx-auto text-center py-32 sm:px-16">
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 text-sm font-medium border rounded-full text-green-700 bg-green-50 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
          <span className="relative flex w-2 h-2">
            <span className="absolute inline-flex w-full h-full bg-green-500 rounded-full opacity-75 animate-ping"></span>
            <span className="relative inline-flex w-2 h-2 bg-green-600 rounded-full"></span>
          </span>
          Active Greenhouse IoT System
        </div>

        {/* Main Headline */}
        <h1 className="max-w-4xl text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
          Smart Farming, <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-400">
            At Your Fingertips
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="max-w-2xl mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Monitor temperature, humidity, and control microcontroller devices
          across your fields in real-time. Maximize efficiency and crop yields
          with precision data.
        </p>

        {/* Call to Action Buttons */}
        <div className="flex flex-col gap-4 mt-10 w-full sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="flex items-center justify-center h-12 gap-2 px-8 text-base font-medium text-white transition-colors rounded-full bg-green-600 hover:bg-green-700 shadow-md"
          >
            Try Now!
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="#features"
            className="flex items-center justify-center h-12 px-8 text-base font-medium transition-colors border border-solid rounded-full border-black/[.08] hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
          >
            Explore Features
          </Link>
        </div>
      </main>
    </div>
  );
}

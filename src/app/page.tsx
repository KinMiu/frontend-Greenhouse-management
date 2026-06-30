"use client";

import Link from "next/link";
import {ArrowRight} from "lucide-react";
import {IMAGES} from "../assets";

export default function Home() {
  return (
    <div className="min-h-screen font-sans bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50">
      {/* --- HEADER --- */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b bg-white/80 dark:bg-black/80 backdrop-blur-md border-zinc-200 dark:border-zinc-800 sm:px-12">
        <div className="flex items-center gap-3">
          {/* Logo UrKen Baru */}
          <img
            src={IMAGES.logo}
            alt="UrKen Logo"
            className="w-9 h-9 object-contain rounded-lg"
          />
          <span className="text-xl font-extrabold tracking-tight text-gray-950 dark:text-white">
            The Origin{" "}
            <span className="text-green-600 font-medium text-sm block -mt-1 tracking-normal">
              UrKen Platform
            </span>
          </span>
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
            className="px-5 py-2 text-sm font-medium text-white transition-colors bg-green-600 hover:bg-green-700 rounded-full shadow-sm"
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
          Empowering Endless IoT Solutions
        </div>

        {/* Main Headline (Diubah menjadi fokus ide & solusi) */}
        <h1 className="max-w-4xl text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl leading-tight">
          Where Ideas Turn Into <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
            Real IoT Solutions
          </span>
        </h1>

        {/* Sub-headline (Fokus ke ekosistem serbaguna UrKen) */}
        <p className="max-w-2xl mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          <strong>The Origin UrKen</strong> adalah platform IoT serbaguna yang
          dirancang untuk menjembatani ide-ide inovatif kamu dengan perangkat
          hardware di lapangan. Monitor data sensor secara akurat, kelola
          microservices secara dinamis, dan kendalikan alat secara real-time.
        </p>

        {/* Call to Action Buttons */}
        <div className="flex flex-col gap-4 mt-10 w-full sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="flex items-center justify-center h-12 gap-2 px-8 text-base font-medium text-white transition-colors rounded-full bg-green-600 hover:bg-green-700 shadow-md"
          >
            Explore Platform
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="#features"
            className="flex items-center justify-center h-12 px-8 text-base font-medium transition-colors border border-solid rounded-full border-black/[.08] hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
          >
            See Innovations
          </Link>
        </div>
      </main>
    </div>
  );
}

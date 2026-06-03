"use client";

import Navbar from "@/src/components/layout/navbar";
import Sidebar from "@/src/components/layout/sidebar";
import {useGetMe} from "@/src/hooks/use-auth";
import React, {useState, useEffect} from "react";
import {useRouter, usePathname} from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 1. Ambil data user & role dari Hook andalan Anda
  const {data: users = [], isLoading, isError} = useGetMe();
  const role = users.data?.role;

  // 2. Efek Satpam Pengaman Jalur (Authorization)
  useEffect(() => {
    // Kalau masih loading ambil data dari backend, skip dulu biar gak salah mentalin
    if (isLoading) return;

    // Jika terjadi error auth atau role tidak ditemukan (misal token hangus/unauthorized)
    if (isError || !role) {
      router.replace("/signin");
      return;
    }

    console.log(
      `[SATPAM LAYOUT] User Terdeteksi! Role: ${role} | Path: ${pathname}`,
    );

    // === ATURAN MENTALIN USER ===

    // A. Proteksi Halaman Khusus Super Admin
    if (pathname.startsWith("/dashboard/users") && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
      return;
    }

    // B. Proteksi Halaman Manajemen Area & Greenhouse (Khusus OWNER & SUPER_ADMIN)
    if (
      (pathname.startsWith("/dashboard/area") ||
        pathname.startsWith("/dashboard/greenhouse")) &&
      role !== "OWNER" &&
      role !== "SUPER_ADMIN"
    ) {
      router.replace("/dashboard"); // Mentalin Staff biasa ke beranda dashboard
      return;
    }
  }, [role, isLoading, isError, pathname, router]);

  // 3. Tampilan Loading State (Biar pas ganti halaman gak kedip transparan)
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-sm font-medium text-gray-600">
            Memvalidasi Akses Sistem...
          </p>
        </div>
      </div>
    );
  }

  // Jika terjadi error atau user tidak punya role yang valid, block render children
  if (isError || !role) {
    return null;
  }

  // 4. Jika Lolos Validasi, Tampilkan Dashboard Utuh
  return (
    <div className="h-screen w-full bg-gray-100 flex overflow-hidden">
      <Sidebar
        role={role}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}

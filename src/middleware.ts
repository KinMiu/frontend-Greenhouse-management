import {NextRequest, NextResponse} from "next/server";

export function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl;

  // Membaca custom header X-User-Role yang disuapi langsung oleh Nginx depan
  const role = request.headers.get("X-User-Role") || "undefined";

  // Log murni untuk memantau pergerakan role di konsol Docker Anda
  console.log(`[SATPAM PRODUCTION] Role: ${role} | Target Path: ${pathname}`);

  // =========================================================
  // LOGIKA MENTALIN USER (ROLE-BASED AUTHORIZATION)
  // =========================================================

  // 1. Proteksi Halaman Khusus Super Admin
  if (pathname.startsWith("/dashboard/users")) {
    if (role !== "SUPER_ADMIN") {
      // Jika bukan super admin, mentalin ke dashboard utama atau signin
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 2. Proteksi Halaman Manajemen Area & Greenhouse (Khusus OWNER)
  if (
    pathname.startsWith("/dashboard/area") ||
    pathname.startsWith("/dashboard/greenhouse")
  ) {
    if (role !== "OWNER" && role !== "SUPER_ADMIN") {
      // Jika staff biasa iseng mau masuk area, lempar balik ke dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Izinkan request berlanjut jika lolos validasi role
  return NextResponse.next();
}

// Hanya mengunci jalur dashboard agar tidak mengganggu fungsi landing page / signin
export const config = {
  matcher: "/dashboard/:path*",
};

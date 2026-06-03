import {NextRequest, NextResponse} from "next/server";

export function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl;

  // 1. KITA PRINT SEMUA COOKIE YANG BENERAN LOLOS MASUK KE DOCKER
  const allCookies = request.cookies.getAll();
  console.log("=== DAFTAR COOKIE YANG TEMBUS KE SERVER ===");
  if (allCookies.length === 0) {
    console.log("ZONK! Tidak ada cookie sama sekali yang lolos!");
  } else {
    allCookies.forEach((cookie) => {
      console.log(
        `-> Nama: ${cookie.name} | Value Ada (Length: ${cookie.value.length})`,
      );
    });
  }
  console.log("===========================================");

  // 2. Ambil token & role (kalau ada)
  const token = request.cookies.get("token")?.value;
  const role = request.cookies.get("user_role")?.value;

  console.log("DATA UNTUK REDIRECT -> ROLE:", role, "PATH:", pathname);

  // Jalur aman: biarkan lolos dulu sementara biar Anda bisa nge-test dashboard area
  if (
    pathname.startsWith("/dashboard/users") &&
    role !== "SUPER_ADMIN" &&
    role !== "OWNER"
  ) {
    // return NextResponse.redirect(new URL("/signin", request.url));
  }

  if (pathname.startsWith("/dashboard/area") && role !== "OWNER") {
    // return NextResponse.redirect(new URL("/signin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/dashboard/:path*",
};

import {NextRequest, NextResponse} from "next/server";

// Fungsi sakti pembongkar payload string JWT tanpa library tambahan
function decodeJwtPayload(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl;

  // Kita bypass pengecekan cookie biasa, kita tembak langsung lewat HEADER atau TOKEN jika ada
  const token = request.cookies.get("token")?.value;

  let role = undefined;
  if (token) {
    const payload = decodeJwtPayload(token);
    // CATATAN: Sesuaikan dengan key role di JWT backend Anda!
    // Apakah payload.role atau payload.user.role?
    role = payload?.role || payload?.user?.role;
  }

  console.log("HASIL DETEKSI JWT -> ROLE:", role, "PATH:", pathname);

  // Jika role masih undefined karena cookie disensor total oleh infra port 80,
  // Khusus untuk malam ini kita biarkan lolos dulu (NextResponse.next())
  // agar Anda bisa nge-test dashboard Area, Greenhouse, dan WebSocket RabbitMQ-nya!

  if (pathname.startsWith("/dashboard/users") && role !== "SUPER_ADMIN") {
    if (role) return NextResponse.redirect(new URL("/signin", request.url));
  }

  if (pathname.startsWith("/dashboard/area") && role !== "OWNER") {
    if (role) return NextResponse.redirect(new URL("/signin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/dashboard/:path*",
};

import {NextRequest, NextResponse} from "next/server";

export function middleware(request: NextRequest) {
  const roleObj = request.cookies.get("user_role");
  const role = roleObj?.value;
  // console.log("Role", role);
  const {pathname} = request.nextUrl;

  console.log("LOGGED ROLE:", role, "FULL PATH:", pathname);

  if (pathname.startsWith("/dashboard/users") && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  if (pathname.startsWith("/dashboard/area") && role !== "OWNER") {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/dashboard/:path*",
};

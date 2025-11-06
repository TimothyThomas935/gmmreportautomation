// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const EXPECTED_PASSWORD =
  process.env.SITE_PASSWORD || "minecoalsafe";

export function middleware(req: NextRequest) {
  const auth = req.headers.get("authorization");

  if (auth?.startsWith("Basic ")) {
    const base64 = auth.split(" ")[1];
    const decoded = atob(base64); // "username:password"
    const [, password] = decoded.split(":");

    if (password === EXPECTED_PASSWORD) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Password required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' },
  });
}

export const config = { matcher: "/:path*" };

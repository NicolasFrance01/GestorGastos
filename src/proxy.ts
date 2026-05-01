import middleware from "next-auth/middleware";

export default function proxy(req: any, event: any) {
  return (middleware as any)(req, event);
}

export const config = {
  matcher: ["/dashboard/:path*", "/wallets/:path*", "/reports/:path*", "/alerts/:path*"],
};

export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*", "/wallets/:path*", "/reports/:path*", "/alerts/:path*"],
};

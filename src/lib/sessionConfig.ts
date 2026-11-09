export const sessionCookieName = "cryptcona.session-token";
export const sessionCookie = {
  name: sessionCookieName,
  options: {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NEXTAUTH_URL?.startsWith("https://") || false,
  },
};

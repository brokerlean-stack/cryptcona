import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's postal address. */
      id: string;
      role: string;
      balance: number;
      currency: string;
      country: string;
      isVerified: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    balance: number;
    currency: string;
    country: string;
    isVerified: boolean;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** OpenID ID Token */
    id: string;
    role: string;
    balance: number;
    currency: string;
    country: string;
    isVerified: boolean;
  }
}

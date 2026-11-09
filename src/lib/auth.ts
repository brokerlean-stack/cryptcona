import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { sessionCookie } from "@/lib/sessionConfig";
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  cookies: { sessionToken: sessionCookie },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await dbConnect();
        const user = await User.findOne({
          email: credentials.email.trim().toLowerCase(),
        }).select("+password");
        if (
          !user ||
          user.status === "suspended" ||
          !(await bcrypt.compare(credentials.password, user.password))
        )
          return null;
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.profilePhoto || "",
          role: user.role,
          balance: user.balance,
          currency: user.currency,
          country: user.country,
          isVerified: user.isVerified,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.picture = user.image || "";
        token.role = user.role;
        token.balance = user.balance;
        token.currency = user.currency;
        token.country = user.country;
        token.isVerified = user.isVerified;
      }
      if (trigger === "update" || token.picture === undefined) {
        await dbConnect();
        const fresh = await User.findById(token.id);
        if (fresh) {
          token.name = fresh.name;
          token.picture = fresh.profilePhoto || "";
          token.country = fresh.country;
          token.role = fresh.role;
          token.balance = fresh.balance;
          token.currency = fresh.currency;
          token.isVerified = fresh.isVerified;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.image = token.picture;
        session.user.role = token.role;
        session.user.balance = token.balance;
        session.user.currency = token.currency;
        session.user.country = token.country;
        session.user.isVerified = token.isVerified;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};

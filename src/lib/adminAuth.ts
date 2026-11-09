import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
export function isAdminUser(
  user?: { email?: string | null; role?: string | null } | null,
) {
  return user?.role === "admin";
}
export async function getAdminSession() {
  const session = await getServerSession(authOptions);
  return isAdminUser(session?.user) ? session : null;
}

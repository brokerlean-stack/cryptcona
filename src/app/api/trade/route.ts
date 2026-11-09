import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Never resolve funded trades using random outcomes. Connect a verified execution
// provider and reconcile its fills before enabling this endpoint.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({error:"Unauthorized"},{status:401});
  return NextResponse.json({error:"Live trading is unavailable until an execution provider is connected. No funds have been moved."},{status:503});
}

import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json(
    { error: "Use the local admin setup command to initialize Cryptcona." },
    { status: 410 },
  );
}

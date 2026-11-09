import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Deposit from "@/models/Deposit";
import Setting from "@/models/Setting";
import { sendDepositPendingEmail } from "@/lib/mail";
import { getPaymentMethods } from "@/lib/paymentMethods";

export async function GET() {
  try {
    await dbConnect();

    // Fetch all payment settings
    const settings = await Setting.find({ key: { $regex: /^payment_/ } });
    const paymentMethods = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      paymentMethods,
      methods: getPaymentMethods(settings),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const currency = (session.user as any).currency || "USD";
    const { amount, method, receiptUrl } = await req.json();

    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Enter a valid amount" },
        { status: 400 },
      );
    }
    if (
      typeof method !== "string" ||
      !/^[A-Z0-9]+(?:_[A-Z0-9]+)*$/.test(method)
    ) {
      return NextResponse.json(
        { error: "Select a payment method" },
        { status: 400 },
      );
    }

    await dbConnect();

    const paymentSetting = await Setting.findOne({
      key: `payment_${method.toLowerCase()}`,
    });
    if (!paymentSetting || !getPaymentMethods([paymentSetting]).length) {
      return NextResponse.json(
        {
          error:
            "This payment method is unavailable. Please select another method.",
        },
        { status: 400 },
      );
    }

    const deposit = await Deposit.create({
      userId,
      amountLocal: amount,
      currency,
      method,
      receiptUrl: receiptUrl || null,
      status: "PENDING",
    });

    // Send Email
    if (session.user?.email) {
      await sendDepositPendingEmail(session.user.email, amount, method);
    }

    return NextResponse.json({ success: true, deposit });
  } catch (e: any) {
    console.error("Deposit Error:", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

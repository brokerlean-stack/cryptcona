import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { parseProfitAmount } from "@/lib/profitAmount";
import { recordedNetResult, goalView } from "@/lib/profitGoal";
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const body = await req.json().catch(()=>null);
  const target = body?.disable === true ? 0 : parseProfitAmount(body?.target);
  if (target === null || target > 1e12) return NextResponse.json({error:"Enter a positive goal with at most two decimal places."},{status:400});
  try {
    await dbConnect();
    const user = await User.findById(session.user.id);
    if (!user || user.status === "suspended") return NextResponse.json({error:"Account unavailable."},{status:403});
    const net = await recordedNetResult(session.user.id);
    const goal = goalView(user.profitGoal || 0,user.profitGoalBaseline || 0,net);
    if (target > 0 && goal.target > 0 && !goal.reached)
      return NextResponse.json({error:"Reach your current goal or turn it off before setting a new one. Withdrawals are unaffected."},{status:409});
    const expected = goal.target > 0 ? {profitGoal:goal.target} : {$or:[{profitGoal:0},{profitGoal:{$exists:false}}]};
    const updated = await User.findOneAndUpdate({_id:user._id,...expected},{$set:{profitGoal:target,profitGoalBaseline:net}},{new:true});
    if (!updated) return NextResponse.json({error:"Your goal changed. Refresh and try again."},{status:409});
    return NextResponse.json({goal:goalView(target,net,net)});
  } catch { return NextResponse.json({error:"Unable to update your goal."},{status:500}); }
}

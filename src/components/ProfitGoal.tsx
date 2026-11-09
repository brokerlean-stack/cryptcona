"use client";
import { useState } from "react";
import Link from "next/link";
export type Goal = { target: number; progress: number; percent: number; reached: boolean };
export default function ProfitGoal({goal,currency,onChange}:{goal:Goal;currency:string;onChange:()=>Promise<void>}) {
  const [target,setTarget]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
  async function update(disable:boolean) {
    if(busy)return; setBusy(true);setError("");
    try {
      const res=await fetch('/api/user/profit-goal',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(disable?{disable:true}:{target})});
      const data=await res.json();if(!res.ok)throw new Error(data.error);
      setTarget("");await onChange();
    }catch(e){setError(e instanceof Error?e.message:'Unable to update goal.');}finally{setBusy(false);}
  }
  return <section className="border-y border-white/15 py-6 my-6 space-y-4" aria-label="Profit goal tracker">
    <h2 className="text-lg font-medium">Your profit goal</h2>
    {goal.target>0 ? <>
      <p>{currency} {goal.progress.toLocaleString()} of {currency} {goal.target.toLocaleString()} — {goal.reached?'Goal reached':`${goal.percent.toFixed(1)}%`}</p>
      <progress aria-label="Profit goal progress" value={goal.percent} max={100} className="w-full accent-emerald-400" />
      <button disabled={busy} onClick={()=>update(true)} className="cc-button secondary">Turn off goal</button>
    </> : <p className="text-zinc-400">No active goal.</p>}
    {(!goal.target || goal.reached) && <form onSubmit={e=>{e.preventDefault();void update(false);}} className="flex flex-wrap gap-3">
      <label className="flex flex-col gap-2 min-w-0">New goal ({currency})<input aria-label="New profit goal" type="number" min="0.01" max="1000000000000" step="0.01" required value={target} onChange={e=>setTarget(e.target.value)} className="copy-input" /></label>
      <button disabled={busy} className="cc-button self-end">Set goal</button>
    </form>}
    <p className="text-xs leading-6 text-zinc-400">Progress includes recorded net results and manually added profit credits; it does not guarantee returns or restrict withdrawals. You can turn off your goal at any time.</p>
    <Link href="/dashboard/chat?topic=profit-goal" className="text-sm text-brand-mint underline">Ask support about changing or disabling a goal</Link>
    {error&&<p role="alert" className="cc-error">{error}</p>}
  </section>;
}

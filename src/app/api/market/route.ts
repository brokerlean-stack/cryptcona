import { NextResponse } from "next/server";
import { getChart, getMarket, getConversion, peekMarket, MARKET_PAIRS } from "@/lib/marketData";
import { SIMULATION_RATES } from '@/lib/simulationCurrency';
export async function GET(req: Request) {
  const currency = new URL(req.url).searchParams.get('currency');
  if (currency) {
    if (!Object.hasOwn(SIMULATION_RATES, currency)) return NextResponse.json({error:'Unsupported account currency'}, {status:400});
    try {
      const market = currency === 'BTC' ? await getMarket() : peekMarket();
      return NextResponse.json({ conversion: await getConversion(currency, market) }, {headers:{'Cache-Control':'no-store'}});
    } catch { return NextResponse.json({error:'Account currency conversion is unavailable. New orders are paused.'},{status:503}); }
  }
  if (new URL(req.url).searchParams.has('quotes')) {
    const data = await getMarket();
    return NextResponse.json(data, { status: data.stale ? 503 : 200, headers: { 'Cache-Control': 'no-store' } });
  }
  const asset = new URL(req.url).searchParams.get("asset") || "BTC";
  if (!MARKET_PAIRS[asset])
    return NextResponse.json({ error: "Unknown instrument" }, { status: 400 });
  try {
    return NextResponse.json(
      { points: await getChart(asset), source: "Kraken", interval: "1 minute" },
      { headers: { "Cache-Control": "public, max-age=30" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Chart history unavailable", points: [] },
      { status: 503 },
    );
  }
}

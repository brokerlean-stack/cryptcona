import { getAnchoredMarket } from "@/lib/anchoredMarket";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  if (new URL(req.url).searchParams.has("once")) {
    try {
      return Response.json(await getAnchoredMarket(), {
        headers: { "Cache-Control": "no-store" },
      });
    } catch {
      return Response.json(
        { error: "Price feed is warming up. Please retry." },
        { status: 503 },
      );
    }
  }
  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setTimeout> | undefined,
    stopped = false;
  const body = new ReadableStream({
    start(controller) {
      let first = true;
      const stop = () => {
        stopped = true;
        clearTimeout(timer);
        try {
          controller.close();
        } catch {}
      };
      req.signal.addEventListener("abort", stop, { once: true });
      async function send() {
        if (stopped) return;
        try {
          const value = await getAnchoredMarket();
          if (stopped) return;
          controller.enqueue(
            encoder.encode(
              "data: " +
                JSON.stringify({
                  ...value,
                  series: first ? value.series : undefined,
                }) +
                "\n\n",
            ),
          );
          first = false;
        } catch {
          if (!stopped)
            controller.enqueue(
              encoder.encode(
                'data: {"error":"Price feed is temporarily unavailable","stale":true}\n\n',
              ),
            );
        }
        if (!stopped)
          timer = setTimeout(send, Math.max(20, 500 - (Date.now() % 500)));
      }
      void send();
    },
    cancel() {
      stopped = true;
      clearTimeout(timer);
    },
  });
  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

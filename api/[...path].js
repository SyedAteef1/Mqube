// Vercel Function: forwards every /api/* request from the hosted frontend to the
// MQube backend on the shop server (reached through Tailscale Funnel or Cloudflare
// Tunnel — the "online access" step of deploy/local/install-linux.sh).
//
// In the Vercel project settings set:
//   API_ORIGIN = the address printed by the installer (also saved in deploy/ONLINE_ADDRESS.txt),
//                e.g. https://mqube-server.xyz.ts.net  or  https://api.yourshop.in
// The browser only ever talks to the frontend's own address, so no CORS is needed.
async function handler(request) {
  if (!process.env.API_ORIGIN) {
    return new Response(
      JSON.stringify({ detail: "This MQube site is not connected to the shop server yet. Set API_ORIGIN to the shop server address." }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
  const incoming = new URL(request.url);
  const target = new URL(incoming.pathname + incoming.search, process.env.API_ORIGIN);
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.set("x-forwarded-host", incoming.host);
  headers.set("x-forwarded-proto", "https");
  const init = { method: request.method, headers, redirect: "manual" };
  if (!["GET", "HEAD"].includes(request.method)) init.body = await request.arrayBuffer();
  try {
    return await fetch(target, init);
  } catch (err) {
    return new Response(
      JSON.stringify({ detail: "The shop server is not reachable. Check its internet and the tunnel." }),
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }
}

// Vercel calls the exported function named after the HTTP method with a Web Request.
export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE, handler as OPTIONS, handler as HEAD };

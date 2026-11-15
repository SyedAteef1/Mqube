// Cloudflare Pages Function: forwards every /api/* request from the hosted frontend
// to the MQube backend on the shop server (reached through Cloudflare Tunnel).
// Set API_ORIGIN in the Pages project settings, e.g. https://api.yourshop.in
// The browser only ever talks to the frontend's own address, so no CORS is needed.
export async function onRequest({ request, env }) {
  if (!env.API_ORIGIN) {
    return new Response(JSON.stringify({ detail: "This MQube site is not connected to the shop server yet. Set API_ORIGIN to the shop server address." }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
  const incoming = new URL(request.url);
  const target = new URL(incoming.pathname + incoming.search, env.API_ORIGIN);
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.set("x-forwarded-host", incoming.host);
  headers.set("x-forwarded-proto", "https");
  const init = { method: request.method, headers, redirect: "manual" };
  if (!["GET", "HEAD"].includes(request.method)) init.body = request.body;
  try {
    return await fetch(target, init);
  } catch (err) {
    return new Response(JSON.stringify({ detail: "The shop server is not reachable. Check its internet and the tunnel." }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}

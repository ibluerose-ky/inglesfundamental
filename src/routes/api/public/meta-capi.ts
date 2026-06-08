import { createFileRoute } from "@tanstack/react-router";

const PIXEL_ID = "1824487508563258";
const GRAPH_VERSION = "v19.0";

type CapiEvent = {
  event_name: string;
  event_id?: string;
  event_source_url?: string;
  fbp?: string;
  fbc?: string;
  custom_data?: Record<string, unknown>;
};

const ALLOWED_EVENTS = new Set([
  "PageView",
  "InitiateCheckout",
  "Purchase",
  "AddPaymentInfo",
]);

export const Route = createFileRoute("/api/public/meta-capi")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }),
      POST: async ({ request }) => {
        const token = process.env.META_CAPI_ACCESS_TOKEN;
        if (!token) {
          return new Response(
            JSON.stringify({ error: "META_CAPI_ACCESS_TOKEN not configured" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        let body: CapiEvent;
        try {
          body = (await request.json()) as CapiEvent;
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (!body?.event_name || !ALLOWED_EVENTS.has(body.event_name)) {
          return new Response(JSON.stringify({ error: "Invalid event_name" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const ua = request.headers.get("user-agent") || undefined;
        const ip =
          request.headers.get("cf-connecting-ip") ||
          request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
          undefined;

        const userData: Record<string, unknown> = {};
        if (ua) userData.client_user_agent = ua;
        if (ip) userData.client_ip_address = ip;
        if (body.fbp) userData.fbp = body.fbp;
        if (body.fbc) userData.fbc = body.fbc;

        const payload = {
          data: [
            {
              event_name: body.event_name,
              event_time: Math.floor(Date.now() / 1000),
              event_id: body.event_id,
              action_source: "website",
              event_source_url: body.event_source_url,
              user_data: userData,
              custom_data: body.custom_data || {},
            },
          ],
        };

        const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`;

        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const text = await res.text();
          return new Response(text, {
            status: res.status,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          });
        } catch (err) {
          return new Response(
            JSON.stringify({ error: "CAPI request failed", detail: String(err) }),
            {
              status: 502,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            },
          );
        }
      },
    },
  },
});

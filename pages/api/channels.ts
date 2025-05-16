// pages/api/channels.ts
import type { NextApiRequest, NextApiResponse } from "next";
import https from "https";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // 1) Handle CORS preflight
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // 2) Only GET is allowed
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET,OPTIONS");
    return res.status(405).end();
  }

  try {
    // 3) Use HTTPS endpoint (the server may reject plain HTTP from Vercel)
    //    and attach an agent to skip TLS errors if needed
    const upstream = await fetch("https://tv.roarzone.info/app.php?per=true", {
      headers: { Accept: "application/json" },
      // If you get TLS issues (self-signed cert), uncomment:
      // agent: new https.Agent({ rejectUnauthorized: false }),
    });

    console.log("Upstream status:", upstream.status);
    const text = await upstream.text();
    console.log("Upstream body:", text);

    if (!upstream.ok) {
      // Propagate upstream status + body for easier debugging
      return res
        .status(upstream.status)
        .json({ error: `Upstream ${upstream.status}`, body: text });
    }

    // 4) Parse JSON and return
    const data = JSON.parse(text);
    return res.status(200).json(data);
  } catch (err: any) {
    console.error("API Error fetching channels:", err);
    // 5) Return a 502 Bad Gateway instead of 503
    return res.status(502).json({ error: "Bad Gateway", details: err.message });
  }
}

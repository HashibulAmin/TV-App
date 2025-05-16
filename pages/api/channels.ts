// pages/api/channels.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // CORS preflight
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET,OPTIONS");
    return res.status(405).end();
  }

  try {
    // ← switched to HTTP here
    const upstream = await fetch("http://tv.roarzone.info/app.php?per=true", {
      headers: { Accept: "application/json" },
    });

    console.log("Upstream status:", upstream.status);
    const text = await upstream.text();
    console.log("Upstream body length:", text.length);

    if (!upstream.ok) {
      return res
        .status(upstream.status)
        .json({ error: `Upstream ${upstream.status}`, body: text });
    }

    const data = JSON.parse(text);
    return res.status(200).json(data);
  } catch (err: any) {
    console.error("API Error fetching channels:", err);
    return res.status(502).json({ error: "Bad Gateway", details: err.message });
  }
}

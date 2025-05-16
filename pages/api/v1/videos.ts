// pages/api/v1/videos.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET,OPTIONS");
    return res.status(405).end();
  }

  try {
    // Try HTTPS first, fallback to HTTP
    let upstream = await fetch(
      "http://tv.roarzone.info/app.php?per=true",
      { headers: { Accept: "application/json" } }
    ).catch(() =>
      fetch("http://tv.roarzone.info/app.php?per=true", {
        headers: { Accept: "application/json" },
      })
    );

    if (!upstream.ok) {
      const body = await upstream.text();
      return res
        .status(upstream.status)
        .json({ error: `Upstream ${upstream.status}`, body });
    }

    const data = await upstream.json();
    return res.status(200).json(data);
  } catch (err: any) {
    console.error("[api/v1/videos] Error:", err);
    return res.status(502).json({ error: "Bad Gateway", details: err.message });
  }
}

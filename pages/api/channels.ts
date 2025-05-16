
import type { NextApiRequest, NextApiResponse } from "next";
import https from "https";

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
    const agent = new https.Agent({
      rejectUnauthorized: false,
      timeout: 15000, // Increased timeout
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const upstream = await fetch("https://tv.roarzone.info/app.php?per=true", {
      headers: { 
        Accept: "application/json",
        'User-Agent': 'Mozilla/5.0',
        'Cache-Control': 'no-cache'
      },
      agent,
      signal: controller.signal,
      timeout: 5000 // Reduce timeout to fail faster
    }).finally(() => clearTimeout(timeoutId));

    if (!upstream.ok) {
      return res
        .status(upstream.status)
        .json({ error: `Upstream ${upstream.status}` });
    }

    const text = await upstream.text();
    const data = JSON.parse(text);
    return res.status(200).json(data);
  } catch (err: any) {
    console.error("API Error fetching channels:", err);
    const status = err.name === 'AbortError' ? 504 : 502;
    return res.status(status).json({ 
      error: status === 504 ? "Gateway Timeout" : "Bad Gateway",
      details: err.message 
    });
  }
}

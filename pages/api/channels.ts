
import type { NextApiRequest, NextApiResponse } from "next";
import https from "https";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET,OPTIONS");
    return res.status(405).end();
  }

  try {
    const agent = new https.Agent({
      rejectUnauthorized: false,
      timeout: 5000,
    });

    const response = await fetch("https://tv.roarzone.info/app.php?per=true", {
      headers: { Accept: "application/json" },
      agent,
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Upstream error ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err: any) {
    console.error("API Error:", err);
    return res.status(503).json({ 
      error: "Service temporarily unavailable",
      details: err.message 
    });
  }
}


import type { NextApiRequest, NextApiResponse } from "next";
import https from "https";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ path: string } | { error: string }>,
) {
  const { ch_id } = req.query;

  if (req.method !== "GET" || typeof ch_id !== "string") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const agent = new https.Agent({
      rejectUnauthorized: false,
      timeout: 5000,
    });

    const upstream = await fetch(`https://tv.roarzone.info/${ch_id}`, {
      method: "POST",
      headers: {
        Authorization: "Basic YWRtaW46YWRtaW4xMjM=",
      },
      agent,
      signal: AbortSignal.timeout(5000),
    });

    if (!upstream.ok) {
      throw new Error(`Upstream returned ${upstream.status}`);
    }

    let text = await upstream.text();
    text = text.trim().replace(/^\//, "");
    const full = `https://peer19.roarzone.info:8080/${text}`;

    return res.status(200).json({ path: full });
  } catch (err: any) {
    console.error("Token API error:", err);
    return res.status(503).json({ error: "Service temporarily unavailable" });
  }
}

import type { NextApiRequest, NextApiResponse } from "next";

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
    // POST to the original PHP endpoint to get the time-limited token path
    const upstream = await fetch(`http://tv.roarzone.info/${ch_id}`, {
      method: "POST",
      headers: {
        // Base64 of "admin:admin123"
        Authorization: "Basic YWRtaW46YWRtaW4xMjM=",
      },
    });

    if (!upstream.ok) {
      throw new Error(`Upstream returned ${upstream.status}`);
    }

    let text = await upstream.text();
    // upstream responds like: "/roarzone/bk/102/index.m3u8?token=XYZ"
    text = text.trim().replace(/^\//, "");

    // Build full HLS URL on the actual stream host
    const full = `http://peer19.roarzone.info:8080/${text}`;

    return res.status(200).json({ path: full });
  } catch (err: any) {
    console.error("Token API error:", err);
    return res.status(500).json({ error: err.message });
  }
}

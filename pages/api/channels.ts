import type { NextApiRequest, NextApiResponse } from "next";
import https from "https"; // only if you need to disable TLS checks
// import fetch from 'node-fetch'       // uncomment if polyfilling

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow GET
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET,OPTIONS");
    return res.status(405).end();
  }

  try {
    // Try https first — many hosts block plain http in cloud environments
    const response = await fetch("https://tv.roarzone.info/app.php?per=true", {
      headers: { Accept: "application/json" },
      // agent: new https.Agent({ rejectUnauthorized: false }),
    });

    console.log("Upstream status:", response.status);
    const text = await response.text();
    console.log("Upstream body:", text);

    if (!response.ok) {
      throw new Error(`Upstream error ${response.status}`);
    }

    // If the upstream sometimes returns non-JSON, you'll see it in the logs
    const data = JSON.parse(text);
    return res.status(200).json(data);
  } catch (err: any) {
    console.error("API Error:", err);
    return res
      .status(500)
      .json({ error: "Failed to fetch channels", details: err.message });
  }
}

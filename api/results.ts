import axios from "axios";
import { generateDeterministicPrediction } from "./lib/predictionEngine";

const globalApiConfig = {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOiIxNzc3NzczMTYyOSIsIm5iZiI6IjE3Nzc3MzExNzkyIiwiZXhwIjoiMTc3NzczMzQyOSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi1pZGVudGl0eS1jbGFpbXMvZXhwaXJhdGlvbiI6IjUvMi8yMDI2IDk6MjA6MjkgUE0iLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBY2Nlc3NfVG9rZW4iLCJVc2VySWQiOiI0ODcyMDMiLCJVc2VyTmFtZSI6Ijk1OTc3NzU0NTU4OSIsIlVzZXJQaG90byI6IjIwIiwiTmlja05hbWUiOiJNR1RIQU5UICIsIkFtb3VudCI6IjEzLjg3IiwiSW50ZWdyYWwiOiIwIiwiTG9naW5NYXJrIjoiaDUiLCJMb2dpblRpbWUiOiI1LzIvMjAyNiA4OjUwOjI5IFBNIiwiTG9naW5JUEFkZHJlc3MiOiI1Ni42OS4zMi42NiIsIkRiTnVtYmVyIjoiMCIsIklzdmFsaWRhdG9yIjoiMCIsIktleUNvZGUiOiI1OTUiLCJUb2tlblR5cGUiOiJBY2Nlc3NfVG9rZW4iLCJQaG9uZVR5cGUiOiIxIiwiVXNlclR5cGUiOiIwIiwiVXNlck5hbWUyIjoiIiwiaXNzIjoiand0SXNzdWVyIiwiYXVkIjoibG90dGVyeVRpY2tldCJ9.Bdkvu8LVelMKnsknZBG0klaf67q75pzYvVEJR0miR5A",
  signature: "02B709728F301B2AD39740BED6BDA1CD",
  timestamp: "1777885318",
  random: "5074950b0f484b108bd9a8067e7f1025"
};

export default async function handler(req: any, res: any) {
  // CORS Setup for Vercel
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ code: 405, msg: "Method Not Allowed" });
  }

  try {
    const incomingConfig = req.body || {};
    
    // Config priority: Env Vars > Manual Config > defaults
    const config = {
      token: process.env.API_TOKEN || incomingConfig.token || globalApiConfig.token,
      signature: process.env.API_SIGNATURE || incomingConfig.signature || globalApiConfig.signature,
      timestamp: process.env.API_TIMESTAMP || incomingConfig.timestamp || globalApiConfig.timestamp,
      random: process.env.API_RANDOM || incomingConfig.random || globalApiConfig.random
    };

    const payload = {
      pageSize: incomingConfig.pageSize || 10,
      pageNo: incomingConfig.pageNo || 1,
      typeId: incomingConfig.typeId || 30,
      language: 0,
      random: config.random,
      signature: config.signature,
      timestamp: parseInt(config.timestamp.toString())
    };

    const token = config.token;
    const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

    if (!authHeader || authHeader.length < 50) {
      console.warn("[Vercel-Proxy] Warning: Token seems suspiciously short or missing.");
    }

    console.log(`[Vercel-Proxy] Forwarding request for TypeId ${payload.typeId} with timestamp ${payload.timestamp}`);

    const response = await axios.post("https://ckygjf6r.com/api/webapi/GetNoaverageEmerdList", payload, {
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "Accept": "application/json, text/plain, */*",
        "Authorization": authHeader,
        "Ar-Origin": "https://www.cklottery.top",
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Referer": "https://www.cklottery.top/",
        "Origin": "https://www.cklottery.top",
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site"
      },
      timeout: 12000
    });

    const data = response.data;
    console.log(`[Vercel-Proxy] Upstream Response Code: ${data?.code}`);

    // Inject Prediction
    if (data?.code === 0 && data?.data?.list?.length > 0) {
      try {
        const results = data.data.list;
        const prediction = generateDeterministicPrediction(results);
        
        // Use a more robust issue number increment
        const currentIssue = results[0].issueNumber;
        let nextIssue = "";
        try {
          nextIssue = (BigInt(currentIssue) + BigInt(1)).toString();
        } catch {
          nextIssue = (parseInt(currentIssue) + 1).toString();
        }
        
        data.prediction = {
          ...prediction,
          issueNumber: nextIssue,
          serverTimestamp: Date.now(),
          engine: "AMD-REVERSION-V10"
        };
      } catch (predErr: any) {
        console.error("[Vercel-Proxy] Prediction Logic Error:", predErr.message);
      }
    }

    return res.status(200).json(data);

  } catch (error: any) {
    const status = error.response?.status || 500;
    const errorData = error.response?.data;
    
    console.error(`[Vercel-Proxy] Error (${status}):`, error.message);
    
    return res.status(status).json({ 
      code: status, 
      msg: "SERVER_PROTOCOL_SYNC_ERROR",
      error: error.message,
      upstream: errorData || null,
      detail: "The connection to the upstream lottery server failed. This usually indicates an expired Token or blocked IP."
    });
  }
}

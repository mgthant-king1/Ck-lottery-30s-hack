import axios from "axios";
import { generateDeterministicPrediction } from "../src/services/predictionEngine";

const globalApiConfig = {
  token: process.env.API_TOKEN || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOiIxNzc3NzczMTYyOSIsIm5iZiI6IjE3Nzc3MzExNzkyIiwiZXhwIjoiMTc3NzczMzQyOSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi1pZGVudGl0eS1jbGFpbXMvZXhwaXJhdGlvbiI6IjUvMi8yMDI2IDk6MjA6MjkgUE0iLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBY2Nlc3NfVG9rZW4iLCJVc2VySWQiOiI0ODcyMDMiLCJVc2VyTmFtZSI6Ijk1OTc3NzU0NTU4OSIsIlVzZXJQaG90byI6IjIwIiwiTmlja05hbWUiOiJNR1RIQU5UICIsIkFtb3VudCI6IjEzLjg3IiwiSW50ZWdyYWwiOiIwIiwiTG9naW5NYXJrIjoiaDUiLCJMb2dpblRpbWUiOiI1LzIvMjAyNiA4OjUwOjI5IFBNIiwiTG9naW5JUEFkZHJlc3MiOiI1Ni42OS4zMi42NiIsIkRiTnVtYmVyIjoiMCIsIklzdmFsaWRhdG9yIjoiMCIsIktleUNvZGUiOiI1OTUiLCJUb2tlblR5cGUiOiJBY2Nlc3NfVG9rZW4iLCJQaG9uZVR5cGUiOiIxIiwiVXNlclR5cGUiOiIwIiwiVXNlck5hbWUyIjoiIiwiaXNzIjoiand0SXNzdWVyIiwiYXVkIjoibG90dGVyeVRpY2tldCJ9.Bdkvu8LVelMKnsknZBG0klaf67q75pzYvVEJR0miR5A",
  signature: process.env.API_SIGNATURE || "02B709728F301B2AD39740BED6BDA1CD",
  timestamp: process.env.API_TIMESTAMP || "1777731689",
  random: process.env.API_RANDOM || "5074950b0f484b108bd9a8067e7f1025"
};

export default async function handler(req: any, res: any) {
  // Simple router logic for Vercel
  const path = req.url || "";
  
  if (path.includes("/api/lottery/results")) {
    if (req.method !== 'POST') {
      return res.status(405).json({ code: 405, msg: "Method Not Allowed" });
    }

    try {
      const incomingConfig = req.body || {};
      const config = { ...globalApiConfig, ...incomingConfig };

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

      const response = await axios.post("https://ckygjf6r.com/api/webapi/GetNoaverageEmerdList", payload, {
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "Accept": "application/json, text/plain, */*",
          "Authorization": authHeader,
          "Ar-Origin": "https://www.cklottery.top",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://www.cklottery.top/",
          "Connection": "keep-alive"
        },
        timeout: 10000
      });

      const data = response.data;

      // Inject Prediction
      if (data?.code === 0 && data?.data?.list?.length > 0) {
        try {
          const results = data.data.list;
          const prediction = generateDeterministicPrediction(results);
          const nextIssue = (BigInt(results[0].issueNumber) + BigInt(1)).toString();
          
          data.prediction = {
            ...prediction,
            issueNumber: nextIssue,
            serverTimestamp: Date.now()
          };
        } catch (err) {
          console.error("[Vercel-API] Prediction Logic Error:", err);
        }
      }

      return res.status(200).json(data);
    } catch (error: any) {
      console.error("[Vercel-API] Upstream Error:", error.message);
      return res.status(500).json({ code: 500, msg: "Upstream Proxy Error: " + error.message });
    }
  }

  // Fallback for unmatched API calls
  return res.status(404).json({ code: 404, msg: "API Endpoint Not Found: " + path });
}

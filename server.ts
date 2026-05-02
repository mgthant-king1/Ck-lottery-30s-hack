import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import axios from "axios";
import dotenv from "dotenv";
import { generateDeterministicPrediction } from "./src/services/predictionEngine";

dotenv.config();

// Default config from Env Vars or hardcoded fallback
const globalApiConfig = {
  token: process.env.API_TOKEN || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOiIxNzc3NzczMTYyOSIsIm5iZiI6IjE3Nzc3MzExNzkyIiwiZXhwIjoiMTc3NzczMzQyOSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi1pZGVudGl0eS1jbGFpbXMvZXhwaXJhdGlvbiI6IjUvMi8yMDI2IDk6MjA6MjkgUE0iLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBY2Nlc3NfVG9rZW4iLCJVc2VySWQiOiI0ODcyMDMiLCJVc2VyTmFtZSI6Ijk1OTc3NzU0NTU4OSIsIlVzZXJQaG90byI6IjIwIiwiTmlja05hbWUiOiJNR1RIQU5UICIsIkFtb3VudCI6IjEzLjg3IiwiSW50ZWdyYWwiOiIwIiwiTG9naW5NYXJrIjoiaDUiLCJMb2dpblRpbWUiOiI1LzIvMjAyNiA4OjUwOjI5IFBNIiwiTG9naW5JUEFkZHJlc3MiOiI1Ni42OS4zMi42NiIsIkRiTnVtYmVyIjoiMCIsIklzdmFsaWRhdG9yIjoiMCIsIktleUNvZGUiOiI1OTUiLCJUb2tlblR5cGUiOiJBY2Nlc3NfVG9rZW4iLCJQaG9uZVR5cGUiOiIxIiwiVXNlclR5cGUiOiIwIiwiVXNlck5hbWUyIjoiIiwiaXNzIjoiand0SXNzdWVyIiwiYXVkIjoibG90dGVyeVRpY2tldCJ9.Bdkvu8LVelMKnsknZBG0klaf67q75pzYvVEJR0miR5A",
  signature: process.env.API_SIGNATURE || "02B709728F301B2AD39740BED6BDA1CD",
  timestamp: process.env.API_TIMESTAMP || "1777731689",
  random: process.env.API_RANDOM || "5074950b0f484b108bd9a8067e7f1025"
};

async function fetchLotteryResults(incomingConfig: any = {}) {
  const config = { ...globalApiConfig, ...incomingConfig };
  try {
    const payload = {
      pageSize: incomingConfig.pageSize || 10,
      pageNo: incomingConfig.pageNo || 1,
      typeId: incomingConfig.typeId || 30,
      language: incomingConfig.language || 0,
      random: config.random,
      signature: config.signature,
      timestamp: parseInt(config.timestamp.toString())
    };

    const token = config.token;
    const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

    console.log(`[Proxy] Requesting Period List (TypeId: ${payload.typeId})`);

    const response = await axios.post("https://ckygjf6r.com/api/webapi/GetNoaverageEmerdList", payload, {
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "Accept": "application/json, text/plain, */*",
        "Authorization": authHeader,
        "Ar-Origin": "https://www.cklottery.top",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
        "Referer": "https://www.cklottery.top/",
        "X-Requested-With": "XMLHttpRequest",
        "Origin": "https://www.cklottery.top"
      },
      timeout: 12000
    });

    return response.data;
  } catch (error: any) {
    console.error("[Proxy] Upstream Error:", error.message);
    return { code: 500, msg: "Connection Refused by Upstream. Vercel IP might be blocked or Signature expired." };
  }
}

export async function createApp() {
  const app = express();
  app.use(express.json());

  // API Route with on-the-fly prediction
  app.post("/api/lottery/results", async (req, res) => {
    const data = await fetchLotteryResults(req.body);
    
    // If successful, inject prediction for the next period
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
        console.error("[Backend] Prediction Logic Error:", err);
      }
    }
    
    res.json(data);
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serving static files in production (non-serverless environment)
    const distPath = path.join(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
    }
    
    app.get("*", (req, res) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ code: 404, msg: "API path not found" });
      }
      
      const indexPath = path.join(process.cwd(), "dist", "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Build artifacts not found.");
      }
    });
  }

  return app;
}

// Start listener only in non-Vercel environment
if (!process.env.VERCEL) {
  const PORT = parseInt(process.env.PORT || "3000");
  createApp().then(app => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}

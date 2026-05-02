import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import { generateDeterministicPrediction } from "./src/services/predictionEngine";

dotenv.config();

let globalApiConfig = {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOiIxNzc3NzczMTYyOSIsIm5iZiI6IjE3Nzc3MzExNzkyIiwiZXhwIjoiMTc3NzczMzQyOSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi1pZGVudGl0eS1jbGFpbXMvZXhwaXJhdGlvbiI6IjUvMi8yMDI2IDk6MjA6MjkgUE0iLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBY2Nlc3NfVG9rZW4iLCJVc2VySWQiOiI0ODcyMDMiLCJVc2VyTmFtZSI6Ijk1OTc3NzU0NTU4OSIsIlVzZXJQaG90byI6IjIwIiwiTmlja05hbWUiOiJNR1RIQU5UICIsIkFtb3VudCI6IjEzLjg3IiwiSW50ZWdyYWwiOiIwIiwiTG9naW5NYXJrIjoiaDUiLCJMb2dpblRpbWUiOiI1LzIvMjAyNiA4OjUwOjI5IFBNIiwiTG9naW5JUEFkZHJlc3MiOiI1Ni42OS4zMi42NiIsIkRiTnVtYmVyIjoiMCIsIklzdmFsaWRhdG9yIjoiMCIsIktleUNvZGUiOiI1OTUiLCJUb2tlblR5cGUiOiJBY2Nlc3NfVG9rZW4iLCJQaG9uZVR5cGUiOiIxIiwiVXNlclR5cGUiOiIwIiwiVXNlck5hbWUyIjoiIiwiaXNzIjoiand0SXNzdWVyIiwiYXVkIjoibG90dGVyeVRpY2tldCJ9.Bdkvu8LVelMKnsknZBG0klaf67q75pzYvVEJR0miR5A",
  signature: "02B709728F301B2AD39740BED6BDA1CD",
  timestamp: "1777731689",
  random: "5074950b0f484b108bd9a8067e7f1025"
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

    console.log("Requesting Upstream with Payload:", JSON.stringify(payload));

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

    if (response.data?.code === 0 && response.data?.data?.list) {
      if (incomingConfig.token) globalApiConfig.token = incomingConfig.token;
      if (incomingConfig.signature) globalApiConfig.signature = incomingConfig.signature;
      if (incomingConfig.random) globalApiConfig.random = incomingConfig.random;
      if (incomingConfig.timestamp) globalApiConfig.timestamp = incomingConfig.timestamp.toString();
    }
    
    return response.data;
  } catch (error: any) {
    console.error("Upstream Error:", error.message);
    return { code: 500, msg: "Upstream Protocol Error: " + error.message };
  }
}

let lastReportedIssue = "";

async function predictionCycle() {
  console.log("Prediction Cycle Running...");
  const response = await fetchLotteryResults();
  
  if (response?.code !== 0) {
    console.error(`API Error: ${response?.msg || 'Unknown Error'}`);
  } else {
    const results = response?.data?.list || [];
    
    if (results.length > 0) {
      const latestResult = results[0];
      const nextIssue = (BigInt(latestResult.issueNumber) + BigInt(1)).toString();

      if (nextIssue !== lastReportedIssue) {
        console.log(`New Issue Detected: ${nextIssue}. Updating Prediction...`);
        
        try {
          const prediction = generateDeterministicPrediction(results);
          if (prediction) {
            console.log(`Prediction for ${nextIssue}: ${prediction.size} ${prediction.number}`);
            lastReportedIssue = nextIssue;
          }
        } catch (predError: any) {
          console.error("Prediction Logic Error:", predError.message);
        }
      }
    }
  }

  // Sync with clock (every 30s)
  const now = Date.now();
  const nextSync = Math.ceil(now / 30000) * 30000;
  const delay = (nextSync - now) + 1500; // 1.5s buffer for API update
  setTimeout(predictionCycle, delay);
}

// Removed generateAIPrediction as it's replaced by deterministic engine

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Proxy endpoint for CK Lottery API
  app.post("/api/lottery/results", async (req, res) => {
    const response = await fetchLotteryResults(req.body);
    res.json(response);
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    predictionCycle(); // Start the 24/7 background cycle
  });
}

startServer();

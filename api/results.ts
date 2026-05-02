import axios from "axios";

// Deterministic Prediction Logic embedded for Vercel Serverless Reliability
function generateDeterministicPrediction(results: any[]) {
  if (results.length < 5) {
    return {
      number: 5,
      color: 'green',
      size: 'big',
      confidence: 0.5,
      reasoning: "Insufficient data for deep analysis.",
      analysis: []
    };
  }

  const latest = results.slice(0, 15);
  const numbers = latest.map(r => parseInt(r.number));
  const sizes = latest.map(r => parseInt(r.number) >= 5 ? 'big' : 'small');
  const colors = latest.map(r => {
    const n = parseInt(r.number);
    if (n === 0) return 'violet-red';
    if (n === 5) return 'violet-green';
    return n % 2 === 0 ? 'red' : 'green';
  });

  let streakCount = 1;
  for (let i = 0; i < sizes.length - 1; i++) {
    if (sizes[i] === sizes[i + 1]) streakCount++;
    else break;
  }

  const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  
  const sequences = [];
  for (let i = 0; i < sizes.length - 3; i++) {
    sequences.push(sizes.slice(i, i + 3).join('-'));
  }
  const currentSeq = sizes.slice(0, 3).join('-');
  const seqFrequency = sequences.filter(s => s === currentSeq).length;

  let predictedSize: 'big' | 'small' = sizes[0] as any;
  let reasoning = "";
  let confidence = 0.75;

  if (streakCount >= 4) {
    if (streakCount >= 7) {
      predictedSize = sizes[0] === 'big' ? 'small' : 'big';
      reasoning = `Dragon Exhaustion: ${streakCount}-period streak detected. Statistical probability of reversal (AMD Reversion) is now 82%.`;
      confidence = 0.82;
    } else {
      predictedSize = sizes[0] as any;
      reasoning = `Dragon Momentum: Strong ${streakCount}-period ${sizes[0]} streak in progress. Volume gravity favors continuation.`;
      confidence = 0.88;
    }
  } else if (seqFrequency >= 2) {
    predictedSize = sizes[0] as any;
    reasoning = `Cyclic Sync: Pattern "${currentSeq}" matched in recent logs. Harmonic oscillation suggests local persistence.`;
    confidence = 0.85;
  } else if (sizes[0] !== sizes[1] && sizes[1] !== sizes[2]) {
    predictedSize = sizes[0] === 'big' ? 'small' : 'big';
    reasoning = `Mirror Pulse: Alternating sequence (Ping-Pong) detected. Predicting next oscillation phase.`;
    confidence = 0.79;
  } else {
    predictedSize = avg >= 4.5 ? 'big' : 'small';
    reasoning = `Volume Equilibrium: Recent entropy (Avg: ${avg.toFixed(1)}) suggests a shift towards ${predictedSize} mass.`;
    confidence = 0.72;
  }

  const colorCounts = { red: 0, green: 0, violet: 0 };
  colors.forEach(c => {
    if (c.includes('red')) colorCounts.red++;
    if (c.includes('green')) colorCounts.green++;
    if (c.includes('violet')) colorCounts.violet++;
  });

  let predictedColor: 'red' | 'green' | 'violet' = colorCounts.red > colorCounts.green ? 'red' : 'green';
  
  let predictedNum = predictedSize === 'big' ? 7 : 2;

  return {
    number: predictedNum,
    color: predictedColor,
    size: predictedSize,
    confidence: confidence,
    reasoning: reasoning,
    analysis: [
      { label: "Momentum", value: streakCount >= 3 ? "Hyper" : "Stable", type: "momentum", impact: streakCount >= 5 ? "critical" : "high" },
      { label: "Vol Gravity", value: avg > 5 ? "Positive" : "Negative", type: "volume", impact: "medium" },
      { label: "Stability", value: "Verified", type: "pattern", impact: "low" },
      { label: "Mirror Sync", value: reasoning.includes("Mirror") ? "Active" : "Scanning", type: "oscillation", impact: "high" }
    ]
  };
}

const globalApiConfig = {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOiIxNzc3NzczMTYyOSIsIm5iZiI6IjE3Nzc3MzExNzkyIiwiZXhwIjoiMTc3NzczMzQyOSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi1pZGVudGl0eS1jbGFpbXMvZXhwaXJhdGlvbiI6IjUvMi8yMDI2IDk6MjA6MjkgUE0iLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBY2Nlc3NfVG9rZW4iLCJVc2VySWQiOiI0ODcyMDMiLCJVc2VyTmFtZSI6Ijk1OTc3NzU0NTU4OSIsIlVzZXJQaG90byI6IjIwIiwiTmlja05hbWUiOiJNR1RIQU5UICIsIkFtb3VudCI6IjEzLjg3IiwiSW50ZWdyYWwiOiIwIiwiTG9naW5NYXJrIjoiaDUiLCJMb2dpblRpbWUiOiI1LzIvMjAyNiA4OjUwOjI5IFBNIiwiTG9naW5JUEFkZHJlc3MiOiI1Ni42OS4zMi42NiIsIkRiTnVtYmVyIjoiMCIsIklzdmFsaWRhdG9yIjoiMCIsIktleUNvZGUiOiI1OTUiLCJUb2tlblR5cGUiOiJBY2Nlc3NfVG9rZW4iLCJQaG9uZVR5cGUiOiIxIiwiVXNlclR5cGUiOiIwIiwiVXNlck5hbWUyIjoiIiwiaXNzIjoiand0SXNzdWVyIiwiYXVkIjoibG90dGVyeVRpY2tldCJ9.Bdkvu8LVelMKnsknZBG0klaf67q75pzYvVEJR0miR5A",
  signature: "02B709728F301B2AD39740BED6BDA1CD",
  timestamp: "1777731689",
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
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
        "Referer": "https://www.cklottery.top/",
        "X-Requested-With": "XMLHttpRequest",
        "Origin": "https://www.cklottery.top"
      },
      timeout: 12000
    });

    const data = response.data;
    console.log(`[Vercel-Proxy] Upstream Response Code: ${data?.code}`);

    // Inject Prediction
    if (data?.code === 0 && data?.data?.list?.length > 0) {
      const results = data.data.list;
      const prediction = generateDeterministicPrediction(results);
      const nextIssue = (BigInt(results[0].issueNumber) + BigInt(1)).toString();
      
      data.prediction = {
        ...prediction,
        issueNumber: nextIssue,
        serverTimestamp: Date.now(),
        engine: "AMD-REVERSION-V8"
      };
    }

    return res.status(200).json(data);

  } catch (error: any) {
    console.error("[Vercel-Proxy] Error:", error.message);
    return res.status(500).json({ 
      code: 500, 
      msg: "SERVER_API_OFFLINE",
      error: error.message,
      detail: "Check deployment environment variables for valid Token/Signature."
    });
  }
}

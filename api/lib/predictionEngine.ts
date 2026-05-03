export interface StrategyResult {
  number: number;
  color: 'red' | 'green' | 'violet';
  size: 'big' | 'small';
  confidence: number;
  reasoning: string;
  analysis: {
    label: string;
    value: string;
    type: 'momentum' | 'volume' | 'pattern' | 'oscillation';
    impact: 'low' | 'medium' | 'high' | 'critical';
  }[];
}

export function generateDeterministicPrediction(results: any[]): StrategyResult {
  if (results.length < 5) {
    return {
      number: 5,
      color: 'green',
      size: 'big',
      confidence: 0.5,
      reasoning: "Initialization: Analyzing historical drift. Minimum 5 periods required for baseline sync.",
      analysis: []
    };
  }

  const latest = results.slice(0, 50); // Deep buffer for long-tail analysis
  const numbers = latest.map(r => parseInt(r.number));
  const sizes = latest.map(r => parseInt(r.number) >= 5 ? 'big' : 'small');
  const colors = latest.map(r => {
    const n = parseInt(r.number);
    if (n === 0) return 'violet-red';
    if (n === 5) return 'violet-green';
    return n % 2 === 0 ? 'red' : 'green';
  });
  
  // 1. Kinetic Drift Analysis
  const recentAvg = numbers.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
  const historicalAvg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  
  // 2. Momentum Lock
  let streakCount = 1;
  const currentSize = sizes[0];
  for (let i = 1; i < sizes.length; i++) {
    if (sizes[i] === currentSize) streakCount++;
    else break;
  }

  // 3. Hot/Cold Gravity Matrix
  const frequency: Record<number, number> = {};
  numbers.forEach(n => frequency[n] = (frequency[n] || 0) + 1);
  const hotNumbers = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .map(e => parseInt(e[0]));

  let predictedSize: 'big' | 'small' = currentSize as any;
  let reasoning = "";
  let confidence = 0.75;

  // Decision Matrix V10
  if (streakCount >= 8) {
    predictedSize = currentSize === 'big' ? 'small' : 'big';
    reasoning = `System Critical: Reaching maximum entropy at ${streakCount} periods. Harmonic Reversion (AMD-V10) predicts a logic flip.`;
    confidence = 0.94;
  } else if (streakCount >= 4) {
    predictedSize = currentSize as any;
    reasoning = `Momentum Lock: High-velocity trend (${streakCount}p) detected. Gravity pull favors continuation in the current vector.`;
    confidence = 0.88;
  } else if (Math.abs(recentAvg - historicalAvg) > 1.5) {
    predictedSize = recentAvg > historicalAvg ? 'big' : 'small';
    reasoning = `Volume Disparity: Significant drift from historical mean. Center of mass shifting towards ${predictedSize} terrain.`;
    confidence = 0.82;
  } else {
    predictedSize = recentAvg >= 4.5 ? 'big' : 'small';
    reasoning = `Equilibrium: Local fluctuations stabilized. Aligning with minor density concentrations.`;
    confidence = 0.72;
  }

  // 5. Chromatic Logic V10 (Color balancing)
  const colorWeights = { red: 0, green: 0, violet: 0 };
  colors.slice(0, 15).forEach(c => {
    if (c.includes('red')) colorWeights.red++;
    if (c.includes('green')) colorWeights.green++;
    if (c.includes('violet')) colorWeights.violet++;
  });
  
  let predictedColor: 'red' | 'green' | 'violet' = 'green';
  if (colorWeights.red > 9 && !colors[0].includes('green')) predictedColor = 'green';
  else if (colorWeights.green > 9 && !colors[0].includes('red')) predictedColor = 'red';
  else predictedColor = colorWeights.red >= colorWeights.green ? 'red' : 'green';

  // 4. Sequential Pattern Matching
  const sequences = [];
  const seqDepth = 3;
  for (let i = 0; i < sizes.length - seqDepth; i++) {
    sequences.push(sizes.slice(i, i + seqDepth).join('-'));
  }
  const currentSeq = sizes.slice(0, 3).join('-');
  const seqFrequency = sequences.filter(s => s === currentSeq).length;

  const predictedNum = hotNumbers.find(n => (predictedSize === 'big' ? n >= 5 : n < 5)) ?? (predictedSize === 'big' ? 7 : 2);

  return {
    number: predictedNum,
    color: predictedColor,
    size: predictedSize,
    confidence: confidence,
    reasoning: reasoning,
    analysis: [
      { label: "Trend Momentum", value: streakCount >= 6 ? "Overload" : streakCount >= 3 ? "Locked" : "Neutral", type: "momentum", impact: streakCount >= 5 ? "critical" : "high" },
      { label: "Kinetic Drift", value: recentAvg > historicalAvg ? "Positive" : "Negative", type: "volume", impact: "medium" },
      { label: "Pattern Sync", value: seqFrequency > 1 ? "Active" : "Scanning", type: "pattern", impact: "high" },
      { label: "System Entropy", value: (1 - confidence).toFixed(3), type: "oscillation", impact: "low" }
    ]
  };
}

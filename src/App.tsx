import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, History, Zap, Activity, PieChart as PieChartIcon, 
  ShieldCheck, RefreshCw, Cpu, Layers, Flame, Binary, 
  Target, ChevronRight, Info, Settings, X, AlertTriangle,
  LineChart as LineChartIcon
} from 'lucide-react';
import { 
  BarChart, Bar, Cell, XAxis, ResponsiveContainer, Tooltip,
  LineChart, Line, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';
import { cn } from './lib/utils';
import type { LotteryResult, Prediction, AccuracyLog, ApiConfig } from './types/lottery';
import { generateDeterministicPrediction } from './services/predictionEngine';

const WINGO_TYPE_ID = 30;
const REFRESH_RATE = 30000;
const MMT_OFFSET = 6.5 * 60 * 60 * 1000; // Myanmar Time is UTC+6:30

export default function App() {
  const [results, setResults] = useState<LotteryResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiPrediction, setAiPrediction] = useState<Prediction | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [predictionHistory, setPredictionHistory] = useState<AccuracyLog[]>([]);
  const [activeTab, setActiveTab] = useState<'feed' | 'history' | 'analytics'>('feed');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [historySort, setHistorySort] = useState<'newest' | 'oldest' | 'confidence'>('newest');
  const [showConfig, setShowConfig] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [mmtTime, setMmtTime] = useState(new Date(Date.now() + MMT_OFFSET));
  const [quotaExhaustedUntil, setQuotaExhaustedUntil] = useState<number | null>(null);
  const [quotaTimeLeft, setQuotaTimeLeft] = useState(0);

  // Update Quota Countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (quotaExhaustedUntil) {
      const update = () => {
        const left = Math.max(0, Math.ceil((quotaExhaustedUntil - Date.now()) / 1000));
        setQuotaTimeLeft(left);
        if (left === 0) setQuotaExhaustedUntil(null);
      };
      update();
      timer = setInterval(update, 1000);
    }
    return () => clearInterval(timer);
  }, [quotaExhaustedUntil]);
  
  // Update MMT Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setMmtTime(new Date(Date.now() + MMT_OFFSET));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const nextDrawCountdown = useMemo(() => {
    const seconds = mmtTime.getUTCSeconds();
    // 30s cycle sync: sync at 0s and 30s of every minute
    return 30 - (seconds % 30);
  }, [mmtTime]);
  
  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOiIxNzc3NzczMTYyOSIsIm5iZiI6IjE3Nzc3MzExNzkyIiwiZXhwIjoiMTc3NzczMzQyOSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi1pZGVudGl0eS1jbGFpbXMvZXhwaXJhdGlvbiI6IjUvMi8yMDI2IDk6MjA6MjkgUE0iLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBY2Nlc3NfVG9rZW4iLCJVc2VySWQiOiI0ODcyMDMiLCJVc2VyTmFtZSI6Ijk1OTc3NzU0NTU4OSIsIlVzZXJQaG90byI6IjIwIiwiTmlja05hbWUiOiJNR1RIQU5UICIsIkFtb3VudCI6IjEzLjg3IiwiSW50ZWdyYWwiOiIwIiwiTG9naW5NYXJrIjoiaDUiLCJMb2dpblRpbWUiOiI1LzIvMjAyNiA4OjUwOjI5IFBNIiwiTG9naW5JUEFkZHJlc3MiOiI1Ni42OS4zMi42NiIsIkRiTnVtYmVyIjoiMCIsIklzdmFsaWRhdG9yIjoiMCIsIktleUNvZGUiOiI1OTUiLCJUb2tlblR5cGUiOiJBY2Nlc3NfVG9rZW4iLCJQaG9uZVR5cGUiOiIxIiwiVXNlclR5cGUiOiIwIiwiVXNlck5hbWUyIjoiIiwiaXNzIjoiand0SXNzdWVyIiwiYXVkIjoibG90dGVyeVRpY2tldCJ9.Bdkvu8LVelMKnsknZBG0klaf67q75pzYvVEJR0miR5A",
    signature: "02B709728F301B2AD39740BED6BDA1CD",
    timestamp: "1777731689",
    random: "5074950b0f484b108bd9a8067e7f1025"
  });

  const MOCK_RESULTS: LotteryResult[] = useMemo(() => [
    { issueNumber: "202605011001", number: "7", colour: "green", premium: "125430" },
    { issueNumber: "202605011000", number: "3", colour: "green", premium: "98420" },
    { issueNumber: "202605010999", number: "0", colour: "red,violet", premium: "214500" },
    { issueNumber: "202605010998", number: "9", colour: "green", premium: "154300" },
    { issueNumber: "202605010997", number: "2", colour: "red", premium: "87600" },
    { issueNumber: "202605010996", number: "5", colour: "green", premium: "132100" },
    { issueNumber: "202605010995", number: "8", colour: "red", premium: "95400" },
    { issueNumber: "202605010994", number: "4", colour: "red", premium: "112300" },
    { issueNumber: "202605010993", number: "1", colour: "green", premium: "76500" },
    { issueNumber: "202605010992", number: "6", colour: "red", premium: "108900" },
  ], []);

  const fetchResults = useCallback(async () => {
    if (demoMode) {
      setResults(MOCK_RESULTS);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/api/lottery/results', {
        pageSize: 10,
        pageNo: 1,
        typeId: WINGO_TYPE_ID,
        ...apiConfig
      });
      
      if (response.data?.code === 0) {
        const newList = response.data.data.list as LotteryResult[];
        
        // Track Accuracy based ONLY on BIG/SMALL as requested
        if (aiPrediction && newList.length > 0) {
          const matched = newList.find(r => r.issueNumber === aiPrediction.issueNumber);
          if (matched) {
            setPredictionHistory(prev => {
              if (prev.some(l => l.issueNumber === matched.issueNumber)) return prev;
              const actualSize = parseInt(matched.number) >= 5 ? 'big' : 'small';
              const predictedSize = (aiPrediction.size || '').toLowerCase();
              
              return [{
                issueNumber: matched.issueNumber,
                predictedNumber: aiPrediction.number ?? 'N/A',
                predictedColor: aiPrediction.color ?? 'N/A',
                predictedSize: aiPrediction.size ?? 'N/A',
                confidence: aiPrediction.confidence,
                actualNumber: matched.number,
                actualColor: matched.colour,
                // Win/Lose based ONLY on BIG/SMALL per user request
                isCorrect: predictedSize === actualSize,
                timestamp: new Date()
              }, ...prev].slice(0, 100);
            });
          }
        }

        const uniqueList = newList.filter((v, i, a) => a.findIndex(t => t.issueNumber === v.issueNumber) === i);
        setResults(uniqueList);
        setError(null);
      } else {
        const msg = response.data?.msg || 'API Stream Failure';
        setError(msg);
        if (results.length === 0) setResults(MOCK_RESULTS); // Fallback to see UI
      }
    } catch (err: any) {
      const details = err.response?.data?.details || err.message;
      setError(details);
      if (results.length === 0) setResults(MOCK_RESULTS); // Fallback to see UI
    } finally {
      setLoading(false);
    }
  }, [apiConfig, aiPrediction, predictionHistory, demoMode, MOCK_RESULTS, results.length]);

  // Precision Sync: Instead of fixed intervals, we calculate time until next period
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const syncWithClock = async () => {
      await fetchResults();
      
      // Calculate milliseconds until the next 30-second mark (00s or 30s)
      const now = Date.now();
      const nextSync = Math.ceil(now / 30000) * 30000;
      let delay = nextSync - now;
      
      // Add a small buffer (1.5s) to ensure the API has updated on their end
      delay += 1500;
      
      timeoutId = setTimeout(syncWithClock, delay);
    };

    syncWithClock();
    return () => clearTimeout(timeoutId);
  }, [fetchResults]);

  const generatePrediction = useCallback(async () => {
    if (results.length < 5 || isAiProcessing) return;

    const nextIssue = (BigInt(results[0].issueNumber) + BigInt(1)).toString();
    
    // Check if we already have a prediction for this issue
    if (aiPrediction?.issueNumber === nextIssue) return;

    setIsAiProcessing(true);
    try {
      // Use deterministic logic instead of AI to avoid 429 errors
      const data = generateDeterministicPrediction(results);

      setAiPrediction({
        issueNumber: nextIssue,
        number: data.number,
        color: data.color,
        size: data.size,
        confidence: data.confidence,
        reasoning: data.reasoning,
        analysis: data.analysis,
        timestamp: new Date()
      });
      setError(null);
    } catch (e: any) {
      console.error("Logic Engine Error:", e);
      setError("Prediction Engine Sync Error.");
    } finally {
      setIsAiProcessing(false);
    }
  }, [results, isAiProcessing, aiPrediction]);

  // Auto-sync neural sync on issue state changes
  useEffect(() => {
    if (results.length > 0) {
      const nextIssueNeeded = (BigInt(results[0].issueNumber) + BigInt(1)).toString();
      if (!aiPrediction || aiPrediction.issueNumber !== nextIssueNeeded) {
        generatePrediction();
      }
    }
  }, [results, aiPrediction, generatePrediction]);

  const filteredHistory = useMemo(() => {
    let filtered = [...predictionHistory];
    
    if (historyFilter === 'correct') filtered = filtered.filter(l => l.isCorrect);
    if (historyFilter === 'incorrect') filtered = filtered.filter(l => !l.isCorrect);
    
    return filtered.sort((a, b) => {
      if (historySort === 'oldest') return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      if (historySort === 'confidence') return b.confidence - a.confidence;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [predictionHistory, historyFilter, historySort]);

  const trendData = useMemo(() => {
    if (predictionHistory.length === 0) return [];
    // Calculate rolling win rate and confidence trend
    return [...predictionHistory].reverse().map((log, index, arr) => {
      const slice = arr.slice(0, index + 1);
      const winRateAtPoint = (slice.filter(l => l.isCorrect).length / slice.length) * 100;
      
      const matchingResult = results.find(r => r.issueNumber === log.issueNumber);
      const premiumVal = matchingResult ? parseFloat(matchingResult.premium) : 0;

      return {
        issue: log.issueNumber.slice(-3),
        winRate: parseFloat(winRateAtPoint.toFixed(1)),
        confidence: parseFloat((log.confidence * 100).toFixed(1)),
        isCorrect: log.isCorrect ? 100 : 0,
        premium: premiumVal,
        isWin: log.isCorrect
      };
    });
  }, [predictionHistory, results]);

  const stats = useMemo(() => {
    if (results.length === 0) return null;
    const dist = Array(10).fill(0).map((_, i) => ({ n: i.toString(), count: 0 }));
    results.forEach(r => dist[parseInt(r.number)].count++);
    const winRate = predictionHistory.length > 0 ? (predictionHistory.filter(l => l.isCorrect).length / predictionHistory.length) * 100 : 0;
    return { dist, winRate };
  }, [results, predictionHistory]);

  return (
    <div className="min-h-screen bg-[#080808] text-white p-4 lg:p-8 font-sans overflow-x-hidden selection:bg-emerald-500 selection:text-black">
      {/* Decorative Ambience */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0">
        <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-emerald-500/20 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-purple-500/20 blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <Cpu className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tighter uppercase italic">Neural <span className="text-emerald-400">WinGo</span> Predictor</h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-[10px] text-zinc-500 font-mono tracking-widest flex items-center gap-2 uppercase">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                  System_MMT: {mmtTime.getUTCHours().toString().padStart(2, '0')}:{mmtTime.getUTCMinutes().toString().padStart(2, '0')}:{mmtTime.getUTCSeconds().toString().padStart(2, '0')}
                </p>
                <span className="w-px h-2 bg-zinc-800" />
                <p className="text-[10px] text-emerald-500 font-mono tracking-widest uppercase">
                  Next_Sync: {nextDrawCountdown}s
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex flex-col items-end justify-center px-4 border-r border-white/5 opacity-50">
              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em]">Next Period</span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {results[0] ? (BigInt(results[0].issueNumber) + BigInt(1)).toString().slice(-4) : '----'}
              </span>
            </div>
            <button 
              onClick={() => setDemoMode(!demoMode)} 
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                demoMode ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "bg-zinc-900/50 border-white/5 text-zinc-500"
              )}
            >
              {demoMode ? 'SIMULATION_ON' : 'LIVE_DATA'}
            </button>
            <div className="flex items-center gap-4 bg-zinc-900/50 border border-white/5 p-2 pr-6 rounded-2xl backdrop-blur-md">
              <div className="w-32 h-10 bg-black/40 rounded-xl flex items-center justify-center relative overflow-hidden">
                <div key={results[0]?.issueNumber} className="absolute inset-0 bg-emerald-500/5 origin-left" style={{ animation: `grow ${REFRESH_RATE}ms linear forwards` }} />
                <span className="text-[10px] font-black text-emerald-400 tracking-tighter uppercase relative z-10">{loading ? 'SYNCING...' : 'LIVE_FEED'}</span>
              </div>
              <button 
                onClick={() => setShowConfig(true)} 
                className="p-2.5 hover:bg-white/5 rounded-xl transition-all hover:scale-110 active:scale-95"
              >
                <Settings className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
          {/* Main Forecast Panel */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-10 space-y-10 relative overflow-hidden backdrop-blur-xl group"
            >
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity"><Zap className="w-32 h-32" /></div>
              
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Target className="w-5 h-5 text-emerald-400" />
                    {isAiProcessing && (
                      <motion.div 
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-0 bg-emerald-400 rounded-full"
                      />
                    )}
                  </div>
                  <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Neural Sync v6.0</h2>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={generatePrediction}
                    disabled={isAiProcessing}
                    className="p-1.5 bg-white/5 rounded-lg hover:bg-white/10 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={cn("w-3 h-3 text-zinc-500", isAiProcessing && "animate-spin")} />
                  </button>
                  {quotaExhaustedUntil && quotaTimeLeft > 0 && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-md animate-pulse">
                      <AlertTriangle className="w-3 h-3 text-red-400" />
                      <span className="text-[8px] font-black text-red-400 uppercase">COOLDOWN {quotaTimeLeft}S</span>
                    </div>
                  )}
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] font-black text-emerald-500/50 uppercase tracking-widest mb-0.5">TARGET_PERIOD</span>
                    <div className="text-[10px] font-mono px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 tracking-tighter font-bold">
                      #{aiPrediction?.issueNumber || '...'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center py-6 min-h-[260px] justify-center">
                <AnimatePresence mode="wait">
                  {isAiProcessing ? (
                    <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-6">
                      <div className="w-16 h-16 border-4 border-t-emerald-400 border-white/5 rounded-full animate-spin" />
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-black opacity-30 uppercase tracking-[0.3em] font-mono">Decoding Sequencer</span>
                        <span className="text-[8px] font-mono text-zinc-600 uppercase">Cross-matching Hub Load...</span>
                      </div>
                    </motion.div>
                  ) : aiPrediction ? (
                    <motion.div key="p" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 w-full">
                      <div className="relative inline-block">
                        <span className="text-[11rem] font-display font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/20 select-none drop-shadow-[0_0_40px_rgba(255,255,255,0.15)] italic">
                          {aiPrediction.number}
                        </span>
                        <div className="absolute -top-4 -right-10 bg-emerald-500 text-black text-[10px] font-black px-2.5 py-1 rounded-lg shadow-lg">{(aiPrediction.confidence * 100).toFixed(0)}% CONF</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 group hover:border-emerald-500/30 transition-all">
                          <span className="block text-[8px] opacity-30 uppercase font-black mb-1 group-hover:text-emerald-400 transition-colors">Magnitude</span>
                          <span className="text-lg font-black uppercase tracking-[0.2em]">{aiPrediction.size}</span>
                        </div>
                        <div className={cn(
                          "p-4 rounded-2xl border transition-all hover:brightness-110 shadow-lg group",
                          aiPrediction.color === 'red' ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:border-red-500/50' : 
                          aiPrediction.color === 'green' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:border-emerald-500/50' :
                          'bg-purple-500/10 border-purple-500/20 text-purple-400 hover:border-purple-500/50'
                        )}>
                          <span className="block text-[8px] opacity-30 uppercase font-black mb-1">Chroma</span>
                          <span className="text-lg font-black uppercase tracking-[0.2em]">{aiPrediction.color}</span>
                        </div>
                      </div>
                      
                      {aiPrediction.reasoning && (
                        <div className="space-y-4">
                          <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-3xl text-left relative overflow-hidden group">
                             <div className="flex items-center gap-2 mb-2 opacity-50">
                                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Neural Narrative</span>
                             </div>
                             <p className="text-[11px] font-medium text-zinc-300 leading-relaxed relative z-10 italic">
                              "{aiPrediction.reasoning}"
                             </p>
                             <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-emerald-500/10 blur-2xl rounded-full" />
                             <Binary className="absolute top-0 right-0 w-12 h-12 text-emerald-500 opacity-[0.02] group-hover:opacity-[0.08] transition-opacity" />
                          </div>

                          {aiPrediction.analysis && (
                            <div className="grid grid-cols-2 gap-3">
                              {aiPrediction.analysis.map((insight, idx) => (
                                <div key={idx} className="bg-white/5 border border-white/5 p-3 rounded-2xl flex flex-col items-start gap-1 backdrop-blur-sm hover:bg-white/[0.08] transition-all group/item">
                                  <div className="flex items-center justify-between w-full">
                                    <span className="text-[8px] font-black uppercase opacity-30 tracking-tighter group-hover:opacity-60 transition-opacity">{insight.label}</span>
                                    <div className={cn(
                                      "w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]",
                                      insight.impact === 'critical' ? 'text-red-500 bg-red-500 animate-pulse' :
                                      insight.impact === 'high' ? 'text-orange-500 bg-orange-500' :
                                      insight.impact === 'medium' ? 'text-emerald-400 bg-emerald-400' : 'text-zinc-600 bg-zinc-600'
                                    )} />
                                  </div>
                                  <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400/80 group-hover/item:text-emerald-400 transition-colors">
                                    {insight.value}
                                  </div>
                                  <div className="w-full h-0.5 bg-white/5 rounded-full mt-1 overflow-hidden">
                                     <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: insight.impact === 'critical' ? '100%' : insight.impact === 'high' ? '75%' : insight.impact === 'medium' ? '50%' : '25%' }}
                                        className={cn(
                                          "h-full rounded-full",
                                          insight.impact === 'critical' ? 'bg-red-500' :
                                          insight.impact === 'high' ? 'bg-orange-500' :
                                          insight.impact === 'medium' ? 'bg-emerald-400' : 'bg-zinc-600'
                                        )}
                                     />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[9px] font-black uppercase opacity-30 tracking-widest">Confidence Index</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400">{((aiPrediction?.confidence || 0) * 100).toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" 
                    initial={{ width: 0 }} 
                    animate={{ width: `${(aiPrediction?.confidence || 0) * 100}%` }} 
                  />
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem] backdrop-blur-md">
                <span className="block text-[9px] font-black opacity-30 uppercase mb-2">Success Rate</span>
                <span className="text-3xl font-black text-emerald-400 font-display">{stats?.winRate.toFixed(1)}%</span>
              </div>
              <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem] backdrop-blur-md">
                <span className="block text-[9px] font-black opacity-30 uppercase mb-2">Sync Depth</span>
                <span className="text-3xl font-black font-display">{predictionHistory.length}</span>
              </div>
            </div>
          </div>

          {/* Detailed Analytics & Tabs */}
          <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center gap-4 bg-zinc-900/40 p-2 rounded-2xl border border-white/5 w-fit">
              <button 
                onClick={() => setActiveTab('feed')}
                className={cn(
                  "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === 'feed' ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-zinc-500 hover:text-white"
                )}
              >
                Neural Feed
              </button>
              <button 
                onClick={() => setActiveTab('analytics')}
                className={cn(
                  "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === 'analytics' ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-zinc-500 hover:text-white"
                )}
              >
                Analytics
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={cn(
                  "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === 'history' ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-zinc-500 hover:text-white"
                )}
              >
                History
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'feed' ? (
                <motion.div 
                  key="feed"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <motion.div 
                      className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-8 space-y-8 backdrop-blur-md"
                    >
                      <div className="flex items-center gap-3"><PieChartIcon className="w-5 h-5 text-purple-400" /><h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Spectrum Density</h3></div>
                      <div className="h-60 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats?.dist || []}>
                            <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                              {(stats?.dist || []).map((e, i) => (
                                <Cell 
                                  key={i} 
                                  fill={results[0] && parseInt(results[0].number) === i ? '#10b981' : 'rgba(255,255,255,0.05)'} 
                                  className="transition-all duration-500"
                                />
                              ))}
                            </Bar>
                            <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.2)', fontWeight: 800 }} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                              cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </motion.div>

                    <motion.div 
                      className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-8 space-y-6 backdrop-blur-md"
                    >
                      <div className="flex items-center gap-3"><ShieldCheck className="w-5 h-5 text-emerald-400" /><h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Logic Validation</h3></div>
                      <div className="space-y-3 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                        {predictionHistory.slice(0, 5).map(log => (
                          <div key={log.issueNumber} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-3xl border border-white/5 hover:bg-white/5 transition-all">
                            <div className="flex flex-col"><span className="text-[9px] font-mono opacity-20">SEQ_{log.issueNumber.slice(-4)}</span><span className="text-xs font-black">#{log.issueNumber}</span></div>
                            <div className="flex gap-6 items-center">
                              <div className="text-right"><span className="block text-[8px] opacity-20 font-black uppercase">Goal</span><span className="text-sm font-black">{log.predictedNumber}</span></div>
                              <ChevronRight className="w-4 h-4 opacity-10" />
                              <div className="text-right"><span className="block text-[8px] opacity-20 font-black uppercase">Draw</span><span className={cn("text-sm font-black", log.isCorrect ? "text-emerald-400" : "text-red-400")}>{log.actualNumber}</span></div>
                              <div className={cn("w-3 h-3 rounded-full shadow-lg", log.isCorrect ? "bg-emerald-500 shadow-emerald-500/20" : "bg-red-500 shadow-red-500/20")} />
                            </div>
                          </div>
                        ))}
                        {predictionHistory.length === 0 && (
                          <div className="py-16 text-center opacity-10 grayscale flex flex-col items-center">
                            <Binary className="w-12 h-12 mb-4 animate-pulse text-emerald-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Awaiting Live Verification</span>
                          </div>
                        )}
                        {predictionHistory.length > 5 && (
                          <button 
                            onClick={() => setActiveTab('history')}
                            className="w-full py-3 text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-emerald-400 transition-colors"
                          >
                            View All {predictionHistory.length} Predictions
                          </button>
                        )}
                      </div>
                    </motion.div>
                  </div>

                  <motion.div 
                    className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-10 overflow-hidden backdrop-blur-md"
                  >
                    <div className="flex justify-between items-center mb-10">
                      <div className="flex items-center gap-3"><Layers className="w-6 h-6 text-emerald-400" /><h3 className="text-sm font-black uppercase tracking-widest text-zinc-300">Global Sequence Database</h3></div>
                      <div className="flex gap-4">
                        <div className="px-5 py-2.5 bg-black/40 rounded-2xl text-[10px] font-black border border-white/5 text-zinc-400 uppercase flex items-center gap-2">
                          <Flame className="w-4 h-4 text-orange-400" />
                          Hot Digit: <span className="text-emerald-400 text-sm ml-1">{stats?.dist.reduce((a, b) => a.count > b.count ? a : b).n}</span>
                        </div>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-separate border-spacing-y-3">
                        <thead><tr className="text-[10px] font-black opacity-20 uppercase tracking-[0.3em]"><th className="pb-4 pl-6">Sequence ID</th><th className="pb-4">Digit</th><th className="pb-4">Chromatic Aura</th><th className="pb-4 text-right pr-6">Volume Load</th></tr></thead>
                        <tbody>
                          {results.map(r => (
                            <tr key={r.issueNumber} className="bg-white/[0.02] hover:bg-white/[0.05] transition-all rounded-2xl group">
                              <td className="py-5 pl-6 text-xs font-mono opacity-20 group-hover:opacity-100 transition-opacity">{r.issueNumber}</td>
                              <td className="py-5 font-black text-xl italic">{r.number} <span className="text-[9px] font-black opacity-30 px-2 py-1 bg-white/5 rounded-lg ml-2 uppercase translate-y-[-3px] inline-block">{parseInt(r.number) >= 5 ? 'BIG' : 'SMALL'}</span></td>
                              <td className="py-5">
                                <div className="flex gap-2">
                                  {r.colour.split(',').map(c => (
                                    <div key={c} className={cn(
                                      "w-2.5 h-8 rounded-full shadow-md",
                                      c === 'red' ? 'bg-red-500 shadow-red-500/20' : c === 'green' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-purple-500 shadow-purple-500/20'
                                    )} />
                                  ))}
                                </div>
                              </td>
                              <td className="py-5 text-right pr-6 text-sm font-mono font-black text-emerald-400 italic">
                                {parseInt(r.premium).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                </motion.div>
              ) : activeTab === 'analytics' ? (
                <motion.div 
                  key="analytics"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-8 space-y-8 backdrop-blur-md">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <TrendingUp className="w-5 h-5 text-emerald-400" />
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Yield Trajectory</h3>
                        </div>
                        <span className="text-[9px] font-mono text-emerald-500/50 uppercase">Rolling Win Rate %</span>
                      </div>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={trendData}>
                            <defs>
                              <linearGradient id="winRateGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                            <XAxis 
                              dataKey="issue" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)', fontWeight: 800 }} 
                            />
                            <YAxis 
                              domain={[0, 100]} 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)', fontWeight: 800 }} 
                              tickFormatter={(v) => `${v}%`}
                            />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                              labelStyle={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="winRate" 
                              stroke="#10b981" 
                              strokeWidth={3} 
                              fillOpacity={1} 
                              fill="url(#winRateGradient)" 
                              animationDuration={2000}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-8 space-y-8 backdrop-blur-md">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Activity className="w-5 h-5 text-purple-400" />
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Confidence Flux</h3>
                        </div>
                        <span className="text-[9px] font-mono text-purple-500/50 uppercase">Engine Certainty %</span>
                      </div>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                            <XAxis 
                              dataKey="issue" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)', fontWeight: 800 }} 
                            />
                            <YAxis 
                              domain={[0, 100]} 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)', fontWeight: 800 }} 
                              tickFormatter={(v) => `${v}%`}
                            />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                              labelStyle={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}
                            />
                            <Line 
                              type="stepAfter" 
                              dataKey="confidence" 
                              stroke="#a855f7" 
                              strokeWidth={3} 
                              dot={{ fill: '#a855f7', strokeWidth: 2, r: 4, stroke: '#000' }}
                              activeDot={{ r: 6, strokeWidth: 0 }}
                              animationDuration={2500}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-8 space-y-8 backdrop-blur-md md:col-span-2">
                       <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Layers className="w-5 h-5 text-blue-400" />
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Premium Volume vs Yield</h3>
                        </div>
                        <div className="flex gap-4">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-[8px] font-black uppercase text-zinc-500">Correct</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <span className="text-[8px] font-black uppercase text-zinc-500">Incorrect</span>
                          </div>
                        </div>
                      </div>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                            <XAxis 
                              dataKey="issue" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)', fontWeight: 800 }} 
                            />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)', fontWeight: 800 }} 
                              tickFormatter={(v) => `${(v/1000).toFixed(0)}k`}
                            />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                              cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                              formatter={(value: number) => [`${value.toLocaleString()}`, 'Premium']}
                            />
                            <Bar dataKey="premium" radius={[4, 4, 0, 0]}>
                              {trendData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.isWin ? '#10b981' : '#ef4444'} fillOpacity={0.6} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-md">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase opacity-30 tracking-widest">Global Efficiency</span>
                        <div className="text-3xl font-black text-emerald-400 italic">
                          {stats?.winRate.toFixed(2)}%
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase opacity-30 tracking-widest">Avg Confidence</span>
                        <div className="text-3xl font-black text-purple-400 italic">
                          {(predictionHistory.reduce((a, b) => a + b.confidence, 0) / (predictionHistory.length || 1) * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase opacity-30 tracking-widest">Total Samples</span>
                        <div className="text-3xl font-black text-zinc-200 italic">
                          {predictionHistory.length}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase opacity-30 tracking-widest">Engine Status</span>
                        <div className="text-3xl font-black text-emerald-500 italic flex items-center gap-2">
                          OPTIMAL <Zap className="w-5 h-5 fill-emerald-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="history"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-zinc-900/40 p-4 rounded-2xl border border-white/5 space-y-2">
                      <span className="text-[9px] font-black uppercase opacity-30 tracking-widest">Filter Result</span>
                      <div className="flex gap-2">
                        {(['all', 'correct', 'incorrect'] as const).map(f => (
                          <button
                            key={f}
                            onClick={() => setHistoryFilter(f)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all",
                              historyFilter === f ? "bg-emerald-500 text-black border-emerald-500" : "bg-white/5 text-zinc-500 hover:text-white border border-white/5"
                            )}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="bg-zinc-900/40 p-4 rounded-2xl border border-white/5 space-y-2">
                      <span className="text-[9px] font-black uppercase opacity-30 tracking-widest">Sort By</span>
                      <div className="flex gap-2">
                        {(['newest', 'oldest', 'confidence'] as const).map(s => (
                          <button
                            key={s}
                            onClick={() => setHistorySort(s)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all",
                              historySort === s ? "bg-emerald-500 text-black border-emerald-500" : "bg-white/5 text-zinc-500 hover:text-white border border-white/5"
                            )}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="bg-zinc-900/40 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                      <div>
                        <span className="block text-[9px] font-black uppercase opacity-30 tracking-widest">Accuracy</span>
                        <span className="text-xl font-black text-emerald-400 italic">{stats?.winRate.toFixed(1)}%</span>
                      </div>
                      <History className="w-8 h-8 text-zinc-800" />
                    </div>
                  </div>

                  <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-md min-h-[500px]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-separate border-spacing-y-3 px-8 pb-8">
                        <thead>
                          <tr className="text-[10px] font-black opacity-20 uppercase tracking-[0.3em]">
                            <th className="pb-4 pl-6">Issue</th>
                            <th className="pb-4">Prediction</th>
                            <th className="pb-4">Actual Result</th>
                            <th className="pb-4">Confidence</th>
                            <th className="pb-4 text-right pr-6">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredHistory.map(log => (
                            <tr key={log.issueNumber} className="bg-white/[0.02] hover:bg-white/[0.05] transition-all rounded-2xl group">
                              <td className="py-5 pl-6 text-xs font-mono font-bold">
                                {log.issueNumber}
                                <span className="block text-[8px] opacity-30 font-normal">{new Date(log.timestamp).toLocaleTimeString()}</span>
                              </td>
                              <td className="py-5">
                                <div className="flex items-center gap-3">
                                  <span className="text-lg font-black">{log.predictedNumber}</span>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[8px] font-black uppercase opacity-50 px-1.5 bg-white/5 rounded">{log.predictedSize}</span>
                                    <span className={cn(
                                      "text-[8px] font-black uppercase px-1.5 rounded",
                                      log.predictedColor === 'red' ? 'text-red-400 bg-red-400/10' : 
                                      log.predictedColor === 'green' ? 'text-emerald-400 bg-emerald-400/10' : 'text-purple-400 bg-purple-400/10'
                                    )}>{log.predictedColor}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-5">
                                <div className="flex items-center gap-3">
                                  <span className="text-lg font-black">{log.actualNumber}</span>
                                  <div className="flex gap-1">
                                    {log.actualColor.split(',').map(c => (
                                      <div key={c} className={cn(
                                        "w-1.5 h-4 rounded-full",
                                        c === 'red' ? 'bg-red-500' : c === 'green' ? 'bg-emerald-500' : 'bg-purple-500'
                                      )} />
                                    ))}
                                  </div>
                                </div>
                              </td>
                              <td className="py-5">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full bg-emerald-500" style={{ width: `${log.confidence * 100}%` }} />
                                  </div>
                                  <span className="text-[10px] font-mono opacity-50">{(log.confidence * 100).toFixed(0)}%</span>
                                </div>
                              </td>
                              <td className="py-5 text-right pr-6">
                                <span className={cn(
                                  "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                  log.isCorrect ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                                )}>
                                  {log.isCorrect ? 'SUCCESS' : 'FAILURE'}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {filteredHistory.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-32 text-center">
                                <History className="w-12 h-12 mx-auto mb-4 opacity-5" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">No Historical Records Found</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Config Interface */}
      <AnimatePresence>
        {showConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="bg-zinc-900 border border-white/10 p-12 rounded-[3.5rem] w-full max-w-xl shadow-3xl space-y-10 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><Settings className="w-48 h-48" /></div>
              
              <div className="flex justify-between items-start relative z-10">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black uppercase italic tracking-tight">Stream Protocols</h2>
                  <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Encryption Access & Proxy Tuning</p>
                </div>
                <button onClick={() => setShowConfig(false)} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all hover:rotate-90"><X className="w-7 h-7 text-zinc-400 hover:text-white" /></button>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] ml-2">Bearer Authorization Cipher</label>
                  <textarea 
                    value={apiConfig.token} 
                    onChange={e => setApiConfig(p => ({ ...p, token: e.target.value }))} 
                    className="w-full h-40 bg-black/40 border border-white/5 rounded-3xl p-6 text-[10px] font-mono text-zinc-400 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 outline-none resize-none transition-all scrollbar-none" 
                    placeholder="eyJhbGci..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] ml-2">Signature Root</label>
                    <input 
                      value={apiConfig.signature} 
                      onChange={e => setApiConfig(p => ({ ...p, signature: e.target.value }))} 
                      className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-[10px] font-mono text-zinc-400 outline-none focus:border-emerald-500/50 transition-all font-bold" 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] ml-2">System Epoch</label>
                    <input 
                      value={apiConfig.timestamp} 
                      onChange={e => setApiConfig(p => ({ ...p, timestamp: e.target.value }))} 
                      className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-[10px] font-mono text-zinc-400 outline-none focus:border-emerald-500/50 transition-all font-bold" 
                    />
                  </div>
                  <div className="space-y-3 col-span-2">
                    <label className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] ml-2">Random Seed</label>
                    <input 
                      value={apiConfig.random} 
                      onChange={e => setApiConfig(p => ({ ...p, random: e.target.value }))} 
                      className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-[10px] font-mono text-zinc-400 outline-none focus:border-emerald-500/50 transition-all font-bold" 
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={() => { setShowConfig(false); fetchResults(); }} 
                className="w-full py-6 bg-emerald-500 text-black font-black text-xs uppercase tracking-[0.3em] rounded-3xl hover:bg-emerald-400 active:scale-[0.98] transition-all shadow-[0_0_40px_rgba(16,185,129,0.3)] relative z-10"
              >
                RE-ESTABLISH HANDSHAKE
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* System Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, x: 40, scale: 0.9 }} 
            animate={{ opacity: 1, x: 0, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.9 }} 
            className="fixed bottom-12 right-12 z-50 bg-red-600 text-white p-8 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.5)] flex items-center gap-6 border border-red-500/50 max-w-sm backdrop-blur-3xl"
          >
            <div className="p-4 bg-black/20 rounded-2xl"><AlertTriangle className="w-10 h-10" /></div>
            <div className="flex-1 space-y-1">
              <h4 className="text-[10px] font-black uppercase tracking-widest">Protocol Sync Error</h4>
              <p className="text-[10px] opacity-90 font-mono tracking-tighter leading-tight">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="p-2 hover:bg-black/10 rounded-xl transition-all"><X className="w-5 h-5" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes grow { from { width: 0%; } to { width: 100%; } } 
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

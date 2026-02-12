"use client";

import { useState, useEffect } from 'react';
import { 
  Search, Cpu, History, ChevronRight, 
  Zap, FileText, Crosshair, BarChart3, 
  Terminal, ShieldAlert, Loader2, Play
} from 'lucide-react';

interface AnalysisResult {
  "标题"?: string; "标题理由"?: string;
  "五点描述"?: string; "五点描述理由"?: string;
  "商品描述"?: string; "商品描述理由"?: string;
  "主图设计方向"?: string; "主图设计方向理由"?: string;
  "A+设计方向"?: string; "A+设计方向理由"?: string;
  [key: string]: any;
}

interface HistoryItem {
  id: string; query: string; timestamp: string; data: AnalysisResult;
}

export default function XiberiaTerminal() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistoryMobile, setShowHistoryMobile] = useState(false);
  
  useEffect(() => {
    const saved = localStorage.getItem('xiberia_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveToHistory = (newResult: AnalysisResult, queryText: string) => {
    const newItem = { id: Date.now().toString(), query: queryText, timestamp: new Date().toLocaleTimeString(), data: newResult };
    const updated = [newItem, ...history].slice(0, 10);
    setHistory(updated);
    localStorage.setItem('xiberia_history', JSON.stringify(updated));
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setResult(null); setStatus('⚡ 连接神经网络... 正在初始化分析协议');

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: query, asin: 'AUTO', type: 'GAMING', price: '0', features: 'AUTO', scenario: 'GAMING', audience: 'GAMERS' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const interval = setInterval(async () => {
        try {
          const check = await fetch(`/api/result?recordId=${data.recordId}&model=${encodeURIComponent(query)}`);
          const checkData = await check.json();
          if (checkData.status === 'done') {
            clearInterval(interval);
            setResult(checkData.data);
            saveToHistory(checkData.data, query);
            setLoading(false);
            setStatus('✅ 战术分析完成。');
          } else {
             setStatus(`🛰️ 正在从卫星链路接收数据... [状态: ${checkData.currentStatus || '计算中'}]`);
          }
        } catch (e) { console.error(e); }
      }, 3000);
    } catch (error: any) {
      setStatus(`❌ 系统故障: ${error.message}`); setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#050505] text-gray-200 font-sans overflow-hidden selection:bg-red-900 selection:text-white">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070")', filter: 'grayscale(100%) contrast(120%)' }} />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/90 to-[#1a0505]/80 backdrop-blur-sm" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,20,20,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(20,20,20,0.5)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
      </div>

      <aside className={`fixed inset-y-0 left-0 z-30 w-72 bg-black/60 backdrop-blur-xl border-r border-white/10 transform transition-transform duration-300 md:relative md:translate-x-0 flex flex-col ${showHistoryMobile ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-white/10 flex justify-between items-center text-red-500 font-bold tracking-wider text-xl">
          <div className="flex gap-2"><Cpu className="animate-pulse" /> XIBERIA</div>
          <button onClick={() => setShowHistoryMobile(false)} className="md:hidden"><ChevronRight className="rotate-180" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex gap-2"><History className="w-3 h-3" /> Mission Logs</h3>
          {history.map((item) => (
            <div key={item.id} onClick={() => {setQuery(item.query); setResult(item.data); setShowHistoryMobile(false);}} className="group cursor-pointer p-3 rounded bg-white/5 hover:border-red-500/50 hover:bg-white/10 relative overflow-hidden border border-transparent">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600 opacity-0 group-hover:opacity-100" />
              <div className="text-sm font-medium text-gray-200 truncate group-hover:text-red-400 font-mono">{item.query}</div>
              <div className="text-xs text-gray-600 mt-1 flex justify-between"><span>{item.timestamp}</span><span className="text-[10px] bg-gray-800 px-1 rounded text-gray-400">DONE</span></div>
            </div>
          ))}
        </div>
      </aside>

      <main className="flex-1 relative z-10 flex flex-col h-full overflow-hidden">
        <div className="md:hidden p-4 flex items-center border-b border-white/10 bg-black/80"><button onClick={() => setShowHistoryMobile(true)}><Terminal /></button><span className="ml-4 font-bold text-red-500">TERMINAL</span></div>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 scrollbar-thin scrollbar-thumb-red-900">
          <div className="max-w-5xl mx-auto space-y-12">
            <section className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-red-900 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative bg-black/80 border border-white/20 p-1 rounded-lg backdrop-blur-md">
                <form onSubmit={handleAnalyze} className="flex items-center">
                  <div className="pl-4 text-gray-500"><Search className={loading ? 'animate-bounce text-red-500' : ''} /></div>
                  <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="输入指令 / 型号 (G7-Pro)..." className="w-full bg-transparent border-none text-white text-lg px-4 py-4 focus:ring-0 placeholder-gray-600 font-medium tracking-wide" disabled={loading} />
                  <button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-md font-bold uppercase flex gap-2 shadow-[0_0_15px_rgba(220,38,38,0.5)] disabled:opacity-50">
                    {loading ? <Loader2 className="animate-spin" /> : <Zap className="fill-current" />} <span className="hidden sm:inline">执行</span>
                  </button>
                </form>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm font-mono h-6 text-red-400/80">{status}</div>
            </section>

            {result && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
                <div className="flex items-center gap-4 text-gray-500"><div className="h-px bg-red-900 flex-1" /><span className="text-xs tracking-widest text-red-500">COMPLETE</span><div className="h-px bg-red-900 flex-1" /></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TechCard title="TITLE" icon={<FileText className="text-red-500" />} content={result["标题"]} reason={result["标题理由"]} delay={1} />
                  <TechCard title="BULLETS" icon={<BarChart3 className="text-red-500" />} content={result["五点描述"]} reason={result["五点描述理由"]} delay={2} />
                </div>
                <TechCard title="DESCRIPTION" icon={<Terminal className="text-red-500" />} content={result["商品描述"]} reason={result["商品描述理由"]} fullWidth delay={3} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TechCard title="MAIN IMAGE" icon={<Crosshair className="text-red-500" />} content={result["主图设计方向"]} reason={result["主图设计方向理由"]} delay={4} />
                  <TechCard title="A+ CONTENT" icon={<ShieldAlert className="text-red-500" />} content={result["A+设计方向"]} reason={result["A+设计方向理由"]} delay={5} />
                </div>
              </div>
            )}
            <div className="h-20" />
          </div>
        </div>
      </main>
    </div>
  );
}

function TechCard({ title, icon, content, reason, fullWidth, delay }: any) {
  if (!content) return null;
  return (
    <div className={`relative group ${fullWidth ? 'col-span-full' : ''}`} style={{ animationDelay: `${delay * 100}ms` }}>
      <div className="absolute -inset-[1px] bg-gradient-to-b from-white/10 to-transparent rounded-xl opacity-50 group-hover:opacity-100 transition duration-500" />
      <div className="relative h-full bg-black/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
          <div className="flex gap-3 items-center"><div className="p-2 bg-black/50 rounded-lg border border-white/10">{icon}</div><h3 className="font-bold text-gray-100">{title}</h3></div>
          <div className="flex gap-1"><div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" /><div className="w-1.5 h-1.5 bg-gray-700 rounded-full" /></div>
        </div>
        <div className="p-6 flex-1"><div className="prose prose-invert max-w-none text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{content}</div></div>
        {reason && <div className="bg-red-900/10 border-t border-red-900/20 p-4 flex gap-3"><Play className="w-3 h-3 text-red-500 fill-current mt-1" /><div><span className="text-[10px] uppercase font-bold text-red-500 mb-1 block">INSIGHT</span><p className="text-xs text-red-200/70 italic">{reason}</p></div></div>}
      </div>
    </div>
  );
}

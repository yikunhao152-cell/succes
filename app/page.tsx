"use client";

import { useState, useEffect } from 'react';
import { 
  Cpu, History, ChevronRight, Zap, FileText, Crosshair, 
  BarChart3, Terminal, ShieldAlert, Loader2, Play, 
  Target, DollarSign, Users, MessageSquare, Layers, Box, Trash2
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
  id: string; timestamp: string; modelName: string;
  inputs: any; result: AnalysisResult;
}

export default function XiberiaTerminal() {
  const [formData, setFormData] = useState({
    model: '', asin: '', type: '', price: '', audience: '', 
    features: '', scenario: '', rufusQuestions: ''
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistoryMobile, setShowHistoryMobile] = useState(false);
  
  useEffect(() => {
    const saved = localStorage.getItem('xiberia_history_v2');
    if (saved) { try { setHistory(JSON.parse(saved)); } catch (e) {} }
  }, []);

  const saveToHistory = (newResult: AnalysisResult, currentInputs: typeof formData) => {
    const newItem = { id: Date.now().toString(), timestamp: new Date().toLocaleString(), modelName: currentInputs.model, inputs: { ...currentInputs }, result: newResult };
    const updated = [newItem, ...history].slice(0, 20);
    setHistory(updated);
    localStorage.setItem('xiberia_history_v2', JSON.stringify(updated));
  };

  const deleteHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('xiberia_history_v2', JSON.stringify(updated));
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setFormData(item.inputs); setResult(item.result);
    setStatus(`✅ 已回溯: ${item.modelName}`); setShowHistoryMobile(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.model.trim()) { setStatus('⚠️ 错误: 必须输入产品型号'); return; }

    setLoading(true); setResult(null); setStatus('⚡ 正在写入飞书表一...');

    try {
      // 1. 写入表一
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.msg);

      setStatus('🛰️ 已触发飞书自动化，正在等待表三结果...');

      // 2. 轮询表三 (使用型号匹配)
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        try {
          const check = await fetch(`/api/result?model=${encodeURIComponent(formData.model)}`);
          const checkData = await check.json();
          
          if (checkData.status === 'done') {
            clearInterval(interval);
            setResult(checkData.data);
            saveToHistory(checkData.data, formData);
            setLoading(false);
            setStatus('✅ 分析完成，数据已从表三同步。');
          } else {
             const loadingTexts = ['等待 n8n 处理...', '正在生成文案...', '同步表三数据...', `分析中 (${attempts}s)`];
             setStatus(`🛰️ ${loadingTexts[attempts % loadingTexts.length]}`);
             
             // 90秒后超时提示
             if (attempts > 30) {
                 setStatus('⚠️ 等待时间较长，请检查飞书 n8n 是否运行正常。');
             }
          }
        } catch (e) { console.error(e); }
      }, 3000);
    } catch (error: any) {
      setStatus(`❌ 错误: ${error.message}`); setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#050505] text-gray-200 font-sans overflow-hidden selection:bg-red-900 selection:text-white">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070")', filter: 'grayscale(100%) contrast(120%)' }} />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/95 to-[#1a0505]/90 backdrop-blur-sm" />
      </div>

      <aside className={`fixed inset-y-0 left-0 z-30 w-72 bg-black/60 backdrop-blur-xl border-r border-white/10 transform transition-transform duration-300 md:relative md:translate-x-0 flex flex-col ${showHistoryMobile ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-white/10 flex justify-between items-center text-red-500 font-bold tracking-wider text-xl">
          <div className="flex gap-2"><Cpu className="animate-pulse" /> XIBERIA</div>
          <button onClick={() => setShowHistoryMobile(false)} className="md:hidden"><ChevronRight className="rotate-180" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-red-900/50">
          <div className="flex items-center justify-between mb-4"><h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex gap-2"><History className="w-3 h-3" /> Mission Logs</h3><span className="text-[10px] text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">{history.length}</span></div>
          {history.map((item) => (
            <div key={item.id} onClick={() => loadHistoryItem(item)} className="group cursor-pointer p-3 rounded bg-white/5 hover:border-red-500/50 hover:bg-white/10 relative overflow-hidden border border-transparent transition-all">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start"><div className="text-sm font-medium text-gray-200 truncate group-hover:text-red-400 font-mono flex-1">{item.modelName}</div><button onClick={(e) => deleteHistory(e, item.id)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 transition-opacity p-1"><Trash2 className="w-3 h-3" /></button></div>
              <div className="text-[10px] text-gray-500 mt-1 flex justify-between items-center"><span>{item.timestamp.split(' ')[0]}</span><span className="bg-green-900/30 text-green-400 px-1.5 rounded">DONE</span></div>
            </div>
          ))}
        </div>
      </aside>

      <main className="flex-1 relative z-10 flex flex-col h-full overflow-hidden">
        <div className="md:hidden p-4 flex items-center border-b border-white/10 bg-black/80"><button onClick={() => setShowHistoryMobile(true)}><Terminal /></button><span className="ml-4 font-bold text-red-500">TERMINAL</span></div>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 scrollbar-thin scrollbar-thumb-red-900">
          <div className="max-w-6xl mx-auto space-y-12">
            <section className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600/30 to-red-900/30 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative bg-black/80 border border-white/10 p-6 md:p-8 rounded-xl backdrop-blur-md shadow-2xl">
                <div className="mb-8 flex items-center gap-3 border-b border-white/10 pb-4"><Target className="text-red-500 w-6 h-6" /><h2 className="text-xl font-bold tracking-widest text-gray-100">INPUT PARAMETERS <span className="text-xs text-gray-600 font-mono ml-2">// SET CONFIGURATION</span></h2></div>
                <form onSubmit={handleAnalyze} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputGroup label="产品型号 (MODEL)" icon={<Box/>} name="model" value={formData.model} onChange={handleInputChange} placeholder="例如: G7-Pro Wireless" required />
                    <InputGroup label="竞品 ASIN" icon={<Target/>} name="asin" value={formData.asin} onChange={handleInputChange} placeholder="例如: B0C5T9JM59" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InputGroup label="产品类型" icon={<Layers/>} name="type" value={formData.type} onChange={handleInputChange} placeholder="例如: 游戏耳机" />
                    <InputGroup label="目标定价" icon={<DollarSign/>} name="price" value={formData.price} onChange={handleInputChange} placeholder="例如: 59.99" />
                    <InputGroup label="目标人群" icon={<Users/>} name="audience" value={formData.audience} onChange={handleInputChange} placeholder="例如: 硬核玩家" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputGroup label="功能点" icon={<Zap/>} name="features" value={formData.features} onChange={handleInputChange} placeholder="例如: 主动降噪, 40h续航" />
                    <InputGroup label="使用场景" icon={<Crosshair/>} name="scenario" value={formData.scenario} onChange={handleInputChange} placeholder="例如: 电竞房, 地铁通勤" />
                  </div>
                  <div className="space-y-2"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2"><MessageSquare className="w-3 h-3 text-red-500" /> 竞品rufusi问题</label><textarea name="rufusQuestions" value={formData.rufusQuestions} onChange={handleInputChange} rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-gray-200 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all placeholder-gray-600" /></div>
                  <div className="pt-4 flex items-center justify-between"><div className="text-sm font-mono text-red-400/80 animate-pulse">{status}</div><button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-lg font-bold uppercase tracking-wider flex items-center gap-3 shadow-[0_0_20px_rgba(220,38,38,0.4)] disabled:opacity-50 hover:-translate-y-1 transform transition-all">{loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Zap className="fill-current w-5 h-5" />}<span>INITIATE ANALYSIS</span></button></div>
                </form>
              </div>
            </section>

            {result && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700 pb-20">
                <div className="flex items-center gap-4 text-gray-500"><div className="h-px bg-red-900 flex-1" /><span className="text-xs tracking-widest text-red-500 font-mono">MISSION COMPLETE</span><div className="h-px bg-red-900 flex-1" /></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TechCard title="TITLE STRATEGY" icon={<FileText className="text-red-500" />} content={result["标题"]} reason={result["标题理由"]} delay={1} />
                  <TechCard title="BULLET POINTS" icon={<BarChart3 className="text-red-500" />} content={result["五点描述"]} reason={result["五点描述理由"]} delay={2} />
                </div>
                <TechCard title="PRODUCT DESCRIPTION" icon={<Terminal className="text-red-500" />} content={result["商品描述"]} reason={result["商品描述理由"]} fullWidth delay={3} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TechCard title="MAIN IMAGE DIRECTIVE" icon={<Crosshair className="text-red-500" />} content={result["主图设计方向"]} reason={result["主图设计方向理由"]} delay={4} />
                  <TechCard title="A+ CONTENT ARCHITECTURE" icon={<ShieldAlert className="text-red-500" />} content={result["A+设计方向"]} reason={result["A+设计方向理由"]} delay={5} />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function InputGroup({ label, icon, name, value, onChange, placeholder, required }: any) {
  return (
    <div className="space-y-2"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2"><span className="text-red-500 w-3 h-3">{icon}</span> {label}</label><input type="text" name={name} value={value} onChange={onChange} required={required} placeholder={placeholder} className="w-full bg-white/5 border border-white/10 rounded h-12 px-4 text-gray-200 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all placeholder-gray-600 font-medium" /></div>
  );
}

function TechCard({ title, icon, content, reason, fullWidth, delay }: any) {
  if (!content) return null;
  return (
    <div className={`relative group ${fullWidth ? 'col-span-full' : ''}`} style={{ animationDelay: `${delay * 100}ms` }}>
      <div className="absolute -inset-[1px] bg-gradient-to-b from-white/10 to-transparent rounded-xl opacity-50 group-hover:opacity-100 transition duration-500" />
      <div className="relative h-full bg-black/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden flex flex-col hover:bg-white/5 transition-colors">
        <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex justify-between items-center"><div className="flex gap-3 items-center"><div className="p-2 bg-black/50 rounded-lg border border-white/10 shadow-inner">{icon}</div><h3 className="font-bold text-gray-100 tracking-wide">{title}</h3></div><div className="flex gap-1"><div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" /><div className="w-1.5 h-1.5 bg-gray-700 rounded-full" /></div></div>
        <div className="p-6 flex-1"><div className="prose prose-invert max-w-none text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{content}</div></div>
        {reason && <div className="bg-red-900/10 border-t border-red-900/20 p-4 flex gap-3"><Play className="w-3 h-3 text-red-500 fill-current mt-1" /><div><span className="text-[10px] uppercase font-bold text-red-500 mb-1 block">TACTICAL INSIGHT</span><p className="text-xs text-red-200/70 italic">{reason}</p></div></div>}
      </div>
    </div>
  );
}

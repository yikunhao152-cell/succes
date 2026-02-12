"use client";

import { useState, useEffect } from 'react';
import { Cpu, History, ChevronRight, Zap, FileText, Crosshair, BarChart3, Terminal, ShieldAlert, Loader2, Play, Target, DollarSign, Users, MessageSquare, Layers, Box, Trash2 } from 'lucide-react';

interface AnalysisResult { [key: string]: any; }

export default function XiberiaTerminal() {
  const [formData, setFormData] = useState({ model: '', asin: '', type: '', price: '', audience: '', features: '', scenario: '', rufusQuestions: '' });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('xiberia_history_v2');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setStatus('⚡ 正在提交任务...');

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('提交失败');

      const interval = setInterval(async () => {
        const check = await fetch(`/api/result?model=${encodeURIComponent(formData.model)}`);
        const checkData = await check.json();
        if (checkData.status === 'done') {
          clearInterval(interval);
          setResult(checkData.data);
          setLoading(false);
          setStatus('✅ 分析完成');
          const newHistory = [{ id: Date.now(), model: formData.model, data: checkData.data, inputs: {...formData} }, ...history].slice(0, 10);
          setHistory(newHistory);
          localStorage.setItem('xiberia_history_v2', JSON.stringify(newHistory));
        } else {
          setStatus('🛰️ AI 正在撰写中...');
        }
      }, 3000);
    } catch (e: any) { setStatus(`❌ 错误: ${e.message}`); setLoading(false); }
  };

  return (
    <div className="flex h-screen bg-[#050505] text-gray-200 font-sans overflow-hidden">
      {/* 侧边栏 */}
      <aside className="w-72 bg-black/60 border-r border-white/10 p-6">
        <div className="text-red-500 font-bold mb-8 flex gap-2"><Cpu /> XIBERIA</div>
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase flex gap-2"><History className="w-3 h-3"/> Mission Logs</h3>
          {history.map(h => (
            <div key={h.id} onClick={() => {setFormData(h.inputs); setResult(h.data);}} className="p-3 bg-white/5 rounded border border-transparent hover:border-red-500/50 cursor-pointer transition-all">
              <div className="text-sm font-mono truncate">{h.model}</div>
            </div>
          ))}
        </div>
      </aside>

      {/* 主面板 */}
      <main className="flex-1 overflow-y-auto p-12 scrollbar-thin scrollbar-thumb-red-900">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-black/80 border border-white/10 p-8 rounded-xl backdrop-blur-md">
            <h2 className="text-xl font-bold mb-6 flex gap-3 text-gray-100"><Target className="text-red-500"/> 控制台指令</h2>
            <form onSubmit={handleAnalyze} className="grid grid-cols-2 gap-6">
              <InputGroup label="型号" name="model" value={formData.model} onChange={(e: any) => setFormData({...formData, model: e.target.value})} required />
              <InputGroup label="竞品ASIN" name="asin" value={formData.asin} onChange={(e: any) => setFormData({...formData, asin: e.target.value})} />
              <InputGroup label="产品类型" name="type" value={formData.type} onChange={(e: any) => setFormData({...formData, type: e.target.value})} />
              <InputGroup label="目标定价" name="price" value={formData.price} onChange={(e: any) => setFormData({...formData, price: e.target.value})} />
              <InputGroup label="目标人群" name="audience" value={formData.audience} onChange={(e: any) => setFormData({...formData, audience: e.target.value})} />
              <InputGroup label="功能点" name="features" value={formData.features} onChange={(e: any) => setFormData({...formData, features: e.target.value})} />
              <InputGroup label="使用场景" name="scenario" value={formData.scenario} onChange={(e: any) => setFormData({...formData, scenario: e.target.value})} />
              <div className="col-span-2 space-y-2">
                <label className="text-xs font-bold text-gray-500">竞品RUFUSI问题</label>
                <textarea value={formData.rufusQuestions} onChange={(e) => setFormData({...formData, rufusQuestions: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded p-3 h-24 focus:border-red-500 outline-none" />
              </div>
              <div className="col-span-2 flex justify-between items-center">
                <span className="text-sm font-mono text-red-400 animate-pulse">{status}</span>
                <button type="submit" disabled={loading} className="bg-red-600 px-8 py-3 rounded font-bold flex gap-2 hover:bg-red-500 disabled:opacity-50 transition-all">
                  {loading ? <Loader2 className="animate-spin" /> : <Zap />} 执行分析
                </button>
              </div>
            </form>
          </div>

          {result && (
            <div className="grid grid-cols-1 gap-6 pb-20 animate-in fade-in duration-700">
              {Object.entries(result).map(([key, val]) => (
                <div key={key} className="bg-white/5 border border-white/10 p-6 rounded-lg hover:bg-white/10 transition-colors">
                  <h4 className="text-red-500 font-bold text-xs mb-2 uppercase tracking-widest">{key}</h4>
                  <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">{String(val)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function InputGroup({ label, ...props }: any) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-gray-500 uppercase">{label}</label>
      <input {...props} className="w-full bg-white/5 border border-white/10 rounded h-10 px-4 focus:border-red-500 outline-none transition-all" />
    </div>
  );
}

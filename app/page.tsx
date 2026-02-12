"use client";

import { useState, useEffect } from 'react';
import { 
  Cpu, History, ChevronRight, Zap, FileText, Crosshair, 
  BarChart3, Terminal, ShieldAlert, Loader2, Play, 
  Target, DollarSign, Users, MessageSquare, Layers, Box, Trash2
} from 'lucide-react';

// --- 类型定义 ---
interface AnalysisResult {
  "标题"?: string; "标题理由"?: string;
  "五点描述"?: string; "五点描述理由"?: string;
  "商品描述"?: string; "商品描述理由"?: string;
  "主图设计方向"?: string; "主图设计方向理由"?: string;
  "A+设计方向"?: string; "A+设计方向理由"?: string;
  [key: string]: any;
}

// 升级版历史记录结构
interface HistoryItem {
  id: string; 
  timestamp: string; 
  modelName: string;
  inputs: {
    model: string;
    asin: string;
    type: string;
    price: string;
    audience: string;
    features: string;
    scenario: string;
    rufusQuestions: string;
  };
  result: AnalysisResult;
}

export default function XiberiaTerminal() {
  // --- 表单状态 ---
  const [formData, setFormData] = useState({
    model: '',
    asin: '',
    type: '',
    price: '',
    audience: '',
    features: '',
    scenario: '',
    rufusQuestions: ''
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistoryMobile, setShowHistoryMobile] = useState(false);
  
  // --- 初始化 ---
  useEffect(() => {
    const saved = localStorage.getItem('xiberia_history_v2');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("历史记录读取失败", e);
      }
    }
  }, []);

  // --- 保存历史 ---
  const saveToHistory = (newResult: AnalysisResult, currentInputs: typeof formData) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString(),
      modelName: currentInputs.model,
      inputs: { ...currentInputs },
      result: newResult
    };
    const updated = [newItem, ...history].slice(0, 20);
    setHistory(updated);
    localStorage.setItem('xiberia_history_v2', JSON.stringify(updated));
  };

  // --- 删除历史 ---
  const deleteHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('xiberia_history_v2', JSON.stringify(updated));
  };

  // --- 加载历史 ---
  const loadHistoryItem = (item: HistoryItem) => {
    setFormData(item.inputs);
    setResult(item.result);
    setStatus(`✅ 已回溯历史记录: ${item.modelName} (${item.timestamp})`);
    setShowHistoryMobile(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- 提交逻辑 ---
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.model.trim()) {
      setStatus('⚠️ 错误: 必须输入产品型号');
      return;
    }

    setLoading(true); 
    setResult(null); 
    setStatus('⚡ 正在加密传输战术数据...');

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || data.msg || '请求失败');

      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        try {
          const check = await fetch(`/api/result?recordId=${data.recordId}&model=${encodeURIComponent(formData.model)}`);
          const checkData = await check.json();
          
          if (checkData.status === 'done') {
            clearInterval(interval);
            setResult(checkData.data);
            saveToHistory(checkData.data, formData);
            setLoading(false);
            setStatus('✅ 战术分析完成。');
          } else {
             const loadingTexts = [
               '正在扫描竞品 ASIN 数据...', 
               'AI 神经网络正在生成策略...', 
               '正在构建视觉模型...',
               `数据同步中 [${checkData.currentStatus || '处理中'}]`
             ];
             setStatus(`🛰️ ${loadingTexts[attempts % loadingTexts.length]}`);
          }
        } catch (e) { console.error(e); }
      }, 3000);
    } catch (error: any) {
      setStatus(`❌ 系统故障: ${error.message}`); setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#050505] text-gray-200 font-sans overflow-hidden selection:bg-red-900 selection:text-white">
      {/* 背景层 */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070")', filter: 'grayscale(100%) contrast(120%)' }} />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/95 to-[#1a0505]/90 backdrop-blur-sm" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(30,30,30,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(30,30,30,0.5)_1px,transparent_1px)] bg-[size:40px_40px] opacity-10" />
      </div>

      {/* 侧边栏 */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-72 bg-black/60 backdrop-blur-xl border-r border-white/10 transform transition-transform duration-300 md:relative md:translate-x-0 flex flex-col ${showHistoryMobile ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-white/10 flex justify-between items-center text-red-500 font-bold tracking-wider text-xl">
          <div className="flex gap-2"><Cpu className="animate-pulse" /> XIB

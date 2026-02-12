"use client";

import { useState } from 'react';
// 引入漂亮的图标
import { 
  Loader2, Send, Sparkles, Search, Tag, 
  Target, Users, DollarSign, MessageSquareText,
  Heading, ListChecks, FileText, Image as ImageIcon, LayoutTemplate,
  Lightbulb, ArrowLeft
} from 'lucide-react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<any>(null);

  const [formData, setFormData] = useState({
    model: '', asin: '', type: '', features: '', 
    scenario: '', audience: '', price: '', rufusQuestions: ''
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setStatus('正在提交任务...');

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAnalyzing(true);
      setStatus('任务已提交，AI 深度分析中...');
      
      // 轮询逻辑
      const interval = setInterval(async () => {
        try {
          const check = await fetch(`/api/result?recordId=${data.recordId}&model=${encodeURIComponent(formData.model)}`);
          const checkData = await check.json();
          
          if (checkData.status === 'done') {
            clearInterval(interval);
            setResult(checkData.data);
            setAnalyzing(false);
            setLoading(false);
            setStatus('分析完成！');
          } else if (checkData.status === 'processing') {
             setStatus(checkData.currentStatus === 'AI分析中...' ? '🤖 AI 正在生成策略与文案 (约需30-60秒)...' : `当前状态: ${checkData.currentStatus}`);
          }
        } catch (e) { console.error(e); }
      }, 3000);

    } catch (error: any) {
      setStatus(`❌ 出错: ${error.message}`);
      setLoading(false);
      setAnalyzing(false);
    }
  };

  const handleChange = (e: any) => setFormData({...formData, [e.target.name]: e.target.value});

  // 输入框组件（为了复用样式）
  const InputField = ({ label, name, icon: Icon, placeholder, required = true, type = 'text', isTextArea = false }: any) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 flex items-center gap-1.5">
        <Icon className="w-4 h-4 text-indigo-500" />
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {isTextArea ? (
        <textarea
          name={name}
          required={required}
          value={formData[name as keyof typeof formData]}
          onChange={handleChange}
          placeholder={placeholder}
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-y text-gray-800 placeholder-gray-400 bg-gray-50/50"
        />
      ) : (
        <input
          type={type}
          name={name}
          required={required}
          value={formData[name as keyof typeof formData]}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-800 placeholder-gray-400 bg-gray-50/50"
        />
      )}
    </div>
  );

  return (
    <main className="py-12 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        
        {/* 头部标题 */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-indigo-100 rounded-2xl">
              <Sparkles className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-4">
            亚马逊选品<span className="text-indigo-600">智能分析师</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            输入基础信息，AI 将为你生成深度竞品分析、Listing 文案及视觉策略。
          </p>
        </div>

        {/* 主体内容区域：根据是否有结果切换显示 */}
        <div className={`transition-all duration-500 ${result ? 'opacity-0 translate-y-4 hidden' : 'opacity-100 translate-y-0'}`}>
          {!result && (
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8 sm:p-10">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* 第一组：核心信息 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="产品型号" name="model" icon={Tag} placeholder="例如: G7-Pro Wireless" />
                    <InputField label="竞品 ASIN" name="asin" icon={Search} placeholder="例如: B0C5T9JM59" />
                  </div>

                  {/* 第二组：定位信息 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InputField label="产品类型" name="type" icon={Target} placeholder="例如: 游戏耳机" />
                    <InputField label="目标定价" name="price" icon={DollarSign} placeholder="例如: 59.99" type="number" />
                    <InputField label="目标人群" name="audience" icon={Users} placeholder="例如: 硬核玩家" />
                  </div>

                  {/* 第三组：详细描述 */}
                  <div className="space-y-6">
                    <InputField label="核心功能点" name="features" icon={ListChecks} placeholder="例如: 主动降噪, 40小时续航, 蓝牙5.3" />
                    <InputField label="主要使用场景" name="scenario" icon={ImageIcon} placeholder="例如: 电竞房, 地铁通勤" />
                    <InputField label="Rufus / 用户关切问题" name="rufusQuestions" icon={MessageSquareText} placeholder="例如: 戴眼镜佩戴是否舒适？麦克风收音效果如何？" isTextArea={true} required={false} />
                  </div>

                  {/* 提交按钮 */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-lg ${
                      loading 
                        ? 'bg-indigo-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 hover:shadow-indigo-500/30'
                    }`}
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>AI 深度思考中 (预计40秒)...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-6 h-6" />
                        <span>开始智能分析</span>
                      </>
                    )}
                  </button>
                </form>

                {/* 状态提示条 */}
                {status && (
                  <div className={`mt-6 p-4 rounded-xl flex items-center justify-center gap-2 text-sm font-medium animate-pulse ${
                    status.includes('❌') ? 'bg-red-50 text-red-700' : 
                    analyzing ? 'bg-indigo-50 text-indigo-700' : 'bg-green-50 text-green-700'
                  }`}>
                    {analyzing && <Loader2 className="w-4 h-4 animate-spin" />}
                    {status}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 结果展示区域 */}
        {result && (
          <div className="space-y-8 animate-fadeIn">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                  分析报告已生成
                </h2>
                <button 
                  onClick={() => {setResult(null); setLoading(false); setStatus('');}} 
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  分析下一个
                </button>
             </div>
            
            <ResultSection title="Listing 标题 (Title)" icon={Heading} content={result["标题"]} reason={result["标题理由"]} delay={1} />
            <ResultSection title="五点描述 (Bullet Points)" icon={ListChecks} content={result["五点描述"]} reason={result["五点描述理由"]} delay={2} />
            <ResultSection title="商品描述 (Description)" icon={FileText} content={result["商品描述"]} reason={result["商品描述理由"]} delay={3} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResultSection title="主图设计方向" icon={ImageIcon} content={result["主图设计方向"]} reason={result["主图设计方向理由"]} delay={4} />
              <ResultSection title="A+ 页面策略" icon={LayoutTemplate} content={result["A+设计方向"]} reason={result["A+设计方向理由"]} delay={5} />
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

// 美化后的结果板块组件
function ResultSection({ title, icon: Icon, content, reason, delay }: any) {
  if (!content) return null;
  return (
    <div 
      className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300"
      style={{ animation: `fadeInUp 0.6s ease-out ${delay * 0.1}s backwards` }}
    >
      <div className="px-6 py-4 bg-gray-50/80 border-b border-gray-100 flex items-center gap-3">
        <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600">
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      </div>
      
      <div className="p-6">
        <div className="prose max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed">
          {content}
        </div>
        
        {reason && (
          <div className="mt-6 flex gap-3 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 text-indigo-900">
            <Lightbulb className="w-5 h-5 shrink-0 text-indigo-600 mt-0.5" />
            <div>
              <div className="font-bold mb-1 text-sm uppercase tracking-wider text-indigo-700">AI 策略洞察</div>
              <div className="text-sm leading-relaxed opacity-90">{reason}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 解构出数据
    const { model, asin, type, features, scenario, audience, price, rufusQuestions } = body;

    // 检查 Webhook 是否配置
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) throw new Error('N8N Webhook URL not configured');

    console.log("Sending to n8n:", { model, asin, type }); // 方便在 Vercel 日志里调试

    // --- 关键修改：参数名改回 n8n 熟悉的样子 ---
    // 以前发的是什么，现在就发什么，不要改名！
    const n8nPayload = {
      model: model,           // 之前叫 modelName，改回 model
      asin: asin,            // 保持 asin
      type: type,            // 之前叫 productType，改回 type
      price: price,          // 之前叫 targetPrice，改回 price
      features: features,    // 保持 features
      scenario: scenario,    // 之前叫 usageScenario，改回 scenario
      audience: audience,    // 之前叫 targetAudience，改回 audience
      rufusQuestions: rufusQuestions,
      timestamp: new Date().toISOString()
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(n8nPayload),
    });

    // 处理 n8n 的响应
    if (!response.ok) {
        throw new Error(`N8N responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

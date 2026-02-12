import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { model, asin, type, features, scenario, audience, price, rufusQuestions } = body;

    // 发送给 n8n
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) throw new Error('N8N Webhook URL not configured');

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modelName: model,
        asin: asin,
        productType: type,
        targetPrice: price,
        features: features,
        usageScenario: scenario,
        targetAudience: audience,
        rufusQuestions: rufusQuestions,
        timestamp: new Date().toISOString()
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

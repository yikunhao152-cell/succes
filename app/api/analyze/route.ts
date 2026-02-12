import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { model, asin, type, features, scenario, audience, price, rufusQuestions } = body;

    const tokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        app_id: process.env.FEISHU_APP_ID, 
        app_secret: process.env.FEISHU_APP_SECRET 
      }),
    });
    const tokenData = await tokenRes.json();
    const accessToken = (tokenData as any).tenant_access_token;

    // ⚠️ 严格匹配 image_0bb362.png 里的表头
    const fields = {
      "型号": model,
      "竞品ASIN": asin,
      "产品类型": type,
      "目标定价": String(price),
      "功能点": features,
      "使用场景": scenario,
      "目标人群": audience,
      "竞品rufusi问题": rufusQuestions, // 严格匹配截图里的 rufusi
      "状态": "AI分析中..." 
    };

    const createRes = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${process.env.FEISHU_APP_TOKEN}/tables/${process.env.FEISHU_TABLE_ID}/records`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields: fields })
    });

    const createData = await createRes.json();
    if ((createData as any).code !== 0) throw new Error((createData as any).msg);

    return NextResponse.json({ success: true, model: model });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

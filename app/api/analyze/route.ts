import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { model, asin, type, features, scenario, audience, price, rufusQuestions } = body;

    // 获取 Token
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

    // 2. 构造数据 (严格匹配你的表一最新截图)
    const fields = {
      "型号": model,                     // 严格匹配：型号
      "竞品ASIN": asin,
      "产品类型": type,
      "目标定价": String(price),          // 发送文本格式
      "功能点": features,                 // 无“核心”
      "使用场景": scenario,               // 无“主要”
      "目标人群": audience,
      "竞品rufusi问题": rufusQuestions,   // 严格匹配特殊的拼写
      "状态": "AI分析中..." 
    };

    // 写入飞书表 1
    const createRes = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${process.env.FEISHU_APP_TOKEN}/tables/${process.env.FEISHU_TABLE_ID}/records`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields: fields })
    });

    const createData = await createRes.json();

    if ((createData as any).code !== 0) {
      throw new Error(`写入失败: ${(createData as any).msg}`);
    }

    return NextResponse.json({ success: true, model: model });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

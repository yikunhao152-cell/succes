import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { model, asin, type, features, scenario, audience, price, rufusQuestions } = body;

    // 1. 获取飞书 Tenant Access Token
    const tokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        app_id: process.env.FEISHU_APP_ID, 
        app_secret: process.env.FEISHU_APP_SECRET 
      }),
    });
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.tenant_access_token;

    // 2. 构造要写入飞书表 1 的数据
    // 注意：这里的 Key 必须和你飞书表 1 的【列名】完全一致！
    const fields = {
      "型号": model,
      "竞品ASIN": asin,
      "产品类型": type,
      "目标定价": Number(price), // 飞书数字列需要数字类型
      "目标人群": audience,
      "核心功能点": features,
      "主要使用场景": scenario,
      "Rufus / 用户关切问题": rufusQuestions,
      "状态": "AI分析中..." // 给个初始状态，让前端知道开始了
    };

    // 3. 直接写入飞书表 1 (Create Record)
    // 使用 POST 方法，这保证了每次都是【新增一行】，绝对不会覆盖第一行！
    const createRes = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${process.env.FEISHU_APP_TOKEN}/tables/${process.env.FEISHU_TABLE_ID}/records`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields: fields })
    });

    const createData = await createRes.json();

    if (createData.code !== 0) {
      console.error("Feishu Create Error:", createData);
      throw new Error(`写入飞书失败: ${createData.msg}`);
    }

    // 4. 返回 record_id 给前端，前端拿这个 ID 去轮询表 3
    const recordId = createData.data.record.record_id;
    console.log("Created Feishu Record:", recordId);

    // 这里我们不再直接调 n8n，而是假设飞书里的自动化监听到“新记录”后会自动触发 n8n
    // 或者你在飞书里手动点按钮。
    // 前端只管拿到 recordId 开始等结果。

    return NextResponse.json({ 
      success: true, 
      recordId: recordId,
      msg: "已写入飞书，等待自动化分析..." 
    });
    
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

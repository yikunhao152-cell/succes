import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { model, asin, type, features, scenario, audience, price, rufusQuestions } = body;

    // 1. 获取飞书 Token
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

    // 2. 构造数据 (严格匹配你的表一截图)
    // 根据截图 image_0bb362.png，列名如下：
    const fields = {
      "型号": model,
      "竞品ASIN": asin,
      "产品类型": type,
      "目标定价": String(price),      // 截图显示左对齐，作为文本发送最稳妥
      "功能点": features,             // 截图确认：无“核心”
      "使用场景": scenario,           // 截图确认：无“主要”
      "目标人群": audience,
      "竞品rufusi问题": rufusQuestions, // 截图确认：是 rufusi
      "状态": "AI分析中..."           // 写入这个状态，作为“开始分析”的信号
    };

    console.log("准备写入表一:", fields);

    // 3. 写入飞书表 1 (Create Record)
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
      console.error("写入表一失败:", createData);
      throw new Error(`写入失败: ${createData.msg}。请检查列名是否完全一致。`);
    }

    // 这里我们不需要 recordId 来查表三，因为表三是新生成的记录，ID不一样。
    // 我们将使用“型号”来去表三里找对应的数据。
    console.log("写入表一成功，型号:", model);

    return NextResponse.json({ 
      success: true, 
      msg: "已触发分析流程" 
    });
    
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

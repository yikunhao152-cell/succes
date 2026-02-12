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

    // 2. 构造数据
    // ⚠️ 严格指令：必须与飞书表头完全一致，不包含任何多余字符
    const fields = {
      "型号": model,
      "竞品ASIN": asin,
      "产品类型": type,
      "目标定价": String(price),      // 指令：代码里要发文本
      "功能点": features,             // 指令：无“核心”二字
      "使用场景": scenario,           // 指令：无“主要”二字
      "目标人群": audience,
      "竞品rufusi问题": rufusQuestions, // 指令：严格匹配 "rufusi"
      "状态": "AI分析中..." 
    };

    console.log("正在写入飞书字段:", Object.keys(fields)); 

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
      console.error("飞书写入报错:", JSON.stringify(createData));
      throw new Error(`写入飞书失败: ${createData.msg}`);
    }

    const recordId = createData.data.record.record_id;
    console.log("写入成功，Record ID:", recordId);

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

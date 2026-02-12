import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. 获取飞书 Token
    const tokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: process.env.FEISHU_APP_ID,
        app_secret: process.env.FEISHU_APP_SECRET,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.tenant_access_token) throw new Error('飞书认证失败: ' + JSON.stringify(tokenData));
    const accessToken = tokenData.tenant_access_token;

    // 2. 写入飞书表 1
    const addRes = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${process.env.FEISHU_APP_TOKEN}/tables/${process.env.FEISHU_TABLE_ID}/records`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${accessToken}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        fields: {
          "型号": body.model,
          "竞品ASIN": body.asin,
          "产品类型": body.type,
          "功能点": body.features,
          "使用场景": body.scenario,
          "目标人群": body.audience,
          "目标定价": body.price,
          "竞品rufus问题": body.rufusQuestions // ✅ 新增：写入这一列
        }
      }),
    });

    const addData = await addRes.json();
    if (addData.code !== 0) throw new Error('飞书写入失败: ' + addData.msg);
    
    const recordId = addData.data.record.record_id;
    console.log("飞书写入成功，Record ID:", recordId);

    // 3. 触发 n8n
    const n8nRes = await fetch(process.env.N8N_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        record_id: recordId 
      }),
    });

    if (!n8nRes.ok) throw new Error(`n8n 触发失败: ${n8nRes.statusText}`);

    return NextResponse.json({ success: true, recordId });

  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

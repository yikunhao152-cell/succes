import { NextRequest, NextResponse } from 'next/server';

// 强制指定为动态路由
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const recordId = searchParams.get('recordId');
  const model = searchParams.get('model');

  // 1. 安全校验：如果没有参数，直接返回错误
  if (!recordId || !model) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  // 2. 获取环境变量 (使用 || '' 防止 undefined 报错)
  const APP_ID = process.env.FEISHU_APP_ID || '';
  const APP_SECRET = process.env.FEISHU_APP_SECRET || '';
  const APP_TOKEN = process.env.FEISHU_APP_TOKEN || '';
  const TABLE_ID = process.env.FEISHU_TABLE_ID || '';
  const TABLE_3_ID = process.env.FEISHU_TABLE_3_ID || '';

  try {
    // 3. 获取飞书 Token
    const tokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET }),
    });
    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.tenant_access_token;

    // 4. 查表 1 状态
    const checkRes = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records/${recordId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const checkJson = await checkRes.json();
    // 使用 any 绕过复杂的飞书类型定义
    const recordStatus = (checkJson as any).data?.record?.fields?.["状态"];

    if (recordStatus !== '✅ 已生成') {
      return NextResponse.json({ status: 'processing', currentStatus: recordStatus || '计算中' });
    }

    // 5. 查表 3 结果
    const searchRes = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_3_ID}/records?pageSize=50`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const searchJson = await searchRes.json();
    const items = (searchJson as any).data?.items || [];
    
    // 6. 匹配结果
    const match = items.reverse().find((i: any) => 
      String(i.fields["型号"] || "").trim().toLowerCase() === String(model).trim().toLowerCase()
    );

    if (match) {
      return NextResponse.json({ status: 'done', data: match.fields });
    } else {
      return NextResponse.json({ status: 'processing', currentStatus: '数据同步中' });
    }

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

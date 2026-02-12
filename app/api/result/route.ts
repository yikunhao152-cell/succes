import { NextRequest, NextResponse } from 'next/server';

// 强制动态模式
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const model = searchParams.get('model');

  if (!model) {
    return NextResponse.json({ error: 'Missing model parameter' }, { status: 400 });
  }

  try {
    // 1. 获取 Token
    // 加上 || '' 防止环境变量未定义时 TS 报错
    const APP_ID = process.env.FEISHU_APP_ID || '';
    const APP_SECRET = process.env.FEISHU_APP_SECRET || '';
    const APP_TOKEN = process.env.FEISHU_APP_TOKEN || '';
    const TABLE_3_ID = process.env.FEISHU_TABLE_3_ID || '';

    const tokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        app_id: APP_ID, 
        app_secret: APP_SECRET 
      }),
    });
    const tokenJson = await tokenRes.json();
    // ⚠️ 关键修复：(tokenJson as any) 用于绕过类型检查
    const accessToken = (tokenJson as any).tenant_access_token;

    // 2. 查表三
    const filter = `CurrentValue.[型号]="${model}"`;
    const searchUrl = `https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_3_ID}/records?filter=${encodeURIComponent(filter)}&sort=["CreatedTime DESC"]&pageSize=1`;

    const searchRes = await fetch(searchUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    const searchJson = await searchRes.json();
    // ⚠️ 关键修复：(searchJson as any) 用于绕过类型检查
    const searchData = searchJson as any;

    if (searchData.code !== 0) {
      console.error("查表三报错:", searchData);
      return NextResponse.json({ status: 'processing', currentStatus: '查询异常' });
    }

    const items = searchData.data?.items || [];

    if (items.length > 0) {
      // 找到了数据！
      const fields = items[0].fields;
      
      const mappedResult = {
        "标题": fields["标题"],
        "标题理由": fields["标题理由"],
        "五点描述": fields["五点描述"] || fields["五点"], 
        "五点描述理由": fields["五点描述理由"] || fields["五点理由"],
        "商品描述": fields["商品描述"],
        "商品描述理由": fields["商品描述理由"],
        "主图设计方向": fields["主图设计方向"],
        "主图设计方向理由": fields["主图设计方向理由"],
        "A+设计方向": fields["A+设计方向"],
        "A+设计方向理由": fields["A+设计方向理由"]
      };
      
      return NextResponse.json({ status: 'done', data: mappedResult });
    } else {
      return NextResponse.json({ status: 'processing', currentStatus: '等待自动化写入表三...' });
    }

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message || 'Unknown Error' }, { status: 500 });
  }
}

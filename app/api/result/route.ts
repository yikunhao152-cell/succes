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
    const tokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        app_id: process.env.FEISHU_APP_ID, 
        app_secret: process.env.FEISHU_APP_SECRET 
      }),
    });
    const tokenJson = await tokenRes.json();
    const accessToken = (tokenJson as any).tenant_access_token; // 👈 加上 as any 防止报错

    // 2. 查表三 (Output Table)
    const TABLE_3_ID = process.env.FEISHU_TABLE_3_ID; 
    const filter = `CurrentValue.[型号]="${model}"`;
    
    const searchUrl = `https://open.feishu.cn/open-apis/bitable/v1/apps/${process.env.FEISHU_APP_TOKEN}/tables/${TABLE_3_ID}/records?filter=${encodeURIComponent(filter)}&sort=["CreatedTime DESC"]&pageSize=1`;

    const searchRes = await fetch(searchUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    const searchJson = await searchRes.json();
    const searchData = searchJson as any; // 👈 关键修复：强制类型转换，解决 Type error

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

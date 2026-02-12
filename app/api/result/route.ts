import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const model = searchParams.get('model');

  if (!model) return NextResponse.json({ error: 'Missing model' }, { status: 400 });

  try {
    const tokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        app_id: process.env.FEISHU_APP_ID, 
        app_secret: process.env.FEISHU_APP_SECRET 
      }),
    });
    const accessToken = ((await tokenRes.json()) as any).tenant_access_token;

    // 查表三：根据型号过滤
    const TABLE_3_ID = process.env.FEISHU_TABLE_3_ID; 
    const filter = `CurrentValue.[型号]="${model}"`;
    const searchRes = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${process.env.FEISHU_APP_TOKEN}/tables/${TABLE_3_ID}/records?filter=${encodeURIComponent(filter)}&sort=["CreatedTime DESC"]&pageSize=1`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    const searchJson = (await searchRes.json()) as any;

    if (searchJson.code !== 0) return NextResponse.json({ status: 'processing' });

    const items = searchJson.data?.items || [];
    if (items.length > 0) {
      const fields = items[0].fields;
      return NextResponse.json({ 
        status: 'done', 
        data: {
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
        }
      });
    }
    return NextResponse.json({ status: 'processing', currentStatus: 'AI分析中...' });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const model = searchParams.get('model');

  if (!model) return NextResponse.json({ error: 'Missing model' }, { status: 400 });

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
    const accessToken = (await tokenRes.json()).tenant_access_token;

    // 2. 查表三 (Output Table)
    // 只要型号匹配的记录
    const TABLE_3_ID = process.env.FEISHU_TABLE_3_ID; 
    
    // 使用 filter 参数直接在飞书端筛选，效率更高
    // 筛选条件：CurrentValue.[型号] = "输入的型号"
    const filter = `CurrentValue.[型号]="${model}"`;
    const searchRes = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${process.env.FEISHU_APP_TOKEN}/tables/${TABLE_3_ID}/records?filter=${encodeURIComponent(filter)}&sort=["CreatedTime DESC"]&pageSize=1`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    const searchJson = await searchRes.json();

    if (searchJson.code !== 0) {
      console.error("查表三报错:", searchJson);
      return NextResponse.json({ status: 'processing', currentStatus: '查询错误' });
    }

    const items = searchJson.data?.items || [];

    if (items.length > 0) {
      // 找到了！
      const fields = items[0].fields;
      
      // 映射数据：防止表头名字有细微差别，这里做一个容错映射
      const mappedResult = {
        "标题": fields["标题"],
        "标题理由": fields["标题理由"],
        // 兼容 '五点' 和 '五点描述'
        "五点描述": fields["五点描述"] || fields["五点"] || fields["五点文案"], 
        "五点描述理由": fields["五点描述理由"] || fields["五点理由"],
        "商品描述": fields["商品描述"],
        "商品描述理由": fields["商品描述理由"],
        "主图设计方向": fields["主图设计方向"] || fields["主图方向"],
        "主图设计方向理由": fields["主图设计方向理由"],
        "A+设计方向": fields["A+设计方向"] || fields["A+页面"],
        "A+设计方向理由": fields["A+设计方向理由"]
      };
      
      return NextResponse.json({ status: 'done', data: mappedResult });
    } else {
      // 还没生成
      return NextResponse.json({ status: 'processing', currentStatus: 'AI 正在撰写文案...' });
    }

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

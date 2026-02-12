import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const recordId = searchParams.get('recordId');
  const model = searchParams.get('model');

  // 简单的参数校验
  if (!recordId || !model) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  try {
    // 1. 获取 Token (这是通行证)
    const tokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: process.env.FEISHU_APP_ID,
        app_secret: process.env.FEISHU_APP_SECRET,
      }),
    });
    const accessToken = (await tokenRes.json()).tenant_access_token;

    // 2. 检查表1状态 (看 AI 做完没)
    const checkRes = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${process.env.FEISHU_APP_TOKEN}/tables/${process.env.FEISHU_TABLE_ID}/records/${recordId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const checkJson = await checkRes.json();
    const status = checkJson.data?.record?.fields?.["状态"];

    // 调试：在 Vercel 后台打印状态
    console.log(`正在查询 - 型号: ${model}, 表1状态: ${status}`);

    if (status !== '✅ 已生成') {
      return NextResponse.json({ status: 'processing', currentStatus: status || '等待中' });
    }

    // 3. 暴力查询表3 (不筛选、不排序，直接抓最新的 50 条自己找)
    // 这样可以避免"字段不存在"导致的报错
    const TABLE_3_ID = "tblmSxFjwz615lPX"; // 你的表3 ID

    const searchRes = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${process.env.FEISHU_APP_TOKEN}/tables/${TABLE_3_ID}/records?pageSize=50`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const searchData = await searchRes.json();

    if (!searchData.data?.items) {
      console.error("表3读取失败:", JSON.stringify(searchData));
      return NextResponse.json({ status: 'processing', msg: '读取表3失败，重试中...' });
    }

    // 4. 在代码里手动查找匹配"型号"的那一行
    // 我们找最新的一个匹配项（倒序查找）
    const items = searchData.data.items;
    const match = items.reverse().find((item: any) => {
      // 容错处理：去除空格，转成字符串再比对
      const dbModel = String(item.fields["型号"] || "").trim();
      const targetModel = String(model).trim();
      return dbModel === targetModel;
    });

    if (match) {
      console.log("✅ 找到结果！", match.record_id);
      return NextResponse.json({ status: 'done', data: match.fields });
    } else {
      console.log("❌ 表1好了，但表3里没找到这个型号:", model);
      return NextResponse.json({ status: 'processing', msg: '等待数据同步写入表3...' });
    }

  } catch (error: any) {
    console.error("系统错误:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

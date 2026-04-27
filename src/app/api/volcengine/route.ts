import { NextResponse } from 'next/server';
import { Service } from '@volcengine/openapi';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 使用环境变量存储 AK/SK（不要硬编码！）
    const service = new Service({
      accessKeyId: process.env.VOLC_ACCESS_KEY_ID!,
      secretKey: process.env.VOLC_SECRET_ACCESS_KEY!,
      region: process.env.REGION,
      serviceName: 'vke', // 容器服务 VKE
    });

    // 创建API函数并调用
    const listClustersApi = service.createJSONAPI('ListClusters', {
      Version: '2022-05-12',
      method: 'POST'
    });

    const response = await listClustersApi(body);

    return NextResponse.json(response);
  } catch (error) {
    console.error('API调用失败:', error);
    return NextResponse.json({ error: error?.toString() || '请求失败' }, { status: 500 });
  }
}

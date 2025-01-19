// 一、Worker 代码（worker.js）：
/**
 * Cloudflare Worker 配置说明
 * 
 * 需要在 Cloudflare Dashboard 中配置以下环境变量：
 * 
 * 必需变量：
 * - S3_ENDPOINT: S3 兼容存储的访问端点
 *   示例: https://xxx.r2.cloudflarestorage.com
 * 
 * - S3_BUCKET: 存储桶名称
 *   示例: my-image-bucket
 * 
 * - S3_ACCESS_KEY: 访问密钥 ID
 *   示例: 69ABCDEFGHIJKLMNOPQRS
 * 
 * - S3_SECRET_KEY: 访问密钥密文
 *   示例: AbCdEfGhIjKlMnOpQrStUvWxYz1234567890AbCd
 * 
 * 可选变量：
 * - ALLOWED_ORIGINS: 允许的跨域访问源（默认为 *）
 *   示例: https://your-domain.com
 * 
 * - CACHE_TTL: 缓存时间（秒），默认 31536000（1年）
 *   示例: 86400
 */

// 辅助函数：生成 AWS 签名所需的日期字符串
function getAmzDate() {
  return new Date().toISOString()
    .replace(/[:-]|\.\d{3}/g, '')
    .slice(0, 16);
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const key = decodeURIComponent(url.pathname.slice(1));

      if (!key) {
        return new Response('Not Found', { status: 404 });
      }

      // 验证必需的环境变量
      if (!env.S3_ENDPOINT || !env.S3_BUCKET || !env.S3_ACCESS_KEY) {
        console.error('Missing required environment variables');
        return new Response('Server Configuration Error', { status: 500 });
      }

      // 构建 S3 URL
      const s3Url = `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${key}`;
      const amzDate = getAmzDate();

      // 获取图片
      const response = await fetch(s3Url, {
        headers: {
          'Host': new URL(env.S3_ENDPOINT).host,
          'x-amz-date': amzDate,
        },
        cf: {
          // 使用配置的缓存时间或默认值
          cacheTtl: parseInt(env.CACHE_TTL) || 31536000,
          cacheEverything: true
        }
      });

      if (!response.ok) {
        return new Response('Image not found', { 
          status: 404,
          headers: {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': env.ALLOWED_ORIGINS || '*'
          }
        });
      }

      // 设置响应头
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', `public, max-age=${env.CACHE_TTL || 31536000}`);
      headers.set('Access-Control-Allow-Origin', env.ALLOWED_ORIGINS || '*');
      headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      headers.set('Access-Control-Max-Age', '86400');

      return new Response(response.body, {
        headers,
        status: 200
      });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Server Error', { 
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': env.ALLOWED_ORIGINS || '*'
        }
      });
    }
  }
};

//二、在 Cloudflare Dashboard 中配置：
//1. 登录 Cloudflare Dashboard
//2. 进入 Workers & Pages
//3. 创建新的 Worker
//4. 部署上面的代码
//5. 配置环境变量：

//三、配置自定义域名：
//   - S3_ENDPOINT: 你的 S3 端点
//   - S3_BUCKET: 存储桶名称
//   - S3_ACCESS_KEY: 访问密钥
//   - S3_SECRET_KEY: 密钥
//1. 在 DNS 设置中添加记录：
//   类型: CNAME
//   名称: cdn（或你想要的子域名）
//   目标: your-worker.workers.dev
//   代理状态: 已代理
//
//2. 在 Worker 设置中：
//   - 转到 Triggers > Custom Domains
//   - 添加你的自定义域名

// 这个 Worker 提供了：
//自动缓存（提升访问速度）
//CORS 支持（允许跨域访问）
//错误处理
//URL 解码（支持中文文件名）
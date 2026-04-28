# Next.js 特殊检查项

- [ ] Server Component 是否错误地使用了 `'use client'`？
- [ ] 图片是否优先使用 `next/image` 而不是 `<img>`？
- [ ] API 密钥是否通过环境变量注入，而不是写死在代码中？
- [ ] 是否在 Server Action 外部直接调用了数据库？
- [ ] `app` 路由中的数据获取是否放在正确层级（服务端优先）？
- [ ] API Route/Route Handler 是否统一处理错误并返回稳定 JSON 结构？

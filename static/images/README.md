# 静态图片说明

## 公众号二维码图片

### 文件位置
- ~~`wechat-qr.png` - 公众号关注二维码~~ (已迁移)
- **新位置**: `/static/qrcode/wechat-qrcode.jpg`

### 使用说明
**注意**: 公众号二维码已迁移到 `/static/qrcode/wechat-qrcode.jpg`，请将您的公众号二维码图片放置在 `/static/qrcode/` 目录下。

### 图片要求
- 格式：PNG
- 尺寸：建议 200x200 像素或更大
- 内容：包含完整的公众号二维码信息
- 质量：清晰可扫描

### 替代方案
如果暂时没有公众号二维码图片，可以：
1. 使用占位符图片
2. 在 result.vue 中临时隐藏二维码区域
3. 通过URL动态加载二维码图片

### 相关文件
- `car-new-demo/pagesD/reservation/result.vue` - 使用此图片的页面
- ~~路径引用：`/static/images/wechat-qr.png`~~ (已更新)
- **新路径引用**: `/static/qrcode/wechat-qrcode.jpg` 
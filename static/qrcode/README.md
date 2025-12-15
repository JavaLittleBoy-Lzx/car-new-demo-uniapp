# 公众号二维码图片

## 使用说明

请将您的微信公众号二维码图片命名为 `wechat-qrcode.jpg` 并放置在此目录下。

## 图片要求

- **文件名**: `wechat-qrcode.jpg`
- **格式**: JPG、PNG 均可
- **尺寸**: 建议 400x400 像素
- **大小**: 建议不超过 500KB

## 获取公众号二维码

1. 登录微信公众平台：https://mp.weixin.qq.com
2. 进入"设置与开发" -> "基本配置"
3. 在"账号信息"区域找到"二维码"
4. 下载并保存为 `wechat-qrcode.jpg`

## 测试模式

如果没有实际的二维码图片，测试时会显示占位图片，不影响功能测试。

## 文件路径

```
car-new-demo/
└── static/
    └── qrcode/
        ├── wechat-qrcode.jpg  ← 您的公众号二维码
        └── README.md          ← 此说明文件
``` 
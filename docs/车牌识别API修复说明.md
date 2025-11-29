# 车牌识别API修复说明

## 修复日期
2025-06-28

## 修复问题

### 1. 字段名不匹配问题
**问题**：前端发送的`detectDirection`字段在百度车牌识别API中不存在，导致API返回216201错误。

**解决方案**：
- 移除不支持的`detectDirection`字段
- 更新`PlateRecognitionRequest.java`，添加正确的API参数：
  - `multiDetect`: 是否检测多张车牌
  - `detectComplete`: 是否开启车牌遮挡检测功能
  - `detectRisk`: 是否开启车牌PS检测功能

### 2. API参数映射问题
**问题**：前端发送驼峰命名的字段，后端需要转换为下划线命名发送给百度API。

**解决方案**：
- 前端：`multiDetect` → 后端：`multi_detect`
- 前端：`detectComplete` → 后端：`detect_complete`
- 前端：`detectRisk` → 后端：`detect_risk`

### 3. 概率字段解析错误
**问题**：代码中将`probability`当作对象处理，但根据百度API文档，它是一个数组。

**解决方案**：
```java
// 修正前
JSONObject probability = plateInfo.getJSONObject("probability");
double confidence = probability.getDoubleValue("average") * 100;

// 修正后
JSONArray probabilityArray = plateInfo.getJSONArray("probability");
// 计算平均置信度
double sum = 0.0;
for (int i = 0; i < probabilityArray.size(); i++) {
    sum += probabilityArray.getDoubleValue(i);
}
confidence = (sum / probabilityArray.size()) * 100;
```

## 修改的文件

### 前端修改
1. **pages/demo/plate-scanner.vue**
   - 移除`detectDirection`字段
   - 修正API调用参数
   - 增强错误处理

### 后端修改
1. **PlateRecognitionRequest.java**
   - 移除`detectDirection`字段
   - 添加`detectComplete`和`detectRisk`字段

2. **PlateRecognitionService.java**
   - 添加带`PlateRecognitionRequest`参数的方法重载

3. **PlateRecognitionServiceImpl.java**
   - 更新方法签名支持配置参数
   - 修正API参数构建逻辑
   - 修正概率字段解析

4. **PlateRecognitionController.java**
   - 更新控制器方法调用新的服务方法
   - 增强日志记录

## 百度车牌识别API正确参数

根据官方文档：https://ai.baidu.com/ai-doc/OCR/ck3h7y191

### 请求参数
| 参数 | 是否必选 | 类型 | 说明 |
|------|----------|------|------|
| image | 是 | string | base64编码的图片数据 |
| multi_detect | 否 | string | 是否检测多张车牌，默认false |
| detect_complete | 否 | string | 是否开启车牌遮挡检测功能，默认false |
| detect_risk | 否 | string | 是否开启车牌PS检测功能，默认false |

### 返回字段
| 字段 | 类型 | 说明 |
|------|------|------|
| color | string | 车牌颜色 |
| number | string | 车牌号码 |
| probability | array | 7个数字分别为车牌中每个字符的置信度 |
| vertexes_location | array | 返回文字外接多边形顶点位置 |

## 测试验证

### 1. 启动后端服务
```bash
cd parking-demo
mvn spring-boot:run
```

### 2. 前端测试
1. 启动小程序开发工具
2. 进入车牌识别测试页面：`pages/demo/plate-scanner`
3. 点击"摄像头识别"或"相册选择"
4. 上传包含车牌的图片

### 3. 验证API调用
查看后端日志，确认：
- API参数正确构建
- 不再出现216201错误
- 成功解析识别结果

## 注意事项

1. **图片格式**：支持jpg/jpeg/png/bmp格式
2. **图片大小**：base64编码后不超过8M
3. **图片质量**：最短边至少15px，最长边最大4096px
4. **API密钥**：确保在`application.yml`中配置正确的百度AI密钥

## 错误码参考

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 216201 | 图片格式错误 | 使用JPEG、PNG、BMP格式的图片 |
| 216200 | 图片中未检测到车牌 | 确保图片中包含清晰的车牌 |
| 110 | 访问令牌无效 | 检查API密钥配置 |
| 18 | QPS限制 | 请求过于频繁，请稍后重试 | 
# 后端微信小程序码API实现建议

## 🎯 问题分析
当前 `/parking/butler/generateMiniProgramCode` 接口未返回真正的微信官方小程序码，导致前端降级到普通文本二维码。

## 🔧 完整实现方案

### 1. 添加微信配置

```yaml
# application.yml
wechat:
  miniprogram:
    appid: "你的小程序AppID"
    secret: "你的小程序AppSecret"
    # 开发环境可以先用测试账号
```

### 2. 实现access_token获取服务

```java
@Component
public class WechatAccessTokenService {
    
    @Value("${wechat.miniprogram.appid}")
    private String appId;
    
    @Value("${wechat.miniprogram.secret}")
    private String appSecret;
    
    private String accessToken;
    private long expireTime;
    
    public String getAccessToken() {
        // 检查token是否过期
        if (accessToken != null && System.currentTimeMillis() < expireTime) {
            return accessToken;
        }
        
        // 获取新的access_token
        String url = "https://api.weixin.qq.com/cgi-bin/token" +
                    "?grant_type=client_credential" +
                    "&appid=" + appId +
                    "&secret=" + appSecret;
        
        try {
            RestTemplate restTemplate = new RestTemplate();
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            
            if (response != null && response.containsKey("access_token")) {
                this.accessToken = (String) response.get("access_token");
                int expiresIn = (Integer) response.get("expires_in");
                this.expireTime = System.currentTimeMillis() + (expiresIn - 300) * 1000L; // 提前5分钟过期
                
                log.info("获取access_token成功，有效期到: {}", new Date(expireTime));
                return this.accessToken;
            } else {
                throw new RuntimeException("获取access_token失败: " + response.get("errmsg"));
            }
        } catch (Exception e) {
            log.error("调用微信API失败", e);
            throw new RuntimeException("获取access_token异常", e);
        }
    }
}
```

### 3. 修改现有的generateMiniProgramCode接口

```java
@RestController
@RequestMapping("/parking/butler")
public class ButlerController {
    
    @Autowired
    private WechatAccessTokenService accessTokenService;
    
    @GetMapping("/generateMiniProgramCode")
    public ResponseEntity<?> generateMiniProgramCode(
            @RequestParam String phone,
            @RequestParam(required = false) String community,
            @RequestParam(required = false) String province,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String building,
            @RequestParam(required = false) String units,
            @RequestParam(required = false) String floor,
            @RequestParam(required = false) String room) {
        
        try {
            // 1. 获取access_token
            String accessToken = accessTokenService.getAccessToken();
            
            // 2. 构建scene参数（简化参数避免32字符限制）
            String scene = buildScene(phone, community, building, units, floor, room);
            
            // 3. 调用微信API生成小程序码
            String wechatUrl = "https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=" + accessToken;
            
            Map<String, Object> params = new HashMap<>();
            params.put("scene", scene);
            params.put("page", "pages/auth/visitor-apply");  // 访客申请页面
            params.put("width", 430);
            params.put("auto_color", false);
            params.put("line_color", Map.of("r", 0, "g", 0, "b", 0));
            params.put("is_hyaline", false);
            
            // 4. 发送请求获取小程序码图片
            byte[] imageBytes = callWechatMiniProgramApi(wechatUrl, params);
            
            // 5. 转换为Base64返回
            String base64Image = "data:image/png;base64," + Base64.getEncoder().encodeToString(imageBytes);
            
            // 6. 构建返回数据
            Map<String, Object> resultData = new HashMap<>();
            resultData.put("type", "wechat_mini_program");
            resultData.put("qrCodeImage", base64Image);
            resultData.put("officialCode", true);  // 标记为官方小程序码
            resultData.put("scene", scene);
            resultData.put("pagePath", "pages/auth/visitor-apply");
            resultData.put("butlerPhone", phone);
            resultData.put("butlerName", getButlerNameByPhone(phone));
            resultData.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(Map.of("code", "0", "data", resultData));
            
        } catch (Exception e) {
            log.error("生成小程序码失败", e);
            
            // 🎯 重要：失败时返回特殊标记，让前端知道需要降级
            Map<String, Object> fallbackData = new HashMap<>();
            fallbackData.put("type", "text_fallback");
            fallbackData.put("officialCode", false);
            fallbackData.put("errorMessage", e.getMessage());
            fallbackData.put("butlerPhone", phone);
            fallbackData.put("butlerName", getButlerNameByPhone(phone));
            
            return ResponseEntity.ok(Map.of("code", "0", "data", fallbackData));
        }
    }
    
    /**
     * 构建场景值（最大32字符限制）
     */
    private String buildScene(String phone, String community, String building, 
                             String units, String floor, String room) {
        StringBuilder scene = new StringBuilder();
        
        // 使用简化参数名
        scene.append("bp=").append(phone.substring(Math.max(0, phone.length() - 8))); // 后8位手机号
        
        if (StringUtils.hasText(community)) {
            String shortCommunity = community.length() > 4 ? community.substring(0, 4) : community;
            scene.append("&c=").append(URLEncoder.encode(shortCommunity, StandardCharsets.UTF_8));
        }
        
        if (StringUtils.hasText(building)) {
            scene.append("&b=").append(building);
        }
        
        if (StringUtils.hasText(units)) {
            scene.append("&u=").append(units);
        }
        
        if (StringUtils.hasText(floor)) {
            scene.append("&f=").append(floor);
        }
        
        if (StringUtils.hasText(room)) {
            scene.append("&r=").append(room);
        }
        
        // 确保不超过32字符
        String result = scene.toString();
        if (result.length() > 32) {
            // 如果超长，只保留关键信息
            result = "bp=" + phone.substring(Math.max(0, phone.length() - 8));
            if (StringUtils.hasText(community)) {
                String shortCommunity = community.length() > 3 ? community.substring(0, 3) : community;
                if ((result + "&c=" + shortCommunity).length() <= 32) {
                    result += "&c=" + shortCommunity;
                }
            }
        }
        
        return result;
    }
    
    /**
     * 调用微信小程序码生成API
     */
    private byte[] callWechatMiniProgramApi(String url, Map<String, Object> params) throws Exception {
        RestTemplate restTemplate = new RestTemplate();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(params, headers);
        
        ResponseEntity<byte[]> response = restTemplate.exchange(
            url, HttpMethod.POST, entity, byte[].class);
        
        if (response.getStatusCode() == HttpStatus.OK) {
            byte[] result = response.getBody();
            
            // 检查返回的是否是错误JSON而不是图片
            if (result != null && result.length > 0) {
                // 简单检查是否是JSON错误响应
                String resultStr = new String(result, StandardCharsets.UTF_8);
                if (resultStr.startsWith("{") && resultStr.contains("errcode")) {
                    throw new RuntimeException("微信API返回错误: " + resultStr);
                }
            }
            
            return result;
        } else {
            throw new RuntimeException("调用微信API失败，状态码: " + response.getStatusCodeValue());
        }
    }
    
    /**
     * 根据手机号获取管家姓名
     */
    private String getButlerNameByPhone(String phone) {
        // 这里应该查询数据库获取管家姓名
        // 暂时返回默认值
        return "管家";
    }
}
```

## 🎯 关键改进点

### 1. 返回数据格式标准化
```json
{
  "code": "0",
  "data": {
    "type": "wechat_mini_program",        // 类型标识
    "qrCodeImage": "data:image/png;base64,xxx", // Base64图片
    "officialCode": true,                 // 是否为官方小程序码
    "scene": "bp=12345678&c=小区",        // 场景值
    "pagePath": "pages/auth/visitor-apply", // 页面路径
    "butlerPhone": "13800138000",
    "butlerName": "张管家",
    "timestamp": 1640000000000
  }
}
```

### 2. 失败时的降级数据
```json
{
  "code": "0", 
  "data": {
    "type": "text_fallback",              // 降级标识
    "officialCode": false,                // 非官方码
    "errorMessage": "具体错误信息",
    "butlerPhone": "13800138000",
    "butlerName": "张管家"
  }
}
```

## 🚀 部署建议

### 1. 测试步骤
1. 先在微信公众平台获取测试小程序的AppID和AppSecret
2. 配置到application.yml中
3. 测试access_token获取是否正常
4. 测试小程序码生成接口
5. 用微信扫码验证是否能直接跳转

### 2. 监控建议
```java
// 添加监控和日志
@RestController
public class WechatApiMonitorController {
    
    @GetMapping("/wechat/api/status")
    public ResponseEntity<?> getApiStatus() {
        // 检查access_token状态
        // 检查API调用次数和成功率
        // 返回API健康状态
    }
}
```

## ⚠️ 注意事项

1. **微信API限制**：小程序码生成有频率限制，建议添加缓存
2. **参数长度限制**：scene参数最大32字符，需要优化参数编码
3. **错误处理**：需要处理各种微信API错误情况
4. **安全性**：AppSecret不要提交到代码仓库，使用环境变量

## 📱 前端配合修改

前端需要根据返回的 `officialCode` 字段判断是否为真正的小程序码：

```javascript
if (response.data.officialCode === true) {
    // 显示官方小程序码成功提示
    uni.showToast({
        title: '✅ 微信官方小程序码生成成功！',
        icon: 'success'
    });
} else {
    // 显示降级提示
    uni.showModal({
        title: '⚠️ 降级到普通二维码',
        content: '微信官方小程序码生成失败，已生成普通二维码'
    });
}
``` 
# 后端二维码一次性使用API实现指南

## 概述

前端已实现二维码一次性使用功能，需要后端提供两个API接口来支持完整的功能。目前前端已有容错机制，即使后端接口不可用，功能仍然可以通过本地存储正常工作。

## 需要实现的API接口

### 1. 检查二维码使用状态

**接口路径**: `GET /parking/qrcode/checkUsed`

**请求参数**:
```json
{
  "qrId": "QR_1752473731552_7970_x6r0ycjbw",
  "openid": "用户微信openid"
}
```

**响应格式**:
```json
{
  "success": true,
  "data": {
    "used": true,
    "usedTime": 1752475589033,
    "usedBy": "用户openid",
    "appointmentId": "预约记录ID"
  },
  "message": "查询成功"
}
```

**数据库表结构建议**:
```sql
CREATE TABLE qr_code_usage (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    qr_id VARCHAR(100) NOT NULL UNIQUE,
    used BOOLEAN DEFAULT FALSE,
    used_time BIGINT,
    used_by VARCHAR(100),
    appointment_id VARCHAR(100),
    created_time BIGINT,
    updated_time BIGINT,
    INDEX idx_qr_id (qr_id),
    INDEX idx_used_by (used_by)
);
```

### 2. 标记二维码为已使用

**接口路径**: `POST /parking/qrcode/markUsed`

**请求参数**:
```json
{
  "qrId": "QR_1752473731552_7970_x6r0ycjbw",
  "openid": "用户微信openid",
  "action": "mark_used",
  "timestamp": 1752475589033
}
```

**响应格式**:
```json
{
  "success": true,
  "data": {
    "qrId": "QR_1752473731552_7970_x6r0ycjbw",
    "marked": true,
    "timestamp": 1752475589033
  },
  "message": "标记成功"
}
```

## Java Spring Boot 实现示例

### Controller 实现

```java
@RestController
@RequestMapping("/parking/qrcode")
public class QrCodeController {

    @Autowired
    private QrCodeUsageService qrCodeUsageService;

    /**
     * 检查二维码使用状态
     */
    @GetMapping("/checkUsed")
    public ResponseEntity<?> checkUsed(
            @RequestParam String qrId,
            @RequestParam String openid) {
        try {
            QrCodeUsage usage = qrCodeUsageService.getUsageByQrId(qrId);
            
            Map<String, Object> data = new HashMap<>();
            if (usage != null && usage.isUsed()) {
                data.put("used", true);
                data.put("usedTime", usage.getUsedTime());
                data.put("usedBy", usage.getUsedBy());
                data.put("appointmentId", usage.getAppointmentId());
            } else {
                data.put("used", false);
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", data,
                "message", "查询成功"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "查询失败: " + e.getMessage()
            ));
        }
    }

    /**
     * 标记二维码为已使用
     */
    @PostMapping("/markUsed")
    public ResponseEntity<?> markUsed(@RequestBody Map<String, Object> request) {
        try {
            String qrId = (String) request.get("qrId");
            String openid = (String) request.get("openid");
            Long timestamp = ((Number) request.get("timestamp")).longValue();
            
            // 检查是否已被使用
            QrCodeUsage existing = qrCodeUsageService.getUsageByQrId(qrId);
            if (existing != null && existing.isUsed()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "二维码已被使用"
                ));
            }
            
            // 标记为已使用
            QrCodeUsage usage = new QrCodeUsage();
            usage.setQrId(qrId);
            usage.setUsed(true);
            usage.setUsedTime(timestamp);
            usage.setUsedBy(openid);
            usage.setCreatedTime(System.currentTimeMillis());
            usage.setUpdatedTime(System.currentTimeMillis());
            
            qrCodeUsageService.saveOrUpdate(usage);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                    "qrId", qrId,
                    "marked", true,
                    "timestamp", timestamp
                ),
                "message", "标记成功"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "标记失败: " + e.getMessage()
            ));
        }
    }
}
```

### Service 实现

```java
@Service
public class QrCodeUsageService {

    @Autowired
    private QrCodeUsageRepository qrCodeUsageRepository;

    public QrCodeUsage getUsageByQrId(String qrId) {
        return qrCodeUsageRepository.findByQrId(qrId);
    }

    public void saveOrUpdate(QrCodeUsage usage) {
        QrCodeUsage existing = qrCodeUsageRepository.findByQrId(usage.getQrId());
        if (existing != null) {
            existing.setUsed(usage.isUsed());
            existing.setUsedTime(usage.getUsedTime());
            existing.setUsedBy(usage.getUsedBy());
            existing.setUpdatedTime(System.currentTimeMillis());
            qrCodeUsageRepository.save(existing);
        } else {
            qrCodeUsageRepository.save(usage);
        }
    }
}
```

### Entity 实现

```java
@Entity
@Table(name = "qr_code_usage")
public class QrCodeUsage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "qr_id", unique = true, nullable = false)
    private String qrId;
    
    @Column(name = "used")
    private boolean used = false;
    
    @Column(name = "used_time")
    private Long usedTime;
    
    @Column(name = "used_by")
    private String usedBy;
    
    @Column(name = "appointment_id")
    private String appointmentId;
    
    @Column(name = "created_time")
    private Long createdTime;
    
    @Column(name = "updated_time")
    private Long updatedTime;
    
    // Getters and Setters...
}
```

## 当前状态

### 前端容错机制
- ✅ 本地存储检查和标记功能已实现
- ✅ 后端接口404时自动降级到本地存储
- ✅ 功能在后端接口不可用时仍然正常工作
- ✅ 用户体验不受影响

### 测试建议
1. **无后端接口时**: 功能完全依赖本地存储，可以正常测试
2. **后端接口实现后**: 前端会自动使用后端接口进行同步
3. **混合模式**: 支持本地存储 + 后端同步的双重保障

## 部署建议

1. **优先级**: 这些接口不是紧急的，前端功能已经可以正常工作
2. **实现顺序**: 建议先实现 `markUsed` 接口，再实现 `checkUsed` 接口
3. **数据迁移**: 可以考虑将现有的二维码生成记录迁移到新表中

## 注意事项

1. **幂等性**: `markUsed` 接口应该支持重复调用
2. **并发控制**: 考虑多用户同时使用同一二维码的情况
3. **数据清理**: 建议定期清理过期的二维码使用记录
4. **监控**: 建议添加接口调用监控和异常告警

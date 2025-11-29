# 访客申请查询API接口文档

## 接口概述

访客查询页面需要从后端 `visitor_application` 表查询真实数据，并关联预约信息。

## API接口规范

### 1. 根据手机号查询访客申请状态（现有接口）

**接口地址：** `GET /parking/visitor/status`

**请求参数：**
```json
{
  "phone": "13593527970"  // 访客手机号
}
```

**响应格式：**
```json
{
  "success": true,
  "message": "查询成功",
  "data": {
    "phone": "13593527970",
    "hasApplication": true,
    "applicationNo": "VA20250627001",
    "status": "已通过",
    "submitTime": "2025-06-27 09:15:00",
    "fullAddress": "黑龙江省哈尔滨市某某小区",
    "auditTime": "2025-06-27 13:45:00",
    "auditUser": "系统管理员",
    "message": "恭喜！您的申请已通过审核，可以使用系统了"
  }
}
```

### 2. 根据手机号查询访客申请记录列表（建议新增）

**接口地址：** `GET /parking/visitor/records`

**请求参数：**
```json
{
  "phone": "13593527970"  // 访客手机号
}
```

**响应格式：**
```json
{
  "success": true,
  "message": "查询成功",
  "data": [
    {
      // 基本信息
      "id": "VA20250627001",                    // 申请ID（主键）
      "applicationNo": "VA20250627001",         // 申请编号
      "nickname": "汪小胖",                     // 访客姓名
      "phone": "13593527970",            // 访客手机号
      "gender": "女",                    // 访客性别
      
      // 访问信息
      "plateNumber": "黑C98765",                // 车牌号
      "fullAddress": "黑龙江省哈尔滨市某某小区",   // 访问地址
      "reason": "送货",                   // 访问目的
      
      // 时间信息
      "applydate": "2025-06-27 09:15:00", // 申请时间
      "auditdate": "2025-06-27 13:45:00",    // 审核时间
      
      // 审核信息
      "auditstatus": "已通过",                  // 审核状态文本
      "auditusername": "系统管理员",                 // 审核人
      "remark": "测试通过",                     // 备注
      "refusereason": null,                     // 拒绝原因（未通过时）
      
      // 关联的预约/停车信息（可选）
      "reservationId": "R20250627001",          // 预约ID
      "reservationTime": "2025-06-27 14:00:00", // 预约时间
      "reservationStatus": "COMPLETED",         // 预约状态
      "entryTime": "2025-06-27 14:00:00",       // 进场时间
      "exitTime": "2025-06-27 16:30:00",        // 离场时间
      
      // 系统字段
      "createTime": "2025-06-27 09:15:00",      // 创建时间
      "updateTime": "2025-06-27 13:45:00"       // 更新时间
    }
  ]
}
```

**错误响应：**
```json
{
  "success": false,
  "message": "查询失败：手机号不能为空",
  "data": null
}
```

## 后端Controller建议新增方法

为了支持访客查询所有申请记录，建议在 `VisitorApplicationController` 中添加以下方法：

```java
/**
 * 根据手机号查询访客的所有申请记录
 * 
 * @param phone 手机号
 * @return 申请记录列表
 */
@GetMapping("/records")
public Result<List<VisitorApplication>> getVisitorRecords(@RequestParam String phone) {
    logger.info("📋 查询访客申请记录列表: phone={}", phone);
    
    try {
        if (phone == null || phone.trim().isEmpty()) {
            return Result.error("手机号不能为空");
        }
        
        // 查询该手机号的所有申请记录
        List<VisitorApplication> records = visitorApplicationService.getRecordsByPhone(phone);
        
        // 按申请时间倒序排列
        records.sort((a, b) -> {
            LocalDateTime timeA = a.getApplydate() != null ? a.getApplydate() : a.getCreateTime();
            LocalDateTime timeB = b.getApplydate() != null ? b.getApplydate() : b.getCreateTime();
            return timeB.compareTo(timeA);
        });
        
        logger.info("✅ 查询到 {} 条申请记录", records.size());
        
        return Result.success(records);
        
    } catch (Exception e) {
        logger.error("❌ 查询访客申请记录失败", e);
        return Result.error("查询失败: " + e.getMessage());
    }
}
```

对应的Service方法：

```java
// 在 VisitorApplicationService 接口中添加
List<VisitorApplication> getRecordsByPhone(String phone);

// 在 VisitorApplicationServiceImpl 实现类中添加
@Override
public List<VisitorApplication> getRecordsByPhone(String phone) {
    LambdaQueryWrapper<VisitorApplication> wrapper = new LambdaQueryWrapper<>();
    wrapper.eq(VisitorApplication::getPhone, phone);
    wrapper.orderByDesc(VisitorApplication::getApplydate);
    return list(wrapper);
}
```

## 数据库表结构参考

### visitor_application 表字段

| 字段名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| id | VARCHAR(50) | 申请ID（主键） | VA20250627001 |
| visitor_name | VARCHAR(100) | 访客姓名 | 汪小胖 |
| visitor_phone | VARCHAR(20) | 访客手机号 | 13593527970 |
| visitor_gender | VARCHAR(10) | 访客性别 | 女 |
| plate_number | VARCHAR(20) | 车牌号 | 黑C98765 |
| visit_address | TEXT | 访问地址 | 黑龙江省哈尔滨市某某小区 |
| visit_purpose | VARCHAR(200) | 访问目的 | 送货 |
| application_time | DATETIME | 申请时间 | 2025-06-27 09:15:00 |
| approval_time | DATETIME | 审核时间 | 2025-06-27 13:45:00 |
| status | VARCHAR(20) | 审核状态 | APPROVED |
| approver | VARCHAR(100) | 审核人 | 系统管理员 |
| remark | TEXT | 备注 | 测试通过 |
| reject_reason | TEXT | 拒绝原因 | NULL |
| create_time | DATETIME | 创建时间 | 2025-06-27 09:15:00 |
| update_time | DATETIME | 更新时间 | 2025-06-27 13:45:00 |

### 关联预约信息（可选）

如果需要关联预约信息，可以通过以下方式：

1. **关联查询：** 通过访客手机号关联 `reservation` 表
2. **字段扩展：** 在 `visitor_application` 表中增加预约相关字段
3. **视图查询：** 创建联合查询视图

## 前端数据处理

前端会自动处理以下数据转换：

1. **状态映射：** PENDING→待审核，APPROVED→已通过，REJECTED→未通过
2. **时间格式化：** 自动格式化显示时间
3. **停车时长计算：** 根据进场和离场时间自动计算
4. **字段兼容：** 支持多种字段名称的兼容处理

## 注意事项

1. 接口需要根据用户手机号进行数据过滤，确保数据安全
2. 响应数据按申请时间倒序排列
3. 需要处理分页（如果数据量大）
4. 建议添加数据缓存机制提高性能
5. 确保敏感信息（如完整手机号）的脱敏处理

## 测试数据

可以使用以下测试数据验证接口：

- 手机号：13593527970（汪小胖、王小利的记录）
- 手机号：13800138001（张三的记录）
- 手机号：13800138002（李四的记录） 
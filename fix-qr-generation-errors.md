# 二维码生成错误修复指南

## 🚨 问题分析

您遇到了两个主要问题：

### 1. 微信Token错误
```
{"errcode":40125,"errmsg":"invalid appsecret"}
```
**原因**：微信小程序的AppSecret配置无效

### 2. 数据库字段错误
```
Unknown column 'butler_name' in 'field list'
```
**原因**：数据库表缺少必要的字段

## 🔧 解决方案

### 第一步：修复数据库表结构

1. **连接到您的MySQL数据库**
2. **执行以下SQL脚本**：

```sql
-- 修复 qr_code_usage 表结构
CREATE TABLE IF NOT EXISTS `qr_code_usage` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `qr_id` VARCHAR(64) NOT NULL COMMENT '二维码唯一标识',
    `butler_phone` VARCHAR(20) NOT NULL COMMENT '管家手机号',
    `butler_name` VARCHAR(50) COMMENT '管家姓名',
    `community` VARCHAR(100) COMMENT '小区名称',
    `building` VARCHAR(50) COMMENT '楼栋',
    `unit` VARCHAR(50) COMMENT '单元',
    `floor` VARCHAR(50) COMMENT '楼层',
    `room` VARCHAR(50) COMMENT '房间号',
    `created_time` DATETIME NOT NULL COMMENT '创建时间',
    `used_time` DATETIME COMMENT '使用时间',
    `is_used` TINYINT DEFAULT 0 COMMENT '是否已使用 0-未使用 1-已使用',
    `visitor_openid` VARCHAR(100) COMMENT '访客openid',
    `visitor_phone` VARCHAR(20) COMMENT '访客手机号',
    `qr_type` VARCHAR(20) DEFAULT 'visitor_invitation' COMMENT '二维码类型',
    `expire_time` DATETIME COMMENT '有效期至',
    `remark` VARCHAR(255) COMMENT '备注',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_qr_id` (`qr_id`),
    KEY `idx_butler_phone` (`butler_phone`),
    KEY `idx_created_time` (`created_time`),
    KEY `idx_is_used` (`is_used`),
    KEY `idx_expire_time` (`expire_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='二维码使用记录表';

-- 如果表已存在但缺少字段，添加缺少的字段
ALTER TABLE qr_code_usage ADD COLUMN IF NOT EXISTS butler_name VARCHAR(50) COMMENT '管家姓名' AFTER butler_phone;
ALTER TABLE qr_code_usage ADD COLUMN IF NOT EXISTS community VARCHAR(100) COMMENT '小区名称' AFTER butler_name;
ALTER TABLE qr_code_usage ADD COLUMN IF NOT EXISTS building VARCHAR(50) COMMENT '楼栋' AFTER community;
ALTER TABLE qr_code_usage ADD COLUMN IF NOT EXISTS unit VARCHAR(50) COMMENT '单元' AFTER building;
ALTER TABLE qr_code_usage ADD COLUMN IF NOT EXISTS floor VARCHAR(50) COMMENT '楼层' AFTER unit;
ALTER TABLE qr_code_usage ADD COLUMN IF NOT EXISTS room VARCHAR(50) COMMENT '房间号' AFTER floor;
ALTER TABLE qr_code_usage ADD COLUMN IF NOT EXISTS qr_type VARCHAR(20) DEFAULT 'visitor_invitation' COMMENT '二维码类型';
ALTER TABLE qr_code_usage ADD COLUMN IF NOT EXISTS expire_time DATETIME COMMENT '有效期至';
```

### 第二步：重启后端服务

1. **停止当前的Spring Boot应用**
2. **重新启动应用**

```bash
# 如果使用Maven
./mvnw spring-boot:run

# 或者如果已经打包
java -jar target/your-app.jar
```

### 第三步：验证修复

1. **管家生成二维码**：
   - 登录管家账号
   - 选择地址信息
   - 点击生成二维码
   - 应该能成功生成（使用普通二维码，不是微信小程序码）

2. **访客扫码测试**：
   - 访客扫码进入预约页面
   - 检查联系电话是否显示访客自己的手机号
   - 检查访问地址是否显示管家选择的地址

## 📋 当前配置状态

### ✅ 已修复的问题：
1. **联系电话问题** - 访客显示自己的手机号
2. **地址参数映射** - 修复了units/unit参数问题
3. **微信配置错误** - 暂时禁用微信API，使用普通二维码
4. **数据库字段** - 提供了完整的表结构修复脚本

### 🔄 当前使用的方案：
- **二维码类型**：普通二维码（不是微信小程序码）
- **扫码跳转**：通过浏览器打开小程序页面
- **参数传递**：URL参数方式

## 🚀 后续优化（可选）

如果您想启用微信小程序码功能：

1. **获取正确的微信配置**：
   - 登录微信公众平台：https://mp.weixin.qq.com
   - 获取正确的AppID和AppSecret
   - 更新 `application.yml` 中的配置

2. **配置服务器域名**：
   - 在微信后台添加您的域名到合法域名列表

3. **启用微信功能**：
   - 将 `application.yml` 中的 `wechat.miniapp.enabled` 设为 `true`
   - 使用正确的 `secret` 替换当前的占位符

## 🎯 测试清单

- [ ] 数据库表结构修复完成
- [ ] 后端服务重启成功
- [ ] 管家能成功生成二维码
- [ ] 访客扫码后联系电话显示正确
- [ ] 访客扫码后访问地址显示正确
- [ ] 没有数据库错误日志
- [ ] 没有微信API调用错误（因为已禁用）

完成这些步骤后，二维码功能应该能正常工作！

# visitorType 参数丢失修复说明

## 问题描述

用户反馈：在 `phone-auth.vue` 中扫描二维码时，参数包含 `visitorType: "invited"`，但授权完成后跳转到 `pagesA/reservation/form.vue` 时，这个参数变成了 `undefined`。

### 扫描时的参数（正常）

```javascript
this.scannedParams: {
  "qrId": "QR_1764754789171_7970_7q88visya",
  "visitorType": "invited",  // ✅ 有值
  "phone": "13593527970",
  "butlerName": "B栋管家",
  "building": "A",
  "unit": "1",
  "floor": "1",
  "room": "10",
  "community": "万象上东",
  // ... 其他参数
}
```

### 跳转后的参数（异常）

在 `form.vue` 中读取时：
```javascript
visitorType: undefined  // ❌ 丢失了
```

## 问题原因

### 根本原因

在 `phone-auth.vue` 中保存扫码地址信息到本地存储时，**遗漏了 `visitorType` 字段**。

### 详细分析

在 `phone-auth.vue` 中有三个地方保存 `scannedAddressInfo` 对象：

1. **位置1**: onLoad 方法中（第529-545行）
2. **位置2**: handleApplyKindNavigation 方法中（第617-636行）
3. **位置3**: authorizeAndRedirect 方法中（第3235-3256行）

这三个位置都构建了 `scannedAddressInfo` 对象，但都**没有包含 `visitorType` 字段**。

### 示例代码（修复前）

```javascript
const scannedAddressInfo = {
    applyKind: this.scannedParams.applyKind || '',
    butlerId: this.scannedParams.butlerId || '',
    community: this.scannedParams.community || '',
    building: this.scannedParams.building || '',
    unit: this.scannedParams.unit || '',
    floor: this.scannedParams.floor || '',
    room: this.scannedParams.room || '',
    butlerName: this.scannedParams.butlerName || '',
    butlerPhone: this.scannedParams.butlerPhone || '',
    visitorPhone: this.scannedParams.phone || '',
    qrId: this.scannedParams.qrId || '',
    // ❌ 缺少 visitorType 字段！
    timestamp: Date.now(),
    source: 'qr_scan'
};
```

### 后果

当 `form.vue` 从本地存储读取 `scannedAddressInfo` 时：
```javascript
const scannedAddressInfo = uni.getStorageSync('scannedAddressInfo');
const visitorType = scannedAddressInfo.visitorType; // undefined
```

由于 `visitorType` 未定义，导致：
1. 无法判断是受邀访客还是外来访客
2. 访问地址无法正确锁定
3. 地址锁定逻辑失效

## 修复方案

### 修改位置1: onLoad 方法中的保存逻辑

**文件**: `pages/auth/phone-auth.vue`  
**位置**: 第541行

**修改前**:
```javascript
const scannedAddressInfo = {
    applyKind: this.scannedParams.applyKind || '',
    butlerId: this.scannedParams.butlerId || '',
    patrolId: this.scannedParams.patrolId || '',
    community: this.scannedParams.community || '',
    building: this.scannedParams.building || '',
    unit: this.scannedParams.unit || '',
    floor: this.scannedParams.floor || '',
    room: this.scannedParams.room || '',
    butlerName: this.scannedParams.butlerName || '',
    butlerPhone: this.scannedParams.butlerPhone || this.scannedParams.phone || '',
    visitorPhone: this.scannedParams.phone || '',
    qrId: this.scannedParams.qrId || '',
    timestamp: Date.now(),
    source: 'qr_scan'
};
```

**修改后**:
```javascript
const scannedAddressInfo = {
    applyKind: this.scannedParams.applyKind || '',
    butlerId: this.scannedParams.butlerId || '',
    patrolId: this.scannedParams.patrolId || '',
    community: this.scannedParams.community || '',
    building: this.scannedParams.building || '',
    unit: this.scannedParams.unit || '',
    floor: this.scannedParams.floor || '',
    room: this.scannedParams.room || '',
    butlerName: this.scannedParams.butlerName || '',
    butlerPhone: this.scannedParams.butlerPhone || this.scannedParams.phone || '',
    visitorPhone: this.scannedParams.phone || '',
    visitorType: this.scannedParams.visitorType || '', // 🔒 访客类型（invited/external）
    qrId: this.scannedParams.qrId || '',
    timestamp: Date.now(),
    source: 'qr_scan'
};
```

### 修改位置2: handleApplyKindNavigation 方法中的保存逻辑

**文件**: `pages/auth/phone-auth.vue`  
**位置**: 第629行

**修改内容**: 同上，在保存对象中添加 `visitorType` 字段

### 修改位置3: authorizeAndRedirect 方法中的更新逻辑

**文件**: `pages/auth/phone-auth.vue`  
**位置**: 第3248行

**修改前**:
```javascript
const updatedScannedInfo = {
    ...scannedAddressInfo,
    applyKind: this.scannedParams?.applyKind || scannedAddressInfo.applyKind || '',
    butlerId: this.scannedParams?.butlerId || scannedAddressInfo.butlerId || '',
    // ... 其他字段
    qrId: this.scannedParams?.qrId || scannedAddressInfo.qrId || '',
    authorizedPhone: userInfo.phone || '',
    visitorPhone: this.scannedParams?.phone || scannedAddressInfo.visitorPhone || '',
    timestamp: scannedAddressInfo.timestamp || Date.now(),
    lastUpdated: Date.now(),
    source: scannedAddressInfo.source || 'auth_update'
};
```

**修改后**:
```javascript
const updatedScannedInfo = {
    ...scannedAddressInfo,
    applyKind: this.scannedParams?.applyKind || scannedAddressInfo.applyKind || '',
    butlerId: this.scannedParams?.butlerId || scannedAddressInfo.butlerId || '',
    // ... 其他字段
    visitorType: this.scannedParams?.visitorType || scannedAddressInfo.visitorType || '', // 🔒 访客类型
    qrId: this.scannedParams?.qrId || scannedAddressInfo.qrId || '',
    authorizedPhone: userInfo.phone || '',
    visitorPhone: this.scannedParams?.phone || scannedAddressInfo.visitorPhone || '',
    timestamp: scannedAddressInfo.timestamp || Date.now(),
    lastUpdated: Date.now(),
    source: scannedAddressInfo.source || 'auth_update'
};
```

## 修复效果

### 修复前

| 阶段 | visitorType 值 |
|------|----------------|
| 扫描二维码时 | `"invited"` ✅ |
| 保存到本地存储 | `undefined` ❌ |
| form.vue 读取 | `undefined` ❌ |
| 地址锁定判断 | 失败 ❌ |

### 修复后

| 阶段 | visitorType 值 |
|------|----------------|
| 扫描二维码时 | `"invited"` ✅ |
| 保存到本地存储 | `"invited"` ✅ |
| form.vue 读取 | `"invited"` ✅ |
| 地址锁定判断 | 成功 ✅ |

## 参数传递流程

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 扫描二维码                                                  │
│    URL 包含: visitorType=invited                              │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. phone-auth.vue 解析参数                                     │
│    this.scannedParams.visitorType = "invited"                │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. 保存到本地存储 ✅ （修复后）                                 │
│    scannedAddressInfo: {                                     │
│      visitorType: "invited",                                 │
│      building: "A",                                          │
│      unit: "1",                                              │
│      ...                                                     │
│    }                                                         │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. 授权完成，更新本地存储 ✅ （修复后）                          │
│    updatedScannedInfo: {                                     │
│      visitorType: "invited",  // 保留                         │
│      authorizedPhone: "139...",                              │
│      ...                                                     │
│    }                                                         │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. 跳转到 form.vue                                            │
│    从本地存储读取: visitorType = "invited" ✅                  │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. form.vue 判断地址锁定                                       │
│    if (visitorType === 'invited') {                          │
│      isAddressAutoFilled = true; // ✅ 锁定地址               │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
```

## 测试建议

### 测试步骤

1. **扫描访客邀请二维码**
   - 使用管家账号生成包含 `visitorType=invited` 的二维码
   - 访客扫描二维码进入 phone-auth 页面

2. **检查参数保存**
   - 打开浏览器控制台
   - 查看日志: `💾 立即保存扫码地址信息到本地存储:`
   - ✅ 确认对象中包含 `visitorType: "invited"`

3. **完成授权**
   - 输入手机号并获取验证码
   - 完成授权流程

4. **检查参数更新**
   - 查看日志: `💾 更新扫码地址信息到本地存储（包含授权手机号）:`
   - ✅ 确认对象中仍包含 `visitorType: "invited"`

5. **验证 form.vue 接收**
   - 跳转到预约表单页面
   - 在 form.vue 的 `processScannedAddressParams` 方法中打断点
   - ✅ 确认 `visitorType` 不是 `undefined`

6. **验证地址锁定**
   - 检查访问地址栏是否显示"🔒 此地址通过二维码自动获取，无法修改"
   - ✅ 确认地址被正确锁定

### 验证要点

- [ ] 扫码时 `scannedParams` 包含 `visitorType`
- [ ] 保存到本地存储时包含 `visitorType`
- [ ] 授权更新时保留 `visitorType`
- [ ] form.vue 读取时 `visitorType` 不是 `undefined`
- [ ] 地址成功锁定（受邀访客）

## 相关文件

| 文件 | 修改内容 |
|------|---------|
| `pages/auth/phone-auth.vue` | 在三个位置添加 `visitorType` 字段 |
| `pagesA/reservation/form.vue` | 无需修改（读取逻辑正常） |
| `pagesB/butler/qrcode-generator.vue` | 已修复（URL中包含参数） |

## 注意事项

1. **向后兼容**: 如果本地存储中已有旧数据（没有 `visitorType`），使用空字符串作为默认值
2. **数据合并**: 使用扩展运算符 `...scannedAddressInfo` 确保不丢失其他字段
3. **优先级**: 新扫描的参数优先于已存储的参数
4. **数据新鲜度**: 通过 `timestamp` 字段判断数据是否过期（5分钟内有效）

## 相关修复

此次修复是以下功能的补充修复：

1. **访客邀请二维码地址锁定** - 在二维码URL中添加 `visitorType=invited` 参数
2. **访客底部TabBar隐藏** - 访客角色不显示TabBar
3. **TabBar组件undefined错误** - 防御性编程避免空值错误

完整的参数传递链路现已修复完成！

---

**修复日期**: 2025-12-03  
**修复人员**: Cascade AI  
**问题来源**: 用户反馈参数丢失

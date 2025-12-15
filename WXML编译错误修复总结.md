# WXML 编译错误修复总结

## 错误描述

在编译到微信小程序时出现 WXML 文件编译错误：

```
Bad attr `data-event-opts` with message: unexpected token `owner_`.
```

## 根本原因

微信小程序的 WXML 编译器对模板表达式有严格限制：

1. **不支持字符串拼接表达式**：如 `'owner_' + index`
2. **不支持对象语法的 :class**：如 `{ disabled: condition }`
3. **不支持复杂的表达式运算**

## 完整修复方案

### 1. :key 属性修复

**问题代码：**
```vue
:key="'owner_' + index"  // 字符串拼接不被支持
```

**修复后：**
```vue
:key="index"  // 直接使用简单值
```

### 2. :class 对象语法修复

**问题代码：**
```vue
:class="{ disabled: !selectedAddress.building }"
:class="{ selected: selectedOwner && selectedOwner.id === owner.id }"
```

**修复后：**
```vue
:class="!selectedAddress.building ? 'selector-trigger disabled' : 'selector-trigger'"
:class="selectedOwner && selectedOwner.id === owner.id ? 'owner-item selected' : 'owner-item'"
```

### 3. :class 字符串拼接修复

**问题代码：**
```vue
:class="'status-text ' + getAuditStatusClass(owner.isaudit)"
```

**修复后：**
```vue
:class="getOwnerStatusClass(owner.isaudit)"
```

**新增方法：**
```javascript
// 获取业主状态的完整class（用于模板）
getOwnerStatusClass(status) {
    const baseClass = 'status-text';
    const statusClass = this.getAuditStatusClass(status);
    return baseClass + ' ' + statusClass;
},
```

## 修复的具体位置

### 文件：`pagesB/butler/qrcode-generator.vue`

#### 1. 业主列表 :key 修复
**行号：** 106
```vue
<!-- 修复前 -->
:key="'owner_' + index"

<!-- 修复后 -->
:key="index"
```

#### 2. 地址选择器 :class 修复
**行号：** 35, 50, 63
```vue
<!-- 修复前 -->
:class="{ disabled: !selectedAddress.building }"

<!-- 修复后 -->
:class="!selectedAddress.building ? 'selector-trigger disabled' : 'selector-trigger'"
```

#### 3. 业主项选中状态 :class 修复
**行号：** 107
```vue
<!-- 修复前 -->
:class="{ 'selected': selectedOwner && selectedOwner.id === owner.id }"

<!-- 修复后 -->
:class="selectedOwner && selectedOwner.id === owner.id ? 'owner-item selected' : 'owner-item'"
```

#### 4. 业主状态 :class 修复
**行号：** 120
```vue
<!-- 修复前 -->
:class="'status-text ' + getAuditStatusClass(owner.isaudit)"

<!-- 修复后 -->
:class="getOwnerStatusClass(owner.isaudit)"
```

#### 5. 新增方法
**行号：** 1318-1327
```javascript
// 获取业主状态的完整class（用于模板）
getOwnerStatusClass(status) {
    const baseClass = 'status-text';
    const statusClass = this.getAuditStatusClass(status);
    return baseClass + ' ' + statusClass;
},
```

## 微信小程序模板语法规范

### ✅ 支持的语法

```vue
<!-- 简单值 -->
:key="index"
:key="item.id"

<!-- 三元操作符 -->
:class="condition ? 'class-a' : 'class-b'"

<!-- 简单表达式 -->
v-if="item.visible"
v-show="showContent"

<!-- 方法调用 -->
@click="handleClick"
:class="getClassName(item)"
```

### ❌ 不支持的语法

```vue
<!-- 字符串拼接 -->
:key="'prefix_' + index"
:class="'base ' + dynamicClass"

<!-- 对象语法 -->
:class="{ active: isActive, disabled: isDisabled }"

<!-- 复杂表达式 -->
:key="item.id || 'default_' + index"
v-if="item.status === 'active' && item.type !== 'hidden'"
```

## 最佳实践建议

### 1. 使用计算属性或方法
将复杂逻辑移到 JavaScript 中：

```javascript
// 在 methods 或 computed 中处理复杂逻辑
computed: {
    itemClass() {
        return this.isActive ? 'active' : 'inactive';
    }
}
```

### 2. 保持模板简洁
```vue
<!-- 好的做法 -->
:class="itemClass"
:key="index"

<!-- 避免的做法 -->
:class="isActive && !isDisabled ? 'active' : 'inactive'"
:key="'item_' + index + '_' + type"
```

### 3. 使用三元操作符
```vue
<!-- 推荐 -->
:class="condition ? 'class-a' : 'class-b'"

<!-- 避免 -->
:class="{ 'class-a': condition }"
```

## 验证步骤

1. **清理编译缓存**
   ```bash
   # 删除 unpackage 目录
   rm -rf unpackage
   ```

2. **重新编译**
   ```bash
   npm run dev:mp-weixin
   ```

3. **检查编译输出**
   - 确认没有 WXML 编译错误
   - 检查生成的 .wxml 文件语法正确

4. **功能测试**
   - 业主列表正常显示
   - 选中状态切换正常
   - 禁用状态样式正确
   - 审核状态样式正确

## 修复状态

- ✅ 修复 :key 字符串拼接错误
- ✅ 修复 :class 对象语法错误
- ✅ 修复 :class 字符串拼接错误
- ✅ 新增 getOwnerStatusClass 方法
- ✅ 所有模板语法符合微信小程序规范
- 📋 待验证编译和运行效果

## 注意事项

1. **兼容性优先**：优先使用最简单、兼容性最好的语法
2. **逻辑分离**：将复杂逻辑移到 JavaScript 中处理
3. **测试验证**：在目标平台上充分测试
4. **文档参考**：遵循 uni-app 和微信小程序的官方文档

修复完成，现在应该可以正常编译到微信小程序了。

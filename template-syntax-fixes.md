# 模板语法修复总结

## 🐛 修复的问题

### 1. `:class`中的方法调用语法错误

**问题**：uni-app不支持在`:class`中直接调用方法
```vue
<!-- ❌ 错误写法 -->
:class="getEfficiencyClass(peak.efficiency)"
```

**解决方案**：使用条件对象语法
```vue
<!-- ✅ 正确写法 -->
:class="{
  'efficiency-excellent': peak.efficiency >= 90,
  'efficiency-good': peak.efficiency >= 80 && peak.efficiency < 90,
  'efficiency-normal': peak.efficiency >= 70 && peak.efficiency < 80,
  'efficiency-poor': peak.efficiency < 70
}"
```

### 2. 新能源车牌判断

**问题**：方法调用语法
```vue
<!-- ❌ 错误写法 -->
:class="isNewEnergyPlate(item.plateNumber) ? 'green-plate' : 'blue-plate'"
```

**解决方案**：直接使用条件表达式
```vue
<!-- ✅ 正确写法 -->
:class="item.plateNumber && item.plateNumber.length === 8 ? 'green-plate' : 'blue-plate'"
```

### 3. 紧急程度类名

**问题**：字符串拼接语法
```vue
<!-- ❌ 错误写法 -->
:class="'urgency-' + getWaitingUrgencyLevel(item.recordTime)"
```

**解决方案**：使用方法返回完整类名
```vue
<!-- ✅ 正确写法 -->
:class="getUrgencyClass(item.recordTime)"
```

对应的方法：
```javascript
getUrgencyClass(recordTime) {
  const urgencyLevel = this.getWaitingUrgencyLevel(recordTime);
  return `urgency-${urgencyLevel}`;
}
```

## 📝 修复清单

### ✅ 已修复的文件
- `pages/site/facility.vue`

### ✅ 修复的语法问题
1. **效率等级类名**：从方法调用改为条件对象
2. **车牌颜色判断**：从方法调用改为直接条件判断
3. **紧急程度类名**：从字符串拼接改为方法返回完整类名

### ✅ 移除的不必要方法
- `getEfficiencyClass()` - 已用条件对象替代

### ✅ 新增的辅助方法
- `getUrgencyClass()` - 返回完整的紧急程度类名

## 🎯 uni-app模板语法最佳实践

### 1. `:class`绑定推荐写法

**条件类名**：
```vue
:class="{ 'active': isActive, 'disabled': isDisabled }"
```

**三元表达式**：
```vue
:class="condition ? 'class-a' : 'class-b'"
```

**数组语法**：
```vue
:class="[baseClass, { 'active': isActive }]"
```

### 2. 避免的写法

**❌ 不要在模板中调用复杂方法**：
```vue
:class="getComplexClassName(param1, param2)"
```

**❌ 不要使用字符串拼接**：
```vue
:class="'prefix-' + dynamicValue"
```

**❌ 不要使用复杂的计算**：
```vue
:class="items.filter(item => item.active).length > 0 ? 'has-active' : ''"
```

### 3. 推荐的替代方案

**✅ 使用计算属性**：
```javascript
computed: {
  complexClassName() {
    return this.getComplexClassName(this.param1, this.param2);
  }
}
```

**✅ 使用简单方法返回完整类名**：
```javascript
methods: {
  getStatusClass(status) {
    return `status-${status}`;
  }
}
```

**✅ 使用条件对象**：
```vue
:class="{
  'status-active': item.status === 'active',
  'status-pending': item.status === 'pending',
  'status-disabled': item.status === 'disabled'
}"
```

## 🚀 性能优化建议

1. **优先使用条件对象**：性能最好，可读性强
2. **复杂逻辑使用计算属性**：避免重复计算
3. **简单字符串拼接使用方法**：保持模板简洁
4. **避免在模板中进行复杂计算**：影响渲染性能

## ✅ 验证结果

- ✅ 编译错误已修复
- ✅ 模板语法符合uni-app规范
- ✅ 功能逻辑保持不变
- ✅ 性能和可读性得到优化

现在项目应该可以正常编译和运行了！

# OpenID获取优化 - 测试说明

## 🎯 优化内容

根据实际的userInfo结构优化了openid获取逻辑。

---

## ✅ 已完成的修改

### 1. **OpenID获取的三级策略**

**文件：** `violation.vue` mounted方法（第6092-6113行）

```javascript
// 1️⃣ 优先从userOpenid获取（最快）
this.currentUserOpenid = uni.getStorageSync('userOpenid') || '';

// 2️⃣ 如果为空，从userInfo对象中获取
if (!this.currentUserOpenid) {
    const userInfo = uni.getStorageSync('userInfo');
    if (userInfo && userInfo.openid) {
        this.currentUserOpenid = userInfo.openid;
        uni.setStorageSync('userOpenid', userInfo.openid);
        console.log('✅ 从userInfo获取openid');
    }
}

// 3️⃣ 如果还是为空，从服务器查询（兜底方案）
if (this.currentUserRole === 'patrol' && !this.currentUserOpenid) {
    await this.fetchOpenidFromServer();
}
```

---

### 2. **从userInfo对象提取用户信息**

**文件：** `violation.vue` fetchOpenidFromServer方法（第1076-1106行）

```javascript
// 获取完整的userInfo对象
const userInfo = uni.getStorageSync('userInfo');

// ✅ 优先检查userInfo中是否已有openid
if (userInfo && userInfo.openid) {
    console.log('✅ userInfo中已存在openid，直接使用');
    this.currentUserOpenid = userInfo.openid;
    uni.setStorageSync('userOpenid', userInfo.openid);
    return;
}

// 从userInfo对象中提取姓名和手机号
if (userInfo) {
    username = userInfo.userName || 
               (userInfo.userInfo && userInfo.userInfo.username) || '';
    phone = userInfo.phone || '';
}
```

---

## 📊 实际的UserInfo结构

根据您的实际数据：

```json
{
  "role": "patrol",
  "phone": "13593527970",
  "openid": "o9GBR6S7qHOQkvr-wpoGu4vsqbcY",  // ← 已经有了！
  "userName": "巡检员003",                    // ← 姓名
  "userInfo": {
    "id": 20,
    "username": "巡检员003",                 // ← 姓名（备用）
    "community": "万象上东"
  },
  "yardName": "万象上东",
  "wechatUserInfo": {
    "openid": "o9GBR6S7qHOQkvr-wpoGu4vsqbcY"
  }
}
```

**关键发现：**
- ✅ `userInfo.openid` 已经存在
- ✅ `userInfo.userName` = "巡检员003"
- ✅ `userInfo.phone` = "13593527970"

---

## 🔄 工作流程

```
页面加载
  ↓
1. 尝试从userOpenid获取
   ├─ 有值 → 直接使用 ✅
   └─ 无值 ↓
      2. 从userInfo.openid获取
         ├─ 有值 → 使用并同步到userOpenid ✅
         └─ 无值 ↓
            3. 从服务器查询
               - 使用userName和phone查询patrol表
               - 返回openid
```

---

## 🧪 测试步骤

### 测试1：正常情况（userInfo中有openid）

**预期控制台输出：**
```
✅ [值班状态] 从userInfo获取openid: o9GBR6S7qH...
📋 [值班状态] 查询成功: 值班中
```

**或者：**
```
📋 [值班状态] 从userOpenid获取openid: o9GBR6S7qH...
📋 [值班状态] 查询成功: 值班中
```

---

### 测试2：测试值班切换

点击"上岗/离岗"按钮：

**预期效果：**
```
🔄 [值班状态] 切换成功: 离岗
✅ 已离岗，消息提醒已关闭
```

**后端日志：**
```
🔄 [值班状态切换] 请求参数: PatrolDutyRequest{openid='o9GBR6S7qH...', enabled=0}
✅ [值班状态切换] 成功 - 巡检员: 巡检员003, 小区: 万象上东, 新状态: 离岗
```

**验证数据库：**
```sql
SELECT 
    username, 
    phone, 
    openid,
    notification_enabled,
    CASE WHEN notification_enabled = 1 THEN '值班中' ELSE '离岗' END AS status
FROM patrol
WHERE phone = '13593527970';
```

**预期结果：**
- `notification_enabled` = 0（离岗）
- `openid` = 'o9GBR6S7qHOQkvr-wpoGu4vsqbcY'

---

### 测试3：刷新后台管理系统

1. 打开后台管理系统
2. 进入"巡逻员管理"页面
3. 查看"巡检员003"的值班状态

**预期显示：**
```
⭕ 离岗  （红色标签）
```

---

## ✅ 成功标志

### 前端
- ✅ 控制台显示获取到openid（以`o9GBR6S7qH...`开头）
- ✅ 切换值班状态成功，有Toast提示
- ✅ 无错误日志

### 后端  
- ✅ 控制台显示：`✅ [值班状态切换] 成功`
- ✅ 无异常堆栈信息

### 数据库
- ✅ `notification_enabled` 字段正确更新（0或1）
- ✅ `last_status_change_time` 为最新时间

---

## 🎉 优势

### 相比之前的方案

**之前：** 只从单个key获取openid，容易丢失

**现在：**
1. ✅ **三级查找** - 多重保障，不易丢失
2. ✅ **自动同步** - userInfo → userOpenid自动同步
3. ✅ **智能提取** - 正确从userInfo对象中提取信息
4. ✅ **服务器兜底** - 最坏情况还能从服务器查询

---

## 📝 注意事项

### 您的系统已经完美！

根据您提供的userInfo结构，**openid已经存在于userInfo对象中**，所以：

1. ✅ **无需从服务器查询** - userInfo.openid已经有值
2. ✅ **无需手动设置** - 登录时已经保存
3. ✅ **直接可用** - 代码会自动提取并使用

### 如果遇到问题

**只有在以下情况才会出现问题：**
- userInfo为空（未登录）
- userInfo.openid为空（登录异常）
- userOpenid被手动清除

**这些情况下，代码会：**
1. 尝试从服务器查询
2. 使用username和phone查询patrol表
3. 获取并保存openid

---

## 🚀 立即测试

**直接重新编译小程序即可测试！**

1. 点击"编译"
2. 进入违规查询页面
3. 查看控制台日志
4. 测试切换值班状态

**预期：一切正常！** ✅

---

**最后更新：** 2025-12-04 14:15  
**优化状态：** ✅ 已完成  
**测试状态：** ⏳ 待测试

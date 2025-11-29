<template>
  <view class="test-container">
    <view class="header">
      <text class="title">🔧 角色权限测试页面</text>
      <text class="subtitle">用于测试动态TabBar和权限系统</text>
    </view>

    <view class="current-info">
      <view class="info-card">
        <text class="card-title">当前用户信息</text>
        <view class="info-item">
          <text class="label">角色：</text>
          <text class="value">{{ currentRole }}</text>
          <text class="role-badge" :class="roleClass">{{ roleText }}</text>
        </view>
        <view class="info-item">
          <text class="label">手机号：</text>
          <text class="value">{{ phone }}</text>
        </view>
        <view class="info-item">
          <text class="label">登录状态：</text>
          <text class="value" :class="{ 'status-success': isLoggedIn, 'status-error': !isLoggedIn }">
            {{ isLoggedIn ? '已登录' : '未登录' }}
          </text>
        </view>
        <view class="info-item">
          <text class="label">TabBar角色：</text>
          <text class="value">{{ tabBarRole }}</text>
        </view>
      </view>
    </view>

    <view class="actions-section">
      <view class="section-title">
        <text>角色切换测试</text>
      </view>
      
      <view class="button-group">
        <button 
          class="role-button owner-button" 
          @click="switchToOwner"
          :disabled="currentRole === 'owner'"
        >
          🏠 切换为业主
        </button>
        
        <button 
          class="role-button manager-button" 
          @click="switchToManager"
          :disabled="currentRole === 'manager'"
        >
          👨‍💼 切换为管家
        </button>
        
        <button 
          class="role-button visitor-button" 
          @click="switchToVisitor"
          :disabled="currentRole === 'visitor'"
        >
          👤 切换为访客
        </button>
      </view>

      <view class="section-title">
        <text>权限测试</text>
      </view>
      
      <view class="permissions-list">
        <view 
          v-for="(permission, index) in allPermissions" 
          :key="index"
          class="permission-item"
        >
          <text class="permission-name">{{ getPermissionDisplayName(permission) }}</text>
          <view class="permission-status" :class="{ 'has-permission': hasPermission(permission) }">
            {{ hasPermission(permission) ? '✅' : '❌' }}
          </view>
        </view>
      </view>

      <view class="section-title">
        <text>调试工具</text>
      </view>
      
      <view class="debug-buttons">
        <button class="debug-button" @click="debugAuthState">
          🔍 调试认证状态
        </button>
        
        <button class="debug-button" @click="debugTabBarState">
          📱 调试TabBar状态
        </button>
        
        <button class="debug-button danger" @click="logout">
          🚪 退出登录
        </button>
      </view>
    </view>
  </view>
</template>

<script>
// 引入权限验证混入
import authMixin from '@/mixins/auth.js'

export default {
  mixins: [authMixin],
  
  data() {
    return {
      userInfo: {},
      allPermissions: [
        'appointment.create',
        'appointment.query.own',
        'appointment.query',
        'appointment.audit',
        'violation.view.own',
        'violation.manage',
        'audit.process',
        'owner.manage',
        'visitor.appointment',
        'visitor.query'
      ]
    }
  },

  computed: {
    currentRole() {
      return this.userInfo.role || 'unknown'
    },
    
    roleText() {
      const roleMap = {
        'owner': '业主',
        'manager': '管家',
        'visitor': '访客'
      }
      return roleMap[this.currentRole] || '未知'
    },
    
    roleClass() {
      return {
        'role-owner': this.currentRole === 'owner',
        'role-manager': this.currentRole === 'manager',
        'role-visitor': this.currentRole === 'visitor'
      }
    },
    
    phone() {
      return this.userInfo.phone || '未知'
    },
    
    isLoggedIn() {
      return this.userInfo.isAuthorized || false
    },
    
    tabBarRole() {
      return uni.getStorageSync('currentTabBarRole') || '未设置'
    }
  },

  onLoad() {
    this.loadUserInfo()
  },

  onShow() {
    this.loadUserInfo()
  },

  methods: {
    // 加载用户信息
    loadUserInfo() {
      this.userInfo = this.getCurrentUser()
    },

    // 切换为业主
    async switchToOwner() {
      try {
        uni.showLoading({ title: '切换中...' })
        
        const AuthUtils = await import('@/utils/auth.js')
        await AuthUtils.default.switchRole('owner')
        
        this.loadUserInfo()
        
        uni.hideLoading()
      } catch (error) {
        uni.hideLoading()
        console.error('切换角色失败:', error)
        uni.showToast({
          title: '切换失败',
          icon: 'error'
        })
      }
    },

    // 切换为管家
    async switchToManager() {
      try {
        uni.showLoading({ title: '切换中...' })
        
        const AuthUtils = await import('@/utils/auth.js')
        await AuthUtils.default.switchRole('manager')
        
        this.loadUserInfo()
        
        uni.hideLoading()
      } catch (error) {
        uni.hideLoading()
        console.error('切换角色失败:', error)
        uni.showToast({
          title: '切换失败',
          icon: 'error'
        })
      }
    },

    // 切换为访客
    async switchToVisitor() {
      try {
        uni.showLoading({ title: '切换中...' })
        
        const AuthUtils = await import('@/utils/auth.js')
        await AuthUtils.default.switchRole('visitor')
        
        this.loadUserInfo()
        
        uni.hideLoading()
      } catch (error) {
        uni.hideLoading()
        console.error('切换角色失败:', error)
        uni.showToast({
          title: '切换失败',
          icon: 'error'
        })
      }
    },

    // 获取权限显示名称
    getPermissionDisplayName(permission) {
      const PermissionUtils = require('@/utils/permission.js').default
      return PermissionUtils.getPermissionDisplayName(permission)
    },

    // 调试认证状态
    debugAuthState() {
      this.debugAuthState()
      
      // 同时显示详细信息
      const info = {
        userInfo: this.userInfo,
        permissions: this.getCurrentPermissions(),
        role: this.getCurrentRole(),
        isManager: this.isManager(),
        isOwner: this.isOwner(),
        isVisitor: this.isVisitor()
      }
      
      console.log('📊 详细认证信息:', info)
      
      uni.showModal({
        title: '认证状态',
        content: `角色: ${this.roleText}\n权限数量: ${this.getCurrentPermissions().length}\n登录状态: ${this.isLoggedIn ? '已登录' : '未登录'}`,
        showCancel: false
      })
    },

    // 调试TabBar状态
    async debugTabBarState() {
      try {
        const DynamicTabBarManager = await import('@/utils/dynamicTabBar.js')
        DynamicTabBarManager.default.debugTabBarState()
        
        const tabCount = DynamicTabBarManager.default.getTabCount(this.currentRole)
        
        uni.showModal({
          title: 'TabBar状态',
          content: `当前角色: ${this.roleText}\nTabBar项目数: ${tabCount}\n存储角色: ${this.tabBarRole}`,
          showCancel: false
        })
        
      } catch (error) {
        console.error('调试TabBar失败:', error)
      }
    },

    // 退出登录
    async logout() {
      uni.showModal({
        title: '确认退出',
        content: '确定要退出登录吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              const AuthUtils = await import('@/utils/auth.js')
              await AuthUtils.default.logout()
            } catch (error) {
              console.error('退出登录失败:', error)
            }
          }
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.test-container {
  padding: 20rpx;
  background: #f5f5f5;
  min-height: 100vh;
}

.header {
  text-align: center;
  margin-bottom: 40rpx;
  
  .title {
    display: block;
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 10rpx;
  }
  
  .subtitle {
    display: block;
    font-size: 28rpx;
    color: #666;
  }
}

.current-info {
  margin-bottom: 40rpx;
  
  .info-card {
    background: white;
    border-radius: 16rpx;
    padding: 30rpx;
    box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.1);
    
    .card-title {
      display: block;
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 20rpx;
    }
    
    .info-item {
      display: flex;
      align-items: center;
      margin-bottom: 16rpx;
      
      .label {
        font-size: 28rpx;
        color: #666;
        width: 140rpx;
      }
      
      .value {
        font-size: 28rpx;
        color: #333;
        margin-right: 20rpx;
      }
      
      .role-badge {
        padding: 8rpx 16rpx;
        border-radius: 20rpx;
        font-size: 24rpx;
        color: white;
        
        &.role-owner {
          background: #12a7f5;
        }
        
        &.role-manager {
          background: #FF6B35;
        }
        
        &.role-visitor {
          background: #52c41a;
        }
      }
      
      .status-success {
        color: #52c41a;
      }
      
      .status-error {
        color: #ff4d4f;
      }
    }
  }
}

.actions-section {
  .section-title {
    font-size: 30rpx;
    font-weight: bold;
    color: #333;
    margin: 30rpx 0 20rpx 0;
  }
}

.button-group {
  display: flex;
  gap: 20rpx;
  margin-bottom: 30rpx;
  
  .role-button {
    flex: 1;
    height: 80rpx;
    border-radius: 16rpx;
    border: none;
    font-size: 28rpx;
    color: white;
    
    &.owner-button {
      background: linear-gradient(135deg, #12a7f5, #1890ff);
    }
    
    &.manager-button {
      background: linear-gradient(135deg, #FF6B35, #ff8c42);
    }
    
    &.visitor-button {
      background: linear-gradient(135deg, #52c41a, #73d13d);
    }
    
    &:disabled {
      background: #d9d9d9 !important;
      color: #999;
    }
  }
}

.permissions-list {
  background: white;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 30rpx;
  
  .permission-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16rpx 0;
    border-bottom: 1rpx solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
    
    .permission-name {
      font-size: 28rpx;
      color: #333;
    }
    
    .permission-status {
      font-size: 32rpx;
      
      &.has-permission {
        color: #52c41a;
      }
    }
  }
}

.debug-buttons {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  
  .debug-button {
    height: 70rpx;
    border-radius: 12rpx;
    border: none;
    background: #f0f0f0;
    color: #333;
    font-size: 28rpx;
    
    &.danger {
      background: #ff4d4f;
      color: white;
    }
  }
}
</style> 
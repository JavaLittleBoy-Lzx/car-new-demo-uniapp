/**
 * 权限验证混入
 * 提供统一的用户权限检查和TabBar管理功能
 */
import DynamicTabBarManager from '@/utils/dynamicTabBar.js';

export default {
  onLoad() {
    this.checkPageAuth();
  },
  
  onShow() {
    this.checkPageAuth();
    this.refreshTabBar();
  },
  
  methods: {
    /**
     * 检查页面权限
     * @returns {boolean} 是否有权限访问
     */
    checkPageAuth() {
      const userInfo = uni.getStorageSync('userInfo');
      
      if (!userInfo || !userInfo.isAuthorized) {
        const currentPage = getCurrentPages().pop().route;
        
        // 如果不是授权页面，跳转到授权页面
        if (!currentPage.includes('phone-auth')) {
          console.log('🔐 [Auth] 用户未授权，跳转到登录页面');
          uni.reLaunch({
            url: '/pages/auth/phone-auth'
          });
          return false;
        }
      }
      
      return true;
    },
    
    /**
     * 刷新TabBar
     * 根据当前用户角色更新TabBar显示
     */
    refreshTabBar() {
      const userInfo = uni.getStorageSync('userInfo');
      const role = userInfo?.role;
      
      if (role && DynamicTabBarManager.needsUpdate(role)) {
        console.log('🔄 [Auth] 刷新TabBar，角色:', role);
        DynamicTabBarManager.setTabBarByRole(role);
      }
    },
    
    /**
     * 检查功能权限
     * @param {string} permission - 权限标识
     * @returns {boolean} 是否有权限
     */
    hasPermission(permission) {
      const userInfo = uni.getStorageSync('userInfo');
      
      if (!userInfo || !userInfo.userInfo?.permissions) {
        console.warn('⚠️ [Auth] 用户权限信息不存在');
        return false;
      }
      
      const hasAuth = userInfo.userInfo.permissions.includes(permission);
      console.log(`🔍 [Auth] 权限检查 ${permission}:`, hasAuth);
      
      return hasAuth;
    },
    
    /**
     * 检查角色权限
     * @param {string} role - 角色标识 ('owner' | 'manager')
     * @returns {boolean} 是否是指定角色
     */
    hasRole(role) {
      const userInfo = uni.getStorageSync('userInfo');
      const currentRole = userInfo?.role;
      
      const hasRole = currentRole === role;
      console.log(`🔍 [Auth] 角色检查 ${role}:`, hasRole);
      
      return hasRole;
    },
    
    /**
     * 检查是否为管家
     * @returns {boolean} 是否是管家
     */
    isManager() {
      return this.hasRole('manager');
    },
    
    /**
     * 检查是否为业主
     * @returns {boolean} 是否是业主
     */
    isOwner() {
      return this.hasRole('owner');
    },
    
    /**
     * 权限不足处理
     * @param {string} message - 提示信息
     * @param {Function} callback - 回调函数
     */
    handleNoPermission(message = '权限不足，无法访问该功能', callback) {
      console.warn('🚫 [Auth] 权限不足:', message);
      
      uni.showModal({
        title: '访问受限',
        content: message,
        showCancel: false,
        confirmText: '我知道了',
        success: (res) => {
          if (callback && typeof callback === 'function') {
            callback();
          } else {
            // 默认返回上一页
            const pages = getCurrentPages();
            if (pages.length > 1) {
              uni.navigateBack();
            } else {
              // 如果是第一页，跳转到首页
              uni.reLaunch({
                url: '/pagesA/reservation/form'
              });
            }
          }
        }
      });
    },
    
    /**
     * 角色不匹配处理
     * @param {string} requiredRole - 需要的角色
     */
    handleRoleMismatch(requiredRole) {
      const roleNames = {
        'owner': '业主',
        'manager': '管家'
      };
      
      const requiredRoleName = roleNames[requiredRole] || requiredRole;
      const message = `该功能仅限${requiredRoleName}使用`;
      
      this.handleNoPermission(message);
    },
    
    /**
     * 获取当前用户信息
     * @returns {Object} 用户信息
     */
    getCurrentUser() {
      return uni.getStorageSync('userInfo') || {};
    },
    
    /**
     * 获取当前用户角色
     * @returns {string} 用户角色
     */
    getCurrentRole() {
      const userInfo = this.getCurrentUser();
      return userInfo.role || 'owner';
    },
    
    /**
     * 获取当前用户权限列表
     * @returns {Array} 权限列表
     */
    getCurrentPermissions() {
      const userInfo = this.getCurrentUser();
      return userInfo.userInfo?.permissions || [];
    },
    
    /**
     * 需要权限的方法装饰器
     * @param {string} permission - 权限标识
     * @param {Function} func - 需要执行的方法
     * @param {string} errorMessage - 错误提示信息
     */
    requirePermission(permission, func, errorMessage) {
      if (this.hasPermission(permission)) {
        return func.call(this);
      } else {
        this.handleNoPermission(errorMessage || `需要 ${permission} 权限`);
      }
    },
    
    /**
     * 需要角色的方法装饰器
     * @param {string} role - 角色标识
     * @param {Function} func - 需要执行的方法
     */
    requireRole(role, func) {
      if (this.hasRole(role)) {
        return func.call(this);
      } else {
        this.handleRoleMismatch(role);
      }
    },
    
    /**
     * 登出处理
     */
    logout() {
      console.log('🚪 [Auth] 用户登出');
      
      // 清除用户信息
      uni.removeStorageSync('userInfo');
      uni.removeStorageSync('currentTabBarRole');
      
      // 重置TabBar
      DynamicTabBarManager.resetToDefault();
      
      // 跳转到登录页
      uni.reLaunch({
        url: '/pages/auth/phone-auth'
      });
    },
    
    /**
     * 调试用户权限状态
     */
    debugAuthState() {
      const userInfo = this.getCurrentUser();
      const role = this.getCurrentRole();
      const permissions = this.getCurrentPermissions();
      
      console.log('🔍 [Auth Debug] ==================');
      console.log('🔍 [Auth Debug] 用户信息:', userInfo);
      console.log('🔍 [Auth Debug] 当前角色:', role);
      console.log('🔍 [Auth Debug] 权限列表:', permissions);
      console.log('🔍 [Auth Debug] 是否管家:', this.isManager());
      console.log('🔍 [Auth Debug] 是否业主:', this.isOwner());
      console.log('🔍 [Auth Debug] ==================');
    }
  }
}; 
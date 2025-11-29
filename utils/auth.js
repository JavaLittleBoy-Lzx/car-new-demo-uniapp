/**
 * 认证工具类
 * 提供用户认证、登录、角色管理等功能
 */
import DynamicTabBarManager from './dynamicTabBar.js';
import PermissionUtils, { ROLE_PERMISSIONS } from './permission.js';

class AuthUtils {
  
  /**
   * 用户登录
   * @param {Object} authData - 认证数据
   * @returns {Promise<Object>} 登录结果
   */
  static async login(authData) {
    console.log('🔐 [Auth] 开始用户登录流程');
    
    try {
      const { role, roleText, userInfo, permissions, message, phone } = authData;
      
      // 生成或获取openid
      let openid = userInfo?.openid || authData.openid;
      if (!openid) {
        // 如果没有openid，根据角色生成一个
        const phoneNumber = userInfo?.phone || authData.phone || phone;
        if (phoneNumber) {
          openid = `${role}_${phoneNumber}_${Date.now()}`;
        } else {
          openid = `${role}_${Date.now()}`;
        }
      }
      
      // 构建用户信息对象
      const userData = {
        isAuthorized: ['owner', 'manager', 'visitor'].includes(role), // 只有这三种角色算已授权
        role: role || 'unregistered',
        roleText: roleText || this.getRoleDisplayName(role),
        phone: userInfo?.phone || authData.phone || phone,
        openid: openid, // 添加openid字段
        loginTime: new Date().getTime(),
        message: message,
        userInfo: {
          id: userInfo?.id,
          username: userInfo?.username,
          usercode: userInfo?.usercode,
          community: userInfo?.community,
          permissions: permissions || ROLE_PERMISSIONS[role] || []
        }
      };
      
      // 保存用户信息到本地存储
      uni.setStorageSync('userInfo', userData);
      
      // 处理特殊状态
      if (role === 'pending') {
        console.log('⏳ [Auth] 用户待审核状态');
        uni.showModal({
          title: '账号待审核',
          content: message || '您的申请正在审核中，请耐心等待管理员审核',
          showCancel: false
        });
        
        return {
          success: false,
          data: userData,
          message: '账号待审核'
        };
      }
      
      if (role === 'rejected') {
        console.log('❌ [Auth] 用户申请被拒绝状态');
        
        // 确保不会设置TabBar或跳转页面
        uni.removeStorageSync('currentTabBarRole');
        
        uni.showModal({
          title: '申请未通过',
          content: message || '您的访客申请未通过审核，可以重新申请',
          showCancel: true,
          cancelText: '确定',
          confirmText: '重新申请',
          success: (res) => {
            if (res.confirm) {
              // 用户选择重新申请
              setTimeout(() => {
                this.showRegistrationOptions();
              }, 500);
            }
          }
        });
        
        return {
          success: false,
          data: userData,
          message: '申请未通过'
        };
      }
      
      if (role === 'unregistered') {
        console.log('📝 [Auth] 用户未注册状态,自动设置为访客角色');
        
        // 自动将未注册用户设置为访客角色
        userData.role = 'visitor';
        userData.roleText = '访客';
        userData.isAuthorized = true;
        userData.userInfo.permissions = ROLE_PERMISSIONS['visitor'] || [];
        
        // 保存用户信息到本地存储
        uni.setStorageSync('userInfo', userData);
        
        // 设置对应的TabBar
        await DynamicTabBarManager.setTabBarByRole('visitor');
        
        console.log('✅ [Auth] 未注册用户已自动设置为访客角色');
        
        // 不显示欢迎提示，直接静默登录
        
        return {
          success: true,
          data: userData,
          message: '登录成功'
        };
      }
      
      // 设置对应的TabBar
      await DynamicTabBarManager.setTabBarByRole(userData.role);
      
      console.log('✅ [Auth] 用户登录成功:', userData.role, userData.roleText);
      
      // 显示角色切换成功提示
      uni.showToast({
        title: `欢迎${userData.roleText}用户`,
        icon: 'success'
      });
      
      return {
        success: true,
        data: userData,
        message: '登录成功'
      };
      
    } catch (error) {
      console.error('❌ [Auth] 用户登录失败:', error);
      
      return {
        success: false,
        error: error,
        message: '登录失败，请重试'
      };
    }
  }

  /**
   * 显示注册选项
   */
  static showRegistrationOptions() {
    // 获取当前用户信息
    const currentUser = this.getCurrentUser();
    const phone = currentUser?.phone;
    
    if (!phone) {
      uni.showToast({
        title: '获取手机号失败',
        icon: 'none'
      });
      return;
    }

    // 直接设置为访客角色
    this.login({
      role: 'visitor',
      roleText: '访客',
      phone: phone,
      userInfo: {
        phone: phone,
        permissions: ROLE_PERMISSIONS['visitor'] || []
      }
    });
  }

  /**
   * 申请访客身份
   */
  static async applyForVisitorRole() {
    try {
      const currentUser = this.getCurrentUser();
      const phone = currentUser?.phone;
      
      if (!phone) {
        uni.showToast({
          title: '获取手机号失败',
          icon: 'none'
        });
        return;
      }

      // 保留跳转到访客申请页面的功能，但默认不使用
      uni.navigateTo({
        url: '/pagesD/auth/visitor-apply'
      });
      
    } catch (error) {
      console.error('❌ [Auth] 访客申请失败:', error);
      uni.showToast({
        title: '页面跳转失败',
        icon: 'none'
      });
    }
  }
  
  /**
   * 用户登出
   */
  static async logout() {
    console.log('🚪 [Auth] 用户登出');
    
    try {
      // 清除用户信息
      uni.removeStorageSync('userInfo');
      uni.removeStorageSync('currentTabBarRole');
      
      // 重置TabBar
      await DynamicTabBarManager.resetToDefault();
      
      // 跳转到登录页
      uni.reLaunch({
        url: '/pages/auth/phone-auth'
      });
      
      console.log('✅ [Auth] 登出成功');
      
    } catch (error) {
      console.error('❌ [Auth] 登出失败:', error);
    }
  }
  
  /**
   * 检查用户是否已登录
   * @returns {boolean} 是否已登录
   */
  static isLoggedIn() {
    const userInfo = uni.getStorageSync('userInfo');
    const isLoggedIn = !!(userInfo && userInfo.isAuthorized);
    
    console.log('🔍 [Auth] 检查登录状态:', isLoggedIn);
    return isLoggedIn;
  }
  
  /**
   * 获取当前用户信息
   * @returns {Object|null} 用户信息
   */
  static getCurrentUser() {
    const userInfo = uni.getStorageSync('userInfo');
    return userInfo || null;
  }
  
  /**
   * 获取当前用户角色
   * @returns {string} 用户角色
   */
  static getCurrentRole() {
    const userInfo = this.getCurrentUser();
    // 🔧 修复：没有用户信息时不应该返回默认角色
    if (!userInfo || !userInfo.role) {
      console.warn('⚠️ [Auth] 没有找到用户角色信息');
      return null;
    }
    return userInfo.role;
  }
  
  /**
   * 检查是否为管家
   * @returns {boolean} 是否为管家
   */
  static isManager() {
    return this.getCurrentRole() === 'manager';
  }
  
  /**
   * 检查是否为业主
   * @returns {boolean} 是否为业主
   */
  static isOwner() {
    return this.getCurrentRole() === 'owner';
  }

  /**
   * 检查是否为访客
   * @returns {boolean} 是否为访客
   */
  static isVisitor() {
    return this.getCurrentRole() === 'visitor';
  }

  /**
   * 检查是否为待审核状态
   * @returns {boolean} 是否为待审核状态
   */
  static isPending() {
    return this.getCurrentRole() === 'pending';
  }

  /**
   * 检查是否为未注册状态
   * @returns {boolean} 是否为未注册状态
   */
  static isUnregistered() {
    return this.getCurrentRole() === 'unregistered';
  }

  /**
   * 检查是否为申请被拒绝状态
   * @returns {boolean} 是否为申请被拒绝状态
   */
  static isRejected() {
    return this.getCurrentRole() === 'rejected';
  }
  
  /**
   * 检查登录有效性（可扩展为检查token过期等）
   * @returns {boolean} 登录是否有效
   */
  static isLoginValid() {
    const userInfo = this.getCurrentUser();
    
    if (!userInfo || !userInfo.isAuthorized) {
      return false;
    }
    
    // 检查用户角色是否为被禁止的状态
    const role = userInfo.role;
    if (['pending', 'rejected', 'unregistered'].includes(role)) {
      console.warn('⚠️ [Auth] 用户状态无效:', role);
      return false;
    }
    
    // 检查登录时间（可选：7天过期）
    const loginTime = userInfo.loginTime;
    const now = new Date().getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    
    if (loginTime && (now - loginTime > sevenDays)) {
      console.warn('⚠️ [Auth] 登录已过期');
      return false;
    }
    
    return true;
  }
  
  /**
   * 强制重新登录
   * @param {string} reason - 重新登录原因
   */
  static forceReLogin(reason = '需要重新验证身份') {
    console.log('🔄 [Auth] 强制重新登录:', reason);
    
    uni.showModal({
      title: '重新登录',
      content: reason,
      showCancel: false,
      confirmText: '确定',
      success: () => {
        this.logout();
      }
    });
  }
  
  /**
   * 更新用户信息
   * @param {Object} updateData - 更新的数据
   */
  static updateUserInfo(updateData) {
    const currentUser = this.getCurrentUser();
    
    if (!currentUser) {
      console.warn('⚠️ [Auth] 用户未登录，无法更新信息');
      return false;
    }
    
    const updatedUser = {
      ...currentUser,
      ...updateData,
      userInfo: {
        ...currentUser.userInfo,
        ...updateData.userInfo
      }
    };
    
    uni.setStorageSync('userInfo', updatedUser);
    console.log('✅ [Auth] 用户信息更新成功');
    
    return true;
  }
  
  /**
   * 切换用户角色（仅用于测试）
   * @param {string} newRole - 新角色
   */
  static async switchRole(newRole) {
    console.log('🔄 [Auth] 切换角色:', newRole);
    
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      console.warn('⚠️ [Auth] 用户未登录，无法切换角色');
      return false;
    }
    
    // 更新角色信息
    const updatedUser = {
      ...currentUser,
      role: newRole,
      roleText: this.getRoleDisplayName(newRole),
      isAuthorized: ['owner', 'manager', 'visitor'].includes(newRole),
      userInfo: {
        ...currentUser.userInfo,
        permissions: ROLE_PERMISSIONS[newRole] || []
      }
    };
    
    uni.setStorageSync('userInfo', updatedUser);
    
    // 更新TabBar
    await DynamicTabBarManager.setTabBarByRole(newRole);
    
    console.log('✅ [Auth] 角色切换成功:', newRole);
    
    // 提示用户
    uni.showToast({
      title: `已切换为${updatedUser.roleText}`,
      icon: 'success',
      duration: 2000
    });
    
    return true;
  }
  
  /**
   * 获取用户角色显示名称
   * @param {string} role - 角色标识
   * @returns {string} 角色显示名称
   */
  static getRoleDisplayName(role) {
    const roleNames = {
      'owner': '业主',
      'manager': '管家',
      'visitor': '访客',
      'pending': '待审核',
      'rejected': '申请被拒',
      'unregistered': '访客',
      'default': '访客'
    };
    
    return roleNames[role] || role;
  }
  
  /**
   * 检查页面访问权限
   * @param {string} pagePath - 页面路径
   * @returns {boolean} 是否有权限访问
   */
  static canAccessPage(pagePath) {
    const userInfo = this.getCurrentUser();
    return PermissionUtils.canAccessPage(pagePath, userInfo);
  }
  
  /**
   * 处理未授权访问
   * @param {string} pagePath - 尝试访问的页面路径
   */
  static handleUnauthorizedAccess(pagePath) {
    console.warn('🚫 [Auth] 未授权访问:', pagePath);
    
    const currentRole = this.getCurrentRole();
    const roleDisplayName = this.getRoleDisplayName(currentRole);
    
    uni.showModal({
      title: '访问受限',
      content: `抱歉，${roleDisplayName}无权访问该页面`,
      showCancel: false,
      confirmText: '我知道了',
      success: () => {
        // 跳转到相应的首页
        const homePage = currentRole === 'manager' 
          ? '/pagesA/reservation/form'  // 管家首页
          : '/pagesA/reservation/form'; // 业主首页
          
        uni.reLaunch({
          url: homePage
        });
      }
    });
  }
  
  /**
   * 页面权限检查装饰器
   * @param {string} pagePath - 页面路径
   * @param {Function} callback - 有权限时的回调
   */
  static requirePageAccess(pagePath, callback) {
    if (this.canAccessPage(pagePath)) {
      callback();
    } else {
      this.handleUnauthorizedAccess(pagePath);
    }
  }
  
  /**
   * 初始化应用认证状态
   */
  static async initializeAuth() {
    console.log('🚀 [Auth] 初始化认证状态');
    
    try {
      const userInfo = this.getCurrentUser();
      
      if (userInfo && userInfo.isAuthorized) {
        // 检查登录有效性
        if (!this.isLoginValid()) {
          console.warn('⚠️ [Auth] 登录已失效，需要重新登录');
          await this.logout();
          return false;
        }
        
        // 设置TabBar
        await DynamicTabBarManager.setTabBarByRole(userInfo.role);
        
        console.log('✅ [Auth] 认证状态初始化成功:', userInfo.role);
        return true;
        
      } else {
        console.log('🔐 [Auth] 用户未登录');
        return false;
      }
      
    } catch (error) {
      console.error('❌ [Auth] 认证状态初始化失败:', error);
      return false;
    }
  }
  
  /**
   * 调试认证状态
   */
  static debugAuthState() {
    const userInfo = this.getCurrentUser();
    const role = this.getCurrentRole();
    const isLoggedIn = this.isLoggedIn();
    const isValid = this.isLoginValid();
  }
}

export default AuthUtils; 
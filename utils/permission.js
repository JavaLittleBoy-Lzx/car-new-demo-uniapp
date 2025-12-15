/**
 * 权限管理工具类
 * 定义系统权限常量和权限检查工具方法
 */

// 权限常量定义
export const PERMISSIONS = {
  // 预约相关权限
  APPOINTMENT_CREATE: 'appointment.create',      // 创建预约
  APPOINTMENT_QUERY: 'appointment.query',        // 查询预约
  APPOINTMENT_QUERY_OWN: 'appointment.query.own', // 查询自己的预约
  APPOINTMENT_AUDIT: 'appointment.audit',        // 审核预约
  APPOINTMENT_CANCEL: 'appointment.cancel',      // 取消预约
  
  // 违规管理权限
  VIOLATION_VIEW_OWN: 'violation.view.own',      // 查看自己的违规
  VIOLATION_MANAGE: 'violation.manage',          // 违规管理
  VIOLATION_REPORT: 'violation.report',          // 违规举报
  VIOLATION_AUDIT: 'violation.audit',            // 违规审核
  
  // 业主管理权限
  OWNER_MANAGE: 'owner.manage',                  // 业主管理
  OWNER_INFO_VIEW: 'owner.info.view',           // 查看业主信息
  OWNER_INFO_EDIT: 'owner.info.edit',           // 编辑业主信息
  
  // 审核相关权限
  AUDIT_PROCESS: 'audit.process',                // 审核处理
  AUDIT_VIEW: 'audit.view',                      // 查看审核
  AUDIT_APPROVE: 'audit.approve',                // 审核通过
  AUDIT_REJECT: 'audit.reject',                  // 审核拒绝
  
  // 管家专属权限
  MANAGER_DASHBOARD: 'manager.dashboard',        // 管家仪表板
  MANAGER_REPORT: 'manager.report',              // 管家报表
  MANAGER_SETTINGS: 'manager.settings',          // 管家设置
  
  // 系统管理权限
  SYSTEM_MANAGE: 'system.manage',                // 系统管理
  USER_MANAGE: 'user.manage',                    // 用户管理
  ROLE_MANAGE: 'role.manage',                     // 角色管理
  
  // 访客专用权限
  VISITOR_APPOINTMENT: 'visitor.appointment',         // 访客预约
  VISITOR_QUERY: 'visitor.query'                      // 访客查询
};

// 角色权限映射
export const ROLE_PERMISSIONS = {
  // 业主权限
  owner: [
    PERMISSIONS.APPOINTMENT_CREATE,
    PERMISSIONS.APPOINTMENT_QUERY_OWN,
    PERMISSIONS.APPOINTMENT_CANCEL,
    PERMISSIONS.VIOLATION_VIEW_OWN,
    PERMISSIONS.VIOLATION_REPORT,
    PERMISSIONS.OWNER_INFO_VIEW
  ],
  
  // 管家权限
  manager: [
    PERMISSIONS.APPOINTMENT_QUERY,
    PERMISSIONS.APPOINTMENT_AUDIT,
    PERMISSIONS.VIOLATION_MANAGE,
    PERMISSIONS.VIOLATION_AUDIT,
    PERMISSIONS.OWNER_MANAGE,
    PERMISSIONS.OWNER_INFO_VIEW,
    PERMISSIONS.OWNER_INFO_EDIT,
    PERMISSIONS.AUDIT_PROCESS,
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.AUDIT_APPROVE,
    PERMISSIONS.AUDIT_REJECT,
    PERMISSIONS.MANAGER_DASHBOARD,
    PERMISSIONS.MANAGER_REPORT,
    PERMISSIONS.MANAGER_SETTINGS
  ],
  
  // 访客权限（最小权限，仅预约相关）
  visitor: [
    PERMISSIONS.VISITOR_APPOINTMENT,     // 访客预约（专用）
    PERMISSIONS.VISITOR_QUERY,           // 访客查询（专用）
    PERMISSIONS.APPOINTMENT_QUERY_OWN    // 查询个人预约（基础）
  ],
  
  // 待审核用户 (无权限)
  pending: [],
  
  // 申请被拒用户 (无权限)
  rejected: [],
  
  // 未注册用户 (无权限)
  unregistered: []
};

// 页面权限映射
export const PAGE_PERMISSIONS = {
  // 预约相关页面
  'pagesA/reservation/form': [PERMISSIONS.APPOINTMENT_CREATE],
  'pages/reservation/index': [PERMISSIONS.APPOINTMENT_QUERY_OWN],
  'pages/reservation/result': [PERMISSIONS.APPOINTMENT_QUERY_OWN],
  'pagesA/reservation/searchResult/searchResult': [PERMISSIONS.APPOINTMENT_QUERY_OWN, PERMISSIONS.APPOINTMENT_QUERY],
  
  // 违规相关页面（仅业主和管家可访问）
  'pagesA/violation/owner-new-violation': [PERMISSIONS.VIOLATION_VIEW_OWN],
  'pages/violation/owner-violation': [PERMISSIONS.VIOLATION_VIEW_OWN],
  'pages/violation/violation': [PERMISSIONS.VIOLATION_MANAGE],
  
  // 审核相关页面
  'pages/site/facility': [PERMISSIONS.AUDIT_PROCESS],
  'pages/site/approve_detail': [PERMISSIONS.AUDIT_VIEW],
  'pages/site/approve_search': [PERMISSIONS.AUDIT_VIEW],
  'pages/site/approve_transfer': [PERMISSIONS.AUDIT_PROCESS],
  
  // 用户相关页面
  'pages/profile/profile': [], // 所有角色都可以访问个人资料
  'pages/auth/phone-auth': []  // 授权页面无需权限
};

/**
 * 权限工具类
 */
class PermissionUtils {
  
  /**
   * 检查用户是否有指定权限
   * @param {string} permission - 权限标识
   * @param {Object} userInfo - 用户信息
   * @returns {boolean} 是否有权限
   */
  static hasPermission(permission, userInfo = null) {
    if (!userInfo) {
      userInfo = uni.getStorageSync('userInfo');
    }
    
    if (!userInfo || !userInfo.userInfo?.permissions) {
      return false;
    }
    
    return userInfo.userInfo.permissions.includes(permission);
  }
  
  /**
   * 检查用户是否有任意一个权限
   * @param {Array} permissions - 权限数组
   * @param {Object} userInfo - 用户信息
   * @returns {boolean} 是否有任意权限
   */
  static hasAnyPermission(permissions, userInfo = null) {
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return true;
    }
    
    return permissions.some(permission => this.hasPermission(permission, userInfo));
  }
  
  /**
   * 检查用户是否有所有权限
   * @param {Array} permissions - 权限数组
   * @param {Object} userInfo - 用户信息
   * @returns {boolean} 是否有所有权限
   */
  static hasAllPermissions(permissions, userInfo = null) {
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return true;
    }
    
    return permissions.every(permission => this.hasPermission(permission, userInfo));
  }
  
  /**
   * 检查用户是否可以访问指定页面
   * @param {string} pagePath - 页面路径
   * @param {Object} userInfo - 用户信息
   * @returns {boolean} 是否可以访问
   */
  static canAccessPage(pagePath, userInfo = null) {
    const requiredPermissions = PAGE_PERMISSIONS[pagePath];
    
    // 如果页面没有权限要求，允许访问
    if (!requiredPermissions) {
      return true;
    }
    
    // 检查是否有任意一个所需权限
    return this.hasAnyPermission(requiredPermissions, userInfo);
  }
  
  /**
   * 根据角色获取权限列表
   * @param {string} role - 角色标识
   * @returns {Array} 权限列表
   */
  static getPermissionsByRole(role) {
    return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.visitor;
  }
  
  /**
   * 检查角色是否有指定权限
   * @param {string} role - 角色标识
   * @param {string} permission - 权限标识
   * @returns {boolean} 是否有权限
   */
  static roleHasPermission(role, permission) {
    const permissions = this.getPermissionsByRole(role);
    return permissions.includes(permission);
  }
  
  /**
   * 获取用户可访问的页面列表
   * @param {Object} userInfo - 用户信息
   * @returns {Array} 可访问的页面路径数组
   */
  static getAccessiblePages(userInfo = null) {
    const accessiblePages = [];
    
    for (const [pagePath, requiredPermissions] of Object.entries(PAGE_PERMISSIONS)) {
      if (this.canAccessPage(pagePath, userInfo)) {
        accessiblePages.push(pagePath);
      }
    }
    
    return accessiblePages;
  }
  
  /**
   * 获取权限的友好显示名称
   * @param {string} permission - 权限标识
   * @returns {string} 友好显示名称
   */
  static getPermissionDisplayName(permission) {
    const displayNames = {
      [PERMISSIONS.APPOINTMENT_CREATE]: '创建预约',
      [PERMISSIONS.APPOINTMENT_QUERY]: '查询预约',
      [PERMISSIONS.APPOINTMENT_QUERY_OWN]: '查询个人预约',
      [PERMISSIONS.APPOINTMENT_AUDIT]: '审核预约',
      [PERMISSIONS.APPOINTMENT_CANCEL]: '取消预约',
      
      [PERMISSIONS.VIOLATION_VIEW_OWN]: '查看个人违规',
      [PERMISSIONS.VIOLATION_MANAGE]: '违规管理',
      [PERMISSIONS.VIOLATION_REPORT]: '违规举报',
      [PERMISSIONS.VIOLATION_AUDIT]: '违规审核',
      
      [PERMISSIONS.OWNER_MANAGE]: '业主管理',
      [PERMISSIONS.OWNER_INFO_VIEW]: '查看业主信息',
      [PERMISSIONS.OWNER_INFO_EDIT]: '编辑业主信息',
      
      [PERMISSIONS.AUDIT_PROCESS]: '审核处理',
      [PERMISSIONS.AUDIT_VIEW]: '查看审核',
      [PERMISSIONS.AUDIT_APPROVE]: '审核通过',
      [PERMISSIONS.AUDIT_REJECT]: '审核拒绝',
      
      [PERMISSIONS.MANAGER_DASHBOARD]: '管家仪表板',
      [PERMISSIONS.MANAGER_REPORT]: '管家报表',
      [PERMISSIONS.MANAGER_SETTINGS]: '管家设置'
    };
    
    return displayNames[permission] || permission;
  }
  
  /**
   * 过滤用户有权限的数据
   * @param {Array} dataList - 数据列表
   * @param {string} permissionKey - 权限字段名
   * @param {Object} userInfo - 用户信息
   * @returns {Array} 过滤后的数据列表
   */
  static filterByPermission(dataList, permissionKey, userInfo = null) {
    if (!Array.isArray(dataList)) {
      return [];
    }
    
    return dataList.filter(item => {
      const requiredPermission = item[permissionKey];
      if (!requiredPermission) {
        return true; // 无权限要求的项目允许显示
      }
      
      return this.hasPermission(requiredPermission, userInfo);
    });
  }
  
  /**
   * 调试权限信息
   * @param {Object} userInfo - 用户信息
   */
  static debugPermissions(userInfo = null) {
    if (!userInfo) {
      userInfo = uni.getStorageSync('userInfo');
    }
    
    console.log('🔍 [Permission Debug] ==================');
    console.log('🔍 [Permission Debug] 用户信息:', userInfo);
    console.log('🔍 [Permission Debug] 用户角色:', userInfo?.role);
    console.log('🔍 [Permission Debug] 用户权限:', userInfo?.userInfo?.permissions);
    console.log('🔍 [Permission Debug] 角色标准权限:', this.getPermissionsByRole(userInfo?.role));
    console.log('🔍 [Permission Debug] 可访问页面:', this.getAccessiblePages(userInfo));
    console.log('🔍 [Permission Debug] ==================');
  }
}

export default PermissionUtils; 
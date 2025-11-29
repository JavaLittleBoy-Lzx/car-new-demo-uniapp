/**
 * 动态TabBar管理器
 * 负责根据用户角色动态设置小程序底部TabBar
 */
class DynamicTabBarManager {
  
  // 不同角色的TabBar配置
  static tabBarConfigs = {
    // 业主配置 (3个Tab)
    owner: [
      {
        index: 0,
        pagePath: "pagesA/reservation/form",
        text: "预约",
        iconPath: "/static/icons/appointment.png",
        selectedIconPath: "/static/icons/appointment-active.png",
        show: true
      },
      {
        index: 1,
        pagePath: "pagesA/reservation/searchResult/searchResult",
        text: "预约查询",
        iconPath: "/static/icons/search.png",
        selectedIconPath: "/static/icons/search-active.png",
        show: true
      },
      {
        index: 2,
        pagePath: "pagesA/violation/owner-new-violation", // 业主违规
        text: "违规车辆",
        iconPath: "/static/icons/violation.png",
        selectedIconPath: "/static/icons/violation-active.png",
        show: true
      },
      {
        index: 3,
        pagePath: "pages/site/facility",
        text: "审核",
        iconPath: "/static/icons/audit.png",
        selectedIconPath: "/static/icons/audit-active.png",
        show: false // 业主不显示审核
      }
    ],
    
    // 管家配置 (5个Tab)
    manager: [
      {
        index: 0,
        pagePath: "pagesA/reservation/form",
        text: "预约",
        iconPath: "/static/icons/appointment.png",
        selectedIconPath: "/static/icons/appointment-active.png",
        show: true
      },
      {
        index: 1,
        pagePath: "pagesA/reservation/searchResult/searchResult",
        text: "预约查询",
        iconPath: "/static/icons/search.png",
        selectedIconPath: "/static/icons/search-active.png",
        show: true
      },
      {
        index: 2,
        pagePath: "pages/violation/add-violation",
        text: "违规添加",
        iconPath: "/static/icons/add-violation.png",
        selectedIconPath: "/static/icons/add-violation-active.png",
        show: true
      },
      {
        index: 3,
        pagePath: "pagesE/violation/violation", // 管家专用违规管理页面
        text: "违规管理",
        iconPath: "/static/icons/violation.png",
        selectedIconPath: "/static/icons/violation-active.png",
        show: true
      },
      {
        index: 4,
        pagePath: "pages/site/facility",
        text: "审核",
        iconPath: "/static/icons/audit.png",
        selectedIconPath: "/static/icons/audit-active.png",
        show: true // 管家显示审核
      }
    ],

    // 访客角色 - 只有2个Tab（预约和查询）
    visitor: [
      {
        index: 0,
        pagePath: "pagesA/reservation/form",
        text: "访客预约",
        iconPath: "/static/icons/appointment.png",
        selectedIconPath: "/static/icons/appointment-active.png",
        show: true
      },
      {
        index: 1,
        pagePath: "pagesA/reservation/searchResult/searchResult",
        text: "预约查询",
        iconPath: "/static/icons/search.png",
        selectedIconPath: "/static/icons/search-active.png",
        show: true
      }
      // 访客不显示违规和审核菜单
    ],
    
    // 巡逻员配置 (3个Tab)
    patrol: [
      {
        index: 0,
        pagePath: "pagesE/violation/add-violation",
        text: "违规添加",
        iconPath: "/static/icons/add-violation.png",
        selectedIconPath: "/static/icons/add-violation-active.png",
        show: true
      },
      {
        index: 1,
        pagePath: "pagesE/violation/violation",
        text: "违规查询",
        iconPath: "/static/icons/violation-search.png",
        selectedIconPath: "/static/icons/violation-search-active.png",
        show: true
      },
      {
        index: 2,
        pagePath: "pagesE/violation/violation",
        text: "违章记录",
        iconPath: "/static/L_AID_Violation.png",
        selectedIconPath: "/static/icon-violation-nature.png",
        show: true
      }
    ],

    // 默认配置 - 仅显示预约功能
    default: [
      {
        index: 0,
        pagePath: "pagesA/reservation/form",
        text: "预约",
        iconPath: "/static/icons/appointment.png",
        selectedIconPath: "/static/icons/appointment-active.png",
        show: true
      }
    ]
  };

  // 角色主题配置
  static themeConfigs = {
    owner: {
      selectedColor: '#007AFF',
      color: '#7A7E83',
      backgroundColor: '#ffffff',
      themeColor: '#007AFF'
    },
    manager: {
      selectedColor: '#FF6B35',
      color: '#7A7E83', 
      backgroundColor: '#ffffff',
      themeColor: '#FF6B35'
    },
    visitor: {
      selectedColor: '#52c41a',
      color: '#7A7E83',
      backgroundColor: '#ffffff',
      themeColor: '#52c41a'
    },
    default: {
      selectedColor: '#007AFF',
      color: '#7A7E83',
      backgroundColor: '#ffffff',
      themeColor: '#007AFF'
    }
  };

  constructor() {
    this.currentRole = 'default';
    this.isInitialized = false;
  }

  /**
   * 初始化TabBar管理器
   */
  init() {
    if (this.isInitialized) {
      console.log('TabBar管理器已初始化');
      return;
    }
    
    console.log('正在初始化TabBar管理器...');
    this.isInitialized = true;
    
    // 监听角色变化
    uni.$on('roleChanged', (role) => {
      console.log('角色变化:', role);
      this.switchTabBar(role);
    });
  }

  /**
   * 根据角色切换TabBar
   * 🔧 项目使用自定义TabBar组件，通过事件通知组件更新
   * @param {string} role - 用户角色 (owner/manager/visitor)
   */
  switchTabBar(role) {
    if (!role) {
      console.warn('角色为空，使用默认配置');
      role = 'default';
    }
    
    this.currentRole = role;
    console.log(`🔄 [TabBar] 切换到${role}角色的TabBar`);
    
    const config = this.tabBarConfigs[role] || this.tabBarConfigs.default;
    const visibleTabs = config.filter(item => item.show);
    
    try {
      // 🆕 通过事件通知自定义TabBar组件更新角色
      uni.$emit('roleChanged', {
        role: role,
        config: config,
        visibleTabs: visibleTabs
      });
      
      // 保存当前角色到本地存储
      uni.setStorageSync('currentRole', role);
      
      console.log(`✅ [TabBar] TabBar切换成功: ${role}`);
      
    } catch (error) {
      console.error('❌ [TabBar] TabBar切换失败:', error);
      uni.showToast({
        title: 'TabBar切换失败',
        icon: 'none'
      });
    }
  }

  /**
   * 获取当前角色
   */
  getCurrentRole() {
    return this.currentRole || uni.getStorageSync('currentRole') || 'default';
  }

  /**
   * 获取角色的TabBar配置
   * @param {string} role - 角色
   */
  getRoleConfig(role) {
    return {
      tabs: this.tabBarConfigs[role] || this.tabBarConfigs.default,
      theme: this.themeConfigs[role] || this.themeConfigs.default
    };
  }

  /**
   * 检查当前角色是否可以访问指定页面
   * @param {string} pagePath - 页面路径
   */
  canAccessPage(pagePath) {
    const config = this.tabBarConfigs[this.currentRole] || this.tabBarConfigs.default;
    const tab = config.find(tab => tab.pagePath === pagePath);
    return tab ? tab.show : false;
  }

  /**
   * 获取角色显示文本
   * @param {string} role - 角色
   */
  getRoleText(role) {
    const roleTexts = {
      owner: '业主',
      manager: '管家', 
      visitor: '访客',
      pending: '待审核',
      unregistered: '未注册'
    };
    return roleTexts[role] || '未知角色';
  }

  /**
   * 重置为默认TabBar
   */
  reset() {
    console.log('重置TabBar为默认配置');
    this.switchTabBar('default');
    this.currentRole = 'default';
    uni.removeStorageSync('currentRole');
  }

  /**
   * 销毁管理器
   */
  destroy() {
    console.log('销毁TabBar管理器');
    uni.$off('roleChanged');
    this.isInitialized = false;
  }

  /**
   * 核心方法：根据角色设置TabBar
   * 🔧 项目使用自定义TabBar组件，通过事件通知组件更新
   * @param {string} role - 用户角色 ('owner' | 'manager' | 'visitor' | 'patrol')
   */
  static async setTabBarByRole(role = 'owner') {
    console.log('🔄 [TabBar] 设置TabBar，角色:', role);
    
    try {
      const config = DynamicTabBarManager.tabBarConfigs[role] || DynamicTabBarManager.tabBarConfigs.owner;
      const visibleTabs = config.filter(item => item.show);
      
      console.log('📋 [TabBar] 角色配置:', config);
      console.log('📋 [TabBar] 可见Tab数量:', visibleTabs.length);
      
      // 🆕 通过事件通知自定义TabBar组件更新角色
      uni.$emit('roleChanged', {
        role: role,
        config: config,
        visibleTabs: visibleTabs
      });
      
      console.log('✅ [TabBar] TabBar设置完成，角色:', role, '可见Tab:', visibleTabs.length);
      
      // 保存当前角色配置
      uni.setStorageSync('currentTabBarRole', role);
      
    } catch (error) {
      console.error('❌ [TabBar] TabBar设置失败:', error);
      // 出错时显示默认TabBar
      await this.showTabBar();
    }
  }

  /**
   * 设置角色主题样式
   * 🚧 项目使用自定义TabBar，此方法不再需要
   * @param {string} role - 用户角色
   */
  static setRoleStyle(role) {
    return new Promise((resolve) => {
      // 项目使用自定义TabBar组件，样式由组件内部控制
      console.log('ℹ️ [TabBar] 项目使用自定义TabBar，跳过setTabBarStyle调用');
      resolve();
    });
  }

  /**
   * 设置单个TabBar项
   * 🚧 项目使用自定义TabBar，此方法不再需要
   * @param {Object} item - Tab项配置
   */
  static setTabBarItem(item) {
    return new Promise((resolve) => {
      // 项目使用自定义TabBar组件，不需要调用原生API
      console.log('ℹ️ [TabBar] 项目使用自定义TabBar，跳过setTabBarItem调用');
      resolve();
    });
  }

  /**
   * 隐藏指定TabBar项
   * 🚧 项目使用自定义TabBar，此方法不再需要
   * @param {number} index - Tab索引
   */
  static hideTabBarItem(index) {
    return new Promise((resolve) => {
      // 项目使用自定义TabBar组件，不需要调用原生API
      console.log('ℹ️ [TabBar] 项目使用自定义TabBar，跳过hideTabBarItem调用');
      resolve();
    });
  }

  /**
   * 隐藏整个TabBar
   * 🚧 项目使用自定义TabBar，此方法不再需要
   */
  static hideTabBar() {
    return new Promise((resolve) => {
      // 项目使用自定义TabBar组件，不需要调用原生API
      console.log('ℹ️ [TabBar] 项目使用自定义TabBar，跳过hideTabBar调用');
      resolve();
    });
  }

  /**
   * 显示整个TabBar
   * 🚧 项目使用自定义TabBar，此方法不再需要
   */
  static showTabBar() {
    return new Promise((resolve) => {
      // 项目使用自定义TabBar组件，不需要调用原生API
      console.log('ℹ️ [TabBar] 项目使用自定义TabBar，跳过showTabBar调用');
      resolve();
    });
  }

  /**
   * 检查当前角色是否需要更新TabBar
   * @param {string} newRole - 新角色
   */
  static needsUpdate(newRole) {
    const currentRole = uni.getStorageSync('currentTabBarRole');
    return currentRole !== newRole;
  }

  /**
   * 获取角色对应的Tab数量
   * @param {string} role - 用户角色
   */
  static getTabCount(role) {
    const config = DynamicTabBarManager.tabBarConfigs[role] || DynamicTabBarManager.tabBarConfigs.owner;
    return config.filter(item => item.show).length;
  }

  /**
   * 重置TabBar到默认状态
   */
  static async resetToDefault() {
    console.log('🔄 [TabBar] 重置TabBar为默认状态');
    await this.setTabBarByRole('owner');
  }

  /**
   * 调试方法：输出当前TabBar状态
   */
  static debugTabBarState() {
    const currentRole = uni.getStorageSync('currentTabBarRole');
    const userInfo = uni.getStorageSync('userInfo');
    
    console.log('🔍 [TabBar Debug] 当前TabBar角色:', currentRole);
    console.log('🔍 [TabBar Debug] 用户信息:', userInfo);
    console.log('🔍 [TabBar Debug] Tab配置:', DynamicTabBarManager.tabBarConfigs[currentRole]);
  }
}

export default DynamicTabBarManager; 
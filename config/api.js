// API配置文件
const config = {
  // 开发环境
  development: {
    baseURL: 'http://localhost:8543',
    timeout: 30000 // 增加到30秒，适应后端外部API调用
  },
  
  // 花生壳内网穿透环境
  tunnel: {
    baseURL: 'https://csharphrb.picp.vip', // 免费版会显示中间页，建议升级专业版
    timeout: 45000 // 内网穿透可能较慢，增加超时时间
    // 如果升级了专业版，可以去除中间页面，API调用就会正常工作
  },
  
  // 生产环境
  production: {
    baseURL: 'https://www.xuerparking.cn:8543', // 正式服务器地址
    timeout: 45000 // 生产环境45秒超时
  }
};

// 当前环境（可以根据实际情况动态判断）
const currentEnv = 'production'; // 'development' | 'tunnel' | 'production'

// 导出当前环境配置
export const apiConfig = config[currentEnv];

// API接口地址
export const apiUrls = {
  // 微信授权相关
  wechat: {
    phoneAuth: '/parking/wechat/phoneAuth',
    checkPermission: '/parking/wechat/checkPermission',
    getOpenid: '/parking/wechat/getOpenid',
    checkSubscription: '/parking/wechat/checkSubscription'
  },
  
  // 预约相关
  appointment: {
    create: '/parking/appointment/insertAppointment',
    list: '/parking/appointment/getList',
    query: '/parking/appointment/vehicleQuery',
    audit: '/parking/appointment/auditAppoint',
    visitorList: '/parking/appointment/visitorList',
    managerList: '/parking/appointment/managerList',
    listByPhone: '/parking/appointment/listByPhone',
    queryByPhone: '/parking/appointment/queryByPhone',  // 根据手机号查询预约记录
    getAppointmentPlateNumber: '/parking/appointment/getAppointmentPlateNumber',  // 根据车牌号查询预约记录
    debugManagerData: '/parking/appointment/debugManagerData',  // 调试管家数据
    listAppointNoAudit: '/parking/appointment/listAppointNoAudit',  // 查询待审核预约数据
    allpage: '/parking/appointment/allpage',  // 查询所有预约数据（分页）
    listByAddress: '/parking/appointment/listByAddress'  // 根据地址查询预约记录
  },
  
  // 管家相关
  butler: {
    getByOpenId: '/parking/butler/byOpenid',
    getByPhone: '/parking/butler/getByPhone',
    getManageArea: '/parking/butler/getManageArea',
    getCommunityInfo: '/parking/butler/getCommunityInfo',
    generateQrCodeData: '/parking/butler/generateQrCodeData',
    generateMiniProgramCode: '/parking/butler/generateMiniProgramCode',
    generateVisitorInviteLink: '/parking/butler/generateVisitorInviteLink',
    getDistinctCommunities: '/parking/butler/getDistinctCommunities'
  },
  
  // 业主相关
  owner: {
    myCommunity: '/parking/ownerinfo/myCommunity',
    myRooms: '/parking/ownerinfo/myRooms',
    listByPhone: '/parking/ownerinfo/listByPhone',
    checkMonthlyTicket: '/parking/ownerinfo/checkMonthlyTicket'
  },

  // 小区相关
  community: {
    findProvinceByCommunityName: '/parking/community/findProvinceByCommunityName',
    queryCommunity: '/parking/community/queryCommunity',
    getDistinctCommunity: '/parking/community/getDistinctCommunity'
  },

  // 访客申请相关
  visitor: {
    apply: '/parking/visitor/apply',
    checkStatus: '/parking/visitor/status',
    update: '/parking/visitor/update',
    checkAuditPolicy: '/parking/visitor/auditPolicy',
    getApprovedApplications: '/parking/visitor/getApprovedApplications'
  },

  // 🆕 二维码相关
  qrcode: {
    record: '/parking/qrcode/record',
    validate: '/parking/qrcode/validate',
    validateOnly: '/parking/qrcode/validateOnly', // 🆕 只验证不标记为已使用
    validateToken: '/parking/qrcode/validateToken',
    cleanExpired: '/parking/qrcode/cleanExpired',
    query: '/parking/qrcode/query',
    checkUsed: '/parking/qrcode/checkUsed',
    markUsed: '/parking/qrcode/markUsed'
  },

  // 🆕 违规记录相关
  violations: {
    list: '/parking/violations',
    create: '/parking/violations',
    updateStatus: '/parking/violations/{id}/status',
    statistics: '/parking/violations/statistics',
    highRiskVehicles: '/parking/violations/high-risk-vehicles',
    byOwner: '/parking/violations/by-owner/{ownerId}',
    byPlate: '/parking/violations/by-plate/{plateNumber}',
    userRecords: '/parking/violations/user-records' // 用户违规记录
  },

  // 🆕 月票车辆搜索相关
  monthTicket: {
    smartSearch: '/parking/monthTicket/smartSearch',
    getVehicleDetails: '/parking/monthTicket/getVehicleDetails',
    getVehicleDetailsWithParkStatus: '/parking/monthTicket/getVehicleDetailsWithParkStatus',
    getPlateSuggestions: '/parking/monthTicket/getPlateSuggestions',
    checkVehicleInPark: '/parking/monthTicket/checkVehicleInPark',
    getVehicleStats: '/parking/monthTicket/getVehicleStats',
    // 🆕 month_tick表相关接口
    searchLocalData: '/parking/monthTicket/searchLocalData',
    checkParkDataExists: '/parking/monthTicket/checkParkDataExists',
    batchImportParkData: '/parking/monthTicket/batchImportParkData',
    getLocalPlateSuggestions: '/parking/monthTicket/getLocalPlateSuggestions',
    // 🆕 在场查询接口
    getParkOnSiteCarByCarNo: '/parking/vehicleReservation/getParkOnSiteCarByCarNo'
  },

  // 🆕 车辆相关
  vehicles: {
    list: '/parking/vehicles',
    byOwner: '/parking/vehicles/by-owner/{ownerId}'
  },

  // 🆕 车主信息相关
  owners: {
    byPlate: '/parking/violations/owners/by-plate/{plateNumber}',
    plateSuggestions: '/parking/violations/owners/plate-suggestions',
    vehicles: '/parking/violations/owners/{ownerId}/vehicles',
    creditScore: '/parking/violations/owners/{ownerId}/credit-score'
  },

  // 🆕 预约记录分析相关（用于违规录入）
  appointmentAnalysis: {
    records: '/parking/violations/appointment-records/{plateNumber}',
    analysis: '/parking/violations/appointment-analysis/{plateNumber}'
  },

  // 🆕 违规类型相关
  violationTypes: {
    list: '/parking/violation-types',
    create: '/parking/violation-types',
    update: '/parking/violation-types/{id}',
    delete: '/parking/violation-types/{id}'
  },

  // 🆕 巡逻员相关
  patrol: {
    list: '/parking/patrol',
    create: '/parking/patrol',
    update: '/parking/patrol/{id}',
    delete: '/parking/patrol/{id}',
    getById: '/parking/patrol/{id}',
    getByPhone: '/parking/patrol/getByPhone',
    getTodayStats: '/parking/patrol/{id}/today-stats',
    getWorkSchedule: '/parking/patrol/{id}/work-schedule',
    updateWorkStatus: '/parking/patrol/{id}/work-status',
    getViolationsByPatrol: '/parking/patrol/{id}/violations'
  },

  // 🆕 文件上传相关
  upload: {
    violationPhotos: '/api/upload/violation-photos',
    evidenceFiles: '/api/upload/evidence-files',
    avatars: '/api/upload/avatars',
    general: '/api/upload/files'
  },

  // 🆕 停车超时监控相关
  timeoutMonitoring: {
    recentActiveCount: '/parking/timeout/recent-active-count',
    checkRecentTimeout: '/parking/timeout/check-recent-timeout',
    checkTimeout5Minutes: '/parking/timeout/check-5-minutes',
    checkTimeout1Minute: '/parking/timeout/check-1-minute',
    checkTimeoutByMinutes: '/parking/timeout/check-by-minutes',
    sendTimeoutNotification: '/parking/timeout/send-timeout-notification'
  }
};

// 构建完整的API地址
export function buildApiUrl(path) {
  return apiConfig.baseURL + path;
}

// 通用请求方法（带重试机制）
export function request(options) {
  const {
    url,
    method = 'GET',
    data = {},
    header = {},
    timeout = apiConfig.timeout,
    maxRetries = 2,
    retryDelay = 1000
  } = options;
  
  return new Promise((resolve, reject) => {
    let attemptCount = 0;
    
    function makeRequest() {
      attemptCount++;
      
      console.log(`🚀 API请求开始 [${method}] ${url} (第${attemptCount}次尝试)`);
      
              // 🆕 优化日志显示：区分GET和POST请求的参数显示
        if (method === 'GET') {
            // GET请求：参数在URL中，检查URL是否包含查询参数
            const hasUrlParams = url.includes('?');
            if (hasUrlParams) {
                const [baseUrl, queryString] = url.split('?');
                // 兼容微信小程序：手动解析查询字符串，不使用URLSearchParams
                const paramsObj = {};
                if (queryString) {
                    queryString.split('&').forEach(param => {
                        const [key, value] = param.split('=');
                        if (key) {
                            paramsObj[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
                        }
                    });
                }
                console.log(`📋 URL参数:`, paramsObj);
                console.log(`📝 请求体: 空 (GET请求)`);
            } else {
                console.log(`📋 URL参数: 无`);
                console.log(`📝 请求体:`, Object.keys(data).length > 0 ? data : '空 (GET请求)');
            }
        } else {
            // POST/PUT/DELETE请求：参数在请求体中
            console.log(`📋 请求体参数:`, data);
        }
      
      console.log(`⏰ 超时设置: ${timeout}ms`);
      
      const startTime = Date.now();
      
      // 🔧 自动添加用户信息到请求头
      const requestHeaders = {
        'Content-Type': 'application/json',
        ...header
      };
      
      // 尝试从本地存储获取用户信息并添加到请求头
      try {
        const userInfo = uni.getStorageSync('userInfo');
        if (userInfo) {
          // 设置User-Id请求头
          let userId = null;
          let userName = null;
          
          // 根据不同角色获取用户ID和姓名
          if (userInfo.patrolData && userInfo.patrolData.username) {
            // 巡逻员身份
            userId = userInfo.patrolData.id || userInfo.patrolData.userId || userInfo.userId;
            userName = userInfo.patrolData.username;
          } else if (userInfo.userInfo && userInfo.userInfo.username) {
            // 管家身份
            userId = userInfo.userInfo.id || userInfo.userId;
            userName = userInfo.userInfo.username;
          } else if (userInfo.ownerId || userInfo.id) {
            // 业主身份
            userId = userInfo.ownerId || userInfo.id;
            userName = userInfo.ownername || userInfo.name;
          }
          
          // 如果获取到用户ID，则添加到请求头
          if (userId) {
            requestHeaders['User-Id'] = String(userId);
            console.log(`👤 添加用户信息到请求头: User-Id=${userId}, UserName=${userName}`);
          }
          
          // 如果有姓名信息，需要进行编码（因为HTTP请求头不支持中文）
          if (userName) {
            try {
              // 小程序环境下使用 encodeURIComponent 编码
              const encodedName = encodeURIComponent(userName);
              requestHeaders['User-Name-Encoded'] = encodedName;
              console.log(`👤 用户姓名已编码: ${userName} -> ${encodedName}`);
            } catch (error) {
              console.warn('⚠️ 用户姓名编码失败，跳过:', error);
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ 获取用户信息失败，继续请求:', error);
      }
      
      uni.request({
        url: buildApiUrl(url),
        method,
        data,
        header: requestHeaders,
        timeout,
        success: (res) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          console.log(`✅ API请求成功 [${method}] ${url} - 耗时: ${duration}ms, 状态码: ${res.statusCode}`);
          console.log(`📄 响应数据:`, res.data);
          
          if (res.statusCode === 200) {
            // 检查是否是花生壳中间页面
            if (typeof res.data === 'string' && res.data.includes('贝锐花生壳')) {
              console.warn('⚠️ 检测到花生壳中间页面，等待10秒后自动重试...');
              
              // 如果还有重试次数且是第一次遇到花生壳页面
              if (attemptCount <= maxRetries && !options._isHuashengkeRetry) {
                console.log(`🕒 花生壳10秒等待中，将在12秒后自动重试 (第${attemptCount}次)`);
                
                // 标记这是花生壳重试
                options._isHuashengkeRetry = true;
                
                // 等待12秒后重试（比花生壳的10秒稍长一点）
                setTimeout(() => {
                  makeRequest();
                }, 12000);
                return;
              } else if (options._isHuashengkeRetry) {
                // 如果重试后仍然是花生壳页面，说明可能有其他问题
                console.error('❌ 花生壳重试后仍然显示中间页面');
                const error = new Error('花生壳访问异常：重试后仍显示中间页面，请检查网络连接或稍后再试');
                error.statusCode = 'TUNNEL_RETRY_FAILED';
                error.data = res.data;
                error.duration = duration;
                error.isHuashengkeError = true;
                reject(error);
                return;
              } else {
                // 没有重试次数了
                const error = new Error('花生壳免费版限制：显示中间页面。正在自动处理，请稍候...');
                error.statusCode = 'TUNNEL_LIMITATION';
                error.data = res.data;
                error.duration = duration;
                error.isHuashengkeError = true;
                reject(error);
                return;
              }
            }
            
            resolve(res.data);
          } else {
            const error = new Error(`HTTP ${res.statusCode}: ${res.data?.msg || '请求失败'}`);
            error.statusCode = res.statusCode;
            error.data = res.data;
            error.duration = duration;
            
            console.error(`❌ API响应错误 [${method}] ${url}:`, error);
            reject(error);
          }
        },
        fail: (err) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          console.error(`❌ API请求失败 [${method}] ${url} - 耗时: ${duration}ms, 第${attemptCount}次尝试:`, err);
          
          // 检查是否需要重试
          if (attemptCount < maxRetries + 1 && shouldRetry(err)) {
            console.log(`🔄 准备重试 [${method}] ${url} - ${retryDelay}ms后进行第${attemptCount + 1}次尝试`);
            setTimeout(() => {
              makeRequest();
            }, retryDelay * attemptCount); // 递增延迟
          } else {
            // 所有重试都失败了
            const error = new Error(getErrorMessage(err));
            error.originalError = err;
            error.duration = duration;
            error.attempts = attemptCount;
            
            console.error(`💥 API请求最终失败 [${method}] ${url} - 总共尝试${attemptCount}次`);
            reject(error);
          }
        }
      });
    }
    
    makeRequest();
  });
}

// 判断是否应该重试
function shouldRetry(error) {
  // 网络错误、超时等情况下重试
  if (error.errMsg) {
    const errMsg = error.errMsg.toLowerCase();
    return errMsg.includes('timeout') || 
           errMsg.includes('network') || 
           errMsg.includes('fail') ||
           errMsg.includes('abort');
  }
  return false;
}

// 获取友好的错误信息
function getErrorMessage(error) {
  if (!error.errMsg) {
    return '网络连接失败，请检查网络连接';
  }
  
  const errMsg = error.errMsg.toLowerCase();
  
  if (errMsg.includes('timeout')) {
    return '请求超时，服务器响应较慢，请稍后重试';
  } else if (errMsg.includes('network')) {
    return '网络连接失败，请检查网络连接';
  } else if (errMsg.includes('abort')) {
    return '请求被中断，请重试';
  } else {
    return `网络错误: ${error.errMsg}`;
  }
}

// 微信授权API
export const wechatAPI = {
  // 手机号授权（需要较长超时时间，因为后端要调用外部API + 花生壳等待时间）
  phoneAuth(params) {
    return request({
      url: apiUrls.wechat.phoneAuth,
      method: 'POST',
      data: params,
      timeout: 90000, // 90秒超时，包含花生壳等待时间
      maxRetries: 2,  // 增加重试次数，处理花生壳中间页
      retryDelay: 2000 // 重试间隔2秒
    });
  },
  
  // 获取用户openid
  getOpenid(params) {
    return request({
      url: apiUrls.wechat.getOpenid,
      method: 'GET',
      data: params,
      timeout: 30000, // 30秒超时
      maxRetries: 2
    });
  },
  
  // 检查用户是否关注了公众号
  checkSubscription(params) {
    return request({
      url: apiUrls.wechat.checkSubscription,
      method: 'GET',
      data: params,
      timeout: 30000, // 30秒超时
      maxRetries: 2
    });
  },
  
  // 检查权限
  checkPermission(phoneNumber, permission) {
    return request({
      url: apiUrls.wechat.checkPermission,
      method: 'GET',
      data: { phoneNumber, permission },
      timeout: 30000 // 30秒超时
    });
  }
};

// 预约API
export const appointmentAPI = {
  // 创建预约
  create(data) {
    return request({
      url: apiUrls.appointment.create,
      method: 'POST',
      data
    });
  },
  
  // 获取预约列表
  getList() {
    return request({
      url: apiUrls.appointment.list,
      method: 'GET'
    });
  },
  
  // 查询预约
  query(params) {
    return request({
      url: apiUrls.appointment.query,
      method: 'GET',
      data: params
    });
  },
  
  // 审核预约
  audit(data) {
    return request({
      url: apiUrls.appointment.audit,
      method: 'POST',
      data,
      timeout: 60000 // 增加到60秒超时，适应批量操作
    });
  },
  
  // 访客预约列表
  getVisitorList(openid) {
    return request({
      url: `${apiUrls.appointment.visitorList}/${openid}`,
      method: 'GET'
    });
  },
  
  // 管家预约列表
  getManagerList(openid) {
    return request({
      url: `${apiUrls.appointment.managerList}/${openid}`,
      method: 'GET'
    });
  },
  
  // 根据手机号查询预约列表
  getListByPhone(phone) {
    return request({
      url: apiUrls.appointment.listByPhone,
      method: 'GET',
      data: { phone }
    });
  },
  
  // 根据手机号查询预约记录（直接查询appointment表）
  queryByPhone(phone) {
    return request({
      url: apiUrls.appointment.queryByPhone,
      method: 'GET',
      data: { phone }
    });
  },
  
  // 根据车牌号查询预约记录
  getAppointmentPlateNumber(plateNumber) {
    return request({
      url: apiUrls.appointment.getAppointmentPlateNumber,
      method: 'GET',
      data: { plateNumber }
    });
  },

  // 调试管家数据
  debugManagerData(openid) {
    return request({
      url: `${apiUrls.appointment.debugManagerData}/${openid}`,
      method: 'GET'
    });
  },

  // 查询待审核预约数据
  listAppointNoAudit(params) {
    return request({
      url: apiUrls.appointment.listAppointNoAudit,
      method: 'GET',
      data: params
    });
  },

  // 查询所有预约数据（分页）
  getAllPage(params) {
    return request({
      url: apiUrls.appointment.allpage,
      method: 'GET',
      data: params
    });
  },

  // 根据地址查询预约记录
  getListByAddress(params) {
    return request({
      url: apiUrls.appointment.listByAddress,
      method: 'GET',
      data: params
    });
  }
};

// 业主API
export const ownerAPI = {
  // 我的社区
  getMyCommunity(userphone) {
    return request({
      url: `${apiUrls.owner.myCommunity}/${userphone}`,
      method: 'GET'
    });
  },
  
  // 我的房间
  getMyRooms(params) {
    return request({
      url: apiUrls.owner.myRooms,
      method: 'GET',
      data: params
    });
  },
  
  // 根据手机号查询
  getByPhone(userphone) {
    return request({
      url: apiUrls.owner.listByPhone,
      method: 'GET',
      data: { userphone }
    });
  },

  // 根据手机号查询业主信息（用于管家输入提示）
  getOwnerInfoByPhone(phoneNumber) {
    return request({
      url: `/parking/ownerinfo/phoneNumberOwnerInfo`,
      method: 'GET',
      data: { phoneNumber }
    });
  },

  // 根据地址查询业主信息（用于管家选择地址时提示）
  getOwnerInfoByAddress(addressInfo) {
    return request({
      url: apiUrls.owner.myRooms,
      method: 'GET',
      data: {
        province: addressInfo.province,
        city: addressInfo.city,
        district: addressInfo.district,
        community: addressInfo.community,
        building: addressInfo.building,
        units: addressInfo.units,
        floor: addressInfo.floor,
        roomnumber: addressInfo.roomnumber,
        userphone: '' // 不按手机号过滤，查询该地址的所有业主
      }
    });
  },
  
  // 验证业主月票信息（调用外部月票API）
  checkMonthlyTicket(phone, community) {
    return request({
      url: apiUrls.owner.checkMonthlyTicket,
      method: 'GET',
      data: { 
        phone: phone,
        community: community
      },
      timeout: 90000, // 增加到90秒超时，适应外部API查询
      maxRetries: 1,  // 减少重试次数，避免长时间等待
      retryDelay: 3000 // 重试间隔3秒
    });
  }
};

// 管家API
export const butlerAPI = {
  // 根据openId获取管家信息
  getByOpenId(openid) {
    return request({
      url: `${apiUrls.butler.getByOpenId}/${openid}`,
      method: 'GET'
    });
  },
  
  // 根据手机号获取管家信息
  getByPhone(phone) {
    return request({
      url: apiUrls.butler.getByPhone,
      method: 'GET',
      data: { phone }
    });
  },
  
  // 获取管理区域
  getManageArea(params) {
    return request({
      url: apiUrls.butler.getManageArea,
      method: 'GET',
      data: params
    });
  },
  
  // 获取小区信息
  getCommunityInfo(params) {
    return request({
      url: apiUrls.butler.getCommunityInfo,
      method: 'GET',
      data: params
    });
  },
  
  // 生成二维码数据
  generateQrCodeData(params) {
    return request({
      url: apiUrls.butler.generateQrCodeData,
      method: 'GET',
      data: params
    });
  },
  
  // 生成微信小程序码
  generateMiniProgramCode(params) {
    return request({
      url: apiUrls.butler.generateMiniProgramCode,
      method: 'GET',
      data: params,
      timeout: 45000 // 45秒超时，因为需要调用微信API
    });
  },
  
  // 获取去重的小区列表
  getDistinctCommunities() {
    return request({
      url: apiUrls.butler.getDistinctCommunities,
      method: 'GET'
    });
  }
};

// 访客API
export const visitorAPI = {
  // 提交访客申请
  submitApplication(data) {
    return request({
      url: apiUrls.visitor.apply,
      method: 'POST',
      data,
      timeout: 30000 // 30秒超时
    });
  },
  
  // 检查申请状态
  checkApplicationStatus(phone) {
    return request({
      url: apiUrls.visitor.checkStatus,
      method: 'GET',
      data: { phone }
    });
  },
  
  // 更新申请信息
  updateApplication(data) {
    return request({
      url: apiUrls.visitor.update,
      method: 'PUT',
      data
    });
  },
  
  // 检查车场审核策略
  checkAuditPolicy(parkName) {
    return request({
      url: apiUrls.visitor.checkAuditPolicy,
      method: 'GET',
      data: { parkName }
    });
  },
  
  // 获取审核通过的申请记录（用于获取详细地址）
  getApprovedApplications(phone, auditstatus = '已通过') {
    return request({
      url: apiUrls.visitor.getApprovedApplications,
      method: 'GET',
      data: {
        phone: phone,
        auditstatus: auditstatus
      },
      timeout: 15000 // 15秒超时
    });
  }
};

// 小区API
export const communityAPI = {
  // 根据小区名称和地址查询省市区信息
  findProvinceByCommunityName(community, building, units, floor, room) {
    return request({
      url: apiUrls.community.findProvinceByCommunityName,
      method: 'GET',
      data: {
        community: community,
        building: building,
        units: units,
        floor: floor,
        room: room
      }
    });
  },

  // 查询小区信息
  queryCommunity(query) {
    return request({
      url: apiUrls.community.queryCommunity,
      method: 'GET',
      data: query
    });
  },

  // 获取所有小区
  getDistinctCommunity() {
    return request({
      url: apiUrls.community.getDistinctCommunity,
      method: 'GET'
    });
  }
};

// 🆕 巡逻员API
export const patrolAPI = {
  // 获取巡逻员今日统计
  getTodayStats(patrolId) {
    return request({
      url: apiUrls.patrol.getTodayStats.replace('{id}', patrolId),
      method: 'GET'
    });
  },

  // 获取巡逻员信息 - 通过ID
  getById(patrolId) {
    return request({
      url: apiUrls.patrol.getById.replace('{id}', patrolId),
      method: 'GET'
    });
  },

  // 获取巡逻员信息 - 通过手机号
  getByPhone(phone) {
    return request({
      url: apiUrls.patrol.getByPhone,
      method: 'GET',
      data: { phone }
    });
  },

  // 更新工作状态
  updateWorkStatus(patrolId, status) {
    return request({
      url: apiUrls.patrol.updateWorkStatus.replace('{id}', patrolId),
      method: 'PUT',
      data: { status }
    });
  },

  // 获取巡逻员的违规记录
  getViolationsByPatrol(patrolId, params = {}) {
    return request({
      url: apiUrls.patrol.getViolationsByPatrol.replace('{id}', patrolId),
      method: 'GET',
      data: params
    });
  },

  // 获取工作安排
  getWorkSchedule(patrolId) {
    return request({
      url: apiUrls.patrol.getWorkSchedule.replace('{id}', patrolId),
      method: 'GET'
    });
  }
};

// 🆕 停车超时监控API
export const timeoutMonitoringAPI = {
  // 获取2小时内活跃车辆数量
  getRecentActiveCount() {
    return request({
      url: apiUrls.timeoutMonitoring.recentActiveCount,
      method: 'GET',
      timeout: 30000 // 30秒超时
    });
  },

  // 检查2小时内超时车辆
  checkRecentTimeout() {
    return request({
      url: apiUrls.timeoutMonitoring.checkRecentTimeout,
      method: 'GET',
      timeout: 45000, // 45秒超时，监控查询可能较慢
      maxRetries: 2,
      retryDelay: 2000 // 重试间隔2秒
    });
  },

  // 🆕 检查5分钟内即将超时的车辆
  checkTimeout5Minutes() {
    return request({
      url: apiUrls.timeoutMonitoring.checkTimeout5Minutes,
      method: 'GET',
      timeout: 30000,
      maxRetries: 2,
      retryDelay: 2000
    });
  },

  // 🆕 检查1分钟内即将超时的车辆
  checkTimeout1Minute() {
    return request({
      url: apiUrls.timeoutMonitoring.checkTimeout1Minute,
      method: 'GET',
      timeout: 30000,
      maxRetries: 2,
      retryDelay: 2000
    });
  },

  // 🆕 检查指定分钟数内即将超时的车辆
  checkTimeoutByMinutes(minutes) {
    return request({
      url: apiUrls.timeoutMonitoring.checkTimeoutByMinutes,
      method: 'GET',
      data: { minutes },
      timeout: 30000,
      maxRetries: 2,
      retryDelay: 2000
    });
  },

  // 发送超时通知
  sendTimeoutNotification(vehicle) {
    return request({
      url: apiUrls.timeoutMonitoring.sendTimeoutNotification,
      method: 'POST',
      data: vehicle,
      timeout: 60000, // 60秒超时，通知发送可能需要较长时间
      maxRetries: 1, // 减少重试次数，避免重复发送通知
      retryDelay: 3000 // 重试间隔3秒
    });
  }
};
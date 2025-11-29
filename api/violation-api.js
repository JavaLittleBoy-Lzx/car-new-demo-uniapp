// 违规管理API接口封装
import { request, apiUrls, appointmentAPI } from '@/config/api.js';

// 自定义参数序列化函数（兼容小程序环境）
const serializeParams = (params) => {
    const pairs = [];
    Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
            pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
        }
    });
    return pairs.join('&');
};

// 通用请求方法（使用统一的API配置）
const apiRequest = async (url, options = {}) => {
    try {
        console.log('🔧 [apiRequest] 开始处理API请求');
        console.log('🔧 [apiRequest] 原始URL:', url);
        console.log('🔧 [apiRequest] 请求选项:', options);
        
        // 对于GET请求，将参数添加到URL中
        let requestUrl = url;
        let requestData = options.body || {};

        console.log('🔧 [apiRequest] 请求方法:', options.method || 'GET');
        console.log('🔧 [apiRequest] 原始请求数据:', requestData);

        if (options.method === 'GET' && requestData && Object.keys(requestData).length > 0) {
            const queryString = serializeParams(requestData);
            requestUrl = `${url}?${queryString}`;
            console.log('🔧 [apiRequest] GET请求 - 序列化后的查询字符串:', queryString);
            console.log('🔧 [apiRequest] GET请求 - 最终URL:', requestUrl);
            requestData = {}; // GET请求不需要body
            console.log('🔧 [apiRequest] GET请求 - 清空请求体，参数已移至URL');
        } else if (options.method !== 'GET') {
            console.log('🔧 [apiRequest] 非GET请求 - 保持请求体数据:', requestData);
        }

        console.log('🔧 [apiRequest] 最终请求URL:', requestUrl);
        console.log('🔧 [apiRequest] 最终请求数据:', requestData);

        const result = await request({
            url: requestUrl,
            method: options.method || 'GET',
            data: requestData,
            timeout: 30000,
            maxRetries: 2
        });

        // 调试：打印API响应
        // console.log('✅ [apiRequest] API响应:', JSON.stringify(result, null, 2));

        // 检查响应格式
        if (result && typeof result === 'object') {
            // 如果有code字段，检查是否成功
            if (result.code !== undefined) {
                // 检查成功状态码：200, 0, 或者字符串 "200"
                const successCodes = [200, 0, '200', '0'];
                if (!successCodes.includes(result.code)) {
                    throw new Error(result.message || result.msg || '请求失败');
                }
                
                // 🔧 检查嵌套数据结构：如果data中还有code字段，需要再次检查
                const responseData = result.data || result;
                if (responseData && typeof responseData === 'object' && responseData.code !== undefined) {
                    const innerSuccessCodes = [200, 0, '200', '0'];
                    if (!innerSuccessCodes.includes(responseData.code)) {
                        throw new Error(responseData.message || responseData.msg || '业务处理失败');
                    }
                    // 返回内层的data，如果没有则返回内层对象本身
                    return responseData.data !== undefined ? responseData.data : responseData;
                }
                
                return responseData;
            }
            // 如果没有code字段，直接返回数据
            return result;
        }

        return result;
    } catch (error) {
        console.error('违规API请求失败:', error);
        throw error;
    }
};

// 车主相关API
export const ownerApi = {
    // 根据车牌号查询车主信息
    getOwnerByPlate(plateNumber) {
        return apiRequest(apiUrls.owners.byPlate.replace('{plateNumber}', plateNumber));
    },

    // 车牌号搜索建议
    getPlateSuggestions(keyword, options = {}) {
        const params = {
            keyword,
            page: options.page || 1,
            size: options.size || 50, // 增加每页记录数到50条
            ...options
        };
        
        return apiRequest(apiUrls.owners.plateSuggestions, {
            method: 'GET',
            body: params
        });
    },

    // 获取车主的车辆列表
    getOwnerVehicles(ownerId) {
        return apiRequest(apiUrls.owners.vehicles.replace('{ownerId}', ownerId));
    },

    // 更新车主信用分
    updateCreditScore(ownerId, creditScore, reason) {
        return apiRequest(apiUrls.owners.creditScore.replace('{ownerId}', ownerId), {
            method: 'PUT',
            body: { creditScore, reason }
        });
    },

    // 获取车主信用分
    getCreditScore(ownerId) {
        return apiRequest(apiUrls.owners.creditScore.replace('{ownerId}', ownerId));
    }
};

// 违规记录相关API
export const violationApi = {
    // 🆕 智能搜索月票车辆
    searchMonthTicketVehicles(params = {}) {
        console.log('🔍 [智能搜索] 开始调用searchMonthTicketVehicles');
        console.log('🔍 [智能搜索] 输入参数:', params);
        
        const requestParams = {
            keyword: params.keyword || '',
            parkName: params.parkName || '',
            onlyInPark: params.onlyInPark !== undefined ? params.onlyInPark : false,
            page: params.page || 1,
            size: params.size || 20,
            ...params
        };
        
        console.log('🔍 [智能搜索] 处理后的请求参数:', requestParams);
        console.log('🔍 [智能搜索] 目标API接口:', apiUrls.monthTicket.smartSearch);
        console.log('🔍 [智能搜索] 重点检查 - size参数:', requestParams.size);
        
        return apiRequest(apiUrls.monthTicket.smartSearch, {
            method: 'GET',
            body: requestParams
        });
    },

    // 🆕 获取车辆详细信息
    getVehicleDetails(plateNumber) {
        return apiRequest(apiUrls.monthTicket.getVehicleDetails, {
            method: 'GET',
            body: { plateNumber }
        });
    },

    // 🆕 获取车牌号建议列表（月票车辆）
    getMonthTicketPlateSuggestions(keyword, parkName = '', limit = 10) {
        return apiRequest(apiUrls.monthTicket.getPlateSuggestions, {
            method: 'GET',
            body: { keyword, parkName, limit }
        });
    },

    // 🆕 检查车辆是否在场
    checkVehicleInPark(plateNumber, parkCode = '') {
        return apiRequest(apiUrls.monthTicket.checkVehicleInPark, {
            method: 'GET',
            body: { plateNumber, parkCode }
        });
    },

    // 🆕 获取车辆统计信息
    getVehicleStats(plateNumber) {
        return apiRequest(apiUrls.monthTicket.getVehicleStats, {
            method: 'GET',
            body: { plateNumber }
        });
    },

    // 🆕 直接查询month_tick表数据（替代外部API）
    searchLocalData(params = {}) {
        console.log('🔍 [本地数据搜索] 开始调用searchLocalData');
        console.log('🔍 [本地数据搜索] 输入参数:', JSON.stringify(params, null, 2));
        
        const requestParams = {
            keyword: params.keyword || '',
            parkName: params.parkName || '',
            page: params.page || 1,
            size: params.size || 20,  // 🔧 注意：这里会优先使用传入的size参数
            ...params
        };
        
        console.log('🔍 [本地数据搜索] 处理后的请求参数:', JSON.stringify(requestParams, null, 2));
        console.log('🔍 [本地数据搜索] 目标API接口:', apiUrls.monthTicket.searchLocalData);
        console.log('🔍 [本地数据搜索] 特别关注 - size参数值:', requestParams.size);
        console.log('🔍 [本地数据搜索] 特别关注 - keyword参数值:', requestParams.keyword);
        console.log('🔍 [本地数据搜索] 特别关注 - parkName参数值:', requestParams.parkName);
        
        const apiCall = apiRequest(apiUrls.monthTicket.searchLocalData, {
            method: 'GET',
            body: requestParams
        });
        
        // 🔧 增强调试：监听API响应
        apiCall.then(response => {
            console.log('✅ [本地数据搜索] API响应成功', response);
            // console.log('✅ [本地数据搜索] 响应数据结构:', JSON.stringify(response, null, 2));
            if (response && response.data && response.data.records) {
                // console.log(`✅ [本地数据搜索] 返回记录数: ${response.data.records.length}`);
                // console.log('✅ [本地数据搜索] 第一条记录:', JSON.stringify(response.data.records[0], null, 2));
                if (response.data.total !== undefined) {
                    console.log(`✅ [本地数据搜索] 总记录数: ${response.data.total}`);
                }
            } else {
                console.log('⚠️ [本地数据搜索] 响应数据格式异常');
            }
        }).catch(error => {
            console.error('❌ [本地数据搜索] API调用失败:', error);
        });
        
        return apiCall;
    },

    // 🆕 检查车场数据是否已存在于month_tick表
    checkParkDataExists(parkName) {
        console.log('🔍 [检查车场数据] 检查车场:', parkName);
        
        return apiRequest(apiUrls.monthTicket.checkParkDataExists, {
            method: 'GET',
            body: { parkName }
        });
    },

    // 🆕 批量导入车场的月票车数据到month_tick表
    batchImportParkData(parkName) {
        console.log('📥 [批量导入] 开始导入车场数据:', parkName);
        
        return apiRequest(apiUrls.monthTicket.batchImportParkData, {
            method: 'POST',
            body: { parkName }
        });
    },

    // 🆕 获取本地车牌号建议列表（从month_tick表）
    getLocalPlateSuggestions(keyword, parkName = '', limit = 10) {
        console.log('🔍 [本地车牌建议] 搜索关键词:', keyword, '车场:', parkName);
        
        return apiRequest(apiUrls.monthTicket.getLocalPlateSuggestions, {
            method: 'GET',
            body: { keyword, parkName, limit }
        });
    },

    // 🆕 查询车辆是否在场（外部接口）
    getParkOnSiteCarByCarNo(plateNumber, startTime, endTime, parkCodeList = '') {
        console.log('🔍 [在场查询] 车牌号:', plateNumber, '开始时间:', startTime, '结束时间:', endTime);
        console.log('🔍 [在场查询] 车场编码列表:', parkCodeList);
        
        return apiRequest(apiUrls.monthTicket.getParkOnSiteCarByCarNo, {
            method: 'GET',
            body: { 
                carNo: plateNumber,  // 后端接口参数名是carNo
                enterTimeFrom: startTime, 
                enterTimeTo: endTime,
                parkCodeList: parkCodeList || '', // 使用传入的车场编码列表
                pageNum: '1',     // 页码，默认第1页
                pageSize: '100'   // 每页大小，默认100条
            }
        });
    },

    // 创建违规记录
    async createViolation(violationData) {
        console.log('🚗 [创建违规记录] 开始处理:', violationData);
        
        try {
            // 🔧 Step 1: 获取当前用户信息，确定所在小区
            const userInfo = uni.getStorageSync('userInfo');
            let communityName = '';
            let parkCode = '';
            
            console.log('👤 [用户信息] 完整数据:', userInfo);
            
            // 🔧 多种方式尝试获取小区名称
            if (violationData.parkName) {
                // 方式1: 从提交数据中直接获取（优先级最高）
                communityName = violationData.parkName;
                console.log('🏘️ [小区信息] 来源：提交数据，小区:', communityName);
            } else if (userInfo && userInfo.patrolData) {
                // 方式2: 巡逻员身份 - 尝试多个可能的字段
                communityName = userInfo.patrolData.community || 
                              userInfo.patrolData.parkName || 
                              userInfo.patrolData.communityName ||
                              userInfo.patrolData.yardName || 
                              userInfo.patrolData.managerInfo?.community || '';
                console.log('👤 [巡逻员] 所在小区:', communityName);
                console.log('👤 [巡逻员] 完整数据:', userInfo.patrolData);
            } else if (userInfo && userInfo.userInfo) {
                // 方式3: 管家身份 - 尝试多个可能的字段
                communityName = userInfo.userInfo.community || 
                              userInfo.userInfo.parkName || 
                              userInfo.userInfo.communityName ||
                              userInfo.userInfo.yardName || '';
                console.log('👤 [管家] 所在小区:', communityName);
                console.log('👤 [管家] 完整数据:', userInfo.userInfo);
            } else if (userInfo) {
                // 方式4: 直接从用户信息根级别获取
                communityName = userInfo.community || 
                              userInfo.parkName || 
                              userInfo.communityName ||
                              userInfo.yardName || '';
                console.log('👤 [根级别] 所在小区:', communityName);
            }
            
            // 🔧 特殊处理：如果还是没有找到，尝试从根级别的yardName获取
            if (!communityName && userInfo && userInfo.yardName) {
                communityName = userInfo.yardName;
                console.log('👤 [根级别yardName] 所在小区:', communityName);
            }
            
            // 🔧 Step 2: 如果有小区名称，获取对应的车场编码
            if (communityName) {
                console.log('🏘️ [获取车场编码] 查询小区:', communityName);
                
                try {
                    const yardCodeResponse = await apiRequest('/parking/yardInfo/yardCode', {
                        method: 'GET',
                        body: { yardName: communityName }
                    });
                    
                    console.log('🏘️ [获取车场编码] API响应:', yardCodeResponse);
                    
                    if (yardCodeResponse && Array.isArray(yardCodeResponse) && yardCodeResponse.length > 0) {
                        parkCode = yardCodeResponse[0];
                        console.log('✅ [获取车场编码] 成功获取:', parkCode);
                    } else if (yardCodeResponse && yardCodeResponse.data && Array.isArray(yardCodeResponse.data)) {
                        parkCode = yardCodeResponse.data[0];
                        console.log('✅ [获取车场编码] 从data字段获取:', parkCode);
                    } else {
                        console.warn('⚠️ [获取车场编码] 响应格式异常，小区:', communityName, '响应:', yardCodeResponse);
                        // 🔧 使用小区名称作为备用车场编码
                        parkCode = communityName;
                        console.log('🔧 [备用方案] 使用小区名称作为车场编码:', parkCode);
                    }
                } catch (codeError) {
                    console.error('❌ [获取车场编码] API调用失败:', codeError);
                    // 🔧 使用小区名称作为备用车场编码
                    parkCode = communityName;
                    console.log('🔧 [备用方案] API失败，使用小区名称作为车场编码:', parkCode);
                }
            } else {
                console.warn('⚠️ [获取车场编码] 未找到用户小区信息');
                console.warn('💡 [提示] 可以在提交数据中添加 parkName 字段手动指定小区');
                console.warn('🔍 [调试] 用户信息结构:', JSON.stringify(userInfo, null, 2));
                
                // 🔧 最后的备用方案：使用默认车场编码
                parkCode = 'DEFAULT_PARK_001';
                console.log('🔧 [最终备用方案] 使用默认车场编码:', parkCode);
            }
            
            // 🔧 Step 3: 构建完整的违规记录数据
            const completeViolationData = {
                ...violationData,
                parkCode: parkCode || '', // 添加车场编码
                parkName: communityName || '', // 添加小区名称
                // 确保必要字段存在
                plateNumber: violationData.plateNumber || '',
                violationType: violationData.violationType || violationData.customType || '',
                location: violationData.location || '',
                description: violationData.description || '',
                reporterId: violationData.reporterId || userInfo?.patrolData?.id || userInfo?.userInfo?.id || userInfo?.id || ''
            };
            
            console.log('📝 [完整数据] 准备提交:', completeViolationData);
            console.log('🔍 [关键参数] parkCode:', completeViolationData.parkCode);
            console.log('🔍 [关键参数] parkName:', completeViolationData.parkName);
            
            // 🔧 Step 4: 提交违规记录
            const result = await apiRequest(apiUrls.violations.create, {
            method: 'POST',
                body: completeViolationData
            });
            
            console.log('✅ [创建违规记录] 提交成功:', result);
            return result;
            
        } catch (error) {
            console.error('❌ [创建违规记录] 失败:', error);
            console.error('💡 [错误详情] 消息:', error.message);
            console.error('💡 [错误详情] 完整错误:', error);
            throw error;
        }
    },

    // 获取违规记录列表
    getViolations(params = {}) {
        return apiRequest(apiUrls.violations.list, {
            method: 'GET',
            body: params
        });
    },

    // 更新违规记录状态
    updateViolationStatus(id, status, remark, handlerId) {
        return apiRequest(apiUrls.violations.updateStatus.replace('{id}', id), {
            method: 'PUT',
            body: { status, remark, handlerId }
        });
    },

    // 删除违规记录
    deleteViolation(params = {}) {
        console.log('🗑️ [删除违规记录] 开始处理:', params);
        
        try {
            // 构建删除请求参数 - 确保包含所有可能的ID字段
            const deleteParams = {
                plateNumber: params.plateNumber || '',
                recordId: params.recordId || params.id || params._id || '', // 支持多种ID字段
                appointmentTime: params.appointmentTime || '',
                violationId: params.violationId || params.recordId || params.id || params._id || '', // 🔧 添加violationId参数
                id: params.id || params._id || params.recordId || '', // 🔧 确保有id参数
                ...params // 包含其他可能需要的参数
            };
            
            // 🔧 参数验证：确保至少有一个ID字段不为空
            const hasValidId = deleteParams.recordId || deleteParams.violationId || deleteParams.id;
            if (!hasValidId) {
                console.warn('⚠️ [删除违规记录] 警告：所有ID字段都为空，这可能导致删除失败');
                console.warn('⚠️ [删除违规记录] 原始参数:', params);
            }
            
            console.log('🗑️ [删除违规记录] 处理后的请求参数:', deleteParams);
            console.log('🔍 [删除违规记录] ID字段检查 - recordId:', deleteParams.recordId);
            console.log('🔍 [删除违规记录] ID字段检查 - violationId:', deleteParams.violationId);
            console.log('🔍 [删除违规记录] ID字段检查 - id:', deleteParams.id);
            
            // 调用删除API - 使用后端停车系统的接口规范（注意路径为violations复数）
            return apiRequest('/parking/violations/delete', {
                method: 'DELETE',
                body: deleteParams
            });
        } catch (error) {
            console.error('❌ [删除违规记录] API调用失败:', error);
            throw error;
        }
    },

    // 获取违规统计数据
    getStatistics(params = {}) {
        return apiRequest(apiUrls.violations.statistics, {
            method: 'GET',
            body: params
        });
    },

    // 获取高风险车辆列表
    getHighRiskVehicles(params = {}) {
        return apiRequest(apiUrls.violations.highRiskVehicles, {
            method: 'GET',
            body: params
        });
    },

    // 获取用户违规记录
    getViolationRecords(params = {}) {
        // 如果是默认用户，直接返回空数组
        if (!params.userId || params.userId === 'default_user') {
            return Promise.resolve([]);
        }

        // 优先使用byOwner接口
        const url = apiUrls.violations.byOwner.replace('{ownerId}', params.userId);
        return apiRequest(url, {
            method: 'GET',
            body: params
        });
    },

    // 获取用户车辆列表
    getVehicleList(params = {}) {
        // 如果是默认用户，直接返回空数组
        if (!params.userId || params.userId === 'default_user') {
            return Promise.resolve([]);
        }

        // 优先使用owners.vehicles接口
        if (apiUrls.owners?.vehicles) {
            const url = apiUrls.owners.vehicles.replace('{ownerId}', params.userId);
            return apiRequest(url, {
                method: 'GET',
                body: params
            });
        }
        // 其次使用vehicles.byOwner接口
        else if (apiUrls.vehicles?.byOwner) {
            const url = apiUrls.vehicles.byOwner.replace('{ownerId}', params.userId);
            return apiRequest(url, {
                method: 'GET',
                body: params
            });
        }
        // 否则使用通用的list接口
        return apiRequest(apiUrls.vehicles?.list || '/api/vehicles', {
            method: 'GET',
            body: params
        });
    },

    // 获取用户信用分
    getUserCreditScore(params = {}) {
        // 如果是默认用户，直接返回默认信用分
        if (!params.userId || params.userId === 'default_user') {
            return Promise.resolve({ creditScore: 100 });
        }

        // 使用业主信用分接口
        if (apiUrls.owners?.creditScore) {
            const url = apiUrls.owners.creditScore.replace('{ownerId}', params.userId);
            return apiRequest(url, {
                method: 'GET',
                body: params
            });
        }
        // 否则使用默认接口
        return apiRequest('/api/credit-score', {
            method: 'GET',
            body: params
        });
    },

    // 🆕 综合车牌点击处理方法 - 根据用户需求实现的完整逻辑
    async handlePlateSelection(plateNumber) {
        console.log('🎯 [车牌点击处理] 开始处理车牌:', plateNumber);
        
        try {
            // 第一步：查询本地appointment表中的预约记录
            console.log('📋 [步骤1] 查询本地预约记录...');
            const appointmentRecords = await appointmentAPI.getAppointmentPlateNumber(plateNumber);
            
            if (appointmentRecords && appointmentRecords.data && appointmentRecords.data.data && 
                appointmentRecords.data.data.data && appointmentRecords.data.data.data.length > 0) {
                console.log('✅ [步骤1] 找到预约记录，数量:', appointmentRecords.data.data.data.length);
                
                // 有预约记录，直接返回预约信息用于违规记录
                return {
                    hasAppointment: true,
                    appointmentRecords: appointmentRecords.data.data.data,
                    suggestedAction: 'use_appointment_data',
                    message: `找到 ${appointmentRecords.data.data.data.length} 条预约记录，可根据预约状态填写违规信息`
                };
            } else {
                console.log('❌ [步骤1] 未找到预约记录，继续查询在场状态...');
                
                // 🔧 获取车场编码（复用createViolation中的逻辑）
                console.log('🏘️ [步骤1.5] 获取车场编码...');
                const userInfo = uni.getStorageSync('userInfo');
                let communityName = '';
                let parkCode = '';
                
                // 多种方式尝试获取小区名称
                if (userInfo && userInfo.patrolData) {
                    communityName = userInfo.patrolData.community || 
                                  userInfo.patrolData.parkName || 
                                  userInfo.patrolData.communityName ||
                                  userInfo.patrolData.yardName || 
                                  userInfo.patrolData.managerInfo?.community || '';
                    console.log('👤 [巡逻员] 所在小区:', communityName);
                } else if (userInfo && userInfo.userInfo) {
                    communityName = userInfo.userInfo.community || 
                                  userInfo.userInfo.parkName || 
                                  userInfo.userInfo.communityName ||
                                  userInfo.userInfo.yardName || '';
                    console.log('👤 [管家] 所在小区:', communityName);
                } else if (userInfo) {
                    communityName = userInfo.community || 
                                  userInfo.parkName || 
                                  userInfo.communityName ||
                                  userInfo.yardName || '';
                    console.log('👤 [根级别] 所在小区:', communityName);
                }
                
                // 获取车场编码
                if (communityName) {
                    try {
                        const yardCodeResponse = await apiRequest('/parking/yardInfo/yardCode', {
                            method: 'GET',
                            body: { yardName: communityName }
                        });
                        
                        if (yardCodeResponse && Array.isArray(yardCodeResponse) && yardCodeResponse.length > 0) {
                            parkCode = yardCodeResponse[0];
                            console.log('✅ [获取车场编码] 成功获取:', parkCode);
                        } else if (yardCodeResponse && yardCodeResponse.data && Array.isArray(yardCodeResponse.data)) {
                            parkCode = yardCodeResponse.data[0];
                            console.log('✅ [获取车场编码] 从data字段获取:', parkCode);
                        } else {
                            parkCode = communityName;
                            console.log('🔧 [备用方案] 使用小区名称作为车场编码:', parkCode);
                        }
                    } catch (codeError) {
                        console.error('❌ [获取车场编码] API调用失败:', codeError);
                        parkCode = communityName;
                        console.log('🔧 [备用方案] API失败，使用小区名称作为车场编码:', parkCode);
                    }
                }
                
                // 第二步：调用外部接口查询是否在场
                console.log('🚗 [步骤2] 查询车辆在场状态...');
                
                // 计算时间范围：前一天到当前时间
                const now = new Date();
                const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                
                // 🔧 修正：将时间格式转换为后端期望的 yyyyMMddHHmmss 格式
                const formatToBackendTime = (date) => {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const hour = String(date.getHours()).padStart(2, '0');
                    const minute = String(date.getMinutes()).padStart(2, '0');
                    const second = String(date.getSeconds()).padStart(2, '0');
                    return `${year}${month}${day}${hour}${minute}${second}`;
                };
                
                const endTime = formatToBackendTime(now);
                const startTime = formatToBackendTime(yesterday);
                
                console.log('⏰ [步骤2] 查询时间范围:', startTime, '至', endTime, '(yyyyMMddHHmmss格式)');
                console.log('🏘️ [步骤2] 使用车场编码:', parkCode);
                
                const parkSiteResult = await this.getParkOnSiteCarByCarNo(plateNumber, startTime, endTime, parkCode);
                
                console.log('🔍 [步骤2] 在场查询完整响应:', parkSiteResult);
                
                // 🔧 修改判断逻辑：检查recordList数组来判断车辆是否在场
                if (parkSiteResult && parkSiteResult.data && 
                    parkSiteResult.data.recordList && 
                    Array.isArray(parkSiteResult.data.recordList) && 
                    parkSiteResult.data.recordList.length > 0) {
                    
                    console.log('✅ [步骤2] 车辆在场，recordList有数据:', parkSiteResult.data.recordList);
                    
                    // 在场，返回完整的响应数据用于违规记录
                    const firstRecord = parkSiteResult.data.recordList[0];
                    return {
                        hasAppointment: false,
                        isOnSite: true,
                        onSiteData: parkSiteResult.data, // 返回完整的data，包含recordList
                        enterTime: firstRecord.enterTime || startTime, // 从recordList中获取进场时间
                        suggestedAction: 'use_onsite_data',
                        message: `车辆当前在场，共找到 ${parkSiteResult.data.recordList.length} 条进场记录`
                    };
                } else {
                    console.log('❌ [步骤2] 车辆未在场或recordList为空');
                    console.log('📊 [步骤2] 响应数据结构分析:');
                    console.log('  - parkSiteResult.data:', parkSiteResult?.data);
                    console.log('  - recordList存在:', !!(parkSiteResult?.data?.recordList));
                    console.log('  - recordList是数组:', Array.isArray(parkSiteResult?.data?.recordList));
                    console.log('  - recordList长度:', parkSiteResult?.data?.recordList?.length || 0);
                    
                    // 不在场，返回提示信息
                    return {
                        hasAppointment: false,
                        isOnSite: false,
                        onSiteData: parkSiteResult?.data || null,
                        suggestedAction: 'show_not_onsite_warning',
                        message: 'recordList为空，车辆当前未在场，无法添加违规记录'
                    };
                }
            }
        } catch (error) {
            console.error('❌ [车牌点击处理] 处理失败:', error);
            
            // 处理失败，返回错误信息
            return {
                hasError: true,
                error: error,
                suggestedAction: 'show_error',
                message: `查询失败：${error.message || '网络错误'}`
            };
        }
    },

    // 🆕 简化版本的预约记录查询方法
    getAppointmentRecords(plateNumber) {
        return appointmentAPI.getAppointmentPlateNumber(plateNumber);
    },

    // 🆕 简化版本的违规分析方法
    analyzeViolationByPlate(plateNumber) {
        return apiRequest(apiUrls.appointmentAnalysis.analysis.replace('{plateNumber}', plateNumber));
    }
};

// 违规类型相关API
export const violationTypeApi = {
    // 获取违规类型列表
    getViolationTypes() {
        return apiRequest(apiUrls.violationTypes.list);
    },

    // 创建违规类型
    createViolationType(typeData) {
        return apiRequest(apiUrls.violationTypes.create, {
            method: 'POST',
            body: typeData
        });
    },

    // 更新违规类型
    updateViolationType(id, typeData) {
        return apiRequest(apiUrls.violationTypes.update.replace('{id}', id), {
            method: 'PUT',
            body: typeData
        });
    },

    // 删除违规类型
    deleteViolationType(id) {
        return apiRequest(apiUrls.violationTypes.delete.replace('{id}', id), {
            method: 'DELETE'
        });
    }
};

// 🆕 预约记录分析相关API
export const appointmentAnalysisApi = {
    // 根据车牌号查询预约记录（调用真正的appointment接口）
    getAppointmentRecords(plateNumber) {
        return appointmentAPI.getAppointmentPlateNumber(plateNumber);
    },

    // 根据车牌号分析违规情况
    analyzeViolation(plateNumber) {
        return apiRequest(apiUrls.appointmentAnalysis.analysis.replace('{plateNumber}', plateNumber));
    },

    // 🆕 根据车牌号查询违规相关的预约记录（原来的接口）
    getViolationAppointmentRecords(plateNumber) {
        return apiRequest(apiUrls.appointmentAnalysis.records.replace('{plateNumber}', plateNumber));
    },

    // 🆕 通过业主信息关联查询预约记录
    getAppointmentRecordsByOwner(params = {}) {
        const requestParams = {
            keyword: params.keyword || '',
            page: params.page || 1,
            size: params.size || 50,
            ...params
        };
        
        return apiRequest('/api/violations/appointment-records-by-owner', {
            method: 'GET',
            body: requestParams
        });
    }
};

// 黑名单相关API
export const blacklistApi = {
    // 获取黑名单类型列表
    getSpecialCarTypeList(parkCode) {
        return apiRequest('/parking/blackList/getSpecialCarTypeList', {
            method: 'GET',
            body: {
                parkCodeList: parkCode
            }
        });
    },

    // 查询单个车辆黑名单状态
    getParkBlack(plateNumber, parkCode) {
        return apiRequest('/parking/blackList/getParkBlack', {
            method: 'GET',
            body: {
                carNumber: plateNumber,
                parkCode: parkCode
            }
        });
    },

    // 批量获取黑名单车辆
    getParkBlackList(parkCode, page = 1, size = 50) {
        // 🔧 增加参数校验和调试信息
        console.log('🚨 [getParkBlackList] 开始处理黑名单查询');
        console.log('🚨 [getParkBlackList] 输入参数 - parkCode:', parkCode, '类型:', typeof parkCode);
        console.log('🚨 [getParkBlackList] 输入参数 - page:', page, '类型:', typeof page);
        console.log('🚨 [getParkBlackList] 输入参数 - size:', size, '类型:', typeof size);
        
        // 校验车场编码
        if (!parkCode || parkCode === '' || parkCode === null || parkCode === undefined) {
            console.error('❌ [getParkBlackList] 车场编码为空或无效:', parkCode);
            // 返回一个包含错误信息的Promise
            return Promise.resolve({
                resultCode: 400,
                message: '前端校验：车场编码不能为空',
                status: 2,
                data: {}
            });
        }
        
        // 确保车场编码是字符串类型
        const validParkCode = String(parkCode).trim();
        console.log('🔧 [getParkBlackList] 处理后的车场编码:', validParkCode);
        
        // 🔧 尝试两种不同的参数格式
        const requestBody1 = {
            parkCode: validParkCode,
            pageNum: parseInt(page),
            pageSize: parseInt(size)
        };
        
        const requestBody2 = {
            parkCodeList: validParkCode,  // 🔧 尝试使用 parkCodeList 参数
            pageNum: parseInt(page),
            pageSize: parseInt(size)
        };
        
        console.log('🚨 [getParkBlackList] 请求体方案1 (parkCode):', JSON.stringify(requestBody1, null, 2));
        console.log('🚨 [getParkBlackList] 请求体方案2 (parkCodeList):', JSON.stringify(requestBody2, null, 2));
        
        // 🔧 先尝试使用 parkCodeList 参数格式（参考getSpecialCarTypeList的成功案例）
        console.log('🔧 [getParkBlackList] 使用 parkCodeList 参数格式');
        
        // 🔧 尝试 GET 方法（参考其他黑名单接口都使用GET）
        console.log('🔧 [getParkBlackList] 尝试使用 GET 方法');
        
        return apiRequest('/parking/blackList/getParkBlackList', {
            method: 'GET',  // 🔧 改为 GET 方法
            body: requestBody2  // 使用 parkCodeList 格式
        });
    },

    // 添加车辆到黑名单
    addBlackListCar(plateNumber, parkCode, specialCarType = 1) {
        return apiRequest('/parking/blackList/addBlackListCar', {
            method: 'GET',
            body: {
                carNumber: plateNumber,
                parkCode: parkCode,
                specialCarType: specialCarType
            }
        });
    },

    // 从黑名单移除车辆
    removeBlackListCar(plateNumber, parkCode) {
        return apiRequest('/parking/blackList/removeBlackListCar', {
            method: 'GET',
            body: {
                carNumber: plateNumber,
                parkCode: parkCode
            }
        });
    }
};

// 工具函数
export const apiUtils = {
    // 格式化日期范围参数
    formatDateRange(startDate, endDate) {
        const params = {};
        if (startDate) {
            params.startDate = startDate;
        }
        if (endDate) {
            params.endDate = endDate;
        }
        return params;
    },

    // 格式化分页参数
    formatPagination(page = 1, size = 20) {
        return {
            page: parseInt(page),
            size: parseInt(size)
        };
    },

    // 处理API错误
    handleApiError(error, defaultMessage = '操作失败') {
        console.error('API错误:', error);
        
        // 在uni-app中显示错误提示
        if (typeof uni !== 'undefined') {
            uni.showToast({
                title: error.message || defaultMessage,
                icon: 'none',
                duration: 2000
            });
        }
        
        return error;
    }
};

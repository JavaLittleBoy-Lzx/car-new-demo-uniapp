/**
 * 微信UnionID工具类
 * 用于处理小程序和公众号之间的用户身份关联
 */
export class WechatUnionUtils {
  
  /**
   * 获取用户完整信息（包含UnionID）
   */
  static async getUserFullInfo() {
    try {
      console.log('🚀 getUserFullInfo 开始执行...');
      
      // 1. 先尝试静默登录获取
      console.log('🔐 尝试静默登录...');
      const loginResult = await this.silentLogin();
      console.log('📱 静默登录结果:', loginResult);
      
      if (loginResult && loginResult.unionid) {
        console.log('✅ 静默登录获取到UnionID:', loginResult.unionid.substring(0, 8) + '...');
        return loginResult;
      }
      
      // 2. 如果没有unionid，需要用户授权获取
      console.log('🔔 静默登录未获取到UnionID，需要用户授权获取完整信息');
      const authResult = await this.authorizedLogin();
      console.log('📱 授权登录结果:', authResult);
      return authResult;
      
    } catch (error) {
      console.error('❌ getUserFullInfo 执行失败:', error);
      console.error('❌ 错误详情:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * 静默登录（不弹出授权框）
   */
  static silentLogin() {
    return new Promise((resolve, reject) => {
      console.log('🔐 silentLogin 开始执行...');
      
      uni.login({
        provider: 'weixin',
        success: async (loginRes) => {
          try {
            console.log('🔐 获取到登录code:', loginRes.code.substring(0, 8) + '...');
            console.log('🌐 准备调用后端接口...');
            
            // 调用后端接口，通过code获取用户信息
            const requestUrl = 'https://www.xuerparking.cn:8543/parking/wechat/getUnionInfo';
            const requestData = {
              code: loginRes.code,
              grant_type: 'authorization_code'
            };
            
            console.log('📡 请求URL:', requestUrl);
            console.log('📤 请求数据:', requestData);
            
            const response = await uni.request({
              url: requestUrl,
              method: 'POST',
              data: requestData
            });
            
            console.log('📥 收到响应:', response);
            
            const result = response[1].data;
            console.log('📊 响应结果:', result);
            
            if (result.code === '0') {
              console.log('✅ 静默登录成功');
              console.log('📱 返回数据:', result.data);
              resolve(result.data);
            } else {
              console.error('❌ 静默登录失败，错误码:', result.code, '错误信息:', result.msg);
              reject(new Error(result.msg));
            }
            
          } catch (error) {
            console.error('❌ 静默登录执行失败:', error);
            console.error('❌ 错误详情:', {
              message: error.message,
              stack: error.stack
            });
            reject(error);
          }
        },
        fail: (error) => {
          console.error('❌ uni.login 调用失败:', error);
          reject(error);
        }
      });
    });
  }
  
  /**
   * 授权登录（需要用户主动授权）
   */
  static authorizedLogin() {
    return new Promise((resolve, reject) => {
      // 获取用户信息授权
      uni.getUserProfile({
        desc: '用于完善用户资料和检查公众号关注状态',
        success: async (profileRes) => {
          try {
            console.log('👤 用户授权成功');
            
            // 先获取登录code
            const loginRes = await new Promise((res, rej) => {
              uni.login({
                provider: 'weixin',
                success: res,
                fail: rej
              });
            });
            
            console.log('🔐 获取到授权登录code:', loginRes.code.substring(0, 8) + '...');
            
            // 调用后端接口
            const response = await uni.request({
              url: 'https://www.xuerparking.cn:8543/parking/wechat/getUnionInfoWithAuth',
              method: 'POST',
              data: {
                code: loginRes.code,
                encrypted_data: profileRes.encryptedData,
                iv: profileRes.iv,
                signature: profileRes.signature,
                raw_data: profileRes.rawData
              }
            });
            
            const result = response[1].data;
            if (result.code === '0') {
              console.log('✅ 授权登录成功，获取到UnionID:', result.data.unionid ? result.data.unionid.substring(0, 8) + '...' : 'null');
              resolve(result.data);
            } else {
              reject(new Error(result.msg));
            }
            
          } catch (error) {
            console.error('授权登录失败:', error);
            reject(error);
          }
        },
        fail: (error) => {
          console.log('❌ 用户拒绝授权');
          reject(error);
        }
      });
    });
  }
  
  /**
   * 通过UnionID检查关注状态
   */
  static async checkSubscriptionByUnionid(unionid) {
    if (!unionid) {
      return { isSubscribed: false, message: '无UnionID' };
    }
    
    try {
      console.log('🔍 检查关注状态 - UnionID:', unionid.substring(0, 8) + '...');
      
      const response = await uni.request({
        url: 'https://www.xuerparking.cn:8543/parking/wechat/checkSubscriptionByUnionid',
        method: 'GET',
        data: { unionid }
      });
      
      const result = response[1].data;
      if (result.code === '0') {
        console.log('📊 关注状态检查结果:', result.data);
        return result.data;
      } else {
        throw new Error(result.msg);
      }
      
    } catch (error) {
      console.error('检查关注状态失败:', error);
      return { isSubscribed: false, error: error.message };
    }
  }
  
  /**
   * 生成临时绑定码
   */
  static async generateBindingCode(userInfo) {
    try {
      console.log('📱 生成临时绑定码');
      
      const response = await uni.request({
        url: 'https://www.xuerparking.cn:8543/parking/wechat/generateBindingCode',
        method: 'POST',
        data: {
          miniAppOpenid: userInfo.openid,
          unionid: userInfo.unionid,
          phone: userInfo.phone
        }
      });
      
      const result = response[1].data;
      if (result.code === '0') {
        console.log('✅ 生成绑定码成功:', result.data.bindingCode);
        return result.data;
      } else {
        throw new Error(result.msg);
      }
      
    } catch (error) {
      console.error('生成绑定码失败:', error);
      throw error;
    }
  }
  
  /**
   * 检查绑定状态
   */
  static async checkBindingStatus(bindingCode) {
    try {
      const response = await uni.request({
        url: 'https://www.xuerparking.cn:8543/parking/wechat/checkBindingStatus',
        method: 'GET',
        data: { bindingCode }
      });
      
      const result = response[1].data;
      if (result.code === '0') {
        return result.data;
      } else {
        throw new Error(result.msg);
      }
      
    } catch (error) {
      console.error('检查绑定状态失败:', error);
      throw error;
    }
  }
} 
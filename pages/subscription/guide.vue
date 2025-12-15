<template>
  <view class="subscription-guide">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <view class="navbar-content">
        <view class="navbar-left" @click="goBack">
          <text class="iconfont icon-back"></text>
        </view>
        <view class="navbar-title">关注公众号</view>
        <view class="navbar-right"></view>
      </view>
    </view>

    <!-- 主要内容区域 -->
    <view class="main-content">
      <!-- 头部说明 -->
      <view class="header-section">
        <image 
          class="guide-icon" 
          src="/static/images/wechat-guide.png" 
          mode="aspectFit"
        ></image>
        <view class="title">开启消息推送</view>
        <view class="subtitle">关注公众号，及时接收停车提醒</view>
      </view>

      <!-- 功能介绍 -->
      <view class="features-section">
        <view class="feature-item">
          <view class="feature-icon">🚗</view>
          <view class="feature-text">
            <view class="feature-title">停车提醒</view>
            <view class="feature-desc">超时停车及时提醒</view>
          </view>
        </view>
        <view class="feature-item">
          <view class="feature-icon">📋</view>
          <view class="feature-text">
            <view class="feature-title">预约通知</view>
            <view class="feature-desc">预约审核结果推送</view>
          </view>
        </view>
        <view class="feature-item">
          <view class="feature-icon">⚠️</view>
          <view class="feature-text">
            <view class="feature-title">违规提醒</view>
            <view class="feature-desc">违规行为及时通知</view>
          </view>
        </view>
      </view>

      <!-- 二维码区域 -->
      <view class="qrcode-section" v-if="qrcodeData.bindingCode">
        <view class="qrcode-title">扫描二维码关注公众号</view>
        <view class="qrcode-container">
          <image 
            class="qrcode-image" 
            :src="qrcodeData.qrcodeUrl" 
            mode="aspectFit"
            @error="handleQrcodeError"
          ></image>
        </view>
        <view class="binding-code">
          <text>绑定码：</text>
          <text class="code-text">{{ qrcodeData.bindingCode }}</text>
        </view>
        <view class="qrcode-tips">{{ qrcodeData.tips }}</view>
        
        <!-- 倒计时 -->
        <view class="countdown" v-if="countdown > 0">
          <text>{{ countdownText }}</text>
        </view>
      </view>

      <!-- 加载状态 -->
      <view class="loading-section" v-if="loading">
        <uni-load-more status="loading" content-text="正在生成二维码..."></uni-load-more>
      </view>

      <!-- 错误提示 -->
      <view class="error-section" v-if="error">
        <view class="error-message">{{ error }}</view>
        <button class="retry-btn" @click="initGuide">重试</button>
      </view>

      <!-- 底部按钮 -->
      <view class="bottom-section">
        <button 
          class="check-btn" 
          @click="checkSubscriptionStatus"
          :disabled="checking"
        >
          {{ checking ? '检查中...' : '我已关注，检查状态' }}
        </button>
        <view class="skip-link" @click="skipSubscription">
          <text>暂时跳过</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { WechatUnionUtils } from '@/utils/wechat-union.js'

export default {
  name: 'SubscriptionGuide',
  data() {
    return {
      loading: false,
      checking: false,
      error: '',
      unionid: '',
      userInfo: null,
      qrcodeData: {},
      countdown: 0,
      countdownTimer: null
    }
  },
  
  computed: {
    countdownText() {
      if (this.countdown <= 0) return ''
      const minutes = Math.floor(this.countdown / 60)
      const seconds = this.countdown % 60
      return `二维码将在 ${minutes}:${seconds.toString().padStart(2, '0')} 后过期`
    }
  },
  
  onLoad(options) {
    console.log('📱 进入关注引导页面');
    this.unionid = options.unionid || '';
    this.initGuide();
  },
  
  onUnload() {
    this.clearCountdown();
  },
  
  methods: {
    /**
     * 初始化引导流程
     */
    async initGuide() {
      try {
        this.loading = true;
        this.error = '';
        
        // 1. 获取用户信息
        if (!this.userInfo) {
          this.userInfo = await WechatUnionUtils.getUserFullInfo();
          this.unionid = this.userInfo.unionid;
        }
        
        console.log('👤 用户信息获取成功');
        
        // 2. 先检查一下当前关注状态
        const subscriptionStatus = await WechatUnionUtils.checkSubscriptionByUnionid(this.unionid);
        
        if (subscriptionStatus.isSubscribed) {
          console.log('✅ 用户已关注公众号');
          this.showSubscribedMessage();
          return;
        }
        
        // 3. 生成绑定码和二维码
        await this.generateQrcode();
        
      } catch (error) {
        console.error('初始化引导流程失败:', error);
        this.error = '初始化失败：' + error.message;
      } finally {
        this.loading = false;
      }
    },
    
    /**
     * 生成二维码
     */
    async generateQrcode() {
      try {
        console.log('📱 生成绑定二维码');
        
        const bindingData = await WechatUnionUtils.generateBindingCode(this.userInfo);
        this.qrcodeData = bindingData;
        
        // 启动倒计时
        this.startCountdown(bindingData.expireTime);
        
        console.log('✅ 二维码生成成功');
        
      } catch (error) {
        console.error('生成二维码失败:', error);
        throw error;
      }
    },
    
    /**
     * 启动倒计时
     */
    startCountdown(expireTime) {
      this.clearCountdown();
      
      const updateCountdown = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((expireTime - now) / 1000));
        
        this.countdown = remaining;
        
        if (remaining <= 0) {
          this.clearCountdown();
          this.error = '二维码已过期，请重新生成';
          this.qrcodeData = {};
        }
      };
      
      updateCountdown();
      this.countdownTimer = setInterval(updateCountdown, 1000);
    },
    
    /**
     * 清除倒计时
     */
    clearCountdown() {
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
      }
    },
    
    /**
     * 检查关注状态
     */
    async checkSubscriptionStatus() {
      try {
        this.checking = true;
        console.log('🔍 检查关注状态...');
        
        const subscriptionStatus = await WechatUnionUtils.checkSubscriptionByUnionid(this.unionid);
        
        if (subscriptionStatus.isSubscribed) {
          console.log('✅ 检查到用户已关注');
          this.showSubscribedMessage();
        } else {
          console.log('❌ 用户尚未关注');
          uni.showToast({
            title: '尚未检测到关注，请先关注公众号',
            icon: 'none',
            duration: 2000
          });
        }
        
      } catch (error) {
        console.error('检查关注状态失败:', error);
        uni.showToast({
          title: '检查失败，请稍后重试',
          icon: 'none'
        });
      } finally {
        this.checking = false;
      }
    },
    
    /**
     * 显示已关注的消息
     */
    showSubscribedMessage() {
      uni.showModal({
        title: '关注成功',
        content: '您已成功关注公众号，将及时收到停车相关提醒！',
        showCancel: false,
        confirmText: '确定',
        success: () => {
          this.goBack();
        }
      });
    },
    
    /**
     * 跳过关注
     */
    skipSubscription() {
      uni.showModal({
        title: '提示',
        content: '跳过关注将无法及时收到停车提醒，确定要跳过吗？',
        confirmText: '确定跳过',
        cancelText: '继续关注',
        success: (res) => {
          if (res.confirm) {
            this.goBack();
          }
        }
      });
    },
    
    /**
     * 二维码加载错误处理
     */
    handleQrcodeError() {
      console.error('二维码加载失败');
      this.error = '二维码加载失败，请重试';
    },
    
    /**
     * 返回上一页
     */
    goBack() {
      if (getCurrentPages().length > 1) {
        uni.navigateBack();
      } else {
        uni.reLaunch({
          url: '/pages/auth/phone-auth'
        });
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.subscription-guide {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 自定义导航栏 */
.custom-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  
  .navbar-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 88rpx;
    padding: 0 30rpx;
    padding-top: var(--status-bar-height);
  }
  
  .navbar-left, .navbar-right {
    width: 80rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .navbar-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
  }
  
  .icon-back {
    font-size: 36rpx;
    color: #666;
  }
}

/* 主要内容 */
.main-content {
  padding-top: calc(88rpx + var(--status-bar-height));
  padding: calc(88rpx + var(--status-bar-height)) 40rpx 40rpx;
}

/* 头部区域 */
.header-section {
  text-align: center;
  margin-bottom: 60rpx;
  
  .guide-icon {
    width: 120rpx;
    height: 120rpx;
    margin-bottom: 30rpx;
  }
  
  .title {
    font-size: 48rpx;
    font-weight: 600;
    color: white;
    margin-bottom: 16rpx;
  }
  
  .subtitle {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.8);
  }
}

/* 功能介绍 */
.features-section {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 24rpx;
  padding: 40rpx 30rpx;
  margin-bottom: 60rpx;
  backdrop-filter: blur(10px);
  
  .feature-item {
    display: flex;
    align-items: center;
    margin-bottom: 30rpx;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .feature-icon {
    width: 60rpx;
    height: 60rpx;
    font-size: 32rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 24rpx;
  }
  
  .feature-text {
    flex: 1;
  }
  
  .feature-title {
    font-size: 30rpx;
    font-weight: 600;
    color: white;
    margin-bottom: 8rpx;
  }
  
  .feature-desc {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.7);
  }
}

/* 二维码区域 */
.qrcode-section {
  background: white;
  border-radius: 24rpx;
  padding: 40rpx;
  text-align: center;
  margin-bottom: 40rpx;
  
  .qrcode-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 30rpx;
  }
  
  .qrcode-container {
    display: flex;
    justify-content: center;
    margin-bottom: 30rpx;
    
    .qrcode-image {
      width: 400rpx;
      height: 400rpx;
      border-radius: 16rpx;
      border: 2rpx solid #f0f0f0;
    }
  }
  
  .binding-code {
    font-size: 28rpx;
    color: #666;
    margin-bottom: 20rpx;
    
    .code-text {
      font-weight: 600;
      color: #0081ff;
      font-size: 32rpx;
    }
  }
  
  .qrcode-tips {
    font-size: 24rpx;
    color: #999;
    line-height: 1.4;
    margin-bottom: 20rpx;
  }
  
  .countdown {
    font-size: 24rpx;
    color: #ff6b6b;
    font-weight: 500;
  }
}

/* 加载和错误状态 */
.loading-section, .error-section {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 24rpx;
  padding: 60rpx 40rpx;
  text-align: center;
  margin-bottom: 40rpx;
}

.error-message {
  font-size: 28rpx;
  color: white;
  margin-bottom: 30rpx;
}

.retry-btn {
  background: #0081ff;
  color: white;
  border: none;
  border-radius: 12rpx;
  padding: 20rpx 40rpx;
  font-size: 28rpx;
}

/* 底部按钮 */
.bottom-section {
  text-align: center;
  
  .check-btn {
    width: 100%;
    background: white;
    color: #0081ff;
    border: none;
    border-radius: 50rpx;
    height: 88rpx;
    font-size: 32rpx;
    font-weight: 600;
    margin-bottom: 30rpx;
    
    &[disabled] {
      background: rgba(255, 255, 255, 0.6);
      color: rgba(0, 129, 255, 0.6);
    }
  }
  
  .skip-link {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.8);
    text-decoration: underline;
  }
}
</style> 
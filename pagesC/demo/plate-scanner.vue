<template>
  <view class="container">
    <!-- 顶部导航栏 -->
    <view class="custom-navbar" v-if="!showCamera">
      <view class="navbar-left" @click="goBack">
        <text class="back-icon">←</text>
        <text class="back-text">返回</text>
      </view>
      <view class="navbar-title">车牌识别</view>
    </view>
    
    <view class="demo-header" v-if="!showCamera">
      <text class="title">车牌识别演示</text>
      <text class="subtitle">支持实时扫描和相册选择</text>
    </view>
    
    <!-- 摄像头识别界面 -->
    <view class="camera-container" v-if="showCamera">
      <camera 
        device-position="back" 
        flash="off" 
        @error="handleCameraError"
        class="camera-preview"
        ref="camera"
      >
        <!-- 车牌框选区域 -->
        <view class="plate-frame">
          <view class="frame-corner tl"></view>
          <view class="frame-corner tr"></view>
          <view class="frame-corner bl"></view>
          <view class="frame-corner br"></view>
          <text class="frame-text">自动识别中，请保持稳定</text>
        </view>
        
        <!-- 自动识别状态指示器 -->
        <view class="auto-status">
          <view class="status-dot"></view>
          <text class="status-text">自动识别: {{ autoRecognizeCount }}次</text>
        </view>
      </camera>
      
      <!-- 摄像头控制按钮 -->
      <view class="camera-controls">
        <!-- 手动拍照按钮 -->
        <button @tap="capturePhoto" :disabled="isRecognizing" class="capture-btn">
          <text class="camera-icon">📷</text>
          {{ isRecognizing ? '识别中...' : '手动拍照' }}
        </button>
        
        <button @tap="closeCamera" class="close-btn">
          <text class="close-icon">❌</text>
          关闭摄像头
        </button>
      </view>
      
      <!-- 加载提示 -->
      <view class="loading-overlay" v-if="isRecognizing">
        <view class="loading-content">
          <text class="loading-text">正在识别车牌...</text>
        </view>
      </view>
    </view>
    
    <!-- 功能按钮 -->
    <view class="function-buttons" v-if="!showCamera">
      <button @tap="startCamera" class="btn primary">
        <text class="btn-icon">📷</text>
        <text class="btn-text">摄像头识别</text>
      </button>
      
      <button @tap="chooseFromAlbum" class="btn secondary">
        <text class="btn-icon">🖼️</text>
        <text class="btn-text">相册识别</text>
      </button>
      
      <button @tap="toggleDebugMode" class="btn debug" :class="{ 'active': debugMode }">
        <text class="btn-icon">🔧</text>
        <text class="btn-text">{{ debugMode ? '正常模式' : '调试模式' }}</text>
      </button>
    </view>
    
    <!-- 识别结果展示 -->
    <view class="result-section" v-if="lastResult">
      <view class="section-title">最新识别结果</view>
      <view class="result-card">
        <view class="plate-number">{{ lastResult.plateNumber }}</view>
        <view class="result-details">
          <view class="detail-row">
            <text class="label">车牌颜色：</text>
            <text class="value">{{ lastResult.color }}</text>
          </view>
          <view class="detail-row">
            <text class="label">识别置信度：</text>
            <text class="value">{{ lastResult.confidence }}%</text>
          </view>
          <view class="detail-row">
            <text class="label">识别时间：</text>
            <text class="value">{{ formatTime(lastResult.recognizeTime) }}</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 使用说明 -->
    <view class="usage-guide">
      <view class="section-title">使用说明</view>
      <view class="guide-list">
        <view class="guide-item">
          <text class="guide-number">1</text>
          <text class="guide-text">点击"摄像头识别"自动开始扫描</text>
        </view>
        <view class="guide-item">
          <text class="guide-number">2</text>
          <text class="guide-text">将车牌对准框内，系统自动识别</text>
        </view>
        <view class="guide-item">
          <text class="guide-number">3</text>
          <text class="guide-text">识别成功会自动提示并继续扫描</text>
        </view>
        <view class="guide-item">
          <text class="guide-number">4</text>
          <text class="guide-text">也可点击"手动拍照"进行单次识别</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      lastResult: null,
      showCamera: false,
      isRecognizing: false,
      debugMode: false,
      // 新增自动识别相关变量
      autoRecognize: false,        // 自动识别开关
      autoRecognizeTimer: null,    // 自动识别定时器
      autoRecognizeCount: 0,       // 自动识别次数计数
      autoRecognizeInterval: 2000, // 自动识别间隔（2秒）
      lastRecognizeTime: 0         // 上次识别时间（防抖用）
    }
  },
  
  // 添加组件销毁时的清理
  beforeDestroy() {
    this.stopAutoRecognize()
  },
  
  methods: {
    // 启动摄像头
    startCamera() {
      this.showCamera = true
      // 自动开始识别
      setTimeout(() => {
        this.startAutoRecognize()
      }, 1000)
    },
    
    // 关闭摄像头
    closeCamera() {
      this.stopAutoRecognize()
      this.showCamera = false
    },
    
    // 开启自动识别
    startAutoRecognize() {
      if (this.autoRecognize) return
      
      this.autoRecognize = true
      this.autoRecognizeCount = 0
      console.log('🚀 开启自动识别模式')
      
      // 立即开始第一次识别
      this.performAutoRecognize()
    },
    
    // 停止自动识别
    stopAutoRecognize() {
      if (!this.autoRecognize) return
      
      this.autoRecognize = false
      if (this.autoRecognizeTimer) {
        clearTimeout(this.autoRecognizeTimer)
        this.autoRecognizeTimer = null
      }
      console.log('⏹️ 停止自动识别模式')
    },
    
    // 切换自动识别状态
    toggleAutoRecognize() {
      if (this.autoRecognize) {
        this.stopAutoRecognize()
      } else {
        this.startAutoRecognize()
      }
    },
    
    // 执行自动识别
    async performAutoRecognize() {
      if (!this.autoRecognize || !this.showCamera) return
      
      // 防抖：如果正在识别中，跳过此次
      if (this.isRecognizing) {
        console.log('⏭️ 跳过自动识别（正在识别中）')
        this.scheduleNextAutoRecognize()
        return
      }
      
      // 防抖：检查距离上次识别的时间间隔
      const now = Date.now()
      if (now - this.lastRecognizeTime < 2000) {
        console.log('⏭️ 跳过自动识别（间隔太短）')
        this.scheduleNextAutoRecognize()
        return
      }
      
      this.autoRecognizeCount++
      this.lastRecognizeTime = now
      console.log(`🔍 执行第${this.autoRecognizeCount}次自动识别`)
      
      try {
        // 自动拍照
        await this.autoCapture()
      } catch (error) {
        console.error('自动识别失败:', error)
      }
      
      // 调度下次自动识别
      this.scheduleNextAutoRecognize()
    },
    
    // 调度下次自动识别
    scheduleNextAutoRecognize() {
      if (!this.autoRecognize) return
      
      this.autoRecognizeTimer = setTimeout(() => {
        this.performAutoRecognize()
      }, this.autoRecognizeInterval)
    },
    
    // 自动拍照（用于自动识别）
    async autoCapture() {
      if (this.isRecognizing) return
      
      this.isRecognizing = true
      try {
        const ctx = uni.createCameraContext('camera', this)
        return new Promise((resolve, reject) => {
          ctx.takePhoto({
            quality: 'high',
            success: async (res) => {
              try {
                await this.recognizeFromImage(res.tempImagePath, true) // 传入true表示自动识别
                resolve()
              } catch (error) {
                reject(error)
              }
            },
            fail: (err) => {
              console.error('自动拍照失败:', err)
              this.isRecognizing = false
              reject(err)
            }
          })
        })
      } catch (error) {
        console.error('自动拍照异常:', error)
        this.isRecognizing = false
        throw error
      }
    },
    
    // 拍照识别（手动）
    async capturePhoto() {
      if (this.isRecognizing || this.autoRecognize) return
      
      this.isRecognizing = true
      try {
        // 从camera组件获取照片
        const ctx = uni.createCameraContext('camera', this)
        ctx.takePhoto({
          quality: 'high',
          success: (res) => {
            this.recognizeFromImage(res.tempImagePath, false) // 传入false表示手动识别
          },
          fail: (err) => {
            console.error('拍照失败:', err)
            uni.showToast({
              title: '拍照失败',
              icon: 'none'
            })
            this.isRecognizing = false
          }
        })
      } catch (error) {
        console.error('拍照异常:', error)
        this.isRecognizing = false
        uni.showToast({
          title: '拍照失败',
          icon: 'none'
        })
      }
    },
    
    // 摄像头错误处理
    handleCameraError(error) {
      console.error('摄像头错误:', error)
      uni.showToast({
        title: '摄像头启动失败',
        icon: 'none'
      })
      this.showCamera = false
    },
    
    // 从相册选择
    chooseFromAlbum() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album'],
        success: (res) => {
          this.recognizeFromImage(res.tempFilePaths[0])
        }
      })
    },
    
    // 从图片识别
    async recognizeFromImage(imagePath, isAutoRecognition = false) {
      if (!isAutoRecognition) {
        uni.showLoading({ title: '识别中...' })
      }
      
      try {
        const base64 = await this.imageToBase64(imagePath)
        const result = await this.callRecognitionAPI(base64, isAutoRecognition)
        
        if (result && result.success) {
          this.lastResult = {
            plateNumber: result.plateNumber || 'Unknown',
            color: result.color || '未知',
            confidence: result.confidence || 0,
            recognizeTime: new Date().toISOString()
          }
          
          if (isAutoRecognition) {
            // 自动识别成功，用提示框显示车牌号码
            console.log(`✅ 自动识别成功: ${result.plateNumber}`)
            uni.showModal({
              title: '车牌识别成功',
              content: `识别到车牌号码：${result.plateNumber}\n车牌颜色：${result.color}\n置信度：${result.confidence}%`,
              confirmText: '使用此车牌',
              cancelText: '继续识别',
              success: (res) => {
                if (res.confirm) {
                  // 用户选择使用此车牌，保存到全局数据并返回
                  this.selectPlate(result.plateNumber)
                }
                // 如果选择继续，自动识别会继续运行
              }
            })
          } else {
            // 手动识别成功，提供选择使用车牌的选项
            this.showCamera = false
            this.stopAutoRecognize()
            
            uni.showModal({
              title: '车牌识别成功',
              content: `识别到车牌号码：${result.plateNumber}\n车牌颜色：${result.color}\n置信度：${result.confidence}%`,
              confirmText: '使用此车牌',
              cancelText: '重新识别',
              success: (res) => {
                if (res.confirm) {
                  // 用户选择使用此车牌
                  this.selectPlate(result.plateNumber)
                } else {
                  // 重新开始识别
                  this.startCamera()
                }
              }
            })
          }
        } else {
          console.error('识别失败，API响应:', result);
          
          if (isAutoRecognition) {
            // 自动识别失败，静默处理，继续下次识别
            console.log(`❌ 第${this.autoRecognizeCount}次自动识别失败，继续下次识别`)
          } else {
            // 手动识别失败，显示错误信息
            const errorMsg = result && result.errorMessage ? result.errorMessage : '识别失败，请重试';
            uni.showToast({
              title: errorMsg,
              icon: 'none',
              duration: 3000
            })
          }
        }
      } catch (error) {
        console.error('识别API调用失败:', error)
        
        if (isAutoRecognition) {
          // 自动识别异常，静默处理
          console.log(`❌ 第${this.autoRecognizeCount}次自动识别异常:`, error.message)
        } else {
          // 手动识别异常，模拟结果用于测试
          this.lastResult = {
            plateNumber: '黑A12345',
            color: '蓝牌',
            confidence: 85,
            recognizeTime: new Date().toISOString()
          }
          
          this.showCamera = false
          this.stopAutoRecognize()
          
          uni.showToast({
            title: '模拟识别成功（请配置API）',
            icon: 'success'
          })
        }
      } finally {
        if (!isAutoRecognition) {
          uni.hideLoading()
        }
        this.isRecognizing = false
      }
    },
    
    // 切换调试模式
    toggleDebugMode() {
      this.debugMode = !this.debugMode;
      uni.showToast({
        title: this.debugMode ? '已开启调试模式' : '已关闭调试模式',
        icon: 'none',
        duration: 2000
      });
    },

    // 调用识别API
    async callRecognitionAPI(base64Image, isAutoRecognition = false) {
      console.log(isAutoRecognition ? '🤖 自动识别API调用' : '👆 手动识别API调用');
      
      try {
        // 移除base64中的空白字符
        const cleanBase64 = base64Image.replace(/\s/g, '');
        
        // 如果是调试模式，调用调试接口
        if (this.debugMode && !isAutoRecognition) { // 调试模式不影响自动识别
          console.log('🔧 调试模式激活，分析百度API响应...');
          await this.debugRawResponse(cleanBase64);
          return { success: true }; // 调试模式下不进行实际识别
        }
        
        // 先调试图片格式（仅手动识别时）
        if (!isAutoRecognition) {
          await this.debugImageFormat(cleanBase64);
        }
        
        const response = await uni.request({
          url: 'http://localhost:8543/api/plate/recognize',
          method: 'POST',
          header: {
            'Content-Type': 'application/json'
          },
          data: {
            image: cleanBase64,
            multiDetect: false  // 修正字段名
          },
          timeout: isAutoRecognition ? 15000 : 30000  // 自动识别使用较短超时
        });
        
        if (!isAutoRecognition) {
          console.log('车牌识别响应:', response);
        }
        
        if (response.statusCode === 200) {
          const result = response.data;
          
          // 检查响应格式：处理可能的双重嵌套结构
          let plateData = null;
          
          if (result.code === "0" && result.data) {
            // 检查是否是双重嵌套的Result结构
            if (result.data.code === "0" && result.data.data) {
              plateData = result.data.data; // 双重嵌套情况
            } else if (result.data.success) {
              plateData = result.data; // 正常情况
            }
          }
          
          if (plateData && plateData.success) {
            const recognitionResult = {
              success: true,
              plateNumber: plateData.plateNumber || '未识别',
              color: plateData.color || '未知',
              confidence: plateData.confidence || 0,
              recognizeTime: new Date().toISOString()
            };
            
            return recognitionResult;
          } else {
            // 处理错误情况
            let errorMsg = '识别失败';
            
            // 更智能的错误信息提取
            if (result.code === "-1") {
              errorMsg = result.msg || '识别失败';
            } else if (result.data && result.data.code === "-1") {
              errorMsg = result.data.msg || '识别失败';
            } else if (result.data && result.data.errorMessage) {
              errorMsg = result.data.errorMessage;
            } else if (!plateData) {
              errorMsg = '未检测到车牌或响应格式异常';
            }
            
            throw new Error(errorMsg);
          }
        } else {
          throw new Error(`请求失败: ${response.statusCode}`);
        }
      } catch (error) {
        if (!isAutoRecognition) {
          console.error('车牌识别失败:', error);
          uni.showToast({
            title: error.message || '识别失败',
            icon: 'error',
            duration: 3000
          });
        }
        
        // 返回错误结果
        return {
          success: false,
          errorMessage: error.message || '识别失败'
        };
      } finally {
        this.isRecognizing = false;
      }
    },
    
    // 调试图片格式
    async debugImageFormat(base64Image) {
      try {
        const response = await uni.request({
          url: 'http://localhost:8543/api/plate/debug/image-format',
          method: 'POST',
          header: {
            'Content-Type': 'application/json'
          },
          data: {
            image: base64Image
          },
          timeout: 10000
        });
        
        if (response.statusCode === 200 && response.data.code === "0") {
          const debugInfo = response.data.data;
          console.log('📊 图片格式调试信息:', response.data);
          console.log('📊 实际debugInfo:', debugInfo);
          
          // 显示调试信息
          const formatInfo = `
格式: ${debugInfo?.detectedFormat || '未知'}
原始长度: ${debugInfo?.originalLength || '未知'}
清理后长度: ${debugInfo?.cleanedLength || '未知'}
解码大小: ${debugInfo?.decodedSize || '未知'}字节
文件头: ${debugInfo?.fileHeader || '未知'}
是否有效: ${debugInfo?.valid ? '✅' : '❌'}
          `.trim();
          
          console.log('🔍 图片分析结果:\n' + formatInfo);
          
          if (!debugInfo?.valid) {
            console.error('❌ 图片格式无效:', debugInfo?.error);
          }
        } else {
          console.error('❌ 图片格式调试请求失败:', response);
        }
      } catch (error) {
        console.error('调试图片格式失败:', error);
      }
    },
    
    // 图片转base64
    imageToBase64(imagePath) {
      return new Promise((resolve, reject) => {
        uni.getFileSystemManager().readFile({
          filePath: imagePath,
          encoding: 'base64',
          success: (res) => {
            // 确保base64数据格式正确，移除可能的换行符和空格
            let base64Data = res.data;
            if (base64Data) {
              base64Data = base64Data.replace(/\s/g, ''); // 移除所有空白字符
              console.log('Base64 图片大小:', base64Data.length);
            }
            resolve(base64Data);
          },
          fail: (error) => {
            console.error('图片转base64失败:', error);
            reject(error);
          }
        })
      })
    },
    
    // 格式化时间
    formatTime(timeStr) {
      const date = new Date(timeStr)
      return date.toLocaleString()
    },

    // 选择车牌并返回上一页
    selectPlate(plateNumber) {
      console.log('🎯 [车牌选择] 用户选择车牌:', plateNumber)
      
      // 保存车牌号码到全局数据
      getApp().globalData.selectedPlateNumber = plateNumber
      
      // 停止所有识别活动
      this.stopAutoRecognize()
      this.showCamera = false
      
      // 显示成功提示并返回
      uni.showToast({
        title: `已选择: ${plateNumber}`,
        icon: 'success',
        duration: 1500,
        success: () => {
          // 延迟返回，让用户看到提示
          setTimeout(() => {
            uni.navigateBack()
          }, 1000)
        }
      })
         },

     // 返回上一页
     goBack() {
       console.log('🔙 [导航] 返回违规添加页面')
       // 停止所有识别活动
       this.stopAutoRecognize()
       this.showCamera = false
       
       // 返回上一页
       uni.navigateBack()
     },
     
      // 添加调试原始响应的方法
    async debugRawResponse(base64Image) {
      console.log('🔍 调试百度API原始响应...');
      
      try {
        const cleanBase64 = base64Image.replace(/\s/g, '');
        
        const response = await uni.request({
          url: 'http://localhost:8543/api/plate/debug/raw-response',
          method: 'POST',
          header: {
            'Content-Type': 'application/json'
          },
          data: {
            image: cleanBase64,
            multiDetect: false
          },
          timeout: 30000
        });
        
        console.log('🔧 调试响应:', response);
        
        if (response.statusCode === 200 && response.data.code === "0") {
          const debugData = response.data.data;
          console.log('📊 百度API原始响应分析:');
          console.log('请求时间:', debugData.requestTime);
          console.log('图片长度:', debugData.imageLength);
          console.log('清理后长度:', debugData.cleanedImageLength);
          console.log('原始响应:', debugData.rawResponse);
          console.log('响应结构:', debugData.responseStructure);
          
          // 在页面上显示调试信息
          this.lastResult = {
            plateNumber: '🔧 调试模式',
            color: '查看控制台获取详细信息',
            confidence: `图片长度: ${debugData.imageLength} | 清理后: ${debugData.cleanedImageLength}`,
            recognizeTime: new Date().toISOString(),
            debugInfo: debugData
          };
          
          this.showCamera = false;
          
          // 显示调试成功提示
          uni.showToast({
            title: '调试信息已获取，请查看控制台',
            icon: 'none',
            duration: 3000
          });
        } else {
          console.error('❌ 调试请求失败:', response);
        }
        
      } catch (error) {
        console.error('❌ 调试异常:', error);
      }
    }
  }
}
</script>

<style scoped>
.container {
  background: #f5f5f5;
  min-height: 100vh;
}

/* 自定义导航栏样式 */
.custom-navbar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  background: #0081ff;
  color: white;
  padding: 0 40rpx;
}

.navbar-left {
  position: absolute;
  left: 40rpx;
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 10rpx;
  border-radius: 8rpx;
  transition: background-color 0.3s;
}

.navbar-left:active {
  background-color: rgba(255, 255, 255, 0.1);
}

.back-icon {
  font-size: 36rpx;
  font-weight: bold;
}

.back-text {
  font-size: 28rpx;
}

.navbar-title {
  font-size: 32rpx;
  font-weight: bold;
}

/* 调整demo-header的上边距 */
.demo-header {
  text-align: center;
  margin: 40rpx 40rpx 60rpx 40rpx;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.subtitle {
  font-size: 28rpx;
  color: #666;
}

.function-buttons {
  display: flex;
  gap: 30rpx;
  margin: 0 40rpx 60rpx 40rpx;
}

.btn {
  flex: 1;
  height: 120rpx;
  border-radius: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: none;
  font-size: 28rpx;
}

.btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.btn.secondary {
  background: #fff;
  color: #333;
  border: 1rpx solid #ddd;
}

.btn.debug {
  background: #fff;
  color: #666;
  border: 1rpx solid #ccc;
  transition: all 0.3s ease;
}

.btn.debug.active {
  background: linear-gradient(135deg, #ff9800 0%, #f57f17 100%);
  color: #fff;
  border: none;
  box-shadow: 0 4rpx 12rpx rgba(255, 152, 0, 0.3);
}

.btn-icon {
  font-size: 36rpx;
  margin-bottom: 10rpx;
}

.result-section, .usage-guide {
  background: #fff;
  border-radius: 20rpx;
  padding: 40rpx;
  margin: 0 40rpx 40rpx 40rpx;
}

.section-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
}

.result-card {
  text-align: center;
}

.plate-number {
  font-size: 64rpx;
  font-weight: bold;
  color: #007aff;
  margin-bottom: 30rpx;
  letter-spacing: 8rpx;
}

.result-details {
  text-align: left;
}

.detail-row {
  display: flex;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.detail-row:last-child {
  border-bottom: none;
}

.label {
  width: 200rpx;
  color: #666;
}

.value {
  color: #333;
  font-weight: bold;
}

.guide-list {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.guide-item {
  display: flex;
  align-items: center;
  gap: 30rpx;
}

.guide-number {
  width: 60rpx;
  height: 60rpx;
  background: #007aff;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: bold;
}

.guide-text {
  font-size: 28rpx;
  color: #333;
}

/* 摄像头界面样式 */
.camera-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  z-index: 1000;
}

.camera-preview {
  width: 100%;
  height: 100vh;
  position: relative;
}

.plate-frame {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 300rpx;
  height: 120rpx;
  border: 4rpx solid #00ff00;
  border-radius: 8rpx;
}

.frame-corner {
  position: absolute;
  width: 40rpx;
  height: 40rpx;
  border: 6rpx solid #00ff00;
}

.frame-corner.tl {
  top: -6rpx;
  left: -6rpx;
  border-right: none;
  border-bottom: none;
}

.frame-corner.tr {
  top: -6rpx;
  right: -6rpx;
  border-left: none;
  border-bottom: none;
}

.frame-corner.bl {
  bottom: -6rpx;
  left: -6rpx;
  border-right: none;
  border-top: none;
}

.frame-corner.br {
  bottom: -6rpx;
  right: -6rpx;
  border-left: none;
  border-top: none;
}

.frame-text {
  position: absolute;
  bottom: -60rpx;
  left: 50%;
  transform: translateX(-50%);
  color: #fff;
  font-size: 28rpx;
  white-space: nowrap;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.8);
}

/* 自动识别状态指示器 */
.auto-status {
  position: absolute;
  top: 100rpx;
  right: 40rpx;
  display: flex;
  align-items: center;
  gap: 10rpx;
  background: rgba(0, 0, 0, 0.6);
  padding: 10rpx 20rpx;
  border-radius: 20rpx;
  backdrop-filter: blur(10rpx);
}

.status-dot {
  width: 20rpx;
  height: 20rpx;
  background: #00ff00;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.2); }
  100% { opacity: 1; transform: scale(1); }
}

.status-text {
  color: #fff;
  font-size: 24rpx;
  font-weight: bold;
}

.camera-controls {
  position: absolute;
  bottom: 100rpx;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 30rpx;
  z-index: 1001;
}

.capture-btn, .close-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: none;
  font-size: 24rpx;
  font-weight: bold;
  color: #fff;
  transition: all 0.3s ease;
}

.capture-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.4);
}

.capture-btn:disabled {
  background: #999;
  box-shadow: none;
  opacity: 0.5;
}

.close-btn {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.4);
}

.camera-icon, .close-icon {
  font-size: 32rpx;
  margin-bottom: 8rpx;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1002;
}

.loading-content {
  background: rgba(255, 255, 255, 0.9);
  padding: 40rpx 60rpx;
  border-radius: 20rpx;
  backdrop-filter: blur(10rpx);
}

.loading-text {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}
</style> 
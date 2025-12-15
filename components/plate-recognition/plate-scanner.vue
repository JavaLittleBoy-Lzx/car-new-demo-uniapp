<template>
  <view class="plate-scanner">
    <!-- 摄像头预览区域 -->
    <view class="camera-container">
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
          <text class="frame-text">请将车牌对准框内</text>
        </view>
      </camera>
    </view>

    <!-- 控制按钮区域 -->
    <view class="control-panel">
      <view class="btn-group">
        <button @tap="capturePhoto" :disabled="isRecognizing" class="capture-btn">
          <text class="iconfont icon-camera"></text>
          {{ isRecognizing ? '识别中...' : '拍照识别' }}
        </button>
        
        <button @tap="selectFromAlbum" class="album-btn">
          <text class="iconfont icon-image"></text>
          从相册选择
        </button>
      </view>
    </view>

    <!-- 识别结果显示 -->
    <view class="result-panel" v-if="plateResult">
      <view class="result-item">
        <text class="label">车牌号码：</text>
        <text class="value">{{ plateResult.number }}</text>
      </view>
      <view class="result-item">
        <text class="label">置信度：</text>
        <text class="value">{{ plateResult.confidence }}%</text>
      </view>
      <view class="result-item">
        <text class="label">车牌颜色：</text>
        <text class="value">{{ plateResult.color }}</text>
      </view>
      
      <view class="btn-group">
        <button @tap="confirmResult" class="confirm-btn">确认使用</button>
        <button @tap="retryRecognition" class="retry-btn">重新识别</button>
      </view>
    </view>

    <!-- 加载提示 -->
    <view class="loading-overlay" v-if="isRecognizing">
      <view class="loading-content">
        <text class="loading-text">正在识别车牌...</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'PlateScanner',
  props: {
    // 是否自动识别
    autoRecognize: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isRecognizing: false,
      plateResult: null,
      autoRecognizeTimer: null
    }
  },
  mounted() {
    if (this.autoRecognize) {
      this.startAutoRecognize()
    }
  },
  beforeDestroy() {
    if (this.autoRecognizeTimer) {
      clearInterval(this.autoRecognizeTimer)
    }
  },
  methods: {
    // 拍照识别
    async capturePhoto() {
      if (this.isRecognizing) return
      
      this.isRecognizing = true
      try {
        // 从camera组件获取照片
        const ctx = uni.createCameraContext('camera', this)
        ctx.takePhoto({
          quality: 'high',
          success: (res) => {
            this.recognizePlate(res.tempImagePath)
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
      }
    },

    // 从相册选择
    selectFromAlbum() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album'],
        success: (res) => {
          const imagePath = res.tempFilePaths[0]
          this.recognizePlate(imagePath)
        }
      })
    },

    // 车牌识别核心方法
    async recognizePlate(imagePath) {
      this.isRecognizing = true
      try {
        // 将图片转为base64
        const base64 = await this.imageToBase64(imagePath)
        
        // 调用车牌识别API
        const result = await this.callPlateRecognitionAPI(base64)
        
        if (result && result.words_result && result.words_result.length > 0) {
          const plate = result.words_result[0]
          this.plateResult = {
            number: plate.number,
            confidence: Math.round(plate.probability.average * 100),
            color: plate.color,
            type: plate.type
          }
          
          // 发送识别成功事件
          this.$emit('recognition-success', this.plateResult)
        } else {
          uni.showToast({
            title: '未识别到车牌',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('车牌识别失败:', error)
        uni.showToast({
          title: '识别失败，请重试',
          icon: 'none'
        })
      } finally {
        this.isRecognizing = false
      }
    },

    // 调用车牌识别API
    async callPlateRecognitionAPI(base64Image) {
      const response = await uni.request({
        url: this.$config.baseUrl + '/api/plate/recognize',
        method: 'POST',
        data: {
          image: base64Image,
          detect_direction: true
        },
        header: {
          'Authorization': 'Bearer ' + uni.getStorageSync('token')
        }
      })
      
      if (response.statusCode === 200) {
        return response.data.data
      } else {
        throw new Error('API调用失败')
      }
    },

    // 图片转base64
    imageToBase64(imagePath) {
      return new Promise((resolve, reject) => {
        uni.getFileSystemManager().readFile({
          filePath: imagePath,
          encoding: 'base64',
          success: (res) => {
            resolve(res.data)
          },
          fail: reject
        })
      })
    },

    // 开始自动识别
    startAutoRecognize() {
      this.autoRecognizeTimer = setInterval(() => {
        if (!this.isRecognizing) {
          this.capturePhoto()
        }
      }, 3000) // 每3秒自动识别一次
    },

    // 确认使用结果
    confirmResult() {
      this.$emit('plate-confirmed', this.plateResult)
      this.plateResult = null
    },

    // 重新识别
    retryRecognition() {
      this.plateResult = null
    },

    // 摄像头错误处理
    handleCameraError(error) {
      console.error('摄像头错误:', error)
      uni.showToast({
        title: '摄像头启动失败',
        icon: 'none'
      })
    }
  }
}
</script>

<style scoped>
.plate-scanner {
  width: 100%;
  height: 100vh;
  position: relative;
  background: #000;
}

.camera-container {
  width: 100%;
  height: 70vh;
  position: relative;
}

.camera-preview {
  width: 100%;
  height: 100%;
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
}

.control-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.8);
  padding: 40rpx;
}

.btn-group {
  display: flex;
  justify-content: space-around;
  gap: 20rpx;
}

.capture-btn, .album-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  border: none;
}

.capture-btn {
  background: #007aff;
  color: #fff;
}

.capture-btn:disabled {
  background: #666;
}

.album-btn {
  background: #fff;
  color: #333;
}

.result-panel {
  position: absolute;
  bottom: 200rpx;
  left: 40rpx;
  right: 40rpx;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20rpx;
  padding: 40rpx;
}

.result-item {
  display: flex;
  margin-bottom: 20rpx;
  font-size: 28rpx;
}

.label {
  color: #666;
  width: 160rpx;
}

.value {
  color: #333;
  font-weight: bold;
}

.confirm-btn {
  background: #09bb07;
  color: #fff;
}

.retry-btn {
  background: #ff6900;
  color: #fff;
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
}

.loading-content {
  background: rgba(255, 255, 255, 0.9);
  padding: 40rpx 60rpx;
  border-radius: 20rpx;
}

.loading-text {
  font-size: 28rpx;
  color: #333;
}
</style> 
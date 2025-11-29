/**
 * uQRCode 小程序二维码生成插件
 * 适用于 uni-app 和微信小程序
 */

class UQRCode {
  constructor() {
    this.qrcode = null;
    this.canvasId = '';
    this.componentInstance = null;
  }

  make(options) {
    const {
      canvasId,
      componentInstance,
      text,
      size = 200,
      margin = 10,
      backgroundColor = '#ffffff',
      foregroundColor = '#000000',
      errorCorrectLevel = 'M',
      success,
      fail
    } = options;

    this.canvasId = canvasId;
    this.componentInstance = componentInstance;

    try {
      // 生成二维码数据
      const qr = this.generateQRData(text, errorCorrectLevel);
      
      // 绘制到canvas
      this.drawQRCode(qr, {
        size,
        margin,
        backgroundColor,
        foregroundColor,
        success,
        fail
      });
    } catch (error) {
      console.error('uQRCode 生成失败:', error);
      if (fail) fail(error);
    }
  }

  generateQRData(text, errorCorrectLevel) {
    // 简化版二维码生成算法
    // 这里使用基础的二维码生成逻辑
    const qr = new QRCodeGenerator(text, errorCorrectLevel);
    qr.make();
    return qr;
  }

  drawQRCode(qr, options) {
    const { size, margin, backgroundColor, foregroundColor, success, fail } = options;
    
    try {
      const ctx = uni.createCanvasContext(this.canvasId, this.componentInstance);
      const moduleCount = qr.getModuleCount();
      const cellSize = (size - margin * 2) / moduleCount;

      // 清空画布
      ctx.clearRect(0, 0, size, size);

      // 绘制背景
      ctx.setFillStyle(backgroundColor);
      ctx.fillRect(0, 0, size, size);

      // 绘制二维码模块
      ctx.setFillStyle(foregroundColor);
      
      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          if (qr.isDark(row, col)) {
            const x = margin + col * cellSize;
            const y = margin + row * cellSize;
            ctx.fillRect(x, y, cellSize, cellSize);
          }
        }
      }

      ctx.draw(false, () => {
        console.log('二维码绘制完成');
        if (success) success();
      });

    } catch (error) {
      console.error('绘制二维码失败:', error);
      if (fail) fail(error);
    }
  }
}

// QR Code 生成器类
class QRCodeGenerator {
  constructor(text, errorCorrectLevel = 'M') {
    this.text = text;
    this.errorCorrectLevel = errorCorrectLevel;
    this.modules = null;
    this.moduleCount = 0;
  }

  make() {
    // 简化版二维码生成
    // 这里实现基础的二维码矩阵生成
    this.makeImpl();
  }

  makeImpl() {
    // 根据文本长度和纠错级别确定版本和大小
    const version = this.getVersionForText(this.text);
    this.moduleCount = version * 4 + 17; // QR码版本公式
    
    // 初始化模块矩阵
    this.modules = [];
    for (let i = 0; i < this.moduleCount; i++) {
      this.modules[i] = [];
      for (let j = 0; j < this.moduleCount; j++) {
        this.modules[i][j] = null;
      }
    }

    // 添加定位标记
    this.addPositionDetectionPattern();
    
    // 添加定时模式
    this.addTimingPattern();
    
    // 简化的数据填充
    this.addData();
  }

  getVersionForText(text) {
    const length = text.length;
    if (length <= 25) return 1;
    if (length <= 47) return 2;
    if (length <= 77) return 3;
    if (length <= 114) return 4;
    return 5; // 最大支持到版本5
  }

  addPositionDetectionPattern() {
    // 添加三个定位标记（左上、右上、左下）
    const positions = [
      [0, 0],
      [this.moduleCount - 7, 0],
      [0, this.moduleCount - 7]
    ];

    positions.forEach(([x, y]) => {
      for (let r = -1; r <= 7; r++) {
        for (let c = -1; c <= 7; c++) {
          const row = x + r;
          const col = y + c;
          
          if (row >= 0 && row < this.moduleCount && col >= 0 && col < this.moduleCount) {
            if ((0 <= r && r <= 6 && (c === 0 || c === 6)) ||
                (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
                (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
              this.modules[row][col] = true;
            } else {
              this.modules[row][col] = false;
            }
          }
        }
      }
    });
  }

  addTimingPattern() {
    // 添加定时模式
    for (let i = 8; i < this.moduleCount - 8; i++) {
      if (this.modules[6][i] === null) {
        this.modules[6][i] = (i % 2 === 0);
      }
      if (this.modules[i][6] === null) {
        this.modules[i][6] = (i % 2 === 0);
      }
    }
  }

  addData() {
    // 简化的数据添加
    // 将文本转换为二进制并填充到矩阵中
    const data = this.encodeText(this.text);
    let dataIndex = 0;
    
    // 从右下角开始，按Z字形填充数据
    for (let col = this.moduleCount - 1; col > 0; col -= 2) {
      if (col === 6) col--; // 跳过定时列
      
      for (let row = 0; row < this.moduleCount; row++) {
        for (let c = 0; c < 2; c++) {
          const currentCol = col - c;
          
          if (this.modules[row][currentCol] === null) {
            let dark = false;
            
            if (dataIndex < data.length) {
              dark = data[dataIndex] === '1';
              dataIndex++;
            }
            
            this.modules[row][currentCol] = dark;
          }
        }
      }
    }
  }

  encodeText(text) {
    // 简单的文本编码
    let binary = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      binary += charCode.toString(2).padStart(8, '0');
    }
    
    // 添加一些填充以匹配二维码格式
    while (binary.length < this.moduleCount * this.moduleCount / 4) {
      binary += '00000000'; // 填充字节
    }
    
    return binary;
  }

  getModuleCount() {
    return this.moduleCount;
  }

  isDark(row, col) {
    return this.modules[row] && this.modules[row][col] === true;
  }
}

// 导出
export default UQRCode; 
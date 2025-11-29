// 简化的二维码生成库
// 基于QRCode.js的最小实现

function QRCode(typeNumber, errorCorrectLevel) {
    this.typeNumber = typeNumber || 4;
    this.errorCorrectLevel = errorCorrectLevel || QRErrorCorrectLevel.M;
    this.modules = null;
    this.moduleCount = 0;
    this.dataList = [];
}

QRCode.prototype.addData = function(data) {
    this.dataList.push(data);
};

QRCode.prototype.make = function() {
    // 简化的生成逻辑
    this.moduleCount = this.typeNumber * 4 + 17;
    this.modules = [];
    
    // 初始化模块
    for (var row = 0; row < this.moduleCount; row++) {
        this.modules[row] = [];
        for (var col = 0; col < this.moduleCount; col++) {
            this.modules[row][col] = false;
        }
    }
    
    // 生成简单的测试图案（实际应用中应该使用完整的QR算法）
    this.setupFinderPatterns();
    this.setupDataPattern();
};

QRCode.prototype.setupFinderPatterns = function() {
    // 左上角定位符
    this.setupFinderPattern(0, 0);
    // 右上角定位符  
    this.setupFinderPattern(this.moduleCount - 7, 0);
    // 左下角定位符
    this.setupFinderPattern(0, this.moduleCount - 7);
};

QRCode.prototype.setupFinderPattern = function(x, y) {
    // 绘制7x7的定位符
    for (var r = -1; r <= 7; r++) {
        for (var c = -1; c <= 7; c++) {
            var row = y + r;
            var col = x + c;
            
            if (row < 0 || row >= this.moduleCount || col < 0 || col >= this.moduleCount) {
                continue;
            }
            
            if ((0 <= r && r <= 6 && (c == 0 || c == 6)) ||
                (0 <= c && c <= 6 && (r == 0 || r == 6)) ||
                (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
                this.modules[row][col] = true;
            } else {
                this.modules[row][col] = false;
            }
        }
    }
};

QRCode.prototype.setupDataPattern = function() {
    // 简化的数据模式，生成一个基于输入数据的伪随机图案
    var data = this.dataList.join('');
    var hash = this.simpleHash(data);
    
    for (var row = 0; row < this.moduleCount; row++) {
        for (var col = 0; col < this.moduleCount; col++) {
            // 跳过定位符区域
            if (this.isFinderPattern(row, col)) {
                continue;
            }
            
            // 基于哈希值和位置生成图案
            var value = (hash + row * 31 + col * 17) % 256;
            this.modules[row][col] = (value % 2 === 0);
        }
    }
};

QRCode.prototype.isFinderPattern = function(row, col) {
    // 检查是否在定位符区域
    return (row < 9 && col < 9) ||
           (row < 9 && col >= this.moduleCount - 8) ||
           (row >= this.moduleCount - 8 && col < 9);
};

QRCode.prototype.simpleHash = function(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        var char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash);
};

QRCode.prototype.isDark = function(row, col) {
    if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
        return false;
    }
    return this.modules[row][col];
};

QRCode.prototype.getModuleCount = function() {
    return this.moduleCount;
};

// 错误纠正级别
var QRErrorCorrectLevel = {
    L: 1,
    M: 0,
    Q: 3,
    H: 2
};

// 导出
export { QRCode, QRErrorCorrectLevel }; 
export class SimpleDataGenerator {
  constructor(options = {}) {
    this.config = {
      basePrice: options.basePrice || 100,
      volatility: options.volatility || 0.02, // 2% 波动率
      interval: options.interval || 1000, // 1秒间隔
      ...options
    };
    
    this.currentPrice = this.config.basePrice;
    this.dataCount = 0;
    this.isRunning = false;
    this.intervalId = null;
    this.listeners = new Set();
    
    // 事件回调
    this.onopen = null;
    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;
  }
  
  // 模拟WebSocket接口
  get readyState() {
    return this.isRunning ? 1 : 0; // 1 = OPEN, 0 = CONNECTING/CLOSED
  }
  
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // 模拟连接延迟
    setTimeout(() => {
      if (this.onopen) {
        this.onopen({ type: 'open' });
      }
      this.startDataGeneration();
    }, 100);
  }
  
  startDataGeneration() {
    if (!this.isRunning) return;
    
    // 立即生成第一个数据点
    this.generateDataPoint();
    
    // 设置定时器，每秒生成一个数据点
    this.intervalId = setInterval(() => {
      if (this.isRunning) {
        this.generateDataPoint();
      }
    }, this.config.interval);
  }
  
  generateDataPoint() {
    // 生成价格波动
    const changePercent = (Math.random() - 0.5) * 2 * this.config.volatility;
    const priceChange = this.currentPrice * changePercent;
    this.currentPrice = Math.max(0.01, this.currentPrice + priceChange);
    
    // 生成交易量
    const baseVolume = 1000;
    const volumeVariation = Math.random() * 2000;
    const volume = Math.floor(baseVolume + volumeVariation);
    
    const data = {
      timestamp: Date.now(),
      price: Number(this.currentPrice.toFixed(2)),
      volume: volume,
      change: Number((changePercent * 100).toFixed(2)),
      changePercent: changePercent > 0 ? 'up' : 'down',
      high: Number((this.currentPrice * 1.001).toFixed(2)),
      low: Number((this.currentPrice * 0.999).toFixed(2)),
      sequence: ++this.dataCount
    };
    
    // 通知监听器
    if (this.onmessage) {
      this.onmessage({
        data: JSON.stringify(data),
        type: 'message'
      });
    }
    
    // 通知其他监听器
    this.notifyListeners('data', data);
  }
  
  // 添加监听器
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  // 通知监听器
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Data generator listener error:', error);
      }
    });
  }
  
  // 模拟WebSocket的close方法
  close() {
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    if (this.onclose) {
      this.onclose({ type: 'close' });
    }
  }
  
  // 模拟WebSocket的send方法
  send(data) {
    console.log('SimpleDataGenerator send:', data);
  }
  
  // 获取统计信息
  getStats() {
    return {
      totalGenerated: this.dataCount,
      currentPrice: this.currentPrice,
      isRunning: this.isRunning,
      interval: this.config.interval
    };
  }
}

// 工厂函数
export function createSimpleDataGenerator(options) {
  const generator = new SimpleDataGenerator(options);
  generator.start();
  return generator;
} 
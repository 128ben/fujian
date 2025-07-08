export class SimpleDataGenerator {
  constructor(options = {}) {
    this.config = {
      basePrice: options.basePrice || 100,
      volatility: options.volatility || 0.02,
      interval: options.interval || 1000,
      ...options
    };
    
    this.currentPrice = this.config.basePrice;
    this.dataCount = 0;
    this.isRunning = false;
    this.intervalId = null;
    this.listeners = new Set();
    
    this.onopen = null;
    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;
  }
  
  get readyState() {
    return this.isRunning ? 1 : 0;
  }
  
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    setTimeout(() => {
      if (this.onopen) {
        this.onopen({ type: 'open' });
      }
      this.startDataGeneration();
    }, 100);
  }
  
  startDataGeneration() {
    if (!this.isRunning) return;
    
    this.generateDataPoint();
    
    this.intervalId = setInterval(() => {
      if (this.isRunning) {
        this.generateDataPoint();
      }
    }, this.config.interval);
  }
  
  generateDataPoint() {
    const changePercent = (Math.random() - 0.5) * 2 * this.config.volatility;
    const priceChange = this.currentPrice * changePercent;
    this.currentPrice = Math.max(0.01, this.currentPrice + priceChange);
    
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
    
    if (this.onmessage) {
      this.onmessage({
        data: JSON.stringify(data),
        type: 'message'
      });
    }
    
    this.notifyListeners('data', data);
  }
  
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        // 静默处理错误，避免影响其他监听器
      }
    });
  }
  
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
  
  send(data) {
    // WebSocket send方法的模拟实现，当前为空
  }
  
  getStats() {
    return {
      totalGenerated: this.dataCount,
      currentPrice: this.currentPrice,
      isRunning: this.isRunning,
      interval: this.config.interval
    };
  }
}

export function createSimpleDataGenerator(options) {
  const generator = new SimpleDataGenerator(options);
  generator.start();
  return generator;
} 
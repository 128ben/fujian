export class PriceDataManager {
  constructor(maxDataPoints = 2000, renderDelay = 1000) {
    this.data = [];
    this.maxDataPoints = maxDataPoints;
    this.renderDelay = renderDelay;
    this.listeners = new Set();
    this.stats = {
      totalReceived: 0,
      averageFrequency: 0,
      lastMinuteCount: 0
    };
    
    this.dataQueue = [];
    this.renderTimer = null;
    this.isProcessing = false;
    this.frequencyTracker = [];
    this.frequencyInterval = setInterval(() => this.updateFrequencyStats(), 1000);
    this.lastPrice = null;
    
    // 协调的更新频率配置
    this.updateConfig = {
      renderDelay: renderDelay,
      checkInterval: 500, // 固定500ms检查间隔，与网格更新同步
      batchSize: 10 // 批处理大小
    };
    
    this.startRenderLoop();
  }
  
  addData(newData) {
    this.addExternalData(newData);
  }
  
  addExternalData(newData) {
    const dataPoint = {
      ...newData,
      id: `${newData.timestamp}-${Math.random().toString(36).substr(2, 9)}`,
      receivedAt: Date.now()
    };
    
    if (this.lastPrice !== null && dataPoint.price !== undefined) {
      dataPoint.change = ((dataPoint.price - this.lastPrice) / this.lastPrice * 100).toFixed(2);
    } else {
      dataPoint.change = 0;
    }
    
    if (dataPoint.price !== undefined) {
      this.lastPrice = dataPoint.price;
    }
    
    this.dataQueue.push(dataPoint);
    this.stats.totalReceived++;
    this.frequencyTracker.push(Date.now());
  }
  
  startRenderLoop() {
    // 使用固定的检查间隔，与其他组件协调
    this.renderTimer = setInterval(() => {
      this.processQueuedData();
    }, this.updateConfig.checkInterval);
  }
  
  processQueuedData() {
    if (this.isProcessing || this.dataQueue.length === 0) return;
    
    this.isProcessing = true;
    
    try {
      const now = Date.now();
      const dataToRender = [];
      let processedCount = 0;
      
      // 批量处理数据，避免一次处理过多数据
      while (this.dataQueue.length > 0 && processedCount < this.updateConfig.batchSize) {
        const oldestData = this.dataQueue[0];
        const dataAge = now - oldestData.receivedAt;
        
        if (dataAge >= this.updateConfig.renderDelay) {
          dataToRender.push(this.dataQueue.shift());
          processedCount++;
        } else {
          break;
        }
      }
      
      // 批量渲染数据
      if (dataToRender.length > 0) {
        dataToRender.forEach(dataPoint => {
          this.renderData(dataPoint);
        });
      }
      
    } finally {
      this.isProcessing = false;
    }
  }
  
  renderData(dataPoint) {
    this.data.push(dataPoint);
    
    if (this.data.length > this.maxDataPoints) {
      this.data.shift();
    }
    
    this.notifyListeners('dataAdded', dataPoint);
  }
  
  updateFrequencyStats() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    this.frequencyTracker = this.frequencyTracker.filter(time => time > oneMinuteAgo);
    this.stats.lastMinuteCount = this.frequencyTracker.length;
    this.stats.averageFrequency = this.stats.lastMinuteCount > 0 ? this.stats.lastMinuteCount / 60 : 0;
  }
  
  getLatestData(count = 100) {
    return this.data.slice(-count);
  }
  
  getDataInTimeRange(startTime, endTime) {
    return this.data.filter(item => 
      item.timestamp >= startTime && item.timestamp <= endTime
    );
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
        // 静默处理错误，避免中断其他监听器
      }
    });
  }
  
  getStats() {
    return { 
      ...this.stats,
      queuedData: this.dataQueue.length,
      renderedData: this.data.length,
      renderDelay: this.renderDelay
    };
  }
  
  clear() {
    this.data = [];
    this.dataQueue = [];
    this.frequencyTracker = [];
    this.stats.totalReceived = 0;
    this.stats.lastMinuteCount = 0;
    this.stats.averageFrequency = 0;
    this.lastPrice = null;
    this.notifyListeners('dataCleared');
  }
  
  destroy() {
    if (this.frequencyInterval) {
      clearInterval(this.frequencyInterval);
    }
    if (this.renderTimer) {
      clearInterval(this.renderTimer);
    }
    this.listeners.clear();
  }
  
  getQueueInfo() {
    return {
      queueLength: this.dataQueue.length,
      oldestDataAge: this.dataQueue.length > 0 ? 
        Date.now() - this.dataQueue[0].receivedAt : 0,
      isProcessing: this.isProcessing,
      renderDelay: this.renderDelay
    };
  }
  
  setRenderDelay(newDelay) {
    this.renderDelay = newDelay;
    this.updateConfig.renderDelay = newDelay;
    
    if (this.renderTimer) {
      clearInterval(this.renderTimer);
    }
    this.startRenderLoop();
  }
  
  flushQueue() {
    while (this.dataQueue.length > 0) {
      const dataPoint = this.dataQueue.shift();
      this.renderData(dataPoint);
    }
  }
  
  getCurrentPrice() {
    return this.lastPrice;
  }
  
  getLatestDataPoint() {
    return this.data.length > 0 ? this.data[this.data.length - 1] : null;
  }
} 
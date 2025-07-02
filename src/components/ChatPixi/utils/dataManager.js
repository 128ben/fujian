export class PriceDataManager {
  constructor(maxDataPoints = 2000, renderDelay = 1000) {
    this.data = [];
    this.maxDataPoints = maxDataPoints;
    this.renderDelay = renderDelay; // 可配置的延迟时间
    this.listeners = new Set();
    this.stats = {
      totalReceived: 0,
      averageFrequency: 0,
      lastMinuteCount: 0
    };
    
    // 数据缓存队列 - 延迟渲染机制
    this.dataQueue = [];
    this.renderTimer = null;
    this.isProcessing = false;
    
    // 统计最近一分钟的数据频率
    this.frequencyTracker = [];
    this.frequencyInterval = setInterval(() => this.updateFrequencyStats(), 1000);
    
    // 上一个价格，用于计算变化百分比
    this.lastPrice = null;
    
    // 启动渲染循环
    this.startRenderLoop();
  }
  
  // 原有的添加数据方法（兼容性保留）
  addData(newData) {
    this.addExternalData(newData);
  }
  
  // 新的外部数据添加方法
  addExternalData(newData) {
    const dataPoint = {
      ...newData,
      id: `${newData.timestamp}-${Math.random().toString(36).substr(2, 9)}`,
      receivedAt: Date.now() // 记录接收时间
    };
    
    // 计算价格变化百分比
    if (this.lastPrice !== null && dataPoint.price !== undefined) {
      dataPoint.change = ((dataPoint.price - this.lastPrice) / this.lastPrice * 100).toFixed(2);
    } else {
      dataPoint.change = 0;
    }
    
    // 更新最后价格
    if (dataPoint.price !== undefined) {
      this.lastPrice = dataPoint.price;
    }
    
    // 将数据加入队列而不是立即处理
    this.dataQueue.push(dataPoint);
    this.stats.totalReceived++;
    
    // 记录接收时间用于频率统计
    this.frequencyTracker.push(Date.now());
    
    // 不立即通知监听器，等待渲染循环处理
  }
  
  startRenderLoop() {
    // 使用配置的延迟时间检查并渲染队列中的数据
    const checkInterval = Math.min(this.renderDelay / 2, 500); // 检查频率不超过500ms
    this.renderTimer = setInterval(() => {
      this.processQueuedData();
    }, checkInterval);
  }
  
  processQueuedData() {
    if (this.isProcessing || this.dataQueue.length === 0) return;
    
    this.isProcessing = true;
    
    try {
      // 获取队列中最早的数据（延迟指定时间渲染）
      const now = Date.now();
      const dataToRender = [];
      
      // 找出所有超过延迟时间的数据进行渲染
      while (this.dataQueue.length > 0) {
        const oldestData = this.dataQueue[0];
        const dataAge = now - oldestData.receivedAt;
        
        // 如果数据超过延迟时间，则可以渲染
        if (dataAge >= this.renderDelay) {
          dataToRender.push(this.dataQueue.shift());
        } else {
          // 如果最早的数据都不满足条件，则跳出循环
          break;
        }
      }
      
      // 批量处理要渲染的数据
      dataToRender.forEach(dataPoint => {
        this.renderData(dataPoint);
      });
      
    } finally {
      this.isProcessing = false;
    }
  }
  
  renderData(dataPoint) {
    // 添加到实际数据数组
    this.data.push(dataPoint);
    
    // 保持数据量在限制范围内
    if (this.data.length > this.maxDataPoints) {
      this.data.shift();
    }
    
    // 通知所有监听器进行渲染
    this.notifyListeners('dataAdded', dataPoint);
  }
  
  updateFrequencyStats() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // 清理超过1分钟的记录
    this.frequencyTracker = this.frequencyTracker.filter(time => time > oneMinuteAgo);
    
    // 计算最近一分钟的数据频率
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
        console.error('Data listener error:', error);
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
    this.dataQueue = []; // 清空队列
    this.frequencyTracker = [];
    this.stats.totalReceived = 0;
    this.stats.lastMinuteCount = 0;
    this.stats.averageFrequency = 0;
    this.lastPrice = null; // 重置最后价格
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
  
  // 获取队列状态信息
  getQueueInfo() {
    return {
      queueLength: this.dataQueue.length,
      oldestDataAge: this.dataQueue.length > 0 ? 
        Date.now() - this.dataQueue[0].receivedAt : 0,
      isProcessing: this.isProcessing,
      renderDelay: this.renderDelay
    };
  }
  
  // 设置新的延迟时间
  setRenderDelay(newDelay) {
    this.renderDelay = newDelay;
    
    // 重启渲染循环以应用新的延迟时间
    if (this.renderTimer) {
      clearInterval(this.renderTimer);
    }
    this.startRenderLoop();
  }
  
  // 强制处理队列中的所有数据（不考虑延迟）
  flushQueue() {
    while (this.dataQueue.length > 0) {
      const dataPoint = this.dataQueue.shift();
      this.renderData(dataPoint);
    }
  }
  
  // 获取当前价格
  getCurrentPrice() {
    return this.lastPrice;
  }
  
  // 获取最新的数据点
  getLatestDataPoint() {
    return this.data.length > 0 ? this.data[this.data.length - 1] : null;
  }
} 
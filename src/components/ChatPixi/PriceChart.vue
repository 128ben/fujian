<template>
  <div class="price-chart-container">
    <!-- 新增：时间线配置面板 -->
    <div class="timeline-config-panel">
      <div class="config-group">
        <label class="config-label">未来时间线:</label>
        <div class="config-controls">
          <label class="checkbox-wrapper">
            <input 
              type="checkbox" 
              v-model="showFutureTimeLine" 
              @change="toggleFutureTimeLine"
            />
            <span class="checkbox-label">显示</span>
          </label>
          <select 
            v-model="futureTimeLineInterval" 
            @change="changeFutureTimeLineInterval"
            :disabled="!showFutureTimeLine"
            class="interval-select"
          >
            <option value="15000">15秒</option>
            <option value="30000">30秒</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 控制面板 -->
    <div class="control-panel">
      <div class="stats-info">
        <span class="stat-item">
          <span class="label">更新频率:</span>
          <span class="value">{{ updateFrequency }}/秒</span>
        </span>
        <span class="stat-item">
          <span class="label">队列数据:</span>
          <span class="value">{{ queuedData }}</span>
        </span>
        <span class="stat-item">
          <span class="label">已渲染:</span>
          <span class="value">{{ renderedData }}</span>
        </span>
        <span class="stat-item">
          <span class="label">当前价格:</span>
          <span class="value" :class="priceChangeClass">${{ currentPrice }}</span>
        </span>
        <span class="stat-item">
          <span class="label">变化:</span>
          <span class="value" :class="priceChangeClass">{{ priceChange }}%</span>
        </span>
        <span class="stat-item">
          <span class="label">数据源:</span>
          <span class="value" :class="{ 'switching': isDataSourceSwitching }">
            {{ isDataSourceSwitching ? '切换中...' : currentDataSourceId }}
          </span>
        </span>
        <span class="stat-item" v-if="!isAtLatestPosition">
          <span class="label">位置:</span>
          <span class="value history-mode">历史数据</span>
        </span>
      </div>
      <div class="control-buttons">
        <button @click="zoomIn" class="control-btn">
          <span>🔍+</span>
          <span>放大</span>
        </button>
        <button @click="zoomOut" class="control-btn">
          <span>🔍-</span>
          <span>缩小</span>
        </button>
        <button @click="toggleLatestPriceLine" class="control-btn" :class="{ active: showLatestPriceLine }">
          <span>📏</span>
          <span>价格线</span>
        </button>
        <button @click="toggleAnimation" class="control-btn" :class="{ active: animationEnabled }">
          <span>🎬</span>
          <span>动画</span>
        </button>
      </div>
    </div>
    
    <!-- 回到最新位置按钮 -->
    <div v-if="!isAtLatestPosition" class="return-to-latest-btn" @click="returnToLatest">
      <span class="btn-icon">⏭️</span>
      <span class="btn-text">回到最新</span>
      <span v-if="isLoadingHistory" class="loading-indicator">📡</span>
    </div>
    
    <!-- 历史数据加载指示器 -->
    <div v-if="isLoadingHistory" class="loading-history-indicator">
      <div class="loading-spinner"></div>
      <span>正在加载历史数据...</span>
    </div>
    
    <!-- 图表容器 -->
    <div class="chart-container" ref="chartContainer"></div>
    

    
    <!-- 数据详情浮窗 -->
    <div v-if="hoveredData" class="data-tooltip" :style="tooltipStyle">
      <div class="tooltip-header">数据详情</div>
      <div class="tooltip-content">
        <p><strong>时间:</strong> {{ formatTime(hoveredData.timestamp) }}</p>
        <p><strong>价格:</strong> ${{ hoveredData.price }}</p>
        <p><strong>变化:</strong> {{ hoveredData.change }}%</p>
        <p><strong>成交量:</strong> {{ hoveredData.volume || 0 }}</p>
        <p><strong>序号:</strong> #{{ hoveredData.sequence || renderedData }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick, defineProps, defineExpose, defineEmits } from 'vue';
import { PriceDataManager } from './utils/dataManager.js';
import { PixiChart } from './utils/pixiChart.js';

const props = defineProps({
  realTimeData: {
    type: Array,
    default: () => []
  },
  currentPriceData: {
    type: Number,
    default: 100
  },
  useExternalData: {
    type: Boolean,
    default: true
  },
  renderDelay: {
    type: Number,
    default: 1000
  },
  dataSourceId: {
    type: String,
    default: 'default'
  },
  markerPoints: {
    type: Array,
    default: () => []
  },
  enableRandomMarkers: {
    type: Boolean,
    default: true
  },
  randomMarkerInterval: {
    type: Number,
    default: 60000 // 默认60秒，但实际使用时会是0-120秒的随机值
  },
  // 新增：未来时间线相关属性
  initialFutureTimeLineInterval: {
    type: Number,
    default: 15000 // 默认15秒
  },
  initialShowFutureTimeLine: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['markersRemoved']);

const chartContainer = ref(null);
const currentPrice = ref(100);
const priceChange = ref(0);
const queuedData = ref(0);
const renderedData = ref(0);
const updateFrequency = ref(0);
const hoveredData = ref(null);
const tooltipStyle = ref({});
const connectionStatus = ref('connecting');
const showLatestPriceLine = ref(true);
const animationEnabled = ref(false);
const currentDataSourceId = ref(props.dataSourceId);
const isDataSourceSwitching = ref(false);
const isAtLatestPosition = ref(true); // 新增：判断是否在最新位置
const isLoadingHistory = ref(false); // 新增：判断是否正在加载历史数据

// 新增：未来时间线相关的响应式变量
const futureTimeLineInterval = ref(props.initialFutureTimeLineInterval);
const showFutureTimeLine = ref(props.initialShowFutureTimeLine);

const priceChangeClass = computed(() => {
  return priceChange.value > 0 ? 'price-up' : priceChange.value < 0 ? 'price-down' : '';
});

const connectionStatusText = computed(() => {
  switch (connectionStatus.value) {
    case 'connected': return '数据接收中';
    case 'connecting': return '准备中...';
    case 'disconnected': return '已停止';
    default: return '未知状态';
  }
});

let dataManager = null;
let pixiChart = null;
let removeDataListener = null;
let statsInterval = null;
let lastPriceValue = 100;

onMounted(async () => {
  await nextTick();
  
  // // 打印组件挂载时的参数状态
  // console.log('🚀 组件挂载完成 - 参数状态:', {
  //   chartContainer: {
  //     存在: !!chartContainer.value,
  //     元素类型: chartContainer.value?.tagName,
  //     尺寸: chartContainer.value ? {
  //       width: chartContainer.value.offsetWidth,
  //       height: chartContainer.value.offsetHeight
  //     } : null
  //   },
  //   currentPrice: {
  //     当前值: currentPrice.value,
  //     类型: typeof currentPrice.value
  //   },
  //   时间戳: new Date().toLocaleString()
  // });
  
  initializeChart();
  setupDataManager();
  setupResize();
  startStatsUpdate();
  startPositionStatusUpdate(); // 启动位置状态更新
  connectionStatus.value = 'connected';
});

onUnmounted(() => {
  cleanup();
  stopPositionStatusUpdate(); // 清理位置状态更新
});

watch(
  
  () => props.realTimeData,
  
  (newData, oldData) => {

    // console.log('newData',newData)
    // console.log('oldData',oldData)

    if (isDataSourceSwitching.value) {
      return;
    }
    
    if (props.useExternalData && newData && newData.length > 0) {
      const hasNewData = !oldData || newData.length !== oldData.length || 
        newData.some((item, index) => !oldData[index] || 
          item.timestamp !== oldData[index].timestamp || 
          item.price !== oldData[index].price ||
          item.y !== oldData[index].y ||
          item.idxPx !== oldData[index].idxPx
        );
      
      if (hasNewData) {
        newData.forEach((dataPoint, index) => {
          if (dataManager) {
            const formattedData = formatExternalData(dataPoint);
            formattedData.sourceIndex = index;
            formattedData.dataSourceId = props.dataSourceId;
            dataManager.addExternalData(formattedData);
          }
        });
      }
    }
  },
  { deep: true, immediate: true }
  
);

watch(
  () => props.currentPriceData,
  (newPrice) => {
    if (props.useExternalData && newPrice !== undefined) {
      currentPrice.value = newPrice;
      if (lastPriceValue !== 0) {
        priceChange.value = ((newPrice - lastPriceValue) / lastPriceValue * 100).toFixed(2);
      }
      lastPriceValue = newPrice;
    }
  },
  { immediate: true }
);

watch(
  () => props.dataSourceId,
  (newDataSourceId, oldDataSourceId) => {
    if (newDataSourceId !== oldDataSourceId && oldDataSourceId !== undefined) {
      handleDataSourceSwitch(newDataSourceId);
    }
  },
  { immediate: false }
);

watch(
  () => props.markerPoints,
  (newMarkers) => {
    if (pixiChart && newMarkers && newMarkers.length > 0) {
      console.log('newMarkers',newMarkers)
      pixiChart.updateMarkers(newMarkers);
    }
  },
  { deep: true, immediate: true }
);

watch(
  () => props.useExternalData,
  (newValue, oldValue) => {
    if (newValue !== oldValue && oldValue !== undefined) {
      handleDataSourceModeSwitch(newValue);
    }
  },
  { immediate: false }
);

function initializeChart() {
  if (!chartContainer.value) return;
  
  const rect = chartContainer.value.getBoundingClientRect();
  
  pixiChart = new PixiChart(chartContainer.value, {
    width: rect.width,
    height: rect.height,
    backgroundColor: 0x1a1a1a,
    gridColor: 0x333333,
    lineColor: 0x00aaff,
    pointColor: 0xffffff,
    latestPointColor: 0xff4444,
    animationDuration: 500, // 与数据更新频率协调
    animationEnabled: false,
    enableRandomMarkers: props.enableRandomMarkers,
    randomMarkerInterval: props.randomMarkerInterval,
    // 新增：未来时间线配置
    futureTimeLineInterval: futureTimeLineInterval.value,
    showFutureTimeLine: showFutureTimeLine.value,
    onMarkersRemoved: (removedMarkerIds) => {
      console.log('标记点被移除，通知父组件:', removedMarkerIds);
      emit('markersRemoved', removedMarkerIds);
    },
    onRandomMarkerGenerated: (markerData) => {
      console.log('随机标记点生成:', markerData);
      // 可以在这里处理随机标记点生成事件，比如发送到父组件
    },
    onLoadMoreHistory: (earliestTime, callback) => {
      // 历史数据加载回调
      handleLoadMoreHistory(earliestTime, callback);
    },
    onReturnToLatest: () => {
      // 回到最新位置回调
      handleReturnToLatest();
    }
  });
}

function setupDataManager() {
  dataManager = new PriceDataManager(2000, props.renderDelay);
  
  removeDataListener = dataManager.addListener((event, data) => {
    if (event === 'dataAdded') {
      if (pixiChart) {
        pixiChart.addData(data);
      }
    } else if (event === 'dataCleared') {
      if (pixiChart) {
        pixiChart.clearData();
      }
      queuedData.value = 0;
      renderedData.value = 0;
      updateFrequency.value = 0;
    }
  });
}

function formatExternalData(externalData) {
  return {
    timestamp: externalData.label || externalData.timestamp || Date.now(),
    price: externalData.y || externalData.price || externalData.idxPx || 0,
    volume: externalData.volume || Math.floor(Math.random() * 10000),
    change: 0,
    sequence: externalData.sequence || 0
  };
}

function startStatsUpdate() {
  statsInterval = setInterval(() => {
    if (dataManager) {
      const stats = dataManager.getStats();
      queuedData.value = stats.queuedData;
      renderedData.value = stats.renderedData;
      updateFrequency.value = stats.averageFrequency.toFixed(1);
    }
  }, 500);
}

function setupResize() {
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      if (pixiChart && width > 0 && height > 0) {
        pixiChart.resize(width, height);
      }
    }
  });
  
  if (chartContainer.value) {
    resizeObserver.observe(chartContainer.value);
  }
}

function zoomIn() {
  if (pixiChart) {
    pixiChart.zoom(1.2, pixiChart.options.width / 2, pixiChart.options.height / 2);
  }
}

function zoomOut() {
  if (pixiChart) {
    pixiChart.zoom(0.8, pixiChart.options.width / 2, pixiChart.options.height / 2);
  }
}

function toggleLatestPriceLine() {
  showLatestPriceLine.value = !showLatestPriceLine.value;
  if (pixiChart) {
    pixiChart.setLatestPriceLineVisible(showLatestPriceLine.value);
  }
}

function toggleAnimation() {
  animationEnabled.value = !animationEnabled.value;
  if (pixiChart) {
    pixiChart.setAnimationEnabled(animationEnabled.value);
  }
}

function resetChart() {
  if (dataManager) {
    dataManager.clear();
  }
  
  if (pixiChart) {
    pixiChart.clearData();
  }
  
  currentPrice.value = props.currentPriceData || 100;
  priceChange.value = 0;
  queuedData.value = 0;
  renderedData.value = 0;
  updateFrequency.value = 0;
  lastPriceValue = props.currentPriceData || 100;
  connectionStatus.value = 'connected';
  isAtLatestPosition.value = true; // 重置时回到最新位置
}

function validateSync() {
  if (pixiChart) {
    pixiChart.validateGridChartSync();
  }
}

// 显示数据统计信息
function showDataStats() {
  if (pixiChart) {
    const isIntegrityOk = pixiChart.validateDataIntegrity();
    const dataStats = pixiChart.getDataStats();
    
    console.log('=== 📊 数据统计信息 ===');
    console.log('数据完整性:', isIntegrityOk ? '✅ 正常' : '❌ 异常');
    
    if (dataStats && dataStats.totalDataPoints) {
      console.log(`总数据点: ${dataStats.totalDataPoints}`);
      console.log(`时间范围: ${dataStats.timeRange.start} - ${dataStats.timeRange.end}`);
      console.log(`时间跨度: ${(dataStats.timeRange.spanMs / 1000 / 60).toFixed(1)} 分钟`);
      console.log(`价格范围: $${dataStats.priceRange.min} - $${dataStats.priceRange.max}`);
      console.log(`当前价格: $${dataStats.priceRange.current}`);
      
      // 显示用户友好的提示
      const message = `📊 数据统计
总数据点: ${dataStats.totalDataPoints}
时间跨度: ${(dataStats.timeRange.spanMs / 1000 / 60).toFixed(1)} 分钟
价格范围: $${dataStats.priceRange.min} - $${dataStats.priceRange.max}
当前价格: $${dataStats.priceRange.current}
数据完整性: ${isIntegrityOk ? '正常' : '异常'}`;
      
      alert(message);
    } else {
      console.log('无数据可显示');
      alert('📊 当前无数据');
    }
  } else {
    console.warn('图表未初始化');
    alert('⚠️ 图表未初始化');
  }
}

// 处理历史数据加载请求
function handleLoadMoreHistory(earliestTime, callback) {
  console.log('请求加载更多历史数据，最早时间:', new Date(earliestTime).toLocaleString());
  
  isLoadingHistory.value = true;
  
  // 模拟历史数据加载（实际项目中应该调用API）
  setTimeout(() => {
    try {
      // 生成模拟的历史数据
      const historicalData = generateMockHistoricalData(earliestTime, 50);
      
      // 使用新的历史数据添加方法
      if (pixiChart) {
        pixiChart.addHistoricalData(historicalData);
        
        // 验证数据完整性
        pixiChart.validateDataIntegrity();
      }
      
      // 调用回调通知加载完成
      if (callback) {
        callback();
      }
      
      isLoadingHistory.value = false;
    } catch (error) {
      console.error('历史数据加载失败:', error);
      isLoadingHistory.value = false;
      if (callback) {
        callback();
      }
    }
  }, 1000); // 模拟1秒的加载时间
}

// 生成模拟的历史数据
function generateMockHistoricalData(startTime, count) {
  const historicalData = [];
  const interval = 500; // 500ms间隔，与实时数据保持一致
  
  // 确保startTime是有效的时间戳
  const baseTime = typeof startTime === 'number' ? startTime : Date.now();
  
  for (let i = 0; i < count; i++) {
    // 从startTime往前推算，生成更早的历史数据
    const timestamp = baseTime - (count - i) * interval;
    
    // 生成更真实的价格变化
    const basePrice = 100;
    const timeOffset = timestamp / 100000; // 时间偏移影响
    const trendComponent = Math.sin(timeOffset) * 3; // 趋势成分
    const randomComponent = (Math.random() - 0.5) * 2; // 随机成分
    const price = basePrice + trendComponent + randomComponent;
    
    historicalData.push({
      timestamp: timestamp,
      price: Math.max(95, Math.min(105, price)), // 限制价格在合理范围内
      volume: Math.floor(Math.random() * 5000) + 1000, // 1000-6000的成交量
      change: 0, // 变化率会在添加到数据管理器时计算
      sequence: i,
      isHistorical: true // 标记为历史数据
    });
  }
  
  console.log(`生成历史数据: ${count} 条，时间范围: ${new Date(historicalData[0].timestamp).toLocaleTimeString()} - ${new Date(historicalData[historicalData.length - 1].timestamp).toLocaleTimeString()}`);
  
  return historicalData;
}

// 处理回到最新位置
function handleReturnToLatest() {
  console.log('用户回到最新位置');
  isAtLatestPosition.value = true;
}

// 新增：切换未来时间线显示
function toggleFutureTimeLine() {
  if (pixiChart) {
    pixiChart.toggleFutureTimeLine(showFutureTimeLine.value);
  }
}

// 新增：更改未来时间线间隔
function changeFutureTimeLineInterval() {
  if (pixiChart) {
    pixiChart.setFutureTimeLineInterval(parseInt(futureTimeLineInterval.value));
  }
}

// 手动回到最新位置
function returnToLatest() {
  if (pixiChart) {
    pixiChart.returnToLatest();
    isAtLatestPosition.value = true;
    console.log('手动回到最新位置');
  }
}

// 监听位置状态变化
function updatePositionStatus() {
  if (pixiChart) {
    const status = pixiChart.getPositionStatus();
    isAtLatestPosition.value = status.isAtLatestPosition;
    isLoadingHistory.value = status.isLoadingHistory;
  }
}

// 定期更新位置状态
let positionUpdateInterval = null;

function startPositionStatusUpdate() {
  positionUpdateInterval = setInterval(updatePositionStatus, 500);
}

function stopPositionStatusUpdate() {
  if (positionUpdateInterval) {
    clearInterval(positionUpdateInterval);
    positionUpdateInterval = null;
  }
}

function addData(dataPoint) {
  if (dataManager) {
    const formattedData = formatExternalData(dataPoint);
    dataManager.addExternalData(formattedData);
  }
}

function handleDataSourceSwitch(newDataSourceId) {
  isDataSourceSwitching.value = true;
  connectionStatus.value = 'connecting';
  
  try {
    if (dataManager) {
      dataManager.clear();
    }
    
    if (pixiChart) {
      pixiChart.clearData();
    }
    
    currentPrice.value = props.currentPriceData || 100;
    priceChange.value = 0;
    queuedData.value = 0;
    renderedData.value = 0;
    updateFrequency.value = 0;
    lastPriceValue = props.currentPriceData || 100;
    currentDataSourceId.value = newDataSourceId;
    
    connectionStatus.value = 'connected';
  } catch (error) {
    connectionStatus.value = 'disconnected';
  } finally {
    isDataSourceSwitching.value = false;
  }
}

function handleDataSourceModeSwitch(useExternal) {
  if (dataManager) {
    dataManager.clear();
  }
  
  if (pixiChart) {
    pixiChart.clearData();
  }
  
  currentPrice.value = props.currentPriceData || 100;
  priceChange.value = 0;
  queuedData.value = 0;
  renderedData.value = 0;
  updateFrequency.value = 0;
  lastPriceValue = props.currentPriceData || 100;
}

function getChartInstance() {
  return pixiChart;
}

function getDataManager() {
  return dataManager;
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function cleanup() {
  if (removeDataListener) {
    removeDataListener();
  }
  if (statsInterval) {
    clearInterval(statsInterval);
  }
  if (dataManager) {
    dataManager.destroy();
  }
  if (pixiChart) {
    pixiChart.destroy();
  }
  // 清理位置状态更新
  stopPositionStatusUpdate();
}

defineExpose({
  addData,
  resetChart,
  validateSync,
  getChartInstance,
  getDataManager,
  zoomIn,
  zoomOut,
  handleDataSourceSwitch,
  handleDataSourceModeSwitch,
  getCurrentDataSourceId: () => currentDataSourceId.value,
  isDataSourceSwitching: () => isDataSourceSwitching.value,
  forceRefresh: () => {
    if (pixiChart) {
      pixiChart.drawChart();
      pixiChart.drawGrid();
    }
  },
  addMarker: (markerData) => {
    if (pixiChart) {
      pixiChart.addMarker(markerData);
    }
  },
  removeMarker: (markerId) => {
    if (pixiChart) {
      pixiChart.removeMarker(markerId);
    }
  },
  clearMarkers: () => {
    if (pixiChart) {
      pixiChart.clearOrderMarkers(); // 改为只清除下单标记点
    }
  },
  clearAllMarkers: () => {
    if (pixiChart) {
      pixiChart.clearMarkers(); // 清除所有标记点，包括随机标记点
    }
  },
  // 随机标记点控制方法
  setRandomMarkersEnabled: (enabled) => {
    if (pixiChart) {
      pixiChart.setRandomMarkersEnabled(enabled);
    }
  },
  setRandomMarkerInterval: (interval) => {
    if (pixiChart) {
      pixiChart.setRandomMarkerInterval(interval);
    }
  },
  getRandomMarkerStatus: () => {
    return pixiChart ? pixiChart.getRandomMarkerStatus() : null;
  },
  generateRandomMarker: () => {
    if (pixiChart) {
      pixiChart.generateRandomMarker();
    }
  },
  // 历史数据加载方法
  loadHistoricalData: async (startTimestamp, endTimestamp) => {
    if (pixiChart) {
      isLoadingHistory.value = true;
      try {
        // 生成模拟的历史数据（实际项目中应该调用API）
        const historicalData = generateMockHistoricalData(startTimestamp, 50);
        
        // 使用addHistoricalData方法添加历史数据
        pixiChart.addHistoricalData(historicalData);
        
        // 验证数据完整性
        pixiChart.validateDataIntegrity();
        
        isAtLatestPosition.value = false;
        console.log('历史数据加载成功');
      } catch (error) {
        console.error('加载历史数据失败:', error);
        alert('加载历史数据失败，请检查控制台');
      } finally {
        isLoadingHistory.value = false;
      }
    }
  },
  returnToLatest: () => {
    if (pixiChart) {
      pixiChart.returnToLatest();
      isAtLatestPosition.value = true;
      console.log('已回到最新位置');
    }
  },
  isAtLatestPosition: () => {
    return isAtLatestPosition.value;
  },
  // 数据完整性验证
  validateDataIntegrity: () => {
    if (pixiChart) {
      return pixiChart.validateDataIntegrity();
    }
    return false;
  },
  // 获取数据统计信息
  getDataStats: () => {
    if (pixiChart) {
      const dataLength = pixiChart.data.length;
      if (dataLength === 0) {
        return { message: '无数据' };
      }
      
      const timestamps = pixiChart.data.map(d => d.timestamp);
      const prices = pixiChart.data.map(d => d.price);
      
      return {
        totalDataPoints: dataLength,
        timeRange: {
          start: new Date(Math.min(...timestamps)).toLocaleString(),
          end: new Date(Math.max(...timestamps)).toLocaleString(),
          spanMs: Math.max(...timestamps) - Math.min(...timestamps)
        },
        priceRange: {
          min: Math.min(...prices).toFixed(2),
          max: Math.max(...prices).toFixed(2),
          current: prices[prices.length - 1]?.toFixed(2) || 'N/A'
        }
      };
    }
    return null;
  }
});
</script>

<style scoped>
.price-chart-container {
  width: 100%;
  height: 60vh;
  display: flex;
  flex-direction: column;
  background-color: #1a1a1a;
  position: relative;
}

.timeline-config-panel {
  background: rgba(26, 26, 26, 0.95);
  border-bottom: 1px solid #333;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
  color: #cccccc;
  backdrop-filter: blur(10px);
  z-index: 10;
}

.config-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.config-label {
  font-weight: 500;
  color: #ffffff;
  white-space: nowrap;
}

.config-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  user-select: none;
}

.checkbox-wrapper input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #00aaff;
}

.checkbox-label {
  font-size: 13px;
  color: #cccccc;
}

.interval-select {
  background: rgba(51, 51, 51, 0.8);
  border: 1px solid #555;
  border-radius: 4px;
  padding: 4px 8px;
  color: #ffffff;
  font-size: 13px;
  outline: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.interval-select:hover:not(:disabled) {
  border-color: #00aaff;
  background: rgba(51, 51, 51, 1);
}

.interval-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.interval-select option {
  background: #333;
  color: #ffffff;
}

.control-panel {
  padding: 12px 20px;
  background: linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%);
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.stats-info {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.label {
  color: #888;
  font-size: 12px;
}

.value {
  color: #fff;
  font-weight: bold;
  font-size: 14px;
}

.price-up {
  color: #00ff88;
}

.price-down {
  color: #ff4444;
}

.switching {
  color: #ffa500;
  animation: pulse 1s infinite;
}

.control-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.control-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 12px;
  border: none;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 10px;
  transition: all 0.2s ease;
  min-width: 50px;
}

.control-btn:hover {
  background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
  transform: translateY(-1px);
}

.control-btn.active {
  background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);
}

.control-btn span:first-child {
  font-size: 16px;
}

.chart-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.connection-status {
  position: absolute;
  top: 80px;
  right: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 20px;
  font-size: 12px;
  backdrop-filter: blur(10px);
}

.connection-status .delay-info {
  font-size: 10px;
  color: #888;
  opacity: 0.8;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.connection-status.connected .status-dot {
  background-color: #00ff88;
}

.connection-status.connecting .status-dot {
  background-color: #ffa500;
}

.connection-status.disconnected .status-dot {
  background-color: #ff4444;
}

.data-tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 12px;
  border-radius: 8px;
  font-size: 12px;
  pointer-events: none;
  z-index: 1000;
  backdrop-filter: blur(10px);
  border: 1px solid #333;
}

.tooltip-header {
  font-weight: bold;
  margin-bottom: 8px;
  color: #00aaff;
  border-bottom: 1px solid #333;
  padding-bottom: 4px;
}

.tooltip-content p {
  margin: 4px 0;
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.return-to-latest-btn {
  position: absolute;
  top: 120px; /* Adjust based on control panel height */
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
  z-index: 10;
  backdrop-filter: blur(10px);
  border: 1px solid #333;
}

.return-to-latest-btn:hover {
  background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
  transform: translateY(-1px);
}

.return-to-latest-btn .btn-icon {
  font-size: 18px;
}

.return-to-latest-btn .btn-text {
  font-weight: bold;
}

.loading-history-indicator {
  position: absolute;
  top: 120px; /* Adjust based on control panel height */
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 10px;
  font-size: 14px;
  backdrop-filter: blur(10px);
  border: 1px solid #333;
  z-index: 10;
}

.loading-history-indicator .loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #00aaff;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
}

.history-mode {
  color: #ffa500 !important;
  font-weight: bold;
}

.loading-indicator {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .control-panel {
    flex-direction: column;
    gap: 10px;
  }
  
  .stats-info {
    justify-content: center;
  }
  
  .control-buttons {
    justify-content: center;
  }
  
  .control-btn {
    min-width: 45px;
    padding: 6px 8px;
  }
}
</style> 
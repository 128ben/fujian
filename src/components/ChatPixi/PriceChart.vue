<template>
  <div class="price-chart-container">
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
        <button @click="resetChart" class="control-btn">
          <span>🔄</span>
          <span>重置</span>
        </button>
        <button @click="validateSync" class="control-btn">
          <span>🔍</span>
          <span>同步检查</span>
        </button>
      </div>
    </div>
    
    <!-- 图表容器 -->
    <div class="chart-container" ref="chartContainer"></div>
    
    <!-- 连接状态指示器 -->
    <div class="connection-status" :class="connectionStatus">
      <div class="status-dot"></div>
      <span>{{ connectionStatusText }}</span>
      <span class="delay-info">延迟1秒渲染</span>
    </div>
    
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
import { ref, computed, onMounted, onUnmounted, watch, nextTick, defineProps, defineExpose } from 'vue';
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
  }
});

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
  connectionStatus.value = 'connected';
});

onUnmounted(() => {
  cleanup();
});

watch(
  
  () => props.realTimeData,
  
  (newData, oldData) => {

    console.log('newData',newData)
    console.log('oldData',oldData)

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
    animationDuration: 400,
    animationEnabled: false
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
}

function validateSync() {
  if (pixiChart) {
    const syncResult = pixiChart.validateGridChartSync();
    if (syncResult) {
      const statusMsg = syncResult.isInSync ? '✅ 网格与折线图完美同步' : '⚠️ 网格与折线图存在偏差';
      console.log(`🔍 同步验证结果: ${statusMsg}`);
      console.log(`时间同步误差: ${syncResult.timeSyncError.toFixed(4)}px`);
      console.log(`价格同步误差: ${syncResult.priceSyncError.toFixed(4)}px`);
      
      // 在开发环境中显示更详细的信息
      if (process.env.NODE_ENV === 'development') {
        alert(`同步检查结果:\n${statusMsg}\n时间误差: ${syncResult.timeSyncError.toFixed(4)}px\n价格误差: ${syncResult.priceSyncError.toFixed(4)}px`);
      }
    } else {
      console.log('⚠️ 无法验证同步性：没有数据点');
    }
  } else {
    console.log('⚠️ 无法验证同步性：图表未初始化');
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
      pixiChart.clearMarkers();
    }
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
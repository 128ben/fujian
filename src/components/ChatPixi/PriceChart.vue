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

// 定义 props 接收外部数据
const props = defineProps({
  // 外部实时数据
  realTimeData: {
    type: Array,
    default: () => []
  },
  // 当前价格
  currentPriceData: {
    type: Number,
    default: 100
  },
  // 是否启用外部数据模式
  useExternalData: {
    type: Boolean,
    default: true
  },
  // 延迟渲染时间（毫秒）
  renderDelay: {
    type: Number,
    default: 1000
  },
  // 数据源标识符，用于检测数据源切换
  dataSourceId: {
    type: String,
    default: 'default'
  }
});

// 响应式数据
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

// 数据源切换状态
const currentDataSourceId = ref(props.dataSourceId);
const isDataSourceSwitching = ref(false);

// 计算属性
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

// 数据管理
let dataManager = null;
let pixiChart = null;
let removeDataListener = null;
let statsInterval = null;
let lastPriceValue = 100;

// 生命周期
onMounted(async () => {
  await nextTick();
  initializeChart();
  setupDataManager();
  setupResize();
  startStatsUpdate();
  connectionStatus.value = 'connected';
});

onUnmounted(() => {
  cleanup();
});

// 监听外部数据变化
watch(
  () => props.realTimeData,
  (newData, oldData) => {
    // 检查是否在数据源切换中，如果是则忽略旧数据
    if (isDataSourceSwitching.value) {
      console.log('数据源切换中，忽略数据更新');
      return;
    }
    
    if (props.useExternalData && newData && newData.length > 0) {
      // 检查数据是否真的有变化（避免重复处理相同数据）
      const hasNewData = !oldData || newData.length !== oldData.length || 
        newData.some((item, index) => !oldData[index] || 
          item.timestamp !== oldData[index].timestamp || 
          item.price !== oldData[index].price ||
          item.y !== oldData[index].y ||
          item.idxPx !== oldData[index].idxPx
        );
      
      if (hasNewData) {
        console.log(`处理新数据: ${newData.length} 条`);
        
        // 处理新的外部数据
        newData.forEach((dataPoint, index) => {
          if (dataManager) {
            // 转换外部数据格式为内部格式
            const formattedData = formatExternalData(dataPoint);
            
            // 添加序列号以便调试
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

// 监听当前价格变化
watch(
  () => props.currentPriceData,
  (newPrice) => {
    if (props.useExternalData && newPrice !== undefined) {
      currentPrice.value = newPrice;
      // 计算价格变化百分比
      if (lastPriceValue !== 0) {
        priceChange.value = ((newPrice - lastPriceValue) / lastPriceValue * 100).toFixed(2);
      }
      lastPriceValue = newPrice;
    }
  },
  { immediate: true }
);

// 监听数据源切换
watch(
  () => props.dataSourceId,
  (newDataSourceId, oldDataSourceId) => {
    if (newDataSourceId !== oldDataSourceId && oldDataSourceId !== undefined) {
      console.log(`数据源切换: ${oldDataSourceId} -> ${newDataSourceId}`);
      handleDataSourceSwitch(newDataSourceId);
    }
  },
  { immediate: false }
);

// 监听useExternalData变化，处理数据源模式切换
watch(
  () => props.useExternalData,
  (newValue, oldValue) => {
    if (newValue !== oldValue && oldValue !== undefined) {
      console.log(`数据源模式切换: ${oldValue} -> ${newValue}`);
      handleDataSourceModeSwitch(newValue);
    }
  },
  { immediate: false }
);

// 初始化图表
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

// 设置数据管理器
function setupDataManager() {
  // 使用自定义延迟时间创建数据管理器
  dataManager = new PriceDataManager(2000, props.renderDelay);
  
  // 监听数据变化
  removeDataListener = dataManager.addListener((event, data) => {
    if (event === 'dataAdded') {
      // 更新图表
      if (pixiChart) {
        pixiChart.addData(data);
      }
    } else if (event === 'dataCleared') {
      // 数据被清空时，同步清理图表
      console.log('数据管理器数据已清空，同步清理图表');
      if (pixiChart) {
        pixiChart.clearData(); // 使用专门的清空方法
      }
      
      // 重置统计数据
      queuedData.value = 0;
      renderedData.value = 0;
      updateFrequency.value = 0;
    }
  });
}

// 格式化外部数据
function formatExternalData(externalData) {
  // 根据外部数据结构进行转换
  return {
    timestamp: externalData.label || externalData.timestamp || Date.now(),
    price: externalData.y || externalData.price || externalData.idxPx || 0,
    volume: externalData.volume || Math.floor(Math.random() * 10000),
    change: 0, // 将在数据管理器中计算
    sequence: externalData.sequence || 0
  };
}

// 启动统计信息更新
function startStatsUpdate() {
  statsInterval = setInterval(() => {
    if (dataManager) {
      const stats = dataManager.getStats();
      queuedData.value = stats.queuedData;
      renderedData.value = stats.renderedData;
      updateFrequency.value = stats.averageFrequency.toFixed(1);
    }
  }, 500); // 每0.5秒更新一次统计信息
}

// 设置窗口大小调整
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

// 控制函数
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
  console.log('重置图表...');
  
  // 清空数据
  if (dataManager) {
    dataManager.clear();
    console.log('数据管理器已清空');
  }
  
  // 重置图表视图和数据 - 使用新的clearData方法
  if (pixiChart) {
    pixiChart.clearData(); // 使用专门的清空方法
    console.log('图表已清空并重绘');
  }
  
  // 重置状态
  currentPrice.value = props.currentPriceData || 100;
  priceChange.value = 0;
  queuedData.value = 0;
  renderedData.value = 0;
  updateFrequency.value = 0;
  lastPriceValue = props.currentPriceData || 100;
  
  // 重置连接状态
  connectionStatus.value = 'connected';
  
  console.log('图表重置完成');
}

// 手动添加数据的方法（供外部调用）
function addData(dataPoint) {
  if (dataManager) {
    const formattedData = formatExternalData(dataPoint);
    dataManager.addExternalData(formattedData);
  }
}

// 处理数据源切换
function handleDataSourceSwitch(newDataSourceId) {
  isDataSourceSwitching.value = true;
  connectionStatus.value = 'connecting';
  
  try {
    console.log('开始数据源切换处理...');
    
    // 1. 清理当前数据
    if (dataManager) {
      dataManager.clear();
      console.log('数据管理器已清空');
    }
    
    // 2. 清理图表显示 - 使用新的clearData方法
    if (pixiChart) {
      pixiChart.clearData(); // 使用专门的清空方法
      console.log('图表已清空');
    }
    
    // 3. 重置状态变量
    currentPrice.value = props.currentPriceData || 100;
    priceChange.value = 0;
    queuedData.value = 0;
    renderedData.value = 0;
    updateFrequency.value = 0;
    lastPriceValue = props.currentPriceData || 100;
    
    // 4. 更新当前数据源ID
    currentDataSourceId.value = newDataSourceId;
    
    console.log('数据源切换完成');
    connectionStatus.value = 'connected';
    
  } catch (error) {
    console.error('数据源切换失败:', error);
    connectionStatus.value = 'disconnected';
  } finally {
    isDataSourceSwitching.value = false;
  }
}

// 处理数据源模式切换
function handleDataSourceModeSwitch(useExternal) {
  console.log('处理数据源模式切换:', useExternal);
  
  // 清理现有数据
  if (dataManager) {
    dataManager.clear();
  }
  
  // 重置图表 - 使用新的clearData方法
  if (pixiChart) {
    pixiChart.clearData();
  }
  
  // 重置状态
  currentPrice.value = props.currentPriceData || 100;
  priceChange.value = 0;
  queuedData.value = 0;
  renderedData.value = 0;
  updateFrequency.value = 0;
  lastPriceValue = props.currentPriceData || 100;
}

// 获取图表实例（供外部调用）
function getChartInstance() {
  return pixiChart;
}

// 获取数据管理器实例（供外部调用）
function getDataManager() {
  return dataManager;
}

// 工具函数
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

// 暴露方法给父组件
defineExpose({
  addData,
  resetChart,
  getChartInstance,
  getDataManager,
  zoomIn,
  zoomOut,
  // 新增的数据源切换相关方法
  handleDataSourceSwitch,
  handleDataSourceModeSwitch,
  // 获取当前状态的方法
  getCurrentDataSourceId: () => currentDataSourceId.value,
  isDataSourceSwitching: () => isDataSourceSwitching.value,
  // 强制刷新方法
  forceRefresh: () => {
    if (pixiChart) {
      pixiChart.drawChart();
      pixiChart.drawGrid();
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
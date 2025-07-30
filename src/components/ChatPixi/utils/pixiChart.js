import * as PIXI from 'pixi.js';

/**
 * PixiChart - 高性能实时图表组件
 * 
 * 新增功能：
 * - 平滑时间轴流动效果：解决x轴"一跳一跳"的问题
 * - 优化网格更新机制：提供60fps的流畅更新
 * - 智能更新策略：根据用户交互状态调整更新频率
 * - 动态价格范围控制：让折线起伏变化更明显
 * 
 * 价格范围控制使用示例：
 * 
 * // 创建图表时配置价格范围敏感度
 * const chart = new PixiChart(container, {
 *   priceRangeSensitivity: 'high', // 'low', 'medium', 'high'
 *   priceRangeTimeWindowRatio: 0.2, // 使用更短的时间窗口（20%）
 *   maxPriceRangeTimeWindow: 10000, // 最大10秒的数据
 *   minPriceRange: 0.3, // 最小价格范围
 *   dynamicPriceRangeEnabled: true // 启用动态价格范围
 * });
 * 
 * // 运行时动态调整
 * chart.setPriceRangeSensitivity('high'); // 提高敏感度让变化更明显
 * chart.setPriceRangeTimeWindowRatio(0.15); // 使用更短的时间窗口
 * chart.setMinPriceRange(0.2); // 设置更小的最小范围
 * 
 * // 获取当前配置
 * const config = chart.getPriceRangeConfig();
 * console.log('当前价格范围:', config.currentRange);
 */

export class PixiChart {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      width: options.width || 800,
      height: options.height || 600,
      backgroundColor: options.backgroundColor || 0x1a1a1a,
      gridColor: options.gridColor || 0x333333,
      lineColor: options.lineColor || 0x00aaff,
      pointColor: options.pointColor || 0xffffff,
      latestPointColor: options.latestPointColor || 0xff4444,
      textColor: options.textColor || 0xcccccc,
      latestPriceLineColor: options.latestPriceLineColor || 0xff4444,
      animationDuration: options.animationDuration || 300,
      animationEasing: options.animationEasing || 'easeOutCubic',
      animationEnabled: options.animationEnabled || true,
      showLatestPriceLine: options.showLatestPriceLine !== false,
      showHistoricalData: options.showHistoricalData !== false,
      historicalDataThreshold: options.historicalDataThreshold || 30000,
      enableRandomMarkers: options.enableRandomMarkers !== false,
      randomMarkerInterval: options.randomMarkerInterval || 60000,
      futureTimeLineInterval: options.futureTimeLineInterval || 15000,
      showFutureTimeLine: options.showFutureTimeLine !== false,
      onLoadMoreHistory: options.onLoadMoreHistory || null,
      onReturnToLatest: options.onReturnToLatest || null,
      // 价格范围相关配置
      priceRangeTimeWindowRatio: options.priceRangeTimeWindowRatio || 0.3, // 正常模式下使用的时间窗口比例
      maxPriceRangeTimeWindow: options.maxPriceRangeTimeWindow || 15000, // 最大时间窗口（毫秒）
      minPriceRange: options.minPriceRange || 0.5, // 最小价格范围
      dynamicPriceRangeEnabled: options.dynamicPriceRangeEnabled !== false, // 是否启用动态价格范围
      priceRangeSensitivity: options.priceRangeSensitivity || 'medium', // 价格范围敏感度：'low', 'medium', 'high'
      ...options
    };
    
    this.data = [];
    this.viewState = {
      offsetX: 0,
      offsetY: 0,
      scaleX: 1,
      scaleY: 1,
      isDragging: false,
      dragStart: { x: 0, y: 0 },
      hasUserDraggedLeft: false,
      isAtLatestPosition: true,
      dragDistance: 0
    };
    
    // 动画状态管理
    this.animationState = {
      isAnimating: false,
      startTime: 0,
      fromPoint: null,
      toPoint: null,
      currentProgress: 0,
      pendingAnimations: []
    };
    
    // 最新价格线相关
    this.latestPriceLineGraphics = null;
    this.leftPriceLabel = null;
    this.futureTimeLineGraphics = null;
    
    this.timeRange = 60000;
    this.priceRange = { min: 95, max: 105 };
    this.startTime = Date.now();
    
    // 网格更新控制
    this.lastGridUpdate = 0;
    this.gridUpdateInterval = 16;
    
    // 智能更新策略
    this.updateStrategy = {
      isDragging: false,
      isZooming: false,
      lastActivityTime: Date.now(),
      activityThreshold: 2000
    };
    
    // 性能监控
    this.performanceMonitor = {
      frameCount: 0,
      lastFpsUpdate: Date.now(),
      fps: 0,
      gridUpdateCount: 0,
      chartUpdateCount: 0,
      lastPerformanceLog: Date.now()
    };
    
    // 时间流动相关配置
    this.timeFlow = {
      smoothing: options.timeFlowSmoothing !== false, // 默认启用，但可以通过配置禁用
      lastUpdateTime: Date.now(),
      interpolationFactor: 0.016
    };
    
    // 标记点管理
    this.markers = [];
    this.markerGraphics = new PIXI.Graphics();
    this.markerLines = new Map();
    this.markerLinesContainer = new PIXI.Container();
    
    // 随机标记点管理
    this.randomMarkerTimer = null;
    this.randomMarkerCounter = 0;
    
    // 历史数据加载管理
    this.historyLoadThreshold = 200;
    this.isLoadingHistory = false;
    
    // 统一的时间基准管理，确保同一渲染周期内使用相同的时间
    this.renderTimeBase = {
      currentTime: Date.now(),
      lastUpdateTime: Date.now(),
      updateInterval: 16 // 约60FPS
    };
    
    // 数据稳定性管理 - 防止回跳
    this.dataStability = {
      pendingData: [], // 待绘制的数据缓冲区
      lastStableTime: Date.now(),
      stabilityThreshold: 150, // 数据稳定阈值（毫秒）
      maxPendingCount: 3, // 最大待处理数据数量
      isProcessing: false, // 是否正在处理数据
      renderTimer: null // 渲染定时器
    };
    
    // 预设时间间隔配置 - 替代传统的缩放系统
    this.timeIntervals = {
      presets: [15, 30, 180, 300, 600], // 预设时间间隔（秒）
      currentIndex: 2, // 默认使用180秒
      labels: ['15秒', '30秒', '3分钟', '5分钟', '10分钟']
    };
    
    // 根据当前时间间隔设置初始timeRange
    this.timeRange = this.timeIntervals.presets[this.timeIntervals.currentIndex] * 1000;
    
    this.lastHistoryLoadTime = 0;
    this.historyLoadCooldown = 2000;
    
    this.init();
  }
  
  init() {
    // 创建PIXI应用
    this.app = new PIXI.Application({
      width: this.options.width,
      height: this.options.height,
      backgroundColor: this.options.backgroundColor,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    });
    
    // 使用canvas而不是view (Pixi.js 7.x兼容性)
    const canvas = this.app.canvas || this.app.view;
    this.container.appendChild(canvas);
    
    // 创建容器
    this.gridContainer = new PIXI.Container();
    this.chartContainer = new PIXI.Container();
    this.latestPriceLineContainer = new PIXI.Container();
    this.textContainer = new PIXI.Container();
    this.pulseContainer = new PIXI.Container();
    this.priceLabelsContainer = new PIXI.Container();
    this.markersContainer = new PIXI.Container();
    this.markerTextContainer = new PIXI.Container();
    
    // 添加到stage，顺序很重要
    this.app.stage.addChild(this.gridContainer);
    this.app.stage.addChild(this.chartContainer);
    this.app.stage.addChild(this.latestPriceLineContainer);
    this.app.stage.addChild(this.markersContainer);
    this.app.stage.addChild(this.markerLinesContainer);
    this.app.stage.addChild(this.pulseContainer);
    this.app.stage.addChild(this.textContainer);
    this.app.stage.addChild(this.priceLabelsContainer);
    
    // 创建图形对象
    this.gridGraphics = new PIXI.Graphics();
    this.lineGraphics = new PIXI.Graphics();
    this.latestPriceLineGraphics = new PIXI.Graphics();
    this.pulseGraphics = new PIXI.Graphics();
    this.futureTimeLineGraphics = new PIXI.Graphics();

    this.gridContainer.addChild(this.gridGraphics);
    this.chartContainer.addChild(this.lineGraphics);
    this.latestPriceLineContainer.addChild(this.latestPriceLineGraphics);
    this.markersContainer.addChild(this.markerGraphics);
    this.markersContainer.addChild(this.markerTextContainer);
    this.pulseContainer.addChild(this.pulseGraphics);
    this.gridContainer.addChild(this.futureTimeLineGraphics);
    
    // 创建并添加价格标签
    const labelStyle = {
      fontFamily: 'Arial',
      fontSize: 12,
      fill: 0xffffff,
      fontWeight: 'bold'
    };

    this.leftPriceLabel = new PIXI.Text('', labelStyle);
    this.leftPriceLabel.visible = false;
    this.priceLabelsContainer.addChild(this.leftPriceLabel);

    // 脉冲动画相关
    this.pulseTime = 0;
    this.lastEndPoint = null;
    
    // 设置交互
    this.setupInteraction();
    
    // 启动渲染循环
    this.app.ticker.add(() => this.update());
    
    // 初始化绘制
    this.drawGrid();
    
    // 启动随机标记点定时器
    this.startRandomMarkerTimer();
  }
  
  setupInteraction() {
    const canvas = this.app.view;
    
    // 鼠标滚轮缩放
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      this.updateStrategy.isZooming = true;
      this.recordActivity();
      this.zoom(delta, e.offsetX, e.offsetY);
      
      setTimeout(() => {
        this.updateStrategy.isZooming = false;
      }, 200);
    });
    
    // 鼠标点击事件
    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const clickedMarker = this.getMarkerAt(x, y, 15);
      
      if (clickedMarker) {
        if (clickedMarker.isExpandable) {
          clickedMarker.isExpanded = !clickedMarker.isExpanded;
          this.drawMarkers();
          e.stopPropagation();
          return;
        }
      }
    });
    
    // 鼠标拖拽
    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const clickedMarker = this.getMarkerAt(x, y, 15);
      
      if (clickedMarker && clickedMarker.isExpandable) {
        return;
      }
      
      this.viewState.isDragging = true;
      this.updateStrategy.isDragging = true;
      this.recordActivity();
      this.viewState.lastMouseX = e.offsetX;
      this.viewState.lastMouseY = e.offsetY;
    });
    
    canvas.addEventListener('mousemove', (e) => {
      if (this.viewState.isDragging) {
        this.recordActivity();
        const deltaX = e.offsetX - this.viewState.lastMouseX;
        const deltaY = e.offsetY - this.viewState.lastMouseY;
        
        this.viewState.offsetX += deltaX;
        this.viewState.dragDistance += Math.abs(deltaX);
        
        if (deltaX > 0) {
          this.viewState.hasUserDraggedLeft = true;
          this.viewState.isAtLatestPosition = false;
          this.checkAndLoadMoreHistory();
        } else if (deltaX < 0) {
          this.checkIfNearLatestPosition();
        }
        
        this.viewState.lastMouseX = e.offsetX;
        this.viewState.lastMouseY = e.offsetY;
        
        // 在拖拽时更新价格范围，确保当前可见的折线都在Y轴范围内
        this.updatePriceRange();
        
        this.updateView();
      }
    });
    
    canvas.addEventListener('mouseup', () => {
      this.viewState.isDragging = false;
      this.updateStrategy.isDragging = false;
    });
    
    canvas.addEventListener('mouseleave', () => {
      this.viewState.isDragging = false;
      this.updateStrategy.isDragging = false;
    });
  }

  updateView() {
    // 图表容器保持原始缩放，变换通过坐标转换函数处理
    this.chartContainer.position.set(0, 0);
    this.chartContainer.scale.set(1, 1);
    
    // 最新价格线容器也保持原始缩放，跟随图表数据
    this.latestPriceLineContainer.position.set(0, 0);
    this.latestPriceLineContainer.scale.set(1, 1);
    
    // 标记点容器也保持原始缩放，跟随图表数据
    this.markersContainer.position.set(0, 0);
    this.markersContainer.scale.set(1, 1);
    
    // 脉冲容器也保持原始缩放，跟随图表数据
    this.pulseContainer.position.set(0, 0);
    this.pulseContainer.scale.set(1, 1);
    
    // 网格和文本容器保持在屏幕坐标系中，不进行缩放变换
    // 这样网格密度可以根据缩放级别动态调整
    this.gridContainer.position.set(0, 0);
    this.gridContainer.scale.set(1, 1);
    this.textContainer.position.set(0, 0);
    this.textContainer.scale.set(1, 1);
    
    // 确保网格和图表使用完全相同的坐标系统
    this.drawGrid();
    this.drawChart();
    this.drawLatestPriceLine(); // 绘制最新价格线
    
    // 确保标记点也会重新绘制，与折线保持同步
    if (this.markers.length > 0) {
      this.drawMarkers();
    }
    
    // 绘制未来时间线，确保与其他元素同步
    this.drawFutureTimeLine();
  }
  
  drawGrid() {
    this.gridGraphics.clear();
    this.textContainer.removeChildren();
    
    const width = this.options.width;
    const height = this.options.height;
    const currentTime = Date.now();
    
    // 最新时间在右边缘，与折线图保持一致
    const latestTimeX = width; // 改为100%，即右边缘
    
    // 设置网格样式
    this.gridGraphics.lineStyle(1, this.options.gridColor, 0.3);
    
    // 根据时间范围调整网格密度 - 不再依赖scaleX
    const baseGridSpacing = 80; // 基础网格间距
    let timeGridSpacing;
    let timeInterval;
    
    // 根据当前时间范围动态调整网格密度
    const currentTimeRangeSeconds = this.timeRange / 1000;
    
    if (currentTimeRangeSeconds <= 30) {
      // 15秒和30秒：每5秒一个网格
      timeGridSpacing = baseGridSpacing;
      timeInterval = 5000; // 5秒
    } else if (currentTimeRangeSeconds <= 180) {
      // 3分钟：每30秒一个网格
      timeGridSpacing = baseGridSpacing;
      timeInterval = 30000; // 30秒
    } else if (currentTimeRangeSeconds <= 300) {
      // 5分钟：每1分钟一个网格
      timeGridSpacing = baseGridSpacing;
      timeInterval = 60000; // 1分钟
    } else {
      // 10分钟：每2分钟一个网格
      timeGridSpacing = baseGridSpacing;
      timeInterval = 120000; // 2分钟
    }
    
    // 绘制垂直网格线（时间轴）
    const numTimeLines = Math.ceil(width / timeGridSpacing) + 4;
    
    // 计算当前可见的时间范围
    const visibleTimeRange = this.timeRange; // 直接使用timeRange，不再除以scaleX
    const visibleTimeStart = currentTime - visibleTimeRange;
    const visibleTimeEnd = currentTime;
    
    // 优化网格线生成 - 使用更小的时间间隔以实现更平滑的流动效果
    const smoothTimeInterval = Math.max(100, timeInterval / 5); // 使用更小的间隔，确保平滑流动
    const startGridTime = Math.floor(visibleTimeStart / smoothTimeInterval) * smoothTimeInterval;
    const endGridTime = Math.ceil(visibleTimeEnd / smoothTimeInterval) * smoothTimeInterval;
    
    // 用于标签显示的主要网格线
    const majorGridInterval = timeInterval;
    
    for (let timestamp = startGridTime; timestamp <= endGridTime + smoothTimeInterval; timestamp += smoothTimeInterval) {
      // 使用与折线数据完全相同的坐标转换方法
      const x = this.timeToX(timestamp, currentTime, width);
      
      if (x >= -timeGridSpacing && x <= width + timeGridSpacing) {
        // 判断是否为主要网格线
        const isMajorGrid = (timestamp % majorGridInterval) === 0;
        
        if (isMajorGrid) {
          // 绘制主要垂直线（更明显）
          this.gridGraphics.lineStyle(1, this.options.gridColor, 0.5);
          this.gridGraphics.moveTo(x, 0);
          this.gridGraphics.lineTo(x, height);
          
          // 添加时间标签
          const timeText = this.formatTimeLabel(timestamp);
          
          // 根据缩放调整字体大小
          const fontSize = Math.max(10, Math.min(14, 12 / Math.sqrt(this.viewState.scaleX))); // 动态字体大小
          const text = new PIXI.Text(timeText, {
            fontFamily: 'Arial',
            fontSize: fontSize,
            fill: this.options.textColor,
            align: 'center'
          });
          
          text.x = x - text.width / 2;
          text.y = height - 20;
          this.textContainer.addChild(text);
        } else {
          // 绘制次要垂直线（更淡）
          this.gridGraphics.lineStyle(1, this.options.gridColor, 0.15);
          this.gridGraphics.moveTo(x, 0);
          this.gridGraphics.lineTo(x, height);
        }
      }
    }
    
    // 绘制水平网格线（价格轴）- 使用与折线图数据完全相同的坐标转换逻辑
    const currentPriceRange = this.priceRange.max - this.priceRange.min;
    const basePriceStep = currentPriceRange / 8;
    const adjustedPriceStep = Math.max(0.01, basePriceStep); // 移除y轴缩放影响，保持固定间距
    
    // 计算可见的价格范围（不考虑y轴缩放和偏移）
    const visiblePriceMin = this.priceRange.min - currentPriceRange * 0.2;
    const visiblePriceMax = this.priceRange.max + currentPriceRange * 0.2;
    
    // 根据价格步长生成网格线
    const startGridPrice = Math.floor(visiblePriceMin / adjustedPriceStep) * adjustedPriceStep;
    const endGridPrice = Math.ceil(visiblePriceMax / adjustedPriceStep) * adjustedPriceStep;
    
    // 重置线条样式为价格网格线
    this.gridGraphics.lineStyle(1, this.options.gridColor, 0.3);
    
    for (let price = startGridPrice; price <= endGridPrice; price += adjustedPriceStep) {
      // 使用与折线数据完全相同的坐标转换方法
      const y = this.priceToY(price);
      
      if (y >= -50 && y <= height + 50) {
        // 绘制水平线
        this.gridGraphics.moveTo(0, y);
        this.gridGraphics.lineTo(width, y);
        
        // 添加价格标签，使用固定精度
        const precision = 2; // 固定精度，不受缩放影响
        const fontSize = 12; // 价格标签字体大小保持固定
        const priceText = new PIXI.Text(price.toFixed(precision), {
          fontFamily: 'Arial',
          fontSize: fontSize,
          fill: this.options.textColor,
          align: 'right'
        });
        
        priceText.x = 5;
        priceText.y = y - 8;
        this.textContainer.addChild(priceText);
      }
    }
  }
  
  drawChart() {
    if (this.data.length === 0) return;
    
    // 清除之前的线条绘制（不清除脉冲效果）
    this.lineGraphics.clear();
    
    // 更新价格范围
    this.updatePriceRange();
    
    // 更新统一的时间基准
    const now = Date.now();
    if (now - this.renderTimeBase.lastUpdateTime >= this.renderTimeBase.updateInterval) {
      this.renderTimeBase.currentTime = now;
      this.renderTimeBase.lastUpdateTime = now;
    }
    const currentTime = this.renderTimeBase.currentTime;
    
    const chartWidth = this.options.width;
    
    // 使用所有数据确保折线连续性，不进行任何过滤
    let visibleData = this.data;
    
    if (visibleData.length === 0) return;
    
    // 单点处理
    if (visibleData.length === 1) {
      const point = visibleData[0];
      // 使用与网格完全相同的坐标转换方法
      const x = this.timeToX(point.timestamp, currentTime, chartWidth);
      const y = this.priceToY(point.price);
      
      // 绘制单点
      this.lineGraphics.beginFill(this.options.lineColor, 1);
      this.lineGraphics.drawCircle(x, y, 3);
      this.lineGraphics.endFill();
      
      this.lastEndPoint = { x, y };
      return;
    }
    
    // 绘制折线 - 确保与网格使用相同的坐标系统
    this.drawSmoothLine(visibleData, currentTime, chartWidth);
  }
  
  drawSmoothLine(visibleData, currentTime, chartWidth) {
    // 设置线条样式 - 使用更现代的样式
    this.lineGraphics.lineStyle(3, this.options.lineColor, 1);
    
    let isFirstPoint = true;
    let lastDrawnPoint = null;
    
    // 确定绘制范围
    let drawToIndex = visibleData.length - 1;
    if (this.options.animationEnabled && this.animationState.isAnimating && visibleData.length > 1) {
      drawToIndex = visibleData.length - 2;
    }
    
    // 绘制静态线段 - 确保折线连续性
    for (let i = 0; i <= drawToIndex; i++) {
      const point = visibleData[i];
      // 确保使用与网格相同的坐标转换方法
      const x = this.timeToX(point.timestamp, currentTime, chartWidth);
      const y = this.priceToY(point.price);
      
      if (isFirstPoint) {
        this.lineGraphics.moveTo(x, y);
        isFirstPoint = false;
      } else {
        this.lineGraphics.lineTo(x, y);
      }
      lastDrawnPoint = { x, y };
    }
    
    // 处理动画线段
    if (this.options.animationEnabled && this.animationState.isAnimating && visibleData.length > 1) {
      const animatedPoint = this.calculateAnimatedPoint(visibleData, currentTime, chartWidth);
      if (animatedPoint && lastDrawnPoint) {
        this.lineGraphics.lineTo(animatedPoint.x, animatedPoint.y);
        this.lastEndPoint = animatedPoint;
      }
    } else {
      this.lastEndPoint = lastDrawnPoint;
    }
  }
  
  calculateAnimatedPoint(visibleData, currentTime, chartWidth) {
    const fromDataPoint = visibleData[visibleData.length - 2];
    const toDataPoint = visibleData[visibleData.length - 1];
    
    // 使用与网格相同的坐标转换方法
    const fromX = this.timeToX(fromDataPoint.timestamp, currentTime, chartWidth);
    const fromY = this.priceToY(fromDataPoint.price);
    const toX = this.timeToX(toDataPoint.timestamp, currentTime, chartWidth);
    const toY = this.priceToY(toDataPoint.price);
    
    const progress = this.easeOutCubic(this.animationState.currentProgress);
    const currentX = fromX + (toX - fromX) * progress;
    const currentY = fromY + (toY - fromY) * progress;
    
    return { x: currentX, y: currentY };
  }
  
  isPointVisible(x, y) {
    const margin = 50;
    return x >= -margin && x <= this.options.width + margin && 
           y >= -margin && y <= this.options.height + margin;
  }
  
  drawPulseEffect() {
    if (!this.lastEndPoint) return;
    
    const { x, y } = this.lastEndPoint;
    
    // 更精细的脉冲动画
    const pulseSpeed = 0.08;
    this.pulseTime += pulseSpeed;
    
    // 单一脉冲效果，更简洁
    const pulse = (Math.sin(this.pulseTime) + 1) * 0.5;
    const radius = 4 + pulse * 8;
    const alpha = (1 - pulse) * 0.8;
    
    // 绘制脉冲圆环
    this.pulseGraphics.lineStyle(2, this.options.lineColor, alpha);
    this.pulseGraphics.drawCircle(x, y, radius);
    
    // 绘制中心点
    this.pulseGraphics.beginFill(this.options.lineColor, 1);
    this.pulseGraphics.drawCircle(x, y, 2);
    this.pulseGraphics.endFill();
  }
  
  priceToY(price) {
    const normalizedPrice = (price - this.priceRange.min) / (this.priceRange.max - this.priceRange.min);
    const chartTop = this.options.height * 0.1;
    const chartHeight = this.options.height * 0.7;
    const baseY = chartTop + chartHeight - (normalizedPrice * chartHeight);
    
    return baseY;
  }
  
  updatePriceRange() {
    if (this.data.length === 0) return;
    
    const currentTime = this.renderTimeBase.currentTime || Date.now();
    
    // 计算当前可见的时间范围 - 直接使用timeRange
    const visibleTimeRange = this.timeRange;
    const viewStartTime = currentTime - visibleTimeRange;
    const viewEndTime = currentTime;
    
    // 获取当前视图中可见的所有数据点
    const visibleData = this.data.filter(d => 
      d.timestamp >= viewStartTime && d.timestamp <= viewEndTime
    );
    
    // 如果没有可见数据，使用最近的数据
    let dataForPriceRange = visibleData;
    if (dataForPriceRange.length === 0) {
      // 使用最近的一些数据点
      const recentDataCount = Math.min(50, this.data.length);
      dataForPriceRange = this.data.slice(-recentDataCount);
    }
    
    if (dataForPriceRange.length === 0) return;
    
    const prices = dataForPriceRange.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    
    // 动态调整padding：确保折线不会超出图表边界
    const priceSpread = max - min;
    let padding;
    
    if (this.options.dynamicPriceRangeEnabled) {
      // 根据敏感度配置调整padding策略
      const sensitivity = this.options.priceRangeSensitivity;
      
      if (priceSpread < this.options.minPriceRange) {
        // 价格变化很小时，根据敏感度设置不同的最小范围
        switch (sensitivity) {
          case 'high':
            padding = Math.max(1.0, priceSpread * 4); // 高敏感度：更大的放大倍数
            break;
          case 'low':
            padding = Math.max(0.5, priceSpread * 2); // 低敏感度：较小的放大倍数
            break;
          default: // medium
            padding = Math.max(0.8, priceSpread * 3); // 中等敏感度
        }
      } else if (priceSpread < 2) {
        // 价格变化中等时
        switch (sensitivity) {
          case 'high':
            padding = priceSpread * 1.0; // 高敏感度：更大的padding
            break;
          case 'low':
            padding = priceSpread * 0.4; // 低敏感度：较小的padding
            break;
          default: // medium
            padding = priceSpread * 0.6; // 中等敏感度
        }
      } else {
        // 价格变化较大时
        switch (sensitivity) {
          case 'high':
            padding = priceSpread * 0.4; // 高敏感度：保持较大的padding
            break;
          case 'low':
            padding = priceSpread * 0.15; // 低敏感度：很小的padding
            break;
          default: // medium
            padding = priceSpread * 0.25; // 中等敏感度
        }
      }
      
      // 确保最小padding，避免图表过于平坦
      padding = Math.max(padding, this.options.minPriceRange * 0.6);
    } else {
      // 传统的固定padding策略，增加padding确保折线在边界内
      padding = Math.max((max - min) * 0.4, 2);
    }
    
    // 设置新的价格范围，确保有足够的边距
    this.priceRange.min = min - padding;
    this.priceRange.max = max + padding;
    
    // 验证价格范围的合理性
    const finalPriceSpread = this.priceRange.max - this.priceRange.min;
    if (finalPriceSpread < this.options.minPriceRange) {
      const center = (this.priceRange.min + this.priceRange.max) / 2;
      const halfRange = this.options.minPriceRange / 2;
      this.priceRange.min = center - halfRange;
      this.priceRange.max = center + halfRange;
    }
  }
  
  formatTimeLabel(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour12: false,
      minute: '2-digit',
      second: '2-digit'
    });
  }
  
  // 验证并调整标记点位置
  validateAndAdjustMarkers() {
    if (this.markers.length === 0 || this.data.length === 0) return;
    
    let adjustedCount = 0;
    
    this.markers.forEach(marker => {
      // 检查标记点的时间戳是否在当前数据范围内
      const dataTimestamps = this.data.map(d => d.timestamp);
      const minTimestamp = Math.min(...dataTimestamps);
      const maxTimestamp = Math.max(...dataTimestamps);
      
      // 如果标记点时间戳不在数据范围内，尝试调整
      if (marker.timestamp < minTimestamp || marker.timestamp > maxTimestamp) {
        const bestDataPoint = this.findBestMarkerPosition(marker.originalTimestamp || marker.timestamp, marker.originalPrice || marker.price);
        
        if (bestDataPoint) {
          marker.timestamp = bestDataPoint.timestamp;
          marker.price = bestDataPoint.price;
          adjustedCount++;
        }
      }
    });
    
    if (adjustedCount > 0) {
      this.drawMarkers();
    }
  }

  // 重写addData方法，实现数据缓冲和稳定性检查
  addData(newData) {
    // 将新数据添加到缓冲区
    this.dataStability.pendingData.push({
      ...newData,
      receivedTime: Date.now()
    });
    
    // 限制缓冲区大小
    if (this.dataStability.pendingData.length > this.dataStability.maxPendingCount) {
      this.dataStability.pendingData.shift();
    }
    
    // 如果不在处理中，启动稳定性检查
    if (!this.dataStability.isProcessing) {
      this.startDataStabilityCheck();
    }
  }
  
  // 启动数据稳定性检查
  startDataStabilityCheck() {
    this.dataStability.isProcessing = true;
    
    // 清除之前的定时器
    if (this.dataStability.renderTimer) {
      clearTimeout(this.dataStability.renderTimer);
    }
    
    // 设置稳定性检查定时器
    this.dataStability.renderTimer = setTimeout(() => {
      this.processStableData();
    }, this.dataStability.stabilityThreshold);
  }
  
  // 处理稳定的数据
  processStableData() {
    if (this.dataStability.pendingData.length === 0) {
      this.dataStability.isProcessing = false;
      return;
    }
    
    const now = Date.now();
    const stableData = [];
    
    // 找出稳定的数据（接收时间超过稳定阈值的数据）
    this.dataStability.pendingData.forEach((data, index) => {
      const dataAge = now - data.receivedTime;
      if (dataAge >= this.dataStability.stabilityThreshold) {
        stableData.push(data);
      }
    });
    
    // 如果有稳定的数据，进行批量处理
    if (stableData.length > 0) {
      // 从缓冲区移除已处理的数据
      this.dataStability.pendingData = this.dataStability.pendingData.filter(data => {
        return !stableData.includes(data);
      });
      
      // 批量添加稳定的数据到实际数据数组
      const previousDataLength = this.data.length;
      stableData.forEach(data => {
        // 移除临时属性
        const { receivedTime, ...cleanData } = data;
        this.data.push(cleanData);
      });
      
      // 更新价格范围
      this.updatePriceRange();
      
      // 验证并调整标记点位置
      this.validateAndAdjustMarkers();
      
      // 更新时间基准
      this.updateRenderTimeBase();
      
      // 重绘图表
      this.drawChart();
      
      // 数据截断逻辑
      this.performDataCleanup();
      
      this.dataStability.lastStableTime = now;
    }
    
    // 如果还有待处理的数据，继续检查
    if (this.dataStability.pendingData.length > 0) {
      this.dataStability.renderTimer = setTimeout(() => {
        this.processStableData();
      }, this.dataStability.stabilityThreshold / 2); // 更频繁的检查
    } else {
      this.dataStability.isProcessing = false;
    }
  }
  
  // 更新渲染时间基准
  updateRenderTimeBase() {
    const now = Date.now();
    if (now - this.renderTimeBase.lastUpdateTime >= this.renderTimeBase.updateInterval) {
      this.renderTimeBase.currentTime = now;
      this.renderTimeBase.lastUpdateTime = now;
    }
  }
  
  // 执行数据清理
  performDataCleanup() {
    // 保持数据在合理范围内，但保留足够的数据确保折线完整显示
    const maxDataPoints = Math.max(1000, this.timeRange * 8 / 500);
    
    if (this.data.length > maxDataPoints * 1.2) {
      const cutoffTime = Date.now() - this.timeRange * 8;
      const originalLength = this.data.length;
      this.data = this.data.filter(d => d.timestamp > cutoffTime);
      
      // 确保至少保留一定数量的数据点以维持折线连续性
      if (this.data.length < maxDataPoints * 0.8) {
        // 如果截断后数据太少，恢复一些数据
        const additionalDataNeeded = Math.floor(maxDataPoints * 0.8) - this.data.length;
        // 这里可以考虑从备份或缓存中恢复数据，暂时保持现有逻辑
      }
    }
    
    // 清理过期的标记点
    this.cleanupExpiredMarkers();
  }
  
  // 清理过期的标记点
  cleanupExpiredMarkers() {
    const cutoffTime = Date.now() - this.timeRange * 3; // 给标记点更长的保留时间
    const originalCount = this.markers.length;
    
    // 找出过期的标记点ID（只包括下单标记点，不包括随机标记点）
    const expiredMarkerIds = this.markers
      .filter(marker => !marker.isRandom && marker.timestamp <= cutoffTime) // 只清理非随机标记点
      .map(marker => marker.id);
    
    // 清理过期标记点对应的竖线
    expiredMarkerIds.forEach(markerId => {
      if (this.markerLines.has(markerId)) {
        const lineGraphics = this.markerLines.get(markerId);
        lineGraphics.destroy();
        this.markerLines.delete(markerId);
      }
    });
    
    // 过滤掉过期的下单标记点（保留随机标记点）
    this.markers = this.markers.filter(marker => marker.isRandom || marker.timestamp > cutoffTime);
    
    if (this.markers.length < originalCount) {
      this.drawMarkers();
    }
  }
  
  // 更新最新价格线位置
  updateLatestPriceLine(price) {
    const y = this.priceToY(price);
    this.latestPrice = { 
      price: price, 
      y: y 
    };
    
    // 创建或更新价格标签
    if (!this.leftPriceLabel) {
      this.leftPriceLabel = new PIXI.Text('', {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: 0xffffff,
        fontWeight: 'bold'
      });
      this.priceLabelsContainer.addChild(this.leftPriceLabel);
    }
  }
  
  // 网格更新控制 - 降低更新频率以提高性能
  update() {
    // 性能监控
    this.performanceMonitor.frameCount++;
    const currentTime = Date.now();
    
    // 计算FPS
    if (currentTime - this.performanceMonitor.lastFpsUpdate > 1000) {
      this.performanceMonitor.fps = this.performanceMonitor.frameCount;
      this.performanceMonitor.frameCount = 0;
      this.performanceMonitor.lastFpsUpdate = currentTime;
    }
    
    // 更新动画状态
    const wasAnimating = this.animationState.isAnimating;
    this.updateAnimation();
    
    // 定期更新价格范围以保持图表敏感度
    if (!this.lastPriceRangeUpdate) {
      this.lastPriceRangeUpdate = currentTime;
    }
    
    // 每2秒更新一次价格范围，或者在有新数据时立即更新
    const priceRangeUpdateInterval = 2000; // 2秒
    const shouldUpdatePriceRange = (currentTime - this.lastPriceRangeUpdate) >= priceRangeUpdateInterval;
    
    if (shouldUpdatePriceRange && this.data.length > 0 && !this.updateStrategy.isDragging) {
      const oldPriceRange = { ...this.priceRange };
      this.updatePriceRange();
      
      // 检查价格范围是否有显著变化
      const rangeChanged = Math.abs(oldPriceRange.min - this.priceRange.min) > 0.01 || 
                          Math.abs(oldPriceRange.max - this.priceRange.max) > 0.01;
      
      if (rangeChanged) {
        // 价格范围发生变化，标记需要重绘
        this.lastPriceRangeUpdate = currentTime;
      }
    }
    
    // 优化网格更新策略 - 实现平滑的时间流动效果
    const shouldUpdateGrid = this.shouldUpdateGrid(currentTime);
    
    if (shouldUpdateGrid) {
      this.drawGrid();
      this.lastGridUpdate = currentTime;
      this.performanceMonitor.gridUpdateCount++;
    }
    
    // 优化重绘策略：只在必要时重绘图表
    let needsRedraw = false;
    
    // 检查是否需要重绘图表
    if (this.animationState.isAnimating) {
      // 动画进行中，需要重绘
      needsRedraw = true;
    } else if (wasAnimating && !this.animationState.isAnimating) {
      // 动画刚结束，需要重绘最终状态
      needsRedraw = true;
    } else if (shouldUpdateGrid && !this.updateStrategy.isDragging) {
      // 网格更新时，如果不在拖拽状态，也需要重绘图表以保持同步
      needsRedraw = true;
    }
    
    // 只在需要时重绘图表
    if (needsRedraw) {
      this.drawChart();
      this.performanceMonitor.chartUpdateCount++;
    }
    
    // 脉冲效果独立更新（轻量级操作）
    if (this.lastEndPoint) {
      this.pulseGraphics.clear();
      this.drawPulseEffect();
    }
    
    // 最新价格线独立更新
    if (this.data.length > 0) {
      this.drawLatestPriceLine();
    }

    // 更新标记点
    if (this.markers.length > 0) {
      this.drawMarkers();
    }

    this.drawFutureTimeLine();
    
    // 定期输出性能日志
    if (currentTime - this.performanceMonitor.lastPerformanceLog > 10000) { // 每10秒输出一次
      this.logPerformanceStats();
      this.performanceMonitor.lastPerformanceLog = currentTime;
    }
  }
  
  // 新增：判断是否应该更新网格的方法
  shouldUpdateGrid(currentTime) {
    const timeSinceLastUpdate = currentTime - this.lastGridUpdate;
    
    // 如果正在拖拽或缩放，使用较低的更新频率避免卡顿
    if (this.updateStrategy.isDragging || this.updateStrategy.isZooming) {
      return timeSinceLastUpdate >= 100; // 100ms间隔
    }
    
    // 如果有动画正在进行，使用中等频率更新
    if (this.animationState.isAnimating) {
      return timeSinceLastUpdate >= 50; // 50ms间隔
    }
    
    // 正常情况下使用高频更新以确保流畅的时间流动
    return timeSinceLastUpdate >= this.gridUpdateInterval; // 16ms间隔，约60fps
  }
  
  // 输出性能统计
  logPerformanceStats() {
    const stats = {
      fps: this.performanceMonitor.fps,
      gridUpdates: this.performanceMonitor.gridUpdateCount,
      chartUpdates: this.performanceMonitor.chartUpdateCount,
      dataPoints: this.data.length,
      markers: this.markers.length,
      currentGridInterval: this.getOptimalGridUpdateInterval(),
      isAnimating: this.animationState.isAnimating,
      isDragging: this.updateStrategy.isDragging,
      isZooming: this.updateStrategy.isZooming
    };
    
    // 重置计数器
    this.performanceMonitor.gridUpdateCount = 0;
    this.performanceMonitor.chartUpdateCount = 0;
  }
  
  // 智能获取最优网格更新间隔
  getOptimalGridUpdateInterval() {
    const currentTime = Date.now();
    const timeSinceLastActivity = currentTime - this.updateStrategy.lastActivityTime;
    
    // 如果正在拖拽或缩放，使用高频更新
    if (this.updateStrategy.isDragging || this.updateStrategy.isZooming) {
      return 50; // 50ms高频更新，提高响应速度
    }
    
    // 如果有动画正在进行，使用中频更新
    if (this.animationState.isAnimating) {
      return 33; // 33ms中频更新，约30fps
    }
    
    // 如果最近有活动，使用标准频率
    if (timeSinceLastActivity < this.updateStrategy.activityThreshold) {
      return this.gridUpdateInterval; // 使用配置的更新间隔（16ms）
    }
    
    // 静态状态，使用低频更新
    return 100; // 100ms低频更新，节省性能
  }
  
  // 记录用户活动
  recordActivity() {
    this.updateStrategy.lastActivityTime = Date.now();
  }
  
  // 重置视图状态
  resetView() {
    this.viewState.offsetX = 0;
    this.viewState.scaleX = 1;
    this.viewState.hasUserDraggedLeft = false;
    
    // 重置动画状态
    this.animationState.isAnimating = false;
    this.animationState.pendingAnimations = [];
    
    this.updateView();
  }
  
  // 清空所有数据和视觉元素
  clearData() {
    // 清空数据
    this.data = [];
    this.lastEndPoint = null;
    this.latestPrice = null;
    
    // 重置价格范围
    this.priceRange = { min: 95, max: 105 };
    
    // 重置拖动状态
    this.viewState.hasUserDraggedLeft = false;
    
    // 清空所有图形
    this.lineGraphics.clear();
    this.latestPriceLineGraphics.clear();
    this.pulseGraphics.clear();
    this.futureTimeLineGraphics.clear();
    
    // 只清除下单标记点，保留随机标记点
    this.clearOrderMarkers();
    
    // 清空标记点竖线容器
    this.markerLinesContainer.removeChildren();
    
    // 隐藏价格标签
    if (this.leftPriceLabel) {
      this.leftPriceLabel.visible = false;
    }
    
    // 重置动画状态
    this.animationState.isAnimating = false;
    this.animationState.pendingAnimations = [];
    this.animationState.currentProgress = 0;
    
    // 重新绘制网格
    this.drawGrid();
  }
  
  resize(width, height) {
    this.options.width = width;
    this.options.height = height;
    this.app.renderer.resize(width, height);
    this.drawGrid();
    this.drawChart();
  }
  
  destroy() {
    // 停止随机标记点定时器
    this.stopRandomMarkerTimer();
    
    // 清理数据稳定性定时器
    if (this.dataStability.renderTimer) {
      clearTimeout(this.dataStability.renderTimer);
      this.dataStability.renderTimer = null;
    }
    
    // 清理数据稳定性状态
    this.dataStability.pendingData = [];
    this.dataStability.isProcessing = false;
    
    if (this.app) {
      this.app.destroy(true);
    }
  }
  
  // 动态控制方法
  setAnimationEnabled(enabled) {
    this.options.animationEnabled = enabled;
    
    // 如果关闭动画，清除当前动画状态并重绘
    if (!enabled) {
      this.animationState.isAnimating = false;
      this.animationState.pendingAnimations = [];
      this.lineGraphics.clear();
      
      // 强制重绘图表以显示完整的线段
      this.drawChart();
    }
  }
  
  setAnimationDuration(duration) {
    this.options.animationDuration = duration;
  }
  
  // 获取动画状态信息
  getAnimationInfo() {
    return {
      isAnimating: this.animationState.isAnimating,
      pendingCount: this.animationState.pendingAnimations.length,
      currentProgress: this.animationState.currentProgress,
      animationEnabled: this.options.animationEnabled,
      animationDuration: this.options.animationDuration
    };
  }
  
  // 缓动函数
  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }
  
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  // 启动新线段的绘制动画
  startLineAnimation(fromPoint, toPoint) {
    // 验证坐标有效性
    if (!fromPoint || !toPoint || 
        isNaN(fromPoint.x) || isNaN(fromPoint.y) || 
        isNaN(toPoint.x) || isNaN(toPoint.y)) {
      return;
    }
    
    // 如果已有动画在进行，将新动画加入队列
    if (this.animationState.isAnimating) {
      // 限制队列长度，避免积压过多动画
      if (this.animationState.pendingAnimations.length < 5) {
        this.animationState.pendingAnimations.push({ fromPoint, toPoint });
      }
      return;
    }
    
    this.animationState.isAnimating = true;
    this.animationState.startTime = Date.now();
    this.animationState.fromPoint = fromPoint;
    this.animationState.toPoint = toPoint;
    this.animationState.currentProgress = 0;
  }
  
  // 更新动画状态
  updateAnimation() {
    if (!this.animationState.isAnimating) return;
    
    const elapsed = Date.now() - this.animationState.startTime;
    this.animationState.currentProgress = Math.min(elapsed / this.options.animationDuration, 1);
    
    // 动画完成
    if (this.animationState.currentProgress >= 1) {
      this.animationState.isAnimating = false;
      this.animationState.currentProgress = 0;
      
      // 检查是否有待执行的动画
      if (this.animationState.pendingAnimations.length > 0) {
        const nextAnimation = this.animationState.pendingAnimations.shift();
        this.startLineAnimation(nextAnimation.fromPoint, nextAnimation.toPoint);
      }
    }
  }
  
  drawLatestPriceLine() {
    if (!this.options.showLatestPriceLine || !this.data.length || !this.lastEndPoint) return;
    
    // 直接使用折线端点的Y坐标，确保完全同步
    const animatedY = this.lastEndPoint.y;
    const latestData = this.data[this.data.length - 1];
    
    // 更新最新价格信息，使用折线端点的实际位置
    this.latestPrice = { 
      price: latestData.price, 
      y: animatedY,
      x: this.lastEndPoint.x
    };
    
    const width = this.options.width;
    const height = this.options.height;
    
    this.latestPriceLineGraphics.clear();
    
    // 绘制上方绿色渐变（从图表顶部到价格线）
    const topGradientHeight = animatedY; // 从图表顶部（y=0）到价格线位置
    
    if (topGradientHeight > 0) {
      // 使用多条半透明线条模拟渐变效果 - 从上往下，透明度递增
      for (let i = 0; i < topGradientHeight; i += 0.5) {
        const alpha = ((topGradientHeight - i) / topGradientHeight) * 0.15; // 从0.15到0的渐变（从上往下透明度递减，即从上往下从透明到绿色）
        this.latestPriceLineGraphics.lineStyle(1, 0x00ff00, alpha);
        this.latestPriceLineGraphics.moveTo(0, animatedY - i);
        this.latestPriceLineGraphics.lineTo(width, animatedY - i);
      }
    }
    
    // 绘制下方红色渐变（从价格线到图表底部）
    const bottomGradientHeight = height - animatedY; // 从价格线位置到图表底部
    
    if (bottomGradientHeight > 0) {
      // 使用多条半透明线条模拟渐变效果 - 从下往上，透明度递增
      for (let i = 0; i < bottomGradientHeight; i += 0.5) {
        const alpha = ((bottomGradientHeight - i) / bottomGradientHeight) * 0.15; // 从0.15到0的渐变（从上往下透明度递减，即从下往上透明度递增）
        this.latestPriceLineGraphics.lineStyle(1, 0xff0000, alpha);
        this.latestPriceLineGraphics.moveTo(0, animatedY + i);
        this.latestPriceLineGraphics.lineTo(width, animatedY + i);
      }
    }
    
    // 绘制价格线本身（在渐变之上）
    this.latestPriceLineGraphics.lineStyle(2, this.options.lineColor, 0.8);
    
    // 绘制虚线效果
    const dashLength = 8;
    const gapLength = 4;
    let currentX = 0;
    
    while (currentX < width) {
      const endX = Math.min(currentX + dashLength, width);
      this.latestPriceLineGraphics.moveTo(currentX, animatedY);
      this.latestPriceLineGraphics.lineTo(endX, animatedY);
      currentX = endX + gapLength;
    }
    
    // 绘制右侧价格标签背景
      const currentPriceText = `$${latestData.price.toFixed(2)}`;
      
      // 更新左侧标签
      this.leftPriceLabel.text = currentPriceText;
      this.leftPriceLabel.visible = true;
      const leftLabelWidth = this.leftPriceLabel.width + 16;
      const leftLabelHeight = 20;
      const leftLabelX = 0;

      this.latestPriceLineGraphics.beginFill(this.options.lineColor, 0.9);
      this.latestPriceLineGraphics.drawRoundedRect(leftLabelX, animatedY - leftLabelHeight/2, leftLabelWidth, leftLabelHeight, 3);
      this.latestPriceLineGraphics.endFill();

      this.leftPriceLabel.x = leftLabelX + 8;
      this.leftPriceLabel.y = animatedY - 8;
  }
  
  // 控制最新价格线显示/隐藏
  setLatestPriceLineVisible(visible) {
    this.options.showLatestPriceLine = visible;
    
    if (!visible) {
      this.latestPriceLineGraphics.clear();
      if (this.leftPriceLabel && this.leftPriceLabel.parent) {
        this.leftPriceLabel.visible = false;
      }
    } else {
      if (this.leftPriceLabel) {
        this.leftPriceLabel.visible = true;
      }
      this.drawLatestPriceLine();
    }
  }
  
  // 获取最新价格线状态
  isLatestPriceLineVisible() {
    return this.options.showLatestPriceLine;
  }
  
  // 统一的时间到X坐标转换方法
  timeToX(timestamp, currentTime, chartWidth) {
    // 最新时间在右边缘，让过去数据从左侧边缘开始显示
    const latestX = chartWidth; // 右边缘
    const timeDiff = currentTime - timestamp;
    
    // 直接基于timeRange计算坐标，不再使用scaleX和offsetX
    const baseX = latestX - (timeDiff / this.timeRange) * chartWidth;
    
    // 如果启用了平滑流动，应用时间插值（仅对最新数据点）
    let transformedX = baseX;
    
    if (this.timeFlow && this.timeFlow.smoothing && !this.updateStrategy.isDragging) {
      const deltaTime = currentTime - this.timeFlow.lastUpdateTime;
      
      // 只对最新的数据点应用平滑，避免影响历史数据的坐标稳定性
      const isRecentData = Math.abs(timeDiff) < 1000; // 只对1秒内的数据点应用平滑
      const isLatestPoint = this.data.length > 0 && 
        Math.abs(timestamp - Math.max(...this.data.map(d => d.timestamp))) < 100;
      
      if (isRecentData && isLatestPoint) {
        const timeOffset = deltaTime * 0.001; // 时间偏移因子
        const smoothedTimeDiff = timeDiff - timeOffset;
        const smoothedX = latestX - (smoothedTimeDiff / this.timeRange) * chartWidth;
        
        // 限制平滑变化的幅度，防止过大的跳跃
        const maxSmoothingDelta = 5; // 最大平滑变化像素
        const delta = smoothedX - transformedX;
        if (Math.abs(delta) <= maxSmoothingDelta) {
          transformedX = smoothedX;
        }
      }
      
      this.timeFlow.lastUpdateTime = currentTime;
    }
    
    return transformedX;
  }

  // 重写zoom方法 - 使用预设时间间隔
  zoom(factor, centerX, centerY) {
    // 根据缩放因子确定是放大还是缩小
    const isZoomIn = factor > 1;
    
    if (isZoomIn) {
      this.zoomToSmallerInterval();
    } else {
      this.zoomToLargerInterval();
    }
  }
  
  // 放大：切换到更小的时间间隔
  zoomToSmallerInterval() {
    if (this.timeIntervals.currentIndex > 0) {
      this.timeIntervals.currentIndex--;
      this.updateTimeRange();
      console.log(`放大到: ${this.timeIntervals.labels[this.timeIntervals.currentIndex]}`);
    } else {
      console.log('已达到最小时间间隔');
    }
  }
  
  // 缩小：切换到更大的时间间隔
  zoomToLargerInterval() {
    if (this.timeIntervals.currentIndex < this.timeIntervals.presets.length - 1) {
      this.timeIntervals.currentIndex++;
      this.updateTimeRange();
      console.log(`缩小到: ${this.timeIntervals.labels[this.timeIntervals.currentIndex]}`);
    } else {
      console.log('已达到最大时间间隔');
    }
  }
  
  // 更新时间范围并重绘
  updateTimeRange() {
    const newTimeRangeSeconds = this.timeIntervals.presets[this.timeIntervals.currentIndex];
    this.timeRange = newTimeRangeSeconds * 1000; // 转换为毫秒
    
    // 重置视图状态，因为我们改变了基础时间范围而不是缩放
    this.viewState.scaleX = 1;
    this.viewState.offsetX = 0;
    
    // 更新价格范围以适应新的时间范围
    this.updatePriceRange();
    
    // 立即更新视图
    this.drawChart();
    this.drawGrid();
  }
  
  // 直接设置时间间隔（通过索引）
  setTimeIntervalByIndex(index) {
    if (index >= 0 && index < this.timeIntervals.presets.length) {
      this.timeIntervals.currentIndex = index;
      this.updateTimeRange();
      console.log(`设置时间间隔为: ${this.timeIntervals.labels[index]}`);
      return true;
    }
    return false;
  }
  
  // 直接设置时间间隔（通过秒数）
  setTimeIntervalBySeconds(seconds) {
    const index = this.timeIntervals.presets.indexOf(seconds);
    if (index !== -1) {
      return this.setTimeIntervalByIndex(index);
    }
    console.warn(`不支持的时间间隔: ${seconds}秒`);
    return false;
  }
  
  // 获取当前时间间隔信息
  getCurrentTimeInterval() {
    return {
      index: this.timeIntervals.currentIndex,
      seconds: this.timeIntervals.presets[this.timeIntervals.currentIndex],
      label: this.timeIntervals.labels[this.timeIntervals.currentIndex],
      canZoomIn: this.timeIntervals.currentIndex > 0,
      canZoomOut: this.timeIntervals.currentIndex < this.timeIntervals.presets.length - 1
    };
  }
  
  // 获取所有可用的时间间隔
  getAvailableTimeIntervals() {
    return this.timeIntervals.presets.map((seconds, index) => ({
      index,
      seconds,
      label: this.timeIntervals.labels[index],
      isCurrent: index === this.timeIntervals.currentIndex
    }));
  }
  
  // 绘制未来时间线
  drawFutureTimeLine() {
    if (!this.futureTimeLineGraphics || !this.options.showFutureTimeLine) return;
    
    this.futureTimeLineGraphics.clear();
    
    const currentTime = Date.now();
    const chartWidth = this.options.width;
    const chartHeight = this.options.height;
    
    // 使用配置的时间间隔
    const futureTime = currentTime + this.options.futureTimeLineInterval;
    
    // 使用与折线相同的坐标转换方法计算X坐标
    const futureX = this.timeToX(futureTime, currentTime, chartWidth);
    
    // 检查时间线是否在可视范围内
    if (futureX >= -50 && futureX <= chartWidth + 50) {
      // 绘制黄色的未来时间线
      this.futureTimeLineGraphics.lineStyle(2, 0xFFD700, 0.8); // 黄色，透明度0.8，线宽2
      this.futureTimeLineGraphics.moveTo(futureX, 0);
      this.futureTimeLineGraphics.lineTo(futureX, chartHeight);
      
    }
  }

  // 新增：设置未来时间线间隔
  setFutureTimeLineInterval(intervalMs) {
    this.options.futureTimeLineInterval = intervalMs;
  }

  // 新增：切换未来时间线显示状态
  toggleFutureTimeLine(show) {
    this.options.showFutureTimeLine = show;
    if (!show) {
      this.futureTimeLineGraphics.clear();
    }
  }

  // 查找最佳标记点位置的方法
  findBestMarkerPosition(targetTimestamp, targetPrice, timeWindow = 5000) {
    if (this.data.length === 0) return null;
    
    // 在时间窗口内查找候选点
    const candidates = this.data.filter(dataPoint => {
      const timeDiff = Math.abs(dataPoint.timestamp - targetTimestamp);
      return timeDiff <= timeWindow;
    });
    
    // 如果时间窗口内没有数据点，扩大搜索范围
    if (candidates.length === 0) {
      // console.log('时间窗口内无数据点，使用最接近的数据点');
      return this.data.reduce((closest, current) => {
        const closestDiff = Math.abs(closest.timestamp - targetTimestamp);
        const currentDiff = Math.abs(current.timestamp - targetTimestamp);
        return currentDiff < closestDiff ? current : closest;
      });
    }
    
    // 在候选点中找到最佳匹配
    let bestMatch = candidates[0];
    let bestScore = Infinity;
    
    for (const candidate of candidates) {
      // 计算时间差分（权重较高）
      const timeDiff = Math.abs(candidate.timestamp - targetTimestamp);
      const timeScore = timeDiff / 1000; // 转换为秒
      
      // 计算价格差分（权重较低）
      const priceDiff = Math.abs(candidate.price - targetPrice);
      const priceScore = priceDiff * 0.1; // 降低价格权重
      
      // 综合评分：时间差更重要
      const totalScore = timeScore * 0.8 + priceScore * 0.2;
      
      if (totalScore < bestScore) {
        bestScore = totalScore;
        bestMatch = candidate;
      }
    }
    
    return bestMatch;
  }

  // 添加标记点方法
  addMarker(markerData) {
    // 如果没有数据，直接返回
    if (this.data.length === 0) {
      return null;
    }
    
    // 使用智能查找方法找到最佳位置
    const bestDataPoint = this.findBestMarkerPosition(markerData.timestamp || Date.now(), markerData.price || 0);
    
    if (!bestDataPoint) {
      return null;
    }
    
    // 使用实际数据点的时间戳和价格创建标记点
    const marker = {
      id: markerData.id || Date.now() + Math.random(),
      timestamp: bestDataPoint.timestamp, // 使用实际数据点的时间戳
      price: bestDataPoint.price, // 使用实际数据点的价格
      type: markerData.type || 'buy', // 'buy' 或 'sell'
      color: markerData.color || (markerData.type === 'buy' ? 0x00ff00 : 0xff0000), // 绿色买入，红色卖出
      size: markerData.size || 8, // 稍微增大标记点以便更清晰
      label: markerData.label || '',
      amount: markerData.amount || 0,
      name: markerData.name || '', // 保留用户名
      isRandom: markerData.isRandom || false, // 保留随机标记点标识
      isExpandable: markerData.isExpandable || false, // 保留可展开标识
      isExpanded: markerData.isExpanded || false, // 保留展开状态
      isUserOrder: markerData.isUserOrder || false, // 保留用户下单标识
      originalTimestamp: bestDataPoint.timestamp, // 保存原始时间戳用于调试
      originalPrice: bestDataPoint.price, // 保存原始价格用于调试
      timeDiff: Math.abs(bestDataPoint.timestamp - (markerData.timestamp || Date.now())) // 保存时间差用于调试
    };
    
    this.markers.push(marker);
    this.drawMarkers();
    
    return marker.id;
  }

  // 更新标记点
  updateMarkers(markersData) {
    // 保留现有的随机标记点
    const existingRandomMarkers = this.markers.filter(marker => marker.isRandom);
    
    // 创建新的下单标记点
    const newOrderMarkers = markersData.map(markerData => ({
      id: markerData.id || Date.now() + Math.random(),
      timestamp: markerData.timestamp || Date.now(),
      price: markerData.price || 0,
      type: markerData.type || 'buy',
      color: markerData.color || (markerData.type === 'buy' ? 0x00ff00 : 0xff0000),
      size: markerData.size || 6,
      label: markerData.label || '',
      amount: markerData.amount || 0,
      isRandom: false, // 明确标记为非随机标记点
      isExpandable: markerData.isExpandable || false,
      isExpanded: markerData.isExpanded || false,
      name: markerData.name || ''
    }));
    
    // 合并随机标记点和新的下单标记点
    this.markers = [...existingRandomMarkers, ...newOrderMarkers];
    
    this.drawMarkers();
  }

  // 绘制所有标记点
  drawMarkers() {
    if (!this.markerGraphics) return;
    
    this.markerGraphics.clear();
    this.markerLinesContainer.removeChildren(); // 清除旧的竖线
    
    // 清除之前的标记点文本标签
    if (this.markerTextContainer) {
      this.markerTextContainer.removeChildren();
    }
    
    const currentTime = Date.now();
    const chartWidth = this.options.width;
    const chartHeight = this.options.height;
    
    // 计算黄色时间轴的X坐标（使用配置的时间间隔）
    const futureTime = currentTime + this.options.futureTimeLineInterval;
    const futureTimeX = this.timeToX(futureTime, currentTime, chartWidth);
    
    // 先过滤掉与折线端点相遇的标记点（只针对下单标记点，不包括随机标记点）
    const markersToRemove = [];
    
    // 检查每个标记点是否与折线端点相遇
    this.markers.forEach(marker => {
      // 只检查下单标记点（非随机标记点）
      if (!marker.isRandom) {
        // 计算标记点时间后的X坐标（竖线位置）- 使用配置的时间间隔
        const markerFutureTime = marker.timestamp + this.options.futureTimeLineInterval;
        const markerFutureX = this.timeToX(markerFutureTime, currentTime, chartWidth);
        
        // 计算折线端点位置
        const endPointX = this.timeToX(currentTime, currentTime, chartWidth); // 当前时间对应的X坐标
        
        // 检查竖线是否与折线端点相遇（允许一定的误差范围）
        const meetingThreshold = 1; // 像素阈值
        const isMarkerLineMeetingEndPoint = Math.abs(markerFutureX - endPointX) <= meetingThreshold;
        
        // 如果竖线与折线端点相遇，标记为需要移除
        if (isMarkerLineMeetingEndPoint) {
          markersToRemove.push(marker.id);
        }
      }
    });
    
    // 移除与折线端点相遇的下单标记点
    if (markersToRemove.length > 0) {
      markersToRemove.forEach(markerId => {
        // 移除标记点
        this.markers = this.markers.filter(marker => marker.id !== markerId);
        
        // 移除对应的竖线
        if (this.markerLines.has(markerId)) {
          const lineGraphics = this.markerLines.get(markerId);
          lineGraphics.destroy();
          this.markerLines.delete(markerId);
        }
      });
      
      // 通知父组件标记点已被移除
      if (this.options.onMarkersRemoved && typeof this.options.onMarkersRemoved === 'function') {
        this.options.onMarkersRemoved(markersToRemove);
      }
    }
    
    // 现在绘制剩余的标记点
    this.markers.forEach(marker => {
      // 使用与折线相同的坐标转换方法
      const x = this.timeToX(marker.timestamp, currentTime, chartWidth);
      const y = this.priceToY(marker.price);
      
      // 计算标记点时间后的X坐标（竖线位置）- 使用配置的时间间隔
      const markerFutureTime = marker.timestamp + this.options.futureTimeLineInterval;
      const markerFutureX = this.timeToX(markerFutureTime, currentTime, chartWidth);
      
      // 检查标记点是否在可视范围内（使用与折线相同的可见性检查）
      if (this.isPointVisible(x, y)) {
        // 验证标记点是否真的在折线上
        const isOnLine = this.isPointOnLine(x, y, marker.timestamp, marker.price);
        
        if (!isOnLine) {
          console.warn(`标记点 ${marker.id} 可能不在折线上`, {
            计算坐标: { x, y },
            时间戳: marker.timestamp,
            价格: marker.price,
            时间: new Date(marker.timestamp).toLocaleTimeString()
          });
        }
        
        // 只为下单标记点绘制连接线和竖线
        if (!marker.isRandom) {
          // 检查黄色时间轴是否在可视范围内
          const isTimeLineVisible = futureTimeX >= -50 && futureTimeX <= chartWidth + 50;
          
          // 如果黄色时间轴可见，绘制连接线
          if (isTimeLineVisible) {
            // 绘制从标记点到竖线位置的连接线
            this.markerGraphics.lineStyle(1, marker.color, 0.6);
            
            // 检查竖线是否在可视范围内
            if (markerFutureX >= -50 && markerFutureX <= chartWidth + 50) {
              // 从标记点开始绘制横线到竖线位置
              this.markerGraphics.moveTo(x, y);
              this.markerGraphics.lineTo(markerFutureX, y);
            }
          }
        }
        
        // 根据标记点类型绘制不同的图标
        if (marker.isRandom && marker.isExpandable) {
          // 随机标记点 - 绘制头像
          this.drawAvatarMarker(x, y, marker);
        } else {
          // 用户下单标记点 - 保持原有的圆点样式
          this.drawCircleMarker(x, y, marker);
        }

        // 添加金额标签和name标签（如果是可展开的标记点）
        if (marker.amount && marker.amount > 0) {
          const amountText = `$${marker.amount}`;
          
          // 根据缩放调整字体大小
          const fontSize = Math.max(10, Math.min(16, 12 / Math.sqrt(this.viewState.scaleX)));
          
          const textStyle = {
            fontFamily: 'Arial',
            fontSize: fontSize,
            fill: 0xffffff,
            fontWeight: 'bold',
            stroke: marker.color,
            strokeThickness: 1
          };
          
          const amountLabel = new PIXI.Text(amountText, textStyle);
          
          // 计算标签位置 - 在标记点上方
          const labelOffsetY = (marker.isRandom ? 11 : 10) + 15; // 头像偏移调整为11，与新的头像大小匹配
          amountLabel.x = x - amountLabel.width / 2; // 水平居中
          amountLabel.y = y - labelOffsetY; // 在标记点上方
          
          // 如果是可展开的标记点且已展开，显示name信息
          if (marker.isExpandable && marker.isExpanded && marker.name) {
            // 创建name标签
            const nameText = marker.name;
            const nameStyle = {
              fontFamily: 'Arial',
              fontSize: fontSize - 2, // 稍小的字体
              fill: 0xffffff,
              fontWeight: 'normal',
              stroke: 0x000000,
              strokeThickness: 1
            };
            
            const nameLabel = new PIXI.Text(nameText, nameStyle);
            nameLabel.x = x - nameLabel.width / 2; // 水平居中
            nameLabel.y = y - labelOffsetY - 40; // 调整位置，为价格标签留出空间
            
            // 创建价格标签
            const priceText = `@$${marker.price.toFixed(2)}`;
            const priceStyle = {
              fontFamily: 'Arial',
              fontSize: fontSize - 2, // 与用户名相同大小
              fill: 0xFFD700, // 金色，突出显示价格
              fontWeight: 'normal',
              stroke: 0x000000,
              strokeThickness: 1
            };
            
            const priceLabel = new PIXI.Text(priceText, priceStyle);
            priceLabel.x = x - priceLabel.width / 2; // 水平居中
            priceLabel.y = y - labelOffsetY - 20; // 在金额标签上方，用户名下方
            
            // 确保name标签在可视范围内
            if (nameLabel.x < 0) {
              nameLabel.x = 5;
            } else if (nameLabel.x + nameLabel.width > chartWidth) {
              nameLabel.x = chartWidth - nameLabel.width - 5;
            }
            
            // 确保price标签在可视范围内
            if (priceLabel.x < 0) {
              priceLabel.x = 5;
            } else if (priceLabel.x + priceLabel.width > chartWidth) {
              priceLabel.x = chartWidth - priceLabel.width - 5;
            }
            
            // 如果上方空间不足，将所有标签显示在下方
            if (nameLabel.y < 0) {
              nameLabel.y = y + (marker.isRandom ? 11 : 10) + 25; // 如果上方超出，则显示在下方，头像偏移调整为11
              priceLabel.y = y + (marker.isRandom ? 11 : 10) + 45; // 价格标签在用户名下方
              amountLabel.y = y + (marker.isRandom ? 11 : 10) + 65; // 金额标签在价格下方
            }
            
            this.markerTextContainer.addChild(nameLabel);
            this.markerTextContainer.addChild(priceLabel);
            
            // 创建展开状态的背景框 - 调整高度以容纳三行文本
            const padding = 4;
            const bgWidth = Math.max(amountLabel.width, nameLabel.width, priceLabel.width) + padding * 2;
            const bgHeight = 60; // 增加高度以包含三行文本
            
            // 根据文本标签位置确定背景框位置
            const isDisplayedBelow = nameLabel.y > y; // 判断文本是否显示在标记点下方
            const bgX = x - bgWidth / 2;
            const bgY = isDisplayedBelow ? 
              y + (marker.isRandom ? 11 : 10) + 20 : // 下方显示时的背景框位置
              y - labelOffsetY - 45; // 上方显示时的背景框位置
            
            const bgGraphics = new PIXI.Graphics();
            bgGraphics.beginFill(0x000000, 0.7); // 半透明黑色背景
            bgGraphics.lineStyle(1, marker.color, 0.8); // 使用标记点颜色作为边框
            bgGraphics.drawRoundedRect(
              bgX, 
              bgY,
              bgWidth, 
              bgHeight, 
              5
            );
            bgGraphics.endFill();
            
            this.markerTextContainer.addChild(bgGraphics);
            
            // 重新添加文本标签，确保它们在背景之上
            this.markerTextContainer.addChild(nameLabel);
            this.markerTextContainer.addChild(priceLabel);
            this.markerTextContainer.addChild(amountLabel);
          } else {
            // 普通显示模式或不可展开的标记点
            // 确保标签在可视范围内
            if (amountLabel.x < 0) {
              amountLabel.x = 5;
            } else if (amountLabel.x + amountLabel.width > chartWidth) {
              amountLabel.x = chartWidth - amountLabel.width - 5;
            }
            
            if (amountLabel.y < 0) {
              amountLabel.y = y + (marker.isRandom ? 11 : 10) + 5; // 如果上方超出，则显示在下方，头像偏移调整为11
            }
            
            this.markerTextContainer.addChild(amountLabel);
          }
        }

        // 只为下单标记点绘制竖线
        if (!marker.isRandom) {
          // 绘制标记点对应的竖线
          const lineGraphics = new PIXI.Graphics();
          lineGraphics.lineStyle(1, marker.color, 0.6); // 使用标记点相同的颜色，透明度0.6
          
          // 检查竖线是否在可视范围内
          if (markerFutureX >= -50 && markerFutureX <= chartWidth + 50) {
            lineGraphics.moveTo(markerFutureX, 0); // 从图表顶部开始
            lineGraphics.lineTo(markerFutureX, chartHeight); // 到图表底部
            
            // console.log(`绘制下单标记点 ${marker.id} 的竖线: 标记点时间=${new Date(marker.timestamp).toLocaleTimeString()}, 竖线时间=${new Date(markerFutureTime).toLocaleTimeString()}, X坐标=${markerFutureX.toFixed(2)}`);
          }
          
          this.markerLinesContainer.addChild(lineGraphics);
          this.markerLines.set(marker.id, lineGraphics);
        }
      }
    });
  }

  // 绘制头像标记点（用于随机标记点）
  drawAvatarMarker(x, y, marker) {
    // 根据缩放级别调整头像大小 - 调整基础大小与下单标记点一致
    const scaleFactor = Math.max(0.5, Math.min(2, 1 / this.viewState.scaleX));
    const avatarSize = 8 * scaleFactor; // 从12减小到8，与下单标记点大小一致
    
    // 绘制头像阴影
    this.markerGraphics.beginFill(0x000000, 0.3); // 半透明黑色阴影
    this.markerGraphics.drawCircle(x + 1.5, y + 1.5, avatarSize);
    this.markerGraphics.endFill();
    
    // 绘制头像背景圆圈
    this.markerGraphics.beginFill(0xffffff, 1); // 白色背景
    this.markerGraphics.drawCircle(x, y, avatarSize);
    this.markerGraphics.endFill();
    
    // 绘制头像边框（根据买涨买跌使用不同颜色）
    const borderWidth = Math.max(1.5, 2 * scaleFactor); // 稍微减小边框宽度
    this.markerGraphics.lineStyle(borderWidth, marker.color, 1);
    this.markerGraphics.drawCircle(x, y, avatarSize);
    this.markerGraphics.lineStyle(0);
    
    // 绘制简化的头像图标（人脸）
    const faceSize = avatarSize * 0.7;
    
    // 根据买涨买跌使用不同的头像颜色
    const faceColor = marker.type === 'buy' ? 0x4CAF50 : 0xF44336; // 绿色买涨，红色买跌
    
    // 绘制头部
    this.markerGraphics.beginFill(faceColor, 1);
    this.markerGraphics.drawCircle(x, y - faceSize * 0.25, faceSize * 0.35);
    this.markerGraphics.endFill();
    
    // 绘制身体
    this.markerGraphics.beginFill(faceColor, 1);
    this.markerGraphics.drawRoundedRect(
      x - faceSize * 0.25, 
      y + faceSize * 0.15, 
      faceSize * 0.5, 
      faceSize * 0.35, 
      faceSize * 0.08
    );
    this.markerGraphics.endFill();
    
    // 绘制眼睛
    const eyeSize = faceSize * 0.08; // 稍微增大眼睛相对大小，保持可见性
    this.markerGraphics.beginFill(0xffffff, 1);
    this.markerGraphics.drawCircle(x - faceSize * 0.12, y - faceSize * 0.35, eyeSize);
    this.markerGraphics.drawCircle(x + faceSize * 0.12, y - faceSize * 0.35, eyeSize);
    this.markerGraphics.endFill();
    
    // 绘制瞳孔
    const pupilSize = eyeSize * 0.6;
    this.markerGraphics.beginFill(0x333333, 1);
    this.markerGraphics.drawCircle(x - faceSize * 0.12, y - faceSize * 0.35, pupilSize);
    this.markerGraphics.drawCircle(x + faceSize * 0.12, y - faceSize * 0.35, pupilSize);
    this.markerGraphics.endFill();
    
    // 绘制嘴巴（微笑）
    this.markerGraphics.lineStyle(Math.max(1, 1.5 * scaleFactor), 0xffffff, 1);
    this.markerGraphics.arc(x, y - faceSize * 0.15, faceSize * 0.12, 0.2, Math.PI - 0.2);
    this.markerGraphics.lineStyle(0);
    
    // 添加头发/帽子装饰
    this.markerGraphics.beginFill(0x8B4513, 1); // 棕色头发
    this.markerGraphics.drawEllipse(x, y - faceSize * 0.45, faceSize * 0.3, faceSize * 0.15);
    this.markerGraphics.endFill();
    
    // 如果是可展开的标记点，在头像上添加一个小的展开指示器
    if (marker.isExpandable) {
      const indicatorSize = 3 * scaleFactor; // 从4减小到3
      const indicatorX = x + avatarSize * 0.6;
      const indicatorY = y - avatarSize * 0.6;
      
      // 绘制指示器背景
      this.markerGraphics.beginFill(0xffffff, 1);
      this.markerGraphics.drawCircle(indicatorX, indicatorY, indicatorSize);
      this.markerGraphics.endFill();
      
      // 绘制指示器边框
      this.markerGraphics.lineStyle(1, marker.color, 1);
      this.markerGraphics.drawCircle(indicatorX, indicatorY, indicatorSize);
      this.markerGraphics.lineStyle(0);
      
      // 在指示器上绘制小图标
      const iconSize = indicatorSize * 0.5;
      this.markerGraphics.beginFill(marker.color, 1);
      
      if (marker.isExpanded) {
        // 展开状态：绘制减号
        this.markerGraphics.drawRect(
          indicatorX - iconSize, 
          indicatorY - iconSize * 0.2, 
          iconSize * 2, 
          iconSize * 0.4
        );
      } else {
        // 收起状态：绘制加号
        this.markerGraphics.drawRect(
          indicatorX - iconSize, 
          indicatorY - iconSize * 0.2, 
          iconSize * 2, 
          iconSize * 0.4
        );
        this.markerGraphics.drawRect(
          indicatorX - iconSize * 0.2, 
          indicatorY - iconSize, 
          iconSize * 0.4, 
          iconSize * 2
        );
      }
      this.markerGraphics.endFill();
    }
    
    // 添加光晕效果（当点击时）
    if (marker.isExpanded) {
      this.markerGraphics.lineStyle(2, 0xFFD700, 0.6); // 金色光晕
      this.markerGraphics.drawCircle(x, y, avatarSize + 2); // 从+3减小到+2
      this.markerGraphics.lineStyle(0);
    }
  }

  // 绘制圆点标记点（用于用户下单标记点）
  drawCircleMarker(x, y, marker) {
    // 根据缩放级别调整标记点大小，确保在不同缩放下都清晰可见
    const baseDotSize = marker.size || 4; // 基础大小
    const scaleFactor = Math.max(0.5, Math.min(2, 1 / this.viewState.scaleX)); // 反向缩放因子，限制在0.5-2倍之间
    const dotSize = baseDotSize * scaleFactor;
    
    // 绘制主体圆点，根据买涨买跌使用不同颜色
    this.markerGraphics.beginFill(marker.color, 1);
    this.markerGraphics.drawCircle(x, y, dotSize);
    this.markerGraphics.endFill();
    
    // 绘制白色边框，使其在图表上更突出
    // 边框粗细也根据缩放调整
    const borderWidth = Math.max(0.5, 1 * scaleFactor);
    this.markerGraphics.lineStyle(borderWidth, 0xffffff, 0.8);
    this.markerGraphics.drawCircle(x, y, dotSize);
    this.markerGraphics.lineStyle(0); // 重置线条样式
  }

  // 验证点是否在折线上（或接近折线）
  isPointOnLine(x, y, timestamp, price) {
    // 如果没有足够的数据点，无法验证
    if (this.data.length < 2) return true;
    
    // 查找最接近的数据点
    let closestDataPoint = null;
    let minDistance = Infinity;
    
    for (const dataPoint of this.data) {
      const dataX = this.timeToX(dataPoint.timestamp, Date.now(), this.options.width);
      const dataY = this.priceToY(dataPoint.price);
      
      const distance = Math.sqrt(Math.pow(x - dataX, 2) + Math.pow(y - dataY, 2));
      
      if (distance < minDistance) {
        minDistance = distance;
        closestDataPoint = dataPoint;
      }
    }
    
    // 如果最近的数据点距离超过阈值，认为不在折线上
    const threshold = 15; // 像素阈值
    return minDistance <= threshold;
  }

  // 清除所有标记点
  clearMarkers() {
    this.markers = [];
    this.markerLines.forEach(line => line.destroy());
    this.markerLines.clear();
    if (this.markerGraphics) {
      this.markerGraphics.clear();
    }
    // 清除文本标签容器
    if (this.markerTextContainer) {
      this.markerTextContainer.removeChildren();
    }
    console.log('清除所有标记点和文本标签');
  }

  // 只清除下单标记点，保留随机标记点
  clearOrderMarkers() {
    const originalCount = this.markers.length;
    
    // 找出要清除的下单标记点ID
    const orderMarkerIds = this.markers
      .filter(marker => !marker.isRandom)
      .map(marker => marker.id);
    
    // 清除下单标记点对应的竖线
    orderMarkerIds.forEach(markerId => {
      if (this.markerLines.has(markerId)) {
        const lineGraphics = this.markerLines.get(markerId);
        lineGraphics.destroy();
        this.markerLines.delete(markerId);
      }
    });
    
    // 过滤掉下单标记点，保留随机标记点
    this.markers = this.markers.filter(marker => marker.isRandom);
    
    // 重新绘制标记点
    if (this.markerGraphics) {
      this.markerGraphics.clear();
    }
    if (this.markerTextContainer) {
      this.markerTextContainer.removeChildren();
    }
    
    // 重新绘制剩余的标记点
    this.drawMarkers();
    
    console.log(`清除了 ${originalCount - this.markers.length} 个下单标记点，保留了 ${this.markers.length} 个随机标记点`);
  }

  // 移除指定标记点
  removeMarker(markerId) {
    this.markers = this.markers.filter(marker => marker.id !== markerId);
    
    // 移除对应的竖线
    if (this.markerLines.has(markerId)) {
      const lineGraphics = this.markerLines.get(markerId);
      lineGraphics.destroy();
      this.markerLines.delete(markerId);
    }
    
    this.drawMarkers();
    console.log('移除标记点和对应竖线:', markerId);
  }

  // 获取指定位置的标记点
  getMarkerAt(x, y, tolerance = 10) {
    const currentTime = Date.now();
    const chartWidth = this.options.width;
    
    const foundMarker = this.markers.find(marker => {
      // 使用与绘制标记点相同的坐标转换方法
      const markerX = this.timeToX(marker.timestamp, currentTime, chartWidth);
      const markerY = this.priceToY(marker.price);
      
      // 根据标记点类型调整检测范围
      let detectionRadius = tolerance;
      if (marker.isRandom && marker.isExpandable) {
        // 头像标记点需要更大的检测范围
        const scaleFactor = Math.max(0.5, Math.min(2, 1 / this.viewState.scaleX));
        const avatarSize = 8 * scaleFactor;
        detectionRadius = Math.max(tolerance, avatarSize + 3);
      }
      
      const distance = Math.sqrt(Math.pow(x - markerX, 2) + Math.pow(y - markerY, 2));
      
      return distance <= detectionRadius;
    });
    
    return foundMarker;
  }

  // 手动启用历史数据显示
  enableHistoricalData() {
    if (!this.viewState.hasUserDraggedLeft) {
      this.viewState.hasUserDraggedLeft = true;
      this.drawChart();
    }
  }
  
  // 手动禁用历史数据显示
  disableHistoricalData() {
    if (this.viewState.hasUserDraggedLeft) {
      this.viewState.hasUserDraggedLeft = false;
      this.drawChart();
    }
  }
  
  // 获取历史数据显示状态
  isHistoricalDataEnabled() {
    return this.viewState.hasUserDraggedLeft;
  }
  
  // 设置历史数据时间阈值
  setHistoricalDataThreshold(threshold) {
    this.options.historicalDataThreshold = threshold;
    
    // 如果历史数据未启用，重新绘制图表
    if (!this.viewState.hasUserDraggedLeft) {
      this.drawChart();
    }
  }

  // 启动随机标记点定时器
  startRandomMarkerTimer() {
    if (!this.options.enableRandomMarkers) {
      return;
    }

    // 清除现有定时器
    this.stopRandomMarkerTimer();

    // 生成随机间隔（0到2分钟之间）
    const randomInterval = Math.floor(Math.random() * 120000); // 0到120000毫秒（2分钟）
    console.log(`启动随机标记点定时器，随机间隔: ${randomInterval}ms (${(randomInterval/1000).toFixed(1)}秒)`);
    
    this.randomMarkerTimer = setTimeout(() => {
      this.generateRandomMarker();
    }, randomInterval);
  }

  // 停止随机标记点定时器
  stopRandomMarkerTimer() {
    if (this.randomMarkerTimer) {
      clearTimeout(this.randomMarkerTimer);
      this.randomMarkerTimer = null;
    }
  }

  // 生成随机标记点
  generateRandomMarker() {
    // 检查是否有足够的数据点来生成标记点
    if (this.data.length === 0) {
      // 重新启动定时器，继续等待下一次生成
      this.startRandomMarkerTimer();
      return;
    }

    // 获取当前时间
    const currentTime = Date.now();
    
    // 随机选择买涨或买跌
    const isBuyUp = Math.random() > 0.5;
    const markerType = isBuyUp ? 'buy' : 'sell';
    
    // 随机生成金额 (范围: 10-100)
    const amounts = [10, 20, 30, 50, 100];
    const randomAmount = amounts[Math.floor(Math.random() * amounts.length)];
    
    // 随机生成用户名
    const userNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'];
    const randomName = userNames[Math.floor(Math.random() * userNames.length)];
    
    // 获取最新的数据点作为标记点位置
    const latestDataPoint = this.data[this.data.length - 1];
    
    // 增加计数器用于生成唯一ID
    this.randomMarkerCounter++;
    
    // 创建随机标记点数据
    const randomMarkerData = {
      id: `random_${this.randomMarkerCounter}_${Date.now()}`,
      timestamp: latestDataPoint.timestamp, // 使用最新数据点的时间戳
      price: latestDataPoint.price, // 使用最新数据点的价格
      type: markerType,
      color: isBuyUp ? 0x00ff00 : 0xff0000, // 绿色买涨，红色买跌
      size: 4,
      label: isBuyUp ? 'Random Buy Up' : 'Random Buy Down',
      amount: randomAmount,
      name: randomName, // 添加用户名
      isRandom: true, // 标识这是随机生成的标记点
      isExpandable: true, // 标识这是可展开的标记点
      isExpanded: false // 初始状态为未展开
    };

    // 添加标记点到图表
    const markerId = this.addMarker(randomMarkerData);
    
    if (markerId) {
      // 通知父组件有新的随机标记点生成
      if (this.options.onRandomMarkerGenerated && typeof this.options.onRandomMarkerGenerated === 'function') {
        this.options.onRandomMarkerGenerated(randomMarkerData);
      }
    }
    
    // 重新启动定时器，设置下一次随机间隔
    this.startRandomMarkerTimer();
  }

  // 启用/禁用随机标记点
  setRandomMarkersEnabled(enabled) {
    this.options.enableRandomMarkers = enabled;
    
    if (enabled) {
      this.startRandomMarkerTimer();
    } else {
      this.stopRandomMarkerTimer();
    }
  }

  // 设置随机标记点间隔
  setRandomMarkerInterval(interval) {
    this.options.randomMarkerInterval = interval;
    
    // 如果当前启用了随机标记点，重新启动定时器
    if (this.options.enableRandomMarkers) {
      this.startRandomMarkerTimer();
    }
  }

  // 获取随机标记点状态
  getRandomMarkerStatus() {
    return {
      enabled: this.options.enableRandomMarkers,
      interval: this.options.randomMarkerInterval,
      isRunning: this.randomMarkerTimer !== null,
      generatedCount: this.randomMarkerCounter
    };
  }
  
  // 检查并加载更多历史数据
  checkAndLoadMoreHistory() {
    // 检查是否满足加载条件
    if (this.isLoadingHistory) {
      return; // 正在加载中，跳过
    }
    
    const currentTime = Date.now();
    if (currentTime - this.lastHistoryLoadTime < this.historyLoadCooldown) {
      return; // 冷却时间未到，跳过
    }
    
    // 检查拖动距离是否超过阈值
    if (this.viewState.dragDistance < this.historyLoadThreshold) {
      return; // 拖动距离不够，跳过
    }
    
    // 检查当前视图是否已经显示了足够的历史数据
    const visibleTimeRange = this.timeRange / this.viewState.scaleX;
    const currentViewStartTime = Date.now() - visibleTimeRange * 0.75 + (this.viewState.offsetX / this.viewState.scaleX / this.options.width * this.timeRange);
    
    // 如果当前数据的最早时间距离视图开始时间太近，则需要加载更多历史数据
    if (this.data.length > 0) {
      const earliestDataTime = Math.min(...this.data.map(d => d.timestamp));
      const timeGap = currentViewStartTime - earliestDataTime;
      
      if (timeGap < 30000) { // 如果时间间隔小于30秒，加载更多历史数据
        this.loadMoreHistoryData();
      }
    }
  }
  
  // 加载更多历史数据
  loadMoreHistoryData() {
    if (this.isLoadingHistory || !this.options.onLoadMoreHistory) {
      return;
    }
    
    this.isLoadingHistory = true;
    this.lastHistoryLoadTime = Date.now();
    this.viewState.dragDistance = 0; // 重置拖动距离
    
    // 调用外部提供的历史数据加载回调
    if (typeof this.options.onLoadMoreHistory === 'function') {
      const earliestTime = this.data.length > 0 ? Math.min(...this.data.map(d => d.timestamp)) : Date.now();
      this.options.onLoadMoreHistory(earliestTime, () => {
        // 加载完成后的回调
        this.isLoadingHistory = false;
      });
    }
  }
  
  // 检查是否接近最新位置
  checkIfNearLatestPosition() {
    const threshold = 50;
    
    // 如果偏移量接近0，认为接近最新位置
    if (Math.abs(this.viewState.offsetX) < threshold) {
      if (!this.viewState.isAtLatestPosition) {
        this.viewState.isAtLatestPosition = true;
        
        // 通知外部组件用户已回到最新位置
        if (typeof this.options.onReturnToLatest === 'function') {
          this.options.onReturnToLatest();
        }
      }
    }
  }
  
  // 回到最新位置
  returnToLatest() {
    // 重置视图状态
    this.viewState.offsetX = 0;
    this.viewState.offsetY = 0;
    this.viewState.scaleX = 1;
    this.viewState.scaleY = 1;
    this.viewState.hasUserDraggedLeft = false;
    this.viewState.isAtLatestPosition = true;
    this.viewState.dragDistance = 0;
    
    // 重置动画状态
    this.animationState.isAnimating = false;
    this.animationState.pendingAnimations = [];
    
    // 更新价格范围以适应最新数据
    this.updatePriceRange();
    
    // 更新视图
    this.updateView();
    
    // 通知外部组件
    if (typeof this.options.onReturnToLatest === 'function') {
      this.options.onReturnToLatest();
    }
  }
  
  // 获取当前位置状态
  getPositionStatus() {
    return {
      isAtLatestPosition: this.viewState.isAtLatestPosition,
      hasUserDraggedLeft: this.viewState.hasUserDraggedLeft,
      offsetX: this.viewState.offsetX,
      dragDistance: this.viewState.dragDistance,
      isLoadingHistory: this.isLoadingHistory
    };
  }
  
  // 设置历史数据加载阈值
  setHistoryLoadThreshold(threshold) {
    this.historyLoadThreshold = threshold;
  }

  // 添加历史数据的专用方法
  addHistoricalData(historicalDataArray) {
    if (!Array.isArray(historicalDataArray) || historicalDataArray.length === 0) {
      return;
    }
    
    // 对历史数据按时间戳排序
    const sortedHistoricalData = historicalDataArray.sort((a, b) => a.timestamp - b.timestamp);
    
    // 获取当前数据的最早和最晚时间戳
    const currentEarliestTime = this.data.length > 0 ? 
      Math.min(...this.data.map(d => d.timestamp)) : Date.now();
    const currentLatestTime = this.data.length > 0 ? 
      Math.max(...this.data.map(d => d.timestamp)) : Date.now();
    
    // 分离历史数据：只添加比当前最早数据更早的数据
    const validHistoricalData = sortedHistoricalData.filter(d => d.timestamp < currentEarliestTime);
    const futureData = sortedHistoricalData.filter(d => d.timestamp >= currentEarliestTime && d.timestamp <= currentLatestTime);
    
    if (validHistoricalData.length === 0) {
      return;
    }
    
    // 将有效的历史数据添加到数据数组的开头
    this.data = [...validHistoricalData, ...this.data];
    
    // 确保整个数据数组按时间排序
    this.data.sort((a, b) => a.timestamp - b.timestamp);
    
    // 限制数据数组的大小，防止内存溢出
    const maxDataPoints = this.timeRange * 4 / 500;
    if (this.data.length > maxDataPoints) {
      this.data = this.data.slice(-maxDataPoints);
    }
    
    // 更新价格范围
    this.updatePriceRange();
    
    // 重新绘制图表和网格
    this.drawChart();
    this.drawGrid();
  }
  
  // 检查数据完整性的方法
  validateDataIntegrity() {
    if (this.data.length === 0) {
      return true;
    }
    
    // 检查时间顺序是否正确
    let isTimeOrderCorrect = true;
    for (let i = 1; i < this.data.length; i++) {
      if (this.data[i].timestamp < this.data[i - 1].timestamp) {
        isTimeOrderCorrect = false;
      }
    }
    
    if (!isTimeOrderCorrect) {
      // 自动修复时间顺序
      this.data.sort((a, b) => a.timestamp - b.timestamp);
    }
    
    // 检查是否有重复的时间戳
    const timestamps = this.data.map(d => d.timestamp);
    const uniqueTimestamps = new Set(timestamps);
    
    return isTimeOrderCorrect && timestamps.length === uniqueTimestamps.size;
  }

  // 设置平滑流动效果
  setSmoothFlowEnabled(enabled) {
    if (this.timeFlow) {
      this.timeFlow.smoothing = enabled;
    }
  }
  
  // 获取平滑流动效果状态
  isSmoothFlowEnabled() {
    return this.timeFlow && this.timeFlow.smoothing;
  }
  
  // 设置平滑流动插值因子
  setSmoothFlowInterpolationFactor(factor) {
    if (this.timeFlow) {
      this.timeFlow.interpolationFactor = Math.max(0.001, Math.min(1, factor));
    }
  }
  
  // 价格范围控制方法
  
  // 设置价格范围敏感度
  setPriceRangeSensitivity(sensitivity) {
    const validSensitivities = ['low', 'medium', 'high'];
    if (validSensitivities.includes(sensitivity)) {
      this.options.priceRangeSensitivity = sensitivity;
      this.updatePriceRange();
      this.drawChart();
    }
  }
  
  // 获取当前价格范围敏感度
  getPriceRangeSensitivity() {
    return this.options.priceRangeSensitivity;
  }
  
  // 设置价格范围时间窗口比例
  setPriceRangeTimeWindowRatio(ratio) {
    this.options.priceRangeTimeWindowRatio = Math.max(0.1, Math.min(1, ratio));
    this.updatePriceRange();
    this.drawChart();
  }
  
  // 设置最大价格范围时间窗口
  setMaxPriceRangeTimeWindow(timeWindow) {
    this.options.maxPriceRangeTimeWindow = Math.max(1000, timeWindow);
    this.updatePriceRange();
    this.drawChart();
  }
  
  // 设置最小价格范围
  setMinPriceRange(minRange) {
    this.options.minPriceRange = Math.max(0.1, minRange);
    this.updatePriceRange();
    this.drawChart();
  }
  
  // 启用/禁用动态价格范围
  setDynamicPriceRangeEnabled(enabled) {
    this.options.dynamicPriceRangeEnabled = enabled;
    this.updatePriceRange();
    this.drawChart();
  }
  
  // 获取价格范围配置信息
  getPriceRangeConfig() {
    return {
      sensitivity: this.options.priceRangeSensitivity,
      timeWindowRatio: this.options.priceRangeTimeWindowRatio,
      maxTimeWindow: this.options.maxPriceRangeTimeWindow,
      minRange: this.options.minPriceRange,
      dynamicEnabled: this.options.dynamicPriceRangeEnabled,
      currentRange: {
        min: this.priceRange.min,
        max: this.priceRange.max,
        spread: this.priceRange.max - this.priceRange.min
      }
    };
  }
  
  // 重置价格范围为默认设置
  resetPriceRangeConfig() {
    this.options.priceRangeSensitivity = 'medium';
    this.options.priceRangeTimeWindowRatio = 0.3;
    this.options.maxPriceRangeTimeWindow = 15000;
    this.options.minPriceRange = 0.5;
    this.options.dynamicPriceRangeEnabled = true;
    
    this.updatePriceRange();
    this.drawChart();
  }

  // 控制时间流平滑
  setTimeFlowSmoothing(enabled) {
    if (this.timeFlow) {
      this.timeFlow.smoothing = enabled;
      console.log(`时间流平滑已${enabled ? '启用' : '禁用'}`);
    }
  }
  
  // 获取时间流平滑状态
  isTimeFlowSmoothingEnabled() {
    return this.timeFlow && this.timeFlow.smoothing;
  }
  
  // 强制更新时间基准
  updateTimeBase() {
    this.renderTimeBase.currentTime = Date.now();
    this.renderTimeBase.lastUpdateTime = Date.now();
  }
  
  // 强制更新价格范围
  forceUpdatePriceRange() {
    this.updatePriceRange();
    this.drawChart();
    this.drawGrid();
  }
  
  // 获取当前价格范围
  getCurrentPriceRange() {
    return {
      min: this.priceRange.min,
      max: this.priceRange.max,
      spread: this.priceRange.max - this.priceRange.min
    };
  }
  
  // 数据稳定性控制方法
  setDataStabilityThreshold(threshold) {
    this.dataStability.stabilityThreshold = Math.max(50, Math.min(500, threshold));
    console.log(`数据稳定性阈值已设置为: ${this.dataStability.stabilityThreshold}ms`);
  }
  
  getDataStabilityThreshold() {
    return this.dataStability.stabilityThreshold;
  }
  
  setMaxPendingDataCount(count) {
    this.dataStability.maxPendingCount = Math.max(1, Math.min(10, count));
    console.log(`最大待处理数据数量已设置为: ${this.dataStability.maxPendingCount}`);
  }
  
  getDataStabilityStatus() {
    return {
      pendingCount: this.dataStability.pendingData.length,
      isProcessing: this.dataStability.isProcessing,
      stabilityThreshold: this.dataStability.stabilityThreshold,
      maxPendingCount: this.dataStability.maxPendingCount,
      lastStableTime: this.dataStability.lastStableTime
    };
  }
  
  // 强制处理所有待处理数据（调试用）
  flushPendingData() {
    if (this.dataStability.pendingData.length > 0) {
      console.log(`强制处理 ${this.dataStability.pendingData.length} 个待处理数据点`);
      
      // 清除定时器
      if (this.dataStability.renderTimer) {
        clearTimeout(this.dataStability.renderTimer);
      }
      
      // 立即处理所有数据
      const allData = [...this.dataStability.pendingData];
      this.dataStability.pendingData = [];
      
      allData.forEach(data => {
        const { receivedTime, ...cleanData } = data;
        this.data.push(cleanData);
      });
      
      this.updatePriceRange();
      this.validateAndAdjustMarkers();
      this.updateRenderTimeBase();
      this.drawChart();
      this.performDataCleanup();
      
      this.dataStability.isProcessing = false;
      this.dataStability.lastStableTime = Date.now();
    }
  }
} 
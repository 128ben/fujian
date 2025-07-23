import * as PIXI from 'pixi.js';

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
      latestPriceLineColor: options.latestPriceLineColor || 0xff4444, // 最新价格线颜色
      animationDuration: options.animationDuration || 300, // 动画持续时间(ms) - 与数据更新频率协调
      animationEasing: options.animationEasing || 'easeOutCubic', // 缓动函数
      animationEnabled: options.animationEnabled || true,
      showLatestPriceLine: options.showLatestPriceLine !== false, // 默认显示最新价格线
      showHistoricalData: options.showHistoricalData !== false, // 默认显示历史数据
      historicalDataThreshold: options.historicalDataThreshold || 30000, // 历史数据时间阈值(30秒)
      enableRandomMarkers: options.enableRandomMarkers !== false, // 默认启用随机标记点
      randomMarkerInterval: options.randomMarkerInterval || 60000, // 随机标记点间隔(60秒，实际使用时会是0-120秒的随机值)
      // 新增：未来时间线配置
      futureTimeLineInterval: options.futureTimeLineInterval || 15000, // 默认15秒
      showFutureTimeLine: options.showFutureTimeLine !== false, // 默认显示未来时间线
      onLoadMoreHistory: options.onLoadMoreHistory || null, // 加载更多历史数据的回调函数
      onReturnToLatest: options.onReturnToLatest || null, // 返回最新位置的回调函数
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
      hasUserDraggedLeft: false, // 新增：用户是否向左拖动过
      isAtLatestPosition: true, // 新增：是否在最新位置
      dragDistance: 0 // 新增：拖动距离累计
    };
    
    // 动画状态管理
    this.animationState = {
      isAnimating: false,
      startTime: 0,
      fromPoint: null,
      toPoint: null,
      currentProgress: 0,
      pendingAnimations: [] // 待执行的动画队列
    };
    
    // 最新价格线相关
    this.latestPriceLineGraphics = null;
    this.leftPriceLabel = null;
    this.futureTimeLineGraphics = null;
    
    this.timeRange = 60000; // 60秒时间范围
    this.priceRange = { min: 95, max: 105 }; // 初始价格范围
    this.startTime = Date.now();
    
    // 网格更新控制 - 与数据更新频率协调
    this.lastGridUpdate = 0;
    this.gridUpdateInterval = 500; // 网格更新间隔500ms，与数据更新同步
    
    // 智能更新策略
    this.updateStrategy = {
      isDragging: false,
      isZooming: false,
      lastActivityTime: Date.now(),
      activityThreshold: 2000 // 2秒无活动后降低更新频率
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
    
    // 标记点管理
    this.markers = []; // 存储标记点数据
    this.markerGraphics = new PIXI.Graphics(); // 标记点绘制对象
    this.markerLines = new Map(); // 存储每个标记点对应的竖线对象
    this.markerLinesContainer = new PIXI.Container(); // 标记点竖线容器
    
    // 随机标记点管理
    this.randomMarkerTimer = null;
    this.randomMarkerCounter = 0;
    
    // 历史数据加载管理
    this.historyLoadThreshold = 200; // 向左拖动超过200像素时加载历史数据
    this.isLoadingHistory = false; // 是否正在加载历史数据
    this.lastHistoryLoadTime = 0; // 上次加载历史数据的时间
    this.historyLoadCooldown = 2000; // 历史数据加载冷却时间（2秒）
    
    this.init();
  }
  
  init() {
    // console.log('Initializing PixiChart with dimensions:', this.options.width, 'x', this.options.height);
    
    // 创建PIXI应用
    this.app = new PIXI.Application({
      width: this.options.width,
      height: this.options.height,
      backgroundColor: this.options.backgroundColor,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    });
    
    // console.log('PIXI Application created');
    
    // 使用canvas而不是view (Pixi.js 7.x兼容性)
    const canvas = this.app.canvas || this.app.view;
    this.container.appendChild(canvas);
    
    // console.log('Canvas added to container');
    
    // 创建容器
    this.gridContainer = new PIXI.Container();
    this.chartContainer = new PIXI.Container();
    this.latestPriceLineContainer = new PIXI.Container(); // 最新价格线容器
    this.textContainer = new PIXI.Container();
    this.pulseContainer = new PIXI.Container();
    this.priceLabelsContainer = new PIXI.Container();
    this.markersContainer = new PIXI.Container(); // 标记点容器
    this.markerTextContainer = new PIXI.Container(); // 标记点文本标签容器
    
    // 添加到stage，顺序很重要
    this.app.stage.addChild(this.gridContainer);
    this.app.stage.addChild(this.chartContainer);
    this.app.stage.addChild(this.latestPriceLineContainer); // 最新价格线在图表之上
    this.app.stage.addChild(this.markersContainer); // 标记点在图表之上
    this.app.stage.addChild(this.markerLinesContainer); // 标记点竖线容器
    this.app.stage.addChild(this.pulseContainer);
    this.app.stage.addChild(this.textContainer);
    this.app.stage.addChild(this.priceLabelsContainer);
    
    // 创建图形对象 - 简化为单一线段对象
    this.gridGraphics = new PIXI.Graphics();
    this.lineGraphics = new PIXI.Graphics(); // 统一的线段绘制对象
    this.latestPriceLineGraphics = new PIXI.Graphics(); // 最新价格线绘制对象
    this.pulseGraphics = new PIXI.Graphics();
    this.futureTimeLineGraphics = new PIXI.Graphics();

    this.gridContainer.addChild(this.gridGraphics);
    this.chartContainer.addChild(this.lineGraphics);
    this.latestPriceLineContainer.addChild(this.latestPriceLineGraphics);
    this.markersContainer.addChild(this.markerGraphics); // 添加标记点绘制对象
    this.markersContainer.addChild(this.markerTextContainer); // 添加文本标签容器到标记点容器中
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
    
    // console.log('PixiChart initialization complete');
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
      
      // 缩放结束后重置状态
      setTimeout(() => {
        this.updateStrategy.isZooming = false;
      }, 200);
    });
    
    // 鼠标点击事件 - 处理标记点点击
    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      console.log('点击事件触发:', { x, y });
      
      // 检查是否点击了标记点
      const clickedMarker = this.getMarkerAt(x, y, 15); // 增加容错范围到15像素
      
      console.log('查找到的标记点:', clickedMarker);
      
      if (clickedMarker) {
        console.log('标记点详情:', {
          id: clickedMarker.id,
          isExpandable: clickedMarker.isExpandable,
          isExpanded: clickedMarker.isExpanded,
          name: clickedMarker.name,
          isRandom: clickedMarker.isRandom
        });
        
        if (clickedMarker.isExpandable) {
          // 切换展开状态
          clickedMarker.isExpanded = !clickedMarker.isExpanded;
          
          console.log(`标记点 ${clickedMarker.id} 展开状态切换为: ${clickedMarker.isExpanded ? '展开' : '收起'}`);
          
          // 重新绘制标记点以显示变化
          this.drawMarkers();
          
          // 阻止事件冒泡，避免触发拖拽
          e.stopPropagation();
          return;
        } else {
          console.log('标记点不可展开');
        }
      } else {
        console.log('没有找到标记点');
      }
    });
    
    // 鼠标拖拽
    canvas.addEventListener('mousedown', (e) => {
      // 检查是否点击了标记点，如果是则不启动拖拽
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const clickedMarker = this.getMarkerAt(x, y, 15);
      
      if (clickedMarker && clickedMarker.isExpandable) {
        // 点击了可展开的标记点，不启动拖拽
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
        // this.viewState.offsetY += deltaY; // 注释掉y轴拖拽
        
        // 累计拖动距离
        this.viewState.dragDistance += Math.abs(deltaX);
        
        // 检查用户是否向左拖动（查看历史数据）
        if (deltaX > 0) {
          this.viewState.hasUserDraggedLeft = true;
          this.viewState.isAtLatestPosition = false;
          
          // 检查是否需要加载更多历史数据
          this.checkAndLoadMoreHistory();
        } else if (deltaX < 0) {
          // 向右拖动，检查是否接近最新位置
          this.checkIfNearLatestPosition();
        }
        
        this.viewState.lastMouseX = e.offsetX;
        this.viewState.lastMouseY = e.offsetY;
        
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
    
    // 最新时间在四分之三处
    const latestTimeX = width * 0.75;
    
    // 设置网格样式
    this.gridGraphics.lineStyle(1, this.options.gridColor, 0.3);
    
    // 根据缩放级别调整网格密度 - 确保与折线图使用相同的缩放参数
    const baseGridSpacing = 100; // 基础网格间距
    const timeGridSpacing = Math.max(20, baseGridSpacing / this.viewState.scaleX); // 时间轴网格间距
    
    // 计算时间间隔（根据缩放调整）- 与折线图数据使用相同的时间范围
    const baseTimeInterval = 2500; // 基础时间间隔2.5秒
    const timeInterval = Math.max(500, baseTimeInterval / this.viewState.scaleX); // 动态时间间隔，最小500ms
    
    // 绘制垂直网格线（时间轴）- 使用与折线图数据完全相同的坐标转换逻辑
    const numTimeLines = Math.ceil(width / timeGridSpacing) + 4; // 增加网格线数量确保覆盖
    
    // 计算当前可见的时间范围，以覆盖整个图表宽度 - 与折线图使用相同的时间范围计算
    const visibleTimeRange = this.timeRange / this.viewState.scaleX;
    const visibleTimeStart = currentTime - visibleTimeRange * 0.75; // 75% of time is in the past
    const visibleTimeEnd = currentTime + visibleTimeRange * 0.25;   // 25% of time is in the future
    
    // 根据时间间隔生成网格线
    const startGridTime = Math.floor(visibleTimeStart / timeInterval) * timeInterval;
    const endGridTime = Math.ceil(visibleTimeEnd / timeInterval) * timeInterval;
    
    for (let timestamp = startGridTime; timestamp <= endGridTime + timeInterval; timestamp += timeInterval) {
      // 使用与折线数据完全相同的坐标转换方法
      const x = this.timeToX(timestamp, currentTime, width);
      
      if (x >= -timeGridSpacing && x <= width + timeGridSpacing) {
        // 绘制垂直线
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
    
    const currentTime = Date.now();
    const chartWidth = this.options.width;
    
    // 根据缩放级别调整可见时间范围 - 与网格使用完全相同的计算逻辑
    const adjustedTimeRange = this.timeRange / this.viewState.scaleX;
    
    // 获取可见数据，考虑缩放和偏移 - 与网格使用相同的视图状态
    let visibleData = this.data.filter(point => {
      const timeDiff = currentTime - point.timestamp;
      const timeOffset = -this.viewState.offsetX / this.viewState.scaleX / chartWidth * this.timeRange;
      return timeDiff >= timeOffset && timeDiff <= adjustedTimeRange + timeOffset;
    });
    
    // 如果用户还没有向左拖动，过滤掉历史数据
    if (!this.viewState.hasUserDraggedLeft) {
      const historicalThreshold = this.options.historicalDataThreshold;
      visibleData = visibleData.filter(point => {
        const timeDiff = currentTime - point.timestamp;
        return timeDiff <= historicalThreshold;
      });
      
      // console.log(`历史数据过滤: 总数据点=${this.data.length}, 可见数据点=${visibleData.length}, 阈值=${historicalThreshold}ms`);
    }
    
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
    
    // 绘制静态线段 - 使用与网格完全相同的坐标转换
    for (let i = 0; i <= drawToIndex; i++) {
      const point = visibleData[i];
      // 确保使用与网格相同的坐标转换方法
      const x = this.timeToX(point.timestamp, currentTime, chartWidth);
      const y = this.priceToY(point.price);
      
      // 优化可见性检查
      if (this.isPointVisible(x, y)) {
        if (isFirstPoint) {
          this.lineGraphics.moveTo(x, y);
          isFirstPoint = false;
        } else {
          this.lineGraphics.lineTo(x, y);
        }
        lastDrawnPoint = { x, y };
      }
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
    const chartHeight = this.options.height * 0.7; // 留出底部空间给时间标签
    const baseY = chartTop + chartHeight - (normalizedPrice * chartHeight);
    
    // 不应用视图变换，只返回基础Y坐标（y轴不受缩放影响）
    return baseY;
    // return baseY * this.viewState.scaleY + this.viewState.offsetY; // 注释掉y轴变换
  }
  
  updatePriceRange() {
    if (this.data.length === 0) return;
    
    const currentTime = Date.now();
    const recentData = this.data.filter(d => (currentTime - d.timestamp) <= this.timeRange);
    
    if (recentData.length === 0) return;
    
    const prices = recentData.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.3 || 2; // 增大padding到30%，至少2的padding
    
    this.priceRange.min = min - padding;
    this.priceRange.max = max + padding;
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
          // console.log(`调整标记点位置: ID=${marker.id}, 从 ${new Date(marker.timestamp).toLocaleTimeString()} 调整到 ${new Date(bestDataPoint.timestamp).toLocaleTimeString()}`);
          
          marker.timestamp = bestDataPoint.timestamp;
          marker.price = bestDataPoint.price;
          adjustedCount++;
        }
      }
    });
    
    if (adjustedCount > 0) {
      // console.log(`调整了 ${adjustedCount} 个标记点的位置`);
      this.drawMarkers(); // 重新绘制标记点
    }
  }

  // 重写addData方法，在添加数据后验证标记点
  addData(newData) {
    const previousDataLength = this.data.length;
    this.data.push(newData);
    
    // 先更新价格范围，确保后续的坐标计算正确
    this.updatePriceRange();
    
    // 验证并调整标记点位置
    this.validateAndAdjustMarkers();
    
    // 如果这不是第一个数据点且动画开启，启动绘制动画
    if (previousDataLength > 0 && this.options.animationEnabled) {
      const currentTime = Date.now();
      const chartWidth = this.options.width;
      
      // 计算前一个点和新点的屏幕坐标
      const prevData = this.data[previousDataLength - 1];
      const prevX = this.timeToX(prevData.timestamp, currentTime, chartWidth);
      const prevY = this.priceToY(prevData.price);
      
      const newX = this.timeToX(newData.timestamp, currentTime, chartWidth);
      const newY = this.priceToY(newData.price);
      
      // 检查坐标是否有效
      if (!isNaN(prevX) && !isNaN(prevY) && !isNaN(newX) && !isNaN(newY)) {
        // 只有当两个点都在合理范围内时才启动动画
        if (this.isPointVisible(prevX, prevY) || this.isPointVisible(newX, newY)) {
          this.startLineAnimation(
            { x: prevX, y: prevY },
            { x: newX, y: newY }
          );
        } else {
          // 点不在可见范围内，直接重绘
          this.drawChart();
        }
      }
    } else {
      // 没有动画或第一个数据点，立即重绘
      this.drawChart();
    }
    
    // 保持数据在合理范围内
    const cutoffTime = Date.now() - this.timeRange * 2;
    this.data = this.data.filter(d => d.timestamp > cutoffTime);
    
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
      console.log(`清理了 ${originalCount - this.markers.length} 个过期的下单标记点和对应竖线，保留了所有随机标记点`);
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
    
    // 智能网格更新控制 - 根据活动状态调整更新频率
    const gridUpdateInterval = this.getOptimalGridUpdateInterval();
    
    if (currentTime - this.lastGridUpdate > gridUpdateInterval) {
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
    
    console.log('📊 PixiChart性能统计:', stats);
    
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
      return 100; // 100ms高频更新
    }
    
    // 如果有动画正在进行，使用中频更新
    if (this.animationState.isAnimating) {
      return 250; // 250ms中频更新
    }
    
    // 如果最近有活动，使用标准频率
    if (timeSinceLastActivity < this.updateStrategy.activityThreshold) {
      return 500; // 500ms标准频率
    }
    
    // 静态状态，使用低频更新
    return 1000; // 1000ms低频更新
  }
  
  // 记录用户活动
  recordActivity() {
    this.updateStrategy.lastActivityTime = Date.now();
  }
  
  // 重置视图状态
  resetView() {
    this.viewState.offsetX = 0;
    // this.viewState.offsetY = 0; // 不重置y轴偏移
    this.viewState.scaleX = 1;
    // this.viewState.scaleY = 1; // 不重置y轴缩放
    this.viewState.hasUserDraggedLeft = false; // 重置拖动状态
    
    // 重置动画状态
    this.animationState.isAnimating = false;
    this.animationState.pendingAnimations = [];
    
    this.updateView();
    console.log('视图已重置，历史数据将重新隐藏');
  }
  
  // 清空所有数据和视觉元素
  clearData() {
    console.log('PixiChart: 清空数据和视觉元素');
    
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
    
    console.log('PixiChart: 数据清空完成，历史数据显示状态已重置，随机标记点已保留');
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
    
    // 创建渐变效果区域
    const gradientHeight = 50; // 渐变区域高度
    
    // 绘制上方绿色渐变（从上往下，从透明到绿色）
    const topGradientY = Math.max(0, animatedY - gradientHeight);
    const topGradientHeight = animatedY - topGradientY;
    
    if (topGradientHeight > 0) {
      // 使用多条半透明线条模拟渐变效果 - 从上往下，透明度递增
      for (let i = 0; i < topGradientHeight; i += 0.5) {
        const alpha = ((topGradientHeight - i) / topGradientHeight) * 0.15; // 从0.15到0的渐变（从上往下透明度递减，即从上往下从透明到绿色）
        this.latestPriceLineGraphics.lineStyle(1, 0x00ff00, alpha);
        this.latestPriceLineGraphics.moveTo(0, animatedY - i);
        this.latestPriceLineGraphics.lineTo(width, animatedY - i);
      }
    }
    
    // 绘制下方红色渐变（从下往上，从透明到红色）
    const bottomGradientHeight = Math.min(gradientHeight, height - animatedY);
    
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
    // 最新时间在四分之三处
    const latestX = chartWidth * 0.75;
    const timeDiff = currentTime - timestamp;
    const baseX = latestX - (timeDiff / this.timeRange) * chartWidth;
    
    // 应用视图变换：先缩放再偏移
    const transformedX = baseX * this.viewState.scaleX + this.viewState.offsetX;
    
    // 调试信息（可选）
    // console.log(`timeToX: timestamp=${timestamp}, baseX=${baseX.toFixed(2)}, transformedX=${transformedX.toFixed(2)}, scaleX=${this.viewState.scaleX.toFixed(2)}`);
    
    return transformedX;
  }

  // 验证网格和折线图同步性的调试方法
  validateGridChartSync() {
    if (this.data.length === 0) return;
    
    const currentTime = Date.now();
    const chartWidth = this.options.width;
    
    // 获取最新的数据点
    const latestDataPoint = this.data[this.data.length - 1];
    
    // 计算折线图中该点的坐标
    const chartX = this.timeToX(latestDataPoint.timestamp, currentTime, chartWidth);
    const chartY = this.priceToY(latestDataPoint.price);
    
    // 计算网格中相应时间和价格线的坐标
    const gridTimeX = this.timeToX(latestDataPoint.timestamp, currentTime, chartWidth);
    const gridPriceY = this.priceToY(latestDataPoint.price);
    
    // 检查同步性
    const timeSyncError = Math.abs(chartX - gridTimeX);
    const priceSyncError = Math.abs(chartY - gridPriceY);
    
    console.log('🔍 网格与折线图同步检查:', {
      数据点时间: new Date(latestDataPoint.timestamp).toLocaleTimeString(),
      数据点价格: latestDataPoint.price.toFixed(2),
      折线图X坐标: chartX.toFixed(2),
      网格时间X坐标: gridTimeX.toFixed(2),
      时间同步误差: timeSyncError.toFixed(4),
      折线图Y坐标: chartY.toFixed(2),
      网格价格Y坐标: gridPriceY.toFixed(2),
      价格同步误差: priceSyncError.toFixed(4),
      缩放级别: this.viewState.scaleX.toFixed(2),
      偏移量: this.viewState.offsetX.toFixed(2),
      同步状态: (timeSyncError < 0.1 && priceSyncError < 0.1) ? '✅ 完美同步' : '⚠️ 存在偏差'
    });
    
    return {
      timeSyncError,
      priceSyncError,
      isInSync: timeSyncError < 0.1 && priceSyncError < 0.1
    };
  }

  // 重写zoom方法，添加同步验证
  zoom(factor, centerX, centerY) {
    const oldScaleX = this.viewState.scaleX;
    const oldScaleY = this.viewState.scaleY;
    
    // 只对x轴进行缩放，y轴保持不变
    this.viewState.scaleX = Math.max(0.1, Math.min(10, this.viewState.scaleX * factor));
    // this.viewState.scaleY = Math.max(0.1, Math.min(10, this.viewState.scaleY * factor)); // 注释掉y轴缩放
    
    // 调整偏移以保持缩放中心
    const scaleFactorX = this.viewState.scaleX / oldScaleX;
    // const scaleFactorY = this.viewState.scaleY / oldScaleY; // 注释掉y轴缩放因子
    
    this.viewState.offsetX = centerX - (centerX - this.viewState.offsetX) * scaleFactorX;
    // this.viewState.offsetY = centerY - (centerY - this.viewState.offsetY) * scaleFactorY; // 注释掉y轴偏移调整
    
    // 立即更新视图以确保同步
    this.updateView();
    
    // 验证同步性（在开发环境中启用）
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        this.validateGridChartSync();
      }, 100); // 延迟100ms确保渲染完成
    }
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
    // 查找最接近指定时间戳的实际数据点
    const targetTimestamp = markerData.timestamp || Date.now();
    const targetPrice = markerData.price || 0;
    
    // 如果没有数据，直接返回
    if (this.data.length === 0) {
      console.warn('没有折线图数据，无法添加标记点');
      return null;
    }
    
    // 使用智能查找方法找到最佳位置
    const bestDataPoint = this.findBestMarkerPosition(targetTimestamp, targetPrice);
    
    if (!bestDataPoint) {
      console.warn('无法找到合适的数据点位置');
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
      originalTimestamp: targetTimestamp, // 保存原始时间戳用于调试
      originalPrice: targetPrice, // 保存原始价格用于调试
      timeDiff: Math.abs(bestDataPoint.timestamp - targetTimestamp) // 保存时间差用于调试
    };
    
    this.markers.push(marker);
    this.drawMarkers();
    
    console.log('添加标记点到折线图:', {
      原始时间: new Date(targetTimestamp).toLocaleTimeString(),
      实际时间: new Date(bestDataPoint.timestamp).toLocaleTimeString(),
      时间差: marker.timeDiff + 'ms',
      原始价格: targetPrice.toFixed(2),
      实际价格: bestDataPoint.price.toFixed(2),
      标记点类型: marker.type,
      标记点ID: marker.id,
      是否可展开: marker.isExpandable,
      用户名: marker.name
    });
    
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
    
    console.log(`更新标记点: 保留了 ${existingRandomMarkers.length} 个随机标记点，添加了 ${newOrderMarkers.length} 个下单标记点`);
    
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
          console.log(`下单标记点 ${marker.id} 的竖线与折线端点相遇，标记为移除`);
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
      
      console.log(`移除了 ${markersToRemove.length} 个与折线端点相遇的下单标记点，剩余 ${this.markers.length} 个标记点`);
      
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
            this.markerGraphics.lineStyle(1, marker.color, 0.6); // 使用标记点相同的颜色，透明度0.6
            
            // 检查竖线是否在可视范围内
            if (markerFutureX >= -50 && markerFutureX <= chartWidth + 50) {
              // 从标记点开始绘制横线到竖线位置
              this.markerGraphics.moveTo(x, y);
              this.markerGraphics.lineTo(markerFutureX, y); // 水平线到竖线位置
              
              // console.log(`绘制下单标记点 ${marker.id} 的连接线: 从标记点(${x.toFixed(2)}, ${y.toFixed(2)}) 到竖线位置(${markerFutureX.toFixed(2)}, ${y.toFixed(2)})`);
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
          const labelOffsetY = (marker.isRandom ? 15 : 10) + 15; // 头像需要更大的偏移，从20减小到15
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
            nameLabel.y = y - labelOffsetY - 20; // 在金额标签上方
            
            // 确保name标签在可视范围内
            if (nameLabel.x < 0) {
              nameLabel.x = 5;
            } else if (nameLabel.x + nameLabel.width > chartWidth) {
              nameLabel.x = chartWidth - nameLabel.width - 5;
            }
            
            if (nameLabel.y < 0) {
              nameLabel.y = y + (marker.isRandom ? 15 : 10) + 25; // 如果上方超出，则显示在下方，从20减小到15
            }
            
            this.markerTextContainer.addChild(nameLabel);
            
            // 创建展开状态的背景框
            const padding = 4;
            const bgWidth = Math.max(amountLabel.width, nameLabel.width) + padding * 2;
            const bgHeight = 40; // 包含两行文本的高度
            
            const bgGraphics = new PIXI.Graphics();
            bgGraphics.beginFill(0x000000, 0.7); // 半透明黑色背景
            bgGraphics.lineStyle(1, marker.color, 0.8); // 使用标记点颜色作为边框
            bgGraphics.drawRoundedRect(
              x - bgWidth / 2, 
              y - labelOffsetY - 25, 
              bgWidth, 
              bgHeight, 
              5
            );
            bgGraphics.endFill();
            
            this.markerTextContainer.addChild(bgGraphics);
            
            // 重新添加文本标签，确保它们在背景之上
            this.markerTextContainer.addChild(nameLabel);
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
              amountLabel.y = y + (marker.isRandom ? 15 : 10) + 5; // 如果上方超出，则显示在下方，从20减小到15
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
    // 根据缩放级别调整头像大小 - 减小基础大小
    const scaleFactor = Math.max(0.5, Math.min(2, 1 / this.viewState.scaleX));
    const avatarSize = 12 * scaleFactor; // 从16减小到12，头像更小
    
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
    
    console.log('getMarkerAt调用:', { x, y, tolerance, markersCount: this.markers.length });
    
    const foundMarker = this.markers.find(marker => {
      // 使用与绘制标记点相同的坐标转换方法
      const markerX = this.timeToX(marker.timestamp, currentTime, chartWidth);
      const markerY = this.priceToY(marker.price);
      
      // 根据标记点类型调整检测范围
      let detectionRadius = tolerance;
      if (marker.isRandom && marker.isExpandable) {
        // 头像标记点需要更大的检测范围 - 调整为更小的头像大小
        const scaleFactor = Math.max(0.5, Math.min(2, 1 / this.viewState.scaleX));
        const avatarSize = 12 * scaleFactor; // 从16减小到12，与头像大小保持一致
        detectionRadius = Math.max(tolerance, avatarSize + 3); // 头像大小 + 3像素缓冲
      }
      
      const distance = Math.sqrt(Math.pow(x - markerX, 2) + Math.pow(y - markerY, 2));
      
      console.log('检查标记点:', {
        id: marker.id,
        markerX: markerX.toFixed(2),
        markerY: markerY.toFixed(2),
        distance: distance.toFixed(2),
        detectionRadius: detectionRadius.toFixed(2),
        isWithinTolerance: distance <= detectionRadius,
        isExpandable: marker.isExpandable,
        isRandom: marker.isRandom,
        markerType: marker.isRandom ? '头像' : '圆点'
      });
      
      return distance <= detectionRadius;
    });
    
    console.log('找到的标记点:', foundMarker);
    return foundMarker;
  }

  // 手动启用历史数据显示
  enableHistoricalData() {
    if (!this.viewState.hasUserDraggedLeft) {
      this.viewState.hasUserDraggedLeft = true;
      console.log('手动启用历史数据显示');
      this.drawChart();
    }
  }
  
  // 手动禁用历史数据显示
  disableHistoricalData() {
    if (this.viewState.hasUserDraggedLeft) {
      this.viewState.hasUserDraggedLeft = false;
      console.log('手动禁用历史数据显示');
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
    console.log(`历史数据阈值设置为: ${threshold}ms`);
    
    // 如果历史数据未启用，重新绘制图表
    if (!this.viewState.hasUserDraggedLeft) {
      this.drawChart();
    }
  }

  // 启动随机标记点定时器
  startRandomMarkerTimer() {
    if (!this.options.enableRandomMarkers) {
      console.log('随机标记点功能已禁用');
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
      console.log('随机标记点定时器已停止');
    }
  }

  // 生成随机标记点
  generateRandomMarker() {
    // 检查是否有足够的数据点来生成标记点
    if (this.data.length === 0) {
      console.log('没有折线图数据，跳过随机标记点生成');
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
      console.log('随机标记点生成成功:', {
        ID: markerId,
        类型: markerType,
        方向: isBuyUp ? '买涨' : '买跌',
        金额: `$${randomAmount}`,
        用户名: randomName,
        时间: new Date(latestDataPoint.timestamp).toLocaleTimeString(),
        价格: latestDataPoint.price.toFixed(2)
      });

      // 通知父组件有新的随机标记点生成
      if (this.options.onRandomMarkerGenerated && typeof this.options.onRandomMarkerGenerated === 'function') {
        this.options.onRandomMarkerGenerated(randomMarkerData);
      }
    } else {
      console.warn('随机标记点生成失败');
    }
    
    // 重新启动定时器，设置下一次随机间隔
    this.startRandomMarkerTimer();
  }

  // 启用/禁用随机标记点
  setRandomMarkersEnabled(enabled) {
    this.options.enableRandomMarkers = enabled;
    
    if (enabled) {
      this.startRandomMarkerTimer();
      console.log('随机标记点功能已启用');
    } else {
      this.stopRandomMarkerTimer();
      console.log('随机标记点功能已禁用');
    }
  }

  // 设置随机标记点间隔
  setRandomMarkerInterval(interval) {
    this.options.randomMarkerInterval = interval;
    console.log(`随机标记点间隔设置为: ${interval}ms`);
    
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
    
    console.log('触发加载更多历史数据');
    
    // 调用外部提供的历史数据加载回调
    if (typeof this.options.onLoadMoreHistory === 'function') {
      const earliestTime = this.data.length > 0 ? Math.min(...this.data.map(d => d.timestamp)) : Date.now();
      this.options.onLoadMoreHistory(earliestTime, () => {
        // 加载完成后的回调
        this.isLoadingHistory = false;
        console.log('历史数据加载完成');
      });
    }
  }
  
  // 检查是否接近最新位置
  checkIfNearLatestPosition() {
    const threshold = 50; // 像素阈值
    
    // 如果偏移量接近0，认为接近最新位置
    if (Math.abs(this.viewState.offsetX) < threshold) {
      if (!this.viewState.isAtLatestPosition) {
        this.viewState.isAtLatestPosition = true;
        console.log('用户回到最新位置');
        
        // 通知外部组件用户已回到最新位置
        if (typeof this.options.onReturnToLatest === 'function') {
          this.options.onReturnToLatest();
        }
      }
    }
  }
  
  // 回到最新位置
  returnToLatest() {
    console.log('执行回到最新位置');
    
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
    
    // 更新视图
    this.updateView();
    
    // 通知外部组件
    if (typeof this.options.onReturnToLatest === 'function') {
      this.options.onReturnToLatest();
    }
    
    console.log('已回到最新位置');
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
    console.log(`历史数据加载阈值设置为: ${threshold}px`);
  }

  // 添加历史数据的专用方法
  addHistoricalData(historicalDataArray) {
    if (!Array.isArray(historicalDataArray) || historicalDataArray.length === 0) {
      console.warn('历史数据为空或格式不正确');
      return;
    }
    
    console.log(`开始添加 ${historicalDataArray.length} 条历史数据`);
    
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
    
    console.log(`有效历史数据: ${validHistoricalData.length} 条，重复数据: ${futureData.length} 条`);
    
    if (validHistoricalData.length === 0) {
      console.log('没有新的历史数据需要添加');
      return;
    }
    
    // 将有效的历史数据添加到数据数组的开头
    this.data = [...validHistoricalData, ...this.data];
    
    // 确保整个数据数组按时间排序
    this.data.sort((a, b) => a.timestamp - b.timestamp);
    
    // 限制数据数组的大小，防止内存溢出
    const maxDataPoints = this.timeRange * 4 / 500; // 假设每500ms一个数据点，保留4倍时间范围的数据
    if (this.data.length > maxDataPoints) {
      this.data = this.data.slice(-maxDataPoints);
    }
    
    // 更新价格范围
    this.updatePriceRange();
    
    // 重新绘制图表和网格
    this.drawChart();
    this.drawGrid();
    
    console.log(`历史数据添加完成，当前总数据点: ${this.data.length}`);
    console.log(`数据时间范围: ${new Date(this.data[0].timestamp).toLocaleTimeString()} - ${new Date(this.data[this.data.length - 1].timestamp).toLocaleTimeString()}`);
  }
  
  // 检查数据完整性的方法
  validateDataIntegrity() {
    if (this.data.length === 0) {
      console.log('数据为空');
      return true;
    }
    
    // 检查时间顺序是否正确
    let isTimeOrderCorrect = true;
    for (let i = 1; i < this.data.length; i++) {
      if (this.data[i].timestamp < this.data[i - 1].timestamp) {
        console.error(`数据时间顺序错误: 索引 ${i - 1} (${new Date(this.data[i - 1].timestamp).toLocaleTimeString()}) > 索引 ${i} (${new Date(this.data[i].timestamp).toLocaleTimeString()})`);
        isTimeOrderCorrect = false;
      }
    }
    
    if (isTimeOrderCorrect) {
      console.log('✅ 数据时间顺序正确');
    } else {
      console.error('❌ 数据时间顺序存在问题');
      // 自动修复时间顺序
      this.data.sort((a, b) => a.timestamp - b.timestamp);
      console.log('🔧 已自动修复数据时间顺序');
    }
    
    // 检查是否有重复的时间戳
    const timestamps = this.data.map(d => d.timestamp);
    const uniqueTimestamps = new Set(timestamps);
    if (timestamps.length !== uniqueTimestamps.size) {
      console.warn(`⚠️ 发现重复时间戳: 总数据点 ${timestamps.length}, 唯一时间戳 ${uniqueTimestamps.size}`);
    } else {
      console.log('✅ 无重复时间戳');
    }
    
    return isTimeOrderCorrect && timestamps.length === uniqueTimestamps.size;
  }
} 
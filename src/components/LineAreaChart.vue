<template>
	<div ref="chartContainer" class="chart-container"></div>
	<view class="reset-button" @click="resetChart" v-if="showRestset">
		<van-icon name="arrow" color="#bdf95b" size="14" />
	</view>
</template>
<script setup>
import {
	randomNumberWithBias,
} from '@/utils/fun'
import { faker } from "@faker-js/faker"
import { onMounted, onUnmounted, ref } from 'vue';
import * as d3 from 'd3';
import { nextTick } from 'process';
const getbaseURL = () => {
	const domain = window.location.origin;
	return domain
}
// 低版本浏览器兼容findLast
if (!Array.prototype.findLast) {
	Array.prototype.findLast = function (predicate) {
		if (typeof predicate !== 'function') {
			throw new TypeError('predicate must be a function');
		}
		for (let i = this.length - 1; i >= 0; i--) {
			if (i in this && predicate(this[i], i, this)) {
				return this[i];
			}
		}
		return undefined; // 如果没有找到满足条件的元素
	};
}

// 定义组件的属性
const props = defineProps({
	// 图表宽度，默认为窗口宽度
	wh: {
		type: Number,
		default: () => window.innerWidth
	},
	// 图表高度，默认为窗口高度
	ht: {
		type: Number,
		default: () => window.innerHeight
	},
	// 图表边距
	margin: {
		type: Object,
		default: () => ({ top: 0, right: 20, bottom: 20, left: 0 })
	},
	// X轴刻度数量
	xScale: {
		type: Number,
		default: 100
	},
	// 最后的空白间隔
	lastGap: {
		type: Number,
		default: 10
	},
	// 最小缩放比例
	minZoomScale: {
		type: Number,
		default: 0.1
	},
	// 最大缩放比例
	maxZoomScale: {
		type: Number,
		default: 1.5
	},
	// 添加标记的概率
	markerProbability: {
		type: Number,
		default: 0.04
	},
	// 最大数据点数量
	maxDataPoints: {
		type: Number,
		default: 1000
	},
	// 最小 X 值
	minX: {
		type: Number,
		default: -1000
	},
	// 初始化数据的函数
	initData: {
		type: Function,
		default: (xScale, lastGap) => {
			// 初始化数据
			return Array.from({ length: xScale }, (_, i) => ({
				x: i,
				y: i < xScale - lastGap ? 100 * Math.random() + 2 : null,
				hasMarker: false,
				label: i
			}))
		}
	},
	// 向左插入数据的函数
	insertDataToLeft: {
		type: Function,
		default: (xScale, lastGap) => {
			// 返回一个函数，该函数接收当前最小的 x 值作为参数
			return (currentMinX) => ({
				x: currentMinX - 1,
				y: Math.random() * 100 + 50,
				hasMarker: false,
				label: new Date(Date.now() + (currentMinX - 1) * 60000).toISOString()
			});
		}
	},
	// 生成新数据点的函数
	generateNewDataPoint: {
		type: Function,
		default: (currentX, xItem) => {
			// 返回一个函数，该函数生成新的 Y 值
			return () => Math.random() * 100 + 5 + currentX;
		}
	},
	// 生成新的空 X 标签的函数
	generateNewNullXLabel: {
		type: Function,
		default: (currentX) => {
			// 返回一个函数，该函数生成新的标签（这里使用当前时间）
			return () => new Date(Date.now()).toISOString();
		}
	},
	// 更新间隔（毫秒）
	interval: {
		type: Number,
		default: 800
	},
	markLabelNumGap: {
		type: Number,
		default: 0.015
	}
});

// 图表容器的引用
const chartContainer = ref(null);
let intervalId;
const resetChart = ref();
const addElementHandler = ref();
const destroyElementHandler = ref();
const changeLastGap = ref()
const resumeElements = ref()
const toggleArea = ref()
const showArea = ref(true)
const catchUp = ref(true)
const showRestset = ref(false);
onMounted(() => {
	// 设置图表尺寸
	const width = props.wh - props.margin.left - props.margin.right;
	const height = props.ht - props.margin.top - props.margin.bottom;

	let xData = props.xScale;
	let xLastIndex = xData - props.lastGap - 1;
	let zoomScale = 1;
	let gapScale = props.xScale;
	let xFirstIndex = 0;
	let currentGap = props.lastGap
	let isCatchingUp = false;
	// 设置比例尺
	const x = d3.scaleLinear().range([0, width]);
	const y = d3.scaleLinear().range([height, 0]);

	// 创建SVG
	const svg = d3.select(chartContainer.value)
		.append('svg')
		.attr('width', width + props.margin.left + props.margin.right)
		.attr('height', height + props.margin.top + props.margin.bottom)
		.append('g')
		.attr('transform', `translate(${props.margin.left},${props.margin.top})`);

	// 定义渐变
	const gradient = svg.append("defs")
		.append("linearGradient")
		.attr("id", "area-gradient")
		.attr("x1", "0%").attr("y1", "0%")
		.attr("x2", "0%").attr("y2", "100%");

	gradient.append("stop")
		.attr("offset", "0%")
		.attr("stop-color", "#2f96f0")
		.attr("stop-opacity", 0.6);

	gradient.append("stop")
		.attr("offset", "100%")
		.attr("stop-color", "#2f96f0")
		.attr("stop-opacity", 0.05);

	// 定义渐变
	const gradient2 = svg.append("defs")
		.append("linearGradient")
		.attr("id", "red-gradient")
		.attr("x1", "0%").attr("y1", "0%")
		.attr("x2", "0%").attr("y2", "100%");

	gradient2.append("stop")
		.attr("offset", "0%")
		.attr("stop-color", "rgba(94,0,0,0.5)");
	// .attr("stop-opacity", 0.3);

	gradient2.append("stop")
		.attr("offset", "100%")
		.attr("stop-color", "#081228");
	// .attr("stop-opacity", 0.05);

	const gradient3 = svg.append("defs")
		.append("linearGradient")
		.attr("id", "green-gradient")
		.attr("x1", "0%").attr("y1", "0%")
		.attr("x2", "0%").attr("y2", "100%");
	gradient3.append("stop")
		.attr("offset", "0%")
		.attr("stop-color", "#081228")
	// .attr("stop-opacity", 0.05);

	gradient3.append("stop")
		.attr("offset", "100%")
		.attr("stop-color", "rgba(0,69,19,0.5)");
	// .attr("stop-opacity", 0.3);

	const movingBg1 = svg.append("rect")
		.attr("class", "moving-gradient-bg-green")
		.attr('y', 0)
		.attr('fill', 'transparent')
		.attr("width", width + props.margin.right)
		.attr("height", height / 2);
	const movingBg2 = svg.append("rect")
		.attr("class", "moving-gradient-bg-red")
		.attr('y', height / 2)
		.attr('fill', 'transparent')
		.attr("width", width + props.margin.right)
		.attr("height", height / 2);

	// 初始化数据
	let data = props.initData(xData, props.lastGap);
	let dataSave = data.slice();

	// 添加透明的覆盖层以捕获所有事件
	svg.append("rect")
		.attr("class", "overlay")
		.attr('fill', 'transparent')
		.attr("width", width)
		.attr("height", height);
	// 设置线条生成器
	const line = d3.line()
		.x(d => x(d.x))
		.y(d => y(d.y))
		.defined(d => d.y !== null);

	// 设置区域生成器
	const area = d3.area()
		.x(d => x(d.x))
		.y0(height)
		.y1(d => y(d.y))
		.defined(d => d.y !== null);

	// 设置初始域
	x.domain([0, xData - 1]);
	updateYDomain();

	const xLabelFormat = () => {
		const xRange = x.domain();
		// 找到对应于当前 x 范围的数据点
		const minDataPoint = data.find(d => d.x >= xRange[0]) || data[0];
		const maxDataPoint = data.findLast(d => d.x <= xRange[1]) || data[data.length - 1];
		const minDate = new Date(minDataPoint.label);
		const maxDate = new Date(maxDataPoint.label);
		const timeSpan = maxDate - minDate;
		// console.log(data[Math.ceil(xRange[1])]?.label, data[Math.floor(xRange[0])]?.label, 1111);
		let formatDate;
		if (timeSpan < 60 * 1000) { // 小于1分钟
			formatDate = d3.timeFormat("%H:%M:%S");
		} else if (timeSpan < 60 * 60 * 1000) { // 小于1小时
			formatDate = d3.timeFormat("%H:%M:%S");
		} else if (timeSpan < 24 * 60 * 60 * 1000) { // 小于1天
			formatDate = d3.timeFormat("%H:%M");
		} else if (timeSpan < 7 * 24 * 60 * 60 * 1000) { // 小于1周
			formatDate = d3.timeFormat("%m-%d %H:%M");
		} else if (timeSpan < 30 * 24 * 60 * 60 * 1000) { // 小于1月
			formatDate = d3.timeFormat("%m-%d");
		} else if (timeSpan < 365 * 24 * 60 * 60 * 1000) { // 小于1年
			formatDate = d3.timeFormat("%m-%d");
		} else if (timeSpan < 2 * 365 * 24 * 60 * 60 * 1000) { // 小于2年
			formatDate = d3.timeFormat("%Y-%m");
		} else { // 大于2年
			formatDate = d3.timeFormat("%Y");
		}
		return formatDate;
	}
	// 添加X轴
	const xAxis = svg.append("g")
		.attr("transform", `translate(0,${height})`)
		.call(d3.axisBottom(x).ticks(5).tickFormat((d, i) => {
			// 找到最接近当前 x 值的数据点
			const closestDataPoint = data.reduce((prev, curr) =>
				Math.abs(curr.x - d) < Math.abs(prev.x - d) ? curr : prev
			);
			const currentDate = new Date(closestDataPoint.label);
			return xLabelFormat()(currentDate);
		}))
		.call(g => g.select(".domain").remove())
		.call(g => g.selectAll(".tick line").remove())
		.call(g => g.selectAll("text")
			.style("fill", "white")
			.style("font-size", "12px"));
	const yAxis = svg.append("g")
		.attr("class", "y-axis")
		.call(d3.axisLeft(y));
	// 添加剪辑路径
	const clip = svg.append("defs").append("clipPath")
		.attr("id", "clip")
		.append("rect")
		.attr("width", width)
		.attr("height", height);
	// 静态头像点容器
	const markerConter = svg.append("g")

	const chartGroup = svg.append("g")
		.attr("clip-path", "url(#clip)").style('pointer-events', 'none');

	// 添加区域路径
	const areaPath = chartGroup.append("path")
		.data([data])
		.attr("class", "area")
		.attr("d", area);

	// 添加线条路径
	const path = chartGroup.append("path")
		.data([data])
		.attr("class", "line")
		.attr("d", line);

	// 添加标记线
	const markline = chartGroup.append("line")
		.attr("class", "markline")
		.attr("x1", 0)
		.attr("y1", y(data[xLastIndex].y))
		.attr("x2", width)
		.attr("y2", y(data[xLastIndex].y));

	// 添加结束线
	const endLine = chartGroup.append('line')
		.attr("class", "endline")
		.attr("x1", x(data[data.length - 1].x))
		.attr("y1", 0)
		.attr("x2", x(data[data.length - 1].x))
		.attr("y2", height);

	// // 添加用于复杂HTML的foreignObject
	// const fo = chartGroup.append("foreignObject")
	//     .attr("x", 0)
	//     .attr("y", 0)
	//     .attr("width", width)
	//     .attr("height", height);

	// 在foreignObject中添加复杂的HTML结构
	const markLineLabels = createMarkLineLabel()

	function createMarkLineLabel() {
		const group = svg.append("g")
			.attr("transform", `translate(0, ${y(data[xLastIndex].y) - 93})`)
			.style('pointer-events', 'none').style('z-index', 1);

		const texts = [175.248, 175.248, 175.248, 180.000, 175.248, 175.248, 175.248];

		texts.forEach((value, index) => {
			const textY = index * 30; // Adjust y for spacing
			const rectHeight = 20; // Height of the background
			if (index !== 3) {
				// group.append("rect")
				// 	.attr("x", 0)
				// 	.attr("y", textY - 10) // Center the text in the rectangle
				// 	.attr("width", 80) // Adjust width as needed
				// 	.attr("height", rectHeight)
				// 	.attr("rx", 10) // Rounded corners
				// 	.attr("ry", 10)
				// 	.attr("fill", "rgba(0, 15, 52, 0.60)")
				// 	.attr("stroke", "rgba(255, 255, 255, 0.30)") // Border color
				// 	.attr("stroke-width", 1); // Border width
				// // .style('opacity', 0.5); // Background color

				// // Add text
				// group.append("text")
				// 	.attr("x", 10) // Adjust x as needed
				// 	.attr("y", textY + 4)
				// 	.text(value)
				// 	.attr("font-size", "24rpx") // Set font size
				// 	.attr("fill", "#fff")
				// 	.attr("class", "mark-line-text")
				// 	.style('opacity', 0.5);
			} else {
				// Add background rectangle
				group.append("rect")
					.attr("x", 0)
					.attr("y", textY - 10) // Center the text in the rectangle
					.attr("width", 90) // Adjust width as needed
					.attr("height", rectHeight)
					.attr("rx", 10) // Rounded corners
					.attr("ry", 10)
					.attr("stroke", "#fff") // Border color
					.attr("stroke-width", 1) // Border width
					.attr("fill", "#000F34"); // Background color

				// Add text
				group.append("text")
					.attr("x", 10) // Adjust x as needed
					.attr("y", textY + 4)
					.text(value)
					.attr("font-size", "24rpx") // Set font size
					.attr("fill", "#fff")
					.attr("class", "mark-line-text-center");
			}
		});
		return group
	}

	updateMarkLineLabels()

	function updateMarkLineLabels(yTransition) {
		const currentY = data[xLastIndex].y;
		// const gap = props.markLabelNumGap;
		const [ymin, ymax] = y.domain();
		const gapValue = (ymax - ymin) / (height / 8)
		const markLineTexts = [
			currentY + 3 * gapValue,
			currentY + 2 * gapValue,
			currentY + gapValue,
			currentY,
			currentY - gapValue,
			currentY - 2 * gapValue,
			currentY - 3 * gapValue
		];

		markLineLabels.selectAll("text")
			.data(markLineTexts, (d, i) => i)
			.text(d => d.toFixed(3));
		markLineLabels.transition()
			.duration(props.interval)
			.ease(d3.easeLinear)
			.attrTween("transform", function () {
				return function (t) {
					if (yTransition) yTransition(t);
					return `translate(0, ${y(d3.interpolateNumber(data[xLastIndex - 1].y, data[xLastIndex].y)(t)) - 93})`;
				};
			}).on("end", function () {
				// 在过渡结束时，将 markLineLabels 移动到其父元素的最后
				this.parentNode.appendChild(this);
			});
	}


	// 添加端点
	const endpoint = svg.append("circle")
		.attr("class", "endpoint")
		.attr("r", 5)
		.attr("cx", x(xLastIndex))
		.attr("cy", y(data[xLastIndex].y));
	updateYDomain();
	data.forEach((d, index) => {
		if (Math.random() < props.markerProbability && index > 0 && d.y) {
			data[index].hasMarker = true;
			addMarker(data[index], index);
		}
	})
	// 更新Y轴域
	// 更新Y轴域的函数（带有过渡效果）
	function updateYDomain(useAnimate = false) {
		const [xMin, xMax] = x.domain();
		const visibleData = data.filter(d => d.x >= xMin && d.x <= xMax && d.y !== null);

		if (visibleData.length === 0) return; // 如果没有可见的数据点，不更新 Y 轴

		const yMin = d3.min(visibleData, d => d.y);
		const yMax = d3.max(visibleData, d => d.y);
		const yPadding = (yMax - yMin) * 0.1; // 添加 10% 的padding
		const newYDomain = [Math.max(0, yMin - yPadding), yMax + yPadding];

		if (useAnimate) {
			const oldYScale = y.copy();
			const newYScale = y.copy().domain(newYDomain);

			const t = d3.transition()
				.duration(200)
				.ease(d3.easeLinear);

			// 更新区域路径
			areaPath.transition(t)
				.attrTween("d", function () {
					return function (t) {
						y.domain(oldYScale.domain().map(d => d3.interpolate(d, newYScale.domain()[oldYScale.domain().indexOf(d)])(t)));
						return area(data);
					}
				});

			// 更新线条路径
			path.transition(t)
				.attrTween("d", function () {
					return function (t) {
						y.domain(oldYScale.domain().map(d => d3.interpolate(d, newYScale.domain()[oldYScale.domain().indexOf(d)])(t)));
						return line(data);
					}
				});
		} else {
			y.domain(newYDomain);
		}
	}

	function updateYDomainWhenUpdate() {
		const [xMin, xMax] = x.domain();
		const visibleData = data.filter(d => d.x >= xMin && d.x <= xMax && d.y !== null);

		if (visibleData.length === 0) return null; // 如果没有可见的数据点，返回 null

		const yMin = d3.min(visibleData, d => d.y);
		const yMax = d3.max(visibleData, d => d.y);

		const yPadding = (yMax - yMin) * 0.1; // 添加 10% 的padding
		const newYDomain = [Math.max(0, yMin - yPadding), yMax + yPadding];


		const oldYScale = y.copy();
		const newYScale = y.copy().domain(newYDomain);

		return function (t) {
			y.domain(oldYScale.domain().map(d => d3.interpolate(d, newYScale.domain()[oldYScale.domain().indexOf(d)])(t)));
		};

	}

	let isZooming = false;
	let dataChanged = false;
	let useDataSmoothing = false;
	let isDragging = false;
	// 设置缩放行为
	const zoom = d3.zoom()
		.scaleExtent([props.minZoomScale, props.maxZoomScale])
		.extent([[0, 0], [width, height]])
		.on("zoom", zoomed)
		.filter(event => {
			return event.type === 'wheel' || (event.type === 'touchstart' && event.touches.length === 2);
		});

	svg.call(zoom);

	function weightedMovingAverage(data, windowSize) {
		// 生成权重，最近的数据点权重最高
		const weights = Array.from({ length: windowSize }, (_, i) => i + 1);
		const weightSum = weights.reduce((a, b) => a + b, 0);

		return data.map((d, i) => {
			if (i >= xLastIndex - 10) {
				return d;
			}
			let sum = 0;
			let count = 0;
			for (let j = Math.max(0, i - windowSize + 1); j <= i; j++) {
				if (data[j].y !== null) {
					const weight = weights[i - j];
					sum += data[j].y * weight;
					count += weight;
				}
			}
			return { ...d, y: count > 0 ? sum / count : null };
		});
	}

	// 主平滑函数
	function smoothData(data, factor) {
		if (factor === 0) return data;
		// 根据平滑因子动态调整窗口大小
		const windowSize = Math.max(3, Math.min(50, Math.floor(data.length * factor * 0.2)));
		return weightedMovingAverage(data, windowSize);
	}

	let debounceZoom = null
	// 缩放函数
	function zoomed(event) {
		showRestset.value = true
		isZooming = true;
		const newScale = event.transform.k;
		zoomScale = newScale;
		svg.selectAll("*").interrupt()
		const currentDomain = x.domain();
		const currentCenter = (currentDomain[0] + currentDomain[1]) / 2;
		const newVisibleRange = gapScale / newScale;
		let newLeftBoundary = currentCenter - (newVisibleRange / 2);
		let newRightBoundary = currentCenter + (newVisibleRange / 2);
		const maxDataX = data[data.length - 1].x;
		if (newRightBoundary > maxDataX) {
			newRightBoundary = maxDataX;
			// newLeftBoundary = Math.max(maxDataX - newVisibleRange, data[0].x);
		}
		xFirstIndex = Math.floor(data.length - 1 - newRightBoundary + newLeftBoundary);
		if (newLeftBoundary < data[0].x) {
			addDataToLeft(newLeftBoundary);
		}
		x.domain([newLeftBoundary, newRightBoundary]);
		if (newScale < 0.1) {
			if (!useDataSmoothing) {
				dataSave = data;
			}
			data = smoothData(dataSave, Math.pow(1 - (newScale / 0.1), 2))
			dataChanged = true;
			useDataSmoothing = true;
		} else if (useDataSmoothing) {
			useDataSmoothing = false;
			data = dataSave;
			dataChanged = true;
		}
		xAxis.call(d3.axisBottom(x).ticks(5).tickFormat((d, i) => {
			// 找到最接近当前 x 值的数据点
			const closestDataPoint = data.reduce((prev, curr) =>
				Math.abs(curr.x - d) < Math.abs(prev.x - d) ? curr : prev
			);
			const currentDate = new Date(closestDataPoint.label);
			return xLabelFormat()(currentDate);
		}))
			.call(g => g.select(".domain").remove())
			.call(g => g.selectAll(".line").remove())
			.call(g => g.selectAll("text")
				.style("fill", "white")
				.style("font-size", "12px"));
		const lastDataPoint = data[xLastIndex];
		const [xDomainStart, xDomainEnd] = x.domain();
		const isLastPointVisible = lastDataPoint.x >= xDomainStart && lastDataPoint.x <= xDomainEnd;
		if (!isLastPointVisible || dataChanged) {
			updateYDomain(true)
		}

		path.datum(data).attr("d", line);
		areaPath.datum(data).attr("d", area);

		endpoint
			.attr("cx", x(data[xLastIndex].x))
			.attr("cy", y(data[xLastIndex].y));

		updateMarkersStatic();
		updateAddedElementsStatic()

		endLine
			.attr("x1", x(data[data.length - 1].x))
			.attr("x2", x(data[data.length - 1].x));


	}

	// 拖拽功能
	let isPanning = false;
	let lastMouseX = 0;

	svg.call(d3.drag()
		.on("start", dragStarted)
		.on("drag", dragged)
		.on("end", dragEnded));

	function dragStarted(event) {
		if (event.sourceEvent && event.sourceEvent.type === 'touchmove' && event.sourceEvent.touches.length === 2) return;
		lastMouseX = event.x;
	}

	function dragged(event) {
		if (event.sourceEvent && event.sourceEvent.type === 'touchmove' && event.sourceEvent.touches.length === 2) {
			return;
		}
		if (Math.abs(event.x - lastMouseX) > 20) {
			isPanning = true;
		}
		if (isPanning) {
			showRestset.value = true
			const dx = event.x - lastMouseX;
			const currentDomain = x.domain();
			let newDomain = currentDomain.map(d => d - dx / width * (currentDomain[1] - currentDomain[0]));

			if (newDomain[0] < props.minX) {
				const diff = props.minX - newDomain[0];
				newDomain = [props.minX, newDomain[1] + diff];
			}

			const maxX = data[data.length - 1].x;
			if (newDomain[1] > maxX) {
				const diff = newDomain[1] - maxX;
				newDomain = [newDomain[0] - diff, maxX];
			}

			if (newDomain[0] < data[0].x) {
				addDataToLeft(newDomain[0]);
			}
			x.domain(newDomain);
			xAxis.call(d3.axisBottom(x).ticks(5).tickFormat((d, i) => {
				// 找到最接近当前 x 值的数据点
				const closestDataPoint = data.reduce((prev, curr) =>
					Math.abs(curr.x - d) < Math.abs(prev.x - d) ? curr : prev
				);
				const currentDate = new Date(closestDataPoint.label);
				return xLabelFormat()(currentDate);
			}))
				.call(g => g.select(".domain").remove())
				.call(g => g.selectAll(".tick line").remove())
				.call(g => g.selectAll("text")
					.style("fill", "white")
					.style("font-size", "12px"));

			path.attr("d", line);
			areaPath.attr("d", area);
			endpoint
				.attr("cx", x(data[xLastIndex].x))
				.attr("cy", y(data[xLastIndex].y));

			updateMarkersStatic();
			updateAddedElementsStatic();
			endLine
				.attr("x1", x(data[data.length - 1].x))
				.attr("y1", 0)
				.attr("x2", x(data[data.length - 1].x))
				.attr("y2", height);
			lastMouseX = event.x;
			const lastDataPoint = data[xLastIndex];
			const [xDomainStart, xDomainEnd] = x.domain();
			const isLastPointVisible = lastDataPoint.x >= xDomainStart && lastDataPoint.x <= xDomainEnd;
			if (!isLastPointVisible) {
				updateYDomain(true)
			}
		}
	}

	function dragEnded() {
		isPanning = false;
	}

	// 向左添加数据
	function addDataToLeft(newMinX) {
		let addedCount = 0;
		const insertNewData = props.insertDataToLeft(props.xScale, props.lastGap);
		while (data[0].x > newMinX) {
			const newItem = insertNewData(data[0].x);
			if (!newItem) break;
			data.unshift(newItem);
			if (useDataSmoothing) dataSave.unshift(newItem)
			addedCount++;
		}
		xFirstIndex += addedCount;
		xLastIndex += addedCount;
		addedElements.forEach((d) => {
			const gap = d.dataIndex - d.x;
			d.x += addedCount;
			d.dataIndex = gap + d.x;
		});
	}

	// 更新图表
	function updateChart() {
		// 添加新的数据点
		const newPoint = {
			x: xData++,
			y: null,
			hasMarker: false,
			label: props.generateNewNullXLabel()(data[data.length - 1].label)
		}
		data.push(newPoint);
		if (useDataSmoothing) {
			dataSave.push(newPoint);
		}

		xLastIndex = xLastIndex + 1;
		const generateNewY = props.generateNewDataPoint(xData, data[xLastIndex - 1]);
		const newYData = generateNewY()
		data[xLastIndex].y = newYData.y;
		data[xLastIndex].label = newYData.label || data[xLastIndex].label;
		if (useDataSmoothing) {
			dataSave[dataSave.length - 1 - currentGap].y = newYData.y;
			dataSave[dataSave.length - 1 - currentGap].label = newYData.label || data[xLastIndex].label;
		}
		if (data[data.length - 1].label !== newYData.label + 500 * (data.length - xLastIndex)) {
			for (let j = xLastIndex + 1, last = 1; j < data.length; j++, last++) {
				data[j].label = newYData.label + last * 500;
			}
		}
		xFirstIndex = xFirstIndex + 1;
		const lastDataPoint = data[xLastIndex];
		const [xDomainStart, xDomainEnd] = x.domain();
		const isLastPointVisible = lastDataPoint.x >= xDomainStart && lastDataPoint.x <= xDomainEnd;
		let yTransition;

		if (isLastPointVisible && !isPanning && !isZooming && !dataChanged && !isCatchingUp) {
			const currenDomain = x.domain()
			// 更新x轴域
			x.domain([currenDomain[0] + 1, currenDomain[1] + 1]);
			yTransition = updateYDomainWhenUpdate();

			// 更新x轴
			xAxis.transition()
				.duration(props.interval)
				.ease(d3.easeLinear)
				.call(d3.axisBottom(x).ticks(5).tickFormat((d, i) => {
					// 找到最接近当前 x 值的数据点
					const closestDataPoint = data.reduce((prev, curr) =>
						Math.abs(curr.x - d) < Math.abs(prev.x - d) ? curr : prev
					);
					const currentDate = new Date(closestDataPoint.label);
					return xLabelFormat()(currentDate);
				}))
				.call(g => g.select(".domain").remove())
				.call(g => g.selectAll(".tick line").remove())
				.call(g => g.selectAll("text")
					.style("fill", "white")
					.style("font-size", "12px"));

			// 更新区域路径
			areaPath.datum(data)
				.transition()
				.duration(props.interval)
				.ease(d3.easeLinear)
				.attr("d", area)
				.attrTween("d", function (d) {
					return function (t) {
						if (yTransition) yTransition(t);
						const interpolatedData = d.filter(d => d.y !== null).slice(0, -1).map(((p, index) => {
							if (index) {
								return {
									x: d3.interpolateNumber(p.x, data[index - 1].x)(t),
									y: p.y,
								}
							}
							return {
								x: p.x,
								y: p.y
							}
						}));
						const newPoint = {
							x: data[xLastIndex - 1].x,
							y: d3.interpolateNumber(data[xLastIndex - 1].y, data[xLastIndex].y)(t)
						};
						interpolatedData.push(newPoint);
						return area(interpolatedData);
					};
				});

			// 更新线条路径
			path.datum(data)
				.transition()
				.duration(props.interval)
				.ease(d3.easeLinear)
				.attr("d", line)
				.attrTween("d", function (d) {
					function interpolate(start, end) {
						const diff = end - start;
						return function (t) {
							return start + (diff * t);
						};
					}

					return function (t) {
						if (yTransition) yTransition(t);
						const interpolatedData = d.filter(d => d.y !== null).slice(0, -1).map(((p, index) => {
							if (index) {
								return {
									x: d3.interpolateNumber(p.x, data[index - 1].x)(t),
									y: p.y,
								}
							}
							return {
								x: p.x,
								y: p.y
							}
						}));
						const newPoint = {
							x: data[xLastIndex - 1].x,
							y: interpolate(data[xLastIndex - 1].y, data[xLastIndex].y)(t)
						};
						interpolatedData.push(newPoint);
						return line(interpolatedData)
					};
				});
			endpoint.transition()
				.duration(props.interval)
				.ease(d3.easeLinear)
				.attrTween("cx", function () {
					return function (t) {
						return x(data[xLastIndex - 1].x);
					};
				})
				.attrTween("cy", function () {
					return function (t) {
						if (yTransition) yTransition(t);
						return y(d3.interpolateNumber(data[xLastIndex - 1].y, data[xLastIndex].y)(t));
					};
				});
			updateMarkLineLabels(yTransition);
			updateMarkersWithTransition(yTransition);
			updateAddedElements(yTransition);
			endLine
				.attr("x1", width)
				.attr("x2", width);
		} else {
			// 如果最后一个点不可见，直接更新路径而不使用过渡
			areaPath.datum(data).attr("d", area);
			path.datum(data).attr("d", line);
			if (dataChanged) {
				dataChanged = false
			}
			if (isZooming) {
				isZooming = false
			}
			if (isCatchingUp) {
				isCatchingUp = false
			}
			endpoint.attr("cx", x(data[xLastIndex].x))
				.attr("cy", y(data[xLastIndex].y))
			updateMarkersStatic();
			updateAddedElementsStatic()
			updateYDomain();
			endLine
				.attr("x1", x(data[data.length - 1].x))
				.attr("x2", x(data[data.length - 1].x));
		}

		// 更新标记线
		markline.transition()
			.duration(props.interval)
			.ease(d3.easeLinear)
			.attrTween("y1", function () {
				return function (t) {
					if (yTransition) yTransition(t);
					return y(d3.interpolateNumber(data[xLastIndex - 1].y, data[xLastIndex].y)(t));
				};
			})
			.attrTween("y2", function () {
				return function (t) {
					if (yTransition) yTransition(t);
					return y(d3.interpolateNumber(data[xLastIndex - 1].y, data[xLastIndex].y)(t));
				};
			}).on("end", function () {
				// 在过渡结束时，将 markLineLabels 移动到其父元素的最后
				this.parentNode.appendChild(this);
			});
		movingBg1.transition()
			.duration(props.interval)
			.ease(d3.easeLinear)
			.attrTween('height', function () {
				return function (t) {
					if (yTransition) yTransition(t);
					return Math.max(0, d3.interpolateNumber(y(data[xLastIndex - 1].y), y(data[xLastIndex].y))(t));
				};
			})
		movingBg2.transition()
			.duration(props.interval)
			.ease(d3.easeLinear)
			.attrTween('height', function () {
				return function (t) {
					if (yTransition) yTransition(t);
					return Math.max(0, d3.interpolateNumber(height - y(data[xLastIndex - 1].y), height - y(data[xLastIndex].y))(t));
				};
			})
			.attrTween('y', function (t) {
				return function (t) {
					if (yTransition) yTransition(t);
					return d3.interpolateNumber(y(data[xLastIndex - 1].y), y(data[xLastIndex].y))(t);
				}
			})

		// 更新复杂HTML
		updateMarkLineLabels(yTransition);

		// 随机添加标记
		if (Math.random() < props.markerProbability) {
			data[xLastIndex].hasMarker = true;
			addMarker(data[xLastIndex], xLastIndex);
		}
	}

	// 添加标记
	function addMarker(dataPoint, index) {
		const isRed = Math.random() < 0.5;
		// todo 自行屏蔽这里
		const numberJpg = Math.floor(Math.random() * (310 - 1 + 1)) + 1;
		const randomNumber = Math.floor(Math.random() * 100001);
		const nickname = faker.name.fullName().substring(0, 5); // 生成一个随机用户名作为昵称

		markerConter.append("circle")
			.attr('class', 'marker-point')
			.attr("r", 2)
			.attr("fill", "transparent")
			.attr("cx", x(data[index - 1].x))
			.attr("cy", y(dataPoint.y))
			.attr("stroke", isRed ? '#ff505a' : '#c5ff68')
			.attr("stroke-width", 2);


		const markerLabel = markerConter.append("g")
			.attr("transform", `translate(${x(data[index - 1].x)}, ${y(dataPoint.y)})`)
			.attr("class", `marker-label ${isRed ? 'red' : 'green'}`)
			.attr("opacity", 1);
		const icon = markerLabel.append('g').attr('opacity', 1).style('cursor', 'pointer')
		const detail = markerLabel.append('g').attr('opacity', 0).style('cursor', 'pointer').style(
			'pointer-events', 'none')


		const clipId = "roundedClip" + Date.now() + Math.random() * 100
		const clipPathImage = icon.append("defs")
			.append("clipPath")
			.attr("id", clipId);

		clipPathImage.append("rect")
			.attr("x", -10)
			.attr("y", isRed ? -24 : 4)
			.attr("width", 20)
			.attr("height", 20)
			.attr("rx", 20) // 圆角半径
			.attr("ry", 20); // 圆角半径
		// 图标图片
		icon.append("image")
			.attr("class", "icon")
			.attr("x", -10)
			.attr("y", isRed ? -24 : 4)
			.attr("width", 20)
			.attr("height", 20)
			.attr("href", `${getbaseURL()}/static/images/${numberJpg}.jpg`)
			.attr("clip-path", `url(#${clipId})`);
		icon.append('circle')
			.attr('r', 10)
			.attr('cx', 0)
			.attr('cy', isRed ? -14 : 14)
			.attr('fill', 'transparent')
			.attr('stroke', isRed ? '#ff505a' : '#c5ff68')
		// 详情图片
		// 背景矩形
		detail.append("rect")
			.attr("width", 65)
			.attr("height", 40)
			.attr('x', -32)
			.attr('y', isRed ? -45 : 5)
			.attr("fill", "rgba(0, 0, 0, 0.5)")
			.attr('rx', 5)
			.attr('ry', 5)
			.attr("stroke", isRed ? '#ff505a' : '#c5ff68');
		const clipId2 = "roundedClip" + Date.now() + Math.random() * 100
		const clipPathImage2 = detail.append("defs")
			.append("clipPath")
			.attr("id", clipId2);

		clipPathImage2.append("rect")
			.attr("x", -25)
			.attr("y", isRed ? -35 : 15)
			.attr("width", 18)
			.attr("height", 18)
			.attr("rx", 14) // 圆角半径
			.attr("ry", 14); // 圆角半径
		detail.append("image")
			.attr("class", "detail")
			.attr("x", -25)
			.attr("y", isRed ? -35 : 15)
			.attr("width", 18)
			.attr("height", 18)
			.attr("href", `${getbaseURL()}/static/images/${numberJpg}.jpg`)
			.attr("clip-path", `url(#${clipId2})`);

		// 文本信息
		const textGroup = detail.append("g")
			.attr("class", "rg-svg")
			.attr("transform", `translate(0, ${isRed ? -40 : 10})`);

		textGroup.append("text")
			.attr("y", 8)
			.attr('fill', '#fff')
			.text(randomNumberWithBias(0.9)); // todo 自行更换文字

		textGroup.append("text")
			.attr("y", 20)
			.attr('fill', '#fff')
			.text(nickname); // todo 自行更换文字

		textGroup.append("text")
			.attr("y", 32)
			.attr('fill', '#fff')
			.text(randomNumber); // todo 自行更换文字

		detail.on('click', function (e) {
			e.stopPropagation();
			detail.attr('opacity', 0).style('pointer-events', 'none')
			icon.attr('opacity', 1).style('pointer-events', 'all')
		});
		icon.on('click', function (e) {
			e.stopPropagation();
			icon.attr('opacity', 0).style('pointer-events', 'none')
			detail.attr('opacity', 1).style('pointer-events', 'all')
		});
	}

	// 使用过渡更新标记
	function updateMarkersWithTransition(yTransition) {
		svg.selectAll(".marker-point")
			.data(data.filter(d => d.hasMarker))
			.each(function (d, i, nodes) {
				const marker = d3.select(this);
				const dataIndex = data.findIndex(item => item === d);
				marker.transition()
					.duration(props.interval)
					.ease(d3.easeLinear)
					.attr('cx', x(data[dataIndex - 1].x))
					.attrTween("cy", function () {
						return function (t) {
							if (yTransition) yTransition(t);
							return y(data[dataIndex].y);
						};
					})
			});
		svg.selectAll(".marker-label")
			.data(data.filter(d => d.hasMarker))
			.each(function (d, i, nodes) {
				const marker = d3.select(this);
				const dataIndex = data.findIndex(item => item === d);
				marker.transition()
					.duration(props.interval)
					.ease(d3.easeLinear)
					.attrTween("transform", function () {
						return function (t) {
							if (yTransition) yTransition(t);
							return `translate(${x(d3.interpolateNumber(data[dataIndex].x, data[dataIndex - 1].x)(t))}, ${y(data[dataIndex].y)})`;
						};
					})
			});
	}

	// 静态更新标记
	function updateMarkersStatic() {
		svg.selectAll(".marker-point")
			.data(data.filter(d => d.hasMarker))
			.each(function (d, i, nodes) {
				const marker = d3.select(this);
				const dataIndex = data.findIndex(item => item === d);
				marker
					.attr('cx', x(data[dataIndex].x))
					.attr("cy", y(data[dataIndex].y))
			});
		svg.selectAll(".marker-label")
			.data(data.filter(d => d.hasMarker))
			.each(function (d, i, nodes) {
				const marker = d3.select(this);
				const dataIndex = data.findIndex(item => item === d);
				marker.attr("transform", `translate(${x(data[dataIndex].x)}, ${y(data[dataIndex].y)})`)
			});
	}

	// 存储添加的元素
	let addedElements = [];
	let elementIdCounter = 0;

	// 添加元素处理函数
	addElementHandler.value = (timestamp, price, type, buyAmount) => {
		return addElements(type, timestamp, price, buyAmount)
	}

	// 添加元素（点、标签、竖线和横线）
	function addElements(type, timestamp, price, buyAmount) {
		// 将传入的时间戳转换为 Date 对象
		const targetDate = new Date(timestamp);

		// // 找到最接近目标时间戳的数据点
		// const closestDataPoint = data.reduce((prev, curr) => {
		// 	const prevDate = new Date(prev.label);
		// 	const currDate = new Date(curr.label);
		// 	return Math.abs(currDate - targetDate) < Math.abs(prevDate - targetDate) ? curr : prev;
		// });
		// 找到最接近目标时间戳的数据点
		const closestDataPoint = data.reduce((prev, curr) => {
			const prevDate = new Date(prev.label);
			const currDate = new Date(curr.label);
			if (curr.label == timestamp) {
				console.log('找到', curr);
				return curr
			} else {
				return Math.abs(currDate - targetDate) < Math.abs(prevDate - targetDate) ? curr : prev;
			}
		});

		let currentX = data.indexOf(closestDataPoint);
		let currentY = closestDataPoint.y;
		let currentDataIndex = currentX + currentGap; // 当前数据索引
		const uniqueId = `element-${elementIdCounter++}`; // 生成唯一ID

		// 如果找到的点是空值（null），我们不应该添加元素
		if (currentY === null) {
			currentX = xLastIndex
			currentY = data[xLastIndex].y;
			currentDataIndex = currentX + currentGap;
		}

		// 添加点
		const point = chartGroup.append("circle")
			.attr("class", `added-point ${type}`)
			.attr("r", 5)
			.attr("cx", x(data[currentX - 1].x))
			.attr("cy", y(currentY))
			.style("fill", `${type === 'red' ? '#d7276b' : '#32a88a'}`);

		// 添加竖线
		const verticalLine = chartGroup.append("line")
			.attr("class", "added-vertical-line")
			.attr("x1", x(data[currentDataIndex].x))
			.attr("y1", 0)
			.attr("x2", x(data[currentDataIndex].x))
			.attr("y2", height)
			.style("stroke", type === 'red' ? '#d7276b' : '#32a88a');

		// 添加横线
		const horizontalLine = chartGroup.append("line")
			.attr("class", "added-horizontal-line")
			.attr("x1", x(closestDataPoint.x))
			.attr("y1", y(currentY))
			.attr("x2", x(data[currentDataIndex].x))
			.attr("y2", y(currentY))
			.style("stroke", type === 'red' ? '#d7276b' : '#32a88a');

		// 创建一个组来包含背景和文本
		const labelGroup = chartGroup.append("g")
			.attr("class", "added-label-group");

		// 添加背景矩形
		const labelBackground = labelGroup.append("rect")
			.attr("class", "label-background")
			.attr("x", -30) // 临时值，稍后会更新
			.attr("y", -20)
			.attr("width", 60) // 临时值，稍后会更新
			.attr("height", 20)
			.attr("fill", type === 'red' ? '#d7276b' : '#32a88a')
			.attr("opacity", 0.8)
			.attr("rx", 3)
			.attr("ry", 3);

		// 添加文本
		const labelText = labelGroup.append("text")
			.attr("class", "added-label")
			.attr("x", 0)
			.attr("y", -5) // 垂直居中
			.text('$' + price)
			.style("text-anchor", "middle")
			.style("fill", "white")
			.style("font-size", "12px");

		// 获取文本的实际宽度并更新背景矩形
		const textBBox = labelText.node().getBBox();
		const padding = 6; // 文本周围的内边距
		const backgroundWidth = textBBox.width + padding;

		labelBackground
			.attr("x", -backgroundWidth / 2)
			.attr("width", backgroundWidth);

		// 设置labelGroup的位置
		const labelHeight = textBBox.height + padding;
		labelGroup.style('transition', 'none');
		labelGroup.attr("transform", `translate(${x(closestDataPoint.x)},${y(currentY) - labelHeight - 10})`);

		// 下注时的价格
		// 创建一个组来包含背景和文本
		const labelGroup2 = chartGroup.append("g")
			.attr("class", "added-label-group");

		// 添加背景矩形
		const labelBackground2 = labelGroup2.append("rect")
			.attr("class", "label-background")
			.attr("x", -30) // 临时值，稍后会更新
			.attr("y", -20)
			.attr("width", 60) // 临时值，稍后会更新
			.attr("height", 20)
			.attr("fill", type === 'red' ? '#d7276b' : '#32a88a')
			.attr("opacity", 0.8)
			.attr("rx", 3)
			.attr("ry", 3);

		// 添加文本
		const labelText2 = labelGroup2.append("text")
			.attr("class", "added-label")
			.attr("x", 0)
			.attr("y", -5) // 垂直居中
			.text(buyAmount)
			.style("text-anchor", "middle")
			.style("fill", "white")
			.style("font-size", "12px");

		// 获取文本的实际宽度并更新背景矩形
		const textBBox2 = labelText2.node().getBBox();
		const padding2 = 6; // 文本周围的内边距
		const backgroundWidth2 = textBBox2.width + padding2;

		labelBackground2
			.attr("x", -backgroundWidth2 / 2)
			.attr("width", backgroundWidth2);

		// 设置labelGroup的位置
		const labelHeight2 = textBBox2.height + padding2;
		labelGroup2.style('transition', 'none');
		labelGroup2.attr("transform", `translate(${x(closestDataPoint.x)},${y(currentY) - labelHeight2 + 30})`);

		// 将添加的元素存储到数组中
		const elementGroup = {
			id: uniqueId,
			point,
			labelGroup,
			labelGroup2,
			verticalLine,
			horizontalLine,
			x: currentX,
			y: currentY,
			dataIndex: currentDataIndex
		};

		addedElements.push(elementGroup);

		return {
			id: uniqueId,
			x: currentX,
			y: currentY,
			price,
			dataIndex: currentDataIndex
		};
	}

	function updateAddedElements(yTransition) {
		addedElements.forEach(group => {
			const currentX = group.x;
			const currentY = group.y;
			const originalDataIndex = group.dataIndex;

			group.point.transition()
				.duration(props.interval)
				.ease(d3.easeLinear)
				.attr("cx", x(data[currentX - 1].x))
				.attrTween("cy", function () {
					return function (t) {
						if (yTransition) yTransition(t);
						return y(currentY);
					};
				});
			group.labelGroup
				.transition()
				.duration(props.interval)
				.ease(d3.easeLinear)
				// .attrTween("transform", `translate(${x(data[currentX - 1].x)},${y(currentY) - 10})`)
				.attrTween("transform", function () {
					return function (t) {
						if (yTransition) yTransition(t);
						return `translate(${x(d3.interpolateNumber(data[currentX].x, data[currentX - 1].x)(t))}, ${y(currentY) - 10})`;
					};
				});
			// 下注价格更新
			group.labelGroup2
				.transition()
				.duration(props.interval)
				.ease(d3.easeLinear)
				// .attrTween("transform", `translate(${x(data[currentX - 1].x)},${y(currentY) - 10})`)
				.attrTween("transform", function () {
					return function (t) {
						if (yTransition) yTransition(t);
						return `translate(${x(d3.interpolateNumber(data[currentX].x, data[currentX - 1].x)(t))}, ${y(currentY) + 30})`;
					};
				});

			if (data[originalDataIndex]) {
				group.verticalLine.transition()
					.duration(props.interval)
					.ease(d3.easeLinear)
					.attr("x1", x(data[originalDataIndex].x))
					.attr("x2", x(data[originalDataIndex].x));

				group.horizontalLine.transition()
					.duration(props.interval)
					.ease(d3.easeLinear)
					.attr("x1", x(data[currentX - 1].x))
					.attr("x2", x(data[originalDataIndex].x))
					.attrTween("y1", function () {
						return function (t) {
							if (yTransition) yTransition(t);
							return y(currentY);
						};
					})
					.attrTween("y2", function () {
						return function (t) {
							if (yTransition) yTransition(t);
							return y(currentY);
						};
					})
			} else {
				group.verticalLine.transition()
					.duration(props.interval)
					.ease(d3.easeLinear)
					.attr("x1", x(data[data.length - 1].x) * 1.2)
					.attr("x2", x(data[data.length - 1].x) * 1.2);

				group.horizontalLine.transition()
					.duration(props.interval)
					.ease(d3.easeLinear)
					.attr("x1", x(data[currentX - 1].x))
					.attr("x2", x(data[data.length - 1].x) * 1.2)
					.attrTween("y1", function () {
						return function (t) {
							if (yTransition) yTransition(t);
							return y(currentY);
						};
					})
					.attrTween("y2", function () {
						return function (t) {
							if (yTransition) yTransition(t);
							return y(currentY);
						};
					})
			}

		});
	}

	// 静态更新添加的元素位置
	function updateAddedElementsStatic() {
		addedElements.forEach(group => {
			const currentX = group.x;
			const currentY = group.y;
			const originalDataIndex = group.dataIndex;
			group.point
				.attr("cx", x(data[currentX].x))
				.attr("cy", y(currentY));

			group.labelGroup
				.style("transition", `none`)
				.attr("transform", `translate(${x(data[currentX].x)},${y(currentY) - 10})`);
			group.labelGroup2
				.style("transition", `none`)
				.attr("transform", `translate(${x(data[currentX].x)},${y(currentY) + 30})`);
			if (data[originalDataIndex]) {
				group.verticalLine
					.attr("x1", x(data[originalDataIndex].x))
					.attr("x2", x(data[originalDataIndex].x));
				group.horizontalLine
					.attr("x1", x(data[currentX].x))
					.attr("y1", y(currentY))
					.attr("x2", x(data[originalDataIndex].x))
					.attr("y2", y(currentY));
			} else {
				group.verticalLine
					.attr("x1", x(data[data.length - 1].x) * 1.2)
					.attr("x2", x(data[data.length - 1].x) * 1.2);
				group.horizontalLine
					.attr("x1", x(data[currentX].x))
					.attr("y1", y(currentY))
					.attr("x2", x(data[data.length - 1].x) * 1.2)
					.attr("y2", y(currentY));
			}


		});
	}

	// 销毁特定的添加元素
	function destroyElement(id) {
		const index = addedElements.findIndex(elem => elem.id === id);
		if (index === -1) {
			console.error("Element not found with id:", id);
			return;
		}

		const group = addedElements[index];
		group.point.remove();
		group.labelGroup.remove(); // 移除整个标签组
		group.labelGroup2.remove(); // 移除整个价格标签组
		group.verticalLine.remove();
		group.horizontalLine.remove();

		addedElements.splice(index, 1);
	}

	destroyElementHandler.value = (index) => {
		destroyElement(index)
	}

	resumeElements.value = (elements) => {
		elements.forEach((ele) => {
			const { x: currentX, y: currentY, id, dataIndex: currentDataIndex, price } = ele
			// 添加点
			const point = chartGroup.append("circle")
				.attr("class", `added-point ${type}`)
				.attr("r", 5)
				.attr("cx", x(data[currentX - 1].x))
				.attr("cy", y(currentY))
				.style("fill", `${type === 'red' ? '#d7276b' : '#32a88a'}`);

			// 添加竖线
			const verticalLine = chartGroup.append("line")
				.attr("class", "added-vertical-line")
				.attr("x1", x(data[currentDataIndex].x))
				.attr("y1", 0)
				.attr("x2", x(data[currentDataIndex].x))
				.attr("y2", height)
				.style("stroke", type === 'red' ? '#d7276b' : '#32a88a');

			// 添加横线
			const horizontalLine = chartGroup.append("line")
				.attr("class", "added-horizontal-line")
				.attr("x1", x(data[currentX - 1].x))
				.attr("y1", y(currentY))
				.attr("x2", x(data[currentDataIndex].x))
				.attr("y2", y(currentY))
				.style("stroke", type === 'red' ? '#d7276b' : '#32a88a');

			// 创建一个组来包含背景和文本
			const labelGroup = chartGroup.append("g")
				.attr("class", "added-label-group");

			// 添加背景矩形
			const labelBackground = labelGroup.append("rect")
				.attr("class", "label-background")
				.attr("x", -30) // 临时值，稍后会更新
				.attr("y", -20)
				.attr("width", 60) // 临时值，稍后会更新
				.attr("height", 20)
				.attr("fill", type === 'red' ? '#d7276b' : '#32a88a')
				.attr("opacity", 0.8)
				.attr("rx", 3)
				.attr("ry", 3);

			// 添加文本
			const labelText = labelGroup.append("text")
				.attr("class", "added-label")
				.attr("x", 0)
				.attr("y", -5) // 垂直居中
				.text(price)
				.style("text-anchor", "middle")
				.style("fill", "white")
				.style("font-size", "12px");

			// 获取文本的实际宽度并更新背景矩形
			const textBBox = labelText.node().getBBox();
			const padding = 6; // 文本周围的内边距
			const backgroundWidth = textBBox.width + padding * 2;

			labelBackground
				.attr("x", -backgroundWidth / 2)
				.attr("width", backgroundWidth);

			// 设置labelGroup的位置
			const labelHeight = textBBox.height + padding * 2;
			labelGroup.style('transition', 'none');
			labelGroup.attr("transform", `translate(${x(data[currentX - 1].x)},${y(currentY) - labelHeight - 10})`);

			addedElements.push({
				x: currentX, y: currentY, id, dataIndex: currentDataIndex, point, price,
				labelGroup,
				verticalLine,
				horizontalLine,
			})
		})
	}

	changeLastGap.value = (num) => {
		// 计算当前实际的 lastGap
		const currentLastGap = data.slice().reverse().findIndex(d => d.y !== null);
		const newLastGap = num;
		currentGap = num;
		const lastIndexChange = newLastGap - currentLastGap;
		// 如果新的 lastGap 小于当前的，我们需要移除一些空数据
		if (newLastGap < currentLastGap) {
			const removeCount = currentLastGap - newLastGap;
			data.splice(data.length - removeCount, removeCount);
		}
		// 如果新的 lastGap 大于当前的，我们需要添加一些空数据
		else if (newLastGap > currentLastGap) {
			const addCount = newLastGap - currentLastGap;
			for (let i = 0; i < addCount; i++) {
				const lastX = data[data.length - 1].x;
				const newLabel = props.generateNewNullXLabel()(data[data.length - 1].label);
				data.push({ x: lastX + 1, y: null, hasMarker: false, label: newLabel });
			}
		}
		// 更新 xLastIndex
		xData += lastIndexChange;
		const ratio = props.xScale / props.lastGap;
		const start = newLastGap * ratio;
		const startX = xData - start
		gapScale = start
		const startIndex = data.findIndex(d => d.x === startX);
		if (startIndex > -1) {
			xFirstIndex = startIndex;
			x.domain([startX, data[data.length - 1].x])
		} else {
			addDataToLeft(startX - data[0].x);
			xFirstIndex = 0;
			x.domain([data[0].x, data[data.length - 1].x])
		}

		// 更新 x 轴
		xAxis.call(d3.axisBottom(x).ticks(5).tickFormat((d, i) => {
			const closestDataPoint = data.reduce((prev, curr) =>
				Math.abs(curr.x - d) < Math.abs(prev.x - d) ? curr : prev
			);
			const currentDate = new Date(closestDataPoint.label);
			return xLabelFormat()(currentDate);
		}))
			.call(g => g.select(".domain").remove())
			.call(g => g.selectAll(".tick line").remove())
			.call(g => g.selectAll("text")
				.style("fill", "white")
				.style("font-size", "12px"));

		// 更新路径
		path.attr("d", line);
		areaPath.attr("d", area);

		// 更新端点
		endpoint
			.attr("cx", x(data[xLastIndex].x))
			.attr("cy", y(data[xLastIndex].y));

		// 更新标记线
		markline
			.attr("y1", y(data[xLastIndex].y))
			.attr("y2", y(data[xLastIndex].y));

		// 更新结束线
		endLine
			.attr("x1", x(data[data.length - 1].x))
			.attr("x2", x(data[data.length - 1].x));

		// 更新复杂HTML
		updateMarkLineLabels()

		// 更新标记和添加的元素
		updateMarkersStatic();
		updateAddedElementsStatic();
	};

	let i = 0;
	// 设置定时器，定期更新图表
	intervalId = setInterval(() => {
		if (i < 50) {
			updateChart();
			// i += 1;
		} else {
			clearInterval(intervalId);
		}
	}, props.interval);

	// 重置图表函数
	resetChart.value = () => {
		nextTick(() => {
			showRestset.value = false
		})
		d3.interrupt(svg);
		const currentTransform = d3.zoomTransform(svg.node());
		const newTransform = d3.zoomIdentity
			.translate(currentTransform.x, currentTransform.y)
			.scale(1);  // 将 k 重置为 1
		svg.call(zoom.transform, newTransform);
		if (useDataSmoothing) {
			data = dataSave;
			dataChanged = true;
			useDataSmoothing = false;
		}
		const currentLastGap = data.slice().reverse().findIndex(d => d.y !== null);
		const ratio = props.xScale / props.lastGap;
		const start = Math.round(currentLastGap * ratio);
		xFirstIndex = data.length - 1 - start;
		x.domain([data[xFirstIndex].x, data[data.length - 1].x]);
		console.log('resetRange', data[xFirstIndex].x, data[data.length - 1].x)
		updateYDomain(true);

		xAxis.call(d3.axisBottom(x).ticks(5).tickFormat((d, i) => {
			// 找到最接近当前 x 值的数据点
			const closestDataPoint = data.reduce((prev, curr) =>
				Math.abs(curr.x - d) < Math.abs(prev.x - d) ? curr : prev
			);
			const currentDate = new Date(closestDataPoint.label);
			return xLabelFormat()(currentDate);
		}))
			.call(g => g.select(".domain").remove())
			.call(g => g.selectAll(".tick line").remove())
			.call(g => g.selectAll("text")
				.style("fill", "white")
				.style("font-size", "12px"));

		path.datum(data).attr("d", line);
		areaPath.datum(data).attr("d", area);

		markline
			.attr("y1", y(data[xLastIndex].y))
			.attr("y2", y(data[xLastIndex].y));

		endpoint
			.attr("cx", x(data[xLastIndex].x))
			.attr("cy", y(data[xLastIndex].y));

		endLine
			.attr("x1", width)
			.attr("y1", 0)
			.attr("x2", width)
			.attr("y2", height);

		updateMarkersStatic();
		updateAddedElementsStatic()
	};
	areaPath.attr("class", "transparent-area")
	showArea.value = false
	toggleArea.value = () => {
		if (showArea.value) {
			areaPath.attr("class", "transparent-area")
			showArea.value = false
		} else {
			areaPath.attr("class", "area")
			showArea.value = false
		}
	}

	catchUp.value = (catchUpArr) => {
		isCatchingUp = true;
		const lastDataPoint = data[xLastIndex];
		const [xDomainStart, xDomainEnd] = x.domain();
		const isLastPointVisible = lastDataPoint.x >= xDomainStart && lastDataPoint.x <= xDomainEnd;
		let xDomainEndGap, xDomainRange;
		if (isLastPointVisible) {
			xDomainEndGap = xDomainEnd - lastDataPoint.x
			xDomainRange = xDomainEnd - xDomainStart
		}
		let c = catchUpArr.slice();
		while (c.length) {
			const newPoint = {
				x: xData++,
				y: null,
				hasMarker: false,
				label: props.generateNewNullXLabel()(data[data.length - 1].label)
			}
			data.push(newPoint);
			if (useDataSmoothing) {
				dataSave.push(newPoint);
			}
			const p = c.shift();
			xLastIndex = xLastIndex + 1;
			data[xLastIndex].y = p.y;
			data[xLastIndex].label = p.label || data[xLastIndex].label;
		}
		if (isLastPointVisible) {
			const end = xDomainEndGap + data[xLastIndex].x
			const start = end - xDomainRange
			x.domain([start, end])
		}
	}
});

// 组件卸载时清除定时器
onUnmounted(() => {
	if (intervalId) {
		clearInterval(intervalId);
	}
	// 清除 D3 选择和过渡
	d3.selectAll('*').interrupt();

});

// 暴露重置图表方法
defineExpose({
	resetChart,
	addElementHandler,
	destroyElementHandler,
	changeLastGap,
	resumeElements,
	toggleArea,
	catchUp,
});
</script>
<style>
.chart-container {
	width: 100vw;
	/* height: 100vh; */
	position: absolute;
	left: 0;
	top: 0;
	transform: translate3d(0, 0, 0);
}

.chart-container svg {
	/* transform: translate3d(0, 0, 0); */
}

.line {
	fill: none;
	stroke: #BDF95B;
	stroke-width: 2px;
}

.area {
	fill: url(#area-gradient);
}

.moving-gradient-bg-red {
	fill: url(#red-gradient)
}

.moving-gradient-bg-green {
	fill: url(#green-gradient)
}

.transparent-area {
	fill: transparent;
}

.domain {
	stroke: rgba(0, 0, 0, 0);

}

.tick line {
	display: none;
}

.markline {
	stroke: #BDF95B;
	stroke-width: 2px;
}

.endline {
	stroke: #f2ca54;
	stroke-width: 1px;
}

.endpoint {
	fill: #BDF95B;
	stroke: #fff;
	stroke-width: 2px;
	animation: pulse 2s ease-out infinite alternate;
}

.markline-label>div {
	transform: translateY(calc(-50%));
	position: relative;
	display: flex;
	align-items: flex-start;
	flex-direction: column;
	gap: 10px;
}

.mark-line-text {
	opacity: 0.7;
	background: rgba(47, 150, 240, 0.5);
	padding: 2px 6px;
	color: rgba(255, 255, 255, 0.90);
	font-size: 10px;
	border-radius: 20px;
}

.mark-line-text-center {
	border-radius: 20px;
	background: #2f96f0;
	color: #fff;
	padding: 2px 6px;
	font-size: 12px;
}

.rg-svg {
	font-size: 10px
}

.buy-num {
	position: absolute;
	right: -20px;
	top: 50%;
	transform: translateX(100%) translateY(-200%);
	color: #32a88a;
	font-size: 32px;
}

.sold-num {
	position: absolute;
	right: -20px;
	transform: translateX(100%);
	top: 50%;
	color: #d7276b;
	font-size: 32px;
}

.marker-label {
	animation: data-marker 0.5s 0.3s linear;
	animation-fill-mode: both;
}

@keyframes data-marker {
	0% {
		opacity: 0;
	}

	100% {
		opacity: 1;
	}
}

@keyframes pulse {
	0% {
		stroke-width: 0;
		stroke-opacity: 1;
	}

	100% {
		stroke-width: 5;
		stroke-opacity: 0.5;
	}
}

.reset-button {
	width: 30px;
	height: 30px;
	border-radius: 50%;
	background-color: rgba(44, 55, 83, 0.85);
	border: 1px solid rgb(72, 90, 132);
	position: absolute;
	right: 24px;
	top: 0;
	bottom: 0;
	margin: auto;
	display: flex;
	justify-content: center;
	align-items: center;
}
</style>
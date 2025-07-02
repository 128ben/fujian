let lastExecutionTime = 0; // 记录上次推送的时间戳

export function throttle(fn, interval) {
	return function(...args) {
		const now = Date.now();
		if (now - lastExecutionTime >= interval) {
			fn.apply(this, args);
			lastExecutionTime = now;
		}
	};
}
/**
 * 将时间戳转换为“几点几分几秒”的格式
 * @param {number} timestamp - 时间戳（以毫秒为单位）
 * @returns {string} 格式化后的时间字符串
 */
export function formatTimestamp1(timestamp) {
	// 创建 Date 对象
	const date = new Date(timestamp);

	// 提取小时、分钟和秒
	const hours = date.getHours();
	const minutes = date.getMinutes();
	const seconds = date.getSeconds();

	// 格式化输出（带前导零）
	const formatTimeUnit = (unit) => unit.toString().padStart(2, '0');

	const formattedHours = formatTimeUnit(hours);
	const formattedMinutes = formatTimeUnit(minutes);
	const formattedSeconds = formatTimeUnit(seconds);

	return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

/**
 * 将时间戳转换为“yyyy-MM-dd HH:mm:ss”的格式
 * @param {number} timestamp - 时间戳（以毫秒为单位）
 * @returns {string} 格式化后的时间字符串
 */
export function formatTimestamp(timestamp) {
	// 创建 Date 对象
	const date = new Date(timestamp);

	// 提取年、月、日、小时、分钟和秒
	const year = date.getFullYear();
	const month = date.getMonth() + 1; // 月份从0开始
	const day = date.getDate();
	const hours = date.getHours();
	const minutes = date.getMinutes();
	const seconds = date.getSeconds();

	// 格式化输出（带前导零）
	const formatTimeUnit = (unit) => unit.toString().padStart(2, '0');
	const formattedMonth = formatTimeUnit(month);
	const formattedDay = formatTimeUnit(day);
	const formattedHours = formatTimeUnit(hours);
	const formattedMinutes = formatTimeUnit(minutes);
	const formattedSeconds = formatTimeUnit(seconds);

	return `${year}-${formattedMonth}-${formattedDay} ${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}
/**
 * 将秒数转换为分钟和秒的格式
 * @param {number} seconds - 总秒数
 * @returns {string} 格式化后的时间字符串
 */
export function convertSecondsToMinutes(seconds) {
	// 计算分钟和秒
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;

	// 格式化输出（确保分钟和秒都为两位数）
	const formatTimeUnit = (unit) => unit.toString().padStart(2, '0');

	return `${formatTimeUnit(minutes)}:${formatTimeUnit(remainingSeconds)}`;
}
/**
 * 生成一个随机布尔值，根据给定的概率返回 true 或 false。
 * 
 * @param {number} trueProbability - true 的出现概率，范围在 0 到 1 之间。
 * @return {boolean} - 根据给定概率生成的随机布尔值。
 */
export function randomBoolean(trueProbability) {
	// 确保 trueProbability 在 0 到 1 之间
	if (trueProbability < 0 || trueProbability > 1) {
		throw new Error('trueProbability must be between 0 and 1');
	}

	// 生成一个 0 到 1 之间的随机数，并与 trueProbability 比较
	return Math.random() < trueProbability;
}
/**
 * 生成一个 1 到 5000 之间的随机数，并根据给定的概率控制小于 1000 和大于等于 1000 的出现几率。
 * 
 * @param {number} below1000Probability - 小于 1000 的概率，范围在 0 到 1 之间。
 * @return {number} - 根据给定概率生成的随机数。
 */
export function randomNumberWithBias(below1000Probability) {
	// 确保 below1000Probability 在 0 到 1 之间
	if (below1000Probability < 0 || below1000Probability > 1) {
		throw new Error('below1000Probability must be between 0 and 1');
	}

	// 随机决定生成的数是否小于 1000
	if (Math.random() < below1000Probability) {
		// 生成一个 1 到 999 之间的随机数
		return Math.floor(Math.random() * 999) + 1;
	} else {
		// 生成一个 1000 到 5000 之间的随机数
		return Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000;
	}
}
/**
 * 查找距离给定时间戳最近的时间戳对应的值。
 * 
 * @param {Array<Array<number>>} data - 二维数组，每项包含时间戳和对应的值。
 * @param {number} targetTimestamp - 目标时间戳。
 * @return {number} - 距离目标时间戳最近的时间戳对应的值。
 */
export function getNearestValue(data, targetTimestamp) {
    if (data.length === 0) throw new Error("数据数组不能为空");

    let closestValue = null;
	let times = null
    let closestDiff = Infinity;

    for (const [timestamp, value] of data) {
        const diff = Math.abs(timestamp - targetTimestamp);
        if (diff < closestDiff) {
            closestDiff = diff;
            closestValue = value;
			times = timestamp
        }
    }

    return [times,closestValue];
}
/**
 * 查找距离给定时间戳最近的、且小于或等于目标时间戳的时间戳对应的开盘价、收盘价、最低价和最高价，
 * 并根据给定的价格返回相关值。
 * 
 * @param {Array<Array<number>>} data - 二维数组，每项包含[时间戳, 开盘价, 收盘价, 最低价, 最高价]。
 * @param {number} targetTimestamp - 目标时间戳。
 * @param {number} price - 给定的价格。
 * @return {[number, number] | null} - 符合条件的时间戳和相应的价格。如果没有找到，返回 null。
 */
export function getNearestValue2(data, targetTimestamp, price) {
    if (data.length === 0) throw new Error("数据数组不能为空");

    let closestTimestamp = null;
    let closestOpenPrice = null;
    let closestClosePrice = null;
    let closestLowPrice = null;
    let closestHighPrice = null;

    for (const [timestamp, openPrice, closePrice, lowPrice, highPrice] of data) {
        if (timestamp <= targetTimestamp) {
            if (closestTimestamp === null || timestamp > closestTimestamp) {
                closestTimestamp = timestamp;
                closestOpenPrice = openPrice;
                closestClosePrice = closePrice;
                closestLowPrice = lowPrice;
                closestHighPrice = highPrice;
            }
        }
    }

    if (closestTimestamp === null) return null;

    let finalPrice;
    if (price < closestLowPrice || price > closestHighPrice) {
        // 根据价格和最高、最低价的距离选择最接近的
        const lowDiff = Math.abs(price - closestLowPrice);
        const highDiff = Math.abs(price - closestHighPrice);
        finalPrice = lowDiff < highDiff ? closestLowPrice : closestHighPrice;
    } else {
        finalPrice = price;
    }

    return [closestTimestamp, finalPrice];
}




/**
 * 查找距离给定时间戳最近的时间戳在二维数组中的下标。
 * 
 * @param {Array<Array<number>>} data - 二维数组，每项包含时间戳和对应的值。
 * @param {number} targetTimestamp - 目标时间戳。
 * @return {number} - 距离目标时间戳最近的时间戳在数组中的下标。
 */
export function getNearestIndex(data, targetTimestamp) {
    if (data.length === 0) throw new Error("数据数组不能为空");

    let closestIndex = -1;
    let closestDiff = Infinity;

    for (let i = 0; i < data.length; i++) {
        const [timestamp] = data[i];
        const diff = Math.abs(timestamp - targetTimestamp);
        if (diff < closestDiff) {
            closestDiff = diff;
            closestIndex = i;
        }
    }

    return closestIndex;
}
/**
 * 从数组末尾向前遍历，找到第一个比给定值大的元素的下标。
 * 
 * @param {number[]} arr - 需要查找的数组。
 * @param {number} value - 要比较的值。
 * @return {number} - 第一个比给定值大的元素的下标，如果没有找到则返回 -1。
 */
export function findIndexOfFirstGreaterThan(arr, value) {
    // 从数组末尾向前遍历
    for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i] < value) {
            return i+1; // 返回第一个比给定值大的元素的下标
        }
    }
    return -1; // 如果没有找到，则返回 -1
}
export function removeElementsFromIndex(arr, startIndex) {
    if (startIndex >= 0 && startIndex < arr.length) {
        arr.splice(startIndex, arr.length - startIndex);
    }
    return arr;
}
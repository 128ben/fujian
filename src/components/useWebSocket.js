import { ref, onBeforeUnmount } from 'vue';

export function useWebSocket(url, token, upDataMessage) {
    var limitConnect = 30;  // 断线重连次数
    var timeConnect = 0;
    const socket = ref(null);
    const messages = ref([]);
    const isConnected = ref(false); // 连接状态
    let reconnectInterval = null; // 用于存储重连定时器的引用
    const reconnectDelay = 2000; // 重连延迟时间（毫秒）
    let isManualClose = false; // 标志是否是手动关闭

    const startWebSocket = () => {
        const fullUrl = `${url}?token=${token}`;
        socket.value = new WebSocket(fullUrl);

        socket.value.onopen = () => {
            isConnected.value = true; // 更新连接状态
            console.log('WebSocket 连接成功。');
            // clearInterval(reconnectInterval); // 清除重连定时器
            isManualClose = false; // 重置手动关闭标志
        };

        socket.value.onmessage = (event) => {
            messages.value.push(event.data);
            upDataMessage(event.data);
        };

        socket.value.onerror = (error) => {
            console.error('WebSocket 错误：', error);
        };

        socket.value.onclose = (event) => {
            isConnected.value = false; // 更新连接状态
            console.log('WebSocket 连接已关闭。');

            // 判断关闭原因，如果是正常关闭则不重连
            if (!isManualClose) {
                console.log('尝试重连...');
                attemptReconnect(); // 尝试重连
            }
        };
    };

    const attemptReconnect = () => {
        if (!isConnected.value) {
            if (limitConnect > 0) {
                limitConnect--;
                timeConnect++;
                console.log("第" + timeConnect + "次重连");
                // 进行重连
                setTimeout(() => {
                    startWebSocket();
                }, 2000);
            }else{
                console.log("TCP连接已超时");
            }
            // reconnectInterval = setInterval(() => {
            //     console.log('正在重连...');
            //     startWebSocket(); // 尝试重连
            // }, reconnectDelay);
        }
    };

    const sendMessage = (message) => {
        if (isConnected.value && socket.value) {
            socket.value.send(message);
        } else {
            console.error('WebSocket 未连接。');
        }
    };

    const closeWebSocket = () => {
        if (socket.value) {
            isManualClose = true; // 设置为手动关闭
            socket.value.close();
            // clearInterval(reconnectInterval); // 清除重连定时器
            console.log('WebSocket 连接已手动关闭。');
        }
    };

    onBeforeUnmount(() => {
        closeWebSocket();
    });

    return {
        messages,
        isConnected,
        sendMessage,
        startWebSocket, // 确保返回这个方法
    };
}
// WebSocketClient.js

class WebSocketClient {
  constructor(url,isHeartbeat = false, heartbeatInterval = 30000, heartbeatMessage = 'ping') {
    this.url = url;
    this.websocket = null;
	this.isHeartbeat = isHeartbeat// 是否心跳
    this.heartbeatInterval = heartbeatInterval; // 心跳间隔时间（毫秒）
    this.heartbeatMessage = heartbeatMessage; // 发送的心跳消息
    this.eventHandlers = {
      open: [],
      message: [],
      close: [],
      error: []
    };
    this.heartbeatTimer = null; // 心跳定时器
  }

  // 初始化 WebSocket 连接
  connect() {
    if (this.websocket) {
      // console.warn('WebSocket 已连接。');
      return;
    }

    this.websocket = new WebSocket(this.url);

    this.websocket.onopen = () => {
      // console.log('WebSocket 连接已打开。');
      this.eventHandlers.open.forEach(handler => handler());
	  if(this.isHeartbeat){
		  this.startHeartbeat(); // 启动心跳
	  }
    };

    this.websocket.onmessage = (event) => {
      // console.log('WebSocket 收到消息:', event.data);
      this.eventHandlers.message.forEach(handler => handler(event.data));
    };

    this.websocket.onclose = (event) => {
      console.log('WebSocket 连接已关闭:', event.reason);
      this.eventHandlers.close.forEach(handler => handler(event));
      this.websocket = null;
      this.stopHeartbeat(); // 停止心跳
    };

    this.websocket.onerror = (error) => {
      // console.error('WebSocket 错误:', error);
      this.eventHandlers.error.forEach(handler => handler(error));
    };
  }

  // 发送心跳消息
  sendHeartbeat() {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(this.heartbeatMessage);
      // console.log('发送心跳消息:', this.heartbeatMessage);
    }
  }

  // 启动心跳
  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => this.sendHeartbeat(), this.heartbeatInterval);
  }

  // 停止心跳
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // 发送消息
  send(message) {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(message);
      // console.log('WebSocket 消息已发送:', message);
    } else {
      console.error('WebSocket 尚未打开，无法发送消息。');
    }
  }

  // 添加事件监听器
  on(event, handler) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].push(handler);
    } else {
      console.error('无效的事件类型:', event);
    }
  }

  // 关闭连接
  disconnect() {
    if (this.websocket) {
      this.websocket.close();
    }
  }
}

// 导出 WebSocketClient 类
export default WebSocketClient;

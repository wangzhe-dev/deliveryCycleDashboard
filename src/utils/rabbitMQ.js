/*
 * @Author: zhaijs
 * @Date: 2023-04-12 09:16:43
 * @LastEditTime: 2024-09-05 17:24:26
 * @Description: stomp封装
 */
import { Client } from '@stomp/stompjs';
import { wsProtocol } from '@/utils/utils';
const MQTT_SERVICE = wsProtocol() + import.meta.env.VITE_APP_MQTT_SERVICE;

const MQTT_USERNAME = import.meta.env.VITE_APP_MQTT_USERNAME;
const MQTT_PASSWORD = import.meta.env.VITE_APP_MQTT_PASSWORD;
const MQTT_EXCHANGE = import.meta.env.VITE_APP_MQTT_EXCHANGE;
export default class RabbitMQ {
  constructor({
    url = MQTT_SERVICE,
    username = MQTT_USERNAME,
    password = MQTT_PASSWORD,
    queue = MQTT_EXCHANGE,
    reconnectDelay = 5000,
    onMessage,
  }) {
    // 初始化RabbitMQ连接所需的参数
    const flag = import.meta.env.VITE_APP_ENV === 'development';
    this.url = flag ? 'ws://172.30.20.119:15672/rmq/ws' : url;
    this.username = username;
    this.password = password;
    this.queue = queue;
    this.onMessage = onMessage;
    this.reconnectDelay = reconnectDelay;

    // 初始化客户端对象和连接状态
    this.client = null;
    this.connected = false;
  }

  formatMsg(message) {
    if (!message.body) return;
    if (message.body.indexOf('data') === -1) return;
    let data = JSON.parse(message.body);
    this.onMessage(data);
  }

  connect() {
    // 如果已连接，则直接返回
    if (this.connected) return;
    // 创建客户端对象
    this.client = new Client({
      brokerURL: this.url, // RabbitMQ的连接URL
      connectHeaders: {
        login: this.username, // 用户名
        passcode: this.password, // 密码
      },
      debug: () => null,
      reconnectDelay: this.reconnectDelay, // 重连延迟
      heartbeatIncoming: 0, // 心跳检测频率
      heartbeatOutgoing: 10000, // 心跳检测频率
    });

    // 连接成功的回调函数
    this.client.onConnect = (frame) => {
      // console.log('Connected to RabbitMQ: ' + frame);
      // 订阅指定的队列
      this.client.subscribe(this.queue, (v) => this.formatMsg(v));
      // 修改连接状态
      this.connected = true;
    };

    // 连接错误的回调函数
    this.client.onStompError = (frame) => {
      console.log('Broker reported error: ' + frame.headers['message']);
      console.log('Additional details: ' + frame.body);
    };

    // 激活客户端对象，连接RabbitMQ
    this.client.activate();
  }

  disconnect() {
    // 如果未连接，则直接返回
    if (!this.connected) return;

    // 断开与RabbitMQ的连接
    this.client.deactivate();
    // 清空客户端对象
    this.client = null;
    // 修改连接状态
    this.connected = false;
    console.log('Disconnected from RabbitMQ');
  }

  send(message) {
    // 如果未连接，则直接返回
    if (!this.connected) return;

    // 创建消息对象
    const msg = JSON.stringify(message);
    // 发送消息到指定队列
    this.client.publish({ destination: this.queue, body: msg.body });
  }
}

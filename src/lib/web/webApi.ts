/**
 * Web API 适配层 - 替代 Tauri API
 * 将原本调用 Tauri invoke 的接口改为使用 Web API
 */

import type {
  CanLoadSnapshot,
  ConnectionState,
  DecoderBlock,
  FrameDecoderManualResult,
  InputFormat,
  PortInfo,
  ProtocolConfig,
  TransportConfig,
  TransportStats,
  WidgetBinding,
  WaveformWindow,
} from '../../types';
import type { NodeDef, GraphEdge } from '../utils/nodeDef';
import { WebSerialTransport, type SerialOptions } from './webSerial';
import { WebSocketTransport, type WebSocketTransportConfig } from './webWebSocket';

/// 数据管道性能配置
export interface PipelineConfig {
  coalesce_max_msgs: number;
  coalesce_max_bytes_kb: number;
  max_feed_workers: number;
  feed_parallel_unit: number;
  min_worker_bytes_kb: number;
  max_stream_shards: number;
  parse_channel_cap: number;
}

/**
 * Web 端 API 实现
 * 替代原有的 Tauri invoke 调用
 */
export class WebApi {
  private serialTransport: WebSerialTransport | null = null;
  private wsTransport: WebSocketTransport | null = null;
  private protocolConfig: ProtocolConfig | null = null;
  private transportConfig: TransportConfig | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private stats: TransportStats = {
    rxBytes: 0,
    txBytes: 0,
    rxFrames: 0,
    txFrames: 0,
  };

  // ===== 传输 =====

  async listPorts(): Promise<PortInfo[]> {
    // Web Serial API 需要用户主动请求，这里返回空数组
    // 实际使用时应调用 requestSerialPort
    return [];
  }

  async openTransport(config: TransportConfig): Promise<void> {
    this.transportConfig = config;
    
    if (config.type === 'serial') {
      if (!this.serialTransport) {
        this.serialTransport = new WebSerialTransport();
      }

      // 请求用户选择端口
      const port = await this.serialTransport.requestPort();
      if (!port) {
        throw new Error('No port selected');
      }

      // 打开串口
      const options: SerialOptions = {
        baudRate: config.serialBaudrate || 115200,
        dataBits: config.serialDataBits as 8 | 7 | 6 | undefined,
        stopBits: config.serialStopBits as 1 | 2 | undefined,
        parity: config.serialParity as 'none' | 'even' | 'odd' | undefined,
        flowControl: config.serialFlowControl === 'hardware' ? 'hardware' : 'none',
      };

      await this.serialTransport.open(options);
      
      // 设置数据接收回调
      this.serialTransport.onDataReceived = (data) => {
        this.stats.rxBytes += data.length;
        // TODO: 触发协议解析和数据推送
      };

      this.serialTransport.onError = (error) => {
        console.error('Serial error:', error);
        this.connectionState = 'disconnected';
      };

      this.serialTransport.onDisconnect = () => {
        this.connectionState = 'disconnected';
      };

      this.connectionState = 'connected';
    } else if (config.type === 'tcpClient' || config.type === 'tcpServer' || config.type === 'udp') {
      // 使用 WebSocket 连接到后端代理服务
      if (!this.wsTransport) {
        this.wsTransport = new WebSocketTransport();
        
        // 设置回调
        this.wsTransport.onConnected = () => {
          this.connectionState = 'connected';
        };
        
        this.wsTransport.onDisconnected = (reason) => {
          console.log('WebSocket disconnected:', reason);
          this.connectionState = 'disconnected';
        };
        
        this.wsTransport.onDataReceived = (data) => {
          this.stats.rxBytes += data.length;
          // TODO: 触发协议解析和数据推送
        };
        
        this.wsTransport.onError = (error) => {
          console.error('WebSocket error:', error);
          this.connectionState = 'disconnected';
        };
      }
      
      // 构建 WebSocket URL
      // 注意：这里需要后端提供 WebSocket 代理服务
      // 例如：ws://localhost:8080/ws?transport=tcp&host=192.168.1.100&port=8080
      const wsUrl = this.buildWebSocketUrl(config);
      await this.wsTransport.connect({ url: wsUrl });
      
    } else if (config.type === 'testData') {
      // TODO: 实现测试数据生成器
      this.connectionState = 'connected';
    } else if (config.type === 'slcan' || config.type === 'candleLight') {
      throw new Error(`${config.type} transport requires native backend`);
    }
  }
  
  /**
   * 构建 WebSocket URL
   * 将 TransportConfig 转换为 WebSocket 连接参数
   */
  private buildWebSocketUrl(config: TransportConfig): string {
    // 默认连接到本地代理服务器
    const baseUrl = process.env.VITE_WS_PROXY_URL || 'ws://localhost:8080/ws';
    const params = new URLSearchParams();
    
    params.set('transport', config.type);
    
    if (config.type === 'tcpClient' || config.type === 'tcpServer') {
      if (config.tcpHost) params.set('host', config.tcpHost);
      if (config.tcpPort) params.set('port', String(config.tcpPort));
    } else if (config.type === 'udp') {
      if (config.udpHost) params.set('host', config.udpHost);
      if (config.udpPort) params.set('port', String(config.udpPort));
    }
    
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  async closeTransport(): Promise<void> {
    if (this.serialTransport) {
      await this.serialTransport.close();
      this.serialTransport = null;
    }
    if (this.wsTransport) {
      await this.wsTransport.close();
      this.wsTransport = null;
    }
    this.connectionState = 'disconnected';
  }

  async sendRaw(data: number[]): Promise<void> {
    if (this.serialTransport) {
      const uint8Array = new Uint8Array(data);
      await this.serialTransport.write(uint8Array);
      this.stats.txBytes += data.length;
      this.stats.txFrames++;
    } else if (this.wsTransport) {
      const uint8Array = new Uint8Array(data);
      await this.wsTransport.send(uint8Array);
      this.stats.txBytes += data.length;
      this.stats.txFrames++;
    } else {
      throw new Error('Transport not open');
    }
  }

  async sendString(text: string): Promise<void> {
    if (this.serialTransport) {
      await this.serialTransport.writeString(text);
      this.stats.txBytes += text.length;
      this.stats.txFrames++;
    } else if (this.wsTransport) {
      await this.wsTransport.sendString(text);
      this.stats.txBytes += text.length;
      this.stats.txFrames++;
    } else {
      throw new Error('Transport not open');
    }
  }

  async sendWidgetValue(binding: WidgetBinding, value: number): Promise<void> {
    // TODO: 根据 binding 发送数据
    console.log('Sending widget value:', binding, value);
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  getStats(): TransportStats {
    return { ...this.stats };
  }

  // ===== 协议 =====

  async setProtocol(config: ProtocolConfig): Promise<void> {
    this.protocolConfig = config;
  }

  async getProtocol(): Promise<ProtocolConfig> {
    if (!this.protocolConfig) {
      throw new Error('Protocol not configured');
    }
    return this.protocolConfig;
  }

  async getDetectedChannels(): Promise<number | null> {
    // Web 端自动检测通道数
    return null;
  }

  // ===== 波形缓冲区 =====

  subscribeWaveform(
    onEvent: (window: WaveformWindow) => void,
    options?: { intervalMs?: number; maxPoints?: number }
  ): { promise: Promise<void>; cancel: () => void } {
    // TODO: 实现波形数据订阅
    console.log('subscribeWaveform called with options:', options);
    
    // 模拟定期推送数据
    const intervalId = setInterval(() => {
      // TODO: 从缓冲区获取数据并推送
      onEvent({ points: [], channels: 0 });
    }, options?.intervalMs || 100);

    return {
      promise: Promise.resolve(),
      cancel: () => clearInterval(intervalId),
    };
  }

  async getRecentWaveform(count: number): Promise<WaveformWindow> {
    // TODO: 从缓冲区获取最近的数据点
    return { points: [], channels: 0 };
  }

  async getWaveformWindow(startMs: number, endMs: number): Promise<WaveformWindow> {
    // TODO: 获取时间窗口内的数据
    return { points: [], channels: 0 };
  }

  async clearBuffer(): Promise<void> {
    // TODO: 清空缓冲区
    console.log('clearBuffer called');
  }

  async setBufferChannels(count: number): Promise<void> {
    // TODO: 设置缓冲区通道数
    console.log('setBufferChannels called:', count);
  }

  async getBufferInfo(): Promise<[number, number]> {
    // TODO: 返回 [通道数，点数]
    return [0, 0];
  }

  async setWaveformBufferCapacity(maxPoints: number): Promise<void> {
    console.log('setWaveformBufferCapacity:', maxPoints);
  }

  async setRawDataBufferCapacity(capacity: number): Promise<void> {
    console.log('setRawDataBufferCapacity:', capacity);
  }

  async setCanBufferCapacity(capacity: number): Promise<void> {
    console.log('setCanBufferCapacity:', capacity);
  }

  async setLogicBufferCapacity(capacity: number): Promise<void> {
    console.log('setLogicBufferCapacity:', capacity);
  }

  // ===== 节点图 =====

  async updateTabGraph(tabId: string, nodes: NodeDef[], edges: GraphEdge[]): Promise<void> {
    // TODO: 更新节点图
    console.log('updateTabGraph:', tabId, nodes, edges);
  }

  async removeTabGraph(tabId: string): Promise<void> {
    console.log('removeTabGraph:', tabId);
  }

  async setInputValue(inputId: string, value: number): Promise<void> {
    console.log('setInputValue:', inputId, value);
  }

  async submitCustomOutput(outputId: string, values: Record<string, number>): Promise<void> {
    console.log('submitCustomOutput:', outputId, values);
  }

  async injectLoopbackBytes(sourceWidgetId: string, data: number[]): Promise<number> {
    console.log('injectLoopbackBytes:', sourceWidgetId, data);
    return 0;
  }

  subscribeGraphOutputs(
    onEvent: (outputs: any) => void,
    options?: { intervalMs?: number }
  ): { promise: Promise<void>; cancel: () => void } {
    console.log('subscribeGraphOutputs');
    return {
      promise: Promise.resolve(),
      cancel: () => {},
    };
  }

  subscribeCustomInputs(onEvent: (inputs: any) => void): { promise: Promise<void>; cancel: () => void } {
    console.log('subscribeCustomInputs');
    return {
      promise: Promise.resolve(),
      cancel: () => {},
    };
  }

  subscribeSpectrum(onEvent: (spectrum: any) => void): { promise: Promise<void>; cancel: () => void } {
    console.log('subscribeSpectrum');
    return {
      promise: Promise.resolve(),
      cancel: () => {},
    };
  }

  unsubscribeGraphOutputs(channelId: number): Promise<void> {
    console.log('unsubscribeGraphOutputs:', channelId);
    return Promise.resolve();
  }

  unsubscribeCustomInputs(channelId: number): Promise<void> {
    console.log('unsubscribeCustomInputs:', channelId);
    return Promise.resolve();
  }

  unsubscribeSpectrum(channelId: number): Promise<void> {
    console.log('unsubscribeSpectrum:', channelId);
    return Promise.resolve();
  }

  unsubscribeWaveform(channelId: number): Promise<void> {
    console.log('unsubscribeWaveform:', channelId);
    return Promise.resolve();
  }

  // ===== CAN =====

  async sendCanFrame(frame: any): Promise<void> {
    console.log('sendCanFrame:', frame);
  }

  subscribeCanFrames(onEvent: (frames: any[]) => void): { promise: Promise<void>; cancel: () => void } {
    console.log('subscribeCanFrames');
    return {
      promise: Promise.resolve(),
      cancel: () => {},
    };
  }

  unsubscribeCanFrames(channelId: number): Promise<void> {
    console.log('unsubscribeCanFrames:', channelId);
    return Promise.resolve();
  }

  async getRecentCanFrames(count: number): Promise<any[]> {
    return [];
  }

  async clearCanBuffer(): Promise<void> {
    console.log('clearCanBuffer');
  }

  async getCanBufferInfo(): Promise<[number, number]> {
    return [0, 0];
  }

  async listCandleDevices(): Promise<any[]> {
    return [];
  }

  // ===== 逻辑分析仪 =====

  subscribeLogicSamples(onEvent: (samples: any[]) => void): { promise: Promise<void>; cancel: () => void } {
    console.log('subscribeLogicSamples');
    return {
      promise: Promise.resolve(),
      cancel: () => {},
    };
  }

  unsubscribeLogicSamples(channelId: number): Promise<void> {
    console.log('unsubscribeLogicSamples:', channelId);
    return Promise.resolve();
  }

  async getRecentLogicSamples(count: number): Promise<any[]> {
    return [];
  }

  async clearLogicBuffer(): Promise<void> {
    console.log('clearLogicBuffer');
  }

  async getLogicBufferInfo(): Promise<[number, number]> {
    return [0, 0];
  }

  subscribeDecodedEvents(onEvent: (events: any[]) => void): { promise: Promise<void>; cancel: () => void } {
    console.log('subscribeDecodedEvents');
    return {
      promise: Promise.resolve(),
      cancel: () => {},
    };
  }

  unsubscribeDecodedEvents(channelId: number): Promise<void> {
    console.log('unsubscribeDecodedEvents:', channelId);
    return Promise.resolve();
  }

  async getRecentDecodedEvents(count: number): Promise<any[]> {
    return [];
  }

  async clearDecodedBuffer(): Promise<void> {
    console.log('clearDecodedBuffer');
  }

  async getDecodedBufferInfo(): Promise<[number, number]> {
    return [0, 0];
  }

  // ===== CAN 负载分析 =====

  async getCanLoadStats(bitrateBps?: number | null): Promise<CanLoadSnapshot> {
    return {
      loadPercent: 0,
      framesPerSecond: 0,
      errorsPerSecond: 0,
    };
  }

  async setCanLoadWindow(windowUs: number): Promise<void> {
    console.log('setCanLoadWindow:', windowUs);
  }

  async clearCanLoadStats(): Promise<void> {
    console.log('clearCanLoadStats');
  }

  subscribeCanLoad(
    onEvent: (snap: CanLoadSnapshot) => void,
    options?: { intervalMs?: number; bitrateBps?: number | null }
  ): { promise: Promise<void>; cancel: () => void } {
    console.log('subscribeCanLoad');
    return {
      promise: Promise.resolve(),
      cancel: () => {},
    };
  }

  unsubscribeCanLoad(channelId: number): Promise<void> {
    console.log('unsubscribeCanLoad:', channelId);
    return Promise.resolve();
  }

  async getCurrentCanBitrate(): Promise<[number, string]> {
    return [115200, 'default'];
  }

  async exportCanLoadCsv(bitrateBps?: number | null): Promise<string> {
    return '';
  }

  // ===== 帧解码器 =====

  async parseFrameDecoderInput(
    blocks: DecoderBlock[],
    input: string,
    format: InputFormat,
    enableValid: boolean,
    enableFrameCount: boolean,
    enableLastTimestamp: boolean,
    enableFps: boolean
  ): Promise<FrameDecoderManualResult> {
    return {
      outputs: {},
      valid: false,
      consumedBytes: 0,
    };
  }

  // ===== 调试 =====

  async inspectElement(): Promise<void> {
    console.log('inspectElement');
  }

  // ===== 数据管道配置 =====

  async setPipelineConfig(config: PipelineConfig): Promise<void> {
    console.log('setPipelineConfig:', config);
  }

  async getPipelineConfig(): Promise<PipelineConfig> {
    return {
      coalesce_max_msgs: 100,
      coalesce_max_bytes_kb: 64,
      max_feed_workers: 4,
      feed_parallel_unit: 1024,
      min_worker_bytes_kb: 8,
      max_stream_shards: 4,
      parse_channel_cap: 1000,
    };
  }
}

// 导出单例实例
export const webApi = new WebApi();

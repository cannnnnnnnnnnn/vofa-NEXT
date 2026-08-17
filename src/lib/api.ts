/**
 * 统一 API 入口 - 自动检测运行环境并切换 Tauri/Web 模式
 * 
 * 这个模块提供统一的 API 接口，根据运行环境自动选择使用 Tauri 原生能力
 * 还是 Web 浏览器 API。
 */

import { isWebMode } from './web';
import { webApi } from './web/webApi';

// 延迟导入 Tauri API，避免在 Web 环境中报错
let tauriApi: any = null;

function getTauriApi() {
  if (!tauriApi) {
    tauriApi = require('./tauri/tauri').api;
  }
  return tauriApi;
}

// 导出类型
export type { PipelineConfig } from './tauri/tauri';
export type { PipelineConfig as WebPipelineConfig } from './web/webApi';

// 检测是否在 Web 环境
export { isWebMode, getRuntimeEnvironment, initWebAdapter } from './web';

/**
 * 获取当前环境的 API 实例
 * 在 Tauri 环境中使用原生 API，在 Web 环境中使用浏览器 API
 */
export function getApi() {
  if (isWebMode()) {
    return webApi;
  }
  return getTauriApi();
}

// 导出统一的 API 对象（动态代理）
export const api = new Proxy({} as any, {
  get(_target, prop) {
    const currentApi = getApi();
    return (currentApi as any)[prop];
  },
});

// 直接导出所有 API 方法（保持向后兼容）
export const {
  // 传输
  listPorts,
  openTransport,
  closeTransport,
  sendRaw,
  sendString,
  sendWidgetValue,
  getConnectionState,
  getStats,
  startTestData,
  stopTestData,
  getTestDataState,
  sendAndCapture,
  injectLoopbackBytes,
  
  // 协议
  setProtocol,
  getProtocol,
  getDetectedChannels,
  
  // 波形缓冲区
  subscribeWaveform,
  getRecentWaveform,
  getWaveformWindow,
  clearBuffer,
  setBufferChannels,
  getBufferInfo,
  setWaveformBufferCapacity,
  setRawDataBufferCapacity,
  setCanBufferCapacity,
  setLogicBufferCapacity,
  clearRawDataBuffer,
  
  // 节点图
  updateTabGraph,
  removeTabGraph,
  
  // CAN 负载分析
  getCanLoadStats,
  setCanLoadWindow,
  clearCanLoadStats,
  getCurrentCanBitrate,
  subscribeCanLoad,
  exportCanLoadCsv,
  
  // 帧解码器
  parseFrameDecoderInput,
  
  // 调试
  inspectElement,
  
  // 数据管道配置
  setPipelineConfig,
  getPipelineConfig,
} = /* @__PURE__ */ (() => {
  const currentApi = getApi();
  return {
    listPorts: currentApi.listPorts.bind(currentApi),
    openTransport: currentApi.openTransport.bind(currentApi),
    closeTransport: currentApi.closeTransport.bind(currentApi),
    sendRaw: currentApi.sendRaw?.bind(currentApi) || (() => Promise.reject(new Error('sendRaw not implemented'))),
    sendString: currentApi.sendString?.bind(currentApi) || (() => Promise.reject(new Error('sendString not implemented'))),
    sendWidgetValue: currentApi.sendWidgetValue?.bind(currentApi) || (() => Promise.reject(new Error('sendWidgetValue not implemented'))),
    getConnectionState: currentApi.getConnectionState.bind(currentApi),
    getStats: currentApi.getStats.bind(currentApi),
    startTestData: currentApi.startTestData?.bind(currentApi) || (() => Promise.reject(new Error('startTestData not implemented in web'))),
    stopTestData: currentApi.stopTestData?.bind(currentApi) || (() => Promise.reject(new Error('stopTestData not implemented in web'))),
    getTestDataState: currentApi.getTestDataState?.bind(currentApi) || (() => Promise.resolve(false)),
    sendAndCapture: currentApi.sendAndCapture?.bind(currentApi) || (() => Promise.reject(new Error('sendAndCapture not implemented in web'))),
    injectLoopbackBytes: currentApi.injectLoopbackBytes.bind(currentApi),
    setProtocol: currentApi.setProtocol.bind(currentApi),
    getProtocol: currentApi.getProtocol.bind(currentApi),
    getDetectedChannels: currentApi.getDetectedChannels.bind(currentApi),
    subscribeWaveform: currentApi.subscribeWaveform.bind(currentApi),
    getRecentWaveform: currentApi.getRecentWaveform.bind(currentApi),
    getWaveformWindow: currentApi.getWaveformWindow.bind(currentApi),
    clearBuffer: currentApi.clearBuffer.bind(currentApi),
    setBufferChannels: currentApi.setBufferChannels.bind(currentApi),
    getBufferInfo: currentApi.getBufferInfo.bind(currentApi),
    setWaveformBufferCapacity: currentApi.setWaveformBufferCapacity.bind(currentApi),
    setRawDataBufferCapacity: currentApi.setRawDataBufferCapacity.bind(currentApi),
    setCanBufferCapacity: currentApi.setCanBufferCapacity.bind(currentApi),
    setLogicBufferCapacity: currentApi.setLogicBufferCapacity.bind(currentApi),
    clearRawDataBuffer: currentApi.clearRawDataBuffer?.bind(currentApi) || (() => Promise.resolve()),
    updateTabGraph: currentApi.updateTabGraph.bind(currentApi),
    removeTabGraph: currentApi.removeTabGraph.bind(currentApi),
    getCanLoadStats: currentApi.getCanLoadStats.bind(currentApi),
    setCanLoadWindow: currentApi.setCanLoadWindow.bind(currentApi),
    clearCanLoadStats: currentApi.clearCanLoadStats.bind(currentApi),
    getCurrentCanBitrate: currentApi.getCurrentCanBitrate.bind(currentApi),
    subscribeCanLoad: currentApi.subscribeCanLoad.bind(currentApi),
    exportCanLoadCsv: currentApi.exportCanLoadCsv.bind(currentApi),
    parseFrameDecoderInput: currentApi.parseFrameDecoderInput.bind(currentApi),
    inspectElement: currentApi.inspectElement?.bind(currentApi) || (() => Promise.resolve()),
    setPipelineConfig: currentApi.setPipelineConfig.bind(currentApi),
    getPipelineConfig: currentApi.getPipelineConfig.bind(currentApi),
  };
})();

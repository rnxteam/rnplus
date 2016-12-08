import ReactNative from 'react-native';

const NativeModules = ReactNative.NativeModules;

function callNativeAPI(namespace, APIName, args) {
  const NativeModule = NativeModules[namespace];
  if (NativeModule) {
    const API = NativeModule[APIName];
    if (API) {
      API.apply(NativeModule, args);
    }
  }
}

const Bridge = {
    // 发送广播
  sendBroadcast(opts) {
    callNativeAPI('QRCTBroadCastManager', 'sendBroadcast', [opts.name, opts.data, opts.projectId || '']);
  },
    // 发送 scheme
  sendScheme(opts, cb = () => {}) {
    callNativeAPI('QRCTJumpHandleManager', 'sendScheme', [opts.url, opts.data, opts.adrToken || '', cb]);
  },
    // 关闭指定 RN VC
  backToReactVC(opts) {
    callNativeAPI('QRCTVCManager', 'backToReactVC', [opts.projectId || RNPlus.defaults.projectId || '', opts.index, opts.adrToken || '', {}]);
  },
    // 关闭当前 RN VC
  closeCurrentVC() {
    callNativeAPI('QRCTVCManager', 'closeCurrentVC', [{}]);
  },
    // 执行 Native 函数
  sendNativeEvents(opts) {
    callNativeAPI('QRCTNativeCallbackManager', 'sendNativeEvents', [opts.id, opts.data || {}]);
  },
    // 打开新的 VC
  openNewVC(opts) {
    callNativeAPI('QRCTVCManager', 'openNewVC', [opts.projectId || RNPlus.defaults.projectId || '', opts.moduleName || RNPlus.defaults.appName, opts.data || {}, opts.adrToken || '', {}]);
  },
    // 关闭安卓透明 Activity
  closeActivityAndroid(adrToken) {
    callNativeAPI('QRCTVCManager', 'closeActivity', [adrToken]);
  },
    // 右滑手势开关
  setSwipeBackEnabled(isEnabled, vcIndex, cb = () => {}) {
    callNativeAPI('QRCTVCManager', 'setSwipeBackEnabled', [isEnabled, vcIndex, cb]);
  },
};

export default Bridge;

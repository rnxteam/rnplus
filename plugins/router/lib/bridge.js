import ReactNative, {
  Platform,
} from 'react-native';
// 引入 rnx 特有模块 `VCManager`，不再支持官版 rn（如需适配官版 rn 请注掉该引用）
const VCManager = require('react-native/Libraries/RNXComponents/libs/Scheme/VCManager.js');

const NativeModules = ReactNative.NativeModules;
const isIOS = Platform.OS === 'ios';

const NOOP = () => {};

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
  sendScheme(scheme) {
    return VCManager.sendScheme(scheme);
  },
  // 回到指定 RN VC
  backToVC(tag) {
    VCManager.backToVC(tag);
  },
  // 关闭当前 RN VC
  closeCurrentVC() {
    VCManager.closeCurrentVC();
  },
  // 执行 Native 函数
  schemeCallBack(callbackId, data) {
    VCManager.schemeCallBack(callbackId, data);
  },
  // 打开新的 VC
  openNewVC(initProps = {}, moduleName = 'naive', callback = NOOP) {
    VCManager.openNewVC(moduleName, initProps, callback);
  },
  // 右滑手势开关
  setSwipeBackEnabled(isEnabled, tag, cb = () => { }) {
    if (isIOS) {
      VCManager.setSwipeBackEnabled(isEnabled, tag, cb);
    }
  },
  // 同步页面
  recordViewHistory(tag, views) {
    VCManager.recordViewHistory(tag, views);
  },
  // 获取页面
  queryViewHistory() {
    return VCManager.queryViewHistory();
  },
};

export default Bridge;

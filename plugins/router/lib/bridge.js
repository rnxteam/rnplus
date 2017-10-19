import ReactNative, {
  Platform,
} from 'react-native';
// 引入 rnx 特有模块 `VCManager`，不再支持官版 rn（如需适配官版 rn 请注掉该引用）
import VCManager from 'react-native/Libraries/RNXComponents/libs/Scheme/VCManager.js';

const NativeModules = ReactNative.NativeModules;
const isIOS = Platform.OS === 'ios';

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
  sendScheme(opts, cb = () => { }) {
    callNativeAPI('QRCTJumpHandleManager', 'sendScheme', [opts.url, opts.data, opts.adrToken || '', cb]);
  },
  // 关闭指定 RN VC
  backToReactVC({
    projectId,
    index,
    callback = () => { },
  }) {
    VCManager.backToReactVC(projectId || RNPlus.defaults.projectId || '', index, callback);
  },
  // 关闭当前 RN VC
  closeCurrentVC() {
    VCManager.closeCurrentVC();
  },
  // 执行 Native 函数
  sendNativeEvents(opts) {
    callNativeAPI('QRCTNativeCallbackManager', 'sendNativeEvents', [opts.id, opts.data || {}]);
  },
  // 打开新的 VC
  openNewVC(opts) {
    callNativeAPI('RNXViewControllerManager', 'openNewVC', [opts.projectId || RNPlus.defaults.projectId || '', opts.moduleName || RNPlus.defaults.appName, opts.data || {}]);
  },
  // 关闭安卓透明 Activity
  closeActivityAndroid(adrToken) {
    callNativeAPI('RNXViewControllerManager', 'closeActivity', [adrToken]);
  },
  // 右滑手势开关
  setSwipeBackEnabled(isEnabled, tag, cb = () => { }) {
    if (isIOS) {
      VCManager.setSwipeBackEnabled(isEnabled, tag, cb);
    }
  },
};

export default Bridge;

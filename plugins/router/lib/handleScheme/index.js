import parseUrl from './parseUrl.js';
import Bridge from '../bridge.js';

/**
 * 分析路径，找出 projectId 和 scheme 类型
 * @param {string} path
 */
function parsePath(path) {
  let projectId;
  let type;

  if (path.includes('/')) {
    const pathArr = path.split('/');
    projectId = pathArr[0];
    type = pathArr[1];
  } else {
    type = path;
  }

  return {
    projectId,
    type,
  };
}

/**
 * 初始数据格式化
 * @param {string} viewOptsStr
 */
function tryToGetViewOpts(viewOptsStr = '') {
  if (!viewOptsStr) {
    return;
  }

  let res;
  const viewOptsDecoded = decodeURIComponent(viewOptsStr);

  try {
    res = JSON.parse(viewOptsDecoded);
  } catch (e) {
    console.warn(e);
  }
  return res;
}

/**
 * scheme 的 backTo 实现
 */
function schemeBackTo(vcs) {
  let res = false;

  if (vcs.length > 0) {
    // 先做简单的，不看具体页面，直接跳去坠近的 VC
    Bridge.backToVC(vcs[vcs.length - 1].tag);
    res = true;
  }

  return res;
}
function handleScheme(json, vcs, Router) {
  const urlData = parseUrl(json.url);
  const pathData = parsePath(urlData.path);
  const type = pathData.type;
  const searchData = urlData.searchData || {};
  const viewName = searchData.view;
  const viewOpts = tryToGetViewOpts(searchData.viewOpts);
  // data 存在，代表成功；data 不存在，代表失败
  let resData = {
    ret: true,
    msg: 'success',
    data: {},
  };
  let hasCallSendNativeEvents = false;

  const initProps = {};
  if (viewName) {
    initProps.initView = viewName;
  }
  if (viewOpts) {
    initProps.initViewOpts = viewOpts;
  }

  if (type === 'biz') {
    // 如果没有 VC，强制开一个
    if (vcs.length === 0) {
      hasCallSendNativeEvents = true;
      Bridge.openNewVC(initProps, searchData.moduleName, data => {
        Bridge.schemeCallBack(json.callbackId, data);
      });
    }

    const onReceiveScheme = RNPlus.defaults.onReceiveScheme;
    if (typeof onReceiveScheme === 'function') {
      onReceiveScheme(urlData);
    }
  } else if (type === 'open') {
    hasCallSendNativeEvents = true;
    Bridge.openNewVC(initProps, searchData.moduleName, data => {
      Bridge.schemeCallBack(json.callbackId, data);
    });
  } else if (type === 'backTo') {
    const backToRes = schemeBackTo(vcs);
    if (!backToRes) {
      resData = {
        ret: false,
        msg: 'backTo_failed',
      };
    }
  } else if (type === 'goto') {
    const backToRes = schemeBackTo(vcs);
    if (!backToRes) {
      Bridge.openNewVC(initProps, searchData.moduleName);
    }
  }

  if (!hasCallSendNativeEvents) {
    Bridge.schemeCallBack(json.callbackId, resData);
  }
}

export default handleScheme;

import React, {
  Component,
  PropTypes,
} from 'react';
import ReactNative, {
  AppState,
  Navigator,
  AppRegistry,
  View,
} from 'react-native';
// import {
//   LogMonitor,
// } from 'react-native/Libraries/RNXComponents/index.js';

import styles from './styles';
import './sceneConfig';
import mixRedux from './mix-redux';
import Bridge from './bridge.js';
import errorHandler from './util/errorHandler.js';

// 埋点方法
// function log(key, data = null) {
  // if (key) {
  //   LogMonitor.sendLog({
  //     risk_level: 0,
  //     entry_key: `app.rnplus.${key}`,
  //     entry_detail: data,
  //   });
  // }
// }
function log() {}

const Router = {};
/**
 * VC 数组，每个 VC 包含一个导航器和一个导航栏
 * @type {Array}
 * @example
 * vcs = [{
 *   nav,     // 导航器
 * }]
 */
const vcs = [];
/**
 * 存放所有页面的容器
 * @type {Object}
 * @example
 * views = {
 *   pageA: {
 *     hasReady,    // 是否 ready 过
 *     Component,   // viewClass
*      em,          // 事件函数处理对象
 *     routerOpts   // 路由插件配置参数
 *     reactView    // render 后的 view element，已废弃
 *   }
 * }
 */
const views = {};
// 是否是 rnx 环境
const isRnx = !!ReactNative.NativeModules.RnxRCTDeviceInfo;

/**
 * 一次性消费
 */
// 暂存 actived 参数
let gActivedParam = {};
// immediatelyResetRouteStack 会触发 onDidFocus
let hasResetResetRouteStack = false;

const NOOP = () => {};

/**
 * 工具类方法
 */
/**
 * 获取当前 VC
 * @return {Object} VC 对象
 */
function getCurrentVC() {
  return vcs[vcs.length - 1];
}
/**
* 获取当前 route
* @return {Route} 当前 route
*/
function getCurrentRoute() {
  const routes = getCurrentVC().nav.getCurrentRoutes();
  return routes[routes.length - 1];
}
/**
 * 获取当前 viewName
 * @return {String} 当前页面名字
 */
function getCurrentViewName() {
  const route = getCurrentRoute();
  return route.name;
}
/**
* 根据页面名字获取页面
* @param  {String} name 页面名字
* @return {View}        页面
*/
function getViewByName(name) {
  const view = views[name];

  if (!view) {
    errorHandler.noView(name);
  }

  return view;
}
/**
 * 获取当前 view
 * @return {Route} 当前 route
 */
function getCurrentView() {
  const viewName = getCurrentViewName();
  return getViewByName(viewName);
}
/**
 * 根据页面名字获取页面所在路由的信息
 * @param  {String} name 页面名字
 * @return {Object}      页面所在路由
 * （route 为路由对象，routeIndex 为所在 routes 的 index，vcIndex 为 routes 所在 vcs 的 index）；
 * 如果没有则返回 null。
 */
function getRouteInfoByName(name) {
  let vcIndex = vcs.length;

  while (vcIndex) {
    vcIndex -= 1;

    const routes = vcs[vcIndex].nav.getCurrentRoutes();
    let routeIndex = routes.length;

    while (routeIndex) {
      routeIndex -= 1;

      const route = routes[routeIndex];
      if (route.name === name) {
        return {
          route,
          routeIndex,
          vcIndex,
        };
      }
    }
  }

  return null;
}
/**
 * 关闭当前 VC
 * @return {[type]} [description]
 */
function closeCurrentVC() {
  Bridge.closeCurrentVC();
}
/**
 * 设置返回手势开关
 * @param {Boolean} isEnabled 开关
 */
function setSwipeBackEnabled(isEnabled, vcIndex) {
  let vcIndexCopy = vcIndex;
  if (vcIndexCopy === undefined) {
    vcIndexCopy = vcs.length - 1;
  }
  Bridge.setSwipeBackEnabled(isEnabled, vcIndexCopy);
}
function checkAndOpenSwipeBack(vcIndex) {
  let vcIndexCopy = vcIndex;
  if (vcIndexCopy === undefined) {
    vcIndexCopy = vcs.length - 1;
  }
  if (vcIndexCopy < 0 || !vcs[vcIndexCopy]) {
    return;
  }
  const routes = vcs[vcIndexCopy].nav.getCurrentRoutes();
  if (routes.length === 1) {
    setSwipeBackEnabled(true);
  }
}

// @redux 给每个页面插入一个 hashKey
// 主要是 android 好像不支持 symbol
function getCurrentHashKey() {
  return getCurrentRoute().hashKey;
}
function getHashKey() {
  return Math.random().toString(32) + +new Date();
}


class NavComp extends Component {
  constructor(props) {
    super(props);

    this.indexName = this.getIndexName();
    this.currentView = null;

    /**
     * 处理应用状态变化
     * todo: 当前逻辑在多 RN VC 环境下可能存在问题
     */
    this.routerOpts = RNPlus.defaults.router || {};
    const onAppStateChange = this.routerOpts.onAppStateChange;
    if (typeof onAppStateChange === 'function') {
      this.onAppStateChange = onAppStateChange.bind(this);
    } else {
      this.onAppStateChange = NOOP.bind(this);
    }

    this.renderScene = this.renderScene.bind(this);
    this.onDidFocus = this.onDidFocus.bind(this);
    this.configureScene = this.configureScene.bind(this);
  }

  componentDidMount() {
    // 处理应用状态变化
    AppState.addEventListener('change', this.onAppStateChange);

    if (this.indexName) {
      const param = getCurrentRoute().opts.param;

      if (isRnx) {
        // 暂存数据
        gActivedParam = param;
      }
    } else {
      errorHandler.noIndexView();
    }
  }
  componentWillUnmount() {
    // 处理应用状态变化
    AppState.removeEventListener('change', this.onAppStateChange);

    const vcIndex = vcs.indexOf(this.vc);

    if (vcIndex > -1) {
      log('vcs', {
        length: vcs.length,
        spliceIndex: vcIndex,
      });
      vcs.splice(vcIndex, 1);
    }

    // 触发前一页面的 deactived
    if (this.currentView) {
      this.currentView.em.trigger('deactived');
    }

    this.currentView = null;
  }

  onDidFocus(router) {
    const currentRouter = router;

    if (hasResetResetRouteStack) {
      hasResetResetRouteStack = false;
      return;
    }
    // 左划返回
    // setTimeout 是因为此时 routes 还没减少
    // setTimeout(() => {
    checkAndOpenSwipeBack();
    // }, 0);

    if (vcs.length < 1) {
      return;
    }

    const prevView = this.currentView;
    this.currentView = getCurrentView();

    const prevRouter = this.currentRouter;
    this.currentRouter = currentRouter;

    // 用户骚微滑动下（没有回退）也会触发，需要防御下
    if (prevRouter !== this.currentRouter) {
      // 触发前一页面的 deactived
      if (prevView) {
        prevView.em.trigger('deactived');
      }

      // 触发当前页面的 ready 如果是第一次来
      if (!router.hasReady) {
        this.currentRouter.hasReady = true;
        this.currentView.em.trigger('ready', gActivedParam || {});
      }

      // 触发当前页面的 actived
      this.currentView.em.trigger('actived', gActivedParam || {});

      // 全局激活处理
      const globalActived = this.routerOpts.actived;
      if (typeof globalActived === 'function') {
        globalActived(this.currentView, gActivedParam);
      }

      gActivedParam = null;
    }
  }

  getIndexName() {
    // 先取 native 指定的首页
    let indexName = this.props.initView;

    if (indexName) {
      // 判断是否注册了
      if (!views[indexName]) {
        // 如果没注册，使用前端指定的首页
        indexName = RNPlus.defaults.indexView;
      }
    } else {
      // 如果 native 没指定，使用前端指定的首页
      indexName = RNPlus.defaults.indexView;
    }

    return indexName;
  }

  configureScene(route) {
    /**
     * PushFromRightNoGestures
     * 动画名字请参考 ./sceneConfig.js 文件
     * @param  {[type]} sceneConfig [description]
     * @return {[type]}             [description]
     */
    function getSceneConfig(sceneConfig) {
      const sceneConfigsType = typeof sceneConfig;

      if (sceneConfigsType === 'string') {
        return Navigator.SceneConfigs[sceneConfig];
      } else if (sceneConfigsType === 'object') {
        return sceneConfig;
      }
      return null;
    }

    let configure;

    if (route.opts && route.opts.sceneConfig) {
      configure = getSceneConfig(route.opts.sceneConfig);
    } else if (route.routerPlugin && route.routerPlugin.sceneConfig) {
      configure = getSceneConfig(route.routerPlugin.sceneConfig);
    } else if (this.routerOpts && this.routerOpts.sceneConfig) {
      configure = getSceneConfig(this.routerOpts.sceneConfig);
    }

    if (!configure) {
      configure = Navigator.SceneConfigs.PushFromRight;
    }

    return configure;
  }

  renderScene(route, navigator) {
    // navigator 存储
    let isNewVC = false;
    // if (this.props.isQRCTDefCreate === true) {
    if (vcs.length > 0) {
      if (navigator !== getCurrentVC().nav) {
        // 如果传入的 navigator 不是当前的，则判定为新开了 VC
        isNewVC = true;
      }
    } else {
      isNewVC = true;
    }
    // }

    if (isNewVC) {
      const vc = {
        nav: navigator,
      };
      this.vc = vc;
      log('vcs', {
        length: vcs.length,
        push: null,
      });
      vcs.push(vc);
    }

    const view = getViewByName(route.name);

    if (view) {
      // @redux 新增 store 页面生成 Provider
      return mixRedux.wrapperView(route, view.Component, getCurrentHashKey);
    }
    return null;
  }

  render() {
    const indexName = this.indexName;
    if (indexName) {
      const indexOpts = {
        param: this.props.param,
      };

      const navigationBar = this.routerOpts.navigationBar || null;
      const moreComponents = this.routerOpts.moreComponents || null;

      const view = getViewByName(indexName);
      // @redux 使用 store 包裹 Navigator
      const navigatorComponent = mixRedux.wrapperNavigator(
        <View
          style={[styles.root, this.routerOpts.rootStyle]}
        >
          <Navigator
            sceneStyle={[styles.scene, this.routerOpts.rootStyle]}
            initialRoute={{
              name: indexName,
              opts: indexOpts,
              routerPlugin: view.Component.routerPlugin,
              hashKey: getHashKey(),
            }}
            configureScene={this.configureScene}
            renderScene={this.renderScene}
            onDidFocus={this.onDidFocus}
            navigationBar={navigationBar}
          />
          { moreComponents }
        </View>
      );

      return navigatorComponent;
    }

    errorHandler.noIndexView();
    return null;
  }
}

NavComp.propTypes = {
  initView: PropTypes.string,
  /* eslint-disable */
  param: PropTypes.object,
  /* eslint-enable */
};
NavComp.defaultProps = {
  initView: null,
  param: {},
};

// 这边匿名没有用箭头函数是为了保证 this 正确
RNPlus.addPlugin('router', function (context, pOpts = {}, isView) {
  if (!isView) {
    return;
  }

  let name;
  let view = {};

  // 寻找 view
  Object.keys(views).some((key) => {
    const viewForKey = views[key];
    if (context.constructor === viewForKey.Component ||
            context.constructor === viewForKey.Component.WrappedComponent) {
      name = key;
      view = viewForKey;
      return true;
    }
    return false;
  });

  if (!view) {
    return;
  }
  // 获取事件函数处理对象
  view.em = this;
  // 获取页面内 Router 插件配置参数
  view.routerOpts = pOpts;

  // 获取 view element
  // this.on('beforeComponentWillMount', (reactView) => {
  //   view.reactView = reactView;
  // });

  // 适配 React.RNPlus-Redux
  const routeInfo = getRouteInfoByName(name);
  let routerParam = {};
  if (routeInfo) {
    const route = routeInfo.route;
    if (route.opts && route.opts.param) {
      routerParam = route.opts.param;
    }
  }

  // @redux 将 routerParam 插入到 context 中, 令子组件调用
  mixRedux.setChildContext(context, routerParam);
}, () => {
  /**
   * Router 初始化操作
   */
  const appName = RNPlus.defaults.appName;
  if (appName) {
    AppRegistry.registerComponent(appName, () => NavComp);
  } else {
    errorHandler.noAppName();
  }
}, (comp, isView, plugins, className) => {
    // 获取 Component
  if (isView) {
    if (!RNPlus.defaults.indexView && className.indexOf('_rnplus_') !== 0) {
      RNPlus.defaults.indexView = className;
    }
    views[className] = {
      Component: comp,
    };
  }
});


/**
 * Router API
 */
/**
 * [API] open
 * @param  {String} name 页面名字
 * @param  {Object} opts 参数
 * @return {Boolean} 执行结果（true为成功 ，false 为失败）
 */
Router.open = (name, opts = {}) => {
  const nextView = getViewByName(name);
  let res = false;

  if (nextView) {
    const vc = getCurrentVC();

    if (!vc) {
      log('vcs', {
        length: vcs.length,
        isCurrentVCUndefined: true,
      });
      return res;
    }

    const { nav } = vc;

    const method = opts.replace ? 'replace' : 'push';

    gActivedParam = opts.param;

    nav[method]({
      name,
      opts,
      routerPlugin: nextView.Component.routerPlugin,
      hashKey: getHashKey(),
    });

    setSwipeBackEnabled(false);

    res = true;
  }

  return res;
};

/**
 * [API] back
 * @param  {String} name 页面名字
 * @param  {Object} opts 参数
 * @return {Boolean} 执行结果（true 为成功 ，false 为失败）
 */
Router.back = (opts = {}) => {
  const { nav } = getCurrentVC();
  const routes = nav.getCurrentRoutes();
  let res = false;

  if (routes.length > 1) {
    // 如果当前 routes 有超过一个路由，说明在当前 VC 回退
    gActivedParam = opts.param;
    nav.pop();
    checkAndOpenSwipeBack();

    res = true;
  } else if (vcs.length > 1) {
    // 如果当前 routes 只有一个路由，说明要关闭当前 VC 了
    gActivedParam = opts.param;
    closeCurrentVC();
    res = true;
  }

  return res;
};

/**
 * [API] backTo
 * @param  {String} name 页面名字
 * @param  {Object} opts 参数
 * @param  {Object} _fromGoto 来自内部方法 Router.goto 的标志
 * @return {Boolean} 执行结果（true 为成功 ，false 为失败）
 */
Router.backTo = (name, opts = {}, _fromGoto) => {
  const nextRouteInfo = getRouteInfoByName(name);
  const nextView = getViewByName(name);
  let res = false;

  if (nextView) {
    if (nextRouteInfo) {
      const { route, vcIndex } = nextRouteInfo;
      const { nav } = vcs[vcIndex];

      gActivedParam = opts.param;
      // MAIN: 调用原生 API，路由回退
      nav.popToRoute(route);

      // QReact
      if (vcIndex < vcs.length - 1) {
        // 暂存数据
        // 通知 Native
        log('backToReactVC', {
          index: vcIndex,
          api: 'BackTo',
          vcsLen: vcs.length,
        });
        Bridge.backToReactVC({
          // VC 标识
          index: vcIndex,
        });
      }

      checkAndOpenSwipeBack(vcIndex);

      res = true;
    } else if (_fromGoto !== true) {
      errorHandler.noRoute(name);
    }
  }
  return res;
};

/**
 * [API] goto
 * @param  {String} name 页面名字
 * @param  {Object} opts 参数
 * @return {Boolean} 执行结果（true为成功 ，false 为失败）
 */
Router.goto = (name, opts = {}) => {
  let res = Router.backTo(name, opts, true);

  if (!res) {
    res = Router.open(name, opts);
  }

  return res;
};

/**
 * [API] home
 * @param  {Object} opts 参数
 * @return {Boolean} 执行结果（true为成功 ，false 为失败）
 */
Router.home = (opts = {}) => {
  const vcsLen = vcs.length;

  if (vcsLen > 1) {
    // 暂存数据
    gActivedParam = opts.param;
    // 通知 Native
    log('backToReactVC', {
      index: 0,
      api: 'home',
      vcsLen: vcs.length,
    });
    Bridge.backToReactVC({
      // VC 标识
      index: 0,
    });
  }

  const { nav } = vcs[0];
  const routes = nav.getCurrentRoutes();

  if (vcsLen === 1 && routes.length === 1) {
    errorHandler.warn('当前就是历史第一页');
    return false;
  }

  nav.popToTop();
  setSwipeBackEnabled(true, 0);

  return true;
};

/**
 * [API] close
 * @param  {String} name 页面名字
 * @return {Boolean} 执行结果（true为成功 ，false 为失败）
 */
Router.close = (name) => {
  if (!name) {
    return Router.back();
  }

  const theRouteInfo = getRouteInfoByName(name);
  const theView = getViewByName(name);
  let res = false;

  if (theView) {
    if (theRouteInfo) {
      const { routeIndex, vcIndex } = theRouteInfo;
      const nav = vcs[vcIndex].nav;
      const routes = nav.getCurrentRoutes();

      if (vcIndex === vcs.length - 1 && routeIndex === routes.length - 1) {
        // 如果关闭的是当前页面，则做 back
        res = Router.back();
      } else {
        routes.splice(routeIndex, 1);

        hasResetResetRouteStack = true;
        nav.immediatelyResetRouteStack(routes);

        checkAndOpenSwipeBack(vcIndex);

        res = true;
      }
    } else {
      errorHandler.noRoute(name);
    }
  }

  return res;
};
/**
 * [API] resetTo
 * 跳转到新的场景，并且重置整个路由栈
 * 只能用于单 VC 环境！！！
 * @param  {String} name 页面名字
 * @return {Boolean} 执行结果（true为成功 ，false 为失败）
 */
Router.resetTo = (name, opts = {}) => {
  const nextView = getViewByName(name);
  let res = false;

  if (nextView) {
    const { nav } = getCurrentVC();

    nav.resetTo({
      name,
      opts,
      routerPlugin: nextView.Component.routerPlugin,
      hashKey: getHashKey(),
    });

    setSwipeBackEnabled(false);

    gActivedParam = opts.param;

    res = true;
  }

  return res;
};
/**
 * Native Bridge
 */
ReactNative.DeviceEventEmitter.addListener('rnx_internal_onShow', (index) => {
  // 如果是返回操作，此时 Navigator 的 componentWillUnmount 还未执行，所以 vcs 还未变少
  if (index >= vcs.length || index < 0 || !vcs[index]) {
    return;
  }

  const routes = vcs[index].nav.getCurrentRoutes();
  const routesLen = routes.length;

  // 如果该 vc 没有页面了
  if (routesLen === 0) {
    closeCurrentVC();
    return;
  }

  const route = routes[routesLen - 1];
  const view = getViewByName(route.name);

  view.em.trigger('actived', gActivedParam || {});
  gActivedParam = null;
});
ReactNative.DeviceEventEmitter.addListener('rnx_internal_onHide', (index) => {
  if (index >= vcs.length || index < 0 || !vcs[index]) {
    return;
  }

  const routes = vcs[index].nav.getCurrentRoutes();
  const routesLen = routes.length;

  if (routesLen > 0) {
    const view = getViewByName(routes[routesLen - 1].name);
    view.em.trigger('deactived');
  }
});

ReactNative.DeviceEventEmitter.addListener('rnx_internal_receiveScheme', (res) => {
  /**
   * 解析 url
   * @param  {String} url
   * @return {Object} 解析结果
   */
  function parseUrl(url) {
    const content = url.split('://')[1];

    if (!content) {
      return {
        ret: false,
        url,
        msg: 'url format invalid',
      };
    }

    const contentArr = content.split('?');
    const type = contentArr[0];

    return {
      ret: true,
      url,
      type,
      data: contentArr[1],
    };
  }

  /**
   * 从 url 上获取数据并 合并到 res.data 上
   * (url 的优先级高于 data)
   */
  function combineData(urlData, resData = {}) {
    const data = resData;
    if (urlData) {
      const pairs = urlData.split('&');

      pairs.forEach((pair) => {
        const pairArr = pair.split('=');
        const key = pairArr[0];
        let value = decodeURIComponent(pairArr[1]);

        try {
          value = JSON.parse(value);
        } catch (e) {
          console.warn(e);
        }

        // url 的优先级高于 data
        data[key] = value;
      });
    }

    return data;
  }

  function openVC(data = {}) {
    const openNewVCData = data.initProps || {};

    if (data.initView) {
      openNewVCData.initView = data.initView;
    }

    Bridge.openNewVC({
      data: openNewVCData,
    });

    return true;
  }

  function myBackTo(name, data) {
    if (!name) {
      return false;
    }

    const currentView = getCurrentView();
    const nextRouteInfo = getRouteInfoByName(name);
    const nextView = getViewByName(name);
    let myBackToRes = false;

    if (nextView) {
      if (nextRouteInfo) {
        // 暂存数据
        gActivedParam = (data.initProps && data.initProps.param) || {};

        if (currentView === nextView) {
          log('backToReactVC', {
            index: vcs.length - 1,
            api: 'myBackTo.sameView',
            vcsLen: vcs.length,
          });
          Bridge.backToReactVC({
            // VC 标识
            index: vcs.length - 1,
          });
        } else {
          const { route, routeIndex, vcIndex } = nextRouteInfo;
          const { nav } = vcs[vcIndex];

          // 方法回退识别（与手势回退（右滑）区分）
          route.isBackByFunction = true;

          // MAIN: 调用原生 API，路由回退
          nav.popToRoute(route);
          // VIP: 由于 popToRoute 导致 routes 变化是异步的，Native onShow 触发时最后一个 route 没变，所以这里手动清理下。

          /* eslint-disable */
          nav._cleanScenesPastIndex(routeIndex);
          /* eslint-enable */

          // 通知 Native
          log('backToReactVC', {
            index: vcIndex,
            api: 'myBackTo.differentView',
            vcsLen: vcs.length,
          });
          Bridge.backToReactVC({
            // VC 标识
            index: vcIndex,
          });
        }

        myBackToRes = true;
      }
    }

    return myBackToRes;
  }

  const parsedRes = parseUrl(res.url);

  if (parsedRes.ret) {
    if (parsedRes.type === 'react/biz') {
      const onReceiveScheme = RNPlus.defaults.onReceiveScheme;
      if (typeof onReceiveScheme === 'function') {
        if (vcs.length === 0) {
          openVC();
        }
        onReceiveScheme(parsedRes);
      }
    }

    if (parsedRes.type !== 'react/rnplus') {
      return;
    }
  } else {
    return;
  }

  const data = combineData(parsedRes.data, res.data);

  let ret = false;

  // 如果没有设置 projectId，帮他设置下
  if (!RNPlus.defaults.projectId) {
    RNPlus.defaults.projectId = data.projectId;
  }

  if (data.forceOpen === true) {
    ret = openVC(data);
  } else {
    ret = myBackTo(data.initView, data);

    if (!ret) {
      // 返回失败
      ret = openVC(data);
    }
  }

  if (ret) {
    Bridge.sendNativeEvents({
      id: res.callbackId,
      data: {
        ret,
        msg: '成功',
      },
    });
  } else {
    Bridge.sendNativeEvents({
      id: res.callbackId,
      data: {
        ret,
        msg: '失败',
      },
    });
  }

   // only in android
  Bridge.closeActivityAndroid(res.adrToken);
});


// @redux 强行包裹 Router.open 方法
mixRedux.wrapperRouter(Router);

// 暴露一下
Router.Bridge = Bridge;
Router.views = views;
Router.vcs = vcs;
Router.getCurrentViewName = getCurrentViewName;

RNPlus.Router = Router;

RNPlus.open = Router.open;
RNPlus.back = Router.back;
RNPlus.backTo = Router.backTo;
RNPlus.goto = Router.goto;
RNPlus.home = Router.home;
RNPlus.close = Router.close;
RNPlus.resetTo = Router.resetTo;

export default Router;

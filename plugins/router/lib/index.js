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
import handleScheme from './handleScheme';
import syncViewsToNative from './syncViewsToNative';

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
function log() { }

const Router = {};
/**
 * VC 数组，每个 VC 包含一个导航器和一个导航栏
 * @type {Array}
 * @example
 * vcs = [{
 *   tag: <Number>,        // 标签（native 提供）
 *   nav: <Navigator>,     // 导航器
 * }]
 */
const vcs = [];
/**
 * 存放所有页面的容器
 * @type {Object}
 * @example
 * views = {
 *   pageA: {
 *     Component,   // viewClass
 *     routerOpts   // 路由插件配置参数
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

const NOOP = () => { };

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
* 获取当前 routes
* @return {routes} 当前 routes
*/
function getCurrentRoutes() {
  const currentVC = getCurrentVC();
  if (currentVC && currentVC.nav) {
    return currentVC.nav.getCurrentRoutes();
  }
}
/**
* 获取当前 route
* @return {Route} 当前 route
*/
function getCurrentRoute() {
  const currentVC = getCurrentVC();
  if (currentVC && currentVC.nav) {
    const routes = currentVC.nav.getCurrentRoutes();
    return routes[routes.length - 1];
  }
}

/**
 * 获取当前 viewName
 * @return {String} 当前页面名字
 */
function getCurrentViewName() {
  const route = getCurrentRoute();
  if (route) {
    return route.name;
  }
  return '';
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
  const vc = vcs[vcIndexCopy];
  if (vc) {
    Bridge.setSwipeBackEnabled(isEnabled, vc.tag);
  }
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
    // 如果当前 vc 只有一个页面
    Bridge.queryViewHistory().then(views => {
      let lastVcTag;
      // 检测是否有多个 vc
      const moreThanOne = views.some(view => {
        const currentTag = view.tag;
        if (lastVcTag === undefined) {
          lastVcTag = currentTag;
          return false;
        } else if (lastVcTag === currentTag) {
          return false;
        } else {
          return true;
        }
      });
      if (moreThanOne) {
        // 如果有多个 vc
        setSwipeBackEnabled(true, vcIndexCopy);
      } else {
        setSwipeBackEnabled(false, vcIndexCopy);
      }
    }).catch(() => {});
  } else {
    setSwipeBackEnabled(false, vcIndexCopy);
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
    this.vc = {
      tag: this.props.vcTag,
    };
    this.indexName = this.getIndexName();
    this.currentRoute = null;

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
    this._onDidFocus = this._onDidFocus.bind(this);
    this.configureScene = this.configureScene.bind(this);
  }

  componentWillMount() {
    // 全局根节点 componentWillMount
    const rootComponentWillMount = this.routerOpts.rootComponentWillMount;
    if (typeof rootComponentWillMount === 'function') {
      rootComponentWillMount();
    }
  }
  componentDidMount() {
    // 全局根节点 componentDidMount
    const rootComponentDidMount = this.routerOpts.rootComponentDidMount;
    if (typeof rootComponentDidMount === 'function') {
      rootComponentDidMount();
    }

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
    // 全局根节点 componentWillUnmount
    const rootComponentWillUnmount = this.routerOpts.rootComponentWillUnmount;
    if (typeof rootComponentWillUnmount === 'function') {
      rootComponentWillUnmount();
    }

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
    if (this.currentRoute) {
      this.currentRoute.em.trigger('deactived');
    }

    this.currentRoute = null;

    syncViewsToNative(this.vc);
  }

  onDidFocus(route) {
    // 因为首页的 onDidFocus 和 componentDidMount 同时
    // 而后续页面的 onDidFocus 在动画完成之后
    // 所以为保证一致性，手动延迟
    setTimeout(this._onDidFocus, 0, route);
  }

  _onDidFocus(route) {
    syncViewsToNative(this.vc);

    const currentRoute = route;
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

    const previousRoute = this.currentRoute;

    // 用户骚微滑动下（没有回退）也会触发，需要防御下
    if (previousRoute !== currentRoute) {
      // 如果当前 route 不同于之前 route，说明页面真的切换了，不是骚微动了下
      this.currentRoute = currentRoute;
      // 更新全局当前页面
      Router.currentRoute = currentRoute;

      // 触发前一页面的 deactived
      if (previousRoute) {
        previousRoute.em.trigger('deactived');
      }

      // 触发当前页面的 ready 如果是第一次来
      if (!currentRoute.hasReady) {
        currentRoute.hasReady = true;
        currentRoute.em && currentRoute.em.trigger('ready', gActivedParam || {});
      }

      // 全局激活处理
      const globalActived = this.routerOpts.actived;
      if (typeof globalActived === 'function') {
        globalActived(currentRoute, gActivedParam);
      }
      // 全局失活处理
      const globalDeactived = this.routerOpts.deactived;
      if (previousRoute && typeof globalDeactived === 'function') {
        globalDeactived(previousRoute);
      }

      // 触发当前页面的 actived
      currentRoute.em && currentRoute.em.trigger('actived', gActivedParam || {});

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
    // 处理 VC
    if (!this.vc.nav) {
      this.vc.nav = navigator;
      vcs.push(this.vc);
    }

    // 处理路由
    Router.currentRoute = route;

    // 处理 redux
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
      let opts;
      if (typeof this.props.initViewOpts === 'object') {
        opts = {
          ...this.props.initViewOpts,
        };
      }

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
              opts,
              routerPlugin: view.Component.routerPlugin,
              hashKey: getHashKey(),
            }}
            configureScene={this.configureScene}
            renderScene={this.renderScene}
            onDidFocus={this.onDidFocus}
            navigationBar={navigationBar}
          />
          {moreComponents}
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
  initViewOpts: PropTypes.object,
  /* eslint-enable */
};
NavComp.defaultProps = {
  initView: null,
  initViewOpts: {},
};

// 这边匿名没有用箭头函数是为了保证 this 正确
RNPlus.addPlugin('router', function (context, pOpts = {}, isView) {
  if (!isView || Router.currentRoute.em) {
    // 如果不是 PView
    // 或者当前路由已有 em（防止 PView 套 PView 导致外层 PView 的 em 被内层覆盖）
    return;
  }

  Router.currentRoute.em = this;

  // 适配 RNPlus.Redux
  let routerParam = {};
  if (Router.currentRoute.opts && Router.currentRoute.opts.param) {
    routerParam = Router.currentRoute.opts.param;
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
      hasReady: false,
      em: null,
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
  let res = false;

  const currentVC = getCurrentVC();
  if (currentVC && currentVC.nav) {
    const nav = currentVC.nav;
    const routes = nav.getCurrentRoutes();

    if (routes.length > 1) {
      // 如果当前 routes 有超过一个路由，说明在当前 VC 回退
      gActivedParam = opts.param;
      nav.pop();
      checkAndOpenSwipeBack();

      res = true;
    } else {
      // 如果当前 routes 只有一个路由，说明要关闭当前 VC 了
      // 当有多个 VC 或者在多项目环境下，放心关（和类似C端的项目相对）
      if (vcs.length > 1 || RNPlus.defaults.inMultiProjects) {
        gActivedParam = opts.param;
        closeCurrentVC();
        res = true;
      }
    }
  }

  return res;
};

// 为修复 'Calling popToRoute for a route that doesn\'t exist!' bug，锁
const popToRouteLock = false;

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
      const { route, routeIndex, vcIndex } = nextRouteInfo;
      const { nav } = vcs[vcIndex];

      if (!popToRouteLock) {
        // popToRouteLock = true;

        gActivedParam = opts.param;
        // MAIN: 调用原生 API，路由回退
        nav.popToRoute(route, () => {
          popToRouteLock = false;
        });

        if (vcIndex < vcs.length - 1) {
          // 暂存数据
          // 通知 Native
          log('backToVC', {
            index: vcIndex,
            api: 'BackTo',
            vcsLen: vcs.length,
          });
          Bridge.backToVC({
            // VC 标识
            index: vcIndex,
          });
        }

        checkAndOpenSwipeBack(vcIndex);

        res = true;
      }
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
    log('backToVC', {
      index: 0,
      api: 'home',
      vcsLen: vcs.length,
    });
    Bridge.backToVC({
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

        syncViewsToNative(vcs[vcIndex]).then(() => {
          checkAndOpenSwipeBack(vcIndex);
        });

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
    const currentVC = getCurrentVC();

    if (currentVC && currentVC.nav) {
      currentVC.nav.resetTo({
        name,
        opts,
        routerPlugin: nextView.Component.routerPlugin,
        hashKey: getHashKey(),
      });

      checkAndOpenSwipeBack();

      gActivedParam = opts.param;

      res = true;
    }
  }

  return res;
};
/**
 * Native Bridge
 */
ReactNative.DeviceEventEmitter.addListener('rnx_internal_onShow', (tag) => {
  // if (RNPlus.defaults.shareStore && RNPlus.__store__) {
  //   RNPlus.store.replaceState(RNPlus.__store__);
  // }
  let currentVC;
  vcs.some(vc => {
    if (vc.tag === tag) {
      currentVC = vc;
      return true;
    }
  });

  if (!currentVC) {
    return;
  }

  // 第一次 onShow 就不触发了，和 onDidFocus 重了
  if (!currentVC.hasOnShow) {
    currentVC.hasOnShow = true;
    syncViewsToNative(currentVC).then(() => {
      checkAndOpenSwipeBack(vcs.indexOf(currentVC));
    });
    return;
  }

  const routes = currentVC.nav.getCurrentRoutes();
  const routesLen = routes.length;

  // 如果该 vc 没有页面了
  if (routesLen === 0) {
    closeCurrentVC();
    return;
  }

  checkAndOpenSwipeBack(vcs.indexOf(currentVC));

  if (Router.currentRoute && Router.currentRoute.em) {
    Router.currentRoute.em.trigger('actived', { __onshow: true });
  }
});
ReactNative.DeviceEventEmitter.addListener('rnx_internal_onHide', (tag) => {
  // RNPlus.defaults.shareStore && (RNPlus.__store__ = RNPlus.store.getState());
  let currentVC;
  vcs.some(vc => {
    if (vc.tag === tag) {
      currentVC = vc;
      return true;
    }
  });

  if (!currentVC) {
    return;
  }

  const routes = currentVC.nav.getCurrentRoutes();
  const routesLen = routes.length;

  if (routesLen > 0) {
    if (Router.currentRoute && Router.currentRoute.em) {
      Router.currentRoute.em.trigger('deactived');
    }
  }
});

ReactNative.DeviceEventEmitter.addListener('rnx_internal_receiveScheme', (json) => {
  // console.log('rnx_internal_receiveScheme', json)
  if (RNPlus.defaults.beforeReceiveScheme) {
      RNPlus.defaults.beforeReceiveScheme.run(json).then(() => {
          handleScheme(json, vcs, Router)
      })
  } else {
      handleScheme(json, vcs, Router)
  }
});


// @redux 强行包裹 Router.open 方法
mixRedux.wrapperRouter(Router);

// 暴露一下
Router.Bridge = Bridge;
Router.views = views;
Router.vcs = vcs;
Router.getCurrentViewName = getCurrentViewName;
Router.getCurrentRoutes = getCurrentRoutes;
// 存放当前路由的容器
// 和 this.currentRoute 的区别在于：
// Router.currentRoute 是凌驾与 VC 之上的，总是记录当前呈现的路由
// 而 this.currentRoute 记录的是当前 VC 的当前呈现的路由
Router.currentRoute = null;

Router.closeCurrentVC = closeCurrentVC;

RNPlus.Router = Router;

RNPlus.open = Router.open;
RNPlus.back = Router.back;
RNPlus.backTo = Router.backTo;
RNPlus.goto = Router.goto;
RNPlus.home = Router.home;
RNPlus.close = Router.close;
RNPlus.resetTo = Router.resetTo;

export default Router;

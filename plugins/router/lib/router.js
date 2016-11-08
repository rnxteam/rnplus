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

import mixRedux from './mix-redux';

import Bridge from './bridge.js';
import errorHandler from './util/errorHandler.js';

const Router = {};
/**
 * VC 数组，每个 VC 包含一个导航器和一个导航栏
 * @type {Array}
 * @example
 * vcs = [{
 *     nav,     // 导航器
 * }]
 */
const vcs = [];
/**
 * 存放所有页面的容器
 * @type {Object}
 * @example
 * views = {
 *     pageA: {
 *         Component,   // viewClass
 *         em,          // 事件函数处理对象
 *         routerOpts   // 路由插件配置参数
 *         reactView    // render 后的 view element，已废弃
 *     }
 * }
 */
const views = {};
// 是否是 Qunar React Native
const isQReact = !!ReactNative.NativeModules.QRCTDeviceInfo;
// 暂存 actived 参数
let gActivedParam = {};

// 添加自定义动画
Navigator.SceneConfigs.PushFromRightNoGestures = {
  ...Navigator.SceneConfigs.PushFromRight,
  gestures: {},
};

class NavComp extends Component {
  constructor(props) {
    super(props);

    this.indexName = this.getIndexName();
    this.currentView = getViewByName(this.indexName);

    /**
     * 处理应用状态变化
     * todo: 当前逻辑在多 RN VC 环境下可能存在问题
     */
    const onAppStateChange = RNPlus.defaults.router.onAppStateChange;
    if (typeof onAppStateChange === 'function') {
      this.onAppStateChange = onAppStateChange;
    } else {
      this.onAppStateChange = () => {};
    }

    this.onDidFocus = this.onDidFocus.bind(this);
  }

  componentDidMount() {
    // 处理应用状态变化
    AppState.addEventListener('change', this.onAppStateChange);

    if (this.indexName) {
      const view = getViewByName(this.indexName);
      const param = getCurrentRoute().opts.param;

      if (isQReact) {
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
      vcs.splice(vcIndex, 1);
    }

    // 触发前一页面的 deactived
    if (this.currentView) {
      this.currentView.em.trigger('deactived');
    }

    this.currentView = null;
  }

  getIndexName() {
    // 先取 native 指定的首页
    let indexName = this.props.qInitView;

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
     * 动画种类
     *
     * == 原生动画 ==
     * PushFromRight
     * FloatFromRight
     * FloatFromLeft
     * FloatFromBottom
     * FloatFromBottomAndroid
     * FadeAndroid
     * HorizontalSwipeJump
     * HorizontalSwipeJumpFromRight
     * VerticalUpSwipeJump
     * VerticalDownSwipeJump
     * == RNPlus 动画 ==
     * PushFromRightNoGestures
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
      vcs.push(vc);
    }

    const view = getViewByName(route.name);

    if (view) {
      // @redux 新增 store 页面生成 Provider
      return mixRedux.wrapperView(route, view.Component, getCurrentHashKey);
    }
    return null;
  }

  onDidFocus(route) {
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

    // 触发前一页面的 deactived
    if (prevView) {
      prevView.em.trigger('deactived');
    }
    // 触发当前页面的 actived
    this.currentView.em.trigger('actived', gActivedParam || {});
    gActivedParam = null;
  }

  render() {
    const indexName = this.indexName;
    if (indexName) {
      const indexOpts = {
        param: this.props.param,
      };

      const routerOpts = RNPlus.defaults.router || {};
      let navigationBar = null;
      let moreComponents = null;

      if (routerOpts.navigationBar) {
        navigationBar = routerOpts.navigationBar;
      }
      if (routerOpts.moreComponents) {
        moreComponents = routerOpts.moreComponents;
      }

      const view = getViewByName(indexName);
      // @redux 使用 store 包裹 Navigator
      const navigatorComponent = mixRedux.wrapperNavigator(
        <View style={{ flex: 1 }}>
          <Navigator
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
  qInitView: PropTypes.string,
  param: PropTypes.object,
};
NavComp.defaultProps = {
  qInitView: null,
  param: {},
};

// 这边匿名没有用箭头函数是为了保证 this 正确
RNPlus.addPlugin('router', function (context, pOpts = {}, React, isView) {
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
  //     view.reactView = reactView;
  // });

  // 触发 ready
  this.on('afterComponentWillMount', (reactView) => {
    this.trigger('ready');
  });

  // 触发 destroy
  this.on('afterComponentWillUnmount', (reactView) => {
    this.trigger('destroy');
  });

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
}, (Component, isView, plugins, className) => {
    // 获取 Component
  if (isView) {
    if (!RNPlus.defaults.indexView && className.indexOf('_rnplus_') !== 0) {
      RNPlus.defaults.indexView = className;
    }
    views[className] = { Component };
  }
});


/** ***********************
 * Router API
 ************************/

/**
 * [API] open
 * @param  {String} name 页面名字
 * @param  {Object} opts 参数
 * @return {Boolean} 执行结果（true为成功 ，false 为失败）
 */
Router.open = (name, opts = {}) => {
  const currentView = getCurrentView();
  const nextView = getViewByName(name);
  let res = false;

  if (nextView) {
    const { nav } = getCurrentVC();

    nav.push({
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
 * [API] back
 * @param  {String} name 页面名字
 * @param  {Object} opts 参数
 * @return {Boolean} 执行结果（true 为成功 ，false 为失败）
 */
Router.back = (opts = {}) => {
  const { nav } = getCurrentVC();
  const routes = nav.getCurrentRoutes();
  const currentView = getCurrentView();
  let res = false;

  if (routes.length > 1) {
    // 如果当前 routes 有超过一个路由，说明在当前 VC 回退
    nav.pop();
    checkAndOpenSwipeBack();
    gActivedParam = opts.param;

    res = true;
  } else {
    // 如果当前 routes 只有一个路由，说明要关闭当前 VC 了
    if (vcs.length > 1) {
      closeCurrentVC();
      res = true;
    }
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
  const currentView = getCurrentView();
  const nextRouteInfo = getRouteInfoByName(name);
  const nextView = getViewByName(name);
  let res = false;

  if (nextView) {
    if (nextRouteInfo) {
      const { route, vcIndex } = nextRouteInfo;
      const { nav } = vcs[vcIndex];

      // MAIN: 调用原生 API，路由回退
      nav.popToRoute(route);

      // QReact
      if (vcIndex < vcs.length - 1) {
        // 暂存数据
        gActivedParam = opts.param;
        // 通知 Native
        Bridge.backToReactVC({
          // VC 标识
          index: vcIndex,
          // 可选，安卓透明层标识（只有安卓才有）
          adrToken: '',
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
  const currentView = getCurrentView();
  const vcsLen = vcs.length;

  if (vcsLen > 1) {
    // 暂存数据
    gActivedParam = opts.param;
    // 通知 Native
    Bridge.backToReactVC({
      // VC 标识
      index: 0,
      // 可选，安卓透明层标识（只有安卓才有）
      adrToken: '',
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
      let { routeIndex, vcIndex } = theRouteInfo;
      const nav = vcs[vcIndex].nav;
      const routes = nav.getCurrentRoutes();

      if (vcIndex === vcs.length - 1 && routeIndex === routes.length - 1) {
        // 如果关闭的是当前页面，则做 back
        res = Router.back();
      } else {
        routes.splice(routeIndex, 1);
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

/** ***********************
 * Native Bridge
 ************************/
ReactNative.DeviceEventEmitter.addListener('onShow', (data) => {
  // 如果是返回操作，此时 Navigator 的 componentWillUnmount 还未执行，所以 vcs 还未变少
  const index = data.index;

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
ReactNative.DeviceEventEmitter.addListener('onHide', (data) => {
  const index = data.index;

  if (index >= vcs.length) {
    return;
  }

  const routes = vcs[index].nav.getCurrentRoutes();
  const routesLen = routes.length;

  if (routesLen > 0) {
    const view = getViewByName(routes[routesLen - 1].name);
    view.em.trigger('deactived');
  }
});

ReactNative.DeviceEventEmitter.addListener('receiveScheme', receiveSchemeCB);

function receiveSchemeCB(res) {
  const data = res.data;
  let ret = false;

  mergeDataFromUrl(res.url);

   // 如果没有设置 projectId，帮他设置下
  if (!RNPlus.defaults.projectId) {
    RNPlus.defaults.projectId = data.projectId;
  }

   // 是否需要 rnplus 处理
  if (data.rnplus === false) {
    return;
  }

  if (data.forceOpen === true) {
    openVC();
  } else {
    ret = myBackTo(data.qInitView);

    if (!ret) {
      // 返回失败
      openVC();
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

  function openVC() {
    const openNewVCData = data.initProps || {};

    if (data.qInitView) {
      openNewVCData.qInitView = data.qInitView;
    }

    Bridge.openNewVC({
      data: openNewVCData,
    });

    ret = true;
  }

  function myBackTo(name) {
    if (!name) {
      return false;
    }

    const currentView = getCurrentView();
    const nextRouteInfo = getRouteInfoByName(name);
    const nextView = getViewByName(name);
    let res = false;

    if (nextView) {
      if (nextRouteInfo) {
        // 暂存数据
        gActivedParam = (data.initProps && data.initProps.param) || {};

        if (currentView === nextView) {
          Bridge.backToReactVC({
            // VC 标识
            index: vcs.length - 1,
            // 可选，安卓透明层标识（只有安卓才有）
            adrToken: '',
          });
        } else {
          const { route, routeIndex, vcIndex } = nextRouteInfo;
          const { nav } = vcs[vcIndex];

          // 方法回退识别（与手势回退（右滑）区分）
          route.isBackByFunction = true;

          // MAIN: 调用原生 API，路由回退
          nav.popToRoute(route);
          // VIP: 由于 popToRoute 导致 routes 变化是异步的，Native onShow 触发时最后一个 route 没变，所以这里手动清理下。
          nav._cleanScenesPastIndex(routeIndex);

          // 通知 Native
          Bridge.backToReactVC({
            // VC 标识
            index: vcIndex,
            // 可选，安卓透明层标识（只有安卓才有）
            adrToken: '',
          });
        }

        res = true;
      }
    }

    return res;
  }

  /**
   * 从 url 上获取数据并 合并到 res.data 上
   * @param  {String} url - Scheme 的 url
   */
  function mergeDataFromUrl(url) {
    const search = url.split('?')[1];

    if (search) {
      const pairs = search.split('&');

      pairs.forEach((pair) => {
        const pairArr = pair.split('=');
        const key = pairArr[0];
        let value = decodeURIComponent(pairArr[1]);

        try {
          value = JSON.parse(value);
        } catch (e) {}

        // url 的优先级高于 data
        data[key] = value;
      });
    }
  }
}

/** ***********************
 * 工具类方法
 ************************/
/**
 * 获取当前 VC
 * @return {Object} VC 对象
 */
function getCurrentVC() {
  return vcs[vcs.length - 1];
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
 * 获取当前 view
 * @return {Route} 当前 route
 */
function getCurrentView() {
  const viewName = getCurrentViewName();
  return getViewByName(viewName);
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
 * 根据页面名字获取页面所在路由的信息
 * @param  {String} name 页面名字
 * @return {Object}      页面所在路由（route 为路由对象，routeIndex 为所在 routes 的 index，vcIndex 为 routes 所在 vcs 的 index）,如果没有则返回 null
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
  if (vcIndex === undefined) {
    vcIndex = vcs.length - 1;
  }
  Bridge.setSwipeBackEnabled(isEnabled, vcIndex);
}
function checkAndOpenSwipeBack(vcIndex) {
  if (vcIndex === undefined) {
    vcIndex = vcs.length - 1;
  }
  if (vcIndex < 0 || !vcs[vcIndex]) {
    return;
  }
  const routes = vcs[vcIndex].nav.getCurrentRoutes();
  if (routes.length === 1) {
    setSwipeBackEnabled(true);
  }
}

// @redux 强行包裹 Router.open 方法
mixRedux.wrapperRouter(Router);

// 暴露一下
Router.Bridge = Bridge;
Router._views = views;
Router._vcs = vcs;
Router.getCurrentViewName = getCurrentViewName;

RNPlus.Router = Router;

RNPlus.open = Router.open;
RNPlus.back = Router.back;
RNPlus.backTo = Router.backTo;
RNPlus.goto = Router.goto;
RNPlus.home = Router.home;
RNPlus.close = Router.close;

// @redux 给每个页面插入一个 hashKey
// 主要是 android 好像不支持 symbol
function getCurrentHashKey() {
  return getCurrentRoute().hashKey;
}
function getHashKey() {
  return Math.random().toString(32) + +new Date();
}

export default Router;

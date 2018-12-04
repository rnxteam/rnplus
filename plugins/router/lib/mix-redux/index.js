import React, {
  PropTypes,
} from 'react';
import Provider from './provider';

const { defineStore, usingRedux, invariant } = RNPlus.Redux;

const uniqueStoreSymbol = 'This_view_has_it\'s_own_store.';
const renderedElementSymbol = 'I_don\'t_want_be_rendered_again.';
const onBackPressedSymbol = 'onBackPressed_Already_Override';

// 增加全局 onBackPressed 事件
const getWrappedComponent = (wrappedComponent) => {
  if (wrappedComponent && !wrappedComponent[onBackPressedSymbol]) {
    wrappedComponent[onBackPressedSymbol] = true;
    const { onBackPressed } = wrappedComponent;
    wrappedComponent.onBackPressed = () => {
      const { router } = RNPlus.defaults;
      // 执行全局 onBackPressed
      if (typeof router.onBackPressed === 'function' && router.onBackPressed()) {
        return true;
      }
      if (typeof onBackPressed === 'function') {
        return onBackPressed();
      }
      return false;
    };
  }
};

export default {
  wrapperRouter(Router) {
    const open = Router.open;
    Router.open = (viewName, options = {}) => {
      const [name, openParam] = viewName.split(':');

      invariant(
        !openParam || usingRedux(),
        '在未配置 \'RNPlus.defaults.redux.reducer\' 的情况下不能使用 Router.open(\'view:%s\') 的功能。',
        openParam
      );

      switch (openParam) {
        case 'new':
          options[uniqueStoreSymbol] = true;
          break;
      }
      return open.call(Router, name, options);
    };
  },
  setChildContext(context, routerParam) {
    // 给 view 插入一个 context
    context.constructor.childContextTypes = {
      ...context.constructor.childContextTypes,
      param: PropTypes.object,
    };

    let _originalGetChildContext = context.getChildContext;
    context.getChildContext = () => {
      if(_originalGetChildContext)
        return {
          ..._originalGetChildContext.apply(context),
          param: routerParam,
        }
      else
        return {
          param: routerParam,
        }
    }
  },
  wrapperView(route, Component, getCurrentHashKey) {
    // 缓存渲染过的页面
    let renderedElement = route.opts[renderedElementSymbol];
    if (renderedElement) return renderedElement;

    const param = (route.opts && route.opts.param) || {};
    renderedElement = <Component ref={getWrappedComponent} param={param} />;

    // 如果渲染的页面是当前第一页，且拥有 uniqueStore 标志
    // 渲染 Provider 包裹的 component
    if (usingRedux() &&
      route.opts[uniqueStoreSymbol] &&
      route.hashKey === getCurrentHashKey()) {
      const state = this.__store.getState();
      renderedElement = <Provider store={defineStore(state)}>{ renderedElement }</Provider>;
    }

    route.opts[renderedElementSymbol] = renderedElement;
    return renderedElement;
  },
  wrapperNavigator(navigatorComponent) {
    if (usingRedux()) {
      if (RNPlus.defaults.redux.keepStore) {
        if (!this.__store) {
          this.__store = defineStore();
          RNPlus.store = this.__store;
        }
      } else {
        this.__store = defineStore();
        RNPlus.store = this.__store;
      }
      
      return <Provider store={this.__store}>{ navigatorComponent }</Provider>;
    } else {
      return navigatorComponent;
    }
  },
};

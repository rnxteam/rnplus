import React from 'react';
import ReactNative from 'react-native';

// Const
const TRUE = true;
const FALSE = false;
const NULL = null;
const UNDEFINED = undefined;

const __object__ = Object.prototype;
const __array__ = Array.prototype;
const toString = __object__.toString;
const slice = __array__.slice;

// Variable
const PView = createComponent(TRUE);
const PComponent = createComponent(FALSE);
const defaults = {
  appName: 'naive',
  globalPlugins: [],
};
const RNPlus = { defaults };

const adapters = {};
const viewMap = {};
const initFns = [];
const registerCallbacks = [];

let hasInitFnsDone = false;

// Util

const class2type = {
  '[object HTMLDocument]': 'Document',
  '[object HTMLCollection]': 'NodeList',
  '[object StaticNodeList]': 'NodeList',
  '[object IXMLDOMNodeList]': 'NodeList',
  '[object DOMWindow]': 'Window',
  '[object global]': 'Window',
  'null': 'Null',
  'NaN': 'NaN',
  'undefined': 'Undefined',
};

'Boolean,Number,String,Function,Array,Date,RegExp,Window,Document,Arguments,NodeList,Null,Undefined'
.replace(/\w+/ig, value => class2type[`[object ${value}]`] = value);

const getType = (obj, match) => {
  let rs = class2type[(obj === NULL || obj !== obj) ? obj :
            toString.call(obj)] ||
        (obj && obj.nodeName) || '#';
  if (obj === UNDEFINED) {
    rs = 'Undefined';
  } else if (rs.charAt(0) === '#') {
    if (obj == obj.document && obj.document != obj) {
      rs = 'Window';
    } else if (obj.nodeType === 9) {
      rs = 'Document';
    } else if (obj.callee) {
      rs = 'Arguments';
    } else if (isFinite(obj.length) && obj.item) {
      rs = 'NodeList';
    } else {
      rs = toString.call(obj).slice(8, -1);
    }
  }
  if (match) {
    return match === rs;
  }
  return rs;
};

const _isObject = source => getType(source, 'Object');
const _isArray = source => getType(source, 'Array');
const _isString = source => getType(source, 'String');
const _isFunction = source => getType(source, 'Function');
const _isNumber = source => getType(source, 'Number');
const _isPlainObject = source => getType(source, 'Object') && Object.getPrototypeOf(source) === __object__;
const _isEmptyObject = (source) => {
  try {
    return JSON.stringify(source) === '{}';
  } catch (e) {
    return FALSE;
  }
};
const _noop = () => {};

const _sliceFn = (obj, attr, fn) => {
  const originFn = obj[attr];
  obj[attr] = function () {
    fn.apply(this, arguments);
    if (_isFunction(originFn)) {
      return originFn.apply(this, arguments);
    }
  };
};

const extend = (target, source, deep) => {
  for (const key in source) {
    if (deep && (_isPlainObject(source[key]) || _isArray(source[key]))) {
      if (_isPlainObject(source[key]) && !_isPlainObject(target[key])) {
        target[key] = {};
      }
      if (_isArray(source[key]) && !_isArray(target[key])) {
        target[key] = [];
      }
      extend(target[key], source[key], deep);
    } else if (source[key] !== UNDEFINED) {
      target[key] = source[key];
    }
  }
};

const _extend = function () {
  let deep,
    args = _makeArray(arguments),
    target = args.shift();
  if (typeof target == 'boolean') {
    deep = target;
    target = args.shift();
  }
  args.forEach(arg => extend(target, arg, deep));
  return target;
};

const _startWith = (str, sch) => str.indexOf(sch) == 0;

const _endWith = (str, sch) => str.indexOf(sch) > -1 && str.indexOf(sch) == str.length - sch.length;

// CustEvent

const _once = (func) => {
  let ran = FALSE,
    memo;
  return function () {
    if (ran) return memo;
    ran = TRUE;
    memo = func.apply(this, arguments);
    func = NULL;
    return memo;
  };
};

const triggerEvents = (events, args) => {
  let ev,
    i = -1,
    l = events.length,
    ret = 1;
  while (++i < l && ret) {
    ev = events[i];
    ret &= (ev.callback.apply(ev.ctx, args) !== FALSE);
  }
  return !!ret;
};

const CustEvent = {
  on(name, callback, context) {
    this._events = this._events || {};
    this._events[name] = this._events[name] || [];
    const events = this._events[name];
    events.push({
      callback,
      context,
      ctx: context || this,
    });
    return this;
  },
  once(name, callback, context) {
    const self = this;
    const once = _once(function () {
      self.off(name, once);
      callback.apply(self, arguments);
    });
    once._callback = callback;
    return this.on(name, once, context);
  },
  off(name, callback, context) {
    let retain, ev, events, names, i, l, j, k;
    if (!name && !callback && !context) {
      this._events = UNDEFINED;
      return this;
    }
    names = name ? [name] : keys(this._events);
    for (i = 0, l = names.length; i < l; i++) {
      name = names[i];
      events = this._events[name];
      if (events) {
        this._events[name] = retain = [];
        if (callback || context) {
          for (j = 0, k = events.length; j < k; j++) {
            ev = events[j];
            if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
                            (context && context !== ev.context)) {
              retain.push(ev);
            }
          }
        }
        if (!retain.length) delete this._events[name];
      }
    }
    return this;
  },
  trigger(name) {
    if (!this._events) return this;
    let args = slice.call(arguments, 1),
      events = this._events[name],
      allEvents = this._events.all,
      ret = 1;
    if (events) {
      ret &= triggerEvents(events, args);
    }
    if (allEvents && ret) {
      ret &= triggerEvents(allEvents, args);
    }
    return !!ret;
  },
};

const _createEventManager = () => {
  const EM = function () {};
  _extend(EM.prototype, CustEvent);
  return new EM();
};

let _makeArray = (iterable) => {
  if (!iterable)
    return FALSE;
  const n = iterable.length;
  if (n === (n >>> 0)) {
    try {
      return slice.call(iterable);
    } catch (e) {
    }
  }
  return FALSE;
};

// createClass

let LifeCycles = ['componentDidMount', 'componentWillUnmount', 'componentWillReceiveProps', 'shouldComponentUpdate', 'componentWillUpdate', 'componentDidUpdate'],
  EventsFns = ['on', 'off', 'once', 'trigger'];

const fixedKey = (prefix, key) => prefix + key.replace(/\w/, a => a.toUpperCase());

const mergeEventFn = (em, obj) => {
  EventsFns.forEach((key) => {
    obj[key] = em[key].bind(em);
  });
  return obj;
};

const fixedLogic = (context, em, isView) => {
  defaults.globalPlugins.concat(context.plugins || []).concat(context.constructor.plugins).filter(
        (key, index, source) => key && key[0] != '-' && source.indexOf(`-${key}`) == -1 && source.indexOf(key) == index
    ).forEach((name) => {
      if (!_isFunction(adapters[name])) return;

      adapters[name].call(em, context, context.constructor[`${name}Plugin`] || {}, isView);
    });

  LifeCycles.forEach((key) => {
    const originFn = context[key];
    context[key] = function () {
      let rs = key.indexOf('should') == 0 ? TRUE : NULL;
      em.trigger.apply(em, [fixedKey('before', key), this].concat(_makeArray(arguments)));
      if (_isFunction(originFn)) {
        try {
          rs = originFn.apply(this, arguments);
        } catch (e) {
          console.log('[RNPlus Error]', e);
          throw e;
        }
      }
      em.trigger.apply(em, [fixedKey('after', key), this, rs].concat(_makeArray(arguments)));
      return rs;
    };
  });

  const bindEvents = context.bindEvents || {};
  const bindEventNames = Object.keys(bindEvents || {});

  ['actived', 'deactived', 'ready'].forEach(key => {
    // if (_isFunction(bindEvents[key])) {
      let bindEventsBind = bindEvents && bindEvents[key] && bindEvents[key].bind(context);
      if(isView)
        em.on(key, (params)=>{
          if(bindEventNames.indexOf(key)>-1)  // 页面级事件
            bindEventsBind && bindEventsBind(params);

          context.subComponentEventManagers[key] && context.subComponentEventManagers[key].forEach(em => {  // 组件级事件
            em.trigger(key);
          });

        });
      else
        em.on(key, bindEventsBind);
    // }
  });

  const renderFn = context.render;

  context.render = function () {
    let rs = NULL;
    em.trigger.apply(em, ['beforeRender', this].concat(_makeArray(arguments)));
    if (_isFunction(renderFn)) {
      try {
        rs = renderFn.apply(this, arguments);
      } catch (e) {
        console.log('[RNPlus Error]', e);
        throw e;
      }
    }
    em.trigger.apply(em, ['afterRender', this, rs].concat(_makeArray(arguments)));
    return rs;
  };
};

function createComponent(isView) {
  class ExtComp extends React.Component {
    constructor(props, context) {
      const em = _createEventManager();
      super(props, context);
      const originFn = this.componentWillMount;

      if(isView) {  // pView初始化
        this.subComponentEventManagers = {};

        this.pViewEventRegister = (em, events) => {
          events.forEach(eventName => {
            if(!this.subComponentEventManagers[eventName])
              this.subComponentEventManagers[eventName] = [];
            this.subComponentEventManagers[eventName].push(em);
          })
        };

        this.getChildContext = () => ({
          pViewEventRegister: this.pViewEventRegister,
        });
      }

      this.componentWillMount = function () {
        // this.name = isView ? this.constructor.name : NULL;

        if(context && context.pViewEventRegister && this.bindEvents) {
          context.pViewEventRegister(em, Object.keys(this.bindEvents));
        }

        fixedLogic(this, em, isView);

        
        let rs = NULL;
        em.trigger.apply(em, ['beforeComponentWillMount', this].concat(_makeArray(arguments)));
        if (_isFunction(originFn)) {
          try {
            rs = originFn.apply(this, arguments);
          } catch (e) {
            console.log('[RNPlus Error]', e);
            throw e;
          }
        }
        em.trigger.apply(em, ['afterComponentWillMount', this, rs].concat(_makeArray(arguments)));
      };
    }


  }

  if(isView)
    ExtComp.childContextTypes = {
      pViewEventRegister: React.PropTypes.func,
    };
  else 
    ExtComp.contextTypes = {
      pViewEventRegister: React.PropTypes.func,
    };

  ExtComp.type = isView ? 'View' : 'Component';
  return ExtComp;
}

function register(RNPlusClass, RNPlusClassName, isInner) {
  if (!isInner && !hasInitFnsDone) {
    initFns.forEach(fn => fn());
    hasInitFnsDone = true;
  }

  const finalClass = registerCallbacks.reduce((pre, cur) => {
    const isView = pre.type == 'View';
    const plugins = defaults.globalPlugins.concat(pre.plugins || []).filter(
            (key, index, source) => key && key[0] != '-' && source.indexOf(`-${key}`) == -1 && source.indexOf(key) == index
        );

    return cur(pre, isView, plugins, RNPlusClassName) || pre;
  }, RNPlusClass);

  viewMap[RNPlusClassName] = finalClass;
  return finalClass;
}

/**
 * 添加插件函数
 * @param  {String}     name             插件名
 * @param  {Function}   adapter          适配函数
 * @param  {Function}   initFn           RNPlus 初始化回调函数
 * @param  {Function}   registerFn       View 注册回调函数
  */
RNPlus.addPlugin = (name, adapter, initFn, registerFn) => {
  if (_isString(name)) {
    adapters[name] = adapter;
    if (_isFunction(initFn)) {
      initFns.push(initFn);
    }
    if (_isFunction(registerFn)) {
      registerCallbacks.push(registerFn);
    }
  }
};

RNPlus.register = register;

RNPlus.viewMap = viewMap;

RNPlus.utils = {
  getType,
  isObject: _isObject,
  isArray: _isArray,
  isString: _isString,
  isFunction: _isFunction,
  isNumber: _isNumber,
  isPlainObject: _isPlainObject,
  isEmptyObject: _isEmptyObject,
  noop: _noop,
  extend: _extend,
  createEventManager: _createEventManager,
  CustEvent,
  startWith: _startWith,
  endWith: _endWith,
  sliceFn: _sliceFn,
};

RNPlus.PView = PView;
RNPlus.PComponent = PComponent;

// 全局挂载
global.React = React;
global.ReactNative = ReactNative;
global.PView = PView;
global.__PView = PView;
global.PComponent = PComponent;
global.__PComponent = PComponent;
global.RNPlus = ReactNative.RNPlus = RNPlus;

export default RNPlus;
export {
    PView,
    PComponent,
};

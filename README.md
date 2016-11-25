RNPlus
===

RNPlus 是 React Native 的前端拓展框架，简化并增强前端开发。

> 配合使用 [rnxDemo](https://github.com/dragonwong/rnxDemo)，阅读该文档，风味更佳哦～

## 介绍

* Base: 核心、插件机制、Utils
* Router: 路由部分，包括同 Context 内的路由，以及和 Native View 之间的跳转
* Redux：数据部分，与 Router 结合的单向数据流操作
* Webx: 前端扩展部分，包括对 Style 的扩展和对事件的一些改动

## 开始

```js
// 引入 RNPlus
import {
    PView,
    PComponent,
} from 'rnplus';

// 定义一个页面
class PageA extends PView {
    // ...
};
// 定义一个组件
class MyComp extends PComponent {
    // ...
};
```

## 核心API

### 业务开发者 API

#### PView 和 PComponent

开发者可以通过 `class Demo extends PView {}` 或 `class Demo extends PComponent {}` 的方式创建 RNPlus View 或 Component，并使用 RNPlus 的插件。

例：

```js
class Demo extends PView {
    render() {
        return <Text>Hello, RNPlus!</Text>
    }
}
```

**注意：**

不要修改对 `PView` 和 `PComponent` 的引用。以下写法是**无效的**：

```js
// 无效的写法
const MyView = PView;

class Demo extends MyView {
    render() {
        return <Text>Hello, RNPlus!</Text>
    }
}
```

之所以这样是因为 RNPlus 为方便开发，会通过配套的 babel 插件自动完成注册。如果你一定要像上面那样，你也可以通过以下方式手动完成注册：

```js
const MyView = PView;

class Demo extends MyView {
    render() {
        return <Text>Hello, RNPlus!</Text>
    }
}

// 手动注册
Demo = RNPlus.register(Demo, 'Demo');
```

#### RNPlus.defaults

全局配置，用户可以配置一些全局的设置。

默认配置：

```js
RNPlus.defaults = {
    appName: '',
    globalPlugins: ['webx', 'router', 'redux'],
};
```

#### 插件文档

暂见各自 README.md

### 插件开发者 API

#### RNPlus.addPlugin(name, adapter, ininFn, registerFn);

添加插件
* `name`：`{String}` 插件名
* `adapter`: `{Function}` 适配器
* `ininFn`: `{Function}` RNPlus 初始化回调函数
* `registerFn`: `{Function}` PView/PComponent 注册时回调函数

示例

```js
RNPlus.addPlugin('xxx', (Comp, opts, React, isView) => {
    // Comp : React Comp 组件实例
    // opts : 插件配置
    // React : React 对象
    // isView : 是否是 View （有可能是 Component）
}, (React) => {
    // React : React 对象
}, (RNPlusComp, isView) {
    // RNPlusComp : RNPlus Comp 组件 Class (PView/PComponent)
    // isView : 是否是 View （有可能是 Component）
});
```

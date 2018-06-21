# Router - RNPlus Plugin

## 介绍

**Router** 作为 **RNPlus** 的内置插件，为其提供更加强大好用的路由功能。

**Router** 具有如下特点：

1. 封装原生的 `Navigator` 组件，提供更加友好的接口。

2. 和 `view` 耦合，无需手动配置路由映射关系。

3. 强大、自由的导航栏配置。

4. 传参、动画等拓展功能。

5. 简洁直观的生命周期。

6. 可以在含有 native 页面的混合应用中灵活地跳转。

## 开始

引用与配置：

```js
// 配置业务 projectId，在多业务跳转时会用到
RNPlus.defaults.projectId = 'myProject';
// 配置应用名（可以不配置，默认为 'Naive'）
RNPlus.defaults.appName = 'rnxDemo';
// 配置首页（可以不配置，默认为引入的第一个页面）
RNPlus.defaults.indexView = 'base';

// 引入页面
import './views/base'
import './views/pageA'
import './views/pageB'
```

注意：

- Router 会自动根据配置去调 `AppRegistry.registerComponent()` 方法，无需再手动调用。

使用 Router：

```js
class base extends PView {
    styles = styles;
    render = render;

    // Actions
    // Router 方法调用
    open() {
        RNPlus.open('pageA', {
            // 传递参数
            param: {
                api: 'open',
                from: 'base',
                to: 'pageA'
            },
            // 配置动画
            sceneConfig: 'VerticalUpSwipeJump'
        });
    };
    goto() {
        RNPlus.goto('pageB', {
            param: {
                api: 'goto',
                from: 'base',
                to: 'pageB'
            }
        });
    };
    back() {
        RNPlus.back({
            param: {
                api: 'back',
                from: 'pageA',
                to: 'base'
            }
        });
    };
    home() {
        RNPlus.home({
            param: {
                api: 'home',
                from: 'base',
                to: 'base'
            }
        });
    };
    close() {
        RNPlus.close();
    };

    // Events
    // Router 生命周期回调注册
    bindEvents = {
        ready() {
            console.log('[base][ready]', this.props);
        },
        actived(param) {
            console.log('[base][actived]', param);
        },
        deactived() {
            console.log('[base][deactived]');
        },
    };
});
```

## 路由

### API

#### `open(name[, opts])`

打开一个新的页面（新建历史）。

- `name` String 目标页面的名字

- `opts` Object 配置项

    - `opts.param` Object 需要传递的参数

    - `opts.sceneConfig` Object|String 场景配置项或内置场景名  

#### `back([opts])`

回到上一个页面。

- `opts` Object 配置项

    - `opts.param` Object 需要传递的参数

#### `backTo(name[, opts])`

回到指定页面。

- `name` String 目标页面的名字

- `opts` Object 配置项

    - `opts.param` Object 需要传递的参数

#### `goto(name[, opts])`

前往指定页面（历史中有则回退，没有则新建历史）。

- `name` String 目标页面的名字

- `opts` Object 配置项

    - `opts.param` Object 需要传递的参数

    - `opts.` Object|String 场景配置项或内置场景名（如果是返回动作，此配置项无效）

#### `home([opts])`

回到首页。

- `opts` Object 配置项

    - `opts.param` Object 需要传递的参数

#### `close(name)`

关闭指定页面。默认关闭当前页，返回上一页。

- `name` String 目标页面的名字

### 生命周期

![](http://ww3.sinaimg.cn/large/4c8b519dgw1f281rs22ryj213m0s4794.jpg)

#### 可注册的回调函数

以下所有注册回调函数内部 `this` 均为当前页面。

##### `ready()`

页面准备完成时。通过 `this.props.param` 可以获取 `open(name, opts)` 时传入的参数。

> 举例：从 A 页面打开 B 页面，此时 B 页面就准备完成了。

##### `actived(param)`

页面激活时。`param` 为来源页携带的参数。

> 举例：B 页面是从 A 页面打开的，现在从 B 页面返回 A 页面，此时 A 页面就被激活了。

##### `deactived()`

页面失活时。

> 举例：从 A 页面打开 B 页面，此时 A 页面就失活了。

### API 和生命周期的关系

API | 触发的生命周期回调
:-: | :-:
`open` | 当前页面的 `deactived` 和下一页面的 `ready`、`actived`
`goto` | 若新建历史：当前页面的 `deactived` 和下一页面的 `ready`、`actived`；若回到历史：当前页面的 `deactived` 和下一页面的 `actived`
`back` | 当前页面的 `deactived` 和下一页面的 `actived`
`backTo` | 当前页面的 `deactived` 和下一页面的 `actived`
`home` | 当前页面的 `deactived` 和下一页面的 `actived`
`close` | 若关闭当前页面：当前页面的 `deactived` 和下一页面的 `actived`

### 挂载在 `RNPlus` 上的对象

**Router** 会通过 `RNPlus.Router` 暴露出来。除了所有的 API 外，还暴露了内部的历史容器 `RNPlus.Router._vcs` 和页面容器 `RNPlus.Router._views`。

## 场景

通过定义 `sceneConfig` 参数，可以配置页面的场景。

`sceneConfig` 可以为字符串（内置场景名）或者对象（场景对象），详情请参考 [configureScene](https://facebook.github.io/react-native/docs/navigator.html#configurescene) 及源码 `qunar_react_native/Libraries/CustomComponents/Navigator/NavigatorSceneConfigs.js`。

这里提供了两种配置方法：

### 静态定义法

在定义页面时就定义好该页面的场景。方法如下：

```js
class Page extends PView {
    static routerPlugin = {
        sceneConfig: sceneConfig,
    };
};
```

### 动态定义法

在打开该页面时才定义页面的场景。方法如下：

```js
RNPlus.open('Page', {
    sceneConfig: 'VerticalUpSwipeJump',
});
```

动态定义法会覆盖静态定义法。

## 导航栏

Router 提供了两种方式来使用导航栏，一种是全局级导航栏，另一种是页面级导航栏。

### 全局级导航栏

原理是配置 `Navigator` 的 `navigationBar` 属性，来实现一个全局级别的导航栏。

使用方法：

```js
RNPlus.defaults.router = {
    // 自己实现的全局级导航栏
    navigationBar,
};
```

其中导航栏组件需要自己实现，强烈建议参考 demo（因为只需复制过去就能为你所用）。

值得一提的是，在 `navigationBar` 中通过在 `routeMapper` 中设置回调函数，可以通过获取 `route` 参数来改变导航栏。在定义页面时配置的 `routerPlugin` 和 `open` 时传递的 `opts` 参数都挂载在 `route` 上。

另外，全局导航栏无法使用 RNPlus 提供的弹层组件（弹层会出现在导航栏下面），此处建议向全局添加自己实现的弹层。使用方法如下：

```js
RNPlus.defaults.router = {
  // 自己实现的全局级导航栏
  navigationBar: NavBar,
  // 全局物理键返回事件
  onBackPressed(){},
  // 动画 {string | sceneConfig}
  sceneConfig: PAGE_ANI,
  // 全局级组件 {array[component]}
  moreComponents: [
    <Overlay key="overlay" />,
    <SheetMemberShipCard key="card" />,
  ],
  // 根节点样式 {style}
  rootStyle: {
    backgroundColor: '#333',
  },
  // 根节点 componentWillMount
  rootComponentWillMount() {},
  // 根节点 componentDidMount
  rootComponentDidMount() {},
  // 根节点 componentWillUnmount
  rootComponentWillUnmount() {},
  // 全局级页面 actived 回调
  actived(route, param) {},
  // 全局级页面 deactived 回调
  deactived(route, param) {},
};
```

### 页面级导航栏

原理是自己在每个页面中实现导航栏。推荐使用 RNX-UI 导航栏组件 [rnx-ui-navbar](https://www.npmjs.com/package/rnx-ui-navbar)。


## 弹层

由于 Modal 暂未支持安卓，所以可以用这个组件用以替代 Modal。

实际上该组件是一个 View，所以它具有一个 View 所具有的完整的生命周期，并且在安卓机器上你可以通过物理返回键关闭它。同时这也带来一个副作用，弹层的打开关闭会触发弹层下面页面的 `deactived` 和 `actived` 回调。

该组件通过改动 Navigator 的代码获得了支持，所以它依赖于 `RNX@0.30.0` 或更高版本。

该组件暂不支持全局级导航栏。

### 用法

```js
// 打开弹层
RNPlus.popup.show();

// 打开弹层（带配置项）
RNPlus.popup.show({
    // 弹层背景色
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    // 空白区域是否运行点击关闭，默认 false，不允许
    blankClose: true,
    // 内容 component
    content: CustomAlert,
    //  生命周期回调函数
    bindEvents: {
        ready() {
            tester.log('[popup][ready]', this.props.param);
        },
        actived(param) {
            tester.log('[popup][actived]', param);
        },
        deactived() {
            tester.log('[popup][deactived]');
        },
    },
});

// 关闭弹层
RNPlus.popup.close();
```

## 桥

Router 封装了 QRN 提供的 Native 桥，Router 自身处理了大部分桥，用户用到只会有以下几种：

### 广播

#### 发送广播

```js
RNPlus.Router.Bridge.sendBroadcast({
    // 广播名
    name: 'getSomeMsg',
    // 广播内容
    data: {
        msg: 'i tell u a msg'
    },
    // 指定发送目标，不指定则发给全局
    projectId: 'hotel',
});
```

#### 接收广播

```js
DeviceEventEmitter.addListener('getSomeMsg', (data) => {
    // 以上面发送广播的 data 为例，接收到的 data 会长这样：
    data = {
        msg: 'i tell u a msg'
    };
});
```

### 发送 scheme

```js
RNPlus.Router.Bridge.sendScheme({
    // 地址
    url: '',
    // 安卓透明层标识（只有安卓才有）
    adrToken: '',
    // 数据
    data: {},
}, (res) => {
    // 发送后的回调
    res = {
        // 是否成功
        ret: true,
        // 数据
        data: {},
    };
});
```

## 实战

### Native 页面跳转

Router 极大便利了 RN 页面和 Native 页面（包括 HY 页面）的互跳操作。

在阅读下面内容前强烈建议先了解下与 RN 相关环境下的 Scheme：[传送门](http://gitlab.corp.qunar.com/yayu.wang/wiki/blob/master/react-native-api-in-js-context.md#scheme)。

#### Native -> RN

Native 打开 RN 页面一般有两种方式：

##### 1. 原生方法

通过 native 代码打开，例如 iOS 通过 `QRCTVCCreater` 方法，详情参考 [iOS](http://ued.qunar.com/qrn/doc/index-Native%E9%9B%86%E6%88%90%EF%BC%88iOS%EF%BC%89.html)、[Android](http://ued.qunar.com/qrn/doc/index-Native%E9%9B%86%E6%88%90%20%EF%BC%88Android%EF%BC%89.html)。

如果首页需要获取从 Native 传入的参数，需要通过 `initialProperties.param` 携带。

##### 2. 发送 Scheme

通过发送 Scheme 也能跳转到 RN 页面，以 iOS 为例：

```
@interface JumpHandle : NSObject
/**
 *  通过URL和urlData来调用界面
 *
 *  @param url          跳转到的URL，通常为 qunariphone://hotel/xxx 的形式
 *  @param urldata      处理URL所需使用的数据
 *  @param responseDelg 回调对象
 *  @param userInfo     自定义对象
 *
 *  @return 返回是否有模块接受该URL并进行处理，处理URL可能是异步的，不能保证线程安全
 */
+ (BOOL)jumpHandleOpenURL:(NSURL *)url
              withUrlData:(NSDictionary *)urldata
             responseDelg:(id<JumpHandleResponsePrt>)responseDelg
                 userInfo:(id)userInfo;
@end
```

#### RN -> Native

一般通过发 Scheme 方式，举例：

```js
RNPlus.Router.Bridge.sendScheme({
    url: 'qunariphone://react/debug',
});
```

以上可以打开一个 native 页面。

#### HY -> RN

通过 `a` 标签进行跳转，举例：

```html
<p>
	<a href="qunariphone://react/open?projectId=qunar_react_native_ext&view=pageA">open：强制新开</a>
</p>
<p>
	<a href="qunariphone://react/biz?projectId=qunar_react_native_ext&qInitView=pageA&forceOpen=true&initProps=%7B%22param%22%3A%7B%22name%22%3A%22wyy%22%7D%7D">biz：强制新开</a>
</p>
<p>
	<a href="qunariphone://react/biz?projectId=qunar_react_native_ext&qInitView=base&initProps=%7B%22param%22%3A%7B%22name%22%3A%22wyy%22%7D%7D">biz：返回 base</a>
</p>
<p>
	<a href="qunariphone://react/biz?projectId=qunar_react_native_ext&qInitView=pageA&initProps=%7B%22param%22%3A%7B%22name%22%3A%22wyy%22%7D%7D">biz：返回 pageA</a>
</p>
```

具体可以参考 [QRN 配套测试 HY Demo](http://gitlab.corp.qunar.com/yayu.wang/qreact-test-hy/tree/master)

#### RN -> HY

通过调用 `RNPlus.Router.Bridge.sendScheme` 方法，举例：

```js
let url = 'qunariphone://web/url?url=http%3A%2F%2Fwyy.qunar.com%2Fqreact-test-hy%2Findex.html&loadview=auto';
RNPlus.Router.Bridge.sendScheme({
    url,
});
```

# CHANGELOG

## 0.30.20

- 新增对多 VC 环境的支持
- 新增 `RNPlus.defaults.onBackPressed` 配置项，配置安卓返回键的全局回调

## 0.30.19

- 新增全局 `deactived` 事件，参数为失活路由对象
- 新增 `RNPlus.Router.currentRoute`，值为当前路由对象

## 0.30.18

- 支持子组件 `bindEvents`，并能获取参数
- 修复多同一页面回退时 actived 错乱的问题
- 修复代码混淆压缩后，页面名取不准的问题，但是会导致 `RNPlus.defaults.router.actived` 参数发生变化，需要高度注意
- 全局的 `RNPlus.defaults.router.actived` 触发时机改为在页面 `actived` 触发之前

## 0.30.17

- 引入 rnx 特有模块 `VCManager`，不再支持官版 rn（如需适配官版 rn 请注掉该引用）

## 0.30.16

- 适配安卓 scheme 跳转

## 0.30.15

> 搞个大新闻

- router 移除生命周期 `destroy`
- router 生命周期 `ready` 改至页面跳转动画结束时触发
- router 修正连续重复打开页面时无法触发生命周期回调的 bug

## 0.30.14

- 新增 Navigator 接近 iOS 系统的动画样式 `NativeIOS` 和无手势版 `NativeIOSNoGestures`

## 0.30.13

- 添加 router 全局 `actived` 回调
- 修正页面侧滑未回退仍然会触发 `actived` 和 `deactived` 的 bug

## 0.30.12

- 修正新开页面时可能无法传参的问题

## 0.30.11

- 修正应用根结点被移除时无法清楚对于路由栈的 bug

## 0.30.10

- 新增 API `resetTo`
- 修改 `open`、`goto`：通过配置 `replace` 属性为 `true` 可以替换当前页

## 0.30.9

- 新增 Navigator 动画样式 `FloatFromBottomNoGestures`

## 0.30.8

- 修正 Navigator 动画样式 `None` 在 iPhone 6s Plus 等机型渲染白屏的 bug

## 0.30.7

- 新增 Navigator 动画样式 `None`

## 0.30.5

- `rnx_internal_onHide` 和 `rnx_internal_onHide` 参数修正

## 0.30.4

- 修正首页自动触发一次 `deactived` 的 bug
- 修正 `close` 页面时会触发当前页 `actived` 和前一页面 `deactived` 的 bug

## 0.30.3

- 修正 backTo 无法携带参数的 bug

## 0.30.2

- 修复 PView 使用 Redux 后 `onBackPressed()` 失效的 bug

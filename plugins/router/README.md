# Router

## 全局配置

```js
RNPlus.defaults.router = {
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

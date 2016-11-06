import RNPlus, { PView, PComponent } from './lib/core.js';

// 必须先引入 redux
import './plugins/redux';

// 引入 router
import './plugins/router';

// 配置全局插件
RNPlus.defaults.globalPlugins = ['redux', 'router'];

export default RNPlus;
export {
    PView,
    PComponent,
};

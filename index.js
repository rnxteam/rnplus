import RNPlus from './lib/core.js';

// 引入 webx
import './plugins/webx';

// 必须先引入 redux
import './plugins/redux';

// 引入 router
import './plugins/router';

// 配置全局插件
RNPlus.defaults.globalPlugins = ['redux', 'router', 'webx'];

export default RNPlus;

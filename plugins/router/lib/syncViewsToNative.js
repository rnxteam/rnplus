import Bridge from './bridge.js';

function syncViewsToNative(vc) {
  let views = [];

  if (vc.nav) {
    const routes = vc.nav.getCurrentRoutes();
    if (Array.isArray(routes)) {
      views = routes.map(item => item.name);
    }
  }

  Bridge.recordViewHistory(vc.tag, views);
}

export default syncViewsToNative;
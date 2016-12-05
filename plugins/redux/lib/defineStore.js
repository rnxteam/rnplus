import applyMiddleware from './redux/applyMiddleware';
import createStore from './redux/createStore';
import mw from './middlewares';

/**
 * 定义可与 PView 绑定的 store
 *
 * @param options {Array} 官方提供的 createStore 参数, 包含 reducer/initialState/enhancer
 * @param middleware {Array} 中间件数组, 我们内置的中间件会放在所有中间件之后
 */
function getStore(options, middleware = []) {
  const finalCreate = applyMiddleware(...middleware, ...mw)(createStore);
  return finalCreate(...options);
}

export default function defineStore(state) {
  const { reducer, enhancer, middleware } = RNPlus.defaults.redux;
  let { initialState } = RNPlus.defaults.redux;

  if (state) {
    if (initialState) {
      initialState = Object.assign(true, initialState, state);
    } else {
      initialState = state;
    }
  }

  return getStore([reducer, initialState, enhancer], middleware);
}

/**
 * Created by karyn on 16/3/14.
 */
import { Component, createElement } from 'react';

import { propTypes } from './utils/constants';
import shallowEqual from './utils/shallowEqual';
import hoistStatics from './utils/hoistStatics';
import invariant from './utils/invariant';

const { isPlainObject } = RNPlus.utils;
const defaultMapStateToProps = state => ({}); // eslint-disable-line no-unused-vars
const defaultMapDispatchToProps = dispatch => ({ dispatch });
const defaultMergeProps = (stateProps, dispatchProps, parentProps) => ({
  ...parentProps,
  ...stateProps,
  ...dispatchProps,
});

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

function checkStateShape(stateProps, dispatch) {
  invariant(
        isPlainObject(stateProps),
        '`%sToProps` must return an object. Instead received %s.',
        dispatch ? 'mapDispatch' : 'mapState',
        stateProps
    );
  return stateProps;
}

// Helps track hot reloading.
let nextVersion = 0;

export default function connect(mapStateToProps, mapDispatchToProps, mergeProps, options = {}) {
  const shouldSubscribe = Boolean(mapStateToProps);
  const mapState = mapStateToProps || defaultMapStateToProps;
  const mapDispatch = mapDispatchToProps || defaultMapDispatchToProps;

  const finalMergeProps = mergeProps || defaultMergeProps;
  const checkMergedEquals = finalMergeProps !== defaultMergeProps;
  const { pure = true, withRef = true } = options;

    // Helps track hot reloading.
  nextVersion += 1;
  const version = nextVersion;

  function computeMergedProps(stateProps, dispatchProps, parentProps) {
    const mergedProps = finalMergeProps(stateProps, dispatchProps, parentProps);
    invariant(
            isPlainObject(mergedProps),
            '`mergeProps` must return an object. Instead received %s.',
            mergedProps
        );
    return mergedProps;
  }

  return function wrapWithConnect(WrappedComponent) {
    class Connect extends Component {
      constructor(props, context) {
        super(props, context);

        this.version = version;

        this.store = props.store || context.store;

        invariant(this.store,
                    'Could not find "store" in either the context or ' +
                    `props of "${this.constructor.displayName}". ` +
                    'Either wrap the root component in a <Provider>, ' +
                    `or explicitly pass "store" as a prop to "${this.constructor.displayName}".`
                );

        const storeState = this.store.getState();
        this.state = { storeState };
        this.clearCache();

        this.getWrappedComponent = this.getWrappedComponent.bind(this);
      }

      componentDidMount() {
        this.trySubscribe();
      }

      componentWillReceiveProps(nextProps) {
        if (!pure || !shallowEqual(nextProps, this.props)) {
          this.haveOwnPropsChanged = true;
        }
      }

      shouldComponentUpdate() {
        return !pure || this.haveOwnPropsChanged || this.hasStoreStateChanged;
      }

      componentWillUnmount() {
        this.tryUnsubscribe();
        this.clearCache();
      }

      getWrappedInstance() {
        invariant(withRef,
                    'To access the wrapped instance, you need to specify ' +
                    '{ withRef: true } as the fourth argument of the connect() call.'
                );

        return this.wrappedInstance;
      }

      getWrappedComponent(wrappedInstance) {
        this.wrappedInstance = wrappedInstance;

        this.onBackPressed = () => {
          // 执行全局 onBackPressed
          const { onBackPressed } = RNPlus.defaults;
          if (typeof onBackPressed === 'function' && onBackPressed()) {
            return true;
          }
          // PView 配置 onBackPressed 优先执行
          if (typeof wrappedInstance.onBackPressed === 'function') {
            return wrappedInstance.onBackPressed();
          }
          
          return false;
        }
      }

      computeStateProps(store, props) {
        if (!this.finalMapStateToProps) {
          return this.configureFinalMapState(store, props);
        }

        const state = store.getState();
        const stateProps = this.doStatePropsDependOnOwnProps ?
                    this.finalMapStateToProps(state, props) :
                    this.finalMapStateToProps(state);

        return checkStateShape(stateProps);
      }

      configureFinalMapState(store, props) {
        const mappedState = mapState(store.getState(), props);
        const isFactory = typeof mappedState === 'function';

        this.finalMapStateToProps = isFactory ? mappedState : mapState;
        this.doStatePropsDependOnOwnProps = this.finalMapStateToProps.length !== 1;

        return isFactory ?
                    this.computeStateProps(store, props) :
                    checkStateShape(mappedState);
      }

      computeDispatchProps(store, props) {
        if (!this.finalMapDispatchToProps) {
          return this.configureFinalMapDispatch(store, props);
        }

        const { dispatch } = store;
        const dispatchProps = this.doDispatchPropsDependOnOwnProps ?
                    this.finalMapDispatchToProps(dispatch, props) :
                    this.finalMapDispatchToProps(dispatch);

        return checkStateShape(dispatchProps, true);
      }

      configureFinalMapDispatch(store, props) {
        const mappedDispatch = mapDispatch(store.dispatch, props);
        const isFactory = typeof mappedDispatch === 'function';

        this.finalMapDispatchToProps = isFactory ? mappedDispatch : mapDispatch;
        this.doDispatchPropsDependOnOwnProps = this.finalMapDispatchToProps.length !== 1;

        return isFactory ?
                    this.computeDispatchProps(store, props) :
                    checkStateShape(mappedDispatch, true);
      }

      updateStatePropsIfNeeded() {
        const nextStateProps = this.computeStateProps(this.store, this.props);
        if (this.stateProps && shallowEqual(nextStateProps, this.stateProps)) {
          return false;
        }

        this.stateProps = nextStateProps;
        return true;
      }

      updateDispatchPropsIfNeeded() {
        const nextDispatchProps = this.computeDispatchProps(this.store, this.props);
        if (this.dispatchProps && shallowEqual(nextDispatchProps, this.dispatchProps)) {
          return false;
        }

        this.dispatchProps = nextDispatchProps;
        return true;
      }

      updateMergedPropsIfNeeded() {
                // 将 context 中的路由参数直接插入到 param
        const props = {
          ...this.props,
          param: this.context.param || this.props.param,
        };

        const nextMergedProps = computeMergedProps(this.stateProps, this.dispatchProps, props);
        if (this.mergedProps && checkMergedEquals &&
          shallowEqual(nextMergedProps, this.mergedProps)) {
          return false;
        }

        this.mergedProps = nextMergedProps;
        return true;
      }

      isSubscribed() {
        return typeof this.unsubscribe === 'function';
      }

      trySubscribe() {
        if (shouldSubscribe && !this.unsubscribe) {
          this.unsubscribe = this.store.subscribe(this.handleChange.bind(this));
          this.handleChange();
        }
      }

      tryUnsubscribe() {
        if (this.unsubscribe) {
          this.unsubscribe();
          this.unsubscribe = null;
        }
      }

      clearCache() {
        this.dispatchProps = null;
        this.stateProps = null;
        this.mergedProps = null;
        this.haveOwnPropsChanged = true;
        this.hasStoreStateChanged = true;
        this.renderedElement = null;
        this.finalMapDispatchToProps = null;
        this.finalMapStateToProps = null;
      }

      handleChange() {
        if (!this.unsubscribe) {
          return;
        }

        const prevStoreState = this.state.storeState;
        const storeState = this.store.getState();

        if (!pure || prevStoreState !== storeState) {
          this.hasStoreStateChanged = true;
          this.setState({ storeState });
        }
      }

      render() {
        const {
                    haveOwnPropsChanged,
                    hasStoreStateChanged,
                    renderedElement,
                    } = this;

        this.haveOwnPropsChanged = false;
        this.hasStoreStateChanged = false;

        let shouldUpdateStateProps = true;
        let shouldUpdateDispatchProps = true;
        if (pure && renderedElement) {
          shouldUpdateStateProps = hasStoreStateChanged || (
                            haveOwnPropsChanged && this.doStatePropsDependOnOwnProps
                        );
          shouldUpdateDispatchProps =
                        haveOwnPropsChanged && this.doDispatchPropsDependOnOwnProps;
        }

        let haveStatePropsChanged = false;
        let haveDispatchPropsChanged = false;
        if (shouldUpdateStateProps) {
          haveStatePropsChanged = this.updateStatePropsIfNeeded();
        }
        if (shouldUpdateDispatchProps) {
          haveDispatchPropsChanged = this.updateDispatchPropsIfNeeded();
        }

        let haveMergedPropsChanged = true;
        if (
                    haveStatePropsChanged ||
                    haveDispatchPropsChanged ||
                    haveOwnPropsChanged
                ) {
          haveMergedPropsChanged = this.updateMergedPropsIfNeeded();
        } else {
          haveMergedPropsChanged = false;
        }

        if (!haveMergedPropsChanged && renderedElement) {
          return renderedElement;
        }

        if (withRef) {
          this.renderedElement = createElement(WrappedComponent, {
            ...this.mergedProps,
            ref: this.getWrappedComponent,
          });
        } else {
          this.renderedElement = createElement(WrappedComponent,
                        this.mergedProps
                    );
        }

        return this.renderedElement;
      }
        }

    Connect.displayName = `Connect(${getDisplayName(WrappedComponent)})`;
    Connect.WrappedComponent = WrappedComponent;
    Connect.contextTypes = propTypes;

    Connect.propTypes = propTypes;
    Connect.type = WrappedComponent.type;

    if (process.env.NODE_ENV !== 'production') {
      Connect.prototype.componentWillUpdate = function componentWillUpdate() {
        if (this.version === version) {
          return;
        }

                // We are hot reloading!
        this.version = version;
        this.trySubscribe();
        this.clearCache();
      };
    }

    return hoistStatics(Connect, WrappedComponent);
  };
}

/**
 * Created by karyn on 16/3/14.
 */
const REACT_STATICS = {
  childContextTypes: true,
  contextTypes: true,
  defaultProps: true,
  displayName: true,
  getDefaultProps: true,
  mixins: true,
  propTypes: true,
  type: true,
};

const KNOWN_STATICS = {
  name: true,
  length: true,
  prototype: true,
  caller: true,
  arguments: true,
  arity: true,
};

module.exports = function hoistNonReactStatics(targetComponent, sourceComponent) {
  const keys = Object.getOwnPropertyNames(sourceComponent);
  for (let i = 0; i < keys.length; ++i) {
    if (!REACT_STATICS[keys[i]] && !KNOWN_STATICS[keys[i]]) {
      try {
        targetComponent[keys[i]] = sourceComponent[keys[i]];
      } catch (error) {

      }
    }
  }

  return targetComponent;
};

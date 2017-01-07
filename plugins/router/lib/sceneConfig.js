/**
 * 添加自定义动画
 */
import {
  Navigator,
} from 'react-native';
const buildStyleInterpolator = require('buildStyleInterpolator');

const NO_TRANSITION = {
  opacity: {
    from: 1,
    to: 1,
    min: 1,
    max: 1,
    type: 'linear',
    extrapolate: false,
    round: 100,
  },
};

// 禁用手势的右入动画
Navigator.SceneConfigs.PushFromRightNoGestures = {
  ...Navigator.SceneConfigs.PushFromRight,
  gestures: {},
};
// 啥子都没得的动画
Navigator.SceneConfigs.None = {
  ...Navigator.SceneConfigs.FadeAndroid,
  gestures: null,
  defaultTransitionVelocity: 1000,
  animationInterpolators: {
    into: buildStyleInterpolator(NO_TRANSITION),
    out: buildStyleInterpolator(NO_TRANSITION),
  },
};

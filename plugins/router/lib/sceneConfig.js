/**
 * 添加自定义动画
 * 动画种类
 *
 * == 原生动画 ==
 * PushFromRight
 * FloatFromRight
 * FloatFromLeft
 * FloatFromBottom
 * FloatFromBottomAndroid
 * FadeAndroid
 * HorizontalSwipeJump
 * HorizontalSwipeJumpFromRight
 * VerticalUpSwipeJump
 * VerticalDownSwipeJump
 * == RNPlus 动画 ==
 * PushFromRightNoGestures
 * None
 * @param  {[type]} sceneConfig [description]
 * @return {[type]}             [description]
 */
import {
  Navigator,
} from 'react-native';
const buildStyleInterpolator = require('react-native/Libraries/Utilities/buildStyleInterpolator.js');

const NO_TRANSITION = {
  opacity: {
    value: 1.0,
    type: 'constant',
  },
};

// 禁用手势的右入动画
Navigator.SceneConfigs.PushFromRightNoGestures = {
  ...Navigator.SceneConfigs.PushFromRight,
  gestures: {},
};
// 禁用手势的底入动画
Navigator.SceneConfigs.FloatFromBottomNoGestures = {
  ...Navigator.SceneConfigs.FloatFromBottom,
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

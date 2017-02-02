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
  Dimensions,
  PixelRatio,
} from 'react-native';

const buildStyleInterpolator = require('react-native/Libraries/Utilities/buildStyleInterpolator.js');

const SCREEN_WIDTH = Dimensions.get('window').width;
const PIXEL_RATIO = PixelRatio.get();

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

// 模拟 iOS 原生动画
const NativeFadeToTheLeft = {
  transformTranslate: {
    from: { x: 0, y: 0, z: 0 },
    to: { x: -Math.round(SCREEN_WIDTH * 0.3), y: 0, z: 0 },
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true,
    round: PIXEL_RATIO,
  },
  opacity: {
    from: 1,
    to: 0.3,
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: false,
    round: 100,
  },
};
const NativeFromTheRight = {
  opacity: {
    value: 1.0,
    type: 'constant',
  },
  shadowColor: {
    value: '#000',
    type: 'constant',
  },
  shadowOpacity: {
    from: 0.1,
    to: 0.5,
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: false,
    round: 100,
  },
  shadowRadius: {
    from: 2,
    to: 6,
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true,
  },
  transformTranslate: {
    from: { x: SCREEN_WIDTH, y: 0, z: 0 },
    to: { x: 0, y: 0, z: 0 },
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true,
    round: PIXEL_RATIO,
  },
};

// 模拟 iOS 原生动画
Navigator.SceneConfigs.NativeIOS = {
  ...Navigator.SceneConfigs.PushFromRight,
  animationInterpolators: {
    into: buildStyleInterpolator(NativeFromTheRight),
    out: buildStyleInterpolator(NativeFadeToTheLeft),
  },
};
// 模拟 iOS 原生动画（禁用手势）
Navigator.SceneConfigs.NativeIOSNoGestures = {
  ...Navigator.SceneConfigs.NativeIOS,
  gestures: {},
};

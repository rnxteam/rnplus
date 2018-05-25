/**
 * Router - Popup
 * 弹层组件
 *
 * @author  i@wangdagen.com
 * @since   2016/5/17
 */

import {
    View,
} from 'react-native';

const buildStyleInterpolator = require('react-native/Libraries/Utilities/buildStyleInterpolator.js');

let popupOpts = {};

RNPlus.popup = {
  show(opts = {}) {
    popupOpts = opts;
    RNPlus.Router.open('_rnplus_popup', {
      sceneConfig: {
                // No gestures.
        gestures: {},

                // Rebound spring parameters when transitioning FROM this scene
                // Actually, I don't know this.
        springFriction: 26,
                // Decrease animation time, look like in a moment.
        springTension: 500,

                // Velocity to start at when transitioning without gesture
                // Actually, I don't know this.
        defaultTransitionVelocity: 1,

        animationInterpolators: {

                    // animation of this route's coming in
          into: buildStyleInterpolator({
            opacity: {
              from: 0,
              to: 1,
              min: 0.8,
              max: 1,
              type: 'linear',
              extrapolate: false,
              round: 10,
            },
          }),
                    // animation of previous route's going out
          out: buildStyleInterpolator({
            opacity: {
              value: 1,
              type: 'constant',
            },
          }),
        },
      },
      isPreViewStatic: true,
    });
  },
  close() {
    RNPlus.close('_rnplus_popup');
  },
};

class _rnplus_popup extends __PView {

  styles = {
    popup: {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  };

    // Events
  bindEvents = {
    ready() {
      callEvent('ready', this);
    },
    actived(param) {
      callEvent('actived', this, [param]);
    },
    deactived() {
      callEvent('deactived', this);
    },
  };

  close() {
    if (popupOpts.blankClose) {
      RNPlus.popup.close();
    }
  }

  render() {
    const style = {};
    if (popupOpts.backgroundColor) {
      style.backgroundColor = popupOpts.backgroundColor;
    }

    return (
            <View class="popup" style={style} onPress={this.close}>
                {popupOpts.content ? <popupOpts.content /> : null}
            </View>
        );
  }
}

function callEvent(eventName, context, args) {
  const events = popupOpts.bindEvents;
  if (events && events[eventName]) {
    events[eventName].apply(context, args);
  }
}

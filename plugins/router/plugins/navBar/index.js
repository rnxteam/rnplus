import {
    View,
    Text,
    TouchableOpacity,
} from 'react-native';
import styles from './styles.js';

// 默认值
const DEFAULTS = {
    // 标题，默认空字符串
    title: null,
    // 标题到左右两边的距离，默认 50
    titleGap: 50,
    // 背景色，默认 Qunar 蓝
    backgroundColor: '#1ba9ba',
    // 左侧按钮文字，默认 '返回'
    leftText: '返回',
    // 左侧按钮点击事件，默认 RNPlus.back()
    leftEvent() {
        RNPlus.back();
    },
    // 右侧按钮默认文字
    rightText: '',
    // 右侧按钮点击事件，默认空函数
    rightEvent() {},
    // 点击默认不透明度
    activeOpacity: 0.6,
};

class _rnplus_navBar extends QComponent {

    styles = styles;

    constructor(props, context) {
        super(props, context);

        this.state = {
            title: DEFAULTS.title,
        };
    };

    render() {
        let title = this.state.title;
        let activeOpacity = DEFAULTS.activeOpacity;
        let leftText = DEFAULTS.leftText;
        let rightText = DEFAULTS.rightText;
        let leftEvent = DEFAULTS.leftEvent;
        let rightEvent = DEFAULTS.rightEvent;

        let navBarStyle = {};
        let headerItemCenterStyle = {};
        let centerTextStyle = {};
        let leftTextStyle = {};
        let rightTextStyle = {};

        let opts = this.props.opts || {};

        if (title === null) {
            title = opts.title || '';
        }
        if (opts.backgroundColor) {
            navBarStyle.backgroundColor = opts.backgroundColor;
        }
        if (opts.centerTextStyle) {
            centerTextStyle = opts.centerTextStyle;
        }
        if (opts.leftTextStyle) {
            leftTextStyle = opts.leftTextStyle;
        }
        if (opts.rightTextStyle) {
            rightTextStyle = opts.rightTextStyle;
        }
        if (opts.titleGap) {
            let titleGap = opts.titleGap;
            headerItemCenterStyle.left = titleGap;
            headerItemCenterStyle.right = titleGap;
        }
        if (typeof opts.leftText === 'string') {
            leftText = opts.leftText;
        }
        if (opts.leftEvent) {
            leftEvent = opts.leftEvent;
        }
        if (opts.rightText) {
            rightText = opts.rightText;
        }
        if (opts.rightEvent) {
            rightEvent = opts.rightEvent;
        }

        return (
            <View class="navBar" style={navBarStyle}>
                <View class="header">
                    <View class="headerItemCenter" style={headerItemCenterStyle}>
                        <Text class="headerTextCenter" style={centerTextStyle} numberOfLines={1}>
                            {title}
                        </Text>
                    </View>
                    <TouchableOpacity
                        class="headerItemLeft"
                        activeOpacity={activeOpacity}
                        onPress={leftEvent.bind(this)}
                    >
                        <Text class="headerTextLeft" style={leftTextStyle}>
                            {leftText}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        class="headerItemRight"
                        activeOpacity={activeOpacity}
                        onPress={rightEvent.bind(this)}
                    >
                        <Text class="headerTextRight" style={rightTextStyle}>
                            {rightText}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }
};

RNPlus.Router.NavBar = _rnplus_navBar;

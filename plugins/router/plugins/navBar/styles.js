const HEADER_HEIGHT = 44;
const STATUS_BAR_HEIGHT = 20;
const SIDE_GAP = 10;
const TITLE_GAP = 50;
const COLOR = '#fff';

export default {
    navBar: {
        paddingTop: STATUS_BAR_HEIGHT,
        backgroundColor: '#1ba9ba',
        position: 'relative',
    },
        header: {
            height: HEADER_HEIGHT,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            backgroundColor: 'transparent',
        },
            headerItemCenter: {
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: TITLE_GAP,
                right: TITLE_GAP,
                flexDirection: 'column',
                justifyContent: 'center',
                overflow: 'hidden',
            },
                headerTextCenter: {
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: 16,
                    color: COLOR,
                },
            headerItemLeft: {
                marginLeft: SIDE_GAP,
            },
                headerTextLeft: {
                    color: COLOR,
                },
            headerItemRight: {
                marginRight: SIDE_GAP,
            },
                headerTextRight: {
                    color: COLOR,
                },
    // test: {
    //     borderColor: 'red',
    //     borderWidth: 1,
    // },
};

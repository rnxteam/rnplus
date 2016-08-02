const PropTypes = require('ReactPropTypes');

export const propTypes = {
    store: PropTypes.shape({
        subscribe: PropTypes.func.isRequired,
        dispatch: PropTypes.func.isRequired,
        getState: PropTypes.func.isRequired
    }),
    param: PropTypes.object
};

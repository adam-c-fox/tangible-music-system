import React from 'react';
import PropTypes from 'prop-types';

const Active = ({ activeImageUrl }) => (
  <div className="active" style={{ ...!activeImageUrl && { opacity: 0 } }}>
    <img src={activeImageUrl || null} height="240" width="240" alt="" />
  </div>
);
export default Active;

Active.propTypes = {
  activeImageUrl: PropTypes.string.isRequired,
};

import React from 'react';

const Active = ({ activeImageUrl }) => (
  <div className="active" style={{ ...!activeImageUrl && { opacity: 0 } }}>
    <img src={activeImageUrl} height="240" width="240" alt="" />
  </div>
);
export default Active;

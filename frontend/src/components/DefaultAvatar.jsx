import React from 'react';

/**
 * @param {Object} props 
 * @param {string} [props.username] 
 * @param {number} [props.size=32] 
 * @param {string} [props.className] 
 * @param {React.CSSProperties} [props.style] 
 * @returns {JSX.Element} 
 */
const DefaultAvatar = ({ username, size = 32, className = '', style = {} }) => {
  if (!username) return null;

  const firstLetter = username.charAt(0).toUpperCase();
  const colors = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#33FFF3'];
  const color = colors[firstLetter.charCodeAt(0) % colors.length];

  return (
    <div 
      className={`default-avatar ${className}`}
      style={{
        backgroundColor: color,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: `${Math.max(12, size * 0.5)}px`,
        fontWeight: 'bold',
        ...style
      }}
    >
      {firstLetter}
    </div>
  );
};

export default DefaultAvatar;
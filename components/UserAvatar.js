import React from 'react';
import { FaUser, FaEdit } from 'react-icons/fa';
import styles from '../styles/UserAvatar.module.css';

const UserAvatar = ({ 
  avatar, 
  size = 'medium', 
  editable = false, 
  onClick = null,
  showEditIcon = false,
  className = ''
}) => {
  const isCustomImage = avatar && avatar.startsWith('data:');
  const isEmoji = avatar && !isCustomImage && avatar.length <= 4;

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div 
      className={`${styles.avatarContainer} ${styles[size]} ${editable ? styles.editable : ''} ${className}`}
      onClick={handleClick}
    >
      <div className={styles.avatar}>
        {avatar ? (
          isCustomImage ? (
            <img 
              src={avatar} 
              alt="Avatar" 
              className={styles.avatarImage}
            />
          ) : isEmoji ? (
            <span className={styles.avatarEmoji}>{avatar}</span>
          ) : (
            <FaUser className={styles.defaultIcon} />
          )
        ) : (
          <FaUser className={styles.defaultIcon} />
        )}
      </div>
      
      {showEditIcon && editable && (
        <div className={styles.editIcon}>
          <FaEdit />
        </div>
      )}
    </div>
  );
};

export default UserAvatar;

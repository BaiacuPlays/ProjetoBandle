import React from 'react';
import { FaUser, FaEdit } from 'react-icons/fa';
import styles from '../styles/UserAvatar.module.css';

const UserAvatar = ({ avatar, size = 'medium', editable = false, showEditIcon = false, onClick }) => {
  // Tamanhos disponíveis
  const sizes = {
    small: '30px',
    medium: '40px',
    large: '60px',
    xlarge: '100px'
  };

  // Verificar se o avatar é uma imagem (data URL) ou um emoji
  const isImage = avatar && avatar.startsWith('data:');
  const isEmoji = avatar && !isImage && avatar.length <= 4; // Emojis geralmente têm 1-2 caracteres

  return (
    <div
      className={`${styles.avatar} ${editable ? styles.editable : ''}`}
      style={{
        width: sizes[size],
        height: sizes[size],
        cursor: editable ? 'pointer' : 'default'
      }}
      onClick={editable ? onClick : undefined}
    >
      {avatar ? (
        isImage ? (
          <img
            src={avatar}
            alt="Avatar"
            className={styles.avatarImage}
            onError={(e) => {
              console.error('Erro ao carregar avatar:', e);
              e.target.onerror = null;
              e.target.src = '/default-avatar.svg';
            }}
          />
        ) : (
          <span
            className={styles.avatarEmoji}
            style={{ fontSize: size === 'small' ? '1rem' : size === 'medium' ? '1.5rem' : size === 'large' ? '2rem' : '3rem' }}
          >
            {avatar}
          </span>
        )
      ) : (
        <FaUser className={styles.defaultIcon} />
      )}

      {editable && showEditIcon && (
        <div className={styles.editIcon}>
          <FaEdit />
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
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
  // Função para determinar o tipo de avatar
  const getAvatarType = (avatarValue) => {
    if (!avatarValue || avatarValue === '👤') return 'default';
    if (avatarValue.startsWith('data:')) return 'image';
    if (avatarValue.startsWith('http')) return 'url';
    if (avatarValue.length <= 4 && /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(avatarValue)) {
      return 'emoji';
    }
    return 'default';
  };

  const avatarType = getAvatarType(avatar);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const renderAvatar = () => {
    switch (avatarType) {
      case 'image':
      case 'url':
        return (
          <img
            src={avatar}
            alt="Avatar"
            className={styles.avatarImage}
            onError={(e) => {
              // Se a imagem falhar ao carregar, mostrar ícone padrão
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
        );
      case 'emoji':
        return <span className={styles.avatarEmoji}>{avatar}</span>;
      case 'default':
      default:
        return <FaUser className={styles.defaultIcon} />;
    }
  };

  return (
    <div
      className={`${styles.avatarContainer} ${styles[size]} ${editable ? styles.editable : ''} ${className}`}
      onClick={handleClick}
      title={avatar && avatarType !== 'default' ? `Avatar: ${avatar}` : 'Avatar padrão'}
    >
      <div className={styles.avatar}>
        {renderAvatar()}
        {/* Fallback para imagens que falharam */}
        {(avatarType === 'image' || avatarType === 'url') && (
          <FaUser className={styles.defaultIcon} style={{ display: 'none' }} />
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

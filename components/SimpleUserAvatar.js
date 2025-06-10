import React, { useState, useMemo } from 'react';
import { FaUser } from 'react-icons/fa';
import styles from '../styles/SimpleUserAvatar.module.css';

const SimpleUserAvatar = ({ avatar, size = 'medium', onClick, className = '' }) => {
  const [imageError, setImageError] = useState(false);



  // Tamanhos disponíveis
  const sizes = {
    small: '30px',
    medium: '40px',
    large: '60px',
    xlarge: '100px'
  };

  // Memoizar a análise do tipo de avatar
  const avatarType = useMemo(() => {
    if (!avatar || imageError) {
      return 'default';
    }

    // Verificar se é uma imagem (data URL ou URL normal)
    if (avatar.startsWith('data:') || avatar.startsWith('http') || avatar.startsWith('/')) {
      return 'image';
    }

    // Verificar se é um emoji usando regex mais abrangente
    const emojiRegex = /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]/u;
    if (emojiRegex.test(avatar)) {
      return 'emoji';
    }

    return 'default';
  }, [avatar, imageError]);

  // Função para lidar com erro de carregamento da imagem
  const handleImageError = () => {
    setImageError(true);
  };

  // Renderizar conteúdo do avatar baseado no tipo
  const renderAvatarContent = () => {
    switch (avatarType) {
      case 'image':
        return (
          <img
            src={avatar}
            alt="Avatar"
            className={styles.avatarImage}
            onError={handleImageError}
          />
        );

      case 'emoji':
        return (
          <span
            className={styles.avatarEmoji}
            style={{
              fontSize: size === 'small' ? '1rem' :
                       size === 'medium' ? '1.5rem' :
                       size === 'large' ? '2rem' : '3rem'
            }}
          >
            {avatar}
          </span>
        );

      default:
        return <FaUser className={styles.defaultIcon} />;
    }
  };

  return (
    <div
      className={`${styles.avatar} ${className}`}
      style={{
        width: sizes[size],
        height: sizes[size],
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
      title={avatarType === 'emoji' ? avatar : 'Avatar do usuário'}
    >
      {renderAvatarContent()}
    </div>
  );
};

export default SimpleUserAvatar;

import React, { useState } from 'react';
import { useModalScrollLockAlways } from '../hooks/useModalScrollLock';
import { FaTimes, FaUpload, FaUser } from 'react-icons/fa';
import styles from '../styles/AvatarSelector.module.css';

const AvatarSelector = ({ currentAvatar, onAvatarChange, onClose }) => {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);

  // Bloquear/desbloquear scroll da página
  useModalScrollLockAlways();

  // Avatares predefinidos
  const predefinedAvatars = [
    '🎮', '🎵', '🎯', '🎪', '🎨', '🎭', '🎸', '🎹',
    '🎺', '🎻', '🥁', '🎤', '🎧', '🎬', '🎲', '🎳',
    '🚀', '⭐', '🌟', '💫', '🔥', '⚡', '💎', '👑',
    '🦄', '🐉', '🦋', '🌈', '🎊', '🎉', '💝', '🏆',
    '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🌺', '🌸',
    '🌼', '🌻', '🌷', '🌹', '🍀', '🌿', '🌱', '🌳'
  ];

  const handleAvatarSelect = (avatar) => {
    setSelectedAvatar(avatar);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Verificar se é uma imagem
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.');
        return;
      }

      // Verificar tamanho (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 2MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedAvatar(e.target.result);
      };
      reader.readAsDataURL(file);
    }
    // Limpar o input
    event.target.value = '';
  };

  const handleSave = () => {
    onAvatarChange(selectedAvatar);
    onClose();
  };

  const isCustomImage = selectedAvatar && selectedAvatar.startsWith('data:');

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>Escolher Avatar</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.content}>
          {/* Avatar atual */}
          <div className={styles.currentSection}>
            <h4>Avatar Atual</h4>
            <div className={styles.currentAvatar}>
              {selectedAvatar ? (
                isCustomImage ? (
                  <img src={selectedAvatar} alt="Avatar" className={styles.avatarImage} />
                ) : (
                  <span className={styles.avatarEmoji}>{selectedAvatar}</span>
                )
              ) : (
                <FaUser className={styles.defaultIcon} />
              )}
            </div>
          </div>

          {/* Upload personalizado */}
          <div className={styles.uploadSection}>
            <h4>Upload Personalizado</h4>
            <label className={styles.uploadButton}>
              <FaUpload />
              Enviar Imagem
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
            <p className={styles.uploadInfo}>
              Máximo 2MB • JPG, PNG, GIF
            </p>
          </div>

          {/* Avatares predefinidos */}
          <div className={styles.predefinedSection}>
            <h4>Avatares Predefinidos</h4>
            <div className={styles.avatarGrid}>
              {predefinedAvatars.map((avatar, index) => (
                <button
                  key={index}
                  className={`${styles.avatarOption} ${selectedAvatar === avatar ? styles.selected : ''}`}
                  onClick={() => handleAvatarSelect(avatar)}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          {/* Opção sem avatar */}
          <div className={styles.noAvatarSection}>
            <button
              className={`${styles.noAvatarOption} ${!selectedAvatar ? styles.selected : ''}`}
              onClick={() => handleAvatarSelect(null)}
            >
              <FaUser />
              Sem Avatar
            </button>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancelar
          </button>
          <button className={styles.saveButton} onClick={handleSave}>
            Salvar Avatar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarSelector;

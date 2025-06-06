import React, { useState } from 'react';
import { useModalScrollLockAlways } from '../hooks/useModalScrollLock';
import { FaTimes, FaUpload, FaUser, FaSpinner } from 'react-icons/fa';
import { processAvatar } from '../utils/imageProcessor';
import styles from '../styles/AvatarSelector.module.css';

const AvatarSelector = ({ currentAvatar, onAvatarChange, onClose }) => {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState('');

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

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        setIsProcessing(true);
        setUploadError('');
        
        // Usar o utilitário de processamento de imagens
        const processedImage = await processAvatar(file, {
          maxWidth: 200,
          maxHeight: 200,
          format: 'image/jpeg',
          quality: 0.85
        });
        
        setSelectedAvatar(processedImage);
        setIsProcessing(false);
      } catch (error) {
        console.error('Erro ao processar imagem:', error);
        setUploadError(error.message || 'Erro ao processar a imagem. Tente outra imagem.');
        setIsProcessing(false);
      }
    }
    // Limpar o input
    event.target.value = '';
  };

  const handleSave = () => {
    if (isProcessing) return;
    
    // Salvar diretamente sem processamento adicional
    // O processamento já foi feito durante o upload
    console.log('Salvando avatar selecionado:', selectedAvatar ? 'Avatar presente' : 'Nenhum avatar');
    
    // Garantir que o avatar não seja undefined
    const avatarToSave = selectedAvatar || currentAvatar || null;
    
    // Chamar callback com o avatar selecionado
    onAvatarChange(avatarToSave);
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
            <label className={`${styles.uploadButton} ${isProcessing ? styles.disabled : ''}`}>
              {isProcessing ? <FaSpinner className={styles.spinner} /> : <FaUpload />}
              {isProcessing ? 'Processando...' : 'Enviar Imagem'}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                disabled={isProcessing}
              />
            </label>
            {uploadError ? (
              <p className={styles.errorMessage}>{uploadError}</p>
            ) : (
              <p className={styles.uploadInfo}>
                Máximo 5MB • JPG, PNG, GIF
              </p>
            )}
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

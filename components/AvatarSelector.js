import React, { useState, useEffect } from 'react';
import { useModalScrollLockAlways } from '../hooks/useModalScrollLock';
import { FaTimes, FaUpload, FaUser, FaTrash } from 'react-icons/fa';
import { PREDEFINED_AVATARS } from '../utils/avatarUtils';
import { useAvatar } from '../hooks/useAvatar';
import SimpleUserAvatar from './SimpleUserAvatar';
import styles from '../styles/AvatarSelector.module.css';

const AvatarSelector = ({ currentAvatar, onAvatarChange, onClose }) => {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);

  // Usar o hook de avatar para processamento
  const {
    isProcessing,
    error,
    processImageFile,
    clearError
  } = useAvatar(currentAvatar, onAvatarChange);

  // Bloquear/desbloquear scroll da página
  useModalScrollLockAlways();

  // Limpar erro quando o modal abre
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleAvatarSelect = (avatar) => {
    setSelectedAvatar(avatar);
    clearError();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('📁 [AvatarSelector] Arquivo selecionado:', file.name, file.size, file.type);

    try {
      console.log('🔄 [AvatarSelector] Iniciando processamento...');
      const processedImage = await processImageFile(file);
      console.log('✅ [AvatarSelector] Imagem processada:', processedImage ? processedImage.length : 'null', 'caracteres');
      setSelectedAvatar(processedImage);
      console.log('✅ [AvatarSelector] Avatar selecionado definido');
    } catch (error) {
      console.error('❌ [AvatarSelector] Erro no processamento:', error);
      // Erro será exibido pelo hook useAvatar
    }

    // Limpar o input
    event.target.value = '';
  };

  const handleSave = async () => {
    if (isProcessing) return;

    console.log('💾 [AvatarSelector] Salvando avatar:', selectedAvatar ? 'Avatar presente' : 'Removendo avatar');

    try {
      if (onAvatarChange) {
        await onAvatarChange(selectedAvatar);
        console.log('✅ [AvatarSelector] Avatar salvo com sucesso');
      }
      onClose();
    } catch (error) {
      console.error('❌ [AvatarSelector] Erro ao salvar:', error);
      // Erro será tratado pelo componente pai
    }
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
          {/* Preview do avatar */}
          <div className={styles.currentSection}>
            <h4>Preview</h4>
            <div className={styles.currentAvatar}>
              <SimpleUserAvatar
                avatar={selectedAvatar || currentAvatar}
                size="xlarge"
              />
            </div>
            {selectedAvatar && selectedAvatar !== currentAvatar && (
              <p className={styles.previewText}>
                Avatar selecionado
              </p>
            )}
          </div>

          {/* Upload personalizado */}
          <div className={styles.uploadSection}>
            <h4>Upload Personalizado</h4>
            <label className={`${styles.uploadButton} ${isProcessing ? styles.disabled : ''}`}>
              <FaUpload />
              {isProcessing ? 'Processando...' : 'Enviar Imagem'}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                disabled={isProcessing}
              />
            </label>
            {error ? (
              <p className={styles.errorMessage}>{error}</p>
            ) : (
              <p className={styles.uploadInfo}>
                Máximo 5MB • JPG, PNG, GIF, WebP
              </p>
            )}
          </div>

          {/* Avatares predefinidos */}
          <div className={styles.predefinedSection}>
            <h4>Avatares Predefinidos</h4>
            <div className={styles.avatarGrid}>
              {PREDEFINED_AVATARS.map((avatar, index) => (
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

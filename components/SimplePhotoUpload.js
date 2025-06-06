import React, { useState, useRef } from 'react';
import { FaCamera, FaTrash, FaEdit } from 'react-icons/fa';
import styles from '../styles/SimplePhotoUpload.module.css';

const SimplePhotoUpload = ({ currentPhoto, onPhotoChange, size = 'large' }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const fileInputRef = useRef(null);

  // Processar arquivo selecionado
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validações básicas
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert('A imagem deve ter no máximo 5MB.');
      return;
    }

    setIsUploading(true);

    try {
      // Criar preview imediato
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target.result;

        // Mostrar preview
        setPreviewPhoto(dataUrl);

        // Processar e redimensionar
        const processedPhoto = await processImage(file);

        // Salvar automaticamente
        if (onPhotoChange) {
          await onPhotoChange(processedPhoto);
        }

        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      alert(`Erro: ${error.message}`);
      setIsUploading(false);
      setPreviewPhoto(null);
    }

    // Limpar input
    event.target.value = '';
  };

  // Processar imagem (redimensionar)
  const processImage = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Redimensionar mantendo proporção
        const maxSize = 200;
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Converter para JPEG com qualidade
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };

      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Remover foto
  const handleRemovePhoto = async () => {
    if (onPhotoChange) {
      await onPhotoChange(null);
    }
    setPreviewPhoto(null);
  };

  // Abrir seletor de arquivo
  const openFileSelector = () => {
    if (fileInputRef.current) {
      // Usar listener direto que funciona sempre
      const inputElement = fileInputRef.current;

      const handleDirectChange = (e) => {
        if (e.target.files && e.target.files[0]) {
          handleFileSelect(e);
        }
        // Remover listener com segurança
        if (inputElement) {
          inputElement.removeEventListener('change', handleDirectChange);
        }
      };

      inputElement.addEventListener('change', handleDirectChange);
      inputElement.click();
    }
  };

  // Foto atual para exibir
  const displayPhoto = previewPhoto || currentPhoto;

  return (
    <div className={styles.photoUploadContainer}>
      {/* Container da foto */}
      <div
        className={`${styles.photoContainer} ${styles[size]} ${displayPhoto ? styles.hasPhoto : ''} ${isUploading ? styles.uploading : ''}`}
        onClick={openFileSelector}
      >
        {displayPhoto ? (
          <img
            src={displayPhoto}
            alt="Foto de perfil"
            className={styles.photoImage}
          />
        ) : (
          <FaCamera className={styles.cameraIcon} />
        )}

        {/* Overlay de hover */}
        {!isUploading && (
          <div className={styles.hoverOverlay}>
            <FaEdit className={styles.editIcon} />
          </div>
        )}

        {/* Overlay de loading */}
        {isUploading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingSpinner}>⏳</div>
            <div>Processando...</div>
          </div>
        )}
      </div>

      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className={styles.hiddenInput}
        onChange={() => {
          // onChange removido - usando listener direto para evitar conflitos
        }}
        disabled={isUploading}
      />

      {/* Botões */}
      <div className={styles.buttonContainer}>
        <button
          onClick={openFileSelector}
          disabled={isUploading}
          className={`${styles.button} ${styles.primaryButton}`}
        >
          <FaCamera />
          {isUploading ? 'Salvando...' : 'Alterar Foto'}
        </button>

        {displayPhoto && (
          <button
            onClick={handleRemovePhoto}
            disabled={isUploading}
            className={`${styles.button} ${styles.dangerButton}`}
          >
            <FaTrash />
            Remover
          </button>
        )}
      </div>

      {/* Texto informativo */}
      <p className={styles.infoText}>
        {isUploading ? 'Processando e salvando...' : 'Clique na foto ou no botão para alterar'}
        <small>Máximo 5MB • JPG, PNG, GIF, WebP</small>
      </p>
    </div>
  );
};

export default SimplePhotoUpload;

import React, { useState } from 'react';
import { useUserProfile } from '../contexts/UserProfileContext';
import { FaCamera, FaSpinner } from 'react-icons/fa';

/**
 * Componente para upload direto de avatar sem modal
 * Permite fazer upload de uma imagem diretamente para o perfil
 */
const DirectAvatarUpload = () => {
  const { profile, updateAvatar } = useUserProfile();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);

      // Verificar se é uma imagem
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.');
        setIsUploading(false);
        return;
      }

      // Verificar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB.');
        setIsUploading(false);
        return;
      }

      // Processar a imagem
      const processImage = (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              // Tamanho máximo para avatar
              const maxWidth = 200;
              const maxHeight = 200;
              
              // Calcular dimensões mantendo proporção
              let width = img.width;
              let height = img.height;
              
              if (width > height) {
                if (width > maxWidth) {
                  height = Math.round(height * maxWidth / width);
                  width = maxWidth;
                }
              } else {
                if (height > maxHeight) {
                  width = Math.round(width * maxHeight / height);
                  height = maxHeight;
                }
              }
              
              // Criar canvas para redimensionar
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              
              // Desenhar imagem redimensionada
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, width, height);
              
              // Converter para formato mais leve (JPEG com 85% de qualidade)
              const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
              resolve(dataUrl);
            };
            img.onerror = () => reject(new Error('Erro ao carregar imagem'));
            img.src = e.target.result;
          };
          reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
          reader.readAsDataURL(file);
        });
      };

      // Processar e salvar a imagem
      const imageData = await processImage(file);
      
      // Salvar no perfil
      if (updateAvatar) {
        // Salvar localmente primeiro para garantir que não desapareça
        if (profile) {
          const tempProfile = {...profile, avatar: imageData};
          localStorage.setItem(`ludomusic_profile_${profile.id}`, JSON.stringify(tempProfile));
        }
        
        await updateAvatar(imageData);
        console.log('Avatar atualizado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      alert('Erro ao processar a imagem. Tente outra imagem.');
    } finally {
      setIsUploading(false);
      // Limpar o input
      event.target.value = '';
    }
  };

  return (
    <label 
      style={{
        backgroundColor: '#1DB954',
        borderRadius: '50%',
        width: '30px',
        height: '30px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
        border: '2px solid #fff'
      }}
    >
      {isUploading ? (
        <FaSpinner style={{ color: '#fff', animation: 'spin 1s linear infinite', fontSize: '14px' }} />
      ) : (
        <FaCamera style={{ color: '#fff', fontSize: '14px' }} />
      )}
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={isUploading}
      />
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </label>
  );
};

export default DirectAvatarUpload;
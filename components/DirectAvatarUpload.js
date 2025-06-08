import React, { useState } from 'react';
import { useUserProfile } from '../contexts/UserProfileContext';
import { FaCamera, FaSpinner } from 'react-icons/fa';

/**
 * Componente para upload direto de avatar sem modal
 * Permite fazer upload de uma imagem diretamente para o perfil
 * Suporta upload de arquivos e colar da área de transferência
 */
const DirectAvatarUpload = () => {
  const { profile, updateAvatar } = useUserProfile();
  const [isUploading, setIsUploading] = useState(false);

  // Função para processar qualquer tipo de arquivo/blob de imagem
  const processImageFile = async (file) => {
    console.log('📁 [AVATAR] Processando arquivo:', {
      name: file.name || 'clipboard-image',
      type: file.type,
      size: file.size,
      sizeInMB: (file.size / (1024 * 1024)).toFixed(2)
    });

    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
      throw new Error('Por favor, selecione apenas arquivos de imagem.');
    }

    // Verificar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('A imagem deve ter no máximo 5MB.');
    }

    // Processar a imagem
    const processImage = (file) => {
      return new Promise((resolve, reject) => {
        console.log('🖼️ [AVATAR] Iniciando FileReader...');
        const reader = new FileReader();

        reader.onload = (e) => {
          console.log('📖 [AVATAR] Arquivo lido, criando Image...');
          const img = new Image();

          img.onload = () => {
            console.log('🖼️ [AVATAR] Imagem carregada:', {
              originalWidth: img.width,
              originalHeight: img.height
            });

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

            console.log('📐 [AVATAR] Dimensões finais:', { width, height });

            // Criar canvas para redimensionar
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            // Desenhar imagem redimensionada
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Converter para formato mais leve (JPEG com 85% de qualidade)
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

            console.log('✅ [AVATAR] Canvas processado, dataURL gerado:', {
              length: dataUrl.length,
              preview: dataUrl.substring(0, 50) + '...'
            });

            resolve(dataUrl);
          };

          img.onerror = (error) => {
            console.error('❌ [AVATAR] Erro ao carregar imagem:', error);
            reject(new Error('Erro ao carregar imagem. Verifique se o arquivo é uma imagem válida.'));
          };

          img.src = e.target.result;
        };

        reader.onerror = (error) => {
          console.error('❌ [AVATAR] Erro ao ler arquivo:', error);
          reject(new Error('Erro ao ler arquivo. Tente novamente.'));
        };

        reader.readAsDataURL(file);
      });
    };

    console.log('🔄 [AVATAR] Iniciando processamento da imagem...');

    // Processar e salvar a imagem
    const imageData = await processImage(file);

    console.log('✅ [AVATAR] Imagem processada com sucesso:', {
      dataUrlLength: imageData.length,
      startsWithData: imageData.startsWith('data:'),
      format: imageData.substring(0, 30) + '...'
    });

    // Salvar no perfil
    if (updateAvatar) {
      console.log('💾 [AVATAR] Salvando avatar no perfil...');

      // Salvar localmente primeiro para garantir que não desapareça
      if (profile) {
        const tempProfile = {...profile, avatar: imageData};
        localStorage.setItem(`ludomusic_profile_${profile.id}`, JSON.stringify(tempProfile));
        console.log('💾 [AVATAR] Avatar salvo no localStorage');
      }

      await updateAvatar(imageData);
      console.log('✅ [AVATAR] Avatar atualizado com sucesso!');
      return true;
    } else {
      console.error('❌ [AVATAR] updateAvatar não está disponível');
      throw new Error('Função de atualização não disponível');
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      await processImageFile(file);
      alert('Avatar atualizado com sucesso!');
    } catch (error) {
      console.error('❌ [AVATAR] Erro ao processar imagem:', error);
      alert(`Erro ao processar a imagem: ${error.message}`);
    } finally {
      setIsUploading(false);
      // Limpar o input
      event.target.value = '';
    }
  };

  // Função para lidar com colar da área de transferência
  const handlePaste = async (event) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (item.type.startsWith('image/')) {
        console.log('📋 [AVATAR] Imagem detectada na área de transferência');
        event.preventDefault();

        const file = item.getAsFile();
        if (file) {
          try {
            setIsUploading(true);
            await processImageFile(file);
            alert('Avatar atualizado com sucesso via área de transferência!');
          } catch (error) {
            console.error('❌ [AVATAR] Erro ao processar imagem da área de transferência:', error);
            alert(`Erro ao processar a imagem: ${error.message}`);
          } finally {
            setIsUploading(false);
          }
        }
        break;
      }
    }
  };

  // Adicionar event listener para paste quando o componente monta
  React.useEffect(() => {
    const handleGlobalPaste = (event) => {
      // Só processar se não estiver em um input/textarea
      if (event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA') {
        handlePaste(event);
      }
    };

    document.addEventListener('paste', handleGlobalPaste);

    return () => {
      document.removeEventListener('paste', handleGlobalPaste);
    };
  }, []);

  return (
    <div style={{ position: 'relative' }}>
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
        title="Clique para selecionar uma imagem ou cole uma imagem (Ctrl+V)"
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
    </div>
  );
};

export default DirectAvatarUpload;
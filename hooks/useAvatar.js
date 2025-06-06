import { useState, useCallback } from 'react';
import { processAvatar } from '../utils/imageProcessor';
import { validateAvatar as validateAvatarUtil, AVATAR_CONSTRAINTS } from '../utils/avatarUtils';

/**
 * Hook personalizado para gerenciar avatares de usuário
 * Centraliza toda a lógica de upload, processamento e validação
 */
export const useAvatar = (currentAvatar, onAvatarUpdate) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [previewAvatar, setPreviewAvatar] = useState(null);

  // Validar se o avatar é válido
  const validateAvatar = useCallback((avatar) => {
    return validateAvatarUtil(avatar);
  }, []);

  // Processar arquivo de imagem
  const processImageFile = useCallback(async (file) => {
    if (!file) {
      throw new Error('Nenhum arquivo selecionado');
    }

    // Validar tipo de arquivo
    if (!AVATAR_CONSTRAINTS.ALLOWED_FORMATS.includes(file.type)) {
      throw new Error('Formato não suportado. Use JPG, PNG, GIF ou WebP');
    }

    // Validar tamanho do arquivo
    if (file.size > AVATAR_CONSTRAINTS.MAX_FILE_SIZE) {
      throw new Error(`Arquivo muito grande (máximo ${Math.round(AVATAR_CONSTRAINTS.MAX_FILE_SIZE / 1024 / 1024)}MB)`);
    }

    setIsProcessing(true);
    setError('');

    try {
      console.log('🔄 [useAvatar] Processando imagem:', file.name, file.size, 'bytes');

      // Processar imagem
      const processedImage = await processAvatar(file, {
        maxWidth: AVATAR_CONSTRAINTS.PROCESSED_WIDTH,
        maxHeight: AVATAR_CONSTRAINTS.PROCESSED_HEIGHT,
        format: 'image/jpeg',
        quality: AVATAR_CONSTRAINTS.PROCESSED_QUALITY
      });

      console.log('✅ [useAvatar] Imagem processada:', processedImage.length, 'caracteres');

      // Validar resultado
      const validation = validateAvatar(processedImage);
      if (!validation.isValid) {
        console.error('❌ [useAvatar] Validação falhou:', validation.error);
        throw new Error(validation.error);
      }

      console.log('✅ [useAvatar] Validação passou, definindo preview');
      setPreviewAvatar(processedImage);
      return processedImage;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [validateAvatar]);

  // Salvar avatar
  const saveAvatar = useCallback(async (avatarData) => {
    // Permitir remover avatar (null/undefined)
    if (avatarData === null || avatarData === undefined) {
      setIsProcessing(true);
      setError('');

      try {
        if (onAvatarUpdate) {
          await onAvatarUpdate(null);
        }
        setPreviewAvatar(null);
        return true;
      } catch (error) {
        setError(error.message || 'Erro ao remover avatar');
        return false;
      } finally {
        setIsProcessing(false);
      }
    }

    // Validar avatar se não for null
    const validation = validateAvatar(avatarData);
    if (!validation.isValid) {
      setError(validation.error);
      return false;
    }

    setIsProcessing(true);
    setError('');

    try {
      console.log('💾 [useAvatar] Salvando avatar:', {
        avatarType: typeof avatarData,
        avatarLength: avatarData?.length || 'N/A',
        hasCallback: !!onAvatarUpdate
      });

      // Chamar callback de atualização
      if (onAvatarUpdate) {
        await onAvatarUpdate(avatarData);
        console.log('✅ [useAvatar] Callback de atualização executado');
      }

      setPreviewAvatar(null);
      console.log('✅ [useAvatar] Avatar salvo com sucesso');
      return true;
    } catch (error) {
      console.error('❌ [useAvatar] Erro ao salvar avatar:', error);
      setError(error.message || 'Erro ao salvar avatar');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [validateAvatar, onAvatarUpdate]);

  // Resetar preview
  const resetPreview = useCallback(() => {
    setPreviewAvatar(null);
    setError('');
  }, []);

  // Limpar erro
  const clearError = useCallback(() => {
    setError('');
  }, []);

  return {
    isProcessing,
    error,
    previewAvatar,
    processImageFile,
    saveAvatar,
    resetPreview,
    clearError,
    validateAvatar
  };
};

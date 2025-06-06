/**
 * Utilitário para processamento de imagens
 * Fornece funções para redimensionar, comprimir e validar imagens
 */

/**
 * Redimensiona e comprime uma imagem para uso como avatar
 * @param {File} file - O arquivo de imagem a ser processado
 * @param {Object} options - Opções de processamento
 * @param {number} options.maxWidth - Largura máxima (padrão: 200px)
 * @param {number} options.maxHeight - Altura máxima (padrão: 200px)
 * @param {string} options.format - Formato de saída (padrão: 'image/jpeg')
 * @param {number} options.quality - Qualidade da compressão (0-1, padrão: 0.85)
 * @returns {Promise<string>} - Promise que resolve para o dataURL da imagem processada
 */
export const processAvatar = (file, options = {}) => {
  const {
    maxWidth = 200,
    maxHeight = 200,
    format = 'image/jpeg',
    quality = 0.85
  } = options;

  console.log('🖼️ [imageProcessor] Iniciando processamento:', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    maxWidth,
    maxHeight,
    format,
    quality
  });

  return new Promise((resolve, reject) => {
    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
      console.error('❌ [imageProcessor] Arquivo não é imagem:', file.type);
      reject(new Error('O arquivo não é uma imagem válida'));
      return;
    }

    // Verificar tamanho (máximo 5MB para entrada)
    if (file.size > 5 * 1024 * 1024) {
      console.error('❌ [imageProcessor] Arquivo muito grande:', file.size);
      reject(new Error('A imagem deve ter no máximo 5MB'));
      return;
    }

    console.log('✅ [imageProcessor] Validações iniciais passaram');

    const reader = new FileReader();

    reader.onload = (e) => {
      console.log('📖 [imageProcessor] FileReader carregou arquivo');
      const img = new Image();

      img.onload = () => {
        console.log('🖼️ [imageProcessor] Imagem carregada:', img.width, 'x', img.height);
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
        console.log('🎨 [imageProcessor] Canvas criado:', width, 'x', height);

        // Desenhar imagem redimensionada
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        console.log('✏️ [imageProcessor] Imagem desenhada no canvas');

        // Converter para formato especificado
        const dataUrl = canvas.toDataURL(format, quality);
        console.log('📄 [imageProcessor] DataURL gerado:', dataUrl.length, 'caracteres');

        // Verificar tamanho final (máximo 500KB)
        const base64 = dataUrl.split(',')[1];
        const binarySize = window.atob(base64).length;
        const sizeInKB = binarySize / 1024;

        if (sizeInKB > 500) {
          // Se ainda estiver muito grande, comprimir mais
          let currentQuality = quality - 0.1;
          let attempts = 0;
          let finalDataUrl = dataUrl;

          while (sizeInKB > 500 && currentQuality > 0.3 && attempts < 5) {
            finalDataUrl = canvas.toDataURL(format, currentQuality);
            const newBase64 = finalDataUrl.split(',')[1];
            const newSize = window.atob(newBase64).length / 1024;

            if (newSize <= 500) break;

            currentQuality -= 0.1;
            attempts++;
          }

          console.log('✅ [imageProcessor] Imagem comprimida resolvida:', finalDataUrl.length, 'caracteres');
          resolve(finalDataUrl);
        } else {
          console.log('✅ [imageProcessor] Imagem original resolvida:', dataUrl.length, 'caracteres');
          resolve(dataUrl);
        }
      };

      img.onerror = () => {
        console.error('❌ [imageProcessor] Erro ao carregar imagem');
        reject(new Error('Erro ao carregar a imagem'));
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      console.error('❌ [imageProcessor] Erro ao ler arquivo');
      reject(new Error('Erro ao ler o arquivo'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Valida se uma string dataURL é uma imagem válida
 * @param {string} dataUrl - O dataURL a ser validado
 * @returns {Promise<boolean>} - Promise que resolve para true se a imagem for válida
 */
export const validateImageDataUrl = (dataUrl) => {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== 'string') {
      resolve(false);
      return;
    }

    if (!dataUrl.startsWith('data:image/')) {
      resolve(false);
      return;
    }

    const img = new Image();
    img.onload = () => {
      // Verificar se a imagem tem dimensões válidas
      if (img.width > 0 && img.height > 0) {
        resolve(true);
      } else {
        resolve(false);
      }
    };
    img.onerror = () => {
      resolve(false);
    };
    img.src = dataUrl;
  });
};

/**
 * Converte um Blob para dataURL
 * @param {Blob} blob - O blob a ser convertido
 * @returns {Promise<string>} - Promise que resolve para o dataURL
 */
export const blobToDataUrl = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target.result);
    };
    reader.onerror = () => {
      reject(new Error('Erro ao converter blob para dataURL'));
    };
    reader.readAsDataURL(blob);
  });
};
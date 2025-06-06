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

  return new Promise((resolve, reject) => {
    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
      reject(new Error('O arquivo não é uma imagem válida'));
      return;
    }

    // Verificar tamanho (máximo 5MB para entrada)
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('A imagem deve ter no máximo 5MB'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
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
        
        // Converter para formato especificado
        const dataUrl = canvas.toDataURL(format, quality);
        
        // Verificar tamanho final (máximo 100KB)
        const base64 = dataUrl.split(',')[1];
        const binarySize = window.atob(base64).length;
        const sizeInKB = binarySize / 1024;
        
        if (sizeInKB > 100) {
          // Se ainda estiver muito grande, comprimir mais
          const lowerQuality = Math.max(0.5, quality - 0.2);
          const compressedDataUrl = canvas.toDataURL(format, lowerQuality);
          resolve(compressedDataUrl);
        } else {
          resolve(dataUrl);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Erro ao carregar a imagem'));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
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
// Configuração centralizada do Vercel KV
import { kv } from '@vercel/kv';

// Verificar se estamos em ambiente de desenvolvimento
export const isDevelopment = process.env.NODE_ENV === 'development';

// Verificar se as variáveis KV estão configuradas
export const hasKVConfig = !!(
  process.env.KV_REST_API_URL &&
  process.env.KV_REST_API_TOKEN
);

// Em produção, sempre usar KV (já sabemos que funciona)
const shouldUseKV = !isDevelopment || hasKVConfig;

// Log de debug para verificar configuração
if (!isDevelopment) {
  console.log('🔧 KV Config Status:', {
    hasKVConfig,
    KV_REST_API_URL: process.env.KV_REST_API_URL ? 'DEFINIDA' : 'NÃO DEFINIDA',
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? 'DEFINIDA' : 'NÃO DEFINIDA',
    NODE_ENV: process.env.NODE_ENV
  });
}

// Função wrapper para operações KV com fallback
export const kvGet = async (key, fallbackStorage = null) => {
  if (!shouldUseKV) {
    return fallbackStorage ? fallbackStorage.get(key) : null;
  }

  try {
    return await kv.get(key);
  } catch (error) {
    console.error(`❌ Erro ao buscar chave ${key} no KV:`, error);
    // Em produção, não usar fallback - queremos detectar problemas
    if (isDevelopment) {
      return fallbackStorage ? fallbackStorage.get(key) : null;
    }
    throw error;
  }
};

export const kvSet = async (key, value, options = {}, fallbackStorage = null) => {
  if (!shouldUseKV) {
    if (fallbackStorage) {
      fallbackStorage.set(key, value);
    }
    return true;
  }

  try {
    await kv.set(key, value, options);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao salvar chave ${key} no KV:`, error);
    // Em produção, não usar fallback - queremos detectar problemas
    if (isDevelopment && fallbackStorage) {
      fallbackStorage.set(key, value);
      return true;
    }
    throw error;
  }
};

export const kvDel = async (key, fallbackStorage = null) => {
  if (!shouldUseKV) {
    if (fallbackStorage) {
      fallbackStorage.delete(key);
    }
    return true;
  }

  try {
    await kv.del(key);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao deletar chave ${key} no KV:`, error);
    // Em produção, não usar fallback - queremos detectar problemas
    if (isDevelopment && fallbackStorage) {
      fallbackStorage.delete(key);
      return true;
    }
    throw error;
  }
};

// Exportar instância do KV para uso direto quando necessário
export { kv };

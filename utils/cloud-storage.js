// Sistema de armazenamento em nuvem para perfis
// Integração com Cloudflare R2 e fallback para localStorage

import { kv } from '@vercel/kv';
import { localProfiles } from './storage';

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = (process.env.KV_REST_API_URL || process.env.KV_URL) && process.env.KV_REST_API_TOKEN;

/**
 * Sistema de armazenamento Steam-like para perfis
 */
class SteamStorage {
  constructor() {
    this.useKV = !isDevelopment || hasKVConfig;
    console.log(`🗄️ SteamStorage inicializado - KV: ${this.useKV ? 'ATIVO' : 'DESABILITADO'}`);
  }

  /**
   * Salva um perfil no sistema de armazenamento
   * @param {string} userId - ID do usuário
   * @param {Object} profile - Dados do perfil
   * @returns {Object} - Resultado das operações de salvamento
   */
  async saveProfile(userId, profile) {
    const results = {
      localStorage: false,
      cloudflare: false,
      errors: []
    };

    // Sempre tentar salvar no localStorage/storage local primeiro
    try {
      const profileKey = `profile:${userId}`;
      
      if (isDevelopment && !hasKVConfig) {
        // Em desenvolvimento sem KV, usar storage local
        localProfiles.set(profileKey, profile);
        results.localStorage = true;
        console.log(`💾 Perfil salvo no storage local: ${userId}`);
      } else {
        // Em produção ou desenvolvimento com KV
        await kv.set(profileKey, profile);
        results.cloudflare = true;
        console.log(`☁️ Perfil salvo no KV: ${userId}`);
      }
    } catch (error) {
      console.error('❌ Erro ao salvar no storage principal:', error);
      results.errors.push(`Storage principal: ${error.message}`);
    }

    // Tentar backup no storage alternativo
    try {
      if (this.useKV && results.cloudflare) {
        // Se salvou no KV, fazer backup local
        if (typeof window !== 'undefined' && window.localStorage) {
          const backupKey = `ludomusic_profile_backup_${userId}`;
          window.localStorage.setItem(backupKey, JSON.stringify(profile));
          results.localStorage = true;
          console.log(`💾 Backup local criado: ${userId}`);
        }
      } else if (!this.useKV && results.localStorage) {
        // Se salvou localmente, tentar enviar para KV se disponível
        if (hasKVConfig) {
          try {
            const profileKey = `profile:${userId}`;
            await kv.set(profileKey, profile);
            results.cloudflare = true;
            console.log(`☁️ Backup em nuvem criado: ${userId}`);
          } catch (kvError) {
            console.warn('⚠️ Falha no backup em nuvem:', kvError.message);
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Erro ao criar backup:', error.message);
      results.errors.push(`Backup: ${error.message}`);
    }

    return results;
  }

  /**
   * Carrega um perfil do sistema de armazenamento
   * @param {string} userId - ID do usuário
   * @returns {Object|null} - Dados do perfil ou null se não encontrado
   */
  async loadProfile(userId) {
    const profileKey = `profile:${userId}`;

    try {
      // Tentar carregar do storage principal
      if (isDevelopment && !hasKVConfig) {
        const profile = localProfiles.get(profileKey);
        if (profile) {
          console.log(`📖 Perfil carregado do storage local: ${userId}`);
          return profile;
        }
      } else {
        const profile = await kv.get(profileKey);
        if (profile) {
          console.log(`📖 Perfil carregado do KV: ${userId}`);
          return profile;
        }
      }

      // Se não encontrou, tentar backup
      if (typeof window !== 'undefined' && window.localStorage) {
        const backupKey = `ludomusic_profile_backup_${userId}`;
        const backupData = window.localStorage.getItem(backupKey);
        if (backupData) {
          const profile = JSON.parse(backupData);
          console.log(`📖 Perfil carregado do backup local: ${userId}`);
          return profile;
        }
      }

      console.log(`❌ Perfil não encontrado: ${userId}`);
      return null;

    } catch (error) {
      console.error('❌ Erro ao carregar perfil:', error);
      return null;
    }
  }

  /**
   * Sincroniza perfil entre diferentes storages
   * @param {string} userId - ID do usuário
   * @returns {Object} - Resultado da sincronização
   */
  async syncProfile(userId) {
    try {
      const profile = await this.loadProfile(userId);
      if (!profile) {
        return { success: false, error: 'Perfil não encontrado' };
      }

      const saveResults = await this.saveProfile(userId, profile);
      const success = saveResults.localStorage || saveResults.cloudflare;

      return {
        success,
        results: saveResults,
        profile
      };

    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove um perfil do sistema de armazenamento
   * @param {string} userId - ID do usuário
   * @returns {Object} - Resultado da remoção
   */
  async deleteProfile(userId) {
    const results = {
      localStorage: false,
      cloudflare: false,
      errors: []
    };

    const profileKey = `profile:${userId}`;

    // Remover do storage principal
    try {
      if (isDevelopment && !hasKVConfig) {
        results.localStorage = localProfiles.delete(profileKey);
      } else {
        await kv.del(profileKey);
        results.cloudflare = true;
      }
    } catch (error) {
      console.error('❌ Erro ao deletar do storage principal:', error);
      results.errors.push(`Storage principal: ${error.message}`);
    }

    // Remover backups
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const backupKey = `ludomusic_profile_backup_${userId}`;
        window.localStorage.removeItem(backupKey);
        results.localStorage = true;
      }
    } catch (error) {
      console.warn('⚠️ Erro ao remover backup local:', error.message);
    }

    return results;
  }

  /**
   * Lista todos os perfis (apenas para desenvolvimento/debug)
   * @returns {Array} - Lista de perfis
   */
  async listProfiles() {
    try {
      if (isDevelopment && !hasKVConfig) {
        const keys = localProfiles.keys();
        const profiles = [];
        for (const key of keys) {
          if (key.startsWith('profile:')) {
            const profile = localProfiles.get(key);
            if (profile) {
              profiles.push({ key, profile });
            }
          }
        }
        return profiles;
      } else {
        // Em produção, não implementar por questões de segurança
        console.warn('⚠️ Listagem de perfis não disponível em produção');
        return [];
      }
    } catch (error) {
      console.error('❌ Erro ao listar perfis:', error);
      return [];
    }
  }
}

// Instância global do sistema de armazenamento
export const steamStorage = new SteamStorage();

// Exports adicionais para compatibilidade
export default steamStorage;

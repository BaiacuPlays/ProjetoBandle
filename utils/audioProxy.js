// Utilitários para proxy de áudio com CORS - Versão Simplificada
export class AudioProxyManager {
  constructor() {
    this.useProxy = true; // Sempre usar proxy - mais confiável
    this.proxyEndpoint = '/api/audio-proxy';
    this.cache = new Map();
    this.tested = false;
  }

  // Verificar se uma URL precisa de proxy
  needsProxy(url) {
    if (!url) return false;
    
    // URLs do Cloudflare R2 sempre precisam de proxy para CORS
    const r2Domains = [
      'pub-4d254faec6ec408ab584ea82049c2f79.r2.dev',
      'f0ef294a1c4bb8e90e9ee5006f374f2d.r2.cloudflarestorage.com'
    ];
    
    try {
      const urlObj = new URL(url);
      return r2Domains.includes(urlObj.hostname);
    } catch {
      return false;
    }
  }

  // Converter URL para usar proxy
  getProxyUrl(originalUrl) {
    if (!originalUrl) return null;

    // Se proxy está desabilitado (CORS funcionando), retornar URL original
    if (!this.useProxy) {
      return originalUrl;
    }

    // Se não precisa de proxy, retornar URL original
    if (!this.needsProxy(originalUrl)) {
      return originalUrl;
    }

    // Verificar cache
    if (this.cache.has(originalUrl)) {
      return this.cache.get(originalUrl);
    }

    // Criar URL do proxy
    const proxyUrl = `${this.proxyEndpoint}?url=${encodeURIComponent(originalUrl)}`;

    // Adicionar ao cache
    this.cache.set(originalUrl, proxyUrl);

    return proxyUrl;
  }

  // Processar lista de músicas para usar proxy
  processAudioUrls(songs) {
    if (!Array.isArray(songs)) return songs;
    
    return songs.map(song => ({
      ...song,
      audioUrl: song.audioUrl ? this.getProxyUrl(song.audioUrl) : song.audioUrl,
      originalAudioUrl: song.audioUrl // Manter URL original para referência
    }));
  }

  // Processar música individual
  processAudioUrl(song) {
    if (!song || !song.audioUrl) return song;
    
    return {
      ...song,
      audioUrl: this.getProxyUrl(song.audioUrl),
      originalAudioUrl: song.audioUrl
    };
  }

  // Limpar cache
  clearCache() {
    this.cache.clear();
  }

  // Obter estatísticas do cache
  getCacheStats() {
    return {
      size: this.cache.size,
      urls: Array.from(this.cache.keys())
    };
  }

  // Testar se proxy está funcionando
  async testProxy(audioUrl) {
    if (!audioUrl) return false;

    try {
      const proxyUrl = this.getProxyUrl(audioUrl);
      console.log('🔍 Testando proxy:', proxyUrl);

      const response = await fetch(proxyUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000) // Timeout de 10 segundos
      });

      console.log(`📊 Proxy response: ${response.status}`);
      return response.ok;
    } catch (error) {
      console.warn('❌ Erro ao testar proxy:', error.message);
      return false;
    }
  }

  // Verificar se CORS está funcionando
  async testCORS(audioUrl) {
    if (!audioUrl) return false;

    try {
      // Testar acesso direto primeiro
      const directResponse = await fetch(audioUrl, {
        method: 'HEAD',
        mode: 'cors',
        signal: AbortSignal.timeout(3000)
      });

      if (directResponse.ok) {
        console.log('✅ CORS funcionando - acesso direto OK');
        return true;
      }
    } catch (error) {
      console.log('❌ CORS não funcionando:', error.message);
      console.log('🔄 Testando proxy...');
    }

    // Se acesso direto falhou, testar proxy
    const proxyWorks = await this.testProxy(audioUrl);
    if (proxyWorks) {
      console.log('✅ Proxy funcionando - CORS resolvido');
    } else {
      console.log('❌ Proxy também falhou');
    }

    return proxyWorks;
  }

  // Configurar automaticamente baseado em teste
  async autoConfigureCORS(audioUrl) {
    if (!audioUrl) return false;

    console.log('🔍 Testando configuração de CORS para:', audioUrl);

    const corsWorking = await this.testCORS(audioUrl);

    if (corsWorking) {
      console.log('🎵 CORS configurado corretamente - usando URLs diretas');
      this.useProxy = false;
    } else {
      console.log('🔄 CORS não funcionando - usando proxy automático');
      this.useProxy = true;
    }

    console.log(`📊 Configuração final: useProxy = ${this.useProxy}`);

    return corsWorking;
  }

  // Preload inteligente de áudio
  async preloadAudio(audioUrl) {
    if (!audioUrl) return false;

    try {
      console.log('⚡ Preload inteligente:', audioUrl);

      const finalUrl = this.getProxyUrl(audioUrl);

      // Criar elemento audio para preload
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.crossOrigin = 'anonymous';

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.log('⏰ Timeout no preload');
          resolve(false);
        }, 8000);

        audio.addEventListener('loadedmetadata', () => {
          clearTimeout(timeout);
          console.log('✅ Preload completo');
          resolve(true);
        });

        audio.addEventListener('error', (e) => {
          clearTimeout(timeout);
          console.log('❌ Erro no preload:', e.target.error?.message);
          resolve(false);
        });

        audio.src = finalUrl;
      });
    } catch (error) {
      console.warn('❌ Erro no preload:', error.message);
      return false;
    }
  }
}

// Instância global
export const audioProxyManager = new AudioProxyManager();

// Funções de conveniência
export const getProxyUrl = (url) => audioProxyManager.getProxyUrl(url);
export const processAudioUrls = (songs) => audioProxyManager.processAudioUrls(songs);
export const processAudioUrl = (song) => audioProxyManager.processAudioUrl(song);
export const testAudioCORS = (url) => audioProxyManager.testCORS(url);

// Hook React para usar proxy de áudio
import { useState, useEffect } from 'react';

export const useAudioProxy = (songs) => {
  const [processedSongs, setProcessedSongs] = useState(songs);
  const [corsStatus, setCorsStatus] = useState('testing');
  const [preloadStatus, setPreloadStatus] = useState('idle');

  useEffect(() => {
    if (!songs || songs.length === 0) return;

    const testAndProcess = async () => {
      // Testar com primeira música
      const firstSong = songs.find(s => s.audioUrl);
      if (firstSong) {
        console.log('🎵 Iniciando configuração de áudio...');

        // Configurar CORS
        const corsWorking = await audioProxyManager.autoConfigureCORS(firstSong.audioUrl);
        setCorsStatus(corsWorking ? 'working' : 'proxy');

        // Processar todas as músicas
        const processed = audioProxyManager.processAudioUrls(songs);
        setProcessedSongs(processed);

        // Preload da primeira música para teste
        setPreloadStatus('loading');
        const preloadSuccess = await audioProxyManager.preloadAudio(firstSong.audioUrl);
        setPreloadStatus(preloadSuccess ? 'ready' : 'error');

        if (preloadSuccess) {
          console.log('🎉 Sistema de áudio configurado e pronto!');
        } else {
          console.log('⚠️ Preload falhou, mas sistema ainda pode funcionar');
        }
      }
    };

    testAndProcess();
  }, [songs]);

  return {
    songs: processedSongs,
    corsStatus,
    preloadStatus,
    isUsingProxy: audioProxyManager.useProxy,
    preloadAudio: audioProxyManager.preloadAudio.bind(audioProxyManager)
  };
};

export default audioProxyManager;

// Sistema de Proxy de Áudio Simplificado
import React, { useState, useEffect, useMemo } from 'react';

class SimpleAudioProxy {
  constructor() {
    this.proxyEndpoint = '/api/audio-proxy';
  }

  // Sempre usar proxy para URLs do Cloudflare R2
  getAudioUrl(originalUrl) {
    if (!originalUrl) return '';
    
    // URLs locais não precisam de proxy
    if (originalUrl.startsWith('/')) {
      return originalUrl;
    }
    
    // URLs do Cloudflare R2 sempre usam proxy
    if (originalUrl.includes('r2.dev') || originalUrl.includes('cloudflarestorage.com')) {
      const encodedUrl = encodeURIComponent(originalUrl);
      return `${this.proxyEndpoint}?url=${encodedUrl}`;
    }
    
    // Outras URLs externas também usam proxy por segurança
    const encodedUrl = encodeURIComponent(originalUrl);
    return `${this.proxyEndpoint}?url=${encodedUrl}`;
  }

  // Processar lista de músicas
  processAudioUrls(songs) {
    if (!Array.isArray(songs)) {
      return [];
    }

    const result = songs.map(song => {
      const processedSong = {
        ...song,
        audioUrl: song.audioUrl ? this.getAudioUrl(song.audioUrl) : song.audioUrl
      };
      return processedSong;
    });

    return result;
  }

  // Teste simples de conectividade
  async testConnection() {
    try {
      // Timeout manual para compatibilidade
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/audio-proxy?test=true', {
        method: 'HEAD',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Instância global
export const simpleAudioProxy = new SimpleAudioProxy();

// Hook React simplificado
export const useSimpleAudioProxy = (songs) => {
  const [processedSongs, setProcessedSongs] = useState([]);
  const [isReady, setIsReady] = useState(false);

  // Estabilizar referência das músicas para evitar re-renders infinitos
  const stableSongs = useMemo(() => {
    return songs;
  }, [songs?.length]);

  useEffect(() => {
    // Se não há músicas, limpar estado
    if (!stableSongs || stableSongs.length === 0) {
      setProcessedSongs([]);
      setIsReady(false);
      return;
    }

    try {
      // Processar URLs - SEMPRE processar para garantir URLs corretas
      const processed = simpleAudioProxy.processAudioUrls(stableSongs);
      setProcessedSongs(processed);
      setIsReady(true);
    } catch (error) {
      setProcessedSongs([]);
      setIsReady(false);
    }

  }, [stableSongs]);

  return {
    songs: processedSongs,
    isReady
  };
};

export default simpleAudioProxy;

import { useState, useEffect, useRef } from 'react';
import { songs } from '../data/songs';

export default function Diagnostico() {
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTest, setCurrentTest] = useState(0);

  const testAudioFiles = async () => {
    setIsLoading(true);
    setTestResults([]);
    setCurrentTest(0);

    // Testar apenas os primeiros 20 arquivos para não sobrecarregar
    const filesToTest = songs.slice(0, 20);
    const results = [];

    for (let i = 0; i < filesToTest.length; i++) {
      const song = filesToTest[i];
      setCurrentTest(i + 1);

      try {
        // Testar URL original
        const originalResponse = await fetch(song.audioUrl, { method: 'HEAD' });

        // Testar URL codificada
        const encodedUrl = song.audioUrl.split('/').map((part, index) => {
          if (index === 0 && part === '') return part;
          return encodeURIComponent(part);
        }).join('/');

        const encodedResponse = await fetch(encodedUrl, { method: 'HEAD' });

        results.push({
          id: song.id,
          title: song.title,
          game: song.game,
          originalUrl: song.audioUrl,
          encodedUrl: encodedUrl,
          originalStatus: originalResponse.status,
          encodedStatus: encodedResponse.status,
          originalOk: originalResponse.ok,
          encodedOk: encodedResponse.ok,
          success: originalResponse.ok || encodedResponse.ok
        });

      } catch (error) {
        results.push({
          id: song.id,
          title: song.title,
          game: song.game,
          originalUrl: song.audioUrl,
          encodedUrl: 'N/A',
          originalStatus: 'ERROR',
          encodedStatus: 'ERROR',
          originalOk: false,
          encodedOk: false,
          success: false,
          error: error.message
        });
      }

      // Pequena pausa para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setTestResults(results);
    setIsLoading(false);
    setCurrentTest(0);
  };

  const successCount = testResults.filter(r => r.success).length;
  const failCount = testResults.filter(r => !r.success).length;

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h1>Diagnóstico de Arquivos de Áudio</h1>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={testAudioFiles}
          disabled={isLoading}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: isLoading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? `Testando... (${currentTest}/20)` : 'Testar Arquivos de Áudio'}
        </button>
      </div>

      {testResults.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h2>Resumo dos Testes</h2>
          <p>✅ Sucessos: {successCount}</p>
          <p>❌ Falhas: {failCount}</p>
          <p>📊 Taxa de sucesso: {((successCount / testResults.length) * 100).toFixed(1)}%</p>
        </div>
      )}

      {testResults.length > 0 && (
        <div>
          <h2>Resultados Detalhados</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12px'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>ID</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Título</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Jogo</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>URL Original</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Status Original</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Status Codificado</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Resultado</th>
                </tr>
              </thead>
              <tbody>
                {testResults.map((result, index) => (
                  <tr key={index} style={{
                    backgroundColor: result.success ? '#d4edda' : '#f8d7da'
                  }}>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{result.id}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{result.title}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{result.game}</td>
                    <td style={{
                      border: '1px solid #ddd',
                      padding: '8px',
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {result.originalUrl}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      {result.originalStatus} {result.originalOk ? '✅' : '❌'}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      {result.encodedStatus} {result.encodedOk ? '✅' : '❌'}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      {result.success ? '✅ OK' : '❌ FALHA'}
                      {result.error && <div style={{ color: 'red', fontSize: '10px' }}>{result.error}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <h3>Informações do Sistema</h3>
        <p><strong>User Agent:</strong> {typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'}</p>
        <p><strong>URL Base:</strong> {typeof window !== 'undefined' ? window.location.origin : 'N/A'}</p>
        <p><strong>Total de músicas:</strong> {songs.length}</p>
      </div>
    </div>
  );
}

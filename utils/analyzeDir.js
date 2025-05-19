const fs = require('fs');
const path = require('path');

function analyzeDirectory(dir) {
  let stats = {
    totalFiles: 0,
    totalDirs: 0,
    byExtension: {},
    allFiles: []
  };

  function scan(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        stats.totalDirs++;
        scan(fullPath);
      } else {
        stats.totalFiles++;
        const ext = path.extname(item).toLowerCase();
        stats.byExtension[ext] = (stats.byExtension[ext] || 0) + 1;
        stats.allFiles.push({
          path: fullPath,
          size: stat.size,
          extension: ext
        });
      }
    }
  }

  scan(dir);
  return stats;
}

const audioDir = path.join(process.cwd(), 'public', 'audio');
console.log('Analisando diretório:', audioDir);

try {
  const stats = analyzeDirectory(audioDir);
  console.log('\nEstatísticas:');
  console.log(`Total de arquivos: ${stats.totalFiles}`);
  console.log(`Total de diretórios: ${stats.totalDirs}`);
  console.log('\nArquivos por extensão:');
  Object.entries(stats.byExtension)
    .sort((a, b) => b[1] - a[1])
    .forEach(([ext, count]) => {
      console.log(`${ext || '(sem extensão)'}: ${count} arquivos`);
    });

  console.log('\nLista de todos os arquivos:');
  stats.allFiles.forEach(file => {
    const relativePath = path.relative(audioDir, file.path);
    console.log(`${relativePath} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
  });
} catch (error) {
  console.error('Erro ao analisar diretório:', error);
} 
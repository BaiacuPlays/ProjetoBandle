const fs = require('fs');
const path = require('path');

function countMp3Files(dir) {
  let files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files = files.concat(countMp3Files(fullPath));
    } else if (item.toLowerCase().endsWith('.mp3')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

const audioDir = path.join(process.cwd(), 'public', 'audio');
const mp3Files = countMp3Files(audioDir);
console.log(`\nTotal de arquivos MP3: ${mp3Files.length}`);
console.log('\nLista de arquivos:');
mp3Files.forEach(file => {
  console.log(path.relative(audioDir, file));
}); 
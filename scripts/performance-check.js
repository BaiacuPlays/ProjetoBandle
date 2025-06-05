#!/usr/bin/env node

// Script para verificar performance do LudoMusic
const fs = require('fs');
const path = require('path');

console.log('🚀 LudoMusic Performance Check\n');

// 1. Verificar tamanho dos arquivos principais
console.log('📊 Análise de Tamanho de Arquivos:');
const checkFileSize = (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    return sizeKB;
  } catch (error) {
    return 'N/A';
  }
};

const mainFiles = [
  'pages/index.js',
  'components/MultiplayerGame.js',
  'utils/audioCache.js',
  'styles/Home.module.css',
  'data/songs.js'
];

mainFiles.forEach(file => {
  const size = checkFileSize(file);
  const status = size > 100 ? '⚠️' : '✅';
  console.log(`${status} ${file}: ${size} KB`);
});

// 2. Verificar imports não utilizados
console.log('\n🔍 Verificando Imports Não Utilizados:');
const checkUnusedImports = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = content.match(/import.*from.*['"`].*['"`];?/g) || [];
    const unusedImports = [];
    
    imports.forEach(importLine => {
      const match = importLine.match(/import\s+(?:{([^}]+)}|\*\s+as\s+(\w+)|(\w+))/);
      if (match) {
        const importedItems = match[1] ? match[1].split(',').map(s => s.trim()) : [match[2] || match[3]];
        importedItems.forEach(item => {
          const cleanItem = item.replace(/\s+as\s+\w+/, '').trim();
          if (cleanItem && !content.includes(cleanItem.split(' ')[0])) {
            unusedImports.push(cleanItem);
          }
        });
      }
    });
    
    return unusedImports;
  } catch (error) {
    return [];
  }
};

const jsFiles = [
  'pages/index.js',
  'components/Footer.js',
  'components/DonationBenefitsModal.js'
];

jsFiles.forEach(file => {
  const unused = checkUnusedImports(file);
  if (unused.length > 0) {
    console.log(`⚠️ ${file}: ${unused.join(', ')}`);
  } else {
    console.log(`✅ ${file}: Sem imports não utilizados`);
  }
});

// 3. Verificar componentes grandes
console.log('\n📦 Análise de Componentes:');
const analyzeComponent = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').length;
    const functions = (content.match(/const\s+\w+\s*=|function\s+\w+/g) || []).length;
    const useEffects = (content.match(/useEffect/g) || []).length;
    const useStates = (content.match(/useState/g) || []).length;
    
    return { lines, functions, useEffects, useStates };
  } catch (error) {
    return null;
  }
};

const components = [
  'pages/index.js',
  'components/MultiplayerGame.js',
  'components/SimpleFriendsModal.js'
];

components.forEach(file => {
  const analysis = analyzeComponent(file);
  if (analysis) {
    const complexity = analysis.lines > 1000 ? '🔴' : analysis.lines > 500 ? '🟡' : '🟢';
    console.log(`${complexity} ${file}:`);
    console.log(`   📏 ${analysis.lines} linhas`);
    console.log(`   🔧 ${analysis.functions} funções`);
    console.log(`   🔄 ${analysis.useEffects} useEffect`);
    console.log(`   📊 ${analysis.useStates} useState`);
  }
});

// 4. Verificar otimizações implementadas
console.log('\n✨ Otimizações Implementadas:');
const optimizations = [
  { name: 'Audio Cache', file: 'utils/audioCache.js' },
  { name: 'Memoized Components', file: 'components/MemoizedComponents.js' },
  { name: 'Lazy Components', file: 'components/LazyComponents.js' },
  { name: 'Performance Optimizer', file: 'utils/performanceOptimizer.js' },
  { name: 'Service Worker', file: 'public/sw.js' }
];

optimizations.forEach(opt => {
  const exists = fs.existsSync(opt.file);
  console.log(`${exists ? '✅' : '❌'} ${opt.name}: ${exists ? 'Implementado' : 'Não encontrado'}`);
});

// 5. Recomendações
console.log('\n💡 Recomendações de Performance:');

const recommendations = [
  '🎯 Use React.memo() para componentes que re-renderizam frequentemente',
  '⚡ Implemente lazy loading para componentes pesados',
  '🗂️ Use useMemo() para cálculos custosos',
  '🔄 Use useCallback() para funções que são passadas como props',
  '📦 Considere code splitting para reduzir bundle inicial',
  '🎵 Mantenha o cache de áudio otimizado (máx 15 itens)',
  '🚀 Use debounce/throttle para eventos frequentes',
  '📱 Otimize para dispositivos móveis com menos recursos'
];

recommendations.forEach(rec => console.log(rec));

// 6. Métricas de bundle (estimativa)
console.log('\n📈 Estimativa de Bundle Size:');
const estimateBundleSize = () => {
  const nodeModulesSize = checkFileSize('node_modules') || 0;
  const pagesSize = checkFileSize('pages') || 0;
  const componentsSize = checkFileSize('components') || 0;
  
  console.log('📦 Estimativas:');
  console.log(`   🟢 Páginas: ~${pagesSize} KB`);
  console.log(`   🟡 Componentes: ~${componentsSize} KB`);
  console.log('   🔵 Vendor (React, Next.js): ~200-300 KB (gzipped)');
  console.log('   🟣 Ícones (react-icons): ~50-100 KB');
  console.log('   ⚪ Total estimado: ~400-600 KB (gzipped)');
};

estimateBundleSize();

console.log('\n🎉 Análise concluída!');
console.log('💡 Para análise mais detalhada, use: npm run build && npm run analyze');

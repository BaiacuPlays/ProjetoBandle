// Script de debug para avatar
// Execute no console do navegador

function debugAvatarFlow() {
  console.log('🔍 === DEBUG AVATAR FLOW ===');
  
  // 1. Verificar se há perfil no localStorage
  const userId = localStorage.getItem('ludomusic_user_id');
  console.log('👤 User ID:', userId);
  
  if (userId) {
    const profileKey = `ludomusic_profile_${userId}`;
    const profileStr = localStorage.getItem(profileKey);
    
    if (profileStr) {
      try {
        const profile = JSON.parse(profileStr);
        console.log('📋 Perfil no localStorage:', {
          username: profile.username,
          avatar: profile.avatar,
          avatarType: typeof profile.avatar,
          avatarLength: profile.avatar?.length
        });
      } catch (error) {
        console.error('❌ Erro ao parsear perfil:', error);
      }
    } else {
      console.log('❌ Nenhum perfil encontrado no localStorage');
    }
  }
  
  // 2. Verificar elementos na página
  const avatarElements = document.querySelectorAll('[class*="avatar"]');
  console.log('🖼️ Elementos de avatar encontrados:', avatarElements.length);
  
  avatarElements.forEach((el, index) => {
    console.log(`Avatar ${index + 1}:`, {
      className: el.className,
      innerHTML: el.innerHTML.substring(0, 100),
      style: el.style.cssText
    });
  });
  
  // 3. Verificar se há imagens carregadas
  const images = document.querySelectorAll('img');
  console.log('🖼️ Imagens na página:', images.length);
  
  images.forEach((img, index) => {
    if (img.src.includes('data:image') || img.alt === 'Avatar') {
      console.log(`Imagem ${index + 1}:`, {
        src: img.src.substring(0, 50) + '...',
        alt: img.alt,
        width: img.width,
        height: img.height,
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight
      });
    }
  });
  
  // 4. Verificar contexto React (se disponível)
  if (window.React) {
    console.log('⚛️ React detectado');
  }
  
  console.log('🔍 === FIM DEBUG ===');
}

function simulateAvatarUpload() {
  console.log('📤 Simulando upload de avatar...');
  
  // Criar uma imagem pequena de teste
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  
  // Desenhar um círculo colorido
  ctx.fillStyle = '#1DB954';
  ctx.fillRect(0, 0, 100, 100);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(50, 50, 30, 0, 2 * Math.PI);
  ctx.fill();
  
  const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
  console.log('🖼️ Imagem de teste criada:', dataUrl.length, 'caracteres');
  
  // Simular salvamento no localStorage
  const userId = localStorage.getItem('ludomusic_user_id');
  if (userId) {
    const profileKey = `ludomusic_profile_${userId}`;
    const profileStr = localStorage.getItem(profileKey);
    
    if (profileStr) {
      try {
        const profile = JSON.parse(profileStr);
        profile.avatar = dataUrl;
        profile.lastUpdated = new Date().toISOString();
        
        localStorage.setItem(profileKey, JSON.stringify(profile));
        console.log('✅ Avatar salvo no localStorage');
        
        // Recarregar página para ver mudanças
        setTimeout(() => {
          console.log('🔄 Recarregando página...');
          window.location.reload();
        }, 1000);
      } catch (error) {
        console.error('❌ Erro ao salvar avatar:', error);
      }
    }
  }
}

function clearAvatar() {
  console.log('🗑️ Removendo avatar...');
  
  const userId = localStorage.getItem('ludomusic_user_id');
  if (userId) {
    const profileKey = `ludomusic_profile_${userId}`;
    const profileStr = localStorage.getItem(profileKey);
    
    if (profileStr) {
      try {
        const profile = JSON.parse(profileStr);
        profile.avatar = null;
        profile.lastUpdated = new Date().toISOString();
        
        localStorage.setItem(profileKey, JSON.stringify(profile));
        console.log('✅ Avatar removido do localStorage');
        
        // Recarregar página para ver mudanças
        setTimeout(() => {
          console.log('🔄 Recarregando página...');
          window.location.reload();
        }, 1000);
      } catch (error) {
        console.error('❌ Erro ao remover avatar:', error);
      }
    }
  }
}

function testEmojiAvatar() {
  console.log('😀 Testando avatar emoji...');
  
  const userId = localStorage.getItem('ludomusic_user_id');
  if (userId) {
    const profileKey = `ludomusic_profile_${userId}`;
    const profileStr = localStorage.getItem(profileKey);
    
    if (profileStr) {
      try {
        const profile = JSON.parse(profileStr);
        profile.avatar = '🎮';
        profile.lastUpdated = new Date().toISOString();
        
        localStorage.setItem(profileKey, JSON.stringify(profile));
        console.log('✅ Avatar emoji salvo no localStorage');
        
        // Recarregar página para ver mudanças
        setTimeout(() => {
          console.log('🔄 Recarregando página...');
          window.location.reload();
        }, 1000);
      } catch (error) {
        console.error('❌ Erro ao salvar avatar emoji:', error);
      }
    }
  }
}

// Exportar funções para uso global
if (typeof window !== 'undefined') {
  window.debugAvatarFlow = debugAvatarFlow;
  window.simulateAvatarUpload = simulateAvatarUpload;
  window.clearAvatar = clearAvatar;
  window.testEmojiAvatar = testEmojiAvatar;
  
  console.log('🔧 Funções de debug de avatar disponíveis:');
  console.log('  - debugAvatarFlow(): Analisa o fluxo completo');
  console.log('  - simulateAvatarUpload(): Simula upload de imagem');
  console.log('  - clearAvatar(): Remove avatar atual');
  console.log('  - testEmojiAvatar(): Testa avatar emoji');
  console.log('\nPara executar: debugAvatarFlow()');
}

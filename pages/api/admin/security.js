// API de administração de segurança
import { kv } from '@vercel/kv';
import { getSecurityStats, blockIP, isIPBlocked } from '../../../utils/security';

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

export default async function handler(req, res) {
  const { method } = req;

  // Verificar autenticação de admin
  const adminPassword = req.headers['x-admin-password'] || req.body?.adminPassword;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'laikas2';

  if (adminPassword !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Acesso negado - senha de admin incorreta' });
  }

  try {
    if (method === 'GET') {
      // Obter estatísticas de segurança
      const stats = await getSecurityStats();
      
      // Obter lista completa de IPs bloqueados
      let blockedIPs = [];
      let blockLogs = [];
      
      if (isDevelopment && !hasKVConfig) {
        // Em desenvolvimento, usar dados locais
        stats.message = 'Dados locais (desenvolvimento)';
      } else {
        try {
          blockedIPs = await kv.get('security:blocked_ips') || [];
          blockLogs = await kv.get('security:block_logs') || [];
        } catch (error) {
          console.error('Erro ao buscar dados de segurança:', error);
        }
      }
      
      return res.status(200).json({
        success: true,
        stats,
        blockedIPs: blockedIPs.slice(0, 100), // Limitar a 100 IPs
        recentBlocks: blockLogs.slice(-20), // Últimos 20 bloqueios
        environment: isDevelopment ? 'development' : 'production',
        kvConfigured: hasKVConfig
      });

    } else if (method === 'POST') {
      const { action, ip, reason } = req.body;

      if (action === 'blockIP') {
        if (!ip) {
          return res.status(400).json({ error: 'IP é obrigatório' });
        }

        const success = await blockIP(ip, reason || 'Bloqueado manualmente pelo admin');
        
        return res.status(200).json({
          success,
          message: success ? `IP ${ip} bloqueado com sucesso` : `Erro ao bloquear IP ${ip}`,
          ip,
          reason: reason || 'Bloqueado manualmente pelo admin'
        });

      } else if (action === 'unblockIP') {
        if (!ip) {
          return res.status(400).json({ error: 'IP é obrigatório' });
        }

        try {
          if (isDevelopment && !hasKVConfig) {
            return res.status(200).json({
              success: true,
              message: 'Funcionalidade não disponível em desenvolvimento local',
              ip
            });
          }

          const blockedIPs = await kv.get('security:blocked_ips') || [];
          const updatedIPs = blockedIPs.filter(blockedIP => blockedIP !== ip);
          
          await kv.set('security:blocked_ips', updatedIPs);
          
          // Log do desbloqueio
          const unblockLog = {
            ip,
            action: 'unblocked',
            reason: 'Desbloqueado pelo admin',
            timestamp: new Date().toISOString(),
            id: `unblock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
          };
          
          const logs = await kv.get('security:block_logs') || [];
          logs.push(unblockLog);
          
          if (logs.length > 1000) {
            logs.splice(0, logs.length - 1000);
          }
          
          await kv.set('security:block_logs', logs);
          
          return res.status(200).json({
            success: true,
            message: `IP ${ip} desbloqueado com sucesso`,
            ip
          });

        } catch (error) {
          console.error('Erro ao desbloquear IP:', error);
          return res.status(500).json({
            success: false,
            error: 'Erro ao desbloquear IP',
            ip
          });
        }

      } else if (action === 'clearAllBlocks') {
        try {
          if (isDevelopment && !hasKVConfig) {
            return res.status(200).json({
              success: true,
              message: 'Funcionalidade não disponível em desenvolvimento local'
            });
          }

          await kv.set('security:blocked_ips', []);
          
          // Log da limpeza
          const clearLog = {
            action: 'clear_all_blocks',
            reason: 'Limpeza manual pelo admin',
            timestamp: new Date().toISOString(),
            id: `clear_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
          };
          
          const logs = await kv.get('security:block_logs') || [];
          logs.push(clearLog);
          
          await kv.set('security:block_logs', logs);
          
          return res.status(200).json({
            success: true,
            message: 'Todos os IPs foram desbloqueados'
          });

        } catch (error) {
          console.error('Erro ao limpar bloqueios:', error);
          return res.status(500).json({
            success: false,
            error: 'Erro ao limpar bloqueios'
          });
        }

      } else if (action === 'checkIP') {
        if (!ip) {
          return res.status(400).json({ error: 'IP é obrigatório' });
        }

        const isBlocked = await isIPBlocked(ip);
        
        return res.status(200).json({
          success: true,
          ip,
          isBlocked,
          message: isBlocked ? `IP ${ip} está bloqueado` : `IP ${ip} não está bloqueado`
        });

      } else {
        return res.status(400).json({ error: 'Ação inválida' });
      }

    } else if (method === 'DELETE') {
      // Limpar logs antigos
      try {
        if (isDevelopment && !hasKVConfig) {
          return res.status(200).json({
            success: true,
            message: 'Funcionalidade não disponível em desenvolvimento local'
          });
        }

        const logs = await kv.get('security:block_logs') || [];
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        const recentLogs = logs.filter(log => {
          const logTime = new Date(log.timestamp).getTime();
          return logTime > oneWeekAgo;
        });
        
        await kv.set('security:block_logs', recentLogs);
        
        return res.status(200).json({
          success: true,
          message: `Logs antigos removidos. ${logs.length - recentLogs.length} logs removidos.`,
          removedCount: logs.length - recentLogs.length,
          remainingCount: recentLogs.length
        });

      } catch (error) {
        console.error('Erro ao limpar logs:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro ao limpar logs'
        });
      }

    } else {
      return res.status(405).json({ error: 'Método não permitido' });
    }

  } catch (error) {
    console.error('Erro na API de segurança:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
}

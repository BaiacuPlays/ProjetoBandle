// API de autenticação para admin
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { password } = req.body;

  // Senha de admin (em produção, use variável de ambiente)
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

  if (password === ADMIN_PASSWORD) {
    return res.status(200).json({ success: true });
  } else {
    return res.status(401).json({ error: 'Senha incorreta' });
  }
}

#!/bin/bash

# Script de build otimizado para Vercel
echo "🚀 Iniciando build otimizado para Vercel..."

# Limpar cache se necessário
echo "🧹 Limpando cache..."
rm -rf .next
rm -rf node_modules/.cache

# Instalar dependências
echo "📦 Instalando dependências..."
npm ci --production=false

# Build do Next.js
echo "🔨 Executando build do Next.js..."
npm run build

echo "✅ Build concluído com sucesso!"

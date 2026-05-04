#!/bin/bash

# Script de limpieza para el proyecto Soy Conservación

echo "🧹 Limpiando cache y archivos temporales..."

# Limpiar cache de Turbo
echo "📦 Limpiando cache de Turbo..."
rm -rf .turbo

# Limpiar builds
echo "🏗️ Limpiando builds..."
rm -rf backend/dist
rm -rf frontend/.next

# Limpiar cache de TypeScript
echo "📝 Limpiando cache de TypeScript..."
find . -name "*.tsbuildinfo" -delete

# Limpiar logs de backend
echo "📋 Limpiando logs de backend..."
> backend/logs/combined.log
> backend/logs/error.log

# Limpiar cache de pnpm
echo "📦 Limpiando cache de pnpm..."
pnpm store prune

echo "✅ Limpieza completada!"

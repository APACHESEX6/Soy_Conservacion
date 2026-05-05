#!/bin/bash

# Script de configuración inicial del proyecto Soy Conservación

echo "🚀 Configurando entorno de desarrollo..."

# Instalar dependencias
echo "📦 Instalando dependencias..."
pnpm install

# Configurar pre-commit hooks
echo "🔧 Configurando hooks de Git..."
pnpm prepare

# Construir proyecto
echo "🏗️ Construyendo proyecto..."
pnpm build

# Ejecutar tests
echo "🧪 Ejecutando tests..."
pnpm test

echo "✅ Configuración completada!"
echo "🎯 Ejecuta 'pnpm dev' para iniciar el servidor de desarrollo"

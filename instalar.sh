#!/data/data/com.termux/files/usr/bin/bash

echo "Instalando dependencias de Baxto Bot..."

pkg update && pkg upgrade -y
pkg install nodejs -y
pkg install git -y

echo "Instalando paquetes NPM..."
npm install

echo "¡Instalación completa!"
echo "Para iniciar el bot, escribe: node index.js"

#!/bin/bash
# Configuración de colores (Estilo Ubuntu/ANSI)
BLUE='\033[01;34m'
GREEN='\033[01;32m'
YELLOW='\033[01;33m'
RED='\033[00;31m'
RESET='\033[0m'

echo -e "==== Iniciando servidor ===="

if ! netstat -ano 2>/dev/null | grep -q ":80 " >/dev/null 2>&1; then
    PUERTO=80
    URL="http://localhost"
else
    PUERTO=3300
    URL="http://localhost:3300"
fi

# Esperar unos segundos para asegurar que esté listo
sleep 5

# Mostrar información al usuario
echo -e "\nURL: ${BLUE}${URL}${RESET}"
echo -e "Carpeta: /app"
echo -e "Logs: ${YELLOW}server.log${RESET}"
echo -e "Apagar servidor: ${YELLOW}Ctrl + C${RESET}"

# Inicia el servidor de Python
python -m http.server "$PUERTO" --directory ./app > server.log 2>&1 & PID_SERVIDOR=$!

# Verificación rápida
if [ $? -eq 0 ]; then
    echo -e "Estado: ${GREEN}Servidor corriendo en background (PID: $PID_SERVIDOR)${RESET}"
else
    echo -e "${RED}Error al iniciar el servidor.${RESET}"
    exit 1
fi

# Detección de SO para abrir el navegador
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    # Windows (Git Bash)
    start "$URL"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "$URL"
else
    # Linux (Debian, Ubuntu, etc.)
    xdg-open "$URL"
fi

trap 'kill $PID_SERVIDOR; echo -e "\n${RED}Servidor detenido.${RESET}";exit' SIGINT

wait $PID_SERVIDOR
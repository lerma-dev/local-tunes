import os
import sys
import time
import webbrowser
import signal
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading

# Códigos de colores ANSI
BLUE = "\033[01;34m"
GREEN = "\033[01;32m"
YELLOW = "\033[01;33m"
RED = "\033[00;31m"
RESET = "\033[0m"

PUERTO = 3300
URL = f"http://localhost:{PUERTO}"
CARPETA = "./app"
LOG_FILE = "server.log"

def banner():
    print(f"{BLUE}==== Iniciando servidor ===={RESET}")
    time.sleep(1)
    print(f"\nURL: {BLUE}{URL}{RESET}")
    print(f"Carpeta: {CARPETA}")
    print(f"Logs: {YELLOW}{LOG_FILE}{RESET}")
    print(f"Apagar servidor: {YELLOW}Ctrl + C{RESET}\n")

def run_server():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    if not os.path.exists(CARPETA):
        os.makedirs(CARPETA, exist_ok=True)

    # Abrir el archivo de logs para escribir en él
    log_file_obj = open(LOG_FILE, "w", encoding="utf-8")

    class CustomHandler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=CARPETA, **kwargs)
        
        def log_message(self, format, *args):
            # Escribe las peticiones del servidor únicamente en el archivo de log (sin tocar la terminal)
            log_line = f"[{self.log_date_time_string()}] {format%args}\n"
            log_file_obj.write(log_line)
            log_file_obj.flush()

    server = HTTPServer(('127.0.0.1', PUERTO), CustomHandler)
    
    print(f"Estado: {GREEN}Servidor corriendo en background (PID: {os.getpid()}){RESET}")
    
    # Abrir el navegador tras un breve retraso
    threading.Timer(1.0, lambda: webbrowser.open(URL)).start()

    def signal_handler(sig, frame):
        print(f"\n{RED}Servidor detenido.{RESET}")
        log_file_obj.close()
        server.server_close()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)

    try:
        server.serve_forever()
    except Exception as e:
        print(f"{RED}Error al iniciar el servidor: {e}{RESET}")
        log_file_obj.close()
        sys.exit(1)

if __name__ == "__main__":
    banner()
    run_server()
import webview 
import os
import sys
import threading
import subprocess
from flask_server import run_flask_server, set_serial_reader
import time
from window_manager import UIMain
from serial_reader import SerialReader

if getattr(sys, 'frozen', False):
    DEV = False
else:
    DEV = True

VITE_PORT = 5173
FLASK_PORT = 8080
vite_process = None

def start_vite():
    global vite_process
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    frontend_dir = os.path.join(root_dir, 'frontend')
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    
    print("Iniciando servidor Vite...")
    try:
        vite_process = subprocess.Popen(
            [npm_cmd, "run", "dev"],
            cwd=frontend_dir,
            shell=True
        )
        time.sleep(3)
    except Exception as e:
        print(f"Erro ao iniciar Vite: {e}")

def stop_vite():
    global vite_process
    if vite_process:
        print("Parando servidor Vite...")
        try:
            subprocess.call(['taskkill', '/F', '/T', '/PID', str(vite_process.pid)]) if os.name == 'nt' else vite_process.kill()
        except:
            pass

def start_flask_thread():
    run_flask_server(host='0.0.0.0', port=FLASK_PORT, debug=DEV)

if __name__ == '__main__':
    if getattr(sys, 'frozen', False):
        try:
            exe_dir = os.path.dirname(sys.executable)
            log_path = os.path.join(exe_dir, 'debug_supervisorio.log')
            f = open(log_path, 'w', encoding='utf-8', buffering=1)
            sys.stdout = f
            sys.stderr = f
        except:
            pass

    serial_reader = SerialReader(port='COM7', baudrate=115200)
    set_serial_reader(serial_reader)
    serial_reader.start()

    if DEV:
        PORT = VITE_PORT
        print(f"Modo de desenvolvimento - Vite server na porta {VITE_PORT}")
        start_vite()
        flask_thread = threading.Thread(target=start_flask_thread, daemon=True)
        flask_thread.start()
    else:
        PORT = FLASK_PORT
        flask_thread = threading.Thread(target=start_flask_thread, daemon=True)
        flask_thread.start()
        time.sleep(2)
    
    ui = UIMain(port=PORT)
    ui.open_user_window()
    ui.open_admin_window() 
        
    print("Janelas abertas.")
    print("Aplicação iniciada. Feche a janela de admin para encerrar.")

    ui.wait_for_windows()
    serial_reader.stop()
    
    if DEV:
        stop_vite()
    
    serial_reader.stop()

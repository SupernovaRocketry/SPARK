import os
import shutil
import subprocess
import sys

def build_frontend(base_dir):
    print("\n=== COMPILANDO FRONTEND (REACT/VITE) ===")
    frontend_dir = os.path.join(base_dir, 'frontend')
    npm = "npm.cmd" if os.name == 'nt' else "npm"
    
    subprocess.run([npm, "install"], cwd=frontend_dir, check=True, shell=True)
    subprocess.run([npm, "run", "build"], cwd=frontend_dir, check=True, shell=True)

def build_backend(base_dir):
    print("\n=== COMPILANDO BACKEND (PYINSTALLER) ===")
    backend_dir = os.path.join(base_dir, 'backend')
    frontend_dist = os.path.join(base_dir, 'frontend', 'dist')
    path_sep = ";" if os.name == 'nt' else ":"
    
    args = [
        "pyinstaller", "--noconfirm", "--onefile", "--clean", "--windowed",
        "--name=Supervisorio",
        f"--paths={backend_dir}",
        f"--add-data={frontend_dist}{path_sep}dist",
        "--hidden-import=engineio.async_drivers.threading",
        "--hidden-import=flask_socketio",
        "--hidden-import=socketio",
        "--hidden-import=webview",
        "--hidden-import=serial",
        "--hidden-import=eventlet",
        "--hidden-import=eventlet.hubs.epolls",
        "--hidden-import=eventlet.hubs.kqueue",
        "--hidden-import=eventlet.hubs.selects",
        "--hidden-import=dns",
        os.path.join(backend_dir, 'main.py')
    ]
    
    subprocess.run(args, check=True)

def cleanup(base_dir):
    print("\nLimpando arquivos temporários...")
    for path in ['build', 'Supervisorio.spec']:
        full_path = os.path.join(base_dir, path)
        if os.path.exists(full_path):
            if os.path.isfile(full_path): os.remove(full_path)
            else: shutil.rmtree(full_path)

    frontend_dist = os.path.join(base_dir, 'frontend', 'dist')
    if os.path.exists(frontend_dist):
        shutil.rmtree(frontend_dist)

    exe_name = "Supervisorio.exe" if os.name == 'nt' else "Supervisorio"
    print(f"\nExecutável gerado em: {os.path.join(base_dir, 'dist', exe_name)}")

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    try:
        import PyInstaller
    except ImportError:
        print("PyInstaller não está instalado.")

    try:
        build_frontend(base_dir)
        build_backend(base_dir)
        cleanup(base_dir)
    except subprocess.CalledProcessError as e:
        print(f"\nERRO CRÍTICO DURANTE O BUILD: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\nERRO INESPERADO: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

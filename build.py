import os
import subprocess
import sys
import shutil

def print_step(message):
    print(f"\n{'='*50}")
    print(f" {message}")
    print(f"{'='*50}\n")

def get_base_dir():
    return os.path.dirname(os.path.abspath(__file__))

def check_npm():
    npm_cmd = "npm.cmd" if os.name == 'nt' else "npm"
    try:
        subprocess.run([npm_cmd, "--version"], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return npm_cmd
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("ERRO: NPM não encontrado. Instale o Node.js para compilar o frontend.")
        sys.exit(1)

def build_frontend(base_dir, npm_cmd):
    print_step("1. COMPILANDO FRONTEND (REACT/VITE)")
    
    frontend_dir = os.path.join(base_dir, 'frontend')
    
    # Instalar dependências
    print(">>> Instalando dependências (npm install)...")
    subprocess.run([npm_cmd, "install"], cwd=frontend_dir, check=True, shell=True)
    
    # Compilar (npm run build)
    print(">>> Compilando projeto (npm run build)...")
    subprocess.run([npm_cmd, "run", "build"], cwd=frontend_dir, check=True, shell=True)
    
    # Verificar se dist foi criada
    dist_dir = os.path.join(frontend_dir, 'dist')
    if not os.path.exists(dist_dir):
        print("ERRO: A pasta 'dist' não foi criada no frontend.")
        sys.exit(1)
        
    print("Frontend compilado com sucesso!")

def build_backend(base_dir):
    print_step("2. COMPILANDO BACKEND (PYINSTALLER)")
    
    backend_dir = os.path.join(base_dir, 'backend')
    main_script = os.path.join(backend_dir, 'main.py')
    
    # Separador de path depende do SO (Windows uses ;, Linux/Mac uses :)
    path_sep = ";" if os.name == 'nt' else ":"
    
    # Caminho do dist do frontend
    frontend_dist = os.path.join(base_dir, 'frontend', 'dist')
    
    # Argumentos do PyInstaller
    args = [
        "pyinstaller",
        "--noconfirm",
        "--onefile",
        "--clean",
        "--windowed",  # Não abre console preto (GUI mode)
        "--name=Supervisorio",
        
        # Onde procurar imports
        f"--paths={backend_dir}",
        
        # Incluir pasta dist do frontend dentro da pasta 'dist' do executável
        f"--add-data={frontend_dist}{path_sep}dist",
        
        # Imports ocultos que o PyInstaller as vezes perde
        "--hidden-import=engineio.async_drivers.threading",
        "--hidden-import=flask_socketio",
        "--hidden-import=socketio",
        "--hidden-import=webview",
        "--hidden-import=serial",
        "--hidden-import=eventlet",
        "--hidden-import=eventlet.hubs.epolls",
        "--hidden-import=eventlet.hubs.kqueue",
        "--hidden-import=eventlet.hubs.selects",
        # Incluir dns para evitar erros em algumas versoes do eventlet
        "--hidden-import=dns",
        
        # Ícone (opcional, se tiver depois pode descomentar)
        # f"--icon={os.path.join(backend_dir, 'icon.ico')}",
        
        # Script principal
        main_script
    ]
    
    print(f"Executando: {' '.join(args)}")
    
    try:
        subprocess.run(args, check=True)
        print("Backend compilado com sucesso!")
    except subprocess.CalledProcessError:
        print("ERRO: Falha no PyInstaller.")
        sys.exit(1)

def cleanup(base_dir):
    print_step("FINALIZANDO E LIMPANDO")
    dist_folder = os.path.join(base_dir, 'dist')
    build_folder = os.path.join(base_dir, 'build')
    spec_file = os.path.join(base_dir, 'Supervisorio.spec')
    frontend_dist = os.path.join(base_dir, 'frontend', 'dist')
    
    # 1. Verifica se o executável foi criado
    executable = "Supervisorio.exe" if os.name == 'nt' else "Supervisorio"
    
    # Caminhos possíveis (OneFile ou OneDir)
    onefile_path = os.path.join(dist_folder, executable)
    onedir_path = os.path.join(dist_folder, 'Supervisorio', executable)
    
    if os.path.exists(onefile_path):
        print(f"SUCESSO! Seu executável (arquivo único) está pronto em:\n{onefile_path}\n")
    elif os.path.exists(onedir_path):
        print(f"SUCESSO! Seu executável (pasta) está pronto em:\n{onedir_path}\n")
    else:
        print("Aviso: O processo terminou, mas não encontrei o executável final.")

    # 2. Remove pasta build (cache do PyInstaller)
    if os.path.exists(build_folder):
        print("Removendo pasta temporária 'build'...")
        try:
            shutil.rmtree(build_folder)
        except Exception as e:
            print(f"Erro ao remover build: {e}")

    # 3. Remove arquivo .spec
    if os.path.exists(spec_file):
        print("Removendo arquivo 'Supervisorio.spec'...")
        try:
            os.remove(spec_file)
        except Exception as e:
            print(f"Erro ao remover spec: {e}")
            
    # 4. Remove dist do frontend (opcional, já foi copiada para dentro do exe)
    # Se quiser manter para debug, comente as linhas abaixo
    if os.path.exists(frontend_dist):
        print("Removendo pasta temporária 'frontend/dist'...")
        try:
            shutil.rmtree(frontend_dist)
        except Exception as e:
            print(f"Erro ao remover frontend/dist: {e}")

def main():
    base_dir = get_base_dir()
    
    # 0. Instalar dependency de build
    try:
        import PyInstaller
    except ImportError:
        print("Instalando PyInstaller...")
        subprocess.run([sys.executable, "-m", "pip", "install", "pyinstaller"], check=True)

    npm_cmd = check_npm()
    build_frontend(base_dir, npm_cmd)
    build_backend(base_dir)
    cleanup(base_dir)

if __name__ == "__main__":
    main()

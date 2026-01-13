import os
import sys
import subprocess

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, 'backend')
    main_script = os.path.join(backend_dir, 'main.py')
    
    args = [sys.executable, main_script] + sys.argv[1:]
    
    env = os.environ.copy()
    if 'PYTHONPATH' in env:
        env['PYTHONPATH'] = backend_dir + os.pathsep + env['PYTHONPATH']
    else:
        env['PYTHONPATH'] = backend_dir

    print(f"Iniciando aplicação via {main_script}...")
    
    try:
        subprocess.run(args, env=env, check=True)
    except KeyboardInterrupt:
        pass
    except subprocess.CalledProcessError as e:
        sys.exit(e.returncode)

if __name__ == "__main__":
    main()

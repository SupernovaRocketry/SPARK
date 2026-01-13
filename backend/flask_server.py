import os
import sys
from flask import Flask, send_from_directory, send_file, request, redirect
from flask_socketio import SocketIO

socketio = SocketIO(cors_allowed_origins="*", async_mode='threading')

SERVER_ADMIN_TOKEN = None
ADMIN_SESSIONS = set()

def create_server(is_dev=False):
    app = Flask(__name__)
    
    if getattr(sys, 'frozen', False):
        DIST_DIR = os.path.join(sys._MEIPASS, 'dist')
    else:
        DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist'))
    
    @app.route('/')
    def serve_index():
        if is_dev:
            hostname = request.host.split(':')[0]
            return redirect(f"http://{hostname}:5173")
        return send_file(os.path.join(DIST_DIR, 'index.html'))
    
    @app.route('/<path:path>')
    def serve_static(path):
        if is_dev:
            hostname = request.host.split(':')[0]
            return redirect(f"http://{hostname}:5173/{path}")

        file_path = os.path.join(DIST_DIR, path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return send_from_directory(DIST_DIR, path)
        return send_file(os.path.join(DIST_DIR, 'index.html'))
    
    return app

@socketio.on('connect')
def handle_connect(auth=None):
    global SERVER_ADMIN_TOKEN
    sid = request.sid
    client_token = None
    
    if isinstance(auth, dict):
        client_token = auth.get('admin_token')

    if client_token:
        if SERVER_ADMIN_TOKEN is None:
            SERVER_ADMIN_TOKEN = client_token
            ADMIN_SESSIONS.add(sid)
            socketio.emit('admin_auth_success', room=sid)
        elif SERVER_ADMIN_TOKEN == client_token:
            ADMIN_SESSIONS.add(sid)
            socketio.emit('admin_auth_success', room=sid)
        else:
            socketio.emit('admin_auth_failed', "Token inválido.", room=sid)
    else:
        pass

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    if sid in ADMIN_SESSIONS:
        ADMIN_SESSIONS.discard(sid)

@socketio.on('admin_publish_data')
def handle_admin_publish(data):
    sid = request.sid
    if sid not in ADMIN_SESSIONS:
        socketio.emit('admin_auth_failed', "Não autenticado.", room=sid)
        return
    socketio.emit('data_update', data)

def run_flask_server(host='127.0.0.1', port=8080, debug=False):
    app = create_server(is_dev=debug)
    socketio.init_app(app)
    socketio.run(app, host=host, port=port, debug=debug, use_reloader=False, allow_unsafe_werkzeug=True)

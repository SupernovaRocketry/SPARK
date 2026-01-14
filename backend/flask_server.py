import os
import sys
import glob
from flask import Flask, send_from_directory, send_file, request, redirect
from flask_socketio import SocketIO

socketio = SocketIO(cors_allowed_origins="*", async_mode='threading')

SERVER_ADMIN_TOKEN = None
ADMIN_SESSIONS = set()
CONNECTED_CLIENTS = {}

def get_available_widgets():
    widgets = []
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        widgets_dir = os.path.join(base_dir, '..', 'frontend', 'src', 'components', 'widgets')
        if os.path.exists(widgets_dir):
            files = glob.glob(os.path.join(widgets_dir, '*.tsx'))
            for f in files:
                name = os.path.basename(f).replace('.tsx', '')
                widgets.append(name)
    except Exception as e:
        print(f"erro ao escanear widgets: {e}")
    
    if not widgets:
        return []
    return sorted(widgets)

AVAILABLE_WIDGETS = get_available_widgets()

GLOBAL_WIDGETS = list(AVAILABLE_WIDGETS) 
USER_WIDGET_CONFIG = {} 

def get_client_widgets(client_id):
    if client_id in USER_WIDGET_CONFIG:
        return USER_WIDGET_CONFIG[client_id]
    return GLOBAL_WIDGETS


def broadcast_clients_update():
    clients_list = [
        {
            'id': info['id'], 
            'type': info['type'], 
            'ip': info['ip'], 
            'sid': sid,
            'widgets': get_client_widgets(info['id'])
        }
        for sid, info in CONNECTED_CLIENTS.items()
    ]
    for admin_sid in ADMIN_SESSIONS:
        socketio.emit('clients_update', clients_list, room=admin_sid)

@socketio.on('get_global_widgets')
def handle_get_global_widgets():
    sid = request.sid
    if sid in ADMIN_SESSIONS:
        socketio.emit('global_widgets_update', GLOBAL_WIDGETS, room=sid)

@socketio.on('update_global_widgets')
def handle_update_global_widgets(widgets):
    global GLOBAL_WIDGETS
    sid = request.sid
    if sid in ADMIN_SESSIONS:
        GLOBAL_WIDGETS = widgets
        socketio.emit('global_widgets_update', GLOBAL_WIDGETS)
        broadcast_clients_update()
        
        for client_sid, info in CONNECTED_CLIENTS.items():
            if info['type'] == 'Viewer':
                client_id = info['id']
                if client_id not in USER_WIDGET_CONFIG:
                    socketio.emit('widget_permissions', GLOBAL_WIDGETS, room=client_sid)

@socketio.on('update_client_widgets')
def handle_update_client_widgets(data):
    sid = request.sid
    if sid in ADMIN_SESSIONS:
        target_id = data.get('client_id')
        widgets = data.get('widgets')
        
        if widgets == 'GLOBAL': 
            if target_id in USER_WIDGET_CONFIG:
                del USER_WIDGET_CONFIG[target_id]
        else:
            USER_WIDGET_CONFIG[target_id] = widgets
            
        broadcast_clients_update()
        
        target_widgets = get_client_widgets(target_id)
        for client_sid, info in CONNECTED_CLIENTS.items():
            if info['id'] == target_id:
                socketio.emit('widget_permissions', target_widgets, room=client_sid)

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
    
    client_id = sid
    client_type = 'Viewer'
    admin_secret = None

    if isinstance(auth, dict):
        if auth.get('id'):
            client_id = auth.get('id')
        
        admin_secret = auth.get('admin_secret')

    if admin_secret:
        if SERVER_ADMIN_TOKEN is None:
            SERVER_ADMIN_TOKEN = admin_secret
            ADMIN_SESSIONS.add(sid)
            socketio.emit('admin_auth_success', room=sid)
            client_type = 'Admin'
        elif SERVER_ADMIN_TOKEN == admin_secret:
            ADMIN_SESSIONS.add(sid)
            socketio.emit('admin_auth_success', room=sid)
            client_type = 'Admin'
        else:
            socketio.emit('admin_auth_failed', "Token inválido.", room=sid)
    
    CONNECTED_CLIENTS[sid] = {
        'id': client_id,
        'type': client_type,
        'ip': request.remote_addr
    }
    
    if client_type == 'Viewer':
        widgets = get_client_widgets(client_id)
        socketio.emit('widget_permissions', widgets, room=sid)
    elif client_type == 'Admin':
         socketio.emit('global_widgets_update', GLOBAL_WIDGETS, room=sid)

    broadcast_clients_update()

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    if sid in ADMIN_SESSIONS:
        ADMIN_SESSIONS.discard(sid)
    
    if sid in CONNECTED_CLIENTS:
        del CONNECTED_CLIENTS[sid]

    broadcast_clients_update()

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

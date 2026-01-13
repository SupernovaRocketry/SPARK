import sys
import webview
import requests
import time
from typing import Optional, Dict, List
from abc import ABC

localhost = "127.0.0.1"

class BaseWindow(ABC):
    def __init__(self, title: str, route: str, port: int, width: int = 1200, height: int = 800, host: str = localhost, auto_open: bool = True):
        self.title = title
        self.route = route
        self.port = port
        self.host = host
        self.width = width
        self.height = height
        self.url = f"http://{self.host}:{self.port}{self.route}"
        self.window: Optional[webview.Window] = None
        self._is_created = False
        
        if auto_open:
            self.create_window()

    def create_window(self) -> webview.Window:
        if self._is_created:
            raise RuntimeError(f"A janela '{self.title}' já foi criada.")

        self.window = webview.create_window(
            title=self.title,
            url=self.url,
            width=self.width,
            height=self.height
        )
        self.window.events.closed += self._on_window_closed
        self._is_created = True
        return self.window

    def _on_window_closed(self):
        self._is_created = False

    def close_window(self):
        if self.window and self._is_created:
            try:
                self.window.destroy()
            except Exception:
                pass
            self._is_created = False

    def is_created(self) -> bool:
        return self._is_created

class UserWindow(BaseWindow):
    def __init__(self, port: int, auto_open: bool = True):
        super().__init__(title="Supervisório", route="/", port=port, width=1400, height=900, auto_open=auto_open)

class AdminWindow(BaseWindow):
    def __init__(self, port: int, ui_main=None, auto_open: bool = True):
        self.ui_main = ui_main
        super().__init__(title="Painel de Administrador", route="/admin", port=port, width=1200, height=800, auto_open=auto_open)
    
    def _on_window_closed(self):
        super()._on_window_closed()
        if self.ui_main:
            self.ui_main.shutdown()
        else:
            sys.exit(0)

class UIMain:
    def __init__(self, port: int, host: str = localhost):
        self.port = port
        self.host = host
        self.windows: Dict[str, BaseWindow] = {}
        self._running = True
        self._webview_started = False
        self._wait_for_server()

    def _wait_for_server(self, timeout=10):
        url = f"http://{self.host}:{self.port}/"
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                requests.get(url, timeout=1)
                return True
            except requests.RequestException:
                time.sleep(0.5)
        return False

    def open_user_window(self, key: str = "user") -> UserWindow:
        if key in self.windows and self.windows[key].is_created():
            raise RuntimeError(f"A janela '{key}' já está aberta.")
        window = UserWindow(port=self.port)
        self.windows[key] = window
        return window

    def open_admin_window(self, key: str = "admin") -> AdminWindow:
        if key in self.windows and self.windows[key].is_created():
            raise RuntimeError(f"A janela '{key}' já está aberta.")
        if any(isinstance(w, AdminWindow) and w.is_created() for w in self.windows.values()):
            raise RuntimeError("A janela de administrador já está aberta.")
        window = AdminWindow(port=self.port, ui_main=self)
        self.windows[key] = window
        return window

    def close_window(self, key: str):
        if key in self.windows and self.windows[key].is_created():
            self.windows[key].close_window()
            del self.windows[key]

    def close_all_windows(self):
        for key in list(self.windows.keys()):
            if self.windows[key].is_created():
                self.windows[key].close_window()
        self.windows.clear()

    def list_open_windows(self) -> List[str]:
        return [key for key, win in self.windows.items() if win.is_created()]

    def shutdown(self):
        self._running = False
        self.close_all_windows()
        sys.exit(0)

    def is_running(self) -> bool:
        return self._running

    def start_webview(self):
        if not self._webview_started:
            self._webview_started = True
            webview.start(debug=False)
            self._on_all_windows_closed()

    def _on_all_windows_closed(self):
        self._running = False

    def wait_for_windows(self):
        try:
            self.start_webview()
        except KeyboardInterrupt:
            self.shutdown()

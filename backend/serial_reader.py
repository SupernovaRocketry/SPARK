import threading
import time
import serial
import json
from flask_server import socketio

class SerialReader:
    def __init__(self, port="COM7", baudrate=115200):
        self.port = port
        self.baudrate = baudrate
        self.running = False
        self.thread = None
        self.serial_conn = None
        self.last_emit_time = 0
        self.emit_interval = 0.033

    def start(self):
        if self.running:
            return
        self.running = True
        self.thread = threading.Thread(target=self._run_loop, daemon=True)
        self.thread.start()

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join(timeout=1.0)
        if self.serial_conn and self.serial_conn.is_open:
            self.serial_conn.close()

    def _run_loop(self):
        while self.running:
            if not self.serial_conn or not self.serial_conn.is_open:
                try:
                    self.serial_conn = serial.Serial(self.port, self.baudrate, timeout=1)
                    self.serial_conn.reset_input_buffer()
                except Exception:
                    time.sleep(2)
                    continue

            try:
                if self.serial_conn.in_waiting:
                    line = self.serial_conn.readline()
                    if line:
                        try:
                            decoded = line.decode('utf-8', errors='replace').strip()
                            if decoded:
                                data = json.loads(decoded)
                                socketio.emit('data_update', data, namespace='/')
                        except (json.JSONDecodeError, ValueError):
                            pass
                else:
                    time.sleep(0.001)
            except Exception:
                if self.serial_conn:
                    self.serial_conn.close()
                time.sleep(1)

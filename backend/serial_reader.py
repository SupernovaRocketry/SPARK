import threading
import time
import math
import serial
import serial.tools.list_ports
import json
from flask_server import socketio

class SerialReader:
    def __init__(self, port="COM0", baudrate=115200):
        self.port = port
        self.baudrate = baudrate
        self.running = False
        self.thread = None
        self.serial_conn = None
        self.last_valid_data = 0
        
    def start(self):
        if self.running:
            return
        self.running = True
        self.thread = threading.Thread(target=self._run_loop, daemon=True)
        self.thread.start()

    def set_port(self, new_port):
        print(f"Alterando porta serial para: {new_port}")
        self.port = new_port
        if self.serial_conn and self.serial_conn.is_open:
            self.serial_conn.close() 
            
    def get_ports_info(self):
        ports = serial.tools.list_ports.comports()
        results = []

        sim_active = (self.port == "SIMULATOR")
        results.append({
            "port": "SIMULATOR",
            "description": "Simulador de Dados",
            "status": "connected" if sim_active else "available",
            "active": sim_active
        })

        for p in ports:
            status = "available"
            is_active = False
            
            if p.device == self.port:
                if self.serial_conn and self.serial_conn.is_open:
                    status = "connected"
                    if time.time() - self.last_valid_data < 2.0:
                        status = "active_data"
                        is_active = True
                else:
                    status = "error_connecting"
            
            else:
                try:
                    s = serial.Serial(p.device, self.baudrate, timeout=0.5)
                    line = s.readline()
                    s.close()
                    if line:
                        try:
                            json.loads(line.decode('utf-8', errors='ignore'))
                            status = "available_with_data"
                            is_active = True
                        except:
                            pass
                except (OSError, serial.SerialException):
                    status = "busy"

            results.append({
                "port": p.device,
                "description": p.description,
                "status": status,
                "active": is_active
            })
        return results

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join(timeout=1.0)
        if self.serial_conn and self.serial_conn.is_open:
            self.serial_conn.close()

    def _run_loop(self):
        sim_counter = 0.0
        sim_max_alt = 0.0
        sim_start_time = time.time()

        while self.running:
            if self.port == "SIMULATOR":
                try:
                    current_millis = int((time.time() - sim_start_time) * 1000)
                    
                    status = 1 if (current_millis % 5000 < 2500) else 0
                    
                    temperature = 25.0 + (5.0 * math.sin(sim_counter * 0.1))
                    pressure = 1013.25 + (2.0 * math.sin(sim_counter * 0.05))
                    bmp_altitude = 500.0 + (100.0 * math.sin(sim_counter * 0.02))
                    
                    if bmp_altitude > sim_max_alt:
                        sim_max_alt = bmp_altitude
                        
                    accel_x = 0.5 * math.sin(sim_counter * 5.0)
                    accel_y = 0.5 * math.cos(sim_counter * 5.0)
                    accel_z = 9.81 + (0.2 * math.sin(sim_counter * 10.0))

                    rotation_x = (sim_counter * 10.0) % 360.0
                    rotation_y = 0.0
                    rotation_z = 0.0

                    latitude = -23.5505 + (0.001 * math.sin(sim_counter * 0.01))
                    longitude = -46.6333 + (0.001 * math.cos(sim_counter * 0.01))
                    gps_altitude = bmp_altitude + 5.0
                    voltage = 4.2 - (0.01 * (sim_counter * 0.1))

                    data = {
                        "time": current_millis,
                        "status": status,
                        "pressure": round(pressure, 4),
                        "temperature": round(temperature, 2),
                        "bmp_altitude": round(bmp_altitude, 2),
                        "max_altitude": round(sim_max_alt, 2),
                        "accel_x": round(accel_x, 4),
                        "accel_y": round(accel_y, 4),
                        "accel_z": round(accel_z, 4),
                        "rotation_x": round(rotation_x, 2),
                        "rotation_y": round(rotation_y, 2),
                        "rotation_z": round(rotation_z, 2),
                        "latitude": round(latitude, 6),
                        "longitude": round(longitude, 6),
                        "gps_altitude": round(gps_altitude, 2),
                        "voltage": round(voltage, 2)
                    }

                    self.last_valid_data = time.time()
                    socketio.emit('data_update', data, namespace='/')
                    
                    sim_counter += 0.1
                    time.sleep(0.1)
                    continue

                except Exception as e:
                    print(f"Erro na simulacao: {e}")
                    time.sleep(1)
                    continue

            if not self.serial_conn or not self.serial_conn.is_open:
                try:
                    self.serial_conn = serial.Serial(self.port, self.baudrate, timeout=1)
                    print(f"Conectado na porta {self.port}")
                    self.serial_conn.reset_input_buffer()
                except Exception as e:
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
                                self.last_valid_data = time.time()
                                socketio.emit('data_update', data, namespace='/')
                        except (json.JSONDecodeError, ValueError):
                            pass
                else:
                    time.sleep(0.001)
            except Exception as e:
                print(f"Erro na conexao serial: {e}")
                if self.serial_conn:
                    self.serial_conn.close()
                time.sleep(1)


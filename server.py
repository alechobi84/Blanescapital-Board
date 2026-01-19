#!/usr/bin/env python3
"""
Servidor seguro para Blanes Capital Dashboard
El contenido NO se envía hasta que el usuario se autentique.
"""

import http.server
import base64
import os
from functools import partial

# =============================================
# CONFIGURACIÓN - Cambia aquí usuario y contraseña
# =============================================
USUARIO = "blanes"
PASSWORD = "blanes2025"
PUERTO = 8080
# =============================================

class AuthHandler(http.server.SimpleHTTPRequestHandler):
    def do_HEAD(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()

    def do_GET(self):
        # Verificar autenticación
        auth_header = self.headers.get('Authorization')

        if auth_header is None:
            self.send_auth_request()
            return

        # Decodificar credenciales
        try:
            auth_type, credentials = auth_header.split(' ', 1)
            if auth_type.lower() != 'basic':
                self.send_auth_request()
                return

            decoded = base64.b64decode(credentials).decode('utf-8')
            username, password = decoded.split(':', 1)

            if username == USUARIO and password == PASSWORD:
                # Autenticación correcta - servir el archivo
                super().do_GET()
            else:
                self.send_auth_request()
        except:
            self.send_auth_request()

    def send_auth_request(self):
        self.send_response(401)
        self.send_header('WWW-Authenticate', 'Basic realm="Blanes Capital - Acceso Restringido"')
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        self.wfile.write(b'''
        <!DOCTYPE html>
        <html>
        <head><title>Acceso Denegado</title></head>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #1a2744;">
            <div style="text-align: center; color: white;">
                <h1>Acceso Restringido</h1>
                <p>Debes introducir las credenciales correctas para acceder.</p>
            </div>
        </body>
        </html>
        ''')

    def log_message(self, format, *args):
        # Solo mostrar accesos exitosos
        if '401' not in str(args):
            print(f"[Acceso] {args[0]}")

def run_server():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    handler = AuthHandler
    server = http.server.HTTPServer(('0.0.0.0', PUERTO), handler)

    print("=" * 50)
    print("  BLANES CAPITAL - Servidor Seguro")
    print("=" * 50)
    print(f"  URL: http://localhost:{PUERTO}")
    print(f"  Usuario: {USUARIO}")
    print(f"  Password: {'*' * len(PASSWORD)}")
    print("=" * 50)
    print("  Presiona Ctrl+C para detener el servidor")
    print("=" * 50)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido.")
        server.shutdown()

if __name__ == '__main__':
    run_server()

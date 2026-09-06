#!/usr/bin/env python3
"""Serveur statique pour l'app marathon.

`python3 -m http.server` échoue dans l'environnement sandboxé : son bloc __main__
appelle os.getcwd() au chargement, ce qui lève un PermissionError. En important le
module au lieu de l'exécuter, ce bloc ne tourne jamais — et on passe le répertoire
explicitement pour ne jamais dépendre du dossier courant.
"""
import functools
import http.server
import os
import socketserver

DIRECTORY = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get("PORT", "8899"))


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Les fichiers de données sont réécrits chaque midi : jamais de cache.
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass


if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    handler = functools.partial(Handler, directory=DIRECTORY)
    with socketserver.TCPServer(("127.0.0.1", PORT), handler) as httpd:
        print(f"Marathon → http://localhost:{PORT}/  (dossier {DIRECTORY})", flush=True)
        httpd.serve_forever()

from http.server import HTTPServer, SimpleHTTPRequestHandler
import socket

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        return super(CORSRequestHandler, self).end_headers()

ip_address = socket.gethostbyname(socket.getfqdn())
print("Serving at: " + str(ip_address) + ":5001")

httpd = HTTPServer((ip_address, 5001), CORSRequestHandler)
httpd.serve_forever()

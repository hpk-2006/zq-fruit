#!/usr/bin/env python3
"""HTTP server for offline-capable PWA deployment."""
import http.server
import os
import sys
import socket

# Fix encoding for Windows terminals
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

PORT = 8080
DIR = os.path.dirname(os.path.abspath(__file__))

class CachingHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIR, **kwargs)

    def end_headers(self):
        path = self.path.split('?')[0]
        ext = os.path.splitext(path)[1].lower()

        if ext == '.html':
            self.send_header('Cache-Control',
                'public, max-age=86400, stale-while-revalidate=604800')
        elif ext in ('.svg', '.png', '.jpg', '.jpeg', '.ico'):
            self.send_header('Cache-Control',
                'public, max-age=31536000, immutable')
        elif ext == '.json':
            self.send_header('Cache-Control',
                'public, max-age=86400')
        elif ext == '.js':
            self.send_header('Cache-Control',
                'public, max-age=3600')
        else:
            self.send_header('Cache-Control',
                'public, max-age=86400, stale-while-revalidate=604800')

        super().end_headers()

    def do_GET(self):
        if self.path == '/' or self.path == '/index.html':
            self.send_response(301)
            self.send_header('Location', '/便捷开单器.html')
            self.end_headers()
            return
        super().do_GET()

    def log_message(self, format, *args):
        print(f"  [访问] {args[0]}")

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('10.255.255.255', 1))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return '127.0.0.1'

if __name__ == '__main__':
    ip = get_local_ip()
    print()
    print('=' * 56)
    print('  志强果业167号 -- 电子票据系统')
    print('=' * 56)
    print()
    print('  手机端访问地址 (需同一 WiFi):')
    print()
    print(f'      http://{ip}:{PORT}')
    print(f'      http://{ip}:{PORT}/便捷开单器.html')
    print()
    print('  安装到手机桌面:')
    print('      iPhone:  Safari 打开 -> 底部分享 -> 添加到主屏幕')
    print('      Android: Chrome 打开 -> 菜单 -> 添加到主屏幕')
    print()
    print('  安装后即可完全离线使用，无需网络!')
    print()
    print('  桌面端访问: http://localhost:{}'.format(PORT))
    print()
    print('  按 Ctrl+C 停止服务器')
    print('=' * 56)
    print()

    server = http.server.HTTPServer(('0.0.0.0', PORT), CachingHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n服务器已停止')
        server.server_close()

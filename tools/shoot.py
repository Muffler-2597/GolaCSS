"""GolaCSS showcase section screenshots -> shots/. Re-run anytime: python tools/shoot.py"""
import functools
import http.server
import threading
from playwright.sync_api import sync_playwright

ROOT = r'O:/Projects/GolaCSS'
PORT = 8099
IDS = ['s-sdf', 's-btn', 's-box', 's-restart', 's-toggle', 's-img', 's-vol',
       's-rgb', 's-hex', 's-nick', 's-type', 's-stf', 's-toast', 's-say', 's-modal',
       's-panel', 's-grid', 's-extra', 's-door']


def main():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
    httpd = http.server.ThreadingHTTPServer(('127.0.0.1', PORT), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=r'C:\Users\jungg\AppData\Local\ms-playwright\chromium_headless_shell-1234\chrome-headless-shell-win64\chrome-headless-shell.exe')
        pg = b.new_page(viewport={'width': 1280, 'height': 900})
        pg.goto(f'http://127.0.0.1:{PORT}/index.html', wait_until='networkidle')
        pg.wait_for_timeout(1200)
        pg.locator('.hero').screenshot(path=f'{ROOT}/shots/hero.png')
        for sid in IDS:
            pg.evaluate(f"document.querySelector('#{sid}').scrollIntoView()")
            pg.wait_for_timeout(350)
            loc = pg.locator(f'#{sid} + .vs')
            if loc.count() == 0:
                loc = pg.locator(f'#{sid}').locator('xpath=following-sibling::*[1]')
            loc.first.screenshot(path=f'{ROOT}/shots/{sid}.png')
        # live toasts
        pg.evaluate("golaToast('첫 번째 토스트','gola-toast--yellow');golaToast('두 번째 토스트','gola-toast--gold')")
        pg.wait_for_timeout(600)
        pg.evaluate("document.querySelector('#golaToasts').style.width='740px'")
        pg.locator('#golaToasts').screenshot(path=f'{ROOT}/shots/toasts-live.png')
        # live modal
        pg.evaluate("document.querySelector('[data-gola-modal-open=\"#liveModal\"]').click()")
        pg.wait_for_timeout(400)
        pg.locator('#liveModal').screenshot(path=f'{ROOT}/shots/modal-live.png')
        # footer
        pg.locator('.page > .gola-footer').screenshot(path=f'{ROOT}/shots/footer.png')
        b.close()
    httpd.shutdown()
    print('done')


if __name__ == '__main__':
    main()

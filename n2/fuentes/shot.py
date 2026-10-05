import os
import sys, asyncio
from playwright.async_api import async_playwright
async def main():
    ex = sys.argv[1] if len(sys.argv) > 1 else 'E2'
    theme = sys.argv[2] if len(sys.argv) > 2 else 'light'
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1400, 'height': 1000}, color_scheme=theme)
        errs = []
        pg.on('console', lambda m: errs.append(m.text) if m.type in ('error', 'warning') else None)
        pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
        await pg.goto('file://'+os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','index.html')))
        await pg.wait_for_timeout(800)
        if ex != 'E2':
            await pg.select_option('#exSel', ex); await pg.click('#btnEx'); await pg.wait_for_timeout(500)
        ids = await pg.eval_on_selector_all('#main > section', 'els => els.map(e => e.id)')
        print('sections', ids)
        for sid in ids:
            el = await pg.query_selector('#' + sid)
            await el.screenshot(path=f'shots/{ex}_{theme}_{sid}.png')
        print('errors', errs)
        # texto con guiones bajos visibles fuera de svg
        bad = await pg.evaluate("""() => { const out=[]; const w=document.createTreeWalker(document.getElementById('main'), NodeFilter.SHOW_TEXT); while(w.nextNode()){const t=w.currentNode.nodeValue; if(/_/.test(t) && !w.currentNode.parentElement.closest('svg')) out.push(t.slice(0,80));} return out.slice(0,20); }""")
        print('underscores', bad)
        svgbad = await pg.evaluate("""() => [...document.querySelectorAll('svg text')].map(t=>t.textContent).filter(t=>/_|NaN|undefined|Infinity/.test(t)).slice(0,20)""")
        print('svg text issues', svgbad)
        nan = await pg.evaluate("""() => (document.getElementById('main').innerText.match(/.{0,40}(NaN|undefined|Infinity).{0,20}/g)||[]).slice(0,10)""")
        print('NaN', nan)
        await b.close()
asyncio.run(main())

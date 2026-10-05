import os
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page()
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file://'+os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','index.html'))); await pg.wait_for_timeout(400)
        # curva con cabecera, coma decimal y cm
        cur = await pg.input_value('#curve')
        rows = [l.split('\t') for l in cur.split('\n')]
        txt = 'd [cm]\tF [kN]\n' + '\n'.join(f"{float(a)*100:.3f}".replace('.',',') + '\t' + b_.replace('.',',') for a,b_ in rows)
        await pg.fill('#curve', txt); await pg.select_option('#dUnit','cm'); await pg.wait_for_timeout(300)
        print('cm/comma dt:', await pg.evaluate('window.__R.p7.res.dt'), await pg.evaluate('JSON.stringify(window.__R.warn["1"]||[])'))
        await pg.fill('#lat','40.42'); await pg.fill('#lon','-3.70'); await pg.wait_for_timeout(300)
        print('Madrid agR:', await pg.evaluate('window.__R.p7.agR'), (await pg.evaluate('(window.__R.warn["0"]||[])[0]'))[:60])
        await pg.select_option('#tipo','edificio'); await pg.dispatch_event('#tipo','input'); await pg.select_option('#impClass','IV'); await pg.dispatch_event('#impClass','input'); await pg.wait_for_timeout(300)
        print('edificio IV gI:', await pg.evaluate('window.__R.p7.gI'), await pg.evaluate("document.getElementById('dir').value"))
        await pg.fill('#mass',''); await pg.wait_for_timeout(300)
        print('empty mass:', (await pg.text_content('#main'))[:120])
        await pg.click('#btnEx'); await pg.wait_for_timeout(300)
        await pg.select_option('#showB','1'); await pg.dispatch_event('#showB','input'); await pg.wait_for_timeout(300)
        print('optB legend:', 'opción B' in (await pg.inner_html('#p5')))
        await pg.select_option('#iterate','0'); await pg.dispatch_event('#iterate','input'); await pg.wait_for_timeout(300)
        print('no iter its:', await pg.evaluate('window.__R.p6.its.length'))
        print('errors', errs)
        await b.close()
asyncio.run(main())

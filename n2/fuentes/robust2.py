import os
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1400,'height':1000})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file://'+os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','index.html'))); await pg.wait_for_timeout(400)
        async def sel(i,v): await pg.select_option('#'+i,v); await pg.dispatch_event('#'+i,'input'); await pg.wait_for_timeout(250)
        async def fill(i,v): await pg.fill('#'+i,v); await pg.wait_for_timeout(250)
        await sel('metodo','igual')
        print('igual dt', await pg.evaluate('window.__R.p7.res.dt'), await pg.evaluate('[window.__R.cmp.n2.dt, window.__R.cmp.igual.dt]'))
        await (await pg.query_selector('#p5')).screenshot(path='shots/igual_p5.png')
        await (await pg.query_selector('#p7')).screenshot(path='shots/igual_p7.png')
        await sel('metodo','n2')
        await sel('sdofMode','directo'); await fill('mstar','2165.3'); await fill('GamIn','1.7088')
        print('directo dt', await pg.evaluate('window.__R.p7.res.dt'), await pg.evaluate("getComputedStyle(document.getElementById('mass').closest('.fld')).display"))
        await (await pg.query_selector('#p2')).screenshot(path='shots/directo_p2.png')
        await fill('lat','40.42'); await fill('lon','-3.70')
        ids = await pg.eval_on_selector_all('#main > section', 'els => els.map(e => e.id)')
        print('madrid sections', ids, await pg.evaluate('window.__R.noSeismic'))
        await (await pg.query_selector('#pE')).screenshot(path='shots/madrid_pE.png')
        print('errors', errs)
        await b.close()
asyncio.run(main())

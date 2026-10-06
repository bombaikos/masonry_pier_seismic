import os
import asyncio
from playwright.async_api import async_playwright
stub = """
window.__cnt = {};
const mk = n => class { constructor(o){ window.__cnt[n]=(window.__cnt[n]||0)+1; this.o=o; } };
window.docx = { Document: mk('Document'), Paragraph: mk('Paragraph'), TextRun: mk('TextRun'), Table: mk('Table'), TableRow: mk('TableRow'), TableCell: mk('TableCell'),
  ImageRun: mk('ImageRun'), Header: mk('Header'), Footer: mk('Footer'), HeadingLevel: {TITLE:1,HEADING_1:2,HEADING_2:3}, WidthType:{DXA:1}, AlignmentType:{LEFT:1,RIGHT:2,CENTER:3},
  ShadingType:{CLEAR:1}, BorderStyle:{SINGLE:1}, PageNumber:{CURRENT:1}, Packer: { toBlob: async d => new Blob(['x']) } };
"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(accept_downloads=True)
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script(stub)
        await pg.goto('file://'+os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','index.html'))); await pg.wait_for_timeout(500)
        async with pg.expect_download() as dl:
            await pg.click('#btnDocx')
        d = await dl.value
        print('download', d.suggested_filename)
        await pg.wait_for_timeout(500)
        print(await pg.text_content('#repStatus'))
        print(await pg.evaluate('window.__cnt'))
        async with pg.expect_download() as dl2:
            await pg.click('#btnCsv')
        print('csv', (await dl2.value).suggested_filename)
        print('errors', errs)
        await b.close()
asyncio.run(main())

// @vitest-environment node
// ONhapDapSo ở TỪNG NƠI DÙNG (Chromium thật, CSS thật của từng nơi, markup React thật): thẻ câu thi (TheCau — cũng là Đảo / Võ đài / BTVN), Đoàn (DoanCau), ôn câu (LamCauOn), mở bài (MomM3):
// ở 320/360/390 px, sáng + tối: hai nút "−" "," ≥ 44 px, ô đủ rộng, cùng một hàng, 0 tràn ngang, mọi phần tử nằm trong khối.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser } from 'playwright'
import { renderToStaticMarkup } from 'react-dom/server'
import fs from 'node:fs'
import path from 'node:path'
import ONhapDapSo from '../src/components/ONhapDapSo'
import TheCau from '../src/components/TheCau'
import DoanCau from '../src/game/than-thu-v2/DoanCau'
import type { Question } from '../src/game/than-thu-v2/core'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8').replace(/@import[^;]*;/g, '')
const ONDS = doc('src/components/o-nhap-dap-so.css')
const TOKEN = ['src/styles/tokens.css', 'src/index.css'].map(doc).join('\n')
const M3 = doc('src/components/bang-nhiem-vu/m3-theme.css')
const LCO = doc('src/components/bang-nhiem-vu/lam-cau-on.css')
const MOM = doc('src/components/bang-nhiem-vu/mom-m3.css')
const DOAN = doc('src/game/than-thu-v2/doan.css')
const noop = () => {}
const CAU_III = { qid: 'Q3', maDe: 'D', version: 'v', group: 'g', phan: 'III', text: 'Tính giá trị m (gam) thu được, làm tròn đến hàng phần mười.', choices: [], ideas: [], hinhAnh: [], dang: 'ES', tenDang: 'Ester', mucDo: 'hieu', sao: 2, kienThuc: [] } as unknown as Question

const NOI: { ten: string; html: string; css: string; goc: string }[] = [
  { ten: 'thẻ câu thi (TheCau)', css: `${TOKEN}\n${ONDS}`, goc: 'the-cau', html: renderToStaticMarkup(<div style={{ padding: 16 }}><TheCau kieu="sa" id="c1" stt={12} text="Tính ΔH của phản ứng, làm tròn đến hàng phần mười." selected="-92,4" onChange={noop} /></div>) },
  { ten: 'Đoàn (DoanCau)', css: `${TOKEN}\n${ONDS}\n${DOAN}`, goc: 'dh', html: renderToStaticMarkup(<div className="dh"><div className="dh-khung"><DoanCau q={CAU_III} chon="-1,5" onChon={noop} khoa={false} onZoom={noop} dau={<b>CÂU CỦA EM</b>} /></div></div>) },
  { ten: 'ôn câu (LamCauOn)', css: `${M3}\n${LCO}\n${ONDS}`, goc: 'm3', html: renderToStaticMarkup(<div className="m3" style={{ padding: 16 }}><div className="lco-nhom"><div className="lco-nhap"><label className="lco-nhap-nhan" htmlFor="lco-dap-an">Đáp án của em (số)</label><ONhapDapSo id="lco-dap-an" value="-12,5" onChange={noop} placeholder="Ví dụ 12,5" /></div></div></div>) },
  { ten: 'mở bài (MomM3)', css: `${M3}\n${MOM}\n${ONDS}`, goc: 'm3', html: renderToStaticMarkup(<div className="m3" style={{ padding: 16 }}><div className="mom-nhom"><div className="mom-nhap"><label className="mom-nhap-nhan" htmlFor="mom-tl">Điền câu trả lời ngắn:</label><ONhapDapSo id="mom-tl" inputMode="text" value="0,25 mol" onChange={noop} placeholder="Nhập đáp án số hoặc chữ..." /></div></div></div>) },
]

let browser: Browser | null = null
beforeAll(async () => {
  try {
    browser = await chromium.launch({ headless: true })
  } catch {
    browser = null
  }
})
afterAll(async () => {
  await browser?.close()
})

for (const noi of NOI)
  for (const [w, h] of [[320, 640], [360, 740], [390, 844]] as const)
    for (const mau of ['light', 'dark'] as const)
      it(`${noi.ten} · ${w}×${h} · ${mau}: hai nút ≥ 44 px cùng hàng với ô, ô ≥ 100 px, 0 tràn ngang, mọi thứ nằm trong khối`, async () => {
        if (!browser) return
        const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: mau })
        const page = await ctx.newPage()
        await page.setContent(`<!doctype html><html lang="vi"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0}${noi.css}</style></head><body>${noi.html}</body></html>`)
        await page.waitForTimeout(80)
        const o = await page.evaluate(() => {
          const r = (e: Element) => { const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height } }
          const k = document.querySelector('.ond')!
          const kids = [...k.children]
          const inp = k.querySelector('input')!
          const nuts = [...k.querySelectorAll('button')]
          return { k: r(k), inp: r(inp), nuts: nuts.map(r), kids: kids.map(r), tran: document.documentElement.scrollWidth > document.documentElement.clientWidth, doc: document.documentElement.clientWidth }
        })
        await ctx.close()
        expect(o.nuts).toHaveLength(2)
        expect(o.tran).toBe(false)
        for (const n of o.nuts) {
          expect(n.w, 'nút rộng').toBeGreaterThanOrEqual(44)
          expect(n.h, 'nút cao').toBeGreaterThanOrEqual(44)
          expect(Math.abs(n.y - o.inp.y), 'cùng hàng').toBeLessThanOrEqual(1.5)
        }
        expect(o.inp.w).toBeGreaterThanOrEqual(100)
        for (const c of o.kids) {
          expect(c.x).toBeGreaterThanOrEqual(o.k.x - 0.5)
          expect(c.x + c.w).toBeLessThanOrEqual(o.k.x + o.k.w + 0.5)
        }
        expect(o.k.x + o.k.w).toBeLessThanOrEqual(o.doc + 0.5)
      }, 30000)

it('ĐỐI CHỨNG: nếu ô KHÔNG co được (min-width:auto) thì ở 320 px với số dài bị tràn — bộ thử có nghĩa', async () => {
  if (!browser) return
  const ctx = await browser.newContext({ viewport: { width: 320, height: 640 } })
  const page = await ctx.newPage()
  const hong = ONDS.replace('.ond>input{flex:1 1 auto;min-width:0;', '.ond>input{flex:0 0 auto;width:420px;')
  await page.setContent(`<!doctype html><html><head><style>html,body{margin:0}${hong}</style></head><body>${renderToStaticMarkup(<ONhapDapSo value="1234567890" onChange={noop} />)}</body></html>`)
  const tran = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  await ctx.close()
  expect(hong).not.toBe(ONDS)
  expect(tran).toBe(true)
}, 30000)

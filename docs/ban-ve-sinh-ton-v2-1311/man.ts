// BẢN VẼ «SINH TỒN · TRANG VỞ» (13/11, chờ thầy duyệt — CHƯA build): mỗi màn một tham số ?man=… ; bản đồ, vòng an toàn, bụi lấy từ LÕI THẬT
// (src/lib/live-khoi/sinh-ton-loi.ts), màu đọc từ token thật. Mở: npx vite --port 5231 rồi vào /docs/ban-ve-sinh-ton-v2-1311/?man=tran
import '../../src/styles/tokens.css'
import '../../src/styles/trong-hs-mau.css'
import './kieu.css'
import { VAN_MS, taoBanDo, trongBui, vong, type BanDo } from '../../src/lib/live-khoi/sinh-ton-loi'
import { docBang, mau, pha, type Bang } from './bang'
import { SUNG_TEN6 as SUNG_TEN, TEN_HOP, mauHop, nuongHop, nuongMa, nuongSung, nuongVat, nuongBui, nuongVetMuc, nuongGiayVo, nuongVuongMien, nuongLua, nuongMaMuc, nuongSao, veBieuTuong, type KieuMa, type LoaiHop } from './hinh'
import { dat, duong, elip, hcn, netTay, rng, to } from './net'
import { TrinhVe, veBanDoNho, type Canh, type Dan, type Hieu, type NvVe } from './ve'

document.documentElement.dataset.trong = 'hs'
const Q = new URLSearchParams(location.search)
const MAN = Q.get('man') ?? 'tran'
const CHAY = Q.get('chay') === '1'
await document.fonts.load('20px "Patrick Hand"')
await document.fonts.load('20px "Patrick Hand"', 'Đỗ đại học ạ')
const b: Bang = docBang()
const goc = document.getElementById('goc')!
const W = innerWidth, H = innerHeight, dpr = Math.min(2, devicePixelRatio || 1)

const DOI = [
  { ky: 'Na', ten: 'Đội Natri', bien: '--p-cam' }, { ky: 'K', ten: 'Đội Kali', bien: '--p-tim-2' },
  { ky: 'Cu', ten: 'Đội Đồng', bien: '--p-xanh' }, { ky: 'Ca', ten: 'Đội Canxi', bien: '--p-do' },
]
const cv = (d: number) => `--c:var(${DOI[d].bien})`
const ten = (d: number, t: string) => `<b style="${cv(d)}">${t}</b>`
const LOA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/></svg>'
const LOA_TAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>'

// ── Dựng màn trận ──
interface Tran { /** Dời cả cảnh vào giữa sân lớn (tâm vòng an toàn), toạ độ trong màn viết như sân một trang. */ giua?: boolean; cap?: number; nv: NvVe[]; dan?: Omit<Dan, 't'>[]; hieu?: Hieu[]; giay?: number; hop?: { loai: LoaiHop; x: number; y: number }; boss?: { x: number; y: number }; xem?: boolean; tren?: number }
interface DaDung { bd: BanDo; canh: Canh; ve: TrinhVe; man: (x: number, y: number) => [number, number] }
function ma(id: string, tenMa: string, doi: number, x: number, y: number, o: Partial<NvVe> & { nham?: [number, number] } = {}): NvVe {
  const goc0 = o.nham ? Math.atan2(o.nham[1] - (y - 30), o.nham[0] - x) : o.goc ?? (doi % 2 ? Math.PI : 0)
  return { id, ten: tenMa, doi, x, y, cap: 1, mau: 100, goc: goc0, ...o }
}
function dungTran(t: Tran): DaDung {
  const bd = taoBanDo(t.cap ?? 2)
  const DX = t.giua ? 800 : 0, DY = t.giua ? 500 : 0
  if (DX || DY) {
    for (const n of t.nv) { n.x += DX; n.y += DY }
    for (const d of t.dan ?? []) { d.x1 += DX; d.x2 += DX; d.y1 += DY; d.y2 += DY }
    for (const e of t.hieu ?? []) { e.x += DX; e.y += DY }
    if (t.hop) t.hop = { ...t.hop, x: t.hop.x + DX, y: t.hop.y + DY }
  }
  const toi = t.nv.find((n) => n.toi)
  const ti = t.xem ? Math.min(W / (bd.rong + 40), (H - (t.tren ?? 0)) / (bd.cao + 40)) : Math.max(0.5, Math.min(1.7, Math.sqrt((W * H) / (1000 * 520))))
  let camX = bd.rong / 2, camY = bd.cao / 2 - (t.tren ?? 0) / 2 / ti
  if (!t.xem && toi) {
    camX = Math.max(W / 2 / ti - 40, Math.min(bd.rong + 40 - W / 2 / ti, toi.x)); camY = Math.max(H / 2 / ti - 40, Math.min(bd.cao + 40 - H / 2 / ti, toi.y - 34))
  }
  const c = document.createElement('canvas'); c.className = 'tv-san'; c.width = Math.round(W * dpr); c.height = Math.round(H * dpr)
  goc.appendChild(c)
  const g = c.getContext('2d')!
  const ve = new TrinhVe(g, b, ti * dpr)
  const nay = 1000 * VAN_MS + (t.giay ?? 40) * 1000
  for (const n of t.nv) if (!n.an && !t.xem && trongBui(bd, n.x, n.y)) n.an = true
  const dan0 = (t.dan ?? []).map((d, i) => ({ ...d, t: 0, t0: (i * 0.37) % 1 }))
  const canh: Canh = { bd, b, W, H, dpr, ti, camX, camY, luc: 0, nv: t.nv, dan: dan0, hieu: t.hieu ?? [], vong: vong(bd, nay), hop: t.hop, boss: t.boss }
  const ngau = rng(5), huong = t.nv.map(() => ngau() * Math.PI * 2)
  let truoc = 0
  const f = (luc: number) => {
    const dt = Math.min(50, luc - (truoc || luc)); truoc = luc
    canh.luc = luc
    for (const d of dan0) d.t = (d.t0 + luc / (d.cap >= 5 ? 520 : d.cap === 3 ? 600 : 340)) % 1
    if (CHAY) t.nv.forEach((n, i) => { if (n.mau <= 0) return; huong[i] += (ngau() - 0.5) * 0.2; n.x = Math.max(40, Math.min(bd.rong - 40, n.x + Math.cos(huong[i]) * dt * 0.12)); n.y = Math.max(40, Math.min(bd.cao - 40, n.y + Math.sin(huong[i]) * dt * 0.12)) })
    ve.ve(canh)
    requestAnimationFrame(f)
  }
  requestAnimationFrame(f)
  return { bd, canh, ve, man: (x, y) => [W / 2 + (x + DX - camX) * ti, H / 2 + (y + DY - camY) * ti] }
}
function themHtml(html: string): void { goc.insertAdjacentHTML('beforeend', html) }
function banDoNho(d: DaDung, them?: { boss?: { x: number; y: number } }): void {
  const c = goc.querySelector<HTMLCanvasElement>('.tv-nho canvas'); if (!c) return
  c.width = 142 * dpr; c.height = 89 * dpr
  veBanDoNho(c.getContext('2d')!, { ...b, muc: b.toi ? pha(b.muc, b.giay, 0.9) : b.muc }, d.bd, d.canh.vong, d.canh.nv, 142, 89, dpr, them)
}
interface Hud { diem: number[]; van: number; con: string; cap: number; tin: string[]; trangThai: string; bao?: string; ca?: boolean; tatTieng?: boolean; chuoi?: number; tren?: number; khongNho?: boolean }
function hud(o: Hud): string {
  const tren = o.tren ?? 0
  return `<div class="tv-bang-diem" style="top:${8 + tren}px">${o.diem.map((s, d) => `<span class="d${d === 0 ? ' toi' : ''}" style="${cv(d)}"><i></i>${DOI[d].ky} ${s}</span>`).join('')}<span class="phu">lượt hạ</span><span class="vach"></span><span>Ván ${o.van} · còn ${o.con}</span></div>`
    + (o.bao ? `<div class="tv-bao" style="top:${42 + tren}px">${o.bao}</div>` : '')
    + `<div class="tv-tin" style="top:${(o.ca ? 8 : 8) + tren}px">${o.tin.map((x) => `<p>${x}</p>`).join('')}</div>`
    + `<div class="tv-sung" style="${cv(0)}"><span class="vach">${[1, 2, 3, 4, 5, 6].map((i) => `<i class="${i <= o.cap ? 'co' : ''}"></i>`).join('')}</span><span class="ten-cap">Súng cấp ${o.cap} · </span>${SUNG_TEN[o.cap - 1]}${o.chuoi ? ` · <span style="color:var(--tr-sai)">chuỗi hạ ${o.chuoi}</span>` : ''}</div>`
    + (o.khongNho ? '' : '<div class="tv-nho"><canvas></canvas><span>Bản đồ · vòng an toàn</span></div>')
    + `<div class="tv-trang-thai"><i></i>${o.trangThai}</div>`
    + (o.ca ? `<button class="tv-nut" style="left:10px;top:${8 + tren}px">Thoát trò</button>` : '')
    + `<button class="tv-nut" aria-label="${o.tatTieng ? 'Bật tiếng trò chơi' : 'Tắt tiếng trò chơi'}" style="left:10px;top:${(o.ca ? 60 : 56) + tren}px;padding:0">${o.tatTieng ? LOA_TAT : LOA}</button>`
}
const CHO_LIVE = 'Phòng chờ · 28 em đã vào · chờ thầy bấm Bắt đầu'

// ── Bối cảnh chung của một ván cỡ 0 quanh bé ma của em ở (560, 520) ──
function nhomTran(o: { capEm?: number; mauEm?: number; banEm?: boolean } = {}): NvVe[] {
  return [
    ma('S0', 'Thị Hà (em)', 0, 560, 520, { toi: true, cap: o.capEm ?? 2, mau: o.mauEm ?? 72, ban: o.banEm ?? true, nham: [770, 430] }),
    ma('S1', 'Hoàng Nam', 1, 770, 430, { cap: 5, mau: 46, ban: true, nham: [560, 520] }),
    ma('S2', 'Gia Bảo', 3, 905, 612, { cap: 6, mau: 88, ban: true, nham: [400, 610] }),
    ma('S3', 'Đức Anh', 0, 405, 612, { cap: 1, mau: 64, ban: true, nham: [905, 612] }),
    ma('S4', 'Bảo Ngọc', 2, 300, 404, { may: true, mau: 100, nham: [405, 612] }),
    ma('S5', 'Khánh Vy', 2, 540, 668, {}),
    ma('S6', 'Minh Anh', 1, 990, 330, { cap: 3, mau: 90, ban: true, nham: [560, 520] }),
  ]
}
const DAN_TRAN: Omit<Dan, 't'>[] = [
  { x1: 595, y1: 492, x2: 770, y2: 400, cap: 2, doi: 0 }, { x1: 742, y1: 410, x2: 560, y2: 490, cap: 5, doi: 1 },
  { x1: 870, y1: 590, x2: 405, y2: 580, cap: 6, doi: 3 }, { x1: 430, y1: 585, x2: 905, y2: 585, cap: 1, doi: 0 }, { x1: 960, y1: 312, x2: 585, y2: 488, cap: 3, doi: 1 },
]
const HIEU_TRAN: Hieu[] = [
  { k: 'muc', x: 772, y: 418, doi: 0, bien: 1, a: 0.9 }, { k: 'muc', x: 548, y: 512, doi: 1, bien: 2, a: 0.7 }, { k: 'muc', x: 420, y: 600, doi: 3, bien: 0, a: 0.6 },
  { k: 'so', x: 790, y: 372, chu: '-12', a: 1 }, { k: 'so', x: 545, y: 448, chu: '-18', a: 0.85 },
]

// ── Các màn ──
const MANS: Record<string, () => void> = {
  tran() {
    const d = dungTran({ giua: true, nv: nhomTran(), dan: DAN_TRAN, hieu: HIEU_TRAN, hop: { loai: 'mau', x: 800, y: 500 }, giay: 50 })
    themHtml(hud({ diem: [4, 3, 1, 1], van: 2, con: '1:10', cap: 2, tin: [`${ten(0, 'Đức Anh')} hạ ${ten(2, 'Quốc Huy')}`, `${ten(1, 'Hoàng Nam')} hạ ${ten(3, 'Ngọc Lan')}`], trangThai: CHO_LIVE }))
    banDoNho(d)
  },
  'trung-ha'() {
    const nv = nhomTran({ capEm: 4, mauEm: 81 })
    nv[1] = ma('S1', 'Hoàng Nam', 1, 1000, 470, { cap: 2, mau: 28, ban: true, nham: [560, 520] })
    nv[0].goc = Math.atan2(440 - 490, 1000 - 560)
    nv.push(ma('S7', 'Khánh Vy', 2, 700, 470, { mau: 0 }), ma('S8', 'Thu Trang', 3, 640, 610, { mau: 0, may: true }))
    const d = dungTran({ giua: true, nv, dan: [{ x1: 600, y1: 482, x2: 1000, y2: 440, cap: 4, doi: 0 }, { x1: 965, y1: 440, x2: 560, y2: 490, cap: 2, doi: 1 }], giay: 34,
      hieu: [{ k: 'muc', x: 700, y: 466, doi: 0, bien: 1, a: 0.9 }, { k: 'muc', x: 640, y: 604, doi: 0, bien: 2, a: 0.9 }, { k: 'muc', x: 998, y: 458, doi: 0, bien: 0, a: 0.8 },
        { k: 'so', x: 700, y: 420, chu: '+1', a: 1, mau: 'sao' }, { k: 'so', x: 645, y: 560, chu: '+1', a: 0.8, mau: 'sao' }, { k: 'so', x: 1020, y: 410, chu: '-15', a: 1 }] })
    themHtml(hud({ diem: [7, 3, 1, 1], van: 2, con: '1:26', cap: 4, tin: [`${ten(0, 'Thị Hà')} hạ ${ten(2, 'Khánh Vy')}`, `${ten(0, 'Thị Hà')} hạ ${ten(3, 'Thu Trang')}`, `<span class="noi">${ten(0, 'Thị Hà')} chuỗi 3 · Đỗ đại học!</span>`], trangThai: CHO_LIVE })
      + '<div class="tv-dau"><b>ĐỖ ĐẠI HỌC!</b><small>Hạ 3 bạn liên tiếp · súng lên Súng Sấm</small></div>')
    banDoNho(d)
  },
  'bieu-cam'() {
    const nv = nhomTran({ banEm: false })
    nv[3].noi = 'Theo tớ!'; nv[6].noi = 'Haha'
    const d = dungTran({ giua: true, nv, dan: DAN_TRAN.slice(1), hieu: HIEU_TRAN.slice(0, 3), giay: 50 })
    const [sx, sy] = d.man(560, 490)
    const nhan = [['♥', 'Hay quá!'], ['!!', 'Cứu với!'], ['→', 'Theo tớ!'], ['ha', 'Haha']]
    themHtml(hud({ diem: [4, 3, 1, 1], van: 2, con: '1:10', cap: 2, tin: [`${ten(0, 'Đức Anh')}: Theo tớ!`], trangThai: CHO_LIVE })
      + nhan.map(([k, c], i) => { const a = ((-165 + i * 50) * Math.PI) / 180; return `<button class="tv-bc" style="left:${sx + Math.cos(a) * 94}px;top:${sy - 4 + Math.sin(a) * 94}px"><span>${k}</span>${c}</button>` }).join('')
      + '<div class="tv-goi-y">Chạm bé ma của em để gửi biểu cảm · cả lớp thấy 2 giây</div>')
    banDoNho(d)
  },
  'truy-na'() {
    const nv = nhomTran()
    nv[2] = ma('S2', 'Gia Bảo', 3, 830, 470, { cap: 6, mau: 95, ban: true, truyNa: true, danhHieu: 'Thủ khoa', nham: [560, 520] })
    nv[0].nham = [830, 470]; nv[0].goc = Math.atan2(440 - 490, 830 - 560)
    nv[1] = ma('S1', 'Hoàng Nam', 1, 1010, 640, { cap: 5, mau: 46, ban: true, nham: [405, 612] })
    const d = dungTran({ giua: true, nv, dan: [{ x1: 795, y1: 450, x2: 560, y2: 490, cap: 6, doi: 3 }, { x1: 595, y1: 488, x2: 830, y2: 440, cap: 2, doi: 0 }, { x1: 430, y1: 600, x2: 830, y2: 450, cap: 1, doi: 0 }], hieu: HIEU_TRAN.slice(1, 3), giay: 62 })
    themHtml(hud({ diem: [4, 3, 2, 9], van: 2, con: '0:58', cap: 2, tin: [`${ten(3, 'Gia Bảo')} hạ ${ten(0, 'Đức Anh')}`, `<span class="noi">${ten(3, 'Gia Bảo')} thành thủ khoa ván 2!</span>`], trangThai: CHO_LIVE })
      + '<div class="tv-bang-lon" style="top:44px"><b>THỦ KHOA Gia Bảo · 7 lượt hạ</b><br>Cả lớp đang truy nã · hạ bạn ấy là súng lên cấp ngay</div>')
    banDoNho(d)
  },
  'diet-thu-khoa'() {
    const nv = nhomTran({ capEm: 3, mauEm: 38 })
    nv[2] = ma('S2', 'Gia Bảo', 3, 790, 470, { mau: 0 })
    nv[0].goc = Math.atan2(440 - 490, 790 - 560)
    const d = dungTran({ giua: true, nv, dan: [], hieu: [{ k: 'muc', x: 790, y: 462, doi: 0, bien: 1, a: 1 }, { k: 'muc', x: 812, y: 488, doi: 0, bien: 2, a: 0.7 }, { k: 'so', x: 790, y: 410, chu: '+1', a: 1, mau: 'sao' }], giay: 66 })
    themHtml(hud({ diem: [5, 3, 2, 9], van: 2, con: '0:54', cap: 3, tin: [`<span class="noi">${ten(0, 'Thị Hà')} diệt thủ khoa!</span>`, `${ten(3, 'Gia Bảo')} mất vương miện`], trangThai: CHO_LIVE })
      + '<div class="tv-dau"><b>ĐÃ TIÊU DIỆT THỦ KHOA!</b><small>Súng lên cấp ngay · tên em vào bảng vàng</small></div>')
    banDoNho(d)
  },
  'bi-ha'() {
    const nv = nhomTran({ mauEm: 0 }); nv[0].ban = false
    const d = dungTran({ giua: true, nv, dan: DAN_TRAN.slice(2), hieu: [{ k: 'muc', x: 560, y: 515, doi: 3, bien: 1, a: 1 }, ...HIEU_TRAN.slice(2, 3)], giay: 50 })
    themHtml(hud({ diem: [4, 3, 1, 2], van: 2, con: '1:09', cap: 2, tin: [`${ten(3, 'Gia Bảo')} hạ ${ten(0, 'Thị Hà')}`], trangThai: CHO_LIVE })
      + `<div class="tv-ha"><div class="tv-dau dau-ha"><b>TRƯỢT ĐẠI HỌC RỒI!</b></div><p>${ten(3, 'Gia Bảo')} vừa đánh trượt em</p><div class="dem">3</div><p>Thi lại ở phía trại ${DOI[0].ten} sau 3 giây</p></div>`)
    banDoNho(d)
  },
  hop() {
    const nv = nhomTran(); nv[0] = ma('S0', 'Thị Hà (em)', 0, 640, 520, { toi: true, cap: 2, mau: 100, ban: true, khien: true, nham: [770, 430] })
    const d = dungTran({ giua: true, nv, dan: [{ x1: 742, y1: 410, x2: 655, y2: 480, cap: 5, doi: 1 }, { x1: 880, y1: 592, x2: 670, y2: 500, cap: 6, doi: 3 }, { x1: 675, y1: 492, x2: 770, y2: 400, cap: 2, doi: 0 }],
      hieu: [{ k: 'so', x: 690, y: 452, chu: 'chặn!', a: 1, mau: 'dung' }], hop: { loai: 'sao', x: 800, y: 500 }, giay: 20 })
    themHtml(hud({ diem: [4, 3, 1, 1], van: 2, con: '1:40', cap: 2, tin: [`${ten(0, 'Thị Hà')} nhặt hộp tiếp tế`], trangThai: CHO_LIVE })
      + `<div class="tv-toast" style="${cv(0)};--c:var(--tr-tin-chu)"><canvas id="bt"></canvas><span><b>Khiên 5 giây</b> · đạn không trúng được em</span></div>`
      + '<div class="tv-nhan" style="left:50%;transform:translateX(-50%);bottom:104px">Hộp kế tiếp ở giữa sân: Pháo Sao 10 giây · hộp có 4 loại</div>')
    const c = document.getElementById('bt') as HTMLCanvasElement; c.width = 68; c.height = 72
    const hg = c.getContext('2d')!; hg.drawImage(nuongHop(b, 1.3, 'khien').c, 0, 0, 68, 72)
    banDoNho(d)
  },
  boss() {
    const nv = [
      ma('S0', 'Thị Hà (em)', 0, 700, 340, { toi: true, cap: 2, mau: 80, ban: true, nham: [800, 440] }), ma('S3', 'Đức Anh', 0, 560, 470, { cap: 1, ban: true, nham: [800, 440] }),
      ma('S1', 'Hoàng Nam', 1, 1040, 430, { cap: 5, ban: true, nham: [800, 440] }), ma('S6', 'Minh Anh', 1, 920, 330, { cap: 3, ban: true, nham: [800, 440] }),
      ma('S2', 'Gia Bảo', 3, 1010, 560, { cap: 6, ban: true, nham: [800, 440] }), ma('S4', 'Bảo Ngọc', 2, 600, 590, { may: true, cap: 2, ban: true, nham: [800, 440] }),
    ]
    for (const n of nv) { n.x += 800; n.y += 500 }
    const dan = nv.map((n, i) => ({ x1: n.x + Math.cos(n.goc) * 40, y1: n.y - 30 + Math.sin(n.goc) * 40, x2: 1600, y2: 940, cap: n.cap, doi: n.doi } satisfies Omit<Dan, 't'>)).filter((_, i) => i !== 5)
    const d = dungTran({ nv, dan, boss: { x: 1600, y: 1020 }, giay: 62, hieu: [{ k: 'so', x: 1530, y: 920, chu: '-24', a: 1 }, { k: 'so', x: 1685, y: 900, chu: '-30', a: 0.8 }] })
    themHtml(hud({ diem: [6, 5, 3, 4], van: 3, con: '0:58', cap: 2, tin: [`${ten(2, 'Đội Đồng')} đánh Ma Mực -30`], trangThai: CHO_LIVE })
      + `<div class="tv-mau-lon" style="top:40px;--c:var(--tr-hs)">Ma Mực · 2 140 / 3 000 máu<div class="ong"><i style="width:71%"></i></div>`
      + `<div class="chia">${[34, 22, 26, 18].map((p, i) => `<i style="width:${p}%;${cv(i)}"></i>`).join('')}</div><div class="chu-chia">${[34, 22, 26, 18].map((p, i) => `<span>${DOI[i].ky} ${p}%</span>`).join('')}</div></div>`
      + '<div class="tv-bang-lon" style="top:112px;font-size:15px"><b>MA MỰC TRỒI LÊN GIỮA SÂN!</b> Đội đánh nhiều nhất được cộng 5 lượt hạ</div>')
    banDoNho(d, { boss: { x: 1600, y: 1020 } })
  },
  'thay-em'() {
    const nv = nhomTran({ mauEm: 54 })
    nv[0].nham = [760, 470]; nv[0].goc = Math.atan2(420 - 490, 760 - 560)
    nv[1] = ma('THAY', 'Thầy', 1, 790, 470, { cap: 1, mau: 82, ban: true, to: 2.2, kieu: { thay: true }, nham: [560, 520] })
    const d = dungTran({ giua: true, nv, dan: [{ x1: 740, y1: 405, x2: 560, y2: 490, cap: 2, doi: 3 }, { x1: 595, y1: 488, x2: 780, y2: 420, cap: 2, doi: 0 }, { x1: 430, y1: 600, x2: 780, y2: 440, cap: 1, doi: 0 }], hieu: [{ k: 'so', x: 815, y: 330, chu: '-16', a: 1 }, ...HIEU_TRAN.slice(1, 3)], giay: 44 })
    themHtml(hud({ diem: [4, 3, 1, 1], van: 3, con: '1:16', cap: 2, tin: [`${ten(1, 'Thầy')} gạch tên ${ten(3, 'Ngọc Lan')}`, `${ten(0, 'Đức Anh')} bắn trúng Thầy`], trangThai: CHO_LIVE })
      + '<div class="tv-mau-lon" style="top:40px;--c:var(--tr-hs)">Thầy · 1 640 / 2 000 máu<div class="ong"><i style="width:82%"></i></div></div>'
      + '<div class="tv-bang-lon" style="top:88px;font-size:15px"><b>THẦY ĐÃ VÀO TRẬN!</b> Hạ được Thầy thì tên em lên bảng vàng</div>')
    banDoNho(d)
  },
  'thay-may-thay'() {
    const bd = taoBanDo(4), r = rng(11), nv: NvVe[] = []
    const TEN = ['Thị Hà', 'Hoàng Nam', 'Gia Huy', 'Gia Bảo', 'Đức Anh', 'Minh Anh', 'Khánh Vy', 'Ngọc Lan', 'Bảo Ngọc', 'Quốc Huy', 'Thu Trang', 'Minh Khang', 'Bảo Châu', 'Tuấn Kiệt', 'Hải Yến', 'Đăng Khoa', 'Phương Linh', 'Trọng Nhân', 'Mai Anh', 'Hữu Phước']
    const v = vong(bd, 1000 * VAN_MS + 52_000)
    for (let i = 0; nv.length < 40 && i < 400; i++) {
      const x = 80 + r() * (bd.rong - 160), y = 80 + r() * (bd.cao - 160)
      if (((x - v.cx) / v.rx) ** 2 + ((y - v.cy) / v.ry) ** 2 > 0.8 || bd.chan.some((c) => x > c.x - 24 && x < c.x + c.w + 24 && y > c.y - 30 && y < c.y + c.h + 10)) continue
      const doi = nv.length % 4
      nv.push(ma(`S${i}`, TEN[nv.length % TEN.length], doi, x, y, { may: nv.length >= 37, cap: 1 + (nv.length % 6), mau: 30 + ((nv.length * 37) % 70), ban: nv.length % 3 === 0, goc: r() * Math.PI * 2 }))
    }
    nv.push(ma('THAY', 'Thầy', 1, 2440, 1540, { cap: 1, mau: 82, ban: true, to: 2.2, kieu: { thay: true }, goc: Math.PI * 0.9 }))
    nv[5].truyNa = true; nv[5].danhHieu = 'Thủ khoa'
    const d = dungTran({ cap: 4, nv, xem: true, tren: 58, giay: 52, hieu: [{ k: 'muc', x: 2300, y: 1500, doi: 2, bien: 1, a: 0.8 }] })
    themHtml(`<div class="gv-thanh"><h1>Sinh Tồn</h1><span class="gv-chip">Ván 3 · còn 1:12</span><span class="gv-chip">40 bạn đang chơi</span><span class="gv-chip">Sân tự lớn theo sĩ số: 3 × 3 trang vở</span><span class="gian"></span>
      <span class="gv-chip"><i></i>Thầy đang trong trận · máu 1 640 / 2 000</span><button class="gv-nut do">Rời trận</button></div>`
      + hud({ diem: [14, 11, 9, 12], van: 3, con: '1:12', cap: 1, tin: [`${ten(1, 'Thầy')} gạch tên ${ten(2, 'Gia Huy')}`, `${ten(1, 'Minh Anh')} hạ ${ten(0, 'Bảo Châu')}`], trangThai: 'Máy thầy · cả lớp thấy bé ma Thầy to gấp 2', tren: 58, khongNho: true }).replace(/<div class="tv-sung"[\s\S]*?<\/div>/, '').replace(/<button class="tv-nut"[\s\S]*?<\/button>/, '')
      + '<div class="gv-goi-y">Thầy chạm vào sân để bé ma Thầy chạy tới · bút đỏ tự bắn · bị hạ thì 5 giây sau quay lại</div>')
    void d
  },
  'bang-vang'() { veBangVang() },
  'cuoi-van'() {
    const nv = nhomTran({ banEm: false }); nv.forEach((n) => { n.ban = false })
    dungTran({ giua: true, nv, hieu: HIEU_TRAN.slice(0, 3), giay: 121 })
    themHtml(hud({ diem: [19, 23, 12, 9], van: 3, con: '0:00', cap: 2, tin: [], trangThai: CHO_LIVE })
      + `<div class="tv-the"><span class="dau-nho">Đỗ á khoa</span><h2>Đội Kali đỗ thủ khoa ván 3!</h2>
        <p>Đội em (${ten(0, 'Đội Natri')}): đỗ á khoa · 19 lượt hạ</p><p>Em: <b>4 lượt hạ</b> · hạng 3 trong lớp</p>
        <ol><li>Gia Bảo · 7 lượt hạ · thủ khoa</li><li>Minh Anh · 5 lượt hạ · hạ gục Thầy</li><li class="em">Thị Hà (em) · 4 lượt hạ</li></ol><p class="sau">Ván 4 sau 5 giây</p></div>`)
  },
  'tu-do'() { veTuDo() },
  sanh() { veSanh() },
  'thi-dua'() { veThiDua() },
  'ban-em'() {
    const d = dungTran({ giua: true, nv: nhomTran(), dan: DAN_TRAN, hieu: HIEU_TRAN.slice(0, 3), hop: { loai: 'mau', x: 800, y: 500 }, giay: 50 })
    themHtml(hud({ diem: [4, 3, 1, 1], van: 2, con: '1:10', cap: 2, ca: true, tatTieng: true, tin: [`${ten(0, 'Đức Anh')} hạ ${ten(2, 'Quốc Huy')}`, `${ten(0, 'Thị Hà')} chuỗi 3 · Đỗ đại học!`], trangThai: 'Phòng chờ ca · thầy bấm Bắt đầu là vào bài ngay' }))
    banDoNho(d)
  },
  'bo-hinh'() { veBoHinh() },
  sung() { veSung() },
  'co-san'() { veCoSan() },
  'xuat-hien'() {
    const nv = [
      ma('S0', 'Thị Hà (em)', 0, 200, 158, { toi: true, cap: 1, hien: { p: 0.6, kieu: 'dau' } }),
      ma('S3', 'Đức Anh', 0, 70, 140, { cap: 1, hien: { p: 0.22, kieu: 'dau' } }),
      ma('S9', 'Hải Yến', 0, 362, 122, { cap: 1, hien: { p: 0.86, kieu: 'dau' } }),
      ma('S10', 'Tuấn Kiệt', 0, 120, 300, { cap: 1, goc: 0.4 }),
    ]
    const d = dungTran({ nv, giay: 1 })
    themHtml(hud({ diem: [0, 0, 0, 0], van: 3, con: '2:00', cap: 1, tin: [], trangThai: CHO_LIVE })
      + '<div class="tv-dau vang" style="top:58%;left:60%"><b>VÀO TRẬN!</b><small>Ván 3 · cả đội được vẽ ra ở trại</small></div>')
    banDoNho(d)
  },
  'song-lai'() {
    const nv = [
      ma('S0', 'Thị Hà (em)', 0, 210, 165, { toi: true, cap: 1, hien: { p: 0.9, kieu: 'song' } }),
      ma('S3', 'Đức Anh', 0, 100, 250, { cap: 1, hien: { p: 0.13, kieu: 'song' } }),
      ma('S9', 'Hải Yến', 0, 360, 120, { cap: 2, batTu: true, goc: 0.3 }),
      ma('S2', 'Gia Bảo', 3, 600, 330, { cap: 6, mau: 70, ban: true, nham: [360, 120] }),
    ]
    const d = dungTran({ nv, dan: [{ x1: 570, y1: 290, x2: 380, y2: 100, cap: 6, doi: 3 }], hieu: [{ k: 'so', x: 420, y: 70, chu: 'chặn!', a: 1, mau: 'sao' }], giay: 8 })
    themHtml(hud({ diem: [6, 5, 3, 9], van: 3, con: '1:52', cap: 1, tin: [`${ten(3, 'Gia Bảo')} hạ ${ten(0, 'Thị Hà')}`], trangThai: CHO_LIVE })
      + '<div class="tv-dau vang" style="top:56%;left:62%"><b>THI LẠI!</b><small>Bất tử 2 giây · súng về cấp 1</small></div>')
    banDoNho(d)
  },
  'cau-ho'() { veCauHo() },
}

// ── Trang giấy dùng chung cho bảng vàng · thi đua · bộ hình · câu hô ──
function trangCanvas(): CanvasRenderingContext2D {
  goc.insertAdjacentHTML('beforeend', '<div class="trang"></div>')
  const c = document.createElement('canvas'); c.className = 'tv-san'; c.width = W * dpr; c.height = H * dpr
  goc.querySelector('.trang')!.appendChild(c)
  const g = c.getContext('2d')!; g.scale(dpr, dpr); return g
}
function bongDat(g: CanvasRenderingContext2D, x: number, y: number, s: number): void { g.beginPath(); g.ellipse(x, y, 15 * s, 5 * s, 0, 0, Math.PI * 2); g.fillStyle = mau(b.bong, b.bongA * 1.3); g.fill() }

function veBangVang(): void {
  const g = trangCanvas(), k = dpr * 2
  const BUC = [{ x: 230, h: 150, hang: 2, doi: 1, ten: 'Minh Anh', so: 5 }, { x: 450, h: 220, hang: 1, doi: 3, ten: 'Gia Bảo', so: 7 }, { x: 670, h: 110, hang: 3, doi: 0, ten: 'Thị Hà', so: 4 }]
  const day = 690
  for (const p of BUC) {
    const pts = hcn(p.x - 92, day - p.h, 184, p.h, 6), D = 20, top = day - p.h
    to(g, hcn(p.x - 80, top + 14, 196, p.h, 6), b.bong, b.bongA * 1.4)
    const ben: [number, number][] = [[p.x + 92, top], [p.x + 92 + D, top - D * 0.7], [p.x + 92 + D, day - D * 0.7], [p.x + 92, day]]; to(g, ben, pha(b.doi[p.doi], [0, 0, 0], 0.45)); netTay(g, b, ben, { mau: b.muc, day: 2, hat: p.hang + 7, bien: 0.8 })
    const tren: [number, number][] = [[p.x - 92, top], [p.x - 92 + D, top - D * 0.7], [p.x + 92 + D, top - D * 0.7], [p.x + 92, top]]; to(g, tren, pha(b.doi[p.doi], b.giay, 0.25)); netTay(g, b, tren, { mau: b.muc, day: 2, hat: p.hang + 9, bien: 0.8 })
    to(g, pts, pha(b.doi[p.doi], b.giay, 0.55)); netTay(g, b, pts, { mau: b.muc, day: 2.4, hat: p.hang * 3, bien: 1.2 })
    g.font = '64px "Patrick Hand", sans-serif'; g.textAlign = 'center'; g.fillStyle = mau(b.muc); g.fillText(String(p.hang), p.x, day - p.h + 74)
    bongDat(g, p.x + 10, day - p.h - 8, 2)
    const a = nuongMa(b, k, p.doi, false, 0, p.hang === 1 ? { mu: 'tot-nghiep' } : {}); dat(g, a, p.x + 10, day - p.h - 10, 2)
    const s = nuongSung(b, k, p.doi, p.hang === 1 ? 6 : 3); g.save(); g.translate(p.x + 34, day - p.h - 70); dat(g, s, 0, 0, 2); g.restore()
    if (p.hang === 1) dat(g, nuongVuongMien(b, k), p.x + 10, day - p.h - 160, 2)
  }
  g.textAlign = 'start'
  themHtml(`<h1 class="tieu-de-trang">Bảng vàng <small>Ván 3 · lớp 11A2</small></h1>`
    + BUC.map((p) => `<div class="bv-nhan" style="left:${p.x}px;top:${day + 6}px">${ten(p.doi, p.ten)}<small>${p.so} lượt hạ${p.hang === 1 ? ' · thủ khoa' : ''}</small></div>`).join('')
    + `<div class="bv-ben">
      <div class="bv-o" style="--q:-1deg;${cv(1)}"><b>Đội Kali</b> đỗ thủ khoa ván 3 · 23 lượt hạ</div>
      <div class="bv-o" style="--q:0.8deg">Đỗ á khoa: ${ten(0, 'Đội Natri')} · 19<br>Đỗ vớt: ${ten(2, 'Đội Đồng')} · 12<br>Thi lại ván sau: ${ten(3, 'Đội Canxi')} · 9</div>
      <div class="bv-o" style="--q:-0.6deg"><em>Đã tiêu diệt thủ khoa:</em> ${ten(1, 'Minh Anh')}</div>
      <div class="bv-o" style="--q:1deg"><em>Đã hạ gục Thầy:</em> ${ten(1, 'Minh Anh')}, ${ten(2, 'Gia Huy')}</div>
      <div class="bv-o" style="--q:-0.8deg"><em>Đánh Ma Mực nhiều nhất:</em> ${ten(2, 'Đội Đồng')} · 34%</div>
      <div style="font-size:18px;opacity:.85">Ván 4 sau 5 giây · bảng tự đóng khi thầy bấm Bắt đầu</div></div>`)
}

function veThiDua(): void {
  trangCanvas()
  const SO = [{ doi: 1, so: 412 }, { doi: 0, so: 388 }, { doi: 2, so: 301 }, { doi: 3, so: 276 }]
  themHtml(`<h1 class="tieu-de-trang">Thi đua đội <small>tuần 11/11 – 17/11 · lượt hạ cộng dồn mọi ván</small></h1>
    <div class="td-cot">${SO.map((s, i) => `<div style="${cv(s.doi)}"><span class="so">${s.so}</span><span class="cot" style="height:${(s.so / 412) * 78}%"></span><span>${i + 1}. ${DOI[s.doi].ten}</span></div>`).join('')}</div>
    <div class="bv-ben"><div style="font-size:22px">Danh hiệu tuần này</div>
      <div class="bv-o" style="--q:-1deg"><em>Thợ săn tuần:</em> ${ten(3, 'Gia Bảo')} · 58 lượt hạ</div>
      <div class="bv-o" style="--q:0.8deg"><em>Kẻ phá thủ khoa:</em> ${ten(1, 'Minh Anh')} · tiêu diệt thủ khoa 6 lần</div>
      <div class="bv-o" style="--q:-0.6deg"><em>Hạ gục Thầy:</em> ${ten(2, 'Gia Huy')} · 3 lần</div>
      <div class="bv-o" style="--q:0.6deg">${ten(1, 'Đội Kali')} thắng 9 / 14 ván tuần này</div>
      <div style="font-size:16px;opacity:.85">Danh hiệu hiện cạnh tên em suốt tuần sau</div></div>`)
}

function veSanh(): void {
  themHtml(`<div class="doc"><div class="doc-dau"><p>● Em đã vào phòng chờ</p><h1>Đang chờ Thầy bấm bắt đầu</h1><p>Ca kiểm tra: Kiểm tra Ancol – Phenol · Lớp 11A2</p></div>
    <section class="sv" aria-label="Trò chơi trong lúc chờ"><div class="nho">CHƠI MỘT CHÚT TRONG LÚC CHỜ</div><h2>Sinh Tồn bốn đội</h2>
    <div class="sv-em" style="${cv(1)}"><canvas id="em"></canvas><p>Đội của em cả học kỳ<br><b>Đội Kali</b><br><span class="dh">Thợ săn tuần</span></p></div>
    <div class="sv-tuan">Thi đua tuần này · lượt hạ cộng dồn
      ${[{ d: 1, s: 412 }, { d: 0, s: 388 }, { d: 2, s: 301 }, { d: 3, s: 276 }].map((x) => `<div class="hang${x.d === 1 ? ' em' : ''}" style="${cv(x.d)}"><span>${DOI[x.d].ten.replace('Đội ', '')}</span><span class="ong"><i style="width:${(x.s / 412) * 100}%"></i></span><span>${x.s}</span></div>`).join('')}</div>
    <div class="sv-nut"><button>Tủ đồ</button><button class="choi">Chơi</button></div></section>
    <p class="sv-chan">Điểm chơi chỉ để vui trong lúc chờ.</p></div>`)
  const c = document.getElementById('em') as HTMLCanvasElement; c.width = 86 * dpr; c.height = 98 * dpr
  const g = c.getContext('2d')!; g.scale(dpr, dpr); bongDat(g, 43, 92, 1.2); dat(g, nuongMa(b, dpr * 1.25, 1, false, 0, { mu: 'tot-nghiep', ao: 'o-li' }), 43, 92, 1.18)
}

function veTuDo(): void {
  const O: { loai: string; ds: { ten: string; tt: string; kieu?: KieuMa; khoa?: boolean; mac?: boolean; tien?: number; ve?: string }[] }[] = [
    { loai: 'Mũ', ds: [{ ten: 'Mũ tốt nghiệp', tt: 'Đang mặc', kieu: { mu: 'tot-nghiep' }, mac: true }, { ten: 'Tai nghe', tt: 'Đã mở · chuỗi 3 ngày', kieu: { mu: 'tai-nghe' } },
      { ten: 'Mũ phù thuỷ', tt: 'Cấp 20 · em đang cấp 14', kieu: { mu: 'phu-thuy' }, khoa: true, tien: 70 }] },
    { loai: 'Áo choàng', ds: [{ ten: 'Áo kẻ ô li', tt: 'Đang mặc', kieu: { ao: 'o-li' }, mac: true }, { ten: 'Áo sao đêm', tt: 'Chuỗi 30 ngày · em đang chuỗi 12', kieu: { ao: 'sao-dem' }, khoa: true, tien: 40 }] },
    { loai: 'Khi em hạ được bạn', ds: [{ ten: 'Pháo giấy', tt: 'Cấp 40', khoa: true, tien: 35, ve: 'phao' }, { ten: 'Điểm 10 đỏ', tt: 'Cấp 60', khoa: true, tien: 23, ve: 'diem' }, { ten: 'Đạn cầu vồng', tt: 'Chuỗi 14 ngày · em đang chuỗi 12', khoa: true, tien: 86, ve: 'dan' }] },
  ]
  let id = 0
  themHtml(`<div class="tu"><div class="tu-dau"><h1>Tủ đồ bé ma</h1><button class="tv-nut" style="position:static" aria-label="Đóng tủ đồ">✕</button></div>
    <div class="tu-xem"><canvas id="xem"></canvas><div><p>Đang mặc:<br>Mũ tốt nghiệp · Áo kẻ ô li</p><div class="luat">Đồ chỉ đổi hình bé ma, không làm súng mạnh hơn. Mở bằng <b>chuỗi ngày</b> và <b>cấp</b> EXP: học đều là có đồ mới.</div></div></div>
    ${O.map((n) => `<div class="tu-loai">${n.loai}</div><div class="tu-luoi">${n.ds.map((o) => `<div class="tu-o${o.khoa ? ' khoa' : ''}${o.mac ? ' mac' : ''}"><canvas data-i="${id++}"></canvas><b>${o.ten}</b><span>${o.tt}</span>${o.tien !== undefined ? `<span class="tien"><i style="width:${o.tien}%"></i></span>` : ''}</div>`).join('')}</div>`).join('')}
    <div class="tu-day"><button>Đóng</button><button class="chinh">Mặc đồ đã chọn</button></div></div>`)
  const xem = document.getElementById('xem') as HTMLCanvasElement; xem.width = 132 * dpr; xem.height = 150 * dpr
  const gx = xem.getContext('2d')!; gx.scale(dpr, dpr); bongDat(gx, 66, 140, 1.8); dat(gx, nuongMa(b, dpr * 1.9, 1, false, 0, { mu: 'tot-nghiep', ao: 'o-li' }), 66, 140, 1.8)
  const ds = O.flatMap((n) => n.ds)
  goc.querySelectorAll<HTMLCanvasElement>('.tu-o canvas').forEach((c) => {
    const o = ds[Number(c.dataset.i)]; c.width = 70 * dpr; c.height = 62 * dpr
    const g = c.getContext('2d')!; g.scale(dpr, dpr)
    if (o.kieu) { bongDat(g, 35, 58, 0.8); dat(g, nuongMa(b, dpr * 0.9, 1, false, 0, o.kieu), 35, 58, 0.8); return }
    if (o.ve === 'diem') { g.font = '40px "Patrick Hand", sans-serif'; g.fillStyle = mau(b.sai); g.textAlign = 'center'; g.fillText('10', 35, 44); netTay(g, b, elip(35, 31, 24, 21, 20), { mau: b.sai, day: 2.4, hat: 3, bien: 1 }); return }
    if (o.ve === 'phao') { const r = rng(4); for (let i = 0; i < 16; i++) { g.fillStyle = mau(b.doi[i % 4]); g.save(); g.translate(10 + r() * 50, 6 + r() * 50); g.rotate(r() * 3); g.fillRect(-4, -2, 8, 4); g.restore() } return }
    for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(12 + i * 11, 34 - Math.sin(i) * 6, 5, 0, Math.PI * 2); g.fillStyle = mau(b.doi[i % 4]); g.fill(); g.strokeStyle = mau(b.muc); g.lineWidth = 1.2; g.stroke() }
  })
}

function veBoHinh(): void {
  const g = trangCanvas(), k = dpr * 1.6, s = 1.6
  themHtml('<h1 class="tieu-de-trang" style="top:8px;font-size:34px">Bộ hình «Trang vở» <small>vẽ tay · nướng sẵn một lần · không làm mờ, không phát sáng</small></h1>')
  const nhan = (x: number, y: number, t: string, p = '') => themHtml(`<div class="bh-nhan" style="left:${x}px;top:${y}px">${t}${p ? `<small>${p}</small>` : ''}</div>`)
  const muc = (y: number, t: string) => themHtml(`<div class="bh-muc" style="top:${y}px">${t}</div>`)
  // hàng 1: bé ma bốn đội + Thầy
  muc(86, 'Bé ma vô diện · mặt màu đội · nét rung 2 khung')
  DOI.forEach((d, i) => { const x = 160 + i * 150; bongDat(g, x, 236, s); dat(g, nuongMa(b, k, i, false, 0), x, 236, s); const sg = nuongSung(b, k, i, 1); g.save(); g.translate(x + 19, 188); dat(g, sg, 0, 0, s); g.restore(); nhan(x, 244, d.ten) })
  bongDat(g, 830, 236, 2.2); dat(g, nuongMa(b, dpr * 2.2, 1, false, 0, { thay: true }), 830, 236, 2.2); g.save(); g.translate(860, 172); dat(g, nuongSung(b, dpr * 2.2, 1, 1, { butDo: true }), 0, 0, 2.2); g.restore(); nhan(830, 244, 'Thầy', 'to gấp 2, súng bút đỏ')
  const hm = nuongMaMuc(b, dpr, 0); dat(g, hm, 1130, 250, 0.82); nhan(1130, 254, 'Ma Mực', 'boss giữa ván')
  // hàng 2: 4 súng + đạn
  muc(300, 'Sáu cấp súng · mỗi súng một kiểu đạn')
  for (let cap = 1; cap <= 6; cap++) {
    const x = 110 + (cap - 1) * 205, y = 380
    g.save(); g.translate(x, y); dat(g, nuongSung(b, k, 0, cap), 0, 0, s); g.restore()
    const bx = x + 96, ve2 = new TrinhVe(g, b, k)
    g.save(); g.translate(bx, y); g.scale(1.05, 1.05)
    ;(ve2 as unknown as { dan: (d: Dan, l: number) => void }).dan({ x1: 0, y1: 0, x2: 70, y2: 0, cap, doi: 0, t: 0.6 }, 400)
    g.restore()
    nhan(x + 70, y + 36, `Cấp ${cap} · ${SUNG_TEN[cap - 1]}`)
  }
  // hàng 3: vật chặn
  muc(452, 'Vật chặn = đồ dùng học tập (bóng đổ nướng sẵn) · bụi = mây bút dạ')
  const VAT: [string, number, number, number, string][] = [['thuoc', 100, 520, 170, 'Thước kẻ'], ['butChi', 310, 520, 170, 'Bút chì'], ['butDa', 520, 506, 96, 'Bút dạ'], ['tay', 670, 510, 54, 'Cục tẩy']]
  for (const [l, x, y, w, t] of VAT) { const h = l === 'tay' ? 54 : 44; dat(g, nuongVat(b, dpr, l as never, w, h, w), x, y); nhan(x + w / 2, y + h + 14, t) }
  dat(g, nuongBui(b, dpr, 150, 92, 3), 780, 486); nhan(860, 596, 'Bụi', 'trốn vào là bạn khác không thấy')
  // hàng 4: hộp tiếp tế + hiệu ứng
  muc(626, 'Hộp tiếp tế giấy nhớ · hiệu ứng')
  const HOP: LoaiHop[] = ['mau', 'khien', 'nhanh', 'sao']
  HOP.forEach((l, i) => { const x = 140 + i * 120; dat(g, nuongHop(b, k, l), x, 700, 1.3); nhan(x, 728, TEN_HOP[l]) })
  const HU: [string, (x: number) => void][] = [
    ['Vết mực khi trúng', (x) => dat(g, nuongVetMuc(b, k, 0, 2), x, 690, 1.4)], ['Cục giấy vo khi bị hạ', (x) => dat(g, nuongGiayVo(b, k), x, 690, 1.6)],
    ['Vương miện thủ khoa', (x) => dat(g, nuongVuongMien(b, k), x, 706, 1.4)], ['Lửa trên đầu em', (x) => dat(g, nuongLua(b, k, 0), x, 712, 1.5)],
  ]
  HU.forEach(([t, f], i) => { const x = 690 + i * 150; f(x); nhan(x, 728, t) })
  void nuongSao; void veBieuTuong; void mauHop; void duong
}

function veSung(): void {
  const g = trangCanvas(), k = dpr * 3
  themHtml('<h1 class="tieu-de-trang" style="top:8px;font-size:34px">Sáu khẩu súng <small>hạ được bạn là súng lên một cấp · bị hạ thì về cấp 1</small></h1>')
  const MO = ['Đạn mực tròn, bắn đều tay', 'Hai tia song song, trúng hai vệt', 'Bọt khí to, vỡ ra trúng cả bạn đứng sát', 'Tia sấm nảy sang một đối thủ gần đó', 'Cầu lửa đúng màu thử ngọn lửa của đội, cháy thêm 2 giây', 'Sao lớn nổ lan cả một vùng']
  const ve2 = new TrinhVe(g, b, dpr * 2.2) as unknown as { dan: (d: Dan, l: number) => void }
  for (let i = 0; i < 6; i++) {
    const cot = i % 3, hang = Math.floor(i / 3), x = 120 + cot * 420, y = 170 + hang * 300
    g.save(); g.translate(x, y); dat(g, nuongSung(b, k, i === 4 ? 1 : 0, i + 1), 0, 0, 3); g.restore()
    g.save(); g.translate(x + 175, y); g.scale(2.1, 2.1); ve2.dan({ x1: 0, y1: 0, x2: 40, y2: 0, cap: i + 1, doi: i === 4 ? 1 : 0, t: 0.65 }, 300 + i * 70); g.restore()
    themHtml(`<div class="bh-nhan" style="left:${x + 150}px;top:${y + 72}px;font-size:24px;width:380px;white-space:normal">Cấp ${i + 1} · ${SUNG_TEN[i]}<small>${MO[i]}</small></div>`)
  }
  // cầu lửa bốn màu thử ngọn lửa: Na vàng · K tím · Cu xanh lục · Ca đỏ cam
  for (let d2 = 0; d2 < 4; d2++) { g.save(); g.translate(990 + d2 * 70, 640); g.scale(1.5, 1.5); ve2.dan({ x1: 0, y1: 0, x2: 30, y2: 0, cap: 5, doi: d2, t: 0.5 }, 200 + d2 * 90); g.restore() }
  themHtml('<div class="bh-nhan" style="left:1080px;top:668px">Na vàng · K tím · Cu xanh lục · Ca đỏ cam<small>đúng màu thử ngọn lửa của nguyên tố mỗi đội</small></div>')
}

function veCoSan(): void {
  const g = trangCanvas(), ti = 0.12, x0 = 110, y0 = 120
  const CO = [{ n: 'tới 20 bạn', ngang: 2, doc: 2 }, { n: '21 – 36 bạn', ngang: 3, doc: 2 }, { n: '37 – 64 bạn', ngang: 3, doc: 3 }, { n: '65 – 96 bạn', ngang: 4, doc: 3 }, { n: 'từ 97 bạn', ngang: 4, doc: 4 }]
  themHtml('<h1 class="tieu-de-trang" style="top:8px;font-size:34px">Sân tự lớn theo sĩ số <small>đếm cả bạn máy · đổi ở đầu ván</small></h1>')
  for (let i = CO.length - 1; i >= 0; i--) {
    const c = CO[i], w = 1600 * c.ngang * ti, h = 1000 * c.doc * ti
    g.fillStyle = mau(pha(b.giay, b.doi[i % 4], 0.06 + i * 0.015)); g.fillRect(x0, y0, w, h)
    g.beginPath(); for (let kx = 1; kx < c.ngang; kx++) { g.moveTo(x0 + kx * 1600 * ti, y0); g.lineTo(x0 + kx * 1600 * ti, y0 + h) } for (let ky = 1; ky < c.doc; ky++) { g.moveTo(x0, y0 + ky * 1000 * ti); g.lineTo(x0 + w, y0 + ky * 1000 * ti) }
    g.setLineDash([4, 6]); g.strokeStyle = mau(b.muc, 0.25); g.lineWidth = 1; g.stroke(); g.setLineDash([])
    netTay(g, b, hcn(x0, y0, w, h, 4), { mau: i === 0 ? b.sao : b.muc, day: i === 0 ? 3 : 2, hat: i * 5, bien: 1.2, a: 0.85 })
    themHtml(`<div class="bh-nhan" style="left:${x0 + w - 10}px;top:${y0 + h - 48}px;text-align:right;transform:translateX(-100%)">${c.n}<small>${c.ngang} × ${c.doc} trang · ${1600 * c.ngang} × ${1000 * c.doc}</small></div>`)
  }
  // khu nhỏ nhất có bản đồ thật cho dễ hình dung
  const bd = taoBanDo(2)
  g.fillStyle = mau(b.muc, 0.45); for (const t of bd.chan) g.fillRect(x0 + t.x * ti, y0 + t.y * ti, Math.max(1, t.w * ti), Math.max(1, t.h * ti))
  g.fillStyle = mau(b.doi[2], 0.45); for (const t of bd.bui) g.fillRect(x0 + t.x * ti, y0 + t.y * ti, t.w * ti, t.h * ti)
  bd.trai.forEach((t, i) => { g.beginPath(); g.arc(x0 + t.x * ti, y0 + t.y * ti, 5, 0, Math.PI * 2); g.fillStyle = mau(b.doi[i]); g.fill() })
  themHtml(`<div class="bv-ben" style="top:120px;width:300px"><div class="bv-o" style="--q:-1deg">Mỗi trang vở 1600 × 1000 có đủ thước, bút, tẩy, bụi và <em>một hộp tiếp tế</em> ở giữa trang</div>
    <div class="bv-o" style="--q:0.8deg">Bốn trại ở bốn góc ngoài cả sân</div><div class="bv-o" style="--q:-0.6deg">Sân càng lớn, vòng an toàn co càng nhanh ⇒ cuối ván vẫn chạm trán</div>
    <div class="bv-o" style="--q:0.6deg">Mỗi đội luôn đủ 4 bé ma: thiếu bạn thì máy vào thay, mang tên như học sinh</div></div>`)
}

function veCauHo(): void {
  trangCanvas()
  const CAU: [string, string, string?][] = [
    ['MỞ BÀI!', 'Hạ đầu tiên của ván · cả lớp thấy'], ['ĐỖ TỐT NGHIỆP!', 'Chuỗi 2: hạ 2 bạn chưa bị hạ lần nào'], ['ĐỖ ĐẠI HỌC!', 'Chuỗi 3'], ['Á KHOA!', 'Chuỗi 4'],
    ['KHÔNG AI CẢN NỔI!', 'Chuỗi 5 trở lên'], ['EM LÀ THỦ KHOA!', 'Em dẫn đầu lượt hạ ván ⇒ cả lớp truy nã em', 'vang'], ['ĐÃ TIÊU DIỆT THỦ KHOA!', 'Hạ bạn đang bị truy nã · súng lên cấp ngay'], ['ĐÁNH TRƯỢT ĐẠI HỌC!', 'Hạ bạn đang có chuỗi từ 3'],
    ['TRƯỢT ĐẠI HỌC RỒI!', 'Em bị hạ · thi lại sau 3 giây'], ['BỊ THẦY GẠCH TÊN!', 'Em bị bé ma Thầy hạ'], ['ĐÃ HẠ GỤC THẦY!', 'Tên em lên bảng vàng', 'vang'], ['ĐÃ DIỆT MA MỰC!', 'Đội em hạ boss giữa ván'],
    ['CẢ ĐỘI CANXI TRƯỢT!', 'Cả một đội bị hạ cùng lúc'], ['RA KHỎI PHÒNG THI!', 'Em ra ngoài vòng an toàn · đang mất máu'], ['SẮP THU BÀI!', '10 giây cuối ván'], ['ĐỖ THỦ KHOA VÁN 3!', 'Đội nhất · nhì «Đỗ á khoa» · ba «Đỗ vớt» · tư «Thi lại ván sau»', 'vang'],
  ]
  themHtml(`<h1 class="tieu-de-trang">Câu hô trên màn em <small>con dấu đỏ của thầy · chỉ ở phòng chờ live</small></h1>
    <div class="ch-luoi">${CAU.map(([c, p, v]) => `<div class="ch-o"><div class="tv-dau${v ? ' vang' : ''}${c.length > 16 ? ' nho' : ''}"><b>${c}</b></div><p>${p}</p></div>`).join('')}</div>`)
}

;(MANS[MAN] ?? MANS.tran)()
document.body.dataset.xong = '1'

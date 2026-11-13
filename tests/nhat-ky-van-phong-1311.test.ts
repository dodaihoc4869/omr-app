// @vitest-environment node
// NHẬT KÝ BÀI DẠY — ĐƯỜNG CHO VĂN PHÒNG SOẠN (thầy 13/11: «nhật kí sau khi live xong gửi cho văn phòng soạn» · «Làm luôn đường nhật ký cho văn phòng nhé»).
// Khoá: (1) cổng tự kiểm bản TS (src/lib/nhat-ky/cong.ts) cho ĐÚNG kết quả như khuôn gốc của bản vẽ (docs/ban-ve-nhat-ky-bai-day-1311/khuon.js) trên kịch bản
// mẫu và kịch bản sửa hỏng; (2) bộ kiểm lược đồ nhận mẫu, bắt lỗi dạng; (3) tách trang bảng từ net.bin: gộp trang khi đổi Học ⇄ Bảng, tách ở «xoá hết», giữ
// giờ gốc của nét; (4) ba lệnh máy chủ qua cửa thật `worker.fetch` trên D1 thật + R2 giả: mã GV, danh sách, tư liệu (không lộ mã câu), nhận kịch bản (ban
// khớp, lược đồ, cổng, che tên học sinh, máy điền vùng nét), ảnh trang SVG theo vé.
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { taoD1That, type D1That } from './_d1-that'
import { taoR2Gia, type R2Gia } from './_live-xem-lai-gia'
import { CONG, kiemCong, quaCong } from '../src/lib/nhat-ky/cong'
import { boPhanMay, kiemKichBan } from '../src/lib/nhat-ky/luoc-do'
import { svgTrang, tachTrang, vungTrong } from '../src/lib/nhat-ky/trang-bang'
import { maBangMoi, maNetXong, maXoaHet } from '../src/lib/live/ma-net'
import { ghiNetBin } from '../src/lib/live/xem-lai-kieu'
import type { NetBut } from '../src/lib/but-bang-loi'
import type { Env } from '../server/src/kieu'

const BV = 'docs/ban-ve-nhat-ky-bai-day-1311/'
const doc = (t: string): any => JSON.parse(readFileSync(BV + t, 'utf8'))
/** Nạp khuôn gốc (IIFE gắn window.NKB) như kiem-kich-ban.mjs của bản vẽ. */
function khuonGoc(): any {
  const g = globalThis as any
  const cu = { window: g.window, location: g.location, matchMedia: g.matchMedia, document: g.document }
  g.window = g; g.location = { search: '' }; g.matchMedia = () => ({ matches: false }); g.document = { documentElement: { classList: { contains: () => false } } }
  new Function(readFileSync(BV + 'khuon.js', 'utf8'))()
  const N = g.NKB
  Object.assign(g, cu); delete g.NKB
  return N
}
const gon = (c: any) => ({ dat: c.dat, bo: c.bo.map((x: any) => x.id), phatHanh: c.phatHanh, nguong: c.nguong.moTa })

describe('cổng tự kiểm bản TS = khuôn gốc của bản vẽ', () => {
  const N = khuonGoc()
  const bienThe = (): [string, any][] => {
    const hong = doc('kich-ban-lien-ket.json'), c7 = hong.canh.find((c: any) => c.id === 'c7'), c3 = hong.canh.find((c: any) => c.id === 'c3')
    c7.duLieu.tinh.ketQua.gt = 0.45; c7.duLieu.tinh.ketQua.hien = '0,45'; c3.nguon.den = c3.nguon.tu
    const it2 = doc('kich-ban-lien-ket.json'); it2.canh.forEach((c: any, i: number) => { if (i > 1) c.nguon.trang = 0 })
    const tien = doc('kich-ban-fes2.json'); tien.canh[0].loi[0].chu = 'Thầy ví như tiền trong nhà.'
    return [['liên kết', doc('kich-ban-lien-ket.json')], ['FeS₂', doc('kich-ban-fes2.json')], ['sửa số + bỏ tiếng', hong], ['chỉ 2 cảnh có nguồn', it2], ['chữ cấm', tien]]
  }
  it.each(bienThe())('%s: cùng cảnh đạt / bỏ, cùng quyết định phát hành, cùng ngưỡng', (_t, kb) => {
    expect(gon(kiemCong(JSON.parse(JSON.stringify(kb))))).toEqual(gon(N.kiemCong(JSON.parse(JSON.stringify(kb)))))
  })
  it('mẫu thật phát hành; sửa hỏng thì bỏ đúng cảnh; it cảnh ⇒ không phát hành; ngưỡng phát hành như bản vẽ', () => {
    const [[, a], , [, hong], [, it2]] = bienThe()
    expect(kiemCong(a).phatHanh).toBe(true)
    expect(kiemCong(hong).bo.map((x) => x.id)).toEqual(expect.arrayContaining(['c3', 'c7']))
    expect(kiemCong(it2).phatHanh).toBe(false)
    expect(CONG).toEqual(N.CONG)
  })
  it('quaCong: che tên người như bản gốc, bản phát hành không mang chữ chép bảng; lỗi máy chủ thêm (`them`) bỏ đúng cảnh', () => {
    const kb = doc('kich-ban-lien-ket.json'); kb.canh[0].loi[0].chu = 'Bạn Minh Anh với bạn Long kéo co, cặp electron là vạch ở giữa.'
    const a = quaCong(JSON.parse(JSON.stringify(kb)), { tenLop: ['Minh Anh', 'Long'] }).kb, b = N.quaCong(JSON.parse(JSON.stringify(kb)), { tenLop: ['Minh Anh', 'Long'] }).kb
    expect(a.canh[0].loi[0].chu).toBe(b.canh[0].loi[0].chu)
    expect(a.canh[0].loi[0].chu).not.toMatch(/Minh Anh|Long/)
    expect(a.canh.some((c: any) => c.nguon.chep)).toBe(false)
    const them = quaCong(doc('kich-ban-lien-ket.json'), { them: { c1: ['Trang bảng 9 không có'] } })
    expect(them.cong.bo.find((x) => x.id === 'c1')?.lyDo).toContain('Trang bảng 9 không có')
    expect(them.kb.canh.some((c: any) => c.id === 'c1')).toBe(false)
  })
})

describe('kiểm lược đồ (bộ kiểm nhỏ trong Worker)', () => {
  it('bản sao lược đồ trong mã trùng bản của bản vẽ', () => {
    expect(JSON.parse(readFileSync('src/lib/nhat-ky/luoc-do.json', 'utf8'))).toEqual(doc('luoc-do.json'))
  })
  it('hai kịch bản mẫu (bỏ phần máy điền) hợp lệ; trường lạ / thiếu trường / sai hằng / sai khuôn ⇒ có lỗi kèm đường dẫn', () => {
    for (const t of ['kich-ban-lien-ket.json', 'kich-ban-fes2.json']) expect(kiemKichBan(boPhanMay(doc(t)))).toEqual([])
    const lech = (f: (k: any) => void): string[] => { const k = boPhanMay(doc('kich-ban-lien-ket.json')) as any; f(k); return kiemKichBan(k) }
    expect(lech((k) => { k.la = 1 }).join()).toMatch(/\/la: trường lạ/)
    expect(lech((k) => { delete k.bia }).join()).toMatch(/\/bia: thiếu/)
    expect(lech((k) => { k.phienBan = 1 }).join()).toMatch(/\/phienBan: phải là 2/)
    expect(lech((k) => { k.canh[0].khuon = 'la' }).join()).toMatch(/\/canh\/0: không khớp dạng nào/)
    expect(lech((k) => { k.canh[1].loi[0].tu = 'mười' }).length).toBeGreaterThan(0)
  })
})

// ── net.bin giả: Học (giấy câu 1) → Bảng → Học (gửi lại nét cũ + nét mới) → xoá hết → nét mới ──
const net = (id: string, x: number, y: number, soDiem = 5, mau = 'rgb(244,239,228)'): NetBut => ({ id, cong: 'but', mau, co: 4, diem: Array.from({ length: soDiem }, (_, i) => [x + i * 0.02, y, 0.5, i * 100]) })
function netBinGia(): Uint8Array {
  const m: { t: number; khung: Uint8Array }[] = []
  let stt = 0
  const so = (k: Uint8Array): Uint8Array => { const c = new Uint8Array(k); new DataView(c.buffer).setUint32(1, ++stt, true); return c }
  const A = net('a1', 0.1, 0.3), B = net('b_1', 0.5, 1.4), C = net('c1', 0.2, 0.6), D = net('d1', 0.3, 0.2)
  m.push({ t: 0, khung: so(maBangMoi('q1~giay', 16 / 9)) })
  m.push({ t: 1000, khung: so(maNetXong(A)[0]!) })
  m.push({ t: 2000, khung: so(maBangMoi('bl', 16 / 9)) })
  m.push({ t: 3000, khung: so(maNetXong(B)[0]!) })
  m.push({ t: 4000, khung: so(maBangMoi('q1~giay', 16 / 9)) })
  m.push({ t: 4000, khung: so(maNetXong(A)[0]!) }) // ảnh trạng thái gửi lại nét cũ
  m.push({ t: 5000, khung: so(maNetXong(C)[0]!) })
  m.push({ t: 7000, khung: so(maXoaHet()) })
  m.push({ t: 8000, khung: so(maNetXong(D)[0]!) })
  return ghiNetBin(m)
}

describe('tách trang bảng từ net.bin', () => {
  const ds = tachTrang(netBinGia(), 10_000)
  it('đổi Học ⇄ Bảng ⇒ GỘP về trang cũ (không đẻ trang trùng); «xoá hết» ⇒ trang mới; trang bảng đen nhận ra nhờ nét «b_»', () => {
    expect(ds.map((t) => ({ stt: t.stt, loai: t.loai, net: t.net.map((n) => n.net.id) }))).toEqual([
      { stt: 1, loai: 'giay', net: ['a1', 'c1'] }, { stt: 2, loai: 'bang', net: ['b_1'] }, { stt: 3, loai: 'giay', net: ['d1'] }])
    expect(ds[0]!.doan).toEqual([[0, 2000], [4000, 7000]])
    expect(ds[2]!.doan).toEqual([[7000, 10_000]])
  })
  it('giờ của nét = lần đầu xuất hiện (nét gửi lại theo ảnh trạng thái giữ giờ cũ); vùng nét theo khoảng giờ', () => {
    const a = ds[0]!.net.find((n) => n.net.id === 'a1')!
    expect([a.t0, a.t1]).toEqual([1000, 1400])
    expect(vungTrong(ds[0]!, 4500, 6000)).not.toBeNull()
    const v1 = vungTrong(ds[0]!, 900, 1500)!, v2 = vungTrong(ds[0]!, 4900, 5500)!
    expect(v1[1]).toBeLessThan(v2[1]) // nét a1 (y 0,3) nằm trên nét c1 (y 0,6)
    expect(vungTrong(ds[0]!, 20_000, 30_000)).toBeNull()
  })
  it('SVG: vectơ, nền bảng, mỗi nét một đường; bảng đen cuộn (y > 1) cao thêm; không màu lạ lọt vào', () => {
    const M = { nen: 'rgb(19,31,36)', mucXanh: 'rgb(125,170,255)', macDinh: 'rgb(244,239,228)' }, s1 = svgTrang(ds[0]!, M), s2 = svgTrang(ds[1]!, M)
    expect(s1.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true)
    expect((s1.match(/<path /g) ?? []).length).toBe(2)
    expect(Number(/viewBox="0 0 1920 (\d+)"/.exec(s2)![1])).toBeGreaterThan(Number(/viewBox="0 0 1920 (\d+)"/.exec(s1)![1]))
    const la = svgTrang({ ...ds[0]!, net: [{ net: net('x', 0.1, 0.1, 3, 'url(javascript:1)'), t0: 0, t1: 1 }] }, M)
    expect(la).not.toContain('javascript')
  })
})

// ── ba lệnh máy chủ ──
const T0 = Date.parse('2026-11-13T15:00:00Z'), GOC = 'https://may-chu.thu'
let d1: D1That, r2: R2Gia, env: Env
const CAU_BUOI = (so: number, qid: string, t0: number, t1: number) => ({ so, luot: so, qid, phan: 'I', tuLuan: false, dang: 'Liên kết', bai: 'Bài 10', cau: { qid, maDe: 'DE9', text: `Câu ${so}: liên kết trong phân tử nào phân cực?`, choices: ['H₂', 'O₂', 'HCl', 'Cl₂'] }, dung: 'C', moDapAn: true, giai: { solution: 'HCl có Δχ = 0,96', anh: [] }, soDung: 5, soGui: 8, t0, t1 })
async function themBuoi(id: string, o: { ban?: number; tat?: string } = {}): Promise<void> {
  d1.sql.prepare(`INSERT INTO live_buoi (id, lop, ngay, bat_luc, tat_luc, ten_tu_dong, so_cau, so_doan, giay_live, giay_doan, byte, trang_thai, tien_do, quyen, ban, tao_luc, cap_nhat)
    VALUES (?, '10A1', '2026-11-13', '2026-11-13T13:18:00.000Z', ?, 'Liên kết cộng hoá trị', 2, 2, 2400, 900, 1000, 'xong', 100, 'lop', ?, 'x', '2026-11-13T14:00:00.000Z')`).run(id, o.tat ?? '2026-11-13T14:00:00.000Z', o.ban ?? 2)
  await r2.be.put(`live/${id}/buoi.json`, JSON.stringify({ v: 1, id, ban: o.ban ?? 2, ngay: '2026-11-13', lop: '10A1', batLuc: '', tatLuc: '', tenTuDong: 'Liên kết cộng hoá trị', tenThay: null, giayToi: true, coTieng: true, msLive: 2_400_000, msDoan: 900_000, byteTieng: 10, byteNet: 10,
    cau: [CAU_BUOI(1, 'QID_BI_MAT_1', 0, 600_000), CAU_BUOI(2, 'QID_BI_MAT_2', 600_000, 2_400_000)], doan: [] }))
  await r2.be.put(`live/${id}/net.bin`, netBinGia())
  await r2.be.put(`live/${id}/tieng.mp3`, new Uint8Array(10))
}
const goi = (duong: string, b?: unknown, thay = true): Promise<Response> =>
  worker.fetch(new Request(`${GOC}${duong}`, b === undefined ? { headers: thay ? { 'x-ma-bi-mat': 'bi-mat-thu' } : {} } : { method: 'POST', headers: { 'content-type': 'application/json', ...(thay ? { 'x-ma-bi-mat': 'bi-mat-thu' } : {}) }, body: JSON.stringify(b) }), env) as Promise<Response>
const vp = async (duong: string, b: unknown = {}): Promise<any> => (await goi(duong, b)).json()
/** Kịch bản mẫu của bản vẽ chuyển về trục của buổi giả: mọi cảnh lấy trang 1. */
const kbMau = (): any => { const k = boPhanMay(doc('kich-ban-lien-ket.json')) as any; for (const c of k.canh) if (c.khuon !== 'tong-ket') c.nguon.trang = 1; return k }

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0)
  d1 = taoD1That(); r2 = taoR2Gia()
  env = { ...d1.env, DE: r2.be } as unknown as Env
  d1.sql.exec(`INSERT INTO hoc_sinh(sbd,ho_ten,lop,ten_lop,mat_khau,cap_nhat_luc) VALUES ('A1','Nguyễn Minh Anh','10','10A1','mk','x'),('A2','Trần Văn Long','10','10A1','mk','x')`)
})
afterEach(() => { vi.useRealTimers() })

describe('lệnh của văn phòng', () => {
  it('thiếu mã GV ⇒ 403; danh sách: buổi xong ≥ 3 phút, chưa có nhật ký ⇒ cần soạn; buổi vừa tắt chưa đưa ra', async () => {
    await themBuoi('b1'); await themBuoi('b2', { tat: new Date(T0 - 60_000).toISOString() })
    expect((await goi('/gv/live-nhat-ky-ds', {}, false)).status).toBe(403)
    const r = await vp('/gv/live-nhat-ky-ds')
    expect(r.ok).toBe(true)
    expect(r.ds.map((x: any) => [x.buoiId, x.canSoan, x.ban, x.nhatKy])).toEqual([['b1', true, 2, null]])
    expect((await vp('/gv/live-nhat-ky-ds', { sau: r.moc })).ds).toEqual([])
  })
  it('tư liệu: câu đã chữa (không lộ mã câu / mã đề), trang bảng kèm khoảng giờ + câu đang dạy, ảnh SVG theo vé, lược đồ', async () => {
    await themBuoi('b1')
    const t = await vp('/gv/live-nhat-ky-tu-lieu', { buoiId: 'b1' })
    expect(t).toMatchObject({ ok: true, ban: 2, buoi: { lop: '10A1', thu: 'Thứ Sáu', gioBatDau: '20:18', phutLive: 40, giayTieng: 2400 } })
    expect(JSON.stringify(t)).not.toMatch(/QID_BI_MAT|DE9/)
    expect(t.cau.map((c: any) => [c.so, c.dapAn, c.tu, c.den])).toEqual([[1, 'C', 0, 600], [2, 'C', 600, 2400]])
    expect(t.trang.map((x: any) => [x.trang, x.loai, x.cau, x.soNet])).toEqual([[1, 'giay', 1, 2], [2, 'bang', 1, 1], [3, 'giay', 2, 1]])
    expect(t.luocDo.$id).toBe('nhat-ky-bai-day/kich-ban/1')
    const anh = await goi(t.trang[1].anh.replace(GOC, ''), undefined, false)
    expect(anh.status).toBe(200); expect(anh.headers.get('content-type')).toContain('image/svg+xml'); expect(await anh.text()).toContain('<path ')
    expect((await goi('/live-tep/b1/trang-1.svg?ve=sai', undefined, false)).status).toBe(403)
    expect((await goi(t.trang[0].anh.replace(GOC, '').replace('trang-1', 'trang-9'), undefined, false)).status).toBe(404)
  })
  it('nhận kịch bản: đúng lược đồ + qua cổng ⇒ cất bản phát hành (che tên, máy điền vùng nét / đầu tệp, bỏ chép bảng); danh sách thôi đòi soạn', async () => {
    await themBuoi('b1')
    const kb = kbMau(); kb.canh[0].loi[0].chu = 'Bạn Long với bạn Minh Anh kéo co, cặp electron là vạch ở giữa.'
    const r = await vp('/gv/live-nhat-ky-ghi', { buoiId: 'b1', ban: 2, kichBan: kb })
    expect(r).toMatchObject({ ok: true, phatHanh: true, ban: 2 })
    const cat = JSON.parse(new TextDecoder().decode(r2.du.get('live/b1/nhat-ky.json')!.b))
    expect(cat.buoi).toMatchObject({ lop: '10A1', ban: 2 })
    expect(cat.canh[0].loi[0].chu).not.toMatch(/Long|Minh Anh/)
    expect(cat.canh[0].loi[0].chu).toMatch(/^Một bạn với một bạn kéo co/)
    expect(cat.canh.every((c: any) => !c.nguon.chep)).toBe(true)
    expect(cat.canh.filter((c: any) => c.khuon !== 'tong-ket').every((c: any) => Array.isArray(c.nguon.vung))).toBe(true)
    expect(r2.du.has('live/b1/nhat-ky-goc.json')).toBe(true)
    // bản cất mang ngưỡng cổng đã dùng + dấu «văn phòng soạn» ⇒ máy em tin kết quả, không chạy lại cổng trên bản đã gỡ chữ chép bảng
    expect(cat.nguon.nguoiSoan).toBe('van-phong'); expect(cat.nguong.moTa).toMatch(/Δχ/); expect(cat.nguong.vung).toHaveLength(3)
    const ds = await vp('/gv/live-nhat-ky-ds')
    expect(ds.ds[0]).toMatchObject({ buoiId: 'b1', canSoan: false, nhatKy: { ban: 2, phatHanh: true } })
  })
  it('tên gọi một chữ chỉ che khi đi sau «bạn» / «em»: «miền Long An», «Thầy Long» trong chữ thường không bị đụng', async () => {
    await themBuoi('b1')
    const kb = kbMau(); kb.canh[0].loi[0].chu = 'Ở Long An em Long kéo co, cặp electron là vạch ở giữa.'
    await vp('/gv/live-nhat-ky-ghi', { buoiId: 'b1', ban: 2, kichBan: kb })
    const cat = JSON.parse(new TextDecoder().decode(r2.du.get('live/b1/nhat-ky.json')!.b))
    expect(cat.canh[0].loi[0].chu).toBe('Ở Long An một bạn kéo co, cặp electron là vạch ở giữa.')
  })
  it('từ chối: buổi đã dựng lại (ban lệch) · sai lược đồ · lộ mã câu · bìa sai luật chữ; trang bảng không có / giờ ngoài trục ⇒ cổng bỏ cảnh', async () => {
    await themBuoi('b1')
    expect(await vp('/gv/live-nhat-ky-ghi', { buoiId: 'b1', ban: 1, kichBan: kbMau() })).toMatchObject({ ok: false, lyDo: 'ban-doi', ban: 2 })
    const sai = kbMau(); delete sai.bia
    expect(await vp('/gv/live-nhat-ky-ghi', { buoiId: 'b1', ban: 2, kichBan: sai })).toMatchObject({ ok: false, lyDo: 'luoc-do' })
    const lo = kbMau(); lo.canh[0].tieuDe = 'Kéo co QID_BI_MAT_1'
    expect(await vp('/gv/live-nhat-ky-ghi', { buoiId: 'b1', ban: 2, kichBan: lo })).toMatchObject({ ok: false, lyDo: 'ma-noi-bo' })
    const bia = kbMau(); bia.bia.loi = 'Mời em xem lại bài 😀'
    expect(await vp('/gv/live-nhat-ky-ghi', { buoiId: 'b1', ban: 2, kichBan: bia })).toMatchObject({ ok: false, lyDo: 'chu-bia' })
    const ngoai = kbMau(); ngoai.canh[0].nguon.trang = 9; ngoai.canh[1].nguon.den = 99_999
    const r = await vp('/gv/live-nhat-ky-ghi', { buoiId: 'b1', ban: 2, kichBan: ngoai })
    expect(r.bo.map((x: any) => x.id)).toEqual(expect.arrayContaining([ngoai.canh[0].id, ngoai.canh[1].id]))
    expect(r.bo.find((x: any) => x.id === ngoai.canh[0].id).lyDo.join()).toMatch(/Trang bảng 9 không có/)
  })
  it('không đủ cảnh đạt ⇒ không phát hành (học sinh chưa thấy), báo rõ cần sửa; bản phát hành cũ bị gỡ', async () => {
    await themBuoi('b1')
    await vp('/gv/live-nhat-ky-ghi', { buoiId: 'b1', ban: 2, kichBan: kbMau() })
    expect(r2.du.has('live/b1/nhat-ky.json')).toBe(true)
    const it2 = kbMau(); it2.canh.forEach((c: any, i: number) => { if (i > 1 && c.khuon !== 'tong-ket') c.nguon.trang = 0 })
    const r = await vp('/gv/live-nhat-ky-ghi', { buoiId: 'b1', ban: 2, kichBan: it2 })
    expect(r).toMatchObject({ ok: true, phatHanh: false, lyDo: 'chua-du-canh' })
    expect(r2.du.has('live/b1/nhat-ky.json')).toBe(false)
    expect((await vp('/gv/live-nhat-ky-ds')).ds[0]).toMatchObject({ canSoan: true, nhatKy: { phatHanh: false } })
  })
})

describe('màn học sinh xem nhật ký (trang tĩnh public/nhat-ky/)', () => {
  it('nét phấn từng trang theo dạng khuôn đọc: bảng rộng 1600, p = [x×4, y×4, ms], t = giờ trục tiếng; vung = [x0, y0, x1, y1] cùng hệ toạ độ', async () => {
    const { netKhuon, RONG_KHUON } = await import('../src/lib/nhat-ky/trang-bang')
    const ds = tachTrang(netBinGia(), 10_000), M = { nen: 'rgb(19,31,36)', mucXanh: 'rgb(125,170,255)', macDinh: 'rgb(244,239,228)' }
    const k = netKhuon(ds[0]!, M)
    expect(k.rong).toBe(RONG_KHUON); expect(k.net).toHaveLength(2)
    const a = k.net[0]!
    expect(a.t).toBe(1000); expect(a.p.length % 3).toBe(0)
    expect(a.p[0]).toBe(Math.round(0.1 * 1600 * 4)); expect(a.p[1]).toBe(Math.round(0.3 * (1600 / (16 / 9)) * 4))
    expect(k.mau[a.m]![0]).toBe('rgb(244,239,228)')
    const v = vungTrong(ds[0]!, 900, 1500)!
    expect(v[0]).toBeLessThanOrEqual(a.p[0]! / 4); expect(v[2]).toBeGreaterThan(v[0]); expect(v[3]).toBeGreaterThan(v[1])
  })
  it('trang tĩnh: đọc đúng ba tệp của buổi theo vé (nhat-ky.json, trang.json, tieng.mp3), không mẫu bản vẽ; nút «Về buổi live» báo app đóng', () => {
    const t = readFileSync('public/nhat-ky/index.html', 'utf8')
    expect(t).toContain("docJson('nhat-ky.json')"); expect(t).toContain("docJson('trang.json')"); expect(t).toContain("tep('tieng.mp3')")
    expect(t).not.toMatch(/net-mau\.js|NET_MAU|kich-ban-lien-ket|bv-dai"|Bản vẽ\./)
    expect(t).toContain("parent.postMessage({ nguon: 'nhat-ky', loai: 'dong' }, '*')")
  })
  it('máy cũ: khuôn + trang không dùng regex nhìn-lùi / cú pháp mới; phông chữ nằm cạnh trang (không trỏ src/)', () => {
    for (const f of ['public/nhat-ky/khuon.js', 'public/nhat-ky/index.html']) {
      const s = readFileSync(f, 'utf8')
      expect(s).not.toMatch(/\(\?<[=!]/)
      expect(s).not.toMatch(/\?\.[a-zA-Z_([]|\?\?=|\.at\(|replaceAll\(|structuredClone|findLast/)
    }
    expect(readFileSync('public/nhat-ky/khuon.css', 'utf8')).not.toContain('src/styles')
  })
  it('máy em KHÔNG chạy lại cổng trên bài máy chủ đã cất (bản đã gỡ chữ chép bảng: chạy lại thì bỏ oan cảnh) — tin kết quả, dùng ngưỡng đã cất', () => {
    const t = readFileSync('public/nhat-ky/index.html', 'utf8')
    expect(t).toContain("const daQuaCong = !!(kbGoc.nguon && kbGoc.nguon.nguoiSoan === 'van-phong')")
    expect(t).toContain('kbGoc.nguong && kbGoc.nguong.vung ? kbGoc.nguong : N.nguongTuDong(kbGoc)')
    // chứng minh vì sao: chạy lại cổng trên bản đã cất làm mất cảnh
    const ra = quaCong(doc('kich-ban-lien-ket.json')).kb
    expect(kiemCong(JSON.parse(JSON.stringify(ra))).dat.length).toBeLessThan(ra.canh.length)
  })
  it('ngoài precache (giữ trần 170) và service worker không trả trang app thay cho /nhat-ky/', () => {
    expect(readFileSync('vite.config.ts', 'utf8')).toContain("'**/nhat-ky/**'")
    expect(readFileSync('src/sw.ts', 'utf8')).toContain('/^\\/nhat-ky\\//')
  })
  it('cổng tự kiểm của khuôn chạy trên máy em (public) cho CÙNG kết quả với cổng máy chủ (src/lib/nhat-ky/cong.ts)', () => {
    const g = globalThis as any
    const cu = { window: g.window, location: g.location, matchMedia: g.matchMedia, document: g.document }
    g.window = g; g.location = { search: '' }; g.matchMedia = () => ({ matches: false }); g.document = { documentElement: { classList: { contains: () => false } } }
    new Function(readFileSync('public/nhat-ky/khuon.js', 'utf8'))()
    const N = g.NKB; Object.assign(g, cu); delete g.NKB
    for (const t of ['kich-ban-lien-ket.json', 'kich-ban-fes2.json']) {
      const kb = doc(t); kb.canh[0].loi[0].chu = 'Một câu rất dài để thử luật đếm chữ, ' + 'chữ '.repeat(32) + 'hết. Câu ngắn.'
      expect(gon(N.kiemCong(JSON.parse(JSON.stringify(kb))))).toEqual(gon(kiemCong(JSON.parse(JSON.stringify(kb)))))
    }
  })
})

describe('tệp trang.json theo vé (máy em tải nét phấn)', () => {
  it('vé đúng ⇒ mọi trang theo dạng khuôn; vé sai ⇒ 403', async () => {
    await themBuoi('b1')
    const { kyVeLive, hanVeLive } = await import('../server/src/live-xem-lai-lenh')
    const ve = await kyVeLive('bi-mat-thu', 'b1', 'A1', hanVeLive(T0), 2)
    const r = await goi(`/live-tep/b1/trang.json?ve=${encodeURIComponent(ve)}`, undefined, false)
    expect(r.status).toBe(200)
    const j = await r.json() as any
    expect(j.trang.map((t: any) => [t.stt, t.loai, t.rong, t.net.length])).toEqual([[1, 'giay', 1600, 2], [2, 'bang', 1600, 1], [3, 'giay', 1600, 1]])
    expect((await goi('/live-tep/b1/trang.json?ve=sai', undefined, false)).status).toBe(403)
  })
})

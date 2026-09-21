// @vitest-environment node
// BTVN "NÂNG ĐỠ" bản 1.1 — LỊCH CHẶNG THEO GIỜ ở máy chủ: lịch tính MỘT lần lúc chốt bằng `xepLichChang` (Code 1) và LƯU ở `btvn_em.chang_mo_json`;
// hạn dài Y HỆT lịch cũ; hạn ngắn chia theo giờ trong cửa sổ 20:00–23:59; bài chốt trước bản 1.1 (không JSON) dùng lịch cũ; deadline thắng mọi giãn cách.
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { docLichDaLuu, moLucChang } from '../server/src/btvn-nang-do-chang'
import { sucChua } from '../src/lib/btvn-nang-do-lich'
import { goiWorker, type D1That } from './_d1-that'
import { BAY_GIO, DAP_AN_DUNG, boCuaEm, cauThay, dung, gio, maBtvn, mo, nopChang } from './_btvn-nang-do-mau'

afterEach(() => vi.useRealTimers())

const GIO = 3_600_000
const phutVn = (iso: string) => ((Date.parse(iso) + 7 * GIO) % (24 * GIO)) / 60_000 // phút trong ngày giờ VN
const luuLich = (d: D1That, sbd = 'S1') => JSON.parse((d.sql.prepare('SELECT chang_mo_json FROM btvn_em WHERE sbd = ?').get(sbd) as { chang_mo_json: string }).chang_mo_json) as { cheDo: 'dai' | 'ngan'; chang: { chiSo: number; moLuc: string; dungNhipTruoc: string }[] }
const giaoHan = (d: D1That, hanIso: string, them: Record<string, unknown> = {}) => goiWorker(worker, d.env, '/btvn/giao', { maCa: 'CA1', maDe: 'DE1', hanNop: hanIso, caNhan: true, cau: cauThay(), ghim: [], hatGiong: 'hg-1', ...them }, true)
const cong = (t: Date | string, gio2: number) => new Date(new Date(t).getTime() + gio2 * GIO).toISOString()

describe('lịch đã lưu (đọc/kiểm)', () => {
  it('docLichDaLuu: hợp lệ ⇒ mốc ISO + cheDo; vắng/hỏng/lệch số chặng/không ISO/lùi giờ ⇒ null (dùng lịch cũ)', () => {
    const ok = JSON.stringify({ cheDo: 'ngan', chang: [{ chiSo: 0, moLuc: '2026-09-22T03:00:00.000Z', dungNhipTruoc: '2026-09-22T16:59:00.000Z' }, { chiSo: 1, moLuc: '2026-09-22T13:00:00.000Z', dungNhipTruoc: '2026-09-22T16:59:00.000Z' }] })
    expect(docLichDaLuu(ok, 2)).toMatchObject({ cheDo: 'ngan', moLuc: ['2026-09-22T03:00:00.000Z', '2026-09-22T13:00:00.000Z'] })
    for (const v of [null, undefined, '', 'không phải json', '{}', '[]', ok.replace('ngan', 'dai').replace('"chang"', '"khac"')]) expect(docLichDaLuu(v, 2), String(v)).toBeNull()
    expect(docLichDaLuu(ok, 3)).toBeNull() // lệch số chặng
    expect(docLichDaLuu(ok, 0)).toBeNull()
    expect(docLichDaLuu(ok.replace('2026-09-22T13:00:00.000Z', 'rác'), 2)).toBeNull()
    expect(docLichDaLuu(ok.replace('2026-09-22T13:00:00.000Z', '2026-09-22T02:00:00.000Z'), 2)).toBeNull() // lùi giờ
  })
})

describe('HẠN DÀI (> 48 giờ, tải vừa sức): Y HỆT lịch cũ một chặng/ngày', () => {
  it('chang_mo_json cheDo dai; moLuc = moLucChang cũ; theoGio false; chang[].dungNhipTruoc = 23:59 giờ VN của ngày mở chặng', async () => {
    gio(BAY_GIO)
    const d = dung()
    const han = cong(BAY_GIO, 24 * 7)
    await giaoHan(d, han)
    const m = await mo(d)
    const l = luuLich(d)
    expect(l.cheDo).toBe('dai')
    expect(l.chang.map((c) => c.moLuc)).toEqual(moLucChang(BAY_GIO.toISOString(), m.soChang))
    expect(m.theoGio).toBe(false)
    expect(m.chang.map((c: { moLuc: string }) => c.moLuc)).toEqual(l.chang.map((c) => c.moLuc))
    // "Đúng nhịp" = 23:59 giờ VN của ngày mở chặng; chặng cuối không quá HẠN nộp.
    for (const c of m.chang) expect(phutVn(c.dungNhipTruoc) === 23 * 60 + 59 || Date.parse(c.dungNhipTruoc) === Date.parse(han), c.dungNhipTruoc).toBe(true)
    expect(new Set(m.chang.map((c: { dungNhipTruoc: string }) => c.dungNhipTruoc.slice(0, 10))).size).toBe(m.soChang) // mỗi chặng một ngày
  })
})

describe('HẠN NGẮN (≤ 48 giờ): chia theo giờ trong cửa sổ học', () => {
  it('chặng 0 mở NGAY lúc chốt; các chặng sau trong 20:00–23:59 giờ VN, cách ≥ 40 phút, không 00:00–05:59, đều TRƯỚC hạn; lưu + trả cùng mốc; theoGio true', async () => {
    gio(BAY_GIO) // 10:00 VN 22/09
    const d = dung()
    const han = cong(BAY_GIO, 40) // 02:00 VN 24/09 — ngắn
    await giaoHan(d, han)
    const m = await mo(d)
    const l = luuLich(d)
    expect(l.cheDo).toBe('ngan')
    expect(m.theoGio).toBe(true)
    expect(m.soChang).toBeGreaterThanOrEqual(2)
    const mocs = l.chang.map((c) => c.moLuc)
    expect(mocs[0]).toBe(BAY_GIO.toISOString())
    expect(m.chang.map((c: { moLuc: string }) => c.moLuc)).toEqual(mocs)
    for (let k = 1; k < mocs.length; k++) {
      expect(Date.parse(mocs[k]!) - Date.parse(mocs[k - 1]!), `giãn cách ${k}`).toBeGreaterThanOrEqual(40 * 60_000)
      const p = phutVn(mocs[k]!)
      expect(p >= 20 * 60 && p <= 23 * 60 + 59, `chặng ${k} mở ${mocs[k]} (giờ VN ${(p / 60).toFixed(2)}) ngoài cửa sổ`).toBe(true)
    }
    for (const t of mocs) expect(Date.parse(t)).toBeLessThan(Date.parse(han))
    // Ngân sách đưa cho lõi ở hạn ngắn = SỨC CHỨA theo phiên (soNgay = số phiên, câu/ngày = câu/phiên, ôn lại 0), không phải ngân sách/ngày.
    const sc = sucChua({ chotLuc: BAY_GIO.toISOString(), hanNop: han, cauMoiNgay: 12, onLaiMoiNgay: 0, giayMoiCau: 90 })
    expect(sc.cheDo).toBe('ngan')
    expect(JSON.parse((d.sql.prepare("SELECT ngan_sach_json FROM btvn_em WHERE sbd='S1'").get() as { ngan_sach_json: string }).ngan_sach_json)).toEqual({ soNgay: sc.soPhien, cauMoiNgay: sc.cauMoiPhien, onLaiMoiNgay: 0 })
    for (const t of mocs.slice(1)) expect(phutVn(t) >= 6 * 60).toBe(true) // không 00:00–05:59
    expect(m.chang.every((c: { dungNhipTruoc: string }) => Date.parse(c.dungNhipTruoc) <= Date.parse(han))).toBe(true)
  })
  it('bộ NHỎ HƠN bộ hạn dài của cùng em (tờ 60 câu), nhưng LUÔN ≥ lõi (lõi thắng sức chứa)', async () => {
    gio(BAY_GIO)
    const ngan = dung()
    const dai = dung()
    for (const d of [ngan, dai]) {
      d.objects.set('kho/DE3.json', { ma_de: 'DE3', cau: Array.from({ length: 60 }, (_, i) => ({ phan: 'I', so: i + 1, de: 'x', dap_an: 'A', chuyen_de: 'Este', muc_do: 'biet', dang: { ma: `DB-${Math.floor(i / 10)}`, ten: 'x' } })) })
      d.sql.exec("INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DE3','Tờ 3',60,0,'x')")
    }
    await giaoHan(ngan, cong(BAY_GIO, 30), { maDe: 'DE3', cau: [] })
    await giaoHan(dai, cong(BAY_GIO, 24 * 12), { maDe: 'DE3', cau: [] })
    await mo(ngan)
    await mo(dai)
    const soLoi = (ngan.sql.prepare('SELECT COUNT(*) AS n FROM btvn_cau WHERE loi = 1').get() as { n: number }).n
    expect(boCuaEm(ngan).length).toBeGreaterThanOrEqual(soLoi)
    expect(boCuaEm(ngan).length).toBeLessThan(boCuaEm(dai).length)
  })
  it('EM VÀO MUỘN: chặng k mở khi chặng k−1 xong VÀ tới giờ; xong chặng 0 lúc 22:30 thì chặng 1 (mốc 21:20) mở NGAY, không bắt chờ; xong sớm thì chờ tới mốc', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giaoHan(d, cong(BAY_GIO, 40))
    await mo(d)
    const l = luuLich(d)
    const moc1 = Date.parse(l.chang[1]!.moLuc)
    const c0 = boCuaEm(d).filter((x) => x.chang === 0).map((x) => x.qid)
    // Xong chặng 0 NGAY (10:05) ⇒ chặng 1 chưa tới giờ ⇒ khoá.
    gio(new Date(BAY_GIO.getTime() + 5 * 60_000))
    await nopChang(d, 0, Object.fromEntries(c0.map((q) => [q, DAP_AN_DUNG(q)])))
    expect((await mo(d)).changDangMo).toBeNull()
    expect(await nopChang(d, 1, { x: 'A' })).toMatchObject({ ok: false, lyDo: 'chang_chua_mo' })
    // Tới mốc chặng 1 ⇒ mở; em vào muộn hơn (mốc + 90 phút) vẫn mở, không phải chờ thêm.
    for (const t of [moc1, moc1 + 90 * 60_000]) {
      gio(new Date(t))
      const m = await mo(d)
      expect(m.changDangMo, new Date(t).toISOString()).toBe(1)
      expect(m.de.cau.length).toBe(c0.length + boCuaEm(d).filter((x) => x.chang === 1).length)
    }
    // Và NỘP chặng 1 vào đúng mốc giờ tối được (lịch cũ 00:00 ngày mai sẽ từ chối).
    gio(new Date(moc1))
    const c1 = boCuaEm(d).filter((x) => x.chang === 1).map((x) => x.qid)
    expect(await nopChang(d, 1, Object.fromEntries(c1.map((q) => [q, DAP_AN_DUNG(q)])))).toMatchObject({ ok: true, chang: { chiSo: 1, xong: true } })
  })
})

describe('DEADLINE THẮNG: mọi mốc mở < hạn, không giảm, ở mọi hạn/giờ chốt', () => {
  const gioChot = ['2026-09-22T03:00:00.000Z' /* 10:00 */, '2026-09-22T14:30:00.000Z' /* 21:30 */, '2026-09-22T16:50:00.000Z' /* 23:50 */, '2026-09-22T19:00:00.000Z' /* 02:00 */]
  const gioHan = [6, 12, 30, 47, 49, 72, 240]
  it('lưới 4 giờ chốt × 7 hạn: lịch lưu hợp lệ; hạn ≤ 48 giờ ⇒ ngan; > 48 giờ ⇒ dai hoặc ngan (tải); chặng 0 = lúc chốt', async () => {
    let soTruongHop = 0
    for (const chot of gioChot) {
      for (const h of gioHan) {
        gio(chot)
        const d = dung()
        const han = cong(chot, h)
        const r = await giaoHan(d, han)
        expect(r.ok, `${chot} +${h}h`).toBe(true)
        const m = await mo(d)
        expect(m.ok, `${chot} +${h}h`).toBe(true)
        const l = luuLich(d)
        const mocs = l.chang.map((c) => Date.parse(c.moLuc))
        expect(mocs[0]).toBe(Date.parse(chot))
        for (let k = 0; k < mocs.length; k++) {
          expect(mocs[k], `${chot} +${h}h chặng ${k}`).toBeLessThan(Date.parse(han))
          if (k > 0) expect(mocs[k]).toBeGreaterThanOrEqual(mocs[k - 1]!)
        }
        if (h <= 48) expect(l.cheDo, `${chot} +${h}h`).toBe('ngan')
        expect(m.chang.length).toBe(m.soChang)
        soTruongHop++
      }
    }
    expect(soTruongHop).toBe(28)
  })
})

describe('BÀI CHỐT TRƯỚC BẢN 1.1 (chang_mo_json NULL/hỏng) ⇒ lịch cũ, không lỗi', () => {
  it('NULL ⇒ moLucChang theo chot_luc, theoGio false, không có dungNhipTruoc; JSON lệch số chặng ⇒ cũng lịch cũ', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giaoHan(d, cong(BAY_GIO, 30)) // hạn ngắn, nhưng bài "chốt trước 1.1"
    await mo(d)
    const soChang = (d.sql.prepare("SELECT so_chang FROM btvn_em WHERE sbd='S1'").get() as { so_chang: number }).so_chang
    for (const v of [null, JSON.stringify({ cheDo: 'ngan', chang: [{ chiSo: 0, moLuc: BAY_GIO.toISOString(), dungNhipTruoc: BAY_GIO.toISOString() }] })]) {
      d.sql.prepare("UPDATE btvn_em SET chang_mo_json = ? WHERE sbd = 'S1'").run(v)
      const m = await mo(d)
      expect(m.ok).toBe(true)
      expect(m.theoGio).toBe(false)
      expect(m.chang.map((c: { moLuc: string }) => c.moLuc)).toEqual(moLucChang(BAY_GIO.toISOString(), soChang))
      expect(m.chang.every((c: Record<string, unknown>) => !('dungNhipTruoc' in c))).toBe(true)
    }
  })
})

describe('/btvn/xem-truoc: lịch + cảnh báo hạn ngắn', () => {
  const xem = (d: D1That, b: Record<string, unknown>) => goiWorker(worker, d.env, '/btvn/xem-truoc', b, true)
  it('chiTiet.lich [{chiSo, moLuc, soCau}] + theoGio (a: tính thử; b: đã chốt = đúng lịch đã lưu)', async () => {
    gio(BAY_GIO)
    const d = dung()
    const han = cong(BAY_GIO, 40)
    const a = await xem(d, { maDe: 'DE1', cau: cauThay(), ghim: [], hanNop: han, hatGiong: 'hg-1', dsSbd: ['S1'], sbdChiTiet: 'S1' })
    expect(a.chiTiet.theoGio).toBe(true)
    expect(a.chiTiet.lich.map((c: { chiSo: number; soCau: number }) => [c.chiSo, c.soCau])).toEqual(a.chiTiet.chang.map((qs: string[], k: number) => [k, qs.length]))
    expect(a.chiTiet.lich[0].moLuc).toBe(BAY_GIO.toISOString())
    await giaoHan(d, han)
    await mo(d)
    const b = await xem(d, { maBtvn: maBtvn(d), dsSbd: ['S1'], sbdChiTiet: 'S1' })
    expect(b.chiTiet.lich.map((c: { moLuc: string }) => c.moLuc)).toEqual(luuLich(d).chang.map((c) => c.moLuc))
    expect(a.chiTiet.lich.map((c: { moLuc: string }) => c.moLuc)).toEqual(b.chiTiet.lich.map((c: { moLuc: string }) => c.moLuc)) // xem trước == thật khi mở cùng giờ
    // Hạn dài: theoGio false.
    const dai = await xem(d, { maDe: 'DE1', cau: cauThay(), ghim: [], hanNop: cong(BAY_GIO, 24 * 7), hatGiong: 'hg-1', dsSbd: ['S1'], sbdChiTiet: 'S1' })
    expect(dai.chiTiet.theoGio).toBe(false)
    expect(dai).not.toHaveProperty('canhBaoHanNgan')
  })
  it('lõi VƯỢT sức chứa lành mạnh ở hạn ngắn ⇒ canhBaoHanNgan {soCauLoiToiThieu, soPhien, chu}; vẫn giao đủ lõi', async () => {
    gio(BAY_GIO)
    const d = dung()
    // Tờ 60 câu, 30 dạng (mỗi dạng 2 câu): lõi ≥ 30 câu — nhiều hơn sức chứa của hạn 30 giờ.
    d.objects.set('kho/DE4.json', { ma_de: 'DE4', cau: Array.from({ length: 60 }, (_, i) => ({ phan: 'I', so: i + 1, de: 'x', dap_an: 'A', chuyen_de: 'Este', muc_do: 'biet', dang: { ma: `DX-${Math.floor(i / 2)}`, ten: 'x' } })) })
    d.sql.exec("INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DE4','Tờ 4',60,0,'x')")
    const r = await xem(d, { maDe: 'DE4', cau: [], ghim: [], hanNop: cong(BAY_GIO, 30), hatGiong: 'h', dsSbd: ['S1'], sbdChiTiet: 'S1' })
    expect(r.soLoi).toBeGreaterThanOrEqual(30)
    expect(r.canhBaoHanNgan).toMatchObject({ soCauLoiToiThieu: r.soLoi, soPhien: expect.any(Number) })
    expect(r.canhBaoHanNgan.chu).toContain('Hạn ngắn')
    expect(r.canhBaoHanNgan.chu).toContain(String(r.soLoi))
    expect(r.ds[0].tomTat.tong).toBeGreaterThanOrEqual(r.soLoi) // vẫn đủ lõi
    const dai = await xem(d, { maDe: 'DE4', cau: [], ghim: [], hanNop: cong(BAY_GIO, 24 * 10), hatGiong: 'h', dsSbd: ['S1'] })
    expect(dai).not.toHaveProperty('canhBaoHanNgan')
  })
})

describe('kế hoạch ngày dùng lịch ĐÃ LƯU', () => {
  it('hạn ngắn: sau chặng 0, sapToi trỏ đúng mốc chặng 1 đã lưu (giờ tối), không phải 00:00 ngày mai', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giaoHan(d, cong(BAY_GIO, 40))
    await mo(d)
    const l = luuLich(d)
    const c0 = boCuaEm(d).filter((x) => x.chang === 0).map((x) => x.qid)
    await nopChang(d, 0, Object.fromEntries(c0.map((q) => [q, DAP_AN_DUNG(q)])))
    const kh = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'S1' })
    expect(kh.sapToi).toContainEqual({ loai: 'btvn_lo', ma: maBtvn(d), chiSo: 1, moLuc: l.chang[1]!.moLuc })
    expect(phutVn(l.chang[1]!.moLuc)).toBeGreaterThanOrEqual(20 * 60)
  })
})

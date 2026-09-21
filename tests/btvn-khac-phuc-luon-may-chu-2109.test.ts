// @vitest-environment node
// BTVN "nâng đỡ" · KHẮC PHỤC LUÔN (Code 1, 41bced1): `dieuChinh.khacPhuc` từ `ai_dieu_chinh` (Bộ não THẬT) phải tới lõi ở CẢ HAI đường — chốt bộ (`chotBoChoEm`) và thích nghi sau chặng
// (`thichNghiSauChang`). Vắng / chạy thử ⇒ Y HỆT; hạn nộp, lõi, số chặng, chặng đã mở không đổi. Máy chủ không viết thêm luật: chỉ kiểm dữ liệu đi qua tầng đọc `bo-nao-doc.ts`.
// Tờ DE3 (240 câu, 2 dạng × 120, mức xoay) để bộ của em CHỈ lấy một phần mỗi dạng ⇒ còn câu CHƯA giao cho lõi chèn (tờ mẫu 24 / 60 câu: bộ đã lấy gần hết ⇒ lõi trả `duoc: 0`).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { docDieuChinhHieuLuc } from '../server/src/bo-nao-doc'
import { themNgay } from '../server/src/ho-so-nam-kt'
import type { D1That } from './_d1-that'
import { BAY_GIO, boCuaEm, dung, giao, gio, mo, nopChang } from './_btvn-nang-do-mau'

afterEach(() => vi.useRealTimers())

const HOM_NAY = '2026-09-22'
const YEU_CAU = { dang: 'DB-0', kieu: 'khac_phuc', soCau: 3, bac: 'dung_bac' }
const THAT = { bat: true, cheDo: 'that', lopThat: [] as string[] }
const HAN = new Date(BAY_GIO.getTime() + 3 * 24 * 3_600_000).toISOString() // bộ đủ nhỏ để còn câu DB-0 CHƯA giao cho lõi chèn

function toLon(d: D1That) {
  // DE3: 240 câu Phần I, 2 dạng × 120 (mức Biết/Hiểu/VD xoay): bộ của em (≤ ~50 câu) chỉ lấy MỘT PHẦN mỗi dạng ⇒ còn nhiều câu CHƯA giao để lõi chèn.
  const muc = ['biet', 'hieu', 'van_dung']
  d.objects.set('kho/DE3.json', { ma_de: 'DE3', cau: Array.from({ length: 240 }, (_, i) => ({ phan: 'I', so: i + 1, de: 'x', dap_an: 'A', chuyen_de: 'Este', muc_do: muc[i % 3], dang: { ma: `DB-${Math.floor(i / 120)}`, ten: 'x' } })) })
  d.sql.exec("INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DE3','Tờ 3',240,0,'x')")
  for (let k = 0; k < 2; k++) d.sql.prepare('INSERT OR REPLACE INTO nam_kt_dang(khoa,sbd,ma_dang,so_gap,so_sai,so_da_khac_phuc,so_moi_sai,so_chua_thay_sai,bac,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?,?)').run(`S1|DB-${k}`, 'S1', `DB-${k}`, 10, 1, 1, 0, 9, 1, 'x')
}
function datCheDo(d: D1That, cauHinh: Record<string, unknown> | null) {
  d.sql.exec("DELETE FROM cau_hinh WHERE khoa = 'bo_nao'")
  if (cauHinh) d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('bo_nao',?,'x')").run(JSON.stringify(cauHinh))
}
function ai(d: D1That, sbd: string, khacPhuc: unknown[], o: { cheDo?: 'bong' | 'that' } = {}) {
  // Đêm CHẠY THỬ ghi `ap_dung = 0` (điều chỉnh bóng không bao giờ được áp); đêm THẬT ghi `ap_dung = 1`.
  const j = { biDanh: '', doTinCay: 0.9, nhip: { lech: 0, khoiDong: 2 }, dang: [], khacPhuc, co: {}, loiNhanChoEm: '', loiNhanChoPhuHuynh: '', thuTuan: '', goiYChoThay: { chu: '', hanhDong: 'khong', dang: '' } }
  d.sql.prepare('INSERT OR REPLACE INTO ai_dieu_chinh(sbd,ngay,json,do_tin,che_do,ap_dung,het_han,huy,tu_go,ly_do_bo,nop_luc) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
    .run(sbd, HOM_NAY, JSON.stringify(j), 0.9, o.cheDo ?? 'that', (o.cheDo ?? 'that') === 'that' ? 1 : 0, themNgay(HOM_NAY, 3), 0, 0, '[]', 'x')
  d.sql.prepare('INSERT OR REPLACE INTO ai_ho_so_ngay(sbd,ngay,lop,luong,ly_do_luong,the_json,tao_luc) VALUES(?,?,?,?,?,?,?)').run(sbd, HOM_NAY, '12A1', 'sau', '[]', '{}', 'x')
}
const dangCua = (d: D1That) => new Map((d.sql.prepare('SELECT qid, dang FROM btvn_cau').all() as { qid: string; dang: string }[]).map((x) => [x.qid, x.dang]))
const soCauDang = (d: D1That, chang: number, ma: string) => { const dang = dangCua(d); return boCuaEm(d).filter((x) => x.chang === chang && dang.get(x.qid) === ma).length }
const hanNop = (d: D1That) => (d.sql.prepare('SELECT han_nop FROM btvn').get() as { han_nop: string }).han_nop
const loiCua = (d: D1That) => (d.sql.prepare('SELECT qid FROM btvn_cau WHERE loi = 1 ORDER BY thu_tu').all() as { qid: string }[]).map((x) => x.qid)
const emRow = (d: D1That) => d.sql.prepare("SELECT so_chang, so_cau_em FROM btvn_em WHERE sbd = 'S1'").get() as { so_chang: number; so_cau_em: number }
const chang = (d: D1That, k: number) => boCuaEm(d).filter((x) => x.chang === k)
async function bai(khacPhuc: unknown[] | null, cheDo: Record<string, unknown> | null = THAT, cheDoAi: 'bong' | 'that' = 'that') {
  gio(BAY_GIO)
  const d = dung(1)
  toLon(d)
  datCheDo(d, cheDo)
  if (khacPhuc) ai(d, 'S1', khacPhuc, { cheDo: cheDoAi })
  expect((await giao(d, { maDe: 'DE3', cau: [], hanNop: HAN })).ok).toBe(true)
  await mo(d, 'S1')
  return d
}

describe('tầng đọc: ai_dieu_chinh.khacPhuc → dieuChinh.khacPhuc của lõi', () => {
  it('Bộ não THẬT ⇒ dieuChinh.khacPhuc = [{dang, soCau, bac}]; chạy thử / tắt ⇒ KHÔNG có điều chỉnh nào', async () => {
    const d = dung(1)
    datCheDo(d, THAT); ai(d, 'S1', [YEU_CAU])
    expect((await docDieuChinhHieuLuc(d.env, ['S1'], HOM_NAY)).get('S1')?.dieuChinh).toMatchObject({ khacPhuc: [{ dang: 'DB-0', soCau: 3, bac: 'dung_bac' }] })
    datCheDo(d, { bat: true, cheDo: 'bong', lopThat: [] })
    expect((await docDieuChinhHieuLuc(d.env, ['S1'], HOM_NAY)).size).toBe(0)
  })
})

describe('CHỐT BỘ: dieuChinh.khacPhuc từ ai_dieu_chinh tới lõi', () => {
  it('Bộ não THẬT + khac_phuc DB-0 × 3: lúc chốt chưa chặng nào mở ⇒ chặng 0 nhận ĐÚNG 3 câu DB-0 (nhãn dang_yeu) thay cho 3 câu củng cố; các chặng khác, tổng câu, lõi, số chặng, hạn nộp NGUYÊN', async () => {
    const goc = await bai(null)
    const d = await bai([YEU_CAU])
    expect(soCauDang(d, 0, 'DB-0') - soCauDang(goc, 0, 'DB-0')).toBe(3)
    const moi = chang(d, 0).filter((x) => !chang(goc, 0).some((y) => y.qid === x.qid))
    expect(moi).toHaveLength(3)
    expect(moi.every((x) => x.nhan === 'dang_yeu')).toBe(true)
    expect(chang(goc, 0).filter((x) => !chang(d, 0).some((y) => y.qid === x.qid)).every((x) => x.nhan === 'cung_co')).toBe(true) // chỉ bớt câu CỦNG CỐ
    expect(JSON.stringify(boCuaEm(d).filter((x) => x.chang >= 1))).toBe(JSON.stringify(boCuaEm(goc).filter((x) => x.chang >= 1)))
    expect(boCuaEm(d).length).toBe(boCuaEm(goc).length) // bù: tổng không đổi
    expect(hanNop(d)).toBe(hanNop(goc)) // KHÔNG BAO GIỜ đổi han_nop
    expect(loiCua(d)).toEqual(loiCua(goc))
    expect(emRow(d).so_chang).toBe(emRow(goc).so_chang)
    expect(emRow(d).so_cau_em).toBe(boCuaEm(d).length)
    const cuaEm = new Set(boCuaEm(d).map((x) => x.qid))
    for (const q of loiCua(d)) expect(cuaEm.has(q), q).toBe(true) // lõi vẫn đủ
    expect(chang(d, 0).filter((x) => x.nhan === 'khoi_dong')).toEqual(chang(goc, 0).filter((x) => x.nhan === 'khoi_dong')) // khởi động nguyên
  })
  it('CHẠY THỬ (bong) / cờ tắt / điều chỉnh của đêm chạy thử ⇒ bộ Y HỆT không có điều chỉnh (từng dòng)', async () => {
    const goc = await bai(null)
    for (const [cheDo, cheDoAi] of [[{ bat: true, cheDo: 'bong', lopThat: [] }, 'that'], [{ bat: false, cheDo: 'that', lopThat: [] }, 'that'], [THAT, 'bong']] as const) {
      const d = await bai([YEU_CAU], cheDo, cheDoAi)
      expect(JSON.stringify(boCuaEm(d)), JSON.stringify([cheDo, cheDoAi])).toBe(JSON.stringify(boCuaEm(goc)))
    }
  })
  it('yêu cầu LẠ hoặc quá cỡ: dạng không có trong bài ⇒ không chèn; soCau 99 bị lõi KẸP về tối đa 4; chốt bộ vẫn chạy, tổng câu/lõi/hạn nguyên', async () => {
    const goc = await bai(null)
    const lạ = await bai([{ dang: 'KHONG-CO', kieu: 'khac_phuc', soCau: 3, bac: 'dung_bac' }])
    expect(JSON.stringify(boCuaEm(lạ))).toBe(JSON.stringify(boCuaEm(goc))) // dạng lạ: Y HỆT
    const lon = await bai([{ dang: 'DB-0', kieu: 'khac_phuc', soCau: 99, bac: 'dung_bac' }])
    const them = soCauDang(lon, 0, 'DB-0') - soCauDang(goc, 0, 'DB-0')
    expect(them).toBeGreaterThan(0)
    expect(them).toBeLessThanOrEqual(4) // kẹp 2–4
    expect(boCuaEm(lon).length).toBe(boCuaEm(goc).length)
    expect(hanNop(lon)).toBe(hanNop(goc))
    expect(loiCua(lon)).toEqual(loiCua(goc))
  })
})

describe('THÍCH NGHI SAU CHẶNG: điều chỉnh tới SAU khi em đã chốt bộ vẫn được áp vào chặng CHƯA MỞ', () => {
  it('điều chỉnh mới tới sau khi mở bài: sau chặng 0 chặng 1 nhận thêm câu DB-0; chặng 0 (đã mở), lõi, hạn nộp, số chặng NGUYÊN; so_cau_em khớp bộ mới', async () => {
    const d = await bai(null) // lúc chốt CHƯA có điều chỉnh
    const chang0 = JSON.stringify(chang(d, 0))
    const truoc = JSON.stringify(chang(d, 1))
    const dang1Truoc = soCauDang(d, 1, 'DB-0')
    const han = hanNop(d)
    const lopSo = emRow(d).so_chang
    const loi = loiCua(d)
    ai(d, 'S1', [YEU_CAU]) // Bộ não tối nay gửi điều chỉnh
    const r = await nopChang(d, 0, Object.fromEntries(chang(d, 0).map((x) => [x.qid, 'A'])))
    expect(r.ok).toBe(true)
    expect(JSON.stringify(chang(d, 0))).toBe(chang0)
    expect(JSON.stringify(chang(d, 1))).not.toBe(truoc) // chặng chưa mở đầu tiên ĐÃ ĐỔI
    expect(soCauDang(d, 1, 'DB-0')).toBeGreaterThan(dang1Truoc)
    expect(hanNop(d)).toBe(han)
    expect(emRow(d).so_chang).toBe(lopSo)
    expect(emRow(d).so_cau_em).toBe(boCuaEm(d).length)
    expect(loiCua(d)).toEqual(loi)
    const cuaEm = new Set(boCuaEm(d).map((x) => x.qid))
    for (const q of loi) expect(cuaEm.has(q), q).toBe(true)
  })
  it('điều chỉnh của đêm CHẠY THỬ tới sau khi mở bài: thích nghi y hệt cũ (không chèn theo yêu cầu)', async () => {
    const a = await bai(null)
    const b = await bai(null)
    ai(b, 'S1', [YEU_CAU], { cheDo: 'bong' })
    await nopChang(a, 0, Object.fromEntries(chang(a, 0).map((x) => [x.qid, 'A'])))
    await nopChang(b, 0, Object.fromEntries(chang(b, 0).map((x) => [x.qid, 'A'])))
    expect(JSON.stringify(boCuaEm(b))).toBe(JSON.stringify(boCuaEm(a)))
  })
})

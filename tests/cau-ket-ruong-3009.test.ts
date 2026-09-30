// @vitest-environment node
// LỖI THẦY BÁO 30/09 (em 11084, chiến dịch cd32010c1c2): kế hoạch hôm nay 49 câu, em làm 48; Đảo báo "Chưa tải được câu hôm nay (kho câu đang
// cập nhật)" (`chua_nap_duoc`), Rương kẹt 48/49, Sảnh Bi-a "còn 1/19".
// NGUYÊN NHÂN GỐC (đã tái hiện đỏ trên D1 thật trước khi sửa): câu cuối của kế hoạch đã chốt bị chỉ mục (lập lại sau PR #107 — tờ nạp lại có
// `kieu: tu_luan`) xem là TỰ LUẬN ⇒ `napCau` lặng lẽ bỏ, nhưng kế hoạch (`srs2_ke_hoach.tong`, `tamHoanCauKhoa`) vẫn đếm ⇒ Đảo rỗng, rương kẹt.
// SAU SỬA (một chỗ dùng chung `MetaCau.tuLuan` + `lyDoKhongPhucVu`): câu không phục vụ được (tự luận / rút khỏi kho / JSON không nạp được) bị bỏ khỏi
// kế hoạch và tong; nếu luật ngày còn cho phép thì THAY bằng câu hợp lệ khác (cơ chế lập lại kế hoạch sẵn có); Đảo/Đoàn nói đúng lý do; lỗi tải thật ghi nhật ký máy.
// Mỗi giả thuyết của bản chẩn đoán một test: (1) tự luận ← gốc · (2) Bi-a giữ · (3) rút kho · (3b) JSON lệch · (4) ca bảo vệ · (5) D1 lỗi khi nạp lô.
import { beforeEach, describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { gvChienDich } from '../server/src/srs2-gv'
import { layKeHoachHomNay, qidGoc, sanh2 } from '../server/src/srs2-d1'
import { hoa2Action, startDao2, startDoan2 } from '../server/src/srs2-game'
import { biaAction } from '../server/src/bi-a'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { ghiSuKien, type SuKien } from '../server/src/su-kien-hoc'
import type { Env } from '../server/src/kieu'

const NGAY = 86_400_000
const LOI_CHUA_NAP = 'Chưa tải được câu hôm nay'

function cauJson(qid: string, phan: 'I' | 'II' | 'III', mucDo: string, dang: string, correct: string) {
  return JSON.stringify({
    qid, maDe: 'DE1', version: 'v1', group: `g-${qid}`, phan, text: `Câu ${qid}`, choices: phan === 'I' ? ['a', 'b', 'c', 'd'] : [], ideas: phan === 'II' ? ['a', 'b', 'c', 'd'] : [],
    hinhAnh: [], dang, tenDang: `Dạng ${dang}`, mucDo, sao: 1, kienThuc: ['k'], correct, reviewed: true, solution: { chot: `Cốt lõi ${qid}` },
  })
}
const dapAn = (i: number) => (i % 4 === 0 ? 'DSDS' : i % 5 === 0 ? '4' : 'B')

function fixture(soCau = 30) {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn An','12A1','mk1','x')")
  d.sql.exec(`INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DE1','Ester',${soCau},0,'v1')`)
  d.sql.exec("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')")
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (let i = 1; i <= soCau; i++) {
    const phan = i % 4 === 0 ? 'II' : i % 5 === 0 ? 'III' : 'I'
    st.run('DE1', `Q${i}`, 'v1', `g-Q${i}`, `D${i % 3}`, cauJson(`Q${i}`, phan, ['NB', 'TH', 'VD'][i % 3]!, `D${i % 3}`, dapAn(i)))
  }
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true,"lop":["12A1"]}','x')`)
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('bi_a','{"bat":true,"lop":["12A1"]}','x')`)
  return { d, env }
}
type D = ReturnType<typeof fixture>['d']
/** Giao chiến dịch tạo 3 ngày trước, hạn `soNgayHan` ngày sau hôm nay (D = soNgayHan + 1). Rải đều mặc định BẬT (thầy 30/09), trừ khi `raiDeu: false`. */
async function giao(env: Env, o: { theLucNgay?: number; soNgayHan?: number; raiDeu?: boolean } = {}) {
  const nay = Date.now()
  const r = await gvChienDich(env, { action: 'tao', ten: 'Ester – Lipid', lop: '12A1', maDe: ['DE1'], hanNop: new Date(nay + (o.soNgayHan ?? 5) * NGAY).toISOString().slice(0, 10), ...(o.theLucNgay ? { theLucNgay: o.theLucNgay } : {}), ...(o.raiDeu === false ? { raiDeu: false } : {}) }, nay - 3 * NGAY)
  expect(r.ok).toBe(true)
}
const suKien = (qid: string, msLuc: number, dung: boolean): SuKien => ({ nguon: 'game', maNguon: `phien-${qid}-${msLuc}`, sbd: 'S1', qid, lan: 1, ketQua: dung ? 1 : 0, luc: new Date(msLuc).toISOString() })
async function lamXong(env: Env, qids: string[], nay: number) { if (qids.length) await ghiSuKien(env, qids.map((q) => suKien(q, nay, true))) }
/** Chốt kế hoạch hôm nay rồi làm xong mọi câu trừ `soGiu` câu cuối (như em 11084: 48/49). Trả các câu còn lại + tổng kế hoạch đã chốt. */
async function conLai(env: Env, soGiu: number, nay: number): Promise<{ giu: string[]; tong: number }> {
  const { kh } = await layKeHoachHomNay(env, 'S1', nay)
  expect(kh.conDoan).toEqual([])
  const ds = kh.conDao.map(qidGoc)
  const giu = ds.slice(-soGiu)
  await lamXong(env, ds.filter((q) => !giu.includes(q)), nay)
  return { giu, tong: kh.tong }
}
/** Sau khi lập lại chỉ mục với #107: câu mang nhãn kho `kieu: 'tu_luan'` được gắn cờ `tuLuan` — version KHÔNG đổi (versionCau bỏ cờ này). */
const gatCoTuLuan = (d: D, qid: string) => d.sql.prepare("UPDATE game_v2_question SET json = json_set(json, '$.tuLuan', json('true')) WHERE qid = ?").run(qid)
/** Luật mới #107: Phần III đáp án không đọc được thành MỘT số (công thức) ⇒ tự luận. Đổi cả cột version lẫn JSON như lập lại chỉ mục thật (chỉ mục CŨ: không có cờ `tuLuan`). */
const thanhPhanIIICongThuc = (d: D, qid: string) =>
  d.sql.prepare("UPDATE game_v2_question SET version = 'v2', json = json_set(json, '$.version', 'v2', '$.phan', 'III', '$.choices', json('[]'), '$.ideas', json('[]'), '$.correct', 'Fe3O4') WHERE qid = ?").run(qid)
const qidsCua = (r: Record<string, unknown>) => ((r.questions as { qid: string }[]) ?? []).map((q) => q.qid)
const ruong = (s: Record<string, unknown>) => s.ruong as { daLam: number; tong: number; moDuoc: boolean }

/**
 * Kỳ vọng SAU KHI SỬA khi còn câu mới hợp lệ và luật ngày cho phép: câu hỏng bị THAY bằng MỘT câu hợp lệ khác (không phải câu hỏng), tổng kế hoạch giữ nguyên,
 * Đảo phát đúng câu thay (không "chưa tải được"); em làm nốt câu thay ⇒ rương mở đủ tong/tong; Sảnh Bi-a không còn "còn 1/19".
 */
async function kyVongDuocThay(env: Env, nay: number, tongCu: number, cauHong: string) {
  const dao = await startDao2(env, 'S1', nay)
  expect(dao.lyDo).toBeUndefined()
  expect(String(dao.message ?? '')).not.toContain(LOI_CHUA_NAP)
  const thay = qidsCua(dao)
  expect(thay).toHaveLength(1)
  expect(thay[0]).not.toBe(cauHong)
  const s = await sanh2(env, 'S1', nay)
  expect(s.theLuc).toMatchObject({ con: 1, tong: tongCu })
  expect(ruong(s)).toMatchObject({ daLam: tongCu - 1, tong: tongCu, moDuoc: false })
  await lamXong(env, thay, nay)
  const s2 = await sanh2(env, 'S1', nay)
  expect(ruong(s2)).toMatchObject({ daLam: tongCu, tong: tongCu, moDuoc: true })
  const mo = await hoa2Action(env, 'S1', 'hoa2-ruong-mo', {}, nay)
  expect(mo.ok).toBe(true)
  const bia = await biaAction(env, 'S1', 'bia-sanh', {}, nay)
  expect((bia.tran as { con: number }).con).toBe(0)
}
/** Kỳ vọng SAU KHI SỬA khi KHÔNG còn câu mới hợp lệ để thay: câu hỏng lặng lẽ bỏ, tổng = số phục vụ được, rương mở ngay (48/48), Đảo báo xong. */
async function kyVongBoLang(env: Env, nay: number, tongCu: number) {
  const dao = await startDao2(env, 'S1', nay)
  expect(dao.lyDo).toBe('xong_ke_hoach')
  expect(String(dao.message ?? '')).not.toContain(LOI_CHUA_NAP)
  expect(qidsCua(dao)).toEqual([])
  const s = await sanh2(env, 'S1', nay)
  expect(s.theLuc).toMatchObject({ con: 0, tong: tongCu - 1 })
  expect(ruong(s)).toMatchObject({ daLam: tongCu - 1, tong: tongCu - 1, moDuoc: true })
  const mo = await hoa2Action(env, 'S1', 'hoa2-ruong-mo', {}, nay)
  expect(mo.ok).toBe(true)
  const bia = await biaAction(env, 'S1', 'bia-sanh', {}, nay)
  expect((bia.tran as { con: number }).con).toBe(0)
}

beforeEach(() => xoaDemCaBaoVe())

describe('(1) NGUYÊN NHÂN GỐC: câu cuối kế hoạch bị luật tự luận #107 loại ở napCau, kế hoạch đã chốt vẫn đếm', () => {
  it('còn câu mới hợp lệ: câu 49 mang cờ tuLuan ⇒ thay bằng câu khác theo quota, không báo "chưa tải được", rương mở khi làm nốt câu thay', async () => {
    const { d, env } = fixture()
    await giao(env)
    const nay = Date.now()
    const { giu, tong } = await conLai(env, 1, nay)
    gatCoTuLuan(d, giu[0]!)
    await kyVongDuocThay(env, nay, tong, giu[0]!)
  })

  it('HẾT câu mới hợp lệ (ngày cuối đã đổ hết): câu 49 tự luận ⇒ lặng lẽ bỏ, rương 48/48 mở ngay, Đảo báo "xong"', async () => {
    const { d, env } = fixture()
    await giao(env, { soNgayHan: 2 }) // D = 3 ⇒ quota = toàn bộ 30 câu mới
    const nay = Date.now()
    const { giu, tong } = await conLai(env, 1, nay)
    expect(tong).toBe(30)
    gatCoTuLuan(d, giu[0]!)
    await kyVongBoLang(env, nay, tong)
  })

  it('câu 49 là Phần III đáp án công thức (luật mới, chỉ mục CŨ không mang cờ) — version đổi theo chỉ mục ⇒ cũng xem là tự luận, được thay', async () => {
    const { d, env } = fixture()
    await giao(env)
    const nay = Date.now()
    const { giu, tong } = await conLai(env, 1, nay)
    thanhPhanIIICongThuc(d, giu[0]!)
    await kyVongDuocThay(env, nay, tong, giu[0]!)
  })

  it('kế hoạch LẬP MỚI hôm nay không đếm câu tự luận vào tong (không vào dao/doan); chan-doan-em báo số câu tự luận bị bỏ', async () => {
    const { d, env } = fixture()
    await giao(env)
    gatCoTuLuan(d, 'Q7')
    thanhPhanIIICongThuc(d, 'Q8')
    const { kh } = await layKeHoachHomNay(env, 'S1', Date.now())
    const khoa = [...kh.dao, ...kh.doan].map(qidGoc)
    expect(khoa).not.toContain('Q7')
    expect(khoa).not.toContain('Q8')
    expect(kh.tong).toBe(khoa.length)
    const cd = await gvChienDich(env, { action: 'chan-doan-em', sbd: 'S1' })
    expect(cd).toMatchObject({ ok: true, soCauTuLuanBiBo: 2, soCauTrongHoSo: 28 })
  })

  it('(b) rải đều TẮT: kế hoạch đổ đủ thể lực 40; loại 1 câu tự luận ⇒ thay câu khác, vẫn 40 câu phục vụ được', async () => {
    // 60 câu, thể lực 40/ngày, D = 8 ⇒ quota = ceil(60/5) = 12 câu mới/ngày, "còn chỗ" đổ đủ 40 (luật cũ khi tắt rải đều).
    const { d, env } = fixture(60)
    await giao(env, { theLucNgay: 40, soNgayHan: 7, raiDeu: false })
    const nay = Date.now()
    const { kh: truoc } = await layKeHoachHomNay(env, 'S1', nay)
    expect(truoc.tong).toBe(40)
    const cuoi = qidGoc(truoc.conDao[truoc.conDao.length - 1]!)
    gatCoTuLuan(d, cuoi)
    const { kh: sau } = await layKeHoachHomNay(env, 'S1', nay)
    expect([...sau.dao, ...sau.doan].map(qidGoc)).not.toContain(cuoi)
    expect(sau.tong).toBe(40)
    expect(sau.conDao.length).toBe(40)
  })

  it('(b) rải đều BẬT (mặc định): kế hoạch = quota 12; em đã làm 11 câu mới, câu 12 tự luận ⇒ thay đúng 1 câu (không cộng dồn quota), tong vẫn 12', async () => {
    const { d, env } = fixture(60)
    await giao(env, { theLucNgay: 40, soNgayHan: 7 })
    const nay = Date.now()
    const { giu, tong } = await conLai(env, 1, nay)
    expect(tong).toBe(12)
    gatCoTuLuan(d, giu[0]!)
    const { kh: sau } = await layKeHoachHomNay(env, 'S1', nay)
    expect([...sau.dao, ...sau.doan].map(qidGoc)).not.toContain(giu[0])
    expect(sau.tong).toBe(12)
    expect(sau.conDao).toHaveLength(1)
    expect(sau.dao.filter((k) => !sau.conDao.includes(k))).toHaveLength(11) // 11 câu đã làm giữ nguyên
  })

  it('Đoàn — câu ôn duy nhất là tự luận ⇒ Đoàn không "chua_nap_duoc", Đảo KHÔNG bị khoá chờ Đoàn mãi', async () => {
    const { d, env } = fixture()
    await giao(env)
    const nay = Date.now()
    await ghiSuKien(env, ['Q1'].map((q) => suKien(q, nay - NGAY, false))) // sai hôm qua ⇒ câu ôn Đoàn
    const { kh } = await layKeHoachHomNay(env, 'S1', nay)
    expect(kh.conDoan.map(qidGoc)).toEqual(['Q1'])
    gatCoTuLuan(d, 'Q1')
    const doan = await startDoan2(env, 'S1', nay)
    expect(doan.lyDo).not.toBe('chua_nap_duoc')
    expect(String(doan.message ?? '')).not.toContain(LOI_CHUA_NAP)
    const dao = await startDao2(env, 'S1', nay)
    expect(dao.lyDo).not.toBe('khoa_cho_doan')
    expect(qidsCua(dao).length).toBeGreaterThan(0)
  })
})

describe('(2) LOẠI TRỪ: câu cuối đang ở bàn Bi-a ⇒ lý do phải là cau_dang_o_bia (đã đúng)', () => {
  it('bàn Bi-a đang chơi (< 15 phút) giữ câu cuối ⇒ Đảo báo "đang ở bàn Bi-a", không phải "chưa tải được"', async () => {
    const { env } = fixture()
    await giao(env)
    const nay = Date.now()
    const ban = await biaAction(env, 'S1', 'bia-xep-ban', { loai: 'ai', cheDo: 'don', soBi: 7 }, nay - 5 * 60_000)
    const tren = [...(ban.bi as { qid: string }[]), ban.chot as { qid: string }].map((q) => q.qid)
    const { kh } = await layKeHoachHomNay(env, 'S1', nay)
    const ds = kh.conDao.map(qidGoc)
    const giu = tren[0]!
    await lamXong(env, ds.filter((q) => q !== giu), nay)
    const dao = await startDao2(env, 'S1', nay)
    expect(dao.lyDo).toBe('cau_dang_o_bia')
    expect(String(dao.message)).not.toContain(LOI_CHUA_NAP)
  })
})

describe('(3) LOẠI TRỪ: câu rút khỏi kho / JSON không nạp được ⇒ cùng luật với tự luận', () => {
  it('xoá câu cuối khỏi game_v2_question ⇒ không báo "chưa tải được", được thay câu khác', async () => {
    const { d, env } = fixture()
    await giao(env)
    const nay = Date.now()
    const { giu, tong } = await conLai(env, 1, nay)
    d.sql.prepare('DELETE FROM game_v2_question WHERE qid=?').run(giu[0]!)
    await kyVongDuocThay(env, nay, tong, giu[0]!)
  })

  it('(3b) JSON câu cuối rỗng `{}` (nạp lô không khớp khoá maDe|qid|version) ⇒ như đã rút khỏi kho: thay câu, không kẹt', async () => {
    const { d, env } = fixture()
    await giao(env)
    const nay = Date.now()
    const { giu, tong } = await conLai(env, 1, nay)
    d.sql.prepare("UPDATE game_v2_question SET json = '{}' WHERE qid = ?").run(giu[0]!)
    await kyVongDuocThay(env, nay, tong, giu[0]!)
  })

  it('(3c) JSON câu HỎNG (không parse được) ⇒ không làm đổ Sảnh/kế hoạch của em; câu ấy bị bỏ như đã rút', async () => {
    const { d, env } = fixture()
    await giao(env)
    const nay = Date.now()
    const { giu, tong } = await conLai(env, 1, nay)
    d.sql.prepare("UPDATE game_v2_question SET json = '{hỏng' WHERE qid = ?").run(giu[0]!)
    await kyVongDuocThay(env, nay, tong, giu[0]!)
  })
})

describe('(4) LOẠI TRỪ: câu bị ca bảo vệ ⇒ tamHoan.ca đã bắt (đã đúng)', () => {
  it('câu cuối nằm trong ca đóng chưa công bố ⇒ Đảo báo ca, rương mở, tamHoan = 1', async () => {
    const { d, env } = fixture()
    await giao(env)
    const nay = Date.now()
    const { giu } = await conLai(env, 1, nay)
    const bank = { phanI: giu.map((id) => ({ id, text: `Câu ${id}`, choices: ['a', 'b', 'c', 'd'], correct: 'B' })), phanII: [], phanIII: [] }
    d.objects.set('de/CA-CU.json', bank)
    const luc = nay - 2 * 3_600_000
    d.sql.prepare(`INSERT INTO ca(ma_ca,ten_ca,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,cap_nhat_luc) VALUES('CA-CU','Ca cũ','dong',?,?,45,'thi','khong','de/CA-CU.json',?)`)
      .run(new Date(luc).toISOString(), new Date(luc + 20 * 60_000).toISOString(), new Date(luc).toISOString())
    xoaDemCaBaoVe()
    const dao = await startDao2(env, 'S1', nay)
    expect(dao.lyDo).not.toBe('chua_nap_duoc')
    expect(dao.tamHoan).toBe(1)
    const s = await sanh2(env, 'S1', nay)
    expect(ruong(s).moDuoc).toBe(true)
  })
})

describe('(5) D1 lỗi khi nạp lô câu ⇒ "chua_nap_duoc" là đúng, và phải có nhật ký máy (ghiLoiMay) để tra', () => {
  it('lỗi tải thật ⇒ lyDo chua_nap_duoc + một dòng nhat_ky_may', async () => {
    const { d, env } = fixture()
    await giao(env)
    const nay = Date.now()
    await conLai(env, 1, nay)
    const goc = env.DB.prepare.bind(env.DB)
    env.DB.prepare = ((q: string) => {
      if (q.includes('json_each(?) j JOIN game_v2_question')) return { bind: () => ({ all: async () => { throw new Error('D1_ERROR: giả lập') }, first: async () => { throw new Error('D1_ERROR') }, run: async () => { throw new Error('D1_ERROR') } }) } as never
      return goc(q)
    }) as typeof env.DB.prepare
    const dao = await startDao2(env, 'S1', nay)
    expect(dao.lyDo).toBe('chua_nap_duoc')
    env.DB.prepare = goc
    expect(d.dem('nhat_ky_may', "muc = 'loi' AND nguon = 'nap_cau_game'")).toBe(1)
  })
})

// @vitest-environment node
// LÀN PHỤ HUYNH 12/10 — MÁY CHỦ `/ph/con-tong-quan` (thầy 12/10: "cho phụ huynh biết … số câu làm đúng, làm sai, thời gian làm từng câu gợi ý nhắc").
// Hợp đồng `server/src/ph-con-tong-quan-kieu.ts`. CHỈ ĐỌC sổ `su_kien_hoc` — chạy trên D1 THẬT (SQLite, lược đồ repo) theo mẫu tests/lich-su-lam-cau-0910.test.ts.
// Khoá: chỉ con của chính phụ huynh · bỏ sự kiện còn giấu / đọc lời giải / ca chưa công bố · số đúng/sai/giây đúng · mức từng ngày · gợi ý nhắc đúng luật.
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { parentPass } from '../server/src/game-v2-auth'
import { phConTongQuan, sinhGoiYNhac, tangUocTinh, noiChoPh, tieuDeChoPh, LUAT_GOI_Y, type DauVaoGoiY } from '../server/src/ph-con-tong-quan'
import type { KetQuaConTongQuan, NgayHoc } from '../server/src/ph-con-tong-quan-kieu'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { NGAY_BAT_DAU_BAI_HANG_NGAY } from '../server/src/bai-hang-ngay-kieu'

type D = ReturnType<typeof taoD1That>
// 12:00 Thứ Tư 14/10/2026 giờ VN ⇒ khoảng đọc từ 01/10 (13 ngày trước), 7 ngày = 08/10–14/10, 7 ngày trước đó = 01/10–07/10.
const NOW = Date.parse('2026-10-14T05:00:00Z')
interface Sk {
  khoa: string; qid: string; nguon?: string; maNguon?: string; kq: number | null; luc: string; sbd?: string
  giay?: number | null; lan?: number; raw?: Record<string, unknown> | null; purpose?: string | null; visibility?: string | null; assistance?: string | null
}
/** `ngay_vn` tính đúng giờ VN từ `luc`. */
const sk = (d: D, x: Sk) =>
  d.sql.prepare(`INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, purpose, visibility, assistance, raw_json)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    x.khoa, x.sbd ?? 'S1', x.qid, x.nguon ?? 'game', x.maNguon ?? 'P0', x.lan ?? 1, x.kq, x.giay ?? null, x.luc,
    new Date(Date.parse(x.luc) + 7 * 3_600_000).toISOString().slice(0, 10), x.purpose ?? null, x.visibility ?? null, x.assistance ?? null, x.raw ? JSON.stringify(x.raw) : null,
  )
function dung(): { d: D; env: Env } {
  const d = taoD1That()
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn Minh Anh','12A1','mk','x'),('S2','Trần Bảo','12A1','mk2','x')")
  return { d, env: d.env as unknown as Env }
}
const themCa = (d: D, ma: string, congBo: string, trangThai = 'dong', ten = 'Kiểm tra Ester') =>
  d.sql.prepare('INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,cong_bo,cap_nhat_luc) VALUES(?,?,?,?,?,?)').run(ma, ten, trangThai, 'thi', congBo, 'x')
const chay = async (env: Env, b: Record<string, unknown>, now = NOW) => (await phConTongQuan(env, b, now)) as KetQuaConTongQuan
/** Giờ VN → ISO: "2026-10-14 09:30" ⇒ 02:30Z. */
const vn = (s: string) => new Date(Date.parse(`${s.replace(' ', 'T')}:00Z`) - 7 * 3_600_000).toISOString()

describe('/ph/con-tong-quan — xác thực: chỉ con của chính phụ huynh', () => {
  it('liên kết của con S1 + sbd S2 trong thân ⇒ chỉ số của S1; liên kết hỏng ⇒ lỗi, không rơi xuống SBD trần; SBD không có ⇒ lỗi', async () => {
    const { d, env } = dung()
    sk(d, { khoa: 'a', qid: 'DE1-I-1', kq: 1, luc: vn('2026-10-14 09:00') })
    sk(d, { khoa: 'b', qid: 'DE1-I-2', kq: 0, luc: vn('2026-10-14 09:01') })
    for (let i = 0; i < 6; i++) sk(d, { khoa: `s2-${i}`, sbd: 'S2', qid: `DE2-I-${i}`, kq: 0, luc: vn('2026-10-14 09:02') })
    const pass = await parentPass(d.env, 'S1')
    const r = await chay(env, { pass, sbd: 'S2' })
    expect(r.ok).toBe(true)
    expect(r.dem.homNay).toMatchObject({ soLuot: 2, dung: 1, sai: 1 })
    await expect(phConTongQuan(env, { pass: `${pass}x`, sbd: 'S1' }, NOW)).rejects.toThrow(/không hợp lệ/)
    await expect(phConTongQuan(env, { sbd: 'KHONG-CO' }, NOW)).rejects.toThrow(/Không tìm thấy/)
    // SBD trần (giai đoạn mềm, như mọi lệnh /ph/* của app phụ huynh mới) ⇒ đúng con đó
    expect((await chay(env, { sbd: 'S2' })).dem.homNay).toMatchObject({ soLuot: 6, sai: 6 })
  })

  it('qua định tuyến thật: POST /ph/con-tong-quan trả ok + đếm truy cập đúng đường', async () => {
    const { d, env } = dung()
    sk(d, { khoa: 'a', qid: 'DE1-I-1', kq: 1, luc: vn('2026-10-14 09:00') })
    const r = await goiWorker(worker, env, '/ph/con-tong-quan', { pass: await parentPass(d.env, 'S1') })
    expect(r.ok).toBe(true)
    expect(Array.isArray(r.ngay)).toBe(true)
    const dem = d.sql.prepare("SELECT duong, kieu FROM ph_truy_cap WHERE sbd = 'S1'").all() as { duong: string; kieu: string }[]
    expect(dem).toEqual([{ duong: 'ph-con-tong-quan', kieu: 'token' }])
  })
})

describe('lọc: bỏ sự kiện còn giấu, đọc lời giải, ca chưa công bố; không lộ mã câu / đáp án', () => {
  it('chỉ lượt hợp lệ được đếm; tên câu của ca chưa công bố không có trong phản hồi', async () => {
    const { d, env } = dung()
    themCa(d, 'CA-MO', 'khong', 'mo', 'Ca chưa công bố')
    themCa(d, 'CA-XONG', 'ngay', 'dong', 'Ca đã công bố')
    d.sql.prepare('INSERT INTO game_v2_question (ma_de, qid, version, content_group, dang, json) VALUES (?,?,?,?,?,?)').run('BIMAT', 'BIMAT-I-9', 'v', 'g', 'D.X', JSON.stringify({ phan: 'I', tenDang: 'Dạng bí mật của ca chưa công bố' }))
    d.sql.prepare('INSERT INTO game_v2_question (ma_de, qid, version, content_group, dang, json) VALUES (?,?,?,?,?,?)').run('DE9', 'DE9-I-25', 'v', 'g', 'D.EST', JSON.stringify({ phan: 'I', tenDang: 'Hiệu suất ester hoá' }))
    sk(d, { khoa: 'ok1', qid: 'DE9-I-25', nguon: 'thi', maNguon: 'CA-XONG', kq: 0, giay: 40, luc: vn('2026-10-14 08:00'), raw: { chon: 'B', dapAn: 'C' } })
    sk(d, { khoa: 'ok2', qid: 'DE9-I-26', kq: 1, giay: 12, luc: vn('2026-10-14 08:10') })
    sk(d, { khoa: 'x1', qid: 'BIMAT-I-9', nguon: 'thi', maNguon: 'CA-MO', kq: 1, giay: 30, luc: vn('2026-10-14 08:20') }) // ca chưa công bố
    sk(d, { khoa: 'x2', qid: 'DE9-I-27', kq: 1, giay: 30, luc: vn('2026-10-14 08:30'), visibility: 'embargoed' }) // còn giấu
    sk(d, { khoa: 'x3', qid: 'DE9-I-25', kq: 1, luc: vn('2026-10-14 08:40'), purpose: 'xem_loi_giai' }) // đọc lời giải
    sk(d, { khoa: 'x4', qid: 'DE9-I-28', kq: 1, luc: vn('2026-10-14 08:50'), purpose: 'chan_doan' }) // không phải lần làm
    const r = await chay(env, { sbd: 'S1' })
    expect(r.dem.homNay).toEqual({ soLuot: 2, dung: 1, sai: 1, boTrong: 0, soCau: 2, giayTb: 26 })
    expect(r.ganDay.map((x) => x.tieuDe)).toEqual(['Câu 26', 'Câu 25 · Hiệu suất ester hoá'])
    expect(r.ganDay[1]).toEqual({ luc: vn('2026-10-14 08:00'), tieuDe: 'Câu 25 · Hiệu suất ester hoá', noi: 'Ca kiểm tra', dung: false, giay: 40, nguonGiay: 'do', coGoiY: false })
    // câu sai chưa sửa: DE9-I-25 (lượt "đọc lời giải" đúng KHÔNG tính là đã sửa)
    expect(r.cauSai).toEqual({ tong: 1, daSua: 0, chuaSua: 1, ds: [{ tieuDe: 'Câu 25 · Hiệu suất ester hoá', soSai: 1, lanCuoi: vn('2026-10-14 08:00'), daSua: false }] })
    const s = JSON.stringify(r)
    for (const cam of ['BIMAT', 'Dạng bí mật', 'Ca chưa công bố', 'DE9-I-25', '"chon"', 'dapAn', '"qid"', 'CA-XONG']) expect(s, cam).not.toContain(cam)
  })
})

describe('số đúng / sai / giây', () => {
  // SỬA CÓ CHỦ ĐÍCH 12/10 — thầy: "dữ liệu phần này tính từ 1/10" ⇒ mốc theo dõi 01/10 (trùng mốc Bài hằng ngày của thầy): ô "Từ 01/10" nay gồm cả 09/10, 03/10.
  it('ba khoảng hôm nay · 7 ngày · từ 01/10; thứ tự số giây: cột ⇒ raw ms ⇒ chi tiết ca ⇒ ước tính game (≈) ⇒ chưa đo giờ', async () => {
    const { d, env } = dung()
    themCa(d, 'C1', 'ngay')
    d.sql.prepare('INSERT INTO chi_tiet_cau (khoa, ma_ca, sbd, lan_thu, phan, so_cau, qid, dap_an_chon, giay, cap_nhat_luc) VALUES (?,?,?,?,?,?,?,?,?,?)').run('C1|S1|1|I|2', 'C1', 'S1', 1, 'I', 2, 'GA-I-2', 'B', 70, 'x')
    const t0 = Date.parse(vn('2026-10-13 20:00'))
    d.sql.prepare('INSERT INTO game_v2_session (id, sbd, json, created_at) VALUES (?,?,?,?)').run('P1', 'S1', JSON.stringify({ created: t0 }), new Date(t0).toISOString())
    d.sql.prepare('INSERT INTO game_v2_attempt (id, sbd, session, qid, content_group, json, created_at) VALUES (?,?,?,?,?,?,?)').run('P1|GA-I-5', 'S1', 'P1', 'GA-I-5', 'g', JSON.stringify({ attempt: { at: t0 + 45_000, qid: 'GA-I-5' } }), new Date(t0 + 45_000).toISOString())
    // hôm nay 14/10
    sk(d, { khoa: 'h1', qid: 'GA-I-1', kq: 1, giay: 95, luc: vn('2026-10-14 07:00') })
    sk(d, { khoa: 'h2', qid: 'GA-I-3', kq: 0, luc: vn('2026-10-14 07:05'), raw: { ms: 4_400 } }) // raw ms ⇒ 4 giây (nhanh, sai)
    sk(d, { khoa: 'h3', qid: 'GA-I-4', nguon: 'len_bang', kq: 0, luc: vn('2026-10-14 07:10') }) // chưa đo giờ
    // 13/10
    sk(d, { khoa: 'm1', qid: 'GA-I-2', nguon: 'thi', maNguon: 'C1', kq: 0, luc: vn('2026-10-13 09:00') }) // chi tiết ca 70
    sk(d, { khoa: 'm2', qid: 'GA-I-5', nguon: 'game', maNguon: 'P1', kq: 1, luc: new Date(t0 + 45_000).toISOString() }) // ước tính 45
    sk(d, { khoa: 'm3', qid: 'GA-I-6', nguon: 'thi', maNguon: 'C1', kq: null, luc: vn('2026-10-13 09:05') }) // bỏ trống, không đo
    // 09/10 (trong 7 ngày) và 03/10 (ngoài 7 ngày) — cả hai SAU mốc 01/10
    sk(d, { khoa: 'c1', qid: 'GA-I-7', kq: 1, giay: 20, luc: vn('2026-10-09 10:00') })
    sk(d, { khoa: 'c2', qid: 'GA-I-8', kq: 0, giay: 7, luc: vn('2026-10-03 10:00') })
    const r = await chay(env, { sbd: 'S1' })
    expect(r).toMatchObject({ ok: true, homNay: '2026-10-14', moc: '2026-10-01', tuNgay: '2026-10-01', catBot: false })
    expect(r.moc).toBe(NGAY_BAT_DAU_BAI_HANG_NGAY) // phụ huynh và thầy cùng một mốc
    expect(r.dem.homNay).toEqual({ soLuot: 3, dung: 1, sai: 2, boTrong: 0, soCau: 3, giayTb: 50 }) // (95+4)/2
    // 7 ngày: hôm nay 3 + 13/10 ba lượt + 09/10 một ⇒ 7 lượt; giây đo: 95, 4, 70, 45, 20 ⇒ tb 47
    expect(r.dem.bayNgay).toEqual({ soLuot: 7, dung: 3, sai: 3, boTrong: 1, soCau: 6, giayTb: 47 })
    // từ 01/10: cả 8 lượt (gồm 09/10 và 03/10); giây đo 95, 4, 70, 45, 20, 7 ⇒ tb 40
    expect(r.dem.tuMoc).toEqual({ soLuot: 8, dung: 3, sai: 4, boTrong: 1, soCau: 7, giayTb: 40 })
    const theo = Object.fromEntries(r.ganDay.map((x) => [x.luc, x]))
    expect([theo[vn('2026-10-13 09:00')]!.giay, theo[vn('2026-10-13 09:00')]!.nguonGiay]).toEqual([70, 'do'])
    expect([theo[new Date(t0 + 45_000).toISOString()]!.giay, theo[new Date(t0 + 45_000).toISOString()]!.nguonGiay]).toEqual([45, 'uoc'])
    expect([theo[vn('2026-10-14 07:10')]!.giay, theo[vn('2026-10-14 07:10')]!.nguonGiay, theo[vn('2026-10-14 07:10')]!.noi]).toEqual([null, null, 'Lên bảng'])
    expect(theo[vn('2026-10-13 09:05')]!.dung).toBeNull()
    expect(theo[vn('2026-10-14 07:05')]).toMatchObject({ giay: 4, nguonGiay: 'do', dung: false })
    // thời gian 7 ngày: 5 lượt đo (4 đo thật + 1 ước tính), 2 chưa đo; trung vị của 4,20,45,70,95 = 45
    expect(r.thoiGian).toMatchObject({ giayTb: 47, giayGiua: 45, soDo: 4, soUoc: 1, soChuaDo: 2, nhanh: { so: 1, sai: 1 } })
    expect(r.thoiGian.phanBo).toEqual([
      { tu: 0, den: 8, so: 1, sai: 1 }, { tu: 8, den: 30, so: 1, sai: 0 }, { tu: 30, den: 60, so: 1, sai: 0 },
      { tu: 60, den: 120, so: 2, sai: 1 }, { tu: 120, den: 300, so: 0, sai: 0 }, { tu: 300, den: null, so: 0, sai: 0 },
    ])
  })
})

describe('lịch từng ngày: mức đã lưu của kế hoạch ngày đang chấm; không lưu ⇒ quy tắc hiện hành + cờ ước tính', () => {
  it('12/10 mức lưu 30 (tầng 2) · 13/10 không lưu ⇒ ≈30 theo tầng gần nhất, làm đủ 3 câu kế hoạch vẫn thiếu mức 30 (đúng bảng của thầy) · 14/10 hôm nay · ngày trống ⇒ không làm', async () => {
    const { d, env } = dung()
    for (const s of SQL_BANG_HANH_TRINH) d.sql.exec(s)
    d.sql.prepare('INSERT INTO hanh_trinh_v3_ngay (sbd, ngay, tang, toi_thieu) VALUES (?,?,?,?)').run('S1', '2026-10-12', 2, 30)
    d.sql.prepare('INSERT INTO hanh_trinh_v3_ngay (sbd, ngay, tang, toi_thieu) VALUES (?,?,?,?)').run('S2', '2026-10-13', 4, 36) // con khác: không lẫn
    d.sql.prepare('INSERT INTO srs2_ke_hoach (sbd, ngay, chien_dich_id, dao_json, doan_json, huyet_chien, tong, tao_luc) VALUES (?,?,?,?,?,?,?,?)')
      .run('S1', '2026-10-13', 'hanh-trinh-v3-khoi-12', JSON.stringify(['K-I-1', 'K-I-2']), JSON.stringify(['K-I-3#2']), 0, 3, 'x')
    // 12/10: 2 câu (1 câu làm 2 lần) ⇒ thiếu 2/30
    sk(d, { khoa: 'a1', qid: 'A-I-1', kq: 0, luc: vn('2026-10-12 19:00') })
    sk(d, { khoa: 'a2', qid: 'A-I-1', kq: 1, luc: vn('2026-10-12 19:05') })
    sk(d, { khoa: 'a3', qid: 'A-I-2', kq: 1, luc: vn('2026-10-12 19:10') })
    // 13/10: làm hết 3 câu kế hoạch (bản song sinh của K-I-1 cũng tính) + 1 câu ngoài kế hoạch ⇒ đủ
    sk(d, { khoa: 'b1', qid: 'K-I-1~ss1', kq: 0, luc: vn('2026-10-13 20:00') })
    sk(d, { khoa: 'b2', qid: 'K-I-2', kq: 1, luc: vn('2026-10-13 20:01') })
    sk(d, { khoa: 'b3', qid: 'K-I-3', kq: 1, luc: vn('2026-10-13 20:02') })
    sk(d, { khoa: 'b4', qid: 'Z-I-9', kq: 1, luc: vn('2026-10-13 20:03') })
    // 14/10 (hôm nay): 1 câu
    sk(d, { khoa: 'c1', qid: 'C-I-1', kq: 1, luc: vn('2026-10-14 06:00') })
    const r = await chay(env, { sbd: 'S1' })
    expect(r.ngay.map((n) => n.ngay)).toEqual(Array.from({ length: 14 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`))
    const theo = Object.fromEntries(r.ngay.map((n) => [n.ngay, n])) as Record<string, NgayHoc>
    // "đã làm / mức" dùng CHUNG phép tính bảng "Bài hằng ngày" của thầy (`ngayBaiCuaMotEm`, sửa có chủ đích 12/10 để phụ huynh và thầy cùng một số):
    // ngày Hành trình chỉ đếm câu CỦA KẾ HOẠCH đã làm (không mở kế hoạch ⇒ 0), đủ mức khi đã làm ≥ mức tối thiểu (giống app học sinh chấm).
    expect(theo['2026-10-12']).toEqual({ ngay: '2026-10-12', dung: 2, sai: 1, boTrong: 0, soCau: 2, muc: 30, mucUocTinh: false, daXep: null, canLam: 30, daLam: 0, trangThai: 'thieu', homNay: false })
    expect(theo['2026-10-13']).toEqual({ ngay: '2026-10-13', dung: 3, sai: 1, boTrong: 0, soCau: 4, muc: 30, mucUocTinh: true, daXep: 3, canLam: 30, daLam: 3, trangThai: 'thieu', homNay: false })
    expect(theo['2026-10-14']).toMatchObject({ soCau: 1, muc: 30, mucUocTinh: true, canLam: 30, daLam: 0, trangThai: 'thieu', homNay: true })
    // trước mọi mức đã lưu ⇒ tầng gần nhất SAU (2) ⇒ 30; ngày trống ⇒ không làm
    expect(theo['2026-10-05']).toMatchObject({ soCau: 0, muc: 30, mucUocTinh: true, trangThai: 'khong' })
  })

  it('tầng ước tính: gần nhất trước ⇒ gần nhất sau ⇒ tầng 1', () => {
    const luu = [{ ngay: '2026-10-05', tang: 3 }, { ngay: '2026-10-10', tang: 4 }]
    expect(tangUocTinh('2026-10-07', luu)).toBe(3)
    expect(tangUocTinh('2026-10-12', luu)).toBe(4)
    expect(tangUocTinh('2026-10-01', luu)).toBe(3)
    expect(tangUocTinh('2026-10-01', [])).toBe(1)
  })
})

describe('gợi ý nhắc con: đúng luật, tối đa 5, không độn, giọng phụ huynh', () => {
  const ngayH = (o: Partial<NgayHoc>): NgayHoc => ({ ngay: '2026-10-14', dung: 0, sai: 0, boTrong: 0, soCau: 0, muc: 24, mucUocTinh: false, daXep: null, canLam: 24, daLam: 0, trangThai: 'khong', homNay: true, ...o })
  const goc: DauVaoGoiY = { moc: '2026-10-12', homNay: null, ngayTruoc: [], nhanh: { so: 0, sai: 0 }, chuaSua: 0, khuya: { soNgay: 0, soLuot: 0 }, bay: { dung: 0, sai: 0 }, truoc: { dung: 0, sai: 0 }, goiYDaDung: { so: 0, tong: 0 } }

  it('đủ dữ liệu ⇒ đúng thứ tự ưu tiên, cắt ở 5; mỗi câu ≤ 30 chữ, không dấu gạch ngang dài, không khen', () => {
    const g = sinhGoiYNhac({
      ...goc,
      homNay: ngayH({ soCau: 12, daLam: 12, trangThai: 'thieu' }),
      ngayTruoc: [ngayH({ ngay: '2026-10-12', homNay: false, trangThai: 'khong' }), ngayH({ ngay: '2026-10-13', homNay: false, soCau: 5, daLam: 5, trangThai: 'thieu' })],
      nhanh: { so: 8, sai: 6 }, chuaSua: 3, khuya: { soNgay: 3, soLuot: 9 }, bay: { dung: 10, sai: 15 }, truoc: { dung: 21, sai: 9 }, goiYDaDung: { so: 14, tong: 20 },
    })
    expect(g.map((x) => x.ma)).toEqual(['con-cau-hom-nay', 'sai-chua-sua', 'nhanh-sai', 'thieu-ngay', 'ti-le-giam'])
    expect(g.map((x) => x.chu)).toEqual([
      'Hôm nay con còn 12 câu chưa làm (đã làm 12/24 câu).',
      'Có 3 câu con làm sai chưa sửa được. Nhắc con vào mục Tự chữa lỗi để làm lại.',
      '7 ngày qua có 8 câu con làm dưới 8 giây và sai 6 câu. Nhắc con đọc kỹ đề trước khi chọn.',
      'Từ 12/10 con có 1 ngày không làm bài và 1 ngày làm chưa đủ mức. Hỏi con lý do và chốt một giờ học cố định mỗi ngày.',
      'Tỉ lệ đúng 7 ngày qua là 40%, thấp hơn 7 ngày trước đó (70%). Hỏi con phần nào đang khó để báo Thầy.',
    ])
    for (const x of g) {
      expect(x.chu).not.toMatch(/[—–]|giỏi|tuyệt|xuất sắc|cố gắng hơn/)
      for (const cau of x.chu.split(/(?<=\.)\s+/)) expect(cau.split(/\s+/).length, cau).toBeLessThanOrEqual(30)
    }
  })

  it('từng luật: ngưỡng đúng; không có dữ liệu ⇒ không câu nào (không độn)', () => {
    expect(sinhGoiYNhac(goc)).toEqual([])
    // hôm nay chưa làm, mức ước tính ⇒ "≈"
    expect(sinhGoiYNhac({ ...goc, homNay: ngayH({ mucUocTinh: true, canLam: 30, muc: 30 }) })).toEqual([{ ma: 'chua-lam-hom-nay', chu: 'Hôm nay con chưa làm câu nào. Mức của ngày là ≈30 câu.' }])
    // đã đủ ⇒ không nhắc
    expect(sinhGoiYNhac({ ...goc, homNay: ngayH({ soCau: 24, daLam: 24, trangThai: 'du' }) })).toEqual([])
    // nhanh: 4 lượt chưa đủ ngưỡng; 5 lượt sai 2 (< 50%) ⇒ không; 5 lượt sai 3 ⇒ có
    expect(LUAT_GOI_Y.nhanhToiThieu).toBe(5)
    expect(sinhGoiYNhac({ ...goc, nhanh: { so: 4, sai: 4 } })).toEqual([])
    expect(sinhGoiYNhac({ ...goc, nhanh: { so: 5, sai: 2 } })).toEqual([])
    expect(sinhGoiYNhac({ ...goc, nhanh: { so: 5, sai: 3 } }).map((x) => x.ma)).toEqual(['nhanh-sai'])
    // khuya: 1 ngày ⇒ không; 2 ngày ⇒ có
    expect(sinhGoiYNhac({ ...goc, khuya: { soNgay: 1, soLuot: 5 } })).toEqual([])
    expect(sinhGoiYNhac({ ...goc, khuya: { soNgay: 2, soLuot: 3 } })).toEqual([{ ma: 'lam-khuya', chu: 'Con hay làm bài sau 23 giờ (2 trong 7 ngày qua). Nhắc con học sớm hơn để đủ giấc.' }])
    // tỉ lệ: thiếu lượt ⇒ không; giảm 14 điểm ⇒ không
    expect(sinhGoiYNhac({ ...goc, bay: { dung: 5, sai: 14 }, truoc: { dung: 20, sai: 0 } })).toEqual([])
    expect(sinhGoiYNhac({ ...goc, bay: { dung: 56, sai: 44 }, truoc: { dung: 70, sai: 30 } })).toEqual([])
    // gợi ý: 9 lượt ⇒ không; 10 lượt, 5 có gợi ý ⇒ có
    expect(sinhGoiYNhac({ ...goc, goiYDaDung: { so: 9, tong: 9 } })).toEqual([])
    expect(sinhGoiYNhac({ ...goc, goiYDaDung: { so: 5, tong: 10 } })).toEqual([{ ma: 'dung-goi-y', chu: 'Con dùng gợi ý ở 5/10 câu trong 7 ngày qua. Nhắc con tự làm trước, bí mới mở gợi ý.' }])
    // ngày thiếu chỉ một loại ⇒ không ghép "0 ngày"
    expect(sinhGoiYNhac({ ...goc, ngayTruoc: [ngayH({ ngay: '2026-10-12', homNay: false })] })[0]!.chu).toBe('Từ 12/10 con có 1 ngày không làm bài. Hỏi con lý do và chốt một giờ học cố định mỗi ngày.')
  })

  it('qua lệnh thật: gợi ý sinh từ sổ (hôm nay còn câu + câu sai chưa sửa + nhanh mà sai + ngày thiếu + làm khuya)', async () => {
    const { d, env } = dung()
    for (let i = 0; i < 6; i++) sk(d, { khoa: `n${i}`, qid: `N-I-${i}`, kq: i < 4 ? 0 : 1, giay: 3, luc: vn(`2026-10-1${i % 2 === 0 ? 2 : 3} 23:${String(10 + i).padStart(2, '0')}`) })
    sk(d, { khoa: 'h', qid: 'H-I-1', kq: 1, giay: 30, luc: vn('2026-10-14 08:00') })
    const r = await chay(env, { sbd: 'S1' })
    expect(r.khuya).toEqual({ soNgay: 2, soLuot: 6 })
    // 01/10 → 11/10 không làm; 12/10 và 13/10 mỗi ngày 3 câu < mức ≈24 ⇒ thêm "thieu-ngay"; đủ 5 câu ⇒ cắt đúng 5
    expect(r.goiY.map((x) => x.ma)).toEqual(['con-cau-hom-nay', 'sai-chua-sua', 'nhanh-sai', 'thieu-ngay', 'lam-khuya'])
    expect(r.goiY[3]!.chu).toBe('Từ 01/10 con có 11 ngày không làm bài và 2 ngày làm chưa đủ mức. Hỏi con lý do và chốt một giờ học cố định mỗi ngày.')
    expect(r.goiY[0]!.chu).toBe('Hôm nay con còn ≈23 câu chưa làm (đã làm 1/≈24 câu).')
    expect(r.goiY[1]!.chu).toContain('Có 4 câu con làm sai chưa sửa được')
  })
})

describe('chữ cho phụ huynh', () => {
  it('nơi làm không có tên trò chơi; tiêu đề câu không lộ mã', () => {
    expect(noiChoPh('game')).toBe('Bài luyện trên app')
    expect(noiChoPh('thi')).toBe('Ca kiểm tra')
    expect(noiChoPh('la')).toBe('Bài luyện trên app')
    expect(tieuDeChoPh('DH-12-C1-B2-III-4', '')).toBe('Câu 4')
    expect(tieuDeChoPh('MA-LA', '')).toBe('')
    expect(tieuDeChoPh('DH-12-I-7', 'Ester')).toBe('Câu 7 · Ester')
  })
})

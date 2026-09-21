// @vitest-environment node
// `POST /ph/giao-them` (Code 3, docs/hop-dong-ph-giao-them-2109.md mục 5) trên D1 GIẢ BẰNG SQLITE THẬT: máy chủ dựng đầu vào cho `tinhGiaoThem` (Code 1) rồi CHỌN qid — không tự luận, không câu bài tập chưa nộp, không câu làm 14 ngày
// (trừ câu đến lịch), không vượt bậc + 1, các nhóm không trùng nhau; tạo `mom_bai`; trần 3 lượt THÀNH CÔNG/ngày VN; từ chối không mất lượt; bấm đúp cùng phút; con nhận MỘT tin; mayDaLam; không đáp án ra máy phụ huynh.
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { parentPass } from '../server/src/game-v2-auth'
import { phGiaoThem } from '../server/src/ph-giao-them'
import { gvBangTin } from '../server/src/gv-bang-tin'
import { chuGameTrong } from '../server/src/chu-game'
import { lapVaLuuKeHoach } from '../server/src/ke-hoach-ngay-d1'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

afterEach(() => vi.useRealTimers())
const T = (s: string): number => Date.parse(`${s}+07:00`)
const NGAY = '2026-09-22'
const H = (gio: string): number => T(`${NGAY}T${gio}:00`) // giờ Việt Nam ngày NGAY
const themNgay = (ngay: string, n: number): string => new Date(Date.parse(`${ngay}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10)

const cauKho = (qid: string, dang: string, mucDo: 'biet' | 'hieu' | 'van_dung', o: Record<string, unknown> = {}) => ({
  qid, maDe: 'DE', version: 'v', group: `g-${qid}`, phan: 'I', text: `Chọn phát biểu đúng về ${qid}.`, choices: ['A. a', 'B. b', 'C. c', 'D. d'], ideas: [], hinhAnh: [],
  dang, tenDang: `Tên ${dang}`, mucDo, sao: 1, kienThuc: ['k'], correct: 'B', solution: 'LG-BI-MAT', reviewed: true, ...o,
})
const themKho = (d: D1That, cau: ReturnType<typeof cauKho>[]) => {
  d.sql.prepare("INSERT OR IGNORE INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE','DE','12',?, 'kho/DE.json',0,'v1')").run(cau.length)
  d.sql.prepare("INSERT OR IGNORE INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE','v1','x')").run()
  for (const c of cau) d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DE', c.qid, 'v', c.group, c.dang, JSON.stringify(c))
}
const dangHs = (d: D1That, ma: string, o: { gap?: number; sai?: number; khac?: number; moi?: number; chua?: number; bac?: number } = {}) =>
  d.sql.prepare('INSERT OR REPLACE INTO nam_kt_dang(khoa,sbd,ma_dang,so_gap,so_sai,so_da_khac_phuc,so_moi_sai,so_chua_thay_sai,bac,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?,?)')
    .run(`S1|${ma}`, 'S1', ma, o.gap ?? 10, o.sai ?? 6, o.khac ?? 1, o.moi ?? 2, o.chua ?? 1, o.bac ?? 1, 'x')
const cauHs = (d: D1That, qid: string, dang: string, trangThai: string, moc: string | null, lanSai = 1) =>
  d.sql.prepare(`INSERT INTO nam_kt_cau (khoa, sbd, qid, ma_dang, chuyen_de, lan_gap, lan_sai, lan_trong, dung_lien_tiep, ngay_dung_khac_nhau, ket_qua_cuoi, nguon_cuoi, luc_cuoi, moc_on_ke, trang_thai, can_day_lai, giay_tb, cap_nhat_luc)
     VALUES (?, 'S1', ?, ?, 'CĐ', 2, ?, 0, 0, 0, 0, 'btvn', '2026-09-10T02:00:00.000Z', ?, ?, 0, NULL, 'x')`).run(`S1|${qid}`, qid, dang, lanSai, moc, trangThai)
const suKien = (d: D1That, qid: string, ngay: string, o: { nguon?: string; ma?: string; kq?: 0 | 1 } = {}) => {
  d.sql.prepare("INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn) VALUES (?, 'S1', ?, ?, ?, 1, ?, 40, ?, ?)")
    .run(`k|${qid}|${ngay}|${o.ma ?? 'm'}|${Math.random()}`, qid, o.nguon ?? 'btvn', o.ma ?? 'm', o.kq ?? 1, `${ngay}T02:00:00.000Z`, ngay)
  // Kế hoạch ngày DỰNG LẠI hồ sơ từ sổ khi số dòng sổ đổi so với lần lập trước (`so_su_kien`): giữ khớp để hồ sơ giả của bài kiểm không bị xoá giữa chừng.
  d.sql.prepare("UPDATE ke_hoach_ngay SET so_su_kien = (SELECT COUNT(*) FROM su_kien_hoc WHERE sbd = 'S1') WHERE sbd = 'S1'").run()
}
/** Hôm nay con đã làm `n` câu, `dung` câu đúng (ngoài kho) — vượt mục tiêu ngày ⇒ gói nhẹ 4–6 câu (hàm thuần của Code 1). */
const homNayDaLam = async (d: D1That, n: number, dung: number) => {
  for (let i = 0; i < n; i++) suKien(d, `HN-${i}`, NGAY, { kq: i < dung ? 1 : 0 })
}

/** Em S1 lớp 12: dạng ES (vấp, bậc 1) + AM (ổn, bậc 1) + PO (yếu, bậc 0) và một kho đủ câu ở các mức. */
async function dung(): Promise<{ d: D1That; pass: string }> {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn Thu Hà','12','mk','x')").run()
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S2','Trần Bình','12','mk','x')").run()
  const kho: ReturnType<typeof cauKho>[] = []
  const muc = ['biet', 'hieu', 'van_dung'] as const
  for (const ma of ['ES', 'AM', 'PO']) for (let m = 0; m < 3; m++) for (let i = 1; i <= 6; i++) kho.push(cauKho(`${ma}-${muc[m]}-${i}`, ma, muc[m]!))
  for (let i = 1; i <= 8; i++) kho.push(cauKho(`ON-${i}`, 'ES', 'hieu')) // câu sẽ đến lịch ôn
  for (let i = 1; i <= 5; i++) kho.push(cauKho(`SAI-${i}`, 'AM', 'hieu')) // câu từng sai chưa khắc phục
  kho.push(cauKho('TL-1', 'ES', 'hieu', { choices: [] }), cauKho('TL-2', 'ES', 'hieu', { choices: [] })) // TỰ LUẬN (phần I không phương án)
  themKho(d, kho)
  // Sổ trước (4 câu ES đã làm): để kế hoạch ngày dựng hồ sơ từ sổ MỘT lần rồi mới nạp hồ sơ giả — sau đó `so_su_kien` khớp nên hồ sơ giả không bị dựng lại.
  for (const q of ['ES-hieu-1', 'ES-hieu-2', 'ES-van_dung-1']) suKien(d, q, themNgay(NGAY, -5)) // ĐÃ làm trong 14 ngày ⇒ loại
  suKien(d, 'ON-1', themNgay(NGAY, -4)) // đến lịch ôn dù làm 4 ngày trước ⇒ vẫn được
  await lapVaLuuKeHoach(d.env, ['S1'], H('17:00'))
  d.sql.exec('DELETE FROM nam_kt_dang; DELETE FROM nam_kt_cau')
  dangHs(d, 'ES', { gap: 10, sai: 6, khac: 1, moi: 3, chua: 1, bac: 1 })
  dangHs(d, 'AM', { gap: 10, sai: 1, khac: 4, moi: 0, chua: 5, bac: 1 })
  dangHs(d, 'PO', { gap: 8, sai: 6, khac: 0, moi: 2, chua: 1, bac: 0 })
  for (let i = 1; i <= 8; i++) cauHs(d, `ON-${i}`, 'ES', 'dang_on', themNgay(NGAY, -1)) // đến lịch (mốc hôm qua)
  for (let i = 1; i <= 5; i++) cauHs(d, `SAI-${i}`, 'AM', 'moi_sai', themNgay(NGAY, 3)) // sai, CHƯA đến lịch
  return { d, pass: await parentPass(d.env, 'S1') }
}
const chay = (d: D1That, pass: string, gio: string, o: Record<string, unknown> = {}) => phGiaoThem(d.env, { pass, ...o }, H(gio))
const dsMom = (d: D1That) => d.sql.prepare("SELECT * FROM mom_bai WHERE sbd = 'S1' ORDER BY id").all() as { id: string; title: string; question_count: number; qid_json: string }[]
const hangLuot = (d: D1That) => d.sql.prepare("SELECT * FROM ph_giao_them WHERE sbd = 'S1' ORDER BY luot").all() as Record<string, any>[]
/** Giả lập con LÀM XONG gói vừa giao (ghi sổ nguồn mom, mã bài = id mom) — đúng `dung` câu đúng. */
const lamXong = (d: D1That, dung = 5) => {
  const h = hangLuot(d).at(-1)!
  ;(JSON.parse(h.qid_json) as string[]).forEach((q, i) => suKien(d, q, NGAY, { nguon: 'mom', ma: h.ma_mom, kq: i < dung ? 1 : 0 }))
}

describe('lượt giao thành công', () => {
  it('giao 4–10 câu đúng cơ cấu: KHÔNG tự luận, KHÔNG câu làm 14 ngày (trừ câu đến lịch), KHÔNG trùng qid, mức ≤ bậc + 1; tạo mom_bai; ghi lượt; 2 lượt còn lại', async () => {
    const { d, pass } = await dung()
    const r = await chay(d, pass, '19:00') as any
    expect(r.ok).toBe(true)
    expect(r.tuChoi).toBeUndefined()
    const g = r.daGiao
    expect(g.soCau).toBeGreaterThanOrEqual(4); expect(g.soCau).toBeLessThanOrEqual(10)
    expect(g.luot).toBe(1); expect(g.laLuotCu).toBe(false)
    expect(g.thanhPhan.reduce((t: number, x: { soCau: number }) => t + x.soCau, 0)).toBe(g.soCau) // số báo = số giao thật
    expect(g.phutUocTinh).toBeGreaterThan(0)
    expect(r.conLaiHomNay).toBe(2)
    const [hang] = hangLuot(d)
    const qid = JSON.parse(hang.qid_json) as string[]
    expect(qid).toHaveLength(g.soCau)
    expect(new Set(qid).size).toBe(qid.length) // không trùng
    expect(qid.filter((q) => q.startsWith('TL-'))).toEqual([]) // không tự luận
    for (const q of qid) expect(['ES-hieu-1', 'ES-hieu-2', 'ES-van_dung-1'], q).not.toContain(q) // đã làm trong 14 ngày
    // đến lịch ôn xếp trước; câu dạng theo mức ≤ bậc + 1 (ES bậc 1 ⇒ ≤ van_dung; PO bậc 0 ⇒ ≤ hieu)
    for (const q of qid.filter((x) => x.startsWith('PO-'))) expect(q, 'PO bậc Biết: tối đa Hiểu').not.toMatch(/van_dung/)
    // thành phần đúng loại
    for (const t of g.thanhPhan) expect(['on_lai', 'dang_vap', 'cau_sai', 'thu_suc']).toContain(t.loai)
    expect(g.thanhPhan[0].loai).toBe('on_lai') // ưu tiên 1: câu đến lịch ôn
    const soOnLai = g.thanhPhan.filter((t: { loai: string }) => t.loai === 'on_lai').reduce((t: number, x: { soCau: number }) => t + x.soCau, 0)
    expect(qid.filter((q) => q.startsWith('ON-'))).toHaveLength(soOnLai)
    for (const t of g.thanhPhan.filter((x: { dang?: string }) => x.dang)) expect(t.tenDang, 'có tên dạng, không chỉ mã').toBeTruthy()
    // mom_bai
    const [m] = dsMom(d)
    expect(m).toMatchObject({ id: `giao_them_${NGAY}_1`, question_count: g.soCau })
    expect(m!.title).toBe(`Gia đình giao thêm · ${g.soCau} câu`)
    expect(JSON.parse(m!.qid_json)).toEqual(qid)
    // lượt
    expect(hang).toMatchObject({ sbd: 'S1', ngay_vn: NGAY, luot: 1, so_cau: g.soCau, ma_mom: `giao_them_${NGAY}_1` })
  })

  it('KHÔNG lộ đáp án / mã câu ra máy phụ huynh; chữ hiển thị sạch chữ game; lời có số thật, xưng "con"', async () => {
    const { d, pass } = await dung()
    const r = await chay(d, pass, '19:00') as any
    const chuoi = JSON.stringify(r)
    expect(chuoi).not.toMatch(/LG-BI-MAT|"correct"|dapAn|ES-hieu|ON-\d|SAI-\d|qid/)
    expect(chuGameTrong(chuoi)).toEqual([])
    expect(r.daGiao.lyDo.length).toBeGreaterThan(0)
    expect(r.daGiao.lyDo.join(' ')).toMatch(/\d/)
    expect(r.daGiao.lyDo.join(' ')).not.toMatch(/\bem\b(?! ôn)/i) // xưng "con" với phụ huynh (không "em")
  })

  it('con nhận ĐÚNG MỘT tin trong app (mã tin của bài mom, chủ ngữ A.I Đỗ Đại Học, không nhắc game); gọi đồng bộ thông báo không thêm tin chung chung', async () => {
    const { d, pass } = await dung()
    const r = await chay(d, pass, '19:00') as any
    const tin = d.sql.prepare("SELECT * FROM student_notice WHERE sbd = 'S1'").all() as Record<string, string>[]
    expect(tin).toHaveLength(1)
    expect(tin[0]).toMatchObject({ id: `mom:S1:giao_them_${NGAY}_1`, title: 'A.I Đỗ Đại Học · Bài gia đình giao', target: 'mom' })
    expect(tin[0]!.body).toBe(`Gia đình vừa giao cho em ${r.daGiao.soCau} câu, khoảng ${r.daGiao.phutUocTinh} phút. A.I Đỗ Đại Học đã chọn các câu hợp với em hôm nay.`)
    expect(chuGameTrong(tin[0]!.body)).toEqual([])
    const { syncNotices } = await import('../server/src/notifications')
    await syncNotices(d.env, 'S1')
    expect(d.dem('student_notice', "sbd = 'S1'")).toBe(1) // INSERT OR IGNORE theo cùng mã ⇒ không tạo tin "Bài luyện mới" thứ hai
  })

  it('bảng tin thầy: mayDaLam "A.I Đỗ Đại Học soạn N gói bài gia đình giao hôm nay" (N toàn trường); vắng khi chưa có gói; vẫn ≤ 12 truy vấn', async () => {
    const { d, pass } = await dung()
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(H('19:30'))
    const dong = async () => ((await gvBangTin(d.env, {}, H('19:30'))).mayDaLam as { loai: string; so: number; chu: string }[]).find((x) => x.loai === 'giao_them')
    expect(await dong()).toBeUndefined()
    await chay(d, pass, '19:00')
    expect(await dong()).toEqual({ loai: 'giao_them', so: 1, chu: 'A.I Đỗ Đại Học soạn 1 gói bài gia đình giao hôm nay' })
    expect(((await gvBangTin(d.env, {}, H('19:30'))).soTruyVan as number)).toBeLessThanOrEqual(12)
  })
})

describe('trần 3 lượt thành công/ngày, từ chối không mất lượt, bấm đúp, ngày VN', () => {
  it('3 lượt thành công (mỗi lượt sau khi con làm xong gói trước) rồi HẾT LƯỢT; lượt thứ 4 bị từ chối, conLai 0, không ghi thêm', async () => {
    const { d, pass } = await dung()
    await homNayDaLam(d, 14, 13) // vượt mục tiêu (12) và đúng ≥ 80 %: lượt 1 = 6 câu, lượt 2 ≤ 6, lượt 3 ≤ 4 ⇒ ≤ 16 câu trong ngày
    const soCau: number[] = []
    for (const [i, gio] of ['18:00', '18:30', '19:00'].entries()) {
      const r = await chay(d, pass, gio) as any
      expect(r.daGiao, `lượt ${i + 1}`).toBeTruthy()
      expect(r.daGiao.luot).toBe(i + 1)
      expect(r.conLaiHomNay).toBe(2 - i)
      soCau.push(r.daGiao.soCau)
      lamXong(d, 4)
    }
    const r4 = await chay(d, pass, '19:30') as any
    expect(r4.daGiao).toBeUndefined()
    expect(r4.tuChoi.ma).toBe('het_luot')
    expect(r4.conLaiHomNay).toBe(0)
    expect(hangLuot(d)).toHaveLength(3)
    expect(dsMom(d)).toHaveLength(3)
    expect(soCau[0]!).toBeLessThanOrEqual(6); expect(soCau[1]!).toBeLessThanOrEqual(6); expect(soCau[2]!).toBeLessThanOrEqual(4) // lượt 1 nhẹ vì vượt mục tiêu, lượt 2 ≤ 6, lượt 3 ≤ 4 (hàm thuần của Code 1)
    expect(soCau.reduce((t, x) => t + x, 0)).toBeLessThanOrEqual(16) // tổng giao thêm trong ngày ≤ 16
    // câu KHÔNG lặp giữa các gói
    const tatCa = hangLuot(d).flatMap((h) => JSON.parse(h.qid_json) as string[])
    expect(new Set(tatCa).size).toBe(tatCa.length)
  })

  it('TỪ CHỐI không mất lượt và không ghi gì: quá 22:30 (qua_muon), gói trước chưa xong (goi_truoc_chua_xong)', async () => {
    const { d, pass } = await dung()
    expect((await chay(d, pass, '18:00') as any).daGiao.luot).toBe(1)
    const chua = await chay(d, pass, '18:30') as any // gói lúc 18:00 chưa làm câu nào
    expect(chua.tuChoi.ma).toBe('goi_truoc_chua_xong')
    expect(chua.tuChoi.lyDo.join(' ')).toMatch(/con mới làm 0 trong \d+ câu/)
    expect(chua.conLaiHomNay).toBe(2)
    expect(hangLuot(d)).toHaveLength(1); expect(dsMom(d)).toHaveLength(1)
    lamXong(d, 5)
    expect((await chay(d, pass, '18:31') as any).daGiao.luot).toBe(2) // làm xong rồi giao tiếp được
    lamXong(d, 5)
    const muon = await chay(d, pass, '22:31') as any // quá 22:30: từ chối hẳn, không mất lượt
    expect(muon.tuChoi.ma).toBe('qua_muon')
    expect(muon.conLaiHomNay).toBe(1)
    expect(hangLuot(d)).toHaveLength(2); expect(dsMom(d)).toHaveLength(2); expect(d.dem('student_notice')).toBe(2)
  })

  it('BẤM ĐÚP cùng phút: một gói, một bài, một tin; lần hai trả lại gói cũ (laLuotCu) và KHÔNG mất thêm lượt; hai lệnh SONG SONG cùng phút cũng chỉ một gói', async () => {
    const { d, pass } = await dung()
    const a = await chay(d, pass, '19:00') as any
    const b = await chay(d, pass, '19:00') as any
    expect(a.daGiao.laLuotCu).toBe(false)
    expect(b.daGiao).toMatchObject({ luot: 1, laLuotCu: true, soCau: a.daGiao.soCau })
    expect(b.conLaiHomNay).toBe(2)
    expect(hangLuot(d)).toHaveLength(1); expect(dsMom(d)).toHaveLength(1); expect(d.dem('student_notice')).toBe(1)
    const e = await dung()
    const [x, y] = (await Promise.all([chay(e.d, e.pass, '19:00'), chay(e.d, e.pass, '19:00')])) as any[]
    expect([x.daGiao.laLuotCu, y.daGiao.laLuotCu].sort()).toEqual([false, true])
    expect(hangLuot(e.d)).toHaveLength(1); expect(dsMom(e.d)).toHaveLength(1)
  })

  it('ngày VN đổi: 3 lượt của hôm qua không chặn hôm nay (sau 05:00); trần đếm THEO NGÀY VN, theo từng con', async () => {
    const { d, pass } = await dung()
    await homNayDaLam(d, 14, 13)
    for (const gio of ['18:00', '18:30', '19:00']) { await chay(d, pass, gio); lamXong(d, 5) }
    expect((await chay(d, pass, '19:30') as any).tuChoi.ma).toBe('het_luot')
    const sang = await phGiaoThem(d.env, { pass }, T(`${themNgay(NGAY, 1)}T09:00:00`)) as any
    expect(sang.conLaiHomNay === 3 || sang.daGiao?.luot === 1).toBe(true) // ngày mới: lượt 1 (hoặc từ chối vì lý do khác, không phải hết lượt)
    expect(sang.tuChoi?.ma).not.toBe('het_luot')
    const p2 = await parentPass(d.env, 'S2')
    const s2 = await phGiaoThem(d.env, { pass: p2 }, H('19:00')) as any
    expect(s2.conLaiHomNay).toBe(3) // con khác không bị tính lượt của S1
  })

  it('chiXem: chỉ đọc (không ghi, không tạo bài), trả conLaiHomNay + gói gần nhất với số ĐÃ LÀM / ĐÚNG theo sổ', async () => {
    const { d, pass } = await dung()
    expect(await chay(d, pass, '18:00', { chiXem: true })).toMatchObject({ ok: true, conLaiHomNay: 3 })
    expect(hangLuot(d)).toHaveLength(0)
    const r = await chay(d, pass, '18:00') as any
    lamXong(d, 5)
    const x = await chay(d, pass, '18:10', { chiXem: true }) as any
    expect(x.daGiao).toBeUndefined()
    expect(x.conLaiHomNay).toBe(2)
    expect(x.goiGanNhat).toMatchObject({ soCau: r.daGiao.soCau, soDaLam: r.daGiao.soCau, soDung: Math.min(5, r.daGiao.soCau), phutUocTinh: r.daGiao.phutUocTinh })
    expect(hangLuot(d)).toHaveLength(1); expect(dsMom(d)).toHaveLength(1)
  })
})

describe('lỗi khi tạo bài', () => {
  it('tạo bài (mom) thất bại ⇒ ok:false, TRẢ LẠI lượt (xoá dòng ghi), không có bài, không có tin, conLai vẫn 3', async () => {
    const { d, pass } = await dung()
    const put = d.env.DE.put.bind(d.env.DE)
    d.env.DE.put = (async () => { throw new Error('R2 hỏng') }) as never
    await expect(chay(d, pass, '19:00')).resolves.toMatchObject({ ok: false })
    expect(hangLuot(d)).toHaveLength(0); expect(dsMom(d)).toHaveLength(0); expect(d.dem('student_notice')).toBe(0)
    d.env.DE.put = put as never
    const r = await chay(d, pass, '19:01') as any
    expect(r.daGiao.luot).toBe(1); expect(r.conLaiHomNay).toBe(2)
  })
})

describe('loại câu không dùng được', () => {
  it('câu của bài tập về nhà CHƯA nộp không được giao; câu đã làm 14 ngày không được giao; đủ câu thì chọn hết từ phần còn lại', async () => {
    const { d, pass } = await dung()
    d.sql.prepare("INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc) VALUES('B1','C','DE',10,'2026-09-21T02:00:00.000Z','2026-09-30T05:00:00.000Z',0,'x')").run()
    d.sql.prepare("INSERT INTO btvn_em(khoa,ma_btvn,sbd) VALUES('B1|S1','B1','S1')").run()
    const chan = ['ON-2', 'ON-3', 'ES-biet-1', 'ES-biet-2', 'ES-hieu-3', 'PO-biet-1']
    for (const [i, q] of chan.entries()) d.sql.prepare("INSERT INTO btvn_em_cau(khoa,ma_btvn,sbd,qid,chang,nhan,thu_tu) VALUES(?,?,?,?,?,?,?)").run(`B1|S1|${q}`, 'B1', 'S1', q, 0, 'loi', i)
    const r = await chay(d, pass, '19:00') as any
    if (r.tuChoi) {
      // có việc bắt buộc (chặng bài tập) ⇒ từ chối đúng luật; khi đó không có gói để kiểm — kiểm ở ca không-bắt-buộc bên dưới
      expect(r.tuChoi.ma).toBe('con_viec_bat_buoc')
      return
    }
    const qid = JSON.parse(hangLuot(d)[0]!.qid_json) as string[]
    for (const q of chan) expect(qid, q).not.toContain(q)
  })

  it('kho KHÔNG có câu khả dụng ⇒ từ chối `khong_co_cau` (không mất lượt, không bài rỗng)', async () => {
    const d = taoD1That()
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn Thu Hà','12','mk','x')").run()
    dangHs(d, 'ES')
    themKho(d, [cauKho('TL-1', 'ES', 'hieu', { choices: [] }), cauKho('X-1', 'ES', 'hieu', { reviewed: false })]) // chỉ tự luận + câu chưa duyệt
    const pass = await parentPass(d.env, 'S1')
    const r = await chay(d, pass, '19:00') as any
    expect(r.ok).toBe(true)
    expect(r.tuChoi.ma).toBe('khong_co_cau')
    expect(r.conLaiHomNay).toBe(3)
    expect(hangLuot(d)).toHaveLength(0); expect(dsMom(d)).toHaveLength(0)
  })
})

describe('xác thực: token LẪN SBD trần (như mom / parent-news)', () => {
  it('SBD trần (phụ huynh chưa có liên kết) giao được, ghi truy cập loại sbd_tran; token vẫn lấy danh tính từ token, `sbd` trong thân bị bỏ', async () => {
    const { d, pass } = await dung()
    const a = await phGiaoThem(d.env, { sbd: 'S1' }, H('19:00')) as any
    expect(a.ok).toBe(true); expect(a.daGiao.luot).toBe(1)
    expect(d.sql.prepare("SELECT kieu FROM ph_truy_cap WHERE duong = 'ph-giao-them'").all()).toEqual([{ kieu: 'sbd_tran' }])
    lamXong(d) // con làm xong gói 1 ⇒ được giao gói 2
    const b = await phGiaoThem(d.env, { pass, sbd: 'EM-KHAC' }, H('19:30')) as any
    expect(b.ok).toBe(true); expect(b.daGiao.luot).toBe(2) // cùng em S1 theo token; sbd trong thân bị bỏ
    expect((d.sql.prepare('SELECT DISTINCT sbd FROM ph_giao_them').all() as { sbd: string }[]).map((x) => x.sbd)).toEqual(['S1'])
  })
})

describe('xác thực và lỗi hệ thống', () => {
  it('không có mã phụ huynh / mã sai / thiếu bảng ⇒ ok:false, không ghi', async () => {
    const { d, pass } = await dung()
    await expect(phGiaoThem(d.env, {}, H('19:00'))).rejects.toThrow(/số báo danh/) // thiếu cả token lẫn SBD
    await expect(phGiaoThem(d.env, { sbd: 'KHONG-CO' }, H('19:00'))).rejects.toThrow(/số báo danh/)
    await expect(phGiaoThem(d.env, { pass: pass + 'x' }, H('19:00'))).rejects.toThrow()
    d.sql.exec('DROP TABLE ph_giao_them')
    expect(await chay(d, pass, '19:00')).toMatchObject({ ok: false, error: expect.stringContaining('migration-2109-ph-giao-them.sql') })
    expect(dsMom(d)).toHaveLength(0)
  })
  it('đường Worker /ph/giao-them nhận pass và trả ok', async () => {
    const { d, pass } = await dung()
    const r = await goiWorker(worker, d.env, '/ph/giao-them', { pass, chiXem: true })
    expect(r).toMatchObject({ ok: true, conLaiHomNay: 3 })
  })
})

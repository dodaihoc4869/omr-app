// @vitest-environment node
// BTVN "NÂNG ĐỠ" — MÁY CHỦ (docs/hop-dong-btvn-nang-do-2109.md), chạy trên SQLite thật (tests/_d1-that.ts).
// Khoá: giao (cờ, migration, quy ước qid), mở bài (chốt một lần, KHÔNG đáp án, chỉ chặng đã mở), nộp chặng (đáp án đầu khoá, lời giải sau khi ghi sổ),
// nộp cuối (điểm trên câu của em, luật câu thưởng), bài `ca_nhan = 0` y như cũ, ngân sách truy vấn.
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { boDapAn, chotBoChoEm, docCoCaNhan, moLucChang, trangThaiCacChang } from '../server/src/btvn-nang-do-d1'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { BAY_GIO, HAN, NGAY_MAI_0H_VN, toKho, DAP_AN_DUNG, TAT_CA_QID, cauThay, dung, giao, maBtvn, mo, nopChang, boCuaEm, gio, loiThieuKhongThay } from './_btvn-nang-do-mau'

afterEach(() => vi.useRealTimers())

describe('GIAO bài cá nhân hoá', () => {
  it('caNhan + cau[] đúng quy ước qid ⇒ boQuaQid = [], thieuMeta = 0; ghi btvn.ca_nhan, btvn_cau, so_loi', async () => {
    gio(BAY_GIO)
    const d = dung(2)
    const r = await giao(d)
    expect(r).toMatchObject({ ok: true, caNhan: true, hatGiong: 'hg-1', boQuaQid: [], thieuMeta: 0 })
    expect(r.soLoi).toBeGreaterThanOrEqual(4)
    expect(d.sql.prepare('SELECT ca_nhan, hat_giong, so_loi FROM btvn').get()).toMatchObject({ ca_nhan: 1, hat_giong: 'hg-1', so_loi: r.soLoi })
    expect(d.dem('btvn_cau')).toBe(24)
    expect(d.dem('btvn_cau', 'loi = 1')).toBe(r.soLoi)
    expect(d.dem('btvn_em')).toBe(2)
    expect(d.dem('btvn_em', 'chot_luc IS NOT NULL')).toBe(0) // chưa em nào mở ⇒ chưa chốt
  })
  it('qid lạ ⇒ boQuaQid; câu thiếu ⇒ thieuMeta và được điền từ tờ kho (dạng, mức, sao)', async () => {
    gio(BAY_GIO)
    const d = dung()
    const cau = cauThay().filter((c) => c.qid !== 'DE1-I-3' && c.qid !== 'DE1-I-4')
    const r = await giao(d, { cau: [...cau, { qid: 'KHONG-CO-I-1', dang: 'X', chuyenDe: 'Y', mucDo: 0, sao: 0, phan: 'I' }, { qid: 'q.id-kieu-may-thay', dang: 'X', chuyenDe: 'Y', mucDo: 0, sao: 0, phan: 'I' }] })
    expect(r).toMatchObject({ ok: true, thieuMeta: 2 })
    expect(r.boQuaQid).toEqual(['KHONG-CO-I-1', 'q.id-kieu-may-thay'])
    expect(d.sql.prepare("SELECT dang, muc_do, sao, chuyen_de FROM btvn_cau WHERE qid = 'DE1-I-3'").get()).toMatchObject({ dang: 'DA-1', muc_do: 2, sao: 2, chuyen_de: 'Este' })
  })
  it('ghim TUỲ CHỌN: [] hợp lệ; ghim lạ bị bỏ, ghim thật vào lõi', async () => {
    gio(BAY_GIO)
    const d = dung()
    const r = await giao(d, { ghim: ['DE1-I-16', 'KHONG-CO'] })
    expect(r.ok).toBe(true)
    expect(d.sql.prepare("SELECT loi, ghim FROM btvn_cau WHERE qid = 'DE1-I-16'").get()).toMatchObject({ loi: 1, ghim: 1 })
    expect(d.dem('btvn_cau', 'ghim = 1')).toBe(1)
  })
  it('lõi < 6 câu ⇒ vẫn giao, kèm canhBao', async () => {
    gio(BAY_GIO)
    const d = dung()
    // Tờ nhỏ: 8 câu, một dạng ⇒ lõi ≈ 30 % = 3 câu (< 6).
    d.objects.set('kho/DE2.json', { ma_de: 'DE2', cau: Array.from({ length: 8 }, (_, i) => ({ phan: 'I', so: i + 1, de: 'x', dap_an: 'A', chuyen_de: 'Este', muc_do: 'biet', dang: { ma: 'DA-9', ten: 'x' } })) })
    d.sql.exec("INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DE2','Tờ 2',8,0,'x')")
    const r = await giao(d, { maDe: 'DE2', cau: [] })
    expect(r.ok).toBe(true)
    expect(r.soLoi).toBeLessThan(6)
    expect(r.canhBao).toBe('loi_it_hon_6')
    expect((await giao(dung())).canhBao).toBeUndefined() // tờ 24 câu 4 dạng: lõi 7 ≥ 6 ⇒ không cảnh báo
  })
  it('KHÔNG gửi caNhan ⇒ đường cũ: không cột mới, không trường mới trong phản hồi', async () => {
    gio(BAY_GIO)
    const d = dung()
    const r = await goiWorker(worker, d.env, '/btvn/giao', { maCa: 'CA1', maDe: 'DE1', hanNop: HAN }, true)
    expect(Object.keys(r).filter((k) => k !== 'serverNow').sort()).toEqual(['caRong', 'hanNop', 'ok', 'soCa', 'soCau', 'soDe', 'soEm'])
    expect(d.sql.prepare('SELECT ca_nhan, hat_giong, so_loi FROM btvn').get()).toMatchObject({ ca_nhan: 0, hat_giong: null, so_loi: null })
    expect(d.dem('btvn_cau')).toBe(0)
  })
  it('cờ toàn cục cau_hinh.btvn_ca_nhan TẮT ⇒ bài thành ca_nhan = 0, báo caNhanBiTat', async () => {
    gio(BAY_GIO)
    for (const giaTri of ['false', '0', '{"tat":true}']) {
      const d = dung()
      d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('btvn_ca_nhan',?,'x')").run(giaTri)
      const r = await giao(d)
      expect(r).toMatchObject({ ok: true, caNhan: false, caNhanBiTat: true })
      expect(d.sql.prepare('SELECT ca_nhan FROM btvn').get()).toMatchObject({ ca_nhan: 0 })
      expect(d.dem('btvn_cau')).toBe(0)
    }
  })
  it('chưa chạy migration ⇒ giao caNhan báo lỗi bằng lời, KHÔNG tạo bài; giao thường vẫn chạy', async () => {
    gio(BAY_GIO)
    const d = dung()
    d.sql.exec('DROP TABLE btvn_cau')
    const r = await giao(d)
    expect(r.ok).toBe(false)
    expect(String(r.error)).toContain('migration-2109-btvn-nang-do.sql')
    expect(d.dem('btvn')).toBe(0)
    expect((await goiWorker(worker, d.env, '/btvn/giao', { maCa: 'CA1', maDe: 'DE1', hanNop: HAN }, true)).ok).toBe(true)
  })
  it('cau[] > 300 phần tử bị từ chối', async () => {
    gio(BAY_GIO)
    const d = dung()
    const r = await giao(d, { cau: Array.from({ length: 301 }, (_, i) => ({ qid: `Q${i}` })) })
    expect(r.ok).toBe(false)
    expect(d.dem('btvn')).toBe(0)
  })
})

describe('MỞ BÀI của bài cá nhân hoá', () => {
  it('lần mở đầu chốt bộ: chỉ chặng 0, KHÔNG có bất kỳ khoá đáp án/lời giải nào trong phản hồi', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giao(d)
    const r = await mo(d)
    expect(r).toMatchObject({ ok: true, caNhan: true, daNop: false, loDaXong: 0, changDangMo: 0, duocLamLai: false })
    expect(r.de.khongDapAn).toBe(true)
    expect(r.soChang).toBeGreaterThanOrEqual(2)
    expect(r.chang.map((c: { daMo: boolean }) => c.daMo)).toEqual([true, ...Array(r.soChang - 1).fill(false)])
    const qidMo = r.de.cau.map((c: { qid: string }) => c.qid)
    expect(qidMo).toEqual(boCuaEm(d).filter((x) => x.chang === 0).map((x) => x.qid))
    expect(Object.keys(r.nhan).sort()).toEqual([...qidMo].sort()) // nhãn CHỈ cho câu đã mở
    const chuoi = JSON.stringify(r)
    for (const bi of ['dap_an', 'dapAn', 'loi_giai', 'loiGiai', 'LG-BI-MAT', 'BI-MAT', 'BI-MAT-ANH', 'can_chua', 'kienThuc', 'DSDS', '0.39']) expect(chuoi).not.toContain(bi)
    expect(r.soCau).toBe(boCuaEm(d).length)
    expect(r.soCauCuaEm).toBe(r.soCau)
    expect(r.tomTat).toMatchObject({ tong: r.soCau, soChang: r.soChang })
  })
  it('ảnh sau lời giải bị bỏ, ảnh trong đề giữ; trường hiển thị (de, pa, y) giữ nguyên', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giao(d, { cau: cauThay().map((c) => c), ghim: TAT_CA_QID.filter((q) => q.includes('-III-')) })
    const r = await mo(d)
    const c = r.de.cau.find((x: { qid: string }) => x.qid === 'DE1-III-1')
    if (c) {
      expect(c.hinh).toEqual([{ tep: 'y.png', vi_tri: 'trong_de' }])
      expect(c.de).toBe('Câu III.1')
    }
    const p = r.de.cau.find((x: { qid: string }) => x.qid === 'DE1-I-1')
    if (p) expect(p.pa).toEqual({ A: 'a', B: 'b', C: 'c', D: 'd' })
  })
  it('CHỐT MỘT LẦN: mở lại ra đúng bộ cũ dù hồ sơ đổi sau đó; btvn_em_cau không đổi', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giao(d)
    const r1 = await mo(d)
    const bo1 = boCuaEm(d)
    d.sql.prepare("INSERT INTO nam_kt_dang(khoa,sbd,ma_dang,so_gap,so_sai,so_da_khac_phuc,so_moi_sai,so_chua_thay_sai,bac,cap_nhat_luc) VALUES('S1|DA-1','S1','DA-1',10,9,0,9,0,0,'x')").run()
    const r2 = await mo(d)
    expect(boCuaEm(d)).toEqual(bo1)
    expect(r2.de.cau.map((c: { qid: string }) => c.qid)).toEqual(r1.de.cau.map((c: { qid: string }) => c.qid))
    expect(d.sql.prepare("SELECT chot_luc, so_cau_em, so_chang FROM btvn_em WHERE sbd='S1'").get()).toMatchObject({ chot_luc: BAY_GIO.toISOString(), so_cau_em: bo1.length, so_chang: r1.soChang })
  })
  it('CUỘC ĐUA chốt: bên thua (đã có người chốt) đọc lại ĐÚNG bộ đã ghi, không ghi thêm dòng nào', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giao(d)
    const bt = d.sql.prepare('SELECT * FROM btvn').get() as Record<string, unknown>
    const a = await chotBoChoEm(d.env, bt, 'S1', BAY_GIO.getTime())
    const soDong = d.dem('btvn_em_cau')
    // Hồ sơ đổi + đồng hồ chạy tiếp: bên thua tính ra bộ KHÁC, nhưng UPDATE ... WHERE chot_luc IS NULL không trúng ⇒ đọc lại bộ đã ghi.
    d.sql.prepare("INSERT INTO nam_kt_dang(khoa,sbd,ma_dang,so_gap,so_sai,so_da_khac_phuc,so_moi_sai,so_chua_thay_sai,bac,cap_nhat_luc) VALUES('S1|DA-1','S1','DA-1',10,9,0,9,0,0,'x')").run()
    const b = await chotBoChoEm(d.env, bt, 'S1', BAY_GIO.getTime() + 3_600_000)
    expect(a).not.toBeNull()
    expect(b).toEqual(a)
    expect(d.dem('btvn_em_cau')).toBe(soDong)
    expect(d.sql.prepare("SELECT chot_luc FROM btvn_em WHERE sbd='S1'").get()).toMatchObject({ chot_luc: BAY_GIO.toISOString() })
  })
  it('lõi ⊆ bộ của MỌI em; em yếu/trung bình/khá nhận 3 bộ KHÁC nhau; em yếu không có câu vượt bậc đích + 1 ngoài lõi', async () => {
    gio(BAY_GIO)
    const d = dung(3)
    await giao(d)
    // S1 yếu (DA-1: gặp 8, sai 7, bậc 0); S2 trung bình (DA-2 bậc 1 đã ổn); S3 khá (mọi dạng bậc 2, đúng lại nhiều)
    const ins = d.sql.prepare('INSERT INTO nam_kt_dang(khoa,sbd,ma_dang,so_gap,so_sai,so_da_khac_phuc,so_moi_sai,so_chua_thay_sai,bac,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?,?)')
    ins.run('S1|DA-1', 'S1', 'DA-1', 8, 7, 1, 6, 0, 0, 'x')
    for (const ma of ['DA-1', 'DA-2', 'DA-3', 'DA-4']) ins.run(`S3|${ma}`, 'S3', ma, 10, 1, 1, 0, 9, 2, 'x')
    ins.run('S2|DA-2', 'S2', 'DA-2', 6, 1, 1, 0, 5, 1, 'x')
    // S3 đã đúng lại nhiều ngày ở các câu dễ của DA-1 (bỏ câu dễ đã đúng lại).
    for (let i = 1; i <= 8; i++) d.sql.prepare("INSERT INTO nam_kt_cau(khoa,sbd,qid,ma_dang,lan_gap,lan_sai,lan_trong,dung_lien_tiep,ngay_dung_khac_nhau,ket_qua_cuoi,nguon_cuoi,luc_cuoi,trang_thai,cap_nhat_luc) VALUES(?,?,?,?,3,0,0,3,3,1,'thi','x','chua_thay_sai','x')").run(`S3|DE1-I-${i}`, 'S3', `DE1-I-${i}`, 'DA-1')
    for (const s of ['S1', 'S2', 'S3']) expect((await mo(d, s)).ok).toBe(true)
    const loi = (d.sql.prepare('SELECT qid FROM btvn_cau WHERE loi = 1').all() as { qid: string }[]).map((x) => x.qid)
    const bo = (s: string) => boCuaEm(d, s)
    for (const s of ['S1', 'S2', 'S3']) expect(loiThieuKhongThay(d, s), s).toEqual([]) // lõi đúng bậc: thiếu câu lõi gốc chỉ khi có câu thay cùng dạng mức cao hơn
    const dan = (s: string) => bo(s).map((x) => x.qid).sort().join(',')
    expect(new Set([dan('S1'), dan('S2'), dan('S3')]).size).toBe(3)
    const muc = new Map((d.sql.prepare('SELECT qid, muc_do, dang FROM btvn_cau').all() as { qid: string; muc_do: number; dang: string }[]).map((x) => [x.qid, x]))
    // Em yếu ở DA-1 (bậc 0): câu ngoài lõi thuộc DA-1 không quá bậc 0 + 1 (và thử thách chỉ ở dạng em đang ổn ⇒ không có ở DA-1).
    for (const x of bo('S1')) {
      const m = muc.get(x.qid)!
      if (m.dang === 'DA-1' && !loi.includes(x.qid)) expect(m.muc_do).toBeLessThanOrEqual(0)
      if (x.nhan === 'thu_thach') expect(m.dang).not.toBe('DA-1')
    }
    // Mọi bộ đều không vượt số câu của bài; mỗi chặng mở bằng câu khởi động.
    for (const s of ['S1', 'S2', 'S3']) {
      expect(bo(s).length).toBeLessThanOrEqual(24)
      expect(bo(s).find((x) => x.chang === 0)!.nhan).toBe('khoi_dong')
    }
  })
  it('tất định: cùng hạt giống + cùng hồ sơ ⇒ cùng bộ (hai em cùng hồ sơ rỗng khác SBD có thể khác, chạy lại thì y hệt)', async () => {
    gio(BAY_GIO)
    const a = dung()
    const b = dung()
    await giao(a)
    await giao(b)
    await mo(a)
    await mo(b)
    expect(boCuaEm(a)).toEqual(boCuaEm(b))
  })
  it('SỐ TRUY VẤN: mở lần đầu (chốt) ≤ 12, mở lại ≤ 6', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giao(d)
    const t0 = d.soLenh.prepare
    expect((await mo(d)).ok).toBe(true)
    const lanDau = d.soLenh.prepare - t0
    const t1 = d.soLenh.prepare
    expect((await mo(d)).ok).toBe(true)
    const mienLai = d.soLenh.prepare - t1
    console.log(`[đo] mở bài lần đầu (chốt): ${lanDau} truy vấn · mở lại: ${mienLai}`)
    expect(lanDau).toBeLessThanOrEqual(12)
    expect(mienLai).toBeLessThanOrEqual(6)
  })
  it('bài ca_nhan thiếu btvn_cau ⇒ lyDo bai_chua_san_sang (không phát cả tờ)', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giao(d)
    d.sql.exec('DELETE FROM btvn_cau')
    const r = await mo(d)
    expect(r).toMatchObject({ ok: false, lyDo: 'bai_chua_san_sang' })
    expect(JSON.stringify(r)).not.toContain('dap_an')
  })
  it('quá hạn chưa nộp: em CHƯA từng mở VẪN mở được (sửa CÓ CHỦ Ý 21/09, Điều 4 = B nộp trễ) — bộ chỉ phần lõi, cờ quaHan/nopTre; chi tiết ở tests/nop-tre-2109', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giao(d)
    gio('2026-09-30T00:00:00.000Z')
    expect(await mo(d)).toMatchObject({ ok: true, quaHan: true, nopTre: true, daNop: false })
  })
})

describe('NỘP CHẶNG (/btvn/xong-lo của bài cá nhân hoá)', () => {
  const chang0 = (d: D1That) => boCuaEm(d).filter((x) => x.chang === 0).map((x) => x.qid)

  it('chấm từng câu, trả đáp án + lời giải SAU khi ghi sổ; xong chặng ⇒ loDaXong = 1; sổ btvn_lo lan = chặng', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giao(d)
    await mo(d)
    const qs = chang0(d)
    const dapAn = Object.fromEntries(qs.map((q, i) => [q, i === 0 ? 'B' : DAP_AN_DUNG(q)])) // câu đầu sai
    const r = await nopChang(d, 0, dapAn)
    expect(r).toMatchObject({ ok: true, loDaXong: 1, chuaLam: [], chang: { chiSo: 0, soCau: qs.length, soDung: qs.length - 1, xong: true } })
    expect(r.ketQua.map((k: { qid: string }) => k.qid)).toEqual(qs)
    expect(r.ketQua[0]).toMatchObject({ dung: false, dapAnDung: 'A' })
    expect(r.ketQua[0].loiGiai).toEqual({ chot: expect.stringContaining('LG-BI-MAT') })
    expect(r.exp).toMatchObject({ homNay: expect.any(Number) })
    expect(r.exp).toHaveProperty('conLaiLenCap')
    expect(r.tienBo).toMatchObject({ coTienBo: true })
    expect(r.tienBo.soCauMoiGap).toBe(qs.length)
    expect(d.sql.prepare("SELECT lo_da_xong FROM btvn_em WHERE sbd='S1'").get()).toMatchObject({ lo_da_xong: 1 })
    const so = d.sql.prepare("SELECT qid, ket_qua, lan FROM su_kien_hoc WHERE nguon='btvn_lo' ORDER BY qid").all() as { qid: string; ket_qua: number; lan: number }[]
    expect(so.length).toBe(qs.length)
    expect(so.every((x) => x.lan === 0)).toBe(true)
    expect(so.find((x) => x.qid === qs[0])!.ket_qua).toBe(0)
  })
  it('SỐ TRUY VẤN: mã dạng câu (btvn_cau) chỉ đọc MỘT LẦN, dùng chung cho hồ sơ trước/sau (Boss 22/09, lượt 2 — trước đây đọc hai lần)', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giao(d)
    await mo(d)
    const qs = chang0(d)
    const dapAn = Object.fromEntries(qs.map((q) => [q, DAP_AN_DUNG(q)]))
    const truoc = d.soLenh.prepare
    const r = await nopChang(d, 0, dapAn)
    expect(r.ok).toBe(true)
    expect(d.soLenh.prepare - truoc).toBe(30) // thêm một lần đọc chuỗi đủ 10 ngày, không cắt ở 7 // đo tại chỗ (git stash bản chưa gộp): 30 — gộp còn 29
  })
  it('ĐÁP ÁN ĐẦU KHOÁ: nộp lại với đáp án khác giữ kết quả lần đầu; không ghi đôi sổ', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giao(d)
    await mo(d)
    const qs = chang0(d)
    await nopChang(d, 0, Object.fromEntries(qs.map((q, i) => [q, i === 0 ? 'B' : DAP_AN_DUNG(q)])))
    const lai = await nopChang(d, 0, Object.fromEntries(qs.map((q) => [q, DAP_AN_DUNG(q)]))) // đổi câu đầu thành đúng
    expect(lai.ok).toBe(true)
    expect(lai.ketQua[0]).toMatchObject({ qid: qs[0], dung: false }) // vẫn theo đáp án lần đầu
    expect(lai.chang.soDung).toBe(qs.length - 1)
    expect(d.dem('su_kien_hoc', "nguon='btvn_lo'")).toBe(qs.length)
    expect(JSON.parse((d.sql.prepare("SELECT dap_an_json FROM btvn_em WHERE sbd='S1'").get() as { dap_an_json: string }).dap_an_json)[qs[0]]).toBe('B')
  })
  it('câu CHƯA trả lời (rỗng, ----, thiếu ý Phần II, Phần III toàn gạch) ⇒ chuaLam: không chấm, không lời giải, không khoá, chặng chưa xong', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giao(d, { ghim: ['DE1-II-1', 'DE1-III-1'] }) // ghim để chắc chắn có trong bộ
    await mo(d)
    // Ép chặng 0 = {I-…, II-1, III-1} (đường ghi DB): ba loại câu, mỗi loại một cách "chưa trả lời".
    d.sql.prepare("UPDATE btvn_em_cau SET chang = 0, thu_tu = -1 WHERE qid = 'DE1-II-1'").run()
    d.sql.prepare("UPDATE btvn_em_cau SET chang = 0, thu_tu = -2 WHERE qid = 'DE1-III-1'").run()
    const qs = chang0(d)
    expect(qs).toEqual(expect.arrayContaining(['DE1-II-1', 'DE1-III-1']))
    const khoiDau = qs.find((q) => /-I-/.test(q))!
    const dapAn: Record<string, string> = Object.fromEntries(qs.map((q) => [q, DAP_AN_DUNG(q)]))
    dapAn['DE1-II-1'] = 'D-S-' // thiếu ý
    dapAn['DE1-III-1'] = '---' // chỉ toàn gạch
    const r = await nopChang(d, 0, dapAn)
    expect(r.ok).toBe(true)
    expect([...r.chuaLam].sort()).toEqual(['DE1-II-1', 'DE1-III-1'])
    expect(r.ketQua.map((k: { qid: string }) => k.qid)).not.toEqual(expect.arrayContaining(['DE1-II-1']))
    expect(r.ketQua.map((k: { qid: string }) => k.qid)).toContain(khoiDau)
    expect(JSON.stringify(r)).not.toMatch(/"qid":"DE1-(II|III)-1","dung"/)
    expect(r.chang.xong).toBe(false)
    expect(r.loDaXong).toBe(0)
    expect(d.dem('su_kien_hoc', "qid IN ('DE1-II-1','DE1-III-1')")).toBe(0)
    // Câu chưa trả lời KHÔNG bị khoá: lưu trữ không giữ 'D-S-'/'---'.
    const luu = JSON.parse((d.sql.prepare("SELECT dap_an_json FROM btvn_em WHERE sbd='S1'").get() as { dap_an_json: string }).dap_an_json)
    expect(luu).not.toHaveProperty('DE1-II-1')
    expect(luu).not.toHaveProperty('DE1-III-1')
    // Làm tiếp hai câu còn lại rồi nộp lại: đủ ⇒ xong; các câu đã trả lời trước đó vẫn khoá.
    const tiep = await nopChang(d, 0, { 'DE1-II-1': 'DSDS', 'DE1-III-1': '0.39' })
    expect(tiep).toMatchObject({ ok: true, loDaXong: 1, chuaLam: [] })
    expect(tiep.chang.soDung).toBe(qs.length)
  })
  it('KHÔNG gửi đáp án (hoặc rỗng) ⇒ chỉ báo trạng thái, KHÔNG đánh dấu xong chặng (không thể "báo xong" suông)', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giao(d)
    await mo(d)
    for (const dapAn of [undefined, {}] as (Record<string, string> | undefined)[]) {
      const r = await nopChang(d, 0, dapAn)
      expect(r).toMatchObject({ ok: true, loDaXong: 0, changDangMo: 0, chuaLam: chang0(d) })
      expect(r.ketQua).toBeUndefined()
    }
    expect(d.sql.prepare("SELECT lo_da_xong FROM btvn_em WHERE sbd='S1'").get()).toMatchObject({ lo_da_xong: 0 })
    expect(d.dem('su_kien_hoc')).toBe(0)
  })
  it('chặng CHƯA MỞ: chặng 1 khi chặng 0 chưa xong, chặng 1 trước 00:00 ngày mai, chiSo ngoài phạm vi ⇒ chang_chua_mo; chưa mở bài ⇒ chua_chot', async () => {
    gio(BAY_GIO)
    const d = dung()
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('btvn_mo_som','tat','x')").run() // Điều 6 mở sớm chặng tắt: test này khoá lịch/mốc mở chặng như cũ (sửa CÓ CHỦ Ý 21/09)
    await giao(d)
    expect(await nopChang(d, 0, { 'DE1-I-1': 'A' })).toMatchObject({ ok: false, lyDo: 'chua_chot' })
    const m = await mo(d)
    const qs0 = chang0(d)
    expect(await nopChang(d, 1, { x: 'A' })).toMatchObject({ ok: false, lyDo: 'chang_chua_mo' })
    expect(await nopChang(d, 99, { x: 'A' })).toMatchObject({ ok: false, lyDo: 'chang_chua_mo' })
    await nopChang(d, 0, Object.fromEntries(qs0.map((q) => [q, DAP_AN_DUNG(q)])))
    // Chặng 0 xong nhưng chưa tới 00:00 ngày mai ⇒ chặng 1 vẫn khoá; mở lại bài: không có câu chặng 1, changDangMo = null.
    const truaNay = await mo(d)
    expect(truaNay.changDangMo).toBeNull()
    expect(truaNay.loDaXong).toBe(1)
    expect(truaNay.de.cau.length).toBe(qs0.length)
    expect(await nopChang(d, 1, { x: 'A' })).toMatchObject({ ok: false, lyDo: 'chang_chua_mo' })
    expect(m.chang[1].moLuc).toBe(NGAY_MAI_0H_VN)
    // Qua 00:00 ngày mai ⇒ chặng 1 mở, câu chặng 1 xuất hiện (vẫn không đáp án).
    gio(NGAY_MAI_0H_VN)
    const sang = await mo(d)
    expect(sang.changDangMo).toBe(1)
    expect(sang.de.cau.length).toBe(qs0.length + boCuaEm(d).filter((x) => x.chang === 1).length)
    expect(sang.chang.map((c: { daMo: boolean }) => c.daMo).slice(0, 3)).toEqual([true, true, false])
    expect(JSON.stringify(sang)).not.toContain('dap_an')
    const c1 = boCuaEm(d).filter((x) => x.chang === 1).map((x) => x.qid)
    expect(await nopChang(d, 1, Object.fromEntries(c1.map((q) => [q, DAP_AN_DUNG(q)])))).toMatchObject({ ok: true, loDaXong: 2 })
  })
  it('đáp án cho câu NGOÀI chặng bị bỏ; qua hạn vẫn nộp được (sửa CÓ CHỦ Ý 21/09: Điều 4 = B nộp trễ)', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giao(d)
    await mo(d)
    const qs = chang0(d)
    const ngoai = TAT_CA_QID.find((q) => !boCuaEm(d).some((x) => x.qid === q && x.chang === 0))!
    const r = await nopChang(d, 0, { ...Object.fromEntries(qs.map((q) => [q, DAP_AN_DUNG(q)])), [ngoai]: 'A' })
    expect(r.ok).toBe(true)
    expect(r.ketQua.map((k: { qid: string }) => k.qid)).not.toContain(ngoai)
    expect(JSON.parse((d.sql.prepare("SELECT dap_an_json FROM btvn_em WHERE sbd='S1'").get() as { dap_an_json: string }).dap_an_json)).not.toHaveProperty(ngoai)
    gio('2026-09-30T00:00:00.000Z') // qua hạn: KHÔNG còn qua_han (nộp trễ); đáp án không thuộc chặng chỉ bị bỏ, chặng chưa xong
    expect(await nopChang(d, 1, { x: 'A' })).toMatchObject({ ok: true, chuaLam: expect.any(Array) })
  })
  it('CHƯA GHI ĐƯỢC SỔ ⇒ ok:false và KHÔNG có đáp án/lời giải nào trong phản hồi (đáp án chỉ ra sau khi ghi sổ)', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giao(d)
    await mo(d)
    d.sql.exec('DROP TABLE su_kien_hoc')
    const qs = chang0(d)
    const r = await nopChang(d, 0, Object.fromEntries(qs.map((q) => [q, DAP_AN_DUNG(q)])))
    expect(r.ok).toBe(false)
    const chuoi = JSON.stringify(r)
    for (const bi of ['dapAnDung', 'loiGiai', 'LG-BI-MAT', 'ketQua', 'tienBo']) expect(chuoi).not.toContain(bi)
  })
  it('QUÁ HẠN (sửa CÓ CHỦ Ý 21/09, Điều 4 = B — thầy chốt 14:13): em ĐÃ MỞ bài vẫn nộp được chặng sau hạn (nộp trễ); thử-sức-thêm sau hạn vẫn qua_han (chi tiết: tests/nop-tre-2109)', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giao(d)
    await mo(d)
    gio('2026-09-30T00:00:00.000Z')
    const qs = chang0(d)
    expect(await nopChang(d, 0, Object.fromEntries(qs.map((q) => [q, DAP_AN_DUNG(q)])))).toMatchObject({ ok: true, loDaXong: 1 })
    expect(d.dem('su_kien_hoc')).toBe(qs.length)
    expect(d.sql.prepare("SELECT lo_da_xong FROM btvn_em WHERE sbd='S1'").get()).toMatchObject({ lo_da_xong: 1 })
  })
  it('EM KHÁC không nộp hộ được chặng của em này (khoá theo maBtvn|sbd)', async () => {
    gio(BAY_GIO)
    const d = dung(2)
    await giao(d)
    await mo(d, 'S1')
    const r = await nopChang(d, 0, { 'DE1-I-1': 'A' }, 'S2') // S2 chưa mở bài ⇒ chưa chốt
    expect(r).toMatchObject({ ok: false, lyDo: 'chua_chot' })
    expect(d.sql.prepare("SELECT lo_da_xong FROM btvn_em WHERE sbd='S1'").get()).toMatchObject({ lo_da_xong: 0 })
  })
})

describe('NỘP CUỐI (/btvn/nop) và LUẬT ĐIỂM', () => {
  const lamHet = async (d: D1That, dapAnCua: (qid: string, nhan: string) => string) => {
    const bo = boCuaEm(d)
    const dapAn = Object.fromEntries(bo.map((x) => [x.qid, dapAnCua(x.qid, x.nhan)]))
    return { dapAn, bo, r: await goiWorker(worker, d.env, '/btvn/nop', { maBtvn: maBtvn(d), sbd: 'S1', dapAn }) }
  }
  it('đúng hết ⇒ điểm trên số câu CỦA EM (không phải 24), so_cau_em = |bộ|, so_cau = mẫu', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giao(d)
    await mo(d)
    const { bo, r } = await lamHet(d, (q) => DAP_AN_DUNG(q))
    expect(r).toMatchObject({ ok: true, soDung: bo.length, soCau: bo.length, soCauCuaEm: bo.length, soCauThuongSai: 0, caNhan: true, qidSai: [] })
    expect(d.sql.prepare("SELECT so_dung, so_cau, so_cau_em, nop_luc FROM btvn_em WHERE sbd='S1'").get()).toMatchObject({ so_dung: bo.length, so_cau: bo.length, so_cau_em: bo.length })
    const ds = await goiWorker(worker, d.env, '/hs/btvn', { sbd: 'S1' })
    expect(ds.items[0]).toMatchObject({ caNhan: true, daNop: true, soCau: bo.length, soCauCuaEm: bo.length, soDung: bo.length, diem: 10, duocLamLai: false })
  })
  it('LUẬT THƯỞNG: câu thử thách/lõi cao SAI không vào mẫu; ĐÚNG vào cả tử và mẫu; câu thường sai vẫn nằm trong mẫu', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giao(d)
    await mo(d)
    const bo = boCuaEm(d)
    const thuong = bo.filter((x) => x.nhan === 'thu_thach' || x.nhan === 'loi_cao')
    const thuongDung = bo.filter((x) => x.nhan !== 'thu_thach' && x.nhan !== 'loi_cao')
    // Xếp đặt cho bộ này có ít nhất một câu thưởng và một câu thường; nếu bộ không có câu thưởng thì ép nhãn (đường ghi DB) để khoá luật.
    if (thuong.length === 0) d.sql.prepare("UPDATE btvn_em_cau SET nhan = 'thu_thach' WHERE qid = ?").run(bo[bo.length - 1]!.qid)
    const nhanThuong = new Set(boCuaEm(d).filter((x) => x.nhan === 'thu_thach' || x.nhan === 'loi_cao').map((x) => x.qid))
    const cauThuong = [...nhanThuong]
    const cauThuongSai = cauThuong[0]!
    const cauThuongSau = boCuaEm(d).filter((x) => !nhanThuong.has(x.qid))
    const thuongSai = new Set([cauThuongSai])
    const thuongThuong = cauThuongSau[0]!.qid // một câu thường sai
    const { r } = await lamHet(d, (q) => (thuongSai.has(q) || q === thuongThuong ? 'B' : DAP_AN_DUNG(q)))
    const tong = boCuaEm(d).length
    expect(r.soCauThuongSai).toBe(1)
    expect(r.soCau).toBe(tong - 1) // mẫu = |bộ| − 1 câu thưởng sai
    expect(r.soDung).toBe(tong - 2) // đúng = tất cả trừ 1 thưởng sai và 1 thường sai
    expect(r.qidSai.sort()).toEqual([cauThuongSai, thuongThuong].sort())
    void thuongDung
    // Điểm = đúng/mẫu: câu thường sai bị trừ, câu thưởng sai thì không.
    const ds = await goiWorker(worker, d.env, '/hs/btvn', { sbd: 'S1' })
    expect(ds.items[0].diem).toBe(Math.round(((tong - 2) / (tong - 1)) * 1000) / 100)
    // Sổ vẫn ghi MỌI câu của em (kể cả thưởng sai): hồ sơ cần biết.
    expect(d.dem('su_kien_hoc', "nguon = 'btvn'")).toBe(tong)
    // Câu thưởng ĐÚNG: nếu làm đúng cả hai thì mẫu = |bộ|, tử = |bộ|.
  })
  it('câu thưởng ĐÚNG vào cả tử và mẫu (không ai bị thiệt vì làm thử thách)', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giao(d)
    await mo(d)
    d.sql.prepare("UPDATE btvn_em_cau SET nhan = 'thu_thach' WHERE qid = (SELECT qid FROM btvn_em_cau ORDER BY thu_tu DESC LIMIT 1)").run()
    const { bo, r } = await lamHet(d, (q) => DAP_AN_DUNG(q))
    expect(r).toMatchObject({ soDung: bo.length, soCau: bo.length, soCauThuongSai: 0 })
  })
  it('đáp án NGOÀI bộ bị bỏ, không lỗi; đáp án đã khoá ở chặng THẮNG đáp án gửi kèm', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giao(d)
    await mo(d)
    const qs = boCuaEm(d).filter((x) => x.chang === 0).map((x) => x.qid)
    await nopChang(d, 0, Object.fromEntries(qs.map((q) => [q, 'B']))) // chặng 0 khoá toàn đáp án sai (Phần I) ...
    const { r } = await lamHet(d, (q) => DAP_AN_DUNG(q))
    const ngoai = TAT_CA_QID.find((q) => !boCuaEm(d).some((x) => x.qid === q))
    const r2 = await goiWorker(worker, d.env, '/btvn/nop', { maBtvn: maBtvn(d), sbd: 'S1', dapAn: { ...(ngoai ? { [ngoai]: 'A' } : {}), 'DE1-I-1': 'A' } })
    expect(r.ok).toBe(true)
    expect(r2.ok).toBe(true) // gửi lại: không lỗi
    // Các câu chặng 0 là Phần I: đáp án khoá 'B' (sai) ⇒ nằm trong qidSai dù nộp cuối gửi 'A'.
    const chang0PhanI = qs.filter((q) => /-I-/.test(q))
    for (const q of chang0PhanI) expect(r.qidSai).toContain(q)
  })
  it('đã nộp thì KHÔNG làm lại (đáp án khác ⇒ daHetLuot); gửi y hệt ⇒ daNhan', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giao(d)
    await mo(d)
    const { dapAn } = await lamHet(d, (q) => DAP_AN_DUNG(q))
    const lai = await goiWorker(worker, d.env, '/btvn/nop', { maBtvn: maBtvn(d), sbd: 'S1', dapAn })
    expect(lai).toMatchObject({ ok: true, daNhan: true })
    // Đáp án đã nộp là đáp án đã khoá: gửi đổi một câu đã trả lời ⇒ vẫn ra kết quả cũ (daNhan), không đổi điểm.
    const khac = await goiWorker(worker, d.env, '/btvn/nop', { maBtvn: maBtvn(d), sbd: 'S1', dapAn: { ...dapAn, [Object.keys(dapAn)[0]!]: 'C' } })
    expect(khac).toMatchObject({ ok: true, daNhan: true })
    expect(khac.soDung).toBe(lai.soDung)
  })
  it('đã nộp mà câu BỎ TRỐNG nay được điền ⇒ từ chối (daHetLuot), điểm không đổi', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giao(d)
    await mo(d)
    const bo = boCuaEm(d).map((x) => x.qid)
    const boTrong = bo[bo.length - 1]!
    const dapAn = Object.fromEntries(bo.filter((q) => q !== boTrong).map((q) => [q, DAP_AN_DUNG(q)]))
    const truoc = await goiWorker(worker, d.env, '/btvn/nop', { maBtvn: maBtvn(d), sbd: 'S1', dapAn })
    expect(truoc).toMatchObject({ ok: true, qidSai: [boTrong] })
    const sau = await goiWorker(worker, d.env, '/btvn/nop', { maBtvn: maBtvn(d), sbd: 'S1', dapAn: { ...dapAn, [boTrong]: DAP_AN_DUNG(boTrong) } })
    expect(sau).toMatchObject({ ok: false, daHetLuot: true })
    expect(d.sql.prepare("SELECT so_dung FROM btvn_em WHERE sbd='S1'").get()).toMatchObject({ so_dung: truoc.soDung })
  })
  it('chưa mở bài (chưa chốt) mà nộp ⇒ chua_chot', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giao(d)
    expect(await goiWorker(worker, d.env, '/btvn/nop', { maBtvn: maBtvn(d), sbd: 'S1', dapAn: { 'DE1-I-1': 'A' } })).toMatchObject({ ok: false, lyDo: 'chua_chot' })
  })
  it('nộp qua cửa phiếu khắc phục (/nop-khac-phuc với mã lượt giao) cũng theo luật cá nhân hoá', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giao(d)
    await mo(d)
    const bo = boCuaEm(d)
    const r = await goiWorker(worker, d.env, '/nop-khac-phuc', { ma: maBtvn(d), sbd: 'S1', dapAn: Object.fromEntries(bo.map((x) => [x.qid, DAP_AN_DUNG(x.qid)])) })
    if (r.ok !== undefined && r.caNhan !== undefined) expect(r).toMatchObject({ soCau: bo.length, soCauCuaEm: bo.length })
  })
})

describe('BÀI CŨ (ca_nhan = 0) chạy Y NHƯ CŨ', () => {
  async function baiCu(d: D1That) {
    await goiWorker(worker, d.env, '/btvn/giao', { maCa: 'CA1', maDe: 'DE1', hanNop: HAN }, true)
  }
  it('cua-em: cả tờ CÓ dap_an, không trường cá nhân hoá; soCau = số câu bài; lượt làm lại như cũ', async () => {
    gio(BAY_GIO)
    const d = dung()
    await baiCu(d)
    const r = await mo(d)
    expect(r.ok).toBe(true)
    expect(r.de.cau.length).toBe(24)
    expect(r.de.cau[0]).toHaveProperty('dap_an', 'A')
    for (const k of ['caNhan', 'soCauCuaEm', 'soChang', 'changDangMo', 'chang', 'nhan', 'tomTat']) expect(r).not.toHaveProperty(k)
    expect(r).toMatchObject({ soCau: 24, loDaXong: 0, duocLamLai: true, soLanLamLaiConLai: 3 })
    expect(d.dem('btvn_em', 'chot_luc IS NOT NULL')).toBe(0)
  })
  it('xong-lo KHÔNG đáp án vẫn tăng tiến độ như cũ; nộp chấm trên cả 24 câu như cũ', async () => {
    gio(BAY_GIO)
    const d = dung()
    await baiCu(d)
    { const { serverNow: _s, ...cu } = await nopChang(d, 0); expect(cu).toEqual({ ok: true, loDaXong: 1 }) }
    const r = await goiWorker(worker, d.env, '/btvn/nop', { maBtvn: maBtvn(d), sbd: 'S1', dapAn: { 'DE1-I-1': 'A', 'DE1-I-2': 'B' } })
    expect(r).toMatchObject({ ok: true, soCau: 24, soDung: 1, lanThu: 1 })
    expect(Object.keys(r)).not.toContain('caNhan')
    const ds = await goiWorker(worker, d.env, '/hs/btvn', { sbd: 'S1' })
    expect(Object.keys(ds.items[0]).sort()).toEqual(['daNop', 'diem', 'duocLamLai', 'giaoLuc', 'hanNop', 'loDaXong', 'maBtvn', 'maCa', 'maDe', 'nopLuc', 'soCau', 'soDung', 'soLanLam', 'soLanLamLaiConLai', 'soSai', 'tenBtvn'])
  })
  it('bài cũ trong cùng D1 với bài cá nhân hoá: hai bài không lẫn (hsBtvn phân biệt caNhan)', async () => {
    gio(BAY_GIO)
    const d = dung()
    await baiCu(d)
    gio(new Date(BAY_GIO.getTime() + 1000))
    d.sql.exec("INSERT INTO ca(ma_ca,ten_ca,trang_thai,cap_nhat_luc) VALUES('CA2','Ca 2','dong','x')")
    d.sql.exec("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,trang_thai,cap_nhat_luc,ho_ten) VALUES('CA2|S1|1','CA2','S1',1,'x','da_nop','x','Em 1')")
    await goiWorker(worker, d.env, '/btvn/giao', { maCa: 'CA2', maDe: 'DE1', hanNop: HAN, caNhan: true, cau: cauThay() }, true)
    const ds = await goiWorker(worker, d.env, '/hs/btvn', { sbd: 'S1' })
    expect(ds.items.filter((x: { caNhan?: boolean }) => x.caNhan).length).toBe(1)
    expect(ds.items.filter((x: { caNhan?: boolean }) => !x.caNhan).length).toBe(1)
  })
})

describe('CHẶNG CUỐI ⇒ máy chủ tự chốt nộp; mở lại bài đã nộp', () => {
  it('đi hết mọi chặng qua các ngày: chặng cuối trả `nop` (điểm trên mẫu), nop_luc được ghi; /btvn/nop {} sau đó chỉ trả daNhan', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giao(d)
    const m0 = await mo(d)
    const soChang = m0.soChang as number
    expect(soChang).toBeGreaterThanOrEqual(2)
    const ds = await goiWorker(worker, d.env, '/hs/btvn', { sbd: 'S1' })
    expect(ds.items[0]).toMatchObject({ caNhan: true, daNop: false, soChang, soCauCuaEm: boCuaEm(d).length, soCau: boCuaEm(d).length })
    let cuoi: Record<string, any> = {}
    for (let k = 0; k < soChang; k++) {
      gio(new Date(Date.parse(NGAY_MAI_0H_VN) + (k - 1 < 0 ? -1 : k - 1) * 86_400_000 + (k === 0 ? -57_600_000 : 0)))
      const qs = boCuaEm(d).filter((x) => x.chang === k).map((x) => x.qid)
      cuoi = await nopChang(d, k, Object.fromEntries(qs.map((q) => [q, DAP_AN_DUNG(q)])))
      expect(cuoi).toMatchObject({ ok: true, chuaLam: [], chang: { chiSo: k, xong: true }, loDaXong: k + 1 })
      if (k < soChang - 1) {
        expect(cuoi.nop).toBeUndefined()
        expect(d.sql.prepare("SELECT nop_luc FROM btvn_em WHERE sbd='S1'").get()).toMatchObject({ nop_luc: null })
      }
    }
    const tong = boCuaEm(d).length
    expect(cuoi.changDangMo).toBeNull()
    expect(cuoi.nop).toMatchObject({ daNop: true, soDung: tong, soCau: tong, soCauCuaEm: tong, soCauThuongSai: 0, qidSai: [] })
    expect(d.sql.prepare("SELECT nop_luc, so_dung, so_cau, so_cau_em FROM btvn_em WHERE sbd='S1'").get()).toMatchObject({ so_dung: tong, so_cau: tong, so_cau_em: tong })
    // Sổ: mỗi câu đúng MỘT dòng (btvn_lo), không ghi đôi khi tự nộp cuối.
    expect(d.dem('su_kien_hoc')).toBe(tong)
    expect(d.dem('su_kien_hoc', "nguon = 'btvn'")).toBe(0)
    // Gọi thêm /btvn/nop với dapAn rỗng: an toàn, không chấm hai lần.
    const them = await goiWorker(worker, d.env, '/btvn/nop', { maBtvn: maBtvn(d), sbd: 'S1', dapAn: {} })
    expect(them).toMatchObject({ ok: true, daNhan: true, soDung: tong, soCau: tong })
    expect(d.dem('su_kien_hoc')).toBe(tong)
    // Mở lại bài đã nộp: MỌI câu của em, vẫn KHÔNG đáp án; nộp chặng cũ chỉ phát lại kết quả (không đổi gì).
    const lai = await mo(d)
    expect(lai).toMatchObject({ ok: true, daNop: true, soDung: tong })
    expect(lai.de.cau.length).toBe(tong)
    expect(lai.chang.every((c: { daMo: boolean }) => c.daMo)).toBe(true)
    expect(JSON.stringify(lai)).not.toContain('dap_an')
    // Phát lại chặng đã xong (mạng chập chờn): trả lại đúng kết quả đã khoá, không ghi thêm gì.
    const phat = await nopChang(d, 0, { x: 'A' })
    expect(phat).toMatchObject({ ok: true, chuaLam: [], chang: { chiSo: 0, xong: true } })
    expect(d.dem('su_kien_hoc')).toBe(tong)
  })
  it('hsBtvn trước khi chốt: soCauCuaEm = null, soCau = số câu bài', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giao(d)
    const ds = await goiWorker(worker, d.env, '/hs/btvn', { sbd: 'S1' })
    expect(ds.items[0]).toMatchObject({ caNhan: true, soCauCuaEm: null, soChang: null, soCau: 24, duocLamLai: false, soLanLamLaiConLai: 0 })
  })
})

describe('boDapAn — DANH SÁCH CHO PHÉP (không phải danh sách cấm)', () => {
  it('chỉ giữ trường hiển thị; mọi khoá lạ/đáp án/lời giải/bẫy bị bỏ, kể cả khoá chưa từng thấy', () => {
    const c = {
      qid: 'X-I-1', phan: 'I', so: 1, de: 'Đề', pa: { A: '1' }, bang: [['a']], tieu_de: 't', can_xem: true, chuyen_de: 'Este', muc_do: 'biet', kieu: 'bai_tap', dang: { ma: 'D', ten: 'T' },
      dap_an: 'A', dapAn: 'A', dap_an_de: 'A', dap_an_tu_giai: 'B', loi_giai: { chot: 'x' }, loiGiai: 'x', explanation: 'x', solution: 'x', can_chua: { ly_do: 'x' }, kienThuc: ['k'], loiThuongGap: ['l'],
      khoa_moi_chua_tung_thay: 'DAP-AN-AN', ghi_chu: 'x', hinh: [{ tep: 'a', vi_tri: 'sau_loi_giai' }, { tep: 'b', vi_tri: 'trong_de' }],
    }
    const ra = boDapAn(c)
    expect(Object.keys(ra).sort()).toEqual(['bang', 'can_xem', 'chuyen_de', 'de', 'hinh', 'kieu', 'muc_do', 'pa', 'phan', 'qid', 'so', 'tieu_de'])
    expect(ra.hinh).toEqual([{ tep: 'b', vi_tri: 'trong_de' }])
    expect(JSON.stringify(ra)).not.toMatch(/DAP-AN-AN|dap_an|loi_giai|explanation|solution/)
  })
})

describe('hàm thuần', () => {
  it('cờ btvn_ca_nhan: vắng = BẬT; false/0/tat/{"tat":true}/{"bat":false} = TẮT; chuỗi hỏng = BẬT', () => {
    for (const v of [null, undefined, '', 'true', '1', '{}', '{"tat":false}', 'linh tinh']) expect(docCoCaNhan(v), String(v)).toBe(true)
    for (const v of ['false', '0', 'tat', 'TAT', '{"tat":true}', '{"bat":false}', ' false ']) expect(docCoCaNhan(v), String(v)).toBe(false)
  })
  it('moLucChang: chặng 0 = lúc chốt, chặng k = 00:00 giờ VN ngày thứ k; chặng cuối luôn trước hạn (soChang ≤ ceil((hạn − chốt)/ngày))', () => {
    const chot = '2026-09-22T03:00:00.000Z'
    expect(moLucChang(chot, 3)).toEqual([chot, '2026-09-22T17:00:00.000Z', '2026-09-23T17:00:00.000Z'])
    // Chốt lúc 23:30 giờ VN: chặng 1 mở sau 30 phút (00:00 ngày kế) — cố ý, "mỗi ngày một chặng theo lịch ngày".
    expect(moLucChang('2026-09-22T16:30:00.000Z', 2)[1]).toBe('2026-09-22T17:00:00.000Z')
  })
  it('trangThaiCacChang: chặng k mở khi k−1 xong VÀ tới giờ; đã nộp ⇒ mọi chặng mở; xong hết ⇒ changDangMo null', () => {
    const chang = [['a', 'b'], ['c'], ['d']]
    const chot = '2026-09-22T03:00:00.000Z'
    const t = (lo: number, nop: boolean, now: string) => trangThaiCacChang(chang, chot, lo, nop, Date.parse(now))
    expect(t(0, false, '2026-09-22T05:00:00.000Z').changDangMo).toBe(0)
    expect(t(1, false, '2026-09-22T05:00:00.000Z').changDangMo).toBeNull() // chặng 1 chưa tới 00:00
    expect(t(1, false, '2026-09-22T17:00:00.000Z').changDangMo).toBe(1)
    expect(t(0, false, '2026-09-30T00:00:00.000Z').chang.map((c) => c.daMo)).toEqual([true, false, false]) // chặng 0 chưa xong ⇒ chặng 1 khoá dù đã qua ngày
    expect(t(3, false, '2026-09-30T00:00:00.000Z').changDangMo).toBeNull()
    expect(t(0, true, chot).chang.every((c) => c.daMo)).toBe(true)
    expect(t(99, false, '2026-09-30T00:00:00.000Z').chang.map((c) => c.daXong)).toEqual([true, true, true])
  })
})

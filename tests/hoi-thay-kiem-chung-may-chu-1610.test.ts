// @vitest-environment node
// SQL thật trong SQLite: khoá lần đầu, rollback, nguồn/phiên bản và quyền. Không giả là runtime D1.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { taoD1That, serialiseD1, type D1That } from './_d1-that'
import { Q, seedChua } from './_chua-cau-sai-fixture'
import { hsMoKiemHoiThay, hsNopKiemHoiThay, docCauHoiThayDenHan, SQL_HOI_THAY_KIEM } from '../server/src/hoi-thay-kiem-chung'
import { gameToken } from '../server/src/game-v2-auth'
import { docCauKhoHienTai } from '../server/src/cau-y-ds'
import { docNguonKiemHoiThay } from '../server/src/hoi-thay-kiem-chung-nguon'
import { SQL_GOI7 } from '../server/src/goi-bai-7-schema'
import { SQL_LICH_KIEM_HOI_THAY, lichKiemHoiThayCongKhai } from '../server/src/hoi-thay-kiem-chung-metadata'
import { ghiSuKien, ngayVn } from '../server/src/su-kien-hoc'

let d: D1That, token: string
const HOM_NAY = Date.parse('2026-10-16T03:00:00.000Z')
const mo = () => hsMoKiemHoiThay(d.env, { token, qid: Q }) as Promise<any>
function rieng(id: string) { return JSON.parse((d.sql.prepare('SELECT snapshot_json FROM hoi_thay_kiem WHERE id=?').get(id) as any).snapshot_json) }
const nop = (id: string, tra: string, attempt = `nop-${id}`) => hsNopKiemHoiThay(d.env, { token, phienId: id, attemptId: attempt, traLoi: tra }) as Promise<any>
async function doiCau(f: (q: any) => void) {
  const row = d.sql.prepare('SELECT json FROM game_v2_question WHERE qid=?').get(Q) as any
  const q = JSON.parse(row.json); f(q)
  d.sql.prepare('UPDATE game_v2_question SET json=?,version=?,content_group=? WHERE qid=?').run(JSON.stringify(q), q.version, q.group, Q)
}

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(HOM_NAY)
  d = taoD1That(); token = await seedChua(d.env)
})
afterEach(() => { d.sql.close(); vi.useRealTimers(); vi.restoreAllMocks() })

describe('Hỏi thầy · kiểm chứng do máy chủ giữ', () => {
  it('migration và DDL runtime cùng cấu trúc, chỉ bảng mới; không ALTER/DROP/sửa luật chấm', async () => {
    const runtime = new DatabaseSync(':memory:')
    for (const s of SQL_HOI_THAY_KIEM) runtime.exec(s)
    expect(runtime.prepare("PRAGMA table_info('hoi_thay_kiem')").all()).toEqual(d.sql.prepare("PRAGMA table_info('hoi_thay_kiem')").all())
    expect(runtime.prepare("PRAGMA index_list('hoi_thay_kiem')").all()).toEqual(d.sql.prepare("PRAGMA index_list('hoi_thay_kiem')").all())
    for (const n of ['htk_em_goc', 'htk_em_han', 'htk_mot_cau_mo', 'htk_lan_nop']) expect(runtime.prepare(`PRAGMA index_info('${n}')`).all()).toEqual(d.sql.prepare(`PRAGMA index_info('${n}')`).all())
    runtime.close()
    expect(readFileSync('server/migration-z-1610-hoi-thay.sql', 'utf8')).not.toMatch(/\b(?:ALTER|DROP|DELETE|UPDATE)\b/i)
  })
  it('mở/resume một câu đúng nguồn, không lộ đáp án, lời giải hay snapshot', async () => {
    const a = await mo(), b = await mo()
    expect(a.ok).toBe(true); expect(a.trangThai).toBe('co_cau'); expect(a.phienId).toBe(b.phienId)
    expect(a.cau).toMatchObject({ phan: 'III', soO: expect.any(Number) })
    expect(d.dem('hoi_thay_kiem')).toBe(1)
    const chu = JSON.stringify(a)
    expect(chu).not.toMatch(/"(?:correct|solution|dapAn|dap_an|reviewed|version|snapshot_json|khoa)"/)
    expect(a.cau.qid.startsWith('hk:')).toBe(true)
  })
  it('token giả, SBD trần, đọc/nộp phiên của em khác đều bị từ chối', async () => {
    expect((await hsMoKiemHoiThay(d.env, { sbd: 'HS1', qid: Q })).ok).toBe(false)
    expect((await hsMoKiemHoiThay(d.env, { token: 'gia.gia', qid: Q })).ok).toBe(false)
    const a = await mo()
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('HS2','Hai','12','x','x')").run()
    const khac = await gameToken(d.env, 'HS2')
    expect((await hsNopKiemHoiThay(d.env, { token: khac, phienId: a.phienId, attemptId: 'khac', traLoi: rieng(a.phienId).q.correct })).ok).toBe(false)
    expect(d.dem('su_kien_hoc', "nguon='chua_loi'")).toBe(0)
  })
  it('giữ lần trả lời đầu, retry cùng payload trả đúng receipt; đổi payload/đổi phiên không sửa kết quả', async () => {
    const a = await mo(), dap = rieng(a.phienId).q.correct
    const n = await nop(a.phienId, dap, 'a1'), lai = await nop(a.phienId, dap, 'a1')
    expect(n).toMatchObject({ ok: true, dung: true, trangThai: 'da_tu_lam' })
    expect(lai).toMatchObject({ ...n, idempotent: true })
    expect((await nop(a.phienId, '999', 'a1')).ok).toBe(false)
    expect((await nop(a.phienId, '999', 'a2')).ok).toBe(false)
    expect(d.dem('su_kien_hoc', "nguon='chua_loi'")).toBe(1)
    expect(await mo()).toMatchObject({ ok: true, trangThai: 'cho_kiem_lai' })
  })
  it('gợi ý co_ho_so=0 vẫn assisted; dấu hỗ trợ mới trong lúc làm cũng không nâng thạo', async () => {
    d.sql.prepare("INSERT INTO loi_giai_hoi(sbd,qid,luc,co_ho_so,nguon) VALUES('HS1',?,?,0,'on_lai:tro_ly')").run(Q, new Date(HOM_NAY - 60000).toISOString())
    const a = await mo(); const n = await nop(a.phienId, rieng(a.phienId).q.correct)
    expect(n).toMatchObject({ ok: true, dung: true, trangThai: 'cho_kiem_lai' })
    expect(d.sql.prepare("SELECT assistance FROM su_kien_hoc WHERE nguon='chua_loi'").get()).toMatchObject({ assistance: 'assisted' })
    vi.setSystemTime(HOM_NAY + 25 * 3600000)
    const b = await mo()
    d.sql.prepare("INSERT INTO loi_giai_hoi(sbd,qid,luc,co_ho_so,nguon) VALUES('HS1',?,?,0,'on_lai:tro_ly')").run(Q, new Date(Date.now()).toISOString())
    expect((await nop(b.phienId, rieng(b.phienId).q.correct)).trangThai).toBe('cho_kiem_lai')
  })
  it('chỉ mở hộp chưa có nội dung trợ giúp không làm lần kiểm sau trở thành assisted', async () => {
    d.sql.prepare("INSERT INTO loi_giai_hoi(sbd,qid,luc,co_ho_so,nguon) VALUES('HS1',?,?,0,'on_lai')").run(Q, new Date(Date.now()).toISOString())
    const a = await mo()
    expect((await nop(a.phienId, rieng(a.phienId).q.correct)).trangThai).toBe('da_tu_lam')
    expect(d.sql.prepare("SELECT assistance FROM su_kien_hoc WHERE nguon='chua_loi'").get()).toMatchObject({ assistance: 'none' })
  })
  it('học liệu đầy đủ đúng bản không đọc R2/kho dự phòng trên đường kiểm', async () => {
    const spy = vi.spyOn(d.env.DE, 'get')
    const a = await mo(); await nop(a.phienId, rieng(a.phienId).q.correct)
    expect(spy).not.toHaveBeenCalled()
  })
  it('lời thầy cũ không đi cùng câu kiểm độc lập; lời mới được giữ ở phiên assisted và trạng thái chờ', async () => {
    const cu = HOM_NAY - 25 * 3600000
    d.sql.prepare(`INSERT INTO hoi_thay_can_giup(sbd,qid,trang_thai,loi_thay,loi_luc,doc_luc,gui_luc,cap_nhat_luc)
      VALUES('HS1',?,'da_ho_tro','Lời thầy cũ',?,?,?,?)`).run(Q, cu, cu, cu, cu)
    d.sql.prepare("INSERT INTO loi_giai_hoi(sbd,qid,nguon,luc,co_ho_so) VALUES('HS1',?,'hoi_thay:thay_go',?,0)").run(Q, new Date(cu).toISOString())
    const a = await mo(), resume = await mo()
    expect(a).toMatchObject({ trangThai: 'co_cau' }); expect(a).not.toHaveProperty('loiThay')
    expect(resume.phienId).toBe(a.phienId); expect(resume).not.toHaveProperty('loiThay')
    expect((await nop(a.phienId, rieng(a.phienId).q.correct)).trangThai).toBe('da_tu_lam')
    expect(await mo()).toMatchObject({ trangThai: 'cho_kiem_lai', loiThay: 'Lời thầy cũ' })
    vi.setSystemTime(HOM_NAY + 25 * 3600000)
    d.sql.prepare("UPDATE hoi_thay_can_giup SET loi_thay='Lời mới',loi_luc=?,doc_luc=0,revision=revision+1 WHERE sbd='HS1' AND qid=?").run(Date.now(), Q)
    const b = await mo(), lai = await mo()
    expect(b).toMatchObject({ trangThai: 'co_cau', loiThay: 'Lời mới' })
    expect(lai).toMatchObject({ trangThai: 'co_cau', phienId: b.phienId, loiThay: 'Lời mới' })
    expect((await nop(b.phienId, rieng(b.phienId).q.correct)).trangThai).toBe('cho_kiem_lai')
  })
  it('lịch kiểm trực tiếp vẫn có khi chưa có đợt sửa; hôm sau mở kiểm không cần hỏi AI lại', async () => {
    // Em từng làm ĐÚNG câu gốc, sau đó hỏi để hiểu sâu hơn: không có đợt lỗi để gắn nút vào.
    d.sql.prepare("UPDATE su_kien_hoc SET ket_qua=1 WHERE khoa='sai1'").run()
    d.sql.prepare("DELETE FROM chua_loi_dot WHERE sbd='HS1'").run()
    expect(d.dem('chua_loi_dot')).toBe(0)
    d.sql.prepare("INSERT INTO loi_giai_hoi(sbd,qid,luc,co_ho_so,nguon) VALUES('HS1',?,?,0,'on_lai:tro_ly')").run(Q, new Date(Date.now()).toISOString())
    const a = await mo(); await nop(a.phienId, rieng(a.phienId).q.correct)
    vi.setSystemTime(HOM_NAY + 25 * 3600000)
    const rows = (await d.env.DB.prepare(SQL_LICH_KIEM_HOI_THAY).bind('HS1', Date.now()).all<Record<string, unknown>>()).results
    expect(lichKiemHoiThayCongKhai(rows)).toMatchObject([{ qid: Q, trangThai: 'den_han', phan: 'III' }])
    const markers = d.dem('loi_giai_hoi'), b = await mo()
    expect(b.trangThai).toBe('co_cau')
    expect((await nop(b.phienId, rieng(b.phienId).q.correct)).trangThai).toBe('da_tu_lam')
    expect(d.dem('loi_giai_hoi')).toBe(markers)
    expect(JSON.stringify(lichKiemHoiThayCongKhai(rows))).not.toMatch(/correct|solution|snapshot|dapAn/)
  })
  it('hai ngày ôn chung đúng bản đóng lịch kiểm dù chỉ có một receipt HTK có trợ giúp', async () => {
    d.sql.prepare("INSERT INTO loi_giai_hoi(sbd,qid,luc,co_ho_so,nguon) VALUES('HS1',?,?,0,'on_lai:tro_ly')").run(Q, new Date(Date.now()).toISOString())
    const a = await mo(); await nop(a.phienId, rieng(a.phienId).q.correct)
    for (const [i, q] of [Q, `${Q}~ss1`].entries()) {
      vi.setSystemTime(HOM_NAY + (i + 1) * 25 * 3600000)
      expect((await ghiSuKien(d.env, [{ nguon: 'on_lai', maNguon: `on_lai:${ngayVn(Date.now())}`, sbd: 'HS1', qid: q,
        cauVersion: 'v1', lan: 1, ketQua: 1, assistance: 'none', visibility: 'released', purpose: 'repair',
        luc: new Date(Date.now()).toISOString(), raw: { tc: Q } }])).ok).toBe(true)
    }
    expect(await mo()).toMatchObject({ ok: true, trangThai: 'da_xac_nhan' })
    expect(d.dem('hoi_thay_kiem')).toBe(1)
    expect(await docCauHoiThayDenHan(d.env, 'HS1')).toEqual([])
    expect(d.sql.prepare("SELECT trang_thai_day FROM chua_loi_dot WHERE sbd='HS1'").get()).toMatchObject({ trang_thai_day: 'da_tu_sua' })
  })
  it('đúng ở 2 ngày độc lập đóng theo replay sẵn có; không đổi điểm/P hay tự tạo quota', async () => {
    await d.env.DB.batch(SQL_GOI7.map(s => d.env.DB.prepare(s)))
    const diem = d.chup('luot'), p = d.chup('omni_p_vkn'), goi = d.chup('goi_bai_7')
    const a = await mo(); await nop(a.phienId, rieng(a.phienId).q.correct)
    vi.setSystemTime(HOM_NAY + 25 * 3600000)
    expect(await docCauHoiThayDenHan(d.env, 'HS1')).toEqual([Q])
    const b = await mo(); expect(b.phienId).not.toBe(a.phienId)
    expect(rieng(b.phienId).khoa).not.toBe(rieng(a.phienId).khoa)
    await nop(b.phienId, rieng(b.phienId).q.correct)
    expect(await mo()).toMatchObject({ ok: true, trangThai: 'da_xac_nhan' })
    vi.setSystemTime(HOM_NAY + 50 * 3600000)
    expect(await docCauHoiThayDenHan(d.env, 'HS1')).toEqual([])
    expect(d.chup('luot')).toBe(diem); expect(d.chup('omni_p_vkn')).toBe(p); expect(d.chup('goi_bai_7')).toBe(goi)
  })
  it('sai hai bản khác được đưa vào hàng cần thầy, giữ các receipt riêng', async () => {
    const a = await mo(); expect((await nop(a.phienId, '999')).trangThai).toBe('cho_kiem_lai')
    vi.setSystemTime(HOM_NAY + 25 * 3600000)
    const b = await mo(); expect((await nop(b.phienId, '999')).trangThai).toBe('can_thay')
    expect(d.dem('hoi_thay_can_giup', "sbd='HS1'")).toBe(1)
    expect(d.dem('hoi_thay_kiem', "trang_thai='da_nop'")).toBe(2)
  })
  it('nguồn bị rút/đổi phiên bản hoặc câu nghi đáp án không bị chấm nhầm', async () => {
    const a = await mo()
    await doiCau(q => { q.version = 'v2' })
    expect(await nop(a.phienId, '999')).toMatchObject({ ok: false, ma: 'CAU_THAY_DOI' })
    expect(d.dem('su_kien_hoc', "nguon='chua_loi'")).toBe(0)
  })
  it('câu đang nghi đáp án không mở kiểm dù em từng gặp và học liệu đã duyệt', async () => {
    d.sql.prepare("INSERT INTO cau_nghi_dap_an(qid,so_lan,so_sai,ty_le_sai,trang_thai,luc) VALUES(?,10,9,0.9,'nghi','x')").run(Q)
    expect((await mo()).ok).toBe(false)
    expect(d.dem('hoi_thay_kiem')).toBe(0)
  })
  it('thu hồi dấu duyệt chen ngay trước batch không ghi receipt hoặc nâng năng lực', async () => {
    const a = await mo(), dap = rieng(a.phienId).q.correct, batch = d.env.DB.batch.bind(d.env.DB)
    let chen = false
    vi.spyOn(d.env.DB, 'batch').mockImplementation(async ds => {
      if (!chen && ds.some(s => /UPDATE hoi_thay_kiem SET trang_thai='da_nop'/.test((s as any)._q ?? ''))) {
        chen = true
        await doiCau(q => { q.reviewed = false })
      }
      return batch(ds)
    })
    expect((await nop(a.phienId, dap)).ok).toBe(false)
    expect(chen).toBe(true)
    expect(d.dem('hoi_thay_kiem', "trang_thai='da_nop'")).toBe(0)
    expect(d.dem('su_kien_hoc', "nguon='chua_loi'")).toBe(0)
  })
  it('học liệu bị sửa sau phát, thiếu nguồn, số sai định dạng và phiên hết hạn không ghi bằng chứng', async () => {
    const a = await mo()
    expect((await nop(a.phienId, 'abc')).ok).toBe(false)
    d.sql.prepare("UPDATE chua_loi_hoc_lieu SET trang_thai='hoc_lieu_hong'").run()
    expect((await nop(a.phienId, '999')).ok).toBe(false)
    vi.setSystemTime(HOM_NAY + 25 * 3600000)
    expect(await nop(a.phienId, '999')).toMatchObject({ ok: false, ma: 'PHIEN_HET_HAN' })
    expect(await mo()).toMatchObject({ ok: true, trangThai: 'cho_nguon' })
    expect(d.dem('su_kien_hoc', "nguon='chua_loi'")).toBe(0)
  })
  it('ghi sổ lỗi rollback cả lần nộp; retry không mất bài và không có đáp án trong lỗi', async () => {
    const a = await mo(), dap = rieng(a.phienId).q.correct
    d.sql.exec("CREATE TRIGGER thu_loi_ghi BEFORE INSERT ON su_kien_hoc WHEN NEW.nguon='chua_loi' BEGIN SELECT RAISE(ABORT,'thu-loi'); END")
    expect(await nop(a.phienId, dap)).toMatchObject({ ok: false, ma: 'CHO_GHI_SO' })
    expect(d.dem('hoi_thay_kiem', "trang_thai='da_nop'")).toBe(0)
    d.sql.exec('DROP TRIGGER thu_loi_ghi')
    expect((await nop(a.phienId, dap)).ok).toBe(true)
    expect(d.dem('su_kien_hoc', "nguon='chua_loi'")).toBe(1)
  })
  it('8 mở và 8 nộp cạnh tranh chỉ tạo một phiên/lần nộp/sự kiện (SQLite giao dịch tuần tự)', async () => {
    serialiseD1(d.env)
    const moNhieu = await Promise.all(Array.from({ length: 8 }, () => mo()))
    expect(moNhieu.every(x => x.ok)).toBe(true)
    expect(new Set(moNhieu.map(x => x.phienId)).size).toBe(1)
    const id = moNhieu[0].phienId, dap = rieng(id).q.correct
    const rs = await Promise.all(Array.from({ length: 8 }, (_, i) => nop(id, i === 0 ? dap : '999', `c-${i}`)))
    expect(rs.filter(x => x.ok && !x.idempotent).length).toBe(1)
    expect(d.dem('hoi_thay_kiem', "trang_thai='da_nop'")).toBe(1)
    expect(d.dem('su_kien_hoc', "nguon='chua_loi'")).toBe(1)
  })
  it('schema mới chưa có trả mềm, không giả đã lưu/đã xác nhận', async () => {
    d.sql.exec('DROP TABLE hoi_thay_kiem')
    expect((await mo()).ok).toBe(false)
    expect((await nop('khong-co', '24')).ok).toBe(false)
  })
  it('fallback song sinh đúng băm và hồ sơ đã duyệt; hết bản nối hàng soạn đang có', async () => {
    d.sql.prepare('DELETE FROM chua_loi_hoc_lieu').run()
    d.objects.set('kho/DH-12-C1-B1.json', { cau: [{ qid: Q, phan: 'III', de: 'Tính M(LiOH), Li=7, O=16, H=1.', dap_an: '24' }] })
    const ht = await docCauKhoHienTai(d.env, Q)
    expect(ht).toBeTruthy()
    d.sql.prepare("INSERT INTO loi_giai_cau(qid,bam,ma_de,dang,lop,cap_nhat_luc) VALUES(?,?,'DH-12-C1-B1','tln','12','x')").run(Q, ht!.bam)
    d.sql.prepare("INSERT INTO loi_giai(bam,qid_mau,dang,trang_thai,r2_khoa,soan_luc) VALUES(?,?,'tln','da_duyet','x','x')").run(ht!.bam, Q)
    d.sql.prepare("INSERT INTO cau_bo_tro(bam,qid_mau,song_sinh_json,cap_nhat_luc) VALUES(?,?,?,'x')").run(ht!.bam, Q, JSON.stringify([{ de: 'Tính M(KOH), K=39, O=16, H=1.', dap_an: '56', nguon: 'may_soan_2_luot' }]))
    const goc = JSON.parse((d.sql.prepare('SELECT json FROM game_v2_question WHERE qid=?').get(Q) as any).json)
    expect((await docNguonKiemHoiThay(d.env, goc)).cau).toHaveLength(1)
    const a = await mo(); expect(a.cau.qid).toBe(`${Q}~ss0`)
    expect((await nop(a.phienId, '56')).dung).toBe(true)
    vi.setSystemTime(HOM_NAY + 25 * 3600000)
    expect((await mo()).trangThai).toBe('cho_nguon')
    expect(d.dem('may_soan_viec')).toBe(1)
  })
})

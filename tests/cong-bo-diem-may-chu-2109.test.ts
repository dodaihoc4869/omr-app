// @vitest-environment node
// LUẬT CÔNG BỐ ĐIỂM ở MÁY CHỦ (Boss 21/09, ưu tiên số 1 của Xem điểm bản 2): ca `cong_bo = 'khong'`, hoặc `ca_lop_xong` mà chưa đóng / chưa đủ lớp nộp ⇒ máy học sinh và phụ huynh KHÔNG được nhận
// điểm, số câu đúng/sai, đáp án đúng, lời giải, phiếu kết quả, ngân hàng đáp án. MỘT nguồn luật (`server/src/cong-bo-diem.ts`) cho mọi lệnh; ba đường (hàm thuần, SQL, `ketQuaCuaEm`) phải ra CÙNG kết quả.
// Lệnh khoá: /hs/lich-su · lệnh lichSuEm · /hs/cau-sai · /hs/cau-da-thi · phieuCuaEm · bài tin phụ huynh/học sinh · thẻ Bộ não. Mảng cũ chỉ BỚT ca chưa công bố; trường mới chỉ-thêm.
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { cheDoCongBo, docTrangThaiCongBo, laSanSangCongBo, SQL_DA_CONG_BO } from '../server/src/cong-bo-diem'
import { hsLichSuCa, ketQuaCuaEm, lichSuEm, phieuCuaEm } from '../server/src/goi-cu'
import { boNaoHoSoNgay } from '../server/src/bo-nao'
import { refreshDailyNews } from '../server/src/parent-news'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

afterEach(() => vi.useRealTimers())

const NOP = '2026-09-21T03:00:00.000Z'
const themCa = (d: D1That, ma: string, congBo: string | null, trangThai = 'mo') =>
  d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,cong_bo,cap_nhat_luc) VALUES(?,?,?,'thi',?,'x')").run(ma, `Ca ${ma}`, trangThai, congBo)
const themLuot = (d: D1That, ma: string, sbd: string, tt = 'da_nop', o: { tong?: number; lan?: number; nop?: string | null } = {}) =>
  d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,nop_luc,trang_thai,cap_nhat_luc,tong,diem_i,diem_ii,diem_iii,ho_ten,dap_an_json) VALUES(?,?,?,?,?,?,?,'x',?,?,?,?,?,?)")
    .run(`${ma}|${sbd}|${o.lan ?? 1}`, ma, sbd, o.lan ?? 1, NOP, o.nop === undefined ? (tt === 'dang_lam' ? null : NOP) : o.nop, tt, tt === 'dang_lam' ? null : (o.tong ?? 7.5), 2.5, 2.5, 2.5, `Em ${sbd}`, JSON.stringify({ phanI: { [`${ma}-I-1`]: 'A' } }))
const themCt = (d: D1That, ma: string, sbd: string, dungSai: number | null = 0) =>
  d.sql.prepare("INSERT INTO chi_tiet_cau(khoa,ma_ca,sbd,lan_thu,phan,so_cau,qid,chuyen_de,muc_do,dap_an_chon,dap_an_dung,dung_sai,giay,cap_nhat_luc) VALUES(?,?,?,1,'I',1,?,'Este','hieu','A','B',?,30,'x')")
    .run(`${ma}|${sbd}|1|I|1`, ma, sbd, `${ma}-I-1`, dungSai)
/** Ngân hàng đáp án của ca: một câu phần I có LỜI GIẢI mang dấu `LG-BI-MAT-<mã ca>` để soi rò rỉ. */
const banKey = (d: D1That, ma: string) =>
  d.objects.set(`key/${ma}.json`, { phanI: [{ id: `${ma}-I-1`, qid: `${ma}-I-1`, so: 1, phan: 'I', text: `Câu hỏi của ca ${ma}`, pa: { A: 'a', B: 'b', C: 'c', D: 'd' }, dapAn: 'B', dap_an: 'B', loiGiai: `LG-BI-MAT-${ma}` }] })
const goi = (d: D1That, duong: string, b: Record<string, unknown>) => goiWorker(worker, d.env, duong, b)

/** Trường: em S1 (+ S2, S3 để dựng "cả lớp") với sáu ca đủ mọi trạng thái công bố. */
function dung(): D1That {
  const d = taoD1That()
  for (const s of ['S1', 'S2', 'S3']) d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,?,'mk','x')").run(s, `Em ${s}`, '12')
  themCa(d, 'CA-NGAY', 'ngay') // công bố ngay
  themCa(d, 'CA-KHONG', 'khong') // không bao giờ
  themCa(d, 'CA-CHUA', 'ca_lop_xong') // S2 còn đang làm ⇒ chưa đủ lớp
  themCa(d, 'CA-DU', 'ca_lop_xong') // cả lớp đã nộp
  themCa(d, 'CA-DONG', 'ca_lop_xong', 'dong') // đã đóng (dù còn người chưa nộp)
  themCa(d, 'CA-TRONG', null) // cong_bo thiếu ⇒ khong
  for (const ma of ['CA-NGAY', 'CA-KHONG', 'CA-CHUA', 'CA-DU', 'CA-DONG', 'CA-TRONG']) {
    themLuot(d, ma, 'S1')
    themCt(d, ma, 'S1', 0)
    banKey(d, ma)
    d.sql.prepare("INSERT INTO phieu(ma,ma_ca,sbd,ho_ten,loai,thu_hoi,luu_luc) VALUES(?,?,'S1','Em S1','ketqua',0,'x')").run(`PH-${ma}`, ma)
    d.objects.set(`phieu/PH-${ma}.json`, { ma: `PH-${ma}`, loai: 'ketqua', phieu: { tieuDe: `Phiếu ${ma}`, cauSai: [1] } })
  }
  themLuot(d, 'CA-CHUA', 'S2', 'dang_lam')
  themLuot(d, 'CA-DU', 'S2')
  themLuot(d, 'CA-DONG', 'S2', 'dang_lam')
  return d
}
const DA_CONG_BO = ['CA-NGAY', 'CA-DU', 'CA-DONG']
const CHUA_CONG_BO = ['CA-KHONG', 'CA-CHUA', 'CA-TRONG']
const RO = (r: unknown, ma: string) => JSON.stringify(r).includes(`LG-BI-MAT-${ma}`)

describe('MỘT nguồn luật: ba đường cho cùng kết quả', () => {
  const BANG: [string, string, number, number, boolean][] = [
    // congBo, trangThaiCa, daVao, daNop, công bố?
    ['ngay', 'mo', 0, 0, true], ['ngay', 'mo', 3, 1, true], ['ngay', 'dong', 0, 0, true],
    ['khong', 'mo', 3, 3, false], ['khong', 'dong', 3, 3, false], ['', 'dong', 3, 3, false], ['la', 'mo', 3, 3, false],
    ['ca_lop_xong', 'mo', 0, 0, false], // ca chưa ai vào KHÔNG tính là xong
    ['ca_lop_xong', 'mo', 3, 2, false], ['ca_lop_xong', 'mo', 3, 3, true], ['ca_lop_xong', 'mo', 1, 1, true],
    ['ca_lop_xong', 'dong', 3, 1, true], ['ca_lop_xong', 'dong', 0, 0, true],
  ]
  it('hàm thuần khớp bảng luật (viết tay, không import hằng)', () => {
    for (const [cb, tt, vao, nop, kq] of BANG) expect(laSanSangCongBo(cb, tt, vao, nop), `${cb}/${tt}/${vao}/${nop}`).toBe(kq)
    expect(cheDoCongBo('ngay')).toBe('ngay')
    expect(cheDoCongBo('ca_lop_xong')).toBe('ca_lop_xong')
    for (const x of [null, undefined, '', 'khong', 'lạ', 5]) expect(cheDoCongBo(x)).toBe('khong')
  })
  it('hàm thuần = SQL_DA_CONG_BO = docTrangThaiCongBo = ketQuaCuaEm.sanSang trên CÙNG dữ liệu (bảng trạng thái × lượt)', async () => {
    let i = 0
    for (const [cb, tt, vao, nop, kq] of BANG) {
      const d = taoD1That()
      const ma = `C${++i}`
      themCa(d, ma, cb === '' ? null : cb, tt)
      for (let k = 0; k < vao; k++) themLuot(d, ma, `S${k + 1}`, k < nop ? 'da_nop' : 'dang_lam')
      const sql = !!d.sql.prepare(`SELECT 1 AS x FROM ca c WHERE c.ma_ca = ? AND ${SQL_DA_CONG_BO('c')}`).get(ma)
      const map = (await docTrangThaiCongBo(d.env, [ma])).get(ma)
      const kqEm = await ketQuaCuaEm(d.env, { maCa: ma })
      const ten = `${cb}/${tt}/${vao}/${nop}`
      expect(sql, `SQL ${ten}`).toBe(kq)
      expect(map?.daCongBo, `docTrangThai ${ten}`).toBe(kq)
      expect(kqEm.sanSang, `ketQuaCuaEm ${ten}`).toBe(kq)
      expect(map).toMatchObject({ soEmDaVao: vao, soEmDaNop: nop, congBo: cheDoCongBo(cb) })
    }
  })
  it('ca không có dòng trong `ca` ⇒ vắng trong bản đồ và SQL = không công bố', async () => {
    const d = taoD1That()
    themLuot(d, 'CA-MA', 'S1')
    expect((await docTrangThaiCongBo(d.env, ['CA-MA'])).has('CA-MA')).toBe(false)
    expect(await docTrangThaiCongBo(d.env, [])).toEqual(new Map())
  })
})

describe('/hs/lich-su và lệnh lichSuEm: ca chưa công bố bị BỚT khỏi mảng cũ, liệt kê ở `chuaCongBo`', () => {
  it('/hs/lich-su: chỉ ca đã công bố có điểm + số câu; ca chưa công bố KHÔNG lộ điểm, kèm "đã nộp a/b em"', async () => {
    const d = dung()
    const r = await goi(d, '/hs/lich-su', { sbd: 'S1' })
    expect(r.ok).toBe(true)
    expect(r.items.map((x: { maCa: string }) => x.maCa).sort()).toEqual([...DA_CONG_BO].sort())
    for (const x of r.items) expect(x).toMatchObject({ tong: 7.5, diemI: 2.5, congBo: expect.any(String) })
    expect(r.chuaCongBo.map((x: { maCa: string }) => x.maCa).sort()).toEqual([...CHUA_CONG_BO].sort())
    const chua = Object.fromEntries(r.chuaCongBo.map((x: { maCa: string }) => [x.maCa, x]))
    expect(chua['CA-CHUA']).toEqual({ maCa: 'CA-CHUA', tenCa: 'Ca CA-CHUA', nopLuc: NOP, congBo: 'ca_lop_xong', soEmDaNop: 1, soEmDaVao: 2 }) // đã nộp 1/2 em
    expect(chua['CA-KHONG']).toMatchObject({ congBo: 'khong', soEmDaNop: 1, soEmDaVao: 1 })
    expect(chua['CA-TRONG']).toMatchObject({ congBo: 'khong' })
    const chuoi = JSON.stringify(r.chuaCongBo)
    expect(chuoi).not.toMatch(/7\.5|tong|diem|dapAn|loiGiai/) // dòng chưa công bố KHÔNG mang điểm/đáp án
  })
  it('cả lớp nộp xong ⇒ ca tự hiện lại; thầy đổi cong_bo sang `ngay` ⇒ hiện; đóng ca ⇒ hiện', async () => {
    const d = dung()
    const ma = () => goi(d, '/hs/lich-su', { sbd: 'S1' }).then((r) => r.items.map((x: { maCa: string }) => x.maCa))
    expect(await ma()).not.toContain('CA-CHUA')
    d.sql.prepare("UPDATE luot SET trang_thai = 'da_nop', nop_luc = ?, tong = 6 WHERE ma_ca = 'CA-CHUA' AND sbd = 'S2'").run(NOP)
    expect(await ma()).toContain('CA-CHUA')
    d.sql.prepare("UPDATE ca SET cong_bo = 'ngay' WHERE ma_ca = 'CA-KHONG'").run()
    expect(await ma()).toContain('CA-KHONG')
    d.sql.prepare("UPDATE ca SET trang_thai = 'dong' WHERE ma_ca = 'CA-TRONG'").run()
    expect(await ma()).not.toContain('CA-TRONG') // đóng ca mà cong_bo thiếu (khong) vẫn không công bố
  })
  it('lệnh lichSuEm (máy em cũ ở ExamTakeScreen) cùng luật; hsLichSuCa gọi trực tiếp cũng vậy', async () => {
    const d = dung()
    const a = await lichSuEm(d.env, { sbd: 'S1' })
    expect((a.items as { maCa: string }[]).map((x) => x.maCa).sort()).toEqual([...DA_CONG_BO].sort())
    expect((a.chuaCongBo as { maCa: string }[]).map((x) => x.maCa).sort()).toEqual([...CHUA_CONG_BO].sort())
    const b = await hsLichSuCa(d.env, { sbd: 'S1' })
    expect((b.items as { maCa: string }[]).map((x) => x.maCa).sort()).toEqual([...DA_CONG_BO].sort())
    const viaAction = await goiWorker(worker, d.env, '/goi', { action: 'lichSuEm', sbd: 'S1' })
    expect(viaAction.items.map((x: { maCa: string }) => x.maCa).sort()).toEqual([...DA_CONG_BO].sort())
  })
})

describe('/hs/cau-sai và /hs/cau-da-thi: câu của ca chưa công bố (đề + đáp án + lời giải) không rời máy chủ', () => {
  it('cau-sai: chỉ câu của ca đã công bố; không rò lời giải / đáp án của ca chưa công bố; `caChuaCongBo` liệt kê', async () => {
    const d = dung()
    for (const duong of ['/hs/cau-sai', '/hs/cau-da-thi']) {
      const r = await goi(d, duong, { sbd: 'S1' })
      expect(r.ok, duong).toBe(true)
      const ma = [...new Set(r.items.map((x: { maCa: string }) => x.maCa))].sort()
      expect(ma, duong).toEqual([...DA_CONG_BO].sort())
      for (const c of CHUA_CONG_BO) expect(RO(r, c), `${duong} ${c}`).toBe(false)
      for (const c of DA_CONG_BO) expect(RO(r, c), `${duong} ${c}`).toBe(true) // đối chứng: ca đã công bố vẫn có lời giải (màn Khắc phục chạy)
      expect(r.caChuaCongBo.sort(), duong).toEqual([...CHUA_CONG_BO].sort())
    }
  })
  it('xin đích danh một ca chưa công bố (dsMaCa) ⇒ không có câu nào', async () => {
    const d = dung()
    const r = await goi(d, '/hs/cau-sai', { sbd: 'S1', dsMaCa: ['CA-KHONG', 'CA-CHUA'] })
    expect(r.items).toEqual([])
    expect(r.caChuaCongBo.sort()).toEqual(['CA-CHUA', 'CA-KHONG'])
  })
  it('đường tự chấm lại từ bài nộp (chưa có chi_tiet_cau): ca chưa công bố KHÔNG bị chấm, KHÔNG ghi bảng chấm, KHÔNG có câu', async () => {
    const d = dung()
    d.sql.exec('DELETE FROM chi_tiet_cau')
    const r = await goi(d, '/hs/cau-sai', { sbd: 'S1' })
    for (const c of CHUA_CONG_BO) expect(RO(r, c), c).toBe(false)
    expect(r.caChuaCongBo.sort()).toEqual([...CHUA_CONG_BO].sort())
    await new Promise((x) => setTimeout(x, 30)) // luuChiTietCauNeuChuaCo chạy nền
    const daGhi = (d.sql.prepare('SELECT DISTINCT ma_ca FROM chi_tiet_cau').all() as { ma_ca: string }[]).map((x) => x.ma_ca)
    for (const c of CHUA_CONG_BO) expect(daGhi, c).not.toContain(c)
  })
})

describe('phieuCuaEm: ca chưa công bố ⇒ không điểm, không chi tiết đáp án, không phiếu, không ngân hàng; ca đã công bố GIỮ NGUYÊN (màn Xem đề & lời giải chạy)', () => {
  it('ca đã công bố: trả đủ (điểm, chiTietCau, ngân hàng có lời giải) + trạng thái mới', async () => {
    const d = dung()
    for (const ma of DA_CONG_BO) {
      const r = await phieuCuaEm(d.env, { maCa: ma, sbd: 'S1' })
      expect(r, ma).toMatchObject({ ok: true, daCongBo: true, tong: 7.5, diemI: 2.5, congBo: expect.any(String) })
      expect((r.chiTietCau as unknown[]).length, ma).toBe(1)
      expect(RO(r, ma), ma).toBe(true)
      expect(r, ma).toMatchObject({ ma: `PH-${ma}`, phieu: { tieuDe: `Phiếu ${ma}` } }) // phiếu kết quả của ca đã công bố vẫn mở được
    }
  })
  it('ca chưa công bố: điểm null, chiTietCau rỗng, bank null, phiếu null; bài làm của chính em và trạng thái công bố còn', async () => {
    const d = dung()
    for (const ma of CHUA_CONG_BO) {
      const r = await phieuCuaEm(d.env, { maCa: ma, sbd: 'S1' })
      expect(r, ma).toMatchObject({ ok: true, daCongBo: false, tong: null, diemI: null, diemII: null, diemIII: null, bank: null, phieu: null, chiTietCau: [], ma: '' })
      expect(RO(r, ma), ma).toBe(false)
      expect(JSON.stringify(r), ma).not.toMatch(/"dapAnDung"|"dap_an_dung"/)
      expect((r.luot as { dapAn: unknown }).dapAn, ma).toEqual({ phanI: { [`${ma}-I-1`]: 'A' } }) // bài làm của em (không phải đáp án đúng)
    }
    expect(await phieuCuaEm(d.env, { maCa: 'CA-CHUA', sbd: 'S1' })).toMatchObject({ congBo: 'ca_lop_xong', soEmDaNop: 1, soEmDaVao: 2 })
  })
})

describe('bài tin phụ huynh / học sinh và thẻ Bộ não không nêu điểm ca chưa công bố', () => {
  it('refreshDailyNews: điểm hôm nay + điểm mới nhất chỉ tính ca đã công bố (kể cả chi tiết câu dùng cho dự đoán)', async () => {
    const NOW = Date.parse('2026-09-21T09:00:00.000Z')
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    const chay = async (congBo: string, conNguoiDangLam: boolean) => {
      const d = taoD1That()
      d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Em S1','12','mk','x')").run()
      themCa(d, 'CA-X', congBo)
      themLuot(d, 'CA-X', 'S1', 'da_nop', { tong: 8.5, nop: '2026-09-21T02:00:00.000Z' })
      if (conNguoiDangLam) themLuot(d, 'CA-X', 'S9', 'dang_lam') // ca_lop_xong: CHƯA đủ lớp
      themCt(d, 'CA-X', 'S1', 0)
      const r = (await refreshDailyNews(d.env, 'S1', NOW)).reports[0] as unknown as { today: { diem: number }[]; score: number | null; duDoanDiem: unknown }
      return { today: r.today, score: r.score, du: JSON.stringify(r.duDoanDiem) }
    }
    const ngay = await chay('ngay', false)
    expect(ngay.today.map((x) => x.diem)).toEqual([8.5]) // đối chứng
    expect(ngay.score).toBe(8.5)
    const duXong = await chay('ca_lop_xong', false) // chỉ S1 vào và đã nộp ⇒ CẢ LỚP xong ⇒ công bố
    expect(duXong.today.map((x) => x.diem)).toEqual([8.5])
    for (const [cb, dang] of [['khong', false], ['ca_lop_xong', true], ['khong', true]] as const) {
      const r = await chay(cb, dang)
      expect(r.today, `${cb}/${dang}`).toEqual([])
      expect(r.score, `${cb}/${dang}`).toBeNull()
    }
    // chi tiết câu của ca chưa công bố cũng không vào dự đoán: kết quả y hệt khi chưa có ca nào
    const chua = await chay('khong', false)
    const khongCa = (() => { const d = taoD1That(); d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Em S1','12','mk','x')").run(); return d })()
    const trang = (await refreshDailyNews(khongCa.env, 'S1', NOW)).reports[0] as unknown as { duDoanDiem: unknown }
    expect(chua.du).toBe(JSON.stringify(trang.duDoanDiem))
  })
  it('thẻ Bộ não (`ca` gần nhất): ca chưa công bố không vào thẻ; đã công bố thì vào', async () => {
    const NOW = Date.parse('2026-09-21T21:00:00.000Z')
    const chay = async (congBo: string) => {
      const d = taoD1That()
      d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,trang_thai,cap_nhat_luc) VALUES('S1','Em S1','12A1','da_duyet','x')").run()
      themCa(d, 'CA-X', congBo)
      themLuot(d, 'CA-X', 'S1', 'da_nop', { tong: 8.5, nop: '2026-09-20T02:00:00.000Z' })
      themLuot(d, 'CA-X', 'S9', 'dang_lam') // còn người đang làm ⇒ ca_lop_xong CHƯA đủ lớp
      d.sql.exec("INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn) VALUES ('k1', 'S1', 'q1', 'btvn', 'm', 1, 1, 30, '2026-09-21T02:00:00.000Z', '2026-09-21')") // em có hoạt động ⇒ có thẻ
      await boNaoHoSoNgay(d.env, { ngay: '2026-09-22' }, NOW)
      const row = d.sql.prepare("SELECT the_json FROM ai_ho_so_ngay WHERE sbd = 'S1'").get() as { the_json: string } | undefined
      return row?.the_json ?? ''
    }
    const ngay = await chay('ngay')
    const khong = await chay('ca_lop_xong')
    const nhan = await chay('khong')
    expect(ngay).toContain('8.5') // đối chứng: ca đã công bố có trong thẻ
    expect(khong).not.toContain('8.5')
    expect(nhan).not.toContain('8.5')
  })
})

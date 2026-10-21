// @vitest-environment node
// SQL chạy trên SQLite trong bộ nhớ; không phải phép đo tải D1 thật hay kiểm chứng chất lượng mô hình thật.
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Env } from '../server/src/kieu'
import { baiNhapHoiThay, docHoSoHoiThay, noiDungHoSoHoiThay, trangThaiHoiThay } from '../server/src/hoi-thay-ca-nhan'
import { chonKhuon, lamSachCauTruc } from '../server/src/hoi-tro-ly-cau-truc'
import { CHI_DAN_THAY, traLoiHoiThem, type NguCanhCau, type NoiDungGemini } from '../server/src/hoi-tro-ly'
import { damBaoBangLoiGiai } from '../server/src/loi-giai'
import { taoD1That, type D1That } from './_d1-that'

const NOW = Date.parse('2026-10-16T03:00:00Z'), ISO = new Date(NOW).toISOString()
const Q = '12-CA-NHAN-I-1', A = 'EM-A', B = 'EM-B'
const NC: NguCanhCau = { qid: Q, cau: { phan: 'I', so: '1', de: 'Thuỷ phân ester trong NaOH, muối là?', pa: { A: 'CH3COONa', B: 'C2H5COONa', C: 'HCOONa', D: 'CH3ONa' }, y: null, dapAn: 'A', bang: null, hinh: [], loiGiai: null }, hoSo: null, loiGiaiChu: null }
const BO = { khuon: 'cho-sai' as const, phan: 'I', de: NC.cau.de, pa: NC.cau.pa, y: null, dapAn: 'A', dapAnEm: 'B' }
afterEach(() => vi.restoreAllMocks())

function kyNang(d: D1That, sbd: string, id: string, p: number, capNhat = ISO, tuLam = 6) {
  d.sql.prepare('INSERT OR IGNORE INTO omni_vkn(id,ma_dang,ten) VALUES(?,?,?)').run(id, 'ester', `Kiến thức ${id}`)
  d.sql.prepare("INSERT INTO omni_p_vkn(sbd,vkn_id,p,n_tu_lam,n_ngay,trang_thai,phien_ban,cap_nhat_luc) VALUES(?,?,?,?,?,'vung','thu',?)").run(sbd, id, p, tuLam, 3, capNhat)
}
function suKien(d: D1That, sbd: string, qid: string, so: number, ketQua: number, assistance = 'none', purpose = 'luyen', visibility = 'released') {
  d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,ket_qua,luc,ngay_vn,assistance,purpose,visibility) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
    .run(`${sbd}|${qid}|${so}`, sbd, qid, 'game', 'thu', ketQua, new Date(NOW - so * 60_000).toISOString(), '2026-10-16', assistance, purpose, visibility)
}
function phien(d: D1That, sbd: string, id = 'phien-a', tao = ISO) {
  d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run(id, sbd, JSON.stringify({ questions: [{ qid: Q }] }), tao)
}
async function hoi(d: D1That, b: Record<string, unknown> = {}, traLoi = '{"lienQuan":true,"traLoi":"Muối giữ gốc acid. Em viết công thức muối nào?"}') {
  await damBaoBangLoiGiai(d.env)
  d.env.GEMINI_API_KEY = 'khoa-gia'
  const nd: NoiDungGemini[] = []
  const goiAi = vi.fn(async (_k: string, _c: unknown, noiDung: NoiDungGemini) => { nd.push(noiDung); return { ok: true as const, chu: traLoi, vao: 10, ra: 10 } })
  const ketQua = await traLoiHoiThem(d.env, A, { qid: Q, cauHoi: 'Sao em chọn B lại sai ạ?', dapAnEm: 'B', nguon: 'luyen', ...b },
    { nguCanh: async () => ({ ok: true as const, ...NC }), goiAi, nowMs: NOW })
  return { ketQua, nd, goiAi }
}

describe('bằng chứng và chẩn đoán', () => {
  it('đáp án cuối không thành bài nháp; chỉ có B/9,6 không chọn khuôn bịa các bước', () => {
    expect(baiNhapHoiThay('B', 'Sao em ra 9,6 ạ?')).toBe('')
    expect(baiNhapHoiThay(undefined, 'Sao em chọn B sai ạ?')).toBe('')
    for (const cauHoi of ['Sao em ra 9,6 ạ?', 'Em chọn B sai ở đâu ạ?']) {
      expect(chonKhuon({ dangLam: false, phan: 'I', ketQua: 'sai', cauHoi, de: NC.cau.de, dapAnEm: 'B' })).toBe('giai-thich')
    }
    const nhap = baiNhapHoiThay(undefined, 'Em tính n = 8,8 : 88 = 0,1 rồi m = 0,1 × 96')
    expect(nhap).toContain('n = 8,8')
    expect(chonKhuon({ dangLam: false, phan: 'I', ketQua: 'sai', cauHoi: 'Em sai ở đâu?', de: NC.cau.de, dapAnEm: 'B', baiNhap: nhap })).toBe('cho-sai')
    expect(CHI_DAN_THAY).not.toContain('suy từ đáp án em ghi')
    expect(CHI_DAN_THAY).toContain('KHÔNG suy ra các bước em đã làm')
  })
  it('máy chủ bỏ bảng Em làm bịa từ đáp án, bỏ quy kết bước chưa có bằng chứng', () => {
    const o = { yChinh: 'Em ghép nhầm gốc ethyl.', bay: { tieuDe: 'Chỗ em nhầm', chu: 'Em lấy nhầm muối.' },
      soSanh: [{ em: 'n = 0,1', dung: 'n = 0,1' }, { em: 'm = 9,6', dung: 'm = 8,2', lech: true }] }
    const chuaBiet = lamSachCauTruc(o, false, undefined, BO)!
    expect(chuaBiet.soSanh).toBeUndefined()
    expect(chuaBiet.yChinh).toContain('Chưa đủ bài nháp')
    expect(chuaBiet.bay?.tieuDe).toBe('Bẫy hay nhầm')
    const coNhap = lamSachCauTruc(o, false, undefined, { ...BO, baiNhap: 'n = 0,1; m = 9,6' })!
    expect(coNhap.soSanh?.length).toBe(2)
    const khongKhop = lamSachCauTruc(o, false, undefined, { ...BO, baiNhap: 'n = 0,1; Em không biết bước sau' })!
    expect(khongKhop.soSanh).toBeUndefined()
  })
})

describe('hồ sơ hẹp, có độ chưa chắc, cách ly học sinh', () => {
  it('chỉ đọc tối đa8 kỹ năng riêng câu và8 lần của chính em; bỏ xem lời giải/lượt lướt/embargo', async () => {
    const d = taoD1That(), ids = Array.from({ length: 20 }, (_, i) => `nen:${String(i).padStart(2, '0')}`)
    d.sql.prepare("INSERT INTO omni_q(qid,y,vkn_json,nguon) VALUES(?,-1,?,'thay')").run(Q, JSON.stringify(ids))
    for (const id of ids) { kyNang(d, A, id, 0.4); kyNang(d, B, id, 0.99) }
    kyNang(d, A, 'ngoai-cau', 0.1)
    for (let i = 0; i < 40; i++) { suKien(d, A, Q, i, 0); suKien(d, B, Q, i, 1); suKien(d, A, 'Q-KHAC', i, 1) }
    suKien(d, A, Q, -1, 1, 'none', 'xem_loi_giai')
    suKien(d, A, Q, -2, 1, 'none', 'luot')
    suKien(d, A, Q, -3, 1, 'none', 'de_thu', 'embargoed')
    const truoc = d.soLenh.prepare
    const h = await docHoSoHoiThay(d.env, A, Q, NOW)
    expect(d.soLenh.prepare - truoc).toBe(3) // + kiến thức cùng dạng (21/10), cùng đợt
    expect(h.kyNang).toHaveLength(8); expect(h.lanLam).toHaveLength(8)
    expect(h.kyNang.every(k => k.p === 0.4 && !k.chuaChac)).toBe(true)
    expect(h.lanLam.every(l => l.ketQua === 0)).toBe(true)
    const nd = noiDungHoSoHoiThay(h)
    expect(nd).not.toContain('EM-A'); expect(nd).not.toContain('EM-B')
    // 21/10: kiến thức KHÁC cùng dạng chỉ vào mục kienThucCungDang (≤ 3 mỗi bên), chỉ của chính em: em B p 0,99 không thành "đã vững" của em A.
    expect(h.cungDang!.canOn[0]).toEqual({ ten: 'Kiến thức ngoai-cau', p: 0.1, tuLam: 6 })
    expect(h.cungDang!.canOn).toHaveLength(3); expect(h.cungDang!.vung).toEqual([])
    expect(nd).toContain('"kienThucCungDang":{"emConYeu":[{"kienThuc":"Kiến thức ngoai-cau"')
    expect(nd.length).toBeLessThan(4000)
  })
  it('ảnh chụp cũ, ít mẫu, chưa có hồ sơ đều không khẳng định thạo; trợ giúp không thành tự làm', async () => {
    const d = taoD1That()
    d.sql.prepare("INSERT INTO omni_q(qid,y,vkn_json,nguon) VALUES(?,-1,?,'thay')").run(Q, JSON.stringify(['cu', 'it', 'thieu']))
    kyNang(d, A, 'cu', 0.99, '2026-09-01T00:00:00Z')
    kyNang(d, A, 'it', 0.99, ISO, 1)
    suKien(d, A, Q, 0, 1, 'assisted')
    const h = await docHoSoHoiThay(d.env, A, Q, NOW)
    expect(h.kyNang.every(k => k.chuaChac)).toBe(true)
    expect(h.lanLam[0]).toMatchObject({ ketQua: 1, troGiup: true })
    expect(await docHoSoHoiThay(d.env, 'EM-CHUA-CO', 'CAU-CHUA-CO', NOW)).toEqual({ kyNang: [], lanLam: [] })
    expect(noiDungHoSoHoiThay(h)).toContain('không gắn nhãn học sinh')
  })
  it('ba đọc phụ trợ cùng bắt đầu, mất mạng/thiếu bảng fallback rỗng, không retry nối tiếp hay ghi điểm', async () => {
    const batDau: string[] = [], tha: (() => void)[] = []
    const env = { DB: { prepare: (q: string) => { batDau.push(q); return { bind: () => ({ all: () => new Promise((_, reject) => tha.push(() => reject(new Error('D1 mang')))) }) } } } } as unknown as Env
    const p = docHoSoHoiThay(env, A, Q, NOW)
    expect(batDau).toHaveLength(3)
    for (const f of tha) f()
    expect(await p).toEqual({ kyNang: [], lanLam: [] })
    expect(batDau).toHaveLength(3)
  })
})

describe('cổng máy chủ và dấu trợ giúp', () => {
  it('không tin dangLam=false: câu trong phiên em chưa nộp chỉ gợi hướng; receipt đã nộp thì mở lại', async () => {
    const d = taoD1That(); phien(d, A)
    const r = await hoi(d, { dangLam: false }, '{"lienQuan":true,"traLoi":"Em xác định gốc acid trước. Đáp án là A."}')
    expect(r.ketQua).toMatchObject({ ok: true, dangLam: true })
    expect(r.ketQua.traLoi).not.toContain('Đáp án là A')
    expect(JSON.stringify(r.nd)).toContain('EM ĐANG LÀM CÂU NÀY, CHƯA NỘP')
    expect(r.goiAi).toHaveBeenCalledTimes(1)
    d.sql.prepare('INSERT INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) VALUES(?,?,?,?,?,?,?)').run(`phien-a|${Q}`, A, 'phien-a', Q, 'g', '{}', ISO)
    expect(await trangThaiHoiThay(d.env, A, Q, NOW)).toEqual({ dangLam: false, dangKiemTra: false })
  })
  it('phiên của em khác/phiên quá2h không chặn; kiểm tra cá nhân mở thì không gọiAI, không ghi hội thoại', async () => {
    const d = taoD1That(); phien(d, B); phien(d, A, 'cu', '2026-10-15T23:00:00Z')
    expect(await trangThaiHoiThay(d.env, A, Q, NOW)).toEqual({ dangLam: false, dangKiemTra: false })
    d.sql.prepare("INSERT INTO kiem_tra_ca_nhan(id,sbd,lop,ngay,mo_luc,han_luc,trang_thai,json,cap_nhat_luc) VALUES('kt',?,'12','2026-10-16',?,?,'hen','{}',?)").run(A, NOW - 1000, NOW + 100000, NOW)
    d.sql.prepare("INSERT INTO kiem_tra_ca_nhan_chang(bai_id,stt,bat_dau,han) VALUES('kt',0,?,?)").run(NOW - 1000, NOW + 60000)
    const r = await hoi(d)
    expect(r.ketQua).toMatchObject({ ok: false, ma: 'dang_kiem_tra' })
    expect(r.goiAi).not.toHaveBeenCalled()
    expect(d.sql.prepare('SELECT COUNT(*) n FROM hoi_tro_ly').get()?.n).toBe(0)
  })
  it('không bỏ sót phiên vẫn còn hạn khi em mở nhiều phiên khác sau đó', async () => {
    const d = taoD1That(); phien(d, A, 'cu-con-han', new Date(NOW - 60_000).toISOString())
    for (let i = 0; i < 9; i++) d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)')
      .run(`moi-${i}`, A, JSON.stringify({ questions: [{ qid: 'CAU-KHAC' }] }), new Date(NOW - i * 1000).toISOString())
    expect(await trangThaiHoiThay(d.env, A, Q, NOW)).toEqual({ dangLam: true, dangKiemTra: false })
  })
  it('hồ sơ trống vẫn trả lời 1 lượtAI; hỏi sau nộp ghi dấu trợ giúp, không thay điểm hay tạo bằng chứng tự làm', async () => {
    const d = taoD1That(); suKien(d, A, Q, 0, 0)
    const r = await hoi(d, { cauHoi: 'Em hiểu rồi' })
    expect(r.ketQua.ok).toBe(true); expect(r.goiAi).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(r.nd)).toContain('CHƯA CÓ BÀI NHÁP')
    expect(d.sql.prepare('SELECT sbd,qid,co_ho_so,nguon FROM loi_giai_hoi').get()).toMatchObject({ sbd: A, qid: Q, co_ho_so: 0, nguon: 'luyen:tro_ly' })
    expect(d.sql.prepare('SELECT COUNT(*) n,SUM(ket_qua) dung FROM su_kien_hoc').get()).toMatchObject({ n: 1, dung: 0 })
    expect(d.sql.prepare('SELECT COUNT(*) n FROM omni_p_vkn').get()?.n).toBe(0)
  })
  it('ngoài phạm vi không ghi dấu được hướng dẫn; câu chữ cũ cũng không quy kết bước bịa', async () => {
    const d = taoD1That()
    const ngoai = await hoi(d, {}, '{"lienQuan":false,"traLoi":""}')
    expect(ngoai.ketQua.ngoaiPhamVi).toBe(true)
    expect(d.sql.prepare('SELECT COUNT(*) n FROM loi_giai_hoi').get()?.n).toBe(0)
    const thieu = await hoi(d, {}, '{"lienQuan":true,"traLoi":"Em lấy nhầm muối nên sai."}')
    expect(thieu.ketQua.traLoi).toContain('Chưa đủ bài nháp')
  })
  it('không ghi được dấu trợ giúp thì rollback hội thoại trong cùng giao dịch, không mất lượt', async () => {
    const d = taoD1That(); await damBaoBangLoiGiai(d.env)
    d.sql.exec("CREATE TRIGGER chan_marker BEFORE INSERT ON loi_giai_hoi BEGIN SELECT RAISE(ABORT,'marker loi'); END")
    await expect(hoi(d)).rejects.toThrow('marker loi')
    expect(d.sql.prepare('SELECT COUNT(*) n FROM hoi_tro_ly').get()?.n).toBe(0)
    expect(d.sql.prepare('SELECT COUNT(*) n FROM su_kien_hoc').get()?.n).toBe(0)
  })
  it('nguồn máy em quá dài không được cắt mất hậu tố trợ giúp', async () => {
    const d = taoD1That(); await hoi(d, { nguon: 'x'.repeat(100) })
    const nguon = String(d.sql.prepare('SELECT nguon FROM loi_giai_hoi').get()?.nguon)
    expect(nguon.length).toBeLessThanOrEqual(40)
    expect(nguon.endsWith(':tro_ly')).toBe(true)
  })
  it('cổng trạng thái lỗi phải chặn trả lời đầy đủ; không coi mất mạng là đã nộp', async () => {
    const d = taoD1That()
    const prepare = d.env.DB.prepare.bind(d.env.DB)
    vi.spyOn(d.env.DB, 'prepare').mockImplementation(q => {
      if (q.includes('SELECT EXISTS(SELECT 1 FROM')) return { bind: () => ({ first: async () => { throw new Error('D1 mang') } }) } as never
      return prepare(q)
    })
    await expect(trangThaiHoiThay(d.env, A, Q, NOW)).rejects.toThrow('D1 mang')
  })
})

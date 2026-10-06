// @vitest-environment node
// CA "KIỂM CHỨNG CÂU ĐÃ ĐÚNG" — THAY CÂU (thầy 06/10): "mở ca thi chọn câu đúng được thay bằng câu thay số của câu đúng đó (ghi rõ câu này thay số của câu em đã đúng
// ở…). Các câu lý thuyết thì … theo cách thay thế câu lý thuyết và cũng ghi rõ".
//   · lõi thuần (src/lib/rut-de-da-dung.ts): nhãn câu thay, áp bản thay vào bộ câu, thống kê, bản thay lấy từ kho ca;
//   · máy chủ THẬT trên D1 sqlite qua Worker thật (server/src/cau-thay-so.ts): song sinh · biến thể bằng mã · câu anh em · công tắc · em vào muộn (/vao-thi).
import { beforeEach, describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaDemCauHinh } from '../server/src/cau-hinh-dem'
import { xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich } from '../server/src/srs2-d1'
import { damBaoBangBoTro } from '../server/src/cau-bo-tro'
import { damBaoBangLoiGiai } from '../server/src/loi-giai'
import type { Env } from '../server/src/kieu'
import {
  apThayVaoKetQua,
  banDoDaDung,
  chuNhanBaoCao,
  chuNhanDaDung,
  daDungCuaEm,
  laNhanThay,
  nhanThay,
  rutDeDaDung,
  taoNhanDaDung,
  thongKeThay,
  timThayTrongKho,
  type CauDaDung,
} from '../src/lib/rut-de-da-dung'
import type { PhanV2 } from '../src/lib/rut-de-v2'

// =====================================================================================================
// LÕI THUẦN
const NOI = 'Ca Kiểm tra tuần 3 · 28/09 · Thông hiểu'
const cau = (qid: string, phan: PhanV2, mucDo: string): CauDaDung => ({ qid, phan, mucDo, nhan: `Ca Thử · 01/10 · ${mucDo}`, soLanDung: 2, soLanSai: 1 })

describe('nhãn câu THAY — ghi rõ, không lẫn nhãn câu nguyên văn', () => {
  it('đúng lời thầy: "Câu này thay số của câu em đã đúng ở …"; câu lý thuyết / cùng dạng có lời riêng', () => {
    expect(nhanThay('thay_so', false, NOI)).toBe(`Câu này thay số của câu em đã đúng ở ${NOI}`)
    expect(nhanThay('cung_dang', true, NOI)).toBe(`Câu lý thuyết này thay cho câu em đã đúng ở ${NOI} (cùng dạng bài, nội dung khác)`)
    expect(nhanThay('cung_dang', false, NOI)).toBe(`Câu này thay cho câu em đã đúng ở ${NOI} (cùng dạng bài, nội dung khác)`)
  })
  it('nhãn nơi trống ⇒ vẫn đọc được ("… đã đúng trước đây"), không "ở " cụt', () => {
    expect(nhanThay('thay_so', false, '')).toBe('Câu này thay số của câu em đã đúng trước đây')
    expect(nhanThay('cung_dang', true, '   ')).toBe('Câu lý thuyết này thay cho câu em đã đúng trước đây (cùng dạng bài, nội dung khác)')
  })
  it('máy em in cả câu cho nhãn thay, còn câu nguyên văn vẫn "Em đã làm đúng: <nhãn>"', () => {
    expect(chuNhanDaDung(nhanThay('thay_so', false, NOI))).toBe(`Câu này thay số của câu em đã đúng ở ${NOI}`)
    expect(chuNhanDaDung(NOI)).toBe(`Em đã làm đúng: ${NOI}`)
    expect(chuNhanDaDung(`  ${NOI}  `)).toBe(`Em đã làm đúng: ${NOI}`)
  })
  it('báo cáo cuối bài của thầy: nhãn thay tự nói nơi; nhãn nguyên văn "đã làm đúng: …"; trống ⇒ "không rõ nơi"', () => {
    expect(chuNhanBaoCao(nhanThay('thay_so', false, NOI))).toBe(`Câu này thay số của câu em đã đúng ở ${NOI}`)
    expect(chuNhanBaoCao(NOI)).toBe(`đã làm đúng: ${NOI}`)
    expect(chuNhanBaoCao('')).toBe('đã làm đúng: không rõ nơi')
  })
  it('MỌI kiểu nhãn nơi máy chủ dựng (ca · chiến dịch · kênh) KHÔNG bao giờ bị nhận nhầm là nhãn thay', () => {
    for (const noi of ['Ca Kiểm tra tuần 3', 'Ca kiểm tra', 'Chiến dịch Câu hỏi Ôn chương 1 (Đảo thần thú)', 'Ôn lại', 'Lên bảng', 'Kiểm tra đầu giờ', 'Luyện đề', 'Bài tập về nhà', 'Khắc phục sau ca', 'Bài gia đình giao', 'Thử thách riêng', 'Luyện tập', 'Đảo thần thú', 'Đoàn Hộ Tống', 'Bi-a'])
      expect(laNhanThay(taoNhanDaDung(noi, '2026-09-28', 'hieu')), noi).toBe(false)
    expect(laNhanThay('')).toBe(false)
    expect(laNhanThay(undefined)).toBe(false)
    expect(laNhanThay(nhanThay('thay_so', false, NOI))).toBe(true)
    expect(laNhanThay(nhanThay('cung_dang', true, NOI))).toBe(true)
    expect(laNhanThay(nhanThay('cung_dang', false, NOI))).toBe(true)
  })
  it('máy em đọc phòng thủ: nhãn thay dài hơn nhãn nơi cũ vẫn giữ nguyên (≤ 260 ký tự), không cắt giữa câu', () => {
    const dai = nhanThay('cung_dang', true, `Chiến dịch ${'Ôn tập chương ester lipid '.repeat(3)}(Đảo thần thú) · 28/09 · Vận dụng`)
    expect(dai.length).toBeGreaterThan(160)
    expect(dai.length).toBeLessThanOrEqual(260)
    expect(daDungCuaEm({ q1: dai, q2: 123, q3: '  ' })).toEqual({ q1: dai })
  })
})

describe('áp bản thay vào bộ câu', () => {
  const nguon = { A: [cau('a1', 'I', 'biet'), cau('a2', 'I', 'biet'), cau('a3', 'III', 'hieu'), cau('a4', 'II', 'hieu')] }
  const kq0 = rutDeDaDung({ nguon, dsSbd: ['A', 'B'], tongCau: 4, seed: 'CA', khoBu: [{ qid: 'bu1', phan: 'I', mucDo: 'biet' }, { qid: 'bu2', phan: 'II', mucDo: 'hieu' }, { qid: 'bu3', phan: 'III', mucDo: 'hieu' }] })
  const goc = (sbd: string) => kq0.theoEm[sbd]!.filter((c) => !c.bu).map((c) => c.qid)

  it('câu em đã đúng ⇒ đổi qid, nhãn thành nhãn thay (dựng từ nhãn nơi · ngày · mức), đếm đúng/sai cũ đi theo; câu bù KHÔNG bao giờ bị thay', () => {
    const [x, y] = goc('A')
    const buCuaB = kq0.theoEm.B!.map((c) => c.qid)
    const kq = apThayVaoKetQua(kq0, { A: { [x!]: { id: `${x}~ss0`, kieu: 'thay_so' }, [y!]: { id: 'anh-em-1', kieu: 'cung_dang' } }, B: { [buCuaB[0]!]: { id: 'khong-duoc', kieu: 'thay_so' } } }, new Set([y!]))
    const a = kq.theoEm.A!
    expect(a.map((c) => c.qid)).toContain(`${x}~ss0`)
    expect(a.map((c) => c.qid)).not.toContain(x)
    expect(a.find((c) => c.qid === `${x}~ss0`)).toMatchObject({ goc: x, thay: 'thay_so' })
    expect(a.find((c) => c.qid === 'anh-em-1')).toMatchObject({ goc: y, thay: 'cung_dang', lyThuyet: true })
    expect(kq.nhan.A![`${x}~ss0`]).toBe(nhanThay('thay_so', false, kq0.nhan.A![x!]!))
    expect(kq.nhan.A!['anh-em-1']).toBe(nhanThay('cung_dang', true, kq0.nhan.A![y!]!))
    expect(kq.nhan.A![x!]).toBeUndefined() // nhãn cũ không còn gắn vào qid không còn trong đề
    expect(kq.dem.A![`${x}~ss0`]).toEqual(kq0.dem.A![x!])
    expect(kq.dem.A![x!]).toBeUndefined()
    // câu bù + em khác: nguyên vẹn
    expect(kq.theoEm.B).toEqual(kq0.theoEm.B)
    expect(kq.nhan.B).toEqual(kq0.nhan.B)
    // ô (phần, mức), số câu, đếm xoay vòng: không đổi
    expect(a.map((c) => [c.phan, c.mucO])).toEqual(kq0.theoEm.A!.map((c) => [c.phan, c.mucO]))
    expect(kq.daDung).toEqual(kq0.daDung)
    // không đổi đầu vào
    expect(kq0.theoEm.A!.some((c) => c.thay || c.goc)).toBe(false)
  })
  it('bản đồ gửi máy chủ: bộ câu mang qid câu thay; nhãn chỉ câu đã đúng (thay hoặc nguyên văn); đếm đúng/sai cũ theo qid mới', () => {
    const [x] = goc('A')
    const kq = apThayVaoKetQua(kq0, { A: { [x!]: { id: `${x}~bt3`, kieu: 'thay_so' } } })
    const bd = banDoDaDung(kq)
    expect(bd.bo.A).toContain(`${x}~bt3`)
    expect(bd.bo.A).not.toContain(x)
    expect(bd.daDung.A![`${x}~bt3`]).toMatch(/^Câu này thay số của câu em đã đúng ở Ca Thử · 01\/10 · /)
    expect(bd.demDaDung.A![`${x}~bt3`]).toEqual([2, 1])
    expect(Object.keys(bd.daDung.A!).length).toBe(Object.keys(kq0.nhan.A!).filter((q) => kq0.nhan.A![q]).length)
    expect(Object.keys(bd.daDung.B ?? {})).toEqual([]) // em B chỉ có câu bù ⇒ không nhãn
  })
  it('bản thay trùng qid đã có trong đề (câu gốc khác / câu thay đã nhận) hoặc kiểu lạ ⇒ bỏ, đề không bao giờ có hai câu giống nhau', () => {
    const [x, y] = goc('A')
    const kq = apThayVaoKetQua(kq0, { A: { [x!]: { id: y!, kieu: 'thay_so' }, [y!]: { id: 'moi', kieu: 'la' as never } } })
    expect(kq.theoEm.A!.map((c) => c.qid)).toEqual(kq0.theoEm.A!.map((c) => c.qid))
    const hai = apThayVaoKetQua(kq0, { A: { [x!]: { id: 'trung', kieu: 'cung_dang' }, [y!]: { id: 'trung', kieu: 'cung_dang' } } })
    expect(hai.theoEm.A!.filter((c) => c.qid === 'trung')).toHaveLength(1)
    expect(new Set(hai.theoEm.A!.map((c) => c.qid)).size).toBe(hai.theoEm.A!.length)
  })
  it('thống kê: thay số · cùng dạng (trong đó lý thuyết) · giữ nguyên · bù · em còn câu giữ nguyên', () => {
    const [x, y, z] = goc('A')
    const kq = apThayVaoKetQua(kq0, { A: { [x!]: { id: 'a-ss', kieu: 'thay_so' }, [y!]: { id: 'a-ae', kieu: 'cung_dang' } } }, new Set([y!]))
    const tk = thongKeThay(kq)
    expect(tk.theoEm.A).toEqual({ thaySo: 1, cungDang: 1, giuNguyen: goc('A').length - 2 })
    expect(tk).toMatchObject({ thaySo: 1, cungDang: 1, lyThuyet: 1, giuNguyen: goc('A').length - 2 })
    expect(tk.bu).toBe(kq.theoEm.B!.length + kq.theoEm.A!.filter((c) => c.bu).length)
    expect(tk.emGiuNguyen).toBe(z ? 1 : 0)
    expect(thongKeThay(kq0).thaySo + thongKeThay(kq0).cungDang).toBe(0)
  })
})

describe('bản thay lấy từ KHO CA (em vào muộn)', () => {
  const nguon = { A: [cau('q1', 'I', 'biet'), cau('q2', 'I', 'biet'), cau('q3', 'III', 'hieu')] }
  const kq0 = rutDeDaDung({ nguon, dsSbd: ['A'], tongCau: 3, seed: 'CA' })
  const kho = [{ id: 'q1' }, { id: 'q1~ss0', songSinhCua: 'q1' }, { id: 'q1~ss1', songSinhCua: 'q1' }, { id: 'q2' }, { id: 'q2~ss0', songSinhCua: 'q2' }, { id: 'q3' }]
  it('có song sinh sẵn trong kho ⇒ thay số; không có ⇒ không thay; câu lý thuyết không bao giờ thay số', () => {
    const t = timThayTrongKho(kq0, kho, 'CA', {}, new Set(['q2']))
    expect(t.A!.q1!.kieu).toBe('thay_so')
    expect(['q1~ss0', 'q1~ss1']).toContain(t.A!.q1!.id)
    expect(t.A!.q2).toBeUndefined() // lý thuyết
    expect(t.A!.q3).toBeUndefined() // kho không có bản đổi số của q3
  })
  it('ưu tiên bản em CHƯA gặp; gặp hết ⇒ bản gặp lâu nhất; tất định theo (mã ca, em, câu)', () => {
    expect(timThayTrongKho(kq0, kho, 'CA', { A: { 'q1~ss0': '2026-09-30' } }).A!.q1!.id).toBe('q1~ss1')
    expect(timThayTrongKho(kq0, kho, 'CA', { A: { 'q1~ss0': '2026-09-30', 'q1~ss1': '2026-10-02' } }).A!.q1!.id).toBe('q1~ss0')
    const a = timThayTrongKho(kq0, kho, 'CA', {})
    expect(timThayTrongKho(kq0, kho, 'CA', {})).toEqual(a)
  })
})

// =====================================================================================================
// MÁY CHỦ — D1 thật (sqlite) qua Worker thật.
type Phan = 'I' | 'II' | 'III'
interface CauThu { qid: string; maDe: string; phan: Phan; dang: string; mucDo: string; correct: string; group?: string; tuLuan?: boolean }
const TO11 = 'DH-11-B1', TO10 = 'DH-10-B1', TO12 = 'DH-12-B1'
const LOP_TO: Record<string, string> = { [TO11]: '11', [TO10]: '10', [TO12]: '12' }
const PA = (qid: string, k: string) => `${qid} — giá trị ${'ABCD'.indexOf(k) + 1}`
const cauJson = (c: CauThu) => ({
  qid: c.qid, maDe: c.maDe, version: 'v1', group: c.group ?? `g-${c.qid}`, phan: c.phan, text: `Đề câu ${c.qid}`,
  choices: c.phan === 'I' ? ['A', 'B', 'C', 'D'].map((k) => PA(c.qid, k)) : [], ideas: c.phan === 'II' ? [0, 1, 2, 3].map((i) => `${c.qid} — ý ${i + 1}`) : [],
  hinhAnh: [], dang: c.dang, tenDang: `Dạng ${c.dang}`, mucDo: c.mucDo, sao: 1, kienThuc: ['K1'], correct: c.correct, reviewed: true, ...(c.tuLuan ? { tuLuan: true } : {}),
  solution: { chot: 'Bảo toàn khối lượng.' },
})
const MOC = Date.parse('2026-10-06T03:00:00Z')
const ngayVnCua = (ms: number) => new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10)

function dung(kho: CauThu[], lop = '11A1', sbd = 'S1'): { d: D1That; env: Env } {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.prepare('INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,?,?,?)').run(sbd, 'Nguyễn An', lop, 'mk1', 'x')
  const to = [...new Set(kho.map((c) => c.maDe))]
  for (const m of to) {
    d.sql.prepare('INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,da_xoa,cap_nhat_luc) VALUES(?,?,?,?,0,?)').run(m, `Tờ ${m}`, LOP_TO[m] ?? null, kho.filter((c) => c.maDe === m).length, 'v1')
    d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,'v1','x')").run(m)
  }
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (const c of kho) st.run(c.maDe, c.qid, 'v1', c.group ?? `g-${c.qid}`, c.dang, JSON.stringify(cauJson(c)))
  // Phạm vi đã dạy của lớp: MỘT bài tick gồm mọi tờ ⇒ chỉ luật khối / nhóm / đã gặp chặn được câu anh em.
  d.sql.prepare("INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES('T1',?,'B1','Bài 1',1,?,'2026-10-01T00:00:00.000Z')").run(lop, JSON.stringify(to))
  return { d, env }
}
/** Một lượt TỰ LÀM của em (sổ chuẩn). */
function ghi(d: D1That, qid: string, kq: 0 | 1, ngay = '2026-09-28', sbd = 'S1') {
  d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance) VALUES(?,?,?,?,?,1,?,?,?,?)')
    .run(`luyen|${sbd}|${qid}|${ngay}`, sbd, qid, 'luyen', `M-${ngay}`, kq, `${ngay}T03:00:00.000Z`, ngay, 'none')
}
/** Gắn song sinh vào kho học liệu bổ trợ của câu `qid`. */
async function themSongSinh(d: D1That, env: Env, qid: string, ss: unknown[]) {
  await damBaoBangLoiGiai(env)
  await damBaoBangBoTro(env)
  d.sql.prepare('INSERT INTO loi_giai_cau(qid,bam,ma_de,dang,cap_nhat_luc) VALUES(?,?,?,?,?)').run(qid, `BAM-${qid}`, TO11, 'tn', 'x')
  d.sql.prepare("INSERT INTO cau_bo_tro(bam,qid_mau,song_sinh_json,cau_kiem_json,nhan_nen_json,buoc_json,cap_nhat_luc) VALUES(?,?,?,'[]','[]','[]','x')").run(`BAM-${qid}`, qid, JSON.stringify(ss))
}
const ssI = (k: number) => ({ de: `Song sinh ${k}: tính m`, pa: { A: `${k}1`, B: `${k}2`, C: `${k}3`, D: `${k}4` }, dap_an: 'C', buoc: ['n', 'm'], gia_tri_dung: '1' })
const ssIII = (k: number) => ({ de: `Song sinh ${k}: tính V (lít)`, dap_an: `${k},5`, buoc: ['n', 'V'], gia_tri_dung: `${k}.5` })
const thayGoi = (env: Env, b: Record<string, unknown>, coMa = true) => goiWorker(worker, env, '/ca/cau-thay-so', { seed: 'CA1', ngay: '2026-10-06', ...b }, coMa)
const yc = (qid: string, phan: Phan, mucDo: string, dang: string, them: { lyThuyet?: boolean; bu?: boolean } = {}) => ({ qid, phan, mucDo, dang, lyThuyet: !!them.lyThuyet, bu: !!them.bu })

beforeEach(() => { xoaDemCaBaoVe(); xoaDemChienDich(); xoaDemPhamVi() })

describe('/ca/cau-thay-so — câu TÍNH TOÁN thay bằng bản đổi số (song sinh)', () => {
  const KHO: CauThu[] = [
    { qid: 'Q1', maDe: TO11, phan: 'I', dang: 'D1', mucDo: 'TH', correct: 'B' },
    { qid: 'Q3', maDe: TO11, phan: 'III', dang: 'D3', mucDo: 'VD', correct: '2,24' },
  ]
  it('Phần I: trả câu đổi số CÓ đáp án + kiểu thay_so; Phần III: đáp số đúng dạng chấm (dấu phẩy); không đáp án câu gốc', async () => {
    const { d, env } = dung(KHO)
    await themSongSinh(d, env, 'Q1', [ssI(0), ssI(1)])
    await themSongSinh(d, env, 'Q3', [ssIII(7)])
    const r = await thayGoi(env, { sbd: ['S1'], cau: { S1: [yc('Q1', 'I', 'hieu', 'D1'), yc('Q3', 'III', 'van_dung', 'D3')] } })
    expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
    expect(r.bat).toBe(true)
    const q1 = r.em.S1.Q1
    expect(q1).toMatchObject({ cach: 'ss', kieu: 'thay_so', phan: 'I' })
    expect(q1.id).toMatch(/^Q1~ss[01]$/)
    expect(q1.cau).toMatchObject({ id: q1.id, phan: 'I', correct: 'C' })
    expect(q1.cau.choices).toHaveLength(4)
    expect(q1.cau.text).toContain('Song sinh')
    expect(r.em.S1.Q3).toMatchObject({ cach: 'ss', kieu: 'thay_so', id: 'Q3~ss0', phan: 'III' })
    expect(r.em.S1.Q3.cau).toMatchObject({ correct: '7,5', phan: 'III' })
    expect(r.dem).toEqual({ ss: 2, bt: 0, ae: 0, giu: 0 })
    // câu thay không mang chữ của câu gốc (em không nhận ra bằng trí nhớ)
    expect(JSON.stringify(r.em.S1)).not.toContain('Đề câu Q1')
  })
  it('em đã làm bản nào thì lấy bản CHƯA làm; làm hết ⇒ bản làm lâu nhất; tất định (gọi lại ra đúng bản cũ)', async () => {
    const { d, env } = dung(KHO)
    await themSongSinh(d, env, 'Q1', [ssI(0), ssI(1)])
    ghi(d, 'Q1~ss0', 1, '2026-10-01')
    const goi = () => thayGoi(env, { sbd: ['S1'], cau: { S1: [yc('Q1', 'I', 'hieu', 'D1')] } })
    expect((await goi()).em.S1.Q1.id).toBe('Q1~ss1')
    expect((await goi()).em.S1.Q1.id).toBe('Q1~ss1')
    ghi(d, 'Q1~ss1', 0, '2026-10-04')
    expect((await goi()).em.S1.Q1.id).toBe('Q1~ss0') // gặp hết ⇒ bản gặp lâu nhất (01/10)
  })
  it('lượt lặp của game ghi "<qid>#n" vẫn được coi là ĐÃ LÀM bản ấy; bản làm sau ngày chốt không tính', async () => {
    const { d, env } = dung(KHO)
    await themSongSinh(d, env, 'Q1', [ssI(0), ssI(1)])
    ghi(d, 'Q1~ss1#3', 1, '2026-10-02')
    const goi = () => thayGoi(env, { sbd: ['S1'], cau: { S1: [yc('Q1', 'I', 'hieu', 'D1')] } })
    expect((await goi()).em.S1.Q1.id).toBe('Q1~ss0')
    ghi(d, 'Q1~ss0', 1, '2026-12-31') // ngày sau ngày chốt đề: không phải "đã gặp" lúc rút
    expect((await goi()).em.S1.Q1.id).toBe('Q1~ss0')
  })
  it('song sinh thiếu dữ liệu (thiếu phương án / đáp án không phải A–D) KHÔNG được dùng; còn bản tốt thì dùng bản tốt', async () => {
    const { d, env } = dung(KHO)
    const hong = { ...ssI(5), pa: { A: '1', B: '2', D: '4' } }
    const hong2 = { ...ssI(6), dap_an: 'E' }
    await themSongSinh(d, env, 'Q1', [hong, hong2, ssI(2)])
    const r = await thayGoi(env, { sbd: ['S1'], cau: { S1: [yc('Q1', 'I', 'hieu', 'D1')] } })
    expect(r.em.S1.Q1.id).toBe('Q1~ss2')
  })
  it('câu BÙ không bao giờ bị thay; câu không có trong kho / không có bản thay ⇒ vắng khỏi kết quả (máy thầy giữ nguyên câu)', async () => {
    const { d, env } = dung(KHO)
    await themSongSinh(d, env, 'Q1', [ssI(0)])
    const r = await thayGoi(env, { sbd: ['S1'], cau: { S1: [yc('Q1', 'I', 'hieu', 'D1', { bu: true }), yc('Q3', 'III', 'van_dung', 'D3'), yc('KHONG-CO', 'I', 'hieu', 'D9')] } })
    expect(r.em.S1.Q1).toBeUndefined()
    expect(r.em.S1.Q3).toBeUndefined()
    expect(r.em.S1['KHONG-CO']).toBeUndefined()
    expect(r.dem.giu).toBe(2) // câu bù không đếm
  })
})

describe('/ca/cau-thay-so — câu LÝ THUYẾT, Phần II, câu chưa có bản đổi số ⇒ CÂU ANH EM (cách thay câu lý thuyết)', () => {
  const dangL = 'DL'
  const LT: CauThu = { qid: 'LT1', maDe: TO11, phan: 'I', dang: dangL, mucDo: 'TH', correct: 'B' }
  const AE1: CauThu = { qid: 'AE1', maDe: TO11, phan: 'I', dang: dangL, mucDo: 'TH', correct: 'C' }
  const KHO: CauThu[] = [
    LT, AE1,
    { qid: 'AE_NHOM', maDe: TO11, phan: 'I', dang: dangL, mucDo: 'TH', correct: 'A', group: 'g-LT1' }, // cùng nhóm nội dung ⇒ loại
    { qid: 'AE_K10', maDe: TO10, phan: 'I', dang: dangL, mucDo: 'TH', correct: 'A' }, // khác khối ⇒ loại
    { qid: 'AE_K12', maDe: TO12, phan: 'I', dang: dangL, mucDo: 'TH', correct: 'A' }, // khác khối ⇒ loại
    { qid: 'AE_PHAN', maDe: TO11, phan: 'III', dang: dangL, mucDo: 'TH', correct: '1' }, // khác phần ⇒ loại
    { qid: 'AE_TL', maDe: TO11, phan: 'I', dang: dangL, mucDo: 'TH', correct: 'A', tuLuan: true }, // tự luận ⇒ loại
    { qid: 'P2', maDe: TO11, phan: 'II', dang: 'D2', mucDo: 'TH', correct: 'DSSD' },
    { qid: 'P2B', maDe: TO11, phan: 'II', dang: 'D2', mucDo: 'TH', correct: 'SDDS' },
    { qid: 'CT1', maDe: TO11, phan: 'I', dang: 'DC', mucDo: 'TH', correct: 'B' }, // tính toán, KHÔNG có song sinh ⇒ câu anh em
    { qid: 'CT1B', maDe: TO11, phan: 'I', dang: 'DC', mucDo: 'TH', correct: 'A' },
    { qid: 'CODON', maDe: TO11, phan: 'I', dang: 'DX', mucDo: 'TH', correct: 'A' }, // dạng chỉ có MỘT câu ⇒ không có anh em
  ]
  const LTQ = yc('LT1', 'I', 'hieu', dangL, { lyThuyet: true })

  it('câu lý thuyết: KHÔNG thay số dù có song sinh; thay bằng câu cùng dạng, cùng phần, khác nhóm, đúng khối, hợp lệ; không lộ đáp án', async () => {
    const { d, env } = dung(KHO)
    await themSongSinh(d, env, 'LT1', [ssI(0), ssI(1)])
    const r = await thayGoi(env, { sbd: ['S1'], cau: { S1: [LTQ] } })
    expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
    expect(r.em.S1.LT1).toMatchObject({ cach: 'ae', kieu: 'cung_dang', id: 'AE1', phan: 'I', maDe: TO11 })
    expect(r.em.S1.LT1.cau).toBeUndefined() // câu thật: máy thầy lấy nội dung trong kho máy mình
    expect(JSON.stringify(r.em)).not.toContain('"correct"')
    expect(r.dem).toEqual({ ss: 0, bt: 0, ae: 1, giu: 0 })
  })
  it('em ĐÃ gặp câu anh em ⇒ không chọn lại (hết câu chưa gặp thì thôi, không lặp)', async () => {
    const { d, env } = dung(KHO)
    ghi(d, 'AE1', 1, '2026-10-05')
    const r = await thayGoi(env, { sbd: ['S1'], cau: { S1: [LTQ] } })
    expect(r.em.S1.LT1?.id).not.toBe('AE1')
    for (const sai of ['AE_NHOM', 'AE_K10', 'AE_K12', 'AE_PHAN', 'AE_TL', 'LT1']) expect(r.em.S1.LT1?.id).not.toBe(sai)
  })
  it('câu anh em không trùng một câu khác ĐÃ có trong đề của em (kể cả câu bù)', async () => {
    const { env } = dung(KHO)
    const r = await thayGoi(env, { sbd: ['S1'], cau: { S1: [LTQ, yc('AE1', 'I', 'hieu', dangL, { bu: true })] } })
    expect(r.em.S1.LT1).toBeUndefined() // ứng viên duy nhất AE1 đã nằm trong đề
    expect(r.dem.giu).toBe(1)
  })
  it('Phần II ⇒ câu anh em Phần II; câu tính toán chưa có bản đổi số ⇒ câu anh em (kiểu cùng dạng); dạng không có anh em ⇒ vắng', async () => {
    const { env } = dung(KHO)
    const r = await thayGoi(env, { sbd: ['S1'], cau: { S1: [yc('P2', 'II', 'hieu', 'D2'), yc('CT1', 'I', 'hieu', 'DC'), yc('CODON', 'I', 'hieu', 'DX')] } })
    expect(r.em.S1.P2).toMatchObject({ cach: 'ae', kieu: 'cung_dang', id: 'P2B', phan: 'II' })
    expect(r.em.S1.CT1).toMatchObject({ cach: 'ae', kieu: 'cung_dang', id: 'CT1B' })
    expect(r.em.S1.CODON).toBeUndefined()
  })
  it('hai câu cùng dạng trong một đề ⇒ hai câu anh em KHÁC nhau (câu trước đã chọn không bị chọn lại)', async () => {
    const kho = [...KHO, { qid: 'LT2', maDe: TO11, phan: 'I' as const, dang: dangL, mucDo: 'TH', correct: 'B' }, { qid: 'AE2', maDe: TO11, phan: 'I' as const, dang: dangL, mucDo: 'TH', correct: 'D' }]
    const { env } = dung(kho)
    const r = await thayGoi(env, { sbd: ['S1'], cau: { S1: [LTQ, yc('LT2', 'I', 'hieu', dangL, { lyThuyet: true })] } })
    const a = r.em.S1.LT1.id, b = r.em.S1.LT2.id
    expect([a, b].sort()).toEqual(['AE1', 'AE2'])
  })
})

describe('/ca/cau-thay-so — BIẾN THỂ BẰNG MÃ khi câu chưa có song sinh (dạng có bộ sinh, đúng khối)', () => {
  const DANG = 'KIM_LOAI.DIEU_CHE.TINH_KHOI_LUONG'
  const KHO: CauThu[] = [
    { qid: 'B1', maDe: TO12, phan: 'I', dang: DANG, mucDo: 'biet', correct: 'A' },
    { qid: 'B3', maDe: TO12, phan: 'III', dang: DANG, mucDo: 'biet', correct: '60' },
  ]
  it('em lớp 12 + câu khối 12 ⇒ biến thể ~bt<k> có 4 phương án / đáp số, đáp án tính bằng mã; tất định; hạt em đã làm bị bỏ', async () => {
    const { env, d } = dung(KHO, '12A1')
    const goi = () => thayGoi(env, { sbd: ['S1'], cau: { S1: [yc('B1', 'I', 'biet', DANG), yc('B3', 'III', 'biet', DANG)] } })
    const r = await goi()
    expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
    expect(r.em.S1.B1).toMatchObject({ cach: 'bt', kieu: 'thay_so', phan: 'I' })
    expect(r.em.S1.B1.id).toMatch(/^B1~bt\d+$/)
    expect(r.em.S1.B1.cau.choices).toHaveLength(4)
    expect(r.em.S1.B1.cau.correct).toMatch(/^[ABCD]$/)
    expect(r.em.S1.B3).toMatchObject({ cach: 'bt', kieu: 'thay_so', phan: 'III' })
    expect(r.em.S1.B3.cau.correct).toMatch(/^-?\d+(,\d+)?$/)
    expect(JSON.stringify(r.em.S1)).not.toContain('solution')
    expect(JSON.stringify((await goi()).em)).toBe(JSON.stringify(r.em)) // tất định
    // em đã làm đúng hạt ấy ⇒ lần sau sang hạt khác
    ghi(d, r.em.S1.B1.id, 1, '2026-10-01')
    const sau = await goi()
    expect(sau.em.S1.B1.id).not.toBe(r.em.S1.B1.id)
  })
  it('LUẬT KHỐI: em lớp 11 + câu khối 12 ⇒ KHÔNG biến thể (và không câu anh em khác khối) ⇒ giữ nguyên câu', async () => {
    const { env } = dung(KHO, '11A1')
    const r = await thayGoi(env, { sbd: ['S1'], cau: { S1: [yc('B1', 'I', 'biet', DANG), yc('B3', 'III', 'biet', DANG)] } })
    expect(r.em.S1.B1).toBeUndefined()
    expect(r.em.S1.B3).toBeUndefined()
  })
  it('câu lý thuyết có dạng có bộ sinh ⇒ vẫn KHÔNG biến thể (theo cách thay câu lý thuyết)', async () => {
    const { env } = dung(KHO, '12A1')
    const r = await thayGoi(env, { sbd: ['S1'], cau: { S1: [yc('B1', 'I', 'biet', DANG, { lyThuyet: true })] } })
    expect(r.em.S1.B1?.cach).not.toBe('bt')
  })
})

describe('/ca/cau-thay-so — công tắc · giới hạn · mã bí mật · lỗi một em không làm hỏng cả lượt', () => {
  const KHO: CauThu[] = [{ qid: 'Q1', maDe: TO11, phan: 'I', dang: 'D1', mucDo: 'TH', correct: 'B' }]
  it('không mã bí mật ⇒ từ chối; quá số em mỗi lượt ⇒ lỗi rõ; danh sách rỗng ⇒ ok rỗng', async () => {
    const { env } = dung(KHO)
    expect((await thayGoi(env, { sbd: ['S1'], cau: {} }, false)).ok).toBe(false)
    const nhieu = await thayGoi(env, { sbd: ['E1', 'E2', 'E3'], cau: {} })
    expect(nhieu.ok).toBe(false)
    expect(String(nhieu.error)).toMatch(/Tối đa 2 em/)
    expect(await thayGoi(env, { sbd: [], cau: {} })).toMatchObject({ ok: true, em: {} })
  })
  it('công tắc cau_hinh.da_dung_thay_so = {"bat":false} ⇒ bat:false, không thay gì; xoá công tắc ⇒ bật lại', async () => {
    const { d, env } = dung(KHO)
    await themSongSinh(d, env, 'Q1', [ssI(0)])
    d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('da_dung_thay_so','{"bat":false}','x')`)
    xoaDemCauHinh(env)
    const tat = await thayGoi(env, { sbd: ['S1'], cau: { S1: [yc('Q1', 'I', 'hieu', 'D1')] } })
    expect(tat).toMatchObject({ ok: true, bat: false, em: {} })
    d.sql.exec(`DELETE FROM cau_hinh WHERE khoa='da_dung_thay_so'`)
    xoaDemCauHinh(env)
    expect((await thayGoi(env, { sbd: ['S1'], cau: { S1: [yc('Q1', 'I', 'hieu', 'D1')] } })).em.S1.Q1.id).toBe('Q1~ss0')
  })
  it('đầu vào hỏng (qid trống, phần lạ, trùng qid, không phải mảng) bị bỏ, không làm lỗi lượt', async () => {
    const { env } = dung(KHO)
    const r = await thayGoi(env, { sbd: ['S1', 'S2'], cau: { S1: [null, 5, { qid: '', phan: 'I' }, { qid: 'X', phan: 'IV' }, yc('Q1', 'I', 'hieu', 'D1'), yc('Q1', 'I', 'hieu', 'D1')], S2: 'hong' } })
    expect(r.ok).toBe(true)
    expect(r.em.S2).toEqual({})
  })
})

describe('/vao-thi — em vào MUỘN ở ca "Kiểm chứng câu đã đúng": thay bằng câu đổi số ĐÃ có trong kho ca, nhãn rõ, không đáp án', () => {
  const KEY = {
    phanI: [
      { id: 'Q1', text: 'Câu Q1 tính m', choices: ['1', '2', '3', '4'], correct: 'B', mucDo: 'biet', kieu: 'bai_tap' },
      { id: 'Q1~ss0', text: 'Song sinh 0 của Q1', choices: ['5', '6', '7', '8'], correct: 'C', mucDo: 'biet', kieu: 'bai_tap' },
      { id: 'Q1~ss1', text: 'Song sinh 1 của Q1', choices: ['5', '6', '7', '8'], correct: 'D', mucDo: 'biet', kieu: 'bai_tap' },
      { id: 'Q2', text: 'Câu Q2 lý thuyết', choices: ['a', 'b', 'c', 'd'], correct: 'A', mucDo: 'hieu', kieu: 'ly_thuyet' },
      { id: 'Q2~ss0', text: 'Song sinh 0 của Q2', choices: ['a', 'b', 'c', 'd'], correct: 'A', mucDo: 'hieu', kieu: 'ly_thuyet' },
      { id: 'Q9', text: 'Câu Q9 tính', choices: ['1', '2', '3', '4'], correct: 'B', mucDo: 'hieu', kieu: 'bai_tap' },
    ],
    phanII: [],
    phanIII: [{ id: 'Q7', text: 'Tính V', correct: '2,24', mucDo: 'van_dung' }],
  }
  async function dungCa() {
    const { d, env } = dung([
      { qid: 'Q1', maDe: TO11, phan: 'I', dang: 'D1', mucDo: 'NB', correct: 'B' },
      { qid: 'Q2', maDe: TO11, phan: 'I', dang: 'D2', mucDo: 'TH', correct: 'A' },
      { qid: 'Q7', maDe: TO11, phan: 'III', dang: 'D7', mucDo: 'VD', correct: '2,24' },
      { qid: 'Q9', maDe: TO11, phan: 'I', dang: 'D9', mucDo: 'TH', correct: 'B' },
    ])
    d.sql.exec("INSERT INTO ca (ma_ca, ten_ca, trang_thai, thoi_gian_phut, loai, cong_bo, nguong_lan, nguong_giay, cap_nhat_luc) VALUES ('K3','Kiểm tra tuần 3','dong',45,'thi','ngay',3,30,'x')")
    d.sql.prepare(
      `INSERT INTO ca (ma_ca, ten_ca, trang_thai, thoi_gian_phut, loai, cong_bo, nguong_lan, nguong_giay, bank_r2, so_cau_json, bo_theo_em_json, cap_nhat_luc, lop, phong_cho, de_rieng, bat_dau_thi_luc, len_bang, pham_vi_hoi_lai)
       VALUES ('C1','Ca kiểm chứng','mo',45,'thi','khong',3,30,'de/C1.json',?,?,'x','11A1',1,1,'2026-10-02T02:00:00.000Z',0,'da_dung')`,
    ).run(JSON.stringify({ I: 3, II: 0, III: 1 }), JSON.stringify({ bo: { S2: ['Q9'] }, cheDo: 'da_dung', daDung: { S2: { Q9: 'Luyện đề · 25/09 · Thông hiểu' } } }))
    await env.DE!.put('key/C1.json', JSON.stringify(KEY))
    await env.DE!.put('de/C1.json', JSON.stringify(KEY))
    ghi(d, 'Q1', 1, '2026-09-28')
    ghi(d, 'Q2', 1, '2026-09-28')
    ghi(d, 'Q7', 1, '2026-09-28')
    d.sql.prepare("UPDATE su_kien_hoc SET nguon='thi', ma_nguon='K3' WHERE qid IN ('Q1','Q2','Q7')").run()
    d.sql.prepare("INSERT INTO chien_dich(id,ten,lop,sbd_json,ma_de_json,qid_json,han_nop,tao_luc,trang_thai) VALUES('CD1','Ôn chương 1','11A1','[\"S1\"]',?,?,'2026-10-30','2026-09-01T00:00:00Z','dang_chay')")
      .run(JSON.stringify([TO11]), JSON.stringify(['Q1', 'Q2', 'Q7', 'Q9']))
    return { d, env }
  }
  const vao = (env: Env) => goiWorker(worker, env, '/vao-thi', { maCa: 'C1', sbd: 'S1', idThietBi: 'm1' })

  it('câu tính toán có song sinh sẵn trong kho ca ⇒ thay số (nhãn rõ); câu lý thuyết ⇒ GIỮ NGUYÊN dù kho có song sinh; câu không có bản đổi số ⇒ nguyên văn; không đáp án', async () => {
    const { d: db, env } = await dungCa()
    const v = await vao(env)
    expect(v.ok, JSON.stringify(v).slice(0, 300)).toBe(true)
    const bo: string[] = v.boTheoEm.bo.S1
    expect(bo.some((q) => /^Q1~ss[01]$/.test(q))).toBe(true)
    expect(bo).not.toContain('Q1')
    expect(bo).toContain('Q2')
    expect(bo).not.toContain('Q2~ss0')
    expect(bo).toContain('Q7')
    const nhan = v.boTheoEm.daDung.S1 as Record<string, string>
    const ss = bo.find((q) => /^Q1~ss/.test(q))!
    expect(nhan[ss]).toBe('Câu này thay số của câu em đã đúng ở Ca Kiểm tra tuần 3 · 28/09 · Nhận biết')
    expect(nhan.Q2).toBe('Ca Kiểm tra tuần 3 · 28/09 · Thông hiểu') // lý thuyết: nhãn nơi như trước
    expect(nhan.Q7).toBe('Ca Kiểm tra tuần 3 · 28/09 · Vận dụng')
    expect(nhan.Q1).toBeUndefined()
    expect(JSON.stringify(v)).not.toContain('correct')
    expect(v.boTheoEm.daDung.S2).toBeUndefined()
    expect(v.boTheoEm.demDaDung).toBeUndefined()
    // gói đã ghi cho máy thầy chấm: bộ câu + nhãn khớp, đếm đúng/sai cũ theo qid mới
    const banDo = JSON.parse((db.sql.prepare("SELECT bo_theo_em_json AS b FROM ca WHERE ma_ca='C1'").get() as { b: string }).b)
    expect(banDo.bo.S1).toEqual(bo)
    expect(banDo.demDaDung.S1[ss]).toEqual([1, 0])
    // vào lại ⇒ đúng bộ đã ghi (không thay lại bản khác)
    const lai = await vao(env)
    expect(lai.boTheoEm.bo.S1).toEqual(bo)
    expect(lai.boTheoEm.daDung.S1).toEqual(nhan)
  })
  it('em đã làm bản song sinh nào ⇒ ưu tiên bản kia', async () => {
    const { d: db, env } = await dungCa()
    ghi(db, 'Q1~ss0', 1, '2026-10-03')
    const v = await vao(env)
    expect(v.boTheoEm.bo.S1).toContain('Q1~ss1')
    expect(v.boTheoEm.bo.S1).not.toContain('Q1~ss0')
  })
  it('công tắc TẮT ⇒ em vào muộn nhận nguyên văn như trước (nhãn "Em đã làm đúng"), không bị chặn', async () => {
    const { d: db, env } = await dungCa()
    db.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('da_dung_thay_so','{"bat":false}','x')`)
    xoaDemCauHinh(env)
    const v = await vao(env)
    expect(v.ok).toBe(true)
    expect(v.boTheoEm.bo.S1).toContain('Q1')
    expect(v.boTheoEm.daDung.S1.Q1).toBe('Ca Kiểm tra tuần 3 · 28/09 · Nhận biết')
  })
})

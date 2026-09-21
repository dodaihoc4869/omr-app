// @vitest-environment node
// NHẮC TỰ ĐỘNG bài tập về nhà (luật Boss 21/09, prompt-hom-nay-gv-v2.md phần A): cron 30 phút, khung 07:00–21:30 giờ VN, 4 mốc M1–M4 theo MẪU có số thật, trần, gộp tin phụ huynh, idempotent, cờ.
// KHÔNG dùng AI. Thầy không bấm gì: máy chủ tự gửi vào `canh_bao_thay` (em xem ở khoá `canhBaoThay`, phụ huynh ở `/ph/ke-hoach`), thầy chỉ xem ở `/gv/chua-nop`.
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { gameToken, parentPass } from '../server/src/game-v2-auth'
import {
  CAU_HINH_MAC_DINH, chuHanCoThu, chuHanM2, docCauHinhNhac, gvNhacTuDong, khoaLuot, lanChayKe, loiEmTheoMoc, loiPhGop, loiPhMotBai, nhacKeCuaEm, ngayGuiM2, nhacTuDong, trongKhung, type DauVaoLoi,
} from '../server/src/nhac-tu-dong'
import { docLichDaLuu, moLucChang } from '../server/src/btvn-nang-do-chang'
import { goiWorker, type D1That } from './_d1-that'
import { BAY_GIO, cauThay, dung, giao, gio, maBtvn, mo, nopChang, DAP_AN_DUNG, boCuaEm } from './_btvn-nang-do-mau'

afterEach(() => vi.useRealTimers())

const VN = (ngay: string, hhmm: string): number => Date.parse(`${ngay}T${hhmm}:00+07:00`)
const HAN_23_59_T6 = '2026-09-25T16:59:00.000Z' // 23:59 VN thứ Sáu 25/09
const chay = (d: D1That, ngay: string, hhmm: string, tuyChon: { boQuaChiemLuot?: boolean } = { boQuaChiemLuot: true }) => nhacTuDong(d.env, VN(ngay, hhmm), tuyChon)
const dong = (d: D1That, where = '1=1') => d.sql.prepare(`SELECT * FROM canh_bao_thay WHERE ${where} ORDER BY id`).all() as Record<string, string | number | null>[]
const emDongs = (d: D1That, moc?: string) => dong(d, moc ? `moc = '${moc}'` : "moc <> 'tay'")

/** Bài cá nhân hoá giao cho S1–S3 (giao 10:00 22/09, hạn 23:59 thứ Sáu 25/09). Hồ sơ lớp: S1 Em Một, S2 Em Hai, S3 Em Ba. */
async function bai(soEm = 3, han = HAN_23_59_T6) {
  gio(BAY_GIO)
  const d = dung(soEm)
  const ten = ['Em Một', 'Em Hai', 'Em Ba']
  for (let i = 1; i <= soEm; i++) {
    d.sql.prepare("INSERT OR REPLACE INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,?,'mk','x')").run(`S${i}`, ten[i - 1], i < 3 ? '12A' : '12B')
  }
  expect((await giao(d, { cau: cauThay(), hanNop: han })).ok).toBe(true)
  d.sql.exec("UPDATE btvn_em SET ho_ten = CASE sbd WHEN 'S1' THEN 'Em Một' WHEN 'S2' THEN 'Em Hai' ELSE 'Em Ba' END")
  return d
}

describe('hàm thuần: cờ, khung giờ, lượt 30 phút, giờ dự kiến', () => {
  it('docCauHinhNhac: vắng/hỏng ⇒ MẶC ĐỊNH BẬT 07:00–21:30; chỉ bat === false mới tắt; mốc/bài tắt được lọc; giờ sai ⇒ giờ mặc định', () => {
    for (const v of [undefined, null, '', 'rác', '[]', '{}', '{"bat":true}', 5]) expect(docCauHinhNhac(v), String(v)).toEqual(CAU_HINH_MAC_DINH)
    expect(CAU_HINH_MAC_DINH).toEqual({ bat: true, mocTat: [], baiTat: [], gioTu: '07:00', gioDen: '21:30' })
    expect(docCauHinhNhac('{"bat":false}').bat).toBe(false)
    expect(docCauHinhNhac({ bat: true, mocTat: ['M3', 'X9', 'M1'], baiTat: ['B1', ''], gioTu: '08:00', gioDen: '25:99' })).toEqual({ bat: true, mocTat: ['M3', 'M1'], baiTat: ['B1'], gioTu: '08:00', gioDen: '21:30' })
  })
  it('trongKhung: 07:00 và 21:30 nằm TRONG khung; 06:59 và 21:31 ngoài', () => {
    const c = CAU_HINH_MAC_DINH
    expect([['06:59', false], ['07:00', true], ['12:00', true], ['21:30', true], ['21:31', false], ['23:59', false], ['00:00', false]].map(([h]) => trongKhung(VN('2026-09-25', h as string), c))).toEqual([false, true, true, true, false, false, false])
  })
  it('khoaLuot: cùng lượt 30 phút cùng khoá; lanChayKe nhảy tới đầu lượt kế TRONG khung (qua đêm ⇒ 07:00)', () => {
    expect(khoaLuot(VN('2026-09-25', '20:00'))).toBe(khoaLuot(VN('2026-09-25', '20:29')))
    expect(khoaLuot(VN('2026-09-25', '20:00'))).not.toBe(khoaLuot(VN('2026-09-25', '20:30')))
    expect(lanChayKe(VN('2026-09-25', '19:47'), CAU_HINH_MAC_DINH)).toBe(new Date(VN('2026-09-25', '20:00')).toISOString())
    expect(lanChayKe(VN('2026-09-25', '21:45'), CAU_HINH_MAC_DINH)).toBe(new Date(VN('2026-09-26', '07:00')).toISOString())
    expect(lanChayKe(VN('2026-09-25', '03:10'), CAU_HINH_MAC_DINH)).toBe(new Date(VN('2026-09-25', '07:00')).toISOString())
  })
  it('chuHanCoThu: "23:59 Thứ Sáu"', () => {
    expect(chuHanCoThu(HAN_23_59_T6)).toBe('23:59 Thứ Sáu')
  })
  it('nhacKeCuaEm: em chưa mở ⇒ M1 (24 giờ trước hạn, trong khung); sau M1 ⇒ M2 20:00 ngày hạn (hạn 23:59); sau M2 ⇒ M4 07:00 sáng hôm sau; tắt/hết mốc ⇒ vắng', () => {
    const c = CAU_HINH_MAC_DINH
    const co = (daCoMoc: string[], nowMs: number, chuaMo = true, cfg = c) => nhacKeCuaEm({ hanIso: HAN_23_59_T6, nowMs, chuaMo, daCoMoc: new Set(daCoMoc), cfg })
    expect(co([], VN('2026-09-23', '10:00'))).toEqual({ moc: 'M1', luc: new Date(VN('2026-09-25', '07:00')).toISOString() }) // 24 giờ trước hạn = 23:59 24/09 (ngoài khung) ⇒ 07:00 sáng hạn
    expect(co(['M1'], VN('2026-09-25', '08:00'))).toEqual({ moc: 'M2', luc: new Date(VN('2026-09-25', '20:00')).toISOString() })
    expect(co(['M1', 'M2'], VN('2026-09-25', '21:00'))).toEqual({ moc: 'M4', luc: new Date(VN('2026-09-26', '07:00')).toISOString() })
    expect(co(['M1', 'M2', 'M4'], VN('2026-09-26', '08:00'))).toBeUndefined()
    expect(co([], VN('2026-09-23', '10:00'), false)?.moc).toBe('M2') // em đã mở ⇒ không có M1
    expect(co([], VN('2026-09-23', '10:00'), true, { ...c, bat: false })).toBeUndefined()
    expect(co([], VN('2026-09-23', '10:00'), true, { ...c, mocTat: ['M1'] })?.moc).toBe('M2')
  })
  it('nhacKeCuaEm M1: hạn ĐÚNG đầu lượt 30 phút (12:00) ⇒ M1 hiện 12:00 ngày trước hạn (lượt đó đã đủ điều kiện), không nhảy sang 12:30; hạn 12:10 ⇒ lượt 12:30 (12:10 không phải đầu lượt); mốc là bây giờ ⇒ lượt kế', () => {
    const co = (hhmm: string, nowMs: number) => nhacKeCuaEm({ hanIso: new Date(VN('2026-09-24', hhmm)).toISOString(), nowMs, chuaMo: true, daCoMoc: new Set(), cfg: CAU_HINH_MAC_DINH })
    expect(co('12:00', VN('2026-09-21', '11:00'))).toEqual({ moc: 'M1', luc: new Date(VN('2026-09-23', '12:00')).toISOString() })
    expect(co('12:10', VN('2026-09-21', '11:00'))).toEqual({ moc: 'M1', luc: new Date(VN('2026-09-23', '12:30')).toISOString() })
    expect(co('12:00', VN('2026-09-23', '12:00'))).toEqual({ moc: 'M1', luc: new Date(VN('2026-09-23', '12:30')).toISOString() }) // đã tới mốc: lượt kế
  })
  it('ngayGuiM2: hạn từ 20:30 trở đi ⇒ M2 gửi chính ngày hạn; hạn trước 20:30 (00:00, 12:00 trưa, 20:29) ⇒ tối HÔM TRƯỚC', () => {
    const h = (hhmm: string) => VN('2026-09-26', hhmm)
    expect(['00:00', '07:00', '12:00', '20:29'].map((g) => ngayGuiM2(h(g)))).toEqual(['2026-09-25', '2026-09-25', '2026-09-25', '2026-09-25'])
    expect(['20:30', '23:59'].map((g) => ngayGuiM2(h(g)))).toEqual(['2026-09-26', '2026-09-26'])
  })
  it('nhacKeCuaEm: hạn 12:00 trưa ⇒ M2 lúc 20:00 HÔM TRƯỚC hạn (không phải ngày hạn); sau đó M4 07:00 sáng hôm sau hạn', () => {
    const han = new Date(VN('2026-09-26', '12:00')).toISOString()
    const co = (daCoMoc: string[], nowMs: number) => nhacKeCuaEm({ hanIso: han, nowMs, chuaMo: false, daCoMoc: new Set(daCoMoc), cfg: CAU_HINH_MAC_DINH })
    expect(co([], VN('2026-09-24', '10:00'))).toEqual({ moc: 'M2', luc: new Date(VN('2026-09-25', '20:00')).toISOString() })
    expect(co(['M2'], VN('2026-09-25', '21:00'))).toEqual({ moc: 'M4', luc: new Date(VN('2026-09-27', '07:00')).toISOString() })
  })
})

describe('LỜI MẪU: số thật, xưng Thầy/Anh chị, không so bạn/doạ/emoji/gạch dài, ≤ 30 chữ mỗi câu', () => {
  const x = (o: Partial<DauVaoLoi> = {}): DauVaoLoi => ({ tenBai: 'Este – lipid', hanIso: HAN_23_59_T6, nowMs: VN('2026-09-25', '20:00'), hoTen: 'Nguyễn Thu Hà', tongChang: 5, daXongChang: 2, ...o })
  it('các mốc dùng đúng số liệu', () => {
    expect(loiEmTheoMoc('M1', x({ chang1: { soCau: 5, phut: 12 } }))).toBe('Bài tập về nhà «Este – lipid» hạn nộp 23:59 Thứ Sáu. Em chưa mở bài. Chặng 1 có 5 câu, khoảng 12 phút.')
    expect(loiEmTheoMoc('M1', x({ soCauBai: 40 }))).toContain('Bài có 40 câu.') // bài thường: không nói chặng
    expect(loiEmTheoMoc('M1', x())).not.toMatch(/Chặng 1|khoảng/) // không có số thật ⇒ không bịa
    expect(loiEmTheoMoc('M2', x())).toBe('Hạn nộp 23:59 tối nay của Bài tập về nhà «Este – lipid». Em còn 3 trong 5 chặng.')
    expect(loiEmTheoMoc('M2', x({ tongChang: undefined }))).toContain('Em chưa nộp bài.')
    expect(loiEmTheoMoc('M3', x({ chamChang: 2, soCauChangKe: 6 }))).toBe('Em đang chậm 2 chặng so với lịch của Bài tập về nhà «Este – lipid». Tối nay làm một chặng (6 câu) là bắt kịp.')
    expect(loiEmTheoMoc('M4', x({ nowMs: VN('2026-09-26', '07:00'), daLam: 7, tongCau: 25 }))).toBe('Bài tập về nhà «Este – lipid» đã quá hạn 23:59 hôm qua. Em đã làm 7 trong 25 câu.')
  })
  it('chuHanM2: hạn hôm nay ⇒ "tối nay"; hạn ngày mai ⇒ "12:00 trưa mai (Thứ Bảy 26/09)" (buổi theo giờ); ngày khác như chuHan', () => {
    const t = (ngay: string, hhmm: string) => new Date(VN(ngay, hhmm)).toISOString()
    const nay = VN('2026-09-25', '20:00')
    expect(chuHanM2(HAN_23_59_T6, nay)).toBe('23:59 tối nay')
    expect(chuHanM2(t('2026-09-26', '12:00'), nay)).toBe('12:00 trưa mai (Thứ Bảy 26/09)')
    expect([['09:00', 'sáng'], ['10:59', 'sáng'], ['11:00', 'trưa'], ['13:29', 'trưa'], ['13:30', 'chiều'], ['17:59', 'chiều'], ['18:00', 'tối'], ['20:15', 'tối']].map(([g]) => chuHanM2(t('2026-09-26', g!), nay).split(' ')[1]))
      .toEqual(['sáng', 'sáng', 'trưa', 'trưa', 'chiều', 'chiều', 'tối', 'tối'])
    expect(chuHanM2(t('2026-09-28', '12:00'), nay)).toBe('12:00 28/09')
    expect(loiEmTheoMoc('M2', x({ hanIso: t('2026-09-26', '12:00') }))).toBe('Hạn nộp 12:00 trưa mai (Thứ Bảy 26/09) của Bài tập về nhà «Este – lipid». Em còn 3 trong 5 chặng.')
    expect(loiPhMotBai('M2', x({ hanIso: t('2026-09-26', '12:00') }))).toBe('Anh/chị, em Hà còn 3 trong 5 chặng của Bài tập về nhà «Este – lipid», hạn nộp 12:00 trưa mai (Thứ Bảy 26/09). Anh/chị nhắc em mở app giúp Thầy.')
    expect(loiPhGop('Hà', [{ m: 'M2', x: x({ hanIso: t('2026-09-26', '12:00') }) }, { m: 'M2', x: x() }])).toContain('«Este – lipid» hạn nộp 12:00 trưa mai (Thứ Bảy 26/09), còn 3 trong 5 chặng; «Este – lipid» hạn nộp 23:59 tối nay, còn 3 trong 5 chặng.')
  })
  it('lời phụ huynh: một bài; nhiều bài GỘP một tin; không tên ⇒ "con"', () => {
    expect(loiPhMotBai('M2', x())).toBe('Anh/chị, em Hà còn 3 trong 5 chặng của Bài tập về nhà «Este – lipid», hạn nộp 23:59 tối nay. Anh/chị nhắc em mở app giúp Thầy.')
    expect(loiPhMotBai('M4', x({ nowMs: VN('2026-09-26', '07:00'), daLam: 7, tongCau: 25, hoTen: '' }))).toBe('Anh/chị, con chưa nộp Bài tập về nhà «Este – lipid», đã quá hạn 23:59 hôm qua, con đã làm 7 trong 25 câu. Anh/chị nhắc con mở bài và nộp.')
    const gop = loiPhGop('Nguyễn Thu Hà', [{ m: 'M2', x: x() }, { m: 'M2', x: x({ tenBai: 'Amin', tongChang: 4, daXongChang: 3 }) }])
    expect(gop).toBe('Anh/chị, em Hà còn 2 bài tập về nhà chưa nộp: «Este – lipid» hạn nộp 23:59 tối nay, còn 3 trong 5 chặng; «Amin» hạn nộp 23:59 tối nay, còn 1 trong 4 chặng. Anh/chị nhắc em mở app giúp Thầy.')
  })
  it('mọi lời: không emoji, không gạch ngang dài, không doạ / so bạn / khen suông; mỗi câu ≤ 30 chữ', () => {
    const cacLoi = [
      ...(['M1', 'M2', 'M3', 'M4'] as const).map((m) => loiEmTheoMoc(m, x({ chang1: { soCau: 5, phut: 12 }, chamChang: 2, soCauChangKe: 6, daLam: 3, tongCau: 20 }))),
      loiPhMotBai('M2', x()), loiPhMotBai('M4', x({ daLam: 3, tongCau: 20 })), loiPhGop('Hà', [{ m: 'M2', x: x() }, { m: 'M4', x: x({ daLam: 1, tongCau: 9 }) }]),
    ]
    for (const loi of cacLoi) {
      expect(loi).not.toMatch(/—|\p{Extended_Pictographic}|!/u)
      expect(loi).not.toMatch(/bạn|so với (bạn|lớp|em khác)|cố gắng hơn|nếu không|sẽ bị|điểm 0|trừ điểm|hy vọng|chúc/i)
      for (const cau of loi.split(/(?<=[.?;:])\s+/)) expect(cau.split(/\s+/).length, cau).toBeLessThanOrEqual(30)
    }
  })
})

describe('CHẠY MỘT LƯỢT: khung giờ, cờ, chiếm lượt 30 phút, idempotent', () => {
  it('ngoài khung ⇒ không gửi (06:59, 21:31); cờ bat = false ⇒ 0 tin; cờ vắng ⇒ BẬT', async () => {
    const d = await bai()
    expect(await chay(d, '2026-09-25', '06:59')).toMatchObject({ chay: false, lyDo: 'ngoai_khung' })
    expect(await chay(d, '2026-09-25', '21:31')).toMatchObject({ chay: false, lyDo: 'ngoai_khung' })
    d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('canh_bao_tu_dong','{"bat":false}','x')`)
    expect(await chay(d, '2026-09-25', '08:00')).toMatchObject({ chay: false, lyDo: 'tat' })
    expect(dong(d)).toEqual([])
    d.sql.exec("DELETE FROM cau_hinh WHERE khoa = 'canh_bao_tu_dong'")
    expect((await chay(d, '2026-09-25', '08:00')).chay).toBe(true)
    expect(emDongs(d).length).toBeGreaterThan(0)
  })
  it('chưa chạy migration canh_bao_thay (Worker lên trước): cron im lặng — không chiếm lượt, không ném lỗi, không đụng cau_hinh', async () => {
    const d = await bai()
    d.sql.exec('DROP TABLE canh_bao_thay')
    expect(await chay(d, '2026-09-25', '20:00', {})).toMatchObject({ chay: false, lyDo: 'chua_co_bang' })
    expect(d.sql.prepare("SELECT COUNT(*) AS n FROM cau_hinh WHERE khoa = 'nhac_tu_dong_lan'").get()).toEqual({ n: 0 })
  })
  it('chiếm lượt: cùng 30 phút chỉ CHẠY MỘT LẦN; lượt kế chạy lại', async () => {
    const d = await bai()
    const a = await chay(d, '2026-09-25', '08:00', {})
    const b = await chay(d, '2026-09-25', '08:10', {})
    expect(a.chay).toBe(true)
    expect(b).toMatchObject({ chay: false, lyDo: 'da_chay_luot_nay' })
    expect((await chay(d, '2026-09-25', '08:30', {})).chay).toBe(true)
  })
  it('IDEMPOTENT: chạy đi chạy lại cùng ngày không thêm dòng, không thêm thông báo; khoá dạng ca:<bài>:<em>:<mốc>:<ngày>', async () => {
    const d = await bai()
    await chay(d, '2026-09-25', '08:00')
    const truoc = JSON.stringify([dong(d), d.sql.prepare('SELECT * FROM student_notice ORDER BY id').all()])
    await chay(d, '2026-09-25', '08:30'); await chay(d, '2026-09-25', '09:00')
    expect(JSON.stringify([dong(d), d.sql.prepare('SELECT * FROM student_notice ORDER BY id').all()])).toBe(truoc)
    const ma = maBtvn(d)
    expect(emDongs(d).map((x) => x.id)).toEqual([`ca:${ma}:S1:M1:2026-09-25`, `ca:${ma}:S2:M1:2026-09-25`, `ca:${ma}:S3:M1:2026-09-25`])
    expect(d.sql.prepare("SELECT target FROM student_notice WHERE id = ?").get(`ca:${ma}:S1:M1:2026-09-25`)).toEqual({ target: 'canh_bao_btvn' })
  })
  it('KHÔNG dùng AI: tệp nhac-tu-dong.ts không nhập bộ não, không gọi mô hình', () => {
    const ma = readFileSync('server/src/nhac-tu-dong.ts', 'utf-8')
    expect(ma.split('\n').filter((l) => /^import /.test(l)).join('\n')).not.toMatch(/bo-nao|anthropic|openai|fetch/i)
  })
})

describe('M1 · nhắc sớm: còn ≤ 24 giờ, em CHƯA MỞ bài ⇒ EM', () => {
  it('trước 24 giờ: chưa nhắc; trong 24 giờ: nhắc CHỈ em chưa mở, lời có số thật của chặng 1; em đã mở không nhận', async () => {
    const d = await bai()
    expect((await mo(d, 'S2')).ok).toBe(true) // S2 đã mở bài
    await chay(d, '2026-09-24', '08:00') // còn ~40 giờ
    expect(emDongs(d)).toEqual([])
    const r = await chay(d, '2026-09-25', '07:30') // còn ~16 giờ
    expect(r).toMatchObject({ chay: true, soEmDuocNhac: 2, soTinPhuHuynh: 0, theoMoc: { M1: 2 } })
    const ds = emDongs(d, 'M1')
    expect(ds.map((x) => x.sbd)).toEqual(['S1', 'S3'])
    expect(ds[0]).toMatchObject({ gui_ph: 0, ph_nhom: null, loi_ph: '', trang_thai_em: 'chua_mo' })
    expect(String(ds[0]!.loi_em)).toMatch(/^Bài tập về nhà «.+» hạn nộp 23:59 Thứ Sáu\. Em chưa mở bài\. Chặng 1 có \d+ câu, khoảng \d+ phút\.$/)
  })
  it('TRẦN nhắc thường: em đã nhận tin TAY của thầy hôm nay ⇒ KHÔNG nhận M1; M1 gửi rồi không gửi lại trong ngày', async () => {
    const d = await bai()
    gio(new Date(VN('2026-09-25', '07:10')))
    expect((await goiWorker(worker, d.env, '/gv/canh-bao-nop-bai', { maBtvn: maBtvn(d), dsSbd: ['S1'] }, true)).daGui).toBe(1)
    await chay(d, '2026-09-25', '07:30')
    expect(emDongs(d, 'M1').map((x) => x.sbd)).toEqual(['S2', 'S3']) // S1 đã có tin tay hôm nay
  })
})

describe('M2 · tối hạn chót (20:00 ngày hạn) ⇒ EM + PHỤ HUYNH', () => {
  it('20:00 ngày hạn: em chưa nộp nhận M2 (còn k trong K chặng), phụ huynh nhận MỘT tin; trước 20:00 chưa; em đã nộp không nhận', async () => {
    const d = await bai()
    await mo(d, 'S1')
    d.sql.exec("UPDATE btvn_em SET nop_luc = '2026-09-25T05:00:00.000Z' WHERE sbd = 'S3'") // S3 đã nộp
    await chay(d, '2026-09-25', '19:30')
    expect(emDongs(d, 'M2')).toEqual([])
    const r = await chay(d, '2026-09-25', '20:00')
    expect(r.theoMoc).toMatchObject({ M2: 2 })
    expect(r.soTinPhuHuynh).toBe(2)
    const ds = emDongs(d, 'M2')
    expect(ds.map((x) => x.sbd)).toEqual(['S1', 'S2'])
    const tong = Number((d.sql.prepare("SELECT so_chang FROM btvn_em WHERE sbd = 'S1'").get() as { so_chang: number }).so_chang)
    expect(ds[0]!.loi_em).toMatch(new RegExp(`^Hạn nộp 23:59 tối nay của Bài tập về nhà «.+»\\. Em còn ${tong} trong ${tong} chặng\\.$`))
    expect(ds[0]).toMatchObject({ gui_ph: 1, ph_nhom: '#'.length ? `S1|2026-09-25` : '' })
    expect(String(ds[0]!.loi_ph)).toMatch(/^Anh\/chị, em Một còn \d+ trong \d+ chặng của Bài tập về nhà «.+», hạn nộp 23:59 tối nay\. Anh\/chị nhắc em mở app giúp Thầy\.$/)
    expect(ds[1]!.loi_em).toContain('Em chưa nộp bài.') // S2 chưa mở bài (chưa chốt): không có số chặng ⇒ không bịa
  })
  it('HẠN 12:00 TRƯA (thầy hay đặt): M2 gửi 20:00 HÔM TRƯỚC hạn cho em + phụ huynh, lời "Hạn nộp 12:00 trưa mai (Thứ Bảy 26/09)"; sáng/tối ngày hạn không có M2 nữa; M4 vẫn 07:00 sáng hôm sau hạn', async () => {
    const han = new Date(VN('2026-09-26', '12:00')).toISOString()
    const d = await bai(3, han)
    await mo(d, 'S1')
    await chay(d, '2026-09-25', '19:30')
    expect(emDongs(d, 'M2')).toEqual([])
    const r = await chay(d, '2026-09-25', '20:00')
    expect(r.theoMoc).toMatchObject({ M2: 3 })
    expect(r.soTinPhuHuynh).toBe(3)
    const ma = maBtvn(d)
    const ds = emDongs(d, 'M2')
    expect(ds.map((x) => x.id)).toEqual([`ca:${ma}:S1:M2:2026-09-25`, `ca:${ma}:S2:M2:2026-09-25`, `ca:${ma}:S3:M2:2026-09-25`])
    const tong = Number((d.sql.prepare("SELECT so_chang FROM btvn_em WHERE sbd = 'S1'").get() as { so_chang: number }).so_chang)
    expect(ds[0]!.loi_em).toBe(`Hạn nộp 12:00 trưa mai (Thứ Bảy 26/09) của Bài tập về nhà «${ds[0]!.ten_btvn}». Em còn ${tong} trong ${tong} chặng.`)
    expect(ds[1]!.loi_em).toBe(`Hạn nộp 12:00 trưa mai (Thứ Bảy 26/09) của Bài tập về nhà «${ds[1]!.ten_btvn}». Em chưa nộp bài.`)
    expect(String(ds[0]!.loi_ph)).toBe(`Anh/chị, em Một còn ${tong} trong ${tong} chặng của Bài tập về nhà «${ds[0]!.ten_btvn}», hạn nộp 12:00 trưa mai (Thứ Bảy 26/09). Anh/chị nhắc em mở app giúp Thầy.`)
    expect(ds[0]).toMatchObject({ gui_ph: 1, ph_nhom: 'S1|2026-09-25' })
    await chay(d, '2026-09-26', '07:30') // sáng ngày hạn: không M2 mới
    await chay(d, '2026-09-26', '20:00') // hạn đã qua
    expect(emDongs(d, 'M2')).toHaveLength(3)
    await chay(d, '2026-09-27', '07:00')
    expect(emDongs(d, 'M4').map((x) => x.sbd)).toEqual(['S1', 'S2', 'S3'])
  })
  it('M2 không đè M1 cùng lượt (em chưa mở lúc 20:00: chỉ M2); ngày hạn M1 sáng + M2 tối là hai mốc khác nhau', async () => {
    const d = await bai()
    await chay(d, '2026-09-25', '07:30') // M1
    await chay(d, '2026-09-25', '20:00') // M2 (không tính vào trần M1/M3)
    const ma = maBtvn(d)
    expect(dong(d, "sbd = 'S1'").map((x) => x.moc)).toEqual(['M1', 'M2'])
    const d2 = await bai()
    await chay(d2, '2026-09-25', '20:00') // chưa từng có M1: chỉ M2
    expect(dong(d2, "sbd = 'S1'").map((x) => x.moc)).toEqual(['M2'])
    void ma
  })
  it('PHỤ HUYNH ≤ 1 tin/ngày: nhiều bài cùng lượt ⇒ GỘP MỘT tin (lời ở dòng đầu, dòng còn lại rỗng); bài tới sau trong ngày ⇒ em nhận, phụ huynh KHÔNG', async () => {
    const d = await bai(1)
    gio(new Date(BAY_GIO.getTime() + 60_000))
    expect((await giao(d, { cau: cauThay(), hanNop: HAN_23_59_T6, maDe: 'DE1', caNhan: false })).ok).toBe(true) // bài THỨ HAI cùng hạn (bài thường)
    expect(d.sql.prepare('SELECT COUNT(*) AS n FROM btvn').get()).toEqual({ n: 2 })
    const r = await chay(d, '2026-09-25', '20:00')
    expect(r.theoMoc).toMatchObject({ M2: 2 })
    expect(r.soTinPhuHuynh).toBe(1) // GỘP
    const ds = emDongs(d, 'M2')
    expect(ds.filter((x) => x.gui_ph === 1 && x.ph_nhom === 'S1|2026-09-25')).toHaveLength(2)
    expect(ds.filter((x) => String(x.loi_ph) !== '')).toHaveLength(1)
    expect(String(ds.find((x) => String(x.loi_ph) !== '')!.loi_ph)).toMatch(/^Anh\/chị, em Một còn 2 bài tập về nhà chưa nộp: «.+» hạn nộp 23:59 tối nay.*; «.+» hạn nộp 23:59 tối nay.* Anh\/chị nhắc em mở app giúp Thầy\.$/)
    // bài thứ ba giao 20:10, cùng hạn: tới lượt 20:30 em nhận M2 nhưng phụ huynh ĐÃ đủ 1 tin hôm nay
    gio(new Date(VN('2026-09-25', '20:10')))
    expect((await giao(d, { cau: cauThay(), hanNop: HAN_23_59_T6, maDe: 'DE1', caNhan: false, maCa: 'CA1' })).ok).toBe(true)
    gio(new Date(VN('2026-09-25', '20:30')))
    await chay(d, '2026-09-25', '20:30')
    const moi = dong(d, "moc = 'M2'").filter((x) => !ds.some((y) => y.id === x.id))
    expect(moi).toHaveLength(1)
    expect(moi[0]).toMatchObject({ gui_ph: 0, ph_nhom: null, loi_ph: '' })
  })
  it('PHỤ HUYNH ≤ 3 tin/7 ngày: đã có 3 tin trong 7 ngày ⇒ em vẫn nhận M2, phụ huynh KHÔNG', async () => {
    const d = await bai(1)
    for (const ng of ['2026-09-20', '2026-09-22', '2026-09-24']) d.sql.prepare("INSERT INTO canh_bao_thay(id,ma_btvn,sbd,ngay,ten_btvn,han_nop,loi_em,loi_ph,trang_thai_em,gui_luc,moc,gui_ph,ph_nhom) VALUES(?,?,'S1',?,'x','x','e','p','chua_mo','x','M2',1,?)").run(`cu:${ng}`, 'BAI-CU', ng, `S1|${ng}`)
    await chay(d, '2026-09-25', '20:00')
    const homNay = dong(d, "moc = 'M2' AND ngay = '2026-09-25'")
    expect(homNay).toHaveLength(1)
    expect(homNay[0]).toMatchObject({ gui_ph: 0, ph_nhom: null })
    // đối chứng: chỉ 2 tin cũ ⇒ phụ huynh được gửi
    const d2 = await bai(1)
    for (const ng of ['2026-09-20', '2026-09-22']) d2.sql.prepare("INSERT INTO canh_bao_thay(id,ma_btvn,sbd,ngay,ten_btvn,han_nop,loi_em,loi_ph,trang_thai_em,gui_luc,moc,gui_ph,ph_nhom) VALUES(?,?,'S1',?,'x','x','e','p','chua_mo','x','M2',1,?)").run(`cu:${ng}`, 'BAI-CU', ng, `S1|${ng}`)
    await chay(d2, '2026-09-25', '20:00')
    expect(dong(d2, "moc = 'M2' AND ngay = '2026-09-25'")[0]).toMatchObject({ gui_ph: 1, ph_nhom: 'S1|2026-09-25' })
  })
})

describe('M3 · trễ nhịp (20:00, chậm ≥ 2 chặng, bài còn ≥ 1 ngày) ⇒ EM', () => {
  it('em chậm ≥ 2 chặng so với lịch nhận M3 với số chặng chậm và số câu chặng kế; em đúng lịch hoặc chỉ chậm 1 chặng thì không', async () => {
    const d = await bai(3, '2026-09-29T16:59:00.000Z') // hạn 23:59 thứ Ba 29/09 — còn nhiều ngày
    await mo(d, 'S1'); await mo(d, 'S2'); await mo(d, 'S3')
    const so = Number((d.sql.prepare("SELECT so_chang FROM btvn_em WHERE sbd = 'S1'").get() as { so_chang: number }).so_chang)
    const em1 = d.sql.prepare("SELECT chang_mo_json, chot_luc FROM btvn_em WHERE sbd = 'S1'").get() as { chang_mo_json: string; chot_luc: string }
    const moLuc = docLichDaLuu(em1.chang_mo_json, so)?.moLuc ?? moLucChang(em1.chot_luc, so)
    const toiLich = moLuc.filter((m) => Date.parse(m) <= VN('2026-09-25', '20:00')).length
    expect(toiLich).toBeGreaterThanOrEqual(3)
    // tối 25/09: S1 chưa làm chặng nào (chậm toiLich); S2 đúng lịch; S3 chậm ĐÚNG 1 chặng
    d.sql.prepare("UPDATE btvn_em SET lo_da_xong = ? WHERE sbd = 'S2'").run(Math.min(so, toiLich))
    d.sql.prepare("UPDATE btvn_em SET lo_da_xong = ? WHERE sbd = 'S3'").run(Math.min(so, toiLich) - 1)
    const r = await chay(d, '2026-09-25', '20:00')
    expect(r.theoMoc).toMatchObject({ M3: 1 })
    const m3 = emDongs(d, 'M3')
    expect(m3.map((x) => x.sbd)).toEqual(['S1'])
    expect(m3[0]).toMatchObject({ gui_ph: 0, ph_nhom: null })
    expect(String(m3[0]!.loi_em)).toMatch(new RegExp(`^Em đang chậm ${toiLich} chặng so với lịch của Bài tập về nhà «.+»\\. Tối nay làm một chặng \\(\\d+ câu\\) là bắt kịp\\.$`))
    const nhieu = boCuaEm(d, 'S1').filter((x) => x.chang === 0).length
    expect(String(m3[0]!.loi_em)).toContain(`(${nhieu} câu)`)
  })
  it('bài sắp hết hạn (< 1 ngày) thì KHÔNG M3; trước 20:00 không M3', async () => {
    const d = await bai(1, '2026-09-29T16:59:00.000Z')
    await mo(d, 'S1')
    await chay(d, '2026-09-25', '19:30')
    expect(emDongs(d, 'M3')).toEqual([])
    const d2 = await bai(1, HAN_23_59_T6)
    await mo(d2, 'S1')
    await chay(d2, '2026-09-25', '20:00') // còn ~4 giờ: M2, không phải M3
    expect(emDongs(d2, 'M3')).toEqual([])
    expect(emDongs(d2, 'M2')).toHaveLength(1)
  })
})

describe('M4 · quá hạn (07:00 sáng hôm sau) ⇒ EM + PHỤ HUYNH, MỘT lần/bài', () => {
  it('07:00 sáng sau hạn: em chưa nộp nhận M4 (đã làm x trong y câu) + phụ huynh; MỘT lần/bài; trước 07:00 chưa; em đã nộp không nhận', async () => {
    const d = await bai()
    await mo(d, 'S1')
    const so = Number((d.sql.prepare("SELECT so_chang FROM btvn_em WHERE sbd = 'S1'").get() as { so_chang: number }).so_chang)
    d.sql.exec("UPDATE btvn_em SET nop_luc = '2026-09-25T05:00:00.000Z' WHERE sbd = 'S3'")
    d.sql.prepare("UPDATE btvn_em SET dap_an_json = ? WHERE sbd = 'S1'").run(JSON.stringify({ 'DE1-I-1': 'A', 'DE1-I-2': 'B', 'DE1-I-3': 'A' }))
    expect((await chay(d, '2026-09-26', '06:59')).lyDo).toBe('ngoai_khung')
    const r = await chay(d, '2026-09-26', '07:00')
    expect(r.theoMoc).toEqual({ M4: 2 })
    const ds = emDongs(d, 'M4')
    expect(ds.map((x) => x.sbd)).toEqual(['S1', 'S2'])
    const y = Number((d.sql.prepare("SELECT so_cau_em FROM btvn_em WHERE sbd = 'S1'").get() as { so_cau_em: number }).so_cau_em)
    expect(ds[0]!.loi_em).toBe(`Bài tập về nhà «${ds[0]!.ten_btvn}» đã quá hạn 23:59 hôm qua. Em đã làm 3 trong ${y} câu.`)
    expect(ds[0]).toMatchObject({ gui_ph: 1, ph_nhom: 'S1|2026-09-26', trang_thai_em: 'qua_han' })
    expect(String(ds[0]!.loi_ph)).toMatch(/^Anh\/chị, em Một chưa nộp Bài tập về nhà «.+», đã quá hạn 23:59 hôm qua, em đã làm 3 trong \d+ câu\. Anh\/chị nhắc em mở bài và nộp\.$/)
    // MỘT lần/bài: lượt sau và ngày sau không gửi thêm
    await chay(d, '2026-09-26', '07:30'); await chay(d, '2026-09-26', '20:00')
    expect(emDongs(d, 'M4')).toHaveLength(2)
    void so
    await chay(d, '2026-09-27', '07:00') // bài đã quá hạn 2 ngày: ngoài phạm vi
    expect(emDongs(d, 'M4')).toHaveLength(2)
  })
  it('bài thường (không cá nhân hoá) cũng được nhắc: M4 nói "đã làm x trong y câu" theo số câu của bài', async () => {
    gio(BAY_GIO)
    const d = dung(1)
    expect((await giao(d, { cau: cauThay(), hanNop: HAN_23_59_T6, caNhan: false })).ok).toBe(true)
    await chay(d, '2026-09-26', '07:00')
    const m4 = emDongs(d, 'M4')
    expect(m4).toHaveLength(1)
    expect(String(m4[0]!.loi_em)).toMatch(/Em đã làm 0 trong 24 câu\.$/)
  })
})

describe('KHÔNG GỬI: đã nộp / thu hồi / bài xoá / bài tắt / mốc tắt', () => {
  it('em đã nộp, em bị thu hồi, bài đã xoá ⇒ 0 tin', async () => {
    const d = await bai()
    d.sql.exec("UPDATE btvn_em SET nop_luc = '2026-09-24T05:00:00.000Z' WHERE sbd = 'S1'; UPDATE btvn_em SET thu_hoi = 1 WHERE sbd = 'S2'")
    await chay(d, '2026-09-25', '20:00')
    expect(emDongs(d).map((x) => x.sbd)).toEqual(['S3'])
    d.sql.exec('DELETE FROM canh_bao_thay; UPDATE btvn SET da_xoa = 1')
    await chay(d, '2026-09-25', '20:30')
    expect(emDongs(d)).toEqual([])
  })
  it('bài trong baiTat và mốc trong mocTat KHÔNG được nhắc (thầy tắt theo bài / theo mốc)', async () => {
    const d = await bai()
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('canh_bao_tu_dong',?,'x')").run(JSON.stringify({ bat: true, baiTat: [maBtvn(d)] }))
    await chay(d, '2026-09-25', '20:00')
    expect(emDongs(d)).toEqual([])
    d.sql.prepare("UPDATE cau_hinh SET gia_tri = ? WHERE khoa = 'canh_bao_tu_dong'").run(JSON.stringify({ bat: true, mocTat: ['M2'] }))
    await chay(d, '2026-09-25', '20:30')
    expect(emDongs(d, 'M2')).toEqual([])
  })
  it('hạn nộp bị GIA HẠN sang ngày khác: không còn tối hạn chót hôm nay (M2) — theo hạn hiện tại của bài', async () => {
    const d = await bai()
    d.sql.exec("UPDATE btvn SET han_nop = '2026-09-28T16:59:00.000Z'") // gia hạn tới 23:59 thứ Hai 28/09
    await chay(d, '2026-09-25', '20:00')
    expect(emDongs(d, 'M2')).toEqual([])
  })
})

describe('EM / PHỤ HUYNH / THẦY thấy gì', () => {
  it('em: khoá canhBaoThay của /hs/ke-hoach-ngay có tin tự động (lời cho EM, không lời phụ huynh); phụ huynh: CHỈ tin có lời cho phụ huynh, xem một dòng ⇒ cả nhóm đã xem', async () => {
    const d = await bai(1)
    await chay(d, '2026-09-25', '20:00')
    gio(new Date(VN('2026-09-25', '20:05')))
    const kh = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { token: await gameToken(d.env, 'S1') })
    expect(kh.canhBaoThay).toHaveLength(1)
    expect(kh.canhBaoThay[0].loi).toMatch(/^Hạn nộp 23:59 tối nay/)
    expect(JSON.stringify(kh.canhBaoThay)).not.toContain('Anh/chị')
    const ph = await goiWorker(worker, d.env, '/ph/ke-hoach', { pass: await parentPass(d.env, 'S1') })
    expect(ph.canhBaoThay).toHaveLength(1)
    expect(ph.canhBaoThay[0].loi).toMatch(/^Anh\/chị, em Một/)
    expect(ph.canhBaoThay[0].daXem).toBe(false)
    await goiWorker(worker, d.env, '/ph/canh-bao/xem', { pass: await parentPass(d.env, 'S1'), id: ph.canhBaoThay[0].id })
    expect((await goiWorker(worker, d.env, '/ph/ke-hoach', { pass: await parentPass(d.env, 'S1') })).canhBaoThay[0].daXem).toBe(true)
    // mốc CHỈ cho em (M1): phụ huynh KHÔNG thấy
    const d2 = await bai(1)
    await chay(d2, '2026-09-25', '07:30')
    gio(new Date(VN('2026-09-25', '07:35')))
    expect((await goiWorker(worker, d2.env, '/hs/ke-hoach-ngay', { token: await gameToken(d2.env, 'S1') })).canhBaoThay).toHaveLength(1)
    expect(await goiWorker(worker, d2.env, '/ph/ke-hoach', { pass: await parentPass(d2.env, 'S1') })).not.toHaveProperty('canhBaoThay')
  })
  it('em NỘP bài ⇒ tin tự động biến mất khỏi app em/phụ huynh (không nhắc bài đã xong)', async () => {
    const d = await bai(1)
    await mo(d, 'S1')
    await chay(d, '2026-09-25', '20:00')
    d.sql.exec("UPDATE btvn_em SET nop_luc = '2026-09-25T14:00:00.000Z'")
    gio(new Date(VN('2026-09-25', '21:05')))
    expect(await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { token: await gameToken(d.env, 'S1') })).not.toHaveProperty('canhBaoThay')
    expect(await goiWorker(worker, d.env, '/ph/ke-hoach', { pass: await parentPass(d.env, 'S1') })).not.toHaveProperty('canhBaoThay')
  })
  it('/gv/chua-nop: tuDong {bat, gioTu, gioDen, lanKe}, homNay {soEm, soPhuHuynh}, mỗi em daNhac[{moc, luc, emDaXem, phDaXem}] và nhacKe {moc, luc}; ≤ 12 truy vấn', async () => {
    const d = await bai()
    d.sql.exec("INSERT OR REPLACE INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES ('S1','Em Một','12A','mk','x'),('S2','Em Hai','12A','mk','x'),('S3','Em Ba','12B','mk','x')")
    await chay(d, '2026-09-25', '07:30') // M1 cho cả 3
    await chay(d, '2026-09-25', '20:00') // M2 cho cả 3 (+ phụ huynh)
    d.sql.exec("UPDATE canh_bao_thay SET em_xem_luc = '2026-09-25T13:10:00.000Z' WHERE id LIKE '%:S1:M2:%'")
    gio(new Date(VN('2026-09-25', '20:30')))
    const r = await goiWorker(worker, d.env, '/gv/chua-nop', { ngay: '2026-09-25' }, true)
    expect(r.ok).toBe(true)
    expect(r.soTruyVan).toBeLessThanOrEqual(12)
    expect(r.tuDong).toEqual({ bat: true, gioTu: '07:00', gioDen: '21:30', lanKe: new Date(VN('2026-09-25', '21:00')).toISOString() })
    expect(r.homNay).toEqual({ soEm: 3, soPhuHuynh: 3 })
    const s1 = r.bai[0].em.find((x: { sbd: string }) => x.sbd === 'S1')
    expect(s1.daNhac).toEqual([
      { moc: 'M2', luc: expect.any(String), emDaXem: true, phDaXem: false },
      { moc: 'M1', luc: expect.any(String), emDaXem: false, phDaXem: null }, // M1 chỉ cho em ⇒ phDaXem = null
    ])
    expect(s1.nhacKe).toEqual({ moc: 'M4', luc: new Date(VN('2026-09-26', '07:00')).toISOString() })
    d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('canh_bao_tu_dong','{"bat":false}','x')`)
    const tat = await goiWorker(worker, d.env, '/gv/chua-nop', { ngay: '2026-09-25' }, true)
    expect(tat.tuDong).toEqual({ bat: false, gioTu: '07:00', gioDen: '21:30' })
    expect(tat.bai[0].em[0]).not.toHaveProperty('nhacKe')
  })
  it('/gv/nhac-tu-dong: thầy đọc/tắt/bật, tắt theo bài/mốc; sai định dạng giờ bị từ chối; cần mã bí mật', async () => {
    const d = await bai(1)
    gio(new Date(VN('2026-09-25', '10:00')))
    expect((await goiWorker(worker, d.env, '/gv/nhac-tu-dong', {}, false)).ok).toBe(false)
    expect(await goiWorker(worker, d.env, '/gv/nhac-tu-dong', {}, true)).toMatchObject({ ok: true, cauHinh: CAU_HINH_MAC_DINH, lanKe: new Date(VN('2026-09-25', '10:30')).toISOString() })
    const tat = await goiWorker(worker, d.env, '/gv/nhac-tu-dong', { bat: false }, true)
    expect(tat.cauHinh.bat).toBe(false)
    expect(tat).not.toHaveProperty('lanKe')
    const rieng = await goiWorker(worker, d.env, '/gv/nhac-tu-dong', { bat: true, mocTat: ['M3'], baiTat: ['B1'] }, true)
    expect(rieng.cauHinh).toEqual({ bat: true, mocTat: ['M3'], baiTat: ['B1'], gioTu: '07:00', gioDen: '21:30' })
    expect((await goiWorker(worker, d.env, '/gv/nhac-tu-dong', { gioTu: '7h' }, true)).ok).toBe(false)
    expect((await goiWorker(worker, d.env, '/gv/nhac-tu-dong', { gioTu: '22:00' }, true)).ok).toBe(false)
    expect(await gvNhacTuDong(d.env, {}, Date.now())).toMatchObject({ ok: true, cauHinh: { mocTat: ['M3'], baiTat: ['B1'] } })
  })
})

describe('AN TOÀN: chỉ hai nguồn ghi canh_bao_thay; reset xoá nhật ký', () => {
  it('chỉ canh-bao-thay.ts (tay) và nhac-tu-dong.ts (tự động) ghi bảng canh_bao_thay', async () => {
    const { readdirSync } = await import('node:fs')
    const co = readdirSync('server/src').filter((f) => f.endsWith('.ts') && /INSERT (OR \w+ )?INTO canh_bao_thay/i.test(readFileSync(`server/src/${f}`, 'utf-8')))
    expect(co.sort()).toEqual(['canh-bao-thay.ts', 'nhac-tu-dong.ts'])
  })
  it('nopChang/DAP_AN_DUNG không liên quan: em nộp qua luồng thật thì nhắc sau đó bỏ qua em ấy', async () => {
    const d = await bai(1)
    await mo(d, 'S1')
    const so = Number((d.sql.prepare("SELECT so_chang FROM btvn_em WHERE sbd = 'S1'").get() as { so_chang: number }).so_chang)
    gio('2026-09-25T09:00:00.000Z')
    for (let c = 0; c < so; c++) expect((await nopChang(d, c, Object.fromEntries(boCuaEm(d).filter((x) => x.chang === c).map((x) => [x.qid, DAP_AN_DUNG(x.qid)])))).ok).toBe(true)
    expect(d.sql.prepare("SELECT nop_luc FROM btvn_em WHERE sbd = 'S1'").get()).not.toEqual({ nop_luc: null })
    await chay(d, '2026-09-25', '20:00')
    expect(emDongs(d)).toEqual([])
  })
})

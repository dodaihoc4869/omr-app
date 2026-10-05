// @vitest-environment node
// LUẬT THẦY 05/10 ("chặn chuẩn 100% không được rút nhầm kho khác khối"): kênh tự động chặn câu KHÔNG RÕ khối ⇒ câu trong kho giả ghi khối `lop` (đúng khối em).
// RÚT ĐỀ CA KIỂM TRA v2 (02/10) — thang lấp từng ô của từng em (src/lib/rut-de-v2.ts) + máy chủ (server/src/rut-de-v2.ts):
//   · chốt Bắt đầu MỘT lệnh (mốc + bản đồ) ⇒ không còn khe "đã bắt đầu mà chưa có bản đồ";
//   · /vao-thi ca đề riêng mà bản đồ thiếu em ⇒ lấp riêng trên máy chủ / bảo thử lại, KHÔNG cắt theo băm im lặng;
//   · thứ tự lấp: câu sai đến hạn → song sinh → cùng dạng → câu mới; ma trận cứng; không tự luận; lý thuyết ≥ 30 ngày;
//   · Kiểm tra điểm yếu: bộ riêng theo lỗi của từng em; 300 em: chạy thử < 2 giây, chốt máy chủ < 1 giây.
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { damBaoBangBoTro } from '../server/src/cau-bo-tro'
import { damBaoBangLoiGiai } from '../server/src/loi-giai'
import { laCauRutDuoc } from '../src/lib/cau-tu-luan'
import {
  banDoTuKetQua,
  khoTuNguon,
  mucTieuTheoKho,
  rutDeV2,
  type CauKhoV2,
  type HoSoEmV2,
  type LoiEmV2,
  type PhanV2,
} from '../src/lib/rut-de-v2'

const NGAY = '2026-10-02'
const c = (id: string, phan: PhanV2, mucDo = 'hieu', dang = 'D0', lyThuyet = false, songSinhCua?: string): CauKhoV2 => ({ id, phan, mucDo, dang, lyThuyet, ...(songSinhCua ? { songSinhCua } : {}) })
const loi = (qid: string, them: Partial<LoiEmV2> = {}): LoiEmV2 => ({ qid, denHan: '2026-10-01', trangThai: 'mo', ...them })
const dem = (ds: { phan: PhanV2; mucDo: string }[]) => {
  const ra: Record<string, number> = {}
  for (const x of ds) ra[`${x.phan}|${x.mucDo}`] = (ra[`${x.phan}|${x.mucDo}`] ?? 0) + 1
  return ra
}

// =====================================================================================================
describe('thứ tự lấp từng ô — câu sai đến hạn → song sinh → cùng dạng → câu mới', () => {
  // Phần I: 4 ô (ca ngắn ⇒ mức độ mềm). Trần ô lỗi = ceil(4 × 30%) = 2.
  const KHO: CauKhoV2[] = [
    c('E1', 'I', 'hieu', 'D1'),
    c('E2', 'I', 'hieu', 'D2'),
    c('E2~ss1', 'I', 'hieu', 'D2', false, 'E2'),
    c('E3', 'I', 'hieu', 'D3', true),
    c('E3b', 'I', 'hieu', 'D3', true), // cùng dạng D3, khác nội dung
    c('E4', 'I', 'hieu', 'D4', true),
    c('E5', 'I', 'hieu', 'D5', true),
    ...Array.from({ length: 12 }, (_, i) => c(`M${i}`, 'I', 'hieu', 'DM')),
  ]
  const SC = { I: 4, II: 0, III: 0 }
  const rut = (hoSo: Record<string, HoSoEmV2>, cheDo: 'ca' | 'diem_yeu' = 'ca') =>
    rutDeV2({ kho: KHO, soCau: SC, dsSbd: Object.keys(hoSo), hoSo, ngay: NGAY, cheDo, seed: 'CA1' })

  it('(1) câu ĐÚNG MỤC ĐÍCH: lỗi đến hạn có câu gốc dùng được ⇒ chính câu gốc, bậc muc_dich', () => {
    const kq = rut({ S1: { loi: [loi('E1')], daGap: { E1: '2026-09-30' } } })
    expect(kq.theoEm.S1!.find((x) => x.qid === 'E1')).toMatchObject({ bac: 'muc_dich', goc: 'E1' })
  })

  it('(2) luật đóng lỗi muốn SONG SINH và kho ca có ⇒ câu song sinh, không dùng lại câu gốc', () => {
    const kq = rut({ S2: { loi: [loi('E2', { nenSongSinh: true, songSinh: 1 })], daGap: { E2: '2026-09-30' } } })
    const ds = kq.theoEm.S2!
    expect(ds.find((x) => x.qid === 'E2~ss1')).toMatchObject({ bac: 'song_sinh', goc: 'E2' })
    expect(ds.some((x) => x.qid === 'E2')).toBe(false)
  })

  it('(3) câu gốc LÝ THUYẾT gặp < 30 ngày, không có song sinh ⇒ câu CÙNG DẠNG em chưa gặp; ô thiếu được ghi rõ', () => {
    const kq = rut({ S3: { loi: [loi('E3')], daGap: { E3: '2026-09-25' } } })
    const ds = kq.theoEm.S3!
    expect(ds.some((x) => x.qid === 'E3')).toBe(false)
    expect(ds.find((x) => x.qid === 'E3b')).toMatchObject({ bac: 'cung_dang', goc: 'E3' })
    expect(kq.thieu.S3?.[0]).toMatchObject({ phan: 'I', bac: 'cung_dang', qid: 'E3b' })
  })

  it('(4) lý thuyết gặp ≥ 30 ngày trước ⇒ được quay lại (câu gốc)', () => {
    const kq = rut({ S4: { loi: [loi('E4')], daGap: { E4: '2026-08-20' } } })
    expect(kq.theoEm.S4!.find((x) => x.qid === 'E4')).toMatchObject({ bac: 'muc_dich' })
  })

  it('(5) không gốc, không song sinh, không cùng dạng ⇒ ô trả về câu MỚI; lỗi đếm "chưa xếp", đủ số câu', () => {
    const kq = rut({ S5: { loi: [loi('E5')], daGap: { E5: '2026-09-28' } } })
    const ds = kq.theoEm.S5!
    expect(ds).toHaveLength(4)
    expect(ds.every((x) => x.bac === 'moi')).toBe(true)
    expect(kq.loiChuaXep.S5).toBe(1)
  })

  it('trần 30% ô lỗi; lỗi CHƯA tới hạn không vào ca thường; câu mới là câu em chưa gặp', () => {
    const kq = rut({ S6: { loi: [loi('E1'), loi('E4', { denHan: '2026-09-29' }), loi('E2', { denHan: '2026-10-09' })], daGap: { M0: '2026-09-01', E4: '2026-08-01' } } })
    const ds = kq.theoEm.S6!
    expect(ds.filter((x) => x.bac !== 'moi')).toHaveLength(2) // ceil(4 × 0,3)
    expect(ds.map((x) => x.qid)).toEqual(expect.arrayContaining(['E4', 'E1'])) // hạn sớm nhất trước
    expect(ds.some((x) => x.qid === 'E2' || x.qid === 'E2~ss1')).toBe(false)
    expect(ds.filter((x) => x.bac === 'moi').some((x) => x.qid === 'M0')).toBe(false)
  })

  it('bản đồ: `lap` = câu ôn lại (gốc/song sinh/cùng dạng), `bac` ghi bậc lấp từng câu', () => {
    const kq = rut({ S1: { loi: [loi('E1')] }, S2: { loi: [loi('E2', { nenSongSinh: true, songSinh: 1 })] } })
    const bd = banDoTuKetQua(kq)
    expect(bd.lap.S1).toEqual(['E1'])
    expect(bd.lap.S2).toEqual(['E2~ss1'])
    expect(bd.bac.S2!['E2~ss1']).toBe('song_sinh')
    expect(Object.values(bd.bac.S1!).filter((b) => b === 'moi')).toHaveLength(3)
  })
})

// =====================================================================================================
describe('ma trận là ràng buộc cứng (ca đánh giá > 10 câu); ca ngắn giữ đúng số câu từng phần', () => {
  const muc = ['biet', 'hieu', 'van_dung'] as const
  const KHO: CauKhoV2[] = [
    ...Array.from({ length: 90 }, (_, i) => c(`I-${i}`, 'I', muc[i % 3], `D${i % 7}`, i % 2 === 0)),
    ...Array.from({ length: 20 }, (_, i) => c(`II-${i}`, 'II', i < 10 ? 'hieu' : 'van_dung', `E${i % 4}`)),
    ...Array.from({ length: 30 }, (_, i) => c(`III-${i}`, 'III', muc[i % 3], `F${i % 5}`)),
  ]
  const SC = { I: 9, II: 2, III: 3 }

  it('40 em, mỗi em lỗi khác nhau: MỌI em đúng 9·2·3 câu và đúng mức độ từng ô như ma trận', () => {
    const hoSo: Record<string, HoSoEmV2> = {}
    for (let k = 0; k < 40; k++) {
      hoSo[`S${k}`] = {
        loi: [loi(`I-${k}`), loi(`I-${(k * 7) % 90}`, { nenSongSinh: true }), loi(`II-${k % 20}`), loi(`III-${k % 30}`)],
        daGap: Object.fromEntries(Array.from({ length: 30 }, (_, j) => [`I-${(k + j * 3) % 90}`, '2026-09-28'])),
      }
    }
    const kq = rutDeV2({ kho: KHO, soCau: SC, dsSbd: Object.keys(hoSo), hoSo, ngay: NGAY, cheDo: 'ca', seed: 'CA2' })
    expect(kq.mucDoCung).toBe(true)
    const mt = dem(Object.entries(kq.mucTieu).flatMap(([p, ds]) => ds.map((m) => ({ phan: p as PhanV2, mucDo: m }))))
    for (const [sbd, ds] of Object.entries(kq.theoEm)) {
      expect(ds.filter((x) => x.phan === 'I'), sbd).toHaveLength(9)
      expect(ds.filter((x) => x.phan === 'II'), sbd).toHaveLength(2)
      expect(ds.filter((x) => x.phan === 'III'), sbd).toHaveLength(3)
      expect(dem(ds), sbd).toEqual(mt)
      expect(new Set(ds.map((x) => x.qid)).size).toBe(14)
    }
  })

  it('câu lỗi lệch mức ô còn trống ⇒ KHÔNG phá ma trận: lấp bằng câu cùng dạng đúng mức', () => {
    // Phần II: ma trận 1 Thông hiểu + 1 Vận dụng. Em có 2 lỗi Vận dụng; trần ô lỗi phần II = 1.
    const kho = [c('A', 'II', 'van_dung', 'G'), c('B', 'II', 'van_dung', 'G'), c('H1', 'II', 'hieu', 'G'), c('H2', 'II', 'hieu', 'K'), c('V1', 'II', 'van_dung', 'K'), ...Array.from({ length: 12 }, (_, i) => c(`P${i}`, 'I', 'hieu'))]
    const kq = rutDeV2({ kho, soCau: { I: 9, II: 2, III: 0 }, mucTieu: { I: Array(9).fill('hieu'), II: ['hieu', 'van_dung'], III: [] }, dsSbd: ['S'], hoSo: { S: { loi: [loi('A'), loi('B')] } }, ngay: NGAY, cheDo: 'ca', seed: 'x' })
    const p2 = kq.theoEm.S!.filter((x) => x.phan === 'II')
    expect(dem(p2)).toEqual({ 'II|hieu': 1, 'II|van_dung': 1 })
    expect(p2.find((x) => x.qid === 'A')).toMatchObject({ bac: 'muc_dich' })
  })

  it('ca ngắn ≤ 10 câu: kho thiếu câu đúng mức ⇒ vẫn đủ số câu từng phần, lấy mức gần nhất', () => {
    const kho = [c('V', 'I', 'van_dung'), c('B1', 'I', 'biet'), c('B2', 'I', 'biet'), c('H1', 'I', 'hieu')]
    const kq = rutDeV2({ kho, soCau: { I: 3, II: 0, III: 0 }, mucTieu: { I: ['van_dung', 'van_dung', 'hieu'], II: [], III: [] }, dsSbd: ['S'], hoSo: {}, ngay: NGAY, cheDo: 'ca', seed: 'x' })
    expect(kq.mucDoCung).toBe(false)
    expect(kq.theoEm.S).toHaveLength(3)
    expect(kq.thieu.S?.some((o) => o.mucDo === 'van_dung' && /mức gần nhất/.test(o.lyDo))).toBe(true)
  })

  it('mức độ từng ô theo tỉ lệ kho, cùng cho cả lớp (phần dư lớn nhất)', () => {
    expect(mucTieuTheoKho(KHO, SC)).toEqual({ I: ['biet', 'biet', 'biet', 'hieu', 'hieu', 'hieu', 'van_dung', 'van_dung', 'van_dung'], II: ['hieu', 'van_dung'], III: ['biet', 'hieu', 'van_dung'] })
  })

  it('kho cạn hết câu mới ⇒ câu đã gặp LÂU NHẤT; lý thuyết gặp < 30 ngày là lựa chọn cuối cùng', () => {
    const kho = [c('L', 'I', 'hieu', 'D', true), c('T1', 'I', 'hieu', 'D'), c('T2', 'I', 'hieu', 'D')]
    const kq = rutDeV2({ kho, soCau: { I: 2, II: 0, III: 0 }, dsSbd: ['S'], hoSo: { S: { loi: [], daGap: { L: '2026-09-30', T1: '2026-09-29', T2: '2026-07-01' } } }, ngay: NGAY, cheDo: 'ca', seed: 'x' })
    expect(kq.theoEm.S!.map((x) => x.qid)).toEqual(['T2', 'T1'])
    expect(kq.theoEm.S!.every((x) => x.bac === 'nhac_lai')).toBe(true)
  })
})

// =====================================================================================================
describe('không tự luận', () => {
  it('khoTuNguon bỏ câu tự luận (laCauRutDuoc) ⇒ không bao giờ vào bộ câu', () => {
    const tuLuan = { id: 'TL-III-1', text: 'Giải thích vì sao phenol tác dụng với NaOH', correct: 'Vì phenol có tính axit yếu' }
    expect(laCauRutDuoc(tuLuan, 'III')).toBe(false)
    const nguon = {
      phanI: [{ id: 'Q-I-1', text: 'Chất nào là ester?', choices: ['a', 'b', 'c', 'd'], correct: 'A', mucDo: 'biet' }],
      phanII: [],
      phanIII: [tuLuan, { id: 'Q-III-2', text: 'Tính m', correct: '2,5', mucDo: 'van_dung' }],
    }
    const kho = khoTuNguon([nguon])
    expect(kho.map((x) => x.id).sort()).toEqual(['Q-I-1', 'Q-III-2'])
    const kq = rutDeV2({ kho, soCau: { I: 1, II: 0, III: 2 }, dsSbd: ['S'], hoSo: { S: { loi: [loi('TL-III-1', { phan: 'III', dang: 'x' })] } }, ngay: NGAY, cheDo: 'diem_yeu', seed: 'x' })
    expect(kq.theoEm.S!.some((x) => x.qid === 'TL-III-1')).toBe(false)
  })
})

// =====================================================================================================
describe('Kiểm tra điểm yếu — bộ riêng từng em theo lỗi của chính em, ưu tiên song sinh', () => {
  const KHO: CauKhoV2[] = [
    c('A1', 'I', 'hieu', 'DA'), c('A1~ss0', 'I', 'hieu', 'DA', false, 'A1'), c('A2', 'I', 'hieu', 'DA'),
    c('B1', 'I', 'hieu', 'DB'), c('B2', 'I', 'hieu', 'DB'), c('B3', 'I', 'hieu', 'DB'),
    ...Array.from({ length: 10 }, (_, i) => c(`N${i}`, 'I', 'hieu', 'DN')),
  ]
  it('hai em lỗi khác nhau ⇒ hai bộ khác nhau, mỗi bộ chứa đúng câu lỗi của em; song sinh trước câu gốc; đủ số câu', () => {
    const hoSo: Record<string, HoSoEmV2> = {
      An: { loi: [loi('A1', { songSinh: 0 }), loi('A2', { trangThai: 'cho_kiem', denHan: '2026-10-05' })], daGap: { A1: '2026-09-30', A2: '2026-09-30' } },
      Binh: { loi: [loi('B1'), loi('B2', { trangThai: 'cho_kiem', denHan: '2026-10-06' })], daGap: { B1: '2026-09-30', B2: '2026-09-30' } },
    }
    const kq = rutDeV2({ kho: KHO, soCau: { I: 4, II: 0, III: 0 }, dsSbd: ['An', 'Binh'], hoSo, ngay: NGAY, cheDo: 'diem_yeu', seed: 'LB' })
    const an = kq.theoEm.An!.map((x) => x.qid)
    const binh = kq.theoEm.Binh!.map((x) => x.qid)
    expect(an).toHaveLength(4)
    expect(binh).toHaveLength(4)
    expect(an).toEqual(expect.arrayContaining(['A1~ss0', 'A2'])) // song sinh trước gốc; "đúng chưa kiểm chứng" (chờ kiểm, chưa tới hạn) vẫn vào
    expect(an).not.toContain('A1')
    expect(binh).toEqual(expect.arrayContaining(['B1', 'B2']))
    expect(an.sort()).not.toEqual(binh.sort())
    expect(kq.theoEm.An!.find((x) => x.qid === 'A1~ss0')?.bac).toBe('song_sinh')
  })
})

// =====================================================================================================
describe('300 em — chạy thử trên máy thầy < 2 giây (hàm thuần)', () => {
  it('kho 900 câu, 18·4·6, mỗi em 12 lỗi + 250 câu đã gặp', () => {
    const muc = ['biet', 'hieu', 'van_dung'] as const
    const kho: CauKhoV2[] = []
    for (let i = 0; i < 600; i++) kho.push(c(`I-${i}`, 'I', muc[i % 3], `D${i % 40}`, i % 2 === 0))
    for (let i = 0; i < 150; i++) kho.push(c(`II-${i}`, 'II', muc[i % 3], `E${i % 15}`))
    for (let i = 0; i < 150; i++) kho.push(c(`III-${i}`, 'III', muc[i % 3], `F${i % 15}`))
    for (let i = 0; i < 600; i += 5) kho.push(c(`I-${i}~ss0`, 'I', muc[i % 3], `D${i % 40}`, i % 2 === 0, `I-${i}`))
    const hoSo: Record<string, HoSoEmV2> = {}
    const ds: string[] = []
    for (let k = 0; k < 300; k++) {
      const sbd = String(10000 + k)
      ds.push(sbd)
      const daGap: Record<string, string> = {}
      for (let j = 0; j < 250; j++) daGap[`I-${(k * 13 + j * 7) % 600}`] = j % 2 ? '2026-09-20' : '2026-07-01'
      hoSo[sbd] = { loi: Array.from({ length: 12 }, (_, j) => loi(j < 8 ? `I-${(k * 17 + j * 5) % 600}` : `III-${(k + j) % 150}`, { nenSongSinh: j % 3 === 0, songSinh: 0 })), daGap }
    }
    const t0 = performance.now()
    const kq = rutDeV2({ kho, soCau: { I: 18, II: 4, III: 6 }, dsSbd: ds, hoSo, ngay: NGAY, cheDo: 'ca', seed: 'DO' })
    const ms = performance.now() - t0
    console.log(`[đo] chạy thử 300 em: ${ms.toFixed(0)} ms`)
    expect(ms).toBeLessThan(2000)
    expect(Object.keys(kq.theoEm)).toHaveLength(300)
    for (const b of Object.values(kq.theoEm)) expect(b).toHaveLength(28)
  })
})

// =====================================================================================================
// MÁY CHỦ — D1 thật (sqlite) qua Worker thật.
const KEY = {
  phanI: [
    { id: 'X1', text: 'Câu X1 tính m', choices: ['1', '2', '3', '4'], correct: 'B', mucDo: 'hieu', kieu: 'bai_tap' }, // bài tập: câu gốc dùng lại được (lý thuyết gặp < 30 ngày thì không)
    ...Array.from({ length: 8 }, (_, i) => ({ id: `K-I-${i}`, text: `Câu K${i} tính m`, choices: ['1', '2', '3', '4'], correct: 'A', mucDo: 'hieu' })),
  ],
  phanII: [{ id: 'K-II-0', text: 'Ý đúng sai', ideas: ['a', 'b', 'c', 'd'], correct: ['D', 'S', 'D', 'S'], mucDo: 'hieu' }, { id: 'K-II-1', text: 'Ý đúng sai 2', ideas: ['a', 'b', 'c', 'd'], correct: ['D', 'D', 'D', 'S'], mucDo: 'hieu' }],
  phanIII: [{ id: 'K-III-0', text: 'Tính V', correct: '2,24', mucDo: 'hieu' }, { id: 'TL-III-9', text: 'Giải thích', correct: 'Vì có liên kết pi' }],
}
async function dungCa(o: { batDau?: string | null; bo?: unknown; soCau?: unknown; lenBang?: number } = {}) {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.prepare(
    `INSERT INTO ca (ma_ca, ten_ca, trang_thai, thoi_gian_phut, loai, cong_bo, nguong_lan, nguong_giay, bank_r2, so_cau_json, bo_theo_em_json, cap_nhat_luc, lop, phong_cho, de_rieng, bat_dau_thi_luc, len_bang)
     VALUES ('C1','Ca v2','mo',45,'thi','khong',3,30,'de/C1.json',?,?,'x','12A',1,1,?,?)`,
  ).run(JSON.stringify(o.soCau ?? { I: 3, II: 1, III: 1 }), o.bo === undefined ? null : JSON.stringify(o.bo), o.batDau ?? null, o.lenBang ?? 0)
  await env.DE!.put('key/C1.json', JSON.stringify(KEY))
  await env.DE!.put('de/C1.json', JSON.stringify(KEY))
  return { d, env }
}
const caRow = (d: ReturnType<typeof taoD1That>) => d.sql.prepare("SELECT bat_dau_thi_luc AS luc, bo_theo_em_json AS bo FROM ca WHERE ma_ca='C1'").get() as { luc: string | null; bo: string | null }

afterEach(() => {
  vi.useRealTimers()
})

describe('/ca/chot-bat-dau — mốc bắt đầu và bản đồ đề riêng trong MỘT lệnh', () => {
  const BAN_DO = { bo: { S1: ['X1', 'K-I-0', 'K-I-1', 'K-II-0', 'K-III-0'] }, lap: { S1: ['X1'] }, dem: {}, bb: { ghiChu: 'biên bản của thầy' }, bac: { S1: { X1: 'muc_dich' } } }

  it('một câu UPDATE ghi CẢ hai cột; trước chốt em đứng phòng chờ, ngay sau chốt em nhận đúng bộ của mình', async () => {
    const { d, env } = await dungCa()
    expect((await goiWorker(worker, env, '/vao-thi', { maCa: 'C1', sbd: 'S1', idThietBi: 'm1' })).cach).toBe('cho')
    const ghi: string[] = []
    const prepare = env.DB.prepare.bind(env.DB)
    env.DB.prepare = ((q: string) => { if (/^\s*UPDATE\s+ca\b/i.test(q)) ghi.push(q); return prepare(q) }) as typeof env.DB.prepare
    const r = await goiWorker(worker, env, '/ca/chot-bat-dau', { maCa: 'C1', boTheoEm: BAN_DO }, true)
    env.DB.prepare = prepare
    expect(r).toMatchObject({ ok: true, chot: true, daBatTruoc: false, canBoTheoEm: true, coBoTheoEm: true })
    expect(ghi).toHaveLength(1)
    expect(ghi[0]).toMatch(/bat_dau_thi_luc = \?, bo_theo_em_json = COALESCE/)
    const row = caRow(d)
    expect(row.luc).toBe(r.batDauLuc)
    expect(JSON.parse(row.bo!).bo.S1).toEqual(BAN_DO.bo.S1)
    const v = await goiWorker(worker, env, '/vao-thi', { maCa: 'C1', sbd: 'S1', idThietBi: 'm1' })
    expect(v.ok).toBe(true)
    expect(v.boTheoEm.bo).toEqual({ S1: BAN_DO.bo.S1 })
    expect(JSON.stringify(v)).not.toContain('biên bản')
    expect(v.boTheoEm.bac).toBeUndefined() // bậc lấp chỉ thầy xem
  })

  it('bấm lần hai / máy khác bấm ⇒ trả "đã bắt đầu", GIỮ mốc và bản đồ lần đầu', async () => {
    const { d, env } = await dungCa()
    const a = await goiWorker(worker, env, '/ca/chot-bat-dau', { maCa: 'C1', boTheoEm: BAN_DO }, true)
    const b = await goiWorker(worker, env, '/ca/chot-bat-dau', { maCa: 'C1', boTheoEm: { bo: { S9: ['K-I-5'] } } }, true)
    expect(b).toMatchObject({ ok: false, chot: true, lyDo: 'da_bat_dau', batDauLuc: a.batDauLuc })
    expect(JSON.parse(caRow(d).bo!).bo).toEqual(BAN_DO.bo)
  })

  it('không mã bí mật ⇒ 403; ca đã đóng ⇒ lỗi có lý do', async () => {
    const { d, env } = await dungCa()
    expect((await goiWorker(worker, env, '/ca/chot-bat-dau', { maCa: 'C1' })).ok).toBe(false)
    expect(caRow(d).luc).toBeNull()
    d.sql.exec("UPDATE ca SET trang_thai='dong' WHERE ma_ca='C1'")
    expect(await goiWorker(worker, env, '/ca/chot-bat-dau', { maCa: 'C1' }, true)).toMatchObject({ ok: false, error: 'Ca đã đóng hoặc đã xoá' })
  })

  it('300 em: chốt máy chủ < 1 giây (bản đồ 28 câu/em + bậc lấp + biên bản)', async () => {
    const { d, env } = await dungCa()
    const bo: Record<string, string[]> = {}
    const bac: Record<string, Record<string, string>> = {}
    for (let k = 0; k < 300; k++) {
      const s = String(10000 + k)
      bo[s] = Array.from({ length: 28 }, (_, j) => `DE-${(k * 7 + j) % 900}`)
      bac[s] = Object.fromEntries(bo[s]!.map((q, j) => [q, j < 5 ? 'muc_dich' : 'moi']))
    }
    const t0 = performance.now()
    const r = await goiWorker(worker, env, '/ca/chot-bat-dau', { maCa: 'C1', boTheoEm: { bo, lap: {}, dem: {}, bb: { canCua: {} }, bac } }, true)
    const ms = performance.now() - t0
    console.log(`[đo] chốt máy chủ 300 em: ${ms.toFixed(0)} ms`)
    expect(r.ok).toBe(true)
    expect(ms).toBeLessThan(1000)
    expect(Object.keys(JSON.parse(caRow(d).bo!).bo)).toHaveLength(300)
  })
})

describe('/vao-thi — ca đề riêng mà bản đồ chưa có em ⇒ KHÔNG cắt theo băm im lặng', () => {
  it('em vào phòng sau khi chốt ⇒ máy chủ lấp riêng bằng thang lấp (đúng ma trận, không tự luận), gộp vào bản đồ, vào lại ra đúng bộ ấy', async () => {
    const { d, env } = await dungCa()
    await goiWorker(worker, env, '/ca/chot-bat-dau', { maCa: 'C1', boTheoEm: { bo: { S1: ['X1', 'K-I-0', 'K-I-1', 'K-II-0', 'K-III-0'] }, lap: {}, dem: {}, bb: null } }, true)
    const v = await goiWorker(worker, env, '/vao-thi', { maCa: 'C1', sbd: 'S2', idThietBi: 'm2' })
    expect(v.ok).toBe(true)
    const bo = v.boTheoEm.bo.S2 as string[]
    expect(bo).toHaveLength(5)
    expect(bo.filter((q) => /^K-II-/.test(q))).toHaveLength(1)
    expect(bo.filter((q) => q.includes('III'))).toEqual(['K-III-0']) // câu tự luận TL-III-9 không bao giờ vào
    const banDo = JSON.parse(caRow(d).bo!)
    expect(banDo.bo.S2).toEqual(bo)
    expect(banDo.bo.S1).toHaveLength(5) // bộ của em khác giữ nguyên
    expect(Object.keys(banDo.bac.S2)).toHaveLength(5)
    const lai = await goiWorker(worker, env, '/vao-thi', { maCa: 'C1', sbd: 'S2', idThietBi: 'm2' })
    expect(lai.boTheoEm.bo.S2).toEqual(bo)
  })

  it('em có lỗi đến hạn (hàng chữa lỗi) ⇒ bộ lấp trên máy chủ có câu ôn lại của em', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-02T03:00:00.000Z'))
    const { d, env } = await dungCa({ batDau: '2026-10-02T02:50:00.000Z', bo: { bo: { S1: ['K-I-0', 'K-I-1', 'K-I-2', 'K-II-0', 'K-III-0'] } } })
    d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S3','Ba','12A','x')")
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
      .run('DE9', 'X1', 'v1', 'g-X1', 'D1', JSON.stringify({ qid: 'X1', maDe: 'DE9', lop: '12', version: 'v1', group: 'g-X1', phan: 'I', text: 'Câu X1', choices: ['a', 'b', 'c', 'd'], hinhAnh: [], dang: 'D1', mucDo: 'TH', correct: 'B', reviewed: true }))
    await damBaoBangLoiGiai(env); await damBaoBangBoTro(env)
    d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn) VALUES(?,?,?,?,?,1,0,?,?)')
      .run('k1', 'S3', 'X1', 'luyen', 'M', '2026-09-30T03:00:00.000Z', '2026-09-30')
    const v = await goiWorker(worker, env, '/vao-thi', { maCa: 'C1', sbd: 'S3', idThietBi: 'm3' })
    expect(v.ok).toBe(true)
    expect(v.boTheoEm.bo.S3).toContain('X1')
    expect(v.boTheoEm.lap.S3).toEqual(['X1'])
    expect(JSON.parse(caRow(d).bo!).bac.S3.X1).toBe('muc_dich')
  })

  it('máy thầy đời cũ (mốc trước, bản đồ sau): vừa bắt đầu < 20 giây mà bản đồ còn trống ⇒ bảo máy em thử lại, không phát đề', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-02T03:00:05.000Z'))
    const { d, env } = await dungCa({ batDau: '2026-10-02T03:00:00.000Z' })
    const v = await goiWorker(worker, env, '/vao-thi', { maCa: 'C1', sbd: 'S1', idThietBi: 'm1' })
    expect(v).toMatchObject({ ok: false, lyDo: 'cho_bo_cau', thuLaiSauMs: 1500 })
    expect(d.dem('luot')).toBe(0) // không tạo lượt, đồng hồ chưa chạy cho em
    // bản đồ tới (lệnh thứ hai của đường cũ) ⇒ lần thử lại nhận đúng bộ của thầy
    d.sql.prepare("UPDATE ca SET bo_theo_em_json = ? WHERE ma_ca='C1'").run(JSON.stringify({ bo: { S1: ['K-I-3', 'K-I-4', 'K-I-5', 'K-II-1', 'K-III-0'] } }))
    const lai = await goiWorker(worker, env, '/vao-thi', { maCa: 'C1', sbd: 'S1', idThietBi: 'm1' })
    expect(lai.boTheoEm.bo.S1).toEqual(['K-I-3', 'K-I-4', 'K-I-5', 'K-II-1', 'K-III-0'])
  })

  it('quá khe 20 giây mà vẫn chưa có bản đồ ⇒ máy chủ tự lấp riêng (không cắt theo băm)', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-02T03:01:00.000Z'))
    const { d, env } = await dungCa({ batDau: '2026-10-02T03:00:00.000Z' })
    const v = await goiWorker(worker, env, '/vao-thi', { maCa: 'C1', sbd: 'S1', idThietBi: 'm1' })
    expect(v.ok).toBe(true)
    expect(v.boTheoEm.bo.S1).toHaveLength(5)
    expect(JSON.parse(caRow(d).bo!).bo.S1).toEqual(v.boTheoEm.bo.S1)
  })
})

describe('/ca/loi-den-han — lỗi đến hạn theo em (hàng chữa lỗi) cho máy thầy chạy thử', () => {
  const SS = [
    { de: 'Song sinh 0: tính m', pa: { A: '1,2', B: '2,4', C: '3,6', D: '4,8' }, dap_an: 'C', buoc: [], gia_tri_dung: '3.6' },
    { de: 'Song sinh 1: tính m', pa: { A: '5,0', B: '6,0', C: '7,0', D: '8,0' }, dap_an: 'A', buoc: [], gia_tri_dung: '5' },
  ]
  it('trả lỗi còn việc + meta + câu song sinh lượt tới (có đáp án — lệnh của thầy) + câu em đã gặp; không mã bí mật ⇒ 403', async () => {
    const d = taoD1That()
    const env = d.env as unknown as Env
    d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','An','12','x')")
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
      .run('DE9', 'X1', 'v1', 'g-X1', 'D1', JSON.stringify({ qid: 'X1', maDe: 'DE9', lop: '12', version: 'v1', group: 'g-X1', phan: 'I', text: 'Câu X1', choices: ['a', 'b', 'c', 'd'], hinhAnh: [], dang: 'D1', mucDo: 'TH', correct: 'B', reviewed: true, solution: { chot: 'BTKL' } }))
    await damBaoBangLoiGiai(env); await damBaoBangBoTro(env)
    d.sql.prepare("INSERT INTO loi_giai_cau(qid,bam,ma_de,dang,cap_nhat_luc) VALUES('X1','BAM1','DE9','tn','x')").run()
    d.sql.prepare("INSERT INTO cau_bo_tro(bam,qid_mau,song_sinh_json,cau_kiem_json,nhan_nen_json,buoc_json,cap_nhat_luc) VALUES('BAM1','X1',?,'[]','[]','[]','x')").run(JSON.stringify(SS))
    d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn) VALUES(?,?,?,?,?,1,0,?,?)')
      .run('k1', 'S1', 'X1', 'luyen', 'M', '2026-09-30T03:00:00.000Z', '2026-09-30')
    expect((await goiWorker(worker, env, '/ca/loi-den-han', { sbd: ['S1'], ngay: '2026-10-01' })).ok).toBe(false)
    const r = await goiWorker(worker, env, '/ca/loi-den-han', { sbd: ['S1', 'S2'], ngay: '2026-10-01', qids: ['K-I-0'] }, true)
    expect(r.ok).toBe(true)
    expect(r.em.S1).toEqual([
      expect.objectContaining({ qid: 'X1', trangThai: 'mo', denHan: '2026-10-01', nenSongSinh: true, songSinh: 0, phan: 'I', mucDo: 'hieu', dang: 'D1', cauSongSinh: { id: 'X1~ss0', phan: 'I', text: 'Song sinh 0: tính m', choices: ['1,2', '2,4', '3,6', '4,8'], correct: 'C' } }),
    ])
    expect(r.em.S2).toEqual([])
    expect(r.daGap.S1).toEqual({ X1: '2026-09-30' })
    const qua = await goiWorker(worker, env, '/ca/loi-den-han', { sbd: Array.from({ length: 21 }, (_, i) => `E${i}`) }, true)
    expect(qua.ok).toBe(false)
  })
})

// Soát của phiên chủ 02/10: đáp án câu song sinh Phần III phải là `dap_an` đã làm tròn (dấu phẩy), không phải `gia_tri_dung`.
describe('song sinh Phần III — đáp án chấm là đáp án đã làm tròn theo đề', () => {
  it('/ca/loi-den-han trả correct = dap_an "1086,8", không phải giá trị chính xác', async () => {
    const d = taoD1That()
    const env = d.env as unknown as Env
    d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','An','12','x')")
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
      .run('DE9', 'Y1', 'v1', 'g-Y1', 'D1', JSON.stringify({ qid: 'Y1', maDe: 'DE9', lop: '12', version: 'v1', group: 'g-Y1', phan: 'III', text: 'Câu Y1', choices: [], hinhAnh: [], dang: 'D1', mucDo: 'VD', correct: '1000,5', reviewed: true, solution: {} }))
    await damBaoBangLoiGiai(env); await damBaoBangBoTro(env)
    d.sql.prepare("INSERT INTO loi_giai_cau(qid,bam,ma_de,dang,cap_nhat_luc) VALUES('Y1','BAMY','DE9','tln','x')").run()
    d.sql.prepare("INSERT INTO cau_bo_tro(bam,qid_mau,song_sinh_json,cau_kiem_json,nhan_nen_json,buoc_json,cap_nhat_luc) VALUES('BAMY','Y1',?,'[]','[]','[]','x')")
      .run(JSON.stringify([{ de: 'Song sinh Y: tính a. (Kết quả làm tròn đến hàng phần mười.)', dap_an: '1086,8', gia_tri_dung: '1086.8421052632', buoc: [] }]))
    d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn) VALUES(?,?,?,?,?,1,0,?,?)').run('k1', 'S1', 'Y1', 'luyen', 'M', '2026-09-30T03:00:00.000Z', '2026-09-30')
    const r = await goiWorker(worker, env, '/ca/loi-den-han', { sbd: ['S1'], ngay: '2026-10-01' }, true)
    expect(r.em.S1[0].cauSongSinh).toEqual({ id: 'Y1~ss0', phan: 'III', text: 'Song sinh Y: tính a. (Kết quả làm tròn đến hàng phần mười.)', correct: '1086,8' })
  })
})

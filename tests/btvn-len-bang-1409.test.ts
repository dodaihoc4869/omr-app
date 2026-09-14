// BÀI TẬP VỀ NHÀ LÀM CĂN CỨ GỌI LÊN BẢNG — 14/09.
//
// Thầy chốt: "khi phân công học sinh chiếu lên bảng, bạn sử dụng dữ liệu nộp
// bài tập về nhà, vì tôi lấy đúng file giao về nhà cho học sinh để gọi lên
// bảng. Bạn phải hiển thị được học sinh đó làm bao nhiêu câu về nhà/tổng số
// câu, bao nhiêu câu làm đúng, bao nhiêu câu làm sai, bao nhiêu câu chưa làm.
// Và câu bạn đó được phân lên bảng thì đã làm ở nhà là đúng hay sai hay chưa
// làm."
//
// ─────────────────────────────────────────────────────────────────────────
// CHỖ DỄ BỊA NHẤT, VÀ VÌ SAO TỆP NÀY CHẠY MÁY CHỦ THẬT CHỨ KHÔNG ĐỌC MÃ NGUỒN
//
// Bảng `btvn_em` chỉ ghi TỔNG `so_dung`/`so_cau`. Từ hai con số ấy mà suy ra
// "em sai 3 câu, chưa làm 2 câu" là bịa: `qidSai` lúc chấm GỘP cả câu bỏ trống
// vào câu sai, nên tổng không phân biệt được hai thứ thầy cần phân biệt.
//
// Đường đúng duy nhất: đọc `dap_an_json` — nguyên bài làm của em — rồi đối
// chiếu với đáp án trong kho, TỪNG CÂU MỘT. Tệp này dựng một máy chủ giả có
// đúng một tờ đề và hai lượt giao, rồi đối chiếu từng con số với bảng tính tay
// ghi ngay dưới đây. Sai một câu là trượt.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { hoSoLopLenBang, dapAnTheoMaDe } from '../server/src/goi-cu'
import {
  BTVN_RONG,
  btvnCuaCau,
  CHU_BTVN,
  DIEM_BTVN,
  diemHopCau,
  gopBtvn,
  gopHoSo,
  tomTatBtvn,
  TRONG_SO,
  type HoSoEmDayDu,
} from '../src/lib/ho-so-lop'
import { xepBuoiChua, bangChuBuoiChua, type CauVaoXep } from '../src/lib/xep-buoi-chua'
import { taoHtmlMayChieu, type OBang } from '../src/lib/html-may-chieu'
import type { CauChua } from '../src/lib/phan-cong'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')

// ═══════════════════════════════════════════════════════════════════════════
// DỮ LIỆU ĐỐI CHỨNG — tính tay, ghi ra đây trước, rồi mới bắt máy chạy ra.
//
// TỜ ĐỀ `HK1-B1`: 4 câu phần I (đáp án A · B · C · D) và 1 câu phần II
// (đáp án {a:Đ, b:S, c:Đ, d:S} ⇒ chuỗi "ĐSĐS").
//
// LƯỢT L1 (giao 13/09, cả tờ = 5 câu). LƯỢT L2 (giao 14/09, `-TN` = chỉ phần
// I = 4 câu) — mới hơn, nên câu nào L2 có thì kết quả L2 mới là kết quả hiện
// tại của em.
//
//  Em 12001 · L1 nộp: I-1 "A" ĐÚNG · I-2 "C" SAI · I-3 để trống · I-4 không
//            có khoá · II-1 "ĐSĐS" ĐÚNG      ⇒ đúng 2 · sai 1 · chưa 2
//  Em 12001 · L2 nộp: I-1 "A" ĐÚNG · I-2 "B" ĐÚNG · I-3 "X" SAI · I-4 trống
//                                              ⇒ đúng 2 · sai 1 · chưa 1
//  ⇒ GỘP (L2 đè L1): I-1 đúng · I-2 đúng · I-3 SAI · I-4 chưa · II-1 đúng
//    soCauGiao 5 · soDaLam 4 · đúng 3 · sai 1 · chưa 1
//
//  Em 12002 · L1 CHƯA NỘP, L2 CHƯA NỘP ⇒ cả 5 câu đều CHƯA LÀM
//    soCauGiao 5 · soDaLam 0 · đúng 0 · sai 0 · chưa 5
// ═══════════════════════════════════════════════════════════════════════════

const TO_DE = {
  ma_de: 'HK1-B1',
  cau: [
    { phan: 'I', so: 1, dap_an: 'A' },
    { phan: 'I', so: 2, dap_an: 'B' },
    { phan: 'I', so: 3, dap_an: 'C' },
    { phan: 'I', so: 4, dap_an: 'D' },
    { phan: 'II', so: 1, dap_an: { a: 'Đ', b: 'S', c: 'Đ', d: 'S' } },
  ],
}

/** Đếm số lần chạm R2 — một tờ đề đọc hai lượt giao vẫn phải chỉ đọc MỘT lần. */
let soLanDocR2 = 0

type Dong = Record<string, unknown>

function mayChuGia(bang: Record<string, Dong[]>) {
  soLanDocR2 = 0
  const chonBang = (sql: string): Dong[] => {
    if (sql.includes('tien_do_hs')) return bang.tien_do_hs ?? []
    if (sql.includes('ban_do_sai')) return bang.ban_do_sai ?? []
    if (sql.includes('qid_da_lam')) return bang.qid_da_lam ?? []
    if (sql.includes('len_bang')) return bang.len_bang ?? []
    if (sql.includes('btvn_em')) return bang.btvn_em ?? []
    throw new Error('Truy vấn ngoài dự kiến: ' + sql.slice(0, 60))
  }
  return {
    DB: {
      prepare(sql: string) {
        const ra = {
          bind: (..._a: unknown[]) => ra,
          all: async () => ({ results: chonBang(sql) }),
          first: async () => null,
        }
        return ra
      },
    },
    DE: {
      get: async (khoa: string) => {
        if (khoa !== 'kho/HK1-B1.json') return null
        soLanDocR2++
        return { body: JSON.stringify(TO_DE) }
      },
      put: async () => undefined,
    },
  } as never
}

const BANG_DU = {
  tien_do_hs: [],
  ban_do_sai: [],
  qid_da_lam: [],
  len_bang: [],
  // Máy chủ thật trả về theo `ORDER BY b.giao_luc DESC` — giữ đúng thứ tự ấy.
  btvn_em: [
    {
      sbd: '12001',
      ma_btvn: 'L2',
      nop_luc: '2026-09-14T10:00:00Z',
      dap_an_json: JSON.stringify({ 'HK1-B1-I-1': 'A', 'HK1-B1-I-2': 'B', 'HK1-B1-I-3': 'X', 'HK1-B1-I-4': '' }),
      ma_de: 'HK1-B1-TN',
      giao_luc: '2026-09-14T01:00:00Z',
      han_nop: '2026-09-15T01:00:00Z',
    },
    {
      sbd: '12002',
      ma_btvn: 'L2',
      nop_luc: null,
      dap_an_json: null,
      ma_de: 'HK1-B1-TN',
      giao_luc: '2026-09-14T01:00:00Z',
      han_nop: '2026-09-15T01:00:00Z',
    },
    {
      sbd: '12001',
      ma_btvn: 'L1',
      nop_luc: '2026-09-13T10:00:00Z',
      dap_an_json: JSON.stringify({ 'HK1-B1-I-1': 'A', 'HK1-B1-I-2': 'C', 'HK1-B1-I-3': '', 'HK1-B1-II-1': 'ĐSĐS' }),
      ma_de: 'HK1-B1',
      giao_luc: '2026-09-13T01:00:00Z',
      han_nop: '2026-09-14T01:00:00Z',
    },
    {
      sbd: '12002',
      ma_btvn: 'L1',
      nop_luc: null,
      dap_an_json: null,
      ma_de: 'HK1-B1',
      giao_luc: '2026-09-13T01:00:00Z',
      han_nop: '2026-09-14T01:00:00Z',
    },
  ],
}

describe('MÁY CHỦ — quy bài tập về nhà về TỪNG CÂU', () => {
  it('đọc đáp án đúng cả phần I lẫn phần II, và hậu tố `-TN` chỉ lấy phần I', async () => {
    const env = mayChuGia(BANG_DU)
    const caTo = await dapAnTheoMaDe(env, 'HK1-B1')
    expect([...caTo.keys()]).toEqual(['HK1-B1-I-1', 'HK1-B1-I-2', 'HK1-B1-I-3', 'HK1-B1-I-4', 'HK1-B1-II-1'])
    expect(caTo.get('HK1-B1-I-1')).toBe('A')
    // Phần II ép về chuỗi "ĐSĐS" — ĐÚNG như lúc chấm, không đoán kiểu khác.
    expect(caTo.get('HK1-B1-II-1')).toBe('ĐSĐS')

    const chiTN = await dapAnTheoMaDe(env, 'HK1-B1-TN')
    expect([...chiTN.keys()]).toEqual(['HK1-B1-I-1', 'HK1-B1-I-2', 'HK1-B1-I-3', 'HK1-B1-I-4'])
  })

  it('bốn con số thầy hỏi ra ĐÚNG bảng tính tay ở đầu tệp', async () => {
    const r = (await hoSoLopLenBang(mayChuGia(BANG_DU), { dsSbd: ['12001', '12002'] })) as {
      ok: boolean
      em: Record<string, { btvn: Record<string, unknown> }>
    }
    expect(r.ok).toBe(true)

    const a = r.em['12001'].btvn
    expect(a.soCauGiao).toBe(5)
    expect(a.soDaLam).toBe(4)
    expect(a.soDung).toBe(3)
    expect(a.soSai).toBe(1)
    expect(a.soChuaLam).toBe(1)

    const b = r.em['12002'].btvn
    expect(b.soCauGiao).toBe(5)
    expect(b.soDaLam).toBe(0)
    expect(b.soDung).toBe(0)
    expect(b.soSai).toBe(0)
    expect(b.soChuaLam).toBe(5)
    expect(b.soLuot).toBe(2)
    expect(b.soLuotDaNop).toBe(0)
  })

  it('LƯỢT MỚI ĐÈ LƯỢT CŨ: câu I-2 sai ở L1 nhưng đúng ở L2 ⇒ tính là ĐÚNG', async () => {
    const r = (await hoSoLopLenBang(mayChuGia(BANG_DU), { dsSbd: ['12001'] })) as {
      em: Record<string, { btvn: { qidDung: string[]; qidSai: string[]; qidChuaLam: string[] } }>
    }
    const t = r.em['12001'].btvn
    expect([...t.qidDung].sort()).toEqual(['HK1-B1-I-1', 'HK1-B1-I-2', 'HK1-B1-II-1'])
    expect(t.qidSai).toEqual(['HK1-B1-I-3'])
    expect(t.qidChuaLam).toEqual(['HK1-B1-I-4'])
  })

  it('BỎ TRỐNG khác LÀM SAI — khoá thiếu hẳn cũng là chưa làm, không phải sai', async () => {
    const chiL1 = { ...BANG_DU, btvn_em: BANG_DU.btvn_em.filter((x) => x.ma_btvn === 'L1') }
    const r = (await hoSoLopLenBang(mayChuGia(chiL1), { dsSbd: ['12001'] })) as {
      em: Record<string, { btvn: { soDung: number; soSai: number; soChuaLam: number; qidSai: string[] } }>
    }
    const t = r.em['12001'].btvn
    // I-3 để trống, I-4 không có khoá ⇒ CẢ HAI là chưa làm. Chỉ I-2 mới là sai.
    expect(t.soDung).toBe(2)
    expect(t.soSai).toBe(1)
    expect(t.soChuaLam).toBe(2)
    expect(t.qidSai).toEqual(['HK1-B1-I-2'])
  })

  it('ba mảng RỜI NHAU: soCauGiao = đúng + sai + chưa làm, không câu nào đếm hai lần', async () => {
    const r = (await hoSoLopLenBang(mayChuGia(BANG_DU), { dsSbd: ['12001', '12002'] })) as {
      em: Record<string, { btvn: { soCauGiao: number; soDung: number; soSai: number; soChuaLam: number; qidDung: string[]; qidSai: string[]; qidChuaLam: string[] } }>
    }
    for (const s of ['12001', '12002']) {
      const t = r.em[s].btvn
      expect(t.soCauGiao, s).toBe(t.soDung + t.soSai + t.soChuaLam)
      const gop = [...t.qidDung, ...t.qidSai, ...t.qidChuaLam]
      expect(new Set(gop).size, s).toBe(gop.length)
    }
  })

  it('từng lượt giao được ghi riêng, lượt mới nhất đứng đầu', async () => {
    const r = (await hoSoLopLenBang(mayChuGia(BANG_DU), { dsSbd: ['12001'] })) as {
      em: Record<string, { btvn: { luot: { maBtvn: string; soCau: number; soDung: number; soSai: number; soChuaLam: number; daNop: boolean }[] } }>
    }
    const l = r.em['12001'].btvn.luot
    expect(l.map((x) => x.maBtvn)).toEqual(['L2', 'L1'])
    expect(l[0]).toMatchObject({ maBtvn: 'L2', soCau: 4, soDung: 2, soSai: 1, soChuaLam: 1, daNop: true })
    expect(l[1]).toMatchObject({ maBtvn: 'L1', soCau: 5, soDung: 2, soSai: 1, soChuaLam: 2, daNop: true })
  })

  it('hai lượt cùng một tờ đề chỉ chạm R2 MỘT lần', async () => {
    await hoSoLopLenBang(mayChuGia(BANG_DU), { dsSbd: ['12001', '12002'] })
    expect(soLanDocR2).toBe(1)
  })

  it('em chưa được giao bài nào thì hồ sơ RỖNG, không dựng số', async () => {
    const r = (await hoSoLopLenBang(mayChuGia({ ...BANG_DU, btvn_em: [] }), { dsSbd: ['12001'] })) as {
      em: Record<string, { btvn: { soCauGiao: number; soLuot: number; luot: unknown[] } }>
    }
    expect(r.em['12001'].btvn).toMatchObject({ soCauGiao: 0, soDaLam: 0, soDung: 0, soSai: 0, soChuaLam: 0, soLuot: 0 })
    expect(r.em['12001'].btvn.luot).toEqual([])
  })

  it('CHẤM và HỒ SƠ dùng CHUNG một hàm đọc đáp án — không hai bảng đáp án', () => {
    const SRV = doc('server/src/goi-cu.ts')
    expect(SRV).toContain('const dapAnDung: Record<string, string> = Object.fromEntries(await dapAnTheoMaDe(env, chuoi(bt.ma_de)))')
    expect(SRV).toContain('dapAnLuot.set(m, await dapAnTheoMaDe(env, luotTheoMa.get(m)?.maDe ?? ')
  })
})

// ═══════════════════════════════════════════════════════════════════════════

const CD = 'Este - Lipid'
const cau = (so: number, sao = 1): CauChua =>
  ({ id: `HK1-B1-I-${so}`, phan: 'I', so, chuyenDe: CD, sao, viTri: so }) as CauChua

function em(sbd: string, opt: Partial<HoSoEmDayDu> = {}): HoSoEmDayDu {
  return {
    sbd,
    hoTen: `Em ${sbd}`,
    coMat: true,
    chuyenDe: [{ ten: CD, soCau: 10, soSai: 4 }],
    cauSai: [],
    daLam: new Map(),
    lenBang: { soLan: 0, lanCuoi: '', qids: [] },
    btvn: { ...BTVN_RONG, theoCau: new Map() },
    ...opt,
  }
}

const btvnCua = (theo: Record<string, 'dung' | 'sai' | 'chuaLam'>) => {
  const qidDung = Object.entries(theo).filter(([, v]) => v === 'dung').map(([k]) => k)
  const qidSai = Object.entries(theo).filter(([, v]) => v === 'sai').map(([k]) => k)
  const qidChuaLam = Object.entries(theo).filter(([, v]) => v === 'chuaLam').map(([k]) => k)
  return gopBtvn({
    soCauGiao: qidDung.length + qidSai.length + qidChuaLam.length,
    soDaLam: qidDung.length + qidSai.length,
    soDung: qidDung.length,
    soSai: qidSai.length,
    soChuaLam: qidChuaLam.length,
    soLuot: 1,
    soLuotDaNop: 1,
    qidDung,
    qidSai,
    qidChuaLam,
    luot: [],
  })
}

describe('GHÉP EM VỚI CÂU — bài tập về nhà là bằng chứng nặng nhất', () => {
  const c = cau(1)

  it('trọng số vẫn cộng đúng 1,0 sau khi thêm phần bài tập về nhà', () => {
    const tong =
      TRONG_SO.BTVN_CHINH_CAU + TRONG_SO.SAI_CHINH_CAU + TRONG_SO.YEU_CHUYEN_DE + TRONG_SO.CHUA_LAM + TRONG_SO.IT_LEN_BANG
    expect(tong).toBeCloseTo(1, 6)
  })

  it('SAI ở nhà > CHƯA LÀM ở nhà > ĐÚNG ở nhà, mọi thứ khác như nhau', () => {
    const s = em('1', { btvn: btvnCua({ [c.id]: 'sai' }) })
    const k = em('2', { btvn: btvnCua({ [c.id]: 'chuaLam' }) })
    const d = em('3', { btvn: btvnCua({ [c.id]: 'dung' }) })
    expect(diemHopCau(s, c).diem).toBeGreaterThan(diemHopCau(k, c).diem)
    expect(diemHopCau(k, c).diem).toBeGreaterThan(diemHopCau(d, c).diem)
    expect(DIEM_BTVN.dung).toBe(0)
  })

  it('lý do in ra nói rõ em ấy ở nhà làm câu này ra sao', () => {
    for (const kq of ['dung', 'sai', 'chuaLam'] as const) {
      const e = em('1', { btvn: btvnCua({ [c.id]: kq }) })
      expect(diemHopCau(e, c).viSao).toContain(CHU_BTVN[kq])
    }
  })

  it('CÂU KHÔNG NẰM TRONG BÀI GIAO khác CHƯA LÀM — không hiện nhãn, không cộng điểm', () => {
    const e = em('1', { btvn: btvnCua({ 'HK1-B1-I-9': 'sai' }) })
    expect(btvnCuaCau(e, c.id)).toBeNull()
    expect(diemHopCau(e, c).viSao).not.toContain('về nhà')
    // Cùng một em, cùng một câu: không có dữ liệu BTVN thì điểm bằng đúng em
    // chưa có bài giao nào — không được tự cộng thêm gì.
    expect(diemHopCau(e, c).diem).toBeCloseTo(diemHopCau(em('2'), c).diem, 9)
  })

  it('một dòng tóm tắt đủ bốn con số thầy hỏi', () => {
    const e = em('1', { btvn: btvnCua({ q1: 'dung', q2: 'dung', q3: 'sai', q4: 'chuaLam', q5: 'chuaLam' }) })
    expect(tomTatBtvn(e)).toBe('về nhà làm 3/5 câu · đúng 2 · sai 1 · chưa làm 2')
    expect(tomTatBtvn(em('2'))).toBe('chưa có bài tập về nhà nào được giao')
  })

  it('gopHoSo nối thẳng gói máy chủ vào hồ sơ em, máy chủ đời cũ thì rỗng', () => {
    const hs = gopHoSo(
      { em: { '12001': { chuyenDe: [], qidSai: [], qidDaLam: [], lenBang: { soLan: 0, lanCuoi: '', qids: [] } } } },
      [{ sbd: '12001', hoTen: 'A', coMat: true }],
    )
    expect(hs[0].btvn.soCauGiao).toBe(0)
    expect(hs[0].btvn.theoCau.size).toBe(0)
  })
})

describe('THUẬT TOÁN — gọi đúng em CHƯA QUA ĐƯỢC câu ấy ở nhà', () => {
  it('câu ấy giao cho em làm SAI ở nhà, không giao cho em làm ĐÚNG', () => {
    const c1 = cau(1, 2)
    const ds: CauVaoXep[] = [{ cau: c1, batBuoc: false }]
    const gioi = em('12001', { btvn: btvnCua({ [c1.id]: 'dung' }) })
    const kem = em('12002', { btvn: btvnCua({ [c1.id]: 'sai' }) })
    const kq = xepBuoiChua(ds, [gioi, kem])
    const dong = kq.dong.find((d) => d.cau.id === c1.id && d.tang === 'len_bang')
    expect(dong?.em?.sbd).toBe('12002')
  })

  it('bảng copy in kèm nhãn về nhà và bốn con số, để thầy cầm gọi luôn', () => {
    const c1 = cau(1, 2)
    const kem = em('12002', { btvn: btvnCua({ [c1.id]: 'sai', 'HK1-B1-I-7': 'dung', 'HK1-B1-I-8': 'chuaLam' }) })
    const kq = xepBuoiChua([{ cau: c1, batBuoc: false }], [kem])
    const bang = bangChuBuoiChua(kq, 'Ca 1')
    expect(bang).toContain('[về nhà làm SAI]')
    expect(bang).toContain('về nhà làm 2/3 câu · đúng 1 · sai 1 · chưa làm 1')
  })
})

describe('TỜ MÁY CHIẾU — hiện ngay dưới tên em', () => {
  const cauLuyen = {
    phan: 'I',
    de: 'Chất nào sau đây là este?',
    pa: ['CH3COOH', 'CH3COOC2H5', 'C2H5OH', 'CH3CHO'],
    dapAn: 'B',
    chot: 'Este có nhóm -COO-',
  } as unknown as OBang['cau']

  const o = (x: Partial<OBang>): OBang => ({ sbd: '12001', hoTen: 'Nguyễn Văn A', soCau: 1, cau: cauLuyen, ...x })

  it('in đúng ba nhãn trạng thái, mỗi nhãn một màu riêng', () => {
    for (const [kq, chu] of [
      ['sai', 'Ở NHÀ LÀM SAI'],
      ['chuaLam', 'Ở NHÀ CHƯA LÀM'],
      ['dung', 'Ở NHÀ LÀM ĐÚNG'],
    ] as const) {
      const h = taoHtmlMayChieu([o({ btvnCau: kq })], {})
      expect(h, kq).toContain(chu)
      expect(h, kq).toContain(`mc-btvn-${kq}`)
    }
  })

  it('in đủ bốn con số cả lượt bài tập về nhà', () => {
    const h = taoHtmlMayChieu([o({ btvnTom: { soCauGiao: 20, soDaLam: 12, soDung: 8, soSai: 4, soChuaLam: 8 } })], {})
    expect(h).toContain('Về nhà: làm 12/20 câu · đúng 8 · sai 4 · chưa làm 8')
  })

  it('KHÔNG có dữ liệu thì KHÔNG in dòng nào — cấm dựng số', () => {
    const h = taoHtmlMayChieu([o({})], {})
    expect(h).not.toContain('<div class="mc-btvn">')
    expect(h).not.toContain('Về nhà:')
  })

  it('ba màu nhãn đều có bản nền sáng và bản nền tối', () => {
    const src = doc('src/lib/html-may-chieu.ts')
    for (const b of ['--mc-do:', '--mc-do-nen:', '--mc-cam:', '--mc-cam-nen:', '--mc-luc:', '--mc-luc-nen:']) {
      // Một lần trong bảng biến nền sáng, một lần trong bảng nền tối.
      expect(src.split(b).length - 1, b).toBeGreaterThanOrEqual(2)
    }
  })
})

describe('MÀN GỌI LÊN BẢNG — thầy nhìn thấy, không phải đi tra', () => {
  const MAN = doc('src/screens/GoiLenBangScreen.tsx')

  it('mỗi dòng phân công có thẻ trạng thái của ĐÚNG câu ấy', () => {
    expect(MAN).toContain('<TheBtvn kq={d.em ? btvnCuaCau(d.em, d.cau.id) : null} />')
  })

  it('mỗi dòng phân công có bốn con số của em ấy', () => {
    expect(MAN).toContain(
      '{d.em.btvn.soDaLam}/{d.em.btvn.soCauGiao} · Đ {d.em.btvn.soDung} · S {d.em.btvn.soSai} · ? {d.em.btvn.soChuaLam}',
    )
  })

  it('có dòng tổng cả lớp, và nói thẳng khi chưa có dữ liệu', () => {
    expect(MAN).toContain('Bài tập về nhà cả lớp: làm {tomBtvnLop.daLam}/{tomBtvnLop.giao} câu')
    expect(MAN).toContain('Chưa có dữ liệu bài tập về nhà cho lớp này')
  })

  it('tờ máy chiếu nhận cả hai thứ từ đúng bảng phân công vừa xếp', () => {
    expect(MAN).toContain('btvnCau: btvnCuaCau(d.em!, d.cau.id) ?? undefined')
    expect(MAN).toContain('btvnTom: p.btvnTom')
  })
})

// ĐỀ RIÊNG TỪNG EM — nhãn "Sai lần thứ N" và "Đã sửa được" (mục 4.4, mục 8).
//
// Tách khỏi `de-rieng.test.ts`: file kia đo thuật toán ra đề, file này đo thứ
// người đọc THẤY.
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import PhieuScreen from '../src/screens/PhieuScreen'
import TheCauChiTiet from '../src/components/TheCauChiTiet'
import { BAN_PHIEU, cauDaSuaDuoc, dongCauLap, dungCauSai, type CauSaiChiTiet, type PhieuDayDu } from '../src/lib/phieu-du-lieu'
import type { ChiTietCauRow } from '../src/lib/exam-api'
import type { PublicExamBank, TeacherExamSource } from '../src/data/examContent'
import { assignStudentQuestions } from '../src/lib/exam-assign'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')

const BANK: TeacherExamSource[] = [
  {
    maDe: 'de1',
    phanI: [
      { id: 'q1', text: 'Câu lặp', choices: ['a', 'b', 'c', 'd'], correct: 'C', chuyenDe: 'Ester – lipid' },
      { id: 'q2', text: 'Câu mới', choices: ['a', 'b', 'c', 'd'], correct: 'A', chuyenDe: 'Amin' },
    ],
    phanII: [],
    phanIII: [],
  } as unknown as TeacherExamSource,
]

function row(qid: string, soCau: number, dung: boolean, chon = dung ? 'C' : 'B'): ChiTietCauRow {
  return { phan: 'I', soCau, qid, chuyenDe: '', mucDo: '', dapAnChon: chon, dapAnDung: 'C', dungSai: dung, giay: 30 } as ChiTietCauRow
}

function goi(sua: Partial<PhieuDayDu> = {}): PhieuDayDu {
  return {
    v: BAN_PHIEU,
    hoTen: 'Nguyễn Văn A',
    sbd: '12000',
    lop: '12',
    tenCa: 'Ca thử',
    maCa: '111111',
    ngay: '2026-09-07T12:00:00.000Z',
    diem: 7,
    diemPhan: null,
    tranPhan: null,
    soCauSai: 1,
    tongSoCau: 2,
    hang: null,
    siSo: null,
    chuyenDeCa: [],
    chuyenDeTong: [],
    lichSu: [],
    diemLop: [],
    vieCanLam: '',
    thongKe: null,
    tinHieu: [],
    ducKet: [],
    cauSai: [],
    dai: [],
    ...sua,
  } as PhieuDayDu
}

const CAU_LAP_SAI: CauSaiChiTiet = {
  phan: 'I',
  soCau: 1,
  qid: 'q1',
  chuyenDe: 'Ester – lipid',
  mucDo: '',
  giay: 30,
  de: 'Câu lặp',
  luaChon: ['a', 'b', 'c', 'd'],
  dapAnDung: 'C',
  dapAnChon: 'B',
  chot: '',
  lyDo: null,
  buoc: null,
  ketQua: '',
  coHinh: false,
  laCauLap: true,
  soLanSai: 3,
  daSuaDuoc: false,
}

describe('bảng nghiệm thu mục 8 — phần nhãn', () => {
  it('NHÃN SAI LẦN THỨ N — sai ở ca 1, ca 2 và ca này thì ghi "Sai lần thứ 3"', () => {
    // `lapCua` chở số lần sai TRƯỚC ca này; nhãn cộng thêm lần này.
    const ra = dungCauSai([row('q1', 1, false)], BANK, true, { lapCua: { q1: 2 } })
    expect(ra[0]).toMatchObject({ laCauLap: true, soLanSai: 3, daSuaDuoc: false })
    render(<TheCauChiTiet c={ra[0]} stt={1} />)
    expect(screen.getByText('Sai lần thứ 3')).toBeTruthy()
  })

  it('NHÃN ĐÃ SỬA ĐƯỢC — câu lặp mà lần này làm đúng', () => {
    const tronDe = dungCauSai([row('q1', 1, true)], BANK, false, { lapCua: { q1: 2 } })
    expect(tronDe[0]).toMatchObject({ laCauLap: true, daSuaDuoc: true })
    // Và số lần sai KHÔNG cộng thêm: lần này em có sai đâu.
    expect(tronDe[0].soLanSai).toBe(2)
    expect(cauDaSuaDuoc(tronDe)).toHaveLength(1)
  })

  it('câu ĐÃ SỬA ĐƯỢC không nằm trong mục Từng câu sai', () => {
    const cauSai = dungCauSai([row('q1', 1, true), row('q2', 2, false)], BANK, true, { lapCua: { q1: 2 } })
    expect(cauSai.map((c) => c.qid)).toEqual(['q2'])
  })

  it('KHÔNG GẮN NHÃN BỪA — câu mới, làm đúng thì 0 nhãn', () => {
    const tronDe = dungCauSai([row('q2', 2, true, 'A')], BANK, false, { lapCua: { q1: 2 } })
    expect(tronDe[0].laCauLap).toBeUndefined()
    expect(tronDe[0].daSuaDuoc).toBeUndefined()
    expect(cauDaSuaDuoc(tronDe)).toHaveLength(0)
    const { container } = render(<TheCauChiTiet c={tronDe[0]} stt={1} />)
    expect(container.querySelector('.bc-lap')).toBeNull()
  })

  it('ca THƯỜNG không truyền `lapCua` thì không câu nào mang nhãn', () => {
    const ra = dungCauSai([row('q1', 1, false)], BANK, true, { rowsLop: null })
    expect(ra[0].laCauLap).toBeUndefined()
    expect(ra[0].soLanSai).toBeUndefined()
  })

  it('BA CHỖ NÓI GIỐNG NHAU — nhãn dựng trong thẻ câu dùng chung, không mỗi màn một bản', () => {
    const the = doc('src/components/TheCauChiTiet.tsx')
    expect(the).toContain('bc-lap')
    expect(the).toContain('Sai lần thứ')
    expect(the).toContain('Đã sửa được')
    // Ba chỗ hiện câu đều đi qua đúng thẻ này.
    for (const f of ['src/screens/PhieuV3.tsx', 'src/screens/PhieuScreen.tsx', 'src/components/TamTruotHoiBai.tsx']) {
      expect(doc(f)).toContain('TheCauChiTiet')
      // và KHÔNG tự dựng lại nhãn.
      expect(doc(f)).not.toContain('Sai lần thứ')
    }
  })

  it('CẤM MÀU ĐƠN ĐỘC — nhãn luôn có chữ', () => {
    const { container } = render(<TheCauChiTiet c={CAU_LAP_SAI} stt={1} />)
    const nhan = container.querySelector('.bc-lap')
    expect(nhan).not.toBeNull()
    expect(nhan?.textContent?.trim()).toBe('Sai lần thứ 3')
  })

  it('NÓI RÕ CÓ CÂU LẶP — báo cáo có dòng "trong đó N câu là câu con từng sai"', () => {
    expect(dongCauLap(6, 20)).toBe('Trong đó 6 câu trên 20 câu là câu con từng sai, nay làm lại.')
    // Không có câu lặp thì KHÔNG dựng dòng, không in "0 câu".
    expect(dongCauLap(0, 20)).toBe('')
    render(<PhieuScreen duCoSan={goi({ soCauLap: 6, dongCauLap: dongCauLap(6, 20), deRieng: true })} />)
    expect(document.body.textContent ?? '').toContain('6 câu trên 20 câu là câu con từng sai')
  })

  it('CA ĐỀ RIÊNG NÓI THẲNG là mỗi bạn một bộ câu', () => {
    render(<PhieuScreen duCoSan={goi({ deRieng: true })} />)
    expect(document.body.textContent ?? '').toContain('mỗi bạn một bộ câu')
  })

  it('KHỐI "ĐÃ SỬA ĐƯỢC" đứng TRÊN mục Từng câu sai, không chôn xuống cuối', () => {
    render(<PhieuScreen duCoSan={goi({ daSuaDuoc: [{ ...CAU_LAP_SAI, daSuaDuoc: true, dapAnChon: 'C' }], cauSai: [CAU_LAP_SAI] })} />)
    const chu = document.body.textContent ?? ''
    expect(chu).toContain('đã sửa được 1 câu từng sai')
    expect(chu.indexOf('đã sửa được 1 câu từng sai')).toBeLessThan(chu.indexOf('1 câu sai'))
  })

  it('CHẤM MỐC CA ĐỀ RIÊNG VẼ RỖNG RUỘT trên đường tiến bộ', () => {
    const lichSu = [
      { maCa: 'cu', tenCa: '', ngay: '2026-09-01T00:00:00Z', tong: 5, hang: null, siSo: null },
      { maCa: '111111', tenCa: '', ngay: '2026-09-07T00:00:00Z', tong: 7, hang: null, siSo: null },
    ]
    const { container } = render(<PhieuScreen duCoSan={goi({ lichSu, deRieng: true })} />)
    const cham = [...container.querySelectorAll('.v3-spark circle')]
    // Mốc của chính ca đề riêng: không tô ruột, có nét viền.
    const rong = cham.filter((c) => c.getAttribute('fill') === 'none' && c.getAttribute('stroke'))
    expect(rong.length).toBeGreaterThan(0)
    // Mốc ca thường vẫn tô đặc.
    expect(cham.some((c) => c.getAttribute('fill') !== 'none')).toBe(true)
  })

  it('CA CŨ KHÔNG ĐỔI — không truyền bản đồ thì cắt câu y như luật hash cũ', () => {
    const bank = {
      phanI: Array.from({ length: 40 }, (_, i) => ({ id: `q${i}`, text: `c${i}`, choices: ['a', 'b', 'c', 'd'] })),
      phanII: [],
      phanIII: [],
      soCau: { I: 5, II: 0, III: 0 },
    } as unknown as PublicExamBank
    const cu = assignStudentQuestions(bank, 'ca1', '12000').phanI.map((a) => a.qid)
    // Bản đồ của ca KHÁC không được rò sang: gọi lại y hệt phải ra y hệt.
    expect(assignStudentQuestions(bank, 'ca1', '12000').phanI.map((a) => a.qid)).toEqual(cu)
    // Có bản đồ thì đi theo bản đồ, KHÔNG cắt lại theo seed.
    const rieng = assignStudentQuestions({ ...bank, boTheoEm: { '12000': ['q7', 'q9'] } }, 'ca1', '12000')
    expect(rieng.phanI.map((a) => a.qid)).toEqual(['q7', 'q9'])
  })

  it('BẢN ĐỒ ĐỀ RIÊNG ĐI CÙNG Ở MỌI CHỖ DỰNG BẢNG CHẤM', () => {
    // Thiếu ở một chỗ là chỗ đó cắt câu theo luật hash và dựng bảng của người
    // khác — sai điểm mà màn hình không báo gì. Đây là phép kiểm chống hồi quy
    // cho đúng cái bẫy đó.
    for (const f of ['src/screens/ExamMonitorScreen.tsx', 'src/components/PhieuZaloEm.tsx', 'src/lib/phieu-ca-ca.ts', 'src/lib/de-rieng-nguon.ts']) {
      const ma = doc(f)
      const goi = ma.match(/mergeKeepAnswers\([^)]*\)/g) ?? []
      expect(goi.length).toBeGreaterThan(0)
      for (const g of goi) expect(g.split(',').length).toBeGreaterThanOrEqual(3)
    }
  })

  it('SỐ LỆNH MÁY CHỦ — quét ngược đúng 3 ca, mỗi ca một lệnh', () => {
    const nguon = doc('src/lib/de-rieng-nguon.ts')
    // Một lệnh cho một CA, không phải một lệnh cho một EM: vòng lặp theo sbd
    // KHÔNG được chứa lệnh chờ nào.
    const dau = nguon.indexOf('moiNhat.forEach')
    const thanEm = nguon.slice(dau, nguon.indexOf('return { maCa:', dau))
    expect(dau).toBeGreaterThan(0)
    expect(thanEm).not.toContain('await ')
    // Và đúng MỘT lệnh đọc ca trong cả file, gọi tối đa `SO_CA_TRA_NGUOC` lần.
    expect((nguon.match(/await chiTietCa\(/g) || []).length).toBe(1)
    expect((nguon.match(/await danhSachCa\(/g) || []).length).toBe(1)
    expect(nguon).toContain('ch.SO_CA_TRA_NGUOC')
  })
})

// MÀN SỬA MÃ DẠNG — đặc tả v3 mục 4.3.
//
// Ba thứ phải đúng, không thì thầy sửa mà như không sửa:
//   1. Con số báo cho thầy phải là số THẬT — đếm nguồn hàng bằng đúng cổng.
//   2. App không được tự nghĩ mã: ngoài từ vựng đóng thì từ chối.
//   3. Cái thầy sửa phải sống sót lần đồng bộ sau.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { TeacherExamSource } from '../src/data/examContent'
import { thongKeDang, dsCauCoMa, LY_DO_CHUONG_PHU } from '../src/lib/thong-ke-dang'
import { apDungSoSua, boSua, ghiSua, xuatSo, LY_DO_THAY_BO, type SoSuaDang } from '../src/lib/sua-dang'
import { CO_CHE, VIEC, maTrongTuVung, tenCua, chuongCua } from '../src/lib/tu-vung-dang'
import { maDangHopLe } from '../src/lib/cau-hinh-chua'

const doc = (f: string) => readFileSync(resolve(__dirname, '..', f), 'utf8')

const HS = 'ESTER.THUY_PHAN_BASE.TINH_KHOI_LUONG'
const KL = 'ESTER.THUY_PHAN_BASE.GOI_TEN'
const DP = 'ESTER.DANH_PHAP.GOI_TEN'

type Doi = { ma?: string | null; viSaoNull?: string; hinhAnh?: { src: string }[] }
const q = (id: string, ma: string | null, doi: Doi = {}) => ({
  id,
  text: `Đề của ${id}`,
  choices: ['a', 'b', 'c', 'd'] as [string, string, string, string],
  correct: 'A' as const,
  dang: ma ? { ma, ten: tenCua(ma) } : null,
  viSaoNull: ma ? undefined : (doi.viSaoNull ?? 'chưa nhận ra cơ chế'),
  ...(doi.hinhAnh ? { hinhAnh: doi.hinhAnh } : {}),
})

const kho = (cau: ReturnType<typeof q>[]): TeacherExamSource[] => [
  { maDe: 'D1', ngayNap: '2026-09-06', phanI: cau, phanII: [], phanIII: [] } as unknown as TeacherExamSource,
]

describe('từ vựng đóng — app không được tự nghĩ mã', () => {
  it('nhận mã có đủ ba tầng và cả ba tầng đều có trong bảng', () => {
    expect(maTrongTuVung(HS)).toBe(true)
  })

  it('TỪ CHỐI mã đúng khuôn nhưng cơ chế không có trong chương đó', () => {
    // `maDangHopLe` chỉ xét khuôn nên vẫn cho qua — đúng vai trò của nó.
    expect(maDangHopLe('ESTER.XA_PHONG.TINH_KHOI_LUONG')).toBe(true)
    // Bảng đóng mới là chốt chặn cuối.
    expect(maTrongTuVung('ESTER.XA_PHONG.TINH_KHOI_LUONG')).toBe(false)
  })

  it('TỪ CHỐI cơ chế của chương khác dán vào chương này', () => {
    expect(maTrongTuVung('ESTER.PEPTIDE.NHAN_DANG')).toBe(false)
    expect(maTrongTuVung('HOP_CHAT_N.PEPTIDE.NHAN_DANG')).toBe(true)
  })

  it('TỪ CHỐI việc phải làm không có trong bảng dùng chung', () => {
    expect(maTrongTuVung('ESTER.CAU_TAO.TINH_TOAN')).toBe(false)
  })

  it('đọc mã ra tiếng Việt; mã hỏng thì trả nguyên mã chứ không che', () => {
    expect(tenCua(HS)).toBe('Xà phòng hoá — tính khối lượng')
    expect(tenCua('ESTER.XA_PHONG.TINH_KHOI_LUONG')).toBe('ESTER.XA_PHONG.TINH_KHOI_LUONG')
    expect(chuongCua(HS)).toBe('ESTER')
    expect(chuongCua('hỏng')).toBe('')
  })

  it('bảng trong app khớp bảng trong kho-de/DANG-BAI.md về số lượng', () => {
    expect(Object.keys(VIEC)).toHaveLength(23)
    expect(Object.keys(CO_CHE)).toHaveLength(5)
    expect(Object.values(CO_CHE).reduce((a, c) => a + Object.keys(c).length, 0)).toBe(37)
  })
})

describe('thống kê — con số báo cho thầy phải là số thật', () => {
  it('đếm đã gán, chưa gán, và tách câu chương phụ ra khỏi việc của thầy', () => {
    const tk = thongKeDang(
      kho([
        q('a', HS),
        q('b', HS),
        q('c', null, { viSaoNull: 'chưa nhận ra cơ chế' }),
        q('d', null, { viSaoNull: LY_DO_CHUONG_PHU }),
      ]),
    )
    expect(tk.tongCau).toBe(4)
    expect(tk.daGan).toBe(2)
    expect(tk.chuaGan).toBe(2)
    expect(tk.chuaGanDoChuongPhu).toBe(1)
    expect(tk.canThayChot.map((c) => c.qid)).toEqual(['c'])
    expect(tk.canThayChot[0].viSaoNull).toBe('chưa nhận ra cơ chế')
  })

  it('CÂU CÓ HÌNH không được tính là nguồn hàng chữa', () => {
    const tk = thongKeDang(kho([q('a', HS), q('b', HS, { hinhAnh: [{ src: 'data:,' }] }), q('c', HS)]))
    expect(tk.daGan).toBe(3)
    expect(tk.dungLamCauChua).toBe(2)
    expect(tk.loaiViCoHinh).toBe(1)
  })

  it('phủ bậc 1 chỉ tính khi đủ hàng: cần 3 câu cùng mã mới chữa được', () => {
    // 2 câu cùng mã: em sai một câu thì chỉ còn 1 câu để chữa, thiếu 1.
    expect(thongKeDang(kho([q('a', HS), q('b', HS)])).phuBac1).toBe(0)
    expect(thongKeDang(kho([q('a', HS), q('b', HS), q('c', HS)])).phuBac1).toBe(100)
  })

  it('bậc 2 gom theo nhánh cơ chế, không gom theo chuyên đề', () => {
    // HS và KL cùng nhánh ESTER.THUY_PHAN_BASE; DP khác cơ chế.
    const tk = thongKeDang(kho([q('a', HS), q('b', KL), q('c', KL), q('d', DP)]))
    expect(tk.phuBac1).toBe(0)
    expect(tk.phuBac2).toBe(75) // 3 câu nhánh THUY_PHAN_BASE đủ; câu DANH_PHAP thì không
    expect(tk.nhanhMong.map((n) => n.nhanh)).toContain('ESTER.DANH_PHAP')
  })

  it('mã ngoài bảng đóng bị nêu tên, không lặng lẽ tính là đã gán tử tế', () => {
    const tk = thongKeDang(kho([q('a', 'ESTER.XA_PHONG.TINH_KHOI_LUONG')]))
    expect(tk.maLa).toHaveLength(1)
    expect(tk.maLa[0].ma).toBe('ESTER.XA_PHONG.TINH_KHOI_LUONG')
  })

  it('danh sách câu có mã kèm cờ dùng được hay không', () => {
    const ds = dsCauCoMa(kho([q('a', HS), q('b', HS, { hinhAnh: [{ src: 'data:,' }] }), q('c', null)]))
    expect(ds.map((c) => c.qid)).toEqual(['a', 'b'])
    expect(ds.find((c) => c.qid === 'a')?.dungDuoc).toBe(true)
    expect(ds.find((c) => c.qid === 'b')?.dungDuoc).toBe(false)
  })
})

describe('sổ sửa mã — cái thầy sửa phải sống sót', () => {
  it('ghi được mã trong bảng đóng', () => {
    const so = ghiSua({}, 'a', HS)
    expect(so.a.ma).toBe(HS)
  })

  it('TỪ CHỐI mã ngoài bảng đóng, kể cả khi đúng khuôn ba tầng', () => {
    expect(ghiSua({}, 'a', 'ESTER.XA_PHONG.TINH_KHOI_LUONG')).toEqual({})
    expect(ghiSua({}, 'a', 'BIA.DAT.RA')).toEqual({})
  })

  it('bỏ mã thì phải kèm lý do, đúng luật viSaoNull của kho', () => {
    const so = ghiSua({}, 'a', null)
    expect(so.a.ma).toBeNull()
    expect(so.a.viSaoNull).toBe(LY_DO_THAY_BO)
  })

  it('áp sổ lên đề: đổi mã, và gắn tên đọc được chứ không để trống', () => {
    const s = apDungSoSua(kho([q('a', DP)])[0], ghiSua({}, 'a', HS))
    expect(s.phanI[0].dang).toEqual({ ma: HS, ten: 'Xà phòng hoá — tính khối lượng' })
  })

  it('áp sổ để bỏ mã: câu về null kèm lý do, không còn mã cũ', () => {
    const s = apDungSoSua(kho([q('a', DP)])[0], ghiSua({}, 'a', null))
    expect(s.phanI[0].dang).toBeNull()
    expect(s.phanI[0].viSaoNull).toBe(LY_DO_THAY_BO)
  })

  it('câu không có trong sổ thì giữ nguyên mã kho', () => {
    const s = apDungSoSua(kho([q('a', DP), q('b', HS)])[0], ghiSua({}, 'a', HS))
    expect(s.phanI[1].dang?.ma).toBe(HS)
  })

  it('bỏ khỏi sổ thì câu trả về đúng mã kho', () => {
    const so = ghiSua({}, 'a', HS)
    const s = apDungSoSua(kho([q('a', DP)])[0], boSua(so, 'a'))
    expect(s.phanI[0].dang?.ma).toBe(DP)
  })

  it('sổ rỗng thì trả đúng đối tượng cũ, không dựng lại đề vô ích', () => {
    const goc = kho([q('a', HS)])[0]
    expect(apDungSoSua(goc, {})).toBe(goc)
  })

  it('xuất sổ ra file có mã đề để pipeline biết mở file nào', () => {
    const so: SoSuaDang = ghiSua(ghiSua({}, 'a', HS), 'b', null)
    const j = JSON.parse(xuatSo(so, kho([q('a', DP), q('b', DP)])))
    expect(j.loai).toBe('so-sua-dang')
    expect(j.soCau).toBe(2)
    expect(j.sua.every((x: { maDe: string }) => x.maDe === 'D1')).toBe(true)
    expect(j.sua.find((x: { qid: string }) => x.qid === 'b').viSaoNull).toBe(LY_DO_THAY_BO)
  })
})

describe('không lách, không thành mã chết', () => {
  it('đồng bộ có áp sổ — thiếu dòng này là sửa xong lại về như cũ', () => {
    const t = doc('src/lib/exam-sync.ts')
    expect(t).toContain('loadSoSuaDang')
    expect(t).toMatch(/saveExamSource\(\s*apDungSoSua\(source, soSua\)\s*\)/)
  })

  it('màn Ngân hàng THẬT SỰ dùng khối mã dạng', () => {
    // Tôi đã một lần sửa nhầm component chết (GiaoBaiTap) rồi tưởng xong.
    const t = doc('src/screens/NganHangDeScreen.tsx')
    expect(t).toContain("import KhoiMaDang from '../components/KhoiMaDang'")
    expect(t).toContain('<KhoiMaDang')
    expect(t).toContain('onSua={luuSoSua}')
  })

  it('sửa mã ghi cả vào sổ lẫn vào đề đang lưu', () => {
    const t = doc('src/screens/NganHangDeScreen.tsx')
    const than = t.slice(t.indexOf('const luuSoSua'), t.indexOf('const dongBo'))
    expect(than).toContain('saveSoSuaDang')
    expect(than).toContain('apDungSoSua')
    expect(than).toContain('saveExamSource')
  })

  it('khối mã dạng chỉ chọn trong bảng đóng, không có ô gõ mã tay', () => {
    const t = doc('src/components/KhoiMaDang.tsx')
    expect(t).toContain("from '../lib/tu-vung-dang'")
    expect(t).not.toMatch(/<input[^>]*ma[^>]*>/i)
  })

  it('thống kê đếm nguồn hàng bằng ĐÚNG cổng, không tự đếm lại', () => {
    const t = doc('src/lib/thong-ke-dang.ts')
    expect(t).toContain("import { ungVienChua } from './rut-de-chua'")
    expect(t).not.toContain('anhThanCau')
  })
})

// ---------------------------------------------------------------------------
// MÁY CÒN GIỮ ĐỀ CŨ — 07/09.
//
// Thầy mở app trên máy khác, màn báo "2 205 câu cần thầy chốt" và thầy định gán
// tay hết. Nhưng kho đã gán xong từ lâu: máy đó chỉ chưa tải bản mới về. Câu
// THIẾU HẲN trường `dang` khác hẳn câu `dang === null` có ghi lý do, gộp hai
// thứ đó vào một ô đếm là đẩy thầy đi làm lại việc đã xong.
import { chonDeCanTai, thieuTruongDang } from '../src/lib/exam-sync'

const cauCu = (id: string) => {
  const c = q(id, null) as Record<string, unknown>
  delete c.dang
  delete c.viSaoNull
  return c as unknown as ReturnType<typeof q>
}

describe('máy còn giữ đề cũ', () => {
  it('câu thiếu hẳn trường dang KHÔNG bị tính là "cần thầy chốt"', () => {
    const tk = thongKeDang(kho([q('a', HS), cauCu('b'), cauCu('c')]))
    expect(tk.chuaTaiLai).toBe(2)
    expect(tk.canThayChot).toHaveLength(0)
    expect(tk.deChuaTaiLai).toEqual(['D1'])
  })

  it('vẫn tách được với câu pipeline CỐ Ý để trống kèm lý do', () => {
    const tk = thongKeDang(kho([cauCu('a'), q('b', null, { viSaoNull: 'chưa nhận ra cơ chế' }), q('c', null, { viSaoNull: LY_DO_CHUONG_PHU })]))
    expect(tk.chuaTaiLai).toBe(1)
    expect(tk.canThayChot).toHaveLength(1)
    expect(tk.chuaGanDoChuongPhu).toBe(1)
  })

  it('nhận ra đề nào trên máy còn thiếu trường dang', () => {
    expect(thieuTruongDang(kho([q('a', HS), cauCu('b')])[0])).toBe(true)
    expect(thieuTruongDang(kho([q('a', HS), q('b', null)])[0])).toBe(false)
  })

  it('đồng bộ TỰ tải lại đề còn thiếu trường, dù ngày nạp giống hệt', () => {
    const tren = [{ maDe: 'D1', ngayNap: '2026-09-06' }] as Parameters<typeof chonDeCanTai>[0]
    const { capNhat } = chonDeCanTai(tren, kho([cauCu('a')]))
    expect(capNhat.map((x) => x.maDe)).toEqual(['D1'])
  })

  it('đề đã đủ trường thì KHÔNG tải lại — không kéo 31 MB mỗi lần mở màn', () => {
    const tren = [{ maDe: 'D1', ngayNap: '2026-09-06' }] as Parameters<typeof chonDeCanTai>[0]
    expect(chonDeCanTai(tren, kho([q('a', HS)])).capNhat).toHaveLength(0)
  })

  it('ép tải lại thì kéo hết, kể cả đề không đổi gì', () => {
    const tren = [{ maDe: 'D1', ngayNap: '2026-09-06' }] as Parameters<typeof chonDeCanTai>[0]
    expect(chonDeCanTai(tren, kho([q('a', HS)]), true).capNhat).toHaveLength(1)
  })

  it('màn có nút ép tải lại và có câu can thầy ĐỪNG gán tay', () => {
    const t = doc('src/components/KhoiMaDang.tsx')
    expect(t).toContain('Máy này còn giữ bản đề cũ')
    expect(t).toContain('đừng gán tay')
    expect(t).toContain('onTaiLaiHet')
    expect(doc('src/screens/NganHangDeScreen.tsx')).toContain('onTaiLaiHet={() => dongBo(scriptUrl, secret, false, true)}')
  })
})

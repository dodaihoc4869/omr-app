// RÀ SOÁT TỪ NGỮ APP THẦY — khoá các cụm đã sửa (docs/ra-soat-tu-ngu-2109-code4.md, Boss duyệt 21/09; chuẩn docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md mục A).
// Mỗi cụm: chữ MỚI có mặt + chữ CŨ không quay lại ở đúng các tệp giao diện của cụm. KHÔNG khoá luồng thi thật.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { moTaCauChoThay, nhanCuaCau, TEN_CAU_MAT } from '../src/lib/btvn-nang-do-thay'

const doc = (f: string) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8')
/** Bỏ chú thích để chỉ soi CHỮ HIỆN RA (giữ nguyên chuỗi trong JSX/JS). */
const chuHienRa = (f: string) => doc(f).split('\n').filter((l) => !/^\s*(\/\/|\/\*|\*)/.test(l)).join('\n')

describe('CỤM 1 · Giao bài tập về nhà + Xem trước + theo dõi (hàng 2, 3, 5, 6, 7, 11, 12)', () => {
  const TEP = ['src/screens/PhanCongScreen.tsx', 'src/components/KhoiBtvnLo.tsx', 'src/components/KhoiCaNhanHoa.tsx', 'src/components/XemTruocPhanBo.tsx', 'src/components/HocSinhNhanBai.tsx', 'src/lib/btvn-nang-do-thay.ts']

  it('hàng 2 + 3: "chặng" thay "lô", "Bài tập về nhà đã giao" thay "Đợt bài đã giao"', () => {
    const pc = chuHienRa('src/screens/PhanCongScreen.tsx')
    expect(pc).toContain('Chia chặng theo hạn nộp')
    expect(pc).toContain('Bài tập về nhà đã giao')
    expect(pc).not.toMatch(/Chia lô theo hạn nộp|Đợt bài đã giao/)
    const lo = chuHienRa('src/components/KhoiBtvnLo.tsx')
    expect(lo).toContain('Chặng {b.loHienTai} trong {b.tongLo} chặng')
    expect(lo).not.toMatch(/\blô \{|Lô \$\{/)
  })

  it('hàng 5 + 7: "câu cốt lõi" / "câu dành riêng cho em" — không còn "lõi"/"riêng" trơn ở chữ hiện ra; cột "CÂU CỐT LÕI / DÀNH RIÊNG"; tên màn "Xem trước phân bổ" GIỮ', () => {
    for (const f of TEP) {
      const c = chuHienRa(f)
      expect(c, f).not.toMatch(/(?<!cốt )[Ll]õi chung|LÕI \/ RIÊNG|\{[^}]*\} lõi ·|Lõi: \{|câu lõi trong|thêm vào lõi|phần riêng|bộ riêng|lõi \{t\.soLoi|phần lõi\./)
    }
    const xt = chuHienRa('src/components/XemTruocPhanBo.tsx')
    expect(xt).toContain('CÂU CỐT LÕI / DÀNH RIÊNG')
    expect(xt).toContain('Xem trước phân bổ') // tên màn: Boss giữ
    expect(chuHienRa('src/components/HocSinhNhanBai.tsx')).toContain('Câu cốt lõi: {e.soDungLoi}/{e.soCauLoi}')
  })

  it('hàng 6: nhãn câu theo chuẩn — "Câu cốt lõi" · "Câu dành riêng cho em" · "Câu thử thách (sai không sao)"', () => {
    expect(nhanCuaCau('loi').chu).toBe('Câu cốt lõi')
    expect(nhanCuaCau('dang_yeu').chu).toBe('Câu dành riêng cho em')
    expect(nhanCuaCau('cung_co').chu).toBe('Câu dành riêng cho em')
    expect(nhanCuaCau('thu_thach').chu).toBe('Câu thử thách (sai không sao)')
    expect(nhanCuaCau('khoi_dong').chu).toBe('Khởi động')
  })

  it('hàng 11: không bao giờ hiện mã dạng / mã câu nội bộ — chưa biết dạng ⇒ "chưa gắn dạng"; có mã mà chưa có tên ⇒ "dạng chưa đặt tên"; câu mất ⇒ lời thường', () => {
    const c = { chuyenDe: 'Este – khái niệm', dang: 'ESTE.KHAI_NIEM', mucDo: 0 as const, phan: 'I' }
    expect(moTaCauChoThay(14, c)).toBe('Câu 14 · Este – khái niệm · Biết · phần I')
    expect(moTaCauChoThay(3, { ...c, chuyenDe: '  ' })).toBe('Câu 3 · dạng chưa đặt tên · Biết · phần I')
    expect(moTaCauChoThay(3, { ...c, chuyenDe: '', dang: null })).toBe('Câu 3 · chưa gắn dạng · Biết · phần I')
    for (const s of [moTaCauChoThay(3, { ...c, chuyenDe: '' }), TEN_CAU_MAT]) expect(s).not.toMatch(/ESTE\.|[A-Z]{2,}[-.][A-Z]/)
    expect(TEN_CAU_MAT).toBe('Câu không còn trong bài')
    // nơi dựng chip ghim / dòng câu không còn rơi về mã qid
    expect(doc('src/components/KhoiCaNhanHoa.tsx')).not.toMatch(/: qid\}|: qid\)/)
    expect(doc('src/components/XemTruocPhanBo.tsx')).not.toMatch(/: qid\b/)
  })

  it('hàng 12: hộp xác nhận Giao bài — nút theo VIỆC ("Cho làm lại" / "Thu hồi bài") + "Giữ nguyên"; không còn "Hủy"/"Xác nhận" trơn', () => {
    const pc = chuHienRa('src/screens/PhanCongScreen.tsx')
    expect(pc).toContain('Giữ nguyên</button>')
    expect(pc).toContain('{xacNhan.nut}</button>')
    expect(pc).toContain("nut: 'Thu hồi bài'")
    expect(pc).toContain("nut: 'Cho làm lại'")
    expect(pc).not.toMatch(/>Hủy<\/button>|>Xác nhận<\/button>/)
  })
})

// TRỢ LÝ TRONG APP — TẦNG LẤY DỮ LIỆU (TRO-LY-TRONG-APP.md, luồng bước 3).
//
// Tầng DUY NHẤT được đụng mạng. Hai tầng kia (hiểu câu hỏi, dựng câu trả lời)
// thuần nên kiểm bằng test được; chỗ nào sai là biết ngay sai ở đâu.
//
// KHÔNG THÊM MỘT LỆNH MÁY CHỦ NÀO — chỉ gọi lại các lệnh đọc đã có. Trợ lý là
// lối vào thứ hai tới cùng dữ liệu, không phải một đường dữ liệu mới.
import { chiTietCa, danhSachCa, danhSachCauHoi, danhSachEm, hoSoEm, listParentMessages } from '../exam-api'
import { loadExamSources } from '../exam-db'
import { timEm, type DuLieu } from './tra-loi'
import type { YDinh } from './y-dinh'

/** Nhớ dữ liệu bao lâu. Thầy hỏi liền mấy câu về cùng một ca thì không gọi lại
 * máy chủ — đúng tinh thần giảm tải đã làm. */
export const NHO_MS = 90_000

interface ONho<T> {
  luc: number
  gia: T
}

const nho = new Map<string, ONho<unknown>>()

async function lay<T>(khoa: string, tim: () => Promise<T>): Promise<T> {
  const cu = nho.get(khoa)
  if (cu && Date.now() - cu.luc < NHO_MS) return cu.gia as T
  const gia = await tim()
  nho.set(khoa, { luc: Date.now(), gia })
  return gia
}

/** Xoá bộ nhớ tạm — màn gọi khi thầy bấm "Hỏi lại cho mới". */
export function quenHet(): void {
  nho.clear()
}

export interface KetQuaLay {
  duLieu: DuLieu
  /** Câu hỏi ngược lại thầy khi dữ liệu chưa đủ để trả lời chắc chắn. */
  hoiLai?: string
}

/** Lấy ĐÚNG những gì ý định cần. Tối đa 2 lệnh máy chủ một câu hỏi. */
export async function layDuLieu(y: YDinh, url: string, mat: string): Promise<KetQuaLay> {
  const u = url.trim()
  const m = mat.trim()
  const d: DuLieu = {}

  switch (y.loai) {
    case 'huong_dan':
    case 'khong_hieu':
      return { duLieu: d }

    case 'ca_dang_mo':
    case 'ca_gan_day':
      d.ca = await lay('ca', () => danhSachCa(u, m))
      return { duLieu: d }

    case 'ca_chua_nop':
    case 'ca_diem': {
      const ds = await lay('ca', () => danhSachCa(u, m))
      d.ca = ds
      const song = ds.filter((c) => c.trangThai !== 'da_xoa')
      // Không nói mã ca thì lấy ca MỚI NHẤT — thầy vừa coi ca nào thì hỏi ca đó.
      const chon = y.maCa ? song.find((c) => c.maCa === y.maCa) : song[0]
      if (!chon) {
        return { duLieu: d, hoiLai: y.maCa ? `Không thấy ca có mã ${y.maCa}. Thầy kiểm lại mã giúp.` : 'Chưa mở ca nào.' }
      }
      d.caDangXem = chon
      const ct = await lay(`ct:${chon.maCa}`, () => chiTietCa(u, m, chon.maCa))
      d.luot = ct.luot
      return { duLieu: d }
    }

    case 'em_diem_thap':
      d.em = await lay('em', () => danhSachEm(u, m))
      return { duLieu: d }

    case 'em_ho_so': {
      const ds = await lay('em', () => danhSachEm(u, m))
      d.em = ds
      const khop = timEm(ds, y.em || '')
      if (khop.length === 0) return { duLieu: d, hoiLai: `Không thấy em nào tên hay số báo danh giống "${y.em}".` }
      if (khop.length > 1) {
        return { duLieu: d, hoiLai: `Có ${khop.length} em khớp: ${khop.slice(0, 5).map((e) => `${e.hoTen} (SBD ${e.sbd})`).join(' · ')}. Thầy hỏi lại bằng số báo danh giúp.` }
      }
      d.hoSo = await lay(`hs:${khop[0].sbd}`, () => hoSoEm(u, { secret: m, sbd: khop[0].sbd }))
      return { duLieu: d }
    }

    case 'kho_tong_quan':
    case 'kho_theo_chuyen_de':
    case 'kho_nghi_dap_an':
      // Ngân hàng nằm ngay trong máy thầy — không gọi mạng một lệnh nào.
      d.kho = await lay('kho', () => loadExamSources())
      return { duLieu: d }

    case 'hoi_bai':
      d.cauHoi = await lay('cauhoi', () => danhSachCauHoi(u, m, ''))
      return { duLieu: d }

    case 'tin_nhan':
      d.tinNhan = await lay('tin', () => listParentMessages(u, m))
      return { duLieu: d }
  }
}

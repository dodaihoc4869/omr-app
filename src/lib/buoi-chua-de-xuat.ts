// BUỔI CHỮA XẾP SẴN — LÕI THUẦN (B6 của `DE-XUAT-TU-DONG-HOA-2109.md`; Code 1, 21/09/2026; đề xuất `docs/de-xuat-buoi-chua-xep-san-2109.md`, Boss duyệt).
//
// Mỗi chiều màn Gọi lên bảng có sẵn "Buổi chữa tối nay": máy chọn CÂU (dạng cả lớp đang yếu + câu cốt lõi nhiều em sai) và EM cần chú ý (gợi ý của Bộ não A.I + em sai các câu ấy),
// ước số phút; thầy chỉ bấm Mở (hoặc tự chọn như cũ). Máy chỉ CHUẨN BỊ — không tự gửi gì ra ngoài.
//
// THUẦN: không IO, không đồng hồ, không `Math.random`. Số liệu THẬT do máy chủ gom (`/gv/buoi-chua-de-xuat`, hợp đồng `docs/hop-dong-buoi-chua-de-xuat-2109.md`); kho câu nằm trên máy thầy nên
// việc ghép câu ↔ kho làm ở đây. Câu TỰ LUẬN bị lọc bằng ĐÚNG định nghĩa chung `cau-tu-luan.ts` (Boss 21/09: đề xuất tự động có lọc; thầy vẫn thêm tay được ở luồng cũ).
// Không nhãn năng lực, không xếp hạng em; lý do luôn là SỐ THẬT ("9/24 em"), không bịa.
import { laCauRutDuoc } from './cau-tu-luan'
import { CAU_HINH_LEN_BANG_MAC_DINH, haoPhiGiay, type CauHinhLenBang } from './len-bang-cau-hinh'
import { giayBienGhepDoi, noiDungTuCauGoc, thoiGianCau } from './thoi-gian-len-bang'

export const DE_XUAT_BUOI_CHUA = {
  /** Ít hơn bấy nhiêu em có sổ trong 3 ngày ⇒ không đủ dữ liệu, ẩn thẻ (không bịa). */
  SO_EM_TOI_THIEU_CO_SO: 5,
  /** Câu "nhiều em sai": ≥ 3 em sai VÀ ≥ 30 % số em làm câu ấy. */
  CAU_SAI_TOI_THIEU_EM: 3,
  CAU_SAI_TOI_THIEU_TI_LE: 0.3,
  /** Dạng cả lớp yếu: ≥ 3 em; lấy tối đa 3 dạng. */
  DANG_TOI_THIEU_EM_YEU: 3,
  SO_DANG_TOI_DA: 3,
  SO_CAU_MOI_DANG_TOI_DA: 2,
  SO_CAU_TOI_DA: 10,
  SO_EM_TOI_DA: 20,
  /** Điểm xếp câu: câu lõi +2, câu thuộc dạng cả lớp yếu +2, cộng tỉ lệ sai và tỉ lệ em sai / cả lớp. */
  DIEM_LOI: 2,
  DIEM_DANG_YEU: 2,
} as const

// ══════════════════════════════ KIỂU ══════════════════════════════

export type PhanCau = 'I' | 'II' | 'III'

/** Hành động của dòng bản tin Bộ não được xem là "gợi ý gọi lên bảng". */
export const HANH_DONG_GOI_LEN_BANG = ['goi_len_bang', 'dua_vao_buoi_chua'] as const

export interface DangYeuLop {
  ma: string
  ten: string
  /** Số em đang yếu ở dạng này. */
  soEmYeu: number
  /** Nơi thấy dạng này yếu: hồ sơ nắm kiến thức (`ho_so`) và/hoặc Bộ não A.I (`bo_nao`). Thấy ở CẢ hai nơi ⇒ xếp trước. */
  nguon: ('ho_so' | 'bo_nao')[]
}

export interface CauSaiNhieu {
  qid: string
  dang: string
  /** Câu cốt lõi của bài tập về nhà (`btvn_cau.loi = 1`). */
  loi: boolean
  soEmLam: number
  soEmSai: number
  emSai: { sbd: string; hoTen: string }[]
}

export interface GoiYBoNao {
  sbd: string
  hoTen: string
  hanhDong: string
  dang: string
}

/** ĐẦU VÀO = đúng phần thân trả về của `/gv/buoi-chua-de-xuat` (đã qua `docDauVao`). */
export interface DauVaoDeXuat {
  ngay: string
  lop: string
  /** Số em có làm câu nào trong 3 ngày qua (mẫu số của "9/24 em"). */
  soEmCoSo: number
  dangYeu: DangYeuLop[]
  cauSaiNhieu: CauSaiNhieu[]
  goiY: GoiYBoNao[]
}

/** MỘT câu trong kho trên máy thầy (đã ghép qid quy ước máy chủ `<mã tờ gốc>-<phần>-<số>`). `q` là câu GỐC (để lọc tự luận + ước giờ). */
export interface CauKho {
  qid: string
  phan: PhanCau
  dang: string | null
  sao: 0 | 1 | 2
  q: unknown
}

export interface CauDeXuat {
  qid: string
  dang: string
  phan: PhanCau
  /** `sai_nhieu`: từ số liệu máy chủ · `dang_yeu`: câu bổ sung của một dạng cả lớp yếu mà chưa có câu nào nhiều em sai. */
  nguon: 'sai_nhieu' | 'dang_yeu'
  loi: boolean
  soEmLam: number
  soEmSai: number
  /** Giây một câu tốn trong buổi (`giayBienGhepDoi` của `thoiGianCau`). */
  giay: number
  lyDo: string
}

export interface EmDeXuat {
  sbd: string
  hoTen: string
  lyDo: string
}

export interface DeXuatBuoiChua {
  /** Có đủ để hiện thẻ. `false` ⇒ ẩn (không báo lỗi đỏ). */
  co: boolean
  lyDoAn: '' | 'it_du_lieu' | 'khong_co_gi'
  cau: CauDeXuat[]
  em: EmDeXuat[]
  soCau: number
  soEm: number
  /** Ước số phút cả buổi (câu + hao phí mở/chốt), làm tròn LÊN. */
  phut: number
  /** ≤ 3 dòng "vì sao" bằng số thật, đã dùng từ chuẩn ("Dạng em đang yếu", "Câu cốt lõi", "Bộ não A.I"). */
  cacLyDo: string[]
  /** Câu đã bỏ và vì sao — để thẻ nói thật ("2 câu chưa có trên máy này"). */
  boQua: { khongCoTrongKho: number; tuLuan: number }
}

// ══════════════════════════════ ĐỌC ĐẦU VÀO (không tin dữ liệu từ ngoài) ══════════════════════════════

const laDoiTuong = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)
const chuoi = (x: unknown): string => (typeof x === 'string' ? x : '')
const soKhongAm = (x: unknown): number => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? Math.floor(x) : 0)

/**
 * Đọc thân trả về của `/gv/buoi-chua-de-xuat`. Thiếu `ok: true` hoặc không đúng dạng ⇒ `null` (màn ẨN thẻ, không báo lỗi đỏ). Phần tử hỏng bị bỏ, không sửa hộ;
 * số âm/không phải số ⇒ 0. `soEmSai > soEmLam` (vô lý) ⇒ bỏ câu ấy.
 */
export function docDauVao(j: unknown): DauVaoDeXuat | null {
  if (!laDoiTuong(j) || j.ok !== true) return null
  const mang = (x: unknown): unknown[] => (Array.isArray(x) ? x : [])
  const dangYeu: DangYeuLop[] = []
  for (const x of mang(j.dangYeu)) {
    if (!laDoiTuong(x) || !chuoi(x.ma)) continue
    const nguon = mang(x.nguon).filter((n): n is 'ho_so' | 'bo_nao' => n === 'ho_so' || n === 'bo_nao')
    dangYeu.push({ ma: chuoi(x.ma), ten: chuoi(x.ten) || chuoi(x.ma), soEmYeu: soKhongAm(x.soEmYeu), nguon: [...new Set(nguon)] })
  }
  const cauSaiNhieu: CauSaiNhieu[] = []
  for (const x of mang(j.cauSaiNhieu)) {
    if (!laDoiTuong(x) || !chuoi(x.qid)) continue
    const soEmLam = soKhongAm(x.soEmLam)
    const soEmSai = soKhongAm(x.soEmSai)
    if (soEmSai > soEmLam) continue
    const emSai = mang(x.emSai)
      .filter(laDoiTuong)
      .map((e) => ({ sbd: chuoi(e.sbd), hoTen: chuoi(e.hoTen) }))
      .filter((e) => e.sbd)
    cauSaiNhieu.push({ qid: chuoi(x.qid), dang: chuoi(x.dang), loi: x.loi === true, soEmLam, soEmSai, emSai })
  }
  const goiY: GoiYBoNao[] = []
  for (const x of mang(j.goiY)) {
    if (!laDoiTuong(x) || !chuoi(x.sbd)) continue
    goiY.push({ sbd: chuoi(x.sbd), hoTen: chuoi(x.hoTen), hanhDong: chuoi(x.hanhDong), dang: chuoi(x.dang) })
  }
  return { ngay: chuoi(j.ngay), lop: chuoi(j.lop), soEmCoSo: soKhongAm(j.soEmCoSo), dangYeu, cauSaiNhieu, goiY }
}

// ══════════════════════════════ HÀM CHÍNH ══════════════════════════════

const AN = (lyDoAn: 'it_du_lieu' | 'khong_co_gi', boQua = { khongCoTrongKho: 0, tuLuan: 0 }): DeXuatBuoiChua => ({ co: false, lyDoAn, cau: [], em: [], soCau: 0, soEm: 0, phut: 0, cacLyDo: [], boQua })
const D = DE_XUAT_BUOI_CHUA

/**
 * ĐỀ XUẤT BUỔI CHỮA. Tất định: cùng đầu vào ⇒ cùng kết quả (mọi phá hoà theo mã).
 *   1. `soEmCoSo` < 5 ⇒ ẨN (`it_du_lieu`).
 *   2. Dạng cả lớp yếu: ≥ 3 em; thấy ở CẢ hai nguồn trước, rồi nhiều em yếu hơn; tối đa 3 dạng.
 *   3. Câu: từ `cauSaiNhieu` (≥ 3 em sai và ≥ 30 % số em làm) ghép với kho (thiếu trong kho ⇒ bỏ + đếm; TỰ LUẬN ⇒ bỏ + đếm); điểm = lõi + dạng yếu + tỉ lệ sai; mỗi dạng ≤ 2 câu, tổng ≤ 10.
 *      Dạng yếu chưa có câu nào ⇒ thêm MỘT câu của dạng ấy lấy từ kho (sao cao trước).
 *   4. Vừa ngân sách giờ (`NGAN_SACH_PHUT`, hao phí mở/chốt tính riêng): quá thì bỏ câu điểm thấp nhất, giữ tối thiểu một câu.
 *   5. Em: gợi ý Bộ não A.I (gọi lên bảng / đưa vào buổi chữa) trước, rồi em sai các câu đã chọn (sai nhiều câu trước); tối đa 20; mỗi em một lần.
 */
export function deXuatBuoiChua(dv: DauVaoDeXuat, kho: readonly CauKho[], ch: CauHinhLenBang = CAU_HINH_LEN_BANG_MAC_DINH): DeXuatBuoiChua {
  if (dv.soEmCoSo < D.SO_EM_TOI_THIEU_CO_SO) return AN('it_du_lieu')
  const theoQid = new Map<string, CauKho>()
  for (const c of kho) if (!theoQid.has(c.qid)) theoQid.set(c.qid, c)

  // 2 — dạng cả lớp yếu
  const dangTop = dv.dangYeu
    .filter((d) => d.soEmYeu >= D.DANG_TOI_THIEU_EM_YEU)
    .sort((a, b) => b.nguon.length - a.nguon.length || b.soEmYeu - a.soEmYeu || (a.ma < b.ma ? -1 : a.ma > b.ma ? 1 : 0))
    .slice(0, D.SO_DANG_TOI_DA)
  const laDangYeu = new Set(dangTop.map((d) => d.ma))

  // 3 — câu nhiều em sai ghép với kho
  const boQua = { khongCoTrongKho: 0, tuLuan: 0 }
  const ung: (CauDeXuat & { diem: number })[] = []
  const daXet = new Set<string>()
  for (const c of dv.cauSaiNhieu) {
    if (daXet.has(c.qid)) continue
    daXet.add(c.qid)
    if (c.soEmLam <= 0 || c.soEmSai < D.CAU_SAI_TOI_THIEU_EM || c.soEmSai / c.soEmLam < D.CAU_SAI_TOI_THIEU_TI_LE) continue
    const k = theoQid.get(c.qid)
    if (!k) {
      boQua.khongCoTrongKho++
      continue
    }
    if (!laCauRutDuoc(k.q, k.phan)) {
      boQua.tuLuan++
      continue
    }
    const dang = c.dang || k.dang || ''
    const tiLe = c.soEmSai / c.soEmLam
    const diem = (c.loi ? D.DIEM_LOI : 0) + (laDangYeu.has(dang) ? D.DIEM_DANG_YEU : 0) + tiLe + c.soEmSai / dv.soEmCoSo
    ung.push({ qid: c.qid, dang, phan: k.phan, nguon: 'sai_nhieu', loi: c.loi, soEmLam: c.soEmLam, soEmSai: c.soEmSai, giay: giayCau(k, tiLe, ch), lyDo: `${c.soEmSai}/${c.soEmLam} em làm sai${c.loi ? ' · câu cốt lõi' : ''}`, diem })
  }
  ung.sort((a, b) => b.diem - a.diem || b.soEmSai - a.soEmSai || (a.qid < b.qid ? -1 : a.qid > b.qid ? 1 : 0))
  const chon: (CauDeXuat & { diem: number })[] = []
  const moiDang = new Map<string, number>()
  for (const c of ung) {
    if (chon.length >= D.SO_CAU_TOI_DA) break
    if ((moiDang.get(c.dang) ?? 0) >= D.SO_CAU_MOI_DANG_TOI_DA) continue
    moiDang.set(c.dang, (moiDang.get(c.dang) ?? 0) + 1)
    chon.push(c)
  }
  // dạng yếu chưa có câu nào: bổ sung MỘT câu của dạng ấy từ kho (không tự luận; sao cao trước, rồi theo mã)
  for (const d of dangTop) {
    if (chon.length >= D.SO_CAU_TOI_DA) break
    if ((moiDang.get(d.ma) ?? 0) > 0) continue
    const k = kho
      .filter((c) => c.dang === d.ma && laCauRutDuoc(c.q, c.phan) && !chon.some((x) => x.qid === c.qid))
      .sort((a, b) => b.sao - a.sao || (a.qid < b.qid ? -1 : a.qid > b.qid ? 1 : 0))[0]
    if (!k) continue
    moiDang.set(d.ma, 1)
    chon.push({ qid: k.qid, dang: d.ma, phan: k.phan, nguon: 'dang_yeu', loi: false, soEmLam: 0, soEmSai: 0, giay: giayCau(k, 0, ch), lyDo: `Câu của dạng em đang yếu (${d.soEmYeu} em)`, diem: 0 })
  }

  // 4 — vừa ngân sách giờ
  const hao = haoPhiGiay(ch)
  const tongGiay = () => chon.reduce((n, c) => n + c.giay, 0) + hao
  const tran = ch.NGAN_SACH_PHUT * 60 // buổi = Σ giây câu + hao phí mở/chốt ≤ ngân sách
  while (chon.length > 1 && tongGiay() > tran) {
    let thap = 0
    for (let i = 1; i < chon.length; i++) if (chon[i].diem <= chon[thap].diem) thap = i // điểm thấp nhất; hoà ⇒ câu đứng SAU (xếp sau) bị bỏ trước
    chon.splice(thap, 1)
  }
  if (chon.length === 0) return AN('khong_co_gi', boQua)

  // 5 — em cần chú ý
  const em: EmDeXuat[] = []
  const daCo = new Set<string>()
  const them = (sbd: string, hoTen: string, lyDo: string) => {
    if (em.length >= D.SO_EM_TOI_DA || !sbd || daCo.has(sbd)) return
    daCo.add(sbd)
    em.push({ sbd, hoTen, lyDo })
  }
  for (const g of dv.goiY) if ((HANH_DONG_GOI_LEN_BANG as readonly string[]).includes(g.hanhDong)) them(g.sbd, g.hoTen, 'Bộ não A.I gợi ý')
  const dem = new Map<string, { hoTen: string; n: number }>()
  for (const c of chon) {
    const goc = dv.cauSaiNhieu.find((x) => x.qid === c.qid)
    for (const e of goc?.emSai ?? []) dem.set(e.sbd, { hoTen: dem.get(e.sbd)?.hoTen || e.hoTen, n: (dem.get(e.sbd)?.n ?? 0) + 1 })
  }
  for (const [sbd, v] of [...dem.entries()].sort((a, b) => b[1].n - a[1].n || (a[0] < b[0] ? -1 : 1))) them(sbd, v.hoTen, `Sai ${v.n} câu trong buổi`)

  // lý do hiển thị
  const cacLyDo: string[] = []
  for (const d of dangTop.filter((x) => chon.some((c) => c.dang === x.ma)).slice(0, 2)) cacLyDo.push(`Dạng em đang yếu: ${d.ten} — ${d.soEmYeu}/${dv.soEmCoSo} em`)
  const soLoi = chon.filter((c) => c.loi).length
  if (soLoi > 0) cacLyDo.push(`Câu cốt lõi nhiều em sai: ${soLoi} câu`)
  const nBoNao = em.filter((e) => e.lyDo === 'Bộ não A.I gợi ý').length
  if (nBoNao > 0) cacLyDo.push(`Bộ não A.I gợi ý gọi lên bảng: ${nBoNao} em`)

  return {
    co: true,
    lyDoAn: '',
    cau: chon.map(({ diem: _d, ...c }) => (void _d, c)),
    em,
    soCau: chon.length,
    soEm: em.length,
    phut: Math.ceil(tongGiay() / 60),
    cacLyDo: cacLyDo.slice(0, 3),
    boQua,
  }
}

/** Giây một câu trong buổi: `thoiGianCau` (có nội dung câu gốc thì tính theo chữ/hình/số bước, không thì mặc định theo sao) rồi `giayBienGhepDoi` (hai em song song). */
function giayCau(k: CauKho, tiLeLopSai: number, ch: CauHinhLenBang): number {
  return giayBienGhepDoi(thoiGianCau({ phan: k.phan, sao: k.sao, noiDung: noiDungTuCauGoc(k.phan, k.q), tiLeLopSai }, ch))
}

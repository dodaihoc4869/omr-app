// GIAO THÊM BÀI CHO CON — hàm THUẦN cho nút "Giao thêm bài cho con" của app phụ huynh (thầy lệnh 21/09/2026; đề bài `prompt-ph-giao-them-bai-2109.md`, Code 1). Hợp đồng vào/ra: `docs/hop-dong-ph-giao-them-2109.md`.
// Phụ huynh chỉ bấm MỘT nút; hàm này quyết định giao nhiều hay ít, hay TỪ CHỐI (nâng đỡ, không dồn ép). Hàm chỉ ra CƠ CẤU (loại + dạng + số câu): MÁY CHỦ chọn qid cụ thể (không tự luận, không câu trong bài tập về nhà chưa nộp,
// không câu con làm trong 14 ngày trừ câu đến lịch ôn, không vượt bậc + 1) và ĐẾM các con số "khả dụng" đưa vào đây — hàm không bao giờ đòi nhiều hơn số câu khả dụng.
// Không đồng hồ, không ngẫu nhiên, không đọc D1 ⇒ cùng đầu vào cho cùng kết quả (test khoá). Chữ trong `lyDo` dành cho PHỤ HUYNH: có số thật, KHÔNG nhắc thần thú / EXP / khiên / game.
import { phutUocTinhChang } from './btvn-nang-do-lich'

export const GIAO_THEM = {
  /** Trần số lượt giao THÀNH CÔNG mỗi ngày (máy chủ đếm; lượt bị từ chối không tính). */
  SO_LUOT_TOI_DA: 3,
  /** Tổng số câu giao thêm trong một ngày ≤ chừng này. */
  TONG_CAU_TOI_DA_NGAY: 16,
  /** Lượt 1: phần còn thiếu so với mục tiêu ngày, kẹp trong khoảng này; con ĐÃ vượt mục tiêu ⇒ gói nhẹ trong khoảng `VUOT_MUC_TIEU_*`. */
  LUOT_1_TOI_THIEU: 4,
  LUOT_1_TOI_DA: 10,
  VUOT_MUC_TIEU_TOI_THIEU: 4,
  VUOT_MUC_TIEU_TOI_DA: 6,
  /** Lượt 2, 3 nhỏ dần. */
  LUOT_2_TOI_DA: 6,
  LUOT_3_TOI_DA: 4,
  /** Sau giờ này (phút kể từ 00:00 giờ VN; 21:30) gói ≤ `SAU_GIO_TOI_DA` câu để con nghỉ sớm. */
  SAU_GIO_PHUT: 21 * 60 + 30,
  SAU_GIO_TOI_DA: 4,
  /** Sau giờ này (22:30 giờ VN, tới từng mili-giây) TỪ CHỐI HẲN — "để con nghỉ" (Boss chốt 21/09). Đúng 22:30:00 còn giao; 22:30:01 từ chối. */
  KHOA_SAU_PHUT: 22 * 60 + 30,
  /** Gói nhỏ hơn chừng này không đáng giao (hết trần ngày hoặc hết câu phù hợp ⇒ từ chối). */
  TOI_THIEU_MOI_GOI: 3,
  /** Câu "thử sức" (bậc + 1) CHỈ khi hôm nay con đúng ≥ tỉ lệ này trong ≥ chừng này câu; tối đa MỘT câu. */
  THU_SUC_TI_LE: 0.8,
  THU_SUC_MAU_TOI_THIEU: 5,
  /** Dạng con vấp nặng (tỉ lệ khắc phục dưới ngưỡng ⇒ sai quá nửa) gợi ý bậc THẤP hơn một bậc. */
  VAP_NANG_DUOI: 0.5,
} as const

export type LoaiThanhPhan = 'on_lai' | 'dang_vap' | 'cau_sai' | 'thu_suc'
export type BacGoiY = 'dung_bac' | 'thap_hon_mot_bac' | 'cao_hon_mot_bac'
export type MaTuChoi = 'het_luot' | 'qua_muon' | 'con_viec_bat_buoc' | 'goi_truoc_chua_xong' | 'het_tran_ngay' | 'khong_co_cau'

/** MỘT DẠNG của con. `soKhaDung*` = số câu MÁY CHỦ đã đếm là dùng được (đã loại tự luận, câu trong bài tập về nhà chưa nộp, câu làm trong 14 ngày, câu vượt bậc + 1). */
export interface DangCuaCon {
  ma: string
  /** Tên dạng để hiện cho phụ huynh ("Thuỷ phân ester"); vắng ⇒ dùng mã. */
  ten?: string
  /** Bậc hồ sơ 0 Biết · 1 Hiểu · 2 Vận dụng. */
  bac: 0 | 1 | 2
  /** Con ĐANG VẤP dạng này (yếu, hoặc vừa sai gần đây) — máy chủ quyết. */
  vap: boolean
  /** Dạng YẾU (đủ tin + tỉ lệ khắc phục < 0,7): không bao giờ được "thử sức". */
  yeu: boolean
  tiLeKhacPhuc: number | null
  /** Số câu sai 7 ngày — chỉ để xếp thứ tự ưu tiên giữa các dạng vấp. */
  soSai7?: number
  soKhaDungDungBac: number
  soKhaDungThapHon: number
  soKhaDungCaoHon: number
}

export interface HoSoCon {
  dang: DangCuaCon[]
  /** Số câu ĐẾN LỊCH ôn lại (1·3·7) NGOÀI phần bắt buộc còn lại ở `batBuocConLai`, còn khả dụng. */
  soCauDenLichOn: number
  /** Số câu con từng sai chưa khắc phục còn khả dụng (chưa tính vào hai nhóm trên). */
  soCauSaiChuaKhacPhuc: number
}

/** Việc BẮT BUỘC hôm nay còn lại (chặng bài tập về nhà, phần ôn lại bắt buộc…). `ten`/`han` là chữ đã viết sẵn cho phụ huynh ("chặng 2 bài tập về nhà", "12:00 trưa mai"). */
export interface ViecBatBuoc {
  loai: 'chang_btvn' | 'on_lai' | 'khac'
  soCau: number
  ten?: string
  han?: string
}

export interface NganSachNgayCon {
  /** Mục tiêu câu/ngày của con (máy chủ tính từ tốc độ thật). */
  mucTieuCau: number
  /** Đã làm / đã đúng HÔM NAY (mọi nguồn). */
  daLam: number
  dung: number
  batBuocConLai: ViecBatBuoc[]
}

/** Gói giao thêm gần nhất trong ngày (nếu có). `lucGiaoMs` = thời điểm giao (ms, UTC). */
export interface GoiTruoc {
  soCau: number
  soDaLam: number
  lucGiaoMs: number
}

export interface DauVaoGiaoThem {
  hoSo: HoSoCon
  nganSach: NganSachNgayCon
  /** Bây giờ (ms, UTC) — hàm đổi sang giờ Việt Nam bằng SỐ HỌC. */
  bayGioMs: number
  /** Lượt SẮP giao trong ngày = số lượt thành công đã có + 1 (1…3; > 3 ⇒ hết lượt). */
  luot: number
  /** Tổng số câu ĐÃ giao thêm trong ngày (các lượt thành công trước). */
  tongDaGiaoHomNay: number
  goiTruoc?: GoiTruoc | null
  /** Giây/câu thật của con (vắng / vô lý ⇒ mặc định 90). */
  giayMoiCau?: number
}

export interface ThanhPhanGiaoThem {
  loai: LoaiThanhPhan
  /** Có ở `dang_vap` và `thu_suc`. */
  dang?: string
  /** GỢI Ý bậc để máy chủ ưu tiên khi chọn qid (`thu_suc` luôn `cao_hon_mot_bac`; `dang_vap` `thap_hon_mot_bac` khi con vấp nặng). */
  bac?: BacGoiY
  soCau: number
}

export interface KetQuaGiaoThem {
  soCau: number
  thanhPhan: ThanhPhanGiaoThem[]
  phutUocTinh: number
  /** Câu tiếng thường cho phụ huynh, có số thật. Bị từ chối ⇒ rỗng (lý do nằm ở `tuChoi`). */
  lyDo: string[]
  /** Từ chối: `soCau = 0`, `thanhPhan = []`. Lượt bị từ chối KHÔNG tính vào 3 lượt. */
  tuChoi?: { ma: MaTuChoi; lyDo: string[] }
}

// ══════════════════════════════ TIỆN ÍCH ══════════════════════════════

const MS_PHUT = 60_000
const MS_NGAY = 86_400_000
const LECH_VN = 7 * 3_600_000

const soNguyen = (x: unknown): number => (typeof x === 'number' && Number.isFinite(x) ? Math.max(0, Math.floor(x)) : 0)
/** Phút kể từ 00:00 giờ Việt Nam (số học, không Intl). */
const phutTrongNgayVn = (ms: number): number => Math.floor(((((ms + LECH_VN) % MS_NGAY) + MS_NGAY) % MS_NGAY) / MS_PHUT)
/** ĐÃ QUA 21:30 giờ Việt Nam (so tới từng mili-giây: 21:30:01 đã là "sau 21:30"). */
const daQuaGioNghi = (ms: number): boolean => ((((ms + LECH_VN) % MS_NGAY) + MS_NGAY) % MS_NGAY) > GIAO_THEM.SAU_GIO_PHUT * MS_PHUT
/** ĐÃ QUA 22:30 giờ Việt Nam ⇒ không giao nữa (so tới từng mili-giây). */
const daQuaGioKhoa = (ms: number): boolean => ((((ms + LECH_VN) % MS_NGAY) + MS_NGAY) % MS_NGAY) > GIAO_THEM.KHOA_SAU_PHUT * MS_PHUT
const gioPhut = (ms: number): string => {
  const p = phutTrongNgayVn(ms)
  return `${String(Math.floor(p / 60)).padStart(2, '0')}:${String(p % 60).padStart(2, '0')}`
}
const tenDang = (d: DangCuaCon): string => (d.ten && d.ten.trim() ? d.ten.trim() : d.ma)
const khaDung = (d: DangCuaCon): number => soNguyen(d.soKhaDungDungBac) + soNguyen(d.soKhaDungThapHon)

/** Trần số câu của MỘT lượt theo số thứ tự lượt (1 → 10, 2 → 6, 3 → 4). */
export function tranLuot(luot: number): number {
  return luot <= 1 ? GIAO_THEM.LUOT_1_TOI_DA : luot === 2 ? GIAO_THEM.LUOT_2_TOI_DA : GIAO_THEM.LUOT_3_TOI_DA
}

/** Con đúng ≥ 80 % hôm nay trong ≥ 5 câu ⇒ được một câu thử sức. */
export function duDieuKienThuSuc(daLam: number, dung: number): boolean {
  const l = soNguyen(daLam)
  const d = Math.min(soNguyen(dung), l)
  return l >= GIAO_THEM.THU_SUC_MAU_TOI_THIEU && d / l >= GIAO_THEM.THU_SUC_TI_LE
}

/** Liều "MONG MUỐN" trước khi bị cắt bởi hết câu phù hợp: theo lượt, mục tiêu ngày, giờ, trần ngày. Đơn điệu KHÔNG TĂNG theo lượt và theo giờ. */
export function lieuMongMuon(luot: number, nganSach: Pick<NganSachNgayCon, 'mucTieuCau' | 'daLam' | 'dung'>, bayGioMs: number, tongDaGiao: number): { lieu: number; vuotMucTieu: boolean; thieu: number } {
  const G = GIAO_THEM
  const muc = soNguyen(nganSach.mucTieuCau)
  const daLam = soNguyen(nganSach.daLam)
  const vuot = daLam >= muc
  const thieu = Math.max(0, muc - daLam)
  let lieu: number
  if (vuot) {
    // gói nhẹ 4–6; con đang đúng nhiều hôm nay thì nhỉnh hơn một chút, con đang vất vả thì nhẹ nhất
    const ti = daLam > 0 ? Math.min(soNguyen(nganSach.dung), daLam) / daLam : 0
    lieu = ti >= 0.8 ? G.VUOT_MUC_TIEU_TOI_DA : ti >= 0.6 ? G.VUOT_MUC_TIEU_TOI_DA - 1 : G.VUOT_MUC_TIEU_TOI_THIEU
  } else lieu = Math.min(G.LUOT_1_TOI_DA, Math.max(G.LUOT_1_TOI_THIEU, thieu))
  lieu = Math.min(lieu, tranLuot(luot))
  if (daQuaGioNghi(bayGioMs)) lieu = Math.min(lieu, G.SAU_GIO_TOI_DA)
  lieu = Math.min(lieu, Math.max(0, G.TONG_CAU_TOI_DA_NGAY - soNguyen(tongDaGiao)))
  return { lieu, vuotMucTieu: vuot, thieu }
}

// ══════════════════════════════ HÀM CHÍNH ══════════════════════════════

function tuChoi(ma: MaTuChoi, lyDo: string[]): KetQuaGiaoThem {
  return { soCau: 0, thanhPhan: [], phutUocTinh: 0, lyDo: [], tuChoi: { ma, lyDo } }
}

/**
 * Tính gói "Giao thêm bài cho con". Thứ tự TỪ CHỐI (dừng ở cái đầu tiên đúng): hết 3 lượt → quá 22:30 (không mất lượt) → còn việc BẮT BUỘC hôm nay → gói trước chưa làm xong → hết trần 16 câu/ngày (còn < 3 câu) → không có câu phù hợp (< 3 câu).
 * Nếu không từ chối: liều theo `lieuMongMuon`, rồi chia CƠ CẤU theo ưu tiên: câu đến lịch ôn → câu dạng con đang vấp (chia vòng tròn giữa các dạng, dạng yếu / sai nhiều trước) → câu từng sai chưa khắc phục;
 * cộng MỘT câu "thử sức" (bậc + 1) CHỈ khi hôm nay con đúng ≥ 80 % (≥ 5 câu) và có dạng ổn (không yếu, bậc < Vận dụng) còn câu bậc + 1. Không bao giờ đòi nhiều hơn số câu khả dụng.
 */
export function tinhGiaoThem(vao: DauVaoGiaoThem): KetQuaGiaoThem {
  const G = GIAO_THEM
  const luot = soNguyen(vao.luot)
  const tong = soNguyen(vao.tongDaGiaoHomNay)
  const { hoSo, nganSach } = vao

  // 1 · hết lượt
  if (luot > G.SO_LUOT_TOI_DA) return tuChoi('het_luot', [`Hôm nay đã giao đủ ${G.SO_LUOT_TOI_DA} lượt, mai giao tiếp được.`])

  // 2 · quá muộn (sau 22:30): để con nghỉ, không mất lượt
  if (daQuaGioKhoa(vao.bayGioMs)) return tuChoi('qua_muon', ['Đã muộn rồi, để con nghỉ. Mai anh/chị giao tiếp được.'])

  // 3 · còn việc BẮT BUỘC hôm nay
  const batBuoc = (nganSach.batBuocConLai ?? []).filter((v) => soNguyen(v.soCau) > 0)
  if (batBuoc.length > 0) {
    const tongBb = batBuoc.reduce((s, v) => s + soNguyen(v.soCau), 0)
    const mo = (v: ViecBatBuoc) => `${v.ten && v.ten.trim() ? v.ten.trim() : v.loai === 'chang_btvn' ? 'chặng bài tập về nhà' : 'phần ôn lại'}, ${soNguyen(v.soCau)} câu${v.han ? `, hạn ${v.han}` : ''}`
    const chu = batBuoc.length === 1 ? `Hôm nay con còn ${mo(batBuoc[0])}` : `Hôm nay con còn ${batBuoc.length} việc bắt buộc (${tongBb} câu): ${batBuoc.slice(0, 2).map(mo).join('; ')}${batBuoc.length > 2 ? '…' : ''}`
    return tuChoi('con_viec_bat_buoc', [`${chu} — con nên làm phần này trước.`])
  }

  // 4 · gói trước chưa xong
  const gt = vao.goiTruoc
  if (gt && soNguyen(gt.soCau) > 0 && soNguyen(gt.soDaLam) < soNguyen(gt.soCau)) {
    return tuChoi('goi_truoc_chua_xong', [`Gói lúc ${gioPhut(gt.lucGiaoMs)} con mới làm ${soNguyen(gt.soDaLam)} trong ${soNguyen(gt.soCau)} câu — chờ con làm xong rồi giao tiếp.`])
  }

  // 5 · hết trần ngày
  const conTran = Math.max(0, G.TONG_CAU_TOI_DA_NGAY - tong)
  if (conTran < G.TOI_THIEU_MOI_GOI) return tuChoi('het_tran_ngay', [`Hôm nay đã giao thêm ${tong} trên ${G.TONG_CAU_TOI_DA_NGAY} câu — để con nghỉ, mai giao tiếp được.`])

  // 6 · liều mong muốn + cơ cấu
  const { lieu, vuotMucTieu, thieu } = lieuMongMuon(luot, nganSach, vao.bayGioMs, tong)
  const daLam = soNguyen(nganSach.daLam)
  const dung = Math.min(soNguyen(nganSach.dung), daLam)
  const dangCon = hoSo.dang ?? []

  // câu thử sức: chỉ khi đúng ≥ 80 %; dạng ổn, không vấp, bậc < Vận dụng, còn câu bậc + 1; ưu tiên bậc cao rồi mã
  const dangThuSuc = duDieuKienThuSuc(daLam, dung)
    ? dangCon.filter((d) => !d.yeu && !d.vap && d.bac < 2 && soNguyen(d.soKhaDungCaoHon) >= 1).sort((a, b) => b.bac - a.bac || (a.ma < b.ma ? -1 : a.ma > b.ma ? 1 : 0))[0]
    : undefined
  let con = lieu - (dangThuSuc ? 1 : 0)
  const thanhPhan: ThanhPhanGiaoThem[] = []

  const onLai = Math.min(soNguyen(hoSo.soCauDenLichOn), Math.max(0, con))
  if (onLai > 0) thanhPhan.push({ loai: 'on_lai', soCau: onLai })
  con -= onLai

  // dạng con vấp: chia VÒNG TRÒN từng câu (dạng yếu, sai nhiều trước) tới khi đủ hoặc hết câu khả dụng
  const vap = dangCon
    .filter((d) => d.vap && khaDung(d) > 0)
    .sort((a, b) => Number(b.yeu) - Number(a.yeu) || soNguyen(b.soSai7) - soNguyen(a.soSai7) || (a.ma < b.ma ? -1 : a.ma > b.ma ? 1 : 0))
  const phat = new Map<string, number>()
  for (let vong = 0; con > 0 && vong < G.TONG_CAU_TOI_DA_NGAY; vong++) {
    let them = 0
    for (const d of vap) {
      if (con <= 0) break
      if ((phat.get(d.ma) ?? 0) < khaDung(d)) {
        phat.set(d.ma, (phat.get(d.ma) ?? 0) + 1)
        con--
        them++
      }
    }
    if (them === 0) break
  }
  for (const d of vap) {
    const n = phat.get(d.ma) ?? 0
    if (n > 0) {
      const nang = d.yeu && typeof d.tiLeKhacPhuc === 'number' && d.tiLeKhacPhuc < G.VAP_NANG_DUOI
      thanhPhan.push({ loai: 'dang_vap', dang: d.ma, bac: nang && soNguyen(d.soKhaDungThapHon) > 0 ? 'thap_hon_mot_bac' : soNguyen(d.soKhaDungDungBac) > 0 ? 'dung_bac' : 'thap_hon_mot_bac', soCau: n })
    }
  }

  const cauSai = Math.min(soNguyen(hoSo.soCauSaiChuaKhacPhuc), Math.max(0, con))
  if (cauSai > 0) thanhPhan.push({ loai: 'cau_sai', soCau: cauSai })
  con -= cauSai

  if (dangThuSuc) thanhPhan.push({ loai: 'thu_suc', dang: dangThuSuc.ma, bac: 'cao_hon_mot_bac', soCau: 1 })

  const soCau = thanhPhan.reduce((s, t) => s + t.soCau, 0)
  if (soCau < G.TOI_THIEU_MOI_GOI) {
    const tongVap = vap.reduce((s, d) => s + khaDung(d), 0)
    return tuChoi('khong_co_cau', [`Hôm nay chưa có đủ câu phù hợp để giao thêm (ôn lại ${soNguyen(hoSo.soCauDenLichOn)} câu, dạng con đang vấp ${tongVap} câu, câu từng sai ${soNguyen(hoSo.soCauSaiChuaKhacPhuc)} câu).`])
  }

  // 7 · lời giải thích có số thật
  const lyDo: string[] = []
  if (vuotMucTieu) lyDo.push(`Con đã làm ${daLam}/${soNguyen(nganSach.mucTieuCau)} câu, vượt mục tiêu hôm nay — chỉ giao gói nhẹ ${soCau} câu.`)
  else if (luot <= 1) lyDo.push(`Con mới làm ${daLam}/${soNguyen(nganSach.mucTieuCau)} câu mục tiêu hôm nay, còn thiếu ${thieu} câu — gói ${soCau} câu cho phần còn thiếu.`)
  else lyDo.push(`Đây là lượt giao thứ ${luot} trong ngày nên gói nhỏ hơn: ${soCau} câu.`)
  for (const t of thanhPhan) {
    const d = t.dang ? dangCon.find((x) => x.ma === t.dang) : undefined
    if (t.loai === 'on_lai') lyDo.push(`${t.soCau} câu ôn lại đã đến lịch.`)
    else if (t.loai === 'dang_vap' && d) lyDo.push(`${t.soCau} câu dạng ${tenDang(d)} (dạng con đang vấp${t.bac === 'thap_hon_mot_bac' ? ', chọn câu dễ hơn một bậc' : ''}).`)
    else if (t.loai === 'cau_sai') lyDo.push(`${t.soCau} câu con từng sai chưa khắc phục.`)
    else if (t.loai === 'thu_suc' && d) lyDo.push(`1 câu thử sức dạng ${tenDang(d)} vì hôm nay con đúng ${dung}/${daLam} câu.`)
  }
  if (soCau < lieu) lyDo.push(`Chỉ có ${soCau} câu phù hợp nên gói nhỏ hơn dự định (${lieu} câu).`)
  if (daQuaGioNghi(vao.bayGioMs)) lyDo.push(`Đã sau 21:30 nên gói không quá ${G.SAU_GIO_TOI_DA} câu để con nghỉ sớm.`)
  if (tong + soCau >= G.TONG_CAU_TOI_DA_NGAY - 2) lyDo.push(`Hôm nay đã giao thêm ${tong} câu, sau gói này là ${tong + soCau}/${G.TONG_CAU_TOI_DA_NGAY} câu.`)

  return { soCau, thanhPhan, phutUocTinh: phutUocTinhChang(soCau, vao.giayMoiCau ?? 90), lyDo }
}

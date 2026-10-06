// KIỂM CHẤM MỘT CA — CHỈ ĐỌC, KHÔNG GHI MỘT DÒNG NÀO (thầy 06/10: "quét toàn bộ mục chấm điểm … không được phép chấm sai cho bất kì bài kiểm tra nào").
//
// Với một ca đã xong: chấm lại TẠI CHỖ từng em đã nộp bằng lõi chấm hiện hành (`chamBaiMotEm`: bộ câu chuẩn + `scoreStudent` + `khopPhanIII`), rồi ĐỐI CHIẾU với
// thứ ĐANG NẰM trên D1:
//   · điểm lượt (`luot.tong`, `diem_i/ii/iii`) và `tong` có bằng tổng ba phần không;
//   · từng dòng `chi_tiet_cau` (đúng/sai, thiếu, thừa) — nguồn của "câu sai" em và phụ huynh nhìn thấy;
//   · `ban_do_sai`: dòng sai OAN (câu em làm đúng) và dòng THỪA (câu em không có trong bộ câu) — nguồn của "rút câu sai";
//   · bộ câu: lấy từ D1 sống hay phải đoán; có bù câu không; có dấu vết ngoài bộ không;
//   · khoá đáp án hỏng và bài làm sai khuôn.
// Và dựng lại CÁCH CHẤM LẠI CŨ (chỉ đọc bản đồ trong tờ đáp án R2) để biết nếu chạy lại bằng cách cũ thì bao nhiêu em bị chấm sai — số đo, không phải lời đoán.
//
// Trả CHỈ SỐ ĐẾM + mã lý do + mẫu ≤ 25 dòng mỗi loại (số báo danh + mã câu) để thầy soi. KHÔNG trả đáp án đúng, KHÔNG trả bài làm.
import type { Env } from './kieu'
import { assignStudentQuestions } from '../../src/lib/exam-assign'
import { boCauTuBaiLam } from '../../src/lib/bo-cau-tu-bai-lam'
import { hopNhatBo, lamPhangBo, LoiBoCauError } from '../../src/lib/bo-cau-chuan'
import { khopPhanIII } from '../../src/lib/cham-so'
import { chamBaiMotEm, chamTheoBoCauDaChon, docNguonChamLai, type KetQuaDocNguon, type NguonChamLai } from './cham-lai-ca'
import type { SoCauBaPhan } from '../../src/engine/score'

const TRAN_MAU = 25

type MaLech =
  | 'diem_tong_lech' // luot.tong ≠ tính lại
  | 'diem_phan_lech' // một phần (I/II/III) ≠ tính lại
  | 'diem_chua_co' // đã nộp, chấm được, mà luot.tong trống
  | 'tong_khac_tong_phan' // luot.tong ≠ I + II + III
  | 'dong_lech' // chi_tiet_cau.dung_sai ≠ tính lại
  | 'dap_an_dung_lech' // chi_tiet_cau.dap_an_dung ≠ đáp án đúng của khoá hiện hành (khoá bị đổi sau khi chấm, hoặc khoá bổ sung sai)
  | 'dong_thieu' // câu có trong bộ câu mà chi_tiet_cau không có
  | 'dong_thua' // chi_tiet_cau có câu ngoài bộ câu
  | 'em_khong_co_dong' // đã nộp mà không có dòng chi tiết nào
  | 'ban_do_sai_oan' // ban_do_sai ghi sai một câu em làm đúng
  | 'ban_do_sai_thua' // ban_do_sai ghi câu không thuộc bộ câu của em
  | 'cach_cu_chi_diem_lech' // chấm lại bằng cách CŨ sẽ ra điểm khác

interface Mau {
  sbd: string
  ma: MaLech | string
  qid?: string
  luu?: number | string | null
  moi?: number | string | null
}

/** Hai chuỗi đáp án đúng là MỘT đáp án? Bằng chữ sau trim (không phân hoa/thường), hoặc Phần III bằng nhau theo số học. */
function cungDapAn(a: string, b: string): boolean {
  const x = a.trim()
  const y = String(b ?? '').trim()
  if (x.toUpperCase() === y.toUpperCase()) return true
  // Phần II có thể được ghi "DSDS" hoặc "D,S,D,S": bỏ dấu ngăn rồi so.
  const dang2 = (v: string): string | null => (/^[DSds\s,;|/-]+$/.test(v) ? v.toUpperCase().replace(/[^DS-]/g, '') : null)
  const x2 = dang2(x)
  const y2 = dang2(y)
  if (x2 !== null && y2 !== null) return x2 === y2
  try {
    return khopPhanIII(x, y)
  } catch {
    return false
  }
}

function cents(x: number | null | undefined): number | null {
  return typeof x === 'number' && Number.isFinite(x) ? Math.round(x * 100) : null
}

/** Dựng lại ĐÚNG cách chấm lại CŨ: chỉ đọc bản đồ trong tờ đáp án R2; thiếu bản đồ thì dựng từ bài làm; em không có tên trong bản đồ rơi về luật hash trên CẢ kho. */
function tongTheoCachCu(nguon: NguonChamLai, soCau: SoCauBaPhan, sbd: string, l: NguonChamLai['dsLuot'][number]): number | null {
  if (!l.dapAn) return null
  try {
    const boCu = nguon.nh.boTheoEm ?? { [sbd]: boCauTuBaiLam(nguon.nh, nguon.ca.ma_ca, sbd, l.dapAn, l.giayCau, soCau) }
    const asg = assignStudentQuestions({ ...nguon.nh, soCau, boTheoEm: boCu }, nguon.ca.ma_ca, sbd)
    return chamTheoBoCauDaChon(asg, nguon.ca.ma_ca, sbd, l.dapAn, l.giayCau).score.total
  } catch {
    return null
  }
}

export interface KetQuaKiemCham {
  ok: true
  maCa: string
  tenCa: string
  trangThai: string
  deRieng: boolean
  congBo: string
  nguon: {
    /** Tờ đáp án R2 có mang `soCau` / bản đồ đề riêng không (bị `capNhatKeyBank` ghi đè là mất). */
    keyCoSoCau: boolean
    keyCoBoTheoEm: boolean
    d1CoSoCau: boolean
    d1CoBoTheoEm: boolean
    khoCau: SoCauBaPhan
    soCauCa: SoCauBaPhan
    /** Số em có bộ câu ghi ở D1 sống mà KHÔNG có trong bản chụp R2 (em vào muộn / thi lại). */
    emChiCoOD1: number
    /** Số câu nối thêm tờ đáp án R2 đã MẤT mà `kho_ca_them` còn đáp án — kiểm chấm đã bổ sung vào bộ nhớ để chấm được (0 = tờ đủ). */
    boSungTuKhoCaThem: number
    boQuaKhoCaThem: number
  }
  soEmDaNop: number
  soEmChamDuoc: number
  soEmTuChoi: number
  boCau: { da_ghi: number; bai_lam: number; hash: number }
  canhBao: Record<string, number>
  lech: Record<MaLech, number>
  /** Số em có ÍT NHẤT một lệch (không tính cảnh báo). */
  soEmCoLech: number
  mau: Record<string, Mau[]>
  tuChoi: { sbd: string; viSao: string }[]
}

export type KetQuaKiemChamRoute = KetQuaKiemCham | Extract<KetQuaDocNguon, { ok: false }>

const MA_LECH: MaLech[] = [
  'diem_tong_lech',
  'diem_phan_lech',
  'diem_chua_co',
  'tong_khac_tong_phan',
  'dong_lech',
  'dap_an_dung_lech',
  'dong_thieu',
  'dong_thua',
  'em_khong_co_dong',
  'ban_do_sai_oan',
  'ban_do_sai_thua',
  'cach_cu_chi_diem_lech',
]

export async function kiemChamCa(env: Env, maCa: string): Promise<KetQuaKiemChamRoute> {
  const n = await docNguonChamLai(env, maCa, { boQuaCongCaDaXong: true, boSungKhoCaThem: true })
  if (n.ok !== true) return n
  const { ca, nh, dsLuot } = n
  const soCau: SoCauBaPhan = n.soCauCa && n.soCauCa.I + n.soCauCa.II + n.soCauCa.III > 0 ? n.soCauCa : nh.soCau ?? { I: nh.phanI.length, II: nh.phanII.length, III: nh.phanIII.length }

  // CHỈ ĐỌC các bảng đã ghi, để đối chiếu.
  const rCt = await env.DB.prepare('SELECT sbd, lan_thu, phan, so_cau, qid, dung_sai, dap_an_dung FROM chi_tiet_cau WHERE ma_ca = ?').bind(maCa).all<Record<string, unknown>>()
  const rBd = await env.DB.prepare('SELECT sbd, qid FROM ban_do_sai WHERE ma_ca = ?').bind(maCa).all<Record<string, unknown>>()
  const dongTheoEm = new Map<string, Map<string, number | null>>() // `${sbd}|${lan}` → qid → dung_sai
  const dapAnDungDaGhi = new Map<string, Map<string, string>>() // `${sbd}|${lan}` → qid → dap_an_dung
  for (const x of rCt.results ?? []) {
    const k = `${String(x.sbd ?? '')}|${Number(x.lan_thu) || 1}`
    const m = dongTheoEm.get(k) ?? new Map<string, number | null>()
    m.set(String(x.qid ?? ''), x.dung_sai === null || x.dung_sai === undefined ? null : Number(x.dung_sai))
    dongTheoEm.set(k, m)
    const dd = dapAnDungDaGhi.get(k) ?? new Map<string, string>()
    dd.set(String(x.qid ?? ''), String(x.dap_an_dung ?? ''))
    dapAnDungDaGhi.set(k, dd)
  }
  const bdTheoEm = new Map<string, Set<string>>()
  for (const x of rBd.results ?? []) {
    const k = String(x.sbd ?? '')
    const s = bdTheoEm.get(k) ?? new Set<string>()
    s.add(String(x.qid ?? ''))
    bdTheoEm.set(k, s)
  }

  const boR2 = lamPhangBo(nh.boTheoEm)
  const boD1 = lamPhangBo(n.boD1)
  const boHieuLuc = hopNhatBo(nh.boTheoEm, n.boD1)
  const bank = { ...nh, soCau }

  const lech = Object.fromEntries(MA_LECH.map((m) => [m, 0])) as Record<MaLech, number>
  const mau: Record<string, Mau[]> = {}
  const ghiMau = (ma: string, m: Mau) => {
    const ds = (mau[ma] ??= [])
    if (ds.length < TRAN_MAU) ds.push(m)
  }
  const canhBao: Record<string, number> = {}
  const boCau = { da_ghi: 0, bai_lam: 0, hash: 0 }
  const tuChoi: { sbd: string; viSao: string }[] = []
  const emCoLech = new Set<string>()
  let daNop = 0
  let chamDuoc = 0

  const theoSbd = new Map<string, typeof dsLuot>()
  for (const l of dsLuot) theoSbd.set(l.sbd, [...(theoSbd.get(l.sbd) ?? []), l])
  const emChiCoOD1 = Object.keys(boD1).filter((s) => !boR2[s]).length

  theoSbd.forEach((arr, sbd) => {
    const moiNhat = [...arr].sort((a, b) => b.lanThu - a.lanThu)[0]!
    if (!moiNhat.dapAn || (moiNhat.trangThai !== 'da_nop' && moiNhat.trangThai !== 'khoa')) return
    daNop++
    let kq: ReturnType<typeof chamBaiMotEm>
    try {
      kq = chamBaiMotEm(bank, maCa, sbd, moiNhat.dapAn, moiNhat.giayCau, boHieuLuc[sbd])
    } catch (e) {
      const viSao = e instanceof LoiBoCauError ? `${e.ma}: ${e.message}` : e instanceof Error ? e.message : 'Không chấm được'
      tuChoi.push({ sbd, viSao })
      emCoLech.add(sbd)
      return
    }
    chamDuoc++
    boCau[kq.boCau.nguon]++
    for (const c of kq.boCau.canhBao) {
      const ma = c.replace(/_\d+$/, '')
      canhBao[ma] = (canhBao[ma] ?? 0) + 1
    }

    const luu = moiNhat.diem
    const moi = { I: kq.score.phanIScore, II: kq.score.phanIIScore, III: kq.score.phanIIIScore, tong: kq.score.total }
    const danh = (ma: MaLech, m: Omit<Mau, 'sbd' | 'ma'> = {}) => {
      lech[ma]++
      emCoLech.add(sbd)
      ghiMau(ma, { sbd, ma, ...m })
    }
    if (luu.tong === null) danh('diem_chua_co', { moi: moi.tong })
    else if (cents(luu.tong) !== cents(moi.tong)) danh('diem_tong_lech', { luu: luu.tong, moi: moi.tong })
    if (luu.tong !== null && (['I', 'II', 'III'] as const).some((p) => luu[p] !== null && cents(luu[p]) !== cents(moi[p]))) {
      danh('diem_phan_lech', { luu: `${luu.I}/${luu.II}/${luu.III}`, moi: `${moi.I}/${moi.II}/${moi.III}` })
    }
    if (luu.tong !== null && luu.I !== null && luu.II !== null && luu.III !== null && Math.abs(luu.tong - (luu.I + luu.II + luu.III)) > 0.011) {
      danh('tong_khac_tong_phan', { luu: `${luu.I}+${luu.II}+${luu.III}`, moi: luu.tong })
    }

    // Dòng chi tiết đã ghi ↔ tính lại.
    const daGhi = dongTheoEm.get(`${sbd}|${moiNhat.lanThu}`)
    const tinhLai = new Map(kq.cau.map((c) => [c.qid, c.dungSai === true ? 1 : 0]))
    if (!daGhi || daGhi.size === 0) {
      danh('em_khong_co_dong')
    } else {
      for (const [qid, dung] of tinhLai) {
        if (!daGhi.has(qid)) danh('dong_thieu', { qid })
        else if ((daGhi.get(qid) ?? 0) !== dung) danh('dong_lech', { qid, luu: daGhi.get(qid) ?? 0, moi: dung })
      }
      for (const qid of daGhi.keys()) if (!tinhLai.has(qid)) danh('dong_thua', { qid })
      // Đáp án đúng ĐÃ GHI ở dòng chi tiết ↔ đáp án đúng của khoá hiện hành: lệch nghĩa là khoá bị đổi sau khi chấm (hoặc khoá bổ sung từ `kho_ca_them` sai).
      // Chỉ nêu mã câu, KHÔNG nêu đáp án.
      const ddGhi = dapAnDungDaGhi.get(`${sbd}|${moiNhat.lanThu}`)
      if (ddGhi) {
        for (const c of kq.cau) {
          const da = ddGhi.get(c.qid)
          if (da !== undefined && da.trim() !== '' && !cungDapAn(da, c.dapAnDung)) danh('dap_an_dung_lech', { qid: c.qid })
        }
      }
    }

    // ban_do_sai: oan (em làm đúng) / thừa (ngoài bộ câu).
    const bd = bdTheoEm.get(sbd)
    if (bd) {
      for (const qid of bd) {
        if (!tinhLai.has(qid)) danh('ban_do_sai_thua', { qid })
        else if (tinhLai.get(qid) === 1) danh('ban_do_sai_oan', { qid })
      }
    }

    // Nếu chạy chấm lại bằng cách CŨ thì ra gì?
    const cu = tongTheoCachCu(n, soCau, sbd, moiNhat)
    if (cu !== null && cents(cu) !== cents(moi.tong)) danh('cach_cu_chi_diem_lech', { luu: cu, moi: moi.tong })
  })

  const congBo = String(ca.cong_bo ?? '')
  return {
    ok: true,
    maCa,
    tenCa: String(ca.ten_ca ?? ''),
    trangThai: String(ca.trang_thai ?? ''),
    deRieng: Number(ca.de_rieng ?? 0) === 1,
    congBo,
    nguon: {
      keyCoSoCau: !!nh.soCau,
      keyCoBoTheoEm: Object.keys(boR2).length > 0,
      d1CoSoCau: !!(n.soCauCa && n.soCauCa.I + n.soCauCa.II + n.soCauCa.III > 0),
      d1CoBoTheoEm: Object.keys(boD1).length > 0,
      khoCau: { I: nh.phanI.length, II: nh.phanII.length, III: nh.phanIII.length },
      soCauCa: soCau,
      emChiCoOD1,
      boSungTuKhoCaThem: n.soBoSungKhoCaThem,
      boQuaKhoCaThem: n.soBoQuaKhoCaThem,
    },
    soEmDaNop: daNop,
    soEmChamDuoc: chamDuoc,
    soEmTuChoi: tuChoi.length,
    boCau,
    canhBao,
    lech,
    soEmCoLech: emCoLech.size,
    mau,
    tuChoi: tuChoi.slice(0, TRAN_MAU),
  }
}

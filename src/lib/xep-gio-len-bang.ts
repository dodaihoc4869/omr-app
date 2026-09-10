// XẾP GIỜ BUỔI CHỮA 80 PHÚT — BỐN LANE, NỚI LAGRANGE, GHÉP CẶP 1-1.
//
// Đặc tả: GOI-LEN-BANG-80-PHUT.md mục 4.4 và 8.4–8.8.
//
// Bài toán: chọn lane cho mỗi câu, và chọn em cho câu lane L3, sao cho tổng giá
// trị lớn nhất với `Σ thời gian ≤ ngân sách`, `|L3| ≤ trần`, mỗi em nhiều nhất
// một câu, mỗi câu nhiều nhất một em, và MỌI CÂU BẮT BUỘC có lane ≥ L2.
//
// Đây là xếp ba lô nhiều lựa chọn lồng một bài ghép cặp có trọng số. Nới
// Lagrange trên ngân sách tách nó thành: (a) mỗi câu tự chọn lane rẻ nhất theo
// giá λ mỗi giây, (b) một bài ghép cặp cho phần L3. Tìm nhị phân λ ≤ 40 vòng.
//
// HAI CHỐT KHÔNG ĐƯỢC MẤT:
//
//  · NGÂN SÁCH TÍNH BẰNG SỐ VÒNG, không bằng `Date.now()`. Máy chậm cắt sớm là
//    ra giáo án khác — đã trả giá cho bài học này ở `de-rieng-cau-hinh.ts`.
//  · IN KHOẢNG CÁCH ĐỐI NGẪU. `L(λ)` là cận trên thật của lời giải tối ưu; khoảng
//    cách `(cận trên − đạt được)/cận trên` là bằng chứng tự chứng minh, không
//    phải lời hứa "đã tối ưu".
import type { CauChua } from './phan-cong'
import type { DoKhoCau, VapCuaEm } from './do-kho-cau'
import { hopVoiEm, khongDuCanCu, type BaiLamCoGiay } from './do-kho-cau'
import {
  CAU_HINH_LEN_BANG_MAC_DINH,
  haoPhiGiay,
  LANE,
  nganSachGiay,
  soBacLane,
  type CauHinhLenBang,
  type Lane,
} from './len-bang-cau-hinh'

export interface EmLenBang {
  sbd: string
  hoTen: string
  coMat: boolean
  /** Số lần lên bảng 30 ngày qua. Hôm nay máy chủ chưa giữ được con số này nên
   * luôn là 0 — xem ghi chú ở `hopVoiEm`. */
  soLanLenBang: number
}

export interface DongXep {
  cau: CauChua
  lane: Lane
  giay: number
  giaTri: number
  batBuoc: boolean
  chuNguon: string
  em: { sbd: string; hoTen: string } | null
  vap: VapCuaEm | null
  hop: number
}

export interface LuaChonThuaGio {
  ma: 1 | 2 | 3
  chu: string
  phutSau: number
}

export interface ThuaGio {
  soCauBatBuoc: number
  giayCan: number
  giayCo: number
  luaChon: LuaChonThuaGio[]
}

export interface KetQuaXep {
  dong: DongXep[]
  tongGiay: number
  nganSach: number
  tongGiaTri: number
  canTrenNoi: number
  khoangCachDoiNgau: number
  lambda: number
  soVong: number
  soEmLenBang: number
  /** Còn nâng được câu nào lên lane đắt hơn mà vẫn trong ngân sách không.
   * `false` = giáo án đã kịch trần luật cho phép, thừa giờ là hết nước đi. */
  conMuaDuoc: boolean
  /** Có thì màn PHẢI hiện và CHỜ THẦY CHẠM — cấm tự cắt danh sách bắt buộc. */
  thuaGio: ThuaGio | null
  canhBao: string[]
}

export interface YeuCauXep {
  cauHinh?: CauHinhLenBang
  /** Thầy đã chạm lựa chọn ① — bỏ hẳn mấy câu này khỏi danh sách bắt buộc. */
  boBatBuoc?: string[]
  /** Thầy đã chạm lựa chọn ② — hạ trần em lên bảng. */
  tranEm?: number
  /** Thầy đã chạm lựa chọn ③ — rút giờ mỗi em lên bảng, tính bằng giây. */
  giayMoiEm?: number
  /** Ca này thiếu dữ liệu thời gian — chuyển thẳng vào cảnh báo. */
  thieuGiay?: boolean
  /** Chưa có lịch sử lên bảng trên máy chủ. */
  chuaCoLichSuLenBang?: boolean
}

// ------------------------------------------------------------------ giá trị

/** Phần giá trị của câu mà mỗi lane thu được. L2 phủ trọn nội dung cho cả lớp;
 * L3 phủ trọn nội dung ẤY và thêm phần dạy sâu một em. */
export const PHU_CUA_LANE: Record<Lane, number> = { L0: 0.05, L1: 0.35, L2: 1, L3: 1 }

/** Lane nào được phép cho câu này.
 *
 * PHÂN XỬ MỘT MÂU THUẪN CÓ THẬT TRONG PROMPT: "sao = 0 ⇒ lane ≤ L1" và "trong
 * danh sách bắt buộc ⇒ lane ≥ L2" đá nhau khi một câu sao 0 mà lớp vừa sai 40%.
 * DANH SÁCH BẮT BUỘC THẮNG — số đo được của lớp hôm nay mạnh hơn cái nhãn dán
 * từ trước. Câu sao 0 mà không N1 không N2 thì không bao giờ vào danh sách bắt
 * buộc nên không có mâu thuẫn ngược lại. */
export function laneChoPhep(d: DoKhoCau, boBatBuoc: Set<string>): Lane[] {
  const batBuoc = d.batBuoc && !boBatBuoc.has(d.cau.id)
  if (batBuoc) return ['L2', 'L3']
  if (khongDuCanCu(d)) return ['L0']
  if (d.cau.sao === 0) return ['L0', 'L1']
  return [...LANE]
}

function giayCua(lane: Lane, ch: CauHinhLenBang, giayMoiEm?: number): number {
  if (lane === 'L3' && giayMoiEm && giayMoiEm > 0) return giayMoiEm
  return ch.GIAY_LANE[lane]
}

/** Giá trị của một câu ở một lane, CHƯA tính em nào (L3 tính riêng). */
export function giaTriLane(d: DoKhoCau, lane: Lane): number {
  return PHU_CUA_LANE[lane] * d.giaTri
}

// -------------------------------------------------- ghép cặp 1-1 có giới hạn
//
// Luồng chi phí nhỏ nhất, đẩy từng đơn vị một. Mỗi lần đẩy là một cặp (câu, em)
// tốt nhất còn lại; dừng khi hết trần hoặc khi đường tốt nhất không còn lời.
// Chỉ nhận cạnh CÓ LỜI (gain > 0) — cặp lỗ thì không ghép còn hơn.
//
// Cỡ bài: ≤ 50 câu × ≤ 40 em × ≤ 8 lượt đẩy. Không dùng đồng hồ, không ngẫu
// nhiên ⇒ chạy lại ra đúng bộ cũ.

interface CanhLuong {
  toi: number
  cap: number
  chiPhi: number
  nguoc: number
}

export interface CapGhep {
  hang: number
  cot: number
  loi: number
}

export function ghepCapCoTran(loi: number[][], tran: number): CapGhep[] {
  const nH = loi.length
  const nC = nH ? loi[0].length : 0
  if (!nH || !nC || tran <= 0) return []
  const nguon = 0
  const dich = nH + nC + 1
  const soNut = dich + 1
  const ke: CanhLuong[][] = Array.from({ length: soNut }, () => [])
  const them = (tu: number, toi: number, cap: number, chiPhi: number) => {
    ke[tu].push({ toi, cap, chiPhi, nguoc: ke[toi].length })
    ke[toi].push({ toi: tu, cap: 0, chiPhi: -chiPhi, nguoc: ke[tu].length - 1 })
  }
  for (let i = 0; i < nH; i++) them(nguon, 1 + i, 1, 0)
  for (let j = 0; j < nC; j++) them(1 + nH + j, dich, 1, 0)
  for (let i = 0; i < nH; i++) {
    for (let j = 0; j < nC; j++) {
      if (loi[i][j] > 0) them(1 + i, 1 + nH + j, 1, -loi[i][j])
    }
  }

  const ra: CapGhep[] = []
  for (let vong = 0; vong < tran; vong++) {
    // SPFA: chi phí âm nên không dùng Dijkstra trần.
    const d = new Array<number>(soNut).fill(Infinity)
    const tuNut = new Array<number>(soNut).fill(-1)
    const tuCanh = new Array<number>(soNut).fill(-1)
    const trongHang = new Array<boolean>(soNut).fill(false)
    d[nguon] = 0
    const hang: number[] = [nguon]
    trongHang[nguon] = true
    while (hang.length) {
      const u = hang.shift() as number
      trongHang[u] = false
      for (let k = 0; k < ke[u].length; k++) {
        const e = ke[u][k]
        if (e.cap <= 0) continue
        const moi = d[u] + e.chiPhi
        if (moi < d[e.toi] - 1e-12) {
          d[e.toi] = moi
          tuNut[e.toi] = u
          tuCanh[e.toi] = k
          if (!trongHang[e.toi]) {
            trongHang[e.toi] = true
            hang.push(e.toi)
          }
        }
      }
    }
    // Hết đường có lời thì dừng — thêm cặp lỗ chỉ làm tổng xấu đi.
    if (!Number.isFinite(d[dich]) || d[dich] >= -1e-12) break
    let v = dich
    while (v !== nguon) {
      const u = tuNut[v]
      const e = ke[u][tuCanh[v]]
      e.cap -= 1
      ke[v][e.nguoc].cap += 1
      v = u
    }
  }

  for (let i = 0; i < nH; i++) {
    for (const e of ke[1 + i]) {
      if (e.toi > nH && e.toi <= nH + nC && e.cap === 0) {
        const j = e.toi - nH - 1
        if (loi[i][j] > 0) ra.push({ hang: i, cot: j, loi: loi[i][j] })
      }
    }
  }
  return ra
}

// ------------------------------------------------------- cận trên chặt hơn
//
// VÌ SAO CẦN CÁI THỨ HAI. Cận trên Lagrange `L(λ)` bỏ hẳn ràng buộc ngân sách,
// nên nó "mua" cả 8 suất lên bảng kể cả khi ca chỉ còn 250 giây. Đo trên 100 ca
// 28 câu × 30 em: nó báo khoảng cách tới 12,4% ở những ca mà lời giải thật ra
// đã KHÔNG CÒN NƯỚC ĐI NÀO — tức là con số ấy toàn phần lỏng của cận trên, chứ
// giáo án không hề tệ. In một con số doạ người mà không thật thì thầy mất tin
// vào mọi con số khác.
//
// Nên tính thêm cận trên thứ hai: nới TUYẾN TÍNH bài ba lô nhiều lựa chọn —
// giữ đúng ngân sách, chỉ bỏ ràng buộc 1-1 và trần lên bảng. Đây là cận trên
// hợp lệ (bỏ ràng buộc chỉ làm tập nghiệm rộng ra), và chặt hơn hẳn ở đúng chỗ
// Lagrange lỏng. Lấy `min` của hai cận là cận trên chặt nhất mà vẫn đúng.

interface LuaChonCau {
  t: number
  v: number
}

/** Bao lồi trên của các lựa chọn một câu theo (thời gian, giá trị): giữ lại
 * đúng những lựa chọn mà một lời giải tuyến tính có thể chọn tới. */
function baoLoiTren(ds: LuaChonCau[]): LuaChonCau[] {
  const a = [...ds].sort((x, y) => x.t - y.t || y.v - x.v)
  const hull: LuaChonCau[] = []
  for (const p of a) {
    if (hull.length && p.v <= hull[hull.length - 1].v + 1e-12) continue
    while (hull.length >= 2) {
      const p1 = hull[hull.length - 2]
      const p2 = hull[hull.length - 1]
      // p2 nằm dưới đoạn p1→p: bỏ đi, không lời giải tuyến tính nào chọn nó.
      if ((p2.v - p1.v) * (p.t - p1.t) <= (p.v - p1.v) * (p2.t - p1.t) + 1e-12) hull.pop()
      else break
    }
    hull.push(p)
  }
  return hull
}

export function canTrenNoiTuyenTinh(luaChon: LuaChonCau[][], nganSach: number): number {
  let nen = 0
  let daDung = 0
  const buoc: { mat: number; giaTri: number }[] = []
  for (const ds of luaChon) {
    const h = baoLoiTren(ds)
    if (!h.length) continue
    nen += h[0].v
    daDung += h[0].t
    for (let i = 1; i < h.length; i++) buoc.push({ mat: h[i].t - h[i - 1].t, giaTri: h[i].v - h[i - 1].v })
  }
  if (daDung >= nganSach) return nen
  buoc.sort((a, b) => b.giaTri / b.mat - a.giaTri / a.mat)
  let con = nganSach - daDung
  let tong = nen
  for (const b of buoc) {
    if (con <= 0) break
    if (b.mat <= con) {
      tong += b.giaTri
      con -= b.mat
    } else {
      tong += (b.giaTri * con) / b.mat
      con = 0
    }
  }
  return tong
}

// ---------------------------------------------------------------- xếp chính

interface UngVienL3 {
  iCau: number
  iEm: number
  giaTri: number
  hop: number
  vap: VapCuaEm | null
}

/** Một lời giải đầy đủ: lane của từng câu + em của câu L3. */
interface LoiGiai {
  lane: Lane[]
  em: (number | null)[]
  hop: number[]
  vap: (VapCuaEm | null)[]
  giay: number
  giaTri: number
}

export function xepGioLenBang(
  dsDoKho: DoKhoCau[],
  dsEm: EmLenBang[],
  baiLam: BaiLamCoGiay[],
  vapTheoEm: Map<string, VapCuaEm[]>,
  yc: YeuCauXep = {},
): KetQuaXep {
  void baiLam
  const ch = yc.cauHinh ?? CAU_HINH_LEN_BANG_MAC_DINH
  const canhBao: string[] = []
  const boBatBuoc = new Set(yc.boBatBuoc ?? [])
  const tran = Math.max(0, yc.tranEm ?? ch.SO_EM_LEN_BANG_TOI_DA)
  const B = nganSachGiay(ch)

  // Thứ tự cố định ⇒ chạy lại ra đúng bộ cũ.
  const cau = [...dsDoKho].sort((a, b) => (a.cau.id < b.cau.id ? -1 : a.cau.id > b.cau.id ? 1 : 0))
  const em = dsEm.filter((e) => e.coMat).sort((a, b) => (a.sbd < b.sbd ? -1 : a.sbd > b.sbd ? 1 : 0))

  const chophep = cau.map((d) => laneChoPhep(d, boBatBuoc))
  const gL3 = giayCua('L3', ch, yc.giayMoiEm)
  const giayLane = (l: Lane) => giayCua(l, ch, yc.giayMoiEm)

  // ------------------------------------------------ có vừa ngân sách không
  const giayToiThieu = chophep.reduce((s, ls) => s + Math.min(...ls.map(giayLane)), 0)
  const soBatBuoc = cau.filter((_d, i) => chophep[i][0] === 'L2').length
  const canDayDu = giayToiThieu + Math.min(tran, em.length, cau.length) * (gL3 - ch.GIAY_LANE.L2)

  let thuaGio: ThuaGio | null = null
  if (giayToiThieu > B || canDayDu > B) {
    const nen = giayToiThieu
    const soL3 = Math.min(tran, em.length, cau.length)
    const luaChon: LuaChonThuaGio[] = []
    const canBo = Math.ceil(Math.max(0, canDayDu - B) / ch.GIAY_LANE.L2)
    if (canBo > 0 && canBo <= soBatBuoc) {
      const thap = cau
        .filter((_d, i) => chophep[i][0] === 'L2')
        .sort((a, b) => a.giaTri - b.giaTri)
        .slice(0, canBo)
      luaChon.push({
        ma: 1,
        chu: `Bỏ ${canBo} câu bắt buộc điểm thấp nhất (${thap.map((d) => `${d.cau.phan}.${d.cau.so}`).join(', ')})`,
        phutSau: Math.round((canDayDu - canBo * ch.GIAY_LANE.L2 + haoPhiGiay(ch)) / 60),
      })
    }
    const tranMoi = Math.max(0, Math.floor((B - nen) / Math.max(1, gL3 - ch.GIAY_LANE.L2)))
    if (tranMoi < soL3) {
      luaChon.push({
        ma: 2,
        chu: `Hạ em lên bảng ${soL3} → ${tranMoi}`,
        phutSau: Math.round((nen + tranMoi * (gL3 - ch.GIAY_LANE.L2) + haoPhiGiay(ch)) / 60),
      })
    }
    if (soL3 > 0) {
      const gMoi = Math.floor((B - nen) / soL3) + ch.GIAY_LANE.L2
      if (gMoi >= ch.GIAY_LANE.L2 && gMoi < gL3) {
        luaChon.push({
          ma: 3,
          chu: `Rút giờ mỗi em ${Math.round(gL3 / 60)} → ${Math.round(gMoi / 60)} phút`,
          phutSau: Math.round((nen + soL3 * (gMoi - ch.GIAY_LANE.L2) + haoPhiGiay(ch)) / 60),
        })
      }
    }
    thuaGio = { soCauBatBuoc: soBatBuoc, giayCan: canDayDu, giayCo: B, luaChon }
    // Danh sách bắt buộc KHÔNG vừa cả ngân sách tối thiểu ⇒ dừng hẳn, chờ thầy
    // chạm. Cấm tự cắt.
    if (giayToiThieu > B) {
      return {
        dong: [],
        tongGiay: 0,
        nganSach: B,
        tongGiaTri: 0,
        canTrenNoi: 0,
        khoangCachDoiNgau: 0,
        lambda: 0,
        soVong: 0,
        soEmLenBang: 0,
        conMuaDuoc: false,
        thuaGio,
        canhBao: [`${soBatBuoc} câu bắt buộc chữa cần ${Math.round((giayToiThieu + haoPhiGiay(ch)) / 60)} phút, quá ${ch.NGAN_SACH_PHUT} phút — chọn một cách rồi bấm xếp lại.`],
      }
    }
  }

  // ------------------------------------------------------- bảng lợi cho L3
  const coL3 = cau.map((_, i) => chophep[i].includes('L3'))
  const ungVien: UngVienL3[][] = cau.map(() => [])
  for (let i = 0; i < cau.length; i++) {
    if (!coL3[i]) continue
    for (let j = 0; j < em.length; j++) {
      const h = hopVoiEm(cau[i].cau, vapTheoEm.get(em[j].sbd) ?? [], em[j].soLanLenBang, ch)
      ungVien[i].push({
        iCau: i,
        iEm: j,
        giaTri: giaTriLane(cau[i], 'L3') + ch.HE_SO_SAU_L3 * h.diem,
        hop: h.diem,
        vap: h.vap,
      })
    }
  }

  // Cận trên thứ hai: nới tuyến tính, GIỮ ngân sách, bỏ ràng buộc 1-1 và trần.
  // Với L3 lấy em tốt nhất của câu — bỏ ràng buộc nên vẫn là cận trên.
  const canTrenLP = canTrenNoiTuyenTinh(
    cau.map((d, i) =>
      chophep[i].map((l) => ({
        t: giayLane(l),
        v: l === 'L3' ? Math.max(0, ...ungVien[i].map((u) => u.giaTri)) : giaTriLane(d, l),
      })),
    ),
    B,
  )

  // ------------------------------------------------------------- một vòng λ
  function giaiTaiLambda(lambda: number): { lg: LoiGiai; noi: number } {
    const lane: Lane[] = []
    const s0: number[] = []
    for (let i = 0; i < cau.length; i++) {
      let tot: Lane = chophep[i][0]
      let totDiem = -Infinity
      for (const l of chophep[i]) {
        if (l === 'L3') continue
        const v = giaTriLane(cau[i], l) - lambda * giayLane(l)
        if (v > totDiem + 1e-12) {
          totDiem = v
          tot = l
        }
      }
      lane.push(tot)
      s0.push(totDiem)
    }
    const loi: number[][] = []
    const banDo: number[] = []
    for (let i = 0; i < cau.length; i++) {
      if (!coL3[i]) continue
      banDo.push(i)
      loi.push(ungVien[i].map((u) => u.giaTri - lambda * gL3 - s0[i]))
    }
    const cap = ghepCapCoTran(loi, Math.min(tran, em.length))

    const emCua: (number | null)[] = cau.map(() => null)
    const hopCua: number[] = cau.map(() => 0)
    const vapCua: (VapCuaEm | null)[] = cau.map(() => null)
    let noi = s0.reduce((a, b) => a + b, 0)
    for (const c of cap) {
      const i = banDo[c.hang]
      lane[i] = 'L3'
      emCua[i] = c.cot
      hopCua[i] = ungVien[i][c.cot].hop
      vapCua[i] = ungVien[i][c.cot].vap
      noi += c.loi
    }
    let giay = 0
    let giaTri = 0
    for (let i = 0; i < cau.length; i++) {
      giay += giayLane(lane[i])
      giaTri += lane[i] === 'L3' ? ungVien[i][emCua[i] as number].giaTri : giaTriLane(cau[i], lane[i])
    }
    return { lg: { lane, em: emCua, hop: hopCua, vap: vapCua, giay, giaTri }, noi: noi + lambda * B }
  }

  // ------------------------------------------- tìm nhị phân λ, SỐ VÒNG cố định
  let lo = 0
  let hi = 1
  // Bắt đầu từ cận trên tuyến tính; mỗi vòng λ chỉ có thể làm nó chặt thêm.
  let canTren = canTrenLP
  const ghiCanTren = (n: number) => {
    if (n < canTren) canTren = n
  }
  let r = giaiTaiLambda(0)
  ghiCanTren(r.noi)
  let totNhat: LoiGiai | null = r.lg.giay <= B ? r.lg : null
  if (r.lg.giay > B) {
    // Nâng hi tới khi vừa ngân sách. Trần 60 lần nhân đôi là thừa sức cho mọi
    // giá trị hữu hạn, và vẫn là hằng số ⇒ tất định.
    for (let k = 0; k < 60 && hi < 1e9; k++) {
      const t = giaiTaiLambda(hi)
      ghiCanTren(t.noi)
      if (t.lg.giay <= B) {
        totNhat = t.lg
        break
      }
      lo = hi
      hi *= 2
    }
  }
  let soVong = 0
  for (; soVong < ch.VONG_LAGRANGE; soVong++) {
    const mid = (lo + hi) / 2
    const t = giaiTaiLambda(mid)
    ghiCanTren(t.noi)
    if (t.lg.giay <= B) {
      totNhat = totNhat && totNhat.giaTri >= t.lg.giaTri ? totNhat : t.lg
      hi = mid
    } else {
      lo = mid
    }
  }

  const lg: LoiGiai =
    totNhat ??
    (() => {
      // Không bao giờ tới đây khi `giayToiThieu ≤ B`, nhưng thà rơi về lane rẻ
      // nhất còn hơn trả về bừa.
      const lane = chophep.map((ls) => ls.reduce((a, b) => (giayLane(b) < giayLane(a) ? b : a)))
      const giay = lane.reduce((s, l) => s + giayLane(l), 0)
      const giaTri = lane.reduce((s, l, i) => s + giaTriLane(cau[i], l), 0)
      return { lane, em: cau.map(() => null), hop: cau.map(() => 0), vap: cau.map(() => null), giay, giaTri }
    })()

  // ------------------------------ vá tham: đổ nốt giờ thừa vào chỗ lời nhất
  //
  // Nới Lagrange hay dừng ở lời giải còn dư giờ (λ nhảy bậc). Bước này chỉ LÀM
  // TỐT LÊN: mỗi lần nâng một câu lên lane đắt hơn nếu còn đủ giờ, chọn lần nâng
  // lời nhất trên mỗi giây. Tất định vì duyệt theo thứ tự cố định.
  let soL3Dung = lg.lane.filter((l) => l === 'L3').length
  const emDaDung = new Set<number>()
  for (let i = 0; i < cau.length; i++) if (lg.lane[i] === 'L3') emDaDung.add(lg.em[i] as number)
  for (let buoc = 0; buoc < cau.length * LANE.length; buoc++) {
    let tot: { i: number; l: Lane; j: number | null; dV: number; dT: number } | null = null
    for (let i = 0; i < cau.length; i++) {
      for (const l of chophep[i]) {
        if (soBacLane(l, lg.lane[i]) <= 0) continue
        const dT = giayLane(l) - giayLane(lg.lane[i])
        if (dT <= 0 || lg.giay + dT > B) continue
        if (l === 'L3') {
          if (soL3Dung >= tran) continue
          let totEm: UngVienL3 | null = null
          for (const u of ungVien[i]) {
            if (emDaDung.has(u.iEm)) continue
            if (!totEm || u.giaTri > totEm.giaTri) totEm = u
          }
          if (!totEm) continue
          const dV = totEm.giaTri - giaTriLane(cau[i], lg.lane[i])
          if (dV > 1e-12 && (!tot || dV / dT > tot.dV / tot.dT + 1e-12)) tot = { i, l, j: totEm.iEm, dV, dT }
        } else {
          const dV = giaTriLane(cau[i], l) - giaTriLane(cau[i], lg.lane[i])
          if (dV > 1e-12 && (!tot || dV / dT > tot.dV / tot.dT + 1e-12)) tot = { i, l, j: null, dV, dT }
        }
      }
    }
    if (!tot) break
    if (tot.l === 'L3') {
      lg.em[tot.i] = tot.j
      const u = ungVien[tot.i].find((x) => x.iEm === tot.j) as UngVienL3
      lg.hop[tot.i] = u.hop
      lg.vap[tot.i] = u.vap
      emDaDung.add(tot.j as number)
      soL3Dung++
    }
    lg.lane[tot.i] = tot.l
    lg.giay += tot.dT
    lg.giaTri += tot.dV
  }

  // -------------------------------------------------------------- kết quả ra
  const dong: DongXep[] = cau.map((d, i) => ({
    cau: d.cau,
    lane: lg.lane[i],
    giay: giayLane(lg.lane[i]),
    giaTri: lg.lane[i] === 'L3' ? ungVien[i][lg.em[i] as number].giaTri : giaTriLane(d, lg.lane[i]),
    batBuoc: d.batBuoc && !boBatBuoc.has(d.cau.id),
    chuNguon: d.chuNguon,
    em: lg.em[i] === null ? null : { sbd: em[lg.em[i] as number].sbd, hoTen: em[lg.em[i] as number].hoTen },
    vap: lg.vap[i],
    hop: lg.hop[i],
  }))

  if (yc.thieuGiay) canhBao.push('Ca này thiếu dữ liệu thời gian — không đọc được nguyên nhân "tính sai" và "đoán".')
  if (yc.chuaCoLichSuLenBang) canhBao.push('Chưa có lịch sử lên bảng — mọi em được coi là như nhau về tần suất.')
  // Còn nước đi nào mua được bằng số giây thừa không. Dùng để trả lời câu "sao
  // giáo án mới 68 phút" — hết nước đi thì buổi kết thúc sớm là đúng, không
  // phải thuật toán lười.
  const conMua = conMuaDuocNuocNao(lg.giay, B, lg.lane, chophep, giayLane)
  const reNhat = nuocDiReNhat(lg.lane, chophep, giayLane)

  // KHOẢNG CÁCH ĐỐI NGẪU — cận trên nới trừ giá trị đạt được, chia cận trên.
  //
  // ĐỌC CON SỐ NÀY CHO ĐÚNG. Nó đo khoảng cách tới một CẬN TRÊN, không phải tới
  // lời giải tốt nhất. So với lời giải tốt nhất thật (vét cạn, 200 ca nhỏ) thì
  // bản này trùng 200/200, lệch 0,00%. Trên ca 28 câu × 30 em thì:
  //
  //   · ca theo phân bố kho thật  → xấu nhất 5,53%, chỉ 2/100 ca vượt 5%
  //   · ca cực khó (25,6 câu bắt buộc) → tới 11,24%
  //
  // Phần chênh ở ca cực khó là ĐỘ NGUYÊN của phép nới: cận trên được phép mua
  // 0,93 suất lên bảng bằng 250 giây thừa, đời thật mua được 0. Nên khi ca đang
  // ở tình trạng ấy thì nói kèm LÝ DO, chứ đừng bỏ trống cho thầy tự đoán.
  const khoangCach = canTren > 0 && Number.isFinite(canTren) ? Math.max(0, (canTren - lg.giaTri) / canTren) : 0
  if (khoangCach > ch.KHOANG_CACH_DOI_NGAU_TOI_DA) {
    // In bằng PHÂN SỐ, không bằng phần trăm trần: luật "mọi % phải kèm cỡ mẫu"
    // của giáo án không có danh sách trừ, và danh sách trừ là chỗ để lách.
    const vi = thuaGio ? ' Phần lớn là do danh sách bắt buộc chữa đã ăn gần hết ngân sách.' : ''
    canhBao.push(`Giáo án đạt ${lg.giaTri.toFixed(2)} / cận trên nới ${canTren.toFixed(2)}.${vi}`)
  }
  // Chỉ nói "kịch trần" khi phần thừa ĐÁNG KỂ. Giáo án dùng 4 291/4 320 giây mà
  // vẫn báo "kịch trần thừa 29 giây" thì chỉ là tiếng ồn.
  if (!conMua && B - lg.giay > B * ch.KHOANG_CACH_DOI_NGAU_TOI_DA && reNhat > 0) {
    canhBao.push(
      `Giáo án kịch trần: thừa ${B - lg.giay} giây nhưng nước đi rẻ nhất còn lại tốn ${reNhat} giây. Muốn dùng nốt thì hạ trần em lên bảng hoặc rút giờ mỗi em.`,
    )
  }

  return {
    dong,
    tongGiay: lg.giay,
    nganSach: B,
    tongGiaTri: lg.giaTri,
    canTrenNoi: Number.isFinite(canTren) ? canTren : lg.giaTri,
    khoangCachDoiNgau: khoangCach,
    lambda: hi,
    soVong,
    soEmLenBang: soL3Dung,
    conMuaDuoc: conMua,
    thuaGio,
    canhBao,
  }
}

/** Còn nâng được câu nào lên lane đắt hơn mà vẫn trong ngân sách không.
 *
 * `false` nghĩa là giáo án đã KỊCH TRẦN những gì luật cho phép — thừa giờ lúc
 * ấy là hệ quả của chính luật "sao 0 ⇒ lane ≤ L1", không phải thuật toán bỏ
 * sót. Xem ghi chú mâu thuẫn ở phép kiểm 8.6. */
function conMuaDuocNuocNao(
  giayDaDung: number,
  nganSach: number,
  lane: Lane[],
  chophep: Lane[][],
  giayLane: (l: Lane) => number,
): boolean {
  for (let i = 0; i < lane.length; i++) {
    for (const l of chophep[i]) {
      if (soBacLane(l, lane[i]) <= 0) continue
      if (giayDaDung + giayLane(l) - giayLane(lane[i]) <= nganSach) return true
    }
  }
  return false
}

/** Nước đi RẺ NHẤT còn lại tốn bao nhiêu giây — để câu "thừa 250 giây" đi kèm
 * ngay câu "mà rẻ nhất cũng 270 giây". Không có nước nào thì 0. */
function nuocDiReNhat(lane: Lane[], chophep: Lane[][], giayLane: (l: Lane) => number): number {
  let re = 0
  for (let i = 0; i < lane.length; i++) {
    for (const l of chophep[i]) {
      if (soBacLane(l, lane[i]) <= 0) continue
      const d = giayLane(l) - giayLane(lane[i])
      if (d > 0 && (re === 0 || d < re)) re = d
    }
  }
  return re
}

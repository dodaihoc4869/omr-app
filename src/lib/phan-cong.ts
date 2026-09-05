// PHÂN CÔNG GỌI LÊN BẢNG — nhận dữ liệu từ CẢ ca kiểm tra lẫn ca chẩn đoán.
// Đặc tả MOCAVAGOILENBANG.md mục 5 và 6. Thay mục 4 của CA-THI-VA-GOI-LEN-BANG.
//
// Bản cũ (`phan-cau-len-bang.ts`) giả định MỌI EM LÀM CÙNG MỘT ĐỀ. Ca chẩn đoán
// phá giả định đó, nên ba chỗ phải sửa:
//
//   1. CÓ CÂU CHỈ VÀI EM LÀM. Câu riêng chỉ 4 em làm, ba em sai thì
//      tiLeDung = 0,25 — nhìn như câu cực khó, thực ra chỉ là mẫu quá nhỏ. Nên
//      mọi chỉ số tính từ bài làm phải nhân ĐỘ TIN CẬY = min(1, soEmLam/8).
//      `sao` KHÔNG nhân độ tin cậy: sao chấm sẵn trong kho, không phụ thuộc số
//      em làm.
//      Câu doTinCay < 0,8 không được xếp `giảng cả lớp` hay `chỉ đọc đáp án` —
//      hai nhãn đó là kết luận về CẢ LỚP, mẫu nhỏ không đủ tư cách kết luận.
//
//   2. CÓ CÂU KHÔNG EM NÀO LÀM. Đề mới 28 câu, ca chẩn đoán chỉ chạm 5 câu. Hơn
//      hai chục câu không có dữ liệu nhưng vẫn có `sao` từ kho. Câu 2 sao chưa
//      ai làm vẫn đáng chữa hơn câu 0 sao mà nửa lớp sai — công thức tự xử lý:
//      phần sao×100 vẫn tính, hai phần kia bằng 0.
//
//   3. THÊM MỨC GHÉP THỨ BA cho em KHÔNG làm câu đó mà yếu đúng chuyên đề ấy.
//      Mức 3 xếp TRÊN mức 4 có chủ ý: em chưa làm mà yếu chuyên đề đó thì đang
//      hổng thật; em làm đúng thì ít nhất câu ấy em qua được.
//
// Giữ nguyên `mucDoNenGoi` và hai ràng buộc cứng của bản cũ. `chuanChuyenDe` và
// `mucDoNenGoi` dùng lại từ `goi-len-bang.ts` — một nguồn sự thật, không chép.
import { BAC, chuanChuyenDe, mucDoNenGoi, type MucDo } from './goi-len-bang'

export { BAC, chuanChuyenDe, mucDoNenGoi }
export type { MucDo }

export type PhanDe = 'I' | 'II' | 'III'

export interface CauChua {
  id: string
  phan: PhanDe
  so: number
  chuyenDe: string
  mucDo: MucDo | ''
  tomTat: string
  viTri: number
  sao: 0 | 1 | 2
  lyDoSao: string
}

/** Một em làm một câu. Ca chẩn đoán chỉ sinh bản ghi cho câu em THẬT SỰ làm. */
export interface BaiLam {
  sbd: string
  idCau: string
  dung: boolean
  chon?: string
}

export interface EmGoi {
  sbd: string
  hoTen: string
  coMat: boolean
  /** Hồ sơ tích luỹ, không phải chỉ ca gần nhất. */
  chuyenDe: { ten: string; soCau: number; soSai: number }[]
  /** Số lần đã được gọi ở từng chuyên đề — để nâng bậc khó dần. */
  daGoiTheoCd: Record<string, number>
  /** Câu đã gọi hoặc đã chữa với chính em này. */
  daGoiCau: string[]
  /** Số lượt đã lên bảng trong lịch sử — em ít lên được ưu tiên. */
  soLanLenBang: number
}

export type NhomCau = 'giang_ca_lop' | 'chi_doc_dap_an' | 'dang_chua'
export type MucGhep = 1 | 2 | 3 | 4 | 5

export interface ThongKeCau {
  cau: CauChua
  soEmLam: number
  soSai: number
  tiLeDung: number
  /** Tỉ lệ em SAI cùng chọn một phương án — cả lớp cùng một hiểu nhầm. */
  doChum: number
  doTinCay: number
  diem: number
  nhom: NhomCau
}

export interface DongPhanCong {
  luot: number
  sbd: string
  hoTen: string
  cau: CauChua
  muc: MucGhep
  mucDoNham: MucDo
  viSao: string
}

export interface KetQuaPhanCong {
  thongKe: ThongKeCau[]
  giangCaLop: ThongKeCau[]
  chiDocDapAn: ThongKeCau[]
  phanCong: DongPhanCong[]
  chuaPhan: ThongKeCau[]
  emChuaGoi: string[]
  canhBao: string[]
}

export interface YeuCauPhanCong {
  /** Số em tối thiểu làm một câu thì chỉ số của câu mới đáng tin. */
  nguongTinCay: number
  /** doChum từ mức này trở lên thì giảng cả lớp, không gọi lên bảng. */
  nguongChum: number
  /** tiLeDung từ mức này trở lên thì chỉ đọc đáp án. */
  nguongDe: number
  soLuot: number
  seed: number
}

export const MAC_DINH: YeuCauPhanCong = {
  nguongTinCay: 8,
  nguongChum: 0.35,
  nguongDe: 0.85,
  soLuot: 4,
  seed: 1,
}

/** Dưới mức này thì không đủ tư cách kết luận về cả lớp. */
export const NGUONG_KET_LUAN = 0.8

// ---------------------------------------------------------------- tiện ích

function bam(s: string, seed: number): number {
  let h = seed >>> 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h / 4294967296
}

/** Ba chuyên đề em yếu nhất, xếp theo số câu sai rồi tỉ lệ sai. */
export function topYeu(em: EmGoi, n = 3): string[] {
  return [...em.chuyenDe]
    .filter((c) => c.soCau > 0 && c.soSai > 0)
    .sort((a, b) => b.soSai - a.soSai || b.soSai / b.soCau - a.soSai / a.soCau)
    .slice(0, n)
    .map((c) => chuanChuyenDe(c.ten))
}

/** Tỉ lệ sai của em ở MỘT chuyên đề, tính trên hồ sơ tích luỹ. Không có số thì
 * 0,5 — không đoán em giỏi, cũng không đoán em dốt. */
export function tiLeSaiChuyenDe(em: EmGoi, cd: string): number {
  return tiLeSaiCd(em, cd)
}

function tiLeSaiCd(em: EmGoi, cd: string): number {
  const t = em.chuyenDe.find((c) => chuanChuyenDe(c.ten) === chuanChuyenDe(cd))
  return t && t.soCau > 0 ? t.soSai / t.soCau : 0.5
}

function hopMuc(cau: CauChua, nham: MucDo): number {
  if (!cau.mucDo) return 1
  return cau.mucDo === nham ? 2 : Math.abs(BAC.indexOf(cau.mucDo) - BAC.indexOf(nham)) === 1 ? 1 : 0
}

// ------------------------------------------------------ 1. thống kê từng câu

export function thongKeCau(dsCau: CauChua[], baiLam: BaiLam[], yc: YeuCauPhanCong = MAC_DINH): ThongKeCau[] {
  const theoCau = new Map<string, BaiLam[]>()
  for (const b of baiLam) {
    const a = theoCau.get(b.idCau)
    if (a) a.push(b)
    else theoCau.set(b.idCau, [b])
  }
  return dsCau.map((cau) => {
    const bl = theoCau.get(cau.id) || []
    const soEmLam = bl.length
    const sai = bl.filter((b) => !b.dung)
    const tiLeDung = soEmLam ? (soEmLam - sai.length) / soEmLam : 0
    // độ chụm: nhóm em sai theo phương án đã chọn, lấy nhóm đông nhất
    const dem = new Map<string, number>()
    for (const b of sai) if (b.chon) dem.set(b.chon, (dem.get(b.chon) || 0) + 1)
    const dongNhat = Math.max(0, ...dem.values())
    const doChum = soEmLam ? dongNhat / soEmLam : 0
    const doTinCay = Math.min(1, soEmLam / yc.nguongTinCay)
    const diem = cau.sao * 100 + (1 - tiLeDung) * 50 * doTinCay + doChum * 30 * doTinCay
    let nhom: NhomCau = 'dang_chua'
    if (doTinCay >= NGUONG_KET_LUAN && doChum >= yc.nguongChum) nhom = 'giang_ca_lop'
    else if (doTinCay >= NGUONG_KET_LUAN && tiLeDung >= yc.nguongDe) nhom = 'chi_doc_dap_an'
    else if (doTinCay >= NGUONG_KET_LUAN && cau.sao === 0 && tiLeDung >= 0.7) nhom = 'chi_doc_dap_an'
    return { cau, soEmLam, soSai: sai.length, tiLeDung, doChum, doTinCay, diem, nhom }
  })
}

// -------------------------------------------------------- 2. ghép em với câu

export function mucGhep(em: EmGoi, tk: ThongKeCau, baiLam: BaiLam[]): MucGhep {
  const cua = baiLam.find((b) => b.sbd === em.sbd && b.idCau === tk.cau.id)
  const yeu = topYeu(em).includes(chuanChuyenDe(tk.cau.chuyenDe))
  if (cua && !cua.dung) return yeu ? 1 : 2
  if (!cua) return yeu ? 3 : 5
  return yeu ? 4 : 5
}

export function phanCong(dsCau: CauChua[], baiLam: BaiLam[], dsEm: EmGoi[], yc: YeuCauPhanCong = MAC_DINH): KetQuaPhanCong {
  const canhBao: string[] = []
  const tk = thongKeCau(dsCau, baiLam, yc)
  const giangCaLop = tk.filter((t) => t.nhom === 'giang_ca_lop').sort((a, b) => b.diem - a.diem)
  const chiDocDapAn = tk.filter((t) => t.nhom === 'chi_doc_dap_an')
  const dangChua = tk.filter((t) => t.nhom === 'dang_chua').sort((a, b) => b.diem - a.diem)

  const coMat = dsEm.filter((e) => e.coMat)
  if (!coMat.length) canhBao.push('Không em nào có mặt')

  const daPhanCau = new Set<string>()
  const soLanLuot = new Map<string, number>() // em -> đã lên mấy lượt hôm nay
  const phanCongRa: DongPhanCong[] = []

  for (let luot = 1; luot <= yc.soLuot; luot++) {
    const conCau = dangChua.filter((t) => !daPhanCau.has(t.cau.id))
    if (!conCau.length) break
    const daNhanLuotNay = new Set<string>()

    for (const t of conCau) {
      if (daNhanLuotNay.size >= coMat.length) break
      const ungVien = coMat
        .filter((e) => !daNhanLuotNay.has(e.sbd) && !e.daGoiCau.includes(t.cau.id))
        .map((e) => {
          const m = mucGhep(e, t, baiLam)
          const nham = mucDoNenGoi(tiLeSaiCd(e, t.cau.chuyenDe), e.daGoiTheoCd[chuanChuyenDe(t.cau.chuyenDe)] || 0)
          return { e, m, nham, hop: hopMuc(t.cau, nham) }
        })
        .sort(
          (a, b) =>
            a.m - b.m ||
            // CÙNG MỨC THÌ EM YẾU CHUYÊN ĐỀ ĐÓ HƠN ĐƯỢC GỌI TRƯỚC.
            //
            // Chỗ này quan trọng với câu KHÔNG EM NÀO LÀM — câu thầy tự tích để
            // chữa. Lúc ấy mọi em đều ở mức 3 hoặc 5, không có bài làm nào phân
            // biệt; thứ duy nhất còn nói được ai cần câu này nhất là hồ sơ tích
            // luỹ: em sai 8/10 câu Ester phải được gọi trước em sai 2/10.
            tiLeSaiCd(b.e, t.cau.chuyenDe) - tiLeSaiCd(a.e, t.cau.chuyenDe) ||
            (soLanLuot.get(a.e.sbd) || 0) - (soLanLuot.get(b.e.sbd) || 0) ||
            a.e.soLanLenBang - b.e.soLanLenBang ||
            b.hop - a.hop ||
            bam(a.e.sbd + t.cau.id, yc.seed) - bam(b.e.sbd + t.cau.id, yc.seed),
        )
      if (!ungVien.length) continue
      const { e, m, nham } = ungVien[0]
      daNhanLuotNay.add(e.sbd)
      daPhanCau.add(t.cau.id)
      soLanLuot.set(e.sbd, (soLanLuot.get(e.sbd) || 0) + 1)
      phanCongRa.push({
        luot,
        sbd: e.sbd,
        hoTen: e.hoTen,
        cau: t.cau,
        muc: m,
        mucDoNham: nham,
        viSao:
          m === 1
            ? `sai câu này · yếu ${t.cau.chuyenDe}`
            : m === 2
              ? 'sai câu này'
              : m === 3
                ? `không làm câu này · yếu ${t.cau.chuyenDe}`
                : m === 4
                  ? `làm đúng · vẫn yếu ${t.cau.chuyenDe}`
                  : 'chưa được gọi lượt nào',
      })
    }
  }

  const chuaPhan = dangChua.filter((t) => !daPhanCau.has(t.cau.id))
  const daGoi = new Set(phanCongRa.map((p) => p.sbd))
  const emChuaGoi = coMat.filter((e) => !daGoi.has(e.sbd)).map((e) => e.hoTen)
  const itTinCay = tk.filter((t) => t.soEmLam > 0 && t.doTinCay < NGUONG_KET_LUAN).length
  if (itTinCay) canhBao.push(`${itTinCay} câu có dưới ${yc.nguongTinCay} em làm — chỉ số của câu đó chỉ dùng tham khảo`)

  return { thongKe: tk, giangCaLop, chiDocDapAn, phanCong: phanCongRa, chuaPhan, emChuaGoi, canhBao }
}

/** Tên mức độ để in ra màn — thầy đọc là hiểu, không phải tra mã. */
export const TEN_MUC_NHAM: Record<MucDo, string> = { biet: 'nhận biết', hieu: 'thông hiểu', van_dung: 'vận dụng' }

/** Một câu in ra dạng chữ: "Phần I câu 4 ★★ pH và acid-base". */
export function chuCau(c: CauChua): string {
  return `Phần ${c.phan} câu ${c.so}${c.sao ? ' ' + '★'.repeat(c.sao) : ''}${c.chuyenDe ? ` ${c.chuyenDe}` : ''}`
}

/** Câu cả lớp cùng sai một kiểu, nói bằng số: "18/27 em cùng một phương án". */
export function chuChum(t: ThongKeCau): string {
  const cung = Math.round(t.doChum * t.soEmLam)
  return `${t.soSai}/${t.soEmLam} em sai · ${cung}/${t.soEmLam} em cùng một phương án`
}

/** Bảng phân công dạng chữ để thầy copy sang giáo án hoặc nhóm Zalo. */
export function bangChu(kq: KetQuaPhanCong, tenNguon: string): string {
  const d: string[] = [`Gọi lên bảng · ${tenNguon}`]
  if (kq.giangCaLop.length) {
    d.push('', 'GIẢNG CẢ LỚP — không gọi ai lên bảng')
    for (const t of kq.giangCaLop) d.push(`- ${chuCau(t.cau)} (${chuChum(t)})`)
  }
  const theoLuot = new Map<number, DongPhanCong[]>()
  for (const p of kq.phanCong) {
    const a = theoLuot.get(p.luot)
    if (a) a.push(p)
    else theoLuot.set(p.luot, [p])
  }
  for (const [luot, ds] of [...theoLuot.entries()].sort((a, b) => a[0] - b[0])) {
    d.push('', `LƯỢT ${luot}`)
    for (const p of ds) d.push(`- ${chuCau(p.cau)} → ${p.hoTen || `SBD ${p.sbd}`} (${p.viSao} · nhắm ${TEN_MUC_NHAM[p.mucDoNham]})`)
  }
  if (kq.chiDocDapAn.length) {
    d.push('', 'CHỈ ĐỌC ĐÁP ÁN')
    for (const t of kq.chiDocDapAn) d.push(`- ${chuCau(t.cau)} (${Math.round(t.tiLeDung * 100)}% em làm đúng)`)
  }
  if (kq.emChuaGoi.length) d.push('', `${kq.emChuaGoi.length} em chưa được gọi lượt nào: ${kq.emChuaGoi.join(', ')}`)
  for (const c of kq.canhBao) d.push(`⚠ ${c}`)
  return d.join('\n')
}

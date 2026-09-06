// DỰNG PHIẾU CHO CẢ MỘT CA — lõi dùng chung giữa màn Chi tiết ca và cầu nối
// `window.__ddh` (APP-CAN-MO-DUONG-CHO-COWORK.md mục 3).
//
// Vì sao tách ra khỏi màn hình: cùng một cái phiếu mà hai nơi dựng bằng hai
// đoạn mã thì sớm muộn hai nơi ra hai kết quả khác nhau — hạng lớp lệch, sĩ số
// lệch, hoặc một bên quên `qidDaLam`. Màn hình có sẵn dữ liệu trong bộ nhớ nên
// truyền thẳng vào `dungPhieuChoEm`; cầu nối không có gì trong tay nên
// `taoPhieuCaCa` đi gom đủ trước rồi gọi đúng lõi đó.
import { classify } from '../engine/score'
import { mergeKeepAnswers, type SoCauMoiPhan, type TeacherExamSource } from '../data/examContent'
import {
  chiTietCa,
  hoSoNhieuEm,
  luuNhieuPhieu,
  phieuTheoCa,
  sinhMaPhieu,
  type LuotThiRow,
  type PhieuCanLuu,
} from './exam-api'
import { taoChiTietCau } from './chi-tiet-cau'
import { chuyenDeTuChiTiet } from './phieu-hang-loat'
import { viecCanLamMacDinh } from './phieu-zalo'
import { dungPhieu, giamGoiPhieu } from './phieu-du-lieu'
import { taoLinkPhieu } from './phieu-link'
import { BAN_PHIEU_BT, type GoiPhieuBaiTap } from '../components/NutPhieuHtml'
import { gomLinkPhieu, type DongLinkPhieu } from './link-phieu-ca'
import { gradeSubmissionFull, type GradedSubmission } from './exam-grade'
import { docSoCauCa, loadExamSources, loadSessionTeacherBank, luuSoCauCa, saveSessionTeacherBank } from './exam-db'
import { loadClassList } from './classlist-db'

/** Phần thông tin CA mà một phiếu cần. Chỉ những trường thật sự dùng tới. */
export interface CaChoPhieu {
  maCa: string
  tenCa: string
  lop: string
  thoiGianPhut: number | null
  nguongLan: number | string | null
  nguongGiay: number | string | null
}

/** Một em ĐÃ CHẤM ĐƯỢC. `graded` là điều kiện: chưa chấm thì không có phiếu. */
export interface EmChoPhieu {
  sbd: string
  hoTen: string
  lop: string
  moiNhat: LuotThiRow
  graded: GradedSubmission
  diem: number | null
}

export interface KetQuaDungPhieu {
  dong: DongLinkPhieu[]
  loi: { sbd: string; vi_sao: string }[]
}

type KeyBankGop = ReturnType<typeof mergeKeepAnswers>

/** HẠNG LỚP tính từ bảng điểm của chính ca này. Đồng điểm thì đồng hạng. */
export function hangTrongCa(daCham: { sbd: string; diem: number | null }[]): Map<string, number> {
  const xep = [...daCham].sort((a, b) => (b.diem ?? 0) - (a.diem ?? 0))
  const hangCua = new Map<string, number>()
  xep.forEach((e, i) => {
    const truoc = i > 0 ? xep[i - 1] : null
    hangCua.set(e.sbd, truoc && truoc.diem === e.diem ? hangCua.get(truoc.sbd)! : i + 1)
  })
  return hangCua
}

/** LÕI: dựng và cất phiếu cho danh sách SBD chỉ định, trả về dòng link.
 *
 * Hai chỗ gộp để đỡ tải máy chủ: hồ sơ lấy MỘT lệnh cho cả danh sách
 * (`hoSoNhieuEm`), phiếu cất theo GÓI (`luuNhieuPhieu`) chứ không từng em. */
export async function dungPhieuChoEm(
  url: string,
  mat: string,
  ca: CaChoPhieu,
  keyBank: KeyBankGop,
  daCham: EmChoPhieu[],
  dsSbd: string[],
  goc: string,
  tien: (da: number, tong: number) => void = () => {},
): Promise<KetQuaDungPhieu> {
  if (dsSbd.length === 0) return { dong: [], loi: [] }
  const hangCua = hangTrongCa(daCham)

  tien(0, dsSbd.length)
  const [hoSoDs, khoDe] = await Promise.all([hoSoNhieuEm(url, mat, dsSbd), loadExamSources().catch(() => [])])
  const hoSoCua = new Map(hoSoDs.map((h) => [h.em.sbd, h]))

  const canLuu: PhieuCanLuu[] = []
  /** Mã của các phiếu KẾT QUẢ — để lọc khỏi phiếu bài tập lúc trả dòng link. */
  const maKetQua = new Set<string>()
  const loi: { sbd: string; vi_sao: string }[] = []
  for (const sbd of dsSbd) {
    const e = daCham.find((x) => x.sbd === sbd)
    const ho = hoSoCua.get(sbd)
    // Không đoán: thiếu thứ gì thì nói thiếu thứ đó, đừng im lặng bỏ em ra.
    if (!e || !e.moiNhat.dapAn || !e.graded) {
      loi.push({ sbd, vi_sao: 'Chưa chấm được bài của em này' })
      continue
    }
    if (!ho) {
      loi.push({ sbd, vi_sao: 'Máy chủ không trả hồ sơ của em này' })
      continue
    }
    const rows = taoChiTietCau(keyBank, ca.maCa, sbd, e.moiNhat.dapAn, e.moiNhat.giayCau)
    const cd = chuyenDeTuChiTiet(rows)
    const sc = e.graded.score
    const caCuaEm = {
      maCa: ca.maCa,
      tenCa: ca.tenCa || '',
      lop: e.lop || ca.lop || '',
      lanThu: e.moiNhat.lanThu,
      nopLuc: e.moiNhat.nopLuc || new Date().toISOString(),
      trangThai: e.moiNhat.trangThai,
      diemI: sc.phanIScore,
      diemII: sc.phanIIScore,
      diemIII: sc.phanIIIScore,
      tong: sc.total,
      hang: hangCua.get(sbd) ?? null,
      siSo: daCham.length,
      soLanRoiMan: e.moiNhat.soLanRoiMan || 0,
    }
    const cdSai = cd.filter((c) => c.soSai > 0)
    const phieu = dungPhieu({
      hoSo: ho,
      ca: caCuaEm,
      chuyenDeCa: cd,
      vieCanLam: viecCanLamMacDinh({
        hoTen: e.hoTen,
        ngay: e.moiNhat.nopLuc,
        diem: sc.total,
        xepLoai: classify(sc.total),
        soCauSai: rows.filter((r) => r.dungSai === false).length,
        chuyenDeSai: cdSai[0] ? { ten: cdSai[0].ten, soSai: cdSai[0].soSai } : null,
        baiTapDaGiao: null,
      }),
      rows,
      // `mergeKeepAnswers` trả bộ đề gộp KHÔNG có `maDe`; gắn mã ca vào cho
      // đúng kiểu, và mã câu trong phiếu cũng đọc ra đúng ca.
      banks: [{ maDe: ca.maCa, ...keyBank }],
      diemLop: daCham.map((x) => x.diem).filter((d): d is number => typeof d === 'number'),
      thoiLuongPhut: ca.thoiGianPhut ?? null,
      vaoLuc: e.moiNhat.vaoLuc ?? null,
      khoDe,
      // Câu em VỪA LÀM trong ca này — bài luyện kèm theo không lặp lại chúng.
      // Không gọi `qidDaLam` từng em: thêm một lượt gọi cho mỗi em, mà phần
      // lớn giá trị của phép loại trừ nằm ở đúng ca vừa thi.
      qidDaLam: rows.map((r) => r.qid).filter(Boolean),
      viPham: {
        soLan: e.moiNhat.soLanRoiMan || 0,
        tongGiay: e.moiNhat.tongGiayRoiMan || 0,
        daKhoa: e.moiNhat.trangThai === 'khoa',
        lyDoKhoa: e.moiNhat.integrity?.lyDoKhoa ?? null,
        nguong: ca.nguongLan && ca.nguongGiay ? { lan: Number(ca.nguongLan), giay: Number(ca.nguongGiay) } : null,
        events: e.moiNhat.integrity?.events ?? null,
      },
    })
    // PHIẾU BÀI TẬP CẤT RIÊNG, có link riêng.
    //
    // HỒI QUY 06/09 — thầy báo báo cáo mất hai nút copy link đề và lời giải.
    // Hai nút đó chỉ hiện khi phiếu có `linkBaiTap`, mà trước đây chỉ
    // `PhieuZaloEm` (mở hồ sơ TỪNG EM) mới dựng. Lõi dựng cả ca này bỏ sót nó,
    // nên phiếu tạo hàng loạt không có link và hai nút biến mất.
    //
    // Link báo cáo có điểm và nhận xét của thầy; chuyển tiếp nguyên cho con là
    // sai đối tượng — nên bài tập phải là một phiếu riêng.
    if (phieu.baiTap && phieu.baiTap.length > 0) {
      const maBt = sinhMaPhieu()
      const sai = phieu.chuyenDeCa.filter((c) => c.soSai > 0)
      const goiBt: GoiPhieuBaiTap = {
        v: BAN_PHIEU_BT,
        loai: 'baitap',
        tt: {
          hoTen: phieu.hoTen || `SBD ${phieu.sbd}`,
          sbd: phieu.sbd,
          ngay: new Date(),
          tenChuyenDe: sai[0]?.ten || phieu.chuyenDeCa[0]?.ten || 'Hoá học',
          ketQua: '',
          hienDapAn: false,
          nhanBia: 'Bài luyện theo đúng chỗ em mất điểm',
          oBia: [
            { nhan: 'Học sinh', gia: phieu.hoTen || `SBD ${phieu.sbd}` },
            { nhan: 'SBD', gia: phieu.sbd },
            ...(phieu.tenCa ? [{ nhan: 'Sau bài', gia: phieu.tenCa }] : []),
            { nhan: 'Số câu', gia: `${phieu.baiTap.length} câu` },
          ],
        },
        cau: phieu.baiTap,
      }
      canLuu.push({ ma: maBt, maCa: ca.maCa, sbd, hoTen: e.hoTen, phieu: goiBt, loai: 'baitap' })
      // Gắn link TRƯỚC khi gói phiếu kết quả — `linkBaiTap` nằm trong gói đó.
      phieu.linkBaiTap = taoLinkPhieu(goc, maBt)
    }

    const { phieu: goiGui } = giamGoiPhieu(phieu)
    const maKq = sinhMaPhieu()
    maKetQua.add(maKq)
    canLuu.push({ ma: maKq, maCa: ca.maCa, sbd, hoTen: e.hoTen, phieu: goiGui, loai: 'ketqua' })
  }

  if (canLuu.length === 0) return { dong: [], loi }
  const kq = await luuNhieuPhieu(url, mat, canLuu)
  tien(kq.daLuu.length, dsSbd.length)
  const nay = new Date().toISOString()
  return {
    // CHỈ dòng của phiếu KẾT QUẢ. Mỗi em nay cất hai phiếu (kết quả + bài tập);
    // trả cả hai là thầy copy ra hai link mỗi em, và link bài tập không có
    // điểm — gửi nhầm cho phụ huynh là gửi thiếu.
    dong: kq.daLuu
      .filter((x) => maKetQua.has(x.ma))
      .map((x) => ({
        sbd: x.sbd,
        hoTen: daCham.find((e) => e.sbd === x.sbd)?.hoTen || x.sbd,
        ma: x.ma,
        link: taoLinkPhieu(goc, x.ma),
        soLanXem: 0,
        taoLuc: nay,
      })),
    loi: [...loi, ...kq.loi],
  }
}

// ---------------------------------------------------------------------------
// ĐƯỜNG VÀO CHO CẦU NỐI: không có gì trong tay, phải tự gom đủ.

export interface CaDaGom {
  ca: CaChoPhieu
  keyBank: KeyBankGop
  daCham: EmChoPhieu[]
}

/** Gom đủ dữ liệu một ca: thông tin ca + bộ đề CÓ đáp án + danh sách em đã chấm.
 *
 * Bộ đề ưu tiên bản đã cất ở máy này; ca mở ở máy khác thì XIN từ máy chủ rồi
 * cất lại — giống hệt màn Chi tiết ca, để hai nơi không ra hai bảng điểm. */
export async function gomCa(url: string, mat: string, maCa: string): Promise<CaDaGom> {
  const ma = maCa.trim()
  const banksCu = await loadSessionTeacherBank(ma)
  const ct = await chiTietCa(url, mat, ma, !banksCu)

  let bank: TeacherExamSource[] | null = banksCu ?? null
  if (!bank && ct.keyBank && (ct.keyBank.phanI.length || ct.keyBank.phanII.length || ct.keyBank.phanIII.length)) {
    bank = [{ maDe: ct.ca.maCa, phanI: ct.keyBank.phanI, phanII: ct.keyBank.phanII, phanIII: ct.keyBank.phanIII }]
    await saveSessionTeacherBank(ma, bank)
  }
  if (!bank || bank.length === 0) {
    throw new Error('Máy này chưa có bản đề CÓ đáp án của ca — mở ca ở máy khác thì bấm vào ca đó một lần trong app trước')
  }

  const scLocal = await docSoCauCa(ma)
  const scServer = (ct.keyBank as { soCau?: SoCauMoiPhan } | undefined)?.soCau
  const sc = scLocal ?? (scServer && scServer.I + scServer.II + scServer.III > 0 ? scServer : undefined)
  if (!scLocal && sc) await luuSoCauCa(ma, sc)

  const dsLop = await loadClassList().catch(() => [])
  const theoSbd = new Map<string, LuotThiRow[]>()
  for (const l of ct.luot) {
    const arr = theoSbd.get(l.sbd) ?? []
    arr.push(l)
    theoSbd.set(l.sbd, arr)
  }
  const daCham: EmChoPhieu[] = []
  theoSbd.forEach((arr, sbd) => {
    arr.sort((a, b) => b.lanThu - a.lanThu)
    const moiNhat = arr[0]
    if (!moiNhat.dapAn || (moiNhat.trangThai !== 'da_nop' && moiNhat.trangThai !== 'khoa')) return
    let graded: GradedSubmission | null = null
    try {
      graded = gradeSubmissionFull(bank!, ct.ca.maCa, sbd, moiNhat.dapAn, sc)
    } catch {
      graded = null
    }
    if (!graded) return
    const hs = dsLop.find((c) => c.sbd === sbd)
    daCham.push({
      sbd,
      hoTen: hs?.hoTen ?? moiNhat.hoTen ?? '',
      lop: hs?.lop ?? '',
      moiNhat,
      graded,
      diem: graded.score.total,
    })
  })

  return {
    ca: {
      maCa: ct.ca.maCa,
      tenCa: ct.ca.tenCa || '',
      lop: ct.ca.lop || '',
      thoiGianPhut: ct.ca.thoiGianPhut ?? null,
      nguongLan: ct.ca.nguongLan ?? null,
      nguongGiay: ct.ca.nguongGiay ?? null,
    },
    keyBank: mergeKeepAnswers(bank, sc),
    daCham,
  }
}

export interface KetQuaTaoPhieuCaCa {
  /** Mọi em đã chấm của ca, kèm mã phiếu (cũ hoặc vừa tạo). */
  dong: DongLinkPhieu[]
  /** Số phiếu VỪA tạo trong lượt gọi này. Gọi lại lần hai phải ra 0. */
  soMoi: number
  loi: { sbd: string; vi_sao: string }[]
}

/** TẠO PHIẾU CHO CẢ CA rồi trả về link của mọi em đã chấm.
 *
 * Em ĐÃ CÓ phiếu thì giữ nguyên mã cũ, không tạo thêm — gọi lại lần thứ hai
 * không đẻ phiếu trùng (tiêu chí nghiệm thu 4). */
export async function taoPhieuCaCa(
  url: string,
  mat: string,
  maCa: string,
  goc: string,
  tien: (da: number, tong: number) => void = () => {},
): Promise<KetQuaTaoPhieuCaCa> {
  const { ca, keyBank, daCham } = await gomCa(url, mat, maCa)
  const daCo = await phieuTheoCa(url, mat, ca.maCa)
  // Dùng đúng `gomLinkPhieu` của màn Chi tiết ca: một chỗ quyết định phiếu nào
  // là bản mới nhất của em, không đẻ luật thứ hai ở đây.
  const g = gomLinkPhieu(
    daCham.map((e) => ({ sbd: e.sbd, hoTen: e.hoTen })),
    daCo,
    goc,
  )
  const thieu = g.chuaCoPhieu.map((x) => x.sbd)
  const kq = thieu.length > 0 ? await dungPhieuChoEm(url, mat, ca, keyBank, daCham, thieu, goc, tien) : { dong: [], loi: [] }
  const theoSbd = new Map<string, DongLinkPhieu>()
  for (const d of [...g.dong, ...kq.dong]) theoSbd.set(d.sbd, d)

  const dong: DongLinkPhieu[] = []
  for (const e of daCham) {
    const d = theoSbd.get(e.sbd)
    if (d) dong.push({ ...d, hoTen: e.hoTen || d.hoTen })
  }
  return { dong, soMoi: kq.dong.length, loi: kq.loi }
}

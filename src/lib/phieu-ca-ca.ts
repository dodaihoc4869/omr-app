// DỰNG PHIẾU CHO CẢ MỘT CA — lõi dùng chung giữa màn Chi tiết ca và cầu nối
// `window.__ddh` (APP-CAN-MO-DUONG-CHO-COWORK.md mục 3).
//
// Vì sao tách ra khỏi màn hình: cùng một cái phiếu mà hai nơi dựng bằng hai
// đoạn mã thì sớm muộn hai nơi ra hai kết quả khác nhau — hạng lớp lệch, sĩ số
// lệch, hoặc một bên quên `qidDaLam`. Màn hình có sẵn dữ liệu trong bộ nhớ nên
// truyền thẳng vào `dungPhieuChoEm`; cầu nối không có gì trong tay nên
// `taoPhieuCaCa` đi gom đủ trước rồi gọi đúng lõi đó.
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
import { pick } from './exam-assign'
import { chuyenDeTuChiTiet } from './phieu-hang-loat'
import { nhanXetTheoCa } from './nhan-xet-theo-ca'
import { thongKeLamBai, tinHieuLamBai } from './phan-tich-lam-bai'
import { dungPhieu, giamGoiPhieu } from './phieu-du-lieu'
import { taoLinkPhieu } from './phieu-link'
import { BAN_PHIEU_BT, type GoiPhieuBaiTap } from '../components/NutPhieuHtml'
import { gomLinkPhieu, type DongLinkPhieu } from './link-phieu-ca'
import { gradeSubmissionFull, type GradedSubmission } from './exam-grade'
import { docDeRiengCa, docSoCauCa, loadExamSources, loadSessionTeacherBank, luuSoCauCa, saveSessionTeacherBank } from './exam-db'
import { loadClassList } from './classlist-db'

/** Phần thông tin CA mà một phiếu cần. Chỉ những trường thật sự dùng tới. */
export interface CaChoPhieu {
  maCa: string
  tenCa: string
  lop: string
  thoiGianPhut: number | null
  nguongLan: number | string | null
  nguongGiay: number | string | null
  /** Ca ĐỀ RIÊNG TỪNG EM — báo cáo của ca đó tắt hạng và phân bố lớp bất kể
   * cấu hình, vì mỗi em một bộ câu thì so điểm với nhau không còn nghĩa. */
  deRieng?: boolean
  /** CÂU LẶP của ca: sbd → qid → số lần em đã sai câu đó TRƯỚC ca này. Nguồn
   * DUY NHẤT của nhãn "Sai lần thứ N" và "Đã sửa được". */
  lapCua?: Record<string, Record<string, number>>
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

/** CỜ CHẨN ĐOÁN CHO THẦY — hiện ở màn Ca thi, KHÔNG in cho phụ huynh.
 *
 * Đặc tả RUT-CAU-CHUA-THEO-NGUYEN-NHAN mục "màn hình": em bị chẩn là hết giờ
 * thì phiếu KHÔNG kê câu kiến thức, và thầy phải thấy đúng một dòng nói ra
 * chuyện đó — bằng không việc bỏ câu diễn ra trong im lặng. */
export interface CoChanDoanEm {
  sbd: string
  hoTen: string
  chu: string
}

export interface KetQuaDungPhieu {
  dong: DongLinkPhieu[]
  loi: { sbd: string; vi_sao: string }[]
  co: CoChanDoanEm[]
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
  /** MỌI mã phiếu ĐÃ CÓ của từng em, để lượt dựng lại GIỮ NGUYÊN link đã gửi
   * phụ huynh. Thiếu map này thì mỗi lần dựng lại là một link mới, link cũ
   * trong Zalo thành link chết.
   *
   * MẢNG chứ không phải một mã — thầy bắt được 07/09: có em mang HAI phiếu kết
   * quả (dựng hàng loạt một lần, mở hồ sơ riêng dựng thêm một lần). Bản cũ giữ
   * đúng một mã nên lượt dựng lại chỉ đè được một cái, cái còn lại giữ nguyên
   * nội dung cũ. Thầy đã gửi phụ huynh mã nào thì không ai biết, nên phải đè
   * lên TẤT CẢ. */
  maCu?: Map<string, { ketqua: string[]; baitap: string[] }>,
): Promise<KetQuaDungPhieu> {
  if (dsSbd.length === 0) return { dong: [], loi: [], co: [] }
  const hangCua = hangTrongCa(daCham)

  tien(0, dsSbd.length)
  const [hoSoDs, khoDe] = await Promise.all([hoSoNhieuEm(url, mat, dsSbd), loadExamSources().catch(() => [])])
  const hoSoCua = new Map(hoSoDs.map((h) => [h.em.sbd, h]))

  // BẢNG CHẤM CỦA CẢ LỚP, dựng MỘT LẦN trước vòng lặp. Báo cáo v3 dùng nó để
  // nói "6/10 bạn cùng sai câu này" — câu cả lớp cùng sai một phương án là bẫy
  // của đề, không phải lỗi riêng của em, và phụ huynh cần biết điều đó.
  //
  // Dựng trong vòng lặp thì mỗi em một lần chấm lại cả lớp: 21 em thành 441
  // lượt dựng. Ngoài vòng lặp là đúng một lượt.
  const rowsLop = daCham
    .filter((e) => e.moiNhat.dapAn)
    .flatMap((e) => taoChiTietCau(keyBank, ca.maCa, e.sbd, e.moiNhat.dapAn!, e.moiNhat.giayCau))

  const canLuu: PhieuCanLuu[] = []
  /** Mã của các phiếu KẾT QUẢ — để lọc khỏi phiếu bài tập lúc trả dòng link. */
  const maKetQua = new Set<string>()
  const loi: { sbd: string; vi_sao: string }[] = []
  const coChanDoan: CoChanDoanEm[] = []
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
      // Trần từng phần lấy thẳng từ bộ chấm, không tính lại ở đây — hai chỗ
      // tính là hai chỗ lệch.
      tranPhan: { I: sc.quota.I / 100, II: sc.quota.II / 100, III: sc.quota.III / 100 },
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
      // NHẬN XÉT VIẾT SAU, xem ngay dưới: nó cần biết phiếu kèm bao nhiêu câu
      // khắc phục, mà con số đó do `dungPhieu` tính ra.
      vieCanLam: '',
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
      rowsLop,
      deRieng: ca.deRieng === true,
      lapCua: ca.lapCua?.[sbd] ?? null,
      viPham: {
        soLan: e.moiNhat.soLanRoiMan || 0,
        tongGiay: e.moiNhat.tongGiayRoiMan || 0,
        daKhoa: e.moiNhat.trangThai === 'khoa',
        lyDoKhoa: e.moiNhat.integrity?.lyDoKhoa ?? null,
        nguong: ca.nguongLan && ca.nguongGiay ? { lan: Number(ca.nguongLan), giay: Number(ca.nguongGiay) } : null,
        events: e.moiNhat.integrity?.events ?? null,
      },
    })
    for (const c of phieu.chanDoanCo ?? []) coChanDoan.push({ sbd, hoTen: e.hoTen || sbd, chu: c.chu })
    // NHẬN XÉT RIÊNG CHO CA NÀY (thầy chốt 07/09). Viết SAU `dungPhieu` vì
    // phần "việc phải làm" phải nêu đúng số câu khắc phục phiếu đang kèm.
    phieu.vieCanLam = nhanXetTheoCa({
      ngay: e.moiNhat.nopLuc || '',
      tenCa: ca.tenCa || '',
      soCauSai: rows.filter((r) => r.dungSai === false).length,
      tongSoCau: rows.length,
      chuyenDeSai: cdSai.map((c) => ({ ten: c.ten, soCau: c.soCau, soSai: c.soSai })),
      tinHieu: rows.length
        ? tinHieuLamBai(thongKeLamBai(rows, { vaoLuc: e.moiNhat.vaoLuc, nopLuc: e.moiNhat.nopLuc, thoiLuongPhut: ca.thoiGianPhut }))
        : [],
      soCauChua: phieu.baiTap?.length ?? 0,
      xung: 'con',
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
      const dsBt = maCu?.get(sbd)?.baitap ?? []
      const maBt = dsBt[0] || sinhMaPhieu()
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
      // Đè lên MỌI mã cũ, không chỉ mã đầu: xem ghi chú ở tham số `maCu`.
      for (const ma of dsBt.length > 0 ? dsBt : [maBt]) {
        canLuu.push({ ma, maCa: ca.maCa, sbd, hoTen: e.hoTen, phieu: goiBt, loai: 'baitap' })
      }
      // Gắn link TRƯỚC khi gói phiếu kết quả — `linkBaiTap` nằm trong gói đó.
      phieu.linkBaiTap = taoLinkPhieu(goc, maBt)
    }

    const { phieu: goiGui } = giamGoiPhieu(phieu)
    const dsKq = maCu?.get(sbd)?.ketqua ?? []
    const maKq = dsKq[0] || sinhMaPhieu()
    // Đè lên MỌI mã cũ. Trả về dòng link của mã ĐẦU (bản mới nhất), nhưng mọi
    // link cũ thầy từng gửi cũng phải mở ra đúng nội dung ấy.
    for (const ma of dsKq.length > 0 ? dsKq : [maKq]) {
      maKetQua.add(ma)
      canLuu.push({ ma, maCa: ca.maCa, sbd, hoTen: e.hoTen, phieu: goiGui, loai: 'ketqua' })
    }
  }

  if (canLuu.length === 0) return { dong: [], loi, co: coChanDoan }
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
    co: coChanDoan,
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

  // ĐỀ RIÊNG TỪNG EM. Hai việc, không được thiếu việc nào:
  //   · `boTheoEm` phải nằm trong keyBank, không thì chấm lại đi bằng luật hash
  //     và ra bộ câu của người khác — sai điểm mà không báo gì.
  //   · `lapCua` là nguồn nhãn "sai lần thứ N" cho báo cáo.
  // Máy khác không có bản cất này thì ca hiện ra như ca thường: thiếu nhãn,
  // KHÔNG bao giờ nhãn sai.
  const rieng = await docDeRiengCa(ma).catch(() => undefined)

  // BỘ CÂU CỦA EM PHẢI LẤY TỪ BÀI LÀM, KHÔNG ĐƯỢC RÚT LẠI BẰNG HASH.
  //
  // Thầy bắt được 10/09, ca 890691. `assignStudentQuestions` rút 18/4/6 từ kho
  // bằng seed hash(mãCa+SBD) — tái tạo được ĐÚNG bộ câu cũ **với điều kiện kho
  // không đổi**. Nhưng kho của ca ấy đã phình từ 1 đề lên 3 đề (54/12/18) sau
  // buổi thi, nên rút lại ra một bộ 18 câu KHÁC hẳn bộ em đã làm.
  //
  // Hậu quả đo được: điểm rơi về mức đoán mò. Chu Thanh Mai 5,85 → 1,60; cả 28
  // em đều sai, và sai IM LẶNG vì con số vẫn trông như điểm thật.
  //
  // Bài làm đã ghi đáp án THEO QID, và `giayCau` ghi cả câu em xem mà bỏ trống.
  // Gộp hai nguồn là ra đúng bộ câu đã phát. Đo trên ca 890691: 27/28 em dựng
  // lại đủ 18/4/6; em còn lại 18/4/5 và `buDuSoCau` bù cho đủ mẫu số.
  //
  // NGHIỆM THU: chấm theo bộ này rồi so với điểm chính máy từng em tự tính lúc
  // nộp (sổ `NhatKyDiem`) — 28/28 khớp, 0 lệch.
  //
  // Ca CÓ `boTheoEm` thì dùng bản đã lưu, vì đó là bản chốt lúc phát đề.
  //
  // BÙ MẪU SỐ NGAY TẠI ĐÂY, không bù trong `assignStudentQuestions`.
  //
  // Hai thứ trông giống nhau mà nghĩa khác hẳn, gộp lại là hỏng:
  //   · `boTheoEm` của ca CHẨN ĐOÁN — danh sách CHỐT lúc phát đề, đã đầy đủ.
  //     Bù thêm vào đó là nhét câu em chưa từng thấy, và làm loãng mẫu số.
  //   · bộ dựng lại TỪ BÀI LÀM — có thể THIẾU, vì em bỏ trống hẳn một câu thì
  //     câu ấy không để lại dấu nào.
  // Phép kiểm `de-rieng-nhan` bắt đúng chỗ tôi gộp nhầm hai cái này.
  //
  // Câu bù KHÔNG đổi điểm: em không trả lời nó nên luôn tính sai, 0 điểm. Nó chỉ
  // có mặt để mẫu số đúng bằng `soCau`. Bù tất định theo seed.
  const buCho = (cua: Set<string>, kho: { id: string }[], can: number, tag: string): string[] => {
    const cuaEm = kho.filter((q) => cua.has(q.id)).map((q) => q.id)
    if (cuaEm.length >= can) return cuaEm
    const daCo = new Set(cuaEm)
    return [...cuaEm, ...pick(kho.filter((q) => !daCo.has(q.id)), can - cuaEm.length, tag).map((q) => q.id)]
  }
  const khoI = bank.flatMap((b) => b.phanI)
  const khoII = bank.flatMap((b) => b.phanII)
  const khoIII = bank.flatMap((b) => b.phanIII)
  const boTuBaiLam: Record<string, string[]> = {}
  for (const l of ct.luot) {
    if (!l.dapAn) continue
    const cu = new Set(boTuBaiLam[l.sbd] ?? [])
    for (const k of Object.keys(l.dapAn.phanI ?? {})) cu.add(k)
    for (const k of Object.keys(l.dapAn.phanII ?? {})) cu.add(k)
    for (const k of Object.keys(l.dapAn.phanIII ?? {})) cu.add(k)
    for (const k of Object.keys(l.giayCau ?? {})) cu.add(k)
    boTuBaiLam[l.sbd] = [
      ...buCho(cu, khoI, sc?.I ?? khoI.length, `${ma}:${l.sbd}:phanI:bu`),
      ...buCho(cu, khoII, sc?.II ?? khoII.length, `${ma}:${l.sbd}:phanII:bu`),
      ...buCho(cu, khoIII, sc?.III ?? khoIII.length, `${ma}:${l.sbd}:phanIII:bu`),
    ]
  }
  const boTheoEm = rieng?.boTheoEm ?? boTuBaiLam

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
      graded = gradeSubmissionFull(bank!, ct.ca.maCa, sbd, moiNhat.dapAn, sc, boTheoEm)
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
      deRieng: Boolean(rieng),
      lapCua: rieng?.lapCua,
    },
    keyBank: mergeKeepAnswers(bank, sc, boTheoEm),
    daCham,
  }
}

export interface KetQuaTaoPhieuCaCa {
  /** Mọi em đã chấm của ca, kèm mã phiếu (cũ hoặc vừa tạo). */
  dong: DongLinkPhieu[]
  /** Số phiếu VỪA tạo trong lượt gọi này. Gọi lại lần hai phải ra 0. */
  soMoi: number
  loi: { sbd: string; vi_sao: string }[]  /** Cờ chẩn đoán cho THẦY — em nào bị bỏ câu chữa vì nghi hết giờ. */
  co: CoChanDoanEm[]
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
  /** `true` = DỰNG LẠI phiếu cho MỌI em đã chấm, đè lên bản cũ, giữ nguyên mã
   * phiếu nên link đã gửi vẫn mở được. Dùng khi luật rút câu đổi (v4) và thầy
   * muốn báo cáo cũ có bản mới. */
  taoLai = false,
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
  const thieu = taoLai ? daCham.map((e) => e.sbd) : g.chuaCoPhieu.map((x) => x.sbd)
  // Giữ nguyên mã phiếu cũ: link thầy đã gửi Zalo phải còn sống sau khi dựng lại.
  // GOM MỌI mã của từng em, mới nhất đứng đầu. Bản cũ chỉ giữ một mã nên em nào
  // có hai phiếu thì một cái bị bỏ lại với nội dung cũ.
  const maCu = new Map<string, { ketqua: string[]; baitap: string[] }>()
  const moiTruoc = [...daCo].sort((a, b) => String(b.taoLuc ?? '').localeCompare(String(a.taoLuc ?? '')))
  for (const p of moiTruoc) {
    const cu = maCu.get(p.sbd) ?? { ketqua: [], baitap: [] }
    if (p.loai === 'baitap') cu.baitap.push(p.ma)
    else cu.ketqua.push(p.ma)
    maCu.set(p.sbd, cu)
  }
  const kq = thieu.length > 0 ? await dungPhieuChoEm(url, mat, ca, keyBank, daCham, thieu, goc, tien, taoLai ? maCu : undefined) : { dong: [], loi: [], co: [] }
  // Một em có thể vừa được đè lên nhiều mã; chỉ giữ MỘT dòng link mỗi em, và
  // đó phải là mã mới nhất (`maCu` đã xếp mới nhất lên đầu).
  const maDau = new Set([...maCu.values()].map((x) => x.ketqua[0]).filter(Boolean))
  const theoSbd = new Map<string, DongLinkPhieu>()
  for (const d of [...g.dong, ...kq.dong]) {
    const cu = theoSbd.get(d.sbd)
    if (!cu || maDau.has(d.ma)) theoSbd.set(d.sbd, d)
  }

  const dong: DongLinkPhieu[] = []
  for (const e of daCham) {
    const d = theoSbd.get(e.sbd)
    if (d) dong.push({ ...d, hoTen: e.hoTen || d.hoTen })
  }
  return { dong, soMoi: kq.dong.length, loi: kq.loi, co: kq.co }
}

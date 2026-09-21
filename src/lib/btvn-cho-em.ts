// BÀI TẬP VỀ NHÀ — PHÍA MÁY EM.
//
// Máy em KHÔNG có mã bí mật, và hai đường BTVN của em (`/btvn/cua-em`,
// `/btvn/nop`) cố ý là đường CÔNG KHAI — đúng mô hình `layPhieu` đang chạy: ai
// có mã ca và số báo danh thì mở được bài của chính mình.
//
// Phiếu dựng bằng chính bộ `html-phieu.ts` đang dùng cho phiếu khắc phục, để
// em nhìn thấy đúng một kiểu trang, và để không đẻ thêm một bộ dựng thứ hai.
import type { CauHinhMayChu } from './cau-hinh-may-chu'
import type { CauLuyen } from './bai-tap-pdf'
import { layCauHinhMayChu, xongNapDiaChi } from './may-chu-moi'
import { loDangCho, tinhLichLoBtvn, tongCauDenLo } from './lich-lo-btvn'
import { gioDayDu } from './ngay-gio-24'
import {
  cauCuaChang,
  chuDauBai,
  chuNgayMo,
  docBaiCaNhan,
  docKetQuaChangDaLuu,
  doiLuotLam,
  ghepKetQuaVaoCau,
  hienNhomThuSuc,
  tachThuSucThem,
  themDapAnGiaChoCau,
  type BaiCaNhanEm,
} from './btvn-ca-nhan-em'

/** Cấu hình máy chủ cho đường BTVN của em. Dùng chung đường máy em vẫn tự tìm
 * địa chỉ (xem `layCauHinhChoEm`), nên máy nào mở link cũng chạy. */
export async function layCauHinhChoEmBtvn(): Promise<CauHinhMayChu> {
  // Chờ lượt nạp địa chỉ lúc khởi động xong rồi hãy đọc — máy em mở link lần
  // đầu thì cấu hình đang được nạp ngay lúc ấy (xem `napDiaChiMayChuMoiChoEm`).
  await xongNapDiaChi()
  return layCauHinhMayChu()
}

/** Dựng trang bài tập về nhà.
 *
 * DÙNG ĐÚNG BỘ PHIẾU KHẮC PHỤC (thầy chốt 12/09: "làm chuẩn html và hiển thị
 * đầy đủ đề ảnh, công thức. Nộp được chọn đáp án được theo chuẩn của html rút
 * câu hỏi khắc phục"). Nghĩa là gói đề đi qua ĐÚNG cửa nạp kho đang chạy:
 *
 *     gói kho → parseKhoDeJson → buildTeacherSourceFromKhoDe → cauLuyenTuNguon
 *             → dungPhieu(..., { nop })
 *
 * VÌ SAO PHẢI ĐI QUA CỬA ẤY, và đây là lỗi bản đầu đã dính: gói kho ghi phương
 * án ở khoá `pa: {A,B,C,D}`, đáp án ở `dap_an`, ảnh ở `hinh`. Bản đầu tự đọc
 * `luaChon` nên phương án MẤT SẠCH — em mở phiếu ra chỉ thấy đề bài và một ô
 * "Đáp án: ......", không có gì để chọn. Cửa nạp kho biết đủ mọi khuôn ấy, và
 * còn LOẠI câu thiếu phương án hay thiếu đáp án ngay tại cửa thay vì dựng một
 * ô trống cho em ngồi đoán.
 *
 * Phiếu nộp được: `dungPhieu` gắn thanh nộp, chấm tại chỗ rồi gửi lên máy chủ.
 * Đáp án KHÔNG nằm trong dữ liệu phiếu cho tới lúc em bấm nộp — máy chủ chấm
 * lại bằng kho, không tin con số máy em gửi. */
export async function dungPhieuBtvn(
  r: {
    hanNop?: string
    giaoLuc?: string
    soCau?: number
    de?: unknown
    daNop?: boolean
    maBtvn?: string
    soLanLam?: number
    soLanLamLaiConLai?: number
    /** Số lô đã xong — máy chủ ghi qua `/btvn/xong-lo` (xem `lich-lo-btvn.ts`). */
    loDaXong?: number
    /** Bài `ca_nhan` mang thêm caNhan/chang/nhan/changDangMo… — đọc bằng `docBaiCaNhan`. */
    [khac: string]: unknown
  },
  maCa: string,
  sbd: string,
  tuyChon?: { lamLai?: boolean; soCauSang?: number },
): Promise<string> {
  // BÀI CÁ NHÂN HOÁ ("nâng đỡ"): đường riêng — câu KHÔNG có đáp án, nộp theo chặng. Bài thường đi tiếp như cũ.
  const baiCaNhan = docBaiCaNhan(r)
  if (baiCaNhan) return dungPhieuCaNhan(r, baiCaNhan, maCa, sbd)

  const [{ dungPhieu }, { parseKhoDeJson, buildTeacherSourceFromKhoDe }, { cauLuyenTuNguon }, { layCauHinhChoEmBtvn: layCh }] = await Promise.all([
    import('./html-phieu'),
    import('./exam-kho-de-import'),
    import('./bai-tap-pdf'),
    Promise.resolve({ layCauHinhChoEmBtvn }),
  ])

  const doc = parseKhoDeJson(r.de)
  if (!doc.ok || !doc.json) {
    // Kê hai lỗi đầu là đủ để thầy biết hỏng ở đâu; kê hết thì câu báo dài
    // hơn màn điện thoại. Đây là cắt DANH SÁCH LỖI, không phải cắt câu hỏi.
    const viSao = (doc.errors ?? []).filter((_, i) => i < 2).join('; ')
    throw new Error(`Gói bài tập không đọc được: ${viSao || 'khuôn lạ'}`)
  }
  const dung = buildTeacherSourceFromKhoDe(doc.json)
  const cau = cauLuyenTuNguon([dung.source])
  if (cau.length === 0) throw new Error('Gói bài tập không có câu nào dùng được')

  const ch = await layCh()
  const han = String(r.hanNop ?? '')
  const maBtvn = String(r.maBtvn ?? '').trim()
  const laLamLai = !!tuyChon?.lamLai
  if (laLamLai) {
    r = { ...r, daNop: false }
  }
  const conLai = typeof r.soLanLamLaiConLai === 'number' ? r.soLanLamLaiConLai : 3
  const lanLamHienTai = (Number(r.soLanLam) || 1) + (laLamLai ? 1 : 0)

  let banNhap: Record<string, string> | undefined
  if (!laLamLai && !r.daNop && maBtvn) {
    try {
      const raw = localStorage.getItem(`ddh.btvn.draft.${maBtvn}.${sbd}`) || localStorage.getItem(`ddh.lam.${maBtvn}`)
      if (raw) banNhap = JSON.parse(raw)
    } catch {}
  }

  // LỊCH LÔ (thay Vòng 1/2/3 — mục 3 SO-VIEC.md 19/09): tính lại ngay tại đây
  // từ giaoLuc/hanNop/soCau + `loDaXong` máy chủ đã ghi, MỘT nguồn duy nhất
  // cho mọi màn mở phiếu (trợ lý bảng tin lẫn tab "Bài tập" bấm thẳng) — không
  // còn 3 màn Vòng 1/2/3 chọn `soCauSang` khác nhau nên không cần công thức cố
  // định riêng cho auto-detect nữa (xem NGƯỠNG LÔ HIỆN TẠI ở html-phieu.ts).
  // Ngân sách ngày dùng mặc định "vừa sức" (12 câu) vì hàm này không thấy được
  // các nhiệm vụ KHÁC của em — trợ lý bảng tin (`tro-ly-ca-nhan.ts`) mới có đủ
  // ngữ cảnh đó; lệch nhau ở đây chỉ ảnh hưởng NHỊP hiện câu, không ảnh hưởng
  // hạn nộp thật (máy chủ vẫn chặn theo `hanNop`).
  const lich = tinhLichLoBtvn({ soCau: cau.length, giaoLuc: String(r.giaoLuc ?? ''), hanNop: han, nganSachNgay: 12, taiKhac: 0 })
  const dangCho = loDangCho(lich, Math.max(0, Number(r.loDaXong) || 0), Date.now())
  const soCauSangMacDinh = r.daNop ? cau.length : dangCho ? tongCauDenLo(lich, dangCho.chiSo) : cau.length
  const soCauSang = typeof tuyChon?.soCauSang === 'number' ? tuyChon.soCauSang : soCauSangMacDinh
  const tongLo = lich.cacLo.length

  return dungPhieu(
    {
      hoTen: '',
      sbd,
      ngay: new Date(),
      tenChuyenDe: 'Bài tập về nhà',
      ketQua: '',
      hienDapAn: false,
      nhanBia: 'BÀI TẬP VỀ NHÀ',
      oBia: [
        { nhan: 'Số báo danh', gia: sbd },
        { nhan: 'Ca', gia: maCa },
        { nhan: 'Hạn nộp', gia: han ? gioVN(han) : '—' },
        ...(laLamLai ? [{ nhan: 'Lượt làm', gia: `Làm lại lần ${lanLamHienTai - 1} (còn ${conLai} lượt)` }] : []),
      ],
    },
    cau,
    {
      laBtvn: true,
      soCauSang,
      chiSoLoHienTai: dangCho?.chiSo,
      // Đã nộp rồi thì mở thành phiếu CHỈ ĐỌC kèm lời giải — em xem lại bài,
      // không nộp thêm lần nữa.
      nop: r.daNop || !maBtvn ? null : { ma: maBtvn, sbd, banNhap, legacyIds:cau.map(c=>doc.json!.ma_de+(c.id.match(/-(III|II|I)-\d+$/)?.[0]||'')), url: `${String(ch.URL ?? '').replace(/\/+$/, '')}/goi` },
      loiNhac: r.daNop
        ? `Em đã nộp bài này rồi — đây là bản xem lại, bấm vào từng câu để mở lời giải.${conLai > 0 ? ` Thầy cho phép làm lại tối đa 3 lần (còn ${conLai} lượt).` : ' (Đã hết 3 lượt làm lại)'}`
        : laLamLai
        ? `Bài tập về nhà (Làm lại lần ${lanLamHienTai - 1} · còn ${conLai} lượt) · ${cau.length} câu${han ? ` · Hạn nộp: ${gioVN(han)}` : ''}. Hôm nay làm ${soCauSang} câu${tongLo > 1 ? ` (chặng ${(dangCho?.chiSo ?? 0) + 1} trong ${tongLo} chặng)` : ''}; câu còn lại mở dần theo ngày/giờ, không dồn hết một lúc. Làm xong bấm Nộp bài ở thanh trên.`
        : `Bài tập về nhà · ${cau.length} câu${han ? ` · Hạn nộp: ${gioVN(han)}` : ''}. Hôm nay làm ${soCauSang} câu${tongLo > 1 ? ` (chặng ${(dangCho?.chiSo ?? 0) + 1} trong ${tongLo} chặng)` : ''}; câu còn lại mở dần theo ngày/giờ, không dồn hết một lúc. Làm xong bấm Nộp bài ở thanh trên.`,
    },
  )
}

/** Chặng phiếu ĐANG HIỆN: chặng em làm bây giờ nếu đã mở; chưa mở (đợi ngày mai) thì chặng đã xong gần nhất, để em xem lại kết quả. */
export function chonChangHienThi(b: BaiCaNhanEm): number | null {
  const dangMo = b.changDangMo === null ? undefined : b.chang.find((c) => c.chiSo === b.changDangMo)
  if (dangMo?.daMo) return dangMo.chiSo
  const xong = b.chang.filter((c) => c.daXong)
  if (xong.length > 0) return xong[xong.length - 1].chiSo
  return b.chang.find((c) => c.daMo)?.chiSo ?? null
}

/** Nhãn ngắn dưới chấm chặng: chặng đang làm "Hôm nay"; chặng chưa mở đầu tiên "Mai" hoặc "24/09". */
function nhanChangNgan(b: BaiCaNhanEm, chiSoHienThi: number | null, bayGio: Date): Record<number, string> {
  const nhan: Record<number, string> = {}
  const dangMo = b.changDangMo === null ? undefined : b.chang.find((c) => c.chiSo === b.changDangMo)
  if (dangMo?.daMo && !dangMo.daXong && dangMo.chiSo === chiSoHienThi) nhan[dangMo.chiSo] = 'Hôm nay'
  const chuaMo = b.chang.find((c) => !c.daMo)
  if (chuaMo) {
    const chu = chuNgayMo(chuaMo.moLuc, bayGio)
    nhan[chuaMo.chiSo] = chu === 'ngày mai' ? 'Mai' : chu === 'hôm nay' ? 'Hôm nay' : chu.replace(/^ngày /, '')
  }
  return nhan
}

/** PHIẾU BÀI `ca_nhan` (hợp đồng docs/hop-dong-btvn-nang-do-2109.md). Máy chủ KHÔNG gửi đáp án/lời giải của câu chưa nộp;
 * câu đã nộp chặng được mở lại bằng KẾT QUẢ máy chủ đã trả (giữ ở máy em). Chỉ hiện MỘT chặng: chặng đang làm, hoặc
 * chặng vừa xong khi chặng kế chưa tới ngày mở. Phiếu không chấm tại chỗ — nộp chặng đi qua host (KhungXemPhieu). */
async function dungPhieuCaNhan(r: Record<string, unknown>, b: BaiCaNhanEm, maCa: string, sbd: string, bayGio = new Date()): Promise<string> {
  const [{ dungPhieu, boLoiGiai }, { parseKhoDeJson, buildTeacherSourceFromKhoDe }, { cauLuyenTuNguon }] = await Promise.all([
    import('./html-phieu'),
    import('./exam-kho-de-import'),
    import('./bai-tap-pdf'),
  ])
  const chiSoHT = chonChangHienThi(b)
  if (chiSoHT === null) throw new Error('Bài này chưa có chặng nào mở')
  const maBtvn = String(r.maBtvn ?? '').trim()
  const de = (r.de ?? {}) as Record<string, unknown>
  // BẢN 1.2 (Boss chốt): "thử sức thêm" là CHẶNG ẢO `chiSo = soChang`, tách khỏi các chặng; chỉ hiện ở CHẶNG CUỐI (khi đã mở, kể cả khi phần bắt buộc đã
  // xong), NGAY SAU câu bắt buộc, NỘP RIÊNG bằng nút riêng. Máy chủ chưa gửi khoá ⇒ như cũ.
  const tach = tachThuSucThem(b, docCauBtvn(de))
  const cauBatBuoc = cauCuaChang(b, tach.batBuoc, chiSoHT)
  const nhomTs = b.thuSucThem
  const cauThuSuc: Record<string, unknown>[] = nhomTs && hienNhomThuSuc(b, chiSoHT) ? (tach.thuSuc as Record<string, unknown>[]) : []
  const maThuSuc = new Set(cauThuSuc.map((c) => String(c.qid ?? c.id ?? '')))
  const cauChang = [...cauBatBuoc, ...cauThuSuc]
  if (cauChang.length === 0) throw new Error('Chặng này chưa có câu nào để làm')

  // THẦY CHO LÀM LẠI: `soLanLam` khác lượt máy em đã thấy ⇒ bỏ nháp + kết quả chặng của lượt cũ TRƯỚC khi đọc chúng.
  doiLuotLam(maBtvn, sbd, r.soLanLam)
  // Kết quả máy chủ đã trả lúc nộp chặng (giữ ở máy) → câu đã chấm có đáp án đúng + lời giải; còn lại KHÔNG có gì.
  const daLuuBb = docKetQuaChangDaLuu(maBtvn, sbd, chiSoHT)
  // Kết quả phần thử sức lưu ở chặng ẢO (chiSo = soChang), gộp vào để câu thử sức đã nộp hiện lời giải.
  const daLuuTs = cauThuSuc.length > 0 && nhomTs ? docKetQuaChangDaLuu(maBtvn, sbd, nhomTs.chiSo) : { ketQua: [], dapAn: {} }
  const daLuu = { ketQua: [...daLuuBb.ketQua, ...daLuuTs.ketQua], dapAn: { ...daLuuBb.dapAn, ...daLuuTs.dapAn } }
  const { cau: cauTho, chuaCo } = themDapAnGiaChoCau(ghepKetQuaVaoCau(cauChang, daLuu.ketQua))
  const doc = parseKhoDeJson({ ...de, cau: cauTho })
  if (!doc.ok || !doc.json) {
    const viSao = (doc.errors ?? []).filter((_, i) => i < 2).join('; ')
    throw new Error(`Gói bài tập không đọc được: ${viSao || 'khuôn lạ'}`)
  }
  const dung = buildTeacherSourceFromKhoDe(doc.json)
  const daCham: Record<string, { dung: boolean; chon: string }> = {}
  for (const k of daLuu.ketQua) daCham[k.qid] = { dung: k.dung, chon: daLuu.dapAn[k.qid] ?? '' }
  const cauTheoPhan = cauLuyenTuNguon([dung.source]).map((c): CauLuyen => {
    const nhan = b.nhan[c.id]
    const thuSuc = maThuSuc.has(c.id) ? { thuSuc: true as const } : {}
    if (chuaCo.has(c.id)) return { ...boLoiGiai(c), caNhan: { nhan, chuaCoDapAn: true as const, ...thuSuc } }
    return { ...c, caNhan: { nhan, ...(daCham[c.id] ? { daCham: daCham[c.id] } : {}), ...thuSuc } }
  })
  // Đề xếp câu theo phần I→II→III; nhóm thử sức phải nằm CUỐI (sau mọi câu bắt buộc, kể cả câu bắt buộc phần III). Không có thử sức ⇒ giữ nguyên thứ tự.
  const cau = maThuSuc.size === 0 ? cauTheoPhan : [...cauTheoPhan.filter((c) => !c.caNhan?.thuSuc), ...cauTheoPhan.filter((c) => c.caNhan?.thuSuc)]
  if (cau.length === 0) throw new Error('Gói bài tập không có câu nào dùng được')

  const chChinh = await layCauHinhChoEmBtvn()
  const han = String(r.hanNop ?? '')
  // Nút chỉ khoá khi mọi câu BẮT BUỘC đã chấm; câu thử sức không bắt buộc không giữ nút mở (và không khoá nó).
  const conCauChuaCham = cau.some((c) => !c.caNhan?.thuSuc && !c.caNhan?.daCham)
  const dauBai = chuDauBai(b)
  const dangMo = b.changDangMo === null ? undefined : b.chang.find((c) => c.chiSo === b.changDangMo)
  const ghiCho = b.changDangMo === null
    ? cauThuSuc.length > 0 && !nhomTs?.daNop
      ? 'Em đã xong hết các chặng của bài này. Phần thử sức thêm không bắt buộc — làm rồi nộp riêng ở cuối phiếu.'
      : 'Em đã xong hết các chặng của bài này.'
    : dangMo && !dangMo.daMo
    ? `Chặng ${dangMo.chiSo + 1} mở ${chuNgayMo(dangMo.moLuc, bayGio)}.`
    : ''

  let banNhap: Record<string, string> | undefined
  try {
    const raw = localStorage.getItem(`ddh.btvn.draft.${maBtvn}.${sbd}`)
    if (raw) banNhap = JSON.parse(raw)
  } catch {}

  return dungPhieu(
    {
      hoTen: '',
      sbd,
      ngay: bayGio,
      tenChuyenDe: 'Bài tập về nhà',
      ketQua: '',
      hienDapAn: false,
      nhanBia: 'BÀI TẬP VỀ NHÀ',
      oBia: [
        { nhan: 'Số báo danh', gia: sbd },
        { nhan: 'Ca', gia: maCa },
        { nhan: 'Hạn nộp', gia: han ? gioVN(han) : '—' },
      ],
    },
    cau,
    {
      nop: maBtvn ? { ma: maBtvn, sbd, banNhap, url: `${String(chChinh.URL ?? '').replace(/\/+$/, '')}/goi` } : null,
      loiNhac: null,
      caNhan: {
        chiSo: chiSoHT,
        daCham,
        dauBai: {
          tong: dauBai.tong,
          soChang: dauBai.soChang,
          phutMoiNgay: dauBai.phutMoiNgay,
          han: gioVN(han),
          chang: b.chang.map((c) => ({ chiSo: c.chiSo, daXong: c.daXong })),
          chiSoHienThi: chiSoHT,
          nhanChang: nhanChangNgan(b, chiSoHT, bayGio),
          soThuSuc: b.soThuSucThem,
        },
        ghiCho,
        tienTo: `Chặng ${chiSoHT + 1}/${b.soChang} · `,
        nutNop: conCauChuaCham ? 'Nộp chặng' : 'Đã xong chặng',
        nutTat: !conCauChuaCham,
        ...(cauThuSuc.length > 0 && nhomTs
          ? { thuSuc: { chiSo: nhomTs.chiSo, nut: nhomTs.daNop ? 'Đã nộp phần thử sức thêm' : 'Nộp phần thử sức thêm', tat: nhomTs.daNop } }
          : {}),
      },
    },
  )
}

/** Hạn cho phiếu theo chuẩn từ ngữ (luật 6): "20:30 · Thứ Bảy 13/09/2026" (24 giờ, giờ Việt Nam). Hỏng ⇒ ''. */
function gioVN(iso: string): string {
  return gioDayDu(iso, '')
}

/** Rút câu từ gói đề. Nhận mọi dạng gói qua các đời, và KHÔNG đoán khi lạ. */
export function docCauBtvn(de: unknown): Record<string, unknown>[] {
  const g = (de ?? {}) as Record<string, unknown>
  if (Array.isArray(g.cau)) return g.cau as Record<string, unknown>[]
  if (Array.isArray(g.items)) return g.items as Record<string, unknown>[]
  const gom: Record<string, unknown>[] = []
  for (const p of ['phanI', 'phanII', 'phanIII'] as const) {
    const v = g[p]
    if (Array.isArray(v)) for (const c of v) gom.push(c as Record<string, unknown>)
  }
  return gom
}

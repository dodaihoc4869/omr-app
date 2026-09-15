// THUẬT TOÁN RÚT CÂU SAI & KHẮC PHỤC LỖI SAI — CHUẨN HOÁ CHO CẢ 3 APP
// 1. Làm lại các câu sai: hiển thị lại toàn bộ câu sai và lời giải chuẩn để học sinh tự làm lại.
// 2. Luyện thêm dạng câu sai: thanh rút tối đa số câu có cùng nhãn dán chia theo tỷ lệ tối đa, nếu lẻ thì làm tròn lên.
// 3. Lựa chọn luyện câu: 2 sao, 1 sao, 0 sao, lý thuyết, bài tập tính toán. Rút đúng nhãn dán, thanh trượt tối đa 100 câu.
// 4. Luyện dạng bài: chọn lớp → tên bài sách giáo khoa → dạng toán trọng tâm, gom TẤT CẢ câu trong kho thuộc dạng ấy.
// Tất cả câu rút hiển thị theo mẫu mới của HTML: chuẩn đề, chuẩn lời giải.

import type { TeacherExamSource } from '../data/examContent'
import { cauLuyenTuNguon, type CauLuyen } from './bai-tap-pdf'
import { chuanHoaLoiGiaiCau } from './chuan-hoa-loi-giai'
import { dangCua } from './dang-cau'
import { hopSao, type LocSaoMoRong } from './loc-sao'
import { banDoDang, type DangCauKho } from './rut-de-chua'
import { dungPhieu, type ThongTinPhieu } from './html-phieu'

export interface CauSaiDauVao {
  qid: string
  soCau: number
  phan: 'I' | 'II' | 'III'
  chuyenDe?: string
  mucDo?: string
  dapAnChon?: string
  dapAnDung: string
  text: string
  choices?: string[]
  ideas?: string[]
  table?: string[][]
  imageDataUrl?: string
  hinhAnh?: string
  loiGiai?: string
  dang?: string | { ma?: string; ten?: string }
  /** MÃ dạng do máy chủ trả kèm (`hsCauSai`). Khớp theo MÃ là khớp chắc; khớp
   * theo tên thì hai tờ đề viết lệch một dấu là trượt. */
  dangMa?: string
  maCa?: string
  tenCa?: string
}

export interface ThongKeDangCauSai {
  qid: string
  soCau: number
  phan: 'I' | 'II' | 'III'
  nhanDan: string
  tenDang: string
  soUngVienToiDa: number
  ungVien: CauLuyen[]
}

export interface BoLocCauLuyen {
  sao: LocSaoMoRong
  dang: 'tat_ca' | 'ly_thuyet' | 'bai_tap'
}

/** Chuyển một câu sai đầu vào thành CauLuyen chuẩn hoá lời giải đầy đủ cấu trúc */
export function chuyenCauSaiSangCauLuyen(it: CauSaiDauVao): CauLuyen {
  const rawDang = typeof it.dang === 'string'
    ? (it.dang === '[object Object]' ? '' : it.dang)
    : (it.dang && typeof it.dang === 'object' ? (it.dang as any).ten || (it.dang as any).ma || '' : '')
  const tenDang = rawDang || it.chuyenDe || 'Lỗi sai cần khắc phục'
  const maDang = rawDang
  const rawChoices = it.choices && it.choices.length > 0
    ? it.choices
    : (it.ideas && it.ideas.length > 0 ? it.ideas : null)
  const luaChon = rawChoices ? rawChoices.map((x: unknown) => String(x ?? '')) : null
  const textCau = String(it.text ?? '')
  const daDung = String(it.dapAnDung ?? '')
  const daChon = String(it.dapAnChon ?? '')

  const lgChuan = chuanHoaLoiGiaiCau(it.loiGiai, it.phan || 'I', daDung)

  const hinhAnhUrl = (() => {
    const a = it.imageDataUrl || it.hinhAnh
    if (
      typeof a === 'string' &&
      a.trim().length > 10 &&
      (a.startsWith('data:image/') || a.startsWith('http://') || a.startsWith('https://') || a.startsWith('/'))
    ) {
      return a.trim()
    }
    return undefined
  })()

  return {
    phan: it.phan,
    id: it.qid,
    maDe: it.maCa || '',
    chuyenDe: it.chuyenDe || 'Hoá học',
    dang: dangCua({
      phan: it.phan,
      text: textCau,
      luaChon: luaChon ?? [],
      dapAn: daDung,
      mucDo: it.mucDo as any,
    }),
    sao: 1,
    mucDo: (it.mucDo as any) || 'hieu',
    text: textCau,
    luaChon,
    dapAn: daDung,
    chot: lgChuan.chot,
    lyDo: lgChuan.lyDo,
    buoc: lgChuan.buoc,
    ketQua: lgChuan.ketQua || daDung,
    anhThanCau: hinhAnhUrl,
    bang: it.table ?? null,
    chuaCho: {
      qid: it.qid,
      soCau: Number(it.soCau) || 1,
      phan: it.phan,
      maDang: maDang || '',
      tenDang: tenDang || it.chuyenDe || 'Lỗi sai cần khắc phục',
      bac: 1,
      laLamLai: true,
      daChon,
      viSaoSai: daChon ? `Em đã chọn ${daChon}, đáp án đúng là ${daDung}` : undefined,
    },
  }
}

/** Lấy nhãn dán của câu sai */
export function layNhanDanCauSai(c: CauSaiDauVao, banDo?: Map<string, DangCauKho>): { ma: string; ten: string } {
  if (banDo && banDo.has(c.qid)) {
    const d = banDo.get(c.qid)!
    if (d.ma) return { ma: d.ma, ten: d.ten || d.ma }
  }
  // MÃ do máy chủ trả kèm đứng trước tên: máy em không có kho nên không dựng
  // được `banDo`, mà `dang` trả về chỉ là TÊN dạng — khớp tên là khớp hớ.
  if (c.dangMa && String(c.dangMa).trim()) {
    const ma = String(c.dangMa).trim()
    const ten = typeof c.dang === 'string' && c.dang.trim() ? c.dang.trim() : ma
    return { ma, ten }
  }
  if (c.dang) {
    if (typeof c.dang === 'string' && c.dang !== '[object Object]' && c.dang.trim()) {
      return { ma: c.dang.trim(), ten: c.dang.trim() }
    }
    if (typeof c.dang === 'object') {
      const ma = String((c.dang as any).ma ?? '').trim()
      const ten = String((c.dang as any).ten ?? '').trim() || ma
      if (ma) return { ma, ten }
    }
  }
  try {
    const dAuto = dangCua({
      phan: c.phan,
      text: c.text,
      luaChon: c.choices ?? c.ideas ?? [],
      dapAn: c.dapAnDung,
      mucDo: c.mucDo as any,
    })
    if (dAuto && dAuto !== 'chua_ro') {
      return { ma: dAuto, ten: dAuto === 'ly_thuyet' ? 'Lý thuyết' : 'Bài tập' }
    }
  } catch {}

  return { ma: '', ten: c.chuyenDe || 'Chưa gắn dạng' }
}

/** LỰA CHỌN 1: Làm lại toàn bộ câu sai */
export function taoDeLamLaiCauSai(
  dsCauSai: CauSaiDauVao[],
  thongTin: { hoTen: string; sbd: string; tenDe?: string }
): { html: string; dsCau: CauLuyen[] } {
  const dsCau = dsCauSai.map(chuyenCauSaiSangCauLuyen)
  const tt: ThongTinPhieu = {
    hoTen: thongTin.hoTen,
    sbd: thongTin.sbd,
    ngay: new Date(),
    tenChuyenDe: thongTin.tenDe || 'ĐỀ LÀM LẠI CÁC CÂU SAI',
    ketQua: `Gồm ${dsCau.length} câu làm sai cần khắc phục`,
    hienDapAn: false,
    nhanBia: 'LÀM LẠI CÂU SAI',
  }
  const html = dungPhieu(tt, dsCau, { anGiai: false })
  return { html, dsCau }
}

/** LỰA CHỌN 2: Phân tích tỷ lệ số câu tối đa cùng nhãn dán trong kho cho từng câu sai */
export function phanTichTyLeDang(
  dsCauSai: CauSaiDauVao[],
  khoDe: TeacherExamSource[]
): {
  thongKe: ThongKeDangCauSai[]
  tongToiDa: number
  tinhSoCauMoiDang: (tongSoCauRut: number) => Map<string, number>
} {
  const banDo = banDoDang(khoDe)
  const tatCaUngVien = cauLuyenTuNguon(khoDe)
  const qidSaiSet = new Set(dsCauSai.map((c) => c.qid))
  const tapUngVienPhanBiet = new Set<string>()

  // Chuẩn bị danh sách ứng viên cho từng câu sai theo đúng nhãn dán
  const thongKe: ThongKeDangCauSai[] = dsCauSai.map((cs) => {
    const nhan = layNhanDanCauSai(cs, banDo)
    // Tìm các câu trong kho có cùng nhãn dán và khác câu sai
    const ungVienCungNhan = tatCaUngVien.filter((cand) => {
      if (qidSaiSet.has(cand.id) || cand.id === cs.qid) return false
      const candDang = banDo.get(cand.id)
      if (candDang && nhan.ma) {
        if (candDang.ma === nhan.ma) return true
      }
      if (candDang && nhan.ten && nhan.ten !== 'Chưa gắn dạng' && candDang.ten === nhan.ten) {
        return true
      }
      return false
    })

    for (const u of ungVienCungNhan) {
      tapUngVienPhanBiet.add(u.id)
    }

    return {
      qid: cs.qid,
      soCau: cs.soCau,
      phan: cs.phan,
      nhanDan: nhan.ma || nhan.ten,
      tenDang: nhan.ten || nhan.ma,
      soUngVienToiDa: ungVienCungNhan.length,
      ungVien: ungVienCungNhan,
    }
  })

  // TỐI ĐA = SỐ CÂU PHÂN BIỆT RÚT ĐƯỢC, không phải tổng cộng dồn.
  //
  // Bản trước cộng `soUngVienToiDa` của từng câu sai rồi mới chặn bằng số câu
  // phân biệt. Một câu trong kho thường là ứng viên cho NHIỀU câu sai cùng
  // nhãn, nên phép cộng ấy đếm nó nhiều lần — 11 câu sai ra "tối đa 8800 câu"
  // trong khi cả kho chỉ có mấy nghìn câu. Thanh kéo vì thế chạy tới một con số
  // không bao giờ rút nổi.
  //
  // Rút nhiều nhất được bao nhiêu thì đúng bằng số câu PHÂN BIỆT trong tập ứng
  // viên: rút quá số ấy là bắt đầu lặp lại chính những câu đã có.
  const tongToiDa = tapUngVienPhanBiet.size

  // Hàm tính số câu rút cho mỗi câu sai theo tỷ lệ tối đa, nếu lẻ thì làm tròn lên
  const tinhSoCauMoiDang = (tongSoCauRut: number): Map<string, number> => {
    const ketQua = new Map<string, number>()
    if (tongToiDa <= 0 || tongSoCauRut <= 0) {
      for (const t of thongKe) ketQua.set(t.qid, 0)
      return ketQua
    }

    const K = Math.min(tongSoCauRut, tongToiDa)
    const tongUngVien = thongKe.reduce((a, c) => a + c.soUngVienToiDa, 0)
    if (tongUngVien <= 0) {
      for (const t of thongKe) ketQua.set(t.qid, 0)
      return ketQua
    }
    for (const t of thongKe) {
      if (t.soUngVienToiDa <= 0) {
        ketQua.set(t.qid, 0)
        continue
      }
      // TỶ LỆ TÍNH TRÊN TỔNG ỨNG VIÊN, không trên `tongToiDa`.
      //
      // `tongToiDa` là số câu PHÂN BIỆT, nhỏ hơn hẳn tổng ứng viên khi nhiều
      // câu sai dùng chung một kho nhãn. Chia cho nó thì các tỷ lệ cộng lại
      // vượt 100% và câu nào cũng ăn gần hết hạn mức. Mẫu số đúng là tổng ứng
      // viên của mọi câu sai — khi ấy tổng các tỷ lệ đúng bằng 1.
      const tyLe = t.soUngVienToiDa / tongUngVien
      // Lẻ thì LÀM TRÒN LÊN, đúng luật thầy chốt.
      const phanBo = Math.ceil(K * tyLe)
      // Không được vượt quá số ứng viên tối đa của chính câu đó
      const soCauChon = Math.min(t.soUngVienToiDa, Math.max(1, phanBo))
      ketQua.set(t.qid, soCauChon)
    }

    return ketQua
  }

  return { thongKe, tongToiDa, tinhSoCauMoiDang }
}

/** Rút luyện thêm dạng câu sai theo tỷ lệ số câu chọn */
export function rutLuyenThemDangCauSai(
  dsCauSai: CauSaiDauVao[],
  khoDe: TeacherExamSource[],
  soCauRut: number,
  thongTin: { hoTen: string; sbd: string; tenDe?: string }
): { html: string; dsCau: CauLuyen[] } {
  const { thongKe, tongToiDa, tinhSoCauMoiDang } = phanTichTyLeDang(dsCauSai, khoDe)
  const phanBo = tinhSoCauMoiDang(soCauRut)

  const dsCauRut: CauLuyen[] = []
  const daLayId = new Set<string>()

  for (const t of thongKe) {
    const soLuong = phanBo.get(t.qid) ?? 0
    if (soLuong <= 0) {
      // Nếu kho không có câu tương ứng, lấy lại chính câu sai đó
      const cauGoc = dsCauSai.find((c) => c.qid === t.qid)
      if (cauGoc && !daLayId.has(cauGoc.qid)) {
        daLayId.add(cauGoc.qid)
        dsCauRut.push(chuyenCauSaiSangCauLuyen(cauGoc))
      }
      continue
    }

    let dem = 0
    for (const cand of t.ungVien) {
      if (dem >= soLuong) break
      if (!daLayId.has(cand.id)) {
        daLayId.add(cand.id)
        // Gắn nhãn chữa cho câu sai
        const cauKemNhan: CauLuyen = {
          ...cand,
          chuaCho: {
            qid: t.qid,
            soCau: t.soCau,
            phan: t.phan,
            maDang: t.nhanDan,
            tenDang: t.tenDang,
            bac: 1,
          },
        }
        dsCauRut.push(cauKemNhan)
        dem++
      }
    }
  }

  const tt: ThongTinPhieu = {
    hoTen: thongTin.hoTen,
    sbd: thongTin.sbd,
    ngay: new Date(),
    tenChuyenDe: thongTin.tenDe || 'ĐỀ LUYỆN DẠNG KHẮC PHỤC CÂU SAI',
    ketQua: `Gồm ${dsCauRut.length} câu cùng dạng (chia theo tỷ lệ từ ${tongToiDa} câu tối đa)`,
    hienDapAn: false,
    nhanBia: 'LUYỆN DẠNG CÂU SAI',
  }
  const html = dungPhieu(tt, dsCauRut, { anGiai: false })
  return { html, dsCau: dsCauRut }
}

/** LỰA CHỌN 3: Luyện câu theo bộ lọc (2 sao, 1 sao, 0 sao, lý thuyết, bài tập) */
export function phanTichBoLocCau(
  dsCauSai: CauSaiDauVao[],
  khoDe: TeacherExamSource[],
  boLoc: BoLocCauLuyen
): {
  thongKe: ThongKeDangCauSai[]
  tongToiDa: number
  tinhSoCauMoiDang: (tongSoCauRut: number) => Map<string, number>
} {
  const banDo = banDoDang(khoDe)
  const tatCaUngVien = cauLuyenTuNguon(khoDe)
  const qidSaiSet = new Set(dsCauSai.map((c) => c.qid))
  const tapUngVienPhanBiet = new Set<string>()

  const thongKe: ThongKeDangCauSai[] = dsCauSai.map((cs) => {
    const nhan = layNhanDanCauSai(cs, banDo)
    const ungVienLoc = tatCaUngVien.filter((cand) => {
      if (qidSaiSet.has(cand.id) || cand.id === cs.qid) return false

      // 1. Phải khớp nhãn dán chặt chẽ
      const candDang = banDo.get(cand.id)
      let khopNhan = false
      if (candDang && nhan.ma && candDang.ma === nhan.ma) {
        khopNhan = true
      } else if (candDang && nhan.ten && nhan.ten !== 'Chưa gắn dạng' && candDang.ten === nhan.ten) {
        khopNhan = true
      }
      if (!khopNhan) return false

      // 2. Lọc theo sao
      if (!hopSao(cand.sao, boLoc.sao)) return false

      // 3. Lọc theo thể loại (lý thuyết / bài tập)
      if (boLoc.dang === 'ly_thuyet' && cand.dang !== 'ly_thuyet') return false
      if (boLoc.dang === 'bai_tap' && cand.dang !== 'bai_tap') return false

      return true
    })

    for (const u of ungVienLoc) {
      tapUngVienPhanBiet.add(u.id)
    }

    return {
      qid: cs.qid,
      soCau: cs.soCau,
      phan: cs.phan,
      nhanDan: nhan.ma || nhan.ten,
      tenDang: nhan.ten || nhan.ma,
      soUngVienToiDa: ungVienLoc.length,
      ungVien: ungVienLoc,
    }
  })

  // Tổng số câu khớp bộ lọc (tối đa 100 câu trên thanh trượt theo yêu cầu)
  const tongCo = thongKe.reduce((acc, cur) => acc + cur.soUngVienToiDa, 0)
  const tongToiDa = Math.min(100, Math.min(tongCo, tapUngVienPhanBiet.size))

  const tinhSoCauMoiDang = (tongSoCauRut: number): Map<string, number> => {
    const ketQua = new Map<string, number>()
    if (tongToiDa <= 0 || tongSoCauRut <= 0) {
      for (const t of thongKe) ketQua.set(t.qid, 0)
      return ketQua
    }

    const K = Math.min(tongSoCauRut, tongToiDa)
    for (const t of thongKe) {
      if (t.soUngVienToiDa <= 0) {
        ketQua.set(t.qid, 0)
        continue
      }
      const tyLe = t.soUngVienToiDa / (tongCo || 1)
      const phanBo = Math.ceil(K * tyLe)
      const soCauChon = Math.min(t.soUngVienToiDa, Math.max(1, phanBo))
      ketQua.set(t.qid, soCauChon)
    }

    return ketQua
  }

  return { thongKe, tongToiDa, tinhSoCauMoiDang }
}

/** Rút đề theo bộ lọc sao & thể loại */
export function rutLuyenTheoBoLoc(
  dsCauSai: CauSaiDauVao[],
  khoDe: TeacherExamSource[],
  boLoc: BoLocCauLuyen,
  soCauRut: number,
  thongTin: { hoTen: string; sbd: string; tenDe?: string }
): { html: string; dsCau: CauLuyen[] } {
  const { thongKe, tongToiDa, tinhSoCauMoiDang } = phanTichBoLocCau(dsCauSai, khoDe, boLoc)
  const phanBo = tinhSoCauMoiDang(soCauRut)

  const dsCauRut: CauLuyen[] = []
  const daLayId = new Set<string>()

  for (const t of thongKe) {
    const soLuong = phanBo.get(t.qid) ?? 0
    let dem = 0
    for (const cand of t.ungVien) {
      if (dem >= soLuong) break
      if (!daLayId.has(cand.id)) {
        daLayId.add(cand.id)
        dsCauRut.push({
          ...cand,
          chuaCho: {
            qid: t.qid,
            soCau: t.soCau,
            phan: t.phan,
            maDang: t.nhanDan,
            tenDang: t.tenDang,
            bac: 1,
          },
        })
        dem++
      }
    }
  }

  // Nhãn sao và dạng
  const nhanSao = boLoc.sao === 'sao_2' ? '2 sao' : boLoc.sao === 'sao_1' ? '1 sao' : boLoc.sao === 'sao_0' ? '0 sao' : 'mọi sao'
  const nhanDang = boLoc.dang === 'ly_thuyet' ? 'Lý thuyết' : boLoc.dang === 'bai_tap' ? 'Bài tập' : 'mọi dạng'

  const tt: ThongTinPhieu = {
    hoTen: thongTin.hoTen,
    sbd: thongTin.sbd,
    ngay: new Date(),
    tenChuyenDe: thongTin.tenDe || `ĐỀ ÔN THEO BỘ LỌC (${nhanSao} · ${nhanDang})`,
    ketQua: `Gồm ${dsCauRut.length} câu (rút từ tối đa ${tongToiDa} câu)`,
    hienDapAn: false,
    nhanBia: 'BỘ LỌC CÂU LUYỆN',
  }
  const html = dungPhieu(tt, dsCauRut, { anGiai: false })
  return { html, dsCau: dsCauRut }
}

// ============================================================================
// CHẾ ĐỘ 4 — LUYỆN DẠNG BÀI (15/09)
//
// Khác hẳn ba chế độ trên: ba chế độ kia đi từ CÂU EM SAI, chế độ này đi từ
// DANH MỤC DẠNG TOÁN TRỌNG TÂM của sách. Em chọn lớp → tên bài → dạng, máy chủ
// trả TRỌN tờ đề của dạng ấy (`xong/Dạng bài/<lớp>/<bài>/<mã>.json` trong kho),
// ở đây chỉ còn việc trộn và cắt theo thanh trượt.
//
// KHÔNG lọc lại theo nhãn sao hay thể loại: dạng bài đã là ranh giới rồi, lọc
// thêm là em kéo thanh trượt lên 100 mà chỉ nhận về 7 câu.

/** Trộn tại chỗ, Fisher–Yates. Mỗi lượt rút một thứ tự khác nhau — em luyện
 * dạng ấy lần thứ ba không gặp lại đúng 20 câu đầu. */
function tronMang<T>(ds: T[]): T[] {
  const a = ds.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Số câu dùng được của một dạng bài — đếm SAU khi qua cửa nạp, vì cửa nạp bỏ
 * câu thiếu phương án hoặc thiếu đáp án. Con số trên thanh trượt phải là con số
 * THẬT sẽ rút được, không phải `so_cau` ghi trong gói. */
export function demCauDangBai(khoDangBai: TeacherExamSource[]): number {
  return cauLuyenTuNguon(khoDangBai).length
}

export function rutLuyenDangBai(
  khoDangBai: TeacherExamSource[],
  soCauRut: number,
  thongTin: { hoTen: string; sbd: string; tenDang: string; tenBai: string; lop: string },
): { html: string; dsCau: CauLuyen[] } {
  const tatCa = cauLuyenTuNguon(khoDangBai)
  const dsCauRut = tronMang(tatCa).slice(0, Math.max(0, soCauRut))

  const tt: ThongTinPhieu = {
    hoTen: thongTin.hoTen,
    sbd: thongTin.sbd,
    ngay: new Date(),
    tenChuyenDe: `${thongTin.tenDang} — Lớp ${thongTin.lop} · ${thongTin.tenBai}`,
    ketQua: `Gồm ${dsCauRut.length} câu (kho có ${tatCa.length} câu thuộc dạng này)`,
    hienDapAn: false,
    nhanBia: 'LUYỆN DẠNG BÀI',
  }
  const html = dungPhieu(tt, dsCauRut, { anGiai: false })
  return { html, dsCau: dsCauRut }
}

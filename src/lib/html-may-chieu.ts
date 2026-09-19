import {experimentHtml,experimentOriginal} from './experiments/render'
// TỜ MÁY CHIẾU — GỌI HAI EM LÊN BẢNG MỘT ĐỢT.
//
// Thầy chốt 14/09: "tạo ra 1 file html thiết kế theo chuẩn quay ngang được chia
// làm 2 phần, mỗi một trang sẽ in tên 2 học sinh vào 2 nửa và đề bài đi kèm để
// gọi lên bảng, đề bài có nút hiện lời giải, phần dưới trắng để học sinh lên
// bảng làm ở trên bảng khi tôi chiếu lên, file html này xong 1 đợt thì lại kéo
// xuống hoặc bấm tiếp để hiện 2 đề và 2 học sinh tiếp theo."
//
// Đọc ra bốn ràng buộc, và đây là chỗ giữ cả bốn:
//   1. QUAY NGANG, chia đôi theo chiều dọc — hai nửa là hai nửa bảng thật.
//   2. Mỗi nửa: TÊN EM trên cùng, ĐỀ BÀI ngay dưới, rồi CHỪA TRẮNG. Khoảng
//      trắng ấy chiếu lên bảng chính là chỗ em viết, nên nó phải thật sự trắng
//      và phải chiếm nửa dưới màn hình.
//   3. Mỗi nửa có nút hiện lời giải RIÊNG — chữa xong em nào thì mở em ấy.
//   4. Một đợt một màn. Kéo xuống hay bấm "Tiếp" đều sang hai em tiếp theo.
//
// Chữ và công thức đi qua đúng `chuHtml` của phiếu, nên mhchem, chỉ số dưới và
// ký tự hoá học hiện y như mọi tờ khác. Lời giải dùng lại `oGiaiHtml` — cùng
// một khuôn với báo cáo và phiếu, không dựng khuôn thứ hai.
import type { CauLuyen } from './bai-tap-pdf'
import { CSS_PHIEU, anhHtml, bangHtml, chuHtml, dapAnChu, hinhTaiViTri, oGiaiHtml, thoat } from './html-phieu'
import { noiDungTuCauLuyen, thoiGianCau } from './thoi-gian-len-bang'
import { CSS_BO_CUC, jsBoCuc } from './bo-cuc-to-chieu'
import { CSS_CAU_NOI_TO_CHIEU, chuanMaPhien, jsCauNoiToChieu, khoaToChieu, mangNutChamToChieu } from './to-chieu-cau-noi'

/** Một ô bảng: một em, một câu. */
export interface OBang {
  sbd: string
  hoTen: string
  /** Mã câu (qid) — CHỈ để tờ chiếu ghi kết quả Đạt / Không đạt về màn giáo viên (`cauNoi`). Thiếu thì ô
   * không có nút. Không bao giờ hiện thành chữ trên tờ. */
  qid?: string
  /** BẬC BỐ CỤC ƯỚC LƯỢNG lúc xếp buổi (`uoc-luong-bo-cuc.ts`): 1 = vừa nửa bảng, ghép đôi được; ≥ 2 = phải chiếm 2/3 bảng
   * trở lên. Có thì tờ CHỈ GHÉP ĐÔI hai câu cùng bậc 1 (câu bậc ≥ 2 đứng một mình); thiếu thì lùi về đoán `laCauDai`.
   * Ước lượng sai một bậc không gây tràn chữ: tờ chiếu luôn đo lại (`bo-cuc-to-chieu.ts`) và tự tách/gộp. */
  bacUoc?: 1 | 2 | 3 | 4 | 5
  /** Số thứ tự câu in cho em nhìn. */
  soCau: number
  sao?: number
  mucDo?: string
  cau: CauLuyen
  /** Vì sao gọi đúng em này lên câu này — in nhỏ dưới tên. */
  viSao?: string
  /** BÀI TẬP VỀ NHÀ CỦA ĐÚNG CÂU NÀY: em ở nhà làm đúng, sai, hay chưa làm.
   * Bỏ trống nghĩa là câu này không nằm trong bài giao về nhà — KHÁC "chưa
   * làm", nên tờ chiếu không hiện gì thay vì hiện nhầm. */
  btvnCau?: 'dung' | 'sai' | 'chuaLam'
  /** Cả lượt bài tập về nhà của em: làm bao nhiêu trên tổng, đúng, sai, chưa
   * làm. Bỏ trống nghĩa là em chưa được giao bài nào. */
  btvnTom?: { soCauGiao: number; soDaLam: number; soDung: number; soSai: number; soChuaLam: number }
  /** THẦN THÚ CỦA EM — góc phải tờ chiếu. Bỏ trống khi em chưa chọn thần thú
   * hoặc máy chủ không trả kịp; tờ chiếu khi ấy in như cũ, không chừa ô rỗng. */
  thanThu?: {
    anh: string
    ten: string
    danhHieu: string
    he: string
    capDo: number
    hinhThai: string
    tangThapCaoNhat: number
    soCauDaThanhTay: number
    earned?: number
    capToiDa?: number
  }
}

/** Chữ và màu cho từng trạng thái bài tập về nhà trên tờ chiếu. */
const NHAN_BTVN: Record<'dung' | 'sai' | 'chuaLam', string> = {
  sai: 'Ở NHÀ LÀM SAI',
  chuaLam: 'Ở NHÀ CHƯA LÀM',
  dung: 'Ở NHÀ LÀM ĐÚNG',
}

export interface TuyChonMayChieu {
  tenBuoi?: string
  dayHoc?: boolean
  ngay?: Date
  /** CÂU CHỈ ĐỌC ĐÁP ÁN — thầy chốt 14/09: "số câu còn lại chưa được chữa được
   * chiếu đáp án lên bảng qua mục máy chiếu".
   *
   * Những câu này không gọi em nào lên bảng, nên chúng đi thành mấy TRANG ĐÁP
   * ÁN nối sau các đợt: thầy lật tiếp là chiếu đáp án cho cả lớp dò. */
  dsDapAn?: CauLuyen[]
  /** CẦU NỐI VỀ MÀN GIÁO VIÊN (thầy chốt 19/09: "cho lên máy chiếu luôn"). Có thì mỗi ô em × câu (có `qid`)
   * mang hai nút Đạt / Không đạt — ẨN cho tới khi màn giáo viên trả lời bắt tay, và BỎ HẲN nếu tờ được mở
   * riêng (tệp đã lưu, tab riêng): khi ấy không có ai để ghi. Không có `cauNoi` thì tờ không có nút, mã phiên,
   * kiểu chữ hay script cầu nối nào. Xem `to-chieu-cau-noi.ts`. */
  cauNoi?: { maPhien: string }
}

/** Khi có bậc ước lượng: một câu bậc 1 tìm bạn ghép đôi trong bấy nhiêu câu kế tiếp (kéo lên, không xáo trộn xa). */
const CUA_SO_TIM_BAN_GHEP = 6

/** Số câu mỗi trang đáp án. Chiếu lên tường thì 12 dòng là vừa mắt từ cuối lớp;
 * nhồi hơn là em ngồi xa không đọc nổi. */
export const SO_DAP_AN_MOI_TRANG = 12

const CHU_PA = ['A', 'B', 'C', 'D']
const CHU_Y = ['a', 'b', 'c', 'd']

function ngayVn(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

/** Thân câu cho máy chiếu: đề, bảng, ảnh, rồi các phương án / ý.
 *
 * KHÔNG in đáp án ở đây. Đáp án nằm trong khối lời giải, và khối ấy đóng cho
 * tới khi thầy bấm — nếu không thì chiếu lên là cả lớp đọc được đáp án trước
 * khi em kịp cầm phấn. */
/** Preserve explicit author line breaks without interpreting arbitrary HTML. */
export function chuDeChieu(s?: string): string {
  if (!s) return ''
  return s.replace(/\r\n?/g,'\n').replace(/<br\s*\/?\s*>/gi,'\n').split('\n').map(line=>chuHtml(line)).join('<br>')
}

/**
 * Tính toán câu dài / ngắn cho máy chiếu:
 * - Nếu cả 2 câu đủ ngắn hiển thị đủ ở 2 nửa bảng thì chia đôi bảng.
 * - Nếu câu dài không hiển thị đủ nửa bảng thì chiếu 1 câu đó lên 2/3 bảng, 1/3 để trống để học sinh lên làm bên đó.
 */
export function laCauDai(c: CauLuyen | undefined): boolean {
  if (!c) return false
  const text = c.text || ''
  const hasImage = Boolean(c.anhThanCau || (c.anhLuaChon && c.anhLuaChon.some(Boolean)) || /<img\b/i.test(text))
  const hasTable = Boolean(c.bang) || /<table\b/i.test(text)

  // Nếu có ảnh hoặc bảng số liệu, chiếm dụng chiều dọc rất lớn -> câu dài
  if (hasImage || hasTable) {
    if (text.length > 90) return true
    if (c.phan === 'I' && c.luaChon && c.luaChon.some((p) => (p || '').length > 30)) return true
    if (c.phan === 'II') return true
  }

  // Đoạn văn đề bài dài hơn 280 ký tự hoặc từ 4 dòng trở lên
  if (text.length > 280) return true
  const soDong = text.split(/\r\n|\r|\n|<br\s*\/?>/i).length
  if (soDong >= 4) return true

  // Theo từng phần
  if (c.phan === 'II' && c.luaChon && c.luaChon.length > 0) {
    const tongDoDaiY = c.luaChon.reduce((acc, y) => acc + (y || '').length, 0)
    if (text.length + tongDoDaiY > 320) return true
    if (c.luaChon.some((y) => (y || '').length > 80)) return true
  } else if (c.phan === 'I' && c.luaChon && c.luaChon.length > 0) {
    const tongDoDaiPa = c.luaChon.reduce((acc, p) => acc + (p || '').length, 0)
    if (text.length + tongDoDaiPa > 360) return true
    if (c.luaChon.some((p) => (p || '').length > 65)) return true
  } else if (c.phan === 'III') {
    if (text.length > 250) return true
  }

  return false
}

function thanCauHtml(c: CauLuyen): string {
  const khoi: string[] = []

  if (c.anhThanCau) {
    khoi.push(anhHtml(c.anhThanCau, 'mc-anh', 'Ảnh đề bài'))
  } else {
    khoi.push(`<div class="mc-de">${chuDeChieu(c.text)}</div>`)
  }
  if (c.text) {
    khoi.push(experimentHtml(c.text))
    khoi.push(experimentOriginal(c.text, hinhTaiViTri(c, 'sau_de')))
  } else {
    khoi.push(hinhTaiViTri(c, 'sau_de'))
  }
  khoi.push(bangHtml(c.bang))

  if (c.phan === 'I' && c.luaChon && c.luaChon.length > 0) {
    const o = c.luaChon.map((nd, i) => {
      const anh = c.anhLuaChon?.[i]
      const than = anh ? anhHtml(anh, 'mc-anh-pa', `Phương án ${CHU_PA[i]}`) : chuDeChieu(nd)
      return `<div class="mc-pa"><span class="mc-ky">${CHU_PA[i] ?? i + 1}</span><span class="mc-pa-chu">${than}</span>${hinhTaiViTri(c, `sau_pa_${CHU_PA[i]}`)}</div>`
    })
    khoi.push(`<div class="mc-ds-pa mc-auto-options">${o.join('')}</div>`)
  } else if (c.phan === 'II' && c.luaChon && c.luaChon.length > 0) {
    const o = c.luaChon.map((nd, i) => {
      const anh = c.anhLuaChon?.[i]
      const than = anh ? anhHtml(anh, 'mc-anh-pa', `Ý ${CHU_Y[i]}`) : chuDeChieu(nd)
      return `<div class="mc-pa"><span class="mc-ky">${CHU_Y[i] ?? i + 1}</span><span class="mc-pa-chu">${than}</span></div>${hinhTaiViTri(c, `sau_y_${CHU_Y[i]}`)}`
    })
    khoi.push(`<div class="mc-ds-pa">${o.join('')}</div>`)
  } else if (c.phan === 'III') {
    khoi.push('<div class="mc-ngan">Trả lời ngắn — em viết kết quả và trình bày các bước lên bảng.</div>')
  }

  khoi.push(hinhTaiViTri(c, 'cuoi_cau'))
  return khoi.filter(Boolean).join('')
}

/** Một nửa bảng. `oB` rỗng nghĩa là đợt cuối lẻ một em — nửa kia để trắng hẳn,
 * không bịa thêm một em nào cho đủ cặp. */
/** DÒNG BÀI TẬP VỀ NHÀ dưới tên em (thầy chốt 14/09).
 *
 * Hai thứ, đúng thứ tự thầy hỏi: câu ĐANG GỌI em ở nhà làm ra sao, rồi cả lượt
 * em làm được bao nhiêu trên tổng số câu được giao. Không có dữ liệu thì không
 * in dòng nào — cấm dựng số. */
function btvnHtml(o: OBang): string {
  const o1 = o.btvnCau ? `<span class="mc-btvn-the mc-btvn-${o.btvnCau}">${NHAN_BTVN[o.btvnCau]}</span>` : ''
  const t = o.btvnTom
  const o2 =
    t && t.soCauGiao > 0
      ? `<span class="mc-btvn-so">Về nhà: làm ${t.soDaLam}/${t.soCauGiao} câu · đúng ${t.soDung} · sai ${t.soSai} · chưa làm ${t.soChuaLam}</span>`
      : ''
  return o1 || o2 ? `<div class="mc-btvn">${o1}${o2}</div>` : ''
}

/** Góc thần thú — thầy chốt 15-09: mỗi em lên bảng thì thú của em hiện ra. */
function thuHtml(o: OBang): string {
  const t = o.thanThu
  if (!t) return ''
  const anh = t.anh !== ''
    ? `<img class="mc-thu-anh" src="${t.anh}" alt="" />`
    : '<div class="mc-thu-anh mc-thu-trong" aria-hidden="true"></div>'
  return `<aside class="mc-thu">
      ${anh}
      <div class="mc-thu-chu">
        <div class="mc-thu-ten">${thoat(t.ten)}</div>
        <div class="mc-thu-cap"><b>Cấp ${t.capDo}/${t.capToiDa??120}</b> · ${thoat(t.hinhThai)}</div>
        <div class="mc-thu-so">Tháp tầng ${t.tangThapCaoNhat} · ${t.earned!==undefined?`${t.earned} EXP đã học`:`thanh tẩy ${t.soCauDaThanhTay} câu`}</div>
      </div>
    </aside>`
}

/** Header học sinh: nổi hẳn lên trên (sticky), gọn gàng chuẩn Google */
function headerEmHtml(o: OBang, ma: string): string {
  return `<header class="mc-em" id="em-${ma}">
    <div class="mc-em-trai">
      <div class="mc-em-hang1">
        <span class="mc-ten">${thoat(o.hoTen || o.sbd)}</span>
        <div class="mc-phu">
          <span class="mc-sbd">${thoat(o.sbd)}</span>
          <span class="mc-cau-so">Câu ${o.soCau} · Phần ${o.cau.phan}</span>
        </div>
        ${btvnHtml(o)}
      </div>
      ${o.viSao ? `<div class="mc-viSao">${thoat(o.viSao)}</div>` : ''}
    </div>
    ${thuHtml(o)}
  </header>`
}

/** Thời gian ĐỌC VÀ LÀM của chế độ dạy học (đồng hồ đếm ngược trước khi mời em lên bảng): làm tròn 15 giây, giới hạn 1–3 phút.
 *
 * Từ M1 (19/09) dùng CHUNG `thoiGianCau` (`thoi-gian-len-bang.ts`) với Engine E — không còn công thức thứ hai:
 * T_đọc + T_làm theo phần, sao, độ dài đề, hình/bảng. Kẹp 60–180 s là của RIÊNG chế độ dạy học (test `day-hoc-dem-nguoc`). */
export function thoiGianDayHoc(o: OBang): number {
  const sao = (o.sao === 0 || o.sao === 1 || o.sao === 2 ? o.sao : o.mucDo === 'van_dung' ? 2 : o.mucDo === 'hieu' ? 1 : 0) as 0 | 1 | 2
  const t = thoiGianCau({ phan: o.cau.phan, sao, noiDung: noiDungTuCauLuyen(o.cau) })
  return Math.max(60, Math.min(180, Math.round((t.doc + t.lam) / 15) * 15))
}

/** Hai nút Đạt / Không đạt của một ô — chỉ khi tờ được dựng kèm `cauNoi` và ô có `qid`. Mảnh markup, CSS và JS nằm
 * ở `to-chieu-cau-noi.ts` (tờ chiếu chỉ việc đặt mảnh này ở đâu thầy muốn). TẾ NHỊ TRƯỚC LỚP: xem ghi chú ở đó. */
function chamHtml(o: OBang, cauNoi: boolean): string {
  return cauNoi && o.qid ? mangNutChamToChieu(khoaToChieu(o.sbd, o.qid)) : ''
}

function nuaHtml(o: OBang | undefined, viTri: 'trai' | 'phai', maDot: number, cauNoi = false, dayHoc = false): string {
  if (!o) {
    return `<section class="mc-nua mc-${viTri} mc-trong" aria-hidden="true"><div class="mc-trong-chu">Đợt này chỉ gọi một em</div></section>`
  }
  const ma = `giai-${maDot}-${viTri}`
  // `data-giay`: giờ ĐỌC + LÀM của chính câu này — để đợt bị TÁCH lúc chiếu (M2) tính lại thời gian từng đợt.
  return `<section class="mc-nua mc-${viTri}"${dayHoc ? ` data-giay="${thoiGianDayHoc(o)}"` : ''}>
  <button type="button" class="mc-nut-hien-em mc-nut-giai" aria-expanded="false" aria-controls="em-${ma}">Hiện học sinh và thần thú →</button>
  ${headerEmHtml(o, ma)}
  <div class="mc-vung-de"><div class="mc-than">${thanCauHtml(o.cau)}</div>
    <div class="mc-giai" id="${ma}" hidden>${oGiaiHtml(o.cau)}</div>
  </div>
  <div class="mc-giai-vung">
    <button type="button" class="mc-nut-giai" aria-expanded="false" aria-controls="${ma}">
      <span class="mc-nut-chu">Hiện lời giải</span>
    </button>${chamHtml(o, cauNoi)}
  </div>
  <div class="mc-trang" aria-hidden="true"></div>
</section>`
}

/** Đợt chiếu hai em chia đôi bảng 50% - 50% khi cả 2 câu đủ ngắn */
function dotHaiEmHtml(o1: OBang, o2: OBang | undefined, soDot: number, tuyChon: TuyChonMayChieu): string {
  const secondsAttr = tuyChon.dayHoc ? `data-seconds="${Math.max(thoiGianDayHoc(o1), o2 ? thoiGianDayHoc(o2) : 0)}"` : ''
  const cauNoi = Boolean(tuyChon.cauNoi?.maPhien)
  return `<div class="mc-dot" data-dot="${soDot}" ${secondsAttr}>${nuaHtml(o1, 'trai', soDot, cauNoi, Boolean(tuyChon.dayHoc))}${nuaHtml(o2, 'phai', soDot, cauNoi, Boolean(tuyChon.dayHoc))}</div>`
}

/** Đợt chiếu một em khi câu dài: 2/3 bảng chiếu câu hỏi, 1/3 bảng để trống cho học sinh lên làm */
function dotMotEmHtml(o: OBang, soDot: number, tuyChon: TuyChonMayChieu): string {
  const secondsAttr = tuyChon.dayHoc ? `data-seconds="${thoiGianDayHoc(o)}"` : ''
  const ma = `giai-${soDot}-don`
  return `<div class="mc-dot mc-dot-don" data-dot="${soDot}" ${secondsAttr}>
  <section class="mc-nua mc-don"${tuyChon.dayHoc ? ` data-giay="${thoiGianDayHoc(o)}"` : ''}>
    <button type="button" class="mc-nut-hien-em mc-nut-giai" aria-expanded="false" aria-controls="em-${ma}">Hiện học sinh và thần thú →</button>
    ${headerEmHtml(o, ma)}
    <div class="mc-vung-de"><div class="mc-than">${thanCauHtml(o.cau)}</div>
      <div class="mc-giai" id="${ma}" hidden>${oGiaiHtml(o.cau)}</div>
    </div>
    <div class="mc-giai-vung">
      <button type="button" class="mc-nut-giai" aria-expanded="false" aria-controls="${ma}">
        <span class="mc-nut-chu">Hiện lời giải</span>
      </button>${chamHtml(o, Boolean(tuyChon.cauNoi?.maPhien))}
    </div>
    <div class="mc-trang" aria-hidden="true"></div>
  </section>
  <section class="mc-cot-lam-bai" aria-label="Bảng để học sinh lên làm"></section>
</div>`
}

/** Một trang ĐÁP ÁN — lưới câu và đáp án, chiếu cho cả lớp dò. */
function trangDapAnHtml(ds: CauLuyen[], tu: number, tong: number): string {
  const o = ds
    .map(
      (c) => `<div class="mc-da-o">
      <span class="mc-da-so">${thoat(c.phan)}.${c.chuaCho ? thoat(String(c.chuaCho.soCau)) : ''}${c.chuaCho ? '' : ''}</span>
      <span class="mc-da-dap">${chuHtml(dapAnChu(c))}</span>
      ${c.chot ? `<span class="mc-da-chot">${chuHtml(c.chot)}</span>` : ''}
    </div>`,
    )
    .join('')
  return `<div class="mc-dot mc-dot-da" data-dap-an="1">
  <section class="mc-nua mc-da-trang">
    <header class="mc-em">
      <div class="mc-ten">Đáp án các câu còn lại</div>
      <div class="mc-phu"><span>Cả lớp tự dò · không gọi lên bảng</span><span class="mc-cau-so">${tu + 1}–${tu + ds.length} trong ${tong} câu</span></div>
    </header>
    <div class="mc-da-luoi">${o}</div>
  </section>
</div>`
}

/** CSS riêng cho máy chiếu. Chồng lên `CSS_PHIEU` nên khối lời giải vẫn y hệt
 * mọi tờ khác; chỉ cỡ chữ và bố cục là của phòng học có máy chiếu. */
const CSS_MAY_CHIEU = `
#mc-clock {padding:12px 24px;border-radius:20px;background:linear-gradient(120deg,#075985,#2563eb);color:white;font-size:clamp(22px,3vw,42px);font-weight:900;font-variant-numeric:tabular-nums;box-shadow:0 6px 24px #2563eb40;border:2px solid #7dd3fc;white-space:nowrap}
#mc-clock.mc-sap-het {background:linear-gradient(120deg,#be123c,#ea580c);border-color:#fda4af}
.mc-day-hoc .mc-em {padding:16px;border:1px solid #93c5fd;border-radius:22px;background:linear-gradient(125deg,#eff6ff,#e0f2fe,#ede9fe);box-shadow:0 8px 24px #2563eb18;color:#172554;margin-bottom:14px}
.mc-day-hoc .mc-phai .mc-em {background:linear-gradient(125deg,#fdf2f8,#fae8ff,#ede9fe);border-color:#f0abfc;color:#701a75}
.mc-day-hoc .mc-ten {font-weight:900;letter-spacing:-.025em}
.mc-day-hoc .mc-thu {background:#ffffffb8;border-color:#ffffff;border-radius:18px}
.mc-intro {position:fixed;inset:0;z-index:99999;display:flex;align-items:stretch;justify-content:center;background:transparent;color:white;font-family:system-ui,sans-serif;pointer-events:none;overflow:hidden}
.mc-intro-card {flex:1;min-width:0;position:relative;isolation:isolate;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;overflow:hidden;--aura:#22d3ee;--spark:#fef08a}
.mc-intro-card:nth-of-type(3) {--aura:#e879f9;--spark:#fde68a}
.mc-intro-card:before,.mc-intro-card:after {content:'';position:absolute;inset:-20%;z-index:-1;pointer-events:none;border-radius:50%;background:radial-gradient(ellipse,transparent 12%,color-mix(in srgb,var(--aura) 55%,transparent) 30%,transparent 68%);animation:mc-aura-bloom 1.8s ease-in-out infinite alternate}
.mc-intro-card:after {background:conic-gradient(from 0deg,transparent 0deg,var(--aura) 12deg,transparent 25deg,transparent 70deg,var(--spark) 82deg,transparent 95deg,transparent 145deg,var(--aura) 157deg,transparent 172deg,transparent 230deg,var(--spark) 242deg,transparent 255deg,transparent 310deg,var(--aura) 322deg,transparent 340deg);opacity:.26;mask-image:radial-gradient(ellipse,transparent 8%,#000 32%,transparent 68%);animation:mc-aura-turn 12s linear infinite}
.mc-intro-card img {width:min(47vw,68vh);height:min(47vw,68vh);object-fit:contain;background:transparent;border:0;filter:drop-shadow(0 0 18px var(--aura)) drop-shadow(0 0 45px var(--aura));z-index:1}
.mc-intro-card h2 {color:white;text-shadow:0 2px 5px #172554,0 0 22px var(--aura);font-size:clamp(24px,4vw,60px);line-height:1.15;margin:12px 0 8px;z-index:1}
.mc-intro-card p {color:white;text-shadow:0 2px 5px #172554,0 0 18px var(--aura);font-size:clamp(16px,2vw,28px);font-weight:700;z-index:1}
.mc-spark {position:absolute;left:var(--x);top:var(--y);width:var(--size);height:var(--size);background:var(--spark);clip-path:polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%);filter:drop-shadow(0 0 7px var(--aura));animation:mc-spark-float 2s ease-in-out infinite;animation-delay:var(--delay);pointer-events:none}
@keyframes mc-aura-bloom {from{transform:scale(.8);opacity:.55}to{transform:scale(1.15);opacity:.9}}
@keyframes mc-aura-turn {to{transform:rotate(360deg)}}
@keyframes mc-spark-float {0%,100%{transform:translateY(12px) scale(.5);opacity:.2}50%{transform:translateY(-24px) scale(1.3);opacity:1}}
.mc-intro.mc-shrink .mc-intro-card {overflow:visible}
.mc-intro.mc-shrink .mc-intro-card:before,.mc-intro.mc-shrink .mc-intro-card:after,.mc-intro.mc-shrink .mc-spark {display:none}
.mc-intro-label {position:absolute;z-index:2;top:3vh;left:0;right:0;text-align:center;letter-spacing:.2em;color:white;text-shadow:0 2px 6px #172554,0 0 20px #06b6d4;font-weight:800}
.mc-intro-close {position:absolute;right:20px;bottom:20px;border:1px solid #94a3b8;border-radius:30px;padding:12px 22px;background:#ffffffe6;color:#172554;cursor:pointer;pointer-events:auto}
@media(max-width:900px){.mc-intro{flex-direction:column}.mc-intro-card img{width:min(65vw,30vh);height:min(65vw,30vh)}.mc-intro-card h2{font-size:26px;margin:4px}.mc-intro-card p{margin:4px;font-size:16px}}
@media print {#mc-clock,.mc-intro {display:none!important}}

:root { --mc-serif: "Times New Roman", Palatino, Charter, Georgia, serif; --mc-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; --mc-vien: rgb(226, 232, 240); --mc-nen: rgb(255, 255, 255); --mc-muc: rgb(15, 23, 42); --mc-nhat: rgb(100, 116, 139); --mc-xanh: rgb(26, 115, 232); --mc-xanh-nen: rgb(232, 240, 254); --mc-do: rgb(197, 34, 31); --mc-do-nen: rgb(252, 232, 230); --mc-cam: rgb(169, 94, 0); --mc-cam-nen: rgb(254, 239, 195); --mc-luc: rgb(20, 108, 67); --mc-luc-nen: rgb(230, 244, 234); }
@media (prefers-color-scheme: dark) {
  :root:not([data-sang]) { --mc-vien: rgb(51, 65, 85); --mc-nen: rgb(15, 23, 42); --mc-muc: rgb(241, 245, 249); --mc-nhat: rgb(148, 163, 184); --mc-xanh: rgb(138, 180, 248); --mc-xanh-nen: rgb(30, 41, 59); --mc-do: rgb(242, 139, 130); --mc-do-nen: rgb(66, 27, 26); --mc-cam: rgb(253, 214, 99); --mc-cam-nen: rgb(65, 48, 12); --mc-luc: rgb(129, 201, 149); --mc-luc-nen: rgb(24, 52, 37); }
}
body.mc { margin: 0; background: var(--mc-nen); color: var(--mc-muc); overflow: hidden; }
.mc-thanh { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; gap: 12px; padding: 10px 20px; background: var(--mc-nen); border-bottom: 1px solid var(--mc-vien); font-family: var(--sans, system-ui, sans-serif); }
.mc-thanh-trai { min-width: 0; flex: 0 1 auto; max-width: 40%; }
.mc-thanh-ten { font-weight: 800; font-size: 15px; }
.mc-thanh-phu { color: var(--mc-nhat); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mc-thanh-phu[data-ghi-chu] { color: var(--mc-muc); font-weight: 600; }
.mc-thanh-phu[data-ghi-chu="canh-bao"] { color: var(--mc-cam); }
.mc-dem { margin-left: auto; font-variant-numeric: tabular-nums; font-weight: 800; font-size: 15px; }
.mc-dieu { display: flex; gap: 8px; }
.mc-dieu button { min-height: 40px; padding: 0 18px; border: none; border-radius: 999px; background: var(--mc-xanh); color: rgb(255,255,255); font-weight: 800; font-size: 14px; cursor: pointer; font-family: inherit; }
.mc-dieu button[disabled] { opacity: .38; cursor: default; }
.mc-dieu button.mc-vien { background: transparent; color: var(--mc-xanh); border: 1px solid var(--mc-vien); }
/* TOÀN MÀN HÌNH: giấu luôn thanh điều khiển đi cho bảng sạch, chỉ chừa nút
   thoát ở góc. Chiếu lên tường thì mọi thứ không phải đề bài đều là nhiễu. */
:fullscreen .mc-thanh, :-webkit-full-screen .mc-thanh { position: fixed; top: 0; left: 0; right: 0; opacity: 0; transition: opacity .2s; }
:fullscreen .mc-thanh:hover, :-webkit-full-screen .mc-thanh:hover { opacity: 1; }
:fullscreen .mc-dot, :-webkit-full-screen .mc-dot { min-height: 100vh; }
/* MỘT ĐỢT LÀ MỘT TRANG, LẬT NGANG.
   Thầy chốt 14/09: "1 đợt là 1 trang chia đôi bảng chứ không cuộn xuống, khi
   bấm đợt tiếp thì chuyển sang trang tiếp theo theo chiều ngang".
   Bản trước xếp các đợt chồng dọc rồi cuộn xuống — chiếu lên tường thì thầy
   phải cuộn giữa giờ, và hai nửa của hai đợt khác nhau lọt chung một khung. */
.mc-ray { display: flex; height: calc(100vh - 61px); overflow-x: auto; overflow-y: hidden; scroll-snap-type: x mandatory; scroll-behavior: smooth; scrollbar-width: none; }
.mc-ray::-webkit-scrollbar { display: none; }
.mc-dot { flex: 0 0 100%; width: 100%; height: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 0; scroll-snap-align: start; scroll-snap-stop: always; }
.mc-dot-don { grid-template-columns: 2fr 1fr; }
.mc-cot-lam-bai { display: flex; flex-direction: column; padding: 18px 22px; border-left: 2px dashed var(--mc-vien); background: var(--mc-nen); min-height: 0; overflow: hidden; box-sizing: border-box; }
/* Nửa bảng tự cuộn khi câu quá dài — TRANG thì không bao giờ cuộn. */
.mc-nua { display: flex; flex-direction: column; padding: 18px 22px 0; min-width: 0; min-height: 0; overflow: hidden; position: relative; }
.mc-trai { border-right: 2px dashed var(--mc-vien); }
/* Vạch giữa hai đợt: nhìn là biết đã sang trang, không lẫn với vạch chia bảng. */
.mc-dot + .mc-dot .mc-trai, .mc-dot + .mc-dot-don .mc-nua { border-left: 4px solid var(--mc-vien); }
.mc-trong { align-items: center; justify-content: center; }
.mc-trong-chu { color: var(--mc-nhat); font-family: var(--sans, system-ui, sans-serif); font-size: 15px; }

/* THẺ TÊN HỌC SINH NỔI BẬT TRÊN ĐẦU (STICKY) — CUỘN BÀI GIẢNG KHÔNG BỊ MẤT THÔNG TIN HỌC SINH */
.mc-em { position: sticky; top: 0; z-index: 15; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 14px; margin: -18px -22px 12px; background: var(--mc-nen); border-bottom: 2px solid var(--mc-xanh); box-shadow: 0 3px 12px rgba(0, 0, 0, 0.05); }
.mc-em-trai { min-width: 0; flex: 1 1 auto; }
.mc-em-hang1 { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 12px; }

/* Góc thần thú gọn gàng, tinh tế */
.mc-thu { flex: 0 0 auto; display: flex; align-items: center; gap: 10px; width: auto; max-width: 48%; padding: 4px 10px 4px 6px; border: 1px solid var(--mc-vien); border-radius: 14px; font-family: var(--sans, system-ui, sans-serif); background: var(--mc-nen); }
.mc-thu-anh { width: 52px; height: 52px; object-fit: contain; display: block; flex: 0 0 auto; border-radius: 10px; background:radial-gradient(ellipse at center,rgba(63,147,148,.3),rgb(20,31,50)); animation:mc-thu-tho 4s ease-in-out infinite; }
@keyframes mc-thu-tho { 50% { transform:translateY(-3px); } }
@media(prefers-reduced-motion:reduce) { .mc-thu-anh { animation:none; } }
@media print { .mc-thu-anh { animation:none; } }
.mc-thu-trong { border-radius: 10px; background: var(--mc-vien); }
.mc-thu-chu { min-width: 0; line-height: 1.25; }
.mc-thu-ten { font-weight: 900; font-size: 13px; line-height: 1.2; }
.mc-thu-cap { margin-top: 2px; color: var(--mc-nhat); font-size: 11px; }
.mc-thu-cap b { color: inherit; font-weight: 800; }
.mc-thu-so { margin-top: 1px; color: var(--mc-nhat); font-size: 11px; font-variant-numeric: tabular-nums; }
@media (max-width: 1280px) { .mc-thu { max-width: 45%; } .mc-thu-anh { width: 44px; height: 44px; } .mc-thu-ten { font-size: 12px; } .mc-thu-cap, .mc-thu-so { font-size: 10px; } }

.mc-ten { font-family: var(--sans, system-ui, sans-serif); font-weight: 900; font-size: clamp(19px, 1.8vw, 28px); line-height: 1.2; }
.mc-phu { display: inline-flex; align-items: center; gap: 8px; color: var(--mc-nhat); font-family: var(--sans, system-ui, sans-serif); font-size: 13px; font-variant-numeric: tabular-nums; }
.mc-sbd { font-weight: 700; color: var(--mc-xanh); background: var(--mc-xanh-nen); padding: 2px 8px; border-radius: 6px; }
.mc-cau-so { font-weight: 700; color: var(--mc-muc); background: color-mix(in srgb, var(--mc-nen) 85%, var(--mc-muc)); padding: 2px 8px; border-radius: 6px; }
.mc-viSao { margin-top: 3px; color: var(--mc-nhat); font-family: var(--sans, system-ui, sans-serif); font-size: 12px; }
.mc-btvn { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 8px; font-family: var(--sans, system-ui, sans-serif); }
.mc-btvn-the { padding: 2px 10px; border-radius: 999px; font-weight: 900; font-size: 12px; letter-spacing: 0.03em; white-space: nowrap; }
.mc-btvn-sai { background: var(--mc-do-nen); color: var(--mc-do); }
.mc-btvn-chuaLam { background: var(--mc-cam-nen); color: var(--mc-cam); }
.mc-btvn-dung { background: var(--mc-luc-nen); color: var(--mc-luc); }
.mc-btvn-so { color: var(--mc-nhat); font-size: 12px; font-variant-numeric: tabular-nums; }
.mc-than { padding-top: 6px; }
.mc-de { font-family: var(--mc-serif); font-size: clamp(17px, 1.5vw, 23px); line-height: 1.55; }
.mc-ds-pa { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }
.mc-pa { display: flex; gap: 10px; align-items: baseline; font-family: var(--mc-serif); font-size: clamp(16px, 1.35vw, 21px); line-height: 1.5; }
.mc-ky { flex: none; width: 28px; height: 28px; border-radius: 999px; background: var(--mc-xanh-nen); color: var(--mc-xanh); font-family: var(--sans, system-ui, sans-serif); font-weight: 800; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; }
.mc-pa-chu { min-width: 0; }
.mc-ngan { margin-top: 10px; color: var(--mc-nhat); font-family: var(--sans, system-ui, sans-serif); font-size: 14px; }
.mc-anh, .mc-anh-pa { display: block; max-width: 100%; height: auto; }
/* TRANG ĐÁP ÁN — chiếm trọn bề ngang, không chia đôi bảng. */
.mc-dot-da { grid-template-columns: 1fr; }
.mc-da-trang { overflow-y: auto; }
.mc-da-luoi { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 10px 22px; margin-top: 16px; }
.mc-da-o { display: flex; align-items: baseline; gap: 10px; padding: 8px 12px; border-radius: 12px; background: var(--mc-xanh-nen); font-family: var(--mc-serif); font-size: clamp(16px, 1.3vw, 21px); }
.mc-da-so { font-family: var(--mc-sans); font-weight: 800; font-size: 14px; color: var(--mc-nhat); flex: none; }
.mc-da-dap { font-weight: 900; color: var(--mc-xanh); }
.mc-da-chot { min-width: 0; font-size: 0.82em; color: var(--mc-nhat); }
.mc-anh { max-height: 30vh; object-fit: contain; margin: 8px 0; }
.mc-anh-pa { max-height: 12vh; object-fit: contain; }
.mc-giai-vung { margin-top: 12px; }
.mc-nut-giai { min-height: 40px; padding: 0 16px; border: 1px solid var(--mc-vien); border-radius: 999px; background: transparent; color: var(--mc-muc); font-family: var(--sans, system-ui, sans-serif); font-weight: 700; font-size: 14px; cursor: pointer; }
.mc-nut-giai[aria-expanded="true"] { background: var(--mc-xanh-nen); color: var(--mc-xanh); border-color: var(--mc-xanh-nen); }
.mc-giai { margin-top: 10px; }
.mc-em[hidden] { display: none !important; }
@keyframes mc-ten-reveal {
  0% { transform: scale(2.2); opacity: 0; filter: drop-shadow(0 10px 24px rgba(35, 78, 107, 0.6)); }
  22% { transform: scale(2.2); opacity: 1; filter: drop-shadow(0 10px 24px rgba(35, 78, 107, 0.6)); }
  65% { transform: scale(1.35); opacity: 1; }
  100% { transform: scale(1); opacity: 1; filter: none; }
}
.mc-ten-reveal {
  display: inline-block;
  transform-origin: left center;
  animation: mc-ten-reveal 1.4s cubic-bezier(0.2, 0.9, 0.3, 1) forwards;
}
.mc-nut-hien-em { align-self: flex-start; margin-bottom: 12px; }
/* LỜI GIẢI PHẢI HIỆN RA. Thầy bắt được 14/09: bấm "Hiện lời giải" trên tờ
   chiếu thì khối mở ra nhưng TRẮNG TRƠN. Nguyên nhân gốc: oGiaiHtml trả về
   một div class="sol-box", mà trong CSS_PHIEU khối ấy để opacity 0 và
   transform translateY(-6px), chỉ được trả lại bằng luật ".q-card.mo
   .sol-box". Tờ chiếu dựng nửa bảng chứ không dựng thẻ câu nên không có tổ
   tiên .q-card.mo nào — chữ vẫn nằm đó mà mắt không thấy. Trả lại đúng hai
   thuộc tính ấy, và bỏ lề của phiếu vì ở đây khối nằm trong nửa bảng. */
.mc-giai .sol-box { opacity: 1 !important; transform: none !important; margin: 0; }
.mc-giai .sol-wrap { grid-template-rows: 1fr; }
/* PHẦN TRẮNG — chỗ em viết trên bảng thật. Nó phải trắng, và phải còn lại. */
/* PHẦN TRẮNG co lại được: trang không cuộn nên chỗ trống là phần còn thừa. */
.mc-trang { flex: 1 1 auto; min-height: 12vh; }
@media print {
  @page { size: A4 landscape; margin: 10mm; }
  .mc-thanh { display: none; }
  .mc-ray { display: block; height: auto; overflow: visible; }
  .mc-dot { display: grid; height: auto; page-break-after: always; }
  .mc-nua { overflow: visible; }
  .mc-trang { min-height: 30vh; }
  .mc-giai { display: block !important; }
}
@media (max-width: 900px) {
  /* Màn hẹp: hai nửa xếp trên dưới, NHƯNG vẫn lật trang theo chiều ngang. */
  .mc-dot { grid-template-columns: 1fr; grid-template-rows: 1fr 1fr; }
  .mc-dot-don { grid-template-columns: 1fr; grid-template-rows: auto auto; }
  .mc-cot-lam-bai { border-left: none; border-top: 2px dashed var(--mc-vien); min-height: 180px; }
  .mc-trai { border-right: none; border-bottom: 2px dashed var(--mc-vien); }
  .mc-dot + .mc-dot .mc-trai { border-left: none; }
  .mc-trang { min-height: 8vh; }
  .mc-em { margin: -18px -22px 10px; padding: 8px 12px; }
}


:root[data-projector="matte-light"]{--mc-nen:#c9c6bb;--mc-muc:#202727;--mc-nhat:#454d4d;--mc-vien:#92968d;--mc-xanh:#234e6b;--mc-xanh-nen:#b9c9ce;color-scheme:light}
:root[data-projector="matte-dark"]{--mc-nen:#242c2d;--mc-muc:#d8ddd6;--mc-nhat:#b8c1ba;--mc-vien:#56625f;--mc-xanh:#b3cfce;--mc-xanh-nen:#344747;color-scheme:dark}
:root[data-projector^="matte-"] body.mc{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.68' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Cpath filter='url(%23n)' opacity='.025' d='M0 0h180v180H0z'/%3E%3C/svg%3E")}
body.mc-timing .mc-ray{box-sizing:border-box;padding-bottom:64px}
:fullscreen .mc-ray{box-sizing:border-box;padding-top:68px}:fullscreen .mc-dot{min-height:0}
#mc-clock{position:fixed;right:18px;bottom:10px;z-index:30;margin:0;padding:8px 16px;border:1px solid var(--mc-vien);border-radius:14px;background:var(--mc-nen);color:var(--mc-muc);font:600 clamp(22px,2.2vw,32px)/1.15 var(--mc-sans);font-variant-numeric:tabular-nums;box-shadow:none;pointer-events:none;min-width:100px;text-align:center}
#mc-clock[hidden]{display:none!important}#mc-clock.mc-sap-het{background:var(--mc-nen);color:var(--mc-muc);border-color:var(--mc-xanh);box-shadow:inset 3px 0 var(--mc-xanh)}
/* Projector palette is explicit: never inherit the laptop's night mode. */
:root[data-projector="soft"]{--mc-nen:#dedbd1;--mc-muc:#20272c;--mc-nhat:#4f585e;--mc-vien:#aaa99f;--mc-xanh:#214f7c;--mc-xanh-nen:#cbd6df;color-scheme:light}
:root[data-projector="dark"]{--mc-nen:#18212b;--mc-muc:#e4e8e9;--mc-nhat:#b4c0ca;--mc-vien:#4b5a68;--mc-xanh:#b1cfff;--mc-xanh-nen:#293c51;color-scheme:dark}
.mc-de,.mc-pa{font-size:calc(clamp(24px,2.05vw,34px) * var(--mc-scale,1));line-height:1.45}.mc-da-o{font-size:calc(25px * var(--mc-scale,1))}.mc-giai .sol-box{font-family:var(--mc-serif);font-size:calc(clamp(24px,2.05vw,34px) * var(--mc-scale,1));line-height:1.45;background:var(--mc-nen);color:var(--mc-muc)}.mc-giai .sol-box *{color:inherit;font-size:inherit!important;line-height:inherit}.mc-giai .sol-box .sol-cot-loi{font-weight:600}.mc-giai .sol-box sub,.mc-giai .sol-box sup{font-size:.75em!important;line-height:0}.mc-giai .sol-box p,.mc-giai .sol-box li{font-size:inherit}.mc-trang{min-height:30vh;flex:1 0 30vh;border-top:1px dashed var(--mc-vien);margin-top:18px}.mc-thanh{flex-wrap:wrap;gap:8px}.mc-dieu{flex-wrap:wrap}.mc-thanh select{padding:8px;border:1px solid var(--mc-vien);border-radius:10px;background:var(--mc-nen);color:var(--mc-muc)}.mc-day-hoc .mc-em,.mc-day-hoc .mc-phai .mc-em,.mc-day-hoc .mc-thu{background:var(--mc-nen);color:var(--mc-muc);box-shadow:none}.mc-anh,.mc-anh-pa{background:#dedbd1}.mc-giai .sol-box img{max-width:100%}:fullscreen .mc-thanh:focus-within{opacity:1}
.mc-de,.mc-pa,.mc-giai .sol-box{font-size:calc(clamp(24px,2.05vw,34px) * var(--mc-scale,1));line-height:1.5;font-family:var(--mc-serif)}
.mc-de .katex,.mc-pa .katex,.mc-giai .sol-box .katex{font-size:1em!important}
.mc-pa{display:grid;grid-template-columns:1.4em minmax(0,1fr);align-items:baseline;column-gap:.35em;min-width:0}
.mc-ky{width:1.4em;height:auto;min-height:1.4em;font-size:1em;line-height:1.4;text-align:center;display:block;border-radius:.35em}
.mc-pa-chu{font-size:inherit;line-height:inherit;overflow-wrap:anywhere}
.mc-pa>img{grid-column:2;max-width:100%}
.mc-auto-options{display:grid;grid-template-columns:repeat(var(--mc-option-cols,1),minmax(0,1fr));gap:.4em .8em}
.mc-giai .sol-box .sol-cot-loi{font-weight:400}
.mc-giai .sol-box .sol-label,.mc-giai .sol-box h3,.mc-giai .sol-box h4{font-size:1em!important;line-height:1.5}
@media print{:root[data-projector]{--mc-nen:white;--mc-muc:black;--mc-nhat:#444}.mc-de,.mc-pa,.mc-giai .sol-box{font-size:20px}}
`

const JS_MAY_CHIEU = `
(function () {
  function fitOptions(goc){(goc||document).querySelectorAll('.mc-auto-options').forEach(function(grid){
    var available=grid.clientWidth,maxWidth=0;
    if(!available)return;
    Array.prototype.forEach.call(grid.children,function(option){
      if(option.querySelector('img,table')){maxWidth=available;return;}
      var copy=option.cloneNode(true);copy.style.cssText='position:absolute;visibility:hidden;width:max-content;max-width:none;grid-template-columns:1.4em max-content;pointer-events:none';
      grid.appendChild(copy);maxWidth=Math.max(maxWidth,copy.getBoundingClientRect().width);copy.remove();
    });
    var gap=parseFloat(getComputedStyle(grid).columnGap)||24;
    var cols=maxWidth*4+gap*3<=available?4:maxWidth*2+gap<=available?2:1;
    grid.style.setProperty('--mc-option-cols',String(cols));
  });}
  window.addEventListener('resize',function(){fitOptions()});
  window.__mcFitOptions=fitOptions; // bộ đo bố cục (bo-cuc-to-chieu.ts) chia lại cột phương án mỗi khi đổi bậc
  if(document.fonts)document.fonts.ready.then(function(){fitOptions()});
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(function(){fitOptions()});
  } else {
    fitOptions();
  }
  var palette=document.getElementById('mc-palette'),scale=document.getElementById('mc-size');
  function projectionSettings(){
    document.documentElement.dataset.projector=palette.value;
    document.documentElement.style.setProperty('--mc-scale',scale.value);
    try{localStorage.setItem('mc-projector-palette',palette.value);localStorage.setItem('mc-projector-scale',scale.value)}catch(e){}
    var capNhatRay = function(){
      fitOptions();
      var bar=document.querySelector('.mc-thanh'),r=document.getElementById('mc-ray');
      if(bar&&r)r.style.height='calc(100vh - '+(document.fullscreenElement?0:bar.offsetHeight)+'px)';
    };
    if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(capNhatRay);
    else capNhatRay();
  }
  if(palette&&scale){try{var p=localStorage.getItem('mc-projector-palette'),z=localStorage.getItem('mc-projector-scale');if(['soft','dark','matte-light','matte-dark'].indexOf(p)>=0)palette.value=p;if(['0.85','1','1.2','1.4'].indexOf(z)>=0)scale.value=z}catch(e){}palette.onchange=scale.onchange=projectionSettings;projectionSettings();window.addEventListener('resize',projectionSettings);document.addEventListener('fullscreenchange',projectionSettings)}

  var ray = document.getElementById('mc-ray');
  var dots = Array.prototype.slice.call(document.querySelectorAll('.mc-dot'));
  var dem = document.getElementById('mc-dem');
  var phu = document.querySelector('.mc-thanh-phu');
  var truoc = document.getElementById('mc-truoc');
  var sau = document.getElementById('mc-sau');
  var i = 0;
  var timer = null, deadline = 0, timedPage = -1;
  var clock = document.getElementById('mc-clock');
  var intro = null, introTimeout = null;
  function clearIntro() {
    if (introTimeout) clearTimeout(introTimeout);
    if (intro) intro.remove();
    intro = null;
  }
  function revealWithPets(page) {
    clearIntro();
    var heads = Array.from(page.querySelectorAll('.mc-em'));
    heads.forEach(function(h) {
      h.hidden = false;
      var ten = h.querySelector('.mc-ten');
      if (ten) {
        ten.classList.remove('mc-ten-reveal');
        void ten.offsetWidth;
        ten.classList.add('mc-ten-reveal');
      }
    });
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    var overlay=document.createElement('div'); overlay.className='mc-intro'; overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-label','Mời học sinh lên bảng');
    var label=document.createElement('div'); label.className='mc-intro-label'; label.textContent='ĐẾN LƯỢT CỦA CÁC EM'; overlay.appendChild(label);
    var pairs=[];
    heads.forEach(function(h) {
      var target=h.querySelector('img.mc-thu-anh');
      if (!target || !target.complete || !target.naturalWidth) return;
      var card=document.createElement('div'); card.className='mc-intro-card';
      for(var n=0;n<22;n++){var star=document.createElement('i');star.className='mc-spark';star.style.setProperty('--x',((n*37+11)%100)+'%');star.style.setProperty('--y',((n*23+7)%100)+'%');star.style.setProperty('--size',(8+n%4*4)+'px');star.style.setProperty('--delay',(-n*.17)+'s');card.appendChild(star);}
      var img=target.cloneNode(true);img.removeAttribute('class');img.alt='';card.appendChild(img);
      var name=document.createElement('h2');name.textContent=h.querySelector('.mc-ten').textContent;card.appendChild(name);
      var pet=document.createElement('p');pet.textContent=h.querySelector('.mc-thu-ten').textContent;card.appendChild(pet);
      overlay.appendChild(card);pairs.push({img:img,target:target,card:card});
    });
    if (!pairs.length) return;
    var close=document.createElement('button');close.className='mc-intro-close';close.textContent='Tiếp tục xem đề →';close.onclick=clearIntro;overlay.appendChild(close);
    intro=overlay;document.body.appendChild(overlay);
    introTimeout=setTimeout(function() {
      if (intro!==overlay) return;
      pairs.forEach(function(p) {
        var a=p.img.getBoundingClientRect(), b=p.target.getBoundingClientRect();
        p.card.querySelector('h2').style.visibility='hidden';p.card.querySelector('p').style.visibility='hidden';
        if (p.img.animate) p.img.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:'translate('+(b.left+b.width/2-a.left-a.width/2)+'px,'+(b.top+b.height/2-a.top-a.height/2)+'px) scale('+(b.width/a.width)+')',opacity:1}],{duration:850,easing:'cubic-bezier(.22,1,.36,1)',fill:'forwards'});
      });
      overlay.classList.add('mc-shrink');overlay.style.background='transparent';label.style.visibility='hidden';close.style.visibility='hidden';
      introTimeout=setTimeout(clearIntro,900);
    },3000);
  }
  function startClock() {
    if (!clock || timedPage === i) return;
    timedPage = i;
    clearIntro();
    if (timer) clearInterval(timer);
    var page = dots[i];
    var seconds = Number(page && page.getAttribute('data-seconds'));
    clock.hidden = !seconds;document.body.classList.toggle('mc-timing',!!seconds);
    if (!seconds) return;
    page.querySelectorAll('.mc-em').forEach(function(e) { e.hidden = true; });
    page.querySelectorAll('.mc-giai').forEach(function(e) { e.hidden = true; });
    page.querySelectorAll('.mc-nut-giai').forEach(function(e) { e.setAttribute('aria-expanded','false'); var t=e.querySelector('.mc-nut-chu'); if(t)t.textContent='Hiện lời giải'; });
    deadline = Date.now() + seconds * 1000;
    function tick() {
      var remaining = Math.max(0, Math.ceil((deadline-Date.now())/1000));
      clock.classList.toggle('mc-sap-het',remaining>0 && remaining<=15);
      clock.textContent = remaining ? '◷ ' + Math.floor(remaining/60) + ':' + ('0'+remaining%60).slice(-2) : 'Hết giờ · Mời hai em lên bảng';
      if (!remaining) { clearInterval(timer);clock.hidden=true;document.body.classList.remove('mc-timing'); revealWithPets(page); }
    }
    tick(); timer=setInterval(tick,250);
  }

  // Ghi chú của đợt đang hiện (đợt tự tách, chữ nhỏ, toàn bảng…) chép lên dòng phụ của thanh trên, thay dòng ngày/số em.
  function veGhiChu() {
    if (phu) {
      var gc = dots[i] ? dots[i].querySelector(':scope > .mc-ghi-chu') : null;
      var chu = gc ? gc.textContent : '';
      if (phu.getAttribute('data-goc') === null) phu.setAttribute('data-goc', phu.textContent || '');
      phu.textContent = chu || phu.getAttribute('data-goc');
      var canhBao = !!gc && (gc.getAttribute('data-kieu') === 'canh-bao' || (dots[i].className || '').indexOf('mc-b5') >= 0);
      if (chu) phu.setAttribute('data-ghi-chu', canhBao ? 'canh-bao' : 'thong-tin'); else phu.removeAttribute('data-ghi-chu');
    }
  }
  function ve() {
    startClock();
    if (dem) dem.textContent = 'Đợt ' + (i + 1) + '/' + dots.length;
    veGhiChu();
    if (truoc) truoc.disabled = i <= 0;
    if (sau) sau.disabled = i >= dots.length - 1;
  }
  function den(k) {
    if (!dots.length || !ray) return;
    i = Math.max(0, Math.min(dots.length - 1, k));
    // LẬT NGANG: kéo ray theo trục X. Kéo theo trục Y là đúng thứ vừa bỏ.
    ray.scrollTo({ left: i * ray.clientWidth, behavior: 'smooth' });
    ve();
  }
  if (truoc) truoc.addEventListener('click', function () { den(i - 1); });
  if (sau) sau.addEventListener('click', function () { den(i + 1); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); den(i + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); den(i - 1); }
  });

  // Kéo tay cũng phải cập nhật số đợt, nếu không đếm một đằng chiếu một nẻo.
  if (ray) {
    var hen = null;
    ray.addEventListener('scroll', function () {
      if (hen) clearTimeout(hen);
      hen = setTimeout(function () {
        var k = Math.round(ray.scrollLeft / Math.max(1, ray.clientWidth));
        if (k !== i && k >= 0 && k < dots.length) { i = k; ve(); }
      }, 80);
    });
    // Đổi cỡ cửa sổ (cắm máy chiếu, xoay màn) thì giữ nguyên đợt đang chiếu.
    window.addEventListener('resize', function () { ray.scrollLeft = i * ray.clientWidth; });
  }

  document.addEventListener('click', function (e) {
    var hien = e.target && e.target.closest ? e.target.closest('.mc-nut-hien-em') : null;
    if (hien) {
      var em = document.getElementById(hien.getAttribute('aria-controls'));
      if (em) { em.hidden = false; hien.setAttribute('aria-expanded', 'true'); hien.hidden = true; }
      return;
    }
    var nut = e.target && e.target.closest ? e.target.closest('.mc-nut-giai') : null;
    if (!nut) return;
    var o = document.getElementById(nut.getAttribute('aria-controls'));
    if (!o) return;
    var mo = nut.getAttribute('aria-expanded') === 'true';
    nut.setAttribute('aria-expanded', mo ? 'false' : 'true');
    o.hidden = mo;
    var chu = nut.querySelector('.mc-nut-chu');
    if (chu) chu.textContent = mo ? 'Hiện lời giải' : 'Ẩn lời giải';
  });

  // TOÀN MÀN HÌNH. Trình duyệt CHỈ cho bật từ một cú chạm thật của người dùng,
  // nên nó phải nằm trong chính lượt xử lý sự kiện, không hẹn sau.
  var toan = document.getElementById('mc-toan');
  function dangToan() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function veToan() {
    if (!toan) return;
    toan.textContent = dangToan() ? '⛶ Thoát toàn màn hình' : '⛶ Toàn màn hình';
  }
  if (toan) {
    toan.addEventListener('click', function () {
      try {
        if (dangToan()) {
          if (document.exitFullscreen) document.exitFullscreen();
          else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
          return;
        }
        var g = document.documentElement;
        if (g.requestFullscreen) g.requestFullscreen();
        else if (g.webkitRequestFullscreen) g.webkitRequestFullscreen();
        else toan.textContent = 'Trình duyệt này không cho toàn màn hình';
      } catch (e) {
        // Nói thẳng trên chính cái nút, đừng im lặng để thầy bấm mãi.
        toan.textContent = 'Không bật được toàn màn hình';
      }
    });
  }
  document.addEventListener('fullscreenchange', veToan);
  document.addEventListener('webkitfullscreenchange', veToan);
  // Phím F: bật nhanh khi đang đứng trước lớp, khỏi phải dò chuột.
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'f' || e.key === 'F') && !e.metaKey && !e.ctrlKey && !e.altKey && toan) { e.preventDefault(); toan.click(); }
  });
  veToan();

  // ───────── TRANG TỰ KIỂM PHÔNG ─────────
  //
  // Thầy bắt được 14/09, ảnh chụp tờ chiếu: dấu thanh của các chữ hai dấu
  // (ế, ề, ồ, ấ, ắ) rơi ra đứng riêng thành một khe hở sau chữ cái.
  //
  // Đã truy tới cùng: chữ trong kho SẠCH (6.843 câu, 0 câu lệch NFC), chữ tờ
  // chiếu sinh ra cũng sạch (ế là đúng một ký tự U+1EBF). Vậy chỗ vỡ nằm ở LÚC
  // VẼ: phông mà máy chọn không có sẵn glyph gộp cho chữ hai dấu (ế ề ồ ấ ắ),
  // nên trình duyệt vẽ chữ gốc bằng phông này rồi mượn phông khác vẽ dấu —
  // ra đúng cái khe hở ấy. Đo trên máy thầy: generic "serif" của macOS vẽ 'ế'
  // Đo thật trên máy thầy, chuỗi 5 chữ hai dấu so với 5 chữ một dấu ở cỡ 64px:
  //   generic serif  lệch 25,15px   <- vỡ nặng, đây là thứ trong ảnh
  //   Georgia        lệch  1,50px   <- vỡ nhẹ, vẫn phải tránh
  //   Times New Roman / Palatino / Charter / sans hệ thống  lệch 0
  // Nên thứ tự phông chốt bằng SỐ ĐO, không bằng cảm giác đẹp.
  //
  // Không thể biết trước máy nào có phông gì, nên TRANG TỰ ĐO LẤY: chữ hai dấu
  // phải rộng ĐÚNG BẰNG chữ một dấu. Lệch nghĩa là phông đang vẽ tách — đổi
  // sang phông sans của hệ (chính phông đang vẽ đúng tên học sinh ngay trên
  // cùng tờ này) và nói ra, chứ không để thầy chiếu chữ vỡ lên bảng.
  try {
    var canvasEl = document.createElement('canvas');
    var cv = canvasEl && canvasEl.getContext ? canvasEl.getContext('2d') : null;
    if (cv) {
      var goc = getComputedStyle(document.documentElement);
      var phongSerif = (goc.getPropertyValue('--mc-serif') || 'Georgia, serif').trim();
      var phongSans = (goc.getPropertyValue('--mc-sans') || 'sans-serif').trim();
      var rong = function (chu, phong) { cv.font = '64px ' + phong; return cv.measureText(chu).width; };
      var veTach = function (phong) { return Math.abs(rong('ếềồấắ', phong) - rong('êêôââ', phong)) > 0.5; };
      if (veTach(phongSerif)) {
        var thay2 = veTach(phongSans) ? 'Arial, Helvetica, sans-serif' : phongSans;
        document.documentElement.style.setProperty('--mc-serif', thay2);
        var bao = document.getElementById('mc-dem');
        if (bao) bao.title = 'Phông serif của máy này không vẽ được chữ hai dấu — đã đổi sang phông hệ thống.';
      }
    }
  } catch (e) {
    console.warn('[may-chieu] không kiểm được phông:', e);
  }

  // Đợt bị TÁCH lúc đo bố cục (M2) làm đổi số đợt: nạp lại danh sách và vẽ lại bộ đếm.
  document.addEventListener('mc-bo-cuc-xong', veGhiChu);
  document.addEventListener('mc-doi-dot', function () {
    dots = Array.prototype.slice.call(document.querySelectorAll('.mc-dot'));
    if (i > dots.length - 1) i = Math.max(0, dots.length - 1);
    timedPage = -1;
    ve();
  });

  ve();
})();
`

/**
 * Dựng tờ máy chiếu từ danh sách ô bảng, hai ô một đợt.
 *
 * KHÔNG ĐỘN CHO ĐỦ CẶP: lẻ một em thì nửa còn lại để trắng và nói rõ, chứ không
 * gọi thêm một em không có trong phân công.
 */
export function taoHtmlMayChieu(dsO: OBang[], tuyChonGoc: TuyChonMayChieu = {}): string {
  // Chuẩn hoá mã phiên MỘT lần rồi mọi chỗ cùng đọc: mã rỗng/toàn ký tự lạ = KHÔNG có cầu nối (không nút, không mã).
  const maPhien = chuanMaPhien(tuyChonGoc.cauNoi?.maPhien)
  const tuyChon: TuyChonMayChieu = { ...tuyChonGoc, cauNoi: maPhien ? { maPhien } : undefined }
  const ngay = tuyChon.ngay ?? new Date()
  const dot: string[] = []
  let demDot = 0
  const coBacUoc = dsO.some((o) => o.bacUoc !== undefined)
  if (coBacUoc) {
    // Có bậc ước lượng: CHỈ ghép đôi hai câu cùng bậc 1. Câu bậc 1 chưa có bạn thì tìm bạn trong vài câu kế tiếp (kéo lên);
    // câu bậc ≥ 2 đứng một mình (2/3 bảng). Câu không có `bacUoc` lùi về đoán `laCauDai`.
    const ghepDuoc = (o: OBang) => (o.bacUoc !== undefined ? o.bacUoc === 1 : !laCauDai(o.cau))
    const da = new Array<boolean>(dsO.length).fill(false)
    for (let k = 0; k < dsO.length; k++) {
      if (da[k]) continue
      da[k] = true
      demDot++
      const o1 = dsO[k]
      if (!ghepDuoc(o1)) {
        dot.push(dotMotEmHtml(o1, demDot, tuyChon))
        continue
      }
      let j = -1
      for (let x = k + 1; x < dsO.length && x <= k + CUA_SO_TIM_BAN_GHEP; x++) {
        if (!da[x] && ghepDuoc(dsO[x])) {
          j = x
          break
        }
      }
      if (j >= 0) {
        da[j] = true
        dot.push(dotHaiEmHtml(o1, dsO[j], demDot, tuyChon))
      } else {
        dot.push(dotHaiEmHtml(o1, undefined, demDot, tuyChon))
      }
    }
  } else {
    let k = 0
    while (k < dsO.length) {
      demDot++
      const o1 = dsO[k]
      const cau1Dai = laCauDai(o1.cau)
      if (cau1Dai) {
        // Câu dài không vừa nửa bảng: chiếu 1 câu lên 2/3 bảng, 1/3 để trống cho học sinh lên làm
        dot.push(dotMotEmHtml(o1, demDot, tuyChon))
        k += 1
      } else {
        const o2 = dsO[k + 1]
        if (o2 && !laCauDai(o2.cau)) {
          // Cả 2 câu đủ ngắn: chia đôi bảng 50% - 50%
          dot.push(dotHaiEmHtml(o1, o2, demDot, tuyChon))
          k += 2
        } else {
          // Câu 1 ngắn nhưng không có bạn ghép đôi cùng ngắn: để trắng nửa còn lại
          dot.push(dotHaiEmHtml(o1, undefined, demDot, tuyChon))
          k += 1
        }
      }
    }
  }
  // TRANG ĐÁP ÁN nối ngay sau các đợt — lật tiếp là tới, không phải mở tờ khác.
  const dsDa = tuyChon.dsDapAn ?? []
  for (let k = 0; k < dsDa.length; k += SO_DAP_AN_MOI_TRANG) {
    dot.push(trangDapAnHtml(dsDa.slice(k, k + SO_DAP_AN_MOI_TRANG), k, dsDa.length))
  }
  const soDot = dot.length

  const than = `<div class="mc-thanh">
  <div class="mc-thanh-trai">
    <div class="mc-thanh-ten">${thoat(tuyChon.tenBuoi || 'Gọi lên bảng')}</div>
    <div class="mc-thanh-phu">${ngayVn(ngay)} · ${dsO.length} em · ${soDot} trang${dsDa.length > 0 ? ` · ${dsDa.length} câu chỉ đọc đáp án` : ''}</div>
  </div>
  <div class="mc-dem" id="mc-dem">Đợt 1/${soDot}</div>
  <div class="mc-dieu">
    <select id="mc-palette" aria-label="Nền máy chiếu"><option value="matte-light">Sáng siêu dịu · viết bút đen</option><option value="matte-dark">Tối siêu dịu · đọc đề</option><option value="soft">Nền dịu · viết bút đen</option><option value="dark">Nền tối · đọc đề</option></select>
    <select id="mc-size" aria-label="Cỡ chữ đề chiếu"><option value="0.85">Chữ vừa</option><option value="1" selected>Chữ lớn</option><option value="1.2">Chữ rất lớn</option><option value="1.4">Chữ cực lớn</option></select>
    <button type="button" id="mc-toan" class="mc-vien">⛶ Toàn màn hình</button>
    <button type="button" id="mc-truoc">◂ Đợt trước</button>
    <button type="button" id="mc-sau">Đợt tiếp ▸</button>
  </div>
</div>
<div class="mc-ray" id="mc-ray">${dot.join('')}</div>${tuyChon.dayHoc ? '<div id="mc-clock" role="timer" aria-label="Thời gian làm bài còn lại" hidden></div>' : ''}`

  return `<!DOCTYPE html>
<html lang="vi" data-projector="matte-light" data-sang><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${thoat(tuyChon.tenBuoi || 'Gọi lên bảng')} — tờ máy chiếu</title>
<style>${CSS_PHIEU}</style><style>${CSS_MAY_CHIEU}</style><style>${CSS_BO_CUC}</style>${maPhien ? `<style>${CSS_CAU_NOI_TO_CHIEU}</style>` : ''}</head>
<body class="mc${tuyChon.dayHoc ? ' mc-day-hoc' : ''}"${maPhien ? ` data-cau-noi="${maPhien}"` : ''}>${than}
<script>${JS_MAY_CHIEU}</script><script>${jsBoCuc()}</script>${maPhien ? `<script>${jsCauNoiToChieu()}</script>` : ''}</body></html>`
}

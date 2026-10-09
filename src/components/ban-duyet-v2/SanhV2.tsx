// BẢN DUYỆT V2 · BỐN MỤC CỦA HỌC SINH (Hôm nay · Hành trình · Ôn lại · Của em) — TRUNG TU theo bản vẽ thầy duyệt 09/10/2026
// (trung-tu-canvas: HS-HomNay, HS-HanhTrinh, HS-OnLai, HS-CuaEm; bộ khung HeThong + thang chung src/styles/thang.css). Mỗi mục một câu hỏi, đúng MỘT nút vàng.
//   · Hôm nay: đầu màn = ảnh nhỏ thần thú + "Chào {tên gọi}" + "Chuỗi N ngày" + nút tròn Ca kiểm tra (CHỈ khi không có ca mở; có ca mở ⇒ dải "Vào thi"
//     là nút vàng duy nhất, "Bắt đầu" lùi thành nút phụ). Thẻ chính: "Hoá {khối} · tầng …" + số lớn "{đã làm}/{tối thiểu} câu" + thanh tiến độ +
//     "Chặng x/y · còn n câu trong chặng" + ảnh thú + nút vàng "Bắt đầu · …". Thẻ "Hôm nay em đi 3 bước" (chip CHỈ ở bước đang làm). Lối chữ
//     "Luyện thêm · không bắt buộc ›" sang Hành trình. Đã BỎ: 3 nút "Chọn cách học" (trùng thanh dưới) + thẻ chữ tĩnh "Học từng chặng ngắn".
//   · Hành trình: MỘT thanh bậc 4 tầng + mô tả tầng đang luyện + ô số (chặng · dạng vững) · "Từng bài thầy đã dạy" (`hanhTrinh.bai`) ·
//     "Luyện thêm" lưới ô đều: Thử sức thêm, Vé, Kiểm đầu/tuần, Đề thử, Tu luyện, Bi-a, Kiểm tra chuyên sâu, Giờ học. Đã BỎ khối "Học cùng trò chơi"
//     (Đoàn/Đảo vào bằng nút Bắt đầu ở Hôm nay; Bi-a chuyển vào Luyện thêm).
//   · Ôn lại: số câu đến lịch ôn lại + nút vàng "Ôn trong Đoàn Hộ Tống" · "Sổ câu đã làm" · "Kết quả ca kiểm tra" (ca gần nhất → Lịch sử ca).
//   · Của em: hồ sơ (chữ cái đầu, tên, lớp, chuỗi) · thẻ Thần thú (Túi đồ + Cửa hàng ở bên trong) · "Đăng xuất" (hộp hỏi lại của cổng học sinh).
// Đổi mục: nội dung trượt vào (.tt-vao-muc), mỗi mục GIỮ chỗ cuộn của mình. MỌI con số lấy từ máy chủ (`hoa2-sanh` + kế hoạch ngày) — không tự tính,
// không bịa. Lỗi bất kỳ trong màn này ⇒ SanhHomNay rơi về Sảnh cũ.
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { BookOpenCheck, Check, ChevronRight, CircleDot, ClipboardList, Flame, Gauge, Home, Lock, Map as BanDo, PawPrint, Sparkles, Target, Ticket, Zap, type LucideIcon } from 'lucide-react'
import { anhThu } from '../../game/than-thu-v2/dao/anh'
import { PETS } from '../../game/than-thu-v2/core'
import { thanhExp } from '../../game/than-thu-hoa-hoc/kinh-nghiem'
import type { SanhBanDoProps } from '../hoa2/SanhBanDo'
import { DongChienDich, IconCa, IconChuoi, IconSo, TheHuyetChien, TheMetGio, XongHomNay, chuChuaCoChienDich, chuCuaBia, chuKhongConCau } from '../hoa2/SanhBanDo'
import { thuSucThem, type BaiHanhTrinh, type SanhHoa2 } from '../hoa2/api'
import { GOI_Y_VE, chuDangVung, chuVe } from '../../lib/omni-chu'
import { datViecOmniDao, type ViecOmniDao } from '../../lib/omni-hs'
import { useBoCucNgang } from '../hoa2/bo-cuc-ngang'
import { boCuaNhanh, useNapTruocManSanh } from '../hoa2/man-sanh-luoi'
import '../hoa2/phong-baloo'
import '../../styles/ban-duyet-v2.css'
import './sanh-v2.css'

export interface SanhV2Props extends SanhBanDoProps {
  /** Họ tên đầy đủ của em (phiên đăng nhập). */
  tenEm: string
  /** Tên lớp (vd "12A1", "12 - Tinh Hoa") — đọc khối 10/11/12 và hiện chip lớp ở mục Của em. */
  lop: string
}

type Khu = 'hom-nay' | 'hanh-trinh' | 'on-lai' | 'cua-em'

export const TEN_TANG = ['Nền', 'Hiểu', 'Vận dụng', 'Tổng hợp'] as const
/** Mô tả một dòng của từng tầng (trước nằm ở khối "Bốn tầng kiến thức" — nay chỉ hiện dòng của tầng đang luyện, dưới thanh bậc). */
export const MO_TA_TANG = ['kiến thức cần để bắt đầu', 'giải thích và nhận ra bản chất', 'tự giải bài theo dạng', 'phối hợp nhiều kiến thức'] as const

/** Tên gọi trong lời chào: hai chữ cuối của họ tên ba chữ trở lên ("Nguyễn Minh Anh" → "Minh Anh"), còn lại giữ nguyên. */
export function tenGoi(hoTen: string): string {
  const chu = hoTen.trim().split(/\s+/).filter(Boolean)
  if (chu.length === 0) return ''
  return chu.length >= 3 ? chu.slice(-2).join(' ') : chu.join(' ')
}

/** Chữ cái đầu trên ô hồ sơ: chữ đầu của tên gọi ("Nguyễn Minh Anh" → "MA", "An" → "A"); họ tên trống ⇒ "". */
export function chuDauTen(hoTen: string): string {
  return tenGoi(hoTen)
    .split(' ')
    .filter(Boolean)
    .map((t) => [...t][0] ?? '')
    .join('')
    .toLocaleUpperCase('vi')
}

/** Chip lớp: "12A1" → "Lớp 12A1"; tên đã có chữ "Lớp" thì giữ nguyên; thiếu lớp ⇒ null (ẩn chip — không còn " · Chuỗi…" mồ côi). */
export function chuLop(lop: string | null | undefined): string | null {
  const l = (lop ?? '').trim()
  if (!l) return null
  return /^lớp(\s|$)/i.test(l) ? l : `Lớp ${l}`
}

/** Khối 10/11/12 đọc từ tên lớp ("12A1", "12 - Tinh Hoa", "Lớp 11B"); không đọc được ⇒ null (tiêu đề không ghi khối). */
export function khoiTuLop(lop: string): 10 | 11 | 12 | null {
  const m = /(?:^|\D)(1[012])(?!\d)/.exec(lop ?? '')
  return m ? (Number(m[1]) as 10 | 11 | 12) : null
}

/** Số câu "đã làm / cần làm" hôm nay: Hành trình ⇒ tối thiểu của ngày; chiến dịch ⇒ thể lực (đã dùng / tổng). */
export function soCauHomNay(s: SanhHoa2): { da: number; tong: number } {
  if (s.hanhTrinh) return { da: s.hanhTrinh.daLam, tong: s.hanhTrinh.toiThieu }
  return { da: Math.max(0, s.theLuc.tong - s.theLuc.con), tong: s.theLuc.tong }
}

const tenTang = (tang: number): string => TEN_TANG[tang - 1] ?? String(tang)
const chuHoa = (khoi: 10 | 11 | 12 | null): string => (khoi ? `Hoá ${khoi}` : 'Hoá')
const phanTram = (a: number, b: number): number => (b > 0 ? Math.round((100 * Math.min(Math.max(a, 0), b)) / b) : 0)

/** Chữ của thẻ chính (đầu màn Hôm nay), dựng đúng từ số máy chủ. */
export function dongAnhHung(s: SanhHoa2, khoi: 10 | 11 | 12 | null): { nhan: string; da: number; tong: number; chang: string | null; thieu: string | null } {
  const { da, tong } = soCauHomNay(s)
  const h = s.hanhTrinh
  const nhan = h ? `${chuHoa(khoi)} · tầng ${tenTang(h.tang)}` : s.chienDich ? `${chuHoa(khoi)} · Chiến dịch ${s.chienDich.ten}` : chuHoa(khoi)
  const chang = !h ? null : h.daLam >= h.toiThieu ? 'Đã đủ mức tối thiểu hôm nay' : h.soChang > 0 ? `Chặng ${h.changHienTai}/${h.soChang} · còn ${h.cauTrongChang} câu trong chặng` : null
  const thieu = h && h.conThieu > 0 ? `Còn thiếu ${h.conThieu} câu phù hợp cho kế hoạch hôm nay.` : null
  return { nhan, da, tong, chang, thieu }
}

type TrangThaiBuoc = 'xong' | 'dang' | 'cho' | 'khoa'
export interface Buoc {
  so: 1 | 2 | 3
  nhan: string
  phu: string
  /** Dòng phụ thứ hai (vd lời khoá Đảo của máy chủ). */
  them?: string
  tt: TrangThaiBuoc
  /** Nhãn trạng thái ("Làm ngay", "Mở được"…). Màn CHỈ vẽ chip ở bước đang làm (`tt === 'dang'`) — "Còn n câu" trùng số lớn nên không vẽ. */
  chip: string
}

/** Ba bước của ngày (bản vẽ tối giản 09/10): Gỡ lỗi cũ → Câu mới → Mở rương hôm nay. Không có số "đã làm" từng bước ⇒ chỉ nói còn bao nhiêu / xong / chờ. */
export function baBuoc(s: SanhHoa2): Buoc[] {
  const xong = s.theLuc.tong > 0 && s.theLuc.con === 0
  const b1: Buoc =
    s.doan.con > 0
      ? { so: 1, nhan: `Gỡ ${s.doan.con} lỗi cũ`, phu: 'Câu từng sai, đến lịch ôn lại · Đoàn Hộ Tống', tt: 'dang', chip: 'Làm ngay' }
      : { so: 1, nhan: 'Gỡ lỗi cũ', phu: 'Không còn lỗi cũ · Đoàn Hộ Tống', tt: 'xong', chip: 'Xong' }
  const b2: Buoc =
    s.dao.con > 0
      ? s.khoaDao
        ? { so: 2, nhan: `${s.dao.con} câu mới`, phu: 'Mở sau bước 1 · Bát Linh Đảo', ...(s.loiKhoaDao ? { them: s.loiKhoaDao } : {}), tt: 'khoa', chip: 'Chờ' }
        : s.doan.con > 0
          ? { so: 2, nhan: `${s.dao.con} câu mới`, phu: 'Bát Linh Đảo', tt: 'cho', chip: 'Tiếp theo' }
          : { so: 2, nhan: `${s.dao.con} câu mới`, phu: 'Bát Linh Đảo', tt: 'dang', chip: 'Làm ngay' }
      : { so: 2, nhan: 'Câu mới', phu: xong ? 'Đã xong · Bát Linh Đảo' : 'Không còn câu mới · Bát Linh Đảo', tt: 'xong', chip: 'Xong' }
  const r = s.ruong
  const hn = soCauHomNay(s)
  const tong = r.tong > 0 ? r.tong : hn.tong
  const con = Math.max(0, tong - (r.tong > 0 ? r.daLam : hn.da))
  const b3: Buoc = r.daMo
    ? { so: 3, nhan: 'Mở rương hôm nay', phu: 'Em đã mở rương · vàng để dùng ở Cửa hàng', tt: 'xong', chip: 'Đã mở' }
    : r.moDuoc
      ? { so: 3, nhan: 'Mở rương hôm nay', phu: 'Đủ câu rồi · vàng để dùng ở Cửa hàng', tt: 'dang', chip: 'Mở được' }
      : { so: 3, nhan: 'Mở rương hôm nay', phu: tong > 0 ? `Khi đủ ${tong} câu · vàng để dùng ở Cửa hàng` : 'Khi xong kế hoạch hôm nay', tt: 'cho', chip: con > 0 ? `Còn ${con} câu` : 'Chờ' }
  return [b1, b2, b3]
}

/** Tầng thứ `tang` (1–4) của một bài có tầng đang luyện `tangMo`: nhỏ hơn ⇒ vững · bằng ⇒ đang luyện · lớn hơn ⇒ chưa mở. */
export function trangThaiTang(tang: number, tangMo: number): 'vung' | 'dang' | 'khoa' {
  return tang < tangMo ? 'vung' : tang === tangMo ? 'dang' : 'khoa'
}
const CHU_TANG = { vung: 'Vững', dang: 'Đang luyện', khoa: 'Chưa mở' } as const

/** Khối cũ nhúng trong màn V2 (giữ đúng hành vi + kiểm thử của Sảnh cũ; biến màu --h2-* được đổi sang Bảng G ở sanh-v2.css). */
function Nhung({ children, lop = '' }: { children: ReactNode; lop?: string }) {
  return <div className={`h2-sanh v2s-nhung ${lop}`}>{children}</div>
}

/** Tiêu đề trang dùng chung cho các mục (một lớp chữ: Baloo 32 — `--t-man`). */
function TieuDeTrang({ chu, phu }: { chu: string; phu?: string | null }) {
  return (
    <header className="v2s-trang-dau">
      <h1 className="v2-tieu-de v2s-tieu-trang">{chu}</h1>
      {phu && <p className="v2s-dong-phu v2s-trang-phu">{phu}</p>}
    </header>
  )
}

// ═══════════════════ HÔM NAY ═══════════════════

function TheBaBuoc({ buoc }: { buoc: Buoc[] }) {
  return (
    <section className="v2-the v2s-buoc-the" aria-label="Ba bước hôm nay">
      <h2 className="v2s-the-tieu">Hôm nay em đi 3 bước</h2>
      <ol className="v2s-buoc">
        {buoc.map((b) => (
          <li key={b.so} className="v2s-buoc-o" data-tt={b.tt}>
            <span className="v2s-buoc-so v2-so" aria-hidden="true">
              {b.tt === 'khoa' ? <Lock size={16} /> : b.tt === 'xong' ? <Check size={18} strokeWidth={3} /> : b.so}
            </span>
            <span className="v2s-buoc-chu">
              <b>
                <span className="v2-an">Bước {b.so}: </span>
                {b.nhan}
              </b>
              <span>{b.phu}</span>
              {b.them && <span className="v2s-buoc-them">{b.them}</span>}
            </span>
            {b.tt === 'dang' && <span className="v2s-buoc-chip">{b.chip}</span>}
          </li>
        ))}
      </ol>
    </section>
  )
}

/** Nút "Bắt đầu" của ngày (logic cũ giữ nguyên): còn lỗi cũ ⇒ mở Đoàn Hộ Tống; hết lỗi cũ, còn câu mới ⇒ mở Đảo.
 *  Còn lỗi cũ mà máy chủ KHÔNG khoá Đảo ⇒ thêm nút phụ vào Đảo. `phu` (có ca kiểm tra đang mở) ⇒ "Bắt đầu" lùi thành nút phụ — "Vào thi" là nút vàng duy nhất. */
function NutBatDau({ p, s, phu }: { p: SanhBanDoProps; s: SanhHoa2; phu: boolean }) {
  const lop = `${phu ? 'v2-nut-phu' : 'v2-nut-chinh'} v2s-nut-bat-dau tt-nhan`
  if (s.doan.con > 0) {
    return (
      <>
        <button type="button" className={lop} onClick={p.onPhaPhucKich}>
          <PlayIcon />
          <span>Bắt đầu · gỡ {s.doan.con} lỗi cũ</span>
        </button>
        {s.dao.con > 0 && !s.khoaDao && (
          <button type="button" className="v2-nut-phu v2s-nut-dao tt-nhan" onClick={p.onKhamPhaDao}>
            Khám phá Bát Linh Đảo · {s.dao.con} câu
          </button>
        )}
      </>
    )
  }
  if (s.dao.con > 0) {
    return (
      <button type="button" className={lop} onClick={p.onKhamPhaDao}>
        <PlayIcon />
        <span>Bắt đầu · {s.dao.con} câu mới</span>
      </button>
    )
  }
  return null
}

function PlayIcon() {
  return (
    <svg width="18" height="20" viewBox="0 0 22 24" aria-hidden="true" focusable="false">
      <path d="M3 2.6v18.8c0 1.5 1.6 2.4 2.9 1.6l15-9.4c1.2-.8 1.2-2.5 0-3.2l-15-9.4C4.6.2 3 1.1 3 2.6z" fill="currentColor" />
    </svg>
  )
}

function ThanhDuoi({ dang, onDoi }: { dang: Khu; onDoi: (k: Khu) => void }) {
  const muc: { k: Khu; nhan: string; bieu: ReactNode }[] = [
    { k: 'hom-nay', nhan: 'Hôm nay', bieu: <Home size={24} /> },
    { k: 'hanh-trinh', nhan: 'Hành trình', bieu: <BanDo size={24} /> },
    { k: 'on-lai', nhan: 'Ôn lại', bieu: <BookOpenCheck size={24} /> },
    { k: 'cua-em', nhan: 'Của em', bieu: <PawPrint size={24} /> },
  ]
  return (
    <nav className="v2s-thanh-duoi" aria-label="Điều hướng chính">
      {muc.map((m) => (
        <button key={m.k} type="button" className="v2s-thanh-duoi-nut tt-nhan" aria-current={dang === m.k ? 'page' : undefined} onClick={() => onDoi(m.k)}>
          {m.bieu}
          <span>{m.nhan}</span>
        </button>
      ))}
    </nav>
  )
}

/** Dải "Ca kiểm tra đang mở" — thay nút tròn Ca kiểm tra khi có ca mở; "Vào thi" là nút vàng DUY NHẤT của màn (vào đúng luồng PhongVaoThi có sẵn). */
function DaiCaMo({ onVaoThi }: { onVaoThi: () => void }) {
  return (
    <section className="v2-the v2s-ca-mo" aria-label="Ca kiểm tra">
      <span className="v2s-ca-mo-bieu" aria-hidden="true">
        <IconCa co={22} />
      </span>
      <b className="v2s-ca-mo-chu">Ca kiểm tra đang mở</b>
      <button type="button" className="v2-nut-chinh v2s-ca-mo-nut tt-nhan" onClick={onVaoThi}>
        Vào thi
      </button>
    </section>
  )
}

/** Thẻ chính của Hôm nay: nhãn khối · tầng + số lớn + thanh tiến độ + chặng + ảnh thú + nút Bắt đầu. Số lấy nguyên từ máy chủ. */
function TheChinh({ p, s, khoi, thu }: { p: SanhBanDoProps; s: SanhHoa2; khoi: 10 | 11 | 12 | null; thu: SanhBanDoProps['thu'] }) {
  const d = dongAnhHung(s, khoi)
  return (
    <section className="v2-the v2s-tien-do" aria-label="Kế hoạch hôm nay">
      <div className="v2s-tien-do-chu">
        <p className="v2s-nhan-tang">{d.nhan}</p>
        {d.tong > 0 && (
          <>
            <p className="v2s-so-lon v2-so">
              <span className="v2-an">Hôm nay em đã làm </span>
              {d.da}
              <span className="v2s-so-lon-phu">/{d.tong} câu</span>
            </p>
            {/* thanh chỉ để nhìn — con số ngay trên đã đọc được, nên ẩn với trình đọc màn hình */}
            <span className="v2s-thanh" aria-hidden="true">
              <i className="tt-thanh" style={{ width: `${phanTram(d.da, d.tong)}%` }} />
            </span>
          </>
        )}
        {d.chang && <p className="v2s-chang">{d.chang}</p>}
        {d.thieu && <p className="v2s-thieu">{d.thieu}</p>}
      </div>
      {thu ? (
        <img className="v2s-thu" src={anhThu(thu.index, thu.cap)} alt={`Thần thú của em: ${thu.ten}`} width={96} height={96} decoding="async" fetchPriority="high" />
      ) : (
        <span className="v2s-thu v2s-thu-trong" aria-hidden="true">
          <Sparkles size={40} />
        </span>
      )}
      {s.theLuc.con > 0 && (
        <div className="v2s-hoc-tiep">
          <NutBatDau p={p} s={s} phu={p.caDangMo} />
        </div>
      )}
    </section>
  )
}

/** Đầu màn Hôm nay: thú nhỏ + chào + chuỗi + lối vào ca kiểm tra, rồi thẻ chính (hoặc khung xương đúng hình khi chờ máy chủ lần đầu). */
function DauHomNay({ p, khoi, s, chonThu }: { p: SanhV2Props; khoi: 10 | 11 | 12 | null; s: SanhHoa2 | null; chonThu: boolean }) {
  const thu = chonThu ? null : p.thu
  const goi = tenGoi(p.tenEm)
  return (
    <header className="v2s-anh-hung">
      <div className="v2s-canh" aria-hidden="true" />
      <div className="v2s-dau">
        <span className="v2s-avatar" aria-hidden="true">
          {thu ? <img src={anhThu(thu.index, thu.cap, true)} alt="" width={48} height={48} /> : <PawPrint size={24} />}
        </span>
        <div className="v2s-chao">
          <h1 className="v2-tieu-de v2s-tieu-trang v2s-chao-ten">{goi ? `Chào ${goi}` : 'Chào em'}</h1>
          <span className="v2-chip v2s-chuoi" data-mau="vang">
            <IconChuoi />
            <span className="v2-so">Chuỗi {p.chuoiNgay} ngày</span>
          </span>
        </div>
        {!p.caDangMo && (
          <button type="button" className="v2-nut-tron v2s-nut-ca tt-nhan" onClick={p.onVaoThi} aria-label="Ca kiểm tra" title="Ca kiểm tra">
            <IconCa co={20} />
          </button>
        )}
      </div>
      {p.caDangMo && <DaiCaMo onVaoThi={p.onVaoThi} />}
      {s ? (
        <TheChinh p={p} s={s} khoi={khoi} thu={thu} />
      ) : (
        !chonThu &&
        !p.loi && (
          <section className="v2-the v2s-tien-do v2s-xuong-the" role="status">
            <span className="v2-xuong" style={{ height: 16, width: '42%' }} />
            <span className="v2-xuong" style={{ height: 48, width: '60%' }} />
            <span className="v2-xuong" style={{ height: 8 }} />
            <span className="v2-xuong" style={{ height: 56 }} />
            <span className="v2-an">Đang mở kế hoạch hôm nay…</span>
          </section>
        )
      )}
    </header>
  )
}

/** Thân Hôm nay khi đã có số máy chủ: thẻ 3 bước · màn xong / kế hoạch rỗng · nút kiểm Hành trình · lối chữ sang Luyện thêm. */
function KhuHomNay({ p, s, onLuyenThem }: { p: SanhBanDoProps; s: SanhHoa2; onLuyenThem: () => void }) {
  const xong = s.theLuc.tong > 0 && s.theLuc.con === 0
  const trong = s.theLuc.tong === 0
  return (
    <>
      {!trong && <TheBaBuoc buoc={baBuoc(s)} />}
      {xong ? (
        <Nhung lop="v2s-nhung-xong">
          <XongHomNay s={s} exp={p.exp} token={p.token} onTaiLai={p.onTaiLai} coThuSuc={false} />
        </Nhung>
      ) : (
        trong &&
        (s.chienDich || s.hanhTrinh) && (
          <section className="v2-the v2s-trong">
            <p className="v2s-dong-phu" data-khoi={s.tamGiuCa > 0 ? 'tam-giu-ca' : undefined}>
              {chuKhongConCau(s)}
            </p>
          </section>
        )
      )}
      {!xong && <NutKiemHanhTrinh p={p} s={s} />}
      <button type="button" className="v2s-lien-ket tt-nhan" onClick={onLuyenThem}>
        Luyện thêm · không bắt buộc
        <ChevronRight size={18} strokeWidth={2.4} aria-hidden="true" />
      </button>
    </>
  )
}

/** Bài kiểm đầu / kiểm tuần của Hành trình (main PR217, `omni.kiemHanhTrinh`): nút PHỤ (màn vẫn một nút vàng), cùng hành động nút Sảnh cũ — mở Đảo với việc `de-thu`. */
export function chuKiemHanhTrinh(k: { loai: 'dau' | 'tuan'; soCau: number }): string {
  return `${k.loai === 'dau' ? 'Làm bài kiểm đầu' : 'Làm bài kiểm tuần'} · ${k.soCau} câu`
}
function NutKiemHanhTrinh({ p, s }: { p: SanhBanDoProps; s: SanhHoa2 }) {
  const k = s.omni?.kiemHanhTrinh
  if (!k) return null
  return (
    <button type="button" className="v2-nut-phu v2s-nut-luyen-them tt-nhan" data-khoi="kiem-hanh-trinh" onClick={() => { datViecOmniDao('de-thu'); p.onKhamPhaDao() }}>
      {chuKiemHanhTrinh(k)}
    </button>
  )
}

/** Cột phụ Hôm nay: Huyết Chiến (ngày dồn) · thẻ chiến dịch CŨ (có hạn nộp — không bao giờ bỏ) khi KHÔNG phải Hành trình · chưa có chiến dịch. */
function cotPhu(p: SanhBanDoProps, s: SanhHoa2): ReactNode {
  const xong = s.theLuc.tong > 0 && s.theLuc.con === 0
  if (s.huyetChien && !xong) return <TheHuyetChien s={s} now={p.now} />
  if (s.hanhTrinh) return null
  if (s.chienDich) return <DongChienDich s={s} now={p.now} />
  return (
    <p className="h2-tam-chu" data-khoi="sap-bat-dau">
      {chuChuaCoChienDich(s)}
    </p>
  )
}

function ManHomNay({ p, s, khoi, chonThu, onDoi }: { p: SanhV2Props; s: SanhHoa2 | null; khoi: 10 | 11 | 12 | null; chonThu: boolean; onDoi: (k: Khu) => void }) {
  const phu = s ? cotPhu(p, s) : null
  return (
    <>
      <DauHomNay p={p} khoi={khoi} s={s} chonThu={chonThu} />
      <main className="v2s-luoi" data-hai-cot={phu ? 'true' : 'false'} aria-busy={p.dangTai && !s}>
        <div className="v2s-cot-chinh">
          {s ? (
            <KhuHomNay p={p} s={s} onLuyenThem={() => onDoi('hanh-trinh')} />
          ) : chonThu ? (
            <section className="v2-the v2s-trong">
              <p className="v2s-dong-phu">Em chọn thần thú đồng hành trước khi lên đường. Thần thú lớn lên theo EXP em học được.</p>
              <button type="button" className="v2-nut-chinh v2s-nut-bat-dau tt-nhan" onClick={p.onChonThu}>
                <PawPrint size={22} aria-hidden="true" />
                <span>
                  Chọn thần thú của em
                  <small>Một lần chọn, đồng hành cả năm học</small>
                </span>
              </button>
            </section>
          ) : p.loi ? (
            <section className="v2-the v2s-trong" role="alert">
              <p className="v2s-dong-phu">{p.loi}</p>
              <button type="button" className="v2-nut-phu tt-nhan" onClick={p.onTaiLai}>
                Thử lại
              </button>
            </section>
          ) : (
            <section className="v2-the v2s-buoc-the" aria-hidden="true">
              <span className="v2-xuong" style={{ height: 20, width: '50%' }} />
              <span className="v2-xuong" style={{ height: 48 }} />
              <span className="v2-xuong" style={{ height: 48 }} />
              <span className="v2-xuong" style={{ height: 48 }} />
            </section>
          )}
          {s && p.loi && (
            <p className="v2s-cu" role="status">
              Chưa cập nhật được: {p.loi}
            </p>
          )}
        </div>
        {phu && (
          <div className="v2s-cot-phu">
            <Nhung lop="v2s-nhung-chien-dich">{phu}</Nhung>
          </div>
        )}
      </main>
    </>
  )
}

// ═══════════════════ HÀNH TRÌNH ═══════════════════

/** Thẻ "Tầng đang luyện": MỘT thanh bậc 4 tầng (gộp danh sách "Bốn tầng kiến thức" + ô tầng cũ) + mô tả tầng + ô số chặng · dạng vững. */
function TheTang({ s }: { s: SanhHoa2 }) {
  const h = s.hanhTrinh!
  const v = s.omni?.dangVung
  const du = h.daLam >= h.toiThieu
  const oChang = du
    ? { so: `${h.daLam}/${h.toiThieu}`, nhan: 'câu · đủ mức tối thiểu hôm nay' }
    : h.soChang > 0
      ? { so: `${h.changHienTai}/${h.soChang}`, nhan: `chặng · còn ${h.cauTrongChang} câu` }
      : h.toiThieu > 0
        ? { so: `${h.daLam}/${h.toiThieu}`, nhan: 'câu hôm nay' }
        : null
  const tang = Math.min(4, Math.max(1, Math.round(h.tang)))
  return (
    <section className="v2-the v2s-tang-the" aria-label="Tầng đang luyện">
      <h2 className="v2s-the-tieu">Tầng đang luyện</h2>
      <ol className="v2s-bac" aria-label="Bốn tầng kiến thức" style={{ ['--bac-xong' as string]: `${((tang - 1) / 3) * 75}%` }}>
        {TEN_TANG.map((t, i) => {
          const k = i + 1 < tang ? 'qua' : i + 1 === tang ? 'dang' : 'chua'
          return (
            <li key={t} className="v2s-bac-o" data-tt={k} aria-current={k === 'dang' ? 'step' : undefined}>
              <span className="v2s-bac-tron v2-so" aria-hidden="true">
                {k === 'qua' ? <Check size={16} strokeWidth={3} /> : i + 1}
              </span>
              <span className="v2s-bac-ten">{t}</span>
              <span className="v2-an">{k === 'qua' ? ': đã qua' : k === 'dang' ? ': đang luyện' : ': chưa tới'}</span>
            </li>
          )
        })}
      </ol>
      <p className="v2s-tang-mo-ta">
        <b>{tenTang(tang)}</b> · {MO_TA_TANG[tang - 1]}
      </p>
      {(oChang || (v && v.b > 0)) && (
        <div className="v2s-o-so-hang">
          {oChang && (
            <p className="v2s-o-so">
              <b className="v2-so">{oChang.so}</b>
              <span>{oChang.nhan}</span>
            </p>
          )}
          {v && v.b > 0 && (
            <p className="v2s-o-so">
              <b className="v2-so">
                {v.a}/{v.b}
              </b>
              <span>dạng vững</span>
            </p>
          )}
        </div>
      )}
    </section>
  )
}

/** "Từng bài thầy đã dạy" (`hanhTrinh.bai`, máy chủ mới): mỗi bài 4 khúc Vững / Đang luyện / Chưa mở + tên tầng đang luyện; có chú giải. */
function TheTungBai({ bai }: { bai: BaiHanhTrinh[] }) {
  return (
    <section className="v2-the v2s-bai-the" aria-label="Tầng của từng bài">
      <h2 className="v2s-the-tieu">Từng bài thầy đã dạy</h2>
      <ul className="v2s-bai-ds">
        {bai.map((b) => (
          <li key={b.khoa} className="v2s-bai">
            <span className="v2s-bai-ten">
              <b>{b.ten}</b>
              {b.vung && <span className="v2s-bai-vung v2-so">{chuDangVung(b.vung.a, b.vung.b)}</span>}
            </span>
            <ol className="v2s-bai-khuc" aria-label={`Tầng của ${b.ten}`}>
              {TEN_TANG.map((t, i) => {
                const k = trangThaiTang(i + 1, b.tangMo)
                return (
                  <li key={t} data-tt={k}>
                    <span className="v2-an">
                      {t}: {CHU_TANG[k]}
                    </span>
                  </li>
                )
              })}
            </ol>
            <span className="v2s-bai-tang" aria-hidden="true">
              {tenTang(b.tangMo)}
            </span>
          </li>
        ))}
      </ul>
      <p className="v2s-chu-giai" aria-hidden="true">
        {(['vung', 'dang', 'khoa'] as const).map((k) => (
          <span key={k} data-tt={k}>
            <i />
            {CHU_TANG[k]}
          </span>
        ))}
      </p>
    </section>
  )
}

/** Biểu tượng từng ô Luyện thêm (màu nhấn theo `data-khoi` ở sanh-v2.css). */
const BIEU_O: Record<string, LucideIcon> = {
  'thu-suc-them': Zap,
  've-thu-thach': Ticket,
  'kiem-hanh-trinh': Gauge,
  'de-thu': ClipboardList,
  'tu-luyen': Flame,
  'bia-game': CircleDot,
  'l4-kiem': Target,
}
function BieuO({ khoi }: { khoi: string }) {
  const I = BIEU_O[khoi]
  return I ? (
    <i className="v2s-o-bt" aria-hidden="true">
      <I size={20} strokeWidth={2.2} />
    </i>
  ) : null
}

function OLuyen({ nhan, phu, khoa = false, onClick, khoi }: { nhan: string; phu?: string; khoa?: boolean; onClick?: () => void; khoi: string }) {
  return (
    <button type="button" className="v2s-o tt-nhan" data-khoi={khoi} disabled={khoa || !onClick} onClick={khoa ? undefined : onClick}>
      <BieuO khoi={khoi} />
      <b>{nhan}</b>
      {phu && <span>{phu}</span>}
    </button>
  )
}

/** Ô "Thử sức thêm" (thầy bật lại 09/10): đúng trường `thuSucThem` + đúng lệnh `hoa2-thu-suc-them` của nút Sảnh cũ. Máy chủ chưa cho ⇒ ô mờ nói vì sao. */
function OThuSuc({ s, token, onTaiLai, onDaLay }: { s: SanhHoa2; token: string; onTaiLai: () => void; onDaLay: () => void }) {
  const [dangGoi, setDangGoi] = useState(false)
  const [loi, setLoi] = useState('')
  const t = s.thuSucThem
  const chuaXong = s.theLuc.tong > 0 && s.theLuc.con > 0
  if (!t.duoc) {
    const phu = chuaXong ? 'Mở khi xong kế hoạch hôm nay' : s.ruong.tong > 0 && !s.ruong.daMo ? 'Mở khi em mở rương hôm nay' : 'Hôm nay chưa lấy thêm được câu'
    return <OLuyen khoi="thu-suc-them" nhan="Thử sức thêm" phu={phu} khoa />
  }
  const bam = async () => {
    if (dangGoi) return
    setDangGoi(true)
    setLoi('')
    try {
      await thuSucThem(token)
      onTaiLai()
      onDaLay()
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Chưa lấy thêm được câu. Em thử lại.')
    } finally {
      setDangGoi(false)
    }
  }
  return (
    <>
      <button type="button" className="v2s-o tt-nhan" data-khoi="thu-suc-them" aria-busy={dangGoi} onClick={() => void bam()}>
        <BieuO khoi="thu-suc-them" />
        <b>{dangGoi ? 'Đang lấy câu…' : 'Thử sức thêm'}</b>
        {/* Hành trình (máy chủ 09/10, docs/hanh-trinh-bai-thu-suc-0910.md): thêm MỘT chặng của hôm nay, tối đa 6 câu (số trên Sảnh là ước lượng);
            chiến dịch cũ giữ nghĩa cũ "lấy trước câu ngày mai". */}
        <span>{s.hanhTrinh ? `Thêm một chặng hôm nay · tối đa ${t.soCau} câu` : `Lấy trước ${t.soCau} câu mới của ngày mai`}</span>
      </button>
      {loi && (
        <p className="v2s-lt-loi" role="alert">
          {loi}
        </p>
      )}
    </>
  )
}

/** "Luyện thêm · không bắt buộc": lưới ô đều — đủ mọi cửa của Sảnh cũ (Thử sức thêm, Vé, Kiểm đầu/tuần, Đề thử, Tu luyện, Bi-a, Kiểm tra chuyên sâu) + Giờ học. */
function LuyenThem({ p, s, onDaLay }: { p: SanhBanDoProps; s: SanhHoa2; onDaLay: () => void }) {
  const o = s.omni
  const cuaBia = p.onChoiBia ? chuCuaBia(s) : null
  const mo = (viec: ViecOmniDao) => {
    datViecOmniDao(viec)
    p.onKhamPhaDao()
  }
  return (
    <section className="v2s-lt" aria-labelledby="v2s-lt-tieu">
      <div className="v2s-lt-dau">
        <h2 id="v2s-lt-tieu" className="v2-tieu-de v2s-lt-tieu">
          Luyện thêm
        </h2>
        <span>không bắt buộc</span>
      </div>
      <div className="v2s-lt-luoi">
        <OThuSuc s={s} token={p.token} onTaiLai={p.onTaiLai} onDaLay={onDaLay} />
        {o && o.ve.tong > 0 && <OLuyen khoi="ve-thu-thach" nhan={chuVe(o.ve.con, o.ve.tong)} phu={GOI_Y_VE} khoa={o.ve.con <= 0} onClick={() => mo('ve')} />}
        {o?.kiemHanhTrinh && <OLuyen khoi="kiem-hanh-trinh" nhan={chuKiemHanhTrinh(o.kiemHanhTrinh)} phu={o.kiemHanhTrinh.loai === 'dau' ? 'Làm trước khi luyện để đo điểm xuất phát' : 'Đo lại sau một tuần luyện'} onClick={() => mo('de-thu')} />}
        {o?.deThu.duoc && !o.kiemHanhTrinh && <OLuyen khoi="de-thu" nhan="Đề thử" phu={`${o.deThu.soCau} câu · ${o.deThu.phut} phút · chỉ để đo, không phải ca kiểm tra`} onClick={() => mo('de-thu')} />}
        {p.onTuLuyen && <OLuyen khoi="tu-luyen" nhan="Tu luyện" phu="Chỉ dành cho học sinh Nỗ lực" onClick={p.onTuLuyen} />}
        {cuaBia && <OLuyen khoi="bia-game" nhan={cuaBia.lon} phu={cuaBia.nho} khoa={!cuaBia.mo} onClick={p.onChoiBia} />}
        {o?.l4Kiem?.duoc && <OLuyen khoi="l4-kiem" phu="Tổng hợp · phối hợp kiến thức đã học" nhan={o.l4Kiem.soCau > 0 ? `Kiểm tra chuyên sâu · ${o.l4Kiem.soCau} câu` : 'Kiểm tra chuyên sâu'} onClick={() => mo('de-thu-l4')} />}
      </div>
      {o?.metGio && (
        <Nhung lop="v2s-nhung-met-gio">
          <TheMetGio s={s} token={p.token} onTaiLai={p.onTaiLai} />
        </Nhung>
      )}
    </section>
  )
}

function ManHanhTrinh({ p, s, khoi, onVeHomNay }: { p: SanhBanDoProps; s: SanhHoa2 | null; khoi: 10 | 11 | 12 | null; onVeHomNay: () => void }) {
  const h = s?.hanhTrinh
  return (
    <main className="v2s-trang" aria-busy={p.dangTai && !s}>
      <TieuDeTrang chu={`Hành trình ${chuHoa(khoi)}`} phu={!s || h ? 'Mỗi bài mở tầng kế khi em đã vững 80% tầng trước.' : null} />
      {!s ? (
        p.loi ? (
          <section className="v2-the v2s-trong" role="alert">
            <p className="v2s-dong-phu">{p.loi}</p>
            <button type="button" className="v2-nut-phu tt-nhan" onClick={p.onTaiLai}>
              Thử lại
            </button>
          </section>
        ) : (
          <section className="v2-the v2s-trong" role="status">
            <span className="v2-xuong" style={{ height: 20, width: '40%' }} />
            <span className="v2-xuong" style={{ height: 64 }} />
            <span className="v2-xuong" style={{ height: 56 }} />
            <span className="v2-an">Đang mở Hành trình…</span>
          </section>
        )
      ) : h ? (
        <>
          <TheTang s={s} />
          {h.bai?.length ? <TheTungBai bai={h.bai} /> : null}
        </>
      ) : (
        <section className="v2-the v2s-trong">
          <p className="v2s-dong-phu">{s.chienDich ? `Em đang luyện theo Chiến dịch ${s.chienDich.ten} — số câu và hạn nộp ở mục Hôm nay.` : chuChuaCoChienDich(s)}</p>
        </section>
      )}
      {s && <LuyenThem p={p} s={s} onDaLay={onVeHomNay} />}
    </main>
  )
}

// ═══════════════════ ÔN LẠI ═══════════════════

function DongMo({ bieu, mau, nhan, phu, onClick }: { bieu: ReactNode; mau: 'ngoc' | 'vang'; nhan: string; phu: string; onClick: () => void }) {
  return (
    <button type="button" className="v2s-dong tt-nhan" onClick={onClick}>
      <span className="v2s-dong-bieu" data-mau={mau} aria-hidden="true">
        {bieu}
      </span>
      <span className="v2s-dong-chu">
        <b>{nhan}</b>
        <span>{phu}</span>
      </span>
      <ChevronRight className="v2s-dong-mui" size={20} aria-hidden="true" />
    </button>
  )
}

function ManOnLai({ p, s }: { p: SanhBanDoProps; s: SanhHoa2 | null }) {
  const n = s?.doan.con ?? 0
  const ca = p.caGanNhat ? p.caGanNhat.chu.replace(/^Ca kiểm tra gần nhất/, 'Ca gần nhất') : 'Điểm và bài làm các ca đã công bố'
  return (
    <main className="v2s-trang">
      <TieuDeTrang chu="Ôn lại" phu="Câu đến lịch ôn, sổ câu đã làm và kết quả ca." />
      <section className="v2-the v2s-on" aria-label="Đến lịch ôn lại hôm nay">
        {!s ? (
          p.loi ? (
            <>
              <p className="v2s-dong-phu">Chưa tải được lịch ôn lại. {p.loi}</p>
              <button type="button" className="v2-nut-phu tt-nhan" onClick={p.onTaiLai}>
                Thử lại
              </button>
            </>
          ) : (
            <>
              <span className="v2-xuong" style={{ height: 16, width: '45%' }} />
              <span className="v2-xuong" style={{ height: 48, width: '30%' }} />
              <span className="v2-an" role="status">
                Đang mở lịch ôn lại…
              </span>
            </>
          )
        ) : n > 0 ? (
          <>
            <div className="v2s-on-chu">
              <p className="v2s-nhan-tang">Đến lịch ôn lại hôm nay</p>
              <p className="v2s-so-lon v2-so">
                {n}
                <span className="v2s-so-lon-phu"> câu</span>
              </p>
              <p className="v2s-dong-phu">Câu em từng sai, nay tới lúc làm lại để nhớ lâu.</p>
            </div>
            <button type="button" className="v2-nut-chinh tt-nhan" onClick={p.onPhaPhucKich}>
              Ôn trong Đoàn Hộ Tống
            </button>
          </>
        ) : (
          <p className="v2s-dong-phu">Hôm nay không còn câu đến lịch ôn lại. Câu từng sai sẽ quay lại đúng lịch.</p>
        )}
      </section>
      <section className="v2-the v2s-ds" aria-label="Sổ câu và kết quả ca">
        <DongMo bieu={<IconSo co={22} />} mau="ngoc" nhan="Sổ câu đã làm" phu="Câu và lời giải đã mở, theo bài và nguồn" onClick={p.onCauDaLam} />
        {p.onLichSuCa && <DongMo bieu={<IconCa co={22} />} mau="vang" nhan="Kết quả ca kiểm tra" phu={ca} onClick={p.onLichSuCa} />}
      </section>
    </main>
  )
}

// ═══════════════════ CỦA EM ═══════════════════

function TheThanThu({ p, chonThu }: { p: SanhBanDoProps; chonThu: boolean }) {
  const thu = chonThu ? null : p.thu
  const loai = thu ? PETS[thu.index] : undefined
  const can = thu ? thanhExp(thu.cap) : 0
  const conThieu = p.exp?.conThieu ?? null
  const coExp = !!thu && can > 0 && conThieu !== null
  const co = coExp ? Math.max(0, Math.min(can, can - conThieu!)) : 0
  const ben = p.shopBat ? 'Túi đồ và Cửa hàng ở bên trong' : 'Túi đồ ở bên trong'
  return (
    <button type="button" className="v2-the v2s-the-thu tt-nhan" onClick={chonThu ? p.onChonThu : p.onMoThanThu}>
      <span className="v2s-the-thu-dau">
        {thu ? (
          <img className="v2s-the-thu-anh" src={anhThu(thu.index, thu.cap)} alt="" width={104} height={104} decoding="async" />
        ) : (
          <span className="v2s-the-thu-anh v2s-thu-trong" aria-hidden="true">
            <PawPrint size={44} />
          </span>
        )}
        <span className="v2s-the-thu-chu">
          <span className="v2s-nhan-tang">{chonThu ? 'Chưa có thần thú' : 'Thần thú của em'}</span>
          <b className="v2-tieu-de v2s-the-thu-ten">{chonThu ? 'Chọn thần thú của em' : thu ? thu.ten : 'Thần thú của em'}</b>
          {thu && loai && (
            <span className="v2s-the-thu-loai">
              {loai.name} · hệ {loai.element} · Cấp {thu.cap}
            </span>
          )}
          {chonThu && <span className="v2s-the-thu-loai">Một lần chọn, đồng hành cả năm học</span>}
        </span>
      </span>
      {!chonThu && (
        <span className="v2s-the-thu-duoi">
          {coExp && (
            <span className="v2s-thanh" aria-hidden="true">
              <i className="tt-thanh" style={{ width: `${phanTram(co, can)}%` }} />
            </span>
          )}
          <span className="v2s-the-thu-phu">{coExp ? `Còn ${conThieu} EXP lên cấp ${thu!.cap + 1} · ${ben}` : ben}</span>
        </span>
      )}
    </button>
  )
}

function ManCuaEm({ p, chonThu }: { p: SanhV2Props; chonThu: boolean }) {
  const lop = chuLop(p.lop)
  const dau = chuDauTen(p.tenEm)
  return (
    <main className="v2s-trang">
      <TieuDeTrang chu="Của em" />
      <section className="v2-the v2s-ho-so" aria-label="Hồ sơ của em">
        <span className="v2s-chu-dau" aria-hidden="true">
          {dau || <PawPrint size={26} />}
        </span>
        <span className="v2s-ho-so-chu">
          <b className="v2-tieu-de v2s-ho-so-ten">{p.tenEm.trim() || 'Học sinh'}</b>
          <span className="v2s-chip-hang">
            {lop && <span className="v2-chip">{lop}</span>}
            <span className="v2-chip v2-so" data-mau="vang">
              Chuỗi {p.chuoiNgay} ngày
            </span>
          </span>
        </span>
      </section>
      <TheThanThu p={p} chonThu={chonThu} />
      <button type="button" className="v2s-dang-xuat tt-nhan" onClick={p.onDangXuat}>
        Đăng xuất
      </button>
    </main>
  )
}

// ═══════════════════ KHUNG ═══════════════════

/** Phần tử cuộn của trang (màn V2 cuộn cả trang, không cuộn trong khung riêng). */
const vungCuon = (): Element | null => (typeof document === 'undefined' ? null : document.scrollingElement ?? document.documentElement)

export default function SanhV2(goc: SanhV2Props) {
  const p = boCuaNhanh(goc)
  const bc = useBoCucNgang()
  const [khu, setKhu] = useState<Khu>('hom-nay')
  const kq = p.ketQua
  const s = kq && kq.cheDo2 && !kq.canChonThu ? kq.sanh : null
  const chonThu = !!kq && kq.cheDo2 && kq.canChonThu === true
  useNapTruocManSanh(!!s, !!s && s.doan.con > 0)
  const khoi = khoiTuLop(p.lop)
  // Mỗi mục GIỮ chỗ cuộn của mình (bản vẽ HeThong: "đổi mục: mờ dần + trượt 8px, giữ chỗ đang cuộn"); mục mở lần đầu ở đầu trang.
  const cuon = useRef<Partial<Record<Khu, number>>>({})
  const daVe = useRef(false)
  const doiKhu = (k: Khu) => {
    if (k === khu) return
    const el = vungCuon()
    if (el) cuon.current[khu] = el.scrollTop
    setKhu(k)
  }
  useLayoutEffect(() => {
    if (!daVe.current) {
      daVe.current = true
      return
    }
    const el = vungCuon()
    if (el) el.scrollTop = cuon.current[khu] ?? 0
  }, [khu])
  return (
    <div
      className="v2 v2-sanh"
      data-bo-cuc={bc.ngang ? 'ngang' : 'doc'}
      data-thap={bc.thap ? 'true' : 'false'}
      data-trang-thai={s ? 'co' : chonThu ? 'chon-thu' : p.loi ? 'loi' : 'dang-tai'}
      data-khu={khu}
    >
      <div className="v2s-khung">
        {/* nội dung mục: dựng mới khi đổi mục ⇒ trượt vào (.tt-vao-muc); thanh dưới nằm NGOÀI lớp trượt (transform không được bọc phần tử fixed) */}
        <div key={khu} className="v2s-man tt-vao-muc">
          {khu === 'hom-nay' ? (
            <ManHomNay p={p} s={s} khoi={khoi} chonThu={chonThu} onDoi={doiKhu} />
          ) : khu === 'hanh-trinh' ? (
            <ManHanhTrinh p={p} s={s} khoi={khoi} onVeHomNay={() => doiKhu('hom-nay')} />
          ) : khu === 'on-lai' ? (
            <ManOnLai p={p} s={s} />
          ) : (
            <ManCuaEm p={p} chonThu={chonThu} />
          )}
        </div>
        <ThanhDuoi dang={khu} onDoi={doiKhu} />
      </div>
    </div>
  )
}

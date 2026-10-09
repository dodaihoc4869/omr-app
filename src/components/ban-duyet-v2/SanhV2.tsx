// BẢN DUYỆT V2 · MÀN "HÔM NAY" + "HÀNH TRÌNH" CỦA HỌC SINH — theo BẢN VẼ TỐI GIẢN THẦY CHỐT 09/10/2026
// (canvas-v3: HS-HomNay, HS-HanhTrinh, BoGop). Mỗi màn trả lời đúng một câu hỏi, đúng MỘT nút vàng.
//   · Hôm nay: đầu màn = ảnh nhỏ thần thú + "Chào {tên gọi}" + "Chuỗi N ngày" + nút tròn Ca kiểm tra (CHỈ khi không có ca mở; có ca mở ⇒
//     chỉ MỘT dải "Vào thi"). Khối anh hùng "Hoá {khối} · tầng …" + số lớn "{đã làm}/{tối thiểu} câu" + "Chặng x/y · còn n câu trong chặng".
//     Thẻ 3 bước: Gỡ lỗi cũ (Đoàn Hộ Tống) → Câu mới (Bát Linh Đảo) → Mở rương hôm nay (rương là bước 3, KHÔNG thanh riêng).
//     Một nút vàng "Bắt đầu · …". Xong kế hoạch ⇒ XongHomNay (mở rương). Huyết Chiến giữ; thẻ chiến dịch (có HẠN NỘP) giữ khi không phải Hành trình.
//   · Hành trình (mục thứ hai của thanh dưới): tầng của TỪNG bài (`hanhTrinh.bai`, máy chủ mới — vắng ⇒ chỉ tầng chung + chặng) +
//     "Luyện thêm · không bắt buộc": Thử sức thêm, Vé thử thách, Đề thử, Tu luyện, Bi-a, Giờ học (Mệt giờ) — đúng hành động/lệnh máy chủ của Sảnh cũ.
//   · Đã CHUYỂN khỏi Hôm nay: Túi đồ, Cửa hàng, Đăng xuất (→ Thần thú) · Ca gần nhất (→ Câu đã làm) · Tu luyện, Bi-a, Vé, Đề thử, Mệt giờ
//     (→ Luyện thêm) · "Đang mạnh lên" (→ Dạng vững ở Hành trình).
// MỌI con số lấy từ máy chủ (`hoa2-sanh` + kế hoạch ngày) — không tự tính, không bịa. Lỗi bất kỳ trong màn này ⇒ SanhHomNay rơi về Sảnh cũ.
import { useState, type ReactNode } from 'react'
import { BookOpenCheck, Home, Lock, Map as BanDo, PawPrint, Sparkles } from 'lucide-react'
import { anhThu } from '../../game/than-thu-v2/dao/anh'
import type { SanhBanDoProps } from '../hoa2/SanhBanDo'
import { DaiVaoThi, DongChienDich, IconCa, IconChuoi, TheHuyetChien, TheMetGio, XongHomNay, chuChuaCoChienDich, chuCuaBia, chuKhongConCau } from '../hoa2/SanhBanDo'
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
  /** Tên lớp (vd "12A1", "12 - Tinh Hoa") — chỉ để đọc khối 10/11/12. */
  lop: string
}

export const TEN_TANG = ['Nền', 'Hiểu', 'Vận dụng', 'Tổng hợp'] as const

/** Tên gọi trong lời chào: hai chữ cuối của họ tên ba chữ trở lên ("Nguyễn Minh Anh" → "Minh Anh"), còn lại giữ nguyên. */
export function tenGoi(hoTen: string): string {
  const chu = hoTen.trim().split(/\s+/).filter(Boolean)
  if (chu.length === 0) return ''
  return chu.length >= 3 ? chu.slice(-2).join(' ') : chu.join(' ')
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

/** Chữ của khối anh hùng (đầu màn Hôm nay), dựng đúng từ số máy chủ. */
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
  /** Nhãn trạng thái ở cuối hàng ("Làm ngay", "Chờ", "Còn 18 câu"…). */
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

/** Tầng thứ `tang` (1–4) của một bài có tầng đang luyện `tangMo`: nhỏ hơn ⇒ vững · bằng ⇒ đang luyện · lớn hơn ⇒ khoá. */
export function trangThaiTang(tang: number, tangMo: number): 'vung' | 'dang' | 'khoa' {
  return tang < tangMo ? 'vung' : tang === tangMo ? 'dang' : 'khoa'
}
const CHU_TANG = { vung: 'Vững', dang: 'Đang luyện', khoa: 'Khoá' } as const

/** Khối cũ nhúng trong màn V2 (giữ đúng hành vi + kiểm thử của Sảnh cũ; biến màu --h2-* được đổi sang Bảng G ở sanh-v2.css). */
function Nhung({ children, lop = '' }: { children: ReactNode; lop?: string }) {
  return <div className={`h2-sanh v2s-nhung ${lop}`}>{children}</div>
}

function TheBaBuoc({ buoc }: { buoc: Buoc[] }) {
  return (
    <section className="v2-the v2s-buoc-the" aria-label="Ba bước hôm nay">
      <ol className="v2s-buoc">
        {buoc.map((b) => (
          <li key={b.so} className="v2s-buoc-o" data-tt={b.tt}>
            <span className="v2s-buoc-so v2-so" aria-hidden="true">
              {b.tt === 'khoa' ? <Lock size={18} /> : b.so}
            </span>
            <span className="v2s-buoc-chu">
              <b>
                <span className="v2-an">Bước {b.so}: </span>
                {b.nhan}
              </b>
              <span>{b.phu}</span>
              {b.them && <span className="v2s-buoc-them">{b.them}</span>}
            </span>
            <span className="v2s-buoc-chip">{b.chip}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

/** MỘT nút vàng của ngày (logic nút "Bắt đầu" cũ giữ nguyên): còn lỗi cũ ⇒ mở Đoàn Hộ Tống; hết lỗi cũ, còn câu mới ⇒ mở Đảo.
 *  Còn lỗi cũ mà máy chủ KHÔNG khoá Đảo ⇒ thêm nút phụ vào Đảo (khoá thì bước 2 đã nói "Mở sau bước 1" + lời máy chủ). */
function NutBatDau({ p, s }: { p: SanhBanDoProps; s: SanhHoa2 }) {
  if (s.doan.con > 0) {
    return (
      <>
        <button type="button" className="v2-nut-chinh v2s-nut-bat-dau" onClick={p.onPhaPhucKich}>
          <PlayIcon />
          <span>Bắt đầu · gỡ {s.doan.con} lỗi cũ</span>
        </button>
        {s.dao.con > 0 && !s.khoaDao && (
          <button type="button" className="v2-nut-phu v2s-nut-dao" onClick={p.onKhamPhaDao}>
            Khám phá Bát Linh Đảo · {s.dao.con} câu
          </button>
        )}
      </>
    )
  }
  if (s.dao.con > 0) {
    return (
      <button type="button" className="v2-nut-chinh v2s-nut-bat-dau" onClick={p.onKhamPhaDao}>
        <PlayIcon />
        <span>Bắt đầu · {s.dao.con} câu mới</span>
      </button>
    )
  }
  return null
}

function PlayIcon() {
  return (
    <svg width="22" height="24" viewBox="0 0 22 24" aria-hidden="true" focusable="false">
      <path d="M3 2.6v18.8c0 1.5 1.6 2.4 2.9 1.6l15-9.4c1.2-.8 1.2-2.5 0-3.2l-15-9.4C4.6.2 3 1.1 3 2.6z" fill="currentColor" />
    </svg>
  )
}

function ThanhDuoi({ dang, onHomNay, onHanhTrinh, onThanThu, onCauDaLam }: { dang: 'hom-nay' | 'hanh-trinh' | 'on-lai' | 'cua-em'; onHomNay: () => void; onHanhTrinh: () => void; onThanThu: () => void; onCauDaLam: () => void }) {
  const muc: { k: string; nhan: string; bieu: ReactNode; on: () => void; dang: boolean }[] = [
    { k: 'hom-nay', nhan: 'Hôm nay', bieu: <Home size={24} />, on: onHomNay, dang: dang === 'hom-nay' },
    { k: 'hanh-trinh', nhan: 'Hành trình', bieu: <BanDo size={24} />, on: onHanhTrinh, dang: dang === 'hanh-trinh' },
    { k: 'cau-da-lam', nhan: 'Ôn lại', bieu: <BookOpenCheck size={24} />, on: onCauDaLam, dang: dang === 'on-lai' },
    { k: 'than-thu', nhan: 'Của em', bieu: <PawPrint size={24} />, on: onThanThu, dang: dang === 'cua-em' },
  ]
  return (
    <nav className="v2s-thanh-duoi" aria-label="Điều hướng chính">
      {muc.map((m) => (
        <button key={m.k} type="button" className="v2s-thanh-duoi-nut" aria-current={m.dang ? 'page' : undefined} onClick={m.on}>
          {m.bieu}
          <span>{m.nhan}</span>
        </button>
      ))}
    </nav>
  )
}

/** Đầu màn Hôm nay. Thần thú chỉ có MỘT lối vào (mục "Thần thú" của thanh dưới) ⇒ ảnh ở đây là ảnh, không phải nút. */
function AnhHung({ p, tenEm, khoi, s, chonThu }: { p: SanhBanDoProps; tenEm: string; khoi: 10 | 11 | 12 | null; s: SanhHoa2 | null; chonThu: boolean }) {
  const thu = chonThu ? null : p.thu
  const goi = tenGoi(tenEm)
  const d = s ? dongAnhHung(s, khoi) : null
  return (
    <header className="v2s-anh-hung">
      <div className="v2s-canh" aria-hidden="true" />
      <div className="v2s-dau">
        <span className="v2s-avatar" aria-hidden="true">
          {thu ? <img src={anhThu(thu.index, thu.cap, true)} alt="" width={96} height={96} /> : <PawPrint size={26} />}
        </span>
        <div className="v2s-chao">
          <h1 className="v2s-chao-ten">{goi ? `Chào ${goi}` : 'Chào em'}</h1>
          <span className="v2s-chuoi">
            <IconChuoi />
            <span className="v2-so">Chuỗi {p.chuoiNgay} ngày</span>
          </span>
        </div>
        {!p.caDangMo && (
          <button type="button" className="v2-nut-tron v2s-nut-ca" onClick={p.onVaoThi} aria-label="Ca kiểm tra" title="Ca kiểm tra">
            <IconCa co={22} />
          </button>
        )}
      </div>
      <div className="v2s-tien-do">
        <div className="v2s-tien-do-chu">
          {d && <p className="v2s-nhan-tang">{d.nhan}</p>}
          {d && d.tong > 0 && (
            <p className="v2s-so-lon v2-so">
              <span className="v2-an">Hôm nay em đã làm </span>
              {d.da}
              <span className="v2s-so-lon-phu">/{d.tong} câu</span>
            </p>
          )}
          {d?.chang && <p className="v2s-chang">{d.chang}</p>}
          {d?.thieu && <p className="v2s-thieu">{d.thieu}</p>}
          {s && s.theLuc.con > 0 && <div className="v2s-hoc-tiep"><NutBatDau p={p} s={s} /></div>}
        </div>
        {thu ? (
          <img className="v2s-thu" src={anhThu(thu.index, thu.cap)} alt={`Thần thú của em: ${thu.ten}`} width={320} height={320} decoding="async" fetchPriority="high" />
        ) : (
          <span className="v2s-thu v2s-thu-trong" aria-hidden="true">
            <Sparkles size={56} />
          </span>
        )}
      </div>
    </header>
  )
}

/** Thân màn Hôm nay khi đã có số máy chủ: thẻ 3 bước · nút vàng (hoặc màn xong / kế hoạch rỗng) · lối sang Luyện thêm. */
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
      ) : trong ? (
        (s.chienDich || s.hanhTrinh) && (
          <section className="v2-the v2s-trong">
            <p className="v2s-dong-phu" data-khoi={s.tamGiuCa > 0 ? 'tam-giu-ca' : undefined}>
              {chuKhongConCau(s)}
            </p>
          </section>
        )
      ) : (
        <section className="v2-the v2s-goi-y"><h2>Học từng chặng ngắn</h2><p>Em có thể nghỉ sau mỗi chặng rồi quay lại học tiếp. Kết quả đã làm được giữ lại.</p></section>
      )}
      {!xong && <NutKiemHanhTrinh p={p} s={s} />}
      {(xong || trong) && (
        <button type="button" className="v2-nut-phu v2s-nut-luyen-them" onClick={onLuyenThem}>
          Luyện thêm · không bắt buộc
        </button>
      )}
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
    <button type="button" className="v2-nut-phu v2s-nut-luyen-them" data-khoi="kiem-hanh-trinh" onClick={() => { datViecOmniDao('de-thu'); p.onKhamPhaDao() }}>
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

// ═══════════════════ HÀNH TRÌNH (mục thứ hai của thanh dưới) ═══════════════════

function TheTangTungBai({ bai }: { bai: BaiHanhTrinh[] }) {
  return (
    <section className="v2-the v2s-ht-the" aria-label="Tầng của từng bài">
      <div className="v2s-ht-cot" aria-hidden="true">
        {TEN_TANG.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <ul className="v2s-ht-ds">
        {bai.map((b) => (
          <li key={b.khoa} className="v2s-ht-bai">
            <div className="v2s-ht-bai-dau">
              <b>{b.ten}</b>
              {b.vung && <span className="v2s-ht-vung v2-so">{chuDangVung(b.vung.a, b.vung.b)}</span>}
            </div>
            <ol className="v2s-ht-tang" aria-label={`Tầng của ${b.ten}`}>
              {TEN_TANG.map((t, i) => {
                const k = trangThaiTang(i + 1, b.tangMo)
                return (
                  <li key={t} data-tt={k}>
                    <span className="v2-an">{t}: </span>
                    {CHU_TANG[k]}
                  </li>
                )
              })}
            </ol>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Máy chủ chưa gửi tầng từng bài ⇒ chỉ tầng chung + chặng hôm nay (+ Dạng vững khi OMNI gửi) — không bịa trạng thái bài. */
function TheTangChung({ s }: { s: SanhHoa2 }) {
  const h = s.hanhTrinh!
  const v = s.omni?.dangVung
  const chang = h.daLam >= h.toiThieu ? 'Hôm nay em đã đủ mức tối thiểu.' : h.soChang > 0 ? `Hôm nay: Chặng ${h.changHienTai}/${h.soChang} · còn ${h.cauTrongChang} câu trong chặng` : null
  return (
    <section className="v2-the v2s-ht-the" aria-label="Tầng đang luyện">
      <p className="v2s-ht-chung">
        Tầng đang luyện: <b>{tenTang(h.tang)}</b>
      </p>
      <ol className="v2s-ht-tang" aria-hidden="true">
        {TEN_TANG.map((t, i) => (
          <li key={t} data-tt={i + 1 === h.tang ? 'dang' : 'tron'}>
            {t}
          </li>
        ))}
      </ol>
      {chang && <p className="v2s-dong-phu">{chang}</p>}
      {v && v.b > 0 && <p className="v2s-ht-vung v2-so">{chuDangVung(v.a, v.b)}</p>}
    </section>
  )
}

function OLuyen({ nhan, phu, khoa = false, onClick, khoi }: { nhan: string; phu?: string; khoa?: boolean; onClick?: () => void; khoi: string }) {
  return (
    <button type="button" className="v2s-o" data-khoi={khoi} disabled={khoa || !onClick} onClick={khoa ? undefined : onClick}>
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
      <button type="button" className="v2s-o" data-khoi="thu-suc-them" aria-busy={dangGoi} onClick={() => void bam()}>
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

function LuyenThem({ p, s, onDaLay }: { p: SanhBanDoProps; s: SanhHoa2; onDaLay: () => void }) {
  const o = s.omni
  const mo = (viec: ViecOmniDao) => {
    datViecOmniDao(viec)
    p.onKhamPhaDao()
  }
  return (
    <section className="v2s-lt" aria-labelledby="v2s-lt-tieu">
      <div className="v2s-lt-dau">
        <h2 id="v2s-lt-tieu" className="v2s-lt-tieu">
          Luyện thêm
        </h2>
        <span>không bắt buộc</span>
      </div>
      <div className="v2s-lt-luoi">
        <OThuSuc s={s} token={p.token} onTaiLai={p.onTaiLai} onDaLay={onDaLay} />
        {o && o.ve.tong > 0 && <OLuyen khoi="ve-thu-thach" nhan={chuVe(o.ve.con, o.ve.tong)} phu={GOI_Y_VE} khoa={o.ve.con <= 0} onClick={() => mo('ve')} />}
        {o?.l4Kiem?.duoc && <OLuyen khoi="l4-kiem" phu="Tổng hợp · phối hợp kiến thức đã học" nhan={o.l4Kiem.soCau > 0 ? `Kiểm tra chuyên sâu · ${o.l4Kiem.soCau} câu` : 'Kiểm tra chuyên sâu'} onClick={() => mo('de-thu-l4')} />}
        {o?.kiemHanhTrinh && <OLuyen khoi="kiem-hanh-trinh" nhan={chuKiemHanhTrinh(o.kiemHanhTrinh)} phu={o.kiemHanhTrinh.loai === 'dau' ? 'Làm trước khi luyện để đo điểm xuất phát' : 'Đo lại sau một tuần luyện'} onClick={() => mo('de-thu')} />}
        {o?.deThu.duoc && !o.kiemHanhTrinh && <OLuyen khoi="de-thu" nhan="Đề thử" phu={`${o.deThu.soCau} câu · ${o.deThu.phut} phút · chỉ để đo, không phải ca kiểm tra`} onClick={() => mo('de-thu')} />}
        {p.onTuLuyen && <OLuyen khoi="tu-luyen" nhan="Tu luyện" phu="Chỉ dành cho học sinh Nỗ lực" onClick={p.onTuLuyen} />}
      </div>
      {o?.metGio && (
        <Nhung lop="v2s-nhung-met-gio">
          <TheMetGio s={s} token={p.token} onTaiLai={p.onTaiLai} />
        </Nhung>
      )}
    </section>
  )
}

function KhuHanhTrinh({ p, s, khoi, onVeHomNay }: { p: SanhBanDoProps; s: SanhHoa2 | null; khoi: 10 | 11 | 12 | null; onVeHomNay: () => void }) {
  const h = s?.hanhTrinh
  const cuaBia = s && p.onChoiBia ? chuCuaBia(s) : null
  return (
    <main className="v2s-ht" aria-busy={p.dangTai && !s}>
      <header className="v2s-ht-dau">
        <h1 className="v2-tieu-de v2s-ht-tieu">Hành trình {chuHoa(khoi)}</h1>
        {(!s || h) && <p className="v2s-dong-phu">Mỗi bài mở tầng kế khi em đã vững 80% tầng trước.</p>}
      </header>
      <section className="v2-the v2s-tang-giai-thich" aria-label="Nội dung bốn tầng"><h2>Bốn tầng kiến thức</h2><ol>{['Nền · kiến thức cần để bắt đầu','Hiểu · giải thích và nhận ra bản chất','Vận dụng · tự giải bài theo dạng','Tổng hợp · phối hợp nhiều kiến thức'].map((x,i) => <li key={x}><b>{i+1}</b><span>{x}</span></li>)}</ol></section>
      {!s ? (
        p.loi ? (
          <section className="v2-the v2s-trong" role="alert">
            <p className="v2s-dong-phu">{p.loi}</p>
            <button type="button" className="v2-nut-phu" onClick={p.onTaiLai}>
              Thử lại
            </button>
          </section>
        ) : (
          <section className="v2-the v2s-trong" role="status">
            <span className="v2-xuong" style={{ height: 26, width: '58%' }} />
            <span className="v2-xuong" style={{ height: 120 }} />
            <span className="v2-an">Đang mở Hành trình…</span>
          </section>
        )
      ) : h ? (
        h.bai?.length ? <TheTangTungBai bai={h.bai} /> : <TheTangChung s={s} />
      ) : (
        <section className="v2-the v2s-trong">
          <p className="v2s-dong-phu">{s.chienDich ? `Em đang luyện theo Chiến dịch ${s.chienDich.ten} — số câu và hạn nộp ở mục Hôm nay.` : chuChuaCoChienDich(s)}</p>
        </section>
      )}
      {s && <section className="v2-the v2s-games"><h2>Học cùng trò chơi</h2><div className="v2s-lt-luoi"><OLuyen khoi="doan" nhan="Đoàn Hộ Tống" phu={`Còn ${s.doan.con} câu ôn hôm nay`} khoa={s.doan.con <= 0} onClick={p.onPhaPhucKich} /><OLuyen khoi="dao" nhan="Bát Linh Đảo" phu={s.khoaDao ? 'Hoàn thành câu ôn để mở đường' : `Còn ${s.dao.con} câu hôm nay`} khoa={s.khoaDao || s.dao.con <= 0} onClick={p.onKhamPhaDao} />{cuaBia && <OLuyen khoi="bia-game" nhan={cuaBia.lon} phu={cuaBia.nho} khoa={!cuaBia.mo} onClick={p.onChoiBia} />}</div></section>}
      {s && <LuyenThem p={p} s={s} onDaLay={onVeHomNay} />}
    </main>
  )
}

export default function SanhV2(goc: SanhV2Props) {
  const p = boCuaNhanh(goc)
  const bc = useBoCucNgang()
  const [khu, setKhu] = useState<'hom-nay' | 'hanh-trinh' | 'on-lai' | 'cua-em'>('hom-nay')
  const kq = p.ketQua
  const s = kq && kq.cheDo2 && !kq.canChonThu ? kq.sanh : null
  const chonThu = !!kq && kq.cheDo2 && kq.canChonThu === true
  useNapTruocManSanh(!!s, !!s && s.doan.con > 0)
  const khoi = khoiTuLop(p.lop)
  const doiKhu = (k: 'hom-nay' | 'hanh-trinh' | 'on-lai' | 'cua-em') => {
    setKhu(k)
    if (typeof document !== 'undefined' && document.scrollingElement) document.scrollingElement.scrollTop = 0
  }
  const phu = s ? cotPhu(p, s) : null
  return (
    <div
      className="v2 v2-sanh"
      data-bo-cuc={bc.ngang ? 'ngang' : 'doc'}
      data-thap={bc.thap ? 'true' : 'false'}
      data-trang-thai={s ? 'co' : chonThu ? 'chon-thu' : p.loi ? 'loi' : 'dang-tai'}
      data-khu={khu}
    >
      <div className="v2s-khung">
        {khu === 'on-lai' ? <main className="v2s-ht"><h1 className="v2-tieu-de">Ôn lại</h1><section className="v2-the"><h2>Đến lịch ôn lại</h2>{s ? <><p>{s.doan.con > 0 ? `Còn ${s.doan.con} câu ôn trong Đoàn Hộ Tống hôm nay.` : 'Hôm nay không còn câu ôn trong Đoàn Hộ Tống.'}</p>{s.doan.con > 0 && <button type="button" className="v2-nut-chinh" onClick={p.onPhaPhucKich}>Ôn trong Đoàn Hộ Tống</button>}</> : <p>Chưa tải được lịch ôn.</p>}</section><section className="v2-the"><h2>Sổ câu đã làm</h2><p>Xem câu và lời giải đã được mở cho em, theo bài và nguồn học.</p><button type="button" className="v2-nut-phu" onClick={p.onCauDaLam}>Mở câu đã làm</button></section></main> : khu === 'cua-em' ? <main className="v2s-ht"><h1 className="v2-tieu-de">Của em</h1><section className="v2-the"><h2>{p.tenEm}</h2><p>{p.lop ? `Lớp ${p.lop}` : ''} · Chuỗi {p.chuoiNgay} ngày</p><div className="v2s-cach-hoc"><div><button type="button" className="v2-nut-phu" onClick={chonThu ? p.onChonThu : p.onMoThanThu}>Thần thú của em</button><button type="button" className="v2-nut-phu" onClick={p.onTuiDo}>Mở túi đồ</button>{p.shopBat && <button type="button" className="v2-nut-phu" onClick={p.onCuaHang}>Mở cửa hàng</button>}<button type="button" className="v2-nut-phu" onClick={p.onLichSuCa}>Kết quả ca kiểm tra</button><button type="button" className="v2-nut-phu" onClick={p.onDangXuat}>Đăng xuất</button></div></div></section></main> : khu === 'hanh-trinh' ? (
          <KhuHanhTrinh p={p} s={s} khoi={khoi} onVeHomNay={() => doiKhu('hom-nay')} />
        ) : (
          <>
            <AnhHung p={p} tenEm={p.tenEm} khoi={khoi} s={s} chonThu={chonThu} />
            <main className="v2s-luoi" data-hai-cot={phu ? 'true' : 'false'} aria-busy={p.dangTai && !s}>
              <div className="v2s-cot-chinh">
                {p.caDangMo && (
                  <Nhung>
                    <DaiVaoThi onVaoThi={p.onVaoThi} />
                  </Nhung>
                )}
                {s ? (
                  <KhuHomNay p={p} s={s} onLuyenThem={() => doiKhu('hanh-trinh')} />
                ) : chonThu ? (
                  <section className="v2-the v2s-trong">
                    <p className="v2s-dong-phu">Em chọn thần thú đồng hành trước khi lên đường. Thần thú lớn lên theo EXP em học được.</p>
                    <button type="button" className="v2-nut-chinh v2s-nut-bat-dau" onClick={p.onChonThu}>
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
                    <button type="button" className="v2-nut-phu" onClick={p.onTaiLai}>
                      Thử lại
                    </button>
                  </section>
                ) : (
                  <section className="v2-the v2s-trong" role="status">
                    <span className="v2-xuong" style={{ height: 64 }} />
                    <span className="v2-xuong" style={{ height: 64 }} />
                    <span className="v2-xuong" style={{ height: 64 }} />
                    <span className="v2-an">Đang mở kế hoạch hôm nay…</span>
                  </section>
                )}
                {s && <section className="v2-the v2s-cach-hoc" aria-label="Chọn cách học"><h2>Chọn cách học</h2><div><button type="button" className="v2-nut-phu" onClick={() => doiKhu('hanh-trinh')}>Tự luyện và thử thách</button><button type="button" className="v2-nut-phu" onClick={p.onCauDaLam}>Xem câu đã làm</button><button type="button" className="v2-nut-phu" onClick={chonThu ? p.onChonThu : p.onMoThanThu}>Thần thú của em</button></div></section>}
                {s && p.loi && (
                  <p className="v2s-cu" role="status">
                    Chưa cập nhật được: {p.loi}
                  </p>
                )}
                {/* Đăng xuất đã chuyển sang mục Thần thú; khi em chưa vào được Thần thú (chưa chọn thú / chưa tải được số) vẫn giữ một đường ra. */}
                {(chonThu || (!s && !!p.loi)) && (
                  <button type="button" className="v2s-dang-xuat" onClick={p.onDangXuat}>
                    Đăng xuất
                  </button>
                )}
              </div>
              {phu && (
                <div className="v2s-cot-phu">
                  <Nhung lop="v2s-nhung-chien-dich">{phu}</Nhung>
                </div>
              )}
            </main>
          </>
        )}
        <ThanhDuoi
          dang={khu}
          onHomNay={() => doiKhu('hom-nay')}
          onHanhTrinh={() => doiKhu('hanh-trinh')}
          onThanThu={() => doiKhu('cua-em')}
          onCauDaLam={() => doiKhu('on-lai')}
        />
      </div>
    </div>
  )
}

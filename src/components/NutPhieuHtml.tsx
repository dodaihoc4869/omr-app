// HAI NÚT CHO MỌI PHIẾU: XEM và COPY LINK.
//
// Thầy chốt 04-09 tối: bỏ hẳn đường tải PDF. Bản PDF cũ dựng bằng cách chụp ảnh
// từng trang nên chữ KHÔNG NÉT, không bôi đen chọn được, tệp nặng, và mỗi lần
// chụp lệch nửa pixel là ô lệch theo.
//
//   · XEM — dựng HTML tại chỗ rồi hiện NGAY TRONG APP (xem KhungXemPhieu).
//     Không mở thẻ mới: app đã cài chạy ở cửa sổ riêng, không có thẻ, mở blob
//     URL ra đó là ra trang trắng "Không thể truy cập vào tệp của bạn". Chạy
//     được cả khi mất mạng. Muốn PDF thì bấm In rồi chọn "Lưu thành PDF":
//     bản đó là vector, nét hơn hẳn bản chụp ảnh.
//   · COPY LINK — cất phiếu lên máy chủ rồi copy link ngắn, gửi Zalo cho em.
//     Chỉ hiện trên máy CÓ mã bí mật (máy thầy). Máy học sinh và máy phụ huynh
//     không được phép ghi lên máy chủ, nên ở đó chỉ có nút Xem.
import { useEffect, useState } from 'react'
import { Check, Eye, Link2, Loader2 } from 'lucide-react'
import type { CauLuyen } from '../lib/bai-tap-pdf'
import type { ThongTinPhieu } from '../lib/html-phieu'
import KhungXemPhieu from './KhungXemPhieu'
import { luuPhieu, sinhMaPhieu } from '../lib/exam-api'
import { loadScriptUrl, loadTeacherSecret } from '../lib/exam-db'
import { napDong } from '../lib/nap-manh'
import { taoLinkPhieu } from '../lib/phieu-link'

const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }

/** Bản phiếu bài tập cất trên máy chủ. Khác báo cáo gửi phụ huynh (`v: 2`) nên
 * trang đọc phải phân biệt được bằng đúng một trường. */
export const BAN_PHIEU_BT = 3

export interface GoiPhieuBaiTap {
  v: number
  loai: 'baitap'
  tt: ThongTinPhieu
  cau: CauLuyen[]
}

/** Copy vào bộ nhớ tạm, KHÔNG BAO GIỜ treo và không bao giờ ném lỗi.
 * Trả về false khi máy không cho copy — chỗ gọi tự lo phần báo. */
async function copyAnToan(chu: string, han = 4000): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) return false
    const hen = new Promise<false>((r) => setTimeout(() => r(false), han))
    return await Promise.race([navigator.clipboard.writeText(chu).then(() => true), hen])
  } catch {
    return false
  }
}

/** Tên tệp tải về: bỏ dấu, thay khoảng trắng bằng gạch. Tên có dấu tiếng Việt
 * hay bị Zalo và Windows đổi thành ký tự lạ. */
function khongDau(s: string): string {
  return (s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'phieu').slice(0, 40)
}

function nut(chinh: boolean): React.CSSProperties {
  return {
    gap: 6,
    minHeight: 44,
    padding: '0 var(--k4)',
    borderRadius: 'var(--bo-1)',
    background: chinh ? 'var(--muc)' : 'var(--the-2)',
    color: chinh ? 'var(--muc-nguoc)' : 'var(--muc)',
    fontFamily: 'var(--sans)',
    fontSize: 'var(--cx-1)',
  }
}

export interface NutPhieuHtmlProps {
  /** Dựng dữ liệu phiếu. Gọi lúc bấm nút chứ không lúc vẽ — rút câu là việc
   * nặng, không làm khi thầy chỉ đi ngang qua màn hình. */
  dungGoi: () => Promise<{ tt: ThongTinPhieu; cau: CauLuyen[]; maCa?: string; sbd?: string } | null>
  /** Nhãn nút xem, vd "Xem phiếu bài tập". */
  nhanXem: string
  showToast: (chu: string, kieu?: 'success' | 'error' | 'warn') => void
  /** Cho phép copy link (chỉ máy thầy). Mặc định tự dò theo mã bí mật đã lưu. */
  choPhepLink?: boolean
}

export default function NutPhieuHtml({ dungGoi, nhanXem, showToast, choPhepLink }: NutPhieuHtmlProps) {
  const [dang, setDang] = useState<'' | 'xem' | 'link'>('')
  const [htmlPhieu, setHtmlPhieu] = useState('')
  const [tenTep, setTenTep] = useState('phieu.html')
  const [daCopy, setDaCopy] = useState('')
  const [coMaBiMat, setCoMaBiMat] = useState(false)

  useEffect(() => {
    let con = true
    void Promise.all([loadScriptUrl(), loadTeacherSecret()]).then(([u, m]) => con && setCoMaBiMat(Boolean(u.trim() && m.trim())))
    return () => {
      con = false
    }
  }, [])

  const hienLink = choPhepLink ?? coMaBiMat

  const xem = async () => {
    setDang('xem')
    try {
      const g = await dungGoi()
      if (!g) return
      const { dungPhieu } = await napDong(() => import('../lib/html-phieu'))
      setTenTep(`phieu-${khongDau(g.tt.hoTen || 'hoc-sinh')}.html`)
      setHtmlPhieu(dungPhieu(g.tt, g.cau))
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không dựng được phiếu', 'error')
    } finally {
      setDang('')
    }
  }

  const layLink = async () => {
    setDang('link')
    try {
      const g = await dungGoi()
      if (!g) return
      const [url, mat] = await Promise.all([loadScriptUrl(), loadTeacherSecret()])
      if (!url.trim() || !mat.trim()) throw new Error('Chưa cấu hình link Apps Script và mã bí mật')
      const ma = sinhMaPhieu()
      const goi: GoiPhieuBaiTap = { v: BAN_PHIEU_BT, loai: 'baitap', tt: { ...g.tt, ngay: g.tt.ngay }, cau: g.cau }
      await luuPhieu(url.trim(), mat.trim(), { ma, maCa: g.maCa || '', sbd: g.sbd || '', hoTen: g.tt.hoTen, phieu: goi })
      const link = taoLinkPhieu(location.origin + location.pathname.replace(/[^/]*$/, ''), ma)
      // HIỆN LINK TRƯỚC, COPY SAU. navigator.clipboard đòi trang đang được
      // chú ý; app đã cài hoặc trình duyệt trong Zalo có lúc từ chối, có lúc
      // treo luôn không trả lời. Copy hỏng thì link vẫn nằm dưới nút cho thầy
      // bôi đen — mất một thao tác, còn hơn mất cả cái link vừa tạo.
      setDaCopy(link)
      const xong = await copyAnToan(link)
      showToast(xong ? 'Đã copy link phiếu, dán vào Zalo là gửi được' : 'Đã tạo link. Máy không cho copy tự động, thầy bôi đen dòng dưới rồi copy tay.', xong ? 'success' : 'warn')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không tạo được link phiếu', 'error')
    } finally {
      setDang('')
    }
  }

  return (
    <div className="flex flex-col" style={{ gap: 'var(--k2)' }}>
      <div className="flex flex-wrap" style={{ gap: 'var(--k2)' }}>
        <button type="button" onClick={() => void xem()} disabled={!!dang} className="tap-target inline-flex items-center font-bold" style={nut(true)}>
          {dang === 'xem' ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
          {dang === 'xem' ? 'Đang dựng…' : nhanXem}
        </button>
        {hienLink && (
          <button type="button" onClick={() => void layLink()} disabled={!!dang} className="tap-target inline-flex items-center font-bold" style={nut(false)}>
            {dang === 'link' ? <Loader2 size={16} className="animate-spin" /> : daCopy ? <Check size={16} /> : <Link2 size={16} />}
            {dang === 'link' ? 'Đang tạo…' : daCopy ? 'Đã copy link' : 'Copy link'}
          </button>
        )}
      </div>
      {htmlPhieu && <KhungXemPhieu html={htmlPhieu} tenTep={tenTep} dong={() => setHtmlPhieu('')} />}
      {daCopy && (
        <div className="break-all" style={{ ...NHAN_NHO, fontVariantNumeric: 'tabular-nums' }}>
          {daCopy}
        </div>
      )}
    </div>
  )
}

// MỖI BÀI MỘT THẺ (đề §1.C): thẻ MỞ = tên đọc được + dòng phụ + hạn nộp có đếm ngược + đường chặng có ngày + thanh nhóm + hàng hành động; thẻ THU GỌN = một dòng.
// Đổi hạn nộp / Xem bài làm / Chi tiết bài / Thu hồi cất trong nút ⋯ (Thu hồi ở cuối, màu cảnh báo, luôn qua hộp xác nhận ở nơi gọi).
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, MoreHorizontal } from 'lucide-react'
import { chuGiaoLuc, chuHanNop, chuaNopQuaHan, demNguocHan, soEmCanY, type NhomChon, type TheBai } from '../../lib/btvn-da-giao'
import DuongChang from './DuongChang'
import ThanhNhom from './ThanhNhom'
import './btg.css'

export interface HanhDongThe {
  doiHan: () => void
  xemBaiLam: () => void
  chiTiet: () => void
  thuHoi: () => void
}

function MenuBai({ ten, dangSua, hd }: { ten: string; dangSua: boolean; hd: HanhDongThe }) {
  const [mo, setMo] = useState(false)
  const goc = useRef<HTMLDivElement>(null)
  const nut = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!mo) return
    const ngoai = (e: MouseEvent) => { if (goc.current && !goc.current.contains(e.target as Node)) setMo(false) }
    const phim = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMo(false); nut.current?.focus() } }
    document.addEventListener('mousedown', ngoai)
    document.addEventListener('keydown', phim)
    goc.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
    return () => { document.removeEventListener('mousedown', ngoai); document.removeEventListener('keydown', phim) }
  }, [mo])
  const chay = (f: () => void) => () => { setMo(false); f() }
  return (
    <div className="btg-menu" ref={goc}>
      <button ref={nut} type="button" className="btg-nut-tron" aria-label={`Thêm thao tác cho ${ten}`} aria-haspopup="menu" aria-expanded={mo} onClick={() => setMo((v) => !v)}>
        <MoreHorizontal size={20} />
      </button>
      {mo && (
        <div className="btg-menu-ds" role="menu" aria-label="Thao tác với bài">
          <button type="button" role="menuitem" className="btg-menu-muc" disabled={dangSua} onClick={chay(hd.doiHan)}>Đổi hạn nộp</button>
          <button type="button" role="menuitem" className="btg-menu-muc" onClick={chay(hd.xemBaiLam)}>Xem bài làm</button>
          <button type="button" role="menuitem" className="btg-menu-muc" onClick={chay(hd.chiTiet)}>Chi tiết bài</button>
          <div className="btg-menu-ke" role="separator" />
          <button type="button" role="menuitem" className="btg-menu-muc btg-menu-muc--canh-bao" disabled={dangSua} onClick={chay(hd.thuHoi)}>Thu hồi</button>
        </div>
      )}
    </div>
  )
}

export default function TheBaiBtg({
  bai, nowMs, mo, doiMo, dangSua, hd, moNgan, ghiChuThieuNhom = true,
}: {
  bai: TheBai
  nowMs: number
  mo: boolean
  doiMo: () => void
  dangSua: boolean
  hd: HanhDongThe
  /** Mở ngăn danh sách em của bài ở nhóm này. */
  moNgan: (nhom: NhomChon) => void
  /** Bài này thiếu số theo nhóm: có nói thật ở thẻ không (khi CẢ danh sách thiếu, khung nói MỘT lần ở đầu thay vì lặp ở mọi thẻ). */
  ghiChuThieuNhom?: boolean
}) {
  const han = demNguocHan(bai.hanMs, nowMs)
  const canY = soEmCanY(bai.nhom)
  const quaN = chuaNopQuaHan(bai, nowMs) // bài QUÁ HẠN còn em chưa nộp: việc thầy cần thấy kể cả khi bài không chia chặng
  const nhom = bai.nhom
  // Bài quá hạn: MỘT con số "chưa nộp quá hạn" (khớp dải cần để ý — mỗi em chỉ đếm một chỗ); bài còn hạn: chưa mở · chậm nhịp.
  const tomTat = quaN > 0
    ? `${quaN} em chưa nộp quá hạn`
    : [nhom && nhom.chuaMo > 0 ? `${nhom.chuaMo} em chưa mở` : '', nhom && nhom.chamNhip > 0 ? `${nhom.chamNhip} em chậm nhịp` : ''].filter(Boolean).join(' · ')
  const homNay = bai.chang.find((c) => c.laHomNay)
  const chuChang = bai.chiaChang ? (homNay ? `chặng ${homNay.so} trong ${bai.chang.length}` : `${bai.chang.length} chặng`) : ''
  const hanChu = han.qua ? `Đã qua hạn${nhom && nhom.nopTre > 0 ? ` · ${nhom.nopTre} em nộp trễ` : ''}` : han.chu
  const phu = [`${bai.tong} em`, !nhom && bai.tong > 0 ? `đã nộp ${bai.daNop}` : '', bai.soCau > 0 ? `${bai.soCau} câu${bai.soCauLoi !== null && bai.soCauLoi > 0 ? `, ${bai.soCauLoi} câu lõi` : ''}` : '', chuGiaoLuc(bai.giaoLuc)].filter(Boolean).join(' · ')
  const idThan = `btg-the-${bai.khoa}`
  return (
    <article className={`btg-the${mo ? ' btg-the--mo' : ' btg-the--gon'}`} data-khoa={bai.khoa} data-mo={mo ? '1' : '0'}>
      <div className="btg-the-dau">
        <button type="button" className="btg-the-bam" aria-expanded={mo} aria-controls={idThan} onClick={doiMo}>
          <span className="btg-the-mui" aria-hidden="true">{mo ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span>
          <span className="btg-the-ten-khoi">
            <span className="btg-ten">{bai.ten}</span>
            <span className="btg-phu btg-phu--dong">
              {mo
                ? phu
                : [bai.tenLop, chuChang, `hạn nộp ${chuHanNop(bai.hanMs)}`, tomTat].filter(Boolean).join(' · ')}
            </span>
          </span>
        </button>
        {!mo && nhom && <div className="btg-the-nho"><ThanhNhom nhom={nhom} chiaChang={bai.chiaChang} nho /></div>}
        {mo && (
          <div className="btg-han">
            <div className="btg-phu">Hạn nộp {chuHanNop(bai.hanMs)}</div>
            <div className={`btg-han-dem${han.cam ? ' btg-han-dem--cam' : ''}${han.qua ? ' btg-han-dem--qua' : ''}`}>{hanChu}</div>
          </div>
        )}
        <MenuBai ten={bai.ten} dangSua={dangSua} hd={hd} />
      </div>
      {mo && (
        <div id={idThan} className="btg-the-than">
          {bai.chiaChang && <DuongChang chang={bai.chang} nowMs={nowMs} />}
          {nhom ? (
            <ThanhNhom nhom={nhom} chiaChang={bai.chiaChang} onChonNhom={(k) => moNgan(k)} />
          ) : (
            ghiChuThieuNhom && <p className="btg-phu btg-ghi-chu">Chưa có số theo nhóm — bấm “Cập nhật dữ liệu” để tải lại.</p>
          )}
          <div className="btg-hanh-dong">
            <span className="btg-phu btg-hanh-dong-chu">{tomTat || (nhom ? 'Mọi em đang đúng nhịp' : '')}</span>
            {quaN > 0 ? (
              <button type="button" className="btg-nut" onClick={() => moNgan('chua_nop')}>Xem {quaN} em chưa nộp</button>
            ) : nhom ? (
              canY > 0 && <button type="button" className="btg-nut" onClick={() => moNgan('can_y')}>Xem {canY} em này</button>
            ) : (
              <button type="button" className="btg-nut" onClick={hd.xemBaiLam}>Xem bài làm</button>
            )}
          </div>
        </div>
      )}
    </article>
  )
}

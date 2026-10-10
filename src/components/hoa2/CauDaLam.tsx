// GAME HÓA 2.0 — màn "CÂU ĐÃ LÀM" (bản vẽ đã chốt: docs/ban-ve-game-hoa-2-2709/HS-CauDaLam.dc.html, tờ PDF HS-PDF.dc.html).
// Chọn chiến dịch · 5 bộ lọc có đếm · danh sách thẻ. Thẻ đóng (bản vẽ): "Câu 5 · Đúng–sai · Thông hiểu · sai 1/4 ý" + nhãn trạng thái ·
// một dòng đề · "Em chọn: Sai · Đáp án: Đúng" · lịch ôn + "Xem lời giải". Chi tiết lấy qua `hoa2-cau-chi-tiet` cho các câu đang lọc
// (máy chủ chỉ trả câu em ĐÃ làm). Bấm thẻ ⇒ thẻ trắng: đề + lựa chọn + LỜI GIẢI bằng ĐÚNG thành phần chuẩn `TheCau` chế độ `xem_lai`
// (lời giải thô đọc qua `chuanHoaLoiGiaiCau`) — KHÔNG vẽ khối lời giải thứ hai — rồi lịch sử làm câu.
// Nút chính "Tải PDF · N câu đang lọc" (thầy chốt 28/09): lấy chi tiết (≤ 60 câu/lượt) → `dungPdf` (pdf-cau-da-lam.ts, nạp lười) dựng
// TỆP .pdf thật đúng bản vẽ HS-PDF → tải về `cau-da-lam-<bộ-lọc>-<ngày>.pdf`. Máy yếu không dựng được thì còn nút "Mở bản in" (đường cũ).
// Bản NGANG (docs/ban-ve-ngang-2809/Ngang-CauDaLam): cột trái bộ lọc + danh sách gọn, cột phải chi tiết câu đang chọn (cùng khối
// TheCau xem_lai), Tải PDF lên hàng trên. Điểm ngắt: bo-cuc-ngang.ts. Điện thoại dọc giữ nguyên.
import ChuTheLoc, { tenTheLoc } from '../ChuTheLoc'
import { startTransition, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import TheCau from '../TheCau'
import KhungXemPhieu from '../KhungXemPhieu'
import { ChemText } from '../../lib/chem-format'
import '../m3'
import { taiCauDaLam, taiChiTiet, type CauDaLamMuc, type ChiTietCau, type KetQuaCauDaLam } from './api'
import { NHAN_TRANG_THAI, NHAN_TU_LUAN, cauLuyenTuChiTiet, chiSoDuoiRo, chuLanLam, chuLanLamTuLuan, dauCau, ngayGanNhat, propsTheCau, tomTatThe } from './cau-chuyen'
import { gioThuNgay, thuNgayThang } from './thoi-gian'
import { useBoCucNgang } from './bo-cuc-ngang'
import { nhanCauDaLamSom, xoaCauDaLamSom } from './man-sanh-luoi'
import './cau-da-lam.css'

export type BoLoc = 'tat_ca' | 'sai_gan' | 'dang_on' | 'thanh_thao' | 'can_day_lai'
export const BO_LOC: { id: BoLoc; nhan: string; hop: (c: CauDaLamMuc) => boolean }[] = [
  { id: 'tat_ca', nhan: 'Tất cả', hop: () => true },
  // 30/09: câu tự luận chỉ ở "Tất cả" — không sai/đúng, không ôn cách quãng.
  { id: 'sai_gan', nhan: 'Sai lần gần nhất', hop: (c) => !c.tuLuan && c.lanCuoiDung === false },
  { id: 'dang_on', nhan: 'Cần ôn', hop: (c) => !c.tuLuan && c.trangThai === 'dang_on' },
  { id: 'thanh_thao', nhan: 'Thành thạo', hop: (c) => !c.tuLuan && c.trangThai === 'thanh_thao' },
  { id: 'can_day_lai', nhan: 'Cần thầy dạy lại', hop: (c) => !c.tuLuan && c.trangThai === 'can_day_lai' },
]

/** Xếp theo lần làm gần nhất (mới trước), cùng ngày thì theo số câu. */
export function xepCau(ds: CauDaLamMuc[]): CauDaLamMuc[] {
  return [...ds].sort((a, b) => {
    const na = ngayGanNhat(a), nb = ngayGanNhat(b)
    if (na !== nb) return na < nb ? 1 : -1
    return a.stt - b.stt
  })
}

/** Đường DỰ PHÒNG (máy không dựng được tệp PDF): gọi hộp In của CHÍNH phiếu (nút "Đề và lời giải" → `window.print()`) khi phiếu nạp
 * xong. Chèn ở nơi gọi, không sửa html-phieu.ts. */
export function themInTuDong(html: string): string {
  const s = `<script>window.addEventListener('load',function(){setTimeout(function(){var b=document.getElementById('pdf-giai');if(b){b.click()}else{window.print()}},500)})<\/script>`
  return html.includes('</body>') ? html.replace(/<\/body>(?![\s\S]*<\/body>)/, `${s}</body>`) : html + s
}

function dongHenOn(c: CauDaLamMuc): string {
  if (c.tuLuan) return ''
  if (c.trangThai === 'can_day_lai') return 'Thầy chữa câu này trên lớp. Chữa xong, câu quay lại kế hoạch ôn từ hôm sau.'
  if (c.henOn) return `Đến lịch ôn lại: ${thuNgayThang(c.henOn)}`
  if (c.trangThai === 'thanh_thao') return 'Em đã thành thạo câu này.'
  return ''
}

export interface CauDaLamProps {
  token: string
  hoTen: string
  sbd: string
  /** Lớp của em — in trên tờ PDF ("Nguyễn An · Lớp 12A1 · …"). */
  lop?: string
  onVe: () => void
  /** Bản vẽ tối giản 09/10: thẻ "Ca kiểm tra gần nhất: 7,25 điểm · 26/09" (CHỈ ca đã công bố; chưa có ⇒ "Chưa có ca đã công bố") ở đầu màn.
   *  Cùng dữ liệu cổng học sinh từng đưa cho Sảnh. null/thiếu (hoặc thiếu `onLichSuCa`) ⇒ không vẽ. */
  caGanNhat?: { chu: string; coDiem: boolean } | null
  /** Bấm thẻ ⇒ màn Lịch sử ca kiểm tra. */
  onLichSuCa?: () => void
}

/** Thẻ đầu màn: ca kiểm tra đã công bố gần nhất; bấm ⇒ Lịch sử ca kiểm tra (thầy lệnh 28/09; chuyển từ Sảnh về đây 09/10). */
function TheCaGanNhat({ ca, onClick }: { ca: { chu: string; coDiem: boolean }; onClick: () => void }) {
  return (
    <button type="button" className="h2-cdl-ca" data-co-diem={ca.coDiem ? 'true' : 'false'} onClick={onClick}>
      <span className="h2-cdl-ca-o" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
          <path d="M9 4h6v3H9z" />
          <path d="M8 5.5H6.5A1.5 1.5 0 0 0 5 7v12.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V7a1.5 1.5 0 0 0-1.5-1.5H16" />
          <path d="M8.5 13l2.2 2.2L15.5 10.5" />
        </svg>
      </span>
      <span className="h2-cdl-ca-chu">
        <span className="h2-cdl-ca-lon">{ca.chu}</span>
        <span className="h2-cdl-ca-nho">Xem lịch sử ca kiểm tra</span>
      </span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d="M9 6l6 6-6 6" />
      </svg>
    </button>
  )
}

type TrangThaiChiTiet = { dang: true } | { loi: string } | { ct: ChiTietCau }
type TrangThaiPdf = { dang: boolean; chu: string; loi: string; xong: string; duPhong: boolean }
const PDF_TRONG: TrangThaiPdf = { dang: false, chu: '', loi: '', xong: '', duPhong: false }

export default function CauDaLam({ token, hoTen, sbd, lop = '', onVe, caGanNhat = null, onLichSuCa }: CauDaLamProps) {
  const theCa = caGanNhat && onLichSuCa ? <TheCaGanNhat ca={caGanNhat} onClick={onLichSuCa} /> : null
  const [du, setDu] = useState<KetQuaCauDaLam | null>(null)
  const [loi, setLoi] = useState('')
  const [dangTai, setDangTai] = useState(true)
  const [capNhat, setCapNhat] = useState(0)
  const [luot, setLuot] = useState(0)
  const [cdChon, setCdChon] = useState('')
  const [loc, setLoc] = useState<BoLoc>('tat_ca')
  const [mo, setMo] = useState<string | null>(null)
  const [chiTiet, setChiTiet] = useState<Record<string, TrangThaiChiTiet>>({})
  const [pdf, setPdf] = useState<TrangThaiPdf>(PDF_TRONG)
  const [phieu, setPhieu] = useState('')
  const daXin = useRef(new Set<string>())
  const bc = useBoCucNgang()
  const ngang = bc.ngang

  useEffect(() => {
    let huy = false
    setDangTai(true)
    setLoi('')
    // Chuyển màn nhanh (05/10): Sảnh đã bắn lệnh tải danh sách ngay lúc em chạm cửa ⇒ lượt tải đầu nhận lại lời hứa ấy (man-sanh-luoi.ts).
    ;(nhanCauDaLamSom(token) ?? taiCauDaLam(token))
      .then((kq) => {
        if (huy) return
        setDu(kq)
        setCapNhat(Date.now())
      })
      .catch((e: unknown) => {
        if (!huy) setLoi(e instanceof Error ? e.message : 'Chưa tải được danh sách câu.')
      })
      .finally(() => {
        if (!huy) setDangTai(false)
      })
    return () => {
      huy = true
    }
  }, [token, luot])
  useEffect(() => xoaCauDaLamSom, []) // rời màn ⇒ bỏ lệnh sớm chưa ai nhận

  const dsChienDich = du && du.cheDo2 ? du.chienDich : []
  const tatCaCau = du && du.cheDo2 ? du.cau : []
  // Mặc định: chiến dịch mới nhất có câu em đã làm (máy chủ xếp mới trước).
  const cdHienTai = useMemo(() => {
    if (cdChon && dsChienDich.some((c) => c.id === cdChon)) return cdChon
    return (dsChienDich.find((c) => tatCaCau.some((q) => q.chienDichId === c.id)) ?? dsChienDich[0])?.id ?? ''
  }, [cdChon, dsChienDich, tatCaCau])
  const cd = dsChienDich.find((c) => c.id === cdHienTai) ?? null
  const cauCd = useMemo(() => xepCau(tatCaCau.filter((c) => c.chienDichId === cdHienTai)), [tatCaCau, cdHienTai])
  const dem = useMemo(() => Object.fromEntries(BO_LOC.map((b) => [b.id, cauCd.filter(b.hop).length])) as Record<BoLoc, number>, [cauCd])
  const boLoc = BO_LOC.find((b) => b.id === loc)!
  const dsLoc = useMemo(() => cauCd.filter(boLoc.hop), [cauCd, boLoc])

  /** Lấy chi tiết các câu chưa có (một lượt ≤ 60 câu — `taiChiTiet` tự chia). */
  const napChiTiet = useCallback(
    (qids: string[]) => {
      if (qids.length === 0) return
      qids.forEach((q) => daXin.current.add(q))
      setChiTiet((x) => ({ ...x, ...Object.fromEntries(qids.map((q) => [q, { dang: true } as TrangThaiChiTiet])) }))
      taiChiTiet(token, qids)
        .then((ds) => {
          const theo = new Map(ds.map((d) => [d.de.qid, d]))
          // Vẽ dòng đề + đáp án của cả danh sách (KaTeX từng thẻ) là việc NẶNG: đi trong startTransition (05/10) ⇒ React chia nhỏ, máy vẫn
          // cuộn / bấm được trong lúc vẽ; kết quả hiện ra y như cũ.
          startTransition(() => setChiTiet((x) => ({
            ...x,
            ...Object.fromEntries(
              qids.map((q) => {
                const ct = theo.get(q)
                return [q, ct ? { ct } : { loi: 'Máy chủ chưa trả được đề của câu này.' }] as [string, TrangThaiChiTiet]
              }),
            ),
          })))
        })
        .catch((e: unknown) => {
          const loiChu = e instanceof Error ? e.message : 'Chưa tải được lời giải.'
          qids.forEach((q) => daXin.current.delete(q))
          setChiTiet((x) => ({ ...x, ...Object.fromEntries(qids.map((q) => [q, { loi: loiChu } as TrangThaiChiTiet])) }))
        })
    },
    [token],
  )

  // Thẻ đóng cần một dòng đề + đáp án (bản vẽ) ⇒ lấy chi tiết cho các câu ĐANG LỌC chưa có.
  useEffect(() => {
    napChiTiet(dsLoc.map((c) => c.qid).filter((q) => !daXin.current.has(q)))
  }, [dsLoc, napChiTiet])

  const moThe = (qid: string) => {
    if (mo === qid) {
      setMo(null)
      return
    }
    setMo(qid)
    const co = chiTiet[qid]
    if (co && ('ct' in co || 'dang' in co)) return
    napChiTiet([qid])
  }

  /** Chi tiết đủ cho các câu đang lọc (dùng cái đã có, thiếu thì hỏi máy chủ). */
  const layChiTietDs = async (ds: CauDaLamMuc[]): Promise<Map<string, ChiTietCau>> => {
    const co = new Map<string, ChiTietCau>()
    for (const c of ds) {
      const t = chiTiet[c.qid]
      if (t && 'ct' in t) co.set(c.qid, t.ct)
    }
    const thieu = ds.filter((c) => !co.has(c.qid)).map((c) => c.qid)
    if (thieu.length) {
      const ct = await taiChiTiet(token, thieu, (da, tong) => setPdf((x) => ({ ...x, chu: `Đang lấy câu ${da}/${tong}…` })))
      for (const c of ct) co.set(c.de.qid, c)
    }
    return co
  }

  const taiPdf = async (chiDe = false) => {
    if (pdf.dang || dsLoc.length === 0) return
    const ds = dsLoc
    const tenCd = cd?.ten ?? ''
    setPdf({ ...PDF_TRONG, dang: true, chu: `Đang lấy ${ds.length} câu…` })
    let buoc: 'lay' | 'dung' = 'lay'
    try {
      const theoQid = await layChiTietDs(ds)
      const cauIn = ds.flatMap((muc) => {
        const ct = theoQid.get(muc.qid)
        return ct ? [{ muc, ct }] : []
      })
      if (cauIn.length === 0) throw new Error('Máy chủ chưa trả được câu nào để in. Em thử lại sau ít phút.')
      buoc = 'dung'
      setPdf((x) => ({ ...x, chu: 'Đang dựng tệp PDF…' }))
      const { dungPdf, luuTep, tenTepPdf } = await import('./pdf-cau-da-lam')
      const inLuc = Date.now()
      const blob = await dungPdf({ hoTen, lop, sbd, tenChienDich: tenCd, nhanBoLoc: boLoc.nhan, inLuc, chiDe }, cauIn, (t, tong) =>
        setPdf((x) => ({ ...x, chu: `Đang dựng trang ${t}/${tong}…` })),
      )
      const ten = tenTepPdf(boLoc.nhan, inLuc, chiDe)
      luuTep(blob, ten)
      const thieu = ds.length - cauIn.length
      setPdf({ ...PDF_TRONG, xong: `Đã tải tệp ${ten} (${cauIn.length} câu).${thieu > 0 ? ` Có ${thieu} câu máy chủ chưa trả được nên chưa có trong tệp.` : ''}` })
    } catch (e) {
      const chu = e instanceof Error ? e.message : ''
      setPdf({
        ...PDF_TRONG,
        loi: buoc === 'dung' ? `Máy chưa dựng được tệp PDF${chu ? ` (${chu})` : ''}. Em bấm "Mở bản in" để lưu PDF bằng hộp In.` : chu || 'Chưa lấy được câu. Em thử lại.',
        duPhong: buoc === 'dung',
      })
    }
  }

  /** Dự phòng: phiếu HTML chuẩn (`dungPhieu`) + hộp In của phiếu. */
  const moBanIn = async () => {
    if (pdf.dang || dsLoc.length === 0) return
    const ds = dsLoc
    setPdf({ ...PDF_TRONG, dang: true, chu: 'Đang dựng bản in…' })
    try {
      const theoQid = await layChiTietDs(ds)
      const cauIn = ds.flatMap((m) => {
        const c = theoQid.get(m.qid)
        return c ? [cauLuyenTuChiTiet(c, m)] : []
      })
      if (cauIn.length === 0) throw new Error('Máy chủ chưa trả được câu nào để in. Em thử lại sau ít phút.')
      const { dungPhieu } = await import('../../lib/html-phieu')
      const tenCd = cd?.ten ?? 'Câu đã làm'
      const html = dungPhieu(
        {
          hoTen,
          sbd,
          ngay: new Date(),
          tenChuyenDe: tenCd,
          ketQua: `${cauIn.length} câu · ${boLoc.nhan}`,
          hienDapAn: true,
          giaoDienHocSinh: true,
          nhanBia: 'CÂU ĐÃ LÀM',
          oBia: [
            { nhan: 'Học sinh', gia: hoTen || sbd },
            { nhan: 'Chiến dịch', gia: tenCd },
            { nhan: 'Mục', gia: boLoc.nhan },
          ],
        },
        cauIn,
        { moSan: true, loiNhac: `Câu đã làm — ${boLoc.nhan} · ${cauIn.length} câu · In lúc ${gioThuNgay(Date.now())}` },
      )
      setPhieu(themInTuDong(html))
      setPdf(PDF_TRONG)
    } catch (e) {
      setPdf({ ...PDF_TRONG, loi: e instanceof Error ? e.message : 'Chưa dựng được bản in. Em thử lại.', duPhong: true })
    }
  }

  const trangThaiDs = dangTai && !du ? 'dang-tai' : loi && !du ? 'loi' : du && !du.cheDo2 ? 'tat' : cauCd.length === 0 ? 'trong' : 'co'
  // Bản ngang: danh sách trái – chi tiết phải cùng lúc ⇒ luôn có một câu đang chọn (mặc định câu đầu của bộ lọc).
  const chonNgang = ngang ? (mo && dsLoc.some((c) => c.qid === mo) ? mo : (dsLoc[0]?.qid ?? null)) : null

  // ── các mảnh dùng chung bản dọc và bản ngang ──
  const chonCd = dsChienDich.length > 0 && (
    <div className="h2-cdl-chon">
      <span className="h2-cdl-chon-hien" aria-hidden="true">
        <span className="h2-cdl-chon-chu">
          Chiến dịch: <b>{cd?.ten ?? ''}</b>
          {cd ? ` · ${cd.tong} câu` : ''}
        </span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" focusable="false">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </span>
      <select
        aria-label="Chiến dịch"
        value={cdHienTai}
        onChange={(e) => {
          setCdChon(e.target.value)
          setMo(null)
        }}
      >
        {dsChienDich.map((c) => (
          <option key={c.id} value={c.id}>
            {c.ten} · {c.tong} câu
          </option>
        ))}
      </select>
    </div>
  )

  const locVaTom = trangThaiDs === 'co' && (
    <>
      <div className="tl-hang tl-hang--mot-dong h2-cdl-loc" role="group" aria-label="Lọc câu">
        {BO_LOC.map((b) => (
          <button
            key={b.id}
            type="button"
            className="tl-the h2-cdl-chip"
            aria-pressed={loc === b.id}
            aria-label={tenTheLoc(b.nhan, dem[b.id], ' ')}
            onClick={() => {
              setLoc(b.id)
              setMo(null)
              setPdf(PDF_TRONG)
            }}
          >
            <ChuTheLoc chu={b.nhan} so={dem[b.id]} noi=" " />
          </button>
        ))}
      </div>
      <p className="h2-cdl-tom">
        {dsLoc.length} câu · xếp theo lần làm gần nhất{capNhat && !ngang ? ` · cập nhật ${gioThuNgay(capNhat)}` : ''}
      </p>
    </>
  )

  const thongBao = (
    <>
      {trangThaiDs === 'dang-tai' && (
        <div className="h2-cdl-xuong" role="status" aria-label="Đang tải câu đã làm">
          <span />
          <span />
          <span />
        </div>
      )}
      {trangThaiDs === 'loi' && (
        <div className="h2-cdl-thong-bao" role="alert">
          <p>{loi}</p>
          <button type="button" className="h2-cdl-nut-phu" onClick={() => setLuot((n) => n + 1)}>
            Thử lại
          </button>
        </div>
      )}
      {trangThaiDs === 'tat' && (
        <div className="h2-cdl-thong-bao">
          <p>Mục Câu đã làm chưa mở cho em. Khi thầy bật chiến dịch, câu em làm sẽ hiện ở đây.</p>
        </div>
      )}
      {trangThaiDs === 'trong' && (
        <div className="h2-cdl-thong-bao">
          <p>
            {dsChienDich.length === 0
              ? 'Em chưa có bài học được giao. Câu đã làm theo kế hoạch sẽ hiện ở đây.'
              : 'Em chưa làm câu nào của bài học này. Câu đã làm theo kế hoạch sẽ hiện ở đây.'}
          </p>
        </div>
      )}
      {trangThaiDs === 'co' && dsLoc.length === 0 && (
        <div className="h2-cdl-thong-bao">
          <p>Không có câu nào ở mục "{boLoc.nhan}".</p>
          <button type="button" className="h2-cdl-nut-phu" onClick={() => setLoc('tat_ca')}>
            Xem tất cả câu
          </button>
        </div>
      )}
    </>
  )

  const tinPdf = (
    <>
      {pdf.loi && (
        <p className="h2-cdl-loi" role="alert">
          {pdf.loi}
        </p>
      )}
      {pdf.xong && (
        <p className="h2-cdl-xong" role="status">
          {pdf.xong}
        </p>
      )}
    </>
  )
  const nutPdf = (
    <div className="h2-cdl-hang-pdf">
      <button type="button" className="h2-cdl-nut-chinh" disabled={pdf.dang || dsLoc.length === 0} aria-busy={pdf.dang} onClick={() => void taiPdf()}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
        </svg>
        {pdf.dang ? pdf.chu : `Tải PDF · ${dsLoc.length} câu đang lọc`}
      </button>
      {/* Chế độ CHỈ ĐỀ (thầy 28/09): tờ sạch để em in ra làm lại — không đáp án, không lời giải. */}
      {!pdf.dang && (
        <button type="button" className="h2-cdl-nut-phu h2-cdl-chi-de" disabled={dsLoc.length === 0} onClick={() => void taiPdf(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5" />
          </svg>
          Tải chỉ đề · để làm lại
        </button>
      )}
    </div>
  )
  const nutDuPhong = pdf.duPhong && !pdf.dang && (
    <button type="button" className="h2-cdl-nut-phu h2-cdl-du-phong" onClick={() => void moBanIn()}>
      Mở bản in
    </button>
  )

  /** Thông tin một thẻ (đầu thẻ, tóm tắt, lịch ôn). */
  const thongTin = (c: CauDaLamMuc) => {
    const tt = chiTiet[c.qid]
    const ct = tt && 'ct' in tt ? tt.ct : null
    const tom = ct ? tomTatThe(ct) : null
    const cuoi = c.lichSu.length ? c.lichSu.reduce((m, l) => (l.ngay >= m.ngay ? l : m), c.lichSu[0]!) : null
    const hen = dongHenOn(c)
    const idMo = `h2-cdl-mo-${c.qid.replace(/[^a-zA-Z0-9_-]/g, '_')}`
    const dau = `${dauCau(c)}${tom?.phuDau ? ` · ${tom.phuDau}` : ''}`
    const nhanTt = c.tuLuan ? (
      <span className="h2-the-tt" data-tt="tu_luan">
        Tự luận
      </span>
    ) : (
      <span className="h2-the-tt" data-tt={c.trangThai}>
        {NHAN_TRANG_THAI[c.trangThai]}
      </span>
    )
    return { tt, tom, cuoi, hen, idMo, dau, nhanTt }
  }

  /** Thân thẻ đóng: một dòng đề + "Em chọn: … · Đáp án: …" + lịch ôn. */
  const thanDong = (c: CauDaLamMuc, ttin: ReturnType<typeof thongTin>) => {
    const { tom, cuoi, hen } = ttin
    return (
      <>
        {tom ? (
          <span className="h2-the-de">
            <ChemText text={chiSoDuoiRo(tom.de)} />
          </span>
        ) : (
          c.tenDang && <span className="h2-the-de">{c.tenDang}</span>
        )}
        {tom?.tuLuan ? (
          <span className="h2-the-em" data-khoi="tu-luan">
            <b>{NHAN_TU_LUAN}</b>
            {' · '}
            {tom.nhanEm}: <ChemText text={chiSoDuoiRo(tom.em)} />
          </span>
        ) : tom ? (
          <span className="h2-the-em">
            {tom.nhanEm}:{' '}
            <b className={tom.dung ? 'h2-the-dung' : 'h2-the-sai'}>
              <ChemText text={chiSoDuoiRo(tom.em)} />
            </b>
            {tom.dapAn ? (
              <>
                {' · Đáp án: '}
                <b className="h2-the-dung">
                  <ChemText text={chiSoDuoiRo(tom.dapAn)} />
                </b>
              </>
            ) : tom.dung ? (
              ' · Đúng'
            ) : null}
          </span>
        ) : (
          cuoi && <span className="h2-the-em">Lần gần nhất: {chuLanLam(cuoi)}</span>
        )}
        <span className="h2-the-duoi">
          <span>{!c.tuLuan && c.trangThai === 'can_day_lai' ? 'Thầy chữa câu này trên lớp' : hen}</span>
          {!ngang && <span className="h2-the-xem">Xem lời giải</span>}
        </span>
      </>
    )
  }

  /** Thân chi tiết: đề + lựa chọn + LỜI GIẢI bằng `TheCau` xem_lai (khối chuẩn, không vẽ lại) + lịch sử + lịch ôn. */
  const thanMo = (c: CauDaLamMuc, ttin: ReturnType<typeof thongTin>) => {
    const { tt, hen } = ttin
    return (
      <>
        {!tt || 'dang' in tt ? (
          <div className="h2-cdl-xuong nho" role="status" aria-label="Đang tải lời giải">
            <span />
            <span />
          </div>
        ) : 'loi' in tt ? (
          <div className="h2-cdl-thong-bao" role="alert">
            <p>{tt.loi}</p>
            <button type="button" className="h2-cdl-nut-phu" onClick={() => napChiTiet([c.qid])}>
              Thử lại
            </button>
          </div>
        ) : (
          <div className="m3 h2-the-cau">
            {/* Hỏi thầy nằm trong khối lời giải (thầy lệnh 30/09): chỉ hiện khi lời giải đã tải và đang hiện. Máy chủ tự khoá câu đang thi. */}
            <TheCau {...propsTheCau(tt.ct, c.stt)} hoiThay={{ qid: c.qid, nguon: 'cau_da_lam' }} />
          </div>
        )}
        {c.lichSu.length > 0 && (
          <div className="h2-the-ls">
            {c.nhan && <p className="h2-the-hen" data-khoi="nhan-no">{c.nhan}</p>}
            <span className="h2-the-ls-nhan">Lịch sử làm câu này</span>
            <ul className="h2-the-ls-ds">
              {c.lichSu.map((l, i) => (
                <li key={i} className="h2-the-ls-chip" data-dung={c.tuLuan ? 'tu-luan' : l.dung ? 'true' : 'false'}>
                  {c.tuLuan ? chuLanLamTuLuan(l) : chuLanLam(l)}
                </li>
              ))}
            </ul>
          </div>
        )}
        {hen && <p className="h2-the-hen">{hen}</p>}
      </>
    )
  }

  if (ngang) {
    const cauChon = chonNgang ? (dsLoc.find((c) => c.qid === chonNgang) ?? null) : null
    const tinChon = cauChon ? thongTin(cauChon) : null
    return (
      <div className="h2-cdl h2-cdl-ngang" data-bo-cuc="ngang" data-thap={bc.thap ? 'true' : 'false'} data-trang-thai={trangThaiDs} style={bc.thap ? ({ '--h2-ti-le': String(bc.tiLe) } as CSSProperties) : undefined}>
        <header className="h2-cdl-ng-dau">
          <button type="button" className="h2-cdl-ve h2-cdl-ve-chu" aria-label="Về Hôm nay" onClick={onVe}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span aria-hidden="true">Về Hôm nay</span>
          </button>
          <div className="h2-cdl-ng-tieu">
            <h1 className="h2-cdl-tieu">Câu đã làm</h1>
            {capNhat > 0 && <p className="h2-cdl-tom">Cập nhật {gioThuNgay(capNhat)}</p>}
          </div>
          <span className="h2-cdl-ng-dan" aria-hidden="true" />
          {chonCd}
          {trangThaiDs === 'co' && nutPdf}
        </header>
        <div className="h2-cdl-ng-than">
          <aside className="h2-cdl-ng-trai" aria-label="Danh sách câu">
            {theCa}
            {locVaTom}
            {tinPdf}
            {nutDuPhong}
            <div className="h2-cdl-ds">
              {thongBao}
              {trangThaiDs === 'co' &&
                dsLoc.map((c) => {
                  const ttin = thongTin(c)
                  const chon = c.qid === chonNgang
                  return (
                    <article key={c.qid} className="h2-the" data-chon={chon ? 'true' : 'false'} data-trang-thai={c.trangThai}>
                      <button type="button" className="h2-the-nut" aria-pressed={chon} aria-controls="h2-cdl-chi-tiet" onClick={() => setMo(c.qid)}>
                        <span className="h2-the-dau">
                          <span className="h2-the-so">{ttin.dau}</span>
                          {ttin.nhanTt}
                        </span>
                        {thanDong(c, ttin)}
                      </button>
                    </article>
                  )
                })}
            </div>
          </aside>
          <section id="h2-cdl-chi-tiet" className="h2-cdl-ng-phai m3" aria-label="Chi tiết câu" aria-live="polite">
            {cauChon && tinChon ? (
              <>
                <div className="h2-cdl-ng-ct-dau">
                  <h2 className="h2-cdl-ng-ct-tieu">{tinChon.dau}</h2>
                  {tinChon.nhanTt}
                </div>
                {thanMo(cauChon, tinChon)}
              </>
            ) : (
              <p className="h2-cdl-ng-trong">{trangThaiDs === 'co' ? 'Em chọn một câu ở danh sách bên trái để xem đề, đáp án và lời giải.' : ''}</p>
            )}
          </section>
        </div>
        {phieu && <KhungXemPhieu html={phieu} ten="Câu đã làm · bản in" dong={() => setPhieu('')} />}
      </div>
    )
  }

  return (
    <div className="h2-cdl" data-trang-thai={trangThaiDs}>
      <header className="h2-cdl-dau">
        <div className="h2-cdl-hang">
          <button type="button" className="h2-cdl-ve" aria-label="Về Hôm nay" onClick={onVe}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="h2-cdl-tieu">Câu đã làm</h1>
        </div>
        {theCa}
        {chonCd}
        {locVaTom}
      </header>

      <main className="h2-cdl-ds">
        {thongBao}
        {trangThaiDs === 'co' &&
          dsLoc.map((c) => {
            const dangMo = mo === c.qid
            const ttin = thongTin(c)
            return (
              <article key={c.qid} className={dangMo ? 'h2-the m3' : 'h2-the'} data-mo={dangMo ? 'true' : 'false'} data-trang-thai={c.trangThai}>
                <button type="button" className="h2-the-nut" aria-expanded={dangMo} aria-controls={ttin.idMo} onClick={() => moThe(c.qid)}>
                  <span className="h2-the-dau">
                    <span className="h2-the-so">{ttin.dau}</span>
                    {ttin.nhanTt}
                  </span>
                  {!dangMo && thanDong(c, ttin)}
                </button>
                {dangMo && (
                  <div id={ttin.idMo} className="h2-the-mo">
                    {thanMo(c, ttin)}
                    <button type="button" className="h2-the-thu" aria-controls={ttin.idMo} onClick={() => setMo(null)}>
                      Thu gọn
                    </button>
                  </div>
                )}
              </article>
            )
          })}
      </main>

      {trangThaiDs === 'co' && (
        <footer className="h2-cdl-chan">
          {tinPdf}
          {nutPdf}
          {nutDuPhong}
          <span className="h2-cdl-nhac">Tệp PDF tải thẳng về máy: đề đầy đủ, đáp án, lời giải và lịch sử từng câu. Chạy trên điện thoại và máy tính.</span>
        </footer>
      )}

      {phieu && <KhungXemPhieu html={phieu} ten="Câu đã làm · bản in" dong={() => setPhieu('')} />}
    </div>
  )
}

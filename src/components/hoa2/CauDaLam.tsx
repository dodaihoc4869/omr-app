// GAME HÓA 2.0 — màn "CÂU ĐÃ LÀM" (bản vẽ đã chốt: docs/ban-ve-game-hoa-2-2709/HS-CauDaLam.dc.html, bản in HS-PDF.dc.html).
// Chọn chiến dịch · 5 bộ lọc có đếm · danh sách thẻ. Bấm thẻ ⇒ `hoa2-cau-chi-tiet` ⇒ đề + lựa chọn + LỜI GIẢI bằng ĐÚNG thành phần
// chuẩn `TheCau` chế độ `xem_lai` (lời giải thô đọc qua `chuanHoaLoiGiaiCau`) — KHÔNG vẽ khối lời giải thứ hai.
// Nút chính "Tải PDF · N câu đang lọc": lấy chi tiết (≤ 60 câu/lượt) → dựng phiếu bằng `dungPhieu` (html-phieu.ts) → mở trong
// khung phiếu và gọi hộp In của chính phiếu ("Đề và lời giải") → em chọn "Lưu thành PDF".
import { useCallback, useEffect, useMemo, useState } from 'react'
import TheCau from '../TheCau'
import KhungXemPhieu from '../KhungXemPhieu'
import '../m3'
import { taiCauDaLam, taiChiTiet, type CauDaLamMuc, type ChiTietCau, type KetQuaCauDaLam } from './api'
import { NHAN_TRANG_THAI, cauLuyenTuChiTiet, chuLanLam, dauCau, ngayGanNhat, propsTheCau } from './cau-chuyen'
import { gioThuNgay, thuNgayThang } from './thoi-gian'
import './cau-da-lam.css'

export type BoLoc = 'tat_ca' | 'sai_gan' | 'dang_on' | 'thanh_thao' | 'can_day_lai'
export const BO_LOC: { id: BoLoc; nhan: string; hop: (c: CauDaLamMuc) => boolean }[] = [
  { id: 'tat_ca', nhan: 'Tất cả', hop: () => true },
  { id: 'sai_gan', nhan: 'Sai lần gần nhất', hop: (c) => c.lanCuoiDung === false },
  { id: 'dang_on', nhan: 'Đang ôn', hop: (c) => c.trangThai === 'dang_on' },
  { id: 'thanh_thao', nhan: 'Thành thạo', hop: (c) => c.trangThai === 'thanh_thao' },
  { id: 'can_day_lai', nhan: 'Cần thầy dạy lại', hop: (c) => c.trangThai === 'can_day_lai' },
]

/** Xếp theo lần làm gần nhất (mới trước), cùng ngày thì theo số câu. */
export function xepCau(ds: CauDaLamMuc[]): CauDaLamMuc[] {
  return [...ds].sort((a, b) => {
    const na = ngayGanNhat(a), nb = ngayGanNhat(b)
    if (na !== nb) return na < nb ? 1 : -1
    return a.stt - b.stt
  })
}

/** Gọi hộp In của CHÍNH phiếu (nút "Đề và lời giải" → `luuPdf(true)` → `window.print()`) ngay khi phiếu nạp xong. Máy chặn in tự động
 * thì phiếu vẫn mở, em bấm "Tải PDF" trên phiếu. Chèn ở nơi gọi, không sửa html-phieu.ts. */
export function themInTuDong(html: string): string {
  const s = `<script>window.addEventListener('load',function(){setTimeout(function(){var b=document.getElementById('pdf-giai');if(b){b.click()}else{window.print()}},500)})<\/script>`
  return html.includes('</body>') ? html.replace(/<\/body>(?![\s\S]*<\/body>)/, `${s}</body>`) : html + s
}

function dongHenOn(c: CauDaLamMuc): string {
  if (c.trangThai === 'can_day_lai') return 'Thầy chữa câu này trên lớp. Chữa xong, câu quay lại Đoàn Hộ Tống từ hôm sau.'
  if (c.henOn) return `Đến lịch ôn lại: ${thuNgayThang(c.henOn)}`
  if (c.trangThai === 'thanh_thao') return 'Em đã thành thạo câu này.'
  return ''
}

export interface CauDaLamProps {
  token: string
  hoTen: string
  sbd: string
  onVe: () => void
}

type TrangThaiChiTiet = { dang: true } | { loi: string } | { ct: ChiTietCau }

export default function CauDaLam({ token, hoTen, sbd, onVe }: CauDaLamProps) {
  const [du, setDu] = useState<KetQuaCauDaLam | null>(null)
  const [loi, setLoi] = useState('')
  const [dangTai, setDangTai] = useState(true)
  const [capNhat, setCapNhat] = useState(0)
  const [luot, setLuot] = useState(0)
  const [cdChon, setCdChon] = useState('')
  const [loc, setLoc] = useState<BoLoc>('tat_ca')
  const [mo, setMo] = useState<string | null>(null)
  const [chiTiet, setChiTiet] = useState<Record<string, TrangThaiChiTiet>>({})
  const [pdf, setPdf] = useState<{ dang: boolean; chu: string; loi: string }>({ dang: false, chu: '', loi: '' })
  const [phieu, setPhieu] = useState('')

  useEffect(() => {
    let huy = false
    setDangTai(true)
    setLoi('')
    taiCauDaLam(token)
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

  const napChiTiet = useCallback(
    (qid: string) => {
      setChiTiet((x) => ({ ...x, [qid]: { dang: true } }))
      taiChiTiet(token, [qid])
        .then((ds) => {
          const ct = ds.find((d) => d.de.qid === qid)
          setChiTiet((x) => ({ ...x, [qid]: ct ? { ct } : { loi: 'Máy chủ chưa trả được đề của câu này.' } }))
        })
        .catch((e: unknown) => setChiTiet((x) => ({ ...x, [qid]: { loi: e instanceof Error ? e.message : 'Chưa tải được lời giải.' } })))
    },
    [token],
  )
  const moThe = (qid: string) => {
    if (mo === qid) {
      setMo(null)
      return
    }
    setMo(qid)
    const co = chiTiet[qid]
    if (co && ('ct' in co || 'dang' in co)) return
    napChiTiet(qid)
  }

  const taiPdf = async () => {
    if (pdf.dang || dsLoc.length === 0) return
    const ds = dsLoc
    setPdf({ dang: true, chu: `Đang lấy ${ds.length} câu…`, loi: '' })
    try {
      const ct = await taiChiTiet(
        token,
        ds.map((c) => c.qid),
        (da, tong) => setPdf((x) => ({ ...x, chu: `Đang lấy câu ${da}/${tong}…` })),
      )
      const theoQid = new Map(ct.map((c) => [c.de.qid, c]))
      const cauIn = ds.flatMap((m) => {
        const c = theoQid.get(m.qid)
        return c ? [cauLuyenTuChiTiet(c, m)] : []
      })
      if (cauIn.length === 0) throw new Error('Máy chủ chưa trả được câu nào để in. Em thử lại sau ít phút.')
      setPdf((x) => ({ ...x, chu: 'Đang dựng bản in…' }))
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
      setPdf({ dang: false, chu: '', loi: cauIn.length < ds.length ? `Có ${ds.length - cauIn.length} câu máy chủ chưa trả được, bản in có ${cauIn.length} câu.` : '' })
    } catch (e) {
      setPdf({ dang: false, chu: '', loi: e instanceof Error ? e.message : 'Chưa dựng được bản in. Em thử lại.' })
    }
  }

  const trangThaiDs = dangTai && !du ? 'dang-tai' : loi && !du ? 'loi' : du && !du.cheDo2 ? 'tat' : cauCd.length === 0 ? 'trong' : 'co'

  return (
    <div className="h2-cdl" data-trang-thai={trangThaiDs}>
      <header className="h2-cdl-dau">
        <div className="h2-cdl-hang">
          <button type="button" className="h2-cdl-ve" aria-label="Về Sảnh" onClick={onVe}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="h2-cdl-tieu">Câu đã làm</h1>
        </div>
        {dsChienDich.length > 0 && (
          <label className="h2-cdl-chon">
            <span className="h2-cdl-chon-nhan">Chiến dịch</span>
            <select
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
          </label>
        )}
        {trangThaiDs === 'co' && (
          <>
            <div className="h2-cdl-loc" role="group" aria-label="Lọc câu">
              {BO_LOC.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className="h2-cdl-chip"
                  aria-pressed={loc === b.id}
                  onClick={() => {
                    setLoc(b.id)
                    setMo(null)
                  }}
                >
                  {b.nhan} <span className="h2-cdl-dem">{dem[b.id]}</span>
                </button>
              ))}
            </div>
            <p className="h2-cdl-tom">
              {dsLoc.length} câu · xếp theo lần làm gần nhất{capNhat ? ` · cập nhật ${gioThuNgay(capNhat)}` : ''}
            </p>
          </>
        )}
      </header>

      <main className="h2-cdl-ds">
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
                ? 'Em chưa có chiến dịch nào. Khi thầy giao chiến dịch, câu em làm ở Đoàn Hộ Tống và Bát Linh Đảo sẽ hiện ở đây.'
                : 'Em chưa làm câu nào của chiến dịch này. Câu em làm ở Đoàn Hộ Tống và Bát Linh Đảo sẽ hiện ở đây.'}
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
        {trangThaiDs === 'co' &&
          dsLoc.map((c) => {
            const dangMo = mo === c.qid
            const tt = chiTiet[c.qid]
            const cuoi = c.lichSu.length ? c.lichSu.reduce((m, l) => (l.ngay >= m.ngay ? l : m), c.lichSu[0]!) : null
            const hen = dongHenOn(c)
            const idMo = `h2-cdl-mo-${c.qid.replace(/[^a-zA-Z0-9_-]/g, '_')}`
            return (
              <article key={c.qid} className="h2-the" data-mo={dangMo ? 'true' : 'false'} data-trang-thai={c.trangThai}>
                <button type="button" className="h2-the-nut" aria-expanded={dangMo} aria-controls={idMo} onClick={() => moThe(c.qid)}>
                  <span className="h2-the-dau">
                    <span className="h2-the-so">{dauCau(c)}</span>
                    <span className="h2-the-tt" data-tt={c.trangThai}>
                      {NHAN_TRANG_THAI[c.trangThai]}
                    </span>
                  </span>
                  {c.tenDang && <span className="h2-the-dang">{c.tenDang}</span>}
                  {cuoi && <span className="h2-the-cuoi">Lần gần nhất: {chuLanLam(cuoi)}</span>}
                  <span className="h2-the-duoi">
                    <span>{hen}</span>
                    <span className="h2-the-xem">{dangMo ? 'Thu gọn' : 'Xem lời giải'}</span>
                  </span>
                </button>
                {dangMo && (
                  <div id={idMo} className="h2-the-mo">
                    {!tt || 'dang' in tt ? (
                      <div className="h2-cdl-xuong nho" role="status" aria-label="Đang tải lời giải">
                        <span />
                        <span />
                      </div>
                    ) : 'loi' in tt ? (
                      <div className="h2-cdl-thong-bao" role="alert">
                        <p>{tt.loi}</p>
                        <button
                          type="button"
                          className="h2-cdl-nut-phu"
                          onClick={() => napChiTiet(c.qid)}
                        >
                          Thử lại
                        </button>
                      </div>
                    ) : (
                      <div className="m3 h2-the-cau">
                        <TheCau {...propsTheCau(tt.ct, c.stt)} />
                      </div>
                    )}
                    {c.lichSu.length > 0 && (
                      <div className="h2-the-ls">
                        <span className="h2-the-ls-nhan">Lịch sử làm câu này</span>
                        <ul className="h2-the-ls-ds">
                          {c.lichSu.map((l, i) => (
                            <li key={i} className="h2-the-ls-chip" data-dung={l.dung ? 'true' : 'false'}>
                              {chuLanLam(l)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </article>
            )
          })}
      </main>

      {trangThaiDs === 'co' && (
        <footer className="h2-cdl-chan">
          {pdf.loi && (
            <p className="h2-cdl-loi" role="alert">
              {pdf.loi}
            </p>
          )}
          <button type="button" className="h2-cdl-nut-chinh" disabled={pdf.dang || dsLoc.length === 0} aria-busy={pdf.dang} onClick={() => void taiPdf()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
              <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
            </svg>
            {pdf.dang ? pdf.chu : `Tải PDF · ${dsLoc.length} câu đang lọc`}
          </button>
          <span className="h2-cdl-nhac">Máy mở hộp In → chọn "Lưu thành PDF". Chạy trên điện thoại và máy tính.</span>
        </footer>
      )}

      {phieu && <KhungXemPhieu html={phieu} ten="Câu đã làm · bản in" dong={() => setPhieu('')} />}
    </div>
  )
}

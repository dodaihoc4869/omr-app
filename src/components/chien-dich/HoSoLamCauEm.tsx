// TẤM "LỊCH SỬ LÀM CÂU" CỦA MỘT EM (Hành trình › Nhịp học › bấm một dòng — thầy 09/10 khuya: "bấm vào từng học sinh hiển thị rõ toàn bộ lịch sử,
// câu làm sai số giây làm mỗi câu, mọi thứ về học sinh đó").
//   · Tấm bên phải trên máy tính (rộng ≤ 600 px, nền che phía sau), TOÀN MÀN trên điện thoại. Esc / nút Đóng / bấm nền che ⇒ đóng; Tab giữ
//     trong tấm; đóng xong focus về đúng dòng đã bấm (thẻ Nhịp học lo).
//   · Số từ lệnh CHỈ ĐỌC `/gv/lich-su-lam-cau` (`src/lib/lich-su-lam-cau-api.ts`, hợp đồng `server/src/lich-su-lam-cau-kieu.ts`) — không bịa số:
//     bốn ô có nhãn (số lượt · tỉ lệ đúng · câu từng sai · trung bình mỗi câu); thẻ con "Câu sai" (sai N lần · đúng M lần, số giây từng lần sai,
//     Đã sửa được / Chưa sửa được) và "Toàn bộ lịch sử" (gom theo ngày, mỗi lần: giờ · nơi · câu · Đúng/Sai/Bỏ trống · đáp án chọn · số giây;
//     giây ƯỚC TÍNH ghi "≈", không đo được ghi "chưa đo giờ"; lọc "Chỉ lần sai"; hiện 100 lần đầu + "Xem thêm").
//   · Số "hôm nay" (đã làm / mức tối thiểu, tầng) lấy từ dòng bảng Nhịp học — tấm không gọi lại bảng.
//   · "Mở hồ sơ đầy đủ" ⇒ màn Học sinh mở hồ sơ em (ca kiểm tra, EXP, thần thú, phụ huynh…) — `moHoSoEm`.
// Mảnh riêng nạp LƯỜI (ngoài precache, vite.config.ts). Lỗi mạng ⇒ câu dễ hiểu + Thử lại (`lyDoDeHieu`).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, ExternalLink, RotateCcw, X } from 'lucide-react'
import { gioPhutVN, ngayThuChu, ngayVN } from '../../lib/em-toan-canh'
import { lyDoDeHieu } from '../../lib/loi-de-hieu'
import { layLichSuLamCau, TRAN_GIOI_HAN, type CauEmSai, type KetQuaLichSuLamCau, type LanLamCau, type NguonGiay } from '../../lib/lich-su-lam-cau-api'
import { useAppStore } from '../../store/appStore'
import { chuCaiTen, chuHomNay, coMucNhip, TEN_NHOM_NHIP, tenKhoi, tenTang, type DongNhip, type LoaiNhomNhip } from './nhip-hanh-trinh'

/** Số lần hiện mỗi đợt ở "Toàn bộ lịch sử" (danh sách dài — chuẩn B16). */
export const MOI_DOT = 100

// ------------------------------------------------------------------ PHÉP THUẦN (test gọi thẳng)

/** Mức độ câu theo chữ chương trình (bảng từ chuẩn A2: Nhận biết · Thông hiểu · Vận dụng). Không rõ ⇒ ''. */
export function tenMucDo(m: string): string {
  const k = m.trim().toLowerCase()
  if (k === 'biet' || k === 'nb') return 'Nhận biết'
  if (k === 'hieu' || k === 'th') return 'Thông hiểu'
  if (k === 'vd' || k === 'van_dung') return 'Vận dụng'
  if (k === 'vdc' || k === 'van_dung_cao') return 'Vận dụng cao'
  return ''
}

/** "45 giây" · "1 phút 5 giây" · "2 phút". */
export function doiGiay(giay: number): string {
  const s = Math.max(1, Math.round(giay))
  if (s < 60) return `${s} giây`
  const p = Math.floor(s / 60)
  const du = s % 60
  return du ? `${p} phút ${du} giây` : `${p} phút`
}

/** Chữ số giây một lần làm: đo thật ⇒ "45 giây"; ƯỚC TÍNH ⇒ "≈ 45 giây"; không đo được ⇒ "chưa đo giờ". `nguon` 'khong-ro' = có số nhưng không
 *  biết nguồn (câu sai không khớp được với lần nào trong danh sách) ⇒ ghi số trơn. */
export function chuGiay(giay: number | null, nguon: NguonGiay | 'khong-ro'): string {
  if (giay === null || nguon === null) return 'chưa đo giờ'
  return nguon === 'uoc' ? `≈ ${doiGiay(giay)}` : doiGiay(giay)
}

export const tieuDeCau = (c: Pick<LanLamCau, 'tieuDe' | 'qid'>): string => c.tieuDe.trim() || `Câu ${c.qid}`
export const chuKetQua = (dung: boolean | null): string => (dung === true ? 'Đúng' : dung === false ? 'Sai' : 'Bỏ trống')

/** Gom các lần theo ngày lịch Việt Nam, GIỮ thứ tự máy chủ (mới trước). */
export function gomTheoNgay(lan: readonly LanLamCau[]): { ngay: string; lan: LanLamCau[] }[] {
  const ra: { ngay: string; lan: LanLamCau[] }[] = []
  for (const l of lan) {
    const ngay = l.ngay || ngayVN(l.luc)
    const cuoi = ra[ra.length - 1]
    if (cuoi && cuoi.ngay === ngay) cuoi.lan.push(l)
    else ra.push({ ngay, lan: [l] })
  }
  return ra
}

/** Số giây các lần SAI của một câu kèm nguồn đo: lấy từ các lần sai của câu ấy trong `lan` (cũ → mới) khi khớp đúng số lần với `giaySai`;
 *  không khớp (lần cũ nằm ngoài `lan` được trả) ⇒ số trơn từ `giaySai`, nguồn 'khong-ro' (không ghi "≈" khi không chắc). */
export function giayCacLanSai(c: Pick<CauEmSai, 'qid' | 'giaySai'>, lan: readonly LanLamCau[]): { giay: number | null; nguon: NguonGiay | 'khong-ro' }[] {
  const sai = lan.filter((l) => l.qid === c.qid && l.dung === false).sort((a, b) => a.luc.localeCompare(b.luc))
  if (sai.length === c.giaySai.length)
    return sai.map((l, i) => {
      const giay = c.giaySai[i] ?? l.giay
      return { giay, nguon: giay === null ? null : (l.nguonGiay ?? 'khong-ro') }
    })
  return c.giaySai.map((g) => ({ giay: g, nguon: g === null ? null : 'khong-ro' }))
}

const ngayGio = (iso: string) => {
  const ngay = ngayThuChu(ngayVN(iso))
  const gio = gioPhutVN(iso)
  return gio && ngay ? `${gio} · ${ngay}` : ''
}

// ------------------------------------------------------------------ GIAO DIỆN

const CHON_FOCUS = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

function XuongTam() {
  return (
    <div className="gvv2-hs-xuong" role="status" aria-label="Đang tải lịch sử làm câu">
      <div className="gvv2-hs-so">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="gvv2-cc-xuong-khoi tt-xuong" style={{ height: 76, borderRadius: 16 }} />
        ))}
      </div>
      {[0, 1, 2].map((i) => (
        <span key={i} className="gvv2-cc-xuong-khoi tt-xuong" style={{ width: '100%', height: 64, borderRadius: 12 }} />
      ))}
    </div>
  )
}

function OSo({ nhan, so, phu }: { nhan: string; so: string; phu: string }) {
  return (
    <div className="gvv2-hs-o">
      <dt>{nhan}</dt>
      <dd>
        <b className="gvv2-so">{so}</b>
        <small className="gvv2-so">{phu}</small>
      </dd>
    </div>
  )
}

function DsCauSai({ cauSai, lan }: { cauSai: readonly CauEmSai[]; lan: readonly LanLamCau[] }) {
  if (cauSai.length === 0) return <p className="gvv2-trong">Em chưa sai câu nào trong các lượt đã ghi.</p>
  return (
    <ul className="gvv2-hs-cau-ds">
      {cauSai.map((c) => {
        const giay = giayCacLanSai(c, lan)
        const muc = tenMucDo(c.mucDo)
        const lanCuoi = ngayGio(c.lanCuoi)
        return (
          <li key={c.qid} className="gvv2-hs-cau" data-sua={c.lanCuoiDung ? 'true' : 'false'}>
            <div className="gvv2-hs-cau-dau">
              <b>{tieuDeCau(c)}</b>
              <span className="gvv2-hs-nhan" data-sua={c.lanCuoiDung ? 'true' : 'false'}>
                {c.lanCuoiDung ? <Check size={14} aria-hidden="true" /> : <RotateCcw size={14} aria-hidden="true" />}
                {c.lanCuoiDung ? 'Đã sửa được' : 'Chưa sửa được'}
              </span>
            </div>
            <p className="gvv2-hs-cau-phu gvv2-so">
              {muc ? `${muc} · ` : ''}sai {c.soSai} lần · đúng {c.soDung} lần{lanCuoi ? ` · lần cuối ${lanCuoi}` : ''}
            </p>
            {giay.length > 0 && (
              <p className="gvv2-hs-cau-giay gvv2-so">
                <span>Số giây các lần sai:</span> {giay.map((g) => chuGiay(g.giay, g.nguon)).join(' · ')}
              </p>
            )}
          </li>
        )
      })}
    </ul>
  )
}

function LichSu({ kq, onTaiThem, dangTai }: { kq: KetQuaLichSuLamCau; onTaiThem: () => void; dangTai: boolean }) {
  const [chiSai, setChiSai] = useState(false)
  const [soHien, setSoHien] = useState(MOI_DOT)
  const loc = useMemo(() => (chiSai ? kq.lan.filter((l) => l.dung === false) : kq.lan), [kq.lan, chiSai])
  const ngay = useMemo(() => gomTheoNgay(loc.slice(0, soHien)), [loc, soHien])
  const con = loc.length - Math.min(soHien, loc.length)
  return (
    <div className="gvv2-hs-ls">
      <div className="gvv2-hs-ls-dau">
        <p className="gvv2-so" aria-live="polite">
          Đang hiện <b>{Math.min(soHien, loc.length)}</b>/{loc.length} {chiSai ? 'lần sai' : 'lượt'}
          {kq.conNua ? ` · ${kq.lan.length} lượt gần nhất` : ''}
        </p>
        <button
          type="button"
          className="gvv2-nut-vien tt-nhan gvv2-hs-loc"
          aria-pressed={chiSai}
          onClick={() => {
            setChiSai((x) => !x)
            setSoHien(MOI_DOT)
          }}
        >
          {chiSai ? <Check size={16} aria-hidden="true" /> : null}
          Chỉ lần sai
        </button>
      </div>
      {loc.length === 0 ? (
        <p className="gvv2-trong">{chiSai ? 'Em chưa có lần sai nào trong các lượt đã tải.' : 'Chưa có lượt nào.'}</p>
      ) : (
        ngay.map((n) => (
          <section key={n.ngay} className="gvv2-hs-ngay" aria-label={ngayThuChu(n.ngay) || n.ngay}>
            <h4 className="gvv2-hs-ngay-tieu">
              {ngayThuChu(n.ngay) || n.ngay}
              <span className="gvv2-so"> · {n.lan.length} lượt</span>
            </h4>
            <ol className="gvv2-hs-lan-ds">
              {n.lan.map((l, i) => {
                const muc = tenMucDo(l.mucDo)
                const phu = [l.noi, muc, l.chon ? `Chọn ${l.chon}` : '', chuGiay(l.giay, l.nguonGiay), l.coGoiY ? 'có dùng gợi ý' : ''].filter(Boolean).join(' · ')
                const k = l.dung === true ? 'dung' : l.dung === false ? 'sai' : 'trong'
                return (
                  <li key={`${l.luc}-${l.qid}-${i}`} className="gvv2-hs-lan" data-kq={k}>
                    <time className="gvv2-so" dateTime={l.luc}>
                      {gioPhutVN(l.luc)}
                    </time>
                    <span className="gvv2-hs-lan-chu">
                      <b>{tieuDeCau(l)}</b>
                      <small className="gvv2-so">{phu}</small>
                    </span>
                    <span className="gvv2-hs-kq" data-kq={k}>
                      {chuKetQua(l.dung)}
                    </span>
                  </li>
                )
              })}
            </ol>
          </section>
        ))
      )}
      {con > 0 && (
        <button type="button" className="gvv2-nut-vien tt-nhan gvv2-hs-them" onClick={() => setSoHien((s) => s + MOI_DOT)}>
          Xem thêm {Math.min(MOI_DOT, con)} {chiSai ? 'lần sai' : 'lượt'} (còn {con})
        </button>
      )}
      {con === 0 && kq.conNua && kq.lan.length < TRAN_GIOI_HAN && (
        <button type="button" className="gvv2-nut-vien tt-nhan gvv2-hs-them" onClick={onTaiThem} disabled={dangTai} aria-busy={dangTai}>
          {dangTai ? 'Đang tải…' : 'Tải thêm lượt cũ hơn'}
        </button>
      )}
      {con === 0 && kq.conNua && kq.lan.length >= TRAN_GIOI_HAN && <p className="gvv2-hs-ghi">Máy chủ gửi tối đa {TRAN_GIOI_HAN} lượt gần nhất; lượt cũ hơn không hiện ở đây.</p>}
    </div>
  )
}

export default function HoSoLamCauEm({ em, nhom, onDong }: { em: DongNhip; nhom: LoaiNhomNhip; onDong: () => void }) {
  const [kq, setKq] = useState<KetQuaLichSuLamCau | null>(null)
  const [loi, setLoi] = useState('')
  const [dangTai, setDangTai] = useState(true)
  const [the, setThe] = useState<'cau-sai' | 'lich-su'>('cau-sai')
  const tam = useRef<HTMLElement>(null)
  const nutDong = useRef<HTMLButtonElement>(null)
  const moHoSoEm = useAppStore((s) => s.moHoSoEm)

  const lan = useRef(0)
  const tai = useCallback(
    async (gioiHan?: number) => {
      const l = ++lan.current
      setDangTai(true)
      setLoi('')
      let r: Awaited<ReturnType<typeof layLichSuLamCau>>
      try {
        r = await layLichSuLamCau(em.sbd, gioiHan)
      } catch (e) {
        r = { ok: false, loai: 'mang', chu: lyDoDeHieu(e) }
      }
      if (l !== lan.current) return
      if (r.ok) setKq(r.du)
      else setLoi(r.loai === 'chua_co_lenh' ? r.chu : lyDoDeHieu(r.chu))
      setDangTai(false)
    },
    [em.sbd],
  )
  useEffect(() => {
    void tai()
    return () => {
      lan.current++
    }
  }, [tai])

  // Mở tấm ⇒ focus vào nút Đóng (đầu tấm); Esc đóng; Tab / Shift+Tab vòng trong tấm.
  useEffect(() => {
    nutDong.current?.focus()
  }, [])
  useEffect(() => {
    const phim = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        ev.preventDefault()
        onDong()
        return
      }
      if (ev.key !== 'Tab' || !tam.current) return
      const ds = [...tam.current.querySelectorAll<HTMLElement>(CHON_FOCUS)]
      if (ds.length === 0) return
      const dau = ds[0]!
      const cuoi = ds[ds.length - 1]!
      const dang = document.activeElement
      if (ev.shiftKey && (dang === dau || !tam.current.contains(dang))) {
        ev.preventDefault()
        cuoi.focus()
      } else if (!ev.shiftKey && (dang === cuoi || !tam.current.contains(dang))) {
        ev.preventDefault()
        dau.focus()
      }
    }
    document.addEventListener('keydown', phim)
    return () => document.removeEventListener('keydown', phim)
  }, [onDong])

  const ten = kq?.em.hoTen || em.ten || em.sbd
  const lop = kq?.em.lop ? `Lớp ${kq.em.lop}` : tenKhoi(em.khoi)
  const t = kq?.tong
  const chuaSua = kq ? kq.cauSai.filter((c) => !c.lanCuoiDung).length : 0
  const tiLe = t && t.soLuot > 0 ? `${Math.round((100 * t.soDung) / t.soLuot)}%` : '—'

  return (
    <>
      <div className="gvv2-hs-che" aria-hidden="true" onClick={onDong} />
      <section ref={tam} className="gvv2-hs" role="dialog" aria-modal="true" aria-labelledby="gvv2-hs-ten" aria-describedby="gvv2-hs-phu">
        <header className="gvv2-hs-dau">
          <span className="gvv2-avatar" aria-hidden="true">
            {chuCaiTen(ten)}
          </span>
          <div className="gvv2-hs-dau-chu">
            <small className="gvv2-hs-mat">Lịch sử làm câu</small>
            <h2 id="gvv2-hs-ten" className="gvv2-h2">
              {ten}
            </h2>
            <p id="gvv2-hs-phu" className="gvv2-so">
              SBD {em.sbd} · {lop}
            </p>
          </div>
          <button ref={nutDong} type="button" className="gvv2-nut-chu tt-nhan gvv2-hs-dong" onClick={onDong}>
            <X size={18} aria-hidden="true" />
            Đóng
          </button>
        </header>

        <div className="gvv2-hs-than">
          <div className="gvv2-hs-hn" data-nhom={nhom}>
            <span className="gvv2-hs-hn-chu">
              <small>Hôm nay</small>
              <b className="gvv2-so">{chuHomNay(em)}</b>
            </span>
            <span className="gvv2-hs-hn-chu">
              <small>Tầng hiện tại</small>
              <b>{tenTang(em.tang)}</b>
            </span>
            <span className="gvv2-hs-nhom" data-nhom={nhom}>
              {TEN_NHOM_NHIP[nhom]}
            </span>
            {coMucNhip(em) && nhom !== 'du' && (
              <small className="gvv2-hs-hn-phu gvv2-so">Còn {Math.max(0, (em.toiThieu ?? 0) - em.daLam)} câu tới mức tối thiểu</small>
            )}
            {em.conThieu > 0 && <small className="gvv2-hs-hn-phu gvv2-so">Kho thiếu {em.conThieu} câu phù hợp cho em hôm nay</small>}
          </div>
          {!!em.canBoSung?.length && (
            <div className="gvv2-hs-bo-sung">
              <b>Kiến thức cần bổ sung</b>
              <ul>
                {em.canBoSung.map((c, i) => (
                  <li key={i}>
                    {c.ten} · {c.lyDo === 'can_sua_nen' ? 'Cần câu củng cố nền' : 'Cần thêm câu đã duyệt'}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {kq === null && dangTai ? (
            <XuongTam />
          ) : kq === null ? (
            <div className="gvv2-loi gvv2-cc-loi" role="alert">
              <p>Chưa tải được lịch sử làm câu của em. {loi}</p>
              <button type="button" className="gvv2-nut-vien tt-nhan" onClick={() => void tai()} disabled={dangTai}>
                Thử lại
              </button>
            </div>
          ) : (
            <>
              {loi && (
                <div className="gvv2-loi gvv2-cc-loi" role="alert">
                  <p>Chưa tải thêm được lượt cũ hơn. {loi}</p>
                  <button type="button" className="gvv2-nut-vien tt-nhan" onClick={() => void tai(TRAN_GIOI_HAN)} disabled={dangTai}>
                    Thử lại
                  </button>
                </div>
              )}
              <dl className="gvv2-hs-so">
                <OSo nhan="Số lượt làm câu" so={String(t!.soLuot)} phu={`${t!.soCau} câu khác nhau`} />
                <OSo nhan="Tỉ lệ đúng" so={tiLe} phu={`${t!.soDung} đúng · ${t!.soSai} sai · ${t!.soBoTrong} bỏ trống`} />
                <OSo nhan="Câu từng sai" so={String(t!.soCauSai)} phu={`${chuaSua} câu chưa sửa được`} />
                <OSo nhan="Trung bình mỗi câu" so={t!.giayTb !== null && t!.giayTb > 0 ? doiGiay(t!.giayTb) : 'Chưa đo'} phu="lượt đo được, gồm ước tính" />
              </dl>
              {kq.catBot && <p className="gvv2-hs-ghi">Số liệu tính trên 5000 lượt gần nhất của em.</p>}

              {t!.soLuot === 0 ? (
                <p className="gvv2-trong">Sổ chưa ghi lượt làm câu nào của em. Khi em làm ca kiểm tra, Bát Linh Đảo, Đoàn Hộ Tống hay Ôn lại, lượt sẽ hiện ở đây.</p>
              ) : (
                <>
                  <div className="gvv2-con" role="tablist" aria-label="Lịch sử làm câu">
                    <button type="button" role="tab" id="gvv2-hs-the-cau-sai" aria-controls="gvv2-hs-o-cau-sai" aria-selected={the === 'cau-sai'} className="gvv2-con-nut tt-nhan" onClick={() => setThe('cau-sai')}>
                      Câu sai <span className="gvv2-so">· {kq.cauSai.length}</span>
                    </button>
                    <button type="button" role="tab" id="gvv2-hs-the-lich-su" aria-controls="gvv2-hs-o-lich-su" aria-selected={the === 'lich-su'} className="gvv2-con-nut tt-nhan" onClick={() => setThe('lich-su')}>
                      Toàn bộ lịch sử <span className="gvv2-so">· {t!.soLuot}</span>
                    </button>
                  </div>
                  <div role="tabpanel" id={`gvv2-hs-o-${the}`} aria-labelledby={`gvv2-hs-the-${the}`} className="gvv2-hs-o-the">
                    {the === 'cau-sai' ? <DsCauSai cauSai={kq.cauSai} lan={kq.lan} /> : <LichSu kq={kq} dangTai={dangTai} onTaiThem={() => void tai(TRAN_GIOI_HAN)} />}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <footer className="gvv2-hs-chan">
          <button type="button" className="gvv2-nut-vien tt-nhan" onClick={() => moHoSoEm(em.sbd)}>
            <ExternalLink size={18} aria-hidden="true" />
            Mở hồ sơ đầy đủ
          </button>
          <small>Ca kiểm tra, EXP, thần thú, phụ huynh của em</small>
        </footer>
      </section>
    </>
  )
}

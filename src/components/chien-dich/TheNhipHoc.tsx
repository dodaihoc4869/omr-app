// HÀNH TRÌNH › NHỊP HỌC (thầy 09/10 khuya, nguyên văn: "hành trình để lại chỗ nhịp học, học sinh chưa làm và chưa hoàn thành đủ ưu tiên hiện lên
// đầu nhé, bấm vào từng học sinh hiển thị rõ toàn bộ lịch sử, câu làm sai số giây làm mỗi câu, mọi thứ về học sinh đó").
// Dựng lại bảng từng em của thẻ "Nhịp hôm nay" cũ (bỏ ở 757ea1a1) — KHÔNG dựng lại bốn ô số / thẻ chương:
//   · dữ liệu: `/gv/chien-dich danh-sach` lọc Hành trình đang chạy → `bang` của từng Hành trình → `hanhTrinhNgay.em` (số thật, không bịa);
//   · một dòng tóm tắt "a/b em đủ mức · N em chưa làm câu nào" (cùng phép đếm `chiSoNhip` với màn Hôm nay) + Làm mới;
//   · thanh phân đoạn Tất cả · Khối 10 · 11 · 12 (số em mỗi khối; chỉ hiện khi có từ hai khối) + ô tìm tên/SBD (gõ không dấu vẫn khớp);
//   · em chia nhóm có tiêu đề + số, ưu tiên lên đầu: Chưa làm câu nào → Chưa đủ mức → Đủ mức → Chưa có mức hôm nay (`xepNhomNhip`);
//   · MỖI DÒNG LÀ MỘT NÚT (cả dòng, ≥ 48 px, có viền focus) ⇒ tấm "Lịch sử làm câu" của em (`HoSoLamCauEm`, nạp lười); đóng tấm ⇒ focus về dòng.
// Mảnh riêng, chỉ tải khi thầy mở thẻ (ngoài precache, vite.config.ts).
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronRight, RefreshCw, Search, TrendingUp } from 'lucide-react'
import { lyDoDeHieu } from '../../lib/loi-de-hieu'
import { danhSach, docBang, type ChienDichTom } from './api'
import { chiSoNhip, chuCaiTen, chuHomNay, coMucNhip, khoiCuaHanhTrinh, khopTim, nhomNhipCuaEm, TEN_NHOM_NHIP, tenKhoi, tenTang, xepNhomNhip, type DongNhip, type EmNhip, type LoaiNhomNhip } from './nhip-hanh-trinh'

const HoSoLamCauEm = lazy(() => import('./HoSoLamCauEm'))

interface HanhTrinhDoc {
  cd: ChienDichTom
  khoi: DongNhip['khoi']
  em: EmNhip[] | null
  loi: string
}
type DuNhip = { ok: true; ht: HanhTrinhDoc[] } | { ok: false; chu: string }

async function taiNhip(): Promise<DuNhip> {
  try {
    const r = await danhSach()
    if (!r.ok) return { ok: false, chu: lyDoDeHieu(r.chu) }
    const ht = (r.du.chienDich ?? [])
      .filter((c) => c.hanhTrinh && c.trangThai === 'dang_chay')
      .sort((a, b) => String(khoiCuaHanhTrinh(a)).localeCompare(String(khoiCuaHanhTrinh(b))))
    const bang = await Promise.all(
      ht.map(async (c) => {
        try {
          const b = await docBang(c.id)
          return b.ok ? { em: b.du.hanhTrinhNgay?.em ?? [], loi: '' } : { em: null, loi: lyDoDeHieu(b.chu) }
        } catch (e) {
          return { em: null, loi: lyDoDeHieu(e) }
        }
      }),
    )
    return { ok: true, ht: ht.map((cd, i) => ({ cd, khoi: khoiCuaHanhTrinh(cd), em: bang[i]!.em, loi: bang[i]!.loi })) }
  } catch (e) {
    return { ok: false, chu: lyDoDeHieu(e) }
  }
}

/** Dòng ghi chú chính của một em (một câu, nói thật). */
function ghiChu(e: EmNhip, loai: LoaiNhomNhip): { chu: string; loai: 'thieu' | 'chua' | 'du' | 'con' | 'xam' } {
  if (e.conThieu > 0) return { chu: `Thiếu ${e.conThieu} câu phù hợp`, loai: 'thieu' }
  if (loai === 'du') return { chu: 'Đủ mức hôm nay', loai: 'du' }
  if (!coMucNhip(e)) return { chu: 'Chưa có mức tối thiểu', loai: 'xam' }
  const con = Math.max(0, (e.toiThieu ?? 0) - e.daLam)
  return { chu: `Còn ${con} câu tới mức`, loai: loai === 'chua-lam' ? 'chua' : 'con' }
}

function XuongBang() {
  return (
    <div className="gvv2-cc-xuong" role="status" aria-label="Đang tải nhịp học của các em">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="gvv2-cc-xuong-dong">
          <span className="gvv2-cc-xuong-khoi tt-xuong" style={{ width: 40, height: 40, borderRadius: 999 }} />
          <span className="gvv2-cc-xuong-chu">
            <span className="gvv2-cc-xuong-khoi tt-xuong" style={{ width: '40%', height: 14 }} />
            <span className="gvv2-cc-xuong-khoi tt-xuong" style={{ width: '24%', height: 12 }} />
          </span>
          <span className="gvv2-cc-xuong-khoi tt-xuong" style={{ width: 120, height: 12 }} />
        </span>
      ))}
    </div>
  )
}

function DongEm({ e, loai, hienKhoi, onMo }: { e: DongNhip; loai: LoaiNhomNhip; hienKhoi: boolean; onMo: (e: DongNhip, nut: HTMLButtonElement) => void }) {
  const muc = coMucNhip(e)
  const ti = muc ? Math.round((100 * Math.min(e.daLam, e.toiThieu!)) / e.toiThieu!) : 0
  const g = ghiChu(e, loai)
  const ten = e.ten || e.sbd
  const phu = [`Đã xếp ${e.daXep} câu`, e.duPhong != null ? `dự phòng ${e.duPhong} câu` : '', e.canBoSung?.length ? `${e.canBoSung.length} kiến thức cần bổ sung` : ''].filter(Boolean).join(' · ')
  return (
    <li className="gvv2-nh-o">
      <button
        type="button"
        className="gvv2-nh-dong tt-nhan"
        data-sbd={e.sbd}
        data-nhom={loai}
        onClick={(ev) => onMo(e, ev.currentTarget)}
        aria-label={`${ten}, SBD ${e.sbd}${hienKhoi ? `, ${tenKhoi(e.khoi)}` : ''}: hôm nay ${chuHomNay(e)} · ${g.chu} — xem lịch sử làm câu`}
      >
        <span className="gvv2-avatar gvv2-nh-av" aria-hidden="true">
          {chuCaiTen(ten)}
        </span>
        <span className="gvv2-nh-ten">
          <b>{ten}</b>
          <small className="gvv2-so">
            SBD {e.sbd}
            {hienKhoi ? ` · ${tenKhoi(e.khoi)}` : ''}
          </small>
        </span>
        <span className="gvv2-nh-hn">
          <span className="gvv2-nh-hn-chu">
            <small className="gvv2-nh-nhan">Hôm nay</small>
            <b className="gvv2-so">{chuHomNay(e)}</b>
          </span>
          {muc && (
            <span className="gvv2-thanh" data-du={loai === 'du' ? 'true' : 'false'} aria-hidden="true">
              <i style={{ width: `${ti}%` }} />
            </span>
          )}
        </span>
        <span className="gvv2-nh-tang">
          <span className="gvv2-chip" data-tang={e.tang ?? 0}>
            {e.tang ? <TrendingUp size={14} aria-hidden="true" /> : null}
            {tenTang(e.tang)}
          </span>
        </span>
        <span className="gvv2-nh-ghi">
          <span data-loai={g.loai}>{g.chu}</span>
          <small className="gvv2-so">{phu}</small>
        </span>
        <ChevronRight className="gvv2-nh-mui" size={20} aria-hidden="true" />
      </button>
    </li>
  )
}

/** Thẻ Nhịp học. `khoiDau` = khối chọn sẵn (Hôm nay › dòng "Khối 12"); vắng hoặc không có Hành trình khối ấy ⇒ Tất cả. */
export default function TheNhipHoc({ khoiDau = null }: { khoiDau?: number | null }) {
  const [du, setDu] = useState<DuNhip | null>(null)
  const [dangTai, setDangTai] = useState(true)
  const [khoi, setKhoi] = useState<DongNhip['khoi']>(khoiDau === 10 || khoiDau === 11 || khoiDau === 12 ? (String(khoiDau) as '10' | '11' | '12') : null)
  const [tim, setTim] = useState('')
  const [mo, setMo] = useState<DongNhip | null>(null)
  const nutVua = useRef<HTMLButtonElement | null>(null)

  const lan = useRef(0)
  const tai = useCallback(async () => {
    const l = ++lan.current
    setDangTai(true)
    const kq = await taiNhip()
    if (l !== lan.current) return
    setDu(kq)
    setDangTai(false)
  }, [])
  useEffect(() => {
    void tai()
    return () => {
      lan.current++
    }
  }, [tai])

  const ht = du?.ok ? du.ht : []
  const tatCa = useMemo<DongNhip[]>(() => ht.flatMap((h) => (h.em ?? []).map((e) => ({ ...e, khoi: h.khoi }))), [ht])
  const dsKhoi = useMemo(() => ht.filter((h) => h.em !== null).map((h) => ({ khoi: h.khoi, soEm: h.em!.length })), [ht])
  const coLoc = dsKhoi.length >= 2
  const khoiChon = coLoc && khoi !== null && dsKhoi.some((k) => k.khoi === khoi) ? khoi : null
  const theoKhoi = useMemo(() => (khoiChon === null ? tatCa : tatCa.filter((e) => e.khoi === khoiChon)), [tatCa, khoiChon])
  const cs = useMemo(() => chiSoNhip(theoKhoi), [theoKhoi])
  const nhom = useMemo(() => xepNhomNhip(theoKhoi.filter((e) => khopTim(e, tim))), [theoKhoi, tim])
  const loiKhoi = ht.filter((h) => h.em === null)

  const onMo = useCallback((e: DongNhip, nut: HTMLButtonElement) => {
    nutVua.current = nut
    setMo(e)
  }, [])
  const onDong = useCallback(() => {
    setMo(null)
    // Trả focus về đúng dòng vừa bấm (dòng giữ nguyên phần tử vì key theo khối + SBD).
    nutVua.current?.focus()
  }, [])

  return (
    <section className="gvv2-the gvv2-cc gvv2-nh" aria-label="Nhịp học · em chưa làm, chưa đủ mức đứng trước">
      <div className="gvv2-cc-dau">
        <p className="gvv2-cc-tom" aria-live="polite">
          {du?.ok && tatCa.length > 0 ? (
            <>
              <b className="gvv2-so">{cs.duMuc}</b>
              <span className="gvv2-so">/{cs.coMuc}</span> em đủ mức hôm nay · <b className="gvv2-so">{cs.chuaLam}</b> em chưa làm câu nào
            </>
          ) : (
            'Từng em hôm nay: em chưa làm, chưa đủ mức đứng trước'
          )}
        </p>
        <button type="button" className="gvv2-nut-chu tt-nhan" onClick={() => void tai()} disabled={dangTai} aria-busy={dangTai}>
          <RefreshCw size={18} aria-hidden="true" className={dangTai && du ? 'gvv2-quay' : undefined} />
          {dangTai && du ? 'Đang làm mới…' : 'Làm mới'}
        </button>
      </div>

      {du?.ok && tatCa.length > 0 && (
        <div className="gvv2-nh-loc">
          {coLoc && (
            <div className="gvv2-phan-doan" role="radiogroup" aria-label="Lọc theo khối">
              <button type="button" role="radio" aria-checked={khoiChon === null} className="gvv2-phan-doan-nut tt-nhan" onClick={() => setKhoi(null)}>
                <b>Tất cả</b>
                <small className="gvv2-so">{tatCa.length} em</small>
              </button>
              {dsKhoi.map((k) => (
                <button key={k.khoi ?? '—'} type="button" role="radio" aria-checked={khoiChon === k.khoi} className="gvv2-phan-doan-nut tt-nhan" onClick={() => setKhoi(k.khoi)}>
                  <b>{tenKhoi(k.khoi)}</b>
                  <small className="gvv2-so">{k.soEm} em</small>
                </button>
              ))}
            </div>
          )}
          <label className="gvv2-tim gvv2-nh-tim">
            <Search size={16} aria-hidden="true" />
            <input type="search" value={tim} onChange={(ev) => setTim(ev.target.value)} placeholder="Tìm tên hoặc số báo danh…" aria-label="Tìm học sinh theo tên hoặc số báo danh" />
          </label>
        </div>
      )}

      {du === null ? (
        <XuongBang />
      ) : !du.ok ? (
        <div className="gvv2-loi gvv2-cc-loi" role="alert">
          <p>Chưa tải được nhịp học của các em. {du.chu}</p>
          <button type="button" className="gvv2-nut-vien tt-nhan" onClick={() => void tai()} disabled={dangTai}>
            Thử lại
          </button>
        </div>
      ) : du.ht.length === 0 ? (
        <p className="gvv2-trong">Chưa có Hành trình khối nào đang chạy. Hành trình tự tạo khi máy chủ gộp chiến dịch theo khối.</p>
      ) : (
        <>
          {tatCa.length === 0 && loiKhoi.length < du.ht.length && <p className="gvv2-trong">Hành trình chưa xếp kế hoạch hôm nay cho em nào.</p>}
          {tatCa.length > 0 && nhom.length === 0 && <p className="gvv2-trong">Không có em nào khớp ô tìm{khoiChon ? ` ở ${tenKhoi(khoiChon)}` : ''}.</p>}
          {nhom.length > 0 && (
            <div className="gvv2-nh-bang">
              <div className="gvv2-nh-cot" aria-hidden="true">
                <span>Học sinh</span>
                <span>Hôm nay</span>
                <span>Tầng hiện tại</span>
                <span>Ghi chú</span>
              </div>
              {nhom.map((n) => (
                <section key={n.loai} className="gvv2-nh-nhom" data-nhom={n.loai} aria-labelledby={`gvv2-nh-${n.loai}`}>
                  <h3 id={`gvv2-nh-${n.loai}`} className="gvv2-nh-nhom-tieu">
                    <span className="gvv2-nh-cham" aria-hidden="true" />
                    {TEN_NHOM_NHIP[n.loai]}
                    <span className="gvv2-so gvv2-nh-dem"> · {n.em.length} em</span>
                  </h3>
                  <ul className="gvv2-nh-ds">
                    {n.em.map((e) => (
                      <DongEm key={`${e.khoi ?? '-'}-${e.sbd}`} e={e} loai={n.loai} hienKhoi={coLoc && khoiChon === null} onMo={onMo} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
          {loiKhoi.map((h) => (
            <div key={h.cd.id} className="gvv2-loi gvv2-cc-loi" role="alert">
              <p>
                Chưa tải được nhịp học {tenKhoi(h.khoi)}. {h.loi} Khối khác vẫn đúng.
              </p>
              <button type="button" className="gvv2-nut-vien tt-nhan" onClick={() => void tai()} disabled={dangTai}>
                Thử lại
              </button>
            </div>
          ))}
        </>
      )}

      {/* Tấm ra cổng document.body: tổ tiên trong màn (thẻ có hoạt ảnh `transform`) làm `position: fixed` bám theo thẻ thay vì cửa sổ ⇒ tấm
          và nền che bị nhốt trong khung thẻ (ảnh chụp 10/10). Bọc lại vỏ `.m3.vo-thay` `display: contents` như SuaChienDich: giữ token màu
          và luật con của vỏ thầy, không thêm hộp bố cục nào. */}
      {mo &&
        createPortal(
          <div className="m3 m3-thay vo-thay" data-hoa2="" data-vo-cong="ho-so-lam-cau" style={{ display: 'contents' }}>
            <Suspense
              fallback={
                <>
                  <div className="gvv2-hs-che" aria-hidden="true" />
                  <div className="gvv2-hs gvv2-hs--cho" role="status" aria-label="Đang mở lịch sử làm câu" />
                </>
              }
            >
              <HoSoLamCauEm em={mo} nhom={nhomNhipCuaEm(mo)} onDong={onDong} />
            </Suspense>
          </div>,
          document.body,
        )}
    </section>
  )
}

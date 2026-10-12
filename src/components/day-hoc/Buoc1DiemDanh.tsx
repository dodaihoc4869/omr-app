// BƯỚC 1 ĐIỂM DANH theo bản vẽ thầy duyệt 12/10 (GV-DiemDanh): "mỗi buổi lên lớp học sinh sẽ làm điểm danh đầu tiên, khi học sinh điểm danh xong sẽ hiện
// luôn thống kê lười và chăm chỉ rõ ràng đầy đủ trong bản chiếu" + "cho tôi bấm vào từng học sinh hiện hồ sơ làm bài như trong app luôn nhé".
//   · ô mã + QR (mở lúc · mã đổi mỗi phút · tự làm mới 5 giây) — ô "x/y em có mặt" + thanh nhóm + đếm Chăm / Chưa đều / Lười / Mới trong em có mặt —
//     ô đỏ "Vắng N em — k em đang Lười" kèm tên (em Lười trước);
//   · "Vừa điểm danh" (giờ · tên · nhóm · ngày đủ x/y), bấm em ⇒ CHÍNH tấm Hồ sơ làm bài (`HoSoLamCauEm`, nạp lười, như Hôm nay › Nhịp học);
//   · nút chính "Xong điểm danh · chiếu Nhịp học của lớp" + nút "Chiếu điểm danh" ⇒ hai bản chiếu React toàn màn (`BanChieuDiemDanh`, nạp lười).
// Mọi chức năng cũ giữ nguyên: mở buổi (`khoiMo`), mã + QR, tự làm mới 5 giây (nhịp của `useDiemDanhBuoi` — vẫn chạy khi bản chiếu mở), thêm em tay
// (`khoiThem`), bớt em nhầm (`dsCoMat` gập sẵn), kết thúc buổi. Nhóm từng em: MỘT lệnh CHỈ ĐỌC `/gv/nhip-hoc` cho cả khối/lớp, lọc theo lớp của buổi
// (src/lib/diem-danh-nhip.ts); không có số ⇒ tên vẫn hiện, không màu nhóm. Màu chỉ biến --gvm-* (diem-danh-buoc1.css).
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { MonitorPlay, Plus, RefreshCw } from 'lucide-react'
import { linkDiemDanh } from '../../lib/buoi-hoc-api'
import { dinhDangMa } from '../../lib/them-phut-api'
import { duongQr, taoQr } from '../../lib/ma-qr'
import { layNhipHoc } from '../../lib/nhip-hoc-thay'
import { chuChip, chuNutEm, gioDd, khoaNhom, khoiEm, ngayNganDd, nhipTheoSbd, soNhom, TEN_NHOM, thongKeBuoi, THU_TU_NHOM, type CheDoChieu, type EmBuoi, type TrangThaiNhip } from '../../lib/diem-danh-nhip'
import type { EmHoSo } from '../chien-dich/HoSoLamCauEm'
import type { DiemDanhBuoi } from './DiemDanhBuoi'
import './diem-danh-buoc1.css'

const HoSoLamCauEm = lazy(() => import('../chien-dich/HoSoLamCauEm'))
const BanChieuDiemDanh = lazy(() => import('./BanChieuDiemDanh'))

/** Số dòng "Vừa điểm danh" hiện sẵn (bản vẽ: 6); còn lại mở bằng "Xem cả N em có mặt". */
export const SO_VUA_DIEM_DANH = 6
/** Ô em vắng: hiện sẵn mọi em đang Lười (tối đa ngần này), không có em Lười thì 3 tên đầu; còn lại mở bằng "Xem N em vắng còn lại". */
const TOI_DA_TEN_VANG = 8

/** Nhịp học (một lệnh cho mọi em) khi `bat`; `tai()` đọc lại (mở bản chiếu Nhịp học ⇒ số hôm nay mới nhất). Lỗi ⇒ giữ số cũ + câu nói thật. */
export function useNhipBuoi(bat: boolean): TrangThaiNhip & { tai: () => Promise<void> } {
  const [st, setSt] = useState<TrangThaiNhip>({ kq: null, dangTai: false, loi: '' })
  const lan = useRef(0)
  const tai = useCallback(async () => {
    const l = ++lan.current
    setSt((c) => ({ ...c, dangTai: true }))
    let r: Awaited<ReturnType<typeof layNhipHoc>>
    try {
      r = await layNhipHoc()
    } catch {
      r = { ok: false, loai: 'mang', chu: 'Không nối được máy chủ.' }
    }
    if (l !== lan.current) return
    setSt((c) => (r.ok ? { kq: r.du, dangTai: false, loi: '' } : { kq: c.kq, dangTai: false, loi: r.chu }))
  }, [])
  useEffect(() => {
    if (!bat) return
    void tai()
    return () => {
      lan.current++
    }
  }, [bat, tai])
  return { ...st, tai }
}

export const emHoSoTu = (e: EmBuoi): EmHoSo => ({ sbd: e.sbd, ten: e.hoTen || `SBD ${e.sbd}`, khoi: khoiEm(e), lop: e.lop })

/** Tấm Hồ sơ làm bài sẵn có của app thầy (khung `.m3.m3-thay.vo-thay` như Hôm nay › Nhịp học); `trenChieu` ⇒ phóng to theo khổ máy chiếu. */
export function TamHoSoEm({ em, trenChieu, onDong }: { em: EmHoSo; trenChieu: boolean; onDong: () => void }) {
  return createPortal(
    <div className="m3 m3-thay vo-thay" data-hoa2="" data-vo-cong="ho-so-lam-cau" data-tren-chieu={trenChieu ? '' : undefined} style={{ display: 'contents' }}>
      <Suspense
        fallback={
          <>
            <div className="gvv2-hs-che" aria-hidden="true" />
            <div className="gvv2-hs gvv2-hs--cho" role="status" aria-label="Đang mở hồ sơ làm bài" />
          </>
        }
      >
        <HoSoLamCauEm em={em} onDong={onDong} />
      </Suspense>
    </div>,
    document.body,
  )
}

export default function Buoc1DiemDanh({
  dd,
  soBuoc,
  idTieuDe,
  khoiMo,
  dsCoMat,
  khoiThem,
  onSangDauGio,
}: {
  dd: DiemDanhBuoi
  soBuoc: number
  idTieuDe: string
  khoiMo: ReactNode
  dsCoMat: ReactNode
  khoiThem: ReactNode
  onSangDauGio?: () => void
}) {
  const { tt, dangTaiBuoi, coMat, buoiXong, goc, themMo, setThemMo, moThem, ketThuc, chieuMa, setChieuMa, napLopEm } = dd
  const nhip = useNhipBuoi(!!tt)
  const bang = useMemo(() => nhipTheoSbd(nhip.kq), [nhip.kq])
  const tk = useMemo(() => thongKeBuoi(tt, bang), [tt, bang])
  const [banChieu, setBanChieu] = useState<CheDoChieu | null>(null)
  const [hoSo, setHoSo] = useState<EmHoSo | null>(null)
  const [moVua, setMoVua] = useState(false)
  const [moVang, setMoVang] = useState(false)
  const nutMo = useRef<HTMLElement | null>(null)

  // "Điểm danh" (mở buổi) bật chiếu mã của hook ⇒ ở bước 1 bản vẽ: mở bản chiếu đang điểm danh (không dùng tấm chiếu mã cũ). Nhịp tự làm mới 5 giây
  // của hook vẫn chạy khi bản chiếu mở (bản chiếu đọc thẳng `tt`).
  useEffect(() => {
    if (!chieuMa) return
    setChieuMa(false)
    setBanChieu('diem-danh')
  }, [chieuMa, setChieuMa])
  const idBuoi = tt?.buoi.id ?? ''
  const coLopEm = !!tt?.lopEm
  useEffect(() => {
    if (idBuoi && !coLopEm) void napLopEm()
  }, [idBuoi, coLopEm, napLopEm])

  const moEm = useCallback((e: EmBuoi, nut: HTMLElement | null) => {
    nutMo.current = nut
    setHoSo(emHoSoTu(e))
  }, [])
  const dongHoSo = useCallback(() => {
    setHoSo(null)
    nutMo.current?.focus?.()
  }, [])
  const dongChieu = useCallback(() => setBanChieu(null), [])
  const chieuNhip = useCallback(() => {
    void nhip.tai()
    setBanChieu('nhip-lop')
  }, [nhip])
  const sangDauGio = useMemo(
    () =>
      onSangDauGio
        ? () => {
            setBanChieu(null)
            onSangDauGio()
          }
        : undefined,
    [onSangDauGio],
  )

  const ma = tt?.ma ?? ''
  const ve = useMemo(() => {
    if (!ma || buoiXong) return null
    const q = taoQr(linkDiemDanh(goc, ma))
    return q ? duongQr(q) : null
  }, [ma, goc, buoiXong])
  const tu = nhip.kq ? ngayNganDd(nhip.kq.tu) : ''
  const dem = tk.demCoMat
  const siSo = tt?.siSo ?? null
  const vua = moVua ? tk.coMat : tk.coMat.slice(0, SO_VUA_DIEM_DANH)
  const soHienVang = tk.vangLuoi > 0 ? Math.min(tk.vangLuoi, TOI_DA_TEN_VANG) : Math.min(3, tk.vang.length)
  const vangHien = moVang ? tk.vang : tk.vang.slice(0, soHienVang)
  const conVang = tk.vang.length - soHienVang

  const dongNhip: ReactNode = !tt ? null : nhip.kq ? (
    <p className="dd1-phu dd1-dem-nhom">
      Trong em có mặt:{' '}
      {THU_TU_NHOM.filter((k) => k !== 'chua-co' || dem.chuaCo > 0).map((k, i) => (
        <span key={k}>
          {i > 0 && ' '}
          <b className="dd1-chip" data-nhom={k}>
            {TEN_NHOM[k]} {soNhom(dem, k)}
          </b>
        </span>
      ))}
    </p>
  ) : nhip.loi ? (
    <p className="dd1-phu dd1-loi-nhip" role="status">
      Chưa có nhóm Chăm / Lười: {nhip.loi}{' '}
      <button type="button" className="dd1-nut-chu" onClick={() => void nhip.tai()} disabled={nhip.dangTai} aria-busy={nhip.dangTai}>
        <RefreshCw size={14} aria-hidden="true" /> Thử lại
      </button>
    </p>
  ) : (
    <p className="dd1-phu" aria-busy="true">
      Đang tải nhịp học của các em…
    </p>
  )

  return (
    <>
      <section className="dh-buoc dd1" aria-labelledby={idTieuDe} data-khoi="buoc-diem-danh">
        <div className="dh-buoc-dau dd1-dau">
          <span className="dh-so" aria-hidden="true">
            {soBuoc}
          </span>
          <div className="dh-buoc-ten">
            <h2 id={idTieuDe}>Điểm danh — việc đầu tiên của buổi</h2>
            <p>
              {tt
                ? `${tt.buoi.ten} · em gõ mã hoặc quét QR, tên em hiện trên bản chiếu kèm nhịp học${tu ? ` từ ${tu}` : ''}`
                : 'Mở buổi học, chiếu mã lên máy chiếu cho em điểm danh.'}
            </p>
          </div>
          {tt && <span className={`dh-chip${buoiXong ? ' dh-chip--xam' : ' dh-chip--xanh'}`}>{buoiXong ? 'Đã kết thúc' : 'Đang điểm danh'}</span>}
          {tt && (
            <div className="dd1-nut-dau">
              <button type="button" className="m3-nut-vien dh-nut" onClick={() => setBanChieu('diem-danh')}>
                <MonitorPlay size={18} aria-hidden="true" /> Chiếu điểm danh
              </button>
              {!buoiXong && (
                <button type="button" className="m3-nut-vien dh-nut" onClick={() => (themMo ? setThemMo(false) : void moThem())} aria-expanded={themMo}>
                  <Plus size={18} aria-hidden="true" /> Thêm em tay
                </button>
              )}
              {!buoiXong && (
                <button type="button" className="m3-nut-chu dh-nut" onClick={() => void ketThuc()}>
                  Kết thúc buổi
                </button>
              )}
            </div>
          )}
        </div>

        {dangTaiBuoi ? (
          <p className="dh-phu" aria-busy="true">
            Đang tìm buổi học đang mở…
          </p>
        ) : (
          khoiMo
        )}

        {tt && (
          <>
            <div className="dd1-o3">
              <div className="dd1-o dd1-o--ma" data-khoi="ma-buoi">
                {ve && (
                  <svg className="dd1-qr" viewBox={`0 0 ${ve.canh} ${ve.canh}`} role="img" aria-label="Mã QR điểm danh" shapeRendering="crispEdges">
                    <rect width={ve.canh} height={ve.canh} className="dd1-qr-nen" />
                    <path d={ve.d} className="dd1-qr-o" />
                  </svg>
                )}
                <div className="dd1-ma-chu">
                  <span className="dd1-nhan">Mã buổi</span>
                  <b className="dd1-ma" aria-live="polite">
                    {buoiXong ? '—' : ma ? dinhDangMa(ma) : '……'}
                  </b>
                  <span className="dd1-phu">{buoiXong ? 'Buổi đã kết thúc — mã hết hiệu lực' : `mở lúc ${gioDd(tt.buoi.moLuc)} · mã đổi mỗi phút · tự làm mới 5 giây`}</span>
                </div>
              </div>

              <div className="dd1-o dd1-o--co-mat" data-khoi="co-mat">
                <p className="dd1-co-mat-so">
                  <b>{coMat.length}</b>
                  {siSo ? `/${siSo}` : ''} em có mặt{tt.buoi.lop ? ` · ${tt.buoi.lop}` : ''}
                </p>
                {siSo ? (
                  <span className="dd1-thanh" role="img" aria-label={`Có mặt ${coMat.length} trên ${siSo} em`}>
                    {(nhip.kq ? THU_TU_NHOM : (['chua-co'] as const)).map((k) => {
                      const so = nhip.kq ? soNhom(dem, k) : coMat.length
                      return so > 0 ? <i key={k} data-nhom={nhip.kq ? k : 'tong'} style={{ width: `${Math.min(100, (100 * so) / siSo)}%` }} /> : null
                    })}
                  </span>
                ) : null}
                {coMat.length === 0 ? <p className="dd1-phu">Chưa em nào điểm danh. Bấm “Chiếu điểm danh” để em quét QR hoặc nhập mã; danh sách tự cập nhật mỗi 5 giây.</p> : dongNhip}
              </div>

              <div className="dd1-o dd1-o--vang" data-khoi="em-vang" data-co-vang={tk.vang.length > 0 ? '' : undefined}>
                {!tt.buoi.lop.trim() ? (
                  <p className="dd1-phu">Buổi mở cho mọi lớp — không tính em vắng.</p>
                ) : !tt.lopEm ? (
                  <p className="dd1-phu" aria-busy="true">
                    Đang tải danh sách lớp…
                  </p>
                ) : tk.vang.length === 0 ? (
                  <p className="dd1-vang-tieu">Đủ cả lớp — không em nào vắng.</p>
                ) : (
                  <>
                    <p className="dd1-vang-tieu">
                      Vắng {tk.vang.length} em{nhip.kq ? ` — ${tk.vangLuoi} em đang Lười` : ''}
                    </p>
                    <p className="dd1-vang-ten">{vangHien.map((e) => e.hoTen || `SBD ${e.sbd}`).join(' · ')}</p>
                    {conVang > 0 && (
                      <button type="button" className="dd1-nut-chu" aria-expanded={moVang} onClick={() => setMoVang((v) => !v)}>
                        {moVang ? 'Thu gọn danh sách vắng' : `Xem ${conVang} em vắng còn lại ›`}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="dd1-o2">
              <div className="dd1-o dd1-o--vua" data-khoi="vua-diem-danh">
                <h3 className="dd1-tieu">
                  Vừa điểm danh <small>· bấm em ⇒ hồ sơ làm bài</small>
                </h3>
                {tk.coMat.length === 0 ? (
                  <p className="dd1-phu">Chưa em nào điểm danh.</p>
                ) : (
                  <ul className="dd1-vua-ds" aria-label="Em vừa điểm danh — bấm để mở hồ sơ làm bài">
                    {vua.map((e) => {
                      const k = khoaNhom(e)
                      return (
                        <li key={e.sbd}>
                          <button type="button" className="dd1-vua-dong" onClick={(ev) => moEm(e, ev.currentTarget)} aria-label={`${chuNutEm(e)} (điểm danh ${gioDd(e.luc)}${e.cach === 'thay' ? ', thầy thêm' : ''})`}>
                            <span className="dd1-vua-gio">{gioDd(e.luc)}</span>
                            <b className="dd1-vua-ten">{e.hoTen || `SBD ${e.sbd}`}</b>
                            <span className="dd1-chip" data-nhom={k}>
                              {chuChip(e)}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
                {tk.coMat.length > SO_VUA_DIEM_DANH && (
                  <button type="button" className="dd1-nut-chu" aria-expanded={moVua} onClick={() => setMoVua((v) => !v)}>
                    {moVua ? 'Thu gọn' : `Xem cả ${tk.coMat.length} em có mặt ›`}
                  </button>
                )}
              </div>

              <div className="dd1-o dd1-o--xong">
                <h3 className="dd1-tieu">Xong điểm danh thì làm gì?</h3>
                <p className="dd1-phu">
                  Bấm nút dưới: bản chiếu chuyển sang <b>Nhịp học của lớp</b> — ba cột Chăm · Chưa đều · Lười, em vắng làm mờ. Trên bản chiếu bấm <b>H</b> để ẩn tên nhóm
                  Lười nếu thầy không muốn nêu tên trước lớp.
                </p>
                <button type="button" className="m3-nut-chinh dh-nut dd1-nut-chinh" onClick={chieuNhip}>
                  Xong điểm danh · chiếu Nhịp học của lớp
                </button>
              </div>
            </div>

            {coMat.length > 0 && (
              <details className="dh-co-mat-gap" data-khoi="ds-co-mat">
                <summary>
                  Xem danh sách em có mặt ({coMat.length} em){buoiXong ? '' : ' — bớt em điểm danh nhầm'}
                </summary>
                {dsCoMat}
              </details>
            )}
            {khoiThem}
          </>
        )}
      </section>

      {banChieu && tt && (
        <Suspense fallback={null}>
          <BanChieuDiemDanh
            cheDo={banChieu}
            tt={tt}
            tk={tk}
            nhip={nhip}
            goc={goc}
            matKetNoi={dd.loiLamMoi}
            hoSoMo={!!hoSo}
            onDoiCheDo={(c) => (c === 'nhip-lop' ? chieuNhip() : setBanChieu(c))}
            onDong={dongChieu}
            onMoEm={moEm}
            onThuLaiNhip={() => void nhip.tai()}
            onSangDauGio={sangDauGio}
          />
        </Suspense>
      )}
      {hoSo && <TamHoSoEm em={hoSo} trenChieu={!!banChieu} onDong={dongHoSo} />}
    </>
  )
}

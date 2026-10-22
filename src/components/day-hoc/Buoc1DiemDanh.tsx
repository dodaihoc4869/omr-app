// BƯỚC 1 ĐIỂM DANH theo bản vẽ thầy duyệt 12/10 (GV-DiemDanh): "mỗi buổi lên lớp học sinh sẽ làm điểm danh đầu tiên, khi học sinh điểm danh xong sẽ hiện
// luôn thống kê lười và chăm chỉ rõ ràng đầy đủ trong bản chiếu" + "cho tôi bấm vào từng học sinh hiện hồ sơ làm bài như trong app luôn nhé".
//   · ô mã + QR (mở lúc · mã đổi mỗi phút · tự làm mới 5 giây) — ô "x/y em có mặt" + thanh nhóm + đếm Chăm / Chưa đều / Lười / Mới trong em có mặt —
//     ô đỏ "Vắng N em — k em đang Lười" kèm tên (em Lười trước);
//   · "Vừa điểm danh" (giờ · tên · nhóm · ngày đủ x/y), bấm em ⇒ CHÍNH tấm Hồ sơ làm bài (`HoSoLamCauEm`, nạp lười, như Hôm nay › Nhịp học);
//   · nút chính "Xong điểm danh · chiếu Nhịp học của lớp" + nút "Chiếu điểm danh" ⇒ hai bản chiếu React toàn màn (`BanChieuDiemDanh`, nạp lười).
// Mọi chức năng cũ giữ nguyên: mở buổi (`khoiMo`), mã + QR, tự làm mới 5 giây (nhịp của `useDiemDanhBuoi` — vẫn chạy khi bản chiếu mở), thêm em tay
// (`khoiThem`), bớt em nhầm (`dsCoMat` gập sẵn), kết thúc buổi. Nhóm từng em: MỘT lệnh CHỈ ĐỌC `/gv/nhip-hoc` cho cả khối/lớp, lọc theo lớp của buổi
// (src/lib/diem-danh-nhip.ts); không có số ⇒ tên vẫn hiện, không màu nhóm. Màu chỉ biến --gvm-* (diem-danh-buoc1.css).
// THANH MỨC LÀM (bản vẽ 03, thầy 20/10): mỗi dòng "Vừa điểm danh" thêm thanh nhỏ số lượt 14 ngày theo Mức làm 1 → 4 + "Mức làm 1–2: x/y lượt". Một lệnh CHỈ ĐỌC `/gv/muc-lam-lo` cho
// ĐÚNG các em đang hiện trên dòng (mặc định 6, mở hết ≤ 40) — KHÔNG đụng `/gv/nhip-hoc`; hỏi SAU khi danh sách đã vẽ (chờ 1,5 giây cho danh sách ổn định), lỗi ⇒ dòng vẫn như cũ, không chặn điểm danh.
// Chỉ màn của thầy; KHÔNG đưa lên bản chiếu (tên em kèm mức trước lớp).
// 6 MỨC (thầy duyệt 22/10, bản vẽ docs/ban-ve-muc-lam-6-muc-2210): hỏi cho MỌI em có mặt (≤ 40); dòng tổng lọc «Sai vì vội nhiều · Treo máy · Cố tình treo máy»; mỗi dòng
// cột thẳng hàng Em (cờ Cố tình) · Sai vì vội (% lượt sai) · Cách làm 14 ngày (Vội · Có nghĩ · Treo) · Treo máy; chú thích chung dưới danh sách; "Xong điểm danh" một hàng dưới.
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Flag, MonitorPlay, Pause, Plus, RefreshCw, Users, Zap } from 'lucide-react'
import { linkDiemDanh } from '../../lib/buoi-hoc-api'
import { dinhDangMa } from '../../lib/them-phut-api'
import { duongQr, taoQr } from '../../lib/ma-qr'
import { layNhipHoc } from '../../lib/nhip-hoc-thay'
import { chuMucLamEm, coDauHieu, layMucLamLo, tiLeSaiVoi, TOI_DA_EM_MUC_LAM_LO, TREO_TO, type LocMucLam, type MucLamEm } from '../../lib/muc-lam-lo-api'
import { chuChip, chuNutEm, gioDd, khoaNhom, khoiEm, ngayNganDd, nhipTheoSbd, soNhom, TEN_NHOM, thongKeBuoi, THU_TU_NHOM, type CheDoChieu, type EmBuoi, type TrangThaiNhip } from '../../lib/diem-danh-nhip'
import type { EmHoSo } from '../chien-dich/HoSoLamCauEm'
import type { DiemDanhBuoi } from './DiemDanhBuoi'
import ChipBac from '../bac-cham-chi/ChipBac'
import { chuBacSo } from '../bac-cham-chi/bac'
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

/** Chờ cho danh sách ổn định (danh sách tự làm mới 5 giây, em mới vào liên tục) rồi mới hỏi Mức làm — không chồng lệnh. */
export const CHO_HOI_MUC_LAM_MS = 1500

/**
 * Mức làm 14 ngày của các em đang hiện (`khoaSbd` = SBD nối bằng dấu phẩy, đã ổn định để effect không chạy lại vô ích). Chỉ hỏi em CHƯA có số và chưa đang hỏi;
 * lượt đang bay không bị huỷ khi danh sách đổi (chỉ bỏ khi màn đóng). Lỗi ⇒ `loi`, KHÔNG tự hỏi lại (không dồn thêm tải khi máy chủ đang chậm).
 */
export function useMucLamLo(khoaSbd: string, bat: boolean): { theoEm: ReadonlyMap<string, MucLamEm>; dang: boolean; loi: boolean; loiChu: string; thuLai: () => void } {
  const [theoEm, setTheoEm] = useState<ReadonlyMap<string, MucLamEm>>(() => new Map())
  const [dang, setDang] = useState(false)
  const [loiChu, setLoiChu] = useState('')
  // 6 mức (bản vẽ khung 04): lỗi ⇒ lý do thật + nút "Thử tải lại" (thầy bấm mới hỏi lại các em hỏng — vẫn KHÔNG tự hỏi lại).
  const [lan, setLan] = useState(0)
  const hong = useRef<string[]>([])
  const daHoi = useRef(new Set<string>())
  const song = useRef(true)
  const ngayDem = useRef('')
  useEffect(() => {
    song.current = true
    return () => {
      song.current = false
    }
  }, [])
  useEffect(() => {
    if (!bat) return
    // Qua ngày mới (màn mở xuyên đêm) ⇒ bỏ số cũ, hỏi lại.
    const homNay = new Date().toDateString()
    if (ngayDem.current && ngayDem.current !== homNay) {
      daHoi.current.clear()
      hong.current = []
      setTheoEm(new Map())
      setLoiChu('')
    }
    ngayDem.current = homNay
    const can = khoaSbd.split(',').filter((x) => x && !daHoi.current.has(x)).slice(0, TOI_DA_EM_MUC_LAM_LO)
    if (!can.length) return
    const hen = setTimeout(() => {
      for (const x of can) daHoi.current.add(x)
      setDang(true)
      void layMucLamLo(can).then((r) => {
        if (!song.current) return
        setDang(false)
        if (!r.ok) {
          hong.current = [...hong.current, ...can]
          setLoiChu(r.chu || 'Không nối được máy chủ.')
          return
        }
        setTheoEm((c) => new Map([...c, ...r.du.em]))
      })
    }, CHO_HOI_MUC_LAM_MS)
    return () => clearTimeout(hen)
  }, [khoaSbd, bat, lan])
  const thuLai = useCallback(() => {
    for (const x of hong.current) daHoi.current.delete(x)
    hong.current = []
    setLoiChu('')
    setLan((n) => n + 1)
  }, [])
  return { theoEm, dang, loi: !!loiChu, loiChu, thuLai }
}

const GIAI_THICH_UOC = 'Gồm lượt xếp từ giây đồng hồ cũ hoặc ước tính từ mốc trả lời — số giây có thể cao hơn thật nên mức thật có thể thấp hơn.'

// ── 6 MỨC (bản vẽ docs/ban-ve-muc-lam-6-muc-2210, thầy duyệt 22/10): mỗi dòng em là CỘT THẲNG HÀNG — Em (tên + cờ Cố tình + nhịp) · Sai vì vội (% lớn) ·
// Cách làm 14 ngày (thanh 3 nhóm màu có nghĩa: Vội 1–2 hổ phách · Có nghĩ 3–4 lục · Treo hồng sọc · Cố tình hồng đậm) · Treo máy. Chỉ để nhìn — nhãn đọc màn hình ở nút dòng.

/** Ô «Sai vì vội»: % lớn (tô hổ phách khi vào bộ lọc) + "x/y lượt sai"; ít lượt sai ⇒ "—" + lý do; máy chủ cũ / chưa có số ⇒ "—". */
export function OSaiVoi({ d, cho }: { d: MucLamEm | undefined; cho: boolean }) {
  const t = d && d.soDo > 0 ? tiLeSaiVoi(d) : null
  if (!t) return <span className="dd1-ov dd1-ov--trong" aria-hidden="true">{cho && !d ? '…' : '—'}</span>
  if (!('phanTram' in t))
    return (
      <span className="dd1-ov dd1-ov--it" aria-hidden="true">
        <b>—</b>
        <small>ít lượt sai ({t.it})</small>
      </span>
    )
  return (
    <span className="dd1-ov" data-nhieu={coDauHieu(d, 'voi') ? '' : undefined} aria-hidden="true">
      <b>{t.phanTram}%</b>
      <small>
        {t.voi}/{t.sai} lượt sai
      </small>
    </span>
  )
}

/** Ô «Cách làm 14 ngày»: thanh 3 nhóm theo MỌI lượt có số đo + chữ nhỏ "Vội · Có nghĩ · Treo". `d` vắng ⇒ đang đo / chưa tải được. */
export function OThanhMuc({ d, cho, loi }: { d: MucLamEm | undefined; cho: boolean; loi: boolean }) {
  if (!d)
    return (
      <span className="dd1-ot" aria-hidden="true">
        <span className={`dd1-ot-thanh${cho ? ' dd1-ot-thanh--cho' : ''}`} />
        <small className="dd1-ot-nghieng">{cho ? 'Đang đo…' : loi ? 'Chưa tải được' : ''}</small>
      </span>
    )
  if (d.soDo === 0)
    return (
      <span className="dd1-ot" aria-hidden="true">
        <span className="dd1-ot-thanh" />
        <small className="dd1-ot-nghieng">{d.chuaCoSoDo > 0 ? 'Chưa có số đo' : 'Chưa có lượt 14 ngày qua'}</small>
      </span>
    )
  const voi = d.m[0] + d.m[1], nghi = d.m[2] + d.m[3], treo = d.soTreo + d.soCoTinh
  const doan: [string, number][] = [['voi', voi], ['nghi', nghi], ['treo', d.soTreo], ['co-tinh', d.soCoTinh]]
  return (
    <span className="dd1-ot" aria-hidden="true">
      <span className="dd1-ot-thanh">{doan.map(([k, n]) => (n > 0 ? <i key={k} data-g={k} style={{ flexGrow: n }} /> : null))}</span>
      <small {...(d.soUocTinh > 0 ? { title: GIAI_THICH_UOC } : {})}>
        {d.soUocTinh > 0 ? '≈ ' : ''}Vội <b>{voi}</b> · Có nghĩ <b>{nghi}</b>
        {treo ? (
          <>
            {' '}
            · Treo <b>{treo}</b>
          </>
        ) : null}{' '}
        lượt
      </small>
    </span>
  )
}

/** Ô «Treo máy»: số lượt treo 14 ngày (tô hồng khi ≥ 2); những ngày đầu (chưa lượt nào đo treo) ⇒ "—". */
export function OTreo({ d, chuaDo }: { d: MucLamEm | undefined; chuaDo: boolean }) {
  if (!d || chuaDo || d.soDo === 0)
    return (
      <span className="dd1-otr dd1-otr--trong" aria-hidden="true">
        —
      </span>
    )
  const n = d.soTreo + d.soCoTinh
  return (
    <span className="dd1-otr" data-nhieu={n >= TREO_TO ? '' : undefined} data-khong={n === 0 ? '' : undefined} aria-hidden="true">
      {n > 0 && <Pause size={13} aria-hidden="true" />}
      <b>{n}</b>
      {n > 0 ? ' lượt' : ''}
    </span>
  )
}

/** Số thống kê của các em đang có số (dòng tổng + chú thích chung). `chuaDoTreo` = CHƯA lượt nào của cả danh sách đo treo máy (những ngày đầu). Thuần. */
export function tongDiemDanhMuc(ds: readonly { sbd: string }[], theoEm: ReadonlyMap<string, MucLamEm>) {
  let voi = 0, treo = 0, coTinh = 0, coSo = 0, daDoTreo = 0, chuaCo = 0, chuaTreo = 0, uoc = false
  for (const e of ds) {
    const d = theoEm.get(e.sbd)
    if (!d) continue
    coSo++
    if (coDauHieu(d, 'voi')) voi++
    if (coDauHieu(d, 'treo')) treo++
    if (coDauHieu(d, 'co-tinh')) coTinh++
    daDoTreo += d.soDo - d.soChuaDoTreo
    chuaCo += d.chuaCoSoDo
    chuaTreo += d.soChuaDoTreo
    if (d.soUocTinh > 0) uoc = true
  }
  return { voi, treo, coTinh, coSo, chuaDoTreo: coSo > 0 && daDoTreo === 0, chuaCo, chuaTreo, uoc }
}

const TEN_LOC: Readonly<Record<LocMucLam, string>> = { voi: 'sai vì vội nhiều', treo: 'có treo máy', 'co-tinh': 'cố tình treo máy' }

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
  // 6 mức (22/10, Boss duyệt): hỏi Mức làm cho MỌI em có mặt (≤ 40) — dòng tổng + bộ lọc cần số cả lớp; vẫn MỘT lệnh, em mới vào chỉ hỏi thêm em ấy.
  const khoaMuc = tk.coMat.slice(0, TOI_DA_EM_MUC_LAM_LO).map((e) => e.sbd).join(',')
  const mucLo = useMucLamLo(khoaMuc, !!tt)
  const coCotMuc = mucLo.theoEm.size > 0 || mucLo.dang
  const [loc, setLoc] = useState<LocMucLam | null>(null)
  const tongMuc = useMemo(() => tongDiemDanhMuc(tk.coMat.slice(0, TOI_DA_EM_MUC_LAM_LO), mucLo.theoEm), [tk.coMat, mucLo.theoEm])
  const dsLoc = loc ? tk.coMat.filter((e) => coDauHieu(mucLo.theoEm.get(e.sbd), loc)) : null
  const vua = dsLoc ?? (moVua ? tk.coMat : tk.coMat.slice(0, SO_VUA_DIEM_DANH))
  const tongHien = useMemo(() => tongDiemDanhMuc(vua, mucLo.theoEm), [vua, mucLo.theoEm])
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

            {/* 6 mức (bản vẽ 22/10): "Vừa điểm danh" chiếm cả bề ngang (sửa luôn lỗi cột hẹp ép mất tên); "Xong điểm danh" thành MỘT hàng bên dưới. */}
            <div className="dd1-o2 dd1-o2--doc">
              <div className="dd1-o dd1-o--vua" data-khoi="vua-diem-danh">
                <h3 className="dd1-tieu">
                  Vừa điểm danh <small>· bấm em ⇒ hồ sơ làm bài</small>
                </h3>
                {coCotMuc && tongMuc.coSo > 0 && (
                  <div className="dd1-tong" role="group" aria-label="Lọc em có mặt theo cách làm bài 14 ngày">
                    <p className="dd1-tong-chu">
                      14 ngày qua, trong <b>{Math.min(tk.coMat.length, TOI_DA_EM_MUC_LAM_LO)}</b> em {tk.coMat.length > TOI_DA_EM_MUC_LAM_LO ? 'có mặt đầu tiên' : 'có mặt'}:
                    </p>
                    <div className="dd1-tong-nuts">
                      <button type="button" className="dd1-tong-nut" data-k="tat" aria-pressed={loc === null} onClick={() => setLoc(null)}>
                        <Users size={18} aria-hidden="true" />
                        <span>Tất cả</span>
                        <b>{tk.coMat.length}</b>
                      </button>
                      <button type="button" className="dd1-tong-nut" data-k="voi" aria-pressed={loc === 'voi'} onClick={() => setLoc((c) => (c === 'voi' ? null : 'voi'))}>
                        <Zap size={18} aria-hidden="true" />
                        <span>Sai vì vội nhiều</span>
                        <b>{tongMuc.voi}</b>
                      </button>
                      {tongMuc.chuaDoTreo ? (
                        <span className="dd1-tong-cho">
                          <Pause size={16} aria-hidden="true" />
                          Treo máy: đo từ các lượt làm mới, lượt cũ chưa đo
                        </span>
                      ) : (
                        <>
                          <button type="button" className="dd1-tong-nut" data-k="treo" aria-pressed={loc === 'treo'} onClick={() => setLoc((c) => (c === 'treo' ? null : 'treo'))}>
                            <Pause size={18} aria-hidden="true" />
                            <span>Treo máy</span>
                            <b>{tongMuc.treo}</b>
                          </button>
                          <button type="button" className="dd1-tong-nut" data-k="co-tinh" aria-pressed={loc === 'co-tinh'} onClick={() => setLoc((c) => (c === 'co-tinh' ? null : 'co-tinh'))}>
                            <Flag size={18} aria-hidden="true" />
                            <span>Cố tình treo máy</span>
                            <b>{tongMuc.coTinh}</b>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
                {mucLo.loi && (
                  <p className="dd1-ml-loi" role="status">
                    Chưa tải được Mức làm 14 ngày: {mucLo.loiChu.replace(/[.\s]+$/, '')}. Danh sách điểm danh vẫn đúng.{' '}
                    <button type="button" className="dd1-nut-chu dd1-ml-thu" onClick={mucLo.thuLai} disabled={mucLo.dang}>
                      <RefreshCw size={14} aria-hidden="true" /> Thử tải lại
                    </button>
                  </p>
                )}
                {loc && (
                  <p className="dd1-loc-dong">
                    <b>{vua.length} em</b> {TEN_LOC[loc]} trong 14 ngày ·{' '}
                    <button type="button" className="dd1-nut-chu" onClick={() => setLoc(null)}>
                      Bỏ lọc
                    </button>
                  </p>
                )}
                {coCotMuc && tk.coMat.length > 0 && (
                  <p className="dd1-chu-giai" aria-label="Chú giải thanh 14 ngày">
                    <span>
                      <i data-g="voi" aria-hidden="true" />
                      Vội (Mức làm 1–2)
                    </span>
                    <span>
                      <i data-g="nghi" aria-hidden="true" />
                      Có nghĩ (3–4)
                    </span>
                    <span>
                      <i data-g="treo" aria-hidden="true" />
                      Treo máy
                    </span>
                    <span>
                      <i data-g="co-tinh" aria-hidden="true" />
                      Cố tình treo máy
                    </span>
                    <span className="dd1-cg-rieng">Màn riêng của thầy, không lên bản chiếu</span>
                  </p>
                )}
                {tk.coMat.length === 0 ? (
                  <p className="dd1-phu">Chưa em nào điểm danh.</p>
                ) : (
                  <>
                    {coCotMuc && (
                      <div className="dd1-dau-cot" aria-hidden="true">
                        <span />
                        <span>Em</span>
                        <span>
                          Sai vì vội<small>% lượt sai</small>
                        </span>
                        <span>
                          Cách làm 14 ngày<small>mọi lượt</small>
                        </span>
                        <span>
                          Treo máy<small>{tongMuc.chuaDoTreo ? 'chưa đo' : '14 ngày'}</small>
                        </span>
                      </div>
                    )}
                    <ul className="dd1-vua-ds" aria-label="Em vừa điểm danh — bấm để mở hồ sơ làm bài" data-co-muc={coCotMuc ? '' : undefined}>
                      {vua.map((e) => {
                        const k = khoaNhom(e)
                        const d = mucLo.theoEm.get(e.sbd)
                        const chipNhom = (
                          <span className="dd1-chip" data-nhom={k}>
                            {chuChip(e)}
                          </span>
                        )
                        return (
                          <li key={e.sbd}>
                            <button type="button" className="dd1-vua-dong" onClick={(ev) => moEm(e, ev.currentTarget)} aria-label={`${chuNutEm(e, e.bacCham ? chuBacSo(e.bacCham.bac) : undefined)} (điểm danh ${gioDd(e.luc)}${e.cach === 'thay' ? ', thầy thêm' : ''})${d ? `. ${chuMucLamEm(d)}` : ''}`}>
                              <span className="dd1-vua-gio">{gioDd(e.luc)}</span>
                              <span className="dd1-vua-em">
                                <span className="dd1-vua-ten-hang">
                                  <b className="dd1-vua-ten">{e.hoTen || `SBD ${e.sbd}`}</b>
                                  {d && d.soCoTinh > 0 && (
                                    <span className="dd1-co-tinh">
                                      <Flag size={13} aria-hidden="true" />
                                      Cố tình treo máy
                                    </span>
                                  )}
                                </span>
                                {e.bacCham ? (
                                  // 13/10: có bậc ⇒ chip bậc nhỏ (biểu tượng + số bậc, tên đầy đủ trong title) ngay cạnh chip nhóm
                                  <span className="bcc-hang">
                                    {chipNhom}
                                    <ChipBac bac={e.bacCham.bac} nho />
                                  </span>
                                ) : (
                                  chipNhom
                                )}
                              </span>
                              {coCotMuc && (
                                <>
                                  <OSaiVoi d={d} cho={mucLo.dang} />
                                  <OThanhMuc d={d} cho={mucLo.dang} loi={mucLo.loi} />
                                  <OTreo d={d} chuaDo={tongMuc.chuaDoTreo} />
                                </>
                              )}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                    {coCotMuc && tongHien.coSo > 0 && (
                      <p className="dd1-chu-chung">
                        % và thanh chỉ tính lượt đã đo giờ làm. {vua.length} em đang hiện: <b>{tongHien.chuaCo}</b> lượt chưa có số đo
                        {!tongHien.chuaDoTreo && tongHien.chuaTreo > 0 ? (
                          <>
                            {' '}
                            · <b>{tongHien.chuaTreo}</b> lượt làm trước khi đo treo máy (nằm trong nhóm Vội / Có nghĩ)
                          </>
                        ) : null}
                        {tongHien.uoc ? ' · ≈ = có lượt giây ước tính' : ''}.
                      </p>
                    )}
                  </>
                )}
                {!loc && tk.coMat.length > SO_VUA_DIEM_DANH && (
                  <button type="button" className="dd1-nut-chu" aria-expanded={moVua} onClick={() => setMoVua((v) => !v)}>
                    {moVua ? 'Thu gọn' : `Xem cả ${tk.coMat.length} em có mặt ›`}
                  </button>
                )}
              </div>

              <div className="dd1-o dd1-o--xong">
                <p className="dd1-phu">
                  Xong điểm danh: chiếu <b>Nhịp học của lớp</b> — ba cột Chăm · Chưa đều · Lười, em vắng làm mờ. Trên bản chiếu bấm <b>H</b> để ẩn tên nhóm Lười nếu thầy không
                  muốn nêu tên trước lớp.
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

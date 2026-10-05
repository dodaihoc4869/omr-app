// BƯỚC "BÀI HÔM NAY" của bảng Dạy học (OMNI 3, thầy chốt 05/10 — hình docs/omni-0510/GV-TickBai.jpg chỉ để lấy NỘI DUNG; bố cục theo thẻ bước sẵn có).
// CHỈ hiện khi công tắc OMNI bật (`/gv/omni co-doc`); tắt / máy chủ chưa có lệnh ⇒ bảng Dạy học y như cũ (thầy lệnh 05/10: giữ nguyên giao diện).
// Chọn lớp (lớp của buổi đang mở nếu OMNI áp cho lớp ấy, không thì thầy chọn) → cây DẠY HỌC của khối (CHỌN MỘT BÀI; mỗi bài một chip trạng thái
// từ `/gv/bai-da-day danh-sach`) → `xem-truoc` ⇒ thẻ xác nhận 6 con số + cảnh báo quá tải → nút chính "Giao Bài <số> cho <lớp>" ⇒ `tick`
// (tờ đã tách phần của bài trừ "Ví dụ minh hoạ" — có ô tích để thêm; phạm vi = mọi bài đứng TRƯỚC trong cây cùng khối kèm tờ của chúng).
// Bài đã tick: "Bỏ tick" (hỏi lại, nói thật hậu quả). Lớp chờ bài mới từ 3 ngày ⇒ một dòng nhỏ ở đầu bảng (`DongChoBaiMoi`).
// Chữ: bảng A2 (app thầy dùng "lượt/ngày", không "thể lực"); chủ ngữ chữ MỚI là "A.I Đỗ Đại Học" (omni-chu.ts).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import type { TeacherExamSource } from '../../data/examContent'
import { THAM_SO_OMNI, type CoOmni } from '../../../server/src/omni-kieu'
import { dungCay } from '../../lib/cay-chon-de'
import { locDeDayHoc } from '../../lib/day-hoc-len-bang'
import { TEN_AI } from '../../lib/omni-chu'
import {
  chuChoBaiMoi,
  dsBaiCuaKhoi,
  khoiCuaTenLop,
  maDeMacDinh,
  phamViTruoc,
  tenNganBai,
  trangThaiBai,
  type BaiCay,
  type KieuTrangThaiBai,
} from '../../lib/bai-hom-nay'
import {
  baiDaDayBoTick,
  baiDaDayDanhSach,
  baiDaDayTick,
  baiDaDayXemTruoc,
  docCoOmni,
  type BaiDaTick,
  type DanhSachBaiDaDay,
  type DauVaoBai,
  type XemTruocTick,
} from '../chien-dich/api-omni'
import { hienHanNop, laNgay, ngayVn } from '../chien-dich/ngay'
import { hoiXacNhan } from '../hop-thoai'
import type { DiemDanhBuoi } from './DiemDanhBuoi'
import '../chien-dich/chien-dich.css'
import './day-hoc.css'

/** Chờ thầy gõ xong (hạn nộp / số lượt) rồi mới hỏi máy chủ `xem-truoc`. */
const CHO_XEM_MS = 350
/** Số tên em quá tải in ra; còn lại ghi "và N em nữa". */
const TOI_DA_TEN_QUA_TAI = 8
/** Chặn số lượt vô nghĩa — cùng trần ô "Số lượt câu mỗi ngày" của màn Giao chiến dịch (`THE_LUC_TOI_DA`, máy chủ cũng chặn). Không import màn ấy để mảnh Dạy học nhẹ. */
const LUOT_TOI_DA = 500

const LOP_CHIP: Record<KieuTrangThaiBai, string> = { da_day: 'dh-chip dh-chip--xanh', dang_luyen: 'dh-chip dh-chip--vang', hom_nay: 'dh-chip', chua_day: 'dh-chip dh-chip--xam' }

/** Trạng thái + lệnh của bước Bài hôm nay. `kho` = kho DẠY HỌC của bảng (`khoDayHoc`), nạp lười bằng `napKho`. */
export function useBaiHomNay(dd: Pick<DiemDanhBuoi, 'dsLop' | 'tt'>, kho: TeacherExamSource[] | null, napKho: () => Promise<TeacherExamSource[]>) {
  const showToast = useAppStore((s) => s.showToast)
  const [co, setCo] = useState<CoOmni | null>(null)
  useEffect(() => {
    let song = true
    void docCoOmni().then((r) => {
      if (song && r.ok) setCo(r.du)
    })
    return () => {
      song = false
    }
  }, [])
  const bat = co?.bat === true

  // LỚP: bật theo lớp ⇒ đúng các lớp đã bật; bật cả trung tâm / chạy thử theo em ⇒ mọi lớp. Mặc định = lớp của buổi đang mở (nếu OMNI áp cho lớp ấy).
  const lopBuoi = dd.tt?.buoi.dangMo ? (dd.tt.buoi.lop ?? '').trim() : ''
  const lopMacDinh = bat && lopBuoi && (!co!.lop.length || co!.lop.includes(lopBuoi)) ? lopBuoi : ''
  const dsLop = useMemo(() => {
    if (!co?.bat) return []
    const goc = co.lop.length ? co.lop : dd.dsLop.map((l) => l.tenLop)
    return [...new Set([...goc, ...(lopMacDinh ? [lopMacDinh] : [])])]
  }, [co, dd.dsLop, lopMacDinh])
  const [lopTay, setLopTay] = useState<string | null>(null)
  const lop = lopTay ?? lopMacDinh
  const khoi = useMemo(() => khoiCuaTenLop(dd.dsLop.find((l) => l.tenLop === lop)?.khoi ?? '') || khoiCuaTenLop(lop), [dd.dsLop, lop])

  // DANH SÁCH BÀI ĐÃ TICK của lớp.
  const [ds, setDs] = useState<DanhSachBaiDaDay | null>(null)
  const [loiDs, setLoiDs] = useState('')
  const [dangTaiDs, setDangTaiDs] = useState(false)
  const luotDs = useRef(0)
  const taiDs = useCallback(async () => {
    const l = ++luotDs.current
    if (!bat || !lop) {
      setDs(null)
      setLoiDs('')
      setDangTaiDs(false)
      return
    }
    setDangTaiDs(true)
    setLoiDs('')
    const r = await baiDaDayDanhSach(lop)
    if (l !== luotDs.current) return
    setDangTaiDs(false)
    if (r.ok) setDs(r.du)
    else {
      setDs(null)
      setLoiDs(r.chu)
    }
  }, [bat, lop])
  useEffect(() => {
    void taiDs()
  }, [taiDs])
  useEffect(() => {
    if (bat && lop && !kho) void napKho()
  }, [bat, lop, kho, napKho])

  // CÂY DẠY HỌC của khối (thứ tự cây = thứ tự SGK).
  const dsBai = useMemo(() => (kho && khoi ? dsBaiCuaKhoi(dungCay(locDeDayHoc(kho)), khoi) : []), [kho, khoi])
  const tickTheoKhoa = useMemo(() => new Map((ds?.bai ?? []).map((b) => [b.khoaBai, b])), [ds])

  // CHỌN MỘT BÀI + tờ vào bài luyện + sửa hạn nộp / số lượt.
  const [chon, setChon] = useState<BaiCay | null>(null)
  const [toChon, setToChon] = useState<Set<string>>(new Set())
  const [moSua, setMoSua] = useState(false)
  const [hanSua, setHanSua] = useState('')
  const [theLucChu, setTheLucChu] = useState('')
  const [loiGiao, setLoiGiao] = useState('')
  const homNay = ngayVn(Date.now())
  useEffect(() => {
    // Đổi lớp ⇒ bỏ bài đang chọn (cây khác khối, trạng thái khác).
    setChon(null)
  }, [lop])
  const chonBai = (b: BaiCay) => {
    setChon(b)
    setToChon(new Set(maDeMacDinh(b)))
    setMoSua(false)
    setHanSua('')
    setTheLucChu('')
    setLoiGiao('')
  }
  const doiTo = (maDe: string) =>
    setToChon((cu) => {
      const m = new Set(cu)
      if (m.has(maDe)) m.delete(maDe)
      else m.add(maDe)
      return m
    })
  const nTheLuc = Math.floor(Number(theLucChu))
  const theLucSua = theLucChu.trim() && Number.isFinite(nTheLuc) && nTheLuc >= 1 ? Math.min(LUOT_TOI_DA, nTheLuc) : undefined
  const loiTheLuc = theLucChu.trim() && !theLucSua ? 'Số lượt phải là số nguyên từ 1' : ''
  const hanHopLe = !hanSua || (laNgay(hanSua) && hanSua >= homNay)

  const dauVao: DauVaoBai | null = useMemo(() => {
    if (!chon || !lop) return null
    const maDe = chon.to.filter((t) => toChon.has(t.maDe)).map((t) => t.maDe)
    if (!maDe.length) return null
    return {
      lop,
      khoaBai: chon.khoaBai,
      tenBai: chon.tenBai,
      viTri: chon.viTri,
      maDe,
      ...(hanSua && hanHopLe ? { hanNop: hanSua } : {}),
      ...(theLucSua ? { theLucNgay: theLucSua } : {}),
    }
  }, [chon, lop, toChon, hanSua, hanHopLe, theLucSua])

  // XEM TRƯỚC: mỗi lần đổi đầu vào (chờ thầy gõ xong); câu trả lời cũ về muộn thì bỏ.
  const [xem, setXem] = useState<XemTruocTick | null>(null)
  const [loiXem, setLoiXem] = useState('')
  const [dangXem, setDangXem] = useState(false)
  const luotXem = useRef(0)
  const khoaXem = JSON.stringify(dauVao)
  useEffect(() => {
    const l = ++luotXem.current
    if (!dauVao) {
      setXem(null)
      setLoiXem('')
      setDangXem(false)
      return
    }
    setDangXem(true)
    const hen = setTimeout(() => {
      void baiDaDayXemTruoc(dauVao).then((r) => {
        if (l !== luotXem.current) return
        setDangXem(false)
        if (r.ok) {
          setXem(r.du)
          setLoiXem('')
        } else {
          setXem(null)
          setLoiXem(r.chu)
        }
      })
    }, CHO_XEM_MS)
    return () => clearTimeout(hen)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [khoaXem])

  // GIAO (tick) — thẻ xác nhận chính là bước hỏi lại; giao xong vẫn "Bỏ tick" được (luật C8: hoàn tác thay vì hỏi thêm).
  const [dangGiao, setDangGiao] = useState(false)
  const giao = async () => {
    if (!dauVao || !chon || !xem || dangGiao || dangXem) return
    setDangGiao(true)
    setLoiGiao('')
    const r = await baiDaDayTick({ ...dauVao, phamVi: phamViTruoc(dsBai, chon.viTri) })
    setDangGiao(false)
    if (!r.ok) {
      setLoiGiao(r.chu)
      return
    }
    const ten = tenNganBai(chon.tenBai)
    showToast(
      r.du.daCo ? `${ten} đã giao cho ${lop} từ trước — giữ chiến dịch có sẵn` : `Đã giao ${ten} cho ${lop}${r.du.hanNop ? ` · hạn nộp ${hienHanNop(r.du.hanNop)}` : ''}`,
      'success',
    )
    setChon(null)
    void taiDs()
  }

  const [dangBo, setDangBo] = useState('')
  const boTick = async (b: Pick<BaiDaTick, 'khoaBai' | 'tenBai'>) => {
    if (dangBo) return
    const ten = tenNganBai(b.tenBai)
    const ok = await hoiXacNhan({
      tieuDe: `Bỏ tick ${ten}?`,
      noiDung: `Chiến dịch luyện của ${ten} (lớp ${lop}) dừng: chưa em nào làm câu nào thì huỷ hẳn; đã có em làm thì đóng lại, kết quả đã làm vẫn giữ. Bài trở về "Chưa dạy".`,
      nhanDongY: 'Bỏ tick',
      nhanKhong: 'Giữ bài',
      nguyHiem: true,
    })
    if (!ok) return
    setDangBo(b.khoaBai)
    const r = await baiDaDayBoTick(lop, b.khoaBai)
    setDangBo('')
    if (!r.ok) {
      showToast(r.chu, 'error')
      return
    }
    showToast(
      r.du.chienDich === 'da_huy'
        ? `Đã bỏ tick ${ten} — chiến dịch chưa có lượt làm nên đã huỷ`
        : r.du.chienDich === 'da_dong'
          ? `Đã bỏ tick ${ten} — chiến dịch đã đóng, kết quả đã làm vẫn giữ`
          : `Đã bỏ tick ${ten}`,
      'success',
    )
    void taiDs()
  }

  const chuCho = bat && lop ? chuChoBaiMoi(lop, ds?.choBaiMoi) : null
  return {
    bat,
    co,
    dsLop,
    lop,
    setLop: (l: string) => setLopTay(l),
    khoi,
    ds,
    loiDs,
    dangTaiDs,
    taiDs,
    dsBai,
    tickTheoKhoa,
    chon,
    chonBai,
    toChon,
    doiTo,
    moSua,
    setMoSua,
    hanSua,
    setHanSua,
    theLucChu,
    setTheLucChu,
    theLucSua,
    loiTheLuc,
    hanHopLe,
    homNay,
    dauVao,
    xem,
    loiXem,
    dangXem,
    giao,
    dangGiao,
    loiGiao,
    boTick,
    dangBo,
    chuCho,
  }
}
export type BaiHomNay = ReturnType<typeof useBaiHomNay>

/** Dòng nhỏ ở đầu bảng Dạy học: "Lớp 12A1: 3 ngày chưa có bài mới" (chỉ khi lớp chờ bài mới từ 3 ngày). */
export function DongChoBaiMoi({ bhn }: { bhn: Pick<BaiHomNay, 'chuCho'> }) {
  if (!bhn.chuCho) return null
  return (
    <p className="dh-phu" data-khoi="cho-bai-moi">
      <span className="dh-chip dh-chip--vang">{bhn.chuCho}</span>
    </p>
  )
}

/** Thẻ bước "Bài hôm nay" — cùng kiểu thẻ bước của bảng Dạy học. OMNI tắt ⇒ không vẽ gì. */
export function BuocBaiHomNay({ bhn, kho, soBuoc = 4 }: { bhn: BaiHomNay; kho: TeacherExamSource[] | null; soBuoc?: number }) {
  if (!bhn.bat) return null
  const { dsLop, lop, setLop, khoi, ds, loiDs, dangTaiDs, taiDs, dsBai, tickTheoKhoa, chon, chonBai, xem } = bhn
  // Nhóm bài theo chương, giữ thứ tự cây.
  const theoChuong: { chuong: string; bai: BaiCay[] }[] = []
  for (const b of dsBai) {
    const cuoi = theoChuong[theoChuong.length - 1]
    if (cuoi && cuoi.chuong === b.chuong) cuoi.bai.push(b)
    else theoChuong.push({ chuong: b.chuong, bai: [b] })
  }
  return (
    <section className="dh-buoc" aria-labelledby="dh-b4" data-khoi="bai-hom-nay">
      <div className="dh-buoc-dau">
        <span className="dh-so" aria-hidden="true">
          {soBuoc}
        </span>
        <div className="dh-buoc-ten">
          <h2 id="dh-b4">Bài hôm nay</h2>
          <p>Tick bài vừa dạy — {TEN_AI} tự giao luyện theo bài cho cả lớp. Bài đứng trước bài đã tick là bài cũ để ôn lại.</p>
        </div>
      </div>

      <div className="dh-hang">
        <label className="dh-chon-lop dh-chon-lop--hep">
          <span>Lớp</span>
          <select value={lop} onChange={(e) => setLop(e.target.value)}>
            <option value="">Chọn lớp</option>
            {dsLop.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        {lop && khoi && <span className="dh-phu">Cây Dạy học · Khối {khoi}</span>}
      </div>

      {!lop ? (
        <p className="dh-phu">Chọn lớp để xem cây bài Dạy học của khối và trạng thái từng bài.</p>
      ) : !khoi ? (
        <p className="dh-phu">Chưa nhận ra khối của lớp {lop} (tên lớp cần bắt đầu bằng 10, 11 hoặc 12).</p>
      ) : !kho ? (
        <p className="dh-phu" aria-busy="true">
          Đang đọc kho đề…
        </p>
      ) : dsBai.length === 0 ? (
        <p className="dh-phu">Kho chưa có bài Dạy học của khối {khoi}. Vào Ngân hàng câu hỏi → Đồng bộ ngay để nạp đề.</p>
      ) : (
        <>
          {loiDs ? (
            <div className="dh-hang">
              <p className="dh-loi" role="alert">
                {loiDs}
              </p>
              <button type="button" className="m3-nut-vien dh-nut-nho" onClick={() => void taiDs()}>
                Thử lại
              </button>
            </div>
          ) : dangTaiDs && !ds ? (
            <p className="dh-phu" aria-busy="true">
              Đang đọc trạng thái các bài…
            </p>
          ) : null}
          <div className="dh-them" data-khoi="cay-bai" role="radiogroup" aria-label={`Bài vừa dạy · lớp ${lop}`}>
            {theoChuong.map((g) => (
              <div key={g.chuong || '_'}>
                {g.chuong && (
                  <div className="dh-them-dau">
                    <h3>{g.chuong}</h3>
                  </div>
                )}
                <ul className="dh-them-ds" aria-label={g.chuong || 'Bài'}>
                  {g.bai.map((b) => {
                    const tick = tickTheoKhoa.get(b.khoaBai)
                    const tt = trangThaiBai(tick, chon?.khoaBai === b.khoaBai)
                    return (
                      <li key={b.khoaBai} className="dh-them-dong" data-bai={b.khoaBai} data-trang-thai={tt.kieu}>
                        <label className={`dh-them-o${tick ? ' dh-them-o--co' : ''}`}>
                          <input type="radio" name="dh-bai-hom-nay" checked={chon?.khoaBai === b.khoaBai} disabled={!!tick} onChange={() => chonBai(b)} />
                          <span className="dh-them-chu">
                            <span className="dh-them-ten" title={b.tenBai}>
                              {b.tenBai}
                            </span>
                            <small>{b.soCau} câu</small>
                          </span>
                        </label>
                        <span className={LOP_CHIP[tt.kieu]}>{tt.chu}</span>
                        {tick && (
                          <button type="button" className="m3-nut-chu dh-nut-nho" disabled={bhn.dangBo === b.khoaBai} onClick={() => void bhn.boTick(b)}>
                            {bhn.dangBo === b.khoaBai ? 'Đang bỏ…' : 'Bỏ tick'}
                          </button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      {chon && <TheXacNhan bhn={bhn} chon={chon} xem={xem} />}
    </section>
  )
}

/** Thẻ XÁC NHẬN TRƯỚC KHI GIAO: tờ vào bài luyện, 6 con số có nhãn, cảnh báo quá tải, nút chính + nút sửa hạn nộp / số lượt. */
function TheXacNhan({ bhn, chon, xem }: { bhn: BaiHomNay; chon: BaiCay; xem: XemTruocTick | null }) {
  const { lop, toChon, doiTo, moSua, setMoSua, hanSua, setHanSua, theLucChu, setTheLucChu, theLucSua, loiTheLuc, hanHopLe, homNay, dauVao, loiXem, dangXem, giao, dangGiao, loiGiao } = bhn
  const ten = tenNganBai(chon.tenBai)
  const quaTai = xem?.quaTai ?? []
  const pct = xem && xem.sucChua > 0 ? Math.round((100 * xem.luotCan) / xem.sucChua) : null
  return (
    <div className="dh-them" data-khoi="xac-nhan-tick" aria-live="polite">
      <div className="dh-them-dau">
        <h3>Xác nhận trước khi giao · {chon.tenBai}</h3>
      </div>

      <div role="group" aria-label={`Tờ của ${ten} vào bài luyện`}>
        <p className="dh-phu">Tờ vào bài luyện (câu tự luận tự bỏ):</p>
        <ul className="dh-chip-ds">
          {chon.to.map((t) => (
            <li key={t.maDe}>
              <label className="dh-them-o">
                <input type="checkbox" checked={toChon.has(t.maDe)} onChange={() => doiTo(t.maDe)} />
                <span>
                  {t.nhan} · {t.soCau} câu{t.laViDu && !toChon.has(t.maDe) ? ' (mặc định không — dùng khi dạy)' : ''}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      {!dauVao ? (
        <p className="dh-loi" role="alert">
          {toChon.size === 0 ? 'Chọn ít nhất một tờ để giao.' : !hanHopLe ? 'Hạn nộp phải từ hôm nay trở đi.' : 'Chưa đủ thông tin để xem trước.'}
        </p>
      ) : loiXem && !dangXem ? (
        <p className="dh-loi" role="alert">
          {loiXem}
        </p>
      ) : !xem ? (
        <p className="dh-phu" aria-busy="true">
          Đang tính câu rút được, hạn nộp và số lượt…
        </p>
      ) : (
        <div className="cd-kpi-hang" data-khoi="sau-con-so" aria-busy={dangXem}>
          <div className="cd-kpi" data-so-tick="cau">
            <span className="cd-kpi-nhan">Câu rút được</span>
            <strong>
              {xem.soCau}
              <small>câu</small>
            </strong>
            <span className="cd-kpi-phu">{xem.soTuLuan > 0 ? `đã bỏ ${xem.soTuLuan} câu tự luận` : 'không có câu tự luận'}</span>
          </div>
          <div className="cd-kpi" data-so-tick="han">
            <span className="cd-kpi-nhan">{hanSua ? 'Hạn nộp (thầy sửa)' : 'Hạn nộp tự tính'}</span>
            <strong>
              {xem.D}
              <small>ngày</small>
            </strong>
            <span className="cd-kpi-phu">hết {hienHanNop(xem.hanNop, false) || xem.hanNop}</span>
          </div>
          <div className="cd-kpi" data-so-tick="luot">
            <span className="cd-kpi-nhan">Lượt cần / sức chứa</span>
            <strong>
              {xem.luotCan}
              <small>/ {xem.sucChua} lượt</small>
            </strong>
            <span className="cd-kpi-phu">em ở giữa lớp{pct !== null ? ` · ${pct}% sức chứa` : ''}</span>
          </div>
          <div className="cd-kpi" data-so-tick="luot-ngay">
            <span className="cd-kpi-nhan">Số lượt mỗi ngày</span>
            <strong>
              {xem.theLucNgay}
              <small>lượt/ngày</small>
            </strong>
            <span className="cd-kpi-phu">{theLucSua ? 'thầy sửa' : 'mặc định của lớp'}</span>
          </div>
          <div className="cd-kpi" data-so-tick="du-luot">
            <span className="cd-kpi-nhan">Đủ lượt để luyện hết</span>
            <strong>
              {xem.duLuot}
              <small>/ {xem.tongEm} em</small>
            </strong>
          </div>
          {xem.duDiem8 !== null && (
            <div className="cd-kpi" data-so-tick="du-diem-8">
              <span className="cd-kpi-nhan">Đủ lượt để ca chốt ≥ 8</span>
              <strong>
                {xem.duDiem8}
                <small>/ {xem.tongEm} em</small>
              </strong>
            </div>
          )}
        </div>
      )}

      {xem && quaTai.length > 0 && (
        <p className="dh-loi" role="alert" data-khoi="qua-tai">
          {quaTai.length} em quá tải ngay từ ngày đầu: {quaTai.slice(0, TOI_DA_TEN_QUA_TAI).map((e) => e.ten).join(', ')}
          {quaTai.length > TOI_DA_TEN_QUA_TAI ? ` và ${quaTai.length - TOI_DA_TEN_QUA_TAI} em nữa` : ''}. Gợi ý: bỏ tờ “Các dạng toán trọng tâm”, lùi hạn nộp hoặc tăng số lượt mỗi
          ngày. Vẫn giao được.
        </p>
      )}

      {moSua && (
        <div className="cd-hai-ngay" data-khoi="sua-han-luot">
          <label className="cd-truong">
            Hạn nộp (hết lúc 23:59)
            <input type="date" value={hanSua} min={homNay} onChange={(e) => setHanSua(e.target.value)} />
            <small className="cd-so cd-phu">{!hanSua ? `Để trống = ${TEN_AI} tự tính (${THAM_SO_OMNI.HAN_BAI_MIN}–${THAM_SO_OMNI.HAN_BAI_MAX} ngày)` : hanHopLe ? hienHanNop(hanSua) : 'Hạn nộp phải từ hôm nay trở đi'}</small>
          </label>
          <label className="cd-truong">
            Số lượt câu mỗi ngày (một em)
            <input type="number" inputMode="numeric" min={1} max={LUOT_TOI_DA} value={theLucChu} placeholder={xem ? String(xem.theLucNgay) : ''} onChange={(e) => setTheLucChu(e.target.value)} />
            <small className="cd-so cd-phu">{loiTheLuc || 'Để trống = số lượt mặc định của lớp (Cài đặt)'}</small>
          </label>
        </div>
      )}

      {loiGiao && (
        <p className="dh-loi" role="alert">
          {loiGiao}
        </p>
      )}
      <div className="dh-hang">
        <button type="button" className="m3-nut-chinh dh-nut" disabled={!dauVao || !xem || dangXem || dangGiao} onClick={() => void giao()}>
          {dangGiao ? 'Đang giao…' : `Giao ${ten} cho ${lop}`}
        </button>
        <button type="button" className="m3-nut-vien dh-nut" aria-expanded={moSua} onClick={() => setMoSua(!moSua)}>
          Sửa hạn nộp hoặc số lượt/ngày
        </button>
      </div>
    </div>
  )
}

// THẺ "KIỂM TRA ĐẦU GIỜ" — mục Lên bảng của app thầy (đặc tả docs/DAC-TA-KIEM-TRA-DAU-GIO-SO-NO-2909.md mục B, thầy chốt 29/09). BA BƯỚC:
//  1 · ĐIỂM DANH — bê nguyên bước của thẻ Dạy học (`DiemDanhBuoi.tsx`: mở buổi, mã + QR, có mặt tự làm mới 5 giây, thêm em tay).
//  2 · CHIẾU LÊN BẢNG — máy chủ quét em CÓ MẶT (`/gv/dau-gio` ung-vien): câu em đã làm ĐÚNG ở mọi chiến dịch/nguồn, bỏ câu đã hỏi ở đầu giờ các buổi trước;
//      app chọn ngẫu nhiên ≤ 6 em, mỗi em 1 câu, không trùng câu (`chonLuotDauGio`), ưu tiên "thành thạo ảo"; máy chủ kiểm lại và lưu lượt (chot).
//      Tờ chiếu MỚI (`dungToChieuDayHoc` → `taoHtmlMayChieu`): đủ Phần I/II/III, công thức, hình; thẻ tên có dòng lịch sử câu
//      ("Sai 20/09 (Ca) · Đúng 22/09 (Đoàn)"), bấm thẻ tên ⇒ bảng chi tiết (các lần làm câu này). "Gọi thêm" = lượt mới (không trùng em đã gọi trong buổi).
//  3 · CHẤM — mỗi câu Đạt / Chưa đạt (idempotent theo buổi + em + câu, ghi sổ nguon='dau_gio') + ô "Thầy đã chữa" (nhãn + mốc dạy lại).
//      "Kết thúc": câu chưa chấm KHÔNG ghi gì vào sổ.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, Eye, EyeOff, Flag, Lightbulb, MonitorPlay, UserPlus, X } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import KhungXemPhieu from '../KhungXemPhieu'
import { hoiXacNhan } from '../hop-thoai'
import { useGhiToChieu, type GhiMotO } from '../chien-dich/ghi-to-chieu'
import { dungToChieuDayHoc, tomTatDe, type CauDayHoc, type EmLenCau } from '../../lib/day-hoc-len-bang'
import { chonLuotDauGio, ngayNganVn, TOI_DA_EM_MOI_LUOT } from '../../lib/dau-gio'
import { cauTheoQid, khoaNoiDungTheoKho, locUngVienTheoKho } from '../../lib/dau-gio-kho'
import { chamCau, chotLuot, ghiDaChua, ketThucDauGio, layLichSuHoi, layUngVien, xemDauGio, type LichSuHoi, type LuotHoi } from '../../lib/dau-gio-api'
import { khoaToChieu } from '../../lib/to-chieu-cau-noi'
import { BuocDiemDanh, tenNgan, useDiemDanhBuoi } from './DiemDanhBuoi'
import TheCauHienThi from './TheCauHienThi'
import './day-hoc.css'
import './dau-gio.css'

const TEN_PHAN: Record<CauDayHoc['phan'], string> = { I: 'Phần I · Trắc nghiệm', II: 'Phần II · Đúng–sai', III: 'Phần III · Trả lời ngắn' }
const khoa = (x: { sbd: string; qid: string }) => khoaToChieu(x.sbd, x.qid)

export default function KiemTraDauGio() {
  const showToast = useAppStore((s) => s.showToast)
  const dd = useDiemDanhBuoi()
  const { tt, idBuoi, coMat, lopCuaEm } = dd
  const buoiMo = !!tt?.buoi.dangMo

  // ───── lượt hỏi của buổi (máy chủ là nguồn; mở lại app giữa buổi vẫn thấy) ─────
  const [luot, setLuot] = useState<LuotHoi[]>([])
  const [daKetThuc, setDaKetThuc] = useState(false)
  const [lichSu, setLichSu] = useState<Record<string, LichSuHoi>>({})
  const [dangTaiLuot, setDangTaiLuot] = useState(false)
  const [loiLuot, setLoiLuot] = useState('')

  const napLichSu = useCallback(async (ds: { sbd: string; qid: string }[]) => {
    const can = ds.filter((x) => x.sbd && x.qid)
    for (let i = 0; i < can.length; i += 24) {
      const r = await layLichSuHoi(can.slice(i, i + 24))
      if (r.ok) setLichSu((cu) => ({ ...cu, ...Object.fromEntries(r.du.map((x) => [khoa(x), x])) }))
    }
  }, [])

  const napLuot = useCallback(async () => {
    if (!idBuoi) return
    setDangTaiLuot(true)
    const r = await xemDauGio(idBuoi)
    setDangTaiLuot(false)
    if (!r.ok) {
      setLoiLuot(r.chu)
      return
    }
    setLoiLuot('')
    setLuot(r.du.luot)
    setDaKetThuc(r.du.daKetThuc)
    void napLichSu(r.du.luot)
  }, [idBuoi, napLichSu])
  useEffect(() => {
    setLuot([])
    setDaKetThuc(false)
    void napLuot()
  }, [napLuot])

  // ───── kho câu (nạp một lần, khi cần dựng tờ) ─────
  const kho = useRef<Map<string, CauDayHoc> | null>(null)
  const [khoSan, setKhoSan] = useState(false)
  const napKho = useCallback(async (): Promise<Map<string, CauDayHoc>> => {
    if (kho.current) return kho.current
    try {
      const { loadExamSources } = await import('../../lib/exam-db')
      kho.current = cauTheoQid(await loadExamSources())
    } catch {
      kho.current = new Map()
    }
    setKhoSan(true)
    return kho.current
  }, [])
  useEffect(() => {
    if (luot.length && !kho.current) void napKho()
  }, [luot, napKho])

  // ───── ghi Đạt / Chưa đạt: nút trên tờ chiếu (D / K) và nút trên màn thầy đi CÙNG một đường `/gv/dau-gio` cham ─────
  const ghiO = useCallback<GhiMotO>(
    async (o, dat) => {
      if (!idBuoi) return { ok: false, chu: 'Chưa có buổi học.' }
      const r = await chamCau(idBuoi, o.sbd, o.qid, dat)
      if (!r.ok) return { ok: false, chu: r.chu }
      setLuot((cu) => cu.map((x) => (x.sbd === o.sbd && x.qid === o.qid ? { ...x, trangThai: r.du.ketQua } : x)))
      return { ok: true }
    },
    [idBuoi],
  )
  // Nút "Thầy chữa" trên tờ (thầy 05/10) = ô "Thầy đã chữa" của bảng chấm (`/gv/dau-gio` da-chua) — cùng nhãn, cùng mốc dạy lại.
  const thayChuaO = useCallback(
    async (o: { sbd: string; qid: string }) => {
      if (!idBuoi) return { ok: false as const, chu: 'Chưa có buổi học.' }
      const r = await ghiDaChua(idBuoi, o.sbd, o.qid)
      if (!r.ok) return { ok: false as const, chu: r.chu }
      setLuot((cu) => cu.map((x) => (x.sbd === o.sbd && x.qid === o.qid ? { ...x, daChuaLuc: x.daChuaLuc || r.du.luc } : x)))
      return { ok: true as const }
    },
    [idBuoi],
  )
  const { ketQua, moPhien, ganO, dongPhien, ghi } = useGhiToChieu(idBuoi ? `dau-gio|${idBuoi}` : '', ghiO, thayChuaO)

  const [html, setHtml] = useState('')
  const [dangChieu, setDangChieu] = useState(false)
  const [xemLoiGiai, setXemLoiGiai] = useState<Set<string>>(new Set())
  const luotCuoi = luot.length ? Math.max(...luot.map((x) => x.luot)) : 0

  /** Dựng tờ chiếu cho các lượt `ds`. `ls` = lịch sử vừa nạp (state có thể chưa kịp cập nhật). */
  const moTo = async (ds: LuotHoi[], ls: Record<string, LichSuHoi> = lichSu) => {
    const k = await napKho()
    const cau: CauDayHoc[] = []
    const giao = new Map<string, EmLenCau>()
    for (const x of ds) {
      const c = k.get(x.qid)
      if (!c) continue
      // Nút Đạt / Chưa đạt trên tờ cần chuyên đề (khuôn ô ghi) — câu thiếu chuyên đề mang nhãn chung.
      const c2 = c.chuyenDe ? c : { ...c, chuyenDe: x.chuyenDe || 'Kiểm tra đầu giờ' }
      cau.push(c2)
      giao.set(c2.khoa, { sbd: x.sbd, hoTen: x.hoTen, lop: lopCuaEm.get(x.sbd) || tt?.buoi.lop || undefined, lichSu: ls[khoa(x)]?.chu || undefined })
    }
    if (!cau.length) {
      showToast('Máy này chưa có các câu trong kho — vào Ngân hàng câu hỏi → Đồng bộ ngay rồi mở lại tờ chiếu.', 'warn')
      return
    }
    const ma = moPhien()
    const { html: h, o } = await dungToChieuDayHoc(cau, giao, `Kiểm tra đầu giờ · ${tt?.buoi.ten || 'Buổi học'}`, daKetThuc ? undefined : ma)
    ganO(ma, o)
    setHtml(h)
  }

  const goiLuot = async () => {
    if (!idBuoi || dangChieu) return
    setDangChieu(true)
    try {
      const [k, r] = await Promise.all([napKho(), layUngVien(idBuoi)])
      if (!r.ok) {
        showToast(r.chu, 'error')
        return
      }
      const chon = chonLuotDauGio(locUngVienTheoKho(r.du.em, k), { daGoi: new Set(r.du.daGoi), cauDaDung: new Set(r.du.cauDaDung), khoaNoiDung: khoaNoiDungTheoKho(k) })
      if (!chon.length) {
        showToast(
          r.du.em.length ? 'Không còn em có mặt nào có câu đã làm đúng mà chưa hỏi ở đầu giờ.' : 'Mọi em có mặt đã được gọi trong buổi này.',
          'warn',
        )
        return
      }
      const c = await chotLuot(
        idBuoi,
        chon.map((x) => ({ sbd: x.sbd, qid: x.qid, chuyenDe: k.get(x.qid)?.chuyenDe || '' })),
      )
      if (!c.ok) {
        showToast(c.chu, 'error')
        return
      }
      setLuot(c.du.ds)
      const moi = c.du.ds.filter((x) => x.luot === c.du.luot)
      if (!moi.length) {
        showToast('Máy chủ không nhận lượt này (danh sách có mặt vừa đổi) — bấm lại.', 'warn')
        return
      }
      const r2 = await layLichSuHoi(moi.map((x) => ({ sbd: x.sbd, qid: x.qid })))
      const ls = r2.ok ? { ...lichSu, ...Object.fromEntries(r2.du.map((x) => [khoa(x), x])) } : lichSu
      setLichSu(ls)
      await moTo(moi, ls)
      if (moi.length < chon.length) showToast(`Gọi ${moi.length} em (máy chủ bỏ ${chon.length - moi.length} em vừa đổi trạng thái).`, 'warn')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không dựng được tờ chiếu', 'error')
    } finally {
      setDangChieu(false)
    }
  }

  const trangThai = (x: LuotHoi): LuotHoi['trangThai'] => {
    if (x.trangThai !== 'cho') return x.trangThai
    const k = ketQua[khoa(x)]
    return k === 'dat' ? 'dat' : k === 'khong_dat' ? 'chua_dat' : 'cho'
  }
  const cham = async (x: LuotHoi, dat: boolean) => {
    await ghi(khoa(x), { sbd: x.sbd, hoTen: x.hoTen, qid: x.qid, chuyenDe: x.chuyenDe || 'Kiểm tra đầu giờ' }, dat)
  }
  const [dangChua, setDangChua] = useState<Set<string>>(new Set())
  const daChua = async (x: LuotHoi) => {
    if (!idBuoi || x.daChuaLuc || dangChua.has(khoa(x))) return
    setDangChua((s) => new Set(s).add(khoa(x)))
    const r = await ghiDaChua(idBuoi, x.sbd, x.qid)
    setDangChua((s) => {
      const m = new Set(s)
      m.delete(khoa(x))
      return m
    })
    if (!r.ok) {
      showToast(r.chu, 'error')
      return
    }
    const luc = r.du.luc || new Date().toISOString()
    setLuot((cu) => cu.map((y) => (y.sbd === x.sbd && y.qid === x.qid ? { ...y, daChuaLuc: luc } : y)))
    showToast(`${x.hoTen || x.sbd}: đã lưu “Thầy đã chữa” — câu quay lại kế hoạch ngày mai`, 'success')
  }

  const ketThuc = async () => {
    if (!idBuoi) return
    const chua = luot.filter((x) => trangThai(x) === 'cho').length
    const ok = await hoiXacNhan({
      tieuDe: 'Kết thúc kiểm tra đầu giờ?',
      noiDung: chua
        ? `${chua} em chưa chấm sẽ KHÔNG được ghi gì vào sổ học. Sau khi kết thúc, buổi này không gọi thêm em được nữa.`
        : 'Sau khi kết thúc, buổi này không gọi thêm em được nữa. Kết quả đã chấm vẫn giữ.',
      nhanDongY: 'Kết thúc, không gọi thêm',
      nhanKhong: 'Chưa',
    })
    if (!ok) return
    const r = await ketThucDauGio(idBuoi)
    if (!r.ok) {
      showToast(r.chu, 'error')
      return
    }
    setLuot(r.du.luot)
    setDaKetThuc(true)
    dongPhien()
    setHtml('')
    showToast(r.du.soBo ? `Đã kết thúc — ${r.du.soBo} em chưa chấm không ghi vào sổ` : 'Đã kết thúc kiểm tra đầu giờ', 'success')
  }

  const dem = useMemo(() => {
    const t = luot.map(trangThai)
    return { goi: luot.length, dat: t.filter((x) => x === 'dat').length, chuaDat: t.filter((x) => x === 'chua_dat').length, cho: t.filter((x) => x === 'cho').length }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [luot, ketQua])
  const daGoiHet = coMat.length > 0 && coMat.every((e) => luot.some((x) => x.sbd === e.sbd))
  const theoLuot = useMemo(() => {
    const m = new Map<number, LuotHoi[]>()
    for (const x of luot) m.set(x.luot, [...(m.get(x.luot) ?? []), x])
    return [...m.entries()].sort((a, b) => b[0] - a[0])
  }, [luot])

  return (
    <div className="dh-trang" data-khoi="kiem-tra-dau-gio">
      <header className="dh-dau">
        <h1>Kiểm tra đầu giờ</h1>
        <p>
          Điểm danh → app gọi tối đa {TOI_DA_EM_MOI_LUOT} em có mặt, mỗi em một câu em từng làm đúng (ưu tiên câu đúng ngay lần đầu, lâu chưa gặp lại; không lặp câu đã hỏi ở buổi trước) → thầy chấm Đạt / Chưa đạt.
        </p>
      </header>

      <BuocDiemDanh dd={dd} soBuoc={1} idTieuDe="dg-b1" />

      {/* ───── BƯỚC 2 ───── */}
      <section className="dh-buoc dh-buoc--chieu" aria-labelledby="dg-b2">
        <div className="dh-buoc-dau">
          <span className="dh-so" aria-hidden="true">
            2
          </span>
          <div className="dh-buoc-ten">
            <h2 id="dg-b2">Chiếu lên bảng</h2>
            <p>
              {!tt
                ? 'Điểm danh trước — app chỉ gọi em có mặt.'
                : daKetThuc
                  ? 'Đã kết thúc kiểm tra đầu giờ của buổi này.'
                  : !buoiMo
                    ? 'Buổi học đã kết thúc — mở buổi mới để kiểm tra đầu giờ.'
                    : !coMat.length
                      ? 'Chưa có em nào có mặt.'
                      : luot.length
                        ? `${coMat.length} em có mặt · đã gọi ${luot.length} em trong buổi${daGoiHet ? ' (đã gọi hết)' : ''}.`
                        : `${coMat.length} em có mặt · mỗi lượt tối đa ${TOI_DA_EM_MOI_LUOT} em, mỗi em một câu khác nhau.`}
            </p>
          </div>
        </div>
        {tt && buoiMo && !daKetThuc && (
          <div className="dh-hang">
            <button type="button" className="m3-nut-chinh dh-nut" disabled={dangChieu || !coMat.length || daGoiHet} aria-busy={dangChieu} onClick={() => void goiLuot()}>
              {luot.length ? <UserPlus size={18} aria-hidden="true" /> : <MonitorPlay size={18} aria-hidden="true" />}{' '}
              {dangChieu ? 'Đang chọn em và dựng tờ chiếu…' : luot.length ? `Gọi thêm (tối đa ${TOI_DA_EM_MOI_LUOT} em)` : 'Chiếu lên bảng'}
            </button>
            {luot.length > 0 && (
              <button type="button" className="m3-nut-vien dh-nut" disabled={dangChieu} onClick={() => void moTo(luot.filter((x) => x.luot === luotCuoi))}>
                <MonitorPlay size={18} aria-hidden="true" /> Mở lại tờ chiếu lượt {luotCuoi}
              </button>
            )}

            {luot.length > 0 && (
              <button type="button" className="m3-nut-chu dh-nut" onClick={() => void ketThuc()}>
                <Flag size={16} aria-hidden="true" /> Kết thúc kiểm tra
              </button>
            )}
          </div>
        )}
      </section>

      {/* ───── BƯỚC 3 ───── */}
      <section className="dh-buoc" aria-labelledby="dg-b3">
        <div className="dh-buoc-dau">
          <span className="dh-so" aria-hidden="true">
            3
          </span>
          <div className="dh-buoc-ten">
            <h2 id="dg-b3">Chấm từng câu</h2>
            <p>Đạt ⇒ câu thành thạo. Chưa đạt ⇒ câu vào sổ nợ, có trong kế hoạch ngày mai. Tích “Thầy đã chữa” khi thầy đã chữa câu trước lớp.</p>
          </div>
        </div>
        {!tt ? null : dangTaiLuot && !luot.length ? (
          <p className="dh-phu" aria-busy="true">
            Đang tải các lượt đã gọi…
          </p>
        ) : loiLuot ? (
          <div className="dh-hang">
            <p className="dh-loi" role="alert">
              {loiLuot}
            </p>
            <button type="button" className="m3-nut-vien dh-nut" onClick={() => void napLuot()}>
              Thử lại
            </button>
          </div>
        ) : !luot.length ? (
          <p className="dh-phu">Chưa gọi em nào. Bấm “Chiếu lên bảng” ở bước 2.</p>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, margin: '8px 0' }}>
              <p className="dh-tong dg-tong" style={{ margin: 0 }}>
                <span>
                  Đã gọi <b>{dem.goi}</b> em
                </span>
                <span>
                  Đạt <b>{dem.dat}</b>
                </span>
                <span>
                  Chưa đạt <b>{dem.chuaDat}</b>
                </span>
                <span>
                  Chưa chấm <b>{dem.cho}</b>
                </span>
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="m3-nut-tonal dh-nut-nho"
                  onClick={() => setXemLoiGiai(new Set(luot.map(khoa)))}
                >
                  <Eye size={15} /> Hiện lời giải tất cả
                </button>
                {xemLoiGiai.size > 0 && (
                  <button
                    type="button"
                    className="m3-nut-chu dh-nut-nho"
                    onClick={() => setXemLoiGiai(new Set())}
                  >
                    <EyeOff size={15} /> Ẩn tất cả
                  </button>
                )}
              </div>
            </div>
            {theoLuot.map(([so, ds]) => (
              <div key={so} className="dg-luot">
                <h3 className="dg-luot-ten">Lượt {so}</h3>
                <ol className="dh-cau-ds">
                  {ds.map((x) => {
                    const c = khoSan ? kho.current?.get(x.qid) : undefined
                    const t = trangThai(x)
                    const ls = lichSu[khoa(x)]
                    const mo = xemLoiGiai.has(khoa(x))
                    return (
                      <li key={khoa(x)} className="dh-cau dg-dong" data-trang-thai={t}>
                        <div className="dh-cau-than" style={{ width: '100%' }}>
                          <p className="dg-ten">
                            <b title={x.hoTen || x.sbd}>{x.hoTen || x.sbd}</b>
                            <small>SBD {x.sbd}</small>
                          </p>
                          <p className="dh-cau-nhan">
                            {c && <span>{TEN_PHAN[c.phan]}</span>}
                            <span className="dh-cau-dang">{c?.tenDang || x.chuyenDe || 'Câu đã làm đúng'}</span>
                          </p>
                          <p className="dh-cau-de">{c ? tomTatDe(c) : 'Máy này chưa có câu này trong kho — đồng bộ Ngân hàng câu hỏi để xem đề.'}</p>
                          {ls?.chu && (
                            <p className="dg-lich-su">
                              <span className="dg-lich-su-nhan">Lịch sử câu này:</span> {ls.chu}
                            </p>
                          )}
                          <div className="dg-cham">
                            {t === 'dat' || t === 'chua_dat' ? (
                              <span className={`dh-chip ${t === 'dat' ? 'dh-chip--xanh' : 'dh-chip--do'}`}>{t === 'dat' ? 'Đã ghi: Đạt' : 'Đã ghi: Chưa đạt'}</span>
                            ) : t === 'bo' ? (
                              <span className="dh-chip dh-chip--xam">Không chấm (đã kết thúc)</span>
                            ) : (
                              <>
                                <button type="button" className="m3-nut-tonal dh-nut-nho" onClick={() => void cham(x, true)} aria-label={`${tenNgan(x.hoTen, x.sbd)}: Đạt`}>
                                  <Check size={16} aria-hidden="true" /> Đạt
                                </button>
                                <button type="button" className="m3-nut-vien dh-nut-nho" onClick={() => void cham(x, false)} aria-label={`${tenNgan(x.hoTen, x.sbd)}: Chưa đạt`}>
                                  <X size={16} aria-hidden="true" /> Chưa đạt
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              className={`m3-nut-vien dh-nut-nho ${mo ? 'dh-nut-giai--mo' : ''}`}
                              onClick={() =>
                                setXemLoiGiai((cu) => {
                                  const m = new Set(cu)
                                  if (m.has(khoa(x))) m.delete(khoa(x))
                                  else m.add(khoa(x))
                                  return m
                                })
                              }
                              style={{
                                background: mo ? 'var(--xanh-nen)' : undefined,
                                color: mo ? 'var(--xanh)' : undefined,
                                borderColor: mo ? 'var(--xanh)' : undefined,
                              }}
                            >
                              <Lightbulb size={15} /> {mo ? 'Ẩn lời giải' : 'Hiện lời giải'}
                            </button>
                            <label className={`dg-da-chua${x.daChuaLuc ? ' dg-da-chua--co' : ''}`}>
                              <input
                                type="checkbox"
                                checked={!!x.daChuaLuc || dangChua.has(khoa(x))}
                                disabled={!!x.daChuaLuc || dangChua.has(khoa(x)) || (daKetThuc && !x.daChuaLuc && t === 'bo')}
                                onChange={() => void daChua(x)}
                              />
                              <span>Thầy đã chữa{x.daChuaLuc ? ` · ${ngayNganVn(x.daChuaLuc)}` : ''}</span>
                            </label>
                          </div>
                          {mo && (
                            c ? (
                              <TheCauHienThi c={c} />
                            ) : (
                              <div className="dh-cau-de" style={{ marginTop: 8, fontStyle: 'italic' }}>
                                Chưa có câu này trong kho trên máy. Bấm Ngân hàng câu hỏi → Đồng bộ ngay.
                              </div>
                            )
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </div>
            ))}
          </>
        )}
      </section>

      {html && (
        <KhungXemPhieu
          html={html}
          ten="Tờ máy chiếu — Kiểm tra đầu giờ"
          dong={() => {
            dongPhien()
            setHtml('')
          }}
        />
      )}
    </div>
  )
}

// Một việc mỗi màn; receipt bất biến, phản hồi do em chủ động đọc và tiếp tục.
// 12/10 (thầy: "mục chữa lỗi hiển thị cho thật chuẩn để học sinh chữa lỗi được"): không còn trạng thái nào chỉ báo chữ rồi bỏ đó —
// đợt không có bước để làm (chờ học liệu, chờ chữa trên lớp, tạm khoá, câu vừa cập nhật, chờ lần gặp lại 2, đã tự sửa) ⇒ "Chữa trực tiếp
// câu gốc" (ChuaTrucTiep.tsx). Giao diện theo ngôn ngữ Hôm nay (.ht2): dải "Đường tự gỡ" có từng bước, khung làm bước, nút chính sát đáy.
// ĐỢT 18 (13/10 — thầy: "Tối ưu lại câu từ cho dễ hiểu … Bỏ hết các gợi ý hướng dẫn"): dòng phụ đầu màn là TÊN lối đang đi ("Sửa từng bước" /
// "Sửa trên câu gốc", chữ "sửa" như mục Tự sửa lỗi); bỏ lời dặn khi nghỉ; nút "Tiếp tục" gọn. Giữ nguyên "Cần gợi ý" (công cụ học, không phải hướng dẫn).
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  apiMoDot,
  apiPhatItem,
  apiNopItem,
  apiXinGoiY,
  apiGonMo,
  type KetQuaGon,
  type KetQuaDot,
  type KetQuaNop,
  type ItemCongKhai,
} from '../../lib/chua-cau-sai-api'
import { ChemText } from '../../lib/chem-format'
import OSoTraLoi from '../OSoTraLoi'
import { sinhMaNgauNhien } from '../../lib/thiet-bi'
import { khopPhanIII } from '../../lib/cham-so'
import TheCau from '../TheCau'
import { BangSoLieu, ZoomableImage } from '../QuestionMedia'
import ChuaTrucTiep, { propsCauLam } from './ChuaTrucTiep'
import ChuaGon from './ChuaGon'
import { KhungDuoSua, type TienDoSua } from './KhungDuoSua'
import { TrongManChua } from './trong-man-chua'
import { canChuaTrucTiep, henGapLai, LUAT_BAN_MOI } from '../../lib/chua-truc-tiep'
import { ghiXongHomNay } from '../../lib/tu-sua-viec-hom-nay'
import '../tu-luyen/tu-luyen.css'
import './chua-cau-sai.css'
// «Trong» 26/10 (nhóm 2): tờ trình bày styles/trong-lam-bai.css nạp RIÊNG, chỉ khi <html data-trong> (main.tsx gắn trước khi nạp màn) — không cộng byte lượt mở app.
if (typeof document !== 'undefined' && document.documentElement.dataset.trong) void import('../../styles/trong-lam-bai.css').catch(() => {})
export interface PropsChuaCauSai {
  token: string
  qid: string
  tenCau?: string
  onVe: () => void
  /** Nhãn nút rời màn khi em chữa xong / chưa làm được câu này (mặc định "Sang câu khác"). */
  nhanVe?: string
  /** Đợt 16 (12/10): câu mở thẳng KHÔNG có trong danh sách Tự chữa — lệnh mở đợt (`mo-dot`, y như cũ) không mở được thì giao lời báo cho màn
   *  gọi (về danh sách kèm lời báo thật) thay cho khung "Chưa mở được câu này". Vắng ⇒ như cũ. */
  onKhongMo?: (loi: string) => void
  /** Chữa câu gọn (25/10): sang câu kế của Việc hôm nay sau khi câu này khép. Vắng ⇒ nút về như cũ. */
  onTiep?: () => void
  /** Chỗ của câu trong chặng sửa hôm nay — màn kiểu Duolingo («Trong» HS, 27/10) vẽ thanh tiến độ + màn xong chặng. */
  tienDo?: TienDoSua
}
/** 28/10: câu KHÔNG mở được vì chính câu ấy (hỏng, không còn lỗi, thiếu học liệu, đổi bản, đang giữ cho ca…) ⇒ tính xong phần hôm nay, sang câu kế. */
const MA_CAU_HONG = new Set(['KHONG_MO_DUOC_CAU', 'KHONG_TIM_THAY', 'CHUA_CO_LOI', 'KHONG_CO_DOT', 'THIEU_HOC_LIEU', 'CAU_THAY_DOI', 'CHUA_CONG_BO', 'CAU_BI_BAO_VE', 'CHUA_DEN_HAN'])
/** Chặn CHUNG cả phần sửa (ca kiểm tra đang mở, Kiểm tra ôn tập chưa làm, tính năng tắt, phiên hết) ⇒ giữ khung báo lý do (sang câu kế cũng bị chặn y vậy). */
const MA_CHAN_CHUNG = new Set(['DANG_KIEM_TRA', 'KIEM_TRA_ON_TAP_TRUOC', 'FEATURE_TAT', 'CAN_DANG_NHAP', 'CHO_KIEM_QUYEN'])
/** Mã lỗi của lệnh gọn (máy chủ ĐÃ có đường gọn) ⇒ vẫn ở đường gọn để báo thật; mã khác / mất mạng ⇒ lối cũ. */
const MA_GON = new Set(['KHONG_MO_DUOC_CAU', 'KHONG_CO_DOT'])
function IconVe() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}
const tenPha: Record<string, string> = {
  chan_doan: 'Tìm chỗ vướng',
  phan_biet: 'Hiểu cách làm',
  kiem_ly_do: 'Vì sao cách này đúng?',
  kiem_lai: 'Tự làm',
  chuyen_giao: 'Thử điều vừa hiểu với bài mới',
  ghep_bai: 'Nối lại cả bài',
  kiem_chung: 'Lần gặp lại 2 · Tự làm bản mới',
}
function Nhap({
  item,
  value,
  onChange,
  khoa,
}: {
  item: ItemCongKhai
  value: string
  onChange: (v: string) => void
  khoa: boolean
}) {
  const chung = {
    cheDo: 'thi' as const,
    stt: 1,
    text: item.hoi,
    table: item.bang,
    hinhAnh: item.hinhAnh,
  }
  if (item.kieu === 'ds' && item.y?.length === 4)
    return (
      <div className="m3">
        <TheCau
          {...chung}
          phan="II"
          ideas={item.y as [string, string, string, string]}
          selected={Array.from({ length: 4 }, (_, i) =>
            value[i] === 'D' ? 'D' : value[i] === 'S' ? 'S' : null,
          )}
          onSelect={
            khoa
              ? undefined
              : (i, v) => {
                  const a = value.padEnd(4, '-').split('')
                  a[i] = v
                  onChange(a.join(''))
                }
          }
        />
      </div>
    )
  if (
    item.kieu === 'chon' &&
    item.luaChon?.length === 4 &&
    item.luaChon.every((x, i) => x.ky === 'ABCD'[i])
  )
    return (
      <div className="m3">
        <TheCau
          {...chung}
          phan="I"
          choices={
            item.luaChon.map((x) => x.noi) as [string, string, string, string]
          }
          choicePerm={[0, 1, 2, 3]}
          selected={value ? (value as 'A' | 'B' | 'C' | 'D') : null}
          onSelect={khoa ? undefined : onChange}
        />
      </div>
    )
  return (
    <div className="ccs-hoi">
      <div className="ccs-hoi-text">
        <ChemText text={item.hoi} />
      </div>
      {item.bang && <BangSoLieu table={item.bang} />}
      {item.hinhAnh?.map((h, i) => (
        <ZoomableImage key={i} src={h.src} alt={h.alt ?? 'Hình câu hỏi'} />
      ))}
      {item.kieu === 'so' ? (
        <div className="ccs-nhap-so">
          <OSoTraLoi
            value={value}
            onChange={onChange}
            disabled={khoa}
            ariaLabel="Câu trả lời của em"
            inputClassName="ccs-input"
          />
          {item.donVi && <ChemText text={item.donVi} />}
        </div>
      ) : (
        <fieldset className="ccs-nhom-chon" disabled={khoa}>
          <legend className="sr-only">Chọn câu trả lời</legend>
          {(item.kieu === 'ds'
            ? [
                { ky: 'D', noi: 'Đúng' },
                { ky: 'S', noi: 'Sai' },
              ]
            : (item.luaChon ?? [])
          ).map((l) => (
            <label
              className="ccs-chon-muc"
              data-chon={value === l.ky ? 'true' : 'false'}
              key={l.ky}
            >
              <input
                type="radio"
                name={item.id}
                value={l.ky}
                checked={value === l.ky}
                onChange={() => onChange(l.ky)}
              />
              <span className="ccs-chon-ky">{l.ky}</span>
              <ChemText text={l.noi} />
            </label>
          ))}
        </fieldset>
      )}
    </div>
  )
}
type LanNop = { attemptId: string; traLoi: string; itemId: string }
const khoaNop = (id: string) => `chua-nop:${id}`
function docNop(id: string): LanNop | null {
  try {
    return JSON.parse(localStorage.getItem(khoaNop(id)) ?? 'null')
  } catch {
    return null
  }
}
/** Kết quả phát kèm trong `mo-dot` (`phat: true`, 13/10) ⇒ đúng dạng `apiPhatItem` (kể cả lỗi, cùng lời như `loiCua` của API); vắng ⇒ null (gọi phat-item). */
function docPhatKem(v: unknown): KetQuaDot | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  if (o.ok) return o as unknown as KetQuaDot
  return { ok: false, loi: String(o.mo ?? o.error ?? 'Máy chủ chưa trả lời được. Em thử lại.'), ma: String(o.ma ?? '') }
}
export default function ManChuaCauSai({
  token,
  qid,
  tenCau,
  onVe,
  nhanVe = 'Sang câu khác',
  onKhongMo,
  onTiep,
  tienDo,
}: PropsChuaCauSai) {
  // «Trong» HS 27/10: đường gọn + lúc đang mở / báo lỗi vẽ khung Duo (ChuaGonDuo); lối cũ (từng bước, câu gốc) giữ như trước.
  const [duo] = useState(() => {
    const d = typeof document !== 'undefined' && document.documentElement.dataset.trong === 'hs'
    if (d) void import('./ChuaGonDuo').catch(() => {}) // nạp trước, song song lệnh mở đợt
    return d
  })
  const [ph, setPh] = useState<KetQuaDot | null>(null),
    [tai, setTai] = useState(true),
    [daXongSo, setDaXongSo] = useState<'' | 'dong' | 'chua_thay'>(''),
    [loi, setLoi] = useState(''),
    [tra, setTra] = useState(''),
    [hoi, setHoi] = useState<KetQuaNop | null>(null),
    [goi, setGoi] = useState(''),
    [ban, setBan] = useState(false),
    [cho, setCho] = useState<LanNop | null>(null),
    [lanTai, setLanTai] = useState(0),
    /** Chữa câu gọn (25/10): đợt mở được ⇒ một đường cho mọi câu (ChuaGon); máy chủ chưa có lệnh gọn ⇒ lối cũ như trước. */
    [gon, setGon] = useState<{ dotId: string; dau: KetQuaGon } | null>(null)
  const mucGoi = useRef(0)
  const khongMoRef = useRef(onKhongMo)
  khongMoRef.current = onKhongMo
  const song = useRef(true),
    buocRef = useRef<HTMLHeadingElement>(null),
    goiRef = useRef(0)
  /** 28/10 (thầy «Bỏ màn chưa sửa được câu này đi»): câu không mở được KHÔNG dừng ở khung lỗi (xem `xuLyKhongMo`). */
  const thuLai = useRef(0)
  /** Trả true khi đã xử lý (thử lại / sang câu kế); false ⇒ chặn chung, giữ khung báo lý do. */
  const xuLyKhongMoRef = useRef<(r: { ma?: string }) => boolean>(() => false)
  xuLyKhongMoRef.current = (r) => {
    const ma = r.ma ?? ''
    if (MA_CHAN_CHUNG.has(ma)) return false
    if (!MA_CAU_HONG.has(ma) && thuLai.current < 2) { thuLai.current++; window.setTimeout(() => { if (song.current) setLanTai((x) => x + 1) }, 800 * thuLai.current); return true }
    if (MA_CAU_HONG.has(ma)) ghiXongHomNay(qid)
    ;(onTiep ?? onVe)()
    return true
  }
  useEffect(() => { thuLai.current = 0 }, [qid])
  useEffect(() => {
    song.current = true
    return () => {
      song.current = false
    }
  }, [])
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !ban && !(duo && gon)) onVe() // màn sửa câu Duo tự lo Esc (tấm giữ chân / đóng lời giải)
    }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [onVe, ban, duo, gon])
  const ap = useCallback((r: KetQuaDot) => {
    setPh(r)
    setHoi(r.phanHoiTruoc ?? null)
    setGoi('')
    mucGoi.current = r.item?.mucHoTro ?? 0
    setLoi('')
    const c = r.item && !r.phanHoiTruoc ? docNop(r.item.id) : null
    if (r.item && r.phanHoiTruoc) {
      try {
        localStorage.removeItem(khoaNop(r.item.id))
      } catch {}
    }
    setCho(c)
    setTra(r.traLoiDaNop ?? c?.traLoi ?? '')
  }, [])
  useEffect(() => {
    let huy = false
    const n = ++goiRef.current
    ;(async () => {
      // 13/10 (thầy: "chỗ này mở câu quá lâu"): mở đợt + phát bước đầu MỘT lượt đi-về; máy chủ cũ không trả `phat` ⇒ gọi phat-item như trước.
      setDaXongSo('')
      setGon(null)
      // Chữa câu gọn (thầy 25/10): mở đợt KHÔNG phát bước đầu (đường gọn không dùng phiên từng bước) rồi xin bản làm lại.
      // 27/10 (thầy: «sửa lỗi chỗ mở câu phải tức thì»): mở đợt + mở bản làm lại MỘT lượt đi-về (`gon`); máy chủ cũ ⇒ gọi gon-mo như trước.
      const r = await apiMoDot(token, qid, undefined, false, true)
      const phat = docPhatKem(r.phat)
      if (huy || n !== goiRef.current) return
      // 24/10: sổ học đã đóng lỗi câu này (máy chủ trả «chưa có lỗi đang mở» kèm mã đợt) ⇒ tính xong phần hôm nay, không để chặng kẹt ở khung lỗi.
      if (!r.ok && r.ma === 'CHUA_CO_LOI' && r.dotId) {
        ghiXongHomNay(r.dotId)
        ghiXongHomNay(qid)
        setDaXongSo(r.daDong ? 'dong' : 'chua_thay')
        setTai(false)
        return
      }
      if (!r.ok || !r.dotId) {
        if (khongMoRef.current) {
          khongMoRef.current(r.loi ?? 'Chưa mở được câu chữa.')
          return
        }
        if (xuLyKhongMoRef.current(r)) return
        setLoi(r.loi ?? 'Chưa mở được câu chữa.')
        setTai(false)
        return
      }
      const g = r.gon ?? (await apiGonMo(token, r.dotId))
      if (huy || n !== goiRef.current) return
      if (g.ok || (g.ma && MA_GON.has(g.ma))) {
        setGon({ dotId: r.dotId, dau: g })
        setTai(false)
        return
      }
      const sau = phat ?? (await apiPhatItem(token, r.dotId))
      if (huy || n !== goiRef.current) return
      if (sau.ok) ap(sau)
      else if (xuLyKhongMoRef.current(sau)) return
      else setLoi(sau.loi ?? 'Chưa tải được câu chữa.')
      setTai(false)
    })()
    return () => {
      huy = true
    }
  }, [token, qid, ap, lanTai])
  const tiep = async (tiepDoan = false) => {
    if (!ph?.dotId || ban) return
    setBan(true)
    const r = await apiPhatItem(token, ph.dotId, true, tiepDoan)
    if (!song.current) return
    setBan(false)
    if (r.ok) {
      ap(r)
      requestAnimationFrame(() => buocRef.current?.focus())
    } else setLoi(r.loi ?? 'Chưa tải được bước tiếp.')
  }
  const nop = async () => {
    if (!ph?.item || !ph.dotId || ban || hoi) return
    const payload = cho ?? {
      attemptId: sinhMaNgauNhien(),
      traLoi: tra.trim(),
      itemId: ph.item.id,
    }
    if (
      !payload.traLoi ||
      (payload.traLoi.includes('-') && ph.item.kieu === 'ds')
    )
      return
    setCho(payload)
    try {
      localStorage.setItem(khoaNop(payload.itemId), JSON.stringify(payload))
    } catch {
      /* giữ trong bộ nhớ nếu trình duyệt không cho ghi */
    }
    setBan(true)
    setLoi('')
    const r = await apiNopItem(
      token,
      ph.dotId,
      payload.itemId,
      payload.traLoi,
      payload.attemptId,
    )
    if (!song.current) return
    setBan(false)
    if (!r.ok) {
      if (r.ma === 'CAU_TRA_LOI_CHUA_HOP_LE') {
        setCho(null)
        try {
          localStorage.removeItem(khoaNop(payload.itemId))
        } catch {}
      }
      setLoi(r.loi ?? 'Chưa lưu được. Em thử gửi lại đúng câu trả lời này.')
      return
    }
    try {
      localStorage.removeItem(khoaNop(payload.itemId))
    } catch {}
    setCho(null)
    // Việc hôm nay (thầy 20/10): nộp xong chặng cuối làm được hôm nay (ghép xong / tự sửa xong / hết sức mà vướng) ⇒ ghi trên máy em.
    if (r.trangThaiMoi === 'cho_gap_lai_2' || r.trangThaiMoi === 'da_tu_sua' || r.trangThaiMoi === 'can_thay') ghiXongHomNay(ph.dotId)
    setHoi(r)
  }
  const xin = async () => {
    if (!ph?.item || !ph.dotId || ban || hoi || cho) return
    setBan(true)
    const r = await apiXinGoiY(
      token,
      ph.dotId,
      ph.item.id,
      Math.min(3, mucGoi.current + 1),
    )
    if (!song.current) return
    setBan(false)
    if (r.ok) {
      setGoi(r.noiDungGoiY ?? '')
      mucGoi.current = r.mucHoTro ?? mucGoi.current
    } else setLoi(r.loi ?? 'Chưa mở được gợi ý.')
  }
  const phanHoi = hoi ?? ph?.phanHoiTruoc,
    soBuoc = ph?.tienDoChiTiet?.length ?? ph?.tienDo?.soBuocCanKiem ?? 0,
    soBuocDaQua = ph?.tienDoChiTiet?.filter(
      (x) => x.trangThai === 'co_bang_chung_hieu_trong_phien',
    ).length ?? ph?.tienDo?.soBuocDaQua ?? 0
  const trucTiep = !tai && canChuaTrucTiep(ph)
  const loiThay = ph?.loiThay ? (
    <aside className="ccs-goi-y">
      <strong>Thầy cùng em gỡ</strong>
      <ChemText text={ph.loiThay} />
    </aside>
  ) : null
  const cauGocDe =
    ph?.cauGoc && ['I', 'II', 'III'].includes(ph.cauGoc.phan) && ph.cauGoc.text
      ? propsCauLam({ ...ph.cauGoc, phan: ph.cauGoc.phan as 'I' | 'II' | 'III', hinhAnh: ph.cauGoc.hinhAnh as { src: string; viTri: string; alt?: string }[] | undefined }, '')
      : null
  if (duo && (tai || gon || !ph)) {
    const pctDau = tienDo ? Math.round((100 * Math.min(tienDo.xong, tienDo.tong)) / Math.max(1, tienDo.tong)) : 0
    if (gon && !tai) return <ChuaGon key={gon.dotId} token={token} qid={qid} dotId={gon.dotId} dau={gon.dau} nhanVe={nhanVe} onVe={onVe} onTiep={onTiep} tienDo={tienDo} />
    const thuLai = () => { setTai(true); setLoi(''); setLanTai((x) => x + 1) }
    return (
      <KhungDuoSua onVe={onVe} khoaVe={ban} pct={pctDau} nhanThanh={tienDo ? `Chặng ${tienDo.so} · đã sửa ${tienDo.xong}/${tienDo.tong} câu` : 'Sửa câu này'}
        day={tai ? null : <div className="duo-day"><div className="duo-giua">
          {daXongSo ? <button type="button" className="duo-nut" onClick={onVe}>{nhanVe}</button>
            : <><button type="button" className="duo-nut" onClick={thuLai}>Thử lại</button><div className="duo-bo"><button type="button" className="duo-lien" onClick={onVe}>{nhanVe}</button></div></>}
        </div></div>}>
        {tai ? <div className="ht2-lam-the ht2-lam-cho" role="status"><span className="chu-cho-tre">Đang mở câu…</span></div>
          : <section className="duo-sua-bao" data-tt={daXongSo ? 'dung' : 'loi'}>
            <span className="duo-sua-dau" aria-hidden="true">{daXongSo ? <svg viewBox="0 0 24 24" width="40" height="40"><path d="M5 12.5 10 17.5 19 7" /></svg> : <svg viewBox="0 0 24 24" width="40" height="40"><path d="M12 7v6M12 17h.01" /></svg>}</span>
            <h1 ref={buocRef} tabIndex={-1}>{daXongSo === 'dong' ? 'Câu này không cần sửa nữa' : daXongSo ? 'Câu này tạm chưa cần sửa' : 'Chưa mở được câu này'}</h1>
            <p role={daXongSo ? 'status' : 'alert'}>{daXongSo === 'dong' ? 'Câu này không còn lỗi nào cần sửa. Thầy tính xong phần của em ở câu này.'
              : daXongSo ? 'Câu này tạm chưa có lỗi nào cần sửa. Em sang câu khác nhé, thầy tính xong phần của em ở câu này.' : loi || 'Chưa mở được câu chữa.'}</p>
          </section>}
      </KhungDuoSua>
    )
  }
  return (
    <TrongManChua.Provider value={true}>
    <div className="tlu ccs" data-tuyen={gon ? 'gon' : trucTiep ? 'truc-tiep' : 'tung-buoc'} aria-label="Chữa câu sai">
      <header className="ccs-dau">
        <button
          className="ccs-ve"
          type="button"
          onClick={onVe}
          disabled={ban}
          aria-label="Quay lại"
        >
          <IconVe />
          <span className="ccs-ve-chu" aria-hidden="true">Quay lại</span>
        </button>
        <div className="ccs-dau-giua">
          <h1 className="ccs-tieu">{tenCau ?? 'Sửa câu này'}</h1>
          <span className="ccs-nhan-trang-thai">
            {gon ? 'Sửa câu sai' : trucTiep ? 'Sửa trên câu gốc' : 'Sửa từng bước'}
          </span>
        </div>
        {soBuoc > 0 && !trucTiep && !gon && (
          <div
            className="ccs-dau-tien-do"
            aria-label={`Đã hiểu ${soBuocDaQua} trong ${soBuoc} bước`}
          >
            <strong>{soBuocDaQua}/{soBuoc}</strong>
            <span>bước đã hiểu</span>
          </div>
        )}
      </header>
      <main className="ccs-than">
        {tai ? (
          <div className="ccs-dang-tai chu-cho-tre" role="status">
            <span className="ccs-dang-tai-vong" aria-hidden="true" />
            <strong>Đang mở câu…</strong>
          </div>
        ) : gon ? (
          <ChuaGon key={gon.dotId} token={token} qid={qid} dotId={gon.dotId} dau={gon.dau} nhanVe={nhanVe} onVe={onVe} onTiep={onTiep} tienDo={tienDo} />
        ) : trucTiep && ph ? (
          <ChuaTrucTiep
            token={token}
            qid={qid}
            ph={ph}
            ban={ban}
            nhanVe={nhanVe}
            onVe={onVe}
            onLamGapLai={() => void tiep()}
            dau={
              <>
                {loiThay}
                {loi && (
                  <div className="ccs-loi" role="alert">
                    <p>{loi}</p>
                  </div>
                )}
              </>
            }
          />
        ) : !ph ? (
          daXongSo ? (
            <section className="ccs-khu-lam ccs-khu-loi" aria-label="Câu đã sửa xong">
              <div className="ccs-trang-thai">
                <h2 ref={buocRef} tabIndex={-1}>{daXongSo === 'dong' ? 'Câu này không cần sửa nữa' : 'Câu này tạm chưa cần sửa'}</h2>
                <p role="status">
                  {daXongSo === 'dong'
                    ? 'Câu này không còn lỗi nào cần sửa. Thầy tính xong phần của em ở câu này.'
                    : 'Câu này tạm chưa có lỗi nào cần sửa. Em sang câu khác nhé, thầy tính xong phần của em ở câu này.'}
                </p>
              </div>
              <div className="ccs-hang-nut ccs-day">
                <button type="button" className="ccs-nut-chinh" onClick={onVe}>
                  {nhanVe}
                </button>
              </div>
            </section>
          ) : (
          <section className="ccs-khu-lam ccs-khu-loi" aria-label="Chưa mở được câu chữa">
            <div className="ccs-trang-thai">
              <h2 ref={buocRef} tabIndex={-1}>Chưa mở được câu này</h2>
              <p role="alert">{loi || 'Chưa mở được câu chữa.'}</p>
            </div>
            <div className="ccs-hang-nut ccs-day">
              <button type="button" className="ccs-nut-chinh" onClick={() => { setTai(true); setLoi(''); setLanTai((x) => x + 1) }}>
                Thử lại
              </button>
              <button type="button" className="ccs-nut-phu" onClick={onVe}>
                {nhanVe}
              </button>
            </div>
          </section>
          )
        ) : (
          <div className="ccs-bo-cuc" data-tuyen="tung-buoc">
            <aside className="ccs-cot-phu" aria-label="Tiến độ và đề gốc">
              <section className="ccs-the-tien-do">
                <div className="ccs-the-tien-do-dau">
                  <span>Đường tự gỡ</span>
                  {soBuoc > 0 && <strong className="ccs-so">{soBuocDaQua}/{soBuoc} bước</strong>}
                </div>
                {ph.tienDoChiTiet && ph.tienDoChiTiet.length > 0 ? (
                  <ol className="ccs-lo-trinh" aria-label="Những bước đã kiểm">
                    {ph.tienDoChiTiet.map((x, i) => (
                      <li
                        key={x.buocId}
                        data-da={x.trangThai === 'co_bang_chung_hieu_trong_phien'}
                        data-hien-tai={
                          x.trangThai !== 'co_bang_chung_hieu_trong_phien' &&
                          i === soBuocDaQua
                        }
                        aria-current={
                          x.trangThai !== 'co_bang_chung_hieu_trong_phien' && i === soBuocDaQua ? 'step' : undefined
                        }
                      >
                        <span aria-hidden="true">
                          {x.trangThai === 'co_bang_chung_hieu_trong_phien'
                            ? '✓'
                            : i + 1}
                        </span>
                        <b>{x.tieuDe}</b>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="ccs-the-tien-do-trong">
                    Bước sẽ hiện sau khi tìm ra chỗ vướng.
                  </p>
                )}
              </section>
              {cauGocDe && (
                <details className="ccs-cau-goc">
                  <summary>
                    <span>Xem lại đề gốc</span>
                    <span aria-hidden="true">＋</span>
                  </summary>
                  <div className="ccs-cau-goc-noi m3">
                    {/* Thầy 13/10: Hỏi thầy ở mọi câu — đề gốc của câu đang chữa (Thầy gợi hướng). */}
                    <TheCau {...cauGocDe} hoiThay={{ qid, nguon: 'tu_chua' }} />
                  </div>
                </details>
              )}
            </aside>
            <section className="ccs-khu-lam" aria-label="Bước đang luyện">
              {loiThay}
              {ph.canNghi ? (
                <section className="ccs-trang-thai">
                  <h2 ref={buocRef} tabIndex={-1}>
                    Mình nghỉ một chút nhé
                  </h2>
                  <p>Những bước em đã hiểu đã được lưu.</p>
                  <div className="ccs-hang-nut ccs-day">
                    <button
                      className="ccs-nut-chinh"
                      onClick={() => void tiep(true)}
                      disabled={ban}
                    >
                      Làm tiếp một đoạn
                    </button>
                  </div>
                </section>
              ) : (
                ph.item && (
                  <div className="ccs-bai-lam">
                    <div className="ccs-bai-lam-dau">
                      <p className="ccs-ghi">
                        {ph.item.loai === 'kiem_chung'
                          ? `Lần gặp lại ${ph.lanGapLai ?? 2} · Tự làm bản mới`
                          : (tenPha[ph.item.loai] ?? 'Cùng sửa một bước')}
                      </p>
                      <h2
                        className="ccs-buoc-text"
                        tabIndex={-1}
                        ref={buocRef}
                      >
                        {ph.item.tieuDe}
                      </h2>
                      {ph.item.loai === 'kiem_chung' && !phanHoi && (
                        <p className="ccs-luat">{LUAT_BAN_MOI}</p>
                      )}
                    </div>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        void nop()
                      }}
                    >
                    <Nhap
                      item={ph.item}
                      value={tra}
                      onChange={setTra}
                      khoa={ban || !!phanHoi || !!cho}
                    />
                    {goi && (
                      <aside className="ccs-goi-y" role="status">
                        <strong>Một gợi mở</strong>
                        <ChemText text={goi} />
                      </aside>
                    )}
                    {phanHoi && (
                      <section
                        className="ccs-phan-hoi"
                        data-dung={phanHoi.dung}
                        role="status"
                        aria-live="polite"
                      >
                        <h3>
                          {phanHoi.trangThaiMoi === 'da_tu_sua'
                            ? 'Em đã tự sửa xong câu này'
                            : phanHoi.trangThaiMoi === 'cho_gap_lai_2'
                              ? 'Em đã ghép lại xong cả bài'
                              : phanHoi.dung
                                ? 'Bước này em làm được rồi'
                                : 'Ta đã thấy chỗ cần gỡ'}
                        </h3>
                        {[
                          phanHoi.phanGiuDuoc,
                          phanHoi.giaThiet,
                          phanHoi.diemlech,
                          phanHoi.hanhDongTiep,
                        ]
                          .filter(Boolean)
                          .map((t, i) => (
                            <p key={i}>
                              <ChemText text={t!} />
                            </p>
                          ))}
                        {phanHoi.trangThaiMoi === 'cho_gap_lai_2' && henGapLai(phanHoi.denHan, Date.now()) && (
                          <p>
                            Bản mới mở lúc <b>{henGapLai(phanHoi.denHan, Date.now())!.luc}</b>.
                          </p>
                        )}
                        {phanHoi.dieuCanHieu && (
                          <details>
                            <summary>Hiểu bước này trong bài</summary>
                            {phanHoi.dieuCanHieu &&
                              Object.values(phanHoi.dieuCanHieu).map((t, i) => (
                                <p key={i}>
                                  <ChemText text={t} />
                                </p>
                              ))}
                          </details>
                        )}
                      </section>
                    )}
                    <div className="ccs-hang-nut ccs-day">
                      {phanHoi ? (
                        <button
                          type="button"
                          className="ccs-nut-chinh"
                          disabled={ban}
                          onClick={() => void tiep()}
                        >
                          Tiếp tục
                        </button>
                      ) : (
                        <>
                          <button
                            type="submit"
                            className="ccs-nut-chinh"
                            disabled={
                              ban ||
                              !tra.trim() ||
                              (ph.item.kieu === 'so' &&
                                !khopPhanIII(tra, tra)) ||
                              (ph.item.kieu === 'ds' && tra.includes('-'))
                            }
                          >
                            {ban
                              ? 'Đang lưu…'
                              : cho
                                ? 'Gửi lại câu trả lời đã giữ'
                                : 'Tự thử lại'}
                          </button>
                          {!['ghep_bai', 'kiem_chung'].includes(
                            ph.item.loai,
                          ) && (
                            <button
                              type="button"
                              className="ccs-nut-phu"
                              disabled={ban || !!cho}
                              onClick={() => void xin()}
                            >
                              Cần gợi ý
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    </form>
                  </div>
                )
              )}
              {loi && (
                <div className="ccs-loi" role="alert">
                  <p>{loi}</p>
                  <button
                    className="ccs-nut-phu"
                    onClick={() => void tiep()}
                    disabled={ban}
                  >
                    Tải lại tiến độ
                  </button>
                </div>
              )}
              <button
                type="button"
                className="ccs-nut-phu ccs-nghi"
                onClick={onVe}
                disabled={ban}
              >
                Lưu và nghỉ
              </button>
            </section>
          </div>
        )}
      </main>
    </div>
    </TrongManChua.Provider>
  )
}

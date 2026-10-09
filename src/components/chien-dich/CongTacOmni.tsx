// CÀI ĐẶT · OMNI 3 (thầy chốt 05/10) — đặt CẠNH công tắc Game Hóa 2.0 sẵn có, cùng kiểu thẻ (`TheNoiDung`) + nhóm nút chọn (`cd-cong-tac`).
//   · Thẻ "OMNI (theo lớp)": Tắt · Bật theo lớp (chip chọn lớp từ `/gv/lop`; máy chủ chưa có tên lớp ⇒ ô gõ, cách nhau bằng dấu phẩy) ⇒ `/gv/omni co-luu`.
//     Danh sách SBD chạy thử (nếu máy chủ đang có) được GIỮ khi lưu theo lớp. Bật/tắt đổi lại được ngay ⇒ không hỏi lại (luật C8).
//   · Thẻ "Số lượt mỗi ngày và ma trận đề thi": số lượt câu mỗi ngày mặc định theo lớp (chữ chuẩn A2 — app thầy không dùng chữ "thể lực") và
//     ma trận đề thi 2026 (Phần I / II / III) ⇒ `/gv/omni cau-hinh-doc` / `cau-hinh-luu`. Ô để trống = mặc định 40 lượt/ngày và 18 · 4 · 6 câu.
// Máy chủ chưa có lệnh / từ chối ⇒ hiện ĐÚNG lời máy chủ trong thẻ, nút lưu tắt; các thẻ khác của Cài đặt không đổi.
import { useEffect, useMemo, useState } from 'react'
import { THAM_SO_OMNI, type CoOmni } from '../../../server/src/omni-kieu'
import { TEN_AI } from '../../lib/omni-chu'
import { layLopThay, type LopThay } from '../../lib/ten-lop-thay'
import { useAppStore } from '../../store/appStore'
import { TheNoiDung } from '../DesignSystem'
import { docCauHinhOmni, docCoOmni, luuCauHinhOmni, luuCoOmni, type CauHinhOmni, type MaTranThi } from './api-omni'
import './chien-dich.css'

type CheDo = 'tat' | 'lop'
/** Chặn số vô nghĩa — cùng trần ô "Số lượt câu mỗi ngày" của màn Giao chiến dịch. */
const LUOT_TOI_DA = 500
const MA_TRAN_TOI_DA = 60
const TEN_PHAN: { k: keyof MaTranThi; ten: string }[] = [
  { k: 'I', ten: 'Phần I · Trắc nghiệm' },
  { k: 'II', ten: 'Phần II · Đúng–sai' },
  { k: 'III', ten: 'Phần III · Trả lời ngắn' },
]
const tachLop = (s: string): string[] => [...new Set(s.split(/[,;]+/).map((x) => x.trim()).filter(Boolean))]
const soNguyenTu = (s: string): number | null => {
  if (!s.trim()) return null
  const n = Number(s)
  return Number.isInteger(n) ? n : NaN
}

/** Chữ trạng thái công tắc: "tắt" · "bật cho lớp 12A1, 12A2" · "bật cả trung tâm" · kèm "chạy thử N em" nếu có danh sách SBD. */
export function chuTrangThaiOmni(co: CoOmni | null): string {
  if (!co) return 'đang đọc…'
  if (!co.bat) return 'tắt'
  const thu = co.sbd.length ? ` · chạy thử ${co.sbd.length} em` : ''
  if (co.lop.length) return `bật cho lớp ${co.lop.join(', ')}${thu}`
  return co.sbd.length ? `chạy thử ${co.sbd.length} em` : 'bật cả trung tâm'
}

export default function CongTacOmni() {
  const showToast = useAppStore((s) => s.showToast)
  const [co, setCo] = useState<CoOmni | null>(null)
  const [loiDoc, setLoiDoc] = useState('')
  const [cheDo, setCheDo] = useState<CheDo>('tat')
  const [lopChon, setLopChon] = useState<string[]>([])
  const [lopGo, setLopGo] = useState('')
  const [dsLop, setDsLop] = useState<LopThay[] | null>(null)
  const [dangLuu, setDangLuu] = useState(false)
  const [loiLuu, setLoiLuu] = useState('')

  useEffect(() => {
    let song = true
    void docCoOmni().then((r) => {
      if (!song) return
      if (!r.ok) {
        setLoiDoc(r.chu)
        return
      }
      setCo(r.du)
      setCheDo(r.du.bat && (r.du.lop.length || !r.du.sbd.length) ? 'lop' : 'tat')
      setLopChon(r.du.lop)
      setLopGo(r.du.lop.join(', '))
    })
    void layLopThay().then((r) => {
      if (song) setDsLop(r.ok ? r.du.lop : [])
    })
    return () => {
      song = false
    }
  }, [])

  const coChip = (dsLop?.length ?? 0) > 0
  const lopMoi = coChip ? lopChon : tachLop(lopGo)
  const moi: CoOmni = cheDo === 'tat' ? { bat: false, lop: [], sbd: [] } : { bat: true, lop: lopMoi, sbd: co?.sbd ?? [] }
  const thieuLop = cheDo === 'lop' && lopMoi.length === 0
  const hienTai: CoOmni = co?.bat ? co : { bat: false, lop: [], sbd: [] }
  const khongDoi = JSON.stringify({ ...moi, lop: [...moi.lop].sort() }) === JSON.stringify({ ...hienTai, lop: [...hienTai.lop].sort() })

  const luu = async () => {
    if (dangLuu || thieuLop || khongDoi || !co) return
    setDangLuu(true)
    setLoiLuu('')
    const r = await luuCoOmni(moi)
    setDangLuu(false)
    if (!r.ok) {
      setLoiLuu(r.chu)
      return
    }
    setCo(r.du)
    showToast(moi.bat ? `Đã bật OMNI cho lớp ${moi.lop.join(', ')}` : 'Đã tắt OMNI — các lớp chạy như cũ', 'success')
  }
  const doiLop = (ten: string) => setLopChon((cu) => (cu.includes(ten) ? cu.filter((x) => x !== ten) : [...cu, ten]))

  return (
    <>
      <TheNoiDung>
        <h2 style={{ fontSize: 'var(--cx-3)', fontWeight: 700, marginBottom: 'var(--k2)' }}>OMNI (theo lớp)</h2>
        <p style={{ marginBottom: 'var(--k3)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }}>
          Thầy tick bài vừa dạy ở Hành trình › Dạy học › Bài hôm nay; {TEN_AI} tự giao luyện theo bài, lập Bảng bài, chấm Chứng chỉ Sẵn sàng 8+ và gom danh sách Cần thầy
          chữa. Bật theo lớp để chạy thử trước. Đang: <b data-trang-thai-omni>{loiDoc && !co ? 'chưa đọc được' : chuTrangThaiOmni(co)}</b>.
        </p>
        <div role="radiogroup" aria-label="OMNI (theo lớp)" className="cd-cong-tac">
          {(
            [
              ['tat', 'Tắt'],
              ['lop', 'Bật theo lớp'],
            ] as const
          ).map(([v, ten]) => (
            <button key={v} type="button" role="radio" aria-checked={cheDo === v} disabled={!co} onClick={() => setCheDo(v)} className={`m3-nut-chu${cheDo === v ? ' m3-nut-tonal' : ' m3-nut-vien'}`}>
              {ten}
            </button>
          ))}
        </div>
        {cheDo === 'lop' &&
          co &&
          (coChip ? (
            <div className="cd-hang-chip" role="group" aria-label="Lớp bật OMNI" style={{ marginTop: 'var(--k3)' }}>
              {dsLop!.map((l) => (
                <button key={l.tenLop} type="button" className="cd-chip" aria-pressed={lopChon.includes(l.tenLop)} onClick={() => doiLop(l.tenLop)}>
                  {l.tenLop} · {l.soEm} em
                </button>
              ))}
              {lopChon
                .filter((t) => !dsLop!.some((l) => l.tenLop === t))
                .map((t) => (
                  <button key={t} type="button" className="cd-chip" aria-pressed onClick={() => doiLop(t)}>
                    {t}
                  </button>
                ))}
            </div>
          ) : (
            <label className="cd-truong" style={{ marginTop: 'var(--k3)' }}>
              Các lớp bật (cách nhau bằng dấu phẩy)
              <input type="text" value={lopGo} placeholder="12A1, 12 - Tinh Hoa" onChange={(e) => setLopGo(e.target.value)} />
            </label>
          ))}
        {cheDo === 'lop' && co && thieuLop && (
          <small className="cd-phu" style={{ display: 'block', marginTop: 'var(--k2)' }}>
            Chọn ít nhất một lớp.
          </small>
        )}
        {(loiLuu || (loiDoc && !co)) && (
          <p className="cd-loi" role="alert" style={{ marginTop: 'var(--k2)' }}>
            {loiLuu || loiDoc}
          </p>
        )}
        <div className="cd-hang-nut" style={{ marginTop: 'var(--k3)' }}>
          <button type="button" className="m3-nut-chinh" disabled={!co || dangLuu || khongDoi || thieuLop} onClick={() => void luu()}>
            {dangLuu ? 'Đang lưu…' : moi.bat ? 'Lưu và bật OMNI' : 'Lưu và tắt OMNI'}
          </button>
        </div>
      </TheNoiDung>
      {!(loiDoc && !co) && <CauHinhOmniThe dsLop={dsLop} />}
    </>
  )
}

/** Thẻ số lượt mặc định theo lớp + ma trận đề thi 2026. */
function CauHinhOmniThe({ dsLop }: { dsLop: LopThay[] | null }) {
  const showToast = useAppStore((s) => s.showToast)
  const [ch, setCh] = useState<CauHinhOmni | null>(null)
  const [loi, setLoi] = useState('')
  const [luot, setLuot] = useState<Record<string, string>>({})
  const [maTran, setMaTran] = useState<Record<keyof MaTranThi, string>>({ I: '', II: '', III: '' })
  const [dangLuu, setDangLuu] = useState(false)
  const [loiLuu, setLoiLuu] = useState('')

  useEffect(() => {
    let song = true
    void docCauHinhOmni().then((r) => {
      if (!song) return
      if (!r.ok) {
        setLoi(r.chu)
        return
      }
      setCh(r.du)
      setLuot(Object.fromEntries(Object.entries(r.du.theLucLop).map(([k, v]) => [k, String(v)])))
      setMaTran(r.du.maTran ? { I: String(r.du.maTran.I), II: String(r.du.maTran.II), III: String(r.du.maTran.III) } : { I: '', II: '', III: '' })
    })
    return () => {
      song = false
    }
  }, [])

  // Lớp hiện ô: danh sách lớp của thầy + lớp đã có số trên máy chủ (lớp cũ không còn trong danh sách vẫn sửa được).
  const tenLop = useMemo(() => [...new Set([...(dsLop ?? []).map((l) => l.tenLop), ...Object.keys(ch?.theLucLop ?? {})])], [dsLop, ch])
  const loiLuot = tenLop.filter((t) => {
    const n = soNguyenTu(luot[t] ?? '')
    return n !== null && (Number.isNaN(n) || n < 1 || n > LUOT_TOI_DA)
  })
  const soMaTran = TEN_PHAN.map(({ k }) => soNguyenTu(maTran[k]))
  const maTranTrong = soMaTran.every((n) => n === null)
  const maTranLoi = !maTranTrong && soMaTran.some((n) => n === null || Number.isNaN(n) || n < 0 || n > MA_TRAN_TOI_DA)
  const maTranRong = !maTranTrong && !maTranLoi && soMaTran.every((n) => n === 0)
  const theLucLop = Object.fromEntries(tenLop.map((t) => [t, soNguyenTu(luot[t] ?? '')]).filter((x): x is [string, number] => typeof x[1] === 'number' && !Number.isNaN(x[1])))
  // Ma trận gửi đi: ba ô hợp lệ ⇒ đúng số đó; xoá trắng cả ba khi máy chủ đang có ma trận ⇒ về mặc định 18 · 4 · 6; còn lại ⇒ không gửi.
  const maTranGui: MaTranThi | null = maTranTrong
    ? ch?.maTran
      ? { I: THAM_SO_OMNI.KHUNG_DE.I, II: THAM_SO_OMNI.KHUNG_DE.II, III: THAM_SO_OMNI.KHUNG_DE.III }
      : null
    : maTranLoi || maTranRong
      ? null
      : { I: soMaTran[0]!, II: soMaTran[1]!, III: soMaTran[2]! }
  const daDoi =
    !!ch &&
    (JSON.stringify(Object.entries(theLucLop).sort()) !== JSON.stringify(Object.entries(ch.theLucLop).sort()) ||
      (maTranGui !== null && JSON.stringify(maTranGui) !== JSON.stringify(ch.maTran)))
  const duocLuu = !!ch && daDoi && !loiLuot.length && !maTranLoi && !maTranRong && !dangLuu

  const luu = async () => {
    if (!duocLuu) return
    setDangLuu(true)
    setLoiLuu('')
    const r = await luuCauHinhOmni({ theLucLop, ...(maTranGui ? { maTran: maTranGui } : {}) })
    setDangLuu(false)
    if (!r.ok) {
      setLoiLuu(r.chu)
      return
    }
    setCh({ theLucLop, maTran: maTranGui ?? ch?.maTran ?? null })
    showToast('Đã lưu số lượt mỗi ngày theo lớp và ma trận đề thi', 'success')
  }

  return (
    <TheNoiDung>
      <h2 style={{ fontSize: 'var(--cx-3)', fontWeight: 700, marginBottom: 'var(--k2)' }}>Số lượt mỗi ngày và ma trận đề thi (OMNI)</h2>
      <p style={{ marginBottom: 'var(--k3)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }}>
        Dùng khi tick bài: số lượt câu mỗi ngày của mỗi em trong lớp, và khung đề thi để {TEN_AI} dự báo điểm, rút ca chốt. Ô để trống = mặc định.
      </p>
      {!ch ? (
        loi ? (
          <p className="cd-loi" role="alert">
            {loi}
          </p>
        ) : (
          <p className="cd-phu" aria-busy="true">
            Đang đọc cấu hình…
          </p>
        )
      ) : (
        <div className="flex flex-col" style={{ gap: 'var(--k4)' }}>
          <fieldset className="cd-khung-tron" data-khoi="luot-theo-lop">
            <legend className="cd-nhan-nhom">Số lượt câu mỗi ngày mặc định theo lớp (một em)</legend>
            {tenLop.length === 0 ? (
              <p className="cd-phu">Chưa có danh sách lớp — mọi lớp dùng {THAM_SO_OMNI.THE_LUC_MAC_DINH} lượt/ngày.</p>
            ) : (
              <div className="cd-luoi-2" style={{ marginTop: 'var(--k2)' }}>
                {tenLop.map((t) => (
                  <label key={t} className="cd-truong">
                    {t}
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={LUOT_TOI_DA}
                      value={luot[t] ?? ''}
                      placeholder={String(THAM_SO_OMNI.THE_LUC_MAC_DINH)}
                      onChange={(e) => setLuot((cu) => ({ ...cu, [t]: e.target.value }))}
                    />
                    <small className="cd-so">{loiLuot.includes(t) ? `Số nguyên từ 1 đến ${LUOT_TOI_DA}` : 'lượt/ngày'}</small>
                  </label>
                ))}
              </div>
            )}
          </fieldset>
          <fieldset className="cd-khung-tron" data-khoi="ma-tran-thi">
            <legend className="cd-nhan-nhom">Ma trận đề thi 2026 (Phần I/II/III)</legend>
            <div className="cd-luoi-2" style={{ marginTop: 'var(--k2)' }}>
              {TEN_PHAN.map(({ k, ten }) => (
                <label key={k} className="cd-truong">
                  {ten}
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={MA_TRAN_TOI_DA}
                    value={maTran[k]}
                    placeholder={String(THAM_SO_OMNI.KHUNG_DE[k])}
                    onChange={(e) => setMaTran((cu) => ({ ...cu, [k]: e.target.value }))}
                  />
                  <small className="cd-so">câu</small>
                </label>
              ))}
            </div>
            <small className="cd-phu">
              {maTranLoi
                ? `Nhập đủ ba phần, mỗi phần là số nguyên từ 0 đến ${MA_TRAN_TOI_DA}.`
                : maTranRong
                  ? 'Đề phải có ít nhất một câu.'
                  : `Để trống cả ba = ${THAM_SO_OMNI.KHUNG_DE.I} · ${THAM_SO_OMNI.KHUNG_DE.II} · ${THAM_SO_OMNI.KHUNG_DE.III} câu.`}
            </small>
          </fieldset>
          {loiLuu && (
            <p className="cd-loi" role="alert">
              {loiLuu}
            </p>
          )}
          <div className="cd-hang-nut">
            <button type="button" className="m3-nut-chinh" disabled={!duocLuu} onClick={() => void luu()}>
              {dangLuu ? 'Đang lưu…' : 'Lưu số lượt và ma trận'}
            </button>
          </div>
        </div>
      )}
    </TheNoiDung>
  )
}

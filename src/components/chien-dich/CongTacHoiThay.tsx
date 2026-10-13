// CÀI ĐẶT · HỎI THẦY (AI) — thầy 13/10: "Có nên tạo 1 nút reset lượt hỏi thầy để tôi chủ động reset được không?" ⇒ "chốt build";
// "hiển thị đẹp và tinh tế, không được dít chữ".
//   · Trần lượt hiện tại (đọc từ máy chủ): mỗi em N câu/ngày, mỗi câu bài tập M lần/ngày.
//   · Đặt lại lượt hỏi hôm nay của MỘT em: gõ SBD ⇒ "Xem lượt" (em đã hỏi bao nhiêu câu hôm nay) ⇒ "Đặt lại lượt hỏi hôm nay".
//     Máy chủ không xoá sổ, chỉ thôi đếm các lượt hôm nay (`/gv/hoi-tro-ly/dat-lai`). Đổi lại được bất cứ lúc nào ⇒ không hỏi lại (luật C8).
//   · SBD thử không giới hạn lượt hỏi: cho máy thầy thử; học sinh thật vẫn theo trần (`/gv/hoi-tro-ly/sbd-thu`).
// Máy chủ từ chối / chưa có lệnh ⇒ hiện ĐÚNG lời máy chủ ngay cạnh ô vừa dùng; các thẻ khác của Cài đặt không đổi.
import { useEffect, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { datLaiLuotHoiThay, docLuotHoiThay, doiSbdThuHoiThay, type LuotHoiThay } from '../../lib/hoi-thay-gv-api'
import { useAppStore } from '../../store/appStore'
import { TheNoiDung } from '../DesignSystem'
import './chien-dich.css'

const SBD_HOP_LE = /^[0-9A-Za-z_-]{3,32}$/
const TIEU_DE_PHU = { fontSize: 'var(--cx-2)', fontWeight: 700, margin: '0 0 var(--k2)' } as const
const HANG = { display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--k2) var(--k3)' } as const
const VACH = { height: 1, background: 'var(--vien)', margin: 'var(--k4) 0' } as const

export default function CongTacHoiThay() {
  const showToast = useAppStore((s) => s.showToast)
  const [luot, setLuot] = useState<LuotHoiThay | null>(null)
  const [sbd, setSbd] = useState('')
  const [em, setEm] = useState<LuotHoiThay | null>(null)
  const [sbdThuMoi, setSbdThuMoi] = useState('')
  const [dang, setDang] = useState<'' | 'xem' | 'dat-lai' | 'thu'>('')
  // Lỗi hiện NGAY CẠNH ô vừa dùng (chuẩn giao diện mục 13): `loi` cho phần đặt lại, `loiThu` cho phần SBD thử.
  const [loi, setLoi] = useState('')
  const [loiThu, setLoiThu] = useState('')

  useEffect(() => {
    let song = true
    void docLuotHoiThay().then((r) => { if (song) { if (r.ok) setLuot(r.du); else setLoi(r.loi) } })
    return () => { song = false }
  }, [])

  const sbdGon = sbd.trim()
  const xem = async (e?: FormEvent) => {
    e?.preventDefault()
    if (!SBD_HOP_LE.test(sbdGon)) { setLoi('Số báo danh không hợp lệ.'); return }
    setDang('xem'); setLoi('')
    const r = await docLuotHoiThay(sbdGon)
    setDang('')
    if (!r.ok) { setLoi(r.loi); setEm(null); return }
    setLuot(r.du); setEm(r.du)
  }
  const datLai = async () => {
    if (!em?.sbd) return
    setDang('dat-lai'); setLoi('')
    const r = await datLaiLuotHoiThay(em.sbd)
    setDang('')
    if (!r.ok) { setLoi(r.loi); return }
    setEm({ ...em, homNay: 0 })
    showToast(`Đã đặt lại lượt hỏi hôm nay cho SBD ${em.sbd}.`, 'success')
  }
  const doiThu = async (s: string, them: boolean) => {
    if (!SBD_HOP_LE.test(s)) { setLoiThu('Số báo danh không hợp lệ.'); return }
    setDang('thu'); setLoiThu('')
    const r = await doiSbdThuHoiThay(s, them)
    setDang('')
    if (!r.ok) { setLoiThu(r.loi); return }
    setLuot((l) => (l ? { ...l, sbdThu: r.du.sbdThu } : l))
    setEm((x) => (x?.sbd === s ? { ...x, laSbdThu: them } : x))
    if (them) setSbdThuMoi('')
    showToast(them ? `Đã thêm SBD thử ${s}: hỏi không giới hạn lượt.` : `Đã bỏ SBD thử ${s}.`, 'success')
  }

  return (
    <TheNoiDung>
      <h2 style={{ fontSize: 'var(--cx-3)', fontWeight: 700, marginBottom: 'var(--k1)' }}>Hỏi Thầy (AI)</h2>
      <p data-tran-hoi-thay style={{ margin: 0, fontSize: 'var(--cx-1)', lineHeight: 1.5, color: 'var(--nhat)' }}>
        {luot ? `Mỗi em hỏi tối đa ${luot.tranNgay} câu/ngày, mỗi câu bài tập tối đa ${luot.tranCau} lần/ngày. Sang ngày mới lượt tự về 0.` : 'Đang đọc trần lượt…'}
      </p>

      <div style={VACH} />
      <h3 style={TIEU_DE_PHU}>Đặt lại lượt hỏi hôm nay của một em</h3>
      <form onSubmit={xem} style={HANG}>
        <label className="cd-truong" style={{ flex: '1 1 180px', minWidth: 0 }}>
          Số báo danh
          <input type="text" inputMode="numeric" value={sbd} placeholder="12121212" autoComplete="off" onChange={(e) => { setSbd(e.target.value); setEm(null) }} />
        </label>
        <button type="submit" className="m3-nut-chu m3-nut-vien" disabled={dang !== '' || !sbdGon} style={{ flex: 'none' }}>
          {dang === 'xem' ? 'Đang xem…' : 'Xem lượt'}
        </button>
      </form>
      {em?.sbd && (
        <div style={{ ...HANG, alignItems: 'center', marginTop: 'var(--k3)', padding: 'var(--k3)', borderRadius: 'var(--bo-2)', background: 'var(--m3-surface-container-low)' }}>
          <p data-luot-em style={{ flex: '1 1 200px', minWidth: 0, margin: 0, lineHeight: 1.5 }}>
            SBD {em.sbd}: đã hỏi <b>{em.homNay ?? 0}/{em.tranNgay}</b> câu hôm nay{em.laSbdThu ? ' · SBD thử, không giới hạn lượt' : ''}.
          </p>
          <button type="button" className="m3-nut-chinh" disabled={dang !== '' || (em.homNay ?? 0) === 0} onClick={() => void datLai()} style={{ flex: 'none' }}>
            {dang === 'dat-lai' ? 'Đang đặt lại…' : 'Đặt lại lượt hỏi hôm nay'}
          </button>
        </div>
      )}
      {loi && <p className="cd-loi" role="alert" style={{ marginTop: 'var(--k2)' }}>{loi}</p>}

      <div style={VACH} />
      <h3 style={{ ...TIEU_DE_PHU, marginBottom: 'var(--k1)' }}>SBD thử – không giới hạn lượt hỏi</h3>
      <p className="cd-phu" style={{ margin: '0 0 var(--k3)', lineHeight: 1.5 }}>Cho máy thầy thử. Học sinh thật vẫn theo trần lượt ở trên.</p>
      {luot && luot.sbdThu.length > 0 && (
        <div className="flex flex-wrap" style={{ gap: 'var(--k2)', marginBottom: 'var(--k3)' }} aria-label="SBD thử">
          {luot.sbdThu.map((s) => (
            <button key={s} type="button" className="cd-chip" aria-pressed aria-label={`Bỏ SBD thử ${s}`} disabled={dang !== ''} onClick={() => void doiThu(s, false)}>
              {s}
              <X size={14} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
      <form onSubmit={(e) => { e.preventDefault(); void doiThu(sbdThuMoi.trim(), true) }} style={HANG}>
        <label className="cd-truong" style={{ flex: '1 1 180px', minWidth: 0 }}>
          Thêm SBD thử
          <input type="text" inputMode="numeric" value={sbdThuMoi} placeholder="12121212" autoComplete="off" onChange={(e) => setSbdThuMoi(e.target.value)} />
        </label>
        <button type="submit" className="m3-nut-chu m3-nut-vien" disabled={dang !== '' || !sbdThuMoi.trim()} style={{ flex: 'none' }}>
          {dang === 'thu' ? 'Đang lưu…' : 'Thêm'}
        </button>
      </form>
      {loiThu && <p className="cd-loi" role="alert" style={{ marginTop: 'var(--k2)' }}>{loiThu}</p>}
    </TheNoiDung>
  )
}

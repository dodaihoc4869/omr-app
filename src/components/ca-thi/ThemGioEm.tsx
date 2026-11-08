// THÊM GIỜ CHO TỪNG EM (thầy 08/11: «bấm vào từng hs đang làm để thêm giờ cho từng hs đó»; bản vẽ docs/ban-ve-them-gio-em-0811 thầy chốt).
// Tấm nổi: điện thoại = tấm đáy, ≥ 720 px = hộp giữa. Chọn +5 / +10 / +15 ⇒ HỎI LẠI ⇒ gọi `chay` (lệnh máy chủ /ca/them-phut-em). Không giả thành công:
// lỗi / mạng chậm ⇒ nói «chưa chắc đã cộng», KHÔNG tự bấm lại. Đồng hồ nhích mỗi giây theo giờ máy chủ.
import { useEffect, useState } from 'react'
import { AlarmClockPlus, Check, Clock, X } from 'lucide-react'
import { gioMayChu } from '../../lib/gio-may-chu'
import { PHUT_THEM_EM_TOI_DA, themPhutEm, type KetQuaThemPhutEm } from '../../lib/them-phut-api'
import { hanRiengEm, type CaGioEm, type LuotGioEm } from '../../lib/them-gio-em'

export interface EmThemGio { sbd: string; hoTen: string; vaoMuonPhut: number | null; hetLucMs: number; themPhutEm: number; daLam: number | null; tongCau: number | null }
type Buoc = 'chon' | 'hoi' | 'dang' | 'xong'

const gioPhut = (ms: number) => new Date(ms).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' })
const mmss = (g: number) => `${String(Math.floor(g / 60)).padStart(2, '0')}:${String(g % 60).padStart(2, '0')}`

export default function ThemGioEm({ em, chay, onDong, onHoSo, onXong }: {
  em: EmThemGio
  chay: (phut: number) => Promise<KetQuaThemPhutEm>
  onDong: () => void
  onHoSo: () => void
  onXong?: (k: KetQuaThemPhutEm) => void
}) {
  const [buoc, setBuoc] = useState<Buoc>('chon')
  const [phut, setPhut] = useState(5)
  const [loi, setLoi] = useState('')
  const [moi, setMoi] = useState<{ hanMs: number; daThem: number } | null>(null)
  const [bay, setBay] = useState(() => gioMayChu())
  useEffect(() => { const t = setInterval(() => setBay(gioMayChu()), 1000); return () => clearInterval(t) }, [])
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onDong() }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [onDong])
  const han = moi?.hanMs ?? em.hetLucMs
  const daThem = moi?.daThem ?? em.themPhutEm
  const con = Math.max(0, Math.floor((han - bay) / 1000))
  const conLai = Math.max(0, PHUT_THEM_EM_TOI_DA - daThem)
  const ten = em.hoTen.trim().split(/\s+/).slice(-2).join(' ') || `SBD ${em.sbd}`
  const dongY = async () => {
    setBuoc('dang'); setLoi('')
    try {
      const k = await chay(phut)
      const ms = Date.parse(k.hetGioLuc)
      setMoi({ hanMs: Number.isFinite(ms) ? ms : han + phut * 60_000, daThem: k.themPhutEm })
      setBuoc('xong')
      onXong?.(k)
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Không thêm được giờ.')
      setBuoc('chon')
    }
  }
  return (
    <div className="tg-nen" role="presentation" onClick={onDong}>
      <section className="tg-tam" role="dialog" aria-modal="true" aria-labelledby="tg-ten" onClick={(e) => e.stopPropagation()}>
        <span className="tg-tay" aria-hidden="true" />
        <header className="tg-dau">
          <div>
            <p className="tg-nho">Thêm giờ cho riêng em</p>
            <h2 id="tg-ten">{em.hoTen || `SBD ${em.sbd}`}</h2>
            <p className="tg-phu so">
              SBD {em.sbd}
              {em.vaoMuonPhut && em.vaoMuonPhut > 0 ? ` · vào muộn ${em.vaoMuonPhut} phút` : ''}
              {em.daLam !== null && em.tongCau ? ` · ${em.daLam}/${em.tongCau} câu` : ''}
            </p>
          </div>
          <button type="button" className="tg-dong" aria-label="Đóng" onClick={onDong}><X size={22} /></button>
        </header>

        <div className={`tg-dong-ho${con < 300 ? ' sap-het' : ''}`}>
          <Clock size={22} aria-hidden="true" />
          <div>
            <b className="so">Còn {mmss(con)}</b>
            <span className="so">Hạn nộp của em {gioPhut(han)}{daThem > 0 ? ` · đã thêm ${daThem} phút` : ''}</span>
          </div>
        </div>

        {buoc === 'chon' && (
          <>
            <div className="tg-chon" role="group" aria-label="Chọn số phút thêm">
              {[5, 10, 15].map((m) => (
                <button key={m} type="button" className="tg-o" disabled={m > conLai} onClick={() => { setPhut(m); setLoi(''); setBuoc('hoi') }}>
                  <b className="so">+{m}</b><span>phút</span>
                </button>
              ))}
            </div>
            <p className="tg-ghi">Chỉ em này được cộng giờ, các em khác giữ nguyên. Mỗi em được thêm tối đa {PHUT_THEM_EM_TOI_DA} phút{daThem > 0 ? ` (còn ${conLai} phút)` : ''}.</p>
          </>
        )}

        {(buoc === 'hoi' || buoc === 'dang') && (
          <div className="tg-hoi">
            <p>Thêm <b>{phut} phút</b> cho <b>{ten}</b>? Hạn nộp mới <b className="so">{gioPhut(han + phut * 60_000)}</b>.</p>
            <div className="tg-hang">
              <button type="button" className="ct-nut ct-nut-chinh tg-to" disabled={buoc === 'dang'} onClick={() => void dongY()}>
                <AlarmClockPlus size={20} aria-hidden="true" /> {buoc === 'dang' ? 'Đang cộng…' : `Đồng ý thêm ${phut} phút`}
              </button>
              <button type="button" className="ct-nut ct-nut-vien tg-to" disabled={buoc === 'dang'} onClick={() => setBuoc('chon')}>Chọn lại</button>
            </div>
          </div>
        )}

        {buoc === 'xong' && (
          <div className="tg-xong" role="status">
            <Check size={22} aria-hidden="true" />
            <p>Đã thêm {phut} phút cho {ten}. Máy em nhận giờ mới trong khoảng 10 giây.</p>
          </div>
        )}

        {loi && <p className="tg-loi" role="alert">{loi}</p>}

        <button type="button" className="tg-ho-so" onClick={onHoSo}>Xem hồ sơ em</button>
      </section>
    </div>
  )
}

/** Gắn vào màn Theo dõi ca: tìm em trong danh sách, tính hạn riêng, gọi lệnh máy chủ; xong thì tải lại ca. Em không còn hạn đọc được ⇒ không vẽ. */
export function TamThemGio({ ca, ds, sbd, lamMoi, dong, hoSo }: {
  ca: CaGioEm & { maCa: string }
  ds: { sbd: string; hoTen: string; moiNhat: LuotGioEm }[]
  sbd: string
  lamMoi: () => void
  dong: () => void
  hoSo: (sbd: string) => void
}) {
  const e = ds.find((x) => x.sbd === sbd)
  const h = e ? hanRiengEm(e.moiNhat, ca) : null
  if (!e || !h || h.hetLucMs === null) return null
  return (
    <ThemGioEm
      em={{ sbd: e.sbd, hoTen: e.hoTen, vaoMuonPhut: h.vaoMuonPhut, hetLucMs: h.hetLucMs, themPhutEm: h.themPhutEm, daLam: null, tongCau: null }}
      chay={(phut) => themPhutEm(ca.maCa, e.sbd, phut)}
      onXong={lamMoi}
      onDong={dong}
      onHoSo={() => hoSo(e.sbd)}
    />
  )
}

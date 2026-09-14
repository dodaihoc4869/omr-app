/**
 * GIẢI CỨU NGƯỜI YÊU CŨ — vỏ React.
 * (tên tệp và tên biến vẫn là giai-cuu-cong-chua: đổi tên hiển thị thôi.)
 *
 * React chỉ gắn canvas MỘT LẦN và dựng lớp phủ. Vòng lặp game nằm ngoài React
 * và CẤM gọi setState mỗi khung hình — luật này đã trả giá ở game-quy-dao.
 * Lớp phủ chỉ vẽ lại khi có việc thật sự đổi: mạng, hoá chất, phương trình.
 *
 * Game KHÔNG biết em là ai: không nhận tên, không nhận mã dự thi, không
 * gửi gì ra khỏi máy. Điểm game không dính vào hồ sơ học tập.
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, ArrowUp, Volume2, VolumeX } from 'lucide-react'
import { CAU_HINH } from '../game/giai-cuu-cong-chua/cau-hinh'
import { HOA_CHAT } from '../game/giai-cuu-cong-chua/hoa-chat'
import { demDoiThu } from '../game/giai-cuu-cong-chua/bang-khac-che'
import { BA_DO_KHO, type MaDoKho } from '../game/giai-cuu-cong-chua/do-kho'
import { VanChoi } from '../game/giai-cuu-cong-chua/van-choi'
import { veVan } from '../game/giai-cuu-cong-chua/ve-van'
import { AmThanh } from '../game/giai-cuu-cong-chua/am-thanh'

type Man = 'chon' | 'choi' | 'ket'

interface Props { onDong: () => void }

/** Ảnh chụp trạng thái cho lớp phủ — đổi thì mới vẽ lại React. */
interface Tin {
  mang: number
  hoaChat: string
  conSong: number
  chonLai: boolean
  pt: string
  tieuChi: string
  nhan: string
  mauNhan: string
  mauRong: number
  xong: boolean
  thang: boolean
}

const TIN_RONG: Tin = {
  mang: CAU_HINH.SO_MANG, hoaChat: '', conSong: CAU_HINH.SO_NGUOI_TOI_DA, chonLai: false,
  pt: '', tieuChi: '', nhan: '', mauNhan: '', mauRong: CAU_HINH.MAU_RONG, xong: false, thang: false,
}

export default function GiaiCuuCongChuaGame({ onDong }: Props) {
  const [man, setMan] = useState<Man>('chon')
  const [chat, setChat] = useState<string>(HOA_CHAT[0]!.ct)
  const [doKho, setDoKho] = useState<MaDoKho>('do')
  const [tin, setTin] = useState<Tin>(TIN_RONG)
  const [conKhongLo, setConKhongLo] = useState(0)
  const [tieng, setTieng] = useState(true)
  const oCanvas = useRef<HTMLCanvasElement | null>(null)
  const oVan = useRef<VanChoi | null>(null)
  const oAm = useRef<AmThanh | null>(null)
  const oKhung = useRef<number>(0)

  const batDau = useCallback((ct: string) => {
    oAm.current ??= new AmThanh()
    oAm.current.moKhoa()
    oAm.current.datBat(tieng)
    oVan.current = new VanChoi(Math.floor(Date.now() / 1000) & 0xffff, ct, true, 0, doKho)
    setTin({ ...TIN_RONG, hoaChat: ct })
    setMan('choi')
  }, [tieng, doKho])

  // ——— VÒNG LẶP: ngoài React, không setState mỗi khung hình
  useEffect(() => {
    if (man !== 'choi') return
    const cv = oCanvas.current
    const van = oVan.current
    if (!cv || !van) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let truoc = performance.now()
    let tinCu = ''
    const chay = (t: number) => {
      const dt = Math.min(0.05, (t - truoc) / 1000)
      truoc = t
      van.buoc(dt)

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = cv.clientWidth, h = cv.clientHeight
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
        cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      veVan(ctx, van, w, h, t)

      const toi = van.nguoiThat
      const moi: Tin = {
        mang: toi?.mang ?? 0,
        hoaChat: toi?.hoaChat ?? '',
        conSong: van.conSong().length,
        chonLai: (toi?.chonLaiDen ?? 0) > van.giay,
        pt: van.bang?.pt ?? '',
        tieuChi: van.bang?.tieuChi ?? '',
        nhan: van.bang?.nhan ?? '',
        mauNhan: van.bang?.mau ?? '',
        mauRong: van.rong.mau,
        xong: van.pha === 'xong' || !(toi?.song ?? false),
        thang: van.ket.thang === van.idNguoiThat,
      }
      const khoa = JSON.stringify(moi)
      if (khoa !== tinCu) { tinCu = khoa; setTin(moi) }
      // đồng hồ khổng lồ: chỉ gọi setState khi SỐ GIÂY đổi, không phải mỗi khung hình
      const conLai = toi ? Math.max(0, Math.ceil(toi.khongLoDen - van.giay)) : 0
      setConKhongLo((cu) => (cu === conLai ? cu : conLai))

      oKhung.current = requestAnimationFrame(chay)
    }
    oKhung.current = requestAnimationFrame(chay)
    return () => cancelAnimationFrame(oKhung.current)
  }, [man])

  useEffect(() => { if (tin.xong && man === 'choi') setMan('ket') }, [tin.xong, man])
  useEffect(() => { oAm.current?.datBat(tieng) }, [tieng])

  // ——— điều khiển: bàn phím và cảm ứng đổ vào cùng một chỗ
  const dat = useCallback((phim: 'trai' | 'phai' | 'nhay', bat: boolean) => {
    const van = oVan.current, toi = van?.nguoiThat
    if (!van || !toi) return
    if (phim === 'nhay') { if (bat) toi.phim.nhayLuc = van.giay; return }
    toi.phim[phim] = bat
  }, [])

  useEffect(() => {
    if (man !== 'choi') return
    const xuong = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') dat('trai', true)
      if (e.key === 'ArrowRight' || e.key === 'd') dat('phai', true)
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') { e.preventDefault(); dat('nhay', true) }
    }
    const len = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') dat('trai', false)
      if (e.key === 'ArrowRight' || e.key === 'd') dat('phai', false)
    }
    window.addEventListener('keydown', xuong)
    window.addEventListener('keyup', len)
    return () => { window.removeEventListener('keydown', xuong); window.removeEventListener('keyup', len) }
  }, [man, dat])

  // ═══════════ MÀN CHỌN HOÁ CHẤT ═══════════
  if (man === 'chon') {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="font-bold text-lg">Chọn một trong mười hai hoá chất</h2>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-prose">
              Hoá chất là thứ em <b>dẫm</b> đối thủ. Dẫm trúng người mình khắc chế thì họ mất một mạng.
              Dẫm trúng người <b>khắc chế mình</b> thì <b>chính mình</b> mất một mạng — dù mình là người nhảy lên.
            </p>
          </div>
          <button type="button" onClick={onDong} aria-label="Đóng"
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="mb-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Mức độ</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {BA_DO_KHO.map((d) => {
              const chon = d.ma === doKho
              return (
                <button key={d.ma} type="button" onClick={() => setDoKho(d.ma)}
                  className={`rounded-xl border p-3 text-left transition-all active:scale-[0.98] cursor-pointer ${
                    chon ? 'border-transparent text-white shadow-xs'
                         : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                  style={chon ? { background: d.mau } : undefined}>
                  <div className="font-bold text-[15px]">{d.ten}</div>
                  <div className={`text-[11px] mt-0.5 ${chon ? 'text-white/85' : 'text-slate-500 dark:text-slate-400'}`}>
                    {d.moTa}
                  </div>
                  <div className={`text-[11px] mt-1 tabular-nums ${chon ? 'text-white/75' : 'text-slate-400'}`}>
                    {d.soQuai} quái · {d.soHoa} hoa · rồng {d.mauRong} máu
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Hoá chất</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {HOA_CHAT.map((h) => {
            const d = demDoiThu(h.ct, HOA_CHAT.map((x) => x.ct).filter((c) => c !== h.ct))
            const chon = h.ct === chat
            return (
              <button key={h.ct} type="button" onClick={() => setChat(h.ct)}
                className={`rounded-xl border p-3 text-left transition-all active:scale-[0.98] cursor-pointer ${
                  chon
                    ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 dark:border-emerald-700 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-xs shrink-0"
                    style={{ background: h.mau }} />
                  <span className="font-bold text-[15px]">{h.ct}</span>
                </div>
                <div className="text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                  khắc chế <b className="text-emerald-600 dark:text-emerald-400">{d.khac}</b>
                  {' · '}bị khắc <b className="text-rose-600 dark:text-rose-400">{d.biKhac}</b>
                  {' · '}trơ {d.tro + d.trung}
                </div>
              </button>
            )
          })}
        </div>

        <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-3">
          Mười hai người mười hai chất, không ai trùng ai. Mất một mạng thì được đổi chất —
          lấy chất của ai thì người đó nhận lại chất của em.
        </p>
        <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-1">
          Quái đi tuần: <b>chạm vào là mất một mạng</b>, dẫm trúng đỉnh đầu thì quái chết.
          Ăn <b className="text-pink-500">hoa</b> thì khổng lồ 10 giây — lúc đó chạm ai người đó
          mất mạng, chạm quái nào quái đó chết, không cần dẫm.
        </p>

        <button type="button" onClick={() => batDau(chat)}
          className="mt-4 w-full sm:w-auto px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm cursor-pointer">
          Vào đảo với {chat}
        </button>
        <p className="text-[11px] text-slate-400 mt-2">
          Xoay ngang máy để chơi. Trái/phải để chạy, nút tròn để nhảy. Rơi trúng đỉnh đầu mới tính là dẫm.
        </p>
      </div>
    )
  }

  // ═══════════ MÀN KẾT ═══════════
  if (man === 'ket') {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center">
        <h2 className="font-bold text-2xl mb-1">{tin.thang ? 'Cứu được người yêu cũ!' : 'Hết ba mạng'}</h2>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-5">
          {tin.thang
            ? 'Sống sót tới hang, hạ rồng, chạm tay người yêu cũ.'
            : 'Lần sau nhìn công thức trên đầu đối thủ trước khi nhảy — viền đỏ nghĩa là nhảy lên thì chính mình mất mạng.'}
        </p>
        <div className="flex gap-2 justify-center">
          <button type="button" onClick={() => setMan('chon')}
            className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm cursor-pointer">
            Chơi ván mới
          </button>
          <button type="button" onClick={onDong}
            className="px-5 py-2.5 rounded-full border border-slate-300 dark:border-slate-700 font-semibold text-sm cursor-pointer">
            Thoát
          </button>
        </div>
      </div>
    )
  }

  // ═══════════ MÀN CHƠI ═══════════
  return (
    <div className="fixed inset-0 z-[70] bg-slate-900 select-none touch-none">
      <canvas ref={oCanvas} className="block w-full h-full" />

      {/* HUD trên */}
      <div className="absolute top-0 inset-x-0 p-3 flex items-start justify-between pointer-events-none">
        <div className="flex items-center gap-2 rounded-full bg-white/85 dark:bg-slate-900/85 px-3 py-1.5 backdrop-blur">
          <span className="text-[13px] font-bold tabular-nums">{tin.conSong}/12</span>
          <span className="text-[11px] text-slate-500">còn sống</span>
          <span className="ml-1 text-rose-500 text-[13px]">{'♥'.repeat(Math.max(0, tin.mang))}</span>
          <span className="ml-1 text-[13px] font-bold">{tin.hoaChat}</span>
        </div>
        {conKhongLo > 0 && (
          <div className="rounded-full bg-pink-500 text-white px-3 py-1.5 text-[13px] font-bold tabular-nums">
            KHỔNG LỒ {conKhongLo}s
          </div>
        )}
        <div className="flex gap-2 pointer-events-auto">
          <button type="button" onClick={() => setTieng((v) => !v)} aria-label="Tiếng"
            className="p-2 rounded-full bg-white/85 dark:bg-slate-900/85 backdrop-blur cursor-pointer">
            {tieng ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button type="button" onClick={() => { setMan('chon') }} aria-label="Thoát"
            className="p-2 rounded-full bg-white/85 dark:bg-slate-900/85 backdrop-blur cursor-pointer">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Băng phương trình — hiện 1,6 giây, KHÔNG chặn điều khiển */}
      {tin.pt !== '' && (
        <div className="absolute left-1/2 -translate-x-1/2 top-14 text-center pointer-events-none px-3">
          <div className="inline-block rounded-full px-4 py-1.5 text-white font-bold text-[13px]"
            style={{ background: tin.mauNhan }}>{tin.nhan}</div>
          <div className="mt-1 font-bold text-[17px] text-white drop-shadow">{tin.pt}</div>
          <div className="text-[12px] text-white/80">{tin.tieuChi}</div>
        </div>
      )}

      {/* Chọn lại hoá chất sau khi mất một mạng */}
      {tin.chonLai && (
        <div className="absolute inset-x-0 bottom-24 px-3 pointer-events-auto">
          <div className="mx-auto max-w-2xl rounded-2xl bg-white/95 dark:bg-slate-900/95 p-3 backdrop-blur">
            <div className="text-[12px] font-bold mb-2">Mất một mạng — đổi hoá chất?</div>
            <div className="flex gap-1.5 flex-wrap">
              {HOA_CHAT.map((h) => (
                <button key={h.ct} type="button"
                  onClick={() => {
                    const van = oVan.current, toi = van?.nguoiThat
                    if (van && toi) van.doiChat(toi, h.ct)
                  }}
                  className="px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-[12px] font-bold cursor-pointer">
                  <span className="inline-block w-2.5 h-2.5 rounded-full mr-1 align-middle" style={{ background: h.mau }} />
                  {h.ct}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Điều khiển cảm ứng — khoá ngang */}
      <div className="absolute bottom-0 inset-x-0 p-4 flex items-end justify-between pointer-events-none">
        <div className="flex gap-3 pointer-events-auto">
          {([['trai', ChevronLeft], ['phai', ChevronRight]] as const).map(([p, I]) => (
            <button key={p} type="button" aria-label={p}
              onPointerDown={() => dat(p, true)}
              onPointerUp={() => dat(p, false)}
              onPointerLeave={() => dat(p, false)}
              onPointerCancel={() => dat(p, false)}
              className="w-16 h-16 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur flex items-center justify-center active:scale-95 cursor-pointer">
              <I size={26} />
            </button>
          ))}
        </div>
        <button type="button" aria-label="Nhảy"
          onPointerDown={() => dat('nhay', true)}
          className="w-20 h-20 rounded-full bg-emerald-500/90 text-white backdrop-blur flex items-center justify-center active:scale-95 pointer-events-auto cursor-pointer">
          <ArrowUp size={30} />
        </button>
      </div>
    </div>
  )
}

// LIVE THEO KHỐI — LỚP NỔI MÁY THẦY (mặt; kho + nối phòng + tự bật tiếng ở thay-khoi.ts).
// Luồng (thầy 12/11): PHÒNG CHỜ → «Bắt đầu live» ⇒ SẢNH danh sách bốn đội (tiếng thầy tự bật, không cần tờ, không phải bấm nút Live nào) → thầy chọn
// «Học» (bảng chọn bài của live ⇒ tờ giảng) hoặc «Bảng» (tờ bảng trắng xanh than) ⇒ phòng báo máy em chuyển theo. Bảng Bình Phản Ứng ẩn suốt buổi.
import { Suspense, lazy, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { DOI_BPU, type ViewBang } from '../../lib/bpu/phong'
import { MAU_CHIEU } from '../../lib/bpu/mau-chieu'
import { MAU_XANH_THAN } from '../../lib/live-khoi/mau'
import { batDauLiveKhoi } from '../../lib/live-khoi/api'
import { chieuBangTrang, chieuCau, coTo, coToChieu, datEscLive, hdDuoi, hienHoatDong, ketThucBuoiHoc, laToBang, moHoatDong, toDangHien, toLenTren } from '../bpu/gan-gv'
import { batTiengLai, dangKy, datKhoi, datLuat, duyetLuat, kenh, layDangMo, layView, lenhMic, phienCua } from './thay-khoi'
import { SK_COT, hinhCot } from './cot-chat-hinh'
import './thay-khoi.css'
import './em-khoi.css'

const TroSinhTon = lazy(() => import('./TroSinhTon'))
const ChonCauBpu = lazy(() => import('../bpu/ChonCauBpu'))
const CotChatThay = lazy(() => import('./ChatThay').then((m) => ({ default: m.CotChatThay })))
const MayTinhThay = lazy(() => import('../may-tinh/MayTinhThay'))
const HoiHieuThay = lazy(() => import('./HoiHieuThay'))
const LuatRoiThay = lazy(() => import('./LuatRoiThay'))
const KIEU = { ...MAU_CHIEU, ...MAU_XANH_THAN } as CSSProperties

/** Có tờ RIÊNG đang mở (lớp phủ tờ chiếu không phải tờ Bình Phản Ứng)? Lớp phủ là cổng gắn thẳng vào <body> ⇒ chỉ theo dõi con trực tiếp của body. */
const coToRieng = (): boolean => !!document.querySelector('.lop-xem-phieu:not([aria-label="Tờ chiếu Bình Phản Ứng"])')
/** Đang có lớp phủ tờ chiếu nào không (cột chat cố định chỉ dựng khi có phần chiếu để đứng cạnh). */
const coLopPhu = (): boolean => !!document.querySelector('.lop-xem-phieu')
const ngheToRieng = (f: () => void): (() => void) => { const mo = new MutationObserver(f); mo.observe(document.body, { childList: true }); return () => mo.disconnect() }
export default function LopNoiThay() {
  const v = useSyncExternalStore(dangKy, layView)
  const k = v?.live?.khoi ?? null
  const dangMo = useSyncExternalStore(dangKy, layDangMo)
  // Cửa sổ đủ rộng ⇒ cột tin nhắn LUÔN HIỆN bên phải màn chiếu (thầy 13/11, cot-chat-hinh.ts); phím M / nút «Tin nhắn» cất, hiện lại. Cửa sổ nhỏ ⇒ cột nổi như cũ.
  const [chat, setChat] = useState(() => !!hinhCot(window.innerWidth, window.innerHeight))
  /** Bảng chọn bài của live đang mở (nằm TRÊN sảnh). */
  const [chon, setChon] = useState(false)
  // Máy tính «Đỗ Đại Học FX4869» (thầy 12/11): nút máy tính trên thanh đáy của tờ bật / tắt; nổi trên màn chiếu, đồng bộ sang máy em.
  const [mt, setMt] = useState(false)
  // Phím / (thầy 12/11): hỏi nhanh cả lớp «Hiểu chưa?» — bấm mở, bấm lần nữa đóng.
  const [hieu, setHieu] = useState(false)
  /** Bảng danh sách: null = theo phòng (phòng đang «sanh» thì hiện) · true = thầy tự mở (Esc, nút «Lớp») · false = thầy đã RỜI danh sách sang màn chiếu / tấm
   *  hoạt động dù phòng còn «sanh» (máy em chỉ đổi khi có câu được chiếu). */
  const [sanhTay, setSanh] = useState<boolean | null>(null)
  const [loi, setLoi] = useState('')
  const dang = k?.gd === 'dang'
  // bảng chọn bài nạp SẴN ngay khi vào live ⇒ bấm «Học» là hiện liền (trước: lần bấm đầu còn chờ tải mảnh, thầy tưởng không ăn — «phải bấm 2 lần»)
  useEffect(() => { if (dang) void import('../bpu/ChonCauBpu').catch(() => {}) }, [dang])
  // Tấm hoạt động (đầu giờ / chữa câu / ôn tập) của «Học» đang mở. Đóng tấm mà buổi chưa có bài nào đang chiếu ⇒ quay lại bảng chọn (không để màn trống).
  const dungRef = useRef<() => void>(() => {})
  const [hdMo, setHdMo] = useState(false)
  useEffect(() => {
    const f = (e: Event) => { const mo = (e as CustomEvent<boolean>).detail === true; setHdMo(mo); if (mo) { setSanh(false); return } if (coTo()) return; if (layView()?.live?.khoi?.che === 'bang') dungRef.current(); else setSanh(true) }
    window.addEventListener('bpu-hd', f)
    return () => window.removeEventListener('bpu-hd', f)
  }, [])
  // Tấm hoạt động đang nằm TRÊN tờ của bảng (thầy Esc từ màn chiếu về tấm để chọn câu kế) ⇒ một nút «Về màn chiếu»: tờ lên lại nguyên trạng, tấm vẫn mở bên dưới.
  const [hdTren, setHdTren] = useState(false)
  const toRieng = useSyncExternalStore(ngheToRieng, coToRieng) // tờ riêng của tấm hoạt động đang mở ⇒ ẩn nút nổi «Về màn chiếu»
  useEffect(() => { const f = (e: Event) => setHdTren((e as CustomEvent<boolean>).detail === true); window.addEventListener('bpu-hd-tren', f); return () => window.removeEventListener('bpu-hd-tren', f) }, [])
  const sanh = dang && (sanhTay ?? k.che === 'sanh')
  const [man, setMan] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => { const f = () => setMan({ w: window.innerWidth, h: window.innerHeight }); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  const k1 = Math.min(man.w / 1920, man.h / 1080)
  // CỘT TIN NHẮN CỐ ĐỊNH: chỉ khi phần chiếu đang ở trên cùng (không ở bảng danh sách / bảng chọn bài / tấm hoạt động — các màn đó vẫn kín cửa sổ như cũ).
  const hinh = hinhCot(man.w, man.h)
  const coPhu = useSyncExternalStore(ngheToRieng, coLopPhu)
  const cot = hinh && chat && dang && !sanh && !chon && !(hdMo && hdTren) && coPhu ? hinh : null
  const cotC = cot?.c ?? 0, cotS = cot?.s ?? 1, cotD = cot?.d ?? 0
  // Gốc trang mang cờ + ba số đo ⇒ CSS thu đều lớp phủ tờ (thay-khoi.css) và các lớp bám theo phần chiếu (hỏi hiểu, viên «Rời màn hình», máy tính) dời theo.
  useLayoutEffect(() => {
    if (!cotC) return
    const g = document.documentElement
    g.setAttribute('data-lk-cot', ''); g.style.setProperty('--lkc-w', `${cotC}px`); g.style.setProperty('--lkc-s', String(cotS)); g.style.setProperty('--lkc-h', `${cotD}px`)
    window.dispatchEvent(new Event(SK_COT))
    return () => { g.removeAttribute('data-lk-cot'); for (const t of ['--lkc-w', '--lkc-s', '--lkc-h']) g.style.removeProperty(t); window.dispatchEvent(new Event(SK_COT)) }
  }, [cotC, cotS, cotD])
  const dungBangTrang = (): void => { void chieuBangTrang().then((l) => { if (l) { setLoi(l); setSanh(true) } }) }
  dungRef.current = dungBangTrang
  // Vào lại giữa buổi (tải lại trang, Esc rồi quay lại) mà chưa có tờ: Học ⇒ mở chọn bài, Bảng ⇒ dựng lại bảng trắng. Không để lộ màn trống.
  const che = dang ? k.che : null
  useEffect(() => {
    if (!che || che === 'sanh' || coToChieu()) return
    if (che === 'hoc') setChon(true); else dungBangTrang()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [che])
  // MÁY EM CHỈ VÀO «HỌC» KHI CÓ CÂU ĐƯỢC CHIẾU (thầy 12/11 «đợi thầy chọn câu xong bấm chiếu lên bảng thì máy em mới vào phần nhận đề»): thầy bấm «Học», mở
  // bảng chọn, mở hoạt động — phòng CHƯA đổi chế độ, máy em ở nguyên màn đang xem. Phòng mở LƯỢT MỚI (bất kể chiếu bằng đường nào: bảng chọn, hoạt động chữa
  // câu, phím C trên bảng đua) ⇒ lúc đó mới sang «hoc». Lượt đang mở mà thầy tự chuyển «Bảng» thì không bị kéo về.
  const luotSo = v?.luot?.so ?? 0
  const luotCu = useRef(luotSo)
  useEffect(() => {
    const moi = luotSo > luotCu.current
    luotCu.current = luotSo
    const kk = layView()?.live?.khoi
    if (moi && kk && kk.gd === 'dang' && kk.che !== 'hoc') { setChon(false); setSanh(false); datKhoi({ ...kk, che: 'hoc' }) }
  }, [luotSo])
  // Tờ BÀI vừa được chiếu (từ bảng chọn, từ tấm hoạt động «Gọi lên bảng» / «Chiếu lên bảng») mà phòng chưa ở «hoc» ⇒ sang «hoc»: máy em vào màn chiếu.
  useEffect(() => {
    const f = (e: Event) => { const kk = layView()?.live?.khoi; if ((e as CustomEvent<boolean>).detail !== true && kk && kk.gd === 'dang' && kk.che !== 'hoc') { setChon(false); setSanh(false); datKhoi({ ...kk, che: 'hoc' }) } }
    window.addEventListener('bpu-to', f)
    return () => window.removeEventListener('bpu-to', f)
  }, [])
  /** Bài đã chiếu / hoạt động đã mở ⇒ BÂY GIỜ mới báo phòng sang «Học» (máy em ở nguyên màn đang xem tới lúc có bài). */
  const sangHoc = (): void => { setChon(false); setSanh(false); if (k) datKhoi({ ...k, che: 'hoc' }) }
  // MỘT LUẬT ĐIỀU HƯỚNG (thầy 12/11 «làm chuẩn logic đi»):
  //  · «Học» ở BẢNG DANH SÁCH = mở bảng chọn bài / hoạt động (bấm MỘT lần là chọn được). Muốn quay lại thứ đang chiếu thì có nút «Về màn chiếu».
  //  · «Học» trong khay nút bốn ô của tờ: đang có bài / tấm hoạt động đang mở ⇒ về đúng màn đó ngay; chưa có gì ⇒ mở bảng chọn.
  //  · «Bảng»: tờ của bảng lên trên (bảng trắng nếu chưa có tờ), nét bảng giữ nguyên.
  //  · Chọn xong / mở hoạt động / chiếu tờ ⇒ rời danh sách sang màn đó. Esc lùi một màn, không đóng / huỷ gì: mọi thứ còn nguyên để «Về màn chiếu».
  const doiChe = (c: 'hoc' | 'bang', tuSanh = false): void => {
    if (!k) return
    setLoi('')
    if (c === 'hoc') {
      // (thầy 12/11 «từ bảng sang học lại chuyển sang màn chọn không lưu màn học tức thì») màn Học đang dở = tờ bài của bảng HOẶC tấm hoạt động đang mở
      // (Chữa câu khó… + tờ riêng của nó; lúc sang «Bảng» em dựng bảng trắng đè lên) ⇒ về đúng màn ấy; chỉ khi chưa có gì mới mở bảng chọn.
      const coBai = coTo() && !laToBang()
      if (tuSanh || (!coBai && !hdMo)) { setChon(true); return }
      if (coBai) toLenTren(); else hienHoatDong()
      setSanh(false); setChon(false); datKhoi({ ...k, che: 'hoc' })
    } else {
      setSanh(false); setChon(false); datKhoi({ ...k, che: 'bang' })
      // Tờ đang hiện (bài của bảng, tờ riêng của tấm hoạt động) ⇒ CHÍNH tờ ấy sang chế độ Bảng (trang bút riêng): không dựng tờ thứ hai, đổi tức thì, một nguồn nét.
      if (toDangHien()) return
      toLenTren(); if (!coTo()) dungBangTrang()
    }
  }
  const [moi, setMoi] = useState(0)
  // Đếm tin mới chỉ khi cột đang đóng (nghe lại mỗi lần đóng / mở); mở cột ⇒ về 0 ngay trong thao tác bấm.
  useEffect(() => (chat ? undefined : kenh.nghe('chat', (t) => { if ((t.x as { c?: string } | null)?.c && t.s !== 'gv') setMoi((n) => n + 1) })), [chat])
  const doiChat = (): void => { setMoi(0); setChat((c) => !c) }
  // Cụm điều khiển nằm trong khay nút bốn ô của TỜ (thầy 12/11 «phần nút này bị rối, chuyển nó vào trong cái 4 nút»): tờ báo bấm bằng sự kiện `ddh-lkt`
  // (qua thay-noi.ts); số tin mới báo ngược lại bằng `ddh-lkt-moi`. Cụm nổi của app chỉ còn lúc BẢNG ĐUA đang hiện (tờ bị che, không có nút bốn ô).
  const lenhTo = useRef<(v: string) => void>(() => {})
  lenhTo.current = (v) => { if (v === 'hoc' || v === 'bang') doiChe(v); else if (v === 'lop') { setChon(false); setSanh(true) } else if (v === 'chon') setChon(true); else if (v === 'chat') doiChat(); else if (v === 'mt') setMt((c) => !c); else if (v === 'hieu') setHieu((c) => !c); else if (v.startsWith('luat:')) { const [, b, n] = v.split(':'); datLuat(b === '1', Number(n) || 3) } else if ((v === 'khay' || v === 'ngoai') && !hinh) setChat(false) }
  useEffect(() => { const f = (e: Event) => lenhTo.current(String((e as CustomEvent<string>).detail)); window.addEventListener('ddh-lkt', f); return () => window.removeEventListener('ddh-lkt', f) }, [])
  // PHÍM / ở cửa sổ app = hỏi nhanh «Hiểu chưa?» (cùng chỗ nghe với Tab). PHÍM TAB ở cửa sổ app (tấm hoạt động, lúc tiêu điểm không nằm trong tờ) = đổi Học ⇄ Bảng; trong tờ thì tờ tự nghe (live-khoi-to-chieu.ts). Bảng danh sách /
  // bảng chọn / đang gõ tin nhắn: Tab giữ nghĩa thường.
  const tabDuoc = dang && !sanh && !chon
  useEffect(() => {
    if (!tabDuoc) return
    const f = (e: KeyboardEvent) => {
      if ((e.key !== 'Tab' && e.key !== '/') || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.repeat || (e.target as HTMLElement | null)?.closest?.('input,textarea,select,[contenteditable]')) return
      e.preventDefault(); lenhTo.current(e.key === '/' ? 'hieu' : layView()?.live?.khoi?.che === 'bang' ? 'hoc' : 'bang')
    }
    window.addEventListener('keydown', f, true)
    return () => window.removeEventListener('keydown', f, true)
  }, [tabDuoc])
  const moiBao = chat ? 0 : moi
  useEffect(() => { window.dispatchEvent(new CustomEvent('ddh-lkt-moi', { detail: { moi: moiBao, chat } })) }, [moiBao, chat])
  // BẤM RA NGOÀI ⇒ cột tin nhắn tự thu (thầy 12/11): bấm trong app (ngoài cột, ngoài cụm nút) thì thu tại đây; bấm vào tờ thì tờ báo về (`ngoai`).
  useEffect(() => {
    if (!chat || hinh) return // cột cố định không tự thu
    const f = (e: PointerEvent) => { if (!(e.target as Element | null)?.closest?.('.lkt-chat')) setChat(false) }
    window.addEventListener('pointerdown', f, true)
    return () => window.removeEventListener('pointerdown', f, true)
  }, [chat, hinh])
  // Phím M đóng / mở cột tin nhắn (không khi thầy đang gõ chữ).
  useEffect(() => {
    if (!dang) return
    const f = (e: KeyboardEvent) => {
      const d = e.target as HTMLElement | null
      if (e.key.toLowerCase() !== 'm' || e.ctrlKey || e.metaKey || e.altKey || (d && (d.tagName === 'INPUT' || d.tagName === 'TEXTAREA' || d.isContentEditable))) return
      e.preventDefault(); e.stopPropagation(); setMoi(0); setChat((c) => !c)
    }
    window.addEventListener('keydown', f, true)
    return () => window.removeEventListener('keydown', f, true)
  }, [dang])
  // Máy tính hiện tới khi thầy bấm nút máy tính lần nữa; ở bảng danh sách / bảng chọn thì tạm cất, về màn chiếu hiện lại nguyên chỗ. Nút trên tờ sáng theo.
  // Esc giữ nguyên nghĩa «lùi một màn» (không đụng máy tính).
  const mtHien = mt && dang && !sanh && !chon
  useEffect(() => { window.dispatchEvent(new CustomEvent('ddh-mt', { detail: mt && dang })) }, [mt, dang])
  // ESC LÙI MỘT MÀN (thầy 12/11): tin nhắn → chọn bài → bài / bảng → danh sách lớp → (hết) ra Hôm nay. Phòng chờ: Esc ra Hôm nay.
  const esc = useRef<() => boolean>(() => false)
  esc.current = () => {
    if (!dang) return false
    if (chat && !hinh) { setChat(false); return true }
    if (chon) { setChon(false); return true }
    // tấm hoạt động đang nằm DƯỚI tờ vừa chiếu ⇒ Esc đưa tấm lên lại (lùi một màn: về danh sách câu của hoạt động); đang ở trên ⇒ đóng tấm
    if (sanh) return false
    // tờ vừa chiếu TỪ tấm hoạt động ⇒ Esc về tấm (chọn câu kế); còn lại Esc về bảng danh sách. Không đóng tấm / tờ: «Về màn chiếu» đưa lại đúng chỗ.
    if (hdMo && hdDuoi()) { hienHoatDong(); return true }
    setSanh(true)
    return true
  }
  useEffect(() => { datEscLive(() => esc.current()); return () => datEscLive(null) }, [])
  if (!k && dangMo != null) return <div className="lkt" style={KIEU}><div className="lkt-dang-mo" role="status">Đang mở phòng chờ Khối {dangMo}…</div></div>
  if (!v || !k || v.ketThuc) return null
  if (k.gd === 'cho') return <div className="lkt" style={KIEU}><PhongChoThay v={v} khoi={k.k} /></div>
  return (
    <div className={cot ? 'lkt co-cot' : 'lkt'} style={KIEU}>
      {!sanh && !chon && hdMo && hdTren && !toRieng && coTo() ? <button type="button" className="lkt-ve chinh lkt-ve-noi" onClick={toLenTren}>Về màn chiếu</button> : null}
      {sanh ? <SanhLive v={v} khoi={k.k} che={k.che} loi={loi} coVe={coToChieu()} onChe={(c) => doiChe(c, true)} onDong={() => setSanh(false)} /> : null}
      {chon ? (
        <div className="lkt-chon"><div className="lkt-san-khau" style={{ ['--k' as string]: k1 }}>
          <div className="lkt-chon-dau"><i aria-hidden="true" />Live Khối {k.k}<small>{v.ds.filter((e) => e.vao).length} em trong phòng</small>{coToChieu() ? <button type="button" className="lkt-ve chinh" onClick={() => { setChon(false); setSanh(false) }}>Về màn chiếu</button> : null}</div>
          <Suspense fallback={<div className="lkt-dang-mo" role="status">Đang mở chọn bài…</div>}>
            <ChonCauBpu live buoiId={v.buoiId} lop={v.lop} buocDau="hd" onDong={() => setChon(false)}
              onChieu={async (ds) => { const l = await chieuCau(ds); if (!l) sangHoc(); return l }}
              onHoatDong={(hd) => { setChon(false); setSanh(false); void moHoatDong(hd) }}
              onKetThuc={() => ketThucBuoiHoc(v.buoiId)} />
          </Suspense>
        </div></div>
      ) : null}
      {cot ? (
        // DẢI «CHỈ THẦY THẤY» dưới phần chiếu: các thẻ của riêng thầy (giơ tay, xin vào lại) nằm ở đây, không đè lên bảng.
        <div className="lkt-dai" role="group" aria-label="Chỉ thầy thấy">
          <span className="lkt-dai-nhan" aria-hidden="true">Chỉ thầy thấy</span>
          <div className="lkt-dai-the"><small>Trong lớp</small><p><b>{v.ds.filter((e) => e.vao).length}</b>em</p></div>
          <HangTay v={v} />
          {v.luat ? <Suspense fallback={null}><LuatRoiThay luat={v.luat} ds={v.ds} onDuyet={duyetLuat} /></Suspense> : null}
        </div>
      ) : (
        <>
          <HangTay v={v} />
          {dang && v.luat ? <Suspense fallback={null}><LuatRoiThay luat={v.luat} ds={v.ds} onDuyet={duyetLuat} /></Suspense> : null}
        </>
      )}
      {cot ? <aside className="lkt-cot"><Suspense fallback={null}><CotChatThay kenh={kenh} coDinh /></Suspense></aside> : chat && !hinh ? <div className="lkt-chat"><Suspense fallback={null}><CotChatThay kenh={kenh} /></Suspense></div> : null}
      {mtHien ? <Suspense fallback={null}><MayTinhThay kenh={kenh} /></Suspense> : null}
      {hieu && dang && !sanh && !chon ? <Suspense fallback={null}><HoiHieuThay kenh={kenh} tong={v.live?.xem || v.ds.filter((e) => e.vao).length} /></Suspense> : null}
    </div>
  )
}

/** HÀNG GIƠ TAY + MIC CỦA EM (thầy 12/11 «cài mic của hs vào», bản vẽ 05): thẻ nhỏ góc dưới-trái, chỉ hiện khi có em giơ tay / được mời / đang nói.
 *  Mỗi lúc MỘT em nói (luật phòng); em nói thì thầy và cả lớp cùng nghe. */
function HangTay({ v }: { v: ViewBang }) {
  const l = v.live
  const [mo, setMo] = useState(true)
  if (!l?.bat) return null
  const ten = (sbd: string): string => v.ds.find((e) => e.sbd === sbd)?.ten ?? sbd
  const noi = l.noi[0] ?? null, moi = !noi && l.moi ? l.moi.sbd : '', tay = l.tay
  if (!noi && !moi && !tay.length) return null
  return (
    <div className="lkt-tay" role="group" aria-label="Mic của các em">
      {noi ? <div className="lkt-tay-noi"><i aria-hidden="true" /><b>{noi.ten}</b><span>đang nói</span><button type="button" onClick={() => lenhMic('live-thu-mic', noi.sbd)}>Tắt mic em</button></div> : null}
      {moi ? <div className="lkt-tay-noi cho"><i aria-hidden="true" /><b>{ten(moi)}</b><span>đã mời, chờ em bật mic</span><button type="button" onClick={() => lenhMic('live-thu-mic', moi)}>Thôi</button></div> : null}
      {tay.length ? (
        <>
          <button type="button" className="lkt-tay-dau" aria-expanded={mo} onClick={() => setMo((m) => !m)}><b>{tay.length}</b> em giơ tay<span aria-hidden="true">{mo ? '▾' : '▸'}</span></button>
          {mo ? (
            <ul>
              {tay.map((t, i) => <li key={t.sbd}><span>{i + 1}. {ten(t.sbd)}</span><button type="button" onClick={() => lenhMic('live-moi', t.sbd)}>Mời nói</button></li>)}
              <li className="het"><button type="button" onClick={() => lenhMic('live-ha-tay')}>Hạ hết tay</button></li>
            </ul>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

/** SẢNH LIVE: danh sách các em đã vào theo bốn đội + hai nút chọn chế độ. */
function SanhLive({ v, khoi, che, loi, coVe, onChe, onDong }: { v: ViewBang; khoi: number; che: 'hoc' | 'bang' | 'sanh'; loi: string; /** Đang có tờ / tấm hoạt động để quay lại. */ coVe: boolean; onChe: (c: 'hoc' | 'bang') => void; onDong: () => void }) {
  // Tiếng tự bật lúc «Bắt đầu live» (thay-khoi.ts). Quá 6 giây chưa bật (mic bị chặn / chưa cắm) ⇒ nút «Bật tiếng lại».
  const dangNghe = !!v.live?.bat
  const [cham, setCham] = useState(false)
  useEffect(() => { if (dangNghe) return; const h = setTimeout(() => setCham(true), 6000); return () => clearTimeout(h) }, [dangNghe])
  const vao = useMemo(() => v.ds.filter((e) => e.vao), [v.ds])
  const [dangKt, setDangKt] = useState(false)
  const ketThuc = async () => { if (dangKt) return; setDangKt(true); if (await ketThucBuoiHoc(v.buoiId)) setDangKt(false) }
  return (
    <div className="lkt-cho sanh" role="dialog" aria-modal="true" aria-label={`Live Khối ${khoi}`}>
      <header>
        <span className="lkt-the live"><i aria-hidden="true" />Đang live · Khối {khoi}</span>
        <span className="lkt-the">{vao.length} em trong phòng</span>
        <span className="lkt-the" data-tieng={dangNghe ? 'bat' : 'cho'}>{dangNghe ? 'Các em đang nghe thầy' : cham ? 'Chưa bật được tiếng' : 'Đang bật tiếng…'}</span>
        {!dangNghe && cham ? <button type="button" className="lkt-ve" onClick={() => { setCham(false); batTiengLai() }}>Bật tiếng lại</button> : null}
        <span className="gian" />
        {coVe ? <button type="button" className="lkt-ve chinh" onClick={onDong}>Về màn chiếu</button> : null}
        <button type="button" className="lkt-dong" onClick={() => void ketThuc()} disabled={dangKt}>{dangKt ? 'Đang kết thúc…' : 'Kết thúc live'}</button>
      </header>
      <div className="lkt-doi">
        {DOI_BPU.map((d, i) => {
          const em = vao.filter((e) => e.doi === i)
          return (
            <section key={d.ky} style={{ ['--doi' as string]: `var(${d.mau})` }}>
              <h3><b>{d.ky}</b>{d.ten}<small>{em.length} em</small></h3>
              <ul>{em.map((e) => <li key={e.sbd}>{e.ten}</li>)}{em.length ? null : <li className="rong">Chưa có em nào</li>}</ul>
            </section>
          )
        })}
      </div>
      <footer>
        <p>Các em đang ở bảng danh sách này. Thầy chọn chế độ, máy các em chuyển theo ngay.{loi ? <strong role="alert"> {loi}</strong> : null}</p>
        <button type="button" className="lkt-che-to" data-chon={che === 'hoc' || undefined} onClick={() => onChe('hoc')}><b>Học</b><span>Chọn bài, chiếu câu, cả lớp làm trên máy</span></button>
        <button type="button" className="lkt-che-to" data-chon={che === 'bang' || undefined} onClick={() => onChe('bang')}><b>Bảng</b><span>Bảng xanh than kín màn để giảng lý thuyết</span></button>
      </footer>
    </div>
  )
}

function PhongChoThay({ v, khoi }: { v: ViewBang; khoi: number }) {
  const [dang, setDang] = useState(false)
  const [loi, setLoi] = useState('')
  const vao = useMemo(() => v.ds.filter((e) => e.vao), [v.ds])
  const dsLop = useMemo(() => vao.map((e) => ({ sbd: e.sbd, ten: e.ten, doi: e.doi })), [vao])
  const batDau = async () => {
    if (dang) return
    setDang(true); setLoi('')
    // Bắt đầu ⇒ cả lớp (máy thầy lẫn máy em) vào bảng danh sách; tiếng thầy tự bật ngay (thay-khoi.ts theo dõi `gd = dang`), không cần tờ.
    datKhoi({ k: khoi, gd: 'dang', che: 'sanh' })
    const p = phienCua(v.buoiId)
    const r = p ? await batDauLiveKhoi(p.id) : null
    if (r && !r.ok) setLoi(r.chu)
    setDang(false)
  }
  const dong = async () => {
    if (dang) return
    setDang(true)
    const chu = await ketThucBuoiHoc(v.buoiId)
    if (chu) { setLoi(chu); setDang(false) }
  }
  return (
    <div className="lkt-cho" role="dialog" aria-modal="true" aria-label={`Phòng chờ Khối ${khoi}`}>
      <header>
        <span className="lkt-the cho"><i aria-hidden="true" />Phòng chờ · Khối {khoi}</span>
        <span className="lkt-the">Đã vào {vao.length} em</span>
        <span className="gian" />
        <button type="button" className="lkt-dong" onClick={() => void dong()} disabled={dang}>Đóng phòng</button>
      </header>
      <div className="lkt-san"><Suspense fallback={null}><TroSinhTon toi={null} ds={dsLop} kenh={kenh} soEm={vao.length} xemThoi /></Suspense></div>
      <div className="lkt-doi">
        {DOI_BPU.map((d, i) => {
          const em = vao.filter((e) => e.doi === i)
          // Trò Sinh Tồn: mỗi đội luôn đủ 4 trên sân — thiếu em thì máy bù (cùng luật với phòng: src/lib/live-khoi/sinh-ton-may.ts).
          const soMay = vao.length ? Math.max(0, 4 - em.length) : 0
          return (
            <section key={d.ky} style={{ ['--doi' as string]: `var(${d.mau})` }}>
              <h3><b>{d.ky}</b>{d.ten}<small>{em.length} em{soMay ? ` · ${soMay} máy` : ''}</small></h3>
              <ul>{em.map((e) => <li key={e.sbd}>{e.ten}</li>)}{Array.from({ length: soMay }, (_, k) => <li key={`may-${k}`} className="may">Máy</li>)}{em.length || soMay ? null : <li className="rong">Chưa có em nào</li>}</ul>
            </section>
          )
        })}
      </div>
      <footer>
        <p>Các em đang chơi Sinh Tồn trong lúc chờ. Đội thiếu người có máy bù cho đủ 4; em vào sau tự thay máy.{loi ? <strong role="alert"> {loi}</strong> : null}</p>
        <button type="button" className="lkt-bat-dau" onClick={() => void batDau()} disabled={dang}>{dang ? 'Đang bắt đầu…' : 'Bắt đầu live'}</button>
      </footer>
    </div>
  )
}

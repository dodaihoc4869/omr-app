// XEM LẠI LIVE — TRANG MỘT BUỔI (đợt X2; đặc tả mục 2.1, 3, 4.5, 4.8; bản vẽ ảnh 12–18, 26, 27). Màn trong app dựng từ `buoi.json`:
// bìa (một nút chính «Phát cả N đoạn») → dòng thời gian → bảng vàng → danh sách đoạn riêng từng em → thẻ từng câu. Máy tính: hai cột, trình phát nhúng.
// Dữ liệu: `GET /live-tep/<id>/buoi.json?ve=` + (app học sinh) `GET /hs/live-buoi?id=` cho kết quả riêng của em và vé mới. 404 ⇒ «Thầy đã gỡ buổi này.»
// AN TOÀN: chỉ hiện câu có trong `buoi.json`; không gọi lệnh nào khác để lấy đề / đáp án. App thầy mở xem (`nguon: 'gv'`): không có phần riêng từng em.
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { BuoiLiveJson, DoanBuoiLive, TraLiveBuoiHs } from '../../../lib/live/xem-lai-kieu'
import { BtCup, BtLua, BtLui, BtMatMang, BtMui, BtPhat, BtSao, BtTich } from './bieu-tuong'
import { TEN_DOI_MAC_DINH, type MangChang } from './kieu'
import { gocMayChu, taiBuoiJson, taiBuoiRieng } from './may-chu'
import { chuDaXem, danhDauMo, danhDauXem, docDaXem, khoaEm } from './nho-may'
import { CHU_NHAN, cauTheoSo, dangXemNhat, doanHopLe, dongThoiGian, ketQuaEm, sapDoan } from './sap-doan'
import TheCau from './TheCau'
import { dongNgay, gioPhat, gioVn, mauDoi, soLieuBuoi, soPhut, tenBai, tenDayDu } from './ten-hien'
import './xem-lai.css'

const TrinhPhat = lazy(() => import('./TrinhPhat'))

export interface PropsTrangBuoi {
  id: string
  /** Vé tệp từ danh sách (null = chưa có / đã cất trên máy không kèm vé ⇒ xin qua `/hs/live-buoi`). */
  ve: string | null
  nguon: 'hs' | 'gv'
  /** Token phiên của em (chỉ `nguon: 'hs'`). */
  token?: string
  dong: () => void
  nhanLui?: string
}
type TrangThai = { loai: 'tai' } | { loai: 'loi' } | { loai: 'go' } | { loai: 'ok'; buoi: BuoiLiveJson; ve: string; rieng: TraLiveBuoiHs | null; goc: string }
const doiCss = (doi: number | null): CSSProperties => ({ ['--doi' as string]: mauDoi(doi) })
const soVn = (n: number): string => Math.round(n).toLocaleString('vi-VN')

function useKhoRong(q: string): boolean {
  const [khop, setKhop] = useState(() => typeof matchMedia === 'function' && matchMedia(q).matches)
  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const m = matchMedia(q), f = () => setKhop(m.matches)
    f()
    if (m.addEventListener) { m.addEventListener('change', f); return () => m.removeEventListener('change', f) }
    m.addListener(f); return () => m.removeListener(f) // Safari đời cũ
  }, [q])
  return khop
}

export default function TrangBuoi({ id, ve: veDau, nguon, token, dong, nhanLui = 'Về danh sách buổi live' }: PropsTrangBuoi) {
  const [tt, setTt] = useState<TrangThai>({ loai: 'tai' })
  const [lan, setLan] = useState(0)
  const khoa = useMemo(() => (nguon === 'hs' && token ? khoaEm(token) : ''), [nguon, token])
  useEffect(() => {
    let huy = false
    setTt({ loai: 'tai' })
    void (async () => {
      const hRieng = nguon === 'hs' && token ? taiBuoiRieng(token, id) : null
      const [goc, kb0, kr] = await Promise.all([gocMayChu(), veDau ? taiBuoiJson(id, veDau) : null, hRieng])
      if (huy) return
      if (kr && !kr.ok && kr.loai === 'go') { setTt({ loai: 'go' }); return }
      const rieng = kr?.ok ? kr.d : null
      let ve = veDau, kb = kb0
      // vé từ danh sách đã hết hạn / chưa có ⇒ dùng vé mới của `/hs/live-buoi`
      if ((!kb || (!kb.ok && kb.loai === 'loi')) && rieng && rieng.ve !== veDau) { ve = rieng.ve; kb = await taiBuoiJson(id, ve); if (huy) return }
      if (!kb || !ve) { setTt({ loai: 'loi' }); return }
      if (!kb.ok) { setTt({ loai: kb.loai === 'go' ? 'go' : 'loi' }); return }
      if (khoa) danhDauMo(khoa, id)
      setTt({ loai: 'ok', buoi: kb.d, ve, rieng, goc })
    })()
    return () => { huy = true }
  }, [id, veDau, nguon, token, khoa, lan])

  // Thành phần đề của màn làm bài (mảnh đã nằm trong kho tải ngầm của app học sinh); chưa về ⇒ đề hiện chữ trơn.
  const [LC, setLC] = useState<MangChang | null>(null)
  useEffect(() => { let huy = false; void import('../../../components/hoc-tap/ManLamBaiTap').then((m) => { if (!huy) setLC(m.PHAN_CAU_CHANG) }).catch(() => {}); return () => { huy = true } }, [])

  const mayTinh = useKhoRong('(min-width: 900px)')
  /** Điện thoại / máy bảng: trình phát phủ kín. */
  const [phat, setPhat] = useState<{ vt: number } | null>(null)
  /** Máy tính: trình phát nhúng — lệnh nhảy tới đoạn + đoạn đang đứng. */
  const [lenh, setLenh] = useState<{ vt: number; so: number } | null>(null)
  const [vtNhung, setVtNhung] = useState(0)
  const oPhat = useRef<HTMLDivElement>(null)
  const buoi = tt.loai === 'ok' ? tt.buoi : null
  const [daXem, setDaXem] = useState<number[]>([])
  useEffect(() => { if (buoi) setDaXem(khoa ? docDaXem(khoa, buoi.id, buoi.ban) : []) }, [buoi, khoa])
  const khiXem = useCallback((stt: number) => {
    if (!buoi) return
    setDaXem((c) => (c.includes(stt) ? c : khoa ? danhDauXem(khoa, buoi.id, buoi.ban, stt) : c.concat(stt)))
  }, [buoi, khoa])
  const khiGo = useCallback(() => { setPhat(null); setTt({ loai: 'go' }) }, [])
  const hang = useMemo(() => (buoi ? doanHopLe(buoi) : []), [buoi])

  const dau = (chu?: string) => <header className="xl-dau">
    <button type="button" className="xl-lui" onClick={dong} aria-label={nhanLui}><BtLui /></button>
    <div><p>{chu ?? 'Xem lại Live'}</p></div>
  </header>
  if (tt.loai === 'tai') return <main className="xl-trang" aria-busy="true">{dau()}
    <p role="status" className="xl-chan" style={{ position: 'absolute', opacity: 0 }}>Đang mở buổi live…</p>
    <div className="xl-xuong" style={{ height: 300, borderRadius: 30, marginBottom: 14 }} aria-hidden="true" /><div className="xl-xuong" style={{ height: 130, borderRadius: 26, marginBottom: 14 }} aria-hidden="true" /><div className="xl-xuong" style={{ height: 220, borderRadius: 26 }} aria-hidden="true" />
  </main>
  if (tt.loai === 'go') return <main className="xl-trang">{dau()}
    <section className="xl-kinh xl-trong" role="alert"><b>Thầy đã gỡ buổi này.</b><p>Buổi live này không còn để xem lại.</p><button type="button" className="xl-nut chinh" onClick={dong}>Về danh sách</button></section>
  </main>
  if (tt.loai === 'loi' || !buoi) return <main className="xl-trang">{dau()}
    <section className="xl-kinh xl-trong" role="alert"><div className="hinh" aria-hidden="true"><BtMatMang s={40} /></div><b>Chưa tải được. Em thử lại.</b><p>Buổi live này chưa về tới máy em.</p><button type="button" className="xl-nut chinh" onClick={() => setLan((n) => n + 1)}>Thử lại</button></section>
  </main>

  const { rieng, ve, goc } = tt
  // số liệu của bìa đếm trên các đoạn / câu THẬT SỰ hiện (đoạn trỏ tới câu vắng mặt trong `buoi.json` đã bị bỏ)
  const sl = { ...soLieuBuoi(buoi), doan: hang.length, phutDoan: soPhut(hang.reduce((s, d) => s + d.t1 - d.t0, 0) / 1000) }
  const co = cauTheoSo(buoi), ds = sapDoan(buoi, rieng), nhat = dangXemNhat(buoi)
  const tenDoi = buoi.bangVang?.doi.map((d) => d.ten) ?? TEN_DOI_MAC_DINH
  const gioDau = gioVn(buoi.batLuc), gioCuoi = gioVn(buoi.tatLuc) || (gioDau ? gioVn(new Date(Date.parse(buoi.batLuc) + buoi.msLive).toISOString()) : '')
  const phatDoan = (d: DoanBuoiLive) => {
    const vt = hang.findIndex((x) => x.stt === d.stt)
    if (vt < 0) return
    if (mayTinh) { setLenh((c) => ({ vt, so: (c?.so ?? 0) + 1 })); try { oPhat.current?.scrollIntoView({ block: 'nearest' }) } catch { /* máy cũ */ } }
    else setPhat({ vt })
  }
  const denCau = (so: number | null) => { if (so != null) try { document.getElementById(`xl-cau-${so}`)?.scrollIntoView({ block: 'start' }) } catch { /* máy cũ */ } }

  const bia = <section className="xl-bia-buoi" aria-label={tenDayDu({ ...buoi, soCau: sl.cau, giayLive: buoi.msLive / 1000 })}>
    <div className="tren"><i aria-hidden="true" />Xem lại Live</div><h1>{tenBai(buoi)}</h1>
    <p className="so">{dongNgay(buoi)}{gioDau ? ` · live từ ${gioDau}` : ''}</p>
    <div className="xl-so so"><div><b>{sl.cau}</b><span>câu</span></div><div><b>{sl.phutLive}</b><span>phút live</span></div><div><b>{sl.doan}</b><span>đoạn xem lại</span></div></div>
    {hang.length ? <button type="button" className="xl-nut" onClick={() => phatDoan(hang[0]!)}><BtPhat s={20} />{hang.length > 1 ? `Phát cả ${hang.length} đoạn` : 'Phát đoạn chữa bài'} · {sl.phutDoan} phút</button> : <p>Buổi này chưa có đoạn chữa bài nào.</p>}
    {nhat ? <button type="button" className="xl-nen" onClick={() => phatDoan(nhat.doan)}><BtSao /><span>{nhat.chu}</span><BtMui s={18} /></button> : null}
  </section>
  const khuc = dongThoiGian(buoi)
  const dongTg = <section className="xl-kinh xl-the"><h2>Dòng thời gian<small className="so">{sl.phutLive} phút</small></h2>
    <div className="xl-tg">{khuc.map((k, i) => <button key={i} type="button" className={k.doan ? `chua${k.hay ? ' hay' : ''}` : undefined} disabled={k.cau == null} style={{ flex: `${Math.max(1, Math.round(k.phan * 1000))} 1 0`, ...(k.doan ? doiCss(k.doi) : null) }}
      aria-label={k.doan ? `Câu ${k.cau}: đoạn chữa trên bảng${k.hay ? ', đoạn đáng xem' : ''}. Chạm để tới câu ${k.cau}` : k.cau != null ? `Lớp làm bài câu ${k.cau}. Chạm để tới câu ${k.cau}` : 'Lớp làm bài'} onClick={() => denCau(k.cau)}>{k.doan ? <b className="so">{k.cau}</b> : null}</button>)}</div>
    {gioDau ? <div className="xl-tg-chu so"><span>{gioDau}</span><span>{gioCuoi}</span></div> : null}
    <div className="xl-chu-giai"><span><i aria-hidden="true" />Lớp làm bài</span><span><i aria-hidden="true" style={{ background: 'var(--p-tim-2)' }} />Chữa trên bảng (màu đội của bạn lên bảng)</span><span><BtSao s={14} />Đoạn đáng xem (app tự chọn)</span></div>
  </section>
  const bv = buoi.bangVang
  const doiXep = bv ? bv.doi.map((d, i) => ({ ...d, i })).sort((a, b) => b.kj - a.kj) : []
  const kjLon = Math.max(1, ...doiXep.map((d) => d.kj))
  const bangVang = bv ? <section className="xl-kinh xl-the"><h2>Bảng vàng</h2>
    {bv.doiThang != null && bv.doi[bv.doiThang] ? <div className="xl-thang-doi" style={doiCss(bv.doiThang)}><span className="cup" aria-hidden="true"><BtCup /></span><div><b>{bv.doi[bv.doiThang]!.ten} thắng</b>
      <span className="so">{soVn(bv.doi[bv.doiThang]!.kj)} kJ{doiXep[1] && doiXep[0]!.kj > doiXep[1].kj ? ` · hơn đội nhì ${soVn(doiXep[0]!.kj - doiXep[1].kj)} kJ` : ''}</span></div></div> : null}
    <div className="xl-doi so">{doiXep.map((d) => [<span key={`t${d.i}`} className="ten" style={doiCss(d.i)}><i className="xl-cham" aria-hidden="true" />{d.ten}</span>, <span key={`b${d.i}`} className="thanh" style={doiCss(d.i)} aria-hidden="true"><i style={{ width: `${Math.round((d.kj / kjLon) * 100)}%` }} /></span>, <span key={`k${d.i}`} className="kj">{soVn(d.kj)} kJ</span>])}</div>
    {bv.top.length ? <div className="xl-top">{bv.top.slice(0, 3).map((e, i) => <div key={i}><i aria-hidden="true">{i + 1}</i><b>{e.ten}</b><span className="so">{soVn(e.kj)} kJ</span></div>)}</div> : null}
    {bv.chuoi ? <div className="xl-chuoi"><BtLua /><span>Chuỗi đúng dài nhất: {bv.chuoi.ten} · {bv.chuoi.so} câu liền</span></div> : null}
  </section> : null
  const sttDangPhat = mayTinh ? hang[vtNhung]?.stt : undefined
  const dsDoan = ds.length ? <section className="xl-kinh xl-the" aria-label="Danh sách đoạn chữa bài"><h2>{ds.length} đoạn chữa bài{khoa ? <small className="so">{chuDaXem(daXem.filter((s) => ds.some((e) => e.doan.stt === s)).length, ds.length)}</small> : null}</h2>
    {ds.map(({ doan: d, cau: c, nhan }) => <button key={d.stt} type="button" className="xl-doan" aria-current={sttDangPhat === d.stt ? 'true' : undefined} onClick={() => phatDoan(d)} aria-label={`Phát ${d.ten} · ${gioPhat(d.t1 - d.t0)}${nhan.length ? ` · ${nhan.map((n) => CHU_NHAN[n]).join(' · ')}` : ''}`}>
      <span className="o so" aria-hidden="true">{c.so}</span>
      <span className="giua"><b>Câu {c.so}{c.dang ? ` · ${c.dang}` : ''}{d.phan > 1 ? ` (phần ${d.phan})` : ''}</b>
        <span className="so">{d.lenBang ? `${d.lenBang.ten} lên bảng` : 'Thầy chữa'} · {gioPhat(d.t1 - d.t0)}{nhan.map((n) => <em key={n} className={n === 'em-len-bang' ? 'len' : n === 'dang-xem' ? 'hay' : undefined}>{CHU_NHAN[n]}</em>)}</span></span>
      {daXem.includes(d.stt) ? <span className="xem"><BtTich /><span className="sr-only">Đã xem</span></span> : null}
    </button>)}
  </section> : null
  const theCau = (so: number, khongBia = false) => { const c = co.get(so); return c ? <TheCau key={c.so} cau={c} doan={hang.filter((d) => d.cau === c.so)} ketQua={ketQuaEm(c, rieng)} LC={LC} tenDoi={tenDoi} khiPhat={phatDoan} khongBia={khongBia} daXem={daXem} /> : null }
  const chan = <p className="xl-chan">Thầy Đỗ Đại Học · {buoi.lop ? `chỉ lớp ${buoi.lop} xem được buổi này` : 'chỉ các em đã điểm danh buổi này xem được'}</p>

  if (mayTinh) {
    const soDang = hang[vtNhung]?.cau
    return <main className="xl-trang xl-mt">{dau(`Xem lại Live${buoi.lop ? ` · Lớp ${buoi.lop}` : ''}`)}
      <div className="trai">{bia}{dongTg}{bangVang}</div>
      <div className="phai">
        {hang.length ? <>
          <div ref={oPhat} className="xl-phat-nhung"><Suspense fallback={null}><TrinhPhat nhung goc={goc} buoi={buoi} ve={ve} hang={hang} batDau={0} tuPhat={false} lenh={lenh} LC={LC} tenDoi={tenDoi} khiDoan={setVtNhung} khiXem={khiXem} khiGo={khiGo} /></Suspense></div>
          <div className="xl-hai-phat"><div>{soDang != null ? theCau(soDang, true) : null}</div><div>{dsDoan}</div></div>
        </> : null}
        {buoi.cau.filter((c) => !hang.length || c.so !== soDang).map((c) => theCau(c.so))}{chan}
      </div>
    </main>
  }
  return <>
    <main className="xl-trang">{dau()}
      <div className="xl-hai"><div>{bia}{dongTg}{bangVang}</div><div>{dsDoan}{buoi.cau.map((c) => theCau(c.so))}{chan}</div></div>
    </main>
    {phat ? <Suspense fallback={null}><TrinhPhat goc={goc} buoi={buoi} ve={ve} hang={hang} batDau={phat.vt} tuPhat LC={LC} tenDoi={tenDoi} dong={() => setPhat(null)} khiXem={khiXem} khiGo={khiGo} /></Suspense> : null}
  </>
}

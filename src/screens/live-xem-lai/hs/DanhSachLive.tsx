// XEM LẠI LIVE — MÁY EM: danh sách buổi live của lớp (đặc tả mục 2.1, 3; bản vẽ docs/ban-ve-live-xem-lai-1011 ảnh 05–11).
// Buổi mới nhất là thẻ lớn (một nút chính «Xem buổi này»), buổi cũ xếp theo tháng. Trạng thái: đang tải (khung xương) · rỗng · buổi đang dựng (tự hỏi lại
// tới khi xong) · mất mạng (hiện danh sách đã lưu trên máy) · lỗi máy chủ («Thử lại»). Chỉ gọi `GET /hs/live-ds` (nhớ 10 phút).
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { TraLiveDsHs } from '../../../lib/live/xem-lai-kieu'
import { batVongTrucTiep } from '../../../lib/nhip-ben-vung'
import { BtLive, BtLui, BtMatMang, BtMui, BtPhat } from './bieu-tuong'
import { HOI_LAI_DANG_DUNG_MS } from './kieu'
import { dsDaLuu, taiDs, type KetQua } from './may-chu'
import { chuDaXem, docDaMo, docDaXem, khoaEm } from './nho-may'
import { dongNgay, nhanThang, soPhut, tachNgay, tenBai, tenDayDu } from './ten-hien'

type Buoi = TraLiveDsHs['buoi'][number]
type TrangThai = { loai: 'tai' } | { loai: 'loi' } | { loai: 'ok'; d: TraLiveDsHs; matMang: boolean }

/** Ảnh bìa một đoạn / một buổi: bảng đen thu nhỏ (giấy đề trái, phấn phải) + nút phát + thời lượng. Hình minh hoạ, không mang nội dung câu. */
export function BiaBang({ dai, nhan }: { dai?: string; nhan?: string }) {
  return <span className="xl-bia">
    <span className="giay" aria-hidden="true">{[14, 26, 38, 56].map((t, i) => <i key={t} style={{ top: `${t}%`, width: `${[74, 82, 58, 40][i]}%` }} />)}</span>
    <span className="phan" aria-hidden="true"><i /><i /><i /><i /></span>
    <span className="phat" aria-hidden="true"><BtPhat s={26} /></span>
    {nhan ? <span className="nhan">{nhan}</span> : null}
    {dai ? <span className="dai so">{dai}</span> : null}
  </span>
}

export default function DanhSachLive({ token, dong, onMo }: { token: string; dong: () => void; onMo: (b: { id: string; ve: string | null }) => void }) {
  const khoa = useMemo(() => khoaEm(token), [token])
  const [tt, setTt] = useState<TrangThai>({ loai: 'tai' })
  const nhan = useCallback((k: KetQua<TraLiveDsHs>) => {
    if (k.ok) { setTt({ loai: 'ok', d: k.d, matMang: false }); return }
    // Mất mạng ⇒ danh sách đã lưu trên máy (nếu có). Lỗi máy chủ khi đang có danh sách ⇒ giữ danh sách đang hiện.
    const luu = k.loai === 'mang' ? dsDaLuu(token) : null
    setTt((c) => (luu ? { loai: 'ok', d: luu, matMang: true } : c.loai === 'ok' ? c : { loai: 'loi' }))
  }, [token])
  const tai = useCallback((moi: boolean) => taiDs(token, moi).then(nhan), [token, nhan])
  useEffect(() => { let huy = false; void taiDs(token, false).then((k) => { if (!huy) nhan(k) }); return () => { huy = true } }, [token, nhan])
  const dangDung = tt.loai === 'ok' && !tt.matMang && tt.d.buoi.some((b) => b.trangThai === 'dang_xu_ly')
  // buổi đang dựng ⇒ tự hỏi lại: lượt sau chỉ hẹn khi lượt trước xong, lỗi thì thưa dần, tab ẩn thì bỏ lượt (vòng hỏi trực tiếp của app, không `setInterval`)
  useEffect(() => {
    if (!dangDung) return
    const v = batVongTrucTiep(async () => { if (document.hidden) return true; const k = await taiDs(token, true); nhan(k); return k.ok }, HOI_LAI_DANG_DUNG_MS)
    return () => v.dung()
  }, [dangDung, token, nhan])
  const matMang = tt.loai === 'ok' && tt.matMang
  useEffect(() => { if (!matMang) return; const f = () => void tai(true); window.addEventListener('online', f); return () => window.removeEventListener('online', f) }, [matMang, tai])

  const daMo = docDaMo(khoa)
  const xong = tt.loai === 'ok' ? tt.d.buoi.filter((b) => b.trangThai === 'xong') : []
  const dung = tt.loai === 'ok' ? tt.d.buoi.filter((b) => b.trangThai === 'dang_xu_ly') : []
  const lop = tt.loai === 'ok' ? tt.d.buoi.find((b) => b.lop)?.lop ?? '' : ''
  const [{ namNay, homNay }] = useState(() => { const d = new Date(Date.now() + 7 * 3600_000); return { namNay: d.getUTCFullYear(), homNay: d.toISOString().slice(0, 10) } }) // ngày theo giờ Việt Nam
  const chuXem = (b: Buoi): string => chuDaXem(docDaXem(khoa, b.id, b.ban).length, b.soDoan)
  const mo = (b: Buoi) => () => onMo({ id: b.id, ve: b.ve })

  const dau = <header className="xl-dau">
    <button type="button" className="xl-lui" onClick={dong} aria-label="Về Lộ trình"><BtLui /></button>
    <div><h1>Xem lại Live</h1>{tt.loai === 'ok' && (lop || xong.length) ? <p className="so">{[lop && `Lớp ${lop}`, xong.length ? `${xong.length} buổi` : ''].filter(Boolean).join(' · ')}</p> : null}</div>
  </header>

  if (tt.loai === 'tai') return <main className="xl-trang xl-tds" aria-busy="true">{dau}
    <p className="xl-chan" role="status" style={{ position: 'absolute', opacity: 0 }}>Đang tải danh sách buổi live…</p>
    <section className="xl-kinh xl-noi" aria-hidden="true"><div className="xl-xuong" style={{ height: 170, borderRadius: 18 }} /><div className="xl-xuong" style={{ height: 24, width: '62%', margin: '14px 4px 8px' }} /><div className="xl-xuong" style={{ height: 16, width: '44%', margin: '0 4px 14px' }} /><div className="xl-xuong" style={{ height: 48, borderRadius: 16 }} /></section>
    <section className="xl-kinh xl-ds" aria-hidden="true">{[0, 1, 2].map((i) => <div key={i} className="xl-buoi"><div className="xl-xuong" style={{ width: 52, height: 56, borderRadius: 16, flex: 'none' }} /><div className="giua"><div className="xl-xuong" style={{ height: 16, width: `${[78, 64, 70][i]}%` }} /><div className="xl-xuong" style={{ height: 12, width: '50%', marginTop: 8 }} /></div></div>)}</section>
  </main>
  if (tt.loai === 'loi') return <main className="xl-trang xl-tds">{dau}
    <section className="xl-kinh xl-trong" role="alert"><div className="hinh" aria-hidden="true"><BtMatMang s={40} /></div><b>Chưa tải được. Em thử lại.</b><p>Danh sách buổi live chưa về tới máy em.</p><button type="button" className="xl-nut chinh" onClick={() => { setTt({ loai: 'tai' }); void tai(true) }}>Thử lại</button></section>
  </main>
  if (!xong.length && !dung.length) return <main className="xl-trang xl-tds">{dau}
    {matMang ? <div className="xl-bao" role="status"><BtMatMang />Mất mạng. Đang hiện danh sách đã lưu trên máy.</div> : null}
    <section className="xl-kinh xl-trong"><div className="hinh" aria-hidden="true"><BtLive s={44} /></div><b>Lớp em chưa có buổi live nào</b><p>Khi thầy live trên lớp, buổi sẽ tự hiện ở đây sau khi kết thúc để em xem lại.</p><button type="button" className="xl-nut vien" onClick={dong}>Về Lộ trình</button></section>
  </main>

  const moiNhat = xong[0], cu = xong.slice(1)
  const nhom: { nhan: string; ds: Buoi[] }[] = []
  for (const b of cu) { const nhan = nhanThang(b.ngay, namNay), c = nhom[nhom.length - 1]; if (c && c.nhan === nhan) c.ds.push(b); else nhom.push({ nhan, ds: [b] }) }
  return <main className="xl-trang xl-tds">{dau}
    {matMang ? <div className="xl-bao" role="status"><BtMatMang />Mất mạng. Đang hiện danh sách đã lưu trên máy.</div> : null}
    {dung.map((b) => { const n = tachNgay(b.ngay); return <section key={b.id} className="xl-kinh xl-xuly" role="status"><span className="vong" aria-hidden="true" /><div><b>{b.ngay === homNay ? 'Buổi hôm nay' : n ? `Buổi ${n.thu} ${n.dd}/${n.mm}` : 'Buổi vừa xong'} đang được dựng</b><span className="so">{n ? `${n.thu} ${n.dd}/${n.mm} · ` : ''}thường xong dưới 1 phút</span></div></section> })}
    <div className="xl-hai">
      {moiNhat ? <div><section className="xl-kinh xl-noi" aria-label={tenDayDu(moiNhat)}>
        <BiaBang nhan={daMo.includes(moiNhat.id) ? undefined : 'Mới'} dai={`${soPhut(moiNhat.giayDoan)} phút xem lại`} />
        <h2>{tenBai(moiNhat)}</h2><p className="phu so">{dongNgay(moiNhat)}</p>
        <div className="xl-hang so"><span className="xl-chip">{moiNhat.soCau} câu</span><span className="xl-chip">{soPhut(moiNhat.giayLive)} phút live</span><span className="xl-chip">{moiNhat.soDoan} đoạn chữa bài</span>
          {moiNhat.lenBang.length ? <span className="xl-chip chinh">Em lên bảng câu {moiNhat.lenBang.join(', ')}</span> : null}
          {docDaXem(khoa, moiNhat.id, moiNhat.ban).length ? <span className="xl-chip">{chuXem(moiNhat)}</span> : null}</div>
        <button type="button" className="xl-nut chinh" onClick={mo(moiNhat)}><BtPhat s={20} />Xem buổi này</button>
      </section></div> : null}
      {nhom.length ? <div>{nhom.map((g) => <div key={g.nhan}><p className="xl-thang">{g.nhan}</p>
        <section className="xl-kinh xl-ds">{g.ds.map((b) => { const n = tachNgay(b.ngay); return <button key={b.id} type="button" className="xl-buoi" onClick={mo(b)} aria-label={`${tenDayDu(b)} · ${chuXem(b)}`}>
          <span className="xl-ngay" aria-hidden="true"><small>{n?.thuNgan ?? ''}</small><b className="so">{n?.dd ?? ''}</b></span>
          <span className="giua"><b>{tenBai(b)}</b><span className="so">{b.soCau} câu · {soPhut(b.giayLive)} phút · {chuXem(b)}</span></span><BtMui />
        </button> })}</section></div>)}</div> : null}
    </div>
  </main>
}

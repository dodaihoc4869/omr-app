// THÀNH TÍCH · HUY HIỆU (bản vẽ tp-13, thầy chốt 26/10) + màn phủ «Huy hiệu mới» (thông báo `huy_hieu`, D3 thẻ lật 3D lấp lánh).
// Đọc /hs/huy-hieu → {ma, ten, co, tienDo?, ngay?}[] (hợp đồng 4.4). Xếp nhóm theo mã: chuỗi ngày · giải tuần · bài hoàn hảo · Kim cương · học cùng bạn ·
// đặc biệt. Nhóm của phần thầy đang tắt (giải / bạn bè / Kim cương) ẩn hẳn. KHÔNG nhãn nhịp học / bậc chăm (học sinh không thấy).
import { useRef, type CSSProperties, type ReactNode } from 'react'
import { Flame, Trophy } from 'lucide-react'
import { bungHat, hoatAnh, phanHoiThuong } from '../../lib/hieu-ung-thuong'
import { DUONG, HANG_GIAI, layHuyHieu, type HangGiai, type HuyHieu, type ThongBao } from '../../lib/thuong-api'
import { HuyHieuKimLoai, HuyHieuMau, NET, TEN_HANG, Tia, type MauHuyHieu } from './hinh'
import { useTai, useTongQuan } from './dung-thuong'
import { Cho, Loi, ManToan, NutDay, ngayNgan, useHieuUng } from './chung'
import { DauVe } from './ManChuoi'
import { Bi } from '../linh-vat/Bi'

type Nhom = 'chuoi' | 'giai' | 'hoan-hao' | 'kim-cuong' | 'doi' | 'dac-biet'
const TEN_NHOM: Record<Nhom, string> = { chuoi: 'Chuỗi ngày', giai: 'Giải tuần', 'hoan-hao': 'Chặng hoàn hảo', 'kim-cuong': 'Thử thách Kim cương', doi: 'Học cùng bạn', 'dac-biet': 'Đặc biệt' }
const RE_HANG = /^(?:hang|giai)[_-](sat|dong|bac|vang|bachkim|kimcuong)$/
/** Phân nhóm + hình của một huy hiệu theo mã (mã máy chủ: chuoi_7, hang_bac / giai_bac, quan_quan, hoan_hao_10, kim_cuong_<chuyên đề>, doi_7 / chuoi_doi_7…). */
export function hinhHuyHieu(h: Pick<HuyHieu, 'ma' | 'ten'>): { nhom: Nhom; hinh: (khoa: boolean) => ReactNode } {
  const ma = h.ma.toLowerCase()
  const so = (re: RegExp) => Number(re.exec(ma)?.[1])
  const mau = (m: MauHuyHieu, chu?: string | number, net?: ReactNode) => (khoa: boolean) => <HuyHieuMau mau={m} chu={chu} coChu={String(chu ?? '').length >= 3 ? 26 : 34} khoa={khoa}>{net}</HuyHieuMau>
  let m: RegExpExecArray | null
  if ((m = /^(?:chuoi[_-]doi|doi)[_-](\d+)$/.exec(ma))) return { nhom: 'doi', hinh: mau('tt', m[1]) }
  if (/^chuoi[_-]\d+$/.test(ma)) return { nhom: 'chuoi', hinh: mau('lua', so(/(\d+)$/)) }
  if ((m = RE_HANG.exec(ma))) { const hang = m[1] as HangGiai; return { nhom: 'giai', hinh: (khoa) => <HuyHieuKimLoai hang={hang} khoa={khoa} an /> } }
  if (/quan[_-]?quan/.test(ma)) return { nhom: 'giai', hinh: mau('sao', undefined, NET.cup) }
  if (/^hoan[_-]hao[_-](\d+)$/.test(ma)) return { nhom: 'hoan-hao', hinh: mau('sao', so(/(\d+)$/)) }
  if (/^(?:kim[_-]?cuong|kc)[_|-]/.test(ma)) return { nhom: 'kim-cuong', hinh: (khoa) => <HuyHieuKimLoai hang="kimcuong" khoa={khoa} an /> }
  if (/day[_-]?chuyen/.test(ma)) return { nhom: 'dac-biet', hinh: mau('lua', undefined, NET.set) }
  if (/cu[_-]?dem/.test(ma)) return { nhom: 'dac-biet', hinh: mau('tin', undefined, NET.trang) }
  return { nhom: 'dac-biet', hinh: mau('sao', undefined, NET.cup) }
}
const tenGon = (h: HuyHieu, nhom: Nhom) => (nhom === 'kim-cuong' ? h.ten.replace(/^(Thử thách\s+)?Kim cương\s*[·:-]?\s*/i, '') || h.ten : h.ten)

export function ManHuyHieu({ token, onVe, moi }: { token?: string; onVe?: () => void; /** mã huy hiệu vừa nhận ⇒ thẻ lật (D3) */ moi?: string }) {
  const tq = useTongQuan(token).du
  const { du: ds, tai, loi, thuLai } = useTai(token, DUONG.huyHieu, layHuyHieu)
  useHieuUng((h) => {
    const el = moi ? [...document.querySelectorAll('[data-hh-ma]')].find((e) => e.getAttribute('data-hh-ma') === moi) : null
    const hh = el?.querySelector('.tp-hh')
    if (!hh) return
    phanHoiThuong('huyHieu')
    hoatAnh(hh, [{ transform: 'perspective(400px) rotateY(180deg) scale(.7)', opacity: 0.3 }, { transform: 'perspective(400px) rotateY(90deg) scale(.9)', opacity: 1, offset: 0.45 }, { transform: 'perspective(400px) rotateY(-12deg) scale(1.15)', offset: 0.8 }, { transform: 'none' }], 800, { tre: 300 })
    hoatAnh(el?.querySelector('.tp-moi'), [{ transform: 'scale(0)' }, { transform: 'scale(1.3)' }, { transform: 'none' }], 300, { tre: 1000 })
    h.sau(750, () => bungHat(hh, { n: 12, r: 60, mau: ['sao', 'trang', 'lua'] }))
  }, [!!ds, moi])
  if (!ds) return <div className="tp-goc tp-vo"><DauVe onVe={onVe} />{tai ? <Cho so={4} /> : <Loi chu={loi || 'Chưa xem được huy hiệu.'} onThuLai={thuLai} />}</div>
  const bat = tq?.bat
  const tatNhom = (n: Nhom) => (n === 'giai' && bat?.giai === false) || (n === 'doi' && bat?.banBe === false) || (n === 'kim-cuong' && bat?.kimCuong === false)
  const nhom = new Map<Nhom, { h: HuyHieu; hinh: (k: boolean) => ReactNode }[]>()
  for (const h of ds) { const x = hinhHuyHieu(h); if (tatNhom(x.nhom)) continue; if (!nhom.has(x.nhom)) nhom.set(x.nhom, []); nhom.get(x.nhom)!.push({ h, hinh: x.hinh }) }
  const co = ds.filter((h) => h.co && !tatNhom(hinhHuyHieu(h).nhom)).length, tong = [...nhom.values()].reduce((s, x) => s + x.length, 0)
  const cao = HANG_GIAI.slice().reverse().find((x) => ds.some((h) => h.co && RE_HANG.exec(h.ma.toLowerCase())?.[1] === x))
  const the = (n: Nhom) => nhom.get(n)?.length ? <section key={n} className="tp-the" aria-label={TEN_NHOM[n]}><h2>{TEN_NHOM[n]}</h2>
    <div className="tp-luoi-hh" role="list">{nhom.get(n)!.map(({ h, hinh }) => {
      const p = h.tienDo ? Math.round((100 * h.tienDo.da) / h.tienDo.can) : undefined
      return <div key={h.ma} className="tp-o-hh" role="listitem" data-hh-ma={h.ma} aria-label={`${h.ten}: ${h.co ? `đã có${h.ngay ? `, ngày ${ngayNgan(h.ngay)}` : ''}` : h.tienDo ? `${h.tienDo.da}/${h.tienDo.can}` : 'chưa có'}`}>
        {hinh(!h.co)}
        <b>{tenGon(h, n)}{h.ma === moi && <> <span className="tp-moi">Mới</span></>}</b>
        {!h.co && p !== undefined && <div className="tp-thanh" data-sac="sao" style={{ '--p': `${p}%` } as CSSProperties}><i /></div>}
        <small>{h.co ? (h.ngay ? `đạt ${ngayNgan(h.ngay)}` : 'đã có') : h.tienDo ? `${h.tienDo.da}/${h.tienDo.can}` : 'chưa có'}</small>
      </div>
    })}</div></section> : null
  const chuoi = tq?.chuoiNgay?.so
  return <div className="tp-goc tp-vo" data-man="huy-hieu">
    <DauVe onVe={onVe} />
    {loi && <Loi chu={loi} onThuLai={thuLai} />}
    <div className="tp-luoi2">
      <div className="c">
        <h1 className="tp-tieu">Thành tích</h1>
        <div className="tp-tong4">
          {chuoi !== undefined && <div><span className="tp-o" data-sac="sao"><Flame aria-hidden="true" /></span><div><b>{chuoi} ngày</b><span className="tp-mo">chuỗi hiện tại</span></div></div>}
          {tq?.chuoiNgay?.daiNhat !== undefined && <div><span className="tp-o" data-sac="lua"><Trophy aria-hidden="true" /></span><div><b>{tq.chuoiNgay.daiNhat} ngày</b><span className="tp-mo">chuỗi dài nhất</span></div></div>}
          {cao && <div><HuyHieuKimLoai hang={cao} an /><div><b>{TEN_HANG[cao]}</b><span className="tp-mo">hạng cao nhất</span></div></div>}
          <div><span className="tp-o" data-sac="lua"><Trophy aria-hidden="true" /></span><div><b>{co}/{tong}</b><span className="tp-mo">huy hiệu đã có</span></div></div>
        </div>
        {tong === 0 && <div className="tp-trong"><b>Huy hiệu đang được chuẩn bị</b><span>Học đều mỗi ngày để nhận huy hiệu đầu tiên.</span></div>}
        {the('chuoi')}{the('giai')}
      </div>
      <div className="c">{the('hoan-hao')}{the('kim-cuong')}{the('doi')}{the('dac-biet')}</div>
    </div>
  </div>
}

/** Màn phủ «Huy hiệu mới» (thông báo `huy_hieu` {ma, ten}) — D3. */
export function ManHuyHieuMoi({ tb, onXem, onDong }: { tb: ThongBao; onXem?: () => void; onDong: () => void }) {
  const ma = typeof tb.duLieu.ma === 'string' ? tb.duLieu.ma : ''
  const ten = typeof tb.duLieu.ten === 'string' ? tb.duLieu.ten : ''
  const hh = useRef<HTMLDivElement>(null), bi = useRef<HTMLDivElement>(null)
  useHieuUng((h) => {
    phanHoiThuong('huyHieu')
    hoatAnh(hh.current, [{ transform: 'perspective(500px) rotateY(-180deg) scale(.5)', opacity: 0 }, { transform: 'perspective(500px) rotateY(-90deg) scale(.8)', opacity: 1, offset: 0.4 }, { transform: 'perspective(500px) rotateY(20deg) scale(1.1)', offset: 0.8 }, { transform: 'none' }], 800)
    hoatAnh(bi.current, [{ transform: 'translateY(0)' }, { transform: 'translateY(-20px)' }, { transform: 'translateY(0)' }], 700, { tre: 500 })
    h.sau(650, () => bungHat(hh.current, { n: 14, r: 100, mau: ['sao', 'trang', 'tt'] }))
  }, [])
  if (!ma || !ten) return null
  const x = hinhHuyHieu({ ma, ten })
  return <ManToan nhan="Huy hiệu mới" onDong={onDong}
    day={<><NutDay chu={onXem ? 'Xem huy hiệu' : 'Tiếp tục'} onClick={onXem ?? onDong} />{onXem && <NutDay chu="Để sau" phu onClick={onDong} />}</>}>
    <main className="tp-man" data-hai="">
      <div className="cot-a">
        <div className="tp-hinh tp-hinh-to"><Tia className="quay" /><div ref={hh} className="hh-to">{x.hinh(false)}</div><div ref={bi} className="bi-o"><Bi cam="mung" size={100} /></div></div>
        <p className="tp-nhan">Huy hiệu mới · {TEN_NHOM[x.nhom]}</p>
        <h1>{ten}</h1>
      </div>
      <div className="cot-b"><section className="tp-the"><p className="tp-phu">Huy hiệu đã vào mục Thành tích của em.</p></section></div>
    </main>
  </ManToan>
}

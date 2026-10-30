// XẾP HẠNG HỌC SINH trên Hôm nay của thầy (thầy 30/10: «hiển thị lại rõ thông tin lười và chăm, đối phó như bản trước, làm rõ hơn đẹp hơn nhìn vào là tôi
// biết e nào lười nhất chăm nhất học thật nhất»). Bản «Một trang» (26/10) gấp các cột Lười nhất · Chăm nhất · Đối phó của bản trước vào tấm, chỉ để 3 em
// lười ⇒ nay đưa lại thành MỘT dải 4 cột ngay dưới dải số, mỗi cột 5 em đầu có số hạng 1–5:
//   · Lười nhất (nhóm Lười của Nhịp học, xếp theo số ngày thiếu) · Chăm nhất (nhóm Chăm, theo số ngày đủ mức) — cùng số, cùng phép xếp các cột cũ;
//   · Học thật nhất — bảng xếp «Học thật · Đối phó» hằng tuần (`/gv/danh-gia/lop`, bậc Học thật, Điểm Thật cao trước); nạp SAU khi màn đã vẽ (lúc rảnh);
//   · Đối phó nhiều nhất — «Có dấu hiệu đối phó» của Nhịp học (tín hiệu nặng trước), cùng số ô «Đối phó» trên dải số.
// Bấm một em ⇒ tấm Hồ sơ làm bài như các dòng em khác. «Xem đủ» ⇒ tấm danh sách đủ (cột cũ có ô tìm). Điện thoại: một thẻ, 4 thẻ chọn nhóm.
import { useEffect, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { chuCham, chuLuoi, nangDoiPho, type DongNhipHoc } from '../../lib/nhip-hoc-thay'
import { layLopHocThat, TEN_BAC_GV, type CheDo, type EmLop } from '../../lib/hoc-that-api'

export type CotXep = 'luoi' | 'cham' | 'hoc-that' | 'doi-pho'
export const SO_EM_XEP = 5

/** Bảng Học thật của cả trung tâm — nạp lúc rảnh sau khi Hôm nay đã vẽ (không chen lượt tải mở màn). Lỗi / máy chủ cũ ⇒ cột ghi lý do, không bịa. */
export type HocThatLop = { tt: 'cho' } | { tt: 'loi'; chu: string } | { tt: 'co'; cheDo: CheDo; em: EmLop[] }
export function useHocThatLop(bat: boolean): HocThatLop {
  const [kq, setKq] = useState<HocThatLop>({ tt: 'cho' })
  useEffect(() => {
    if (!bat) return
    let huy = false
    const chay = () => { void layLopHocThat().then((r) => { if (!huy) setKq(r.ok ? { tt: 'co', cheDo: r.du.cheDo, em: r.du.em } : { tt: 'loi', chu: r.chu }) }) }
    const ric = (window as unknown as { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }).requestIdleCallback
    const h = ric ? ric(chay, { timeout: 1500 }) : window.setTimeout(chay, 300)
    return () => {
      huy = true
      const cic = (window as unknown as { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback
      if (ric && cic) cic(h); else window.clearTimeout(h)
    }
  }, [bat])
  return kq
}

/** Em Học thật trong phần đang lọc (Khối / lớp theo Nhịp học), Điểm Thật cao trước. Em không có trong Nhịp học chỉ hiện khi không lọc. */
export function xepHocThat(em: readonly EmLop[], dong: readonly { sbd: string; khoi: string; lop: string }[], loc: { khoi: string | null; lop: string }): EmLop[] {
  const theoSbd = new Map(dong.map((d) => [d.sbd, d]))
  return em
    .filter((e) => e.bac === 1 && e.duDuLieu)
    .filter((e) => {
      if (!loc.khoi && !loc.lop) return true
      const d = theoSbd.get(e.sbd)
      if (!d) return false
      return (!loc.khoi || d.khoi === loc.khoi) && (!loc.lop || d.lop === loc.lop)
    })
    .sort((a, b) => b.diem - a.diem || a.ten.localeCompare(b.ten, 'vi') || a.sbd.localeCompare(b.sbd))
}

/** Chữ bên phải một em ở cột Đối phó: tín hiệu nặng nhất bằng số. */
export function chuDoiPho(d: DongNhipHoc): { chinh: string; phu: string } {
  const q = d.doiPho?.quaNhanh, c = d.doiPho?.chonLap
  const pq = q && q.coGiay ? q.nhanh / q.coGiay : 0, pc = c && c.tong ? c.trongChuoi / c.tong : 0
  if (q && pq >= pc) return { chinh: `${q.nhanh}/${q.coGiay} câu quá nhanh`, phu: q.dungNhanh !== null ? `nhóm câu ấy đúng ${q.dungNhanh}%` : '' }
  if (c) return { chinh: `${c.trongChuoi}/${c.tong} câu chọn lặp`, phu: `chọn ${c.chu} ${c.dai} lần liền` }
  return { chinh: `${Math.round(nangDoiPho(d.doiPho))}% tín hiệu`, phu: '' }
}

const TIEU: Record<CotXep, { ten: string; ngan: string; phu: string }> = {
  luoi: { ten: 'Lười nhất', ngan: 'Lười', phu: 'thiếu nhiều ngày nhất' },
  cham: { ten: 'Chăm nhất', ngan: 'Chăm', phu: 'đủ mức nhiều ngày nhất' },
  'hoc-that': { ten: 'Học thật nhất', ngan: 'Học thật', phu: 'Điểm Thật cao nhất tuần' },
  'doi-pho': { ten: 'Đối phó nhiều nhất', ngan: 'Đối phó', phu: 'làm cho xong, không học' },
}

interface DongXep { sbd: string; ten: string; lop: string; chinh: string; phu: string; nhanDoc: string }

/** Ruột một dòng em: số hạng tròn · tên (một dòng, cắt «…» khi hẹp) · con số chính (không bao giờ cắt) + lớp (co lại khi hẹp) · dòng lý do (ẩn ở dải 4 cột, hiện ở thẻ chọn / tấm). */
function DongChu({ i, d }: { i: number; d: DongXep }) {
  return <>
    <span className="xh-hang gvv2-so" aria-hidden="true">{i + 1}</span>
    <span className="xh-ten" aria-hidden="true" title={d.ten}>{d.ten}</span>
    <span className="xh-so gvv2-so" aria-hidden="true"><b>{d.chinh}</b>{d.lop && <small>· {d.lop}</small>}</span>
    {d.phu && <span className="xh-phu" aria-hidden="true">{d.phu}</span>}
  </>
}

function Cot({ k, ds, tong, chuTrong, oTab, onMoEm, onXemDu }: {
  k: CotXep; ds: readonly DongXep[]; tong: number; chuTrong: string; oTab?: boolean
  onMoEm: (sbd: string, nut: HTMLButtonElement) => void; onXemDu: (k: CotXep) => void
}) {
  const t = TIEU[k]
  return (
    <section className="gvv2-the xh-cot" data-cot={k} aria-labelledby={oTab ? undefined : `xh-tieu-${k}`} aria-label={oTab ? `${t.ten} · ${tong} em` : undefined}>
      {!oTab && (
        <div className="xh-dau">
          <h3 id={`xh-tieu-${k}`}>{t.ten}</h3>
          <span className="xh-chip gvv2-so">{tong} em</span>
          <small>{t.phu}</small>
        </div>
      )}
      {ds.length === 0 ? (
        <p className="xh-trong">{chuTrong}</p>
      ) : (
        <ol className="xh-ds">
          {ds.map((d, i) => (
            <li key={d.sbd}>
              <button type="button" className="xh-em tt-nhan" data-hang={i + 1} onClick={(ev) => onMoEm(d.sbd, ev.currentTarget)} aria-label={`Hạng ${i + 1} ${t.ten.toLowerCase()}: ${d.nhanDoc} — xem hồ sơ làm bài`}>
                <DongChu i={i} d={d} />
              </button>
            </li>
          ))}
        </ol>
      )}
      {tong > ds.length && (
        <button type="button" className="gvv2-nut-chu tt-nhan xh-xem" aria-haspopup="dialog" onClick={() => onXemDu(k)}>
          Xem đủ {tong} em
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      )}
    </section>
  )
}

const tuNhip = (d: DongNhipHoc, c: { chinh: string; phu: string }): DongXep => ({
  sbd: d.sbd, ten: d.hoTen, lop: d.lop, chinh: c.chinh, phu: c.phu, nhanDoc: `${d.hoTen}${d.lop ? `, ${d.lop}` : ''}, ${c.chinh}${c.phu ? `, ${c.phu}` : ''}`,
})
export const dongHocThat = (e: EmLop): DongXep => ({
  sbd: e.sbd, ten: e.ten, lop: e.lop, chinh: `Điểm Thật ${e.diem}`, phu: e.lyDo[0] ?? TEN_BAC_GV[e.bac],
  nhanDoc: `${e.ten}${e.lop ? `, ${e.lop}` : ''}, Điểm Thật ${e.diem}, ${TEN_BAC_GV[e.bac]}`,
})

export default function XepHangEm(p: {
  luoi: readonly DongNhipHoc[]; cham: readonly DongNhipHoc[]; doiPho: readonly DongNhipHoc[]; hocThat: HocThatLop; hocThatDs: readonly EmLop[]
  hep: boolean; tenLoc: string; onMoEm: (sbd: string, nut: HTMLButtonElement) => void; onXemDu: (k: CotXep) => void
}) {
  const [tab, setTab] = useState<CotXep>('luoi')
  const ht = p.hocThat
  const cot: Record<CotXep, { ds: DongXep[]; tong: number; trong: string }> = {
    luoi: { ds: p.luoi.slice(0, SO_EM_XEP).map((d) => tuNhip(d, chuLuoi(d))), tong: p.luoi.length, trong: `Không em nào ở nhóm Lười${p.tenLoc}.` },
    cham: { ds: p.cham.slice(0, SO_EM_XEP).map((d) => tuNhip(d, chuCham(d))), tong: p.cham.length, trong: `Chưa có em nào ở nhóm Chăm${p.tenLoc}.` },
    'hoc-that': {
      ds: p.hocThatDs.slice(0, SO_EM_XEP).map(dongHocThat), tong: p.hocThatDs.length,
      trong: ht.tt === 'cho' ? 'Đang tải bảng Học thật…' : ht.tt === 'loi' ? `Chưa tải được bảng Học thật. ${ht.chu}`
        : ht.cheDo === 'tat' ? 'Thầy đang tắt xếp Học thật · Đối phó (mục Học sinh › Xếp học sinh).'
        : `Chưa có em nào ở bậc Học thật${p.tenLoc} (máy xếp mỗi thứ Hai).`,
    },
    'doi-pho': { ds: p.doiPho.slice(0, SO_EM_XEP).map((d) => tuNhip(d, chuDoiPho(d))), tong: p.doiPho.length, trong: `Không em nào có dấu hiệu đối phó${p.tenLoc}.` },
  }
  const thu: CotXep[] = ['luoi', 'cham', 'hoc-that', 'doi-pho']
  const veCot = (k: CotXep, oTab?: boolean) => <Cot key={k} k={k} ds={cot[k].ds} tong={cot[k].tong} chuTrong={cot[k].trong} oTab={oTab} onMoEm={p.onMoEm} onXemDu={p.onXemDu} />
  return (
    <section className="mt-xep" aria-labelledby="mt-xep-tieu">
      <h2 id="mt-xep-tieu" className="sr-only">Xếp hạng học sinh</h2>
      {p.hep ? (
        <div className="xh-tab-khung">
          <div className="xh-tab" role="tablist" aria-label="Xếp hạng học sinh">
            {thu.map((k) => (
              <button key={k} type="button" role="tab" id={`xh-tab-${k}`} aria-selected={tab === k} aria-controls="xh-tab-than" data-cot={k} className="xh-tab-nut tt-nhan" onClick={() => setTab(k)}>
                {TIEU[k].ngan} <span className="gvv2-so">{cot[k].tong}</span>
              </button>
            ))}
          </div>
          <div id="xh-tab-than" role="tabpanel" aria-labelledby={`xh-tab-${tab}`}>{veCot(tab, true)}</div>
        </div>
      ) : (
        <div className="xh-4cot">{thu.map((k) => veCot(k))}</div>
      )}
    </section>
  )
}

/** Tấm «Học thật nhất · xem đủ»: mọi em bậc Học thật trong phần đang lọc, Điểm Thật cao trước, có số hạng. */
export function DsHocThatDu({ ds, onMoEm }: { ds: readonly EmLop[]; onMoEm: (sbd: string, nut: HTMLButtonElement) => void }) {
  return <section className="gvv2-the xh-cot" data-cot="hoc-that" aria-label={`Học thật nhất · ${ds.length} em`}>
    <p className="xh-ghi">Bảng xếp «Học thật · Đối phó» máy tính mỗi thứ Hai; Điểm Thật càng cao càng học thật.</p>
    <ol className="xh-ds">{ds.map((e, i) => { const d = dongHocThat(e); return <li key={e.sbd}>
      <button type="button" className="xh-em tt-nhan" data-hang={i + 1} onClick={(ev) => onMoEm(e.sbd, ev.currentTarget)} aria-label={`Hạng ${i + 1} học thật nhất: ${d.nhanDoc} — xem hồ sơ làm bài`}>
        <DongChu i={i} d={d} />
      </button></li> })}</ol>
  </section>
}

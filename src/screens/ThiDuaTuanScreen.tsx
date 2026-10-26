// THI ĐUA TUẦN (app thầy) — hệ thưởng phạt kiểu Duolingo, thầy CHỐT bản vẽ 26/10 (ve-moi/tp-15-gv-thi-dua.html · docs/ban-ve-thuong-phat-2610).
// Một màn trả lời «lớp tôi thi đua tuần này ra sao»: chọn lớp · 4 công tắc thưởng phạt (Giải tuần, Thăng hoa, Học cùng bạn, Kim cương — đổi cần xác
// nhận một lần) · dải 4 số · bảng các em (nguyên tử học thật | bị loại, hạng giải bằng huy hiệu kim loại, chuỗi, nhãn Học thật / Đối phó, bậc tới ĐUỔI)
// sắp xếp theo cột · cặp học cùng. «Bị loại» = nguyên tử của lượt Đối phó: em vẫn thấy nhưng không cộng vào giải. Tên bậc «Không dạy nổi» / «ĐUỔI»
// chỉ ở app thầy. Số: GET /gv/thi-dua-tuan?lop= · GET/POST /gv/thuong/cong-tac (src/lib/thi-dua-tuan-api.ts). VẼ NGAY bản gần nhất lưu trên máy
// rồi mới cập nhật (thầy 26/10: «tốc độ luôn phải tức thì»). Mảnh NẠP LƯỜI (App.tsx), ngoài precache.
// Trình bày: thi-dua-tuan.css (giao diện thầy hiện có, biến M3) + trong-gv-thi-dua.css (dưới [data-trong='gv'], biến --tr-*).
import { useEffect, useMemo, useState } from 'react'
import { hoiXacNhan } from '../components/hop-thoai'
import { HuyHieuGiai, TEN_KL, THU_TU_KL } from '../components/HuyHieuGiai'
import { useLopThay } from '../lib/ten-lop-thay'
import {
  datCongTac, layCongTac, layThiDuaTuan, nhoDoc, nhoGhi, TEN_BAC,
  type Bac, type CongTac, type EmThiDua, type KhoaCongTac, type ThiDuaTuan,
} from '../lib/thi-dua-tuan-api'
// Hai tờ kiểu của màn đi CÙNG mảnh mã (?inline, gắn một lần lúc mảnh nạp, trước lần vẽ đầu): bớt một tên tệp .css trong bảng nạp của App ⇒ /gv không nặng thêm.
import cssThiDua from './thi-dua-tuan.css?inline'
import cssTrongThiDua from '../styles/trong-gv-thi-dua.css?inline'
import '../styles/trong-gv-ngang.css' // NGANG GV 26/10: dải biểu tượng điện thoại ngang + khung 1480 (≥ 1600) — mảnh CSS chung của các màn thầy, ngoài đường /gv

if (typeof document !== 'undefined') document.head.append(Object.assign(document.createElement('style'), { textContent: cssThiDua + cssTrongThiDua }))

export const CONG_TAC: readonly { khoa: KhoaCongTac; ten: string; mo: string; tat: string }[] = [
  { khoa: 'thuong_giai_tuan', ten: 'Giải tuần', mo: 'Các em vào giải tuần, xếp theo nguyên tử học thật', tat: 'Màn học sinh ẩn giải tuần và bảng xếp hạng; không chốt lên / xuống hạng cuối tuần.' },
  { khoa: 'thuong_thang_hoa', ten: 'Thăng hoa', mo: '2 ngày không học, không có bình ⇒ mất 10% tinh thể (5–50)', tat: 'Không em nào bị trừ tinh thể vì nghỉ học.' },
  { khoa: 'thuong_ban_be', ten: 'Học cùng bạn', mo: 'Mời tối đa 3 bạn, giữ chuỗi đôi, gõ cửa nhắc bạn', tat: 'Màn học sinh ẩn mục Học cùng bạn; chuỗi đôi đang có dừng lại.' },
  { khoa: 'thuong_kim_cuong', ten: 'Kim cương', mo: 'Thử thách 10 câu, 3 ống; trượt thì chờ 24 giờ', tat: 'Màn học sinh ẩn thử thách Kim cương.' },
]
const MAU_BAC: Readonly<Record<Bac, string>> = { 1: 'dung', 2: 'chu-y', 3: 'tin', 4: 'sai', 5: 'sai' }
const HIEN_DAU = 10

export type Cot = 'ten' | 'that' | 'loai' | 'hang' | 'chuoi' | 'nhan' | 'bac'
const COT: readonly { cot: Cot; ten: string }[] = [
  { cot: 'ten', ten: 'Em' }, { cot: 'that', ten: 'Nguyên tử tuần' }, { cot: 'hang', ten: 'Hạng giải' }, { cot: 'chuoi', ten: 'Chuỗi' }, { cot: 'nhan', ten: 'Nhãn' }, { cot: 'bac', ten: 'Bậc' },
]
const giaTri = (e: EmThiDua, c: Cot): number => c === 'that' ? e.nguyenTuThat : c === 'loai' ? e.nguyenTuLoai
  : c === 'hang' ? (e.hang ? (THU_TU_KL.indexOf(e.hang.kl) + 1) * 1e4 - (e.hang.thuHang ?? 9999) : 0)
  : c === 'chuoi' ? e.chuoi ?? -1 : c === 'nhan' ? (e.nhan === 'Học thật' ? 2 : e.nhan ? 1 : 0) : c === 'bac' ? e.bacDuoi ?? 0 : 0
/** Sắp xếp các em theo một cột (giảm dần = to trước; cột Em: không giảm = A–Z). Bằng nhau ⇒ nhiều nguyên tử học thật trước, rồi tên. */
export function sapXep(ds: readonly EmThiDua[], cot: Cot, giam: boolean): EmThiDua[] {
  const d = giam ? -1 : 1
  return [...ds].sort((a, b) => (cot === 'ten' ? d * a.ten.localeCompare(b.ten, 'vi') : d * (giaTri(a, cot) - giaTri(b, cot)))
    || b.nguyenTuThat - a.nguyenTuThat || a.ten.localeCompare(b.ten, 'vi'))
}
/** Các cặp học cùng (mỗi cặp một lần, chuỗi đôi dài trước). */
export function capHocCung(ds: readonly EmThiDua[]): { a: string; b: string; n: number | null }[] {
  const da = new Set<string>(), kq: { a: string; b: string; n: number | null }[] = []
  for (const e of ds) for (const b of e.hocCung) {
    const k = [e.ten, b.ten].sort().join('|')
    if (da.has(k)) continue
    da.add(k)
    kq.push({ a: e.ten, b: b.lop && b.lop !== e.lop ? `${b.ten} (${b.lop})` : b.ten, n: b.chuoiDoi })
  }
  return kq.sort((x, y) => (y.n ?? -1) - (x.n ?? -1))
}
/** «21:05» giờ Việt Nam (UTC+7) — viết tại chỗ để mảnh màn không kéo thêm mảnh định dạng (mỗi mảnh phụ là một tên tệp trong bảng nạp của App). */
const gioVn = (t: number) => { const d = new Date(t + 7 * 3_600_000), h = (n: number) => String(n).padStart(2, '0'); return `${h(d.getUTCHours())}:${h(d.getUTCMinutes())}` }
const soVi = (n: number) => n.toLocaleString('vi-VN')
/** «26/10 – 1/11» từ ngày thứ Hai «YYYY-MM-DD». */
export function khoangTuan(t: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t)
  if (!m) return ''
  const a = new Date(Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!)), b = new Date(a.getTime() + 6 * 86_400_000)
  return `${a.getUTCDate()}/${a.getUTCMonth() + 1} – ${b.getUTCDate()}/${b.getUTCMonth() + 1}`
}
const docNho = (lop: string): ThiDuaTuan | null => { const d = lop ? nhoDoc<ThiDuaTuan>(`td:${lop}`) : null; return d && Array.isArray(d.ds) ? d : null }

const Lua = ({ tat }: { tat?: boolean }) => (
  <svg className={`tdt-lua${tat ? ' tat' : ''}`} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path d="M12 1.5c1 3.6 5.8 6 5.8 12a5.8 5.8 0 0 1-11.6 0c0-2.7 1.3-4.4 2.6-5.6.2 1.6.9 2.6 1.9 3C10.3 7.6 10.6 4.6 12 1.5z" />
  </svg>
)
const NguyenTu = ({ e }: { e: EmThiDua }) => (
  <span className="tdt-nt">
    <span className="tdt-xep" aria-hidden="true"><i style={{ flex: e.nguyenTuThat || 0.001 }} /><i style={{ flex: e.nguyenTuLoai || 0.001 }} /></span>
    <span className="tdt-nt-so" aria-label={`${e.nguyenTuThat} học thật, ${e.nguyenTuLoai} bị loại`}><b>{soVi(e.nguyenTuThat)}</b> | <span className="tdt-loai">{soVi(e.nguyenTuLoai)}</span></span>
  </span>
)
const Hang = ({ e }: { e: EmThiDua }) => e.hang
  ? <span className="tdt-hang"><HuyHieuGiai kl={e.hang.kl} co={22} />{TEN_KL[e.hang.kl]}{e.hang.thuHang ? ` #${e.hang.thuHang}` : ''}</span>
  : <span className="tdt-mo">chưa vào bảng</span>
const Nhan = ({ e }: { e: EmThiDua }) => e.nhan ? <span className="tdt-chip" data-m={e.nhan === 'Học thật' ? 'dung' : 'tin'}>{e.nhan}</span> : <span className="tdt-mo">—</span>
const BacChip = ({ b }: { b: Bac }) => <span className="tdt-chip" data-m={MAU_BAC[b]}>{b} · {TEN_BAC[b]}</span>

export default function ThiDuaTuanScreen() {
  const { ds: dsLop } = useLopThay()
  const [lop, setLop] = useState(() => nhoDoc<string>('lop') ?? '')
  const [bang, setBang] = useState<{ du: ThiDuaTuan | null; loi: string; tai: boolean }>(() => ({ du: docNho(lop), loi: '', tai: !!lop }))
  const [lan, setLan] = useState(0)
  const [ct, setCt] = useState<CongTac>(() => nhoDoc<CongTac>('ct') ?? {})
  const [ctLoi, setCtLoi] = useState('')
  const [ctDang, setCtDang] = useState<KhoaCongTac | null>(null)
  const [xep, setXep] = useState<{ cot: Cot; giam: boolean }>({ cot: 'that', giam: true })
  const [het, setHet] = useState(false)

  // Lớp nhớ trên máy không còn trong danh sách ⇒ lớp đầu tiên.
  useEffect(() => {
    if (dsLop && !dsLop.some((l) => l.tenLop === lop)) setLop(dsLop[0]!.tenLop)
  }, [dsLop, lop])
  useEffect(() => {
    if (!lop) return
    let con = true
    nhoGhi('lop', lop)
    setBang((b) => ({ du: b.du?.lop === lop ? b.du : docNho(lop), loi: '', tai: true }))
    void layThiDuaTuan(lop).then((r) => con && setBang((b) => (r.ok ? { du: r.du, loi: '', tai: false } : { du: b.du, loi: r.chu, tai: false })))
    return () => { con = false }
  }, [lop, lan])
  useEffect(() => {
    let con = true
    void layCongTac().then((r) => { if (!con) return; if (r.ok) { setCt(r.du); setCtLoi('') } else setCtLoi(r.chu) })
    return () => { con = false }
  }, [])

  const du = bang.du
  const ds = useMemo(() => sapXep(du?.ds ?? [], xep.cot, xep.giam), [du, xep])
  const tong = useMemo(() => {
    const e = du?.ds ?? []
    const that = e.reduce((s, x) => s + x.nguyenTuThat, 0), loai = e.reduce((s, x) => s + x.nguyenTuLoai, 0)
    return { that, loai, ti: that + loai > 0 ? Math.round((100 * loai) / (that + loai)) : null, doiPho: e.filter((x) => x.nhan === 'Đối phó').length, cap: capHocCung(e) }
  }, [du])
  const hien = het ? ds : ds.slice(0, HIEN_DAU)
  const bamCot = (cot: Cot) => setXep((x) => ({ cot, giam: x.cot === cot ? !x.giam : cot !== 'ten' }))

  const doiCongTac = async (k: (typeof CONG_TAC)[number]) => {
    const dang = ct[k.khoa]
    if (dang === undefined || ctDang) return
    const bat = !dang
    const dongY = await hoiXacNhan({
      tieuDe: `${bat ? 'Bật' : 'Tắt'} ${k.ten}?`,
      noiDung: bat ? `${k.mo}. Áp dụng cho mọi lớp ngay khi các em mở app.` : `${k.tat} Áp dụng cho mọi lớp; số đã có giữ nguyên, bật lại là hiện tiếp.`,
      nhanDongY: `${bat ? 'Bật' : 'Tắt'} ${k.ten}`,
      nguyHiem: !bat,
    })
    if (!dongY) return
    setCtDang(k.khoa)
    const r = await datCongTac(k.khoa, bat, ct)
    setCtDang(null)
    if (r.ok) { setCt(r.du); setCtLoi('') } else setCtLoi(`Chưa đổi được ${k.ten}: ${r.chu}`)
  }
  const xuat = () => {
    const dong = [['Em', 'Lớp', 'Nguyên tử học thật', 'Bị loại', 'Hạng giải', 'Thứ hạng', 'Chuỗi ngày', 'Nhãn', 'Bậc', 'Học cùng'],
      ...ds.map((e) => [e.ten, e.lop || du?.lop || '', e.nguyenTuThat, e.nguyenTuLoai, e.hang ? TEN_KL[e.hang.kl] : '', e.hang?.thuHang ?? '', e.chuoi ?? '', e.nhan ?? '', e.bacDuoi ? TEN_BAC[e.bacDuoi] : '', e.hocCung.map((b) => b.ten).join('; ')])]
    const csv = '﻿' + dong.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\r\n')
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })), download: `thi-dua-tuan-${(du?.lop || lop).replace(/\s+/g, '-')}.csv` })
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  const phu = [du?.lop || lop, du ? `${du.ds.length} em` : '', du?.tuan && khoangTuan(du.tuan) ? `tuần ${khoangTuan(du.tuan)}` : '', du?.capNhat ? `cập nhật ${gioVn(du.capNhat)}` : ''].filter(Boolean).join(' · ')
  return (
    <div className="gv-page tdt" data-vung="thi-dua-tuan">
      <div className="tdt-dau">
        <div className="tdt-dau-chu">
          <p className="tdt-nhan">{phu || ' '}</p>
          <h1 className="tdt-h1">Thi đua tuần</h1>
        </div>
        <div className="tdt-dau-nut">
          <label className="tdt-chon-lop">
            <span>Lớp:</span>
            <select value={lop} onChange={(e) => { setHet(false); setLop(e.target.value) }} aria-label="Chọn lớp" disabled={!dsLop}>
              {!dsLop && <option value={lop}>{lop || 'Đang tải…'}</option>}
              {dsLop?.map((l) => <option key={l.tenLop} value={l.tenLop}>{l.tenLop}</option>)}
            </select>
          </label>
          <button type="button" className="tdt-nut-vien tdt-an-doc" onClick={xuat} disabled={!ds.length}>Xuất bảng</button>
        </div>
      </div>

      <section className="tdt-the tdt-ct" aria-label="Công tắc thưởng phạt" data-vung="cong-tac">
        {CONG_TAC.map((k) => {
          const v = ct[k.khoa]
          return (
            <button key={k.khoa} type="button" className="tdt-ct-dong" role="switch" aria-checked={v === true} aria-busy={ctDang === k.khoa || undefined} disabled={v === undefined || !!ctDang} onClick={() => void doiCongTac(k)} data-khoa={k.khoa}>
              <span className="tdt-ct-chu"><b>{k.ten}</b><span>{v === undefined ? 'Chưa đọc được trạng thái' : k.mo}</span></span>
              <span className="tdt-cong" data-on={v ? '' : undefined} aria-hidden="true" />
            </button>
          )
        })}
        {ctLoi && <p className="tdt-loi-nho" role="alert">{ctLoi}</p>}
      </section>

      {du && du.ds.length > 0 && (
        <div className="tdt-kpi" data-vung="dai-so">
          <div><span>Nguyên tử học thật</span><b>{soVi(tong.that)}<small>cả lớp</small></b></div>
          <div><span>Bị loại khỏi giải</span><b className="tdt-loai">{soVi(tong.loai)}{tong.ti !== null && <small>{tong.ti}%</small>}</b></div>
          <div><span><i className="tdt-cham" aria-hidden="true" />Đối phó</span><b>{tong.doiPho}<small>em</small></b></div>
          <div><span>Cặp học cùng</span><b>{tong.cap.length}<small>cặp</small></b></div>
        </div>
      )}

      <section className="tdt-the tdt-bang-the" aria-label="Bảng thi đua tuần" data-vung="bang-thi-dua">
        <div className="tdt-the-dau">
          <h2>Bảng thi đua tuần</h2>
          <label className="tdt-xep-chon">
            <span>Xếp theo</span>
            <select value={`${xep.cot}:${xep.giam ? 1 : 0}`} onChange={(e) => { const [c, g] = e.target.value.split(':'); setXep({ cot: c as Cot, giam: g === '1' }) }}>
              <option value="that:1">Nguyên tử học thật</option>
              <option value="loai:1">Bị loại nhiều nhất</option>
              <option value="hang:1">Hạng giải</option>
              <option value="chuoi:1">Chuỗi dài nhất</option>
              <option value="bac:1">Bậc nặng nhất</option>
              <option value="ten:0">Tên A–Z</option>
            </select>
          </label>
        </div>
        {bang.loi && <p className="tdt-loi-nho" role="alert">{du ? 'Chưa cập nhật được: ' : ''}{bang.loi} <button type="button" className="tdt-nut-chu" onClick={() => setLan((n) => n + 1)}>Thử lại</button></p>}
        {!du ? (
          bang.loi ? null : <div className="tdt-cho" role="status" aria-label="Đang tải bảng thi đua">{[0, 1, 2, 3, 4].map((i) => <span key={i} className="tdt-cho-dong tt-xuong" />)}</div>
        ) : du.ds.length === 0 ? (
          <p className="tdt-rong">Tuần này lớp {du.lop} chưa em nào có nguyên tử. Bảng hiện khi các em làm bài đầu tiên trong tuần.</p>
        ) : (
          <>
            <div className="tdt-cuon">
              <table className="tdt-bang">
                <thead>
                  <tr>
                    {COT.map(({ cot, ten }) => (
                      <th key={cot} aria-sort={xep.cot === cot ? (xep.giam ? 'descending' : 'ascending') : undefined} data-cot={cot}>
                        <button type="button" onClick={() => bamCot(cot)}>
                          {ten}{cot === 'that' && <small>học thật | bị loại</small>}
                          <span className="tdt-mui" aria-hidden="true">{xep.cot === cot ? (xep.giam ? '↓' : '↑') : ''}</span>
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hien.map((e) => (
                    <tr key={e.sbd} data-sbd={e.sbd}>
                      <td className="tdt-ten">{e.ten}</td>
                      <td><NguyenTu e={e} /></td>
                      <td><Hang e={e} /></td>
                      <td className="tdt-so">{e.chuoi !== null ? `${e.chuoi} ngày` : '—'}</td>
                      <td><Nhan e={e} /></td>
                      <td>{e.bacDuoi ? <BacChip b={e.bacDuoi} /> : <span className="tdt-mo">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="tdt-ds">
              {hien.map((e) => (
                <li key={e.sbd} data-sbd={e.sbd}>
                  <div className="tdt-ds-giua">
                    <b className="tdt-ten">{e.ten}</b>
                    <span className="tdt-mo">{e.hang ? `${TEN_KL[e.hang.kl]}${e.hang.thuHang ? ` #${e.hang.thuHang}` : ''}` : 'chưa vào bảng'} · chuỗi {e.chuoi ?? '—'} ngày</span>
                    <NguyenTu e={e} />
                  </div>
                  <div className="tdt-ds-phai"><Nhan e={e} />{e.bacDuoi && e.bacDuoi > 1 && <BacChip b={e.bacDuoi} />}</div>
                </li>
              ))}
            </ul>
            {ds.length > HIEN_DAU && (
              <div className="tdt-the-chan"><button type="button" className="tdt-nut-chu" onClick={() => setHet((h) => !h)}>{het ? 'Thu gọn' : `Xem đủ ${ds.length} em`}</button></div>
            )}
          </>
        )}
      </section>

      {tong.cap.length > 0 && (
        <section className="tdt-the" aria-label="Cặp học cùng" data-vung="cap-hoc-cung">
          <div className="tdt-the-dau"><h2>Cặp học cùng</h2><span className="tdt-mo">{tong.cap.length} cặp</span></div>
          <ul className="tdt-cap">
            {tong.cap.map((c) => (
              <li key={`${c.a}|${c.b}`}>
                <span className="tdt-cap-ten"><b>{c.a}</b> + {c.b}</span>
                <span className="tdt-cap-so" data-tat={c.n ? undefined : ''}><Lua tat={!c.n} />{c.n ? `${c.n} ngày` : c.n === 0 ? 'vừa tắt' : '—'}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

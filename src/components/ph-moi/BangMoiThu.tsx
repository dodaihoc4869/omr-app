// BẢNG "MỌI THỨ VỀ CON" (thầy chốt mẫu 21/09: docs/ban-ve-ph-moi-thu-ve-con-2109/ph-1-moi-thu-ve-con.html; đề bài prompt-ph-moi-thu-ve-con-2109.md). Một trang cuộn, mục lục chip dính đầu trang (390) / cột trái (≥ 1024),
// chín khối theo thứ tự mẫu; KHỐI NÀO MÁY CHỦ KHÔNG TRẢ ⇒ ẨN (không bịa). Gói tải LƯỜI riêng (ChemText nằm ở đây, không vào gói vào app). Câu bị CHE: không đáp án, không đúng/sai — chỉ giờ + nguồn + lý do.
// Danh sách câu: mở nhóm mốc nào mới dựng các dòng của nhóm ấy (con làm 100+ câu vẫn nhẹ). Không thần thú/EXP/khiên/xếp hạng điểm/so con với bạn; riêng "độ chăm hôm nay: hạng x trong y bạn" (không tên bạn).
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Check, ChevronDown, ChevronRight, Clock, Flame, Hourglass, Lock, TrendingUp, X } from 'lucide-react'
import '../m3'
import './ph-moi.css'
import './ph-moi-them.css'
import { ChemText } from '../../lib/chem-format'
import type { ViewGiaoThem } from '../../lib/use-giao-them'
import { taiChiTietCau } from '../../lib/ph-moi/api'
import { ChuoiMuoiBonNgay } from '../../lib/ph-moi/nhip-ngay'
import { chuThoiGian, gioVn, ngayChuoiNgan, ngayDayDuVn, ngayNganVn, soVn, tachVn, thuNgayVn, thuTuChuoiNgay } from '../../lib/ph-moi/dinh-dang'
import type { CauChe, CauHomNay, CauThuong, ChiTietCau, MocThoiGian, PhMoi } from '../../lib/ph-moi/du-lieu'
import { CHU_CHE, NHAN_BAC, NHAN_NGUON, TEN_BAC_SO, chuCongBoCa, tenMoc } from './nhan'
import ThanhDay from './ThanhDay'

export { ChuoiMuoiBonNgay }
export const NGUONG_LAM_LAU_GIAY = 180
export const NGUONG_NHOM_LAZY = 40

export interface NhomCau {
  id: string
  gio: string
  ten: string
  cau: CauHomNay[]
  soCau: number | null
  soDung: number | null
  phut: number | null
}

const hai = (n: number) => String(n).padStart(2, '0')
const laLamLau = (c: CauHomNay): boolean => c.giay !== null && c.giay > NGUONG_LAM_LAU_GIAY
const laSai = (c: CauHomNay): boolean => c.kieu === 'thuong' && c.dung === false
const laChe = (c: CauHomNay): c is CauChe => c.kieu === 'che'

/** Gom câu vào NHÓM MỐC: mỗi câu vào mốc cùng nguồn có giờ bắt đầu gần nhất trước nó (không có ⇒ mốc bất kỳ gần nhất trước nó; không có nữa ⇒ nhóm riêng theo nguồn). Mốc không có câu nào vẫn giữ (để mục lục dòng thời gian nhảy tới). */
export function gomNhomCau(pm: Pick<PhMoi, 'dongThoiGian' | 'cau'>): NhomCau[] {
  const moc: MocThoiGian[] = pm.dongThoiGian ?? []
  const nhom: NhomCau[] = moc.map((m, i) => ({ id: `moc-${i + 1}`, gio: gioVn(m.batDau), ten: tenMoc(m), cau: [], soCau: m.soCau, soDung: m.soDung, phut: m.phut }))
  const rieng = new Map<string, NhomCau>()
  for (const c of [...(pm.cau ?? [])].sort((a, b) => Date.parse(a.luc) - Date.parse(b.luc))) {
    const t = Date.parse(c.luc)
    let chon = -1
    for (let i = 0; i < moc.length; i++) if (Date.parse(moc[i]!.batDau) <= t + 60_000 && moc[i]!.nguon === c.nguon) chon = i
    if (chon < 0) for (let i = 0; i < moc.length; i++) if (Date.parse(moc[i]!.batDau) <= t + 60_000) chon = i
    if (chon >= 0) nhom[chon]!.cau.push(c)
    else {
      let n = rieng.get(c.nguon)
      if (!n) {
        n = { id: `moc-r-${c.nguon}`, gio: gioVn(c.luc), ten: NHAN_NGUON[c.nguon], cau: [], soCau: null, soDung: null, phut: null }
        rieng.set(c.nguon, n)
      }
      n.cau.push(c)
    }
  }
  return [...nhom, ...rieng.values()]
}

function Thanh({ dung, tong, nhan, xanh = true }: { dung: number; tong: number; nhan: string; xanh?: boolean }) {
  const pct = tong > 0 ? Math.max(0, Math.min(100, (dung / tong) * 100)) : 0
  return (
    <span className={`phm-thanh${xanh ? ' phm-thanh--xanh' : ''}`} role="img" aria-label={nhan}>
      <i style={{ width: `${pct.toFixed(1)}%` }} />
    </span>
  )
}

// ───────────────────────────────────────────── ① tổng quan
function KhoiTongQuan({ pm }: { pm: PhMoi }) {
  const t = pm.tongQuan
  if (!t) return null
  const ten = pm.hoTen
  const luot = pm.dongThoiGian?.length ?? 0
  const dai = pm.dongThoiGian && pm.dongThoiGian.length > 0 ? Math.max(...pm.dongThoiGian.map((m) => m.phut)) : 0
  const pct = t.soCau && t.soCau > 0 && t.soDung !== null ? Math.round((t.soDung / t.soCau) * 100) : null
  const batDauChuoi = (() => {
    if (!t.chuoiNgayHoc || t.chuoiNgayHoc < 2 || pm.serverNow === null) return ''
    return ngayNganVn(pm.serverNow - (t.chuoiNgayHoc - 1) * 86_400_000)
  })()
  const hq = t.soVoiHomQua
  const dong: string[] = []
  if (hq && t.soCau !== null) {
    const d = t.soCau - hq.soCau
    dong.push(d > 0 ? `Nhiều hơn ${d} câu (hôm qua ${hq.soCau} câu)` : d < 0 ? `Ít hơn ${-d} câu (hôm qua ${hq.soCau} câu)` : `Bằng hôm qua (${hq.soCau} câu)`)
    if (pct !== null) dong.push(`Câu đúng ${pct} % (hôm qua ${Math.round(hq.tiLeDung * 100)} %)`)
  }
  const dat = t.datNhiemVu
  const o = [
    t.soCau !== null ? { nhan: 'Câu đã làm', b: String(t.soCau), don: 'câu', phu: luot > 0 ? `${luot} lần ngồi học` : '' } : null,
    pct !== null ? { nhan: 'Câu đúng', b: String(pct), don: '%', phu: `${t.soDung} trong ${t.soCau} câu` } : null,
    t.phutHoc !== null ? { nhan: 'Thời gian học', b: String(Math.round(t.phutHoc)), don: 'phút', phu: dai > 0 ? `dài nhất ${dai} phút` : '' } : null,
    t.chuoiNgayHoc !== null && t.chuoiNgayHoc > 0 ? { nhan: 'Chuỗi học đều', b: String(t.chuoiNgayHoc), don: 'ngày', phu: batDauChuoi ? `liên tục từ ${batDauChuoi}` : '' } : null,
  ].filter((x): x is { nhan: string; b: string; don: string; phu: string } => x !== null)
  return (
    <section className="phm-muc" id="tong-quan" aria-labelledby="h-1">
      <h2 id="h-1" className="phm-sr">
        Tổng quan hôm nay
      </h2>
      <div className="phm-hero">
        <p className="phm-hero__tren phm-so">
          {thuNgayVn(pm.serverNow ?? Date.now())}
          {pm.serverNow !== null ? ` · cập nhật lúc ${gioVn(pm.serverNow)}` : ''}
        </p>
        {dat !== null && (
          <div className="phm-hero__dat">
            <div className="phm-vong" role="img" aria-label={dat ? 'Nhiệm vụ hôm nay: đã đạt' : 'Nhiệm vụ hôm nay: chưa đạt'}>
              <svg viewBox="0 0 120 120" aria-hidden="true">
                <circle className="nen" cx="60" cy="60" r="52" />
                {dat && <circle className="dat" cx="60" cy="60" r="52" strokeDasharray="319.8 7" strokeDashoffset="-3.5" />}
              </svg>
              <div className="phm-vong__giua">{dat ? <Check className="phm-i phm-i--l" aria-hidden="true" /> : <Clock className="phm-i phm-i--l" aria-hidden="true" />}</div>
            </div>
            <div className="phm-hero__loi">
              <h3>Nhiệm vụ hôm nay: {dat ? 'đã đạt' : 'chưa đạt'}</h3>
              <p>{dat ? `${ten} đã hoàn thành nhiệm vụ học của hôm nay.` : `${ten} chưa hoàn thành nhiệm vụ học của hôm nay.`}</p>
            </div>
          </div>
        )}
        {o.length > 0 && (
          <div className="phm-so-luoi">
            {o.map((x) => (
              <div className="phm-so-o" key={x.nhan}>
                <span className="phm-so-o__nhan">{x.nhan}</span>
                <b>
                  {x.b}
                  <small>{x.don}</small>
                </b>
                {x.phu && <span className="phm-so-o__phu">{x.phu}</span>}
              </div>
            ))}
          </div>
        )}
        {dong.length > 0 && (
          <div className="phm-hom-qua">
            <h4>So với hôm qua của chính con</h4>
            <ul className="phm-so">
              {dong.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        )}
        {pm.doCham && (
          <p className="phm-hero__tren phm-so" data-vung="do-cham">
            Độ chăm hôm nay: hạng {pm.doCham.hang} trong {pm.doCham.siSo} bạn
          </p>
        )}
      </div>
    </section>
  )
}

// ───────────────────────────────────────────── ② dòng thời gian
const CUA_SO_DAU = 5 * 60
const CUA_SO_DAI = 18 * 60
function KhoiDongThoiGian({ pm, nhom, onChonMoc }: { pm: PhMoi; nhom: NhomCau[]; onChonMoc: (id: string) => void }) {
  const moc = pm.dongThoiGian
  if (!moc || moc.length === 0) return null
  const buoi = { sang: 0, chieu: 0, toi: 0 }
  for (const m of moc) {
    const t = tachVn(m.batDau)
    if (!t) continue
    if (t.h < 12) buoi.sang++
    else if (t.h < 18) buoi.chieu++
    else buoi.toi++
  }
  const cau = [buoi.sang ? `${buoi.sang} lần buổi sáng` : '', buoi.chieu ? `${buoi.chieu} lần buổi chiều` : '', buoi.toi ? `${buoi.toi} lần buổi tối` : ''].filter(Boolean).join(', ')
  const pos = (m: MocThoiGian) => {
    const t = tachVn(m.batDau)
    const phutTrongNgay = t ? t.h * 60 + t.p : 0
    const left = Math.max(0, Math.min(100, ((phutTrongNgay - CUA_SO_DAU) / CUA_SO_DAI) * 100))
    const rong = Math.max(0.6, Math.min(100 - left, (m.phut / CUA_SO_DAI) * 100))
    return { left: `${left.toFixed(2)}%`, width: `${rong.toFixed(2)}%` }
  }
  return (
    <section className="phm-muc phm-muc--7" id="dong-thoi-gian" aria-labelledby="h-2">
      <div className="phm-muc__dau">
        <h2 id="h-2">Dòng thời gian trong ngày</h2>
        <p>chạm một mốc để xem từng câu</p>
      </div>
      <div className="phm-the">
        <div className="phm-ngay" role="img" aria-label={`Con học ${moc.length} lần trong ngày: ${moc.map((m) => `${gioVn(m.batDau)} đến ${gioVn(Date.parse(m.batDau) + m.phut * 60_000)}`).join(', ')}`}>
          <div className="phm-ngay__thanh">
            {moc.map((m, i) => (
              <i key={i} style={pos(m)} />
            ))}
          </div>
          <div className="phm-ngay__nhan" aria-hidden="true">
            {[6, 9, 12, 15, 18, 21].map((h) => (
              <span key={h} style={{ left: `${(((h * 60 - CUA_SO_DAU) / CUA_SO_DAI) * 100).toFixed(2)}%` }}>{`${hai(h)}:00`}</span>
            ))}
          </div>
          <p>
            Con ngồi học {moc.length} lần{cau ? `: ${cau}` : ''}.
          </p>
        </div>
        <ol className="phm-tl">
          {moc.map((m, i) => {
            const n = nhom[i]
            const ten = tenMoc(m)
            const chu = m.che ? (m.che === 'chua_nop' ? 'Con đã làm · kết quả hiện sau khi con nộp bài' : 'Con đã làm · kết quả hiện sau khi Thầy công bố điểm') : [m.soCau !== null ? `${m.soCau} câu` : '', m.soDung !== null ? `đúng ${m.soDung}` : '', `${m.phut} phút`, m.ghiChu ? m.ghiChu.toLowerCase().replace('nộp đúng hạn', 'nộp đúng nhịp') : ''].filter(Boolean).join(' · ')
            return (
              <li key={i}>
                <button type="button" className="phm-tl__moc" onClick={() => n && onChonMoc(n.id)} aria-label={`${gioVn(m.batDau)}, ${ten}: ${chu}. Xem từng câu của mốc này`}>
                  <span className="phm-tl__gio">{gioVn(m.batDau)}</span>
                  <span className="phm-tl__nut">{m.che ? <Lock className="phm-i phm-i--s" aria-hidden="true" /> : <Check className="phm-i phm-i--s" aria-hidden="true" />}</span>
                  <div className="phm-tl__chu">
                    <h3>{ten}</h3>
                    <p>{chu}</p>
                    {!m.che && m.soCau !== null && m.soDung !== null && m.soCau > 0 && <Thanh dung={m.soDung} tong={m.soCau} nhan={`đúng ${m.soDung} trong ${m.soCau} câu`} />}
                  </div>
                  <ChevronRight className="phm-i phm-i--s phm-tl__mui" aria-hidden="true" />
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

// ───────────────────────────────────────────── ③ ca kiểm tra gần nhất
function KhoiCa({ pm }: { pm: PhMoi }) {
  const ca = pm.caGanNhat
  if (!ca) return null
  const nop = `Nộp lúc ${gioVn(ca.nopLuc)} · ${ngayDayDuVn(ca.nopLuc)}`
  const kq = ca.congBo.daCongBo ? ca.ketQua : null
  return (
    <section className="phm-muc phm-muc--5" id="ca-kiem-tra" aria-labelledby="h-3">
      <div className="phm-muc__dau">
        <h2 id="h-3">Ca kiểm tra gần nhất</h2>
      </div>
      {kq && kq.tong !== null ? (
        <div className="phm-the phm-ca">
          <div className="phm-ca__chu">
            <p className="phm-ca__diem" role="img" aria-label={`Điểm ${soVn(kq.tong)} trên 10`}>
              <b>{soVn(kq.tong)}</b>
              <span>/10 điểm</span>
            </p>
            <p className="phm-ca__ten">{ca.tenCa}</p>
            <p className="phm-ca__phu">{nop}</p>
            {(kq.soCau !== null || ca.thoiGianLamGiay !== null) && (
              <p className="phm-ca__phu">
                {kq.soCau !== null && kq.soCauDung !== null ? `Đúng ${kq.soCauDung}/${kq.soCau} câu` : ''}
                {kq.soCau !== null && kq.soCauDung !== null && ca.thoiGianLamGiay !== null ? ' · ' : ''}
                {ca.thoiGianLamGiay !== null ? `làm trong ${chuThoiGian(ca.thoiGianLamGiay)}` : ''}
              </p>
            )}
            {ca.truoc && ca.truoc.tong !== null && (
              <span className="phm-ss">
                <TrendingUp className="phm-i phm-i--s" aria-hidden="true" />
                <span className="phm-so">
                  {ca.truoc.doi > 0 ? `Hơn lần trước của chính con ${soVn(ca.truoc.doi)} điểm` : ca.truoc.doi < 0 ? `Kém lần trước của chính con ${soVn(-ca.truoc.doi)} điểm` : 'Bằng lần trước của chính con'} (lần trước {soVn(ca.truoc.tong)})
                </span>
              </span>
            )}
          </div>
          {ca.phan.length > 0 && (
            <div className="phm-phan-ds">
              {ca.phan.map((p) => (
                <div className="phm-phan" key={p.ma}>
                  <span className="phm-phan__ten">{p.ma === 'I' ? 'Phần I · Trắc nghiệm' : p.ma === 'II' ? 'Phần II · Đúng–sai' : 'Phần III · Trả lời ngắn'}</span>
                  {p.diem !== null && <span className="phm-phan__diem">{soVn(p.diem)}</span>}
                  <Thanh dung={p.dung} tong={p.tong} nhan={`${p.ma === 'I' ? 'Phần I' : p.ma === 'II' ? 'Phần II' : 'Phần III'}: đúng ${p.dung} trên ${p.tong} câu`} xanh={false} />
                  <span className="phm-phan__dem">
                    đúng {p.dung}/{p.tong} câu
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="phm-the phm-ca">
          <div className="phm-chua-cb" data-vung="chua-cong-bo">
            <span className="phm-chua-cb__bt">
              <Lock className="phm-i" aria-hidden="true" />
            </span>
            <div>
              <h3>Thầy chưa công bố điểm</h3>
              <p className="phm-so">
                {ca.tenCa}. Con đã nộp bài lúc {gioVn(ca.nopLuc)} · {ngayDayDuVn(ca.nopLuc)}. {chuCongBoCa(ca)}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

// ───────────────────────────────────────────── ④ điểm mạnh · cần luyện
function ChipBac({ bac, moi }: { bac: 'biet' | 'hieu' | 'van_dung' | null; moi?: boolean }) {
  if (!bac) return null
  const chiSo = bac === 'biet' ? 0 : bac === 'hieu' ? 1 : 2
  return (
    <span className="phm-bac" role="img" aria-label={`Bậc hiện tại của con: ${NHAN_BAC[bac]}${moi ? ' (mới lên hôm nay)' : ''}. Ba bậc: Biết, Hiểu, Vận dụng`}>
      {TEN_BAC_SO.map((t, i) => (
        <span key={t} data-da={i < chiSo ? 'qua' : i === chiSo ? (moi ? 'moi' : 'dang') : ''}>
          {t}
        </span>
      ))}
    </span>
  )
}
function KhoiManhYeu({ pm }: { pm: PhMoi }) {
  const m = pm.manhYeu
  if (!m) return null
  const len = m.lenBacHomNay
  const mai = pm.lichOn?.ngayMai ?? 0
  const the = (tieuDe: string, phu: string, ds: typeof m.lamTot, vap: boolean) =>
    ds.length > 0 ? (
      <div className={`phm-the phm-dang-the${vap ? ' phm-dang-the--vap' : ''}`} data-vung={vap ? 'dang-vap' : 'dang-tot'}>
        <div className="phm-dang-the__dau">
          <span className="phm-dang-the__bt">{vap ? <Flame className="phm-i" aria-hidden="true" /> : <Check className="phm-i" aria-hidden="true" />}</span>
          <div>
            <h3>{tieuDe}</h3>
            <p>{phu}</p>
          </div>
        </div>
        <ul>
          {ds.map((d) => (
            <li className="phm-dang" key={d.tenDang}>
              <p className="phm-dang__ten">{d.tenDang}</p>
              <div className="phm-dang__hang">
                <span className="phm-dang__dem">
                  đúng{' '}
                  <b>
                    {d.dung}/{d.tong}
                  </b>{' '}
                  câu
                </span>
                <ChipBac bac={d.bac} moi={len.includes(d.tenDang)} />
              </div>
              <Thanh dung={d.dung} tong={d.tong} nhan={`đúng ${d.dung} trong ${d.tong} câu`} xanh={!vap} />
            </li>
          ))}
        </ul>
      </div>
    ) : null
  return (
    <section className="phm-muc" id="manh-yeu" aria-labelledby="h-4">
      <div className="phm-muc__dau">
        <h2 id="h-4">Điểm mạnh · Điểm cần luyện</h2>
        <p>tính trên 14 ngày gần đây</p>
      </div>
      {len.length > 0 && (
        <div className="phm-len-bac" data-vung="len-bac">
          <span className="phm-len-bac__bt">
            <TrendingUp className="phm-i" aria-hidden="true" />
          </span>
          <div>
            <h3>Hôm nay con lên bậc ở {len.length} dạng</h3>
            <p>{len.join(' · ')}</p>
          </div>
        </div>
      )}
      <div className="phm-hai-cot">
        {the('Dạng con làm tốt', `${m.lamTot.length} dạng con đúng nhiều nhất trong 14 ngày`, m.lamTot, false)}
        {the('Dạng con còn vấp', mai > 0 ? `A.I Đỗ Đại Học đã xếp ${mai} câu vào lịch ôn ngày mai` : 'A.I Đỗ Đại Học sẽ xếp các câu này vào lịch ôn', m.conVap, true)}
      </div>
    </section>
  )
}

// ───────────────────────────────────────────── ⑤ từng câu
function ChiTiet({ ct }: { ct: ChiTietCau }) {
  if (ct.kieu === 'tu_choi')
    return (
      <p className="phm-ghi-chu-ve" role="alert" data-vung="loi-giai">
        {ct.chu}
      </p>
    )
  return (
    <>
      <p className="phm-cau__cau">
        <ChemText text={ct.de} />
      </p>
      {ct.phuongAn.length > 0 && (
        <ul className="phm-pa">
          {ct.phuongAn.map((p, i) => {
            const ma = p.slice(0, 1)
            const dung = ct.dapAn.includes(ma)
            return (
              <li key={i} data-la={dung ? 'dung' : undefined}>
                <b>{ma}</b>
                <span>
                  <ChemText text={p.replace(/^[A-D]\.\s*/, '')} />
                </span>
                {dung && (
                  <small>
                    <Check className="phm-i phm-i--s" aria-hidden="true" />
                    Đáp án
                  </small>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {ct.loiGiai && (
        <div className="phm-loi-giai">
          <h4>Lời giải</h4>
          <p>
            <ChemText text={ct.loiGiai} />
          </p>
        </div>
      )}
    </>
  )
}
function DongCau({ c, sbd, tenNguon, mo }: { c: CauChe | CauThuong; sbd: string; tenNguon: string; mo: boolean }) {
  const [ct, setCt] = useState<ChiTietCau | null>(null)
  const [dang, setDang] = useState(false)
  const [loi, setLoi] = useState('')
  const lay = async (qid: string) => {
    setDang(true)
    setLoi('')
    const r = await taiChiTietCau(sbd, qid)
    setDang(false)
    if (r.kieu === 'ok') setCt(r.ct)
    else setLoi(r.chu)
  }
  if (laChe(c)) {
    return (
      <div className="phm-cau" data-vung="cau-che">
        <div className="phm-cau__hang">
          <span className="phm-cau__gio">
            <b>{gioVn(c.luc)}</b>
            <span>{tenNguon}</span>
          </span>
          <span className="phm-cau__kq">
            <span className="phm-chip phm-chip--khoa">
              <Lock className="phm-i phm-i--s" aria-hidden="true" />
              Đã làm
            </span>
          </span>
          <span className="phm-cau__de">
            <span className="phm-cau__cau">{CHU_CHE[c.che]}</span>
          </span>
          {c.giay !== null && (
            <span className="phm-cau__chan">
              <span className="phm-cau__tg-o">
                <span className="phm-cau__tg">
                  <Hourglass className="phm-i phm-i--s" aria-hidden="true" />
                  {chuThoiGian(c.giay)}
                </span>
              </span>
            </span>
          )}
        </div>
      </div>
    )
  }
  const kq = c.dung === true ? { l: 'ok', t: 'Đúng', i: <Check className="phm-i phm-i--s" aria-hidden="true" /> } : c.dung === false ? { l: 'sai', t: 'Sai', i: <X className="phm-i phm-i--s" aria-hidden="true" /> } : { l: 'cho', t: 'Đã làm', i: null }
  return (
    <details className="phm-cau" data-vung="cau" data-kq={kq.l} open={mo || undefined}>
      <summary>
        <span className="phm-cau__gio">
          <b>{gioVn(c.luc)}</b>
          <span>{tenNguon}</span>
        </span>
        <span className="phm-cau__kq">
          <span className={`phm-chip phm-chip--${kq.l}`}>
            {kq.i}
            {kq.t}
          </span>
          <ChevronDown className="phm-i phm-i--s phm-mui" aria-hidden="true" />
        </span>
        <span className="phm-cau__de">
          {c.tenDang && <span className="phm-cau__dang">{c.tenDang}</span>}
          <span className="phm-cau__cau">
            <ChemText text={c.de} />
          </span>
        </span>
        <span className="phm-cau__chan">
          {(c.conChon || c.dapAn) && (
            <span className="phm-cau__chon">
              {c.conChon ? (
                <>
                  Con chọn <b>{c.conChon}</b>
                  {c.dapAn ? ' · ' : ''}
                </>
              ) : null}
              {c.dapAn ? (
                <>
                  Đáp án <b>{c.dapAn}</b>
                </>
              ) : null}
            </span>
          )}
          {c.giay !== null && (
            <span className="phm-cau__tg-o">
              <span className="phm-cau__tg">
                <Hourglass className="phm-i phm-i--s" aria-hidden="true" />
                {chuThoiGian(c.giay)}
              </span>
            </span>
          )}
        </span>
      </summary>
      <div className="phm-cau__mo">
        {ct && <ChiTiet ct={ct} />}
        {/* Nút chỉ có khi máy chủ đã gửi mã câu VÀ báo có lời giải; mã câu KHÔNG bao giờ hiện ra màn. */}
        {!ct && c.coLoiGiai && c.qid && (
          <button type="button" className="phm-nut phm-nut--chu" data-vung="xem-loi-giai" disabled={dang} onClick={() => void lay(c.qid)}>
            {dang ? 'Đang lấy lời giải…' : 'Xem lời giải'}
          </button>
        )}
        {loi && (
          <p className="phm-ghi-chu-ve" role="alert">
            {loi}
          </p>
        )}
        {!ct && !(c.coLoiGiai && c.qid) && <p className="phm-mo-ta">Câu này chưa có lời giải để xem.</p>}
      </div>
    </details>
  )
}

type LocCau = 'tat-ca' | 'sai' | 'lam-lau' | 'che'
const KHOP: Record<LocCau, (c: CauHomNay) => boolean> = { 'tat-ca': () => true, sai: laSai, 'lam-lau': laLamLau, che: laChe }

function KhoiTungCau({ pm, nhom, sbd, mo, dongMo, batMo }: { pm: PhMoi; nhom: NhomCau[]; sbd: string; mo: Set<string>; dongMo: (id: string) => void; batMo: (id: string) => void }) {
  const [loc, setLoc] = useState<LocCau>('tat-ca')
  const tatCa = pm.cau
  if (!tatCa || tatCa.length === 0) return null
  const dem = { 'tat-ca': tatCa.length, sai: tatCa.filter(laSai).length, 'lam-lau': tatCa.filter(laLamLau).length, che: tatCa.filter(laChe).length }
  const loc3: { k: LocCau; nhan: string }[] = [
    { k: 'tat-ca', nhan: 'Tất cả' },
    { k: 'sai', nhan: 'Sai' },
    { k: 'lam-lau', nhan: 'Làm lâu' },
    { k: 'che', nhan: 'Chưa công bố' },
  ]
  const hienNhom = nhom.filter((n) => n.cau.length > 0)
  return (
    <section className="phm-muc" id="tung-cau" aria-labelledby="h-5">
      <div className="phm-muc__dau">
        <h2 id="h-5">Từng câu con đã làm hôm nay</h2>
        <p>{tatCa.length} câu · xếp theo giờ làm</p>
      </div>
      <div className="phm-loc" role="group" aria-label="Lọc danh sách câu">
        {loc3.map((f) => (
          <button key={f.k} type="button" aria-pressed={loc === f.k} onClick={() => setLoc(f.k)}>
            {f.nhan} <b>{dem[f.k]}</b>
          </button>
        ))}
      </div>
      <p className="phm-chu-giai">
        <span>
          <i className="phm-cham" />
          ô đặc: đúng
        </span>
        <span>
          <i className="phm-cham phm-cham--sai" />
          ô gạch chéo: sai
        </span>
        <span>Làm lâu: hơn {NGUONG_LAM_LAU_GIAY / 60} phút một câu</span>
      </p>
      {hienNhom.map((n) => {
        const cauLoc = n.cau.filter(KHOP[loc])
        if (loc !== 'tat-ca' && cauLoc.length === 0) return null
        const dung = n.cau.filter((c) => c.kieu === 'thuong' && c.dung === true).length
        const sai = n.cau.filter(laSai).length
        const dangMo = mo.has(n.id)
        return (
          <section className="phm-moc" id={n.id} key={n.id} aria-label={`${n.gio} · ${n.ten}`} data-vung="nhom-cau">
            <h3 className="phm-moc__h">
              <button type="button" className="phm-moc__dau" aria-expanded={dangMo} aria-controls={`${n.id}-ds`} onClick={() => (dangMo ? dongMo(n.id) : batMo(n.id))}>
                <span className="phm-moc__bt">{n.cau.every(laChe) ? <Lock className="phm-i phm-i--s" aria-hidden="true" /> : <Check className="phm-i phm-i--s" aria-hidden="true" />}</span>
                <span className="phm-moc__ten">
                  {n.gio} · {n.ten}
                </span>
                <span className="phm-moc__so">{[`${n.cau.length} câu`, dung + sai > 0 ? `đúng ${dung}` : '', sai > 0 ? `sai ${sai}` : '', n.phut ? `${n.phut} phút` : ''].filter(Boolean).join(' · ')}</span>
                <ChevronDown className="phm-i phm-i--s phm-mui" aria-hidden="true" />
                <span className="phm-moc__cham" role="img" aria-label={`Lần lượt ${n.cau.length} câu: ${n.cau.map((c, i) => `câu ${i + 1} ${c.kieu === 'che' ? 'chưa công bố' : c.dung === true ? 'đúng' : c.dung === false ? 'sai' : 'đã làm'}`).join(', ')}`}>
                  {n.cau.map((c, i) => (
                    <i key={i} className={`phm-cham${c.kieu === 'che' ? ' phm-cham--cho' : c.dung === false ? ' phm-cham--sai' : ''}`} />
                  ))}
                </span>
              </button>
            </h3>
            {/* Chỉ dựng dòng câu của nhóm ĐANG MỞ (danh sách dài vẫn nhẹ). */}
            {dangMo && (
              <div id={`${n.id}-ds`}>
                {cauLoc.map((c, i) => (
                  <DongCau key={`${c.luc}-${i}`} c={c} sbd={sbd} tenNguon={NHAN_NGUON[c.nguon]} mo={false} />
                ))}
              </div>
            )}
          </section>
        )
      })}
    </section>
  )
}

// ───────────────────────────────────────────── ⑥ bài tập về nhà
const chuConLai = (denMs: number, nayMs: number): string => {
  const ms = denMs - nayMs
  if (ms <= 0) return 'đã qua hạn'
  const gio = Math.floor(ms / 3_600_000)
  const ngay = Math.floor(gio / 24)
  return ngay > 0 ? `còn ${ngay} ngày ${gio % 24} giờ` : gio > 0 ? `còn ${gio} giờ` : `còn ${Math.max(1, Math.floor(ms / 60_000))} phút`
}
function KhoiBtvn({ pm }: { pm: PhMoi }) {
  const b = pm.baiTapVeNha
  if (!b || (b.dangChay.length === 0 && b.gan.length === 0)) return null
  const nay = pm.serverNow ?? Date.now()
  return (
    <section className="phm-muc phm-muc--6" id="btvn" aria-labelledby="h-6">
      <div className="phm-muc__dau">
        <h2 id="h-6">Bài tập về nhà</h2>
        <p>{[b.dangChay.length ? `${b.dangChay.length} bài đang chạy` : '', b.gan.length ? `${b.gan.length} bài gần đây` : ''].filter(Boolean).join(' · ')}</p>
      </div>
      <div className="phm-the phm-btvn">
        {b.dangChay.map((d) => (
          <div key={d.maBtvn} data-vung="btvn-dang-chay">
            <p className="phm-nhom-ten">Đang chạy</p>
            <div className="phm-btvn__dau">
              <h3>{d.ten}</h3>
              {d.changTong !== null && d.changXong !== null && d.changTong > 0 && (
                <span className="phm-chip phm-chip--cho phm-so">
                  Xong {d.changXong} trong {d.changTong} chặng
                </span>
              )}
            </div>
            {d.changTong !== null && d.changXong !== null && d.changTong > 0 && d.changTong <= 12 && (
              <ol className="phm-chang" aria-label={`Con đã xong ${d.changXong} trong ${d.changTong} chặng`}>
                {Array.from({ length: d.changTong }, (_, i) => (
                  <li key={i} data-xong={i < (d.changXong as number) ? '' : undefined}>
                    Chặng {i + 1}
                  </li>
                ))}
              </ol>
            )}
            <p className="phm-dong-bt">
              <Clock className="phm-i" aria-hidden="true" />
              <span>
                Hạn nộp {gioVn(d.hanNop)} · {ngayDayDuVn(d.hanNop)}
                <small>{chuConLai(Date.parse(d.hanNop), nay)}</small>
              </span>
            </p>
          </div>
        ))}
        {b.gan.length > 0 && (
          <>
            <p className="phm-nhom-ten phm-btvn__ngan">Gần đây · mới nhất trước</p>
            <ul className="phm-btvn-ds">
              {b.gan.map((g) => (
                <li className="phm-btvn-dong" key={g.maBtvn} data-vung="btvn-gan">
                  <div>
                    <h3>{g.ten}</h3>
                    <p>
                      Nộp {gioVn(g.nopLuc)} · {ngayDayDuVn(g.nopLuc)}
                    </p>
                    {g.dungHan !== null && (
                      <span className={`phm-chip ${g.dungHan ? 'phm-chip--ok' : 'phm-chip--luu-y'}`}>
                        {g.dungHan ? <Check className="phm-i phm-i--s" aria-hidden="true" /> : <Clock className="phm-i phm-i--s" aria-hidden="true" />}
                        {g.dungHan ? 'Nộp đúng hạn' : 'Nộp sau hạn'}
                      </span>
                    )}
                  </div>
                  {g.diem !== null && (
                    <div className="phm-btvn-dong__diem">
                      <b>{soVn(g.diem)}</b>
                      <small>/10 điểm</small>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  )
}

// ───────────────────────────────────────────── ⑦ lịch ôn lại
function KhoiLichOn({ pm }: { pm: PhMoi }) {
  const l = pm.lichOn
  if (!l) return null
  const tong = l.daKhacPhuc14Ngay + l.conSaiChuaKhacPhuc
  return (
    <section className="phm-muc phm-muc--6" id="lich-on" aria-labelledby="h-7">
      <div className="phm-muc__dau">
        <h2 id="h-7">Lịch ôn lại</h2>
        <p>các câu con từng làm sai</p>
      </div>
      <div className="phm-the phm-on">
        <p className="phm-on__mai">
          <b>{l.ngayMai}</b>
          <span>
            câu đến lịch ôn ngày mai
            <small>{l.homNay > 0 ? `Hôm nay còn ${l.homNay} câu đến lịch ôn` : 'Hôm nay không còn câu nào đến lịch ôn'}</small>
          </span>
        </p>
        {tong > 0 && (
          <div className="phm-on__kp">
            <p>
              <b>
                Đã khắc phục {l.daKhacPhuc14Ngay} trong {tong} câu từng sai
              </b>
              <span>còn {l.conSaiChuaKhacPhuc} câu đang trong lịch ôn</span>
            </p>
            <Thanh dung={l.daKhacPhuc14Ngay} tong={tong} nhan={`đã khắc phục ${l.daKhacPhuc14Ngay} trong ${tong} câu`} />
          </div>
        )}
      </div>
    </section>
  )
}

// ───────────────────────────────────────────── ⑧ 14 ngày
const NHAN_THU_NGAN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
function KhoiNhip({ pm }: { pm: PhMoi }) {
  const ds = ChuoiMuoiBonNgay(pm)
  if (ds.length === 0 || !pm.nhipHoc) return null
  const hoc = ds.filter((d) => d.soCau !== null && d.soCau > 0)
  const tong = hoc.reduce((s, d) => s + (d.soCau ?? 0), 0)
  const muc = (n: number | null) => (n === null || n === 0 ? 0 : n < 20 ? 1 : n < 30 ? 2 : 3)
  return (
    <section className="phm-muc" id="nhip-14-ngay" aria-labelledby="h-8">
      <div className="phm-muc__dau">
        <h2 id="h-8">14 ngày gần đây</h2>
        <p>
          số câu con làm mỗi ngày · {ngayChuoiNgan(ds[0]!.ngay)} đến {ngayChuoiNgan(ds[13]!.ngay)}
        </p>
      </div>
      <div className="phm-the">
        <ol className="phm-14" aria-label={`Số câu con làm mỗi ngày, từ ${ngayChuoiNgan(ds[0]!.ngay)} đến ${ngayChuoiNgan(ds[13]!.ngay)}`}>
          {ds.map((d, i) => {
            const thu = thuTuChuoiNgay(d.ngay)
            const ngan = NHAN_THU_NGAN[['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'].indexOf(thu)] ?? ''
            const co = d.soCau !== null && d.soCau > 0
            return (
              <li key={d.ngay} data-muc={muc(d.soCau)} data-nay={i === 13 ? '' : undefined} aria-label={`${thu} ${ngayChuoiNgan(d.ngay)}: ${co ? `${d.soCau} câu` : 'không học'}`}>
                <small>{`${ngan} ${ngayChuoiNgan(d.ngay).slice(0, 2)}`}</small>
                <b>{co ? d.soCau : '–'}</b>
                <small>{co ? 'câu' : 'nghỉ'}</small>
              </li>
            )
          })}
        </ol>
        <p className="phm-thang-mau" aria-hidden="true">
          <span>
            <i style={{ boxShadow: 'inset 0 0 0 1.5px var(--phm-vien-dam)' }} />
            không học
          </span>
          <span>
            <i style={{ background: 'var(--m3-primary-container)' }} />
            dưới 20 câu
          </span>
          <span>
            <i style={{ background: 'color-mix(in srgb, var(--m3-primary) 30%, var(--m3-primary-container))' }} />
            20 đến 29 câu
          </span>
          <span>
            <i style={{ background: 'var(--m3-primary)' }} />
            từ 30 câu
          </span>
        </p>
        <p className="phm-14-chu">
          <span>
            Con học {hoc.length} trong 14 ngày · tổng {tong} câu
          </span>
          {pm.nhipHoc.gioThuongHoc && <span>Con thường học từ {pm.nhipHoc.gioThuongHoc.replace('–', ' đến ')}</span>}
        </p>
      </div>
    </section>
  )
}

// ───────────────────────────────────────────── ⑨ lời A.I Đỗ Đại Học
function KhoiLoiAi({ pm }: { pm: PhMoi }) {
  const l = pm.loiBoNao
  const goiY = pm.phuHuynhLamGi
  if (!l && goiY.length === 0) return null
  return (
    <section className="phm-muc" id="loi-ai" aria-labelledby="h-9">
      <div className="phm-muc__dau">
        <h2 id="h-9">Lời A.I Đỗ Đại Học gửi anh/chị</h2>
      </div>
      {l && (
        <div className="phm-thu" data-vung="loi-ai">
          <h3>{l.ngay ? `Hôm nay · ${thuNgayVn(`${l.ngay}T05:00:00Z`)}` : 'Hôm nay'}</h3>
          {l.loi && <p>{l.loi}</p>}
          {l.thuTuan && <p>{l.thuTuan}</p>}
          <small>A.I Đỗ Đại Học viết từ số liệu học của con</small>
        </div>
      )}
      {goiY.length > 0 && (
        <div className="phm-goi-y" data-vung="goi-y">
          <h3>Anh/chị có thể làm gì</h3>
          <ol>
            {goiY.map((g, i) => (
              <li key={i}>
                <b>{i + 1}</b>
                <span>{g}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}

// ───────────────────────────────────────────── bảng
export interface BangMoiThuProps {
  pm: PhMoi
  sbd: string
  lop: string
  giaoThem: ViewGiaoThem
  onVe: () => void
  mucDau?: 'ca-kiem-tra'
}

export default function BangMoiThu({ pm, sbd, lop, giaoThem, onVe, mucDau }: BangMoiThuProps) {
  const nhom = useMemo(() => gomNhomCau(pm), [pm])
  const [mo, setMo] = useState<Set<string>>(() => {
    // Ít câu (≤ 40) ⇒ mở sẵn nhóm mới nhất có câu; nhiều câu ⇒ đóng hết, mở dần theo nhóm.
    const co = nhom.filter((n) => n.cau.length > 0)
    const tong = co.reduce((s, n) => s + n.cau.length, 0)
    return tong > 0 && tong <= NGUONG_NHOM_LAZY && co.length > 0 ? new Set([co[co.length - 1]!.id]) : new Set()
  })
  const [hien, setHien] = useState('tong-quan')
  const goc = useRef<HTMLDivElement>(null)
  const muc = [
    pm.tongQuan && { id: 'tong-quan', nhan: 'Tổng quan' },
    pm.dongThoiGian && { id: 'dong-thoi-gian', nhan: 'Dòng thời gian' },
    pm.caGanNhat && { id: 'ca-kiem-tra', nhan: 'Ca kiểm tra' },
    pm.manhYeu && { id: 'manh-yeu', nhan: 'Điểm mạnh · cần luyện' },
    pm.cau && { id: 'tung-cau', nhan: `Từng câu (${pm.cau.length})` },
    pm.baiTapVeNha && (pm.baiTapVeNha.dangChay.length > 0 || pm.baiTapVeNha.gan.length > 0) && { id: 'btvn', nhan: 'Bài tập về nhà' },
    pm.lichOn && { id: 'lich-on', nhan: 'Lịch ôn lại' },
    pm.nhipHoc && { id: 'nhip-14-ngay', nhan: '14 ngày' },
    (pm.loiBoNao || pm.phuHuynhLamGi.length > 0) && { id: 'loi-ai', nhan: 'Lời A.I Đỗ Đại Học' },
  ].filter((x): x is { id: string; nhan: string } => !!x)
  const nhay = (id: string) => {
    setHien(id)
    document.getElementById(id)?.scrollIntoView?.({ block: 'start', behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ? 'auto' : 'smooth' })
  }
  useEffect(() => {
    if (mucDau) window.setTimeout(() => nhay(mucDau), 0)
    window.scrollTo?.(0, mucDau ? window.scrollY : 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const ob = new IntersectionObserver(
      (es) => {
        const v = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (v) setHien(v.target.id)
      },
      { rootMargin: '-80px 0px -60% 0px' },
    )
    for (const m of muc) {
      const e = document.getElementById(m.id)
      if (e) ob.observe(e)
    }
    return () => ob.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pm])
  const chonMoc = (id: string) => {
    setMo((s) => new Set(s).add(id))
    window.setTimeout(() => nhay(id), 0)
  }
  return (
    <div className="m3 phm" data-vung="bang-moi-thu" ref={goc}>
      <header className="phm-tren">
        <button type="button" className="phm-nut-tron" onClick={onVe} aria-label="Về màn chính">
          <ArrowLeft className="phm-i" aria-hidden="true" />
        </button>
        <div className="phm-tren-ten">
          <h1>Mọi thứ về con</h1>
          <p>{[pm.hoTen, lop ? `Lớp ${lop}` : ''].filter(Boolean).join(' · ')}</p>
        </div>
      </header>
      <div className="phm-khung">
        <div className="phm-canh">
          <nav className="phm-muc-luc" aria-label="Các mục của bảng">
            <span className="phm-muc-luc__tieu">TRONG BẢNG NÀY</span>
            <ul>
              {muc.map((m) => (
                <li key={m.id}>
                  <a href={`#${m.id}`} aria-current={hien === m.id ? 'true' : undefined} onClick={(e) => (e.preventDefault(), nhay(m.id))}>
                    {m.nhan}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <main className="phm-noi-dung">
          <KhoiTongQuan pm={pm} />
          <KhoiDongThoiGian pm={pm} nhom={nhom} onChonMoc={chonMoc} />
          <KhoiCa pm={pm} />
          <KhoiManhYeu pm={pm} />
          <KhoiTungCau pm={pm} nhom={nhom} sbd={sbd} mo={mo} batMo={(id) => setMo((s) => new Set(s).add(id))} dongMo={(id) => setMo((s) => (s.delete(id), new Set(s)))} />
          <KhoiBtvn pm={pm} />
          <KhoiLichOn pm={pm} />
          <KhoiNhip pm={pm} />
          <KhoiLoiAi pm={pm} />
        </main>
      </div>
      <ThanhDay giaoThem={giaoThem} />
    </div>
  )
}

// BẢNG XẾP HỌC SINH (app thầy, mục Học sinh — thầy 24/10). Mở khi thầy bấm (tải lười), không gọi lệnh nào lúc mở app.
// Công tắc Tắt / Chạy ngầm / Bật · đếm 5 bậc (bấm để lọc) · danh sách em theo bậc nặng trước · Tính lại ngay · gán nhãn mù 30 em để so với máy.
import { useEffect, useMemo, useState } from 'react'
import { hoiXacNhan } from '../hop-thoai'
import {
  datCheDo, GIAI_CHE_DO, layLopHocThat, nhanMu, ngayNgan, TEN_BAC_GV, TEN_CHE_DO, TEN_NHAN_MU, tinhLaiTatCa,
  type Bac, type CheDo, type EmLop, type NhanMu, type SoSanhNhanMu,
} from '../../lib/hoc-that-api'
import './hoc-that.css'

export const ChipBac = ({ bac }: { bac: Bac }) => <span className={`ht-chip ht-chip--${bac}`}>{TEN_BAC_GV[bac]}</span>
const BAC: Bac[] = [5, 4, 3, 2, 1]
const MAU_NHAN_MU = 30

export default function BangHocThat({ onMoEm }: { onMoEm: (sbd: string) => void }) {
  const [cheDo, setCheDo] = useState<CheDo | null>(null)
  const [ds, setDs] = useState<EmLop[] | null>(null)
  const [loi, setLoi] = useState('')
  const [loc, setLoc] = useState<Bac | null>(null)
  const [dangTinh, setDangTinh] = useState<number | null>(null)
  const [che, setChe] = useState<'ds' | 'mu'>('ds')
  const tai = async () => {
    setLoi('')
    const r = await layLopHocThat()
    if (!r.ok) { setLoi(r.chu); return }
    setCheDo(r.du.cheDo)
    setDs(r.du.em)
  }
  useEffect(() => { void tai() }, [])

  const dem = useMemo(() => {
    const d: Record<Bac, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    for (const e of ds ?? []) d[e.bac]++
    return d
  }, [ds])
  const hien = useMemo(() => (ds ?? []).filter((e) => loc === null || e.bac === loc).sort((a, b) => b.bac - a.bac || a.diem - b.diem || a.ten.localeCompare(b.ten, 'vi')), [ds, loc])
  const tuan = ds?.[0]?.tuan

  const doiCheDo = async (v: CheDo) => {
    if (v === cheDo) return
    if (v === 'bat' && !(await hoiXacNhan({ tieuDe: 'Bật xếp học sinh?', noiDung: GIAI_CHE_DO.bat + ' «Không dạy nổi» và «ĐUỔI» vẫn chỉ thầy thấy.', nhanDongY: 'Bật' }))) return
    const r = await datCheDo(v)
    if (!r.ok) { setLoi(r.chu); return }
    setCheDo(r.du)
  }
  const tinhLai = async () => {
    setDangTinh(0)
    const r = await tinhLaiTatCa((n) => setDangTinh(n))
    setDangTinh(null)
    if (!r.ok) setLoi(r.chu)
    await tai()
  }

  return (
    <div className="ht-khung">
      <div className="ht-the">
        <p className="ht-tieu">Chế độ</p>
        <div className="ht-hang" role="group" aria-label="Chế độ xếp học sinh">
          {(['tat', 'ngam', 'bat'] as const).map((v) => (
            <button key={v} type="button" className={`ht-nut${cheDo === v ? ' ht-nut--chon' : ''}`} aria-pressed={cheDo === v} disabled={cheDo === null} onClick={() => void doiCheDo(v)}>{TEN_CHE_DO[v]}</button>
          ))}
        </div>
        {cheDo && <p className="ht-giai" style={{ marginTop: 'var(--k2)' }}>{GIAI_CHE_DO[cheDo]}</p>}
      </div>

      <div className="ht-hang" style={{ justifyContent: 'space-between' }}>
        <span className="ht-giai">{tuan ? `Bản tính tuần ${ngayNgan(tuan)} · 14 ngày gần nhất · ${ds?.length ?? 0} em` : ds ? 'Chưa có bản tính tuần nào.' : 'Đang tải…'}</span>
        <div className="ht-hang">
          <button type="button" className={`ht-nut${che === 'mu' ? ' ht-nut--chon' : ''}`} aria-pressed={che === 'mu'} onClick={() => setChe(che === 'mu' ? 'ds' : 'mu')}>Gán nhãn mù</button>
          <button type="button" className="ht-nut" disabled={dangTinh !== null || cheDo === 'tat'} onClick={() => void tinhLai()}>{dangTinh !== null ? `Đang tính… ${dangTinh} em` : 'Tính lại ngay'}</button>
        </div>
      </div>
      {loi && <p className="ht-giai" role="alert" style={{ color: 'var(--do)' }}>{loi}</p>}

      {che === 'mu' ? <GanNhanMu ds={ds ?? []} /> : (
        <>
          <div className="ht-dem" role="group" aria-label="Lọc theo bậc">
            {BAC.map((b) => (
              <button key={b} type="button" aria-pressed={loc === b} onClick={() => setLoc(loc === b ? null : b)}>
                <b>{dem[b]}</b><ChipBac bac={b} />
              </button>
            ))}
          </div>
          <div className="ht-the">
            {hien.length === 0 ? <p className="ht-giai">{ds ? 'Không có em nào ở bậc này.' : 'Đang tải…'}</p> : (
              <ul className="ht-ds">
                {hien.map((e) => (
                  <li key={e.sbd}>
                    <button type="button" className="ht-dong" onClick={() => onMoEm(e.sbd)}>
                      <span className="ht-dong-ten">{e.ten}{e.lop ? ` · ${e.lop}` : ''}</span>
                      <span className="ht-dong-phai"><span className="ht-diem" title="Điểm Thật">{Math.round(e.diem)}</span><ChipBac bac={e.bac} /></span>
                      {(e.bac >= 3 || e.bac === 2) && (e.lyDo[0] || e.phat[0]?.chu) && <span className="ht-dong-ly">{e.lyDo[0] || e.phat[0]?.chu}</span>}
                      {!e.duDuLieu && <span className="ht-dong-ly">Chưa đủ dữ liệu, chưa xếp Đối phó.</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/** Thầy tự gán nhãn cho ≥ 30 em TRƯỚC khi xem máy xếp (không hiện bậc của máy ở đây) ⇒ đo máy khớp thầy bao nhiêu. */
function GanNhanMu({ ds }: { ds: EmLop[] }) {
  const [nhan, setNhan] = useState<Map<string, NhanMu> | null>(null)
  const [ss, setSs] = useState<SoSanhNhanMu | null>(null)
  const [loi, setLoi] = useState('')
  useEffect(() => { void nhanMu({}).then((r) => (r.ok ? setNhan(r.du.nhan) : setLoi(r.chu))) }, [])
  const gan = async (sbd: string, n: NhanMu) => {
    const r = await nhanMu({ sbd, nhan: nhan?.get(sbd) === n ? '' : n })
    if (r.ok) setNhan(r.du.nhan)
    else setLoi(r.chu)
  }
  const soSanh = async () => {
    const r = await nhanMu({ soSanh: true })
    if (r.ok) setSs(r.du.soSanh)
    else setLoi(r.chu)
  }
  const da = nhan?.size ?? 0
  const theoTen = useMemo(() => [...ds].sort((a, b) => a.ten.localeCompare(b.ten, 'vi')), [ds])
  return (
    <div className="ht-the">
      <p className="ht-tieu">Gán nhãn mù · {da}/{MAU_NHAN_MU} em</p>
      <p className="ht-giai">Thầy chọn theo hiểu biết của mình, không nhìn bậc máy xếp. Đủ {MAU_NHAN_MU} em mới so được với máy.</p>
      {loi && <p className="ht-giai" role="alert" style={{ color: 'var(--do)' }}>{loi}</p>}
      <div className="ht-hang" style={{ margin: 'var(--k2) 0' }}>
        <button type="button" className="ht-nut" disabled={da < MAU_NHAN_MU} onClick={() => void soSanh()}>So với máy</button>
      </div>
      {ss && (
        <div className="ht-luoi" style={{ marginBottom: 'var(--k3)' }}>
          <div className="ht-o"><span>Máy khớp thầy</span><b>{ss.khop}/{ss.coMay}{ss.tiLeKhop !== null ? ` · ${Math.round(ss.tiLeKhop * 100)}%` : ''}</b></div>
          <div className="ht-o"><span>Thầy nói Học thật, máy xếp Không dạy nổi / ĐUỔI</span><b>{ss.hocThatBiNang} em</b></div>
        </div>
      )}
      {theoTen.map((e) => (
        <div key={e.sbd} className="ht-mu">
          <span className="ht-dong-ten">{e.ten}{e.lop ? ` · ${e.lop}` : ''}</span>
          <div className="ht-hang">
            {(['hoc_that', 'doi_pho', 'khong_day_noi'] as const).map((n) => (
              <button key={n} type="button" className={`ht-nut${nhan?.get(e.sbd) === n ? ' ht-nut--chon' : ''}`} aria-pressed={nhan?.get(e.sbd) === n} disabled={!nhan} onClick={() => void gan(e.sbd, n)}>{TEN_NHAN_MU[n]}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// HÀNH TRÌNH › BÀI MỚI TRONG 7 NGÀY (app thầy) — trùng tu 12/10, thầy (kèm ảnh thẻ chữ dồn cục): "phần này tôi muốn bạn trùng tu lại toàn bộ bạn quyết
// định sao cho khoa học đầy đủ và đẹp nhất trực quan".
//   · ĐẦU THẺ: chọn bài (thẻ chọn: lớp · tên · hạn nộp · số ngày còn lại) · hàng 6 ô số có nhãn · dải tiến độ cả lớp (đã tự làm / đã gặp, chưa tự làm /
//     chưa gặp). Gặp câu gốc, tự làm và kỹ năng đã đạt là ba bằng chứng đo riêng (không cộng lẫn).
//   · HAI THẺ CON: "Danh sách chữa" (mặc định — câu cần chữa gấp đứng đầu theo thứ tự máy chủ; lọc tình trạng × loại câu; xếp theo tỉ lệ sai; mở
//     "Học sinh cần hỗ trợ" ngay trong dòng, ba nhóm không trùng em) · "Tiến độ học sinh" (bảng có thanh nhỏ, tìm tên, bốn cách xếp).
//   · TẤM SOẠN PHẦN CHỮA (bấm "Mở câu và chữa"): câu + đáp án + lời giải, ô "Giải thích để học sinh học lại", ba nút — hành vi lưu GIỮ NGUYÊN:
//     `chua` (lời giải thích) · `chua` + `dungLoiGiaiSan` (duyệt lời giải đã có) · đóng. Esc đóng (còn chữ chưa lưu thì hỏi lại bằng chữ), focus về nút đã mở.
//   · Giữ mọi trạng thái cũ: đang tải · lỗi (role=alert, "Cập nhật" để thử lại) · chưa có bài (`trangRieng`) · cảnh báo `nguonDayDu === false` · `onBat`.
//   · Màu: chỉ biến --gvm-* của app thầy (goi7.css). Phép thuần ở goi7-ui.ts.
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, RefreshCw, Search } from 'lucide-react'
import { goiLenh } from '../../lib/goi-lenh-thay'
import { propsCauHoc } from '../hoc-tap/ManLamBaiTap'
import TheCau from '../TheCau'
import type { PrivateQuestion } from '../../game/than-thu-v2/core'
import {
  chuConLai, chuDiem, chuHan, demLoc, hanNgan, khopEm, locCau, MAU_TOI_THIEU, MOI_DOT_CAU, MOI_DOT_EM, mucCau, ngayVn, nhomHoTro, NHIEU_SAI, phanTram, so,
  soNgayCon, TEN_LOC, TEN_PHAN, TEN_XEP_EM, tiLeSai, tomTatLop, xepCau, xepEm,
  type CauDu, type DuGoi7, type EmTen, type GoiDu, type LocPhan, type LocTinhTrang, type XepCau, type XepEm,
} from './goi7-ui'
import './goi7.css'

/** Nhiều hơn số bài này ⇒ ô chọn xổ xuống thay cho hàng thẻ chọn. */
const TRAN_THE_BAI = 6
type TheCon = 'chua' | 'tien-do'
const CHON_FOCUS = 'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'

export default function BangGoi7({ lop, onBat, trangRieng = false }: { lop?: string | null; onBat?: (bat: boolean) => void; trangRieng?: boolean }) {
  const [du, setDu] = useState<DuGoi7 | null>(null)
  const [goi, setGoi] = useState('')
  const [tai, setTai] = useState(true)
  const [loi, setLoi] = useState('')
  const [lan, setLan] = useState(0)
  // tấm soạn phần chữa
  const [q, setQ] = useState<PrivateQuestion | null>(null)
  const [cauMo, setCauMo] = useState<CauDu | null>(null)
  const [loiGo, setLoiGo] = useState('')
  const [loiLuu, setLoiLuu] = useState('')
  const [dangMo, setDangMo] = useState('')
  const [loiMo, setLoiMo] = useState<{ qid: string; chu: string } | null>(null)
  const nutMo = useRef<HTMLButtonElement | null>(null)
  // thẻ con + lọc / xếp
  const [the, setThe] = useState<TheCon>('chua')
  const [loc, setLoc] = useState<LocTinhTrang>('tat-ca')
  const [phan, setPhan] = useState<LocPhan>('moi')
  const [xep, setXep] = useState<XepCau>('uu-tien')
  const [soCauHien, setSoCauHien] = useState(MOI_DOT_CAU)
  const [moHoTro, setMoHoTro] = useState<ReadonlySet<string>>(new Set())
  const [tim, setTim] = useState('')
  const [xepEmChon, setXepEmChon] = useState<XepEm>('chua-gap')
  const [soEmHien, setSoEmHien] = useState(MOI_DOT_EM)
  const id = useId()

  useEffect(() => { onBat?.(!!du?.bat) }, [du?.bat, onBat])
  useEffect(() => {
    let huy = false
    setTai(true)
    void goiLenh('/gv/goi-bai-7', { lop: lop ?? '', goiId: goi }, 'Máy chủ chưa có bảng bài 7 ngày.')
      .then((r) => {
        if (huy) return
        if (!r.ok) { setLoi(r.chu); return }
        const d = r.du as unknown as DuGoi7
        if (d.bat && Array.isArray(d.goi) && Array.isArray(d.em) && Array.isArray(d.cau)) { setDu(d); setLoi('') } else setDu(null)
      })
      .finally(() => { if (!huy) setTai(false) })
    return () => { huy = true }
  }, [lop, goi, lan])

  const mo = async (c: CauDu, nut: HTMLButtonElement) => {
    if (!du) return
    nutMo.current = nut
    setLoiMo(null); setDangMo(c.qid)
    const r = await goiLenh('/gv/goi-bai-7', { action: 'chi_tiet', goiId: du.goiId, qid: c.qid }, 'Chưa mở được câu.')
    if (r.ok) { setQ(r.du.cau as PrivateQuestion); setCauMo(c); setLoiGo(c.loiGo === '@loi-giai-goc' ? '' : c.loiGo); setLoiLuu('') }
    else setLoiMo({ qid: c.qid, chu: r.chu })
    setDangMo('')
  }
  const dong = useCallback(() => {
    setQ(null); setCauMo(null); setLoiLuu('')
    const nut = nutMo.current
    if (nut?.isConnected) nut.focus()
  }, [])
  const luu = async (dungLoiGiaiSan = false) => {
    if (!q || !du) return
    setTai(true); setLoiLuu('')
    const r = await goiLenh('/gv/goi-bai-7', { action: 'chua', goiId: du.goiId, qid: q.qid, version: q.version, loiGo, dungLoiGiaiSan }, 'Chưa lưu được bài chữa.')
    if (r.ok) { dong(); setLan((n) => n + 1) } else setLoiLuu(r.chu)
    setTai(false)
  }
  const doiGoi = (g: string) => {
    setGoi(g); setQ(null); setCauMo(null); setMoHoTro(new Set()); setSoCauHien(MOI_DOT_CAU); setSoEmHien(MOI_DOT_EM); setLoiMo(null)
  }

  const tt = useMemo(() => (du ? tomTatLop(du) : null), [du])
  const dem = useMemo(() => (du ? demLoc(du.cau, loc, phan) : null), [du, loc, phan])
  const dsCau = useMemo(() => (du ? xepCau(locCau(du.cau, loc, phan), xep) : []), [du, loc, phan, xep])
  const dsEm = useMemo(() => (du ? xepEm(du.em.filter((e) => khopEm(e, tim)), xepEmChon) : []), [du, tim, xepEmChon])
  const viTriCau = useMemo(() => new Map((du?.cau ?? []).map((c, i) => [c.qid, i])), [du])

  if (!du && !loi && !trangRieng) return null
  const coGoi = !!du?.goi.length
  const homNay = ngayVn()

  return (
    <section className="g7" aria-label="Bài mới trong 7 ngày" aria-busy={tai}>
      <div className="g7-dau-the">
        <div className="g7-dau-chu">
          <h2 className={trangRieng ? 'g7-an' : 'g7-h2'}>Bài mới trong 7 ngày</h2>
          {du && coGoi && <span className="g7-nhan" id={`${id}-bai`}>Bài của lớp</span>}
        </div>
        <button type="button" className="g7-nut-chu tt-nhan" onClick={() => setLan((n) => n + 1)} disabled={tai}>
          <RefreshCw size={18} aria-hidden="true" className={tai && du ? 'g7-quay' : undefined} />
          Cập nhật
        </button>
      </div>
      {du && coGoi && <ChonBai idNhan={`${id}-bai`} ds={du.goi} chon={du.goiId} homNay={homNay} onChon={doiGoi} />}

      {tai && !du && !loi && <Xuong />}
      {!tai && !loi && !coGoi && trangRieng && (
        <p className="g7-trong">Chưa có bài mới trong 7 ngày. Thầy chọn bài ở Dạy học → Bài hôm nay, rồi cập nhật lại.</p>
      )}
      {loi && <p className="g7-loi" role="alert">{loi}</p>}

      {du && coGoi && tt && dem && (
        <>
          {du.nguonDayDu === false && (
            <p className="g7-canh-bao" role="alert">
              Bộ bài chưa đủ nguồn của mọi tờ đã chọn. Tổng câu và tiến độ dưới đây là phần đã có, chưa xác nhận phủ toàn bộ bài. Thầy bổ sung hoặc kiểm tra nguồn câu.
            </p>
          )}
          <OSo du={du} tt={tt} />
          <DaiTienDo tt={tt} soCau={du.soCau ?? du.cau.length} />
          <p className="g7-ghi">Gặp câu gốc, tự làm và kỹ năng đã đạt được đo riêng. Chữa cho cả lớp chưa xác nhận từng em đã hiểu.</p>

          <div className="g7-tab" role="tablist" aria-label="Bài mới trong 7 ngày: danh sách chữa hoặc tiến độ học sinh">
            {([['chua', 'Danh sách chữa', `${so(du.cau.length)} câu`], ['tien-do', 'Tiến độ học sinh', `${so(du.em.length)} em`]] as const).map(([k, chu, phu]) => (
              <button key={k} type="button" role="tab" id={`${id}-tab-${k}`} aria-controls={`${id}-o-${k}`} aria-selected={the === k} className="g7-tab-nut tt-nhan" onClick={() => setThe(k)}>
                {chu}
                <small className="g7-so">{phu}</small>
              </button>
            ))}
          </div>

          {the === 'chua' ? (
            <div role="tabpanel" id={`${id}-o-chua`} aria-labelledby={`${id}-tab-chua`} className="g7-o-tab">
              <p className="g7-ghi">
                Câu có em nhờ thầy chữa, câu khó và câu tính toán đứng trước. Nhãn "{NHIEU_SAI}" cần ít nhất {MAU_TOI_THIEU} học sinh đã tự làm và từ 30% sai ở lần đầu.
              </p>
              <div className="g7-loc">
                <PhanDoan<LocTinhTrang>
                  nhan="Tình trạng"
                  chon={loc}
                  ds={(['tat-ca', 'chua-duyet', 'nhieu-sai', 'tinh-toan'] as const).map((k): [LocTinhTrang, string, number] => [k, TEN_LOC[k], dem.tinhTrang[k]])}
                  onChon={(k) => { setLoc(k); setSoCauHien(MOI_DOT_CAU) }}
                />
                <PhanDoan<LocPhan>
                  nhan="Loại câu"
                  chon={phan}
                  ds={(['moi', 'I', 'II', 'III'] as const).map((k): [LocPhan, string, number] => [k, k === 'moi' ? 'Mọi loại' : TEN_PHAN[k], dem.phan[k]])}
                  onChon={(k) => { setPhan(k); setSoCauHien(MOI_DOT_CAU) }}
                />
                <PhanDoan<XepCau>
                  nhan="Xếp theo"
                  chon={xep}
                  ds={[['uu-tien', 'Thứ tự ưu tiên', null], ['ti-le-sai', 'Tỉ lệ sai cao trước', null]]}
                  onChon={(k) => { setXep(k); setSoCauHien(MOI_DOT_CAU) }}
                />
              </div>
              {xep === 'ti-le-sai' && <p className="g7-ghi">Câu có dưới {MAU_TOI_THIEU} học sinh tự làm (mẫu nhỏ) xếp sau câu đủ mẫu.</p>}
              <p className="g7-dem-hien g7-so" aria-live="polite">
                Đang hiện {so(Math.min(soCauHien, dsCau.length))}/{so(dsCau.length)} câu
              </p>
              {dsCau.length === 0 ? (
                <p className="g7-trong">Không có câu nào khớp bộ lọc. Thầy chọn "Tất cả" hoặc "Mọi loại" để xem lại.</p>
              ) : (
                <>
                  <div className="g7-ds-dau" aria-hidden="true">
                    <span>Câu</span>
                    <span>Sai ở lần tự làm đầu</span>
                    <span>Học sinh cần hỗ trợ</span>
                    <span>Phần chữa</span>
                  </div>
                  <ol className="g7-ds">
                    {dsCau.slice(0, soCauHien).map((c) => {
                      const vt = viTriCau.get(c.qid) ?? 0
                      return (
                        <HangCau
                          key={c.qid}
                          c={c}
                          soThuTu={c.soCau ?? vt + 1}
                          idHang={`${id}-c${vt}`}
                          mo={moHoTro.has(c.qid)}
                          onMoHoTro={() => setMoHoTro((s) => { const n = new Set(s); if (n.has(c.qid)) n.delete(c.qid); else n.add(c.qid); return n })}
                          dangMo={dangMo === c.qid}
                          khoa={!!dangMo}
                          loiMo={loiMo?.qid === c.qid ? loiMo.chu : ''}
                          onMo={(nut) => void mo(c, nut)}
                        />
                      )
                    })}
                  </ol>
                  {dsCau.length > soCauHien && (
                    <button type="button" className="g7-nut-vien g7-them tt-nhan" onClick={() => setSoCauHien((n) => n + MOI_DOT_CAU)}>
                      Xem thêm {so(Math.min(MOI_DOT_CAU, dsCau.length - soCauHien))} câu (còn {so(dsCau.length - soCauHien)})
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <div role="tabpanel" id={`${id}-o-tien-do`} aria-labelledby={`${id}-tab-tien-do`} className="g7-o-tab">
              <div className="g7-loc">
                <label className="g7-tim">
                  <Search size={16} aria-hidden="true" />
                  <input type="search" value={tim} onChange={(ev) => { setTim(ev.target.value); setSoEmHien(MOI_DOT_EM) }} placeholder="Tìm tên hoặc số báo danh…" aria-label="Tìm học sinh theo tên hoặc số báo danh" />
                </label>
                <PhanDoan<XepEm>
                  nhan="Xếp theo"
                  chon={xepEmChon}
                  ds={(['chua-gap', 'tu-lam', 'ky-nang', 'ten'] as const).map((k): [XepEm, string, null] => [k, TEN_XEP_EM[k], null])}
                  onChon={(k) => { setXepEmChon(k); setSoEmHien(MOI_DOT_EM) }}
                />
              </div>
              <p className="g7-dem-hien g7-so" aria-live="polite">
                Đang hiện {so(Math.min(soEmHien, dsEm.length))}/{so(dsEm.length)} học sinh
              </p>
              {dsEm.length === 0 ? (
                <p className="g7-trong">{du.em.length ? 'Không có học sinh nào khớp ô tìm.' : 'Bài này chưa có học sinh nhận.'}</p>
              ) : (
                <BangTienDo ds={dsEm.slice(0, soEmHien)} />
              )}
              {dsEm.length > soEmHien && (
                <button type="button" className="g7-nut-vien g7-them tt-nhan" onClick={() => setSoEmHien((n) => n + MOI_DOT_EM)}>
                  Xem thêm {so(Math.min(MOI_DOT_EM, dsEm.length - soEmHien))} học sinh (còn {so(dsEm.length - soEmHien)})
                </button>
              )}
            </div>
          )}
        </>
      )}

      {q && cauMo &&
        createPortal(
          <div className="m3 m3-thay vo-thay" data-hoa2="" data-vo-cong="soan-phan-chua-g7" style={{ display: 'contents' }}>
            <TamSoanChua
              q={q}
              c={cauMo}
              soThuTu={cauMo.soCau ?? (viTriCau.get(cauMo.qid) ?? 0) + 1}
              loiGo={loiGo}
              onLoiGo={setLoiGo}
              tai={tai}
              loi={loiLuu}
              onLuu={(san) => void luu(san)}
              onDong={dong}
            />
          </div>,
          document.body,
        )}
    </section>
  )
}

// ================================================================== đầu thẻ
function Xuong() {
  return (
    <div className="g7-xuong">
      <p role="status">Đang đọc bài mới và tiến độ học sinh…</p>
      <div className="g7-xuong-luoi" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5].map((i) => <span key={i} className="g7-xuong-khoi tt-xuong" />)}
      </div>
      <span className="g7-xuong-khoi g7-xuong-dai tt-xuong" aria-hidden="true" />
    </div>
  )
}

function ChonBai({ idNhan, ds, chon, homNay, onChon }: { idNhan: string; ds: GoiDu[]; chon: string; homNay: string; onChon: (id: string) => void }) {
  const chuBai = (g: GoiDu) => {
    const con = chuConLai(g.han, homNay)
    return `${g.lop} · ${g.ten} · hạn nộp ${hanNgan(g.han)}${con ? ` · ${con}` : ''}`
  }
  if (ds.length > TRAN_THE_BAI) {
    return (
      <div className="g7-chon">
        <select value={chon} onChange={(e) => onChon(e.target.value)} aria-labelledby={idNhan}>
          {ds.map((g) => <option key={g.id} value={g.id}>{chuBai(g)}</option>)}
        </select>
      </div>
    )
  }
  return (
    <div className="g7-chon">
      <div className="g7-bai" role="radiogroup" aria-labelledby={idNhan}>
        {ds.map((g) => {
          const n = soNgayCon(g.han, homNay)
          return (
            <button key={g.id} type="button" role="radio" aria-checked={g.id === chon} aria-label={chuBai(g)} className="g7-bai-nut tt-nhan" onClick={() => onChon(g.id)}>
              <span className="g7-bai-lop">{g.lop}</span>
              <b className="g7-bai-ten">{g.ten}</b>
              <span className="g7-bai-han g7-so" data-gap={n !== null && n <= 2 ? 'true' : undefined}>
                Hạn nộp {chuHan(g.han)}
                {n !== null && <> · {chuConLai(g.han, homNay)}</>}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Thanh({ p, mau }: { p: number | null; mau: 'xd' | 'xl' | 'ho' | 'tim' }) {
  return (
    <span className="g7-thanh" data-mau={mau} aria-hidden="true">
      <i style={{ width: `${Math.max(0, Math.min(100, p ?? 0))}%` }} />
    </span>
  )
}

function OSo({ du, tt }: { du: DuGoi7; tt: ReturnType<typeof tomTatLop> }) {
  const soCau = du.soCau ?? du.cau.length
  const soEm = du.soEm ?? du.em.length
  const conGap = du.canGap ?? du.em.filter((e) => e.con > 0).length
  const pGap = phanTram(tt.gap, tt.tong), pTuLam = phanTram(tt.tuLam, tt.tong), pSai = phanTram(tt.sai, tt.daDo)
  const loai = (['I', 'II', 'III'] as const).filter((k) => tt.theoPhan[k] > 0).map((k) => `${so(tt.theoPhan[k])} ${TEN_PHAN[k]}`).join(' · ')
  const o: { k: string; nhan: string; gt: string; phu: ReactNode; mau?: 'ho'; thanh?: [number | null, 'xd' | 'xl' | 'ho'] }[] = [
    { k: 'em', nhan: 'Học sinh nhận bài', gt: so(soEm), phu: `${so(conGap)} em còn câu chưa gặp` },
    { k: 'cau', nhan: 'Câu của bài', gt: so(soCau), phu: loai || 'Chưa có câu' },
    { k: 'can-chua', nhan: 'Câu cần chữa', gt: so(du.canChua ?? 0), phu: `Đã có phần chữa: ${so(tt.daCoChua)}/${so(du.cau.length)} câu`, mau: 'ho' },
    { k: 'gap', nhan: 'Đã gặp câu gốc', gt: pGap === null ? '—' : `${pGap}%`, phu: `Trung bình ${so(tt.tbGap)}/${so(soCau)} câu mỗi em`, thanh: [pGap, 'xd'] },
    { k: 'tu-lam', nhan: 'Đã tự làm', gt: pTuLam === null ? '—' : `${pTuLam}%`, phu: `Trung bình ${so(tt.tbTuLam)}/${so(soCau)} câu mỗi em`, thanh: [pTuLam, 'xl'] },
    {
      k: 'sai', nhan: 'Sai ở lần tự làm đầu', gt: pSai === null ? '—' : `${pSai}%`,
      phu: tt.daDo ? `${so(tt.sai)} sai trong ${so(tt.daDo)} lần tự làm đầu` : 'Chưa có học sinh tự làm', thanh: [pSai, 'ho'],
    },
  ]
  return (
    <dl className="g7-so-luoi">
      {o.map((x) => (
        <div key={x.k} className="g7-o-so" data-mau={x.mau}>
          <dt className="g7-o-nhan">{x.nhan}</dt>
          <dd className="g7-o-gt g7-so">{x.gt}</dd>
          {x.thanh && <dd className="g7-o-thanh"><Thanh p={x.thanh[0]} mau={x.thanh[1]} /></dd>}
          <dd className="g7-o-phu g7-so">{x.phu}</dd>
        </div>
      ))}
    </dl>
  )
}

function DaiTienDo({ tt, soCau }: { tt: ReturnType<typeof tomTatLop>; soCau: number }) {
  const idTieu = useId()
  const phan: [string, string, number][] = [
    ['tu-lam', 'Đã tự làm', tt.tuLam],
    ['gap', 'Đã gặp, chưa tự làm', tt.gapChuaTuLam],
    ['chua', 'Chưa gặp', tt.chuaGap],
  ]
  return (
    <section className="g7-dai" aria-labelledby={idTieu}>
      <div className="g7-dai-dau">
        <h3 id={idTieu} className="g7-h3">Tiến độ cả lớp</h3>
        <span className="g7-phu g7-so">{so(tt.soEm)} em × {so(soCau)} câu gốc = {so(tt.tong)} lượt cần gặp</span>
      </div>
      <div className="g7-dai-thanh" aria-hidden="true">
        {phan.map(([k, , n]) => (n > 0 ? <span key={k} data-k={k} style={{ width: `${(100 * n) / Math.max(1, tt.tong)}%` }} /> : null))}
      </div>
      <ul className="g7-dai-chu">
        {phan.map(([k, chu, n]) => (
          <li key={k}>
            <span className="g7-mau" data-k={k} aria-hidden="true" />
            <span>{chu}</span>
            <b className="g7-so">{so(n)}</b>
            <span className="g7-so g7-phu">({phanTram(n, tt.tong) ?? 0}%)</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

// ================================================================== lọc / xếp
function PhanDoan<K extends string>({ nhan, chon, ds, onChon }: { nhan: string; chon: K; ds: [K, string, number | null][]; onChon: (k: K) => void }) {
  const id = useId()
  return (
    <div className="g7-loc-nhom">
      <span className="g7-nhan" id={id}>{nhan}</span>
      <div className="g7-phan-doan" role="radiogroup" aria-labelledby={id}>
        {ds.map(([k, chu, n]) => (
          <button key={k} type="button" role="radio" aria-checked={chon === k} className="g7-phan-doan-nut tt-nhan" onClick={() => onChon(k)}>
            {chu}
            {n !== null && <small className="g7-so">{so(n)}</small>}
          </button>
        ))}
      </div>
    </div>
  )
}

// ================================================================== một dòng câu
function mauLyDo(l: string): 'ho' | 'tim' | 'hp' | undefined {
  if (l === NHIEU_SAI) return 'ho'
  if (/tính toán/i.test(l)) return 'tim'
  if (/khó/i.test(l)) return 'hp'
  return undefined
}

function HangCau({ c, soThuTu, idHang, mo, onMoHoTro, dangMo, khoa, loiMo, onMo }: {
  c: CauDu; soThuTu: number; idHang: string; mo: boolean; onMoHoTro: () => void; dangMo: boolean; khoa: boolean; loiMo: string; onMo: (nut: HTMLButtonElement) => void
}) {
  const nhom = nhomHoTro(c)
  const p = tiLeSai(c)
  const muc = mucCau(c)
  return (
    <li className="g7-hang" data-muc={muc}>
      <div className="g7-hang-luoi">
        <div className="g7-hang-cau" id={`${idHang}-ten`}>
          <p className="g7-cau-so">
            <b>Câu {soThuTu}</b>
            <span className="g7-chip" data-mau="phan">{TEN_PHAN[c.phan]}</span>
          </p>
          <p className="g7-ma" title="Mã tờ đề (nội bộ)">{c.maTo ?? c.maDe}</p>
          {(c.lyDo.length > 0 || c.hopLe === false) && (
            <ul className="g7-chips" aria-label="Lý do ưu tiên">
              {c.lyDo.map((l) => <li key={l} className="g7-chip" data-mau={mauLyDo(l)}>{l}</li>)}
              {c.hopLe === false && <li className="g7-chip" data-mau="hp">Cần bổ sung câu đã duyệt</li>}
            </ul>
          )}
        </div>

        <div className="g7-sai">
          {c.daDo > 0 ? (
            <>
              <p className="g7-sai-so g7-so"><b>{p}%</b> <span>sai lần đầu</span></p>
              <Thanh p={p} mau="ho" />
              <p className="g7-phu g7-so">
                {c.sai}/{c.daDo} học sinh sai{c.daDo < MAU_TOI_THIEU ? ' · mẫu nhỏ' : ''}
              </p>
            </>
          ) : (
            <p className="g7-phu">Chưa có học sinh tự làm</p>
          )}
        </div>

        <div className="g7-ht">
          <dl className="g7-dem">
            <div data-mau={nhom.choChua.length ? 'ho' : undefined}><dt>nhờ thầy chữa</dt><dd className="g7-so">{nhom.choChua.length}</dd></div>
            <div><dt>cần kiểm lại</dt><dd className="g7-so">{nhom.canKiem.length}</dd></div>
            <div><dt>chưa gặp</dt><dd className="g7-so">{nhom.chuaGap.length}</dd></div>
          </dl>
          {nhom.tong > 0 && (
            <button type="button" className="g7-nut-chu g7-nut-mo tt-nhan" aria-expanded={mo} aria-controls={`${idHang}-ht`} onClick={onMoHoTro}>
              Học sinh cần hỗ trợ · {nhom.tong} em
              <ChevronDown size={18} aria-hidden="true" className="g7-mui" />
            </button>
          )}
        </div>

        <div className="g7-chua-o">
          <span className="g7-trang-thai" data-da={c.daChua ? 'true' : 'false'}>{c.daChua ? 'Đã có phần chữa' : 'Chưa duyệt phần chữa'}</span>
          <button type="button" className="g7-nut-vien tt-nhan" aria-describedby={`${idHang}-ten`} disabled={khoa} onClick={(ev) => onMo(ev.currentTarget)}>
            {dangMo ? 'Đang mở câu…' : 'Mở câu và chữa'}
          </button>
        </div>
      </div>
      {loiMo && <p className="g7-loi g7-loi-hang" role="alert">{loiMo}</p>}
      {mo && nhom.tong > 0 && (
        <div className="g7-ht-mo" id={`${idHang}-ht`}>
          <NhomTen tieu="Nhờ thầy chữa" ds={nhom.choChua} mau="ho" />
          <NhomTen tieu="Cần kiểm lại" ds={nhom.canKiem} mau="hp" />
          <NhomTen tieu="Chưa gặp" ds={nhom.chuaGap} />
          <p className="g7-ghi g7-ht-ghi">Mỗi em chỉ nằm ở một nhóm. Cần kiểm lại: đã gặp câu nhưng lần tự làm gần nhất chưa đúng hoặc chưa tự làm.</p>
        </div>
      )}
    </li>
  )
}

function NhomTen({ tieu, ds, mau }: { tieu: string; ds: EmTen[]; mau?: 'ho' | 'hp' }) {
  return (
    <section className="g7-ht-nhom" data-mau={mau} aria-label={`${tieu}: ${ds.length} em`}>
      <h4 className="g7-ht-tieu">{tieu} <span className="g7-so">· {ds.length} em</span></h4>
      {ds.length ? (
        <ul className="g7-ten-ds">{ds.map((e) => <li key={e.sbd} className="g7-ten" title={`SBD ${e.sbd}`}>{e.ten}</li>)}</ul>
      ) : (
        <p className="g7-phu">Không còn em nào</p>
      )}
    </section>
  )
}

// ================================================================== bảng tiến độ học sinh
function BangTienDo({ ds }: { ds: DuGoi7['em'] }) {
  return (
    <div className="g7-bang-cuon" tabIndex={0} role="region" aria-label="Tiến độ từng học sinh trong bài mới">
      <table className="g7-bang">
        <caption className="g7-an">Tiến độ từng học sinh: đã gặp câu gốc, đã tự làm, kỹ năng đã đạt, điểm tự kiểm từng tờ.</caption>
        <thead>
          <tr>
            <th scope="col">Học sinh</th>
            <th scope="col">Đã gặp câu gốc</th>
            <th scope="col">Đã tự làm</th>
            <th scope="col">Kỹ năng đã đạt</th>
            <th scope="col">Điểm tự kiểm</th>
          </tr>
        </thead>
        <tbody>
          {ds.map((e) => (
            <tr key={e.sbd}>
              <th scope="row" className="g7-em">
                <span className="g7-em-chu">
                  <b>{e.ten}</b>
                  <small className="g7-so">SBD {e.sbd}</small>
                </span>
              </th>
              <td data-nhan="Đã gặp câu gốc">
                <span className="g7-o-thanh">
                  <Thanh p={phanTram(e.daGap, e.tong)} mau="xd" />
                  <span className="g7-so">{`${e.daGap}/${e.tong} câu · còn ${e.con}`}</span>
                </span>
              </td>
              <td data-nhan="Đã tự làm">
                <span className="g7-o-thanh">
                  <Thanh p={phanTram(e.tuLam, e.tong)} mau="xl" />
                  <span className="g7-so">{`${e.tuLam}/${e.tong} câu`}</span>
                </span>
              </td>
              <td data-nhan="Kỹ năng đã đạt">
                {e.kyNang.tong ? (
                  <span className="g7-o-thanh">
                    <Thanh p={e.kyNang.tyLe} mau="tim" />
                    <span className="g7-so">{`${e.kyNang.dat}/${e.kyNang.tong} kỹ năng (${so(e.kyNang.tyLe ?? 0)}%)`}</span>
                  </span>
                ) : (
                  <span className="g7-phu">Chưa có bản đồ kỹ năng</span>
                )}
              </td>
              <td data-nhan="Điểm tự kiểm">
                {e.diem.length ? (
                  <ul className="g7-chips">{e.diem.map((d, i) => <li key={d.maDe} className="g7-chip g7-so" data-mau={d.diem >= 8 ? 'xl' : d.diem < 5 ? 'ho' : undefined} title={d.maDe}>{chuDiem(d, i)}</li>)}</ul>
                ) : (
                  <span className="g7-phu">Chưa có điểm</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ================================================================== tấm soạn phần chữa
function TamSoanChua({ q, c, soThuTu, loiGo, onLoiGo, tai, loi, onLuu, onDong }: {
  q: PrivateQuestion; c: CauDu; soThuTu: number; loiGo: string; onLoiGo: (s: string) => void; tai: boolean; loi: string; onLuu: (dungLoiGiaiSan: boolean) => void; onDong: () => void
}) {
  const tam = useRef<HTMLElement>(null)
  const tieu = useRef<HTMLHeadingElement>(null)
  const nutDong = useRef<HTMLButtonElement>(null)
  const goc = useRef(loiGo)
  const [hoi, setHoi] = useState(false)
  const doi = loiGo !== goc.current
  const nhom = nhomHoTro(c)
  const p = tiLeSai(c)

  useEffect(() => { tieu.current?.focus() }, [])
  useEffect(() => {
    const phim = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        ev.preventDefault()
        if (doi) { setHoi(true); nutDong.current?.focus() } else onDong()
        return
      }
      if (ev.key !== 'Tab' || !tam.current) return
      const ds = [...tam.current.querySelectorAll<HTMLElement>(CHON_FOCUS)]
      if (!ds.length) return
      const dau = ds[0]!, cuoi = ds[ds.length - 1]!, dang = document.activeElement
      if (ev.shiftKey && (dang === dau || !tam.current.contains(dang))) { ev.preventDefault(); cuoi.focus() }
      else if (!ev.shiftKey && (dang === cuoi || !tam.current.contains(dang))) { ev.preventDefault(); dau.focus() }
    }
    document.addEventListener('keydown', phim)
    return () => document.removeEventListener('keydown', phim)
  }, [doi, onDong])

  const tomTat = [
    c.daDo ? `${c.sai}/${c.daDo} học sinh sai lần đầu (${p}%)` : 'Chưa có học sinh tự làm',
    nhom.choChua.length ? `${nhom.choChua.length} em nhờ thầy chữa` : '',
    c.daChua ? (c.loiGo === '@loi-giai-goc' ? 'Đang dùng lời giải đã có' : 'Đã có phần chữa') : 'Chưa duyệt phần chữa',
  ].filter(Boolean).join(' · ')
  const du10 = loiGo.trim().length >= 10

  return (
    <>
      <div className="g7-che" aria-hidden="true" />
      <section ref={tam} className="g7-tam" role="dialog" aria-modal="true" aria-labelledby="g7-tam-tieu" aria-describedby="g7-tam-phu">
        <header className="g7-tam-dau">
          <small className="g7-tam-mat">Soạn phần chữa</small>
          <h2 id="g7-tam-tieu" ref={tieu} tabIndex={-1} className="g7-h2">
            Câu {soThuTu} · {TEN_PHAN[c.phan]}
          </h2>
          <p id="g7-tam-phu" className="g7-phu g7-so">{tomTat}</p>
          <p className="g7-ma">{c.maTo ?? c.maDe}</p>
        </header>
        <div className="g7-tam-than">
          <div className="g7-tam-cau">
            <TheCau {...propsCauHoc(q, soThuTu, '', () => {}, { correct: true, answer: q.correct, solution: q.solution })} />
          </div>
          <label className="g7-o-nhap">
            <span className="g7-h3" id="g7-tam-nhan">Giải thích để học sinh học lại</span>
            <textarea value={loiGo} onChange={(e) => { onLoiGo(e.target.value); setHoi(false) }} rows={6} maxLength={20000} aria-labelledby="g7-tam-nhan" aria-describedby="g7-tam-goi-y" />
            <span id="g7-tam-goi-y" className="g7-phu g7-so">
              {du10 ? `${so(loiGo.trim().length)} ký tự` : `Ghi ít nhất 10 ký tự (đang có ${loiGo.trim().length}).`}
              {!q.solution && ' Câu chưa có lời giải sẵn để duyệt.'}
            </span>
          </label>
          {loi && <p className="g7-loi" role="alert">{loi}</p>}
          {hoi && <p className="g7-canh-bao" role="status">Phần giải thích chưa lưu. Bấm "Lưu phần chữa" để giữ, hoặc "Bỏ thay đổi và đóng".</p>}
        </div>
        <footer className="g7-tam-chan">
          <button type="button" className="g7-nut-chinh tt-nhan" disabled={tai || !du10} onClick={() => onLuu(false)}>Lưu phần chữa</button>
          <button type="button" className="g7-nut-vien tt-nhan" disabled={tai || !q.solution} onClick={() => onLuu(true)}>Duyệt lời giải đã có</button>
          <button ref={nutDong} type="button" className="g7-nut-chu tt-nhan" disabled={tai} onClick={onDong}>{doi ? 'Bỏ thay đổi và đóng' : 'Đóng phần chữa'}</button>
        </footer>
      </section>
    </>
  )
}

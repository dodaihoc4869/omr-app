// TỪNG CÂU CON ĐÃ LÀM của bảng "Mọi thứ về con" kiểu Apple: lọc Tất cả/Sai/Làm lâu/Chưa công bố, nhóm theo lần ngồi học (dải ô đúng/sai + danh sách kiểu iOS), mở câu ⇒ 4 phương án + lời giải lấy từ máy chủ. Mẫu: ph-d-bang-day-du.html (#muc-cau) + ph-e.
// Logic nguồn: BangMoiThu.tsx (KhoiTungCau, DongCau, ChiTiet). LUẬT: câu bị che (kieu 'che') KHÔNG bao giờ có đề, đáp án, đúng/sai, con chọn, tên dạng, nút mở; nhóm bị che chỉ một dòng khoá + dải ô che. Đáp án/lời giải chỉ hiện khi máy chủ trả qua taiChiTietCau và câu có qid. Chỉ tệp này kéo ChemText (bảng là gói tải lười).
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
import './TungCau.css'
import { ChemText } from '../../../lib/chem-format'
import { tachDongTheoY } from '../../../lib/tach-dong-cau'
import { taiChiTietCau } from '../../../lib/ph-moi/api'
import { chuThoiGian, gioVn } from '../../../lib/ph-moi/dinh-dang'
import type { CauChe, CauHomNay, CauThuong, ChiTietCau, LyDoChe, PhMoi } from '../../../lib/ph-moi/du-lieu'
import { CHU_CHE, NHAN_NGUON } from '../nhan'
import { BtCheo, BtDongHo, BtKhoa, BtMui, BtMuiXuong, BtTich } from './bieu-tuong'
import { Chip } from './dung-chung'
import { GOP_ID, SO_CAU_XEM_TRUOC, chuKetQuaChe, chuNguongLamLau, laChe, laLamLau, laLamLauThuong, laNhomChe, gopNhomThua, laSai, lyDoCheNhom, soOChe, tachChuCai, type NhomCau } from './nhom-cau'

/** Có câu nào để vẽ mục "Từng câu con đã làm"? */
export function coTungCau(pm: PhMoi): boolean {
  return !!pm.cau && pm.cau.length > 0
}

/** Trạng thái MỞ NHÓM dùng chung giữa vỏ bảng, DongThoiGian (bấm một lần ⇒ mở nhóm) và TungCau. `khoiTao`: id nhóm mở sẵn (xem `nhomMoSan`). */
export function useNhomMo(khoiTao: readonly string[] = []) {
  const [mo, setMo] = useState<Set<string>>(() => new Set(khoiTao))
  const batMo = useCallback((id: string) => setMo((s) => (s.has(id) ? s : new Set(s).add(id))), [])
  const dongMo = useCallback(
    (id: string) =>
      setMo((s) => {
        if (!s.has(id)) return s
        const r = new Set(s)
        r.delete(id)
        return r
      }),
    [],
  )
  return useMemo(() => ({ mo, batMo, dongMo }), [mo, batMo, dongMo])
}

type LocCau = 'tat-ca' | 'sai' | 'lam-lau' | 'che'
const KHOP: Record<LocCau, (c: CauHomNay) => boolean> = { 'tat-ca': () => true, sai: laSai, 'lam-lau': laLamLauThuong, che: laChe }
const NHAN_LOC: Record<LocCau, string> = { 'tat-ca': 'Tất cả', sai: 'Sai', 'lam-lau': 'Làm lâu', che: 'Chưa công bố' }
/** Đuôi chữ của nút "Xem N câu … của lần này" khi đang lọc. */
const DUOI_LOC: Record<LocCau, string> = { 'tat-ca': '', sai: ' sai', 'lam-lau': ' làm lâu', che: ' chưa công bố' }

/** Nhóm có hiện dưới bộ lọc đang chọn không (nhóm không có câu nào khớp thì ẩn; mốc bị che chưa có dòng câu chỉ hiện ở "Tất cả"/"Chưa công bố"). */
function hienTheoLoc(n: NhomCau, loc: LocCau): boolean {
  if (loc === 'tat-ca') return n.cau.length > 0 || n.che !== null
  if (loc === 'che') return n.cau.some(laChe) || (n.cau.length === 0 && n.che !== null)
  return n.cau.some(KHOP[loc])
}

const giamChuyenDong = (): boolean => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
type Kho = MutableRefObject<Map<string, ChiTietCau>>

export interface TungCauProps {
  pm: PhMoi
  nhom: NhomCau[]
  sbd: string
  nhomMo: ReadonlySet<string>
  batMo: (id: string) => void
  dongMo: (id: string) => void
  /** Id nhóm vừa được DongThoiGian chọn: mở nhóm, đưa về bộ lọc "Tất cả" nếu đang bị lọc mất, rồi cuộn tới. */
  lanBay?: string | null
}

/** Câu thường bị máy chủ từ chối chi tiết vì "bài chưa nộp / chưa công bố" ⇒ chuyển sang dạng CHE (không đúng/sai, không đáp án). */
const cheHoa = (c: CauThuong, lyDo: LyDoChe): CauChe => ({ kieu: 'che', luc: c.luc, nguon: c.nguon, che: lyDo, giay: c.giay, lamLau: c.lamLau, lan: c.lan })
/** Lời từ chối của chi tiết câu thuộc loại che? (`che` của máy chủ, hoặc lời "chưa nộp / chưa công bố" cho bản máy chủ cũ chưa gửi `che`.) */
export function lyDoCheCuaTuChoi(ct: Extract<ChiTietCau, { kieu: 'tu_choi' }>): LyDoChe | null {
  if (ct.che) return ct.che
  return /chưa công bố/i.test(ct.chu) ? 'chua_cong_bo' : /chưa nộp/i.test(ct.chu) ? 'chua_nop' : null
}

export function TungCau({ pm, nhom: nhomTheoLan, sbd, nhomMo, batMo, dongMo, lanBay }: TungCauProps) {
  const [loc, setLoc] = useState<LocCau>('tat-ca')
  // DỮ LIỆU THƯA (mẫu ph-e): ít câu, nhiều lần ngồi học, không câu che ⇒ MỘT thẻ không tiêu đề lần (tính trên nhóm gốc ⇒ không nhảy khi lưới an toàn che câu).
  const gopKq = useMemo(() => gopNhomThua(nhomTheoLan), [nhomTheoLan])
  const nhomGoc = gopKq ?? nhomTheoLan
  const gop = gopKq !== null
  useEffect(() => {
    if (gop) batMo(GOP_ID) // thẻ gộp mở sẵn (mẫu ph-e); người dùng "Thu gọn" rồi thì không tự mở lại
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gop])
  // LƯỚI AN TOÀN (Boss 21/09): chi tiết một câu bị từ chối kiểu "chưa nộp / chưa công bố" ⇒ dòng câu ấy CHUYỂN NGAY sang dạng che trong phiên (ẩn đúng/sai + đáp án đã hiện ở danh sách), kể cả khi máy chủ (bản cũ) đã lỡ gửi câu thường.
  const [daChe, setDaChe] = useState<ReadonlyMap<string, LyDoChe>>(() => new Map())
  const cheCau = useCallback((qid: string, lyDo: LyDoChe) => setDaChe((m) => (m.has(qid) ? m : new Map(m).set(qid, lyDo))), [])
  const daCheHoa = useCallback((c: CauHomNay): CauHomNay => (c.kieu === 'thuong' && daChe.has(c.qid) ? cheHoa(c, daChe.get(c.qid)!) : c), [daChe])
  const nhom = useMemo(() => (daChe.size === 0 ? nhomGoc : nhomGoc.map((n) => (n.cau.some((c) => c.kieu === 'thuong' && daChe.has(c.qid)) ? { ...n, cau: n.cau.map(daCheHoa) } : n))), [nhomGoc, daChe, daCheHoa])
  const [duNhom, setDuNhom] = useState<ReadonlySet<string>>(() => new Set())
  const kho: Kho = useRef(new Map<string, ChiTietCau>())

  useEffect(() => {
    if (!lanBay) return
    const dich = gop ? GOP_ID : lanBay // chế độ gộp: mọi lần ngồi học đều dẫn tới thẻ gộp
    const n = nhom.find((x) => x.id === dich)
    if (!n) return
    batMo(dich)
    setLoc((l) => (l !== 'tat-ca' && !hienTheoLoc(n, l) ? 'tat-ca' : l))
    const h = window.setTimeout(() => document.getElementById(dich)?.scrollIntoView?.({ block: 'start', behavior: giamChuyenDong() ? 'auto' : 'smooth' }), 0)
    return () => window.clearTimeout(h)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lanBay])

  const tatCa = daChe.size === 0 ? pm.cau : pm.cau ? pm.cau.map(daCheHoa) : pm.cau
  if (!tatCa || tatCa.length === 0) return null
  const thuong = tatCa.filter((c): c is CauThuong => c.kieu === 'thuong')
  const dem = { 'tat-ca': tatCa.length, sai: tatCa.filter(laSai).length, 'lam-lau': tatCa.filter(laLamLauThuong).length, che: tatCa.filter(laChe).length }
  const nut = (['tat-ca', 'sai', 'lam-lau', 'che'] as const).filter((k) => k === 'tat-ca' || dem[k] > 0)
  const locHieu: LocCau = nut.includes(loc) ? loc : 'tat-ca'
  const coDung = thuong.some((c) => c.dung === true)
  const coChua = dem.che > 0 || thuong.some((c) => c.dung === null)
  const moHet = (id: string) => setDuNhom((s) => new Set(s).add(id))
  const thuGon = (id: string) => {
    dongMo(id)
    setDuNhom((s) => {
      const r = new Set(s)
      r.delete(id)
      return r
    })
  }

  return (
    <section className="phm-muc" id="muc-cau" aria-labelledby="muc-cau-h">
      <header className="phm-muc__dau">
        <h2 id="muc-cau-h">Từng câu con đã làm</h2>
        <p>{tatCa.length} câu hôm nay · xếp theo giờ làm</p>
      </header>
      {nut.length >= 2 && (
        <div className="phm-seg" role="group" aria-label="Lọc câu">
          {nut.map((k) => (
            <button key={k} type="button" aria-pressed={locHieu === k} onClick={() => setLoc(k)}>
              <span>
                {NHAN_LOC[k]} <small>{dem[k]}</small>
              </span>
            </button>
          ))}
        </div>
      )}
      {(coDung || dem.sai > 0 || coChua || dem['lam-lau'] > 0) && (
        <p className="phm-chu-thich">
          {coDung && (
            <span>
              <i className="phm-o-cau" />
              ô đặc: đúng
            </span>
          )}
          {dem.sai > 0 && (
            <span>
              <i className="phm-o-cau" data-sai="" />
              ô gạch chéo: sai
            </span>
          )}
          {coChua && (
            <span>
              <i className="phm-o-cau" data-che="" />
              ô trống: chưa có kết quả
            </span>
          )}
          {dem['lam-lau'] > 0 && <span>{chuNguongLamLau()}</span>}
        </p>
      )}
      <div className="phm-tu-cau">
        {nhom
          .filter((n) => hienTheoLoc(n, locHieu))
          .map((n) => (
            <KhoiNhom key={n.id} n={n} loc={locHieu} sbd={sbd} kho={kho} dangMo={nhomMo.has(n.id)} hienDu={duNhom.has(n.id)} bay={lanBay === n.id || (gop && !!lanBay)} gop={n.id === GOP_ID} batMo={batMo} thuGon={thuGon} moHet={moHet} cheCau={cheCau} />
          ))}
      </div>
    </section>
  )
}

function KhoiNhom({ n, loc, sbd, kho, dangMo, hienDu, bay, gop, batMo, thuGon, moHet, cheCau }: { n: NhomCau; loc: LocCau; sbd: string; kho: Kho; dangMo: boolean; hienDu: boolean; bay: boolean; gop: boolean; batMo: (id: string) => void; thuGon: (id: string) => void; moHet: (id: string) => void; cheCau: (qid: string, lyDo: LyDoChe) => void }) {
  const idTieuDe = `${n.id}-h`
  // Nhóm bị che: MỘT dòng khoá + dải ô che, không dòng câu, không nút mở.
  if (laNhomChe(n)) {
    const soO = soOChe(n)
    return (
      <div className="phm-nhom" id={n.id} role="group" aria-labelledby={idTieuDe} data-vung="nhom-cau" data-bay={bay ? '' : undefined}>
        <div className="phm-the">
          <div className="phm-dong-bt">
            <span className="phm-o-bt" data-mau="xam">
              <BtKhoa />
            </span>
            <div>
              <h3 id={idTieuDe}>
                {n.gio} · {n.ten}
              </h3>
              <p>{chuKetQuaChe(lyDoCheNhom(n) ?? 'chua_cong_bo', n.soCauDaLam)}</p>
            </div>
          </div>
          {soO > 0 && (
            <div className="phm-dai-o phm-tc-dai-che" role="img" aria-label={`${soO} câu con đã làm, chưa hiện kết quả`}>
              {Array.from({ length: soO }, (_, i) => (
                <i key={i} className="phm-o-cau" data-che="" />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const thuong = n.cau.filter((c) => c.kieu === 'thuong')
  const dung = thuong.filter((c) => c.dung === true).length
  const sai = thuong.filter((c) => c.dung === false).length
  const che = n.cau.length - thuong.length
  const tomTat = [`${n.cau.length} câu`, dung + sai > 0 ? `đúng ${dung}` : '', sai > 0 ? `sai ${sai}` : '', n.phut ? `${n.phut} phút` : ''].filter(Boolean).join(' · ')
  const nhanDai = `${n.cau.length} câu: ${[dung + sai > 0 ? `đúng ${dung}` : '', sai > 0 ? `sai ${sai}` : '', che > 0 ? `chưa công bố ${che}` : ''].filter(Boolean).join(', ') || 'đã làm'}`
  const ds = n.cau.map((c, i) => ({ c, i })).filter((x) => KHOP[loc](x.c))
  const nhieu = ds.length > SO_CAU_XEM_TRUOC + 2
  const hien = !nhieu || hienDu ? ds : ds.slice(0, SO_CAU_XEM_TRUOC)
  const con = ds.length - hien.length
  const idDs = `${n.id}-ds`
  return (
    <div className={`phm-nhom${gop ? ' phm-nhom--gop' : ''}`} id={n.id} role="group" {...(gop ? { 'aria-label': 'Các câu con đã làm hôm nay' } : { 'aria-labelledby': idTieuDe })} data-vung="nhom-cau" data-bay={bay ? '' : undefined}>
      {!gop && (
        <div className="phm-nhom__dau">
          <h3 id={idTieuDe}>
            <b>{n.gio}</b> · {n.ten}
          </h3>
          <p>{tomTat}</p>
        </div>
      )}
      <div className="phm-the">
        <div className="phm-dai-o" role="img" aria-label={nhanDai}>
          {n.cau.map((c, i) => (
            <i key={i} className="phm-o-cau" data-sai={laSai(c) ? '' : undefined} data-che={c.kieu === 'che' || (c.kieu === 'thuong' && c.dung === null) ? '' : undefined} />
          ))}
        </div>
        {dangMo ? (
          <>
            <ul id={idDs}>
              {hien.map(({ c, i }) => (c.kieu === 'che' ? <DongCauChe key={`${c.luc}|${i}`} c={c} /> : <DongCauThuong key={`${c.luc}|${i}`} c={c} sbd={sbd} kho={kho} cheCau={cheCau} />))}
            </ul>
            {con > 0 && (
              <button type="button" className="phm-them" data-vung="hien-du" onClick={() => moHet(n.id)}>
                <span>
                  Hiện đủ {ds.length} câu<small>còn {con} câu nữa của lần này</small>
                </span>
                <BtMuiXuong lop="phm-i--mui" />
              </button>
            )}
            <button type="button" className="phm-them" data-vung="thu-gon" aria-expanded="true" aria-controls={idDs} onClick={() => thuGon(n.id)}>
              <span>Thu gọn</span>
              <BtMuiXuong lop="phm-i--mui phm-tc-len" />
            </button>
          </>
        ) : (
          <button type="button" className="phm-them" data-vung="xem-nhom" aria-expanded="false" onClick={() => batMo(n.id)}>
            <span>
              Xem {ds.length} câu{DUOI_LOC[loc]} của lần này
            </span>
            <BtMui lop="phm-i--mui" />
          </button>
        )}
      </div>
    </div>
  )
}

/** Câu bị che nằm chung nhóm với câu đã có kết quả: chỉ giờ + nguồn + lý do (+ thời gian làm), KHÔNG mở được. */
function DongCauChe({ c }: { c: CauChe }) {
  return (
    <li className="phm-cau" data-vung="cau-che">
      <span className="phm-tc-che">
        <span className="phm-cau__dau">
          <b>{NHAN_NGUON[c.nguon]}</b>
          <span>{gioVn(c.luc)}</span>
        </span>
        <span className="phm-cau__kq">
          <Chip icon={<BtKhoa lop="phm-i--s" />}>Đã làm</Chip>
          <span>{CHU_CHE[c.che]}</span>
          {c.giay !== null && <span>{chuThoiGian(c.giay)}</span>}
        </span>
      </span>
    </li>
  )
}

function DongCauThuong({ c, sbd, kho, cheCau }: { c: CauThuong; sbd: string; kho: Kho; cheCau: (qid: string, lyDo: LyDoChe) => void }) {
  const uid = useId()
  const [mo, setMo] = useState(false)
  const [ct, setCt] = useState<ChiTietCau | null>(() => (c.qid ? (kho.current.get(c.qid) ?? null) : null))
  const [dang, setDang] = useState(false)
  const [loi, setLoi] = useState('')
  const song = useRef(true)
  useEffect(() => {
    song.current = true
    return () => {
      song.current = false
    }
  }, [])
  const lay = async () => {
    if (!c.qid) return
    setDang(true)
    setLoi('')
    const r = await taiChiTietCau(sbd, c.qid)
    if (!song.current) return
    setDang(false)
    if (r.kieu === 'ok') {
      if (r.ct.kieu === 'ok') kho.current.set(c.qid, r.ct)
      else {
        // Máy chủ nói câu này thuộc bài chưa nộp / chưa công bố ⇒ danh sách KHÔNG được giữ đúng/sai + đáp án của câu ấy (lưới an toàn cho bản máy chủ cũ).
        const lyDo = lyDoCheCuaTuChoi(r.ct)
        if (lyDo) cheCau(c.qid, lyDo)
      }
      setCt(r.ct)
    } else setLoi(r.chu)
  }
  const bam = () => {
    const moi = !mo
    setMo(moi)
    // Đã có chi tiết thật thì không hỏi lại; bị từ chối / lỗi thì mở lại sẽ hỏi lại. (`lay` tự bỏ qua câu không có mã qid.)
    if (moi && !dang && (!ct || ct.kieu === 'tu_choi')) void lay()
  }
  const kq = c.dung === true ? { l: 'ok', t: 'Đúng', mau: 'dat' as const, i: <BtTich /> } : c.dung === false ? { l: 'sai', t: 'Sai', mau: 'do' as const, i: <BtCheo /> } : { l: 'cho', t: 'Đã làm', mau: undefined, i: null }
  const lau = laLamLau(c)
  const chiTiet = ct && ct.kieu === 'ok' ? ct : null
  const de = mo && chiTiet && chiTiet.de ? chiTiet.de : c.de
  return (
    <li className="phm-cau" data-vung="cau" data-kq={kq.l} data-sai={c.dung === false ? '' : undefined} data-lau={lau ? '' : undefined} data-mo={mo ? '' : undefined}>
      <button type="button" aria-expanded={mo} aria-controls={mo ? `${uid}-mo` : undefined} onClick={bam}>
        <span>
          <span className="phm-cau__dau">
            {c.tenDang && <b>{c.tenDang}</b>}
            <span>{gioVn(c.luc)}</span>
          </span>
          <span className="phm-cau__de">
            <ChemText text={tachDongTheoY(de)} />
          </span>
          <span className="phm-cau__kq">
            <Chip mau={kq.mau} icon={kq.i}>
              {kq.t}
            </Chip>
            {(c.conChon || c.dapAn) && (
              <span>
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
            {c.giay !== null && <span>{chuThoiGian(c.giay)}</span>}
            {lau && (
              <Chip mau="cam" icon={<BtDongHo />}>
                Làm lâu
              </Chip>
            )}
          </span>
        </span>
        <BtMuiXuong lop="phm-i--mui" />
      </button>
      {mo && (
        <div className="phm-tc-mo-ngoai">
          <div className="phm-tc-mo-trong">
            <div className="phm-mo" id={`${uid}-mo`} data-vung="chi-tiet">
              {dang && (
                <p className="phm-tc-ghi" role="status">
                  Đang lấy lời giải…
                </p>
              )}
              {loi && (
                <div role="alert" data-vung="loi-giai">
                  <p className="phm-tc-ghi">{loi}</p>
                  <button type="button" className="phm-tc-thu" onClick={() => void lay()}>
                    Thử lại
                  </button>
                </div>
              )}
              {ct && ct.kieu === 'tu_choi' && (
                <p className="phm-tc-ghi" role="alert" data-vung="loi-giai">
                  {ct.chu}
                </p>
              )}
              {chiTiet && <ChiTietMo ct={chiTiet} conChon={c.conChon} />}
              {!c.qid && <p className="phm-tc-ghi">Câu này chưa có lời giải để xem.</p>}
            </div>
          </div>
        </div>
      )}
    </li>
  )
}

/** Phương án + "Đáp án đúng" + "Con chọn" (nếu máy chủ có) + lời giải. Chỉ dựng khi máy chủ đã trả chi tiết thật. */
function ChiTietMo({ ct, conChon }: { ct: Extract<ChiTietCau, { kieu: 'ok' }>; conChon: string }) {
  const dap = tachChuCai(ct.dapAn)
  const chon = tachChuCai(conChon)
  return (
    <>
      {ct.phuongAn.length > 0 && (
        <ul className="phm-pa">
          {ct.phuongAn.map((p, i) => {
            const m = /^\s*([A-Da-d])[.)]\s*/.exec(p)
            const ma = m ? m[1]!.toUpperCase() : String.fromCharCode(65 + i)
            const chu = m ? p.slice(m[0].length) : p
            // PHƯƠNG ÁN: KHÔNG tách ý (Boss vá 21/09 17:43) — Hoá hay viết "(a), (b) và (c)" / "(1) và (3)" trong MỘT phương án; cả app chỉ tách ĐỀ (TheCau, DoanCau, MomQuestionMedia)
            const laDung = dap.length > 0 ? dap.includes(ma) : ct.dapAn.includes(ma)
            const laChon = chon.includes(ma)
            return (
              <li key={i} data-dung={laDung ? '' : undefined} data-chon={laChon && !laDung ? '' : undefined}>
                <i>{ma}</i>
                <span>
                  <ChemText text={chu} />
                </span>
                {laDung ? (
                  <em>
                    <BtTich />
                    Đáp án đúng{laChon ? ' · Con chọn' : ''}
                  </em>
                ) : laChon ? (
                  <em>Con chọn</em>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
      {ct.loiGiaiCT ? (
        // Lời giải CÓ CẤU TRÚC (máy chủ gửi chuỗi JSON, du-lieu.ts đã đọc bằng bộ chuẩn chung): dòng Chốt, các bước đánh số, dòng Kết quả — không bao giờ in JSON thô.
        <div className="phm-loi-giai" data-vung="loi-giai-ct">
          <h4>Lời giải</h4>
          {ct.loiGiaiCT.chot && (
            <p className="phm-lg-chot">
              <b>Chốt: </b>
              <ChemText text={tachDongTheoY(ct.loiGiaiCT.chot)} />
            </p>
          )}
          {ct.loiGiaiCT.buoc.length > 0 && (
            <ol className="phm-lg-buoc">
              {ct.loiGiaiCT.buoc.map((b, i) => (
                <li key={i}>
                  <i aria-hidden="true">{i + 1}</i>
                  <span>
                    <span className="phm-sr">Bước {i + 1}: </span>
                    <ChemText text={tachDongTheoY(b)} />
                  </span>
                </li>
              ))}
            </ol>
          )}
          {ct.loiGiaiCT.ketQua && (
            <p className="phm-lg-ket">
              <b>Kết quả: </b>
              <ChemText text={tachDongTheoY(ct.loiGiaiCT.ketQua)} />
            </p>
          )}
        </div>
      ) : ct.loiGiai ? (
        <div className="phm-loi-giai">
          <h4>Lời giải ngắn</h4>
          <p>
            <ChemText text={tachDongTheoY(ct.loiGiai)} />
          </p>
        </div>
      ) : (
        <p className="phm-tc-ghi">Câu này chưa có lời giải để xem.</p>
      )}
    </>
  )
}

// «MỘT TRANG» APP PHỤ HUYNH (thầy chốt 26/10: «Chốt cả 3 app, build và đẩy lên bản sống luôn nhé»; bản vẽ ve-moi/ph-mot-trang.html + mot-ph.css).
// MỌI thông tin của con trên MỘT màn, KHÔNG cuộn ở 390×844 · 844×390 · 1440×900 (máy tính: ô tự giãn lấp khung). 8 ô: Hôm nay của con (+ dòng Cần nhắc con)
// · Lời thầy (cảnh báo + «Đã xem» + nhận xét mới nhất) · Nhịp học 14 ngày · Báo cáo tuần · Kiểm tra và tiến bộ (gộp Kiểm tra ôn tập) · Câu sai và tự sửa
// · Thái độ làm bài · Thời gian làm bài; + lối vào Bài tập về nhà / Buổi học trên lớp / Lịch sử từng ngày (chỉ lối app cũ đang hiện — `phanCo`).
// Chạm ô ⇒ TẤM mở ĐỦ khối cũ của ô đó: tái dùng nguyên component của TrangVeCon.tsx (phần trên) và TrangVeConDuoi.tsx (`KhoiDuoi`, nạp lười).
// BẬT khi <html data-trong="ph"> (main.tsx). Lùi một máy: localStorage `ddh.trong` = 'tat' ⇒ AppPhuHuynh vẽ trang cũ, KHÔNG tải tệp này.
// SỐ: chỉ từ lệnh app đã có. Lúc mở: /ph/tat-ca-ve-con · /ph/con-tong-quan · /ph/nhip-hoc · /ph/loi-thay · /ph/hoc-2 (AppPhuHuynh nạp như cũ). Ô Báo cáo
// tuần · Thái độ · số «một nửa số lượt dưới» cần /ph/bao-cao-tuan · /ph/ho-so-thai-do · /ph/lich-su-lam-cau — lệnh SẴN CÓ của phần dưới, gọi SONG SONG lúc
// RẢNH sau khi màn đầu đã vẽ (không lệnh mới, không vòng chờ nối tiếp). Chưa có số ⇒ ô hiện nhãn + «Đang tải…», không bịa. MÀU: mot-trang-ph.css.
import { Suspense, lazy, useCallback, useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { AnhLogo } from '../LogoVai'
import { BtBang, BtBut, BtChuong, BtChuY, BtDongHo, BtHomNay, BtKep, BtLich, BtLichSu, BtLop, BtNhan, BtNhipTim, BtSach, BtTinNhan } from './BieuTuong'
import {
  CanhBao, CanNhac, DamSo, HomNay, LoiThay, LoiThe, NhipHoc, TheKiemTraCon,
  buoiHomNay, dongCanNhac, homNayTq, lanHocHomNay, oNgay, phanCo, soHomNay, tenGoi, type IdPhan, type TrangVeConProps,
} from './TrangVeCon'
import type { IdKhoiDuoi } from './TrangVeConDuoi'
import { chuThay, diemCacCa } from './tien-ich'
import { gioVn, ngayChuoiNgan, ngayNganVn, soVn } from '../../lib/ph-moi/dinh-dang'
import { nhipTheoSanh } from '../../lib/nhip-hoc-em'
import { tieuDeCanhBao } from '../../lib/canh-bao-thay-hien-thi'
import type { BaoCaoTuanCon } from '../../lib/bao-cao-tuan-ph-api'
import { useKhoaCuonTrang } from '../../lib/khoa-cuon-trang'
import './mot-trang-ph.css'

const napDuoi = () => import('./TrangVeConDuoi')
const KhoiDuoi = lazy(() => napDuoi().then((m) => ({ default: m.KhoiDuoi })))

type IdO = 'hom' | 'thay' | 'nhip' | IdKhoiDuoi
const TEN: Record<IdO, string> = {
  hom: 'Hôm nay của con', thay: 'Lời thầy', nhip: 'Nhịp học', 'bao-cao-tuan': 'Báo cáo tuần', 'kiem-tra': 'Kiểm tra và tiến bộ', 'cau-sai': 'Câu sai và tự sửa',
  'thai-do': 'Thái độ làm bài', 'thoi-gian': 'Thời gian làm bài', btvn: 'Bài tập về nhà', 'buoi-hoc': 'Buổi học trên lớp', 'lich-su': 'Lịch sử từng ngày',
}
type Bt = (p: { co?: number; day?: number }) => ReactElement
/** Ba lối vào (thanh trên ở máy tính / điện thoại ngang · hàng nút đáy ở điện thoại dọc). `gon` = chữ ở hàng đáy. */
const LOI: readonly { id: 'btvn' | 'buoi-hoc' | 'lich-su'; gon: string; bt: Bt }[] = [
  { id: 'btvn', gon: 'Bài tập', bt: BtSach },
  { id: 'buoi-hoc', gon: 'Buổi học', bt: BtLop },
  { id: 'lich-su', gon: 'Lịch sử', bt: BtLichSu },
]
/** Phần của trang cũ (thanh bên ở màn con, link `#phan-…`) ⇒ ô mở tấm tương ứng. */
const oCuaPhan = (id: IdPhan): IdO => (id === 'hom-nay' ? 'hom' : id)
/** Số Báo cáo tuần đã tải trong phiên (quay lại từ màn con không gọi lại lệnh). */
let bcNho: { sbd: string; du: BaoCaoTuanCon } | null = null

export interface MotTrangProps extends Omit<TrangVeConProps, 'phanHien' | 'onPhanHien'> {
  /** Nút tài khoản (menu «Đổi số báo danh») của AppPhuHuynh. */
  taiKhoan: ReactNode
  /** Dòng báo lỗi làm mới của AppPhuHuynh (nếu có). */
  thongBao?: ReactNode
}

/** Chữ chờ trong ô: chỉ hiện sau 0,8 giây nếu số vẫn chưa về (`.ph3-cho-tre`, ph-v3.css) — tải nhanh không chớp chữ. */
const Cho = () => <p className="mtp-ghi mtp-cho ph3-cho-tre">Đang tải…</p>

function O({ id, bt: Hinh, ten, chip, lop, onMo, children }: { id: IdO; bt: Bt; ten?: string; chip?: ReactNode; lop?: string; onMo: (id: IdO) => void; children: ReactNode }) {
  const t = ten ?? TEN[id]
  return (
    <section className={`mtp-o${lop ? ` ${lop}` : ''}`} aria-label={t} data-o={id}>
      <button type="button" className="mtp-o-mo" aria-label={`Mở ${t}`} onClick={() => onMo(id)} />
      <div className="mtp-o-ten"><Hinh co={18} /><span>{t}</span>{chip}</div>
      {children}
    </section>
  )
}

/** Tấm mở đủ khối của một ô: điện thoại = tấm trượt từ đáy; máy tính = hộp giữa màn. Esc / Đóng / bấm nền ⇒ đóng, focus về ô đã mở. */
function Tam({ ten, onDong, children }: { ten: string; onDong: () => void; children: ReactNode }) {
  useKhoaCuonTrang(true)
  const dong = useRef<HTMLButtonElement>(null)
  const moTu = useRef<HTMLElement | null>(null)
  if (moTu.current === null && typeof document !== 'undefined') moTu.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
  useEffect(() => {
    dong.current?.focus()
    const phim = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('.ph-ho-so-con')) onDong() }
    document.addEventListener('keydown', phim)
    const tu = moTu.current
    return () => { document.removeEventListener('keydown', phim); if (tu && tu.isConnected && tu !== document.body) tu.focus() }
  }, [onDong])
  return (
    <div className="mtp-tam-nen" onClick={(e) => { if (e.target === e.currentTarget) onDong() }}>
      <div className="mtp-tam tt-mo-lop" role="dialog" aria-modal="true" aria-label={ten} data-vung="tam-mot-trang">
        <div className="mtp-tam-dau">
          <h2>{ten}</h2>
          <button type="button" ref={dong} className="mtp-tam-dong tt-nhan" aria-label="Đóng" onClick={onDong}><BtNhan co={22} day={2.4} /></button>
        </div>
        <div className="tvc mtp-tam-than">{children}</div>
      </div>
    </div>
  )
}

export default function MotTrangPh(p: MotTrangProps) {
  const { v, hoc2, tongQuan, nhip, hoSo, napHoSo, sbd } = p
  const pm = v.pm
  const tq = tongQuan.v
  const nowMs = tq?.serverNow ?? pm?.serverNow ?? Date.now()
  const kiem = hoc2?.kiemTraCaNhan
  const [mo, setMo] = useState<IdO | null>(null)
  const [bc, setBc] = useState<{ du: BaoCaoTuanCon | null; loi: string }>(() => ({ du: bcNho?.sbd === sbd ? bcNho.du : null, loi: '' }))

  // LÚC RẢNH sau màn đầu: hai lệnh hồ sơ (AppPhuHuynh giữ số) + Báo cáo tuần + khối mã phần dưới — CÙNG LÚC, một lần. Mở tấm trước đó ⇒ làm ngay.
  const song = useRef(true)
  useEffect(() => { song.current = true; return () => { song.current = false } }, [])
  const daNap = useRef(false)
  const daGoiHoSo = useRef(hoSo.daGoi)
  daGoiHoSo.current = hoSo.daGoi
  const napRanh = useCallback(() => {
    if (daNap.current) return
    daNap.current = true
    if (!daGoiHoSo.current) napHoSo()
    if (bcNho?.sbd !== sbd)
      void napDuoi()
        .then((m) => m.layBaoCaoTuanCon(sbd))
        .then((r) => {
          if (r.ok) bcNho = { sbd, du: r.du }
          if (song.current) setBc(r.ok ? { du: r.du, loi: '' } : { du: null, loi: r.chu })
        }, () => { if (song.current) setBc({ du: null, loi: 'Chưa tải được.' }) })
    else void napDuoi().catch(() => {})
  }, [napHoSo, sbd])
  const coPm = !!pm
  useEffect(() => {
    if (!coPm || daNap.current) return
    const w = window as Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (n: number) => void }
    if (w.requestIdleCallback) { const id = w.requestIdleCallback(napRanh, { timeout: 1500 }); return () => w.cancelIdleCallback?.(id) }
    const id = window.setTimeout(napRanh, 200)
    return () => window.clearTimeout(id)
  }, [coPm, napRanh])
  const moO = useCallback((id: IdO) => { napRanh(); setMo(id) }, [napRanh])
  const dongTam = useCallback(() => setMo(null), [])

  // Bấm mục ở thanh bên màn con / mở thẳng `#phan-…` ⇒ mở tấm của ô tương ứng.
  const { denPhan, daDenPhan } = p
  useEffect(() => {
    if (!denPhan || !coPm) return
    moO(oCuaPhan(denPhan.id))
    daDenPhan()
  }, [denPhan, coPm, moO, daDenPhan])

  const ten = tenGoi(pm?.hoTen || p.tenCon)
  const coPhan = phanCo(pm, tq)
  const loi = LOI.filter((l) => coPhan.includes(l.id))
  const soBt = pm?.baiTapVeNha?.dangChay.length ?? 0
  const nutLoi = (gon: boolean) =>
    loi.map((l) => (
      <button key={l.id} type="button" className="mtp-loi-nut tt-nhan" aria-label={`${TEN[l.id]}${l.id === 'btvn' && soBt > 0 ? `, ${soBt} bài đang làm` : ''}`} onClick={() => moO(l.id)}>
        <l.bt co={20} />
        <span>{gon ? l.gon : TEN[l.id]}</span>
        {l.id === 'btvn' && soBt > 0 && <b className="mtp-dem" aria-hidden="true">{soBt}</b>}
      </button>
    ))

  const tam = (id: IdO): ReactNode => {
    if (!pm) return null
    const kd = (khoi: IdKhoiDuoi) => (
      <Suspense fallback={<p className="mtp-ghi ph3-cho-tre" role="status">Đang mở…</p>}>
        <KhoiDuoi khoi={khoi} bc={bc.du ?? undefined} pm={pm} tq={tq} hoc2={hoc2} k={nhip.k} hoSo={hoSo} napHoSo={napHoSo} sbd={sbd} tenCon={pm.hoTen || p.tenCon} lop={p.lop} />
      </Suspense>
    )
    if (id === 'hom') return <>{(!kiem?.homNay || !!kiem.baiNgayToiThieu) && <HomNay pm={pm} hoc2={hoc2} tq={tq} k={nhip.k} nowMs={nowMs} />}<CanNhac tai={tongQuan} pm={pm} nowMs={nowMs} /></>
    if (id === 'thay') return <>{p.canhBao.map((cb) => <CanhBao key={cb.id} cb={cb} nay={nowMs} onDaXem={p.onDaXem} />)}<LoiThay loiThay={p.loiThay} thuLai={p.thuLaiLoiThay} /></>
    if (id === 'nhip') return <NhipHoc pm={pm} tq={tq} nhip={nhip} />
    if (id === 'kiem-tra') return <>{kiem && kiem.trangThai !== 'cho_nguon' && <Suspense fallback={null}><TheKiemTraCon kt={kiem} /></Suspense>}{kd('kiem-tra')}</>
    return kd(id)
  }

  return (
    <div className="mtp" data-vung="mot-trang-ph">
      <header className="mtp-dau">
        <AnhLogo vai="ph" size={32} alt="Logo Đỗ Đại Học" />
        <span className="mtp-ten-app">Đỗ Đại Học<small>Phụ huynh</small></span>
        {loi.length > 0 && <nav className="mtp-loi" aria-label="Xem thêm về con">{nutLoi(false)}</nav>}
        {p.taiKhoan}
      </header>
      <main className="mtp-than">
        {p.thongBao}
        <div className="mtp-chao">
          <p>Chào anh/chị{pm?.serverNow ? ` · cập nhật ${gioVn(pm.serverNow)} ${ngayNganVn(pm.serverNow)}` : ''}</p>
          <h1>Hôm nay của {ten}{p.lop ? ` · ${p.lop}` : ''}</h1>
        </div>
        {!pm ? (
          v.trangThai === 'loi' ? (
            <div className="mtp-loi-tai"><LoiThe chu={v.chuLoi} thuLai={v.thuLai} nut="Thử lại" /></div>
          ) : (
            <div className="mtp-luoi" role="status" aria-live="polite" data-vung="dang-tai">
              <span className="ph3-an">Đang tải dữ liệu của con…</span>
              {['hom', 'thay', 'a', 'b', 'c', 'd', 'e', 'f'].map((k) => <div key={k} className={`mtp-o mtp-o--cho tt-xuong${k === 'hom' ? ' hom' : k === 'thay' ? ' thay' : ''}`} aria-hidden="true" />)}
            </div>
          )
        ) : (
          <div className="mtp-luoi">
            <OHomNay p={p} nowMs={nowMs} onMo={moO} />
            <OLoiThay p={p} onMo={moO} />
            <ONhip p={p} onMo={moO} />
            <OBaoCao bc={bc} onMo={moO} />
            <OKiemTra p={p} onMo={moO} />
            <OCauSai p={p} onMo={moO} />
            <OThaiDo p={p} onMo={moO} />
            <OThoiGian p={p} onMo={moO} />
          </div>
        )}
        {loi.length > 0 && pm && <nav className="mtp-them" aria-label="Xem thêm về con">{nutLoi(true)}</nav>}
      </main>
      {mo && pm && <Tam ten={mo === 'nhip' ? 'Nhịp học của con' : TEN[mo]} onDong={dongTam}>{tam(mo)}</Tam>}
    </div>
  )
}

type PO = { p: MotTrangProps; onMo: (id: IdO) => void }

// ---------------------------------------------------------------- 1 · Hôm nay của con (ô lớn) ----------------------------------------------------------------
function OHomNay({ p, nowMs, onMo }: PO & { nowMs: number }) {
  const pm = p.v.pm!
  const tq = p.tongQuan.v
  const so = soHomNay(pm, p.hoc2, tq)
  const nTq = homNayTq(tq)
  const ti = so.tong ? Math.max(0, Math.min(1, so.daLam / so.tong)) : null
  const buoi = buoiHomNay(pm, nowMs)
  const lan = lanHocHomNay(pm)
  const soLan = lan.ds.length + lan.them
  const hq = pm.tongQuan?.soVoiHomQua ?? null
  const d = tq?.dem.homNay ?? null
  const nhac = dongCanNhac(tq, pm, nowMs)
  const giay = d && d.giayTb !== null ? String(Math.round(d.giayTb)) : null
  const tieu = so.tong === null
    ? (so.daLam === 0 ? 'Hôm nay con chưa làm câu nào' : `Con đã làm ${so.daLam} câu hôm nay`)
    : so.daLam >= so.tong ? `Con đã ${so.du}` : so.daLam === 0 && (nTq ? nTq.soCau === 0 : true) ? 'Con chưa làm câu nào hôm nay' : `Còn ${so.xap}${so.tong - so.daLam} câu nữa là ${so.du}`
  const chip = buoi && (
    <span className="ph3-chip mtp-chip" data-mau={buoi.kieu === 'co-mat' ? 'xl' : buoi.kieu === 'vang' ? 'ho' : 'xd'} data-vung="co-mat-hom-nay">
      {buoi.kieu === 'co-mat' ? `Có mặt buổi học · ${buoi.luc}` : buoi.kieu === 'vang' ? 'Vắng buổi học hôm nay' : 'Chưa điểm danh buổi học'}
    </span>
  )
  return (
    <O id="hom" bt={BtHomNay} lop="hom" chip={chip} onMo={onMo}>
      <div className="mtp-hom-than">
        <div className="mtp-vong" style={{ ['--p' as string]: ti === null ? 0 : Math.round(ti * 100) }} role="img" aria-label={so.tong !== null ? `Đã làm ${so.daLam} trên ${so.xap}${so.tong} câu hôm nay` : `Đã làm ${so.daLam} câu hôm nay`}>
          <div><b className="mtp-so-lon">{so.daLam}{so.tong !== null && <small>/{so.xap}{so.tong}</small>}</b><span>câu hôm nay</span></div>
        </div>
        <div className="mtp-hom-chu">
          <h2 className="mtp-hom-tieu" data-vung="so-cau-hom-nay">{tieu}</h2>
          {(soLan > 0 || hq) && (
            <p className="mtp-ghi">
              {soLan > 0 ? `Học ${soLan} lần hôm nay` : ''}{soLan > 0 && hq ? ' · ' : ''}{hq ? <>Hôm qua <b>{hq.soCau} câu</b></> : null}
            </p>
          )}
          {d && (
            <>
              <p className="mtp-ghi mtp-chi-doc">Đúng <b className="mtp-dung">{d.dung}</b> · Sai <b className="mtp-sai">{d.sai}</b> · Bỏ trống <b>{d.boTrong}</b>{giay ? <> · <b>{giay}</b> giây/câu</> : null}</p>
              <dl className="mtp-so-4 mtp-an-doc" data-vung="dung-sai-hom-nay">
                <div><dt>Câu đúng</dt><dd className="mtp-dung">{d.dung}</dd></div>
                <div><dt>Câu sai</dt><dd className="mtp-sai">{d.sai}</dd></div>
                <div><dt>Bỏ trống</dt><dd>{d.boTrong}</dd></div>
                <div><dt>Giây/câu</dt><dd>{giay ?? <small>chưa đo</small>}</dd></div>
              </dl>
            </>
          )}
        </div>
      </div>
      {nhac.length > 0 ? (
        <p className="mtp-nhac" data-vung="goi-y-nhac"><BtChuong co={18} /><span><b>Cần nhắc con:</b> <DamSo chu={nhac[0]!.chu} />{nhac.length > 1 && <span className="mtp-an-doc"> Còn {nhac.length - 1} điều nữa.</span>}</span></p>
      ) : !tq && !p.tongQuan.daTai ? <Cho /> : null}
    </O>
  )
}

// ---------------------------------------------------------------- 2 · Lời thầy ----------------------------------------------------------------
function OLoiThay({ p, onMo }: PO) {
  const cb = p.canhBao[0]
  const ds = p.loiThay.ds
  const moi = ds?.[0]
  const ngay = moi ? moi.nopLuc || moi.capNhatLuc : ''
  return (
    <O id="thay" bt={BtTinNhan} lop="thay" onMo={onMo}>
      {cb && (
        <div className="mtp-canh-bao" data-vung="canh-bao-thay">
          <BtChuY co={18} />
          <span>{tieuDeCanhBao(cb, 'phuhuynh')}{p.canhBao.length > 1 ? ` (+${p.canhBao.length - 1})` : ''}</span>
          <button type="button" className="mtp-da-xem tt-nhan" onClick={() => p.onDaXem(cb.id)}>Đã xem</button>
        </div>
      )}
      {moi ? (
        <p className="mtp-nhan-xet" data-vung="loi-thay-moi"><span>Nhận xét{ngay ? ` ${ngayNganVn(ngay)}` : ''} ·</span> {chuThay(moi.noiDung)}</p>
      ) : ds ? (
        <p className="mtp-ghi">Thầy chưa gửi nhận xét nào cho con.</p>
      ) : p.loiThay.chuLoi ? <p className="mtp-ghi">Chưa tải được nhận xét của thầy. Mở để thử lại.</p> : <Cho />}
    </O>
  )
}

// ---------------------------------------------------------------- 3 · Nhịp học 14 ngày ----------------------------------------------------------------
function ONhip({ p, onMo }: PO) {
  const pm = p.v.pm!
  const nTq = homNayTq(p.tongQuan.v)
  const k = p.nhip.k ? nhipTheoSanh(p.nhip.k, nTq ? { muc: nTq.canLam, daLam: nTq.daLam } : null) : null
  const ngay = k ? k.ngay.slice(-14) : []
  const dem = { du: 0, it: 0, nhieu: 0, khong: 0 }
  const o = ngay.map((x) => { const r = oNgay(x, k!.homNay); if (r.loai !== 'nay') dem[r.loai] += 1; return r })
  const hang = pm.doCham ? <>Độ chăm: hạng <b>{pm.doCham.hang}/{pm.doCham.siSo}</b></> : null
  return (
    <O id="nhip" bt={BtLich} ten={k ? `Nhịp học ${ngay.length} ngày` : 'Nhịp học'} onMo={onMo}>
      {k ? (
        <>
          <ol className="mtp-n14" style={{ gridTemplateColumns: `repeat(${Math.max(ngay.length, 1)}, minmax(0, 1fr))` }} aria-label={`Đủ mức ${dem.du} · Thiếu ít ${dem.it} · Thiếu nhiều ${dem.nhieu} · Không làm ${dem.khong} · và hôm nay`}>
            {o.map((r, i) => <li key={ngay[i]!.ngay} data-t={r.loai} title={r.chu} />)}
          </ol>
          <p className="mtp-ghi">Đủ mức <b>{k.soNgayDu}/{k.soNgayQua} ngày</b>{hang && <span className="mtp-an-doc"> · {hang}</span>}</p>
          {hang && <p className="mtp-ghi mtp-chi-doc">{hang}</p>}
        </>
      ) : p.nhip.dangTai ? <Cho /> : <p className="mtp-ghi">Chưa tải được nhịp học. Mở để tải lại.</p>}
    </O>
  )
}

// ---------------------------------------------------------------- 4 · Báo cáo tuần ----------------------------------------------------------------
function OBaoCao({ bc, onMo }: { bc: { du: BaoCaoTuanCon | null; loi: string }; onMo: (id: IdO) => void }) {
  const b = bc.du
  return (
    <O id="bao-cao-tuan" bt={BtKep} onMo={onMo}>
      {b ? (
        <>
          {b.nhan ? (
            <div className="mtp-so"><span className="ph3-chip mtp-chip-lon" data-mau={b.nhan === 'Đối phó' ? 'ho' : 'xl'}>{b.nhan}</span></div>
          ) : (
            <div className="mtp-so">{b.ngayCoLam}/{b.soNgay}<small>ngày có làm bài</small></div>
          )}
          <p className="mtp-ghi">
            {b.buoi && b.buoi.tong > 0 ? <>Đi học <b>{b.buoi.coMat}/{b.buoi.tong} buổi</b> · </> : null}Câu đã làm <b>{b.soCau}</b>
          </p>
        </>
      ) : bc.loi ? <p className="mtp-ghi">Chưa tải được báo cáo tuần. Mở để tải lại.</p> : <Cho />}
    </O>
  )
}

// ---------------------------------------------------------------- 5 · Kiểm tra và tiến bộ (+ Kiểm tra ôn tập) ----------------------------------------------------------------
function OKiemTra({ p, onMo }: PO) {
  const pm = p.v.pm!
  const ca = pm.caGanNhat
  const tong = ca?.ketQua?.tong ?? null
  const truoc = ca?.truoc ?? null
  const ds = diemCacCa(pm).slice(-5)
  const kt = p.hoc2?.kiemTraCaNhan
  const ktChu = kt && kt.trangThai !== 'cho_nguon'
    ? `Kiểm tra ôn tập: ${kt.nopLuc !== null ? (kt.diem !== null ? `điểm ${soVn(kt.diem)}/10` : 'đã nộp') : kt.homNay ? `hôm nay ${kt.daTra}/${kt.tong} câu` : `mở ${gioVn(kt.moLuc)} ${ngayNganVn(kt.moLuc)}`}`
    : ''
  return (
    <O id="kiem-tra" bt={BtBang} onMo={onMo}>
      {tong !== null ? (
        <div className="mtp-so">{soVn(tong)}<small>/10{truoc ? ` · ${truoc.doi > 0 ? '+' : truoc.doi < 0 ? '−' : ''}${soVn(Math.abs(truoc.doi))}` : ''}</small></div>
      ) : (
        <p className="mtp-ghi">{ca ? 'Ca gần nhất chưa công bố điểm' : 'Chưa có ca kiểm tra nào được công bố điểm'}</p>
      )}
      {ds.length >= 2 && (
        <div className="mtp-cot mtp-an-doc mtp-an-ngang" aria-hidden="true">
          {ds.map((d, i) => <i key={`${d.maCa}-${i}`} data-on={i === ds.length - 1 ? '' : undefined} style={{ height: `${Math.max(8, Math.min(100, d.diem * 10))}%` }} />)}
        </div>
      )}
      {ca && <p className="mtp-ghi mtp-mot-dong">{ca.tenCa}{truoc?.tong != null ? <span className="mtp-an-doc"> · lần trước {soVn(truoc.tong)}</span> : null}</p>}
      {ktChu && <p className="mtp-ghi mtp-mot-dong" data-vung="kiem-tra-on-tap">{ktChu}</p>}
    </O>
  )
}

// ---------------------------------------------------------------- 6 · Câu sai và tự sửa ----------------------------------------------------------------
function OCauSai({ p, onMo }: PO) {
  const tq = p.tongQuan.v
  const ts = p.hoSo.td?.tuSuaSai
  const sai = ts ? ts.soCauSai : tq?.cauSai.tong ?? null
  const sua = ts ? ts.soCauDaSua : tq?.cauSai.daSua ?? null
  const moc = tq?.moc ?? p.nhip.k?.tu ?? null
  const on = p.v.pm?.lichOn?.homNay ?? 0
  return (
    <O id="cau-sai" bt={BtBut} onMo={onMo}>
      {sai !== null && sua !== null ? (
        sai > 0 ? (
          <>
            <div className="mtp-so">{sai - sua}<small>câu chưa sửa</small></div>
            <p className="mtp-ghi">{moc ? <span className="mtp-an-doc">Từ {ngayChuoiNgan(moc)}: </span> : null}sai {sai} · đã tự sửa <b>{sua}</b></p>
            {on > 0 && <p className="mtp-ghi mtp-an-doc mtp-an-ngang">Hôm nay {on} câu đến lịch ôn lại</p>}
          </>
        ) : <p className="mtp-ghi">Con chưa có câu nào làm sai{moc ? ` từ ${ngayChuoiNgan(moc)}` : ''}.</p>
      ) : <Cho />}
    </O>
  )
}

// ---------------------------------------------------------------- 7 · Thái độ làm bài (6 tín hiệu của /ph/ho-so-thai-do) ----------------------------------------------------------------
function OThaiDo({ p, onMo }: PO) {
  const td = p.hoSo.td
  const dem = (m: string) => td?.tinHieu.filter((t) => t.muc === m).length ?? 0
  const tong = td?.tinHieu.length ?? 0
  const tot = dem('tot'), chuY = dem('chu-y'), xau = dem('xau')
  const doiPho = td ? (td.coDoiPho ?? td.ketLuan.nhan === 'doi-pho') : false
  return (
    <O id="thai-do" bt={BtNhipTim} onMo={onMo}>
      {td ? (
        <>
          {doiPho && <div className="mtp-so"><span className="ph3-chip mtp-chip-lon" data-mau="ho">Có dấu hiệu đối phó</span></div>}
          {tong > 0 && (
            <div className="mtp-thanh-3" role="img" aria-label={`${tot} tín hiệu trong ngưỡng · ${chuY} cần để mắt · ${xau} vượt ngưỡng`}>
              <i data-m="tot" style={{ width: `${(100 * tot) / tong}%` }} /><i data-m="chu-y" style={{ width: `${(100 * chuY) / tong}%` }} /><i data-m="xau" style={{ width: `${(100 * xau) / tong}%` }} />
            </div>
          )}
          <p className="mtp-ghi">Vượt ngưỡng <b>{xau}</b> · Cần để mắt <b>{chuY}</b><span className="mtp-an-doc mtp-an-ngang"> · Trong ngưỡng <b>{tot}</b> (trên {tong} tín hiệu)</span></p>
        </>
      ) : p.hoSo.loiTd ? <p className="mtp-ghi">Chưa tải được thái độ làm bài. Mở để tải lại.</p> : <Cho />}
    </O>
  )
}

// ---------------------------------------------------------------- 8 · Thời gian làm bài ----------------------------------------------------------------
function OThoiGian({ p, onMo }: PO) {
  const pm = p.v.pm!
  const gio = pm.nhipHoc?.gioThuongHoc || ''
  const gioChon = p.hoc2?.omni?.gioHoc || ''
  const dem = p.hoSo.td?.dem
  const tv = dem && typeof dem.giayTrungVi === 'number' && Number.isFinite(dem.giayTrungVi) ? dem.giayTrungVi : null
  const tb = dem && typeof dem.giayTb === 'number' && Number.isFinite(dem.giayTb) ? dem.giayTb : null
  return (
    <O id="thoi-gian" bt={BtDongHo} onMo={onMo}>
      {gio || gioChon ? (
        <>
          <div className="mtp-so mtp-gio">{gio || gioChon}</div>
          <p className="mtp-ghi">{gio ? 'Giờ học quen' : 'Giờ học con chọn'}</p>
        </>
      ) : tb !== null ? (
        <>
          <div className="mtp-so">{Math.round(tb)}<small>giây/lượt</small></div>
          <p className="mtp-ghi">Trung bình</p>
        </>
      ) : null}
      {tv !== null ? (
        <p className={`mtp-ghi${gio || gioChon || tb !== null ? ' mtp-an-doc' : ''}`}>Một nửa số lượt dưới <b>{Math.round(tv)} giây</b></p>
      ) : !gio && !gioChon && !p.hoSo.td ? (p.hoSo.loiTd ? <p className="mtp-ghi">Chưa tải được thời gian làm bài.</p> : <Cho />) : null}
    </O>
  )
}

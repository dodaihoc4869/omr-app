// APP PHỤ HUYNH «CHỈ ĐỌC» (thầy CHỐT bản vẽ 26/10: ve-moi/ph-doc-chua.html · ph-doc-du.html + ph-doc.css). Thay màn «Một trang» (8 ô bấm + tấm).
// Ba câu hỏi của phụ huynh, ĐỌC là hiểu, KHÔNG phải bấm: (1) hôm nay con làm bài chưa · (2) 7 ngày qua thế nào · (3) con chăm, lười hay đối phó;
// + lời thầy + dải 3 số (Kiểm tra gần nhất · Câu sai chưa sửa · Bài tập về nhà). Không ô bấm, không mũi tên, không tấm; chỉ ảnh đại diện góc phải
// (menu Tài khoản của AppPhuHuynh: «Đổi số báo danh»).
// BẬT khi <html data-trong="ph"> (main.tsx); lùi một máy: localStorage `ddh.trong`='tat' ⇒ AppPhuHuynh vẽ trang cũ, KHÔNG tải tệp này.
// SỐ — CHỈ lệnh sẵn có, KHÔNG bịa: lúc mở AppPhuHuynh đã nạp /ph/tat-ca-ve-con · /ph/con-tong-quan (7 ngày, đúng/sai hôm nay, câu sai) · /ph/nhip-hoc
// (nhóm, bậc chăm) · /ph/loi-thay · /ph/hoc-2 · cảnh báo của thầy; tệp này gọi thêm /ph/bao-cao-tuan (Học thật / Đối phó + số câu/lần `mucLam`) SONG SONG
// lúc mở. Số nào chưa có ⇒ nhãn + «—» hoặc bỏ dòng. Không cắt chữ (thẻ cao theo nội dung, thiếu chỗ thì trang cuộn); ngoại lệ: Lời thầy ≤ 3 dòng ở điện thoại.
// MÀU: doc-ph.css (chỉ biến PH sẵn có).
import { useEffect, useState, type ReactNode } from 'react'
import { AnhLogo } from '../LogoVai'
import { BtChuY, BtDongHo, BtNhan, BtTich } from './BieuTuong'
import { LoiThe, buoiHomNay, soHomNay, tenGoi, type TrangVeConProps } from './TrangVeCon'
import { chuThay } from './tien-ich'
import { gioVn, ngayNganVn, soVn, thuNgayVn } from '../../lib/ph-moi/dinh-dang'
import { tieuDeCanhBao } from '../../lib/canh-bao-thay-hien-thi'
import { layBaoCaoTuanCon, type BaoCaoTuanCon } from '../../lib/bao-cao-tuan-ph-api'
import type { NgayHoc } from '../../lib/ph-v3/con-tong-quan'
import './doc-ph.css'

export interface DocPhProps extends Pick<TrangVeConProps, 'v' | 'hoc2' | 'tongQuan' | 'nhip' | 'loiThay' | 'canhBao' | 'sbd' | 'tenCon' | 'lop'> {
  /** Nút tài khoản (menu «Đổi số báo danh») của AppPhuHuynh. */
  taiKhoan: ReactNode
  /** Dòng báo lỗi làm mới của AppPhuHuynh (nếu có). */
  thongBao?: ReactNode
}

/** Báo cáo tuần đã tải trong phiên (quay lại từ màn con không gọi lại lệnh). */
let bcNho: { sbd: string; du: BaoCaoTuanCon | null } | null = null
const THU_NGAN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] as const
/** "T3 20" từ "YYYY-MM-DD". */
export function nhanNgay(s: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return ''
  return `${THU_NGAN[new Date(Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!)).getUTCDay()]} ${Number(m[3])}`
}
/** Trạng thái câu chính của Hôm nay: chưa làm câu nào (đỏ) · đang làm (hổ phách) · đủ mức (xanh). */
export function trangThaiHomNay(daLam: number, tong: number | null): 'chua' | 'dang' | 'du' {
  if (daLam <= 0) return 'chua'
  return tong !== null && daLam >= tong ? 'du' : 'dang'
}
/** Tóm tắt 7 ngày: đủ mức trên số ngày đã qua (+ hôm nay nếu đã đủ), số ngày không làm (ngày đã qua), tổng câu (gồm hôm nay). */
export function tomTat7(ds: readonly NgayHoc[]): { du: number; soNgay: number; khong: number; tong: number } {
  const qua = ds.filter((n) => !n.homNay)
  const nay = ds.find((n) => n.homNay)
  const nayDu = !!nay && nay.canLam > 0 && nay.daLam >= nay.canLam
  return {
    du: qua.filter((n) => n.trangThai === 'du').length + (nayDu ? 1 : 0),
    soNgay: qua.length + (nayDu ? 1 : 0),
    khong: qua.filter((n) => n.trangThai === 'khong').length,
    tong: ds.reduce((s, n) => s + n.daLam, 0),
  }
}
/** Lý do của nhận định bằng SỐ CÂU / SỐ LẦN (không %): Đối phó ⇒ bấm vội mà sai + để máy treo; Học thật ⇒ làm nhanh vì đã thuộc + bấm vội mà sai. */
export function lyDoCach(bc: BaoCaoTuanCon): string {
  const m = bc.mucLam
  if (!m) return ''
  if (bc.nhan === 'Đối phó') return [`Bấm vội mà sai ${m.bamVoi} câu`, m.treo > 0 ? `để máy treo ${m.treo} lần` : ''].filter(Boolean).join(' · ') + ' trong 7 ngày'
  return [m.thuoc > 0 ? `Làm nhanh vì đã thuộc ${m.thuoc} câu` : '', `bấm vội mà sai ${m.bamVoi} câu`].filter(Boolean).join(' · ').replace(/^b/, 'B')
}

const Cho = ({ cao }: { cao: number }) => <div className="pd-cho tt-xuong" style={{ height: cao }} aria-hidden="true" />

export default function DocPh(p: DocPhProps) {
  const { v, sbd } = p
  const pm = v.pm
  const tq = p.tongQuan.v
  const nowMs = tq?.serverNow ?? pm?.serverNow ?? Date.now()
  const [bc, setBc] = useState<{ du: BaoCaoTuanCon | null; xong: boolean }>(() => (bcNho?.sbd === sbd ? { du: bcNho.du, xong: true } : { du: null, xong: false }))
  useEffect(() => {
    if (bcNho?.sbd === sbd) return
    let song = true
    void layBaoCaoTuanCon(sbd).then(
      (r) => { const du = r.ok ? r.du : null; if (r.ok) bcNho = { sbd, du }; if (song) setBc({ du, xong: true }) },
      () => { if (song) setBc({ du: null, xong: true }) },
    )
    return () => { song = false }
  }, [sbd])

  const ten = tenGoi(pm?.hoTen || p.tenCon)
  const capNhat = pm?.serverNow ?? tq?.serverNow ?? null
  return (
    <div className="pd" data-vung="ph-chi-doc">
      <header className="pd-dau">
        <div className="pd-khung">
          <AnhLogo vai="ph" size={30} alt="Logo Đỗ Đại Học" />
          <span className="pd-ten-app">Đỗ Đại Học<small>Phụ huynh</small></span>
          {p.taiKhoan}
        </div>
      </header>
      <main className="pd-khung pd-than">
        {p.thongBao}
        <div className="pd-ten">
          <p className="pd-ngay">{capNhat !== null ? `${thuNgayVn(capNhat)} · cập nhật ${gioVn(capNhat)}` : ' '}</p>
          <h1 data-vung="ten-con">{ten}{p.lop ? ` · Lớp ${p.lop}` : ''}</h1>
        </div>
        {!pm ? (
          v.trangThai === 'loi' ? (
            <LoiThe chu={v.chuLoi} thuLai={v.thuLai} nut="Thử lại" />
          ) : (
            <div className="pd-luoi" role="status" aria-live="polite" data-vung="dang-tai">
              <span className="ph3-an">Đang tải dữ liệu của con…</span>
              {['hom', 'bay', 'nhom', 'loi'].map((k) => <section key={k} className={`pd-the g-${k}`} aria-hidden="true"><Cho cao={k === 'bay' ? 160 : 90} /></section>)}
            </div>
          )
        ) : (
          <>
            <div className="pd-luoi">
              <HomNay p={p} nowMs={nowMs} />
              <BayNgay p={p} />
              <Nhom p={p} bc={bc} />
              <LoiThay p={p} />
            </div>
            <BaSo p={p} />
          </>
        )}
      </main>
    </div>
  )
}

type PT = { p: DocPhProps }

// ---------------------------------------------------------------- 1 · Hôm nay ----------------------------------------------------------------
function HomNay({ p, nowMs }: PT & { nowMs: number }) {
  const pm = p.v.pm!
  const tq = p.tongQuan.v
  const so = soHomNay(pm, p.hoc2, tq)
  const tt = trangThaiHomNay(so.daLam, so.tong)
  const d = tq?.dem.homNay ?? null
  const tieu = tt === 'chua' ? 'Con chưa làm bài hôm nay'
    : tt === 'du' ? `Con đã làm đủ ${so.daLam}/${so.xap}${so.tong} câu`
    : so.tong !== null ? `Con đã làm ${so.daLam}/${so.xap}${so.tong} câu` : `Con đã làm ${so.daLam} câu hôm nay`
  const phu = [
    tt === 'chua' && so.tong !== null ? `0/${so.xap}${so.tong} câu` : '',
    d && so.daLam > 0 ? `Đúng ${d.dung} · Sai ${d.sai}${d.giayTb !== null ? ` · ${Math.round(d.giayTb)} giây/câu` : ''}` : '',
    tt !== 'du' ? 'còn hạn đến 24:00' : '',
  ].filter(Boolean).join(' · ')
  // buổi học: hôm nay (có mặt / chưa điểm danh / vắng); hôm nay không có buổi ⇒ buổi gần nhất của con
  const b = buoiHomNay(pm, nowMs)
  const ganNhat = !b ? [...(pm.buoiHoc ?? [])].filter((x) => !x.dangMo).sort((x, y) => Date.parse(y.moLuc) - Date.parse(x.moLuc))[0] : undefined
  const buoi = b ? (b.kieu === 'co-mat' ? <>Có mặt buổi học <b>{b.luc}</b></> : b.kieu === 'vang' ? 'Vắng buổi học hôm nay' : 'Chưa điểm danh buổi học')
    : ganNhat ? (ganNhat.coMat ? <>Có mặt buổi học <b>{ngayNganVn(ganNhat.moLuc)}</b></> : `Vắng buổi học ${ngayNganVn(ganNhat.moLuc)}`) : null
  const ds = tq?.ngay ?? []
  const iNay = ds.findIndex((n) => n.homNay)
  const qua = iNay > 0 ? ds[iNay - 1] : null
  const hqCu = pm.tongQuan?.soVoiHomQua ?? null
  const homQua = qua ? <>Hôm qua <b>{qua.daLam}/{qua.canLam} câu</b></> : hqCu ? <>Hôm qua <b>{hqCu.soCau} câu</b></> : null
  const ti = so.tong ? Math.max(0, Math.min(1, so.daLam / so.tong)) : null
  return (
    <section className="pd-the g-hom" aria-label="Hôm nay" data-vung="hom-nay-doc">
      <p className="pd-nhan">Hôm nay</p>
      <div className="pd-hom" data-tt={tt}>
        <span className="pd-dau-tron" aria-hidden="true">{tt === 'chua' ? <BtNhan co={24} day={2.4} /> : tt === 'du' ? <BtTich co={24} day={2.4} /> : <BtDongHo co={24} day={2.2} />}</span>
        <div className="pd-hom-chu"><b data-vung="cau-hom-nay">{tieu}</b>{phu && <span>{phu}</span>}</div>
      </div>
      {ti !== null && <div className="pd-thanh" role="img" aria-label={`Đã làm ${Math.round(ti * 100)}% mức hôm nay`}><i style={{ width: `${ti * 100}%` }} /></div>}
      {(buoi || homQua) && <p className="pd-dong">{buoi && <span>{buoi}</span>}{homQua && <span>{homQua}</span>}</p>}
    </section>
  )
}

// ---------------------------------------------------------------- 2 · 7 ngày qua ----------------------------------------------------------------
function BayNgay({ p }: PT) {
  const tq = p.tongQuan.v
  const ds = tq ? tq.ngay.slice(-7) : []
  const nay = ds.find((n) => n.homNay) ?? ds[ds.length - 1]
  const muc = nay ? nay.canLam || nay.muc : 0
  const t = tomTat7(ds)
  return (
    <section className="pd-the g-bay" aria-label="7 ngày qua" data-vung="bay-ngay">
      <p className="pd-nhan">7 ngày qua{muc > 0 && <span className="pd-phai">mức mỗi ngày {muc} câu</span>}</p>
      {ds.length > 0 && muc > 0 ? (
        <>
          <div className="pd-7" role="img" aria-label={ds.map((n) => `${n.homNay ? 'Hôm nay' : nhanNgay(n.ngay)}: ${n.daLam} câu`).join(' · ')}>
            {ds.map((n) => (
              <div key={n.ngay} className="c" data-tt={n.homNay ? 'nay' : n.trangThai} data-khong={n.daLam === 0 ? '' : undefined} style={{ ['--h' as string]: Math.min(115, Math.round((100 * n.daLam) / muc)) }}>
                <b>{n.daLam}</b><i /><small>{n.homNay ? 'Hôm nay' : nhanNgay(n.ngay)}</small>
              </div>
            ))}
          </div>
          <p className="pd-chu-giai" aria-hidden="true"><span><i className="cham" data-m="du" />Đủ mức</span><span><i className="cham" data-m="thieu" />Chưa đủ</span><span><i className="cham" data-m="khong" />Không làm</span><span><i className="net" />Mức {muc} câu</span></p>
          <p className="pd-ly">Đủ mức <b>{t.du}/{t.soNgay} ngày</b>{t.khong > 0 ? ` · ${t.khong} ngày không làm` : ''} · tổng <b>{t.tong} câu</b></p>
        </>
      ) : !tq && !p.tongQuan.daTai ? <Cho cao={150} /> : <p className="pd-rong">Chưa có số 7 ngày qua của con.</p>}
    </section>
  )
}

// ---------------------------------------------------------------- 3 · Con đang ở nhóm (+ Học thật / Đối phó) ----------------------------------------------------------------
const NHOM: readonly { n: 'luoi' | 'chua-deu' | 'cham'; chu: string }[] = [{ n: 'luoi', chu: 'Lười' }, { n: 'chua-deu', chu: 'Chưa đều' }, { n: 'cham', chu: 'Chăm' }]
function Nhom({ p, bc }: PT & { bc: { du: BaoCaoTuanCon | null; xong: boolean } }) {
  const k = p.nhip.k
  const on = k && k.nhom !== 'chua-du' ? k.nhom : null
  const cach = bc.du?.nhan ?? null
  const ly = bc.du && cach ? lyDoCach(bc.du) : ''
  return (
    <section className="pd-the g-nhom" aria-label="Con đang ở nhóm" data-vung="nhom-con">
      <p className="pd-nhan">Con đang ở nhóm{k && k.soNgayQua > 0 && <span className="pd-phai">{k.soNgayQua} ngày gần nhất</span>}</p>
      {k ? (
        <>
          <div className="pd-thang" role="img" aria-label={on ? `Nhóm ${NHOM.find((x) => x.n === on)!.chu}` : 'Chưa đủ ngày để xếp nhóm'}>
            {NHOM.map((x) => <span key={x.n} data-n={x.n} data-on={x.n === on ? '' : undefined}>{x.chu}</span>)}
          </div>
          <p className="pd-ly">
            {on ? <>Đủ mức <b>{k.soNgayDu}/{k.soNgayQua} ngày</b>{k.bacCham ? <> · bậc chăm <b>{k.bacCham.bac}/12</b></> : null}</> : 'Chưa đủ ngày để xếp nhóm.'}
          </p>
        </>
      ) : p.nhip.dangTai ? <Cho cao={60} /> : <p className="pd-rong">Chưa tải được nhóm của con.</p>}
      {cach && (
        <div className="pd-cach" data-tt={cach === 'Đối phó' ? 'doi-pho' : 'hoc-that'} data-vung="cach-lam-bai">
          {cach === 'Đối phó' ? <BtChuY co={20} /> : <BtTich co={20} />}
          <div><b>{cach === 'Đối phó' ? 'Có dấu hiệu đối phó' : 'Học thật'}</b>{ly && <span>{ly}</span>}</div>
        </div>
      )}
    </section>
  )
}

// ---------------------------------------------------------------- 4 · Lời thầy ----------------------------------------------------------------
function LoiThay({ p }: PT) {
  const cb = p.canhBao[0]
  const ds = p.loiThay.ds
  const moi = ds?.[0]
  const ngay = moi ? moi.nopLuc || moi.capNhatLuc : ''
  return (
    <section className="pd-the g-loi" aria-label="Lời thầy" data-vung="loi-thay-doc">
      <p className="pd-nhan">Lời thầy{!cb && ngay && <span className="pd-phai">{ngayNganVn(ngay)}</span>}</p>
      {cb ? (
        <p className="pd-loi pd-loi-canh" data-vung="canh-bao-thay"><BtChuY co={18} />{tieuDeCanhBao(cb, 'phuhuynh')}{p.canhBao.length > 1 ? ` (+${p.canhBao.length - 1})` : ''}</p>
      ) : moi ? (
        <p className="pd-loi" data-vung="loi-thay-moi">{chuThay(moi.noiDung)}</p>
      ) : ds ? (
        <p className="pd-rong">Thầy chưa gửi nhận xét nào cho con.</p>
      ) : p.loiThay.chuLoi ? <p className="pd-rong">Chưa tải được lời thầy.</p> : <Cho cao={40} />}
    </section>
  )
}

// ---------------------------------------------------------------- dải 3 số ----------------------------------------------------------------
function BaSo({ p }: PT) {
  const pm = p.v.pm!
  const tq = p.tongQuan.v
  const diem = pm.caGanNhat?.ketQua?.tong ?? null
  const chuaSua = tq ? Math.max(0, tq.cauSai.tong - tq.cauSai.daSua) : null
  const bt = pm.baiTapVeNha
  const o = (nhan: string, so: ReactNode, don: string) => <div><span>{nhan}</span><b>{so}{don && <small>{don}</small>}</b></div>
  return (
    <div className="pd-so" data-vung="ba-so">
      {o('Kiểm tra gần nhất', diem !== null ? soVn(diem) : '—', diem !== null ? '/10' : '')}
      {o('Câu sai chưa sửa', chuaSua ?? '—', chuaSua !== null ? ' câu' : '')}
      {bt ? (bt.dangChay.length > 0 ? o('Bài tập về nhà', bt.dangChay.length, ' chưa nộp') : bt.gan.length > 0 ? o('Bài tập về nhà', 'Đã nộp', ' đủ') : o('Bài tập về nhà', 'Chưa có', ' bài')) : o('Bài tập về nhà', '—', '')}
    </div>
  )
}

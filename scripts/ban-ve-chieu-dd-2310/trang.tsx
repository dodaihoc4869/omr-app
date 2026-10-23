// BẢN VẼ «MÀN CHIẾU ĐIỂM DANH» 23/10 (thầy: "thiết kế lại giao diện này xịn hơn đẹp hơn trực quan hơn, vẽ trước cho tôi đã") — bước 2 quy trình 4 bước.
// CHƯA build vào app: trang này chỉ để chụp ảnh. Dữ liệu GIẢ (cùng lớp giả của ảnh hiện trạng: 12 Nhóm 10 điểm, 30/38 có mặt), mọi số TÍNH bằng đúng
// phép thật của app/máy chủ (nhóm, bậc, ô ngày, Vừa vào, lên bậc). Huy hiệu = component thật `HuyHieuBac`. Tên em là tên giả. Đặc tả: docs/ban-ve-chieu-diem-danh-2310/DAC-TA.md.
//   ?k=A1 … A5 (Điểm danh đầu giờ) · B1 … B5 (Nhịp học của lớp)
import { createRoot } from 'react-dom/client'
import { ArrowLeft, ArrowRight, Crown, EyeOff, Pause, QrCode, Sparkles, WifiOff, X, Zap, Brain, RefreshCw } from 'lucide-react'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import '@fontsource/be-vietnam-pro/vietnamese-800.css'
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/be-vietnam-pro/latin-600.css'
import '@fontsource/be-vietnam-pro/latin-700.css'
import '@fontsource/be-vietnam-pro/latin-800.css'
import '../../src/styles/tokens.css'
import '../../src/index.css'
import '../../src/styles/gv-mau.css'
import '../../src/components/chieu-ma.css'
import '../../src/components/chieu-ma-kiem-tra.css'
import '../../src/components/day-hoc/ban-chieu-diem-danh.css'
import './ve.css'
import HuyHieuBac from '../../src/components/bac-cham-chi/HuyHieuBac'
import { BAC_CHAM_CHI, motBac } from '../../src/components/bac-cham-chi/bac'
import { duongQr, taoQr } from '../../src/lib/ma-qr'
import {
  cotNhipLop, homQuaHomNay, khoaNhom, khoangNhip, luoiDiemDanh, ngayNganDd, nhipTheoSbd, phanTramDd, soNgayBo, thongKeBuoi,
  type EmBuoi, type KhoaNhom,
} from '../../src/lib/diem-danh-nhip'
import { demThang, emVuaVao, lenBac } from '../../src/components/day-hoc/chieu-bac'
import { linkDiemDanh, type TrangThaiBuoi } from '../../src/lib/buoi-hoc-api'
import { bacChamChi } from '../../server/src/bac-cham-chi'
import { tomTatNhip } from '../../server/src/nhip-hoc-luat'
import type { EmNhipHoc, KetQuaNhipHoc } from '../../server/src/nhip-hoc-kieu'
import { nhipHocGia } from '../chup-v2/gia/nhip-hoc'

const k = new URLSearchParams(location.search).get('k') ?? 'A1'
const CHE_DO = k.startsWith('B') ? 'nhip' : 'dd'

// ───────────── DỮ LIỆU GIẢ (một bảng, mọi số tính ra)
const TEN_DAI = 'Nguyễn Hoàng Phương Thảo Nguyên' // 31 ký tự — kiểm không cắt tên
function lopGia(): KetQuaNhipHoc {
  const r = nhipHocGia()
  const kq = (r.ok ? r.du : {}) as unknown as KetQuaNhipHoc
  return {
    ...kq,
    em: kq.em.map((e: EmNhipHoc) => {
      const dai = kq.ngay.map((ngay, i) => ({ ngay, muc: e.muc[i]!, lam: e.lam[i]! })).filter((x) => x.ngay >= e.ngayVao)
      const b = k === 'A5' ? null : bacChamChi(dai, kq.homNay, tomTatNhip(dai, kq.homNay))
      return b ? { ...e, bacCham: b } : e
    }),
  }
}
const KQ = lopGia()
const LOP = k === 'A3' ? '12 Lớp Thường' : '12 Nhóm 10 điểm'
const MO_LUC = '2026-10-12T10:52:00Z'
const dsLop = KQ.em.filter((e) => e.lop === LOP)
// đổi tên một em có mặt thành tên dài nhất lớp
const emDai = dsLop[4]!
emDai.hoTen = TEN_DAI
const vangSbd = new Set(dsLop.filter((_, i) => (k === 'A3' ? i % 11 === 3 : i % 5 === 2)).map((e) => e.sbd))
const coMatThu = k === 'A2' ? [] : dsLop.filter((e) => !vangSbd.has(e.sbd))
const TT: TrangThaiBuoi = {
  buoi: { id: 'BH-V', ten: `Buổi học 12/10 · ${LOP}`, lop: LOP, moLuc: MO_LUC, hetHan: '2026-10-13T10:52:00Z', dongLuc: null, dangMo: true },
  ma: '482915', doiMaLuc: 1,
  coMat: coMatThu.map((e, i) => ({ sbd: e.sbd, hoTen: e.hoTen, luc: new Date(Date.parse(MO_LUC) + 60_000 + i * 21_000).toISOString(), cach: (i === 3 ? 'thay' : 'ma') as 'thay' | 'ma' })),
  siSo: dsLop.length,
  lopEm: dsLop.map((e) => ({ sbd: e.sbd, hoTen: e.hoTen, tenLop: LOP })),
}
const TK = thongKeBuoi(TT, nhipTheoSbd(KQ))
const coBac = TK.ds.some((e) => !!e.bacCham)

/** Cách làm bài 14 ngày GIẢ của một em (đúng hình dạng `/gv/muc-lam-lo` bản công khai: Mức 6 đã hạ về Treo). Tất định theo SBD. */
function mucGia(e: EmBuoi) {
  const s = Number(e.sbd) % 97
  const nhom = khoaNhom(e)
  const soDo = 6 + (s % 23)
  const voiTi = nhom === 'luoi' ? 0.5 : nhom === 'chua-deu' ? 0.32 : 0.14
  const voi = Math.round(soDo * Math.min(0.85, voiTi + ((s % 7) - 3) * 0.04))
  const treo = k === 'B4' ? 0 : nhom === 'luoi' ? s % 4 : s % 9 === 0 ? 1 : 0
  const nghi = Math.max(0, soDo - voi - treo)
  const sai = Math.round(voi * 0.7 + nghi * 0.2)
  const saiVoi = Math.min(sai, Math.round(voi * 0.7))
  return { soDo, voi, nghi, treo, sai, saiVoi }
}

// ───────────── BỘ PHẬN CHUNG
const TEN_NHOM_CHIEU: Record<KhoaNhom, string> = { cham: 'Chăm', 'chua-deu': 'Chưa đều', luoi: 'Lười', moi: 'Mới', 'chua-co': 'Chưa có số' }
const KHOANG_NHOM: Record<KhoaNhom, string> = { cham: 'bậc 8–12', 'chua-deu': 'bậc 6–7', luoi: 'bậc 1–5', moi: 'chưa đủ 3 ngày', 'chua-co': '' }
const gio = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Ho_Chi_Minh' }) : '')

function Dau({ tieuDe, phu, phai }: { tieuDe: string; phu: string; phai: React.ReactNode }) {
  return (
    <header className="ddv-dau">
      <span className="ddv-nhan">{tieuDe}</span>
      <h1 className="ddv-lop">{phu}</h1>
      <div className="ddv-dau-phai">{phai}</div>
      <button type="button" className="ddv-dong"><X aria-hidden /> Đóng <kbd>Esc</kbd></button>
    </header>
  )
}

function VongCoMat({ co, tong }: { co: number; tong: number }) {
  const p = tong ? co / tong : 0
  const r = 44, c = 2 * Math.PI * r
  return (
    <div className="ddv-vong" role="img" aria-label={`Có mặt ${co} trên ${tong} em`}>
      <svg viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r={r} className="ddv-vong-nen" />
        <circle cx="50" cy="50" r={r} className="ddv-vong-day" strokeDasharray={`${c * p} ${c}`} transform="rotate(-90 50 50)" />
      </svg>
      <div className="ddv-vong-so"><b>{co}</b><span>/{tong}</span></div>
      <div className="ddv-vong-chu">em có mặt<small>{tong - co > 0 ? `còn ${tong - co} em chưa điểm danh` : 'đủ cả lớp'}</small></div>
    </div>
  )
}

/** Dải ô ngày (đúng bốn loại ô của bảng Bài hằng ngày + ngày trước khi vào học). */
function DaiNgay({ e, nho }: { e: EmBuoi; nho?: boolean }) {
  const o = (e.nhip?.o ?? []).filter((x) => !x.homNay)
  return (
    <span className={`ddv-ngay${nho ? ' ddv-ngay--nho' : ''}`} role="img" aria-label={`Đủ mức ${e.nhip?.soNgayDu ?? 0}/${e.nhip?.soNgayQua ?? 0} ngày`}>
      {o.map((x) => <i key={x.ngay} data-loai={x.loai} />)}
    </span>
  )
}

// ───────────── CHẾ ĐỘ A · ĐIỂM DANH ĐẦU GIỜ
function TheEm({ e, vua, dau }: { e: EmBuoi; vua: boolean; dau: boolean }) {
  const b = e.bacCham ? motBac(e.bacCham.bac) : null
  const nh = khoaNhom(e)
  const phu = !e.nhip ? 'Chưa có số nhịp học'
    : nh === 'moi' ? `Đã có số ${e.nhip.soNgayQua}/3 ngày`
    : nh === 'luoi' ? `Đủ mức ${e.nhip.chuoiDuGanNhat}/6 ngày liền để thoát Lười`
    : `Chuỗi đủ mức ${e.nhip.chuoiDuGanNhat} ngày`
  return (
    <button type="button" className="ddv-the" data-nhom={nh} data-vua={vua || undefined} data-dau={dau || undefined} aria-label={`${e.hoTen}${b ? `, bậc ${b.so} ${b.ten}` : ''}, mở hồ sơ làm bài`}>
      <span className="ddv-the-hh">{b ? <HuyHieuBac bac={b.so} co={56} /> : <span className="ddv-the-hh-trong" data-nhom={nh}>{TEN_NHOM_CHIEU[nh].slice(0, 1)}</span>}{b && <b className="ddv-the-so">{b.so}</b>}</span>
      <span className="ddv-the-chu">
        <b className="ddv-the-ten">{e.hoTen}</b>
        <span className="ddv-the-bac">{b ? b.ten : TEN_NHOM_CHIEU[nh]}</span>
        <span className="ddv-the-phu">{phu}</span>
      </span>
      {vua && <span className="ddv-the-vua"><Sparkles aria-hidden />Vừa vào {gio(e.luc)}</span>}
      {dau && <span className="ddv-the-dau"><Crown aria-hidden />Dẫn đầu lớp</span>}
    </button>
  )
}

function ThangBac({ coMat }: { coMat: EmBuoi[] }) {
  if (!coBac) return null
  const d = demThang(coMat)
  return (
    <div className="ddv-thang" role="img" aria-label="Số em có mặt ở mỗi bậc">
      {BAC_CHAM_CHI.map((b) => {
        const n = d.bac[b.so - 1] ?? 0
        return (
          <span key={b.so} className="ddv-thang-o" data-nhom={b.nhom} data-rong={n === 0 || undefined} title={b.ten}>
            <HuyHieuBac bac={b.so} co={30} />
            <b>{n}</b>
          </span>
        )
      })}
      <span className="ddv-thang-o ddv-thang-o--moi" data-rong={d.chuaXep === 0 || undefined}><span className="ddv-thang-moi">Mới</span><b>{d.chuaXep}</b></span>
    </div>
  )
}

function ChieuDiemDanh() {
  const coMat = TK.coMat
  const vua = emVuaVao(coMat, 3)
  const luoi = luoiDiemDanh(coMat)
  const dau = luoi.find((e) => e.bacCham)
  const nhomCo: KhoaNhom[] = (['cham', 'chua-deu', 'luoi', 'moi', 'chua-co'] as KhoaNhom[]).filter((n) => luoi.some((e) => khoaNhom(e) === n))
  const moiNhat = coMat[0]
  const linkHs = 'omr-app-b3u.pages.dev/hs'
  const qr = duongQr(taoQr(linkDiemDanh('https://omr-app-b3u.pages.dev', '482915'))!)
  const dong = coMat.length > 40
  return (
    <div className="ca-chieu cm km ddc ddv" data-che-do="dd" data-dong={dong || undefined}>
      <Dau tieuDe="Điểm danh đầu giờ" phu={`${LOP} · Thứ Hai 12/10 · 17:52`} phai={<VongCoMat co={coMat.length} tong={TT.siSo} />} />
      {k === 'A3' && <div className="ddv-bao" role="status"><WifiOff aria-hidden />Mất kết nối với máy chủ — danh sách dừng ở 17:51. Em vẫn điểm danh được; màn tự cập nhật khi có mạng.</div>}
      <main className="ddv-than">
        <aside className="ddv-vao">
          <div className="ddv-ma">
            <p className="ddv-ma-buoc"><QrCode aria-hidden />Mở app học sinh › <b>Điểm danh</b></p>
            <div className="ddv-ma-so" aria-label="Mã buổi 482 915">482<span /> 915</div>
            <div className="ddv-ma-qr"><svg viewBox={`0 0 ${qr.canh} ${qr.canh}`} shapeRendering="crispEdges" aria-label="Mã QR điểm danh"><rect width={qr.canh} height={qr.canh} fill="white" /><path d={qr.d} /></svg></div>
            <div className="ddv-ma-doi"><span style={{ width: '64%' }} /></div>
            <p className="ddv-ma-phu">Mã đổi sau <b>0:38</b> · mỗi em chỉ điểm danh cho chính mình</p>
            <p className="ddv-ma-link">{linkHs}</p>
          </div>
          {moiNhat && (
            <div className="ddv-moi-vao">
              <p className="ddv-muc-tieu"><Sparkles aria-hidden />Vừa vào lớp</p>
              {coMat.slice(0, 3).map((e, i) => {
                const b = e.bacCham ? motBac(e.bacCham.bac) : null
                return (
                  <div key={e.sbd} className="ddv-moi-dong" data-dau={i === 0 || undefined}>
                    <span className="ddv-moi-hh">{b ? <HuyHieuBac bac={b.so} co={i === 0 ? 52 : 40} /> : null}</span>
                    <span className="ddv-moi-chu"><b>{e.hoTen}</b><span>{b ? `Bậc ${b.so} · ${b.ten}` : TEN_NHOM_CHIEU[khoaNhom(e)]}</span></span>
                    <time>{gio(e.luc)}</time>
                  </div>
                )
              })}
            </div>
          )}
        </aside>
        <section className="ddv-lop-hn" aria-label="Em có mặt, xếp theo bậc">
          {coMat.length === 0 ? (
            <div className="ddv-trong">
              <div className="ddv-trong-hh">{[12, 9, 6, 3].map((b) => <HuyHieuBac key={b} bac={b} co={88} />)}</div>
              <p className="ddv-trong-to">Chưa em nào điểm danh</p>
              <p className="ddv-trong-phu">Em mở app học sinh, chọn <b>Điểm danh</b>, gõ mã <b>482 915</b> hoặc quét mã QR bên trái. Tên em hiện ở đây kèm bậc của em.</p>
            </div>
          ) : (
            <>
              <ThangBac coMat={coMat} />
              <div className="ddv-lan-ds">
                {nhomCo.map((n) => {
                  const ds = luoi.filter((e) => khoaNhom(e) === n)
                  return (
                    <div key={n} className="ddv-lan" data-nhom={n}>
                      <div className="ddv-lan-nhan"><b>{TEN_NHOM_CHIEU[n]}</b><span>{ds.length} em</span><small>{KHOANG_NHOM[n]}</small></div>
                      <div className="ddv-lan-the">{ds.map((e) => <TheEm key={e.sbd} e={e} vua={vua.has(e.sbd)} dau={e === dau} />)}</div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </section>
      </main>
      <footer className="ddv-chan">
        <p className="ddv-chu-giai">{coBac ? 'Bậc 1–12 tính từ số ngày làm đủ mức và chuỗi ngày liền · Lười 1–5 thoát khi đủ mức 6 ngày liền · Chưa đều 6–7 · Chăm 8–12' : 'Máy chủ chưa gửi bậc — thẻ tô theo nhóm Chăm · Chưa đều · Lười'}</p>
        <button type="button" className="ddv-nut-chinh">Chiếu Nhịp học của lớp <ArrowRight aria-hidden /> <kbd>→</kbd></button>
      </footer>
      {k === 'A4' && moiNhat && <ChaoEm e={moiNhat} />}
    </div>
  )
}

function ChaoEm({ e }: { e: EmBuoi }) {
  const b = e.bacCham ? motBac(e.bacCham.bac) : null
  const lb = lenBac(e)
  return (
    <div className="ddv-chao" role="status" aria-live="polite">
      <div className="ddv-chao-the" data-nhom={khoaNhom(e)}>
        {b && <span className="ddv-chao-hh"><HuyHieuBac bac={b.so} co={200} /></span>}
        <p className="ddv-chao-loi">Chào em, vừa điểm danh lúc {gio(e.luc)}</p>
        <p className="ddv-chao-ten">{e.hoTen}</p>
        {b && <p className="ddv-chao-bac">Bậc {b.so}/12 · {b.ten}</p>}
        {lb && <div className="ddv-chao-len"><p>{lb.cau}</p>{lb.tien != null && <span className="ddv-chao-vach"><i style={{ width: `${Math.round(lb.tien * 100)}%` }} /></span>}</div>}
      </div>
    </div>
  )
}

// ───────────── CHẾ ĐỘ B · NHỊP HỌC CỦA LỚP
function ChieuNhipLop() {
  const anLuoi = k === 'B2'
  const mucTung = k === 'B3'
  const loi = k === 'B5'
  const ds = TK.ds
  const cot = cotNhipLop(ds)
  const kh = khoangNhip(KQ)
  const hq = homQuaHomNay(ds, KQ)
  const tong = ds.length
  const n = { cham: cot.cham.length, deu: cot.chuaDeu.length, luoi: cot.luoi.length, khac: cot.khac.length }
  const coMat = TK.coMat
  const muc = coMat.map(mucGia)
  const sum = (f: (m: ReturnType<typeof mucGia>) => number) => muc.reduce((t, m) => t + f(m), 0)
  const voi = sum((m) => m.voi), nghi = sum((m) => m.nghi), treo = sum((m) => m.treo), soDo = voi + nghi + treo, sai = sum((m) => m.sai), saiVoi = sum((m) => m.saiVoi)
  const mucCua = new Map(coMat.map((e, i) => [e.sbd, muc[i]!]))
  const Cot = ({ ten, ds, nhom, chu }: { ten: string; ds: EmBuoi[]; nhom: KhoaNhom; chu: string }) => (
    <section className="ddv-cot" data-nhom={nhom} aria-label={`${ten} ${ds.length} em`}>
      <h2><b>{ten}</b><span>{ds.length} em</span><small>{chu}</small></h2>
      {anLuoi && nhom === 'luoi' ? (
        <div className="ddv-an"><EyeOff aria-hidden /><p>Đã ẩn tên {ds.length} em nhóm Lười</p><small>Bấm H để hiện lại · thầy vẫn xem đủ trên máy thầy</small></div>
      ) : (
        <ol className="ddv-cot-ds">
          {ds.map((e) => {
            const vang = !e.coMat
            const bo = soNgayBo(e.nhip)
            const m = mucCua.get(e.sbd)
            return (
              <li key={e.sbd} data-vang={vang || undefined}>
                <button type="button" className="ddv-dong-em" aria-label={`${e.hoTen}, mở hồ sơ làm bài`}>
                  <span className="ddv-dong-hh">{e.bacCham ? <HuyHieuBac bac={e.bacCham.bac} co={34} /> : null}</span>
                  <span className="ddv-dong-ten">{e.hoTen}{vang && <em>vắng</em>}</span>
                  {mucTung && m && !vang ? (
                    <span className="ddv-dong-muc" role="img" aria-label={`Vội ${m.voi}, có nghĩ ${m.nghi}, treo ${m.treo} lượt`}>
                      <i data-k="voi" style={{ flexGrow: m.voi }} /><i data-k="nghi" style={{ flexGrow: m.nghi }} />{m.treo > 0 && <i data-k="treo" style={{ flexGrow: m.treo }} />}
                    </span>
                  ) : <DaiNgay e={e} nho />}
                  <span className="ddv-dong-so">{bo > 0 && nhom === 'luoi' ? <em>bỏ {bo} ngày</em> : <>{e.nhip?.soNgayDu ?? 0}<small>/{e.nhip?.soNgayQua ?? 0}</small></>}</span>
                </button>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
  return (
    <div className="ca-chieu cm km ddc ddv" data-che-do="nhip">
      <Dau tieuDe={`Nhịp học · ${LOP}`} phu={kh && kh.homQua ? `Từ ${ngayNganDd(kh.tu)} đến ${ngayNganDd(kh.homQua)} · ${kh.soNgayQua} ngày đã qua` : ''} phai={<p className="ddv-dau-so">Có mặt <b>{coMat.length}</b>/{TT.siSo} · Vắng <b>{TT.siSo - coMat.length}</b></p>} />
      {loi ? (
        <main className="ddv-loi">
          <RefreshCw aria-hidden />
          <p className="ddv-trong-to">Chưa tải được Nhịp học của lớp</p>
          <p className="ddv-trong-phu">Máy chủ không trả lời sau 8 giây. Danh sách điểm danh vẫn đủ ({coMat.length}/{TT.siSo} em) — thầy bấm <b>Tải lại</b> hoặc sang bước Gọi lên bảng.</p>
          <button type="button" className="ddv-nut-chinh"><RefreshCw aria-hidden />Tải lại Nhịp học</button>
        </main>
      ) : (
        <main className="ddv-nhip">
          <div className="ddv-tong">
            <div className="ddv-tong-thanh" role="img" aria-label={`Chăm ${n.cham}, Chưa đều ${n.deu}, Lười ${n.luoi} em`}>
              <span data-nhom="cham" style={{ flexGrow: n.cham }}><b>{n.cham}</b> Chăm · {phanTramDd(n.cham, tong)}%</span>
              <span data-nhom="chua-deu" style={{ flexGrow: n.deu }}><b>{n.deu}</b> Chưa đều · {phanTramDd(n.deu, tong)}%</span>
              <span data-nhom="luoi" style={{ flexGrow: n.luoi }}><b>{n.luoi}</b> Lười · {phanTramDd(n.luoi, tong)}%</span>
              {n.khac > 0 && <span data-nhom="moi" style={{ flexGrow: Math.max(n.khac, 2) }}><b>{n.khac}</b> Mới</span>}
            </div>
            <div className="ddv-so-to">
              {hq.homQua && <p><b>{hq.homQua.du}</b><span>/{hq.homQua.tong}</span><small>em đủ mức hôm qua</small></p>}
              {hq.homNayDu != null && <p data-phu><b>{hq.homNayDu}</b><small>em đã đủ mức hôm nay</small></p>}
            </div>
          </div>
          <div className="ddv-cach" aria-label="Cách cả lớp làm bài 14 ngày qua">
            <p className="ddv-cach-tieu">Cách cả lớp làm bài<small>14 ngày qua · {coMat.length} em có mặt · {soDo} lượt đã đo giờ</small></p>
            <div className="ddv-cach-thanh">
              <span data-k="voi" style={{ flexGrow: voi }}><Zap aria-hidden /><b>Vội</b> {voi} lượt · {phanTramDd(voi, soDo)}%</span>
              <span data-k="nghi" style={{ flexGrow: nghi }}><Brain aria-hidden /><b>Có nghĩ</b> {nghi} lượt · {phanTramDd(nghi, soDo)}%</span>
              {treo > 0 && <span data-k="treo" style={{ flexGrow: Math.max(treo, soDo * 0.06) }}><Pause aria-hidden /><b>Treo máy</b> {treo}</span>}
            </div>
            <p className="ddv-cach-cau">{treo === 0 && k === 'B4' ? <>Treo máy: đang đo từ các lượt làm mới, lượt cũ chưa đo. · </> : null}<b>{saiVoi}/{sai}</b> lượt sai ({phanTramDd(saiVoi, sai)}%) là nộp khi chưa kịp đọc hết đề</p>
          </div>
          <div className="ddv-ba-cot">
            <Cot ten="Chăm" ds={cot.cham} nhom="cham" chu="đủ mức từ 80% số ngày" />
            <Cot ten="Chưa đều" ds={cot.chuaDeu} nhom="chua-deu" chu="đủ mức 50–79% số ngày" />
            <Cot ten="Lười" ds={cot.luoi} nhom="luoi" chu="thoát khi đủ mức 6 ngày liền" />
          </div>
          <p className="ddv-chu-giai ddv-chu-giai--o">
            <span><i data-loai="du" />Đủ mức</span><span><i data-loai="thieu-it" />Thiếu ít</span><span><i data-loai="thieu-nhieu" />Thiếu nhiều</span><span><i data-loai="khong-lam" />Không làm</span>
            {mucTung && <><span><i data-k="voi" />Vội (Mức làm 1–2)</span><span><i data-k="nghi" />Có nghĩ (3–4)</span><span><i data-k="treo" />Treo máy</span></>}
            <span className="ddv-chu-giai-phai">Mỗi ô là một ngày · bấm tên em ⇒ hồ sơ làm bài</span>
          </p>
        </main>
      )}
      <footer className="ddv-chan">
        <button type="button" className="ddv-nut"><ArrowLeft aria-hidden />Điểm danh <kbd>←</kbd></button>
        <button type="button" className="ddv-nut" aria-pressed={anLuoi}><EyeOff aria-hidden />{anLuoi ? 'Hiện tên nhóm Lười' : 'Ẩn tên nhóm Lười'} <kbd>H</kbd></button>
        <button type="button" className="ddv-nut" aria-pressed={mucTung}><Zap aria-hidden />Cách làm từng em: {mucTung ? 'Bật' : 'Tắt'} <kbd>M</kbd></button>
        <button type="button" className="ddv-nut-chinh">Sang Gọi lên bảng đầu giờ <ArrowRight aria-hidden /> <kbd>→</kbd></button>
      </footer>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<div className="m3 m3-thay vo-thay">{CHE_DO === 'dd' ? <ChieuDiemDanh /> : <ChieuNhipLop />}</div>)

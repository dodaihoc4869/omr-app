// Các khối của BẢNG TIN bản 3 — theo BẢN VẼ THẦY ĐÃ CHỐT (docs/ban-ve-bang-tin-v3-2109/). Chỉ ĐỌC: không nút hành động.
// Chạm tên em ⇒ trang Toàn cảnh một em; "+N nữa" ⇒ tấm bên. Số nào cũng có nhãn; khoá vắng ⇒ nói thật, không vẽ 0 giả (luật đọc ở lib/bang-tin-thay.ts).
import type { ReactNode } from 'react'
import { Check, ChevronRight } from 'lucide-react'
import {
  chuHanNop,
  chuTinhTu,
  chuTuMoc,
  phanTramTiLe,
  TEN_BUC,
  type BaiTapBangTin,
  type BangTin,
  type BoNaoBangTin,
  type DangVapBangTin,
  type EmCanDeY,
  type LopChuaHoc,
  type SucKhoeBangTin,
  type TienBoBangTin,
  type ViecMayLam,
} from '../../lib/bang-tin-thay'
import { gioPhutVN } from '../../lib/em-toan-canh'
import { chiaHang, useChieuCao, useDaVao, useDemLen } from './hooks'

const dinhDangSo = (n: number) => Math.round(n).toLocaleString('vi-VN')
/** Hai chữ cái đầu của hai từ cuối của tên ("Trần Gia Hân" → "GH"), như bản vẽ. */
export const chuVietTat = (hoTen: string) => {
  const tu = hoTen.trim().split(/\s+/).filter(Boolean)
  return (
    tu
      .slice(-2)
      .map((t) => t[0]?.toUpperCase() ?? '')
      .join('') || '?'
  )
}

/** Hàng "+N nữa" luôn cao 48 px (C9); chiều cao MỖI HÀNG của từng danh sách nằm ở CSS (`--bt3-hang`, bang-tin-v3.css). */
export const CAO_NUT_NUA = 48

export function Avatar({ hoTen, anh }: { hoTen: string; anh?: string }) {
  return anh ? (
    <img className="bt3-anh" src={anh} alt="" width={44} height={44} loading="lazy" />
  ) : (
    <span className="bt3-anh bt3-anh--chu" aria-hidden="true">
      {chuVietTat(hoTen)}
    </span>
  )
}

/** Khung một ô: tiêu đề (+ phần bên phải, ví dụ chú giải) và thân đo được chiều cao. */
export function O({ id, tieuDe, phai, lop = '', khoi, children }: { id: string; tieuDe: string; phai?: ReactNode; lop?: string; khoi: string; children: ReactNode }) {
  return (
    <section className={`bt3-o ${lop}`} aria-labelledby={id} data-khoi={khoi}>
      <header className="bt3-o-dau">
        <h2 id={id} className="bt3-o-tieu-de">
          {tieuDe}
        </h2>
        {phai}
      </header>
      {children}
    </section>
  )
}

function NutNua({ conLai, don, onMo }: { conLai: number; don: string; onMo: () => void }) {
  return (
    <button type="button" className="bt3-nua" onClick={onMo}>
      +{conLai.toLocaleString('vi-VN')} {don} nữa
      <ChevronRight size={18} aria-hidden="true" />
    </button>
  )
}

const Trong = ({ children }: { children: ReactNode }) => (
  <p className="bt3-trong" role="status">
    {children}
  </p>
)

// ─────────────────────────────── BỐN SỐ LỚN ───────────────────────────────

function SoDem({ so }: { so: number | null }) {
  const v = useDemLen(so)
  return <>{v == null ? '—' : dinhDangSo(v)}</>
}

function SoLon({ nhan, so, donVi, phu }: { nhan: string; so: number | null; donVi?: string; phu?: string }) {
  return (
    <div className="bt3-so">
      <span className="bt3-so-nhan">{nhan}</span>
      <span className="bt3-so-gia-tri">
        <b>
          <SoDem so={so} />
        </b>
        {donVi && <small>{donVi}</small>}
      </span>
      <span className="bt3-so-phu">{phu}</span>
    </div>
  )
}

/** Số "Bài tập về nhà đúng nhịp" KHÔNG nằm trong `/gv/bang-tin` (hợp đồng 21/09) — lấy từ lệnh cũ `/ke-hoach/hom-nay-thay`; chưa có ⇒ "—" và nói thật. */
export interface DungNhip {
  soEm: number
  soCoLo: number
}

export function BonSoLon({ bt, nayMs, dungNhip }: { bt: BangTin; nayMs: number; dungNhip?: DungNhip | null }) {
  const n = bt.nhip
  const tiLe = phanTramTiLe(n.tiLeDung)
  const phanEm = n.tongEm > 0 ? `${Math.round((n.soEmHoc / n.tongEm) * 100)}% số em · ${chuTinhTu(bt, nayMs)}` : chuTinhTu(bt, nayMs)
  const trungBinh = n.soEmHoc > 0 ? `trung bình ${(n.soCau / n.soEmHoc).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} câu mỗi em đã học` : `chưa có em nào làm bài ${chuTinhTu(bt, nayMs).replace(/^tính /, '')}`
  return (
    <div className="bt3-hang-so" role="group" aria-label="Nhịp học hôm nay">
      <SoLon nhan="Em đã học hôm nay" so={n.soEmHoc} donVi={`/ ${n.tongEm.toLocaleString('vi-VN')} em`} phu={phanEm} />
      <SoLon nhan="Câu đã làm" so={n.soCau} donVi="câu" phu={trungBinh} />
      <SoLon
        nhan="Tỉ lệ đúng"
        so={tiLe}
        donVi={tiLe != null ? '%' : undefined}
        phu={n.soCauDung != null && n.soCau > 0 ? `${n.soCauDung.toLocaleString('vi-VN')} câu đúng trong ${n.soCau.toLocaleString('vi-VN')} câu` : 'chưa có lượt làm nào để tính'}
      />
      <SoLon
        nhan="Bài tập về nhà đúng nhịp"
        so={dungNhip ? dungNhip.soEm : null}
        donVi={dungNhip ? `/ ${dungNhip.soCoLo.toLocaleString('vi-VN')} em` : undefined}
        phu={dungNhip ? `${Math.max(0, dungNhip.soCoLo - dungNhip.soEm).toLocaleString('vi-VN')} em chậm một chặng trở lên` : 'chưa có số liệu đúng nhịp'}
      />
    </div>
  )
}

// ─────────────────────────────── BÀI TẬP VỀ NHÀ ───────────────────────────────

export function ChuGiaiBaiTap() {
  return (
    <span className="bt3-cg" aria-hidden="true">
      <span>
        <i className="bt3-cd bt3-cd--chua" />
        Chưa mở
      </span>
      <span>
        <i className="bt3-cd bt3-cd--lam" />
        Đang làm
      </span>
      <span>
        <i className="bt3-cd bt3-cd--nop" />
        Đã nộp
      </span>
    </span>
  )
}

/** Thanh xếp chồng chưa mở / đang làm / đã nộp, số ngay trên thanh (đoạn quá hẹp: số vẫn nằm ở nhãn đọc màn hình). Lớn dần từ 0 ≤ 300 ms (cắt bằng clip-path, không đổi bố cục). */
function ThanhBaiTap({ b }: { b: BaiTapBangTin }) {
  const vao = useDaVao()
  const tong = Math.max(1, b.tong)
  const doan = [
    { k: 'chua', n: b.chuaMo },
    { k: 'lam', n: b.dangLam },
    { k: 'nop', n: b.daNop },
  ]
  return (
    <div className="bt3-thanh" data-vao={vao ? '1' : '0'} role="img" aria-label={`${b.tong} em: ${b.chuaMo} chưa mở, ${b.dangLam} đang làm, ${b.daNop} đã nộp`}>
      {doan.map((d) =>
        d.n > 0 ? (
          <span key={d.k} className={`bt3-doan bt3-doan--${d.k}`} style={{ flex: `${d.n} 1 0` }}>
            {d.n / tong >= 0.06 ? d.n : ''}
          </span>
        ) : null,
      )}
    </div>
  )
}

/** Dòng dưới thanh: việc A.I Đỗ Đại Học đã/sẽ làm (nhắc tự động) + chặng xong trung bình của bài cá nhân hoá. Không có gì thật để nói ⇒ '' (không vẽ dòng). */
export function chuMayBaiTap(b: BaiTapBangTin): string {
  const phan: string[] = []
  if (b.nhac && (b.nhac.soEm > 0 || b.nhac.soPhuHuynh > 0)) phan.push(`A.I Đỗ Đại Học đã nhắc ${b.nhac.soEm} em${b.nhac.soPhuHuynh > 0 ? ` · ${b.nhac.soPhuHuynh} phụ huynh` : ''}`)
  if (b.nhac?.luotKe) phan.push(`lượt nhắc kế ${gioPhutVN(b.nhac.luotKe)}`)
  if (b.chang) phan.push(`chặng xong trung bình ${b.chang.tbDaXong.toLocaleString('vi-VN')}/${b.chang.tong}`)
  return phan.join(' · ')
}

export function HangBaiTap({ b }: { b: BaiTapBangTin }) {
  const han = chuHanNop(b.hanNop, b.quaHan)
  const lop = `${b.nhieuLop ? 'Nhiều lớp' : b.tenLop}${b.tong > 0 ? ` · ${b.tong.toLocaleString('vi-VN')} em` : ''}`
  const may = chuMayBaiTap(b)
  return (
    <li className="bt3-bt">
      <div className="bt3-bt-dau">
        <span className="bt3-bt-ten" title={b.ten}>
          {b.ten}
        </span>
        {lop && <span className="bt3-bt-lop">{lop}</span>}
        {han && <span className="bt3-bt-han">{han}</span>}
      </div>
      <ThanhBaiTap b={b} />
      {may && <p className="bt3-bt-may">{may}</p>}
    </li>
  )
}

export function KhoiBaiTap({ bt, nayMs, onMoTatCa }: { bt: BangTin; nayMs: number; onMoTatCa: () => void }) {
  const [ref, cao, hang] = useChieuCao<HTMLDivElement>(74)
  const ds = bt.baiTap
  const n = chiaHang(ds.length, cao, hang, CAO_NUT_NUA)
  return (
    <O id="bt3-bai" tieuDe="Bài tập về nhà đang chạy" phai={<ChuGiaiBaiTap />} lop="bt3-o-bai" khoi="bai-tap">
      <div className="bt3-than" ref={ref}>
        {ds.length === 0 ? <Trong>{bt.lyDoThieu.baiTap ?? `${chuTuMoc(bt, nayMs)} chưa giao bài tập về nhà nào.`}</Trong> : <ul className="bt3-ds">{ds.slice(0, n).map((b) => <HangBaiTap key={b.ma} b={b} />)}</ul>}
        {ds.length > n && <NutNua conLai={ds.length - n} don="bài" onMo={onMoTatCa} />}
      </div>
    </O>
  )
}

// ─────────────────────────────── TIẾN BỘ HÔM NAY ───────────────────────────────

const DON_VI_BUC = { cham_nhat: 'câu', tien_bo_nhat: 'câu', ben_bi_nhat: 'ngày' } as const

/** Câu sẵn của máy chủ thường mở đầu bằng chính con số + đơn vị ("42 câu đã làm hôm nay") — số lớn bên phải đã có ⇒ bỏ đoạn đầu để không nói hai lần. */
export function boSoDau(chuMay: string, so: number, donVi: string): string {
  const m = /^\s*([\d.,]+)\s+(.*)$/.exec(chuMay)
  if (!m) return chuMay
  const dau = Number(m[1].replace(/\./g, '').replace(',', '.'))
  if (dau !== so) return chuMay
  const conLai = m[2].startsWith(`${donVi} `) ? m[2].slice(donVi.length + 1) : m[2]
  return conLai.trim() || chuMay
}

function TheTienBo({ t, onMoEm }: { t: TienBoBangTin; onMoEm: (sbd: string) => void }) {
  const don = DON_VI_BUC[t.loai]
  return (
    <li>
      <button type="button" className="bt3-tb" onClick={() => onMoEm(t.sbd)} aria-label={`${TEN_BUC[t.loai]}: ${t.hoTen}, ${t.chu} — mở toàn cảnh`}>
        <Avatar hoTen={t.hoTen} anh={t.anh} />
        <span className="bt3-tb-tt">
          <span className="bt3-tb-buc">{TEN_BUC[t.loai]}</span>
          <span className="bt3-tb-ten" title={t.hoTen}>
            <b>{t.hoTen}</b>
            {t.tenLop && <span className="bt3-tb-lop"> · {t.tenLop}</span>}
          </span>
          <span className="bt3-tb-phu">{boSoDau(t.chu, t.so, don)}</span>
        </span>
        <span className="bt3-tb-so">
          <SoDem so={t.so} /> {don}
        </span>
      </button>
    </li>
  )
}

export function KhoiTienBo({ bt, nayMs, onMoEm }: { bt: BangTin; nayMs: number; onMoEm: (sbd: string) => void }) {
  const ds = bt.tienBo
  return (
    <O id="bt3-tien" tieuDe="Tiến bộ hôm nay" lop="bt3-o-tien" khoi="tien-bo">
      <div className="bt3-than">
        {ds.length === 0 ? (
          <Trong>{chuTuMoc(bt, nayMs)} chưa có em nào đủ số liệu để nêu tên (chăm nhất cần từ 5 lượt chấm).</Trong>
        ) : (
          <ul className="bt3-tb-ds">{ds.map((t) => <TheTienBo key={t.loai} t={t} onMoEm={onMoEm} />)}</ul>
        )}
      </div>
    </O>
  )
}

// ─────────────────────────────── EM CẦN THẦY ĐỂ Ý ───────────────────────────────

export function HangEm({ e, onMoEm }: { e: EmCanDeY; onMoEm: (sbd: string) => void }) {
  return (
    <li>
      <button type="button" className="bt3-em" onClick={() => onMoEm(e.sbd)} aria-label={`${e.hoTen}${e.tenLop ? ` · ${e.tenLop}` : ''} — mở toàn cảnh`}>
        <span className="bt3-em-tt">
          <span className="bt3-em-ten">
            <b title={e.hoTen}>{e.hoTen}</b>
            {e.tenLop && <span className="bt3-em-lop"> · {e.tenLop}</span>}
          </span>
          <span className="bt3-em-ly">{e.lyDo.map((l) => l.chu).join(' · ')}</span>
        </span>
      </button>
    </li>
  )
}

export function KhoiCanDeY({ bt, nayMs, onMoEm, onMoTatCa, onMoChuaHoc }: { bt: BangTin; nayMs: number; onMoEm: (sbd: string) => void; onMoTatCa: () => void; onMoChuaHoc?: () => void }) {
  const [ref, cao, hang] = useChieuCao<HTMLDivElement>(56)
  const { ds, conLai } = bt.canDeY
  const n = chiaHang(ds.length, cao, hang, CAO_NUT_NUA, conLai)
  const con = ds.length - n + conLai
  return (
    <O id="bt3-em" tieuDe="Em cần thầy để ý" lop="bt3-o-em" khoi="can-de-y">
      <div className="bt3-than" ref={ref}>
        {ds.length === 0 ? <Trong>{bt.lyDoThieu.canDeY ?? `${chuTuMoc(bt, nayMs)} chưa có em nào cần thầy để ý.`}</Trong> : <ul className="bt3-ds">{ds.slice(0, n).map((e) => <HangEm key={e.sbd} e={e} onMoEm={onMoEm} />)}</ul>}
        {con > 0 && <NutNua conLai={con} don="em" onMo={onMoTatCa} />}
      </div>
      {bt.chuaHoc && onMoChuaHoc && <DongChuaHoc ds={bt.chuaHoc} onMo={onMoChuaHoc} />}
    </O>
  )
}

/** "Chưa học hôm nay" — MỘT dòng 48 px dưới danh sách em cần để ý: tổng số em + hai lớp đầu (số chưa học / sĩ số); chạm ⇒ tấm bên có tên từng lớp.
 *  Chỉ ĐỌC (không nút việc); tên và chạm-tên-mở-toàn-cảnh nằm ở tấm bên (nơi duy nhất được cuộn). */
export function DongChuaHoc({ ds, onMo }: { ds: LopChuaHoc[]; onMo: () => void }) {
  const tong = ds.reduce((s, l) => s + l.chuaHoc, 0)
  const lop = ds.slice(0, 2).map((l) => `${l.lop} ${l.chuaHoc}/${l.siSo}`)
  const them = ds.length - lop.length
  return (
    <button type="button" className="bt3-chua-hoc" onClick={onMo} data-khoi="chua-hoc-hom-nay">
      <span className="bt3-chua-hoc-chu">
        <b>Chưa học hôm nay: {tong.toLocaleString('vi-VN')} em</b>
        <span>
          {lop.join(' · ')}
          {them > 0 ? ` · +${them} lớp` : ''}
        </span>
      </span>
      <ChevronRight size={18} aria-hidden="true" />
    </button>
  )
}

/** Một em chưa học trong tấm bên: tên + lớp; chạm ⇒ Toàn cảnh một em. */
export function HangChuaHoc({ e, lop, onMoEm }: { e: { sbd: string; hoTen: string }; lop: string; onMoEm: (sbd: string) => void }) {
  return (
    <li>
      <button type="button" className="bt3-em" onClick={() => onMoEm(e.sbd)} aria-label={`${e.hoTen} · ${lop} — chưa học hôm nay, mở toàn cảnh`}>
        <span className="bt3-em-tt">
          <span className="bt3-em-ten">
            <b title={e.hoTen}>{e.hoTen}</b>
          </span>
        </span>
      </button>
    </li>
  )
}

// ─────────────────────────────── DẠNG CẢ LỚP ĐANG VẤP ───────────────────────────────

export function HangDang({ d }: { d: DangVapBangTin }) {
  const vao = useDaVao()
  const ti = d.soEmGap > 0 ? Math.min(100, Math.round((d.soEmVap / d.soEmGap) * 100)) : 0
  return (
    <li className="bt3-dv">
      <span className="bt3-dv-ten" title={d.ten}>
        <span>{d.ten}</span>
      </span>
      <span className="bt3-dv-so">
        {d.soEmVap} / {d.soEmGap} em vấp
      </span>
      <span className="bt3-dv-thanh" role="img" aria-label={`${d.soEmVap} trên ${d.soEmGap} em đã gặp dạng này bị vấp`}>
        <i style={{ transform: `scaleX(${vao ? ti / 100 : 0})` }} />
      </span>
    </li>
  )
}

export function KhoiDangVap({ bt, nayMs, onMoTatCa }: { bt: BangTin; nayMs: number; onMoTatCa: () => void }) {
  // Tên dạng được xuống 2 dòng (luật B: không cắt "…") ⇒ hàng cao 48 px (2 dòng 36 + 4 + thanh 8).
  const [ref, cao, hang] = useChieuCao<HTMLDivElement>(48)
  const ds = bt.dangVap
  const n = chiaHang(ds.length, cao, hang, CAO_NUT_NUA)
  return (
    <O id="bt3-dang" tieuDe="Dạng cả lớp đang vấp" lop="bt3-o-dang" khoi="dang-vap">
      <div className="bt3-than" ref={ref}>
        {ds.length === 0 ? (
          <Trong>{bt.lyDoThieu.dangVap ?? `${chuTuMoc(bt, nayMs)} chưa có dạng nào có từ 3 em vấp — chưa đủ để nói cả lớp đang vấp (tính trên 3 ngày gần nhất).`}</Trong>
        ) : (
          <ul className="bt3-ds">{ds.slice(0, n).map((d) => <HangDang key={d.ma} d={d} />)}</ul>
        )}
        {ds.length > n && <NutNua conLai={ds.length - n} don="dạng" onMo={onMoTatCa} />}
      </div>
    </O>
  )
}

// ─────────────────────────────── BỘ NÃO A.I · ĐÊM QUA ───────────────────────────────

export function KhoiBoNao({ bn, lyDo, thuThach }: { bn: BoNaoBangTin | null; lyDo?: string; thuThach?: string }) {
  const gio = bn?.chayLuc ? gioPhutVN(bn.chayLuc) : ''
  // Gợi ý cho thầy: chỉ hiện số hộp VỪA chỗ (không cắt ngang một hộp), luôn ≥ 1.
  const [ref, cao, hang] = useChieuCao<HTMLUListElement>(68)
  const goiY = bn?.goiY ?? []
  const n = chiaHang(goiY.length, cao == null ? null : cao + 8, hang, 0) // +8: khoảng cách cuối không tính vào chiều cao
  return (
    <O id="bt3-bn" tieuDe="Bộ não A.I · đêm qua" lop="bt3-o-bn" khoi="bo-nao">
      <div className="bt3-than">
        {!bn ? (
          <Trong>{lyDo ? `Chưa có bản tin của Bộ não A.I: ${lyDo}.` : 'Chưa có bản tin của Bộ não A.I đêm qua.'}</Trong>
        ) : (
          <>
            <dl className="bt3-bn-so">
              {bn.soEmSoi != null && (
                <div>
                  <dd>{bn.soEmSoi.toLocaleString('vi-VN')}</dd>
                  <dt>em được soi{gio ? ` lúc ${gio}` : ''}</dt>
                </div>
              )}
              {bn.soEmDieuChinh != null && (
                <div>
                  <dd>{bn.soEmDieuChinh.toLocaleString('vi-VN')}</dd>
                  <dt>em được chỉnh bài</dt>
                </div>
              )}
              {bn.soLoiNhan != null && (
                <div>
                  <dd>{bn.soLoiNhan.toLocaleString('vi-VN')}</dd>
                  <dt>lời nhắn cho em</dt>
                </div>
              )}
            </dl>
            {thuThach && <p className="bt3-bn-thu">{thuThach}</p>}
            {goiY.length > 0 && <p className="bt3-bn-cd">Gợi ý cho thầy</p>}
            <ul className="bt3-bn-y" ref={ref}>
              {goiY.slice(0, n).map((g) => (
                <li key={g.chu} title={g.chu}>
                  <span>{g.chu}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </O>
  )
}

// ─────────────────────────────── MÁY ĐÃ TỰ LÀM HÔM NAY ───────────────────────────────

/** In đậm con số đầu tiên của câu ("Nhắc nộp bài cho **12 em**, báo 9 phụ huynh") như bản vẽ. */
export function chuDamSo(chuMay: string): ReactNode {
  const m = /(\d[\d.,]*(?:\s(?:câu sai|câu|em|phụ huynh))?)/.exec(chuMay)
  if (!m || m.index == null) return chuMay
  return (
    <>
      {chuMay.slice(0, m.index)}
      <b>{m[1]}</b>
      {chuMay.slice(m.index + m[1].length)}
    </>
  )
}

export function HangViec({ v }: { v: ViecMayLam }) {
  return (
    <li className="bt3-may">
      <Check size={18} strokeWidth={2.4} aria-hidden="true" />
      <span className="bt3-may-chu">{chuDamSo(v.chu)}</span>
    </li>
  )
}

/** Tên ô "A.I Đỗ Đại Học đã tự làm hôm nay" (thầy lệnh 21/09: thay chữ "Máy" làm chủ ngữ bằng "A.I Đỗ Đại Học"; bảng A2 docs/CHUAN-TU-NGU). */
export const TEN_O_MAY = 'A.I Đỗ Đại Học đã tự làm hôm nay'

/** Chân ô: bình thường ⇒ đúng câu bản vẽ thầy chốt ("Hệ thống bình thường · thầy không cần làm gì"; giờ chạy nằm ở `title`); cần để ý / có lỗi ⇒ nói lý do thật của máy chủ. */
function SucKhoe({ s }: { s: SucKhoeBangTin }) {
  return (
    <p className={`bt3-suc bt3-suc--${s.muc}`} title={s.chu}>
      <span className="bt3-suc-cham" aria-hidden="true" />
      <span>{s.muc === 'xanh' ? <><b>Hệ thống bình thường</b> · thầy không cần làm gì</> : <><b>{s.muc === 'vang' ? 'Cần để ý' : 'Có lỗi'}</b> · {s.chu}</>}</span>
      {s.muc === 'xanh' && <span className="bt3-an-chu">{s.chu}</span>}
    </p>
  )
}

/** "Bộ não A.I soi N em" đã nằm ở ô Bộ não A.I · đêm qua ⇒ không nhắc lại ở đây (một thông tin một chỗ); ô Bộ não vắng thì giữ dòng này. */
const laThuThach = (v: ViecMayLam) => v.loai.startsWith('thu_thach')
export const viecCuaMay = (bt: BangTin): ViecMayLam[] => bt.mayDaLam.filter((v) => !laThuThach(v) && (!bt.boNao || v.loai !== 'bo_nao_soi'))
/** Dòng "N em nhận thử thách riêng · M em đã làm" (Bộ não nấc 1) nằm ở ô Bộ não A.I, không lặp ở ô Máy đã làm. Chưa có ⇒ undefined. */
export const dongThuThach = (bt: BangTin): string | undefined => bt.mayDaLam.find(laThuThach)?.chu

export function KhoiMayDaLam({ bt, nayMs, onMoTatCa }: { bt: BangTin; nayMs: number; onMoTatCa: () => void }) {
  const [ref, cao, hang] = useChieuCao<HTMLDivElement>(48)
  const ds = viecCuaMay(bt)
  const n = chiaHang(ds.length, cao, hang, CAO_NUT_NUA)
  return (
    <O id="bt3-may" tieuDe={TEN_O_MAY} lop="bt3-o-may" khoi="may-da-lam">
      <div className="bt3-than" ref={ref}>
        {ds.length === 0 ? <Trong>{bt.lyDoThieu.mayDaLam ?? `${chuTuMoc(bt, nayMs)} A.I Đỗ Đại Học chưa có việc nào cần tự làm.`}</Trong> : <ul className="bt3-ds">{ds.slice(0, n).map((v) => <HangViec key={v.loai} v={v} />)}</ul>}
        {ds.length > n && <NutNua conLai={ds.length - n} don="việc" onMo={onMoTatCa} />}
      </div>
      {bt.sucKhoe && <SucKhoe s={bt.sucKhoe} />}
    </O>
  )
}

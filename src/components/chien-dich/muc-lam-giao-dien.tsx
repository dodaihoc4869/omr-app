// MỨC LÀM 1–4 TRONG TẤM "HỒ SƠ LÀM BÀI" (thầy 21/10: "từng câu học sinh làm phải hiển thị chi tiết 4 mức, hiển thị cả lên app hs và ph, app gv bấm vào hs nào
// phải hiển thị đầy đủ, thiết kế lại giao diện cho thật đẹp mắt chi tiết rõ ràng"). Đặc tả: docs/dac-ta-muc-lam-bai-2010.md; bản vẽ đã duyệt 20/10: docs/ban-ve-muc-lam-2010/.
// Tệp này CHỈ do `HoSoLamCauEm.tsx` nhập (mảnh nạp lười) — hai mảnh lười cùng nhập một mô-đun sẽ làm mô-đun thành mảnh riêng và vượt 170 tệp precache.
//
// MÁY KHÁCH KHÔNG TỰ XẾP MỨC: mọi số (`ma`, `giay`, `giayDoc`, `sanNghi`, `thuong`) do máy chủ gửi (server/src/muc-lam.ts, một nguồn duy nhất); lượt thiếu `mucLam` ⇒
// "Chưa có số đo", không đoán. Bản học sinh / phụ huynh đã được máy chủ lọc (lượt ĐÚNG ở Mức làm 1–2 không mang mức; tổng chỉ tính phần em thấy; không ghi chú riêng của thầy).
// MÀU: Mức làm 1 → 4 là MỘT dải xanh theo độ đậm (CSS: --hslc-m1..4 từ --gvm-xd). Không màu nào là kênh duy nhất: luôn có chữ "Mức làm N" + ký hiệu bốn vạch.
import type { ReactNode } from 'react'
import type { KetQuaLichSuLamCau, MucLamLuot, TongMucLam } from '../../lib/lich-su-lam-cau-api'

// ------------------------------------------------------------------ KIỂM KHUNG DỮ LIỆU (chạy một lần khi tấm nạp xong lịch sử)
const so = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null)

/** Mức làm của một lượt (máy chủ đã xếp). Thiếu / sai kiểu ⇒ undefined ("Chưa có số đo") — KHÔNG tự suy lại ở máy khách. */
export function docMucLam(x: unknown): MucLamLuot | undefined {
  if (!x || typeof x !== 'object') return undefined
  const o = x as Record<string, unknown>
  const ma = so(o.ma), giay = so(o.giay), giayDoc = so(o.giayDoc), sanNghi = so(o.sanNghi), thuong = so(o.thuong), ranh2 = so(o.ranh2), ranh3 = so(o.ranh3), ranh4 = so(o.ranh4)
  if (ma === null || ![1, 2, 3, 4].includes(ma) || giay === null || giay < 1 || giayDoc === null || giayDoc < 0 || sanNghi === null || sanNghi < 0 || ranh2 === null || ranh2 < 0 || ranh3 === null || ranh3 < ranh2) return undefined
  return {
    ma: ma as MucLamLuot['ma'],
    giay,
    giayDoc,
    sanNghi,
    ranh2,
    ranh3,
    ...(ranh4 !== null && ranh4 >= 0 ? { ranh4 } : {}),
    ...(thuong !== null && thuong > 0 ? { thuong } : {}),
    ...(o.xapXi === true ? { xapXi: true as const } : {}),
    ...(o.uocTinh === 'cu' || o.uocTinh === 'uoc' ? { uocTinh: o.uocTinh } : {}),
    ...(o.ghiChu === 'dung_truoc_doc' ? { ghiChu: 'dung_truoc_doc' as const } : {}),
  }
}

/** Tổng Mức làm (máy chủ đã gộp). Thiếu khung bốn dòng ⇒ undefined (không vẽ khối "Cách làm bài"). */
export function docTongMucLam(x: unknown): TongMucLam | undefined {
  if (!x || typeof x !== 'object') return undefined
  const o = x as Record<string, unknown>
  const t = o.theoMuc
  if (!Array.isArray(t) || t.length !== 4) return undefined
  const dong = t.map((r, i) => {
    const q = r && typeof r === 'object' ? (r as Record<string, unknown>) : {}
    const luot = so(q.luot), dung = so(q.dung), sai = so(q.sai)
    return q.ma === i + 1 && luot !== null && dung !== null && sai !== null ? { ma: (i + 1) as MaMuc, luot, dung, sai } : null
  })
  const soDo = so(o.soDo), chuaCoSoDo = so(o.chuaCoSoDo), saiLamVoi = so(o.saiLamVoi), saiDuNghi = so(o.saiDuNghi), dungTruocDoc = so(o.dungTruocDoc)
  if (dong.some((d) => d === null) || soDo === null || chuaCoSoDo === null || saiLamVoi === null || saiDuNghi === null || dungTruocDoc === null) return undefined
  return { soDo, chuaCoSoDo, theoMuc: dong as TongMucLam['theoMuc'], saiLamVoi, saiDuNghi, dungTruocDoc, coBetaThat: o.coBetaThat === true, soUocTinh: Math.min(soDo, Math.max(0, so(o.soUocTinh) ?? 0)) }
}

/** Kiểm khung `mucLam` của cả kết quả lịch sử: lượt / tổng sai khung ⇒ bỏ (không bịa). Không có mức ở đâu ⇒ trả NGUYÊN đối tượng. */
export function chuanHoaMucLam(kq: KetQuaLichSuLamCau): KetQuaLichSuLamCau {
  const { mucLam: tho, ...con } = kq
  const tong = docTongMucLam(tho)
  const lan = kq.lan.map((l) => {
    if (l.mucLam === undefined) return l
    const { mucLam: m, ...phan } = l
    const muc = docMucLam(m)
    return muc ? { ...phan, mucLam: muc } : phan
  })
  return { ...con, lan, ...(tong ? { mucLam: tong } : {}) }
}

export type MaMuc = 1 | 2 | 3 | 4
export type CheDoMuc = 'thay' | 'hoc-sinh' | 'phu-huynh'

/** Tên mức cho thầy (chuẩn từ ngữ của đặc tả). */
export const TEN_MUC_THAY: Readonly<Record<MaMuc, string>> = { 1: 'Chưa đọc hết đề', 2: 'Đọc xong, chưa kịp nghĩ', 3: 'Có nghĩ', 4: 'Làm kỹ' }
/** Tên mức cho học sinh / phụ huynh: tả việc đã làm, không nhãn năng lực (đặc tả mục 7-D). */
export const TEN_MUC_EM: Readonly<Record<MaMuc, string>> = { 1: 'Nộp trước khi đọc hết đề', 2: 'Đọc xong thì nộp ngay', 3: 'Có thời gian nghĩ', 4: 'Làm kỹ, đúng nhịp lớp' }
export const tenMucLam = (ma: MaMuc, cheDo: CheDoMuc): string => (cheDo === 'thay' ? TEN_MUC_THAY[ma] : TEN_MUC_EM[ma])

export const CHU_CHUA_CO_SO_DO = 'Chưa có số đo'
const GIAI_THICH_CHUA_CO_SO_DO = 'Lượt không có số giây đáng tin (nộp cả lô, chưa từng bấm giờ) hoặc câu chưa tính kích thước đề — chưa xếp Mức làm, không đoán.'
/** Giải thích dấu "≈": số giây lấy từ đồng hồ cũ / ước tính, chỉ có thể DƯ (không thể thiếu) ⇒ mức có thể thấp hơn, không bao giờ Mức làm 4. */
export const GIAI_THICH_UOC_TINH = 'Số giây từ đồng hồ cũ hoặc ước tính từ khoảng cách giữa hai lần trả lời — có thể cao hơn thật, nên mức chỉ là ước tính và không xếp Mức làm 4.'
const NHAN_UOC_TINH: Readonly<Record<'cu' | 'uoc', string>> = { cu: 'Giây đo bằng đồng hồ cũ, có thể dư.', uoc: 'Giây ước tính từ khoảng cách hai lần trả lời liên tiếp, có thể dư.' }

/** Ranh giới bốn mức trên thước (giây) + độ dài thước. RANH GIỚI do máy chủ gửi (`ranh2/3/4` — một nguồn với cách xếp mức); ở đây chỉ chọn độ dài thước. Thuần. */
export function mocThuoc(m: Pick<MucLamLuot, 'giay' | 'ranh2' | 'ranh3' | 'ranh4'>): { bien1: number; bien2: number; bien4: number | null; ketMuc3: number; toiDa: number } {
  const bien4 = m.ranh4 ?? null
  const ketMuc3 = bien4 === null ? 0 : Math.max(m.ranh3, bien4)
  const cao = bien4 === null ? m.ranh3 : ketMuc3
  const toiDa = Math.max(40, Math.ceil(Math.max(m.giay * 1.12, cao * 1.45) / 10) * 10)
  return { bien1: m.ranh2, bien2: m.ranh3, bien4, ketMuc3, toiDa }
}

/** Ký hiệu bốn vạch (n vạch tô) — dùng được cả khi không phân biệt màu. */
export function PipMuc({ n }: { n: MaMuc }) {
  return (
    <span className="hslc-pip" data-n={n} aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  )
}

/** Chip "Mức làm N" (+ tên mức khi `dai`). `uoc` = mức xếp từ giây cũ / ước tính ⇒ "≈ Mức làm N" (dấu ≈ là chữ, không dựa vào màu). */
export function ChipMuc({ ma, cheDo, dai = false, uoc = false }: { ma: MaMuc; cheDo: CheDoMuc; dai?: boolean; uoc?: boolean }) {
  return (
    <span className="hslc-chip-m" data-m={ma} {...(uoc ? { 'data-uoc': '', title: GIAI_THICH_UOC_TINH } : {})}>
      <PipMuc n={ma} />
      <b>
        {uoc ? '≈ ' : ''}Mức làm {ma}
      </b>
      {dai && (
        <>
          {' '}
          <span className="hslc-chip-m-ten">{tenMucLam(ma, cheDo)}</span>
        </>
      )}
    </span>
  )
}

/** Chip nét đứt "Chưa có số đo" — trạng thái chính những ngày đầu (phần lớn lịch sử chưa có mức). */
export function ChipChuaCoSoDo({ chuThich = GIAI_THICH_CHUA_CO_SO_DO }: { chuThich?: string }) {
  return (
    <span className="hslc-chip-m hslc-chip-m--chua" title={chuThich}>
      <b>{CHU_CHUA_CO_SO_DO}</b>
    </span>
  )
}

/** Thước giây của một lượt: bốn đoạn Mức làm 1–4, vạch đứng = thời gian đọc hết đề, chấm = giây của em. */
export function ThuocMuc({ m }: { m: MucLamLuot }) {
  const k = mocThuoc(m)
  const p = (x: number) => Math.min(100, Math.max(0, (100 * x) / k.toiDa))
  const doan: [MaMuc, number, number][] = [
    [1, 0, k.bien1],
    [2, k.bien1, k.bien2],
    [3, k.bien2, k.bien4 === null ? k.toiDa : k.ketMuc3],
    ...(k.bien4 === null ? [] : ([[4, k.ketMuc3, k.toiDa]] as [MaMuc, number, number][])),
  ]
  const ten = `Làm ${m.uocTinh ? 'khoảng ' : ''}${m.giay} giây; đọc hết đề cần ${m.xapXi ? 'khoảng ' : ''}${m.giayDoc} giây; có thời gian nghĩ từ ${k.bien2} giây${k.bien4 !== null ? `; làm kỹ từ ${k.bien4} giây` : ''}`
  return (
    <span className="hslc-thuoc-m" role="img" aria-label={ten}>
      <span className="hslc-thuoc-m-z">
        {doan.map(([ma, a, b]) => (
          <i key={ma} data-m={ma} style={{ left: `${p(a)}%`, width: `${Math.max(0, p(b) - p(a))}%` }} />
        ))}
        <u style={{ left: `${p(m.giayDoc)}%` }} />
        <b style={{ left: `${p(m.giay)}%` }} />
      </span>
    </span>
  )
}

/** Dòng chữ dưới chip: "14 giây · đọc hết đề cần 23 giây" (câu chỉ ảnh: "≈"; giây cũ / ước tính: "≈ 14 giây"). */
export function chuGiayVaDoc(m: Pick<MucLamLuot, 'giay' | 'giayDoc' | 'xapXi' | 'uocTinh'>): string {
  return `${m.uocTinh ? '≈ ' : ''}${m.giay} giây · đọc hết đề cần ${m.xapXi ? '≈ ' : ''}${m.giayDoc} giây`
}

/** Phần Mức làm của MỘT dòng lịch sử: dòng giây + thước (+ ghi chú đúng-trước-khi-đọc, chỉ thầy — máy chủ không gửi cho em / phụ huynh). */
export function MucCuaLuot({ m, cheDo }: { m: MucLamLuot; cheDo: CheDoMuc }) {
  return (
    <span className="hslc-muc-luot">
      <span className="hslc-muc-luot-dong">
        <ChipMuc ma={m.ma} cheDo={cheDo} dai uoc={!!m.uocTinh} />{' '}
        <span className="hslc-muc-luot-so gvv2-so">{chuGiayVaDoc(m)}</span>
      </span>
      <ThuocMuc m={m} />
      {cheDo === 'thay' && m.uocTinh && <span className="hslc-muc-luot-ghi">{NHAN_UOC_TINH[m.uocTinh]}</span>}
      {cheDo === 'thay' && m.ghiChu === 'dung_truoc_doc' && <span className="hslc-muc-luot-ghi">Đúng trước khi đọc hết đề: ghi chú riêng, không tính là vội.</span>}
    </span>
  )
}

/** Chú giải một dòng (thầy): bốn màu + vạch + chấm. */
export function ChuGiaiThuoc() {
  return (
    <p className="hslc-chu-giai-m" aria-label="Chú giải thước Mức làm">
      {([1, 2, 3, 4] as MaMuc[]).map((ma) => (
        <span key={ma}>
          <i data-m={ma} aria-hidden="true" />
          {ma === 1 ? 'Mức làm 1' : ma}
        </span>
      ))}
      <span>
        <u aria-hidden="true" />
        Đọc hết đề
      </span>
      <span>
        <b aria-hidden="true" />
        Giây em làm
      </span>
    </p>
  )
}

/** Cách tính (thầy, mở/đóng — "i" của bản vẽ). Số sàn nghĩ là TẠM (đặc tả mục 3): đổi ở server/src/muc-lam.ts thì đổi chữ ở đây. */
export function CachTinhMuc() {
  return (
    <details className="hslc-cach">
      <summary className="tt-nhan">Cách tính Mức làm</summary>
      <p>
        Thời gian đọc hết đề tính theo độ dài câu: 8 giây + 0,35 giây mỗi từ + 10 giây nếu có hình. Mức làm 1: giây làm ít hơn thời gian đọc hết đề. Mức làm 2: đã đọc xong nhưng chưa đủ thời gian nghĩ (sàn nghĩ theo phần: phần I 6 giây,
        phần II 12 giây, phần III 15 giây). Mức làm 3: có thời gian nghĩ. Mức làm 4: làm từ 0,8 lần thời gian thường của lớp ở câu ấy — chỉ xếp khi lớp đã đủ mẫu của câu. Lượt đo bằng đồng hồ mới cho mức chắc chắn. Lượt cũ có số giây từ đồng hồ cũ, hoặc ước tính từ khoảng cách giữa hai lần trả lời liên tiếp, xếp kèm dấu ≈ (số giây chỉ có thể dư, nên tối đa Mức làm 3). Lượt nộp cả lô hoặc chưa từng bấm giờ ghi “Chưa có số đo”, không đoán.
      </p>
    </details>
  )
}

const phanTram = (tu: number, mau: number): number => (mau > 0 ? Math.round((100 * tu) / mau) : 0)

/** Thanh chồng bốn mức theo số lượt (kèm chữ số trên từng đoạn — không dựa vào màu). */
function ThanhMuc({ dem, ten }: { dem: readonly number[]; ten: string }) {
  const co = dem.some((n) => n > 0)
  if (!co) return null
  return (
    <div className="hslc-tm" role="img" aria-label={dem.map((n, i) => `Mức làm ${i + 1}: ${n} lượt${ten}`).join('; ')}>
      {dem.map((n, i) =>
        n > 0 ? (
          <i key={i} data-m={i + 1} style={{ flex: n }}>
            <b>{n}</b>
          </i>
        ) : null,
      )}
    </div>
  )
}

export interface PropsCachLamBai {
  tong: TongMucLam
  cheDo: CheDoMuc
  /** 'em' (thầy, học sinh) hoặc 'con' (phụ huynh). */
  ngoi: 'em' | 'con'
  /** Bản học sinh / phụ huynh: số lượt không đúng (sai + bỏ trống) của cả sổ — mẫu số của "đo được N/M lượt sai". */
  soSaiTong?: number
}

/** Khối "Cách làm bài": thầy = đo được N/M, thanh 4 mức, bảng đúng/sai theo mức, hai số "làm vội / đã nghĩ"; học sinh / phụ huynh = chỉ lượt SAI, chữ nhẹ, không nhãn năng lực. */
export function KhoiCachLamBai({ tong, cheDo, ngoi, soSaiTong }: PropsCachLamBai) {
  const laThay = cheDo === 'thay'
  const tongLuot = tong.soDo + tong.chuaCoSoDo
  const soSaiCoMuc = tong.saiLamVoi + tong.saiDuNghi
  let than: ReactNode
  if (tong.soDo === 0) {
    // Chưa lượt nào có số đo: trạng thái CHÍNH vài ngày đầu — viền nét đứt, một dòng lý do, không đoán mức.
    than = (
      <div className="hslc-cl-trong">
        <ChipChuaCoSoDo />{' '}
        <p>
          {laThay
            ? `Chưa lượt nào của ${ngoi} có số đo Mức làm${tong.chuaCoSoDo > 0 ? ` (${tong.chuaCoSoDo} lượt chưa có số đo)` : ''}. Từ khi máy ${ngoi} nạp bản mới, mức hiện ở đây.`
            : `Chưa có lượt nào có số đo Mức làm. Từ khi máy ${ngoi} nạp bản mới, mức hiện ở đây.`}
        </p>
      </div>
    )
  } else if (laThay) {
    than = (
      <>
        <p className="hslc-cl-do gvv2-so">
          Đo được <b>{tong.soDo}</b>/<b>{tongLuot}</b> lượt
          {tong.chuaCoSoDo > 0 ? (
            <>
              {' '}
              · <b>{tong.chuaCoSoDo}</b> lượt chưa có số đo
            </>
          ) : null}
          .
        </p>
        <ThanhMuc dem={tong.theoMuc.map((r) => r.luot)} ten="" />
        <ul className="hslc-cl-cheo gvv2-so" aria-label="Mức làm theo đúng và sai">
          <li className="hslc-cl-cheo-d" aria-hidden="true">
            <span />
            <i>Đúng</i>
            <i>Sai</i>
          </li>
          {tong.theoMuc.map((r) => (
            <li key={r.ma} data-m={r.ma}>
              <span className="hslc-cl-cheo-ten">
                <ChipMuc ma={r.ma} cheDo={cheDo} />{' '}
                <small>{TEN_MUC_THAY[r.ma]}</small>
              </span>{' '}
              <i>
                <span className="gvv2-an-chu">Đúng </span>
                {r.dung}
              </i>{' '}
              <i data-sai="">
                <span className="gvv2-an-chu">Sai </span>
                {r.sai}
              </i>
            </li>
          ))}
          <li className="hslc-cl-cheo-t">
            <span>Cộng</span>{' '}
            <i>{tong.theoMuc.reduce((a, r) => a + r.dung, 0)}</i>{' '}
            <i data-sai="">{tong.theoMuc.reduce((a, r) => a + r.sai, 0)}</i>
          </li>
        </ul>
        <div className="hslc-cl-hai">
          <p>
            <b className="gvv2-so">{soSaiCoMuc > 0 ? `${tong.saiLamVoi}/${soSaiCoMuc}` : '—'}</b>{' '}
            <span>
              lượt sai là lúc làm vội (Mức làm 1–2){soSaiCoMuc > 0 ? `, ${phanTram(tong.saiLamVoi, soSaiCoMuc)}%` : ''}
            </span>
          </p>
          <p>
            <b className="gvv2-so">{soSaiCoMuc > 0 ? `${tong.saiDuNghi}/${soSaiCoMuc}` : '—'}</b>{' '}
            <span>
              lượt sai dù đã nghĩ (Mức làm 3–4){soSaiCoMuc > 0 ? `, ${phanTram(tong.saiDuNghi, soSaiCoMuc)}%` : ''}
            </span>
          </p>
        </div>
        {tong.soUocTinh > 0 && (
          <p className="hslc-ghi" data-uoc="">
            {tong.soUocTinh} lượt xếp từ số giây đồng hồ cũ hoặc ước tính (≈): số giây có thể cao hơn thật nên mức chỉ là ước tính, không xếp Mức làm 4.
          </p>
        )}
        {tong.dungTruocDoc > 0 && <p className="hslc-ghi">{tong.dungTruocDoc} lượt đúng nộp trước khi đọc hết đề. Chỉ ghi chú, không tính là vội.</p>}
        {!tong.coBetaThat && <p className="hslc-ghi">Lớp chưa đủ mẫu của các câu này để xếp Mức làm 4.</p>}
        <CachTinhMuc />
      </>
    )
  } else {
    // Học sinh / phụ huynh: chỉ lượt SAI (không cột Đúng, không nhãn năng lực) — số đo thấp hơn số lượt sai thật vì lượt chưa có số đo không tính.
    const mau = Math.max(soSaiCoMuc, soSaiTong ?? soSaiCoMuc)
    than = (
      <>
        <p className="hslc-cl-do gvv2-so">
          Trong <b>{soSaiCoMuc}</b> lượt sai có số đo, <b>{tong.saiLamVoi}</b> lượt {ngoi} nộp trước khi kịp nghĩ (nộp khi chưa đọc hết đề hoặc vừa đọc xong). <b>{tong.saiDuNghi}</b> lượt sai còn lại {ngoi} đã dành thời gian nghĩ.
        </p>
        <ThanhMuc dem={tong.theoMuc.map((r) => r.sai)} ten=" sai" />
        <ul className="hslc-cl-em gvv2-so">
          {tong.theoMuc.map((r) => (
            <li key={r.ma} data-m={r.ma}>
              <ChipMuc ma={r.ma} cheDo={cheDo} />{' '}
              <span className="hslc-cl-em-ten">{TEN_MUC_EM[r.ma]}</span>{' '}
              <b className="hslc-cl-em-luot">{r.sai} lượt sai</b>
            </li>
          ))}
        </ul>
        <p className="hslc-ghi">
          Đo được {soSaiCoMuc}/{mau} lượt sai.{mau > soSaiCoMuc ? ` ${mau - soSaiCoMuc} lượt sai chưa có số đo (chưa có số giây đáng tin để xếp).` : ''}
        </p>
        {tong.soUocTinh > 0 && <p className="hslc-ghi" data-uoc="">Lượt có dấu ≈ lấy số giây từ đồng hồ cũ hoặc ước tính, có thể cao hơn thật.</p>}
      </>
    )
  }
  return (
    <section className="hslc-khoi-con hslc-cl" aria-labelledby="hslc-cl-tieu" data-che-do={cheDo}>
      <h4 id="hslc-cl-tieu" className="hslc-tieu-nho">
        Cách làm bài <small>· Mức làm 1–4 từng lượt{ngoi === 'con' ? ' của con' : ''}</small>
      </h4>
      {than}
    </section>
  )
}

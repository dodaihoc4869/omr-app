// "CA NÀY KIỂM TRA GÌ" — cột phải màn Chiếu mã vào thi (bản vẽ thầy duyệt 06/10). Biểu đồ SVG thuần, mọi biểu đồ ghi SỐ trực tiếp
// (màu không phải kênh duy nhất) và có aria-label. Màu qua class `.km-c-*` (chieu-ma-kiem-tra.css), không hex thô.
import type { ChiTietBieuDo, MoTaCaChieuMa } from '../../lib/mo-ta-ca-chieu-ma'
import '../chieu-ma-kiem-tra.css'

const BAN_KINH = 90
const CHU_VI = 2 * Math.PI * BAN_KINH

/** Vòng tròn: mỗi đoạn một cung; số tổng ở giữa, chú thích bên dưới ghi số từng đoạn. */
export function VongTron({ vong }: { vong: MoTaCaChieuMa['vong'] }) {
  const tong = vong.tong
  const khe = vong.doan.length > 1 ? 3 : 0
  let cong = 0
  return (
    <figure className="km-khung km-vong" aria-label={vong.aria}>
      <figcaption>{vong.tieuDe}</figcaption>
      <div className="km-vong-hinh">
        <svg viewBox="0 0 240 240" aria-hidden="true">
          <circle className="km-vong-nen" cx="120" cy="120" r={BAN_KINH} fill="none" strokeWidth="36" />
          {tong > 0 &&
            vong.doan.map((d) => {
              const dai = (d.so / tong) * CHU_VI
              const phan = (
                <circle
                  key={d.nhan}
                  className={`km-c-${d.mau} km-net`}
                  cx="120"
                  cy="120"
                  r={BAN_KINH}
                  fill="none"
                  strokeWidth="36"
                  strokeDasharray={`${Math.max(dai - khe, 0.5).toFixed(2)} ${CHU_VI.toFixed(2)}`}
                  strokeDashoffset={(-cong).toFixed(2)}
                  transform="rotate(-90 120 120)"
                />
              )
              cong += dai
              return phan
            })}
        </svg>
        <div className="km-vong-giua">
          <b>{tong > 0 ? tong : '—'}</b>
          <span>{vong.don}</span>
        </div>
      </div>
      <ul className="km-chuthich">
        {vong.doan.map((d) => (
          <li key={d.nhan}>
            <i className={`km-c-${d.mau} km-o`} aria-hidden="true" />
            <span>{d.nhan}</span>
            <b>{d.so}</b>
          </li>
        ))}
      </ul>
    </figure>
  )
}

function KhungChiTiet({ ct }: { ct: ChiTietBieuDo }) {
  if (ct.kieu === 'thanh') {
    return (
      <div className="km-thanh-ds">
        {ct.thanh.map((b) => (
          <div key={b.ten} className="km-thanh">
            <div className="km-thanh-dau">
              <span>{b.ten}</span>
              <b>{b.tong} câu</b>
            </div>
            <div className="km-thanh-cot" style={{ width: `${b.rong}%` }}>
              {b.doan.map((d) => (
                <i key={d.mau} className={`km-c-${d.mau} km-doan`} style={{ flex: `${d.so} 1 0` }} />
              ))}
            </div>
            <div className="km-ghi">{b.ghiChu}</div>
          </div>
        ))}
      </div>
    )
  }
  if (ct.kieu === 'thang') {
    return (
      <ol className="km-thang">
        {ct.thang.map((t) => (
          <li key={t.n}>
            <span className={`km-c-${t.mau} km-so-tron`}>{t.n}</span>
            <div>
              <div className="km-thang-ten">{t.ten}</div>
              <div className="km-ghi">{t.phu}</div>
            </div>
          </li>
        ))}
      </ol>
    )
  }
  const max = Math.max(1, ...ct.hang.flatMap((h) => h.o))
  return (
    <div className="km-luoi" role="table" aria-label={ct.tieuDe}>
      <div className="km-luoi-hang km-luoi-dau" role="row">
        <span className="km-luoi-ten" />
        {ct.cot.map((c) => (
          <span key={c} role="columnheader">
            {c}
          </span>
        ))}
        <span className="km-luoi-cong" role="columnheader">
          Cộng
        </span>
      </div>
      {ct.hang.map((h) => (
        <div key={h.ten} className="km-luoi-hang" role="row">
          <span className="km-luoi-ten" role="rowheader">
            {h.ten}
          </span>
          {h.o.map((v, i) => (
            <span
              key={i}
              role="cell"
              className={v === 0 ? 'km-o-luoi km-o-trong' : 'km-o-luoi'}
              style={v === 0 ? undefined : { ['--do' as string]: (0.22 + 0.78 * (v / max)).toFixed(2) }}
            >
              {v}
            </span>
          ))}
          <span className="km-luoi-cong" role="cell">
            {h.tong}
          </span>
        </div>
      ))}
      <div className="km-ghi km-luoi-ghi">{ct.ghiChu}</div>
    </div>
  )
}

export default function KiemTraGi({ mo }: { mo: MoTaCaChieuMa }) {
  const tieuDeCt = mo.chiTiet.tieuDe
  return (
    <div className="km-phai" data-che-do={mo.cheDo}>
      <div className="km-dau-phai">
        <p className="km-tag">
          <i className={`km-c-${mo.mauTag} km-o`} aria-hidden="true" />
          <span>{mo.tag}</span>
        </p>
        <h1 className="km-tieu-de">{mo.tieuDe}</h1>
        <p className="km-mo-ta">{mo.moTa}</p>
      </div>
      <div className="km-hang3">
        <VongTron vong={mo.vong} />
        <figure className="km-khung km-chi-tiet" aria-label={tieuDeCt}>
          <figcaption>{tieuDeCt}</figcaption>
          <KhungChiTiet ct={mo.chiTiet} />
        </figure>
        <ul className="km-khung km-so-lieu" aria-label="Ba con số của ca">
          {mo.soLieu.map((f) => (
            <li key={f.nhan}>
              <b>{f.so}</b>
              <span>{f.nhan}</span>
            </li>
          ))}
        </ul>
      </div>
      <section className="km-khung km-why" aria-label="Vì sao ca này quan trọng">
        <h2>VÌ SAO CA NÀY QUAN TRỌNG</h2>
        <div className="km-why-ds">
          {mo.why.map((w) => (
            <div key={w.h}>
              <div className="km-why-h">{w.h}</div>
              <div className="km-why-t">{w.t}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

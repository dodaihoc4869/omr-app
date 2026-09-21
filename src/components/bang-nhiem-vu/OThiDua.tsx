// Ô "THI ĐUA HÔM NAY" (học sinh; phương án 8A, thầy chốt 21/09; mẫu docs/ban-ve-thi-dua-2109 + 4 sửa của Boss). MẶC ĐỊNH GỌN (≤ ~300 px ở 390): hàng bục 3 bạn thu nhỏ (ảnh thú thật + tên + số câu),
// dòng vị trí của em, nút "Làm thêm N câu là vượt M bạn", thẻ cam nhóm cuối (LUÔN hiện). Bấm tiêu đề / "Xem bảng thi đua" ⇒ mở bản ĐẦY ĐỦ tại chỗ (nhớ trong phiên). Em chưa làm câu nào ⇒ KHÔNG in hạng.
// Xếp theo SỰ CHĂM (không theo điểm); KHÔNG nêu tên ai chưa học; chỉ CHÍNH em thấy thẻ cam. Thiếu dữ liệu ⇒ không dựng. Không emoji; số có nhãn; đích chạm ≥ 48 px.
import { useState } from 'react'
import { ArrowUp, ChevronDown, ChevronUp, Flame, PawPrint, Target, Users } from 'lucide-react'
import { anhThu } from '../../game/than-thu-v2/dao/anh'
import { chuHangEm, chuaAiHoc, dungBuc, type ThuBan } from '../../lib/thi-dua'
import type { ViewThiDua } from '../../lib/use-thi-dua'

const KHOA_MO = 'omr_thi_dua_mo'
const docMo = (): boolean => {
  try {
    return sessionStorage.getItem(KHOA_MO) === '1'
  } catch {
    return false
  }
}
const ghiMo = (mo: boolean) => {
  try {
    sessionStorage.setItem(KHOA_MO, mo ? '1' : '0')
  } catch {
    /* máy chặn lưu: chỉ mất nhớ trạng thái */
  }
}
const MAU = ['--bnv-td-mau:var(--m3-primary-container);--bnv-td-mau-chu:var(--m3-on-primary-container)', '--bnv-td-mau:var(--m3-secondary-container);--bnv-td-mau-chu:var(--m3-on-secondary-container)', '--bnv-td-mau:var(--m3-tertiary-container);--bnv-td-mau-chu:var(--m3-on-tertiary-container)']
const kieuMau = (i: number): React.CSSProperties => Object.fromEntries(MAU[i]!.split(';').map((p) => p.split(':') as [string, string])) as React.CSSProperties

/** Ảnh thú THẬT của bạn (bản nhỏ 96 px, đúng dạng tiến hoá theo cấp); chưa chọn thú / không nhận ra ⇒ biểu tượng trung tính. */
function AnhThu({ thu }: { thu: ThuBan }) {
  return thu.chiSo !== null ? <img src={anhThu(thu.chiSo, thu.cap, true)} alt="" width={96} height={96} loading="lazy" decoding="async" draggable={false} /> : <PawPrint className="bnv-td-i" aria-hidden="true" />
}

export default function OThiDua({ v, onLam }: { v: ViewThiDua; onLam?: () => void }) {
  const [mo, setMo] = useState(docMo)
  const t = v.thiDua
  if (!t) return null
  const buc = dungBuc(t)
  const trong = chuaAiHoc(t)
  const em = chuHangEm(t)
  const chuaHoc = t.siSo - t.daHoc
  const doi = (m: boolean) => {
    setMo(m)
    ghiMo(m)
  }
  const nutLam = onLam && (em.them || t.cuaEm.hang === null || trong) && (
    <button type="button" className="bnv-td-nut bnv-td-nut--rong" onClick={onLam} data-vung="nut-lam-them">
      {em.them || (trong ? 'Làm câu đầu tiên hôm nay' : 'Làm câu đầu tiên vào bảng')}
    </button>
  )
  const theCam = t.cuaEm.nhomCuoi && (
    <div className="bnv-td-the-cam" role="group" aria-label="Thẻ của riêng em" data-vung="nhom-cuoi">
      <h3>
        <Target className="bnv-td-i" aria-hidden="true" />
        Em đang ở nhóm cuối lớp hôm nay
      </h3>
      {t.cuaEm.themDeVuot && <p className="bnv-td-so">{t.cuaEm.themDeVuot.soCau} câu là thoát nhóm cuối.</p>}
      {onLam && (
        <button type="button" className="bnv-td-nut" onClick={onLam}>
          {t.cuaEm.themDeVuot ? `Làm ${t.cuaEm.themDeVuot.soCau} câu ngay` : 'Làm câu ngay'}
        </button>
      )}
    </div>
  )
  const dauO = (
    <div className="bnv-td-dau">
      <button type="button" className="bnv-td-tieu-de" aria-expanded={mo} aria-controls="bnv-td-than" onClick={() => doi(!mo)}>
        <h2 id="bnv-td-t">Thi đua hôm nay</h2>
        <span className="bnv-td-mo">
          {mo ? 'Thu gọn' : 'Xem bảng thi đua'}
          {mo ? <ChevronUp className="bnv-td-i" aria-hidden="true" /> : <ChevronDown className="bnv-td-i" aria-hidden="true" />}
        </span>
      </button>
      <span className="bnv-td-song">
        <i aria-hidden="true" />
        Cập nhật mỗi phút
      </span>
      {mo && (
        <p style={{ flexBasis: '100%' }}>
          {t.lop ? `Lớp ${t.lop} · ` : ''}
          {t.siSo} bạn
        </p>
      )}
    </div>
  )

  if (!mo) {
    return (
      <section className="bnv-td bnv-td-o bnv-td-o--gon" aria-labelledby="bnv-td-t" data-vung="thi-dua" data-che-do="gon" data-trang-thai={trong ? 'dau-ngay' : 'co-bang'}>
        {dauO}
        <ol className="bnv-td-mini" aria-label="Ba bạn chăm nhất lúc này">
          {buc.map((b, i) => (
            <li key={i} className={`bnv-td-mini__ban${b?.laEm ? ' bnv-td-buc__ban--em' : ''}`} aria-label={b && !trong ? `Hạng ${b.hang}: ${b.ten}, ${b.soCau} câu hôm nay` : `Hạng ${i + 1}: còn trống`}>
              <span className="bnv-td-avt bnv-td-avt--nho" style={kieuMau(i)} aria-hidden="true">
                {b && !trong ? <AnhThu thu={b.thu} /> : <PawPrint className="bnv-td-i" />}
                <b>{i + 1}</b>
              </span>
              <span className="bnv-td-buc__ten">{b && !trong ? b.ten : 'Còn trống'}</span>
              <span className="bnv-td-mini__cau bnv-td-so">{b && !trong ? `${b.soCau} câu` : '0 câu'}</span>
            </li>
          ))}
        </ol>
        {v.vuot && !trong && (
          <p className="bnv-td-vuot" role="status" aria-live="polite" data-vung="vua-vuot">
            <ArrowUp className="bnv-td-i" aria-hidden="true" />
            <span>{v.vuot}</span>
          </p>
        )}
        <p className="bnv-td-dong-em bnv-td-so" data-vung="vi-tri-em">
          {trong ? 'Chưa bạn nào học hôm nay. Em làm câu đầu tiên là em dẫn đầu lớp.' : em.gon}
        </p>
        {nutLam}
        {theCam}
      </section>
    )
  }

  return (
    <section className="bnv-td bnv-td-o" aria-labelledby="bnv-td-t" id="bnv-td-than" data-vung="thi-dua" data-che-do="day-du" data-trang-thai={trong ? 'dau-ngay' : 'co-bang'}>
      {dauO}
      <ol className={`bnv-td-buc${trong ? ' bnv-td-buc--trong' : ''}`} aria-label="Ba bạn chăm nhất lúc này">
        {buc.map((b, i) =>
          trong || !b ? (
            <li key={i} className={`bnv-td-buc__ban bnv-td-buc__ban--${i + 1}`}>
              <span className="bnv-td-avt" aria-hidden="true">
                <PawPrint className="bnv-td-i" />
                <b style={{ background: 'var(--m3-surface-container-highest)', color: 'var(--bnv-td-nhat)' }}>{i + 1}</b>
              </span>
              <span className="bnv-td-buc__ten">Còn trống</span>
              <span className="bnv-td-buc__cau">
                <strong className="bnv-td-so">0</strong>câu hôm nay
              </span>
              <span className="bnv-td-buc__cot" />
            </li>
          ) : (
            <li key={i} className={`bnv-td-buc__ban bnv-td-buc__ban--${b.hang}${b.laEm ? ' bnv-td-buc__ban--em' : ''}`} aria-label={`Hạng ${b.hang}: ${b.ten}, ${b.soCau} câu hôm nay, chuỗi ${b.chuoi} ngày${b.thu.ten ? `, thần thú ${b.thu.ten}` : ''}`}>
              <span className="bnv-td-avt" style={kieuMau(i)} aria-hidden="true">
                <AnhThu thu={b.thu} />
                <b>{b.hang}</b>
              </span>
              <span className="bnv-td-buc__ten">{b.ten}</span>
              {b.thu.ten && <span className="bnv-td-buc__thu">{b.thu.ten}</span>}
              <span className="bnv-td-buc__cau">
                <strong className="bnv-td-so">{b.soCau}</strong>câu hôm nay
              </span>
              <span className="bnv-td-buc__chuoi">
                <Flame className="bnv-td-i" aria-hidden="true" />
                Chuỗi {b.chuoi} ngày
              </span>
              <span className="bnv-td-buc__cot" aria-hidden="true" />
            </li>
          ),
        )}
      </ol>

      {v.vuot && !trong && (
        <p className="bnv-td-vuot" role="status" aria-live="polite" data-vung="vua-vuot">
          <ArrowUp className="bnv-td-i" aria-hidden="true" />
          <span>{v.vuot}</span>
        </p>
      )}

      {trong ? (
        <div className="bnv-td-trong" data-vung="dau-ngay">
          <h3>Chưa bạn nào học hôm nay</h3>
          <p className="bnv-td-so">Em làm câu đầu tiên là em dẫn đầu lớp lúc này.</p>
        </div>
      ) : (
        <div className="bnv-td-em" data-vung="vi-tri-em">
          {t.cuaEm.hang !== null && (
            <div className="bnv-td-em__hang" role="img" aria-label={`Em đứng hạng ${t.cuaEm.hang} trong ${t.siSo} bạn`}>
              <b className="bnv-td-so">{t.cuaEm.hang}</b>
              <small>hạng của em</small>
            </div>
          )}
          <div className="bnv-td-em__chu">
            <h3>{em.tieuDe}</h3>
            <p className="bnv-td-so">{em.phu}</p>
            {em.them && (
              <span className="bnv-td-em__them">
                <ArrowUp className="bnv-td-i" aria-hidden="true" />
                {em.them}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="bnv-td-lop">
        <p className="bnv-td-lop__chu">
          <b className="bnv-td-so">
            {t.daHoc} trong {t.siSo} bạn
          </b>
          <span>đã học hôm nay</span>
        </p>
        <div className="bnv-td-lop__thanh" role="progressbar" aria-label="Số bạn đã học hôm nay" aria-valuemin={0} aria-valuemax={t.siSo} aria-valuenow={t.daHoc}>
          <i style={{ width: `${(t.daHoc / t.siSo) * 100}%` }} />
        </div>
      </div>

      {/* 8A: KHÔNG nêu tên ai chưa học — chỉ con số; thẻ cam CHỈ của chính em. */}
      {!trong && chuaHoc > 0 && (
        <p className="bnv-td-cuoi" data-vung="chua-hoc">
          <Users className="bnv-td-i" aria-hidden="true" />
          <span>
            <b className="bnv-td-so">{chuaHoc} bạn</b> chưa học hôm nay
          </span>
        </p>
      )}
      {nutLam}
      {theCam}
      <p className="bnv-td-chan">Xếp theo độ chăm hôm nay: số câu đã làm, rồi đã đạt nhiệm vụ ngày chưa, rồi chuỗi ngày học. Không xếp theo điểm. Cập nhật mỗi phút.</p>
    </section>
  )
}

// ĐOÀN HỘ TỐNG — SẢNH hằng ngày (bản vẽ 1) + phòng chờ khi đi cùng bạn. Khối nào cần số liệu mà máy chủ chưa trả (Đoàn lớp, vé,
// rương chuỗi, Trùm lớp, ấn thạch — bước 5 và 6) thì KHÔNG hiện: không bịa số.
import { useState } from 'react'
import type { ReactNode } from 'react'
import type { DoanXem } from './doan-kieu'
import { BieuTuong, LinhTamCau, QuaiHinh, ThuHinh } from './DoanHinh'

export interface GoiYHomNay { tong: number; nhom: { ten: string; so: number }[]; hetLuot: boolean }
interface Props {
  pet: number; cap: number; tenDoan: string; goiY: GoiYHomNay | null
  phong: DoanXem | null; ban: boolean; loi: string
  onLenDuong: () => void; onMoPhong: () => void; onVaoPhong: (ma: string) => void; onBatDau: () => void; onRoi: () => void; onDong: () => void
  khoiThem?: ReactNode
}

export default function DoanSanh(p: Props) {
  const [ma, setMa] = useState('')
  const sao = Array.from({ length: 26 }, (_, i) => <i key={i} style={{ left: `${(i * 53 + 17) % 100}%`, top: `${(i * 29 + 7) % 60}%`, animationDelay: `${(i % 7) * .4}s` }} />)
  return (
    <div className="dh-khung">
      <div className="dh-sao-nen" aria-hidden="true">{sao}</div>
      <header className="dh-dau">
        <div><div className="dh-nhan">HỘ TỐNG LINH TÂM · CẢ LỚP MỘT ĐOÀN</div><h1>{p.tenDoan}</h1></div>
        <button type="button" className="dh-nut-dong" onClick={p.onDong}>Về đảo</button>
      </header>

      <div className="dh-ban-do" aria-hidden="true">
        <div className="dh-trang" />
        <svg viewBox="0 0 358 250" preserveAspectRatio="none">
          <path d="M0 150 C60 118 110 160 170 132 S290 100 358 142 L358 250 L0 250Z" fill="rgba(10,30,50,.55)" />
          <path d="M120 214 C170 206 214 196 244 160 S300 96 332 60" stroke="rgba(255,255,255,.35)" strokeWidth="5" strokeDasharray="2 11" strokeLinecap="round" fill="none" />
          <path d="M120 214 C170 206 214 196 244 160" stroke="#7dffb0" strokeWidth="5" strokeLinecap="round" fill="none" style={{ filter: 'drop-shadow(0 0 6px rgba(125,255,176,.9))' }} />
          <polygon points="316,22 326,44 322,78 310,78 306,44" fill="#c8e6ff" opacity=".95" /><polygon points="298,38 306,52 306,78 294,78 292,54" fill="#9fd0ff" opacity=".9" /><polygon points="334,36 340,52 338,78 326,78 326,52" fill="#9fd0ff" opacity=".9" />
        </svg>
        <ThuHinh pet={p.pet} cap={p.cap} size={150} className="dh-thu-chinh dh-noi" />
        <LinhTamCau size={50} />
        <div className="dh-ban-do-nhan">Linh Tâm đang chờ đoàn của em</div>
      </div>

      {p.phong && !p.phong.batDau ? (
        <section className="dh-kinh dh-muc" aria-label="Phòng chờ của đoàn">
          <div className="dh-nhan">MÃ ĐOÀN · ĐỌC CHO BẠN NHẬP</div>
          <div className="dh-ma-to" aria-label={`Mã đoàn ${p.phong.ma}`}>{p.phong.ma}</div>
          <div className="dh-ds-ban">
            {[0, 1, 2, 3].map(i => { const g = p.phong!.ghe[i]; return g ? <div key={i}><ThuHinh pet={g.pet} cap={g.cap} size={54} />{g.laEm ? 'Em' : g.ten}</div> : <div key={i} className="dh-trong">ghế trống</div> })}
          </div>
          <p>Mỗi bạn sẽ nhận câu của RIÊNG mình từ hồ sơ học tập. Không ai thấy bạn chọn gì — chỉ thấy "đang làm", "đã chốt", "cần tiếp sức".</p>
          {p.loi && <div className="dh-loi" role="alert">{p.loi}</div>}
          {p.phong.laChu ? <button type="button" className="dh-nut-vang" disabled={p.ban} onClick={p.onBatDau}>{BieuTuong.choi}<span>{p.phong.ghe.length > 1 ? `LÊN ĐƯỜNG · ${p.phong.ghe.length} BẠN` : 'LÊN ĐƯỜNG CÙNG BẠN MÁY'}</span></button>
            : <p role="status" style={{ textAlign: 'center', fontWeight: 700 }}>Chờ bạn mở đoàn cho lên đường…</p>}
          <button type="button" className="dh-nut-mo" disabled={p.ban} onClick={p.onRoi}>Rời đoàn</button>
        </section>
      ) : (
        <>
          <section className="dh-chang" aria-label="Chặng hôm nay">
            <span className="dh-chang-nhan">CHẶNG HÔM NAY</span>
            <h2>Hộ tống Linh Tâm qua 8 hiệp</h2>
            <div className="dh-quai-goc" aria-hidden="true"><QuaiHinh loai="bun_acid" size={76} /></div>
            <p>
              {p.goiY?.hetLuot ? <>Em đã làm đủ 200 câu game hôm nay. Mai mình đi tiếp nhé.</>
                : p.goiY?.tong ? <>Câu của riêng em hôm nay: {p.goiY.nhom.map((n, i) => <span key={n.ten}>{i > 0 && ' · '}<b>{n.so} câu {n.ten}</b></span>)}. 8 hiệp · 5–6 phút.</>
                  : <>Mỗi hiệp em nhận MỘT câu vừa sức từ hồ sơ của chính em. Làm đúng thì ra đòn, làm sai thì thần thú tự chắn cho Linh Tâm. 8 hiệp · 5–6 phút.</>}
            </p>
            <div className="dh-chang-qua"><span className="dh-vien-thuoc">EXP thần thú</span><span className="dh-vien-thuoc">Liên Kích ×2 khi tiếp sức</span></div>
            {p.loi && <div className="dh-loi" role="alert">{p.loi}</div>}
            <button type="button" className="dh-nut-vang" disabled={p.ban || !!p.goiY?.hetLuot} onClick={p.onLenDuong}>{BieuTuong.choi}<span>{p.ban ? 'ĐANG MỞ ĐƯỜNG…' : 'LÊN ĐƯỜNG'}</span></button>
            <small>Đi một mình vẫn có bạn đồng hành do máy điều khiển · thua không mất gì</small>
          </section>
          {p.khoiThem}
          <section className="dh-kinh dh-muc" aria-label="Đi cùng bạn">
            <div className="dh-nhan">ĐI CÙNG BẠN · 2–4 BẠN MỘT ĐOÀN</div>
            <p>Ngồi cạnh nhau thì càng vui: bạn nào kẹt sẽ bật tín hiệu "cần tiếp sức", trùm thì cả đội cùng bàn một câu.</p>
            <button type="button" className="dh-nut-mo" disabled={p.ban || !!p.goiY?.hetLuot} onClick={p.onMoPhong}>Mở đoàn mới · lấy mã cho bạn</button>
            <form className="dh-ma-doan" onSubmit={e => { e.preventDefault(); if (ma.trim()) p.onVaoPhong(ma.trim().toUpperCase()) }}>
              <input aria-label="Mã đoàn của bạn" placeholder="Nhập mã đoàn của bạn" value={ma} maxLength={12} autoComplete="off" autoCapitalize="characters" onChange={e => setMa(e.target.value)} />
              <button type="submit" className="dh-nut-lam" disabled={p.ban || !ma.trim()}>Vào</button>
            </form>
          </section>
        </>
      )}
    </div>
  )
}

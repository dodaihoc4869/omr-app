// ĐOÀN HỘ TỐNG — SẢNH hằng ngày (bản vẽ 1) + phòng chờ khi đi cùng bạn. Khối nào cần số liệu mà máy chủ chưa trả (Đoàn lớp, vé,
// rương chuỗi, Trùm lớp, ấn thạch — bước 5 và 6) thì KHÔNG hiện: không bịa số.
import { useState } from 'react'
import type { ReactNode } from 'react'
import type { AnXem, BanDongHanhXem, DoanXem, SanhXem } from './doan-kieu'
import { BieuTuong, LinhTamCau, QuaiHinh, ThuHinh } from './DoanHinh'

// Bốn thứ đang tới (bước 5, 6). CỐ Ý không có con số nào: máy chủ chưa có số thì không bịa — chỉ tên, một dòng mô tả, biểu tượng khoá.
const SAP_MO = [
  ['Đoàn lớp', 'Mỗi chặng thắng đẩy Linh Tâm của cả lớp tiến một trạm trên bản đồ mùa.'],
  ['Rương chuỗi ngày', 'Đi đều mỗi ngày để mở rương — đứt chuỗi thì đếm lại.'],
  ['Trùm lớp', '20:00 · Chủ nhật, cả lớp cùng online đánh trùm mùa.'],
  ['Ấn thạch dạng', 'Khắc phục xong một dạng bài thì ấn sáng, mở biến thể kỹ năng.'],
] as const
export interface GoiYHomNay { tong: number; nhom: { ten: string; so: number }[]; hetLuot: boolean }
interface Props {
  pet: number; cap: number; tenDoan: string; goiY: GoiYHomNay | null; sanh: SanhXem | null; anThach?: AnXem | null; banDongHanh?: BanDongHanhXem | null
  phong: DoanXem | null; ban: boolean; loi: string
  onLenDuong: () => void; onMoPhong: () => void; onVaoPhong: (ma: string) => void; onBatDau: () => void; onRoi: () => void; onDong: () => void
  khoiThem?: ReactNode
}

const hen = (ms: number) => { const gio = Math.floor(ms / 3_600_000), ngay = Math.floor(gio / 24); return ngay > 0 ? `còn ${ngay} ngày ${gio % 24} giờ` : gio > 0 ? `còn ${gio} giờ ${Math.floor(ms / 60_000) % 60} phút` : `còn ${Math.max(1, Math.ceil(ms / 60_000))} phút` }

export default function DoanSanh(p: Props) {
  const [ma, setMa] = useState('')
  const s = p.sanh, lop = s?.doanLop, hetVe = !!s && !s.mienPhiHomNay && !s.ve, an = p.anThach && p.anThach.ds.length ? p.anThach : null, bdh = p.banDongHanh
  const sao = Array.from({ length: 26 }, (_, i) => <i key={i} style={{ left: `${(i * 53 + 17) % 100}%`, top: `${(i * 29 + 7) % 60}%`, animationDelay: `${(i % 7) * .4}s` }} />)
  return (
    <div className="dh-khung">
      <div className="dh-sao-nen" aria-hidden="true">{sao}</div>
      <header className="dh-dau">
        <div><div className="dh-nhan">{s ? `MÙA ${s.mua.so} · CÒN ${s.mua.conNgay} NGÀY` : 'HỘ TỐNG LINH TÂM · CẢ LỚP MỘT ĐOÀN'}</div><h1>{s?.tenDoan ?? p.tenDoan}</h1></div>
        <div className="dh-dau-phai">
          {s && s.ve !== null && <span className="dh-the-so dh-the-ve" aria-label={`Em có ${s.ve} vé hộ tống`}>🎟 {s.ve}</span>}
          {s && s.chuoi.ngay > 0 && <span className="dh-the-so dh-the-chuoi" aria-label={`Chuỗi ${s.chuoi.ngay} ngày`}>🔥 {s.chuoi.ngay}</span>}
          <button type="button" className="dh-nut-dong" aria-label="Về Đảo thần thú" title="Về Đảo thần thú" onClick={p.onDong}>✕</button>
        </div>
      </header>

      <div className="dh-ban-do" aria-hidden="true">
        <div className="dh-trang" />
        <svg viewBox="0 0 358 250" preserveAspectRatio="none">
          <path d="M0 150 C60 118 110 160 170 132 S290 100 358 142 L358 250 L0 250Z" fill="rgba(10,30,50,.55)" />
          <path d="M120 214 C170 206 214 196 244 160 S300 96 332 60" stroke="rgba(255,255,255,.35)" strokeWidth="5" strokeDasharray="2 11" strokeLinecap="round" fill="none" />
          <path d="M120 214 C170 206 214 196 244 160 S300 96 332 60" stroke="rgb(125,255,176)" pathLength={100} strokeDasharray={`${lop ? Math.max(4, Math.round(lop.tram * 100 / lop.tongTram)) : 46} 100`} strokeWidth="5" strokeLinecap="round" fill="none" style={{ filter: 'drop-shadow(0 0 6px rgba(125,255,176,.9))' }} />
          <polygon points="316,22 326,44 322,78 310,78 306,44" fill="rgb(200,230,255)" opacity=".95" /><polygon points="298,38 306,52 306,78 294,78 292,54" fill="rgb(159,208,255)" opacity=".9" /><polygon points="334,36 340,52 338,78 326,78 326,52" fill="rgb(159,208,255)" opacity=".9" />
        </svg>
        <ThuHinh pet={p.pet} cap={p.cap} size={150} className="dh-thu-chinh dh-noi" />
        <LinhTamCau size={50} />
        <div className="dh-ban-do-nhan">{lop ? `Trạm ${lop.tram}/${lop.tongTram}${lop.conTramToiMoc ? ` · còn ${lop.conTramToiMoc} trạm tới ${lop.tenMocKe}` : ' · đã về đích mùa này'}` : 'Linh Tâm đang chờ đoàn của em'}</div>
        {lop && <div className="dh-ban-do-gop"><b>{lop.gopSucHomNay}/{lop.siSo} bạn</b> góp sức hôm nay · còn {lop.conChangToiTramKe} chặng thắng nữa là lớp tiến một trạm</div>}
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
            <span className="dh-chang-nhan">{!s ? 'CHẶNG HÔM NAY' : s.mienPhiHomNay ? 'CHẶNG HÔM NAY · MIỄN PHÍ' : 'CHẶNG THÊM · 1 VÉ'}</span>
            <h2>Hộ tống Linh Tâm qua 8 hiệp</h2>
            <div className="dh-quai-goc" aria-hidden="true"><QuaiHinh loai="bun_acid" size={76} /></div>
            <p>
              {p.goiY?.hetLuot ? <>Em đã làm đủ 200 câu game hôm nay. Mai mình đi tiếp nhé.</>
                : p.goiY?.tong ? <>Câu của riêng em hôm nay: {p.goiY.nhom.map((n, i) => <span key={n.ten}>{i > 0 && ' · '}<b>{n.so} câu {n.ten}</b></span>)}. 8 hiệp · 5–6 phút.</>
                  : <>Mỗi hiệp em nhận MỘT câu vừa sức từ hồ sơ của chính em. Làm đúng thì ra đòn, làm sai thì thần thú tự chắn cho Linh Tâm. 8 hiệp · 5–6 phút.</>}
            </p>
            <div className="dh-chang-qua"><span className="dh-vien-thuoc">EXP thần thú</span><span className="dh-vien-thuoc">Liên Kích ×2 khi tiếp sức</span></div>
            {s?.quaMoi.map((q, i) => <div key={i} className="dh-qua-moi" role="status">＋{q.ve} vé · {q.ghiChu}</div>)}
            {p.loi && <div className="dh-loi" role="alert">{p.loi}</div>}
            <button type="button" className="dh-nut-vang" disabled={p.ban || !!p.goiY?.hetLuot || hetVe} onClick={p.onLenDuong}>{BieuTuong.choi}<span>{p.ban ? 'ĐANG MỞ ĐƯỜNG…' : hetVe ? 'HẾT VÉ HÔM NAY' : 'LÊN ĐƯỜNG'}</span></button>
            <small>{hetVe ? 'Hết vé? Làm xong nhiệm vụ hôm nay để nhận 2 vé · xong một chặng Bài tập về nhà đúng kế hoạch nhận 1 vé.' : s ? 'Chặng thêm tốn 1 vé · vé chỉ kiếm được bằng làm bài tập · thua không mất gì' : 'Đi một mình vẫn có bạn đồng hành do máy điều khiển · thua không mất gì'}</small>
          </section>
          {p.khoiThem}
          {s && (
            <div className="dh-hai-the">
              <section className="dh-kinh dh-muc" aria-label="Rương chuỗi ngày">
                <div className="dh-nhan" style={{ color: 'rgb(255,217,160)' }}>RƯƠNG CHUỖI NGÀY</div>
                <p>{s.chuoi.mocKe ? <>Còn <b style={{ color: 'rgb(255,209,102)' }}>{s.chuoi.conNgay} ngày</b> mở rương {s.chuoi.mocKe} ngày</> : <>Em đã mở đủ rương của chuỗi này.</>}{!s.chuoi.daDiHomNay && s.chuoi.ngay > 0 ? ' · đi chặng hôm nay để giữ chuỗi' : ''}</p>
                <div className="dh-chuoi-vach" role="img" aria-label={`Chuỗi ${s.chuoi.ngay} ngày`}>{Array.from({ length: 7 }, (_, i) => <i key={i} className={i < Math.min(7, s.chuoi.ngay) ? 'dh-xong' : ''} />)}</div>
              </section>
              <section className="dh-kinh dh-muc" aria-label="Trùm lớp">
                <div className="dh-nhan" style={{ color: 'rgb(217,200,255)' }}>TRÙM LỚP</div>
                {s.trumLop.dangMo || s.trumLop.daGop > 0 ? (
                  <>
                    <p><b style={{ color: 'rgb(255,255,255)' }}>{s.trumLop.daHa ? 'Lớp em đã hạ trùm!' : s.trumLop.dangMo ? `Đang mở · ${hen(s.trumLop.conMs)}` : 'Tối Chủ nhật vừa rồi'}</b><br />Cả lớp đã góp {s.trumLop.daGop}/{s.trumLop.mucTieu} sát thương</p>
                    <div className="dh-mau" style={{ height: 8 }}><i style={{ width: `${Math.min(100, Math.round(s.trumLop.daGop * 100 / Math.max(1, s.trumLop.mucTieu)))}%`, background: 'linear-gradient(90deg,rgb(183,156,255),rgb(255,138,92))' }} /></div>
                  </>
                ) : <p><b style={{ color: 'rgb(255,255,255)', fontSize: 16 }}>20:00 · Chủ nhật</b><br />Cả lớp cùng đánh 20 phút · {hen(s.trumLop.moSauMs)}</p>}
              </section>
            </div>
          )}
          {an && (
            <section className="dh-kinh dh-muc" aria-label="Ấn thạch dạng của em">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><div className="dh-nhan">ẤN THẠCH DẠNG CỦA EM</div><small style={{ color: 'rgb(159,178,217)' }}>sáng {an.sang} · nứt {an.nut}</small></div>
              <div className="dh-an">{an.ds.map(a => <div key={a.dang} className={a.trangThai === 'nut' ? 'dh-an-nut' : ''}><i aria-hidden="true" /><small>{a.ten}</small></div>)}</div>
              {an.ganSang ? <p>Ấn <b style={{ color: 'rgb(255,181,154)' }}>{an.ganSang.ten}</b> đang nứt: khắc phục thêm <b style={{ color: 'rgb(255,255,255)' }}>{an.ganSang.conCau} câu</b> là sáng → mở kỹ năng <span className="dh-chu-vang">{an.ganSang.kyNang}</span></p>
                : <p>Mọi ấn của em đều đang sáng. Câu thuộc dạng đã sáng thì Kỹ năng của thần thú mạnh hơn ×1,25.</p>}
            </section>
          )}
          {(!s || !an) && <section className="dh-sap-mo" aria-label="Sắp mở">
            {SAP_MO.filter(([ten]) => !s || (ten === 'Ấn thạch dạng' && !an)).map(([ten, moTa]) => (
              <div key={ten} className="dh-kinh">
                <span className="dh-khoa" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2.5" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>SẮP MỞ</span>
                <b>{ten}</b><small>{moTa}</small>
              </div>
            ))}
          </section>}
          {bdh && (
            <section className="dh-kinh dh-muc" aria-label="Bạn đồng hành hợp nhất hôm nay">
              <div className="dh-nhan">BẠN ĐỒNG HÀNH HỢP NHẤT HÔM NAY</div>
              <div className="dh-bu-nhau">
                <div><ThuHinh pet={p.pet} cap={p.cap} size={72} /><b>Em</b></div>
                <div className="dh-bu-nhau-giua"><span>{bdh.ten} vững {bdh.banVung} →</span><span className="dh-vang">← Em vững {bdh.emVung}</span></div>
                <div><ThuHinh pet={bdh.pet} cap={bdh.cap} size={72} quayTrai /><b>{bdh.ten}</b></div>
              </div>
              <p>Hai bạn bù nhau: đi cùng đoàn thì tiếp sức chảy hai chiều. Em mở đoàn rồi đọc mã cho {bdh.ten} nhé.</p>
            </section>
          )}
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

import {useState} from 'react'
import type {DongTac} from '../dien-hoat/kieu'
import type {KetQuaCau} from '../doan-kieu'
import XeLinhTam from '../XeLinhTam'
// ĐOÀN HỘ TỐNG · GAME HÓA 2.0 — nửa trên màn TRONG TRẬN theo bản vẽ Moi-DoanTran: cảnh hoàng hôn núi + đường + xe chở Linh Tâm phát sáng
// (vòng Máu quanh cầu), quái phục kích màu hồng, số sát thương đòn vừa rồi; HUD kính "HIỆP k/8" + vạch 8 hiệp có kim cương hiệp trùm + đồng hồ vòng;
// huy hiệu LIÊN KÍCH; đồng đội góc phải (CHỈ trạng thái, không bao giờ đáp án hay chữ "sai" của bạn). Mọi con số do máy chủ trả.
// Cảnh và xe dùng tranh đồng bộ; khung giữ tỉ lệ cố định. Vòng Máu vẫn theo dữ liệu máy chủ.
import NutToanManHinh from '../../../components/NutToanManHinh'
import { HE_LIEN_KICH, HIEP_TRUM, HP_QUAI } from '../doan-core'
import { CHU_TRANG_THAI, type DoanXem, type TranXem } from '../doan-kieu'
import { ThuHinh } from '../DoanHinh'
import SanDauDienHoat from '../dien-hoat/SanDauDienHoat'

interface Props {
  xem: DoanXem; tran: TranXem
  /** Giây còn của hiệp (vẽ từ mốc máy chủ) và hiệp đã mở chưa. */ con: number; mo: boolean
  /** Số "ổ phục kích" (câu ôn) còn lại hôm nay theo `hoa2-sanh`; null = chưa biết ⇒ không hiện. */ oPhucKich: number | null
  onRoi: () => void;ketQua?:KetQuaCau|null;chan?:boolean
}

const R_DONG_HO = 21, C_DONG_HO = 2 * Math.PI * R_DONG_HO
/** Chỗ đứng của bạn trong cảnh (theo % khung tranh 390×340): em đứng trước, to nhất; bạn đứng sau, nhỏ hơn. */

export default function Canh2({ xem, tran, con, mo, oPhucKich, onRoi,ketQua,chan=false }: Props) {
  const em = xem.ghe.find(g => g.laEm), ban = xem.ghe.filter(g => !g.laEm)
  // Chỉ diễn đòn MỚI được máy chủ chấm; tải lại câu đã chốt không bắn lần hai.
  const khoaCau=`${tran.hiep}/${xem.cau?.qid??''}`,dung=(ketQua??xem.cau?.ketQua)?.correct??null
  const [truoc,setTruoc]=useState({khoa:khoaCau,dung}),[dong,setDong]=useState<DongTac>('idle')
  if(truoc.khoa!==khoaCau){setTruoc({khoa:khoaCau,dung});setDong('idle')}
  else if(truoc.dung!==dung){setTruoc({khoa:khoaCau,dung});if(truoc.dung===null&&dung!==null&&!tran.laTrum)setDong(chan?'guard':dung?'cast':'hit')}
  const phanGio = mo ? Math.max(0, Math.min(1, con / Math.max(1, tran.giay))) : 1
  const soTrum = HIEP_TRUM.indexOf(tran.hiep)
  // Đòn của em ở hiệp VỪA xong (máy chủ gửi `hiepVuaXong`): chỉ hiện khi đó đúng là hiệp liền trước và có sát thương thật.
  const vua = xem.hiepVuaXong, donEm = vua && vua.hiep === tran.hiep - 1 && vua.cuaEm && vua.cuaEm.satThuong > 0 ? vua.cuaEm : null
  const nhanDon = donEm ? (donEm.lienKich ? 'LIÊN KÍCH' : donEm.haGuc > 0 ? 'HẠ GỤC' : 'ĐÒN CỦA EM') : ''
  // Huy hiệu Liên Kích: sẵn sàng (bạn vừa được em tiếp sức) hoặc đòn vừa rồi của em nổ Liên Kích — hai dòng cho gọn một ô.
  const lienKich = xem.tiepSuc?.lienKichSanSang && mo ? 'sẵn sàng' : donEm?.lienKich ? 'vừa nổ' : ''
  const quai = tran.quai.slice(0, 3), tenQuai = tran.tenQuai[tran.hiep < HIEP_TRUM[0]! ? 0 : 1] ?? 'Tạp Chất'
  return (
    <div className={`dh2-canh bl-canh-dien-hoat ${tran.laTrum ? 'dh2-canh-trum' : ''}`} data-vung="canh-2">
      <div className="dh2-ve" aria-label={tran.laTrum ? `Trùm ${tran.tenTrum[soTrum] ?? ''} chặn đường, Linh Tâm còn Máu ${tran.linhTam.hp}/${tran.linhTam.toiDa}` : `Linh Tâm trên xe còn Máu ${tran.linhTam.hp}/${tran.linhTam.toiDa}, ${tran.quai.length} Tạp Chất phục kích`} role="img">
        {em&&<SanDauDienHoat thu={em.pet} hanhDong={dong} suKien={khoaCau} dich={tran.laTrum?[{id:'trum',loai:tran.loaiTrum[soTrum]??'chua_te_ket_tua'}]:quai.map(q=>({id:q.ma,loai:q.loai}))} ban={ban.slice(0,3).map(g=>({id:g.ghe,pet:g.pet}))}/>}
        <svg className="bl-xe-trong-canh" viewBox="120 165 150 140" aria-hidden="true">
          <XeLinhTam hp={tran.linhTam.hp} toiDa={tran.linhTam.toiDa} />
        </svg>
        {donEm && (
          <div className="dh2-sat-thuong" aria-label={`Đòn của em hiệp ${vua!.hiep}: ${donEm.satThuong} sát thương`}>
            <b>-{donEm.satThuong}</b><span>{nhanDon}</span>
          </div>
        )}
        {/* Màn NGANG (doan2-ngang.css): nhãn Máu từng quái xếp thành cột ở khoảng trời trống phía trên bầy quái — không hình nào che; màn dọc ẩn (giữ y bản vẽ dọc). */}
        {!tran.laTrum && quai.length > 0 && (
          <ul className="dh2-nhan-quai" aria-label="Máu từng Tạp Chất" data-vung="mau-quai">
            {quai.map(q => <li key={q.ma} className="dh2-kinh">{tenQuai} · Máu {Math.max(0, q.hp)}/{HP_QUAI}</li>)}
          </ul>
        )}
        <span className="dh2-kinh dh2-nhan-canh dh2-nhan-mau">Máu Linh Tâm {tran.linhTam.hp}/{tran.linhTam.toiDa}</span>
        {tran.laTrum
          ? <span className="dh2-kinh dh2-nhan-canh dh2-nhan-o">Trùm · giáp 4 đoạn</span>
          : oPhucKich !== null && <span className="dh2-kinh dh2-nhan-canh dh2-nhan-o" data-vung="o-phuc-kich">Ổ phục kích còn {oPhucKich}</span>}
      </div>

      <header className="dh2-hud">
        <div className="dh2-kinh dh2-hud-hiep">
          <span className="dh2-hud-dong"><b className="dh2-baloo">HIỆP {tran.hiep}/{tran.soHiep}</b>{tran.laTrum ? <span className="dh2-dang-trum" title="Đang ở hiệp trùm">◆ đang ở hiệp trùm</span> : <span title="◆ = hiệp trùm">◆ = hiệp trùm</span>}</span>
          <span className="dh2-vach" role="img" aria-label={`Đang ở hiệp ${tran.hiep} trên ${tran.soHiep}; hiệp ${HIEP_TRUM.join(' và ')} là hiệp trùm`}>
            {Array.from({ length: tran.soHiep }, (_, i) => i + 1).map(h => (
              <i key={h} className={`${HIEP_TRUM.includes(h) ? 'dh2-kc' : ''} ${tran.ketThuc || h < tran.hiep ? 'dh2-xong' : h === tran.hiep ? 'dh2-dang' : ''}`} />
            ))}
          </span>
        </div>
        {!tran.ketThuc && <button type="button" className="dh2-kinh dh2-roi" onClick={onRoi} title="Máy sẽ đỡ thay, đội không bị phạt">Rời chuyến</button>}
        <span className={`dh2-kinh dh2-dong-ho ${mo && con <= 10 ? 'dh2-gap' : ''}`} role="timer" aria-label={mo ? `Còn ${con} giây` : 'Chưa tính giờ'}>
          <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true">
            <circle cx="26" cy="26" r={R_DONG_HO} stroke="rgba(255,255,255,.15)" strokeWidth="5" fill="none" />
            <circle cx="26" cy="26" r={R_DONG_HO} strokeWidth="5" fill="none" strokeLinecap="round" transform="rotate(-90 26 26)"
              strokeDasharray={`${(C_DONG_HO * phanGio).toFixed(1)} ${C_DONG_HO.toFixed(1)}`} />
          </svg>
          <b className="dh2-baloo">{mo ? con : '·'}</b>
        </span>
        <NutToanManHinh />
      </header>

      <div className="dh2-hang">
        {lienKich && <span className="dh2-lien-kich"><b className="dh2-baloo">LIÊN KÍCH ×{HE_LIEN_KICH}</b><small>{lienKich}</small></span>}
        {/* KHÔNG BAO GIỜ có chữ "sai" hay đáp án của bạn ở đây — chỉ trạng thái. */}
        <div className="dh2-ban" aria-label="Đồng đội">
          {ban.map(g => (
            <span key={g.ghe} className="dh2-kinh dh2-chip" data-tt={g.trangThai}>
              <ThuHinh pet={g.pet} cap={g.cap} size={24} />
              <span><b>{g.ten}</b><small>{CHU_TRANG_THAI[g.trangThai]}</small></span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

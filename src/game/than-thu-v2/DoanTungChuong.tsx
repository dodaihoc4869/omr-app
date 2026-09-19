// ĐOÀN HỘ TỐNG — màn TUNG CHƯỞNG (bản vẽ 4, thầy yêu cầu thêm): 2–3 giây toàn màn cuối mỗi hiệp, bỏ qua bằng MỘT chạm.
// Tia chiêu thức là ảnh THẬT (public/than-thu-v2/spells/*.png, cắt theo hình thái như màn luyện tập). Giảm chuyển động → ảnh tĩnh + số.
// Bảng "Vì sao đòn này mạnh" nối đòn đánh với VIỆC HỌC của chính em; về bạn chỉ nói điều tích cực (ra đòn, Liên Kích), không bao giờ nói bạn sai.
import { useEffect, useId, useRef } from 'react'
import type { CSSProperties } from 'react'
import { SpellArt } from './LearningBattle'
import { BATTLE_SKINS } from './learning-battle'
import { evolutionStage } from './evolution'
import { playBattleSound } from './battle-audio'
import { CHAN, type KhungNhinHiep } from './doan-core'
import type { GheXem } from './doan-kieu'
import { QuaiHinh, ThuHinh, TrumHinh } from './DoanHinh'

export const GIAY_TUNG_CHUONG = 3
const so = (n: number) => String(n).replace('.', ',')

export default function DoanTungChuong({ kq, ghe, loaiQuai, tenQuai, tinh, onXong }: { kq: KhungNhinHiep; ghe: GheXem[]; loaiQuai: string; tenQuai: string; tinh: boolean; onXong: () => void }) {
  const xong = useRef(onXong); xong.current = onXong
  const idA = useId(), idB = useId()
  const em = ghe.find(g => g.laEm)!, toi = kq.cuaEm
  const emRaDon = !!toi && toi.satThuong + toi.lan > 0
  const banRaDon = kq.ban.filter(b => b.ra === 'don').map(b => ({ ...b, g: ghe[b.ghe]! })).filter(b => b.g)
  // Hai tia trên màn: em (nếu ra đòn) + một bạn ra đòn mạnh nhất; nếu em không ra đòn thì hai bạn mạnh nhất.
  const banManh = [...banRaDon].sort((a, b) => b.satThuong - a.satThuong)
  const tia = [...(emRaDon ? [{ g: em, ten: toi!.tenChieu }] : []), ...banManh.map(b => ({ g: b.g, ten: b.tenChieu }))].slice(0, 2)
  const lienKich = !!toi?.lienKich || kq.ban.some(b => b.lienKich)
  useEffect(() => {
    if (tia[0]) playBattleSound(tia[0].g.pet, evolutionStage(tia[0].g.cap), true, lienKich)
    const t = setTimeout(() => xong.current(), GIAY_TUNG_CHUONG * 1000)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const dai = tia[0] ?? null
  const viSao = kq.laTrum ? null : !toi?.nop ? [['luc', '…', 'Hiệp này em chưa kịp chốt. Hiệp sau em chốt sớm một chút nhé.']]
    : emRaDon ? [
      ['', `×${so(toi.heSo.dung)}`, <>Em <b>{toi.tuLam ? 'tự làm đúng' : 'làm lại đúng'}</b> câu vừa sức của chính em</>],
      ...(toi.lienKich ? [['lam', '×2', toi.giupThanhCong ? <>Bạn <b>làm lại đúng</b> sau khi em tiếp sức → hai bạn Liên Kích</> : <>Em <b>làm lại đúng</b> sau khi được tiếp sức → hai bạn Liên Kích</>]] : []),
      ...(toi.heSo.anThach > 1 ? [['cam', 'ẤN', <>Chiêu này mở ra khi em <b>khắc phục xong dạng</b> của câu</>]] : []),
      ...(toi.chan > 0 ? [['luc', `+${toi.chan}`, <>Kỹ năng dựng thêm <b>khiên {toi.chan}</b> cho Linh Tâm</>]] : []),
      ...(toi.hoi > 0 ? [['luc', `+${toi.hoi}`, <>Kỹ năng <b>hồi {toi.hoi} máu</b> cho Linh Tâm</>]] : []),
      ...(toi.lan > 0 ? [['cam', `−${toi.lan}`, <>Đòn lan trúng thêm các Tạp Chất còn lại</>]] : []),
    ] : [
      ['luc', `+${toi.chan || CHAN}`, <>Thần thú của em <b>chắn cho Linh Tâm</b> · khiên {toi.chan || CHAN}</>],
      ...(toi.dung ? [['lam', '+2', <>Em làm đúng rồi mới chắn → <b>+2 năng lượng</b> cho kỹ năng</>]] : [['', '↻', <>Câu này sẽ quay lại để em <b>tự làm</b> vào ngày mai</>]]),
    ]

  return (
    <div className={`dh-chuong ${tinh ? 'dh-tinh' : ''}`} role="dialog" aria-label="Cả đội ra đòn" onClick={onXong}>
      <div className="dh-chuong-tia-nen" />
      <span className="dh-chuong-bo-qua">chạm để bỏ qua</span>
      {kq.laTrum ? (
        <>
          <div className="dh-chuong-dai"><div><small>TRÙM · CÂU CHUNG CẢ ĐỘI</small><b>{kq.trum?.voGiap ? 'VỠ GIÁP TRÙM!' : `ĐÚNG ${kq.trum?.yDung ?? 0}/4 Ý`}</b></div></div>
          <div className="dh-chuong-dich"><TrumHinh loai={kq.trum?.loai ?? ''} size={170} /></div>
          <div className="dh-chuong-so"><b className="dh-chu-vang">{kq.trum?.voGiap ? 'HẠ!' : `−${kq.linhTamMat}`}</b><small>{kq.trum?.voGiap ? 'CẢ ĐỘI CÙNG THẮNG' : 'LINH TÂM TRÚNG ĐÒN'}</small></div>
        </>
      ) : (
        <>
          {dai && <div className="dh-chuong-dai"><div><small>{BATTLE_SKINS[dai.g.pet]!.name.toUpperCase()}{dai.g.laEm ? ' · ĐÒN CỦA EM' : ` · ${dai.g.ten.toUpperCase()}`}</small><b>{dai.ten.toUpperCase()}</b></div></div>}
          {!dai && <div className="dh-chuong-dai"><div><small>CẢ ĐỘI</small><b>CHẮN CHO LINH TÂM</b></div></div>}
          {tia[1] && <div className="dh-chuong-dai dh-phu"><div><small>{tia[1].g.ten.toUpperCase()} · {BATTLE_SKINS[tia[1].g.pet]!.name.toUpperCase()}</small><b>{tia[1].ten.toUpperCase()}</b></div></div>}
          <div className="dh-chuong-dich"><QuaiHinh loai={loaiQuai} size={120} /></div>
          {tia.map((t, i) => (
            <div key={t.g.ghe}>
              <div className="dh-chuong-cot" style={{ left: tia.length === 1 ? 'calc(44% - 84px)' : i ? 'calc(44% + 2px)' : 'calc(44% - 170px)', transform: `rotate(${tia.length === 1 ? 0 : i ? -17 : 17}deg)` }}>
                <div className="dh-chuong-tia" style={{ '--bc': `rgb(${BATTLE_SKINS[t.g.pet]!.color})` } as CSSProperties}><SpellArt pet={t.g.pet} stage={evolutionStage(t.g.cap)} clipId={i ? idB : idA} /></div>
              </div>
              <ThuHinh pet={t.g.pet} cap={t.g.cap} size={150} quayTrai={i === 1} className="dh-chuong-thu" style={{ [i ? 'right' : 'left']: tia.length === 1 ? 'calc(50% - 75px)' : '2%' } as CSSProperties} />
            </div>
          ))}
          {kq.tongSatThuong > 0 && <div className="dh-chuong-so"><b className="dh-chu-vang">−{kq.tongSatThuong}</b>{kq.quaiHaGuc > 0 && <small>HẠ GỤC{kq.quaiHaGuc > 1 ? ` ×${kq.quaiHaGuc}` : ''}!</small>}</div>}
          {lienKich && <div className="dh-chuong-lk">LIÊN KÍCH ×2</div>}
        </>
      )}
      <div className="dh-chuong-san">
        {!kq.laTrum && <span>{tenQuai} · hạ {kq.quaiHaGuc} · còn {kq.quaiConLai}</span>}
        <span style={{ color: '#c8f6ff' }}>Linh Tâm {kq.linhTamMat > 0 ? `−${kq.linhTamMat}` : 'an toàn'}{kq.linhTamHoi > 0 ? ` · +${kq.linhTamHoi}` : ''} → {kq.linhTamSau}</span>
      </div>
      {viSao && (
        <div className="dh-chuong-vi-sao">
          <div className="dh-nhan" style={{ color: '#ffd9a0' }}>{emRaDon ? 'VÌ SAO ĐÒN NÀY MẠNH' : 'HIỆP NÀY CỦA EM'}</div>
          {viSao.slice(0, 3).map(([mau, nhan, chu], i) => <div key={i}><i className={mau ? `dh-${mau}` : ''}>{nhan}</i><span>{chu}</span></div>)}
        </div>
      )}
      <div className="dh-chuong-chop" />
    </div>
  )
}

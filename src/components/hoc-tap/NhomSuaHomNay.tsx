// THẺ NGÀY CỦA LỘ TRÌNH (mảnh lười) — khối B đợt 2 lát 3–4 (thầy 09/11 duyệt bản vẽ docs/ban-ve-moi-on-sua-0911 ảnh dt-sang-3 + trạng thái «hết hạn chung mà chưa
// xong», «làm hết sạch đẩy luôn lên bản sống», «làm mọi thứ xong hết đi»):
//  · DẢI NỢ BÀI CŨ: bài đã qua hạn chung mà còn câu chưa gặp ⇒ «Còn của <bài>: N câu chưa gặp — làm trước câu của bài mới» (máy chủ xếp câu bài hạn sớm trước).
//  · NHÓM LỖI HÔM NAY (ngày Sửa): câu sai chờ sửa gom theo dạng (goi-bai-7-nhom-sua.ts; câu sửa xếp liền theo nhóm ⇒ chặng đầu là nhóm 1); mỗi nhóm: số thứ tự ·
//    tên dạng · loại lỗi em chạm ở «Vì sao em sai?» (dạng sai từ 3 lần ⇒ «Học lại») · tiến độ x/y câu.
// Nạp lười từ Lộ trình (chỉ khi có một trong hai), có trong kho tải ngầm (vite.config KHO_HS_GOC), ngoài precache — 0 byte đường mở app.
import { lazy, Suspense, useState } from 'react'
import { ChemText } from '../../lib/chem-format'
import type { TomTatGoi7 } from '../../lib/goi-bai-7'
import { docNhomSua, type LoaiNhomSua } from './nhom-sua-doc'
import './nhom-sua-hom-nay.css'

const ViDuMau = lazy(() => import('./ViDuMau').catch(() => ({ default: () => null }))) // khối B lát 6: nạp khi bấm, có trong kho tải ngầm
const NHAN: Record<LoaiNhomSua, string> = { tinh: 'Tính / đọc đề sai', cach: 'Chưa biết cách', nham: 'Hiểu nhầm', hoc_lai: 'Học lại' }

export default function NhomSuaHomNay({ g, token }: { g: TomTatGoi7; token?: string }) {
  const [moViDu, setMoViDu] = useState<{ qid: string; ten: string } | null>(null)
  const no = g.goi.filter(b => b.quaHan && b.con > 0).slice(0, 2)
  const nhom = g.loaiNgay === 'sua' ? docNhomSua(g.nhomSua) : []
  if (!no.length && !nhom.length) return null
  const tong = nhom.reduce((s, n) => s + n.so, 0), xongNhom = nhom.filter(n => n.xong >= n.so).length
  return <>
    {no.map(b => <p key={b.id} className="kb-no-bai" role="status"><b>Còn của <ChemText text={b.ten} />: {b.con} câu chưa gặp</b> — làm trước câu của bài mới.</p>)}
    {nhom.length > 0 && <section className="kb-nhom-sua" aria-label={`Nhóm lỗi hôm nay: xong ${xongNhom} trên ${nhom.length} nhóm, ${tong} câu`}>
      <h2>Nhóm lỗi hôm nay<span>{xongNhom}/{nhom.length} nhóm · {tong} câu</span></h2>
      <ol>{nhom.map((n, i) => <li key={i} data-xong={n.xong >= n.so || undefined}>
        <span className="kb-ns-so" aria-hidden="true">{n.xong >= n.so ? '✓' : i + 1}</span>
        <span className="kb-ns-chu"><b><ChemText text={n.ten} /></b>{n.loai && <i className="kb-ns-loai" data-l={n.loai}>{NHAN[n.loai]}{n.loai === 'hoc_lai' ? ' · em đã sai nhiều lần' : ''}</i>}{token && n.viDu && n.xong < n.so && <button type="button" className="kb-ns-vidu" onClick={() => setMoViDu({ qid: n.viDu!, ten: n.ten })}>Xem ví dụ mẫu</button>}</span>
        <span className="kb-ns-dem" aria-label={`Đã làm ${n.xong} trên ${n.so} câu`}>{n.xong}/{n.so}</span>
      </li>)}</ol>
      <p className="kb-ns-ghi">Mỗi nhóm là các câu em sai cùng dạng, làm lần lượt từ nhóm 1. Câu sai làm trước, sau đó tới câu ôn và câu mới cho đủ mức hôm nay.</p>
    </section>}
    {moViDu && token && <Suspense fallback={null}><ViDuMau token={token} qid={moViDu.qid} ten={moViDu.ten} onDong={() => setMoViDu(null)} /></Suspense>}
  </>
}

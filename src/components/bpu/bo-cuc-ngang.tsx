// BỐ CỤC NGANG MÀN CÂU HỎI CỦA MÁY EM — thầy 11/11 tối: «tôi muốn câu hỏi xoay ngang trên máy học sinh thì hiển thị giao diện xoay ngang, một bên đề một bên
// chọn đáp án». Tách khỏi ManBinhPhanUng.tsx (cổng cỡ tệp); cùng mảnh nạp lười với màn ấy. Kiểu: bpu-hs.css (khối «BỐ CỤC NGANG 11/11»).
//  · NGANG (trang ngang ≥ 640 px — `RONG_NGANG_MIN`, cùng ngưỡng hai cột của màn chặng — hoặc hình xoay CSS lúc live, `data-ngang`): thân màn câu hỏi
//    `.bpu-cau` thành lưới hai cột KHÔNG cuộn. TRÁI `.bpu-cot-de` = nhãn loại câu + giám thị + đề + ảnh / bảng + ảnh cuối câu, cuộn RIÊNG khi dài.
//    PHẢI `.bpu-tra` = chọn đáp án, luôn trọn trong khung.
//  · Cột phải không đủ chỗ cho thẻ phương án / ý đầy đủ (ĐO THẬT sau khi dựng — `useCotTraVua`) ⇒ `data-gon` = KIỂU PHIẾU: chữ đầy đủ của phương án / ý
//    xuống cột trái ngay dưới đề (`YDeNgang`); cột phải còn chữ cái + nút (trắc nghiệm: thêm một dòng chữ rút gọn để nhận ra; đúng–sai: Đúng / Sai mỗi ý).
//    Điện thoại xoay ngang gần như luôn vào kiểu phiếu với câu đúng–sai (ý dài); trắc nghiệm ngắn vẫn là thẻ đầy đủ.
//  · DỌC: `.bpu-cot-de` / `.bpu-sau-tra` là `display: contents` + `order` ⇒ thứ tự và bố cục y như trước; danh sách `YDeNgang` ẩn.
// AN TOÀN ĐÁP ÁN: chỉ dùng câu công khai của lượt (phương án / ý / ảnh) — không đáp án, không lời giải.
// Phần ĐO (coPhieu, doCotTra, useThanNgang, useCotTraVua) nằm ở bo-cuc-ngang-do.ts (12/11 — tệp component chỉ xuất component).
import type { ComponentType } from 'react'
import type { Question } from '../../game/than-thu-v2/core'
import { laChuGiuCho } from '../../lib/anh-phuong-an'

/** Chữ đầy đủ của bốn phương án («A. …») / bốn ý («a. …») ở cột đề — CHỈ hiện khi cột phải ở kiểu phiếu (CSS). Phần III / tự luận: không có. */
export function YDeNgang({ q, Chu, tuLuan }: { q: Question; Chu?: ComponentType<{ text: string }>; tuLuan?: boolean }) {
  if (tuLuan || q.phan === 'III' || !Chu) return null
  const ds = q.phan === 'II' ? q.ideas : q.choices
  if (!ds?.length) return null
  const anh = q.phan === 'II' ? q.ideaImgs : q.choiceImgs
  const ky = q.phan === 'II' ? 'abcd' : 'ABCD'
  const vt = q.phan === 'II' ? 'sau_y_' : 'sau_pa_'
  return (
    <ol className="bpu-y-de" data-phan={q.phan} aria-label={q.phan === 'II' ? 'Bốn ý của câu' : 'Bốn phương án của câu'}>
      {ds.slice(0, 4).map((x, i) => {
        const k = ky[i]!
        const sau = q.hinhAnh.filter((h) => h.viTri === vt + k)
        const chu = String(x ?? '')
        return (
          <li key={k}>
            <b>{k}.</b>
            <div>
              {anh?.[i] ? <img src={anh[i]} alt={`${q.phan === 'II' ? 'Ý' : 'Phương án'} ${k}`} loading="lazy" decoding="async" className="ht2-lam-anh-nho" />
                : sau.length && laChuGiuCho(chu) ? null : <Chu text={chu} />}
              {sau.map((h, j) => <div key={j} className="cau-hinh"><img src={h.src} alt={h.alt ?? `Hình ${q.phan === 'II' ? 'ý' : 'phương án'} ${k}`} loading="lazy" decoding="async" /></div>)}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

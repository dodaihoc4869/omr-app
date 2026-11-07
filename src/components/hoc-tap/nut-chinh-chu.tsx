// 07/11 vòng 2 (thiết kế bằng 5 skill — docs/ban-ve-skill-0711/vong-2, thầy duyệt build). Tách khỏi TrongHs.tsx (cổng cỡ tệp).
// ChuNutChinh: bỏ chuỗi «A · B» trên nút chính Hôm nay — việc thành NHÃN nhỏ trên, tên chặng là tiêu đề, «còn N câu» thành chip.
// ViecTrong: trạng thái TRỐNG khi đã tải xong mà hôm nay chưa có việc (thay vì để trống cột).

/** `v` = chữ việc (Bắt đầu / Học tiếp…), `t` = tên chặng / việc, `phu` = dòng phụ cũ, `bai` = tên bài (chỉ nút chặng học). */
export function ChuNutChinh({ v, t, phu, bai }: { v: string; t: string; phu: string; bai?: string }) {
  const con = bai !== undefined ? /(còn \d+ câu)$/.exec(phu)?.[1] : undefined
  return <>
    {v !== t && <span className="kb-cta-nhan">{v}</span>}<b>{t}</b>
    <span className="kb-phu">{bai === undefined ? phu : <>{bai}{con ? <span className="kb-cta-con">{con}</span> : ` · ${phu}`}</>}</span>
  </>
}

export function ViecTrong() {
  return <section className="kb-viec kb-trong" aria-label="Việc hôm nay"><h2>Việc hôm nay</h2>
    <p className="kb-trong-chu"><b>Hôm nay chưa có việc</b>Thầy chưa giao bài mới. Em quay lại sau nhé.</p></section>
}

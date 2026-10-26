// Thẻ lỗi tải có nút thử lại (trang cũ «Hôm nay của con» + màn «Chỉ đọc») — tách khỏi TrangVeCon.tsx 26/10 (trang cũ nạp lười).
export function LoiThe({ chu, thuLai, nut }: { chu: string; thuLai: () => void; nut: string }) {
  return (
    <div className="tvc-loi" role="alert">
      <p>{chu}</p>
      <button type="button" className="ph3-nut-vien tt-nhan" onClick={thuLai}>{nut}</button>
    </div>
  )
}

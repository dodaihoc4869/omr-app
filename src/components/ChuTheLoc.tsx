/** Nội dung một thẻ lọc có số đếm (kiểu chung src/styles/the-loc.css): chữ + huy hiệu số tách riêng.
 * Chữ ẩn `.tl-an` giữ nguyên textContent đầy đủ (vd "12 - Lớp Thường · 66 em"); tên đọc cho máy đọc màn hình
 * thì nút đặt `aria-label={tenTheLoc(...)}` (bộ tính tên bỏ khoảng trắng đầu/cuối của từng phần tử con). */
export const tenTheLoc = (chu: string, so: number | string, noi = ' · ', donVi = '') => `${chu}${noi}${so}${donVi ? ` ${donVi}` : ''}`

export default function ChuTheLoc({ chu, so, noi = ' · ', donVi = '' }: { chu: string; so: number | string; noi?: string; donVi?: string }) {
  return (
    <>
      <span>{chu}</span>
      <span className="tl-dem">
        <span className="tl-an">{noi}</span>
        {so}
        {donVi && <span className="tl-an">{` ${donVi}`}</span>}
      </span>
    </>
  )
}

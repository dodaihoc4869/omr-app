// NGẮT Ý KHI SỐ Ý ĐỨNG SAU (thầy 02/11 khuya, ảnh câu tinh bột: «Những chỗ này ngắt ý ra nhé»): «…sau: tan trong nước lạnh (1); làm mất màu nước bromine (2); … (6).»
// ⇒ mỗi ý một dòng, ý đầu xuống dòng sau dấu «:». Chỉ khi có ≥ 2 số ý đứng CUỐI một ý có chữ và ngăn bằng «;» — không đụng công thức kiểu Cu(OH)2, câu đục lỗ
// «…(1)…», câu nhắc lại «Thứ tự (1), (2)…» hay liệt kê bằng dấu phẩy trong một câu văn (quét 799 câu sao lưu 28/09: đúng 2 câu dạng này, đều là dãy chất / phương trình).
// Tệp RIÊNG, chỉ màn làm câu học sinh (LamCau — mảnh nạp lười) dùng: thêm vào tach-dong-cau.ts làm nặng lượt mở /t và /hs (cổng kiem:toc-do).
export function ngatYSoSau(s: string): string {
  if ((s.match(/[^\s();,.…]\s*\(\d\d?\)\s*;/g) || []).length < 2) return s
  return s.replace(/(\(\d\d?\)\s*;)[ \t]*(?=\S)/g, '$1\n').replace(/:[ \t]*(?=[^\n:]*\(1\)\s*;)/, ':\n')
}

// NHÃN TRẦN (thầy 10/11, ảnh Bình Phản Ứng câu «Cho một số hợp chất chứa nguyên tố nitrogen như sau: (1) (2) (3) Tính chất hóa học của các hợp chất.»:
// «Đề hiển thị ko đúng»): trong đề gốc ba công thức đứng ngay sau dấu «:», mỗi công thức một số; kho giữ cả ba trong MỘT ảnh «sau đề» nên chữ đề chỉ còn dãy
// số trần «(1) (2) (3)». `tachDongTheoY` coi mỗi số là đầu một ý ⇒ «(1)» trơ trọi một dòng, «(2) (3) Tính chất…» dòng sau, ảnh rơi xuống cuối khung.
// Hàm này nhận ra đúng dạng đó — sau dấu «:» là ≥ 2 số LIỀN NHAU từ (1), giữa các số không có chữ nào — và chia đề làm hai: `truoc` = lời dẫn, `nhan` = dòng số
// (ảnh đặt ngay dưới dòng số), `sau` = phần chữ còn lại (đặt dưới ảnh). Không phải dạng đó ⇒ null (đề đi đường cũ, không đổi một chữ).
// Dãy số trả RIÊNG (`nhan`) để màn vẽ thành một dòng chữ thường — không qua `tachDoanDe` (sẽ tô đậm riêng «(1)» như nhãn đầu ý).
// Chỉ gọi khi câu có ảnh «sau đề» (LamCau.DeCau — mảnh nạp lười, dùng chung chặng / Bình Phản Ứng / sửa câu).
export function tachNhanTran(s: string, tachDong: (x: string) => string): { truoc: string; nhan: string; sau: string } | null {
  const m = /^([\s\S]*?:)[ \t]*((?:\(\d\d?\)[ \t,;]*){2,})\.?[ \t]*(?=$|[^\s\d(,;.:])([\s\S]*)$/.exec(String(s ?? '').trim())
  if (!m) return null
  const so = (m[2]!.match(/\d+/g) ?? []).map(Number)
  if (so.some((n, i) => n !== i + 1)) return null
  const sau = m[3]!.trim()
  return { truoc: tachDong(m[1]!), nhan: m[2]!.trim().replace(/[ \t]+/g, ' ').replace(/[,;]$/, ''), sau: sau ? ngatYSoSau(tachDong(sau)) : '' }
}

// NGẮT Ý KHI SỐ Ý ĐỨNG SAU (thầy 02/11 khuya, ảnh câu tinh bột: «Những chỗ này ngắt ý ra nhé»): «…sau: tan trong nước lạnh (1); làm mất màu nước bromine (2); … (6).»
// ⇒ mỗi ý một dòng, ý đầu xuống dòng sau dấu «:». Chỉ khi có ≥ 2 số ý đứng CUỐI một ý có chữ và ngăn bằng «;» — không đụng công thức kiểu Cu(OH)2, câu đục lỗ
// «…(1)…», câu nhắc lại «Thứ tự (1), (2)…» hay liệt kê bằng dấu phẩy trong một câu văn (quét 799 câu sao lưu 28/09: đúng 2 câu dạng này, đều là dãy chất / phương trình).
// Tệp RIÊNG, chỉ màn làm câu học sinh (LamCau — mảnh nạp lười) dùng: thêm vào tach-dong-cau.ts làm nặng lượt mở /t và /hs (cổng kiem:toc-do).
export function ngatYSoSau(s: string): string {
  if ((s.match(/[^\s();,.…]\s*\(\d\d?\)\s*;/g) || []).length < 2) return s
  return s.replace(/(\(\d\d?\)\s*;)[ \t]*(?=\S)/g, '$1\n').replace(/:[ \t]*(?=[^\n:]*\(1\)\s*;)/, ':\n')
}

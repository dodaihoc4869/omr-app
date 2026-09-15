/**
 * KHO CÂU HỎI THÁP TRI THỨC.
 *
 * Bản trước có **đúng 5 câu** cho một cái tháp không giới hạn tầng — tầng 2 đã
 * lặp lại y hệt câu tầng 1, và độ khó không đổi dù leo tới tầng nào.
 *
 * Nay 60 câu chia **ba bậc**: bậc 1 tầng 1–10, bậc 2 tầng 11–25, bậc 3 từ tầng
 * 26. Danh pháp 2018 cho mọi chữ hiện ra.
 *
 * LUẬT VIẾT CÂU — phép kiểm bắt được nếu sai:
 *  · `dung` là CHỈ SỐ trong `phuongAn`, 0–3.
 *  · `giaiThich` nói VÌ SAO, không chỉ nhắc lại đáp án.
 *  · Câu nào kèm `pt` thì phương trình phải CÂN BẰNG.
 *  · Không hai câu nào trùng đề bài.
 */

export type BacKho = 1 | 2 | 3

export interface CauHoi {
  cau: string
  phuongAn: readonly [string, string, string, string]
  dung: 0 | 1 | 2 | 3
  giaiThich: string
  chuyenDe: string
  bac: BacKho
  pt?: string
}

export const KHO_CAU_HOI: readonly CauHoi[] = [
  /* ───── BẬC 1 — tầng 1–10 ───── */
  { bac: 1, chuyenDe: 'Kim loại kiềm', cau: 'Kim loại nào tác dụng với nước ngay ở nhiệt độ thường?',
    phuongAn: ['Fe (iron)', 'Cu (copper)', 'Na (sodium)', 'Al (aluminium)'], dung: 2,
    pt: '2Na + 2H₂O → 2NaOH + H₂',
    giaiThich: 'Sodium là kim loại kiềm, khử được nước ngay ở nhiệt độ thường. Iron chỉ phản ứng với hơi nước nóng, copper không phản ứng.' },
  { bac: 1, chuyenDe: 'Halogen', cau: 'Khí nào có màu vàng lục, mùi hắc, rất độc?',
    phuongAn: ['O₂ (oxygen)', 'Cl₂ (chlorine)', 'N₂ (nitrogen)', 'CO₂ (carbon dioxide)'], dung: 1,
    giaiThich: 'Chlorine là khí vàng lục, mùi xốc. Ba khí còn lại đều không màu.' },
  { bac: 1, chuyenDe: 'Acid – base', cau: 'Dung dịch nào làm quỳ tím hoá đỏ?',
    phuongAn: ['HCl', 'NaCl', 'NaOH', 'C₂H₅OH'], dung: 0,
    giaiThich: 'HCl là acid mạnh nên làm quỳ hoá đỏ. NaCl trung tính, NaOH làm quỳ hoá xanh, ethanol không đổi màu quỳ.' },
  { bac: 1, chuyenDe: 'Đại cương kim loại', cau: 'Kim loại nào dẫn điện tốt nhất?',
    phuongAn: ['Cu (copper)', 'Al (aluminium)', 'Ag (silver)', 'Fe (iron)'], dung: 2,
    giaiThich: 'Thứ tự dẫn điện: Ag > Cu > Au > Al > Fe. Thực tế dùng copper vì silver quá đắt.' },
  { bac: 1, chuyenDe: 'Acid – base', cau: 'Dung dịch nào làm phenolphthalein hoá hồng?',
    phuongAn: ['HCl', 'NaOH', 'NaCl', 'H₂SO₄'], dung: 1,
    giaiThich: 'Phenolphthalein chỉ đổi sang hồng trong môi trường base.' },
  { bac: 1, chuyenDe: 'Bảng tuần hoàn', cau: 'Nguyên tố nào có độ âm điện lớn nhất bảng tuần hoàn?',
    phuongAn: ['O (oxygen)', 'Cl (chlorine)', 'F (fluorine)', 'N (nitrogen)'], dung: 2,
    giaiThich: 'Fluorine có độ âm điện 3,98 — lớn nhất trong mọi nguyên tố.' },
  { bac: 1, chuyenDe: 'Điện li', cau: 'Chất nào là chất điện li mạnh?',
    phuongAn: ['C₂H₅OH', 'NaCl', 'CH₃COOH', 'Glucose'], dung: 1,
    giaiThich: 'NaCl phân li hoàn toàn thành Na⁺ và Cl⁻. CH₃COOH điện li yếu; ethanol và glucose không điện li.' },
  { bac: 1, chuyenDe: 'Đại cương kim loại', cau: 'Kim loại nào ở thể lỏng tại điều kiện thường?',
    phuongAn: ['Hg (mercury)', 'Na (sodium)', 'Pb (lead)', 'Zn (zinc)'], dung: 0,
    giaiThich: 'Mercury nóng chảy ở −39 °C nên là kim loại duy nhất ở thể lỏng ở nhiệt độ thường.' },
  { bac: 1, chuyenDe: 'Carbon', cau: 'Khí nào làm đục nước vôi trong?',
    phuongAn: ['O₂', 'H₂', 'CO₂', 'N₂'], dung: 2,
    pt: 'CO₂ + Ca(OH)₂ → CaCO₃ + H₂O',
    giaiThich: 'CO₂ tạo kết tủa CaCO₃ màu trắng, làm nước vôi trong hoá đục.' },
  { bac: 1, chuyenDe: 'Hydrocarbon', cau: 'Công thức phân tử của methane là gì?',
    phuongAn: ['CH₄', 'C₂H₄', 'C₂H₆', 'C₂H₂'], dung: 0,
    giaiThich: 'Methane là alkane đơn giản nhất: một carbon và bốn hydrogen.' },
  { bac: 1, chuyenDe: 'Oxide', cau: 'Oxide nào tan trong nước cho dung dịch base?',
    phuongAn: ['SO₂', 'Na₂O', 'CO₂', 'P₂O₅'], dung: 1,
    pt: 'Na₂O + H₂O → 2NaOH',
    giaiThich: 'Na₂O là basic oxide. Ba oxide còn lại đều là acidic oxide, tan cho acid.' },
  { bac: 1, chuyenDe: 'Acid – base', cau: 'Phản ứng trung hoà xảy ra giữa hai loại chất nào?',
    phuongAn: ['Acid và base', 'Hai acid', 'Kim loại và acid', 'Hai muối'], dung: 0,
    giaiThich: 'Trung hoà là phản ứng giữa acid và base, cho muối và nước.' },
  { bac: 1, chuyenDe: 'Đại cương kim loại', cau: 'Kim loại nhẹ, bền, dùng làm vỏ máy bay là kim loại nào?',
    phuongAn: ['Fe (iron)', 'Pb (lead)', 'Al (aluminium)', 'Cu (copper)'], dung: 2,
    giaiThich: 'Aluminium có khối lượng riêng 2,7 g/cm³, nhẹ và có lớp oxide bảo vệ nên bền.' },
  { bac: 1, chuyenDe: 'Muối', cau: 'CaCO₃ là thành phần chính của chất nào?',
    phuongAn: ['Đá vôi', 'Thạch cao', 'Muối ăn', 'Phèn chua'], dung: 0,
    giaiThich: 'Đá vôi, vỏ sò, phấn viết đều có thành phần chính là CaCO₃.' },
  { bac: 1, chuyenDe: 'Liên kết hoá học', cau: 'Liên kết trong phân tử NaCl thuộc loại nào?',
    phuongAn: ['Cộng hoá trị không cực', 'Ion', 'Cộng hoá trị có cực', 'Kim loại'], dung: 1,
    giaiThich: 'Hiệu độ âm điện giữa Na và Cl lớn hơn 1,7 nên tạo liên kết ion.' },
  { bac: 1, chuyenDe: 'Số oxi hoá', cau: 'Số oxi hoá của oxygen trong đa số hợp chất là bao nhiêu?',
    phuongAn: ['−1', '0', '−2', '+2'], dung: 2,
    giaiThich: 'Oxygen thường có số oxi hoá −2, trừ trong peroxide (−1) và OF₂ (+2).' },
  { bac: 1, chuyenDe: 'Kim loại – acid', cau: 'Kim loại nào KHÔNG tan trong dung dịch HCl?',
    phuongAn: ['Zn (zinc)', 'Fe (iron)', 'Cu (copper)', 'Mg (magnesium)'], dung: 2,
    giaiThich: 'Copper đứng sau hydrogen trong dãy hoạt động hoá học nên không đẩy được hydrogen khỏi acid.' },
  { bac: 1, chuyenDe: 'Muối', cau: 'Muối ăn có công thức hoá học là gì?',
    phuongAn: ['NaCl', 'KCl', 'CaCl₂', 'NH₄Cl'], dung: 0,
    giaiThich: 'Muối ăn là sodium chloride, NaCl.' },
  { bac: 1, chuyenDe: 'pH', cau: 'Dung dịch có pH = 3 thuộc môi trường nào?',
    phuongAn: ['Base', 'Trung tính', 'Acid', 'Không xác định'], dung: 2,
    giaiThich: 'pH nhỏ hơn 7 là acid; bằng 7 là trung tính; lớn hơn 7 là base.' },
  { bac: 1, chuyenDe: 'Cấu tạo nguyên tử', cau: 'Hạt nào mang điện tích âm trong nguyên tử?',
    phuongAn: ['Proton', 'Neutron', 'Electron', 'Hạt nhân'], dung: 2,
    giaiThich: 'Electron mang điện âm, proton mang dương, neutron không mang điện.' },

  /* ───── BẬC 2 — tầng 11–25 ───── */
  { bac: 2, chuyenDe: 'Nhận biết', cau: 'Chất nào tạo kết tủa trắng KHÔNG tan trong acid mạnh khi gặp Ba(OH)₂?',
    phuongAn: ['HCl', 'H₂SO₄', 'HNO₃', 'NaCl'], dung: 1,
    pt: 'Ba(OH)₂ + H₂SO₄ → BaSO₄ + 2H₂O',
    giaiThich: 'BaSO₄ là kết tủa trắng không tan trong acid — dấu hiệu nhận biết ion sulfate.' },
  { bac: 2, chuyenDe: 'Dãy điện hoá', cau: 'Nhúng thanh zinc vào dung dịch CuSO₄, hiện tượng quan sát được là gì?',
    phuongAn: ['Không đổi', 'Kim loại đỏ bám vào, màu xanh nhạt dần', 'Sủi bọt khí', 'Dung dịch đậm màu hơn'], dung: 1,
    pt: 'Zn + CuSO₄ → ZnSO₄ + Cu',
    giaiThich: 'Zinc mạnh hơn copper nên đẩy copper ra khỏi muối; Cu đỏ bám lên thanh Zn, màu xanh của Cu²⁺ nhạt dần.' },
  { bac: 2, chuyenDe: 'Nhiệt nhôm', cau: 'Phản ứng nhiệt nhôm dùng kim loại nào để khử Fe₂O₃?',
    phuongAn: ['Fe (iron)', 'Mg (magnesium)', 'Al (aluminium)', 'Cu (copper)'], dung: 2,
    pt: '2Al + Fe₂O₃ → Al₂O₃ + 2Fe',
    giaiThich: 'Aluminium khử oxide của kim loại yếu hơn ở nhiệt độ cao, toả nhiệt rất mạnh — dùng để hàn đường ray.' },
  { bac: 2, chuyenDe: 'Halogen', cau: 'Cl₂ tác dụng với dung dịch NaOH loãng nguội tạo hỗn hợp nào?',
    phuongAn: ['NaCl và NaClO', 'NaCl và NaClO₃', 'Chỉ NaCl', 'NaClO₃ và H₂'], dung: 0,
    pt: 'Cl₂ + 2NaOH → NaCl + NaClO + H₂O',
    giaiThich: 'Đây là nước Javel. Chlorine vừa bị oxi hoá vừa bị khử — phản ứng tự oxi hoá khử.' },
  { bac: 2, chuyenDe: 'Hợp chất lưỡng tính', cau: 'Chất nào là hydroxide lưỡng tính?',
    phuongAn: ['NaOH', 'Al(OH)₃', 'Ba(OH)₂', 'KOH'], dung: 1,
    giaiThich: 'Al(OH)₃ tan trong cả acid lẫn base mạnh nên là hydroxide lưỡng tính.' },
  { bac: 2, chuyenDe: 'Carbohydrate', cau: 'Glucose tráng bạc được chứng tỏ phân tử có nhóm chức nào?',
    phuongAn: ['−COOH', '−CHO', '−NH₂', '−NO₂'], dung: 1,
    giaiThich: 'Nhóm aldehyde −CHO bị thuốc thử Tollens oxi hoá, giải phóng silver bám lên thành ống nghiệm.' },
  { bac: 2, chuyenDe: 'Ester', cau: 'Công thức chung của ester đơn chức là gì?',
    phuongAn: ['RCOOR′', 'RCHO', 'ROH', 'RCOOH'], dung: 0,
    giaiThich: 'Ester tạo từ carboxylic acid và alcohol, mang nhóm chức −COO−.' },
  { bac: 2, chuyenDe: 'Polymer', cau: 'Tơ nào là tơ tổng hợp?',
    phuongAn: ['Tơ tằm', 'Bông', 'Nylon-6,6', 'Len'], dung: 2,
    giaiThich: 'Nylon-6,6 tổng hợp bằng phản ứng trùng ngưng. Tơ tằm, bông, len đều là tơ thiên nhiên.' },
  { bac: 2, chuyenDe: 'Nhôm', cau: 'Dung dịch nào hoà tan được aluminium?',
    phuongAn: ['NaCl', 'NaOH', 'MgCl₂', 'Na₂SO₄'], dung: 1,
    pt: '2Al + 2NaOH + 6H₂O → 2Na[Al(OH)₄] + 3H₂',
    giaiThich: 'Aluminium lưỡng tính nên tan trong dung dịch base mạnh, giải phóng hydrogen.' },
  { bac: 2, chuyenDe: 'Alkene', cau: 'Chất nào làm mất màu dung dịch bromine ở điều kiện thường?',
    phuongAn: ['CH₄', 'C₂H₆', 'C₂H₄', 'C₃H₈'], dung: 2,
    pt: 'C₂H₄ + Br₂ → C₂H₄Br₂',
    giaiThich: 'Liên kết đôi C=C cộng bromine nên làm mất màu; các alkane no thì không.' },
  { bac: 2, chuyenDe: 'Amino acid', cau: 'Amino acid chứa đồng thời hai nhóm chức nào?',
    phuongAn: ['−OH và −CHO', '−NH₂ và −COOH', '−COOH và −CHO', '−NH₂ và −OH'], dung: 1,
    giaiThich: 'Vừa có nhóm amino mang tính base vừa có nhóm carboxyl mang tính acid nên amino acid lưỡng tính.' },
  { bac: 2, chuyenDe: 'Sắt', cau: 'Dung dịch hợp chất iron(III) có màu đặc trưng nào?',
    phuongAn: ['Lục nhạt', 'Vàng nâu', 'Xanh lam', 'Không màu'], dung: 1,
    giaiThich: 'Fe³⁺ cho dung dịch vàng nâu; Fe²⁺ cho dung dịch lục nhạt.' },
  { bac: 2, chuyenDe: 'Điện phân', cau: 'Điện phân dung dịch NaCl bão hoà có màng ngăn thu được gì?',
    phuongAn: ['Na và Cl₂', 'NaOH, H₂ và Cl₂', 'NaClO và H₂', 'Na₂O và Cl₂'], dung: 1,
    pt: '2NaCl + 2H₂O → 2NaOH + H₂ + Cl₂',
    giaiThich: 'Màng ngăn không cho Cl₂ gặp NaOH; nếu gặp sẽ tạo nước Javel.' },
  { bac: 2, chuyenDe: 'Carbohydrate', cau: 'Thuỷ phân hoàn toàn saccharose thu được những chất nào?',
    phuongAn: ['Chỉ glucose', 'Glucose và fructose', 'Chỉ fructose', 'Glucose và maltose'], dung: 1,
    giaiThich: 'Saccharose là disaccharide gồm một gốc glucose và một gốc fructose.' },
  { bac: 2, chuyenDe: 'Lipid', cau: 'Chất béo là trieste của glycerol với chất nào?',
    phuongAn: ['Acid béo', 'Alcohol', 'Amino acid', 'Aldehyde'], dung: 0,
    giaiThich: 'Ba nhóm −OH của glycerol ester hoá với ba phân tử acid béo.' },
  { bac: 2, chuyenDe: 'Ăn mòn kim loại', cau: 'Ăn mòn điện hoá học cần đủ những điều kiện nào?',
    phuongAn: ['Hai điện cực khác bản chất, tiếp xúc nhau, cùng trong dung dịch điện li', 'Chỉ cần có nước', 'Chỉ cần hai kim loại giống nhau', 'Chỉ cần không khí'], dung: 0,
    giaiThich: 'Thiếu một trong ba điều kiện thì chỉ còn ăn mòn hoá học, tốc độ chậm hơn nhiều.' },
  { bac: 2, chuyenDe: 'Nhận biết', cau: 'Thuốc thử nào phân biệt được dung dịch Na₂SO₄ và NaCl?',
    phuongAn: ['Quỳ tím', 'Dung dịch BaCl₂', 'Dung dịch NaOH', 'Nước'], dung: 1,
    pt: 'BaCl₂ + Na₂SO₄ → BaSO₄ + 2NaCl',
    giaiThich: 'Chỉ Na₂SO₄ tạo kết tủa trắng BaSO₄; NaCl không phản ứng với BaCl₂.' },
  { bac: 2, chuyenDe: 'Nitrogen', cau: 'Phân đạm nào có hàm lượng nitrogen cao nhất?',
    phuongAn: ['NH₄NO₃', 'Urea (NH₂)₂CO', '(NH₄)₂SO₄', 'NH₄Cl'], dung: 1,
    giaiThich: 'Urea chứa khoảng 46% nitrogen về khối lượng, cao nhất trong các loại phân đạm thông dụng.' },
  { bac: 2, chuyenDe: 'Cấu hình electron', cau: 'Ion nào có cấu hình electron giống khí hiếm neon?',
    phuongAn: ['Na⁺', 'K⁺', 'Ca²⁺', 'Cl⁻'], dung: 0,
    giaiThich: 'Na⁺ mất một electron còn 10 electron, trùng cấu hình Ne. K⁺, Ca²⁺, Cl⁻ đều giống Ar.' },
  { bac: 2, chuyenDe: 'Nước cứng', cau: 'Nước cứng tạm thời chứa nhiều muối nào?',
    phuongAn: ['CaCl₂ và MgCl₂', 'Ca(HCO₃)₂ và Mg(HCO₃)₂', 'CaSO₄ và MgSO₄', 'NaCl và KCl'], dung: 1,
    pt: 'Ca(HCO₃)₂ → CaCO₃ + CO₂ + H₂O',
    giaiThich: 'Hydrogencarbonate bị phân huỷ khi đun nóng nên gọi là cứng TẠM THỜI — đun sôi là hết.' },

  /* ───── BẬC 3 — tầng 26 trở lên ───── */
  { bac: 3, chuyenDe: 'Dãy điện hoá', cau: 'Cho iron vào dung dịch AgNO₃ DƯ, muối trong dung dịch thu được là gì?',
    phuongAn: ['Fe(NO₃)₂', 'Fe(NO₃)₃', 'Hỗn hợp cả hai', 'Không tạo muối'], dung: 1,
    giaiThich: 'Ag⁺ còn dư tiếp tục oxi hoá Fe²⁺ lên Fe³⁺, nên cuối cùng chỉ còn Fe(NO₃)₃. Đây là chỗ rất hay nhầm.' },
  { bac: 3, chuyenDe: 'Nhôm', cau: 'Nhỏ từ từ NaOH đến DƯ vào dung dịch AlCl₃, hiện tượng là gì?',
    phuongAn: ['Kết tủa tăng dần rồi giữ nguyên', 'Không có kết tủa', 'Kết tủa xuất hiện rồi tan hết', 'Sủi bọt khí'], dung: 2,
    giaiThich: 'Đầu tiên tạo Al(OH)₃ trắng keo; NaOH dư hoà tan kết tủa vì Al(OH)₃ lưỡng tính.' },
  { bac: 3, chuyenDe: 'Nhận biết', cau: 'Dung dịch nào phân biệt được hai kim loại Al và Mg?',
    phuongAn: ['HCl', 'NaOH', 'NaCl', 'CuSO₄'], dung: 1,
    giaiThich: 'Chỉ aluminium tan trong NaOH và sủi bọt khí; magnesium không phản ứng.' },
  { bac: 3, chuyenDe: 'Nitrogen', cau: 'Cho copper vào dung dịch HNO₃ LOÃNG, khí thoát ra là khí nào?',
    phuongAn: ['NO₂ nâu đỏ', 'NO không màu, hoá nâu trong không khí', 'H₂', 'N₂'], dung: 1,
    pt: '3Cu + 8HNO₃ → 3Cu(NO₃)₂ + 2NO + 4H₂O',
    giaiThich: 'HNO₃ loãng cho NO; HNO₃ đặc mới cho NO₂. NO gặp oxygen ngoài không khí hoá nâu thành NO₂.' },
  { bac: 3, chuyenDe: 'Thụ động hoá', cau: 'Kim loại nào KHÔNG tan trong HNO₃ đặc NGUỘI?',
    phuongAn: ['Cu (copper)', 'Al (aluminium)', 'Zn (zinc)', 'Mg (magnesium)'], dung: 1,
    giaiThich: 'Aluminium và iron bị thụ động hoá trong HNO₃ đặc nguội và H₂SO₄ đặc nguội — nhờ vậy chở được hai acid này bằng thùng nhôm.' },
  { bac: 3, chuyenDe: 'Thuỷ phân muối', cau: 'Trộn dung dịch FeCl₃ với dung dịch Na₂CO₃ thu được gì?',
    phuongAn: ['Fe₂(CO₃)₃ kết tủa', 'Fe(OH)₃ kết tủa và khí CO₂', 'Không phản ứng', 'FeCO₃ kết tủa'], dung: 1,
    pt: '2FeCl₃ + 3Na₂CO₃ + 3H₂O → 2Fe(OH)₃ + 3CO₂ + 6NaCl',
    giaiThich: 'Fe³⁺ và CO₃²⁻ thuỷ phân hỗ tương hoàn toàn; muối Fe₂(CO₃)₃ không tồn tại trong dung dịch.' },
  { bac: 3, chuyenDe: 'Ester', cau: 'Số đồng phân ester ứng với công thức phân tử C₄H₈O₂ là bao nhiêu?',
    phuongAn: ['2', '3', '4', '5'], dung: 2,
    giaiThich: 'Bốn ester: HCOOCH₂CH₂CH₃, HCOOCH(CH₃)₂, CH₃COOC₂H₅ và C₂H₅COOCH₃.' },
  { bac: 3, chuyenDe: 'Peptide', cau: 'Peptide tạo bởi n gốc α-amino acid có bao nhiêu liên kết peptide?',
    phuongAn: ['n', 'n − 1', 'n + 1', '2n'], dung: 1,
    giaiThich: 'Mỗi liên kết peptide nối hai gốc, nên n gốc xếp thành mạch cần n − 1 liên kết.' },
  { bac: 3, chuyenDe: 'Điện phân', cau: 'Vì sao điện phân nóng chảy Al₂O₃ phải hoà tan trong cryolite?',
    phuongAn: ['Để tăng độ tinh khiết', 'Để hạ nhiệt độ nóng chảy và tăng độ dẫn điện', 'Để tạo màu', 'Để tránh nổ'], dung: 1,
    giaiThich: 'Al₂O₃ nóng chảy ở hơn 2000 °C; hoà trong cryolite hạ xuống khoảng 900 °C, tiết kiệm năng lượng và tăng độ dẫn điện.' },
  { bac: 3, chuyenDe: 'Carbohydrate', cau: 'Thuốc thử nào phân biệt được glucose và fructose?',
    phuongAn: ['Thuốc thử Tollens', 'Dung dịch bromine', 'Cu(OH)₂ ở nhiệt độ thường', 'Quỳ tím'], dung: 1,
    giaiThich: 'Glucose làm mất màu nước bromine, fructose thì không. Cả hai đều tráng bạc nên Tollens không phân biệt được.' },
  { bac: 3, chuyenDe: 'Polymer', cau: 'Tơ nào thuộc loại polyester?',
    phuongAn: ['Nylon-6', 'Tơ lapsan', 'Tơ visco', 'Tơ capron'], dung: 1,
    giaiThich: 'Lapsan (PET) tạo từ ethylene glycol và terephthalic acid, mạch chứa nhóm ester.' },
  { bac: 3, chuyenDe: 'Hỗn hợp kim loại', cau: 'Cho hỗn hợp Fe và Cu vào dung dịch HCl dư, chất rắn còn lại là gì?',
    phuongAn: ['Fe', 'Cu', 'Cả hai', 'Không còn gì'], dung: 1,
    giaiThich: 'Iron tan hết trong HCl; copper đứng sau hydrogen nên không phản ứng và còn lại nguyên.' },
  { bac: 3, chuyenDe: 'Carbon', cau: 'Sục CO₂ đến DƯ vào dung dịch Ca(OH)₂, hiện tượng cuối cùng là gì?',
    phuongAn: ['Kết tủa trắng bền', 'Kết tủa trắng rồi tan dần, dung dịch trong lại', 'Không hiện tượng', 'Sủi bọt khí'], dung: 1,
    pt: 'CaCO₃ + CO₂ + H₂O → Ca(HCO₃)₂',
    giaiThich: 'CO₂ dư hoà tan CaCO₃ thành Ca(HCO₃)₂ tan, nên dung dịch trong trở lại.' },
  { bac: 3, chuyenDe: 'Ester', cau: 'Ester nào khi thuỷ phân trong NaOH dư cho HAI muối?',
    phuongAn: ['Ethyl acetate', 'Phenyl acetate', 'Methyl formate', 'Ethyl formate'], dung: 1,
    pt: 'CH₃COOC₆H₅ + 2NaOH → CH₃COONa + C₆H₅ONa + H₂O',
    giaiThich: 'Ester của phenol cho phenolate là muối thứ hai, vì phenol có tính acid yếu nên phản ứng tiếp với NaOH.' },
  { bac: 3, chuyenDe: 'Sắt', cau: 'Chất nào oxi hoá được Fe²⁺ lên Fe³⁺?',
    phuongAn: ['Cu', 'Cl₂', 'Fe', 'Zn'], dung: 1,
    pt: '2FeCl₂ + Cl₂ → 2FeCl₃',
    giaiThich: 'Chlorine là chất oxi hoá mạnh. Cu, Fe, Zn đều là chất khử nên không oxi hoá được Fe²⁺.' },
  { bac: 3, chuyenDe: 'Amine', cau: 'Vì sao dung dịch methylamine làm quỳ tím hoá xanh?',
    phuongAn: ['Vì có nhóm −COOH', 'Vì cặp electron tự do trên nitrogen nhận proton', 'Vì tan tốt trong nước', 'Vì có liên kết đôi'], dung: 1,
    giaiThich: 'Nitrogen còn cặp electron chưa liên kết, nhận H⁺ của nước sinh ra OH⁻ nên dung dịch có tính base.' },
  { bac: 3, chuyenDe: 'Tốc độ phản ứng', cau: 'Yếu tố nào KHÔNG làm tăng tốc độ phản ứng?',
    phuongAn: ['Tăng nhiệt độ', 'Tăng diện tích bề mặt', 'Thêm chất xúc tác', 'Tăng thể tích bình chứa khí'], dung: 3,
    giaiThich: 'Tăng thể tích làm loãng nồng độ khí, tốc độ phản ứng GIẢM.' },
  { bac: 3, chuyenDe: 'Cân bằng hoá học', cau: 'Phản ứng toả nhiệt đã cân bằng, tăng nhiệt độ thì cân bằng chuyển dịch theo chiều nào?',
    phuongAn: ['Chiều thuận', 'Chiều nghịch', 'Không đổi', 'Tuỳ áp suất'], dung: 1,
    giaiThich: 'Nguyên lí Le Chatelier: tăng nhiệt độ thì cân bằng chuyển theo chiều thu nhiệt, tức chiều nghịch.' },
  { bac: 3, chuyenDe: 'Nhận biết', cau: 'Chỉ dùng MỘT thuốc thử nào để phân biệt ba dung dịch NaCl, Na₂SO₄, Na₂CO₃?',
    phuongAn: ['Dung dịch BaCl₂', 'Quỳ tím', 'Dung dịch HCl', 'Dung dịch AgNO₃'], dung: 2,
    giaiThich: 'HCl chỉ làm Na₂CO₃ sủi bọt khí. Nhưng để tách nốt NaCl và Na₂SO₄ vẫn cần bước hai — đây là lí do đề thi hay hỏi "một thuốc thử" rất kỹ.' },
  { bac: 3, chuyenDe: 'Đại cương kim loại', cau: 'Vì sao vật bằng iron tráng zinc bền hơn tráng tin khi lớp mạ bị xước?',
    phuongAn: ['Vì zinc cứng hơn', 'Vì zinc hoạt động mạnh hơn iron nên bị ăn mòn thay', 'Vì zinc không dẫn điện', 'Vì tin dễ nóng chảy'], dung: 1,
    giaiThich: 'Trong pin điện hoá tạo thành, kim loại mạnh hơn đóng vai anode và bị ăn mòn trước — zinc hi sinh để bảo vệ iron.' },
] as const

/** Bậc khó theo tầng tháp. */
export function bacTheoTang(tang: number): BacKho {
  const t = Math.max(1, Math.round(tang))
  if (t <= 10) return 1
  if (t <= 25) return 2
  return 3
}

/** Chỉ số các câu thuộc một bậc. */
export function chiSoTheoBac(bac: BacKho): number[] {
  const ds: number[] = []
  KHO_CAU_HOI.forEach((c, i) => { if (c.bac === bac) ds.push(i) })
  return ds
}

/* ============================================================
   DỮ LIỆU — Phòng thí nghiệm Ester
   Quy ước chữ: {H2SO4} = công thức (chữ số sau chữ cái thành chỉ số dưới).
   ------------------------------------------------------------
   ĐÁP ÁN MẶC ĐỊNH ở 3 chỗ đề còn tranh luận (thầy đổi tại đây nếu chốt khác):
   - Câu 80 ý (2): 'S' (tỉ lệ 1 : 2). Đổi thành 'D' nếu tính decarboxyl hoá (1 : 3) → đáp án câu thành C.
   - Câu 8 ý b:    'S' (bước 3 chủ yếu loại salicylic acid dư).
   - Câu 50:       'D' là phát biểu sai.
   ============================================================ */
const CHOT = { q3_2: 'S', q4_b: 'S', q8: 'D' };

const KEYS = {
  k1:{ten:'Tách chất', ic:'i-funnel', cv:'--k1', short:'Chiết · chưng cất · kết tinh lại',
    rule:'Hai lớp → <b>chiết</b> (chất có D nhỏ nằm trên). Một lớp → so nhiệt độ sôi: chênh nhiều thì <b>chưng cất thường</b>, chênh ít thì <b>chưng cất phân đoạn</b>, gần trùng thì phải đổi cách. Chất rắn lẫn tạp → <b>kết tinh lại</b>.',
    q:['1a','1b','4d','6a','6c','7c']},
  k2:{ten:'An toàn & dụng cụ', ic:'i-shield', cv:'--k2', short:'Nguồn nhiệt · sinh hàn · đá bọt · hồi lưu',
    rule:'Chất dễ cháy, sôi thấp: <b>không lửa trần</b>, dùng nước nóng. Nguồn nhiệt phải <b>nóng hơn nhiệt độ sôi</b>. Sinh hàn: <b>nước vào thấp, ra cao</b>. Đá bọt chống sôi bùng. Đun lâu mà không mất chất: <b>hồi lưu</b>.',
    q:['1c','1d','6d']},
  k3:{ten:'Vai trò hoá chất', ic:'i-tag', cv:'--k3', short:'Xúc tác · rửa · làm khan · kết tinh',
    rule:'Với mỗi chất, hỏi: <b>thêm vào để làm gì</b>, và <b>thay bằng chất khác có phá sản phẩm không</b>. {H2SO4} đặc: xúc tác + hút nước. {Na2CO3}: trung hoà acid. {NaOH} dư: thuỷ phân mất ester. {NaCl} bão hoà: tách lớp gọn. Chất làm khan: hút nước.',
    q:['2b','4b','4c']},
  k4:{ten:'Con số', ic:'i-calc', cv:'--k4', short:'Hiệu suất · chất thiếu · đọc bảng',
    rule:'Hiệu suất: <b>V → m → n → chất thiếu → lí thuyết → × H → × (1 − hao hụt)</b>. Bảng số liệu: "tăng nhiều nhất" là <b>hiệu số lớn nhất</b>, "tối ưu" là <b>đỉnh</b>, "càng… càng" phải đúng trên <b>cả dãy</b>.',
    q:['2d','4a','5d','7b','7d']},
  k5:{ten:'Soi phân tử', ic:'i-hex', cv:'--k5', short:'NaOH · Br₂ · H₂ · π · gốc acid/alcohol · IR',
    rule:'Đếm từng nhóm rồi cộng. {NaOH}: ester thường 1, ester của phenol 2, –COOH 1, –OH phenol 1. {Br2}: C=C 1, vòng phenol thế vào vị trí o/p còn trống. {H2}: C=C 1, vòng 3, C=O của –COO– không cộng. Ester hoá: <b>acid mất –OH, alcohol mất H</b>.',
    q:['2c','3','5a','5b','5c','6b','7a']},
  k6:{ten:'Tính chất vật lí', ic:'i-thermo', cv:'--k6', short:'Tan · nổi · sôi · nóng chảy',
    rule:'Nổi hay chìm do <b>khối lượng riêng</b>; tan hay không do <b>phân cực, liên kết hydrogen</b>. Mạch dài → nóng chảy cao; thêm C=C cis → gấp khúc → nóng chảy thấp. Ester không có liên kết hydrogen giữa các phân tử nên sôi thấp hơn acid.',
    q:['2a','8']},
};

const TRAPS = {
  nguyennhan:{ten:'Sai nguyên nhân', g:'vì', cv:'--k2', kw:['vì','do','bởi vì','bởi','nên','nhờ'],
    hoi:'Tách hai vế. Hiện tượng đúng chưa? Lí do nêu ra có phải nguyên nhân thật không?'},
  tuyetdoi:{ten:'Tuyệt đối hoá', g:'chỉ', cv:'--k6', kw:['chỉ có','chỉ','duy nhất','không thể','luôn luôn','luôn','hoàn toàn','tất cả','mọi','lí tưởng','lý tưởng','chưa có cơ sở','không bao giờ'],
    hoi:'Tìm một phản ví dụ. Chỉ cần một trường hợp ngược lại là ý sai.'},
  xuhuong:{ten:'Ngoại suy xu hướng', g:'↗', cv:'--k4', kw:['càng','tăng thì','giảm thì','tăng dần','giảm dần','tăng nhiều nhất','giảm nhiều nhất'],
    hoi:'Đọc hết dãy số. Có đỉnh, có chỗ đổi chiều, có mức tăng nhỏ dần không?'},
  conso:{ten:'Con số cài sẵn', g:'#', cv:'--k5', kw:['tỉ lệ mol','tỉ lệ','tối đa','hiệu suất','hao hụt','số liên kết'], num:true,
    hoi:'Không tin số trong đề. Tự tính lại theo chất thiếu, tự đếm lại từng nhóm.'},
  doivai:{ten:'Đổi vai', g:'⇄', cv:'--k3', kw:['gốc','thế nhóm','nhóm –OH','nhóm -OH','của alcohol','của acid','vào ở','ra ở','phía trên','phía dưới','lớp trên','lớp dưới','công thức cấu tạo'],
    hoi:'Vẽ ra: ai cho nhóm nào, nước vào đầu nào, lớp nào nằm trên.'},
  antoan:{ten:'Bẫy an toàn', g:'!', cv:'--bad', kw:['đèn cồn','lửa','đun nhẹ','đun nóng','an toàn','nước nóng','dư','đậm đặc'],
    hoi:'Chất nào dễ cháy, dễ bị phá huỷ? Cách làm có gây cháy hay làm mất sản phẩm không?'},
  tengoi:{ten:'Nhầm khái niệm', g:'≠', cv:'--k1', kw:['thuỷ phân','thủy phân','ester hoá','ester hóa','đa chức','tạp chức','đơn chức','đồng phân','xúc tác','kết tinh lại','chưng cất phân đoạn','chưng cất đơn giản','phương pháp'],
    hoi:'Đối chiếu đúng định nghĩa: tên phản ứng, loại hợp chất, tên phương pháp, vai trò.'},
};

const BEATS = [
  {n:'01', ten:'DỰNG', ic:'i-blocks', cv:'--k1', p:'Vẽ lại thí nghiệm thành dòng chảy: cho gì vào, xảy ra gì, lấy ra gì, bỏ đi gì.'},
  {n:'02', ten:'GẮN', ic:'i-key', cv:'--k5', p:'Mỗi ý hỏi đúng một chìa khoá: tách chất, an toàn, vai trò hoá chất, con số, phân tử hay tính chất vật lí.'},
  {n:'03', ten:'SOI', ic:'i-lens', cv:'--k2', p:'Quét chữ bẫy: "vì", "chỉ", "không thể", "càng… càng", con số cài sẵn, đổi vai.'},
  {n:'04', ten:'CHỐT', ic:'i-check', cv:'--ok', p:'Kiểm bằng quy tắc của chìa khoá hoặc tính lại số. Chỉ chọn Đ/S sau bước này.'},
];

const DEMOS = [
  {id:'d1', nhan:'Câu 34a · ít tan', t:'Isoamyl acetate rất ít tan trong nước vì có khối lượng riêng nhỏ hơn khối lượng riêng của nước.', mark:['vì có khối lượng riêng nhỏ hơn'], d:'S',
    s:['Sau khi chiết: lớp trên là isoamyl acetate, lớp dưới là nước. Ý này hỏi <b>vì sao</b> ester ít tan.',
       'Chìa khoá <b>Tính chất vật lí</b>: tan/không tan và nổi/chìm do hai thứ khác nhau quyết định.',
       'Chữ <b>"vì"</b> → bẫy <b>Sai nguyên nhân</b>. Vế "rất ít tan" đúng; phải kiểm vế lí do.',
       'Nhẹ hơn nước chỉ làm ester <b>nổi lên trên</b>. Ít tan là do ester kém phân cực, không tạo liên kết hydrogen với nước. Ethanol cũng nhẹ hơn nước mà tan vô hạn → <b>Sai</b>.'], k:'k6', bay:'nguyennhan'},
  {id:'d2', nhan:'Câu 33c · đèn cồn', t:'Do diethyl ether có nhiệt độ sôi thấp hơn nhiều so với ethyl acetate nên có thể thu được ethyl acetate bằng cách dùng đèn cồn đun nhẹ cho diethyl ether bay hơi.', mark:['đèn cồn đun nhẹ'], d:'S',
    s:['Lớp ether chứa ethyl acetate. Cần đuổi ether (sôi 34,6 °C) để giữ lại ethyl acetate (77,1 °C).',
       'Chìa khoá <b>An toàn &amp; dụng cụ</b>: chất đang đun có dễ cháy không, nguồn nhiệt là gì?',
       '<b>"đèn cồn"</b> + ether → <b>Bẫy an toàn</b>. Vế "do… sôi thấp hơn nhiều" đúng nhưng không cứu được cách làm.',
       'Hơi ether rất dễ bắt lửa, lan sát mặt bàn tới ngọn lửa. Ether sôi 34,6 °C nên nước nóng đã đủ → <b>Sai</b>.'], k:'k2', bay:'antoan'},
  {id:'d3', nhan:'Câu 40d · càng tăng', t:'Phản ứng có nhiệt độ tối ưu ở 70 °C và kết luận được khi nhiệt độ tăng thì hiệu suất phản ứng càng tăng.', mark:['càng tăng'], d:'S',
    s:['Bảng: 50 → 80 °C, hàm lượng ester 78,65 → <b>86,48 ở 70 °C</b> → 82,15 ở 80 °C.',
       'Chìa khoá <b>Con số</b>: "tối ưu" là đỉnh; "càng… càng" phải đúng trên cả dãy.',
       '<b>"càng tăng"</b> → bẫy <b>Ngoại suy xu hướng</b>. Đọc cả phần sau đỉnh.',
       'Sau 70 °C hàm lượng giảm (85,08 rồi 82,15). Đã có đỉnh thì không thể "càng tăng" → <b>Sai</b>.'], k:'k4', bay:'xuhuong'},
  {id:'d4', nhan:'Câu 31d · sinh hàn', t:'Vai trò của ống sinh hàn để ngưng tụ chất lỏng, nước vào ở (1) và nước ra ở (2).', mark:['vào ở (1)','ra ở (2)'], d:'D',
    s:['Hình 1: (1) là đầu thấp gần bình hứng, (2) là đầu cao gần bình cầu.',
       'Chìa khoá <b>An toàn &amp; dụng cụ</b>: nước làm lạnh luôn vào thấp, ra cao.',
       '<b>"vào ở / ra ở"</b> → nghi bẫy <b>Đổi vai</b>. Kiểm xem (1) là đầu nào.',
       '(1) thấp, (2) cao → vào thấp ra cao, ống luôn đầy nước, chảy ngược chiều hơi → <b>Đúng</b>. Có dấu hiệu bẫy chưa chắc là sai.'], k:'k2', bay:null},
];

/* ---------- chất (K1) ---------- */
const SUBS = {
  ea:{ten:'Ethyl acetate', ct:'CH3COOC2H5', D:0.90, ts:77.1, tan:'it', mau:'--ester'},
  iaac:{ten:'Isoamyl acetate', ct:'CH3COOCH2CH2CH(CH3)2', D:0.876, ts:142, tan:'it', mau:'--ester'},
  etacr:{ten:'Ethyl acrylate', ct:'CH2=CHCOOC2H5', D:0.92, ts:99.0, tan:'it', mau:'--ester'},
  ether:{ten:'Diethyl ether', ct:'C2H5OC2H5', D:0.71, ts:34.6, tan:'it', mau:'--ether'},
  dcm:{ten:'Dichloromethane', ct:'CH2Cl2', D:1.33, ts:39.6, tan:'it', mau:'--dcm'},
  iaoh:{ten:'Isoamyl alcohol', ct:'(CH3)2CHCH2CH2OH', D:0.810, ts:131.1, tan:'it', mau:'--alc'},
  etoh:{ten:'Ethanol', ct:'C2H5OH', D:0.79, ts:78.4, tan:'vh', mau:'--alc'},
  meoh:{ten:'Methanol', ct:'CH3OH', D:0.79, ts:64.7, tan:'vh', mau:'--alc'},
  acoh:{ten:'Acetic acid', ct:'CH3COOH', D:1.049, ts:117.9, tan:'vh', mau:'--acid'},
  acr:{ten:'Acrylic acid', ct:'CH2=CHCOOH', D:1.05, ts:141, tan:'vh', mau:'--acid'},
  nuoc:{ten:'Nước', ct:'H2O', D:1.00, ts:100, tan:'nuoc', mau:'--water'},
  aspirin:{ten:'Aspirin thô (rắn)', ct:'CH3COOC6H4COOH', ran:true, mau:'--crys'},
};
const TANTXT = {it:'ít tan trong nước', vh:'tan vô hạn trong nước', nuoc:'dung môi nước'};
const K1_PRESETS = [
  {id:'q1', nhan:'Câu 33b · ether / ethyl acetate', A:'ea', B:'ether'},
  {id:'q6', nhan:'Câu 31a · sôi gần nhau', A:'iaac', B:'iaoh'},
  {id:'q7', nhan:'Câu 40c · ester / nước', A:'etacr', B:'nuoc'},
  {id:'aspirin', nhan:'Câu 8d · aspirin thô', A:'aspirin', B:'nuoc'},
  {id:'etoh', nhan:'Gần trùng · ethanol', A:'ea', B:'etoh'},
  {id:'dcm', nhan:'Lớp hữu cơ nằm dưới', A:'dcm', B:'nuoc'},
];

/* ---------- bàn thí nghiệm (K2) ---------- */
const K2_OPTS = {
  viec:[['chung','Chưng cất (lấy chất ra)'],['hoiluu','Hồi lưu (đun lâu)']],
  chat:[['ether','Lớp ether chứa ethyl acetate · ether sôi 34,6 °C'],['cao','Hỗn hợp tạo isoamyl acetate · sôi trên 100 °C']],
  nhiet:[['den','Đèn cồn (lửa trần)'],['nuoc','Nước nóng / cách thuỷ']],
  nuoc:[['duoi','Vào thấp – ra cao'],['tren','Vào cao – ra thấp']],
  da:[['co','Có đá bọt'],['khong','Không đá bọt']],
};
const K2_PRESETS = [
  {id:'q1c', nhan:'Câu 33c · đèn cồn + ether', v:{viec:'chung',chat:'ether',nhiet:'den',nuoc:'duoi',da:'co'}},
  {id:'q1d', nhan:'Câu 33d · nước nóng + ether', v:{viec:'chung',chat:'ether',nhiet:'nuoc',nuoc:'duoi',da:'co'}},
  {id:'q6d', nhan:'Câu 31d · sinh hàn', v:{viec:'chung',chat:'cao',nhiet:'den',nuoc:'duoi',da:'co'}},
  {id:'hoiluu', nhan:'Câu 34 bước 1 · hồi lưu', v:{viec:'hoiluu',chat:'cao',nhiet:'den',nuoc:'duoi',da:'co'}},
  {id:'sai3', nhan:'Lắp sai 3 chỗ', v:{viec:'chung',chat:'cao',nhiet:'nuoc',nuoc:'tren',da:'khong'}},
];

/* ---------- vai trò hoá chất (K3) ---------- */
const ROLES = [
  {ch:'{H2SO4} đặc', rc:'--k4', vai:'Xúc tác, đồng thời hút nước làm cân bằng chuyển dịch về phía tạo ester.', neu:'Bỏ đi: phản ứng rất chậm, hiệu suất thấp.'},
  {ch:'Đá bọt', rc:'--k1', vai:'Tạo tâm sôi để chất lỏng sôi êm.', neu:'Thiếu: chất lỏng quá nhiệt rồi sôi bùng, có thể trào ra.'},
  {ch:'{Na2CO3} 10%', rc:'--k5', vai:'Trung hoà acid còn lẫn trong lớp ester, sủi bọt {CO2}; hết bọt là hết acid.', neu:'Base yếu, không thuỷ phân ester đáng kể nên giữ được sản phẩm.'},
  {ch:'{NaOH} dư', rc:'--bad', trap:true, vai:'Không dùng để rửa ester.', neu:'Thuỷ phân ester (xà phòng hoá) → mất chính sản phẩm cần lấy.'},
  {ch:'{NaCl} bão hoà', rc:'--k3', vai:'Giảm độ tan của ester trong nước, giúp hai lớp tách gọn.', neu:'Thiếu: một phần ester tan vào nước, lớp phân cách kém rõ.'},
  {ch:'{Na2SO4} khan', rc:'--k6', vai:'Chất làm khan: hút vết nước còn lẫn trong ester.', neu:'Dùng sau khi đã chiết bỏ lớp nước.'},
  {ch:'Nước lạnh, nước đá', rc:'--water', vai:'Làm aspirin kết tủa (ít tan khi lạnh); anhydride dư bị nước chuyển thành acetic acid tan vào nước.', neu:'Dùng nước ấm: aspirin tan một phần, hao hụt.'},
  {ch:'Ethanol nóng', rc:'--alc', vai:'Dung môi kết tinh lại: aspirin tan khi nóng, kết tinh khi nguội; tạp chất ở lại dung dịch.', neu:'Để nguội từ từ cho tinh thể sạch hơn.'},
  {ch:'{H3PO4} đặc', rc:'--acid', vai:'Xúc tác acid thay cho {H2SO4}, ít gây than hoá.', neu:'Thay được vì ở đây chỉ cần vai trò xúc tác.'},
  {ch:'Diethyl ether', rc:'--ether', vai:'Dung môi chiết: ít tan trong nước, hoà tan tốt ester, sôi thấp nên dễ đuổi đi.', neu:'Rất dễ cháy: không đun bằng lửa trần.'},
];
const ROLE_GAME = [
  {q:'Rửa lớp ester để loại acid còn lẫn mà không làm mất ester, dùng:', a:'{Na2CO3} 10%', o:['{NaOH} dư','{H2SO4} đặc'], why:'{Na2CO3} trung hoà acid; {NaOH} dư thuỷ phân luôn ester.'},
  {q:'Giúp hỗn hợp sôi êm, không trào khi đun:', a:'Đá bọt', o:['{H2SO4} đặc','{NaCl} bão hoà'], why:'Đá bọt tạo tâm sôi.'},
  {q:'Vừa làm xúc tác, vừa hút nước để tăng hiệu suất ester hoá:', a:'{H2SO4} đặc', o:['{Na2CO3} 10%','Đá bọt'], why:'{H2SO4} đặc có tính háo nước, lấy bớt nước sinh ra.'},
  {q:'Làm ester khó tan trong nước hơn, hai lớp tách gọn:', a:'{NaCl} bão hoà', o:['{NaOH} dư','Ethanol nóng'], why:'Nước muối bão hoà làm giảm độ tan của ester.'},
  {q:'Hút vết nước cuối cùng trong ester đã chiết:', a:'{Na2SO4} khan', o:['{Na2CO3} 10%','Nước lạnh, nước đá'], why:'Muối khan ngậm nước, lọc bỏ là được ester khô.'},
  {q:'Làm aspirin tách ra thành chất rắn sau phản ứng acetyl hoá:', a:'Nước lạnh, nước đá', o:['Ethanol nóng','{NaOH} dư'], why:'Aspirin ít tan trong nước lạnh.'},
  {q:'Kết tinh lại aspirin thô, hoà tan trong:', a:'Ethanol nóng', o:['Nước lạnh, nước đá','{NaCl} bão hoà'], why:'Tan khi nóng, kết tinh khi nguội: đúng nguyên tắc kết tinh lại.'},
  {q:'Dung môi chiết ethyl acetate ra khỏi lớp nước:', a:'Diethyl ether', o:['Ethanol','Acetic acid'], why:'Ethanol và acetic acid tan vô hạn trong nước nên không tách lớp được.'},
  {q:'Thay được {H2SO4} đặc làm xúc tác khi tổng hợp aspirin:', a:'{H3PO4} đặc', o:['{NaOH} dư','{Na2SO4} khan'], why:'Chỉ cần một xúc tác acid mạnh.'},
];

/* ---------- con số (K4) ---------- */
const REACT = {
  iaac:{nhan:'Câu 34 · isoamyl acetate', pt:'{CH3COOH} + {(CH3)2CHCH2CH2OH} ⇌ {CH3COOCH2CH2CH(CH3)2} + {H2O}',
    cd:[{ten:'isoamyl alcohol', M:88, V:15, D:0.810},{ten:'acetic acid', M:60, V:10, D:1.049}],
    sp:{ten:'isoamyl acetate', M:130, D:0.876}, hoi:'V', H:54, hh:6},
  aspirin:{nhan:'Câu 8 · aspirin', pt:'{HOC6H4COOH} + {(CH3CO)2O} → {CH3COOC6H4COOH} + {CH3COOH}',
    cd:[{ten:'salicylic acid', M:138, m:69},{ten:'acetic anhydride', M:102, V:70, D:1.08}],
    sp:{ten:'aspirin', M:180}, hoi:'H', mtt:50.4},
  cin:{nhan:'Câu 24 · methyl cinnamate', pt:'{C6H5CH=CHCOOH} + {CH3OH} ⇌ {C6H5CH=CHCOOCH3} + {H2O}',
    cd:[{ten:'cinnamic acid', M:148, m:29.6},{ten:'methanol', du:true}],
    sp:{ten:'methyl cinnamate', M:162}, hoi:'H', mtt:16.2},
  etac:{nhan:'Bài luyện 1 · ethyl acetate', pt:'{CH3COOH} + {C2H5OH} ⇌ {CH3COOC2H5} + {H2O}',
    cd:[{ten:'acetic acid', M:60, m:12.0},{ten:'ethanol', M:46, V:23.0, D:0.79}],
    sp:{ten:'ethyl acetate', M:88}, hoi:'H', mtt:10.56},
};
const DATASETS = {
  q7:{nhan:'Câu 40 · nhiệt độ → ethyl acrylate', x:['50','55','60','65','70','75','80'], xu:'°C', y:[78.65,80.60,82.59,85.05,86.48,85.08,82.15], yl:'Hàm lượng ethyl acrylate', d:2},
  p3:{nhan:'Bài luyện 3 · tỉ lệ mol → hiệu suất', x:['1 : 1','2 : 1','3 : 1','4 : 1','5 : 1'], xu:'', y:[66.7,84.5,90.3,93.0,94.5], yl:'Hiệu suất (%) · tính theo K = 4', d:1},
};

/* ---------- phân tử (K5) ---------- */
/* nhóm: ester (ester của alcohol), esterph (ester của phenol), cooh, ohph (–OH phenol), ohal, cc (C=C ngoài vòng) */
const MOLS = {
  msal:{ten:'Methyl salicylate', ct:'C8H8O3', mui:'dầu gió xanh', ring:true, subs:[{pos:0,seg:[['COO','e1'],['CH3']]},{pos:1,seg:[['OH','p1']]}], g:{e1:{t:'ester'},p1:{t:'ohph',pos:1}}},
  sal:{ten:'Salicylic acid', ct:'C7H6O3', ring:true, subs:[{pos:0,seg:[['COOH','a1']]},{pos:1,seg:[['OH','p1']]}], g:{a1:{t:'cooh'},p1:{t:'ohph',pos:1}}, note:'Mở rộng ngoài chương trình: nước bromine dư có thể đẩy nhóm –COOH ra (thoát {CO2}) tạo 2,4,6-tribromophenol, khi đó tỉ lệ là 1 : 3.'},
  asp:{ten:'Aspirin', ct:'C9H8O4', ring:true, subs:[{pos:0,seg:[['COOH','a1']]},{pos:1,seg:[['OOC','e1'],['CH3']]}], g:{a1:{t:'cooh'},e1:{t:'esterph'}}},
  cin:{ten:'Methyl cinnamate', ct:'C10H10O2', mui:'dâu tây', ring:true, subs:[{pos:1,seg:[['CH=CH','c1'],['–'],['COO','e1'],['CH3']]}], g:{c1:{t:'cc',geo:[['H','C6H5'],['H','COOCH3']]},e1:{t:'ester'}}},
  mbz:{ten:'Methyl benzoate', ct:'C8H8O2', ring:true, subs:[{pos:1,seg:[['COO','e1'],['CH3']]}], g:{e1:{t:'ester'}}},
  phac:{ten:'Phenyl acetate', ct:'C8H8O2', ring:true, subs:[{pos:1,seg:[['OOC','e1'],['CH3']]}], g:{e1:{t:'esterph'}}},
  bzac:{ten:'Benzyl acetate', ct:'C9H10O2', mui:'hoa nhài', ring:true, subs:[{pos:1,seg:[['CH2'],['OOC','e1'],['CH3']]}], g:{e1:{t:'ester'}}},
  ea:{ten:'Ethyl acetate', ct:'C4H8O2', chain:[['CH3'],['COO','e1'],['C2H5']], g:{e1:{t:'ester'}}},
  iaac:{ten:'Isoamyl acetate', ct:'C7H14O2', mui:'chuối', chain:[['CH3'],['COO','e1'],['CH2CH2CH(CH3)2']], g:{e1:{t:'ester'}}},
  vac:{ten:'Vinyl acetate', ct:'C4H6O2', chain:[['CH3'],['COO','e1'],['CH=CH2','c1']], g:{e1:{t:'ester'},c1:{t:'cc',geo:[['H','OOCCH3'],['H','H']]}}},
  mma:{ten:'Methyl methacrylate', ct:'C5H8O2', chain:[['CH2=C(CH3)','c1'],['–'],['COO','e1'],['CH3']], g:{c1:{t:'cc',geo:[['H','H'],['CH3','COOCH3']]},e1:{t:'ester'}}},
  tri:{ten:'Triacetin (glyceryl triacetate)', ct:'C9H14O6', chain:[['(CH3'],['COO','e1'],[')3C3H5']], g:{e1:{t:'ester',n:3}}},
};
const MOL_ORDER = ['msal','sal','asp','cin','mbz','phac','bzac','ea','iaac','vac','mma','tri'];
const REAGENTS = [
  {id:'naoh', nhan:'+ {NaOH}', hoi:'Tỉ lệ mol tối đa với {NaOH}'},
  {id:'br2', nhan:'+ {Br2} (nước bromine)', hoi:'Tỉ lệ mol tối đa với nước bromine'},
  {id:'h2', nhan:'+ {H2} (Ni, t°)', hoi:'Tỉ lệ mol tối đa với {H2}'},
  {id:'pi', nhan:'Đếm π', hoi:'Số liên kết π'},
  {id:'chuc', nhan:'Loại chức', hoi:'Đơn chức, đa chức hay tạp chức'},
  {id:'geo', nhan:'Đồng phân hình học', hoi:'Có đồng phân hình học không'},
];
const K5_PRESETS = {
  'msal-naoh':['msal','naoh'], 'sal-br':['sal','br2'], 'msal-h2':['msal','h2'], 'sal-pi':['sal','pi'], 'msal-chuc':['msal','chuc'],
  'cin-geo':['cin','geo'], 'cin-naoh':['cin','naoh'], 'phac-naoh':['phac','naoh'],
};
const ACIDS = [
  {id:'form', ten:'formic acid', R:'H', an:'formate'},
  {id:'acet', ten:'acetic acid', R:'CH3', an:'acetate'},
  {id:'buta', ten:'butanoic acid', R:'CH3CH2CH2', an:'butanoate'},
  {id:'acry', ten:'acrylic acid', R:'CH2=CH', an:'acrylate'},
  {id:'benz', ten:'benzoic acid', R:'C6H5', an:'benzoate'},
  {id:'cinn', ten:'cinnamic acid', R:'C6H5CH=CH', an:'cinnamate'},
  {id:'sali', ten:'salicylic acid', R:'HOC6H4', an:'salicylate'},
];
const ALCS = [
  {id:'meoh', ten:'methanol', R:'CH3', ts:'methyl'},
  {id:'etoh', ten:'ethanol', R:'C2H5', ts:'ethyl'},
  {id:'iaoh', ten:'isoamyl alcohol', R:'CH2CH2CH(CH3)2', ts:'isoamyl'},
  {id:'bzoh', ten:'benzyl alcohol', R:'CH2C6H5', ts:'benzyl'},
  {id:'phoh', ten:'phenol', R:'C6H5', ts:'phenyl', phenol:true},
];
const SCENTS = {'iaoh|acet':'mùi chuối', 'etoh|buta':'mùi dứa', 'meoh|sali':'mùi dầu gió xanh', 'meoh|cinn':'mùi dâu tây', 'bzoh|acet':'mùi hoa nhài'};
const K5_BUILDER = {'builder-cin':['cinn','meoh'], 'builder-acr':['acry','etoh'], 'gh':['acet','iaoh']};
const IR = {
  acoh:{ten:'Acetic acid', bands:[['ohacid',3000,380,.55],['ch',2950,40,.25],['co',1712,28,.85]], ky:'O–H rất rộng (3 300–2 500) + C=O'},
  iaoh:{ten:'Isoamyl alcohol', bands:[['ohal',3340,130,.7],['ch',2950,45,.4]], ky:'O–H (3 650–3 200), không có C=O'},
  iaac:{ten:'Isoamyl acetate', bands:[['ch',2960,45,.4],['co',1740,24,.9]], ky:'C=O, không có O–H'},
};
const IR_ZONES = [['ohal',3650,3200,'O–H alcohol','--alc'],['ohacid',3300,2500,'O–H acid','--acid'],['co',1780,1650,'C=O','--ester']];

/* ---------- tính chất vật lí (K6) ---------- */
const FATS = {
  pal:{ten:'Palmitic acid', ct:'C15H31COOH', C:16, db:[], tnc:63},
  ste:{ten:'Stearic acid', ct:'C17H35COOH', C:18, db:[], tnc:70},
  pol:{ten:'Palmitoleic acid', ct:'C15H29COOH', C:16, db:[9], tnc:0},
  ole:{ten:'Oleic acid', ct:'C17H33COOH', C:18, db:[9], tnc:13},
  lin:{ten:'Linoleic acid', ct:'C17H31COOH', C:18, db:[9,12], tnc:-5},
  lnn:{ten:'Linolenic acid', ct:'C17H29COOH', C:18, db:[9,12,15], tnc:-11},
};
const FAT_ORDER = ['pal','ste','pol','ole','lin','lnn'];
const K6_PRESETS = {'fat-18':['ole',null], 'fat-ol-li':['ole','lin'], 'fat-16':['ole','pol'], 'fat-pal':['pal','ole']};
const SOLU = [
  {id:'etoh', ten:'Ethanol', D:0.79, tan:true, mau:'--alc', note:'nhẹ hơn nước, tan vô hạn'},
  {id:'iaac', ten:'Isoamyl acetate', D:0.876, tan:false, mau:'--ester', note:'nhẹ hơn nước, ít tan → lớp trên'},
  {id:'acoh', ten:'Acetic acid', D:1.049, tan:true, mau:'--acid', note:'nặng hơn nước, tan vô hạn'},
  {id:'dcm', ten:'Dichloromethane', D:1.33, tan:false, mau:'--dcm', note:'nặng hơn nước, ít tan → lớp dưới'},
];

/* ---------- 8 câu đề thật ---------- */
const QUESTIONS = [
{id:'q1', so:'Câu 33', nguon:'Đề thi thử', dang:'ds', ten:'Chiết ethyl acetate bằng diethyl ether, rồi đuổi dung môi', keys:['k1','k2'],
 de:`<p><b>Câu 33:</b> Một nhóm học sinh đã thực hiện phản ứng điều chế ethyl acetate từ nguyên liệu ban đầu là acetic acid và ethanol trong phòng thí nghiệm. Khi phản ứng kết thúc, nhóm đã thu được hỗn hợp sản phẩm gồm ethyl acetate và acetic acid, ethanol còn dư theo phương trình hoá học:</p>
<div class="eq">{CH3COOH} + {C2H5OH} ⇌ {CH3COOC2H5} + {H2O} &nbsp;<small>(H<sup>+</sup>, t°)</small></div>
<p>Vì ethyl acetate không phân cực, còn acetic acid và ethanol đều phân cực nên nhóm đã dùng dung môi hữu cơ không phân cực diethyl ether ({C2H5OC2H5}) để chiết ethyl acetate ra khỏi hỗn hợp sau phản ứng.</p>`,
 dung:[
  {ic:'i-flask', t:'Hỗn hợp sau phản ứng', p:'Ethyl acetate lẫn acetic acid dư, ethanol dư và nước.', io:[['in','ester'],['in','acid'],['in','ethanol'],['in','nước']]},
  {ic:'i-funnel', t:'Chiết bằng diethyl ether', p:'Lắc với ether rồi để yên: ether nhẹ (D ≈ 0,71), ít tan trong nước nên tách thành lớp trên, kéo ethyl acetate theo.', io:[['in','+ ether']]},
  {ic:'i-funnel', t:'Bỏ lớp dưới, giữ lớp trên', p:'Lớp dưới: nước + acid + ethanol. Lớp trên: ether + ethyl acetate.', io:[['out','bỏ lớp nước'],['in','giữ lớp ether']]},
  {ic:'i-distill', t:'Đuổi ether', p:'Ether sôi 34,6 °C, ethyl acetate 77,1 °C: ether bay đi trước. Nguồn nhiệt không được có lửa.', io:[['out','ether bay đi'],['in','còn ethyl acetate']]}],
 y:[
  {id:'a', t:'Diethyl ether là dung môi chiết lí tưởng trong thí nghiệm trên vì ethyl acetate tan tốt trong dung môi này, còn acetic acid và ethanol lại tan tốt trong nước.', d:'D', k:'k1', bay:null,
   soi:'Có "lí tưởng" và "vì" nên phải kiểm cả hai vế; kiểm xong thấy đều đúng.',
   g:['Chìa khoá <b>Tách chất</b>: một dung môi chiết tốt cần đủ ba điều kiện.','Ba điều kiện: tách lớp với nước; hoà tan tốt chất cần lấy; hoà tan kém các chất muốn bỏ lại.','Ether ít tan trong nước nên tự tách lớp; ethyl acetate kém phân cực tan tốt trong ether; acid và ethanol phân cực ở lại lớp nước. Lí do "vì…" là lí do thật.'],
   giai:'Đúng. Ether tách thành lớp riêng và kéo ethyl acetate sang lớp của mình; acetic acid, ethanol ở lại lớp nước. Ether lại sôi thấp nên dễ đuổi đi sau khi chiết.', lab:['k1','q1']},
  {id:'b', t:'Bằng phương pháp chưng cất đơn giản, ta có thể tách ethyl acetate ra khỏi dung môi diethyl ether sau khi chiết.', d:'D', k:'k1', bay:null,
   soi:'Không có chữ bẫy. Kiểm bằng nhiệt độ sôi.',
   g:['Chìa khoá <b>Tách chất</b>: hai chất lỏng tan vào nhau thì so nhiệt độ sôi.','Ether 34,6 °C, ethyl acetate 77,1 °C. Chênh bao nhiêu độ?','Chênh 42,5 °C là chênh nhiều → chưng cất đơn giản đủ tách.'],
   giai:'Đúng. Hai chất tan vào nhau, nhiệt độ sôi chênh 42,5 °C nên chưng cất đơn giản tách được: ether bay trước, ethyl acetate ở lại bình.', lab:['k1','q1']},
  {id:'c', t:'Do diethyl ether có nhiệt độ sôi thấp hơn nhiều so với ethyl acetate (34,6 °C so với 77,1 °C) nên có thể thu được ethyl acetate sau khi chiết bằng cách dùng đèn cồn đun nhẹ cho dung môi diethyl ether bay hơi.', d:'S', k:'k2', bay:'antoan',
   soi:'"đèn cồn đun nhẹ" với diethyl ether → bẫy an toàn. Vế "do… sôi thấp hơn" đúng nhưng không cứu được cách làm.',
   g:['Chìa khoá <b>An toàn &amp; dụng cụ</b>: chất đang đun có dễ cháy không? Nguồn nhiệt có lửa trần không?','Hơi diethyl ether nặng hơn không khí, rất dễ bắt lửa, lan sát mặt bàn tới ngọn lửa.','Ether sôi 34,6 °C nên nước nóng đã đủ làm nó bay hơi. Lửa trần vừa thừa vừa nguy hiểm.'],
   giai:'Sai. Vế đầu đúng, nhưng dùng đèn cồn với ether rất dễ gây cháy; "đun nhẹ" vẫn là lửa trần. Đuổi ether bằng nước nóng hoặc cách thuỷ.', lab:['k2','q1c']},
  {id:'d', t:'Để an toàn, ta có thể dùng nước nóng liên tục tưới lên bình cầu trong phương pháp chưng cất đơn giản để tách ethyl acetate ra khỏi dung môi diethyl ether sau khi chiết.', d:'D', k:'k2', bay:null,
   soi:'"Để an toàn" → kiểm nguồn nhiệt: có lửa không, có đủ nóng không.',
   g:['Chìa khoá <b>An toàn &amp; dụng cụ</b>: nguồn nhiệt phải nóng hơn nhiệt độ sôi của chất cần đuổi, và không có lửa trần.','Nước nóng (dưới 100 °C) so với 34,6 °C của ether?','Đủ nóng để ether sôi, lại không có ngọn lửa → an toàn.'],
   giai:'Đúng. Nước nóng cao hơn nhiều so với nhiệt độ sôi 34,6 °C của ether nên ether bay hơi được mà không cần lửa.', lab:['k2','q1d']}],
 ket:'a Đ – b Đ – c S – d Đ', nho:'Đuổi ether bằng nhiệt của nước nóng, không bằng lửa.'},

{id:'q2', so:'Câu 34', nguon:'Đề thi thử', dang:'ds', ten:'Điều chế isoamyl acetate: hồi lưu → chiết → rửa → làm khan', keys:['k6','k3','k5','k4'],
 de:`<p><b>Câu 34:</b> Isoamyl acetate (D = 0,876 g/mL) có mùi chuối nên được dùng làm hương liệu nhân tạo. Trong ngành sơn, isoamyl acetate được dùng làm dung môi sơn mài. Isoamyl acetate được điều chế theo các bước sau:</p>
<p>– <b>Bước 1:</b> Cho vào bình cầu 15 mL isoamyl alcohol (D = 0,810 g/mL), 10 mL acetic acid (D = 1,049 g/mL) và 7,0 mL {H2SO4} đậm đặc, cho thêm vào bình vài viên đá bọt. Lắp ống sinh hàn hồi lưu thẳng đứng vào miệng bình cầu. Sau đó đun nóng bình cầu trong khoảng 1 giờ.</p>
<p>– <b>Bước 2:</b> Sau khi đun, để nguội rồi rót sản phẩm vào phễu chiết, lắc đều rồi để yên khoảng 5 phút, chất lỏng tách thành hai lớp, loại bỏ phần chất lỏng phía dưới, lấy phần chất lỏng phía trên.</p>
<p>– <b>Bước 3:</b> Cho từ từ dung dịch {Na2CO3} 10% vào phần chất lỏng thu lấy ở bước 2 và lắc đều cho đến khi không còn khí thoát ra, thêm tiếp 20 mL dung dịch NaCl bão hoà rồi để yên khi đó chất lỏng tách thành hai lớp. Chiết lấy phần chất lỏng phía trên, làm khan, ta thu được isoamyl acetate.</p>`,
 dung:[
  {ic:'i-reflux', t:'Hồi lưu 1 giờ', p:'Isoamyl alcohol + acetic acid + {H2SO4} đặc + đá bọt. Sinh hàn đứng trả hơi về bình nên không mất chất.', io:[['in','alcohol'],['in','acid'],['in','{H2SO4}']]},
  {ic:'i-funnel', t:'Chiết lần 1', p:'Để nguội, lắc, để yên. Lớp trên: ester + chất hữu cơ dư. Lớp dưới: nước, {H2SO4}, phần lớn acid.', io:[['out','bỏ lớp dưới']]},
  {ic:'i-bubbles', t:'Rửa bằng {Na2CO3} 10%', p:'Trung hoà acid còn lẫn → sủi bọt {CO2}. Hết bọt là hết acid.', io:[['out','{CO2}↑']]},
  {ic:'i-salt', t:'Thêm NaCl bão hoà, chiết lần 2', p:'Ester càng khó tan trong nước, hai lớp tách gọn. Lấy lớp trên.', io:[['in','giữ lớp trên']]},
  {ic:'i-dry', t:'Làm khan', p:'Hút vết nước còn lẫn → isoamyl acetate.', io:[['in','isoamyl acetate']]}],
 y:[
  {id:'a', t:'Isoamyl acetate rất ít tan trong nước vì có khối lượng riêng nhỏ hơn khối lượng riêng của nước.', d:'S', k:'k6', bay:'nguyennhan',
   soi:'"vì" nối hai sự thật không liên quan: nổi lên (do nhẹ) và ít tan (do kém phân cực).',
   g:['Chìa khoá <b>Tính chất vật lí</b>: nổi/chìm và tan/không tan do hai thứ khác nhau quyết định.','Tách câu: "rất ít tan" (đúng) + "vì nhẹ hơn nước" (lí do). Lí do này giải thích được độ tan không?','Phản ví dụ: ethanol D = 0,79 nhẹ hơn nước nhưng tan vô hạn; dichloromethane D = 1,33 nặng hơn nước mà vẫn ít tan.'],
   giai:'Sai. Isoamyl acetate ít tan vì phân tử kém phân cực, không tạo được liên kết hydrogen với nước. Khối lượng riêng nhỏ hơn nước chỉ giải thích vì sao lớp ester nằm trên.', lab:['k6','tan']},
  {id:'b', t:'Ở bước 3, không thể thay dung dịch {Na2CO3} bằng dung dịch NaOH dư.', d:'D', k:'k3', bay:null,
   soi:'"không thể" là chữ tuyệt đối → phải tìm được lí do thật khiến NaOH dư bị loại.',
   g:['Chìa khoá <b>Vai trò hoá chất</b>: {Na2CO3} ở bước 3 thêm vào để làm gì?','Để trung hoà acid còn lẫn trong lớp ester (sủi bọt {CO2}). NaOH dư gặp ester thì sao?','NaOH dư thuỷ phân ester (xà phòng hoá) → mất chính sản phẩm cần lấy.'],
   giai:'Đúng. {Na2CO3} chỉ trung hoà acid còn lẫn, hết bọt {CO2} là hết acid. NaOH dư thuỷ phân luôn isoamyl acetate thành {CH3COONa} và isoamyl alcohol.', lab:['k3','naoh']},
  {id:'c', t:'Ở bước 1, xảy ra phản ứng thế nhóm –OH của alcohol bằng gốc {CH3COO}–.', d:'S', k:'k5', bay:'doivai',
   soi:'"–OH của alcohol" → kiểm xem thật ra ai mất nhóm –OH.',
   g:['Chìa khoá <b>Soi phân tử</b>: trong phản ứng ester hoá, acid mất gì, alcohol mất gì?','Thí nghiệm đánh dấu đồng vị O-18 cho thấy O trong cầu C–O–C của ester là O của alcohol.','Acid mất –OH, alcohol chỉ mất H. Nhóm –OH của acid bị thế bằng gốc –O–R của alcohol.'],
   giai:'Sai. Đề đã đổi vai hai chất: chính nhóm –OH của acetic acid bị thế bằng gốc isoamyl–O–; alcohol chỉ mất nguyên tử H.', lab:['k5','gh']},
  {id:'d', t:'Nếu hiệu suất phản ứng ester hoá là 54% và lượng isoamyl acetate bị hao hụt tối đa 6% thì thể tích isoamyl acetate thu được là 10,4 mL. <i>(Làm tròn kết quả đến hàng phần mười.)</i>', d:'D', k:'k4', bay:null,
   soi:'Con số cài sẵn → tự tính lại, không tin số 10,4.',
   g:['Chìa khoá <b>Con số</b>: V → m → n của từng chất, chọn chất thiếu.','n(isoamyl alcohol) = 15 × 0,810 ÷ 88 = 0,1381 mol; n(acetic acid) = 10 × 1,049 ÷ 60 = 0,1748 mol → alcohol thiếu.','m = 0,1381 × 130 × 0,54 × 0,94 = 9,11 g → V = 9,11 ÷ 0,876 = 10,4 mL.'],
   giai:'Đúng. Alcohol thiếu (0,1381 mol). Lí thuyết 0,1381 × 130 = 17,95 g; nhân 0,54 và 0,94 được 9,11 g; chia 0,876 được 10,4 mL.', lab:['k4','iaac']}],
 ket:'a S – b Đ – c S – d Đ', nho:'Tính theo alcohol thiếu; NaOH dư thuỷ phân ester; acid mất –OH.'},

{id:'q3', so:'Câu 80', nguon:'Đề thi thử', dang:'dem', ten:'Methyl salicylate: đếm nhóm chức, vị trí thế, liên kết π', keys:['k5'],
 de:`<p><b>Câu 80:</b> Methyl salicylate dùng làm thuốc xoa bóp giảm đau, được điều chế bằng phản ứng giữa salicylic acid (<i>o</i>-hydroxybenzoic acid) và methanol. Cho các nhận định sau (xem ở dưới). Số nhận định đúng là</p>
<p class="st"><b>A.</b> 4. &nbsp;&nbsp; <b>B.</b> 1. &nbsp;&nbsp; <b>C.</b> 3. &nbsp;&nbsp; <b>D.</b> 2.</p>`,
 dung:[
  {ic:'i-hex', t:'Dựng phân tử', p:'Salicylic acid: vòng benzene + –COOH + –OH ở hai vị trí cạnh nhau (ortho).', io:[['in','–COOH'],['in','–OH phenol']]},
  {ic:'i-flask', t:'Ester hoá với methanol', p:'–COOH thành –COOCH<sub>3</sub>; –OH phenol giữ nguyên → methyl salicylate.', io:[['in','–COOCH3'],['in','–OH phenol']]},
  {ic:'i-lens', t:'Mỗi nhận định là một tác nhân', p:'NaOH, Br<sub>2</sub>, H<sub>2</sub> lần lượt "hỏi" từng nhóm. Đếm từng nhóm rồi cộng.', io:[]}],
 y:[
  {id:'1', t:'Methyl salicylate tác dụng tối đa với NaOH trong dung dịch theo tỉ lệ mol 1 : 2.', d:'D', k:'k5', bay:null,
   soi:'Con số "1 : 2" → tự đếm nhóm phản ứng với NaOH.',
   g:['Chìa khoá <b>Soi phân tử</b>: đếm từng nhóm phản ứng với NaOH.','Methyl salicylate có –COOCH<sub>3</sub> (ester thường) và –OH gắn thẳng vào vòng (phenol).','Ester thường: 1 NaOH. –OH phenol: 1 NaOH. Tổng 2.'],
   giai:'Đúng. 1 NaOH thuỷ phân nhóm ester, 1 NaOH trung hoà –OH phenol → 1 : 2.', lab:['k5','msal-naoh']},
  {id:'2', t:'Salicylic acid tác dụng tối đa với nước bromine theo tỉ lệ mol 1 : 3.', d:CHOT.q3_2, k:'k5', bay:'conso',
   soi:'"1 : 3" là tỉ lệ của phenol. Salicylic acid đã có một vị trí ortho bị chiếm.',
   g:['Chìa khoá <b>Soi phân tử</b>: Br<sub>2</sub> thế vào vòng ở vị trí ortho và para so với –OH, và chỉ ở vị trí còn trống.','–OH ở vị trí 2. Hai vị trí ortho: vị trí 1 (đã có –COOH) và vị trí 3. Vị trí para: 5.','Còn trống vị trí 3 và 5 → 2 Br → 1 : 2.'],
   giai:'Sai theo cách đếm của chương trình: chỉ còn 2 vị trí ortho/para trống nên tỉ lệ là 1 : 2. <i>Mở rộng:</i> nước bromine dư có thể đẩy nhóm –COOH ra (thoát {CO2}) tạo 2,4,6-tribromophenol; nếu đề tính theo hướng này thì 1 : 3.', lab:['k5','sal-br']},
  {id:'3', t:'Methyl salicylate tác dụng tối đa với {H2} (xt Ni, t°) theo tỉ lệ mol 1 : 3.', d:'D', k:'k5', bay:null,
   soi:'Con số "1 : 3" → đếm liên kết cộng được H<sub>2</sub>.',
   g:['Chìa khoá <b>Soi phân tử</b>: H<sub>2</sub> (Ni, t°) cộng vào C=C và vòng benzene, không cộng vào C=O của nhóm –COO–.','Methyl salicylate có một vòng benzene, không có C=C ngoài vòng.','Vòng benzene cộng 3 H<sub>2</sub> → 1 : 3.'],
   giai:'Đúng. Chỉ vòng benzene cộng H<sub>2</sub> (3 phân tử); C=O trong nhóm ester không bị khử trong điều kiện này.', lab:['k5','msal-h2']},
  {id:'4', t:'Số liên kết π trong salicylic acid là 5.', d:'S', k:'k5', bay:'conso',
   soi:'Con số "5" → tự đếm π.',
   g:['Chìa khoá <b>Soi phân tử</b>: π = π trong vòng + π của từng C=O + π của C=C ngoài vòng.','Vòng benzene: 3 π. Nhóm –COOH: 1 π (C=O). Nhóm –OH: không có π.','3 + 1 = 4.'],
   giai:'Sai. Salicylic acid có 4 liên kết π: 3 trong vòng benzene và 1 trong C=O của –COOH.', lab:['k5','sal-pi']},
  {id:'5', t:'Methyl salicylate là hợp chất hữu cơ đa chức.', d:'S', k:'k5', bay:'tengoi',
   soi:'"đa chức" → đối chiếu định nghĩa đa chức / tạp chức.',
   g:['Chìa khoá <b>Soi phân tử</b>: đa chức là nhiều nhóm chức cùng loại, tạp chức là các nhóm chức khác loại.','Methyl salicylate có những nhóm chức nào?','Một nhóm ester và một nhóm –OH phenol: khác loại → tạp chức.'],
   giai:'Sai. Methyl salicylate có nhóm ester và nhóm –OH phenol, hai nhóm khác loại nên là hợp chất tạp chức.', lab:['k5','msal-chuc']}],
 mc:{hoi:'Số nhận định đúng là', o:[['A','4'],['B','1'],['C','3'],['D','2']], d: CHOT.q3_2==='D' ? 'C' : 'D'},
 ket: CHOT.q3_2==='D' ? 'Đúng (1), (2), (3) → C' : 'Đúng (1), (3) → 2 nhận định → D', nho:'Br<sub>2</sub> chỉ thế vào vị trí o/p còn trống; 4 liên kết π; tạp chức.'},

{id:'q4', so:'Câu 8', nguon:'Sở Tuyên Quang lần 1 – 2026', dang:'ds', ten:'Tổng hợp aspirin: acetyl hoá → kết tủa → kết tinh lại → cân', keys:['k4','k3','k1'],
 de:`<p><b>Câu 8:</b> Aspirin (hay acetylsalicylic acid), là một dẫn xuất của salicylic acid được sử dụng để hạ sốt và giảm đau. Cho quy trình tổng hợp Aspirin trong phòng thí nghiệm như sau:</p>
<p>– <b>Bước 1:</b> Cho 69 gam salicylic acid khan và 70,0 mL acetic anhydride (d = 1,08 g/mL) vào bình cầu 250 mL; thêm 3,0 mL sulfuric acid 98% vào và lắc kĩ. Sau đó, khuấy hỗn hợp phản ứng ở 50 – 60 °C trong khoảng 45 phút cho đến khi tan hết phần chất rắn.</p>
<p>– <b>Bước 2:</b> Dùng nước đá để làm lạnh hỗn hợp phản ứng đến nhiệt độ nhỏ hơn 10 °C. Thêm từ từ 750 mL nước cất và khuấy kỹ, aspirin sẽ kết tủa. Lọc lấy sản phẩm bằng phễu lọc Buchner.</p>
<p>– <b>Bước 3:</b> Hoà tan aspirin thô trong 150 mL ethanol 90° (cần đun nóng để tan hoàn toàn), sau đó đổ dung dịch này từ từ vào 375 mL nước nóng khoảng 50 °C. Nếu aspirin kết tủa lại thì cần đun nóng cho tan hết. Để nguội dung dịch thu được đến nhiệt độ phòng. Aspirin sẽ kết tinh dưới dạng tinh thể. Lọc và hút kiệt rồi sấy khô ở 50 °C.</p>
<p>– <b>Bước 4:</b> Cân sản phẩm thu được 50,4 gam aspirin.</p>
<div class="eq">{HOC6H4COOH} + {(CH3CO)2O} → {CH3COOC6H4COOH} + {CH3COOH}</div>`,
 dung:[
  {ic:'i-heat', t:'Acetyl hoá (bước 1)', p:'Salicylic acid + acetic anhydride (dư), xúc tác {H2SO4}, khuấy 50–60 °C đến khi tan hết.', io:[['in','salicylic acid'],['in','anhydride']]},
  {ic:'i-ice', t:'Làm lạnh, thêm nước (bước 2)', p:'Aspirin ít tan trong nước lạnh nên kết tủa; anhydride dư bị nước chuyển thành acetic acid, tan vào nước.', io:[['out','acetic acid vào nước']]},
  {ic:'i-filter', t:'Lọc Buchner', p:'Được aspirin thô, còn lẫn salicylic acid và tạp chất khác.', io:[['out','nước lọc'],['in','aspirin thô']]},
  {ic:'i-crystal', t:'Kết tinh lại (bước 3)', p:'Tan trong ethanol nóng + nước ấm, để nguội → tinh thể aspirin; tạp chất ở lại dung dịch.', io:[['out','salicylic acid dư ở lại dung dịch']]},
  {ic:'i-scale', t:'Sấy, cân (bước 4)', p:'Thu 50,4 g aspirin.', io:[['in','50,4 g']]}],
 y:[
  {id:'a', t:'Hiệu suất của phản ứng tổng hợp aspirin ở thí nghiệm trên là 56%.', d:'D', k:'k4', bay:null,
   soi:'Con số "56%" → tự tính lại theo chất thiếu.',
   g:['Chìa khoá <b>Con số</b>: tính số mol từng chất, chọn chất thiếu.','Salicylic acid 69 ÷ 138 = 0,5 mol. Acetic anhydride 70 × 1,08 = 75,6 g → 75,6 ÷ 102 = 0,741 mol → anhydride dư.','Lí thuyết: 0,5 × 180 = 90 g. H = 50,4 ÷ 90 = 56%.'],
   giai:'Đúng. Tính theo salicylic acid (0,5 mol): lí thuyết 90 g aspirin; thực tế 50,4 g → H = 56%.', lab:['k4','aspirin']},
  {id:'b', t:'Ở bước 2, chất rắn thu được chưa tinh khiết; bước 3 có vai trò loại bỏ acetic acid.', d:CHOT.q4_b, k:'k3', bay:'tengoi',
   soi:'Câu ghép hai vế. Vế 1 đúng; phải kiểm vai trò nêu ở vế 2.',
   g:['Chìa khoá <b>Vai trò hoá chất</b>: mỗi bước loại tạp chất nào?','Acetic acid tan tốt trong nước. Ở bước 2 đã thêm 750 mL nước rồi lọc: acetic acid đi đâu?','Acetic acid theo nước lọc ở bước 2. Bước 3 kết tinh lại chủ yếu để loại salicylic acid dư và tạp chất bám trên tinh thể.'],
   giai:'Sai. Vế đầu đúng. Nhưng acetic acid tan trong nước đã bị loại theo nước lọc ở bước 2; kết tinh lại ở bước 3 chủ yếu loại salicylic acid chưa phản ứng và các tạp chất khác.', lab:['k3','kettinh']},
  {id:'c', t:'Có thể thay {H2SO4} 98% bằng dung dịch {H3PO4} 98%.', d:'D', k:'k3', bay:null,
   soi:'"có thể thay" → hỏi vai trò của {H2SO4} ở đây là gì.',
   g:['Chìa khoá <b>Vai trò hoá chất</b>: {H2SO4} 98% ở bước 1 đóng vai trò gì?','Chỉ làm xúc tác acid cho phản ứng acetyl hoá.','{H3PO4} đặc cũng là xúc tác acid, lại ít gây than hoá → thay được.'],
   giai:'Đúng. {H2SO4} chỉ là xúc tác acid; {H3PO4} đặc làm được việc đó và thường được dùng khi tổng hợp aspirin.', lab:['k3','h3po4']},
  {id:'d', t:'Phương pháp tinh chế được sử dụng ở thí nghiệm trên là phương pháp kết tinh lại.', d:'D', k:'k1', bay:null,
   soi:'"kết tinh lại" là tên phương pháp → đối chiếu với bước 3.',
   g:['Chìa khoá <b>Tách chất</b>: chất cần lấy là chất rắn lẫn tạp → dùng phương pháp nào?','Bước 3: hoà tan khi nóng, để nguội cho tinh thể tách ra, lọc.','Đó đúng là kết tinh lại.'],
   giai:'Đúng. Hoà tan aspirin thô trong dung môi nóng rồi để nguội cho aspirin kết tinh, tạp chất ở lại dung dịch: đó là kết tinh lại.', lab:['k1','aspirin']}],
 ket:'a Đ – b S – c Đ – d Đ', nho:'H = 50,4 ÷ 90 = 56%; bước 3 là kết tinh lại, loại salicylic acid dư.'},

{id:'q5', so:'Câu 24', nguon:'Đề thi thử', dang:'ds', ten:'Methyl cinnamate: đồng phân hình học, công thức, hiệu suất', keys:['k5','k4'],
 de:`<p><b>Câu 24:</b> Methyl cinnamate là một ester có công thức phân tử {C10H10O2} và có mùi thơm của dâu tây (strawberry) được sử dụng trong ngành công nghiệp hương liệu và nước hoa. Để điều chế 16,2 gam ester methyl cinnamate người ta cho 29,6 gam cinnamic acid phản ứng với lượng dư methyl alcohol ({CH3OH}).</p>
<div class="fig">Hình trong đề: vòng benzene – CH=CH – C(=O) – O – CH<sub>3</sub> &nbsp;({C6H5}–CH=CH–{COOCH3})</div>
<p class="note">Đề in "cinnmate"; tên đúng là "cinnamate".</p>`,
 dung:[
  {ic:'i-hex', t:'Dựng phân tử', p:'{C6H5}–CH=CH–COO–{CH3}: gốc acid {C6H5}–CH=CH–CO– (từ cinnamic acid), gốc alcohol –{CH3} (từ methanol).', io:[['in','gốc acid'],['in','gốc alcohol']]},
  {ic:'i-flask', t:'Phản ứng', p:'29,6 g cinnamic acid + methanol dư → 16,2 g ester.', io:[['in','methanol dư']]},
  {ic:'i-lens', t:'Soi từng điểm', p:'Một C=C (xét cis/trans), một nhóm ester thường (xét NaOH), số mol (xét hiệu suất).', io:[]}],
 y:[
  {id:'a', t:'Methyl cinnamate có đồng phân hình học.', d:'D', k:'k5', bay:null,
   soi:'Kiểm điều kiện đồng phân hình học ở C=C.',
   g:['Chìa khoá <b>Soi phân tử</b>: đồng phân hình học cần mỗi carbon của C=C mang hai nhóm khác nhau.','C bên trái của C=C mang H và {C6H5}; C bên phải mang H và {COOCH3}.','Cả hai carbon đều mang hai nhóm khác nhau → có cis và trans.'],
   giai:'Đúng. Mỗi carbon của C=C mang hai nhóm khác nhau (H/{C6H5} và H/{COOCH3}) nên có đồng phân hình học.', lab:['k5','cin-geo']},
  {id:'b', t:'Methyl cinnamate có công thức cấu tạo là {CH3COO}–CH=CH–{C6H5}.', d:'S', k:'k5', bay:'doivai',
   soi:'Hai công thức cùng {C10H10O2} nhưng gốc acid và gốc alcohol đã bị đổi chỗ.',
   g:['Chìa khoá <b>Soi phân tử</b>: trong R–COO–R′, R lấy từ acid, R′ lấy từ alcohol.','Acid là cinnamic acid ({C6H5}–CH=CH–COOH), alcohol là methanol ({CH3OH}).','Vậy ester là {C6H5}–CH=CH–COO–{CH3}. Công thức {CH3COO}–… có gốc acid là acetic → sai.'],
   giai:'Sai. Methyl cinnamate là {C6H5}–CH=CH–COO–{CH3}. Công thức đề cho là ester của acetic acid: cùng công thức phân tử nhưng khác cấu tạo.', lab:['k5','builder-cin']},
  {id:'c', t:'Methyl cinnamate phản ứng với NaOH với tỉ lệ 1 : 2.', d:'S', k:'k5', bay:'conso',
   soi:'"1 : 2" chỉ có khi là ester của phenol hoặc có thêm nhóm phản ứng với NaOH.',
   g:['Chìa khoá <b>Soi phân tử</b>: đếm nhóm phản ứng với NaOH.','Nhóm –COO– gắn với gốc methyl, không gắn thẳng vào vòng. Có –OH phenol hay –COOH không?','Chỉ một nhóm ester thường → 1 : 1.'],
   giai:'Sai. Methyl cinnamate chỉ có một nhóm ester của alcohol (methanol), không có –OH phenol → tỉ lệ 1 : 1.', lab:['k5','cin-naoh']},
  {id:'d', t:'Hiệu suất phản ứng ester hoá trong trường hợp này là 50%.', d:'D', k:'k4', bay:null,
   soi:'Con số → tự tính theo chất thiếu (methanol dư).',
   g:['Chìa khoá <b>Con số</b>: methanol dư → tính theo cinnamic acid.','n(acid) = 29,6 ÷ 148 = 0,2 mol → tối đa 0,2 mol ester.','Thực tế 16,2 ÷ 162 = 0,1 mol → H = 50%.'],
   giai:'Đúng. 0,2 mol cinnamic acid cho tối đa 0,2 mol ester; thu được 0,1 mol → H = 50%.', lab:['k4','cin']}],
 ket:'a Đ – b S – c S – d Đ', nho:'Gốc acid đứng trước "COO", gốc alcohol đứng sau; NaOH 1 : 1.'},

{id:'q6', so:'Câu 31', nguon:'Đề thi thử', dang:'ds', ten:'Chưng cất isoamyl acetate: ống sinh hàn, bình hứng, phổ IR', keys:['k1','k5','k2'],
 de:`<p><b>Câu 31:</b> Isoamyl acetate được dùng để tạo mùi chuối trong thực phẩm. Chất này cũng được dùng làm dung môi vecni và sơn mài cũng như dùng làm chất dẫn dụ các đàn ong mật đến một địa điểm nhỏ. Trong phòng thí nghiệm, isoamyl acetate được điều chế từ acetic acid và isoamyl alcohol với xúc tác {H2SO4} đặc, ở nhiệt độ khoảng 145 °C theo mô hình thí nghiệm sau:</p>
<div class="fig"><b>Hình 1:</b> đèn cồn đun bình cầu có nhánh cắm nhiệt kế; ống sinh hàn nằm nghiêng nối từ nhánh xuống bình hứng; nước làm lạnh vào ở <b>(1)</b> – đầu thấp gần bình hứng, ra ở <b>(2)</b> – đầu cao gần bình cầu.<br><b>Hình 2:</b> phễu chiết có khoá, bên trong hai lớp: "lớp chất lỏng nhẹ hơn" ở trên, "lớp chất lỏng nặng hơn" ở dưới.</div>
<p>Sau thí nghiệm, tiến hành phân tách sản phẩm. Ghi phổ hồng ngoại của acetic acid, isoamyl alcohol và isoamyl acetate. Cho biết số sóng hấp thụ đặc trưng của một số liên kết trên phổ hồng ngoại như sau:</p>
<div class="tbl"><table><tr><th>Liên kết</th><th>O–H (alcohol)</th><th>O–H (carboxylic acid)</th><th>C=O (ester, carboxylic acid)</th><th>C–O (ester)</th></tr><tr><td>Số sóng (cm<sup>−1</sup>)</td><td>3 650 – 3 200</td><td>3 300 – 2 500</td><td>1 780 – 1 650</td><td>1 300 – 1 000</td></tr></table></div>
<p>Biết nhiệt độ sôi của các chất acetic acid, isoamyl alcohol và isoamyl acetate lần lượt là 117,9 °C; 131,1 °C và 142 °C.</p>`,
 dung:[
  {ic:'i-heat', t:'Đun khoảng 145 °C', p:'Đèn cồn đun bình cầu có nhánh; nhiệt kế đo nhiệt độ của hơi.', io:[['in','acid + alcohol + {H2SO4}']]},
  {ic:'i-distill', t:'Hơi qua ống sinh hàn', p:'Nước lạnh vào (1) đầu thấp, ra (2) đầu cao, chảy ngược chiều hơi.', io:[]},
  {ic:'i-funnel', t:'Bình hứng → phễu chiết', p:'Chất lỏng thu được là hỗn hợp: ester, acid, alcohol, nước. Tách lớp tiếp.', io:[['out','lớp nặng'],['in','lớp nhẹ']]},
  {ic:'i-ir', t:'Ghi phổ IR', p:'Nhận ra acid, alcohol, ester bằng dải O–H và C=O.', io:[]}],
 y:[
  {id:'a', t:'Không thể dùng phương pháp chưng cất phân đoạn để tách các chất lỏng trong hỗn hợp sau phản ứng.', d:'S', k:'k1', bay:'tuyetdoi',
   soi:'"Không thể" → tìm xem có cách làm được không.',
   g:['Chìa khoá <b>Tách chất</b>: các chất tan vào nhau thì so nhiệt độ sôi.','117,9 °C; 131,1 °C; 142 °C: chênh nhau 11–13 °C.','Chênh ít chính là trường hợp dùng chưng cất phân đoạn.'],
   giai:'Sai. Nhiệt độ sôi chênh 11–13 °C: quá gần cho chưng cất đơn giản nhưng đúng là việc của chưng cất phân đoạn (có cột phân đoạn).', lab:['k1','q6']},
  {id:'b', t:'Dựa vào phổ hồng ngoại, có thể phân biệt được acetic acid, isoamyl alcohol và isoamyl acetate.', d:'D', k:'k5', bay:null,
   soi:'Kiểm xem mỗi chất có "chữ kí" riêng trên phổ không.',
   g:['Chìa khoá <b>Soi phân tử</b>: mỗi nhóm chức có vùng hấp thụ riêng.','Acid: O–H rất rộng 3 300–2 500 + C=O. Alcohol: O–H 3 650–3 200, không có C=O.','Ester: có C=O nhưng không có O–H. Ba tổ hợp khác nhau → phân biệt được.'],
   giai:'Đúng. Acid có O–H (3 300–2 500) và C=O; alcohol có O–H (3 650–3 200) mà không có C=O; ester có C=O mà không có O–H.', lab:['k5','ir']},
  {id:'c', t:'Chất lỏng trong bình hứng chỉ có isoamyl acetate.', d:'S', k:'k1', bay:'tuyetdoi',
   soi:'"chỉ có" → tìm chất khác cũng bay sang bình hứng.',
   g:['Chìa khoá <b>Tách chất</b>: đun tới khoảng 145 °C, những chất nào đã bay hơi?','Acetic acid sôi 117,9 °C, isoamyl alcohol 131,1 °C, nước 100 °C: đều thấp hơn 145 °C.','Chúng cùng bay sang bình hứng → hỗn hợp, phải tách tiếp bằng phễu chiết (hình 2).'],
   giai:'Sai. Ở khoảng 145 °C thì acid, alcohol dư và nước cũng bay hơi, ngưng tụ vào bình hứng. Vì là hỗn hợp nên đề mới cho hình phễu chiết.', lab:['k1','q6']},
  {id:'d', t:'Vai trò của ống sinh hàn để ngưng tụ chất lỏng, nước vào ở (1) và nước ra ở (2).', d:'D', k:'k2', bay:null,
   soi:'"vào ở (1), ra ở (2)" → xem (1) là đầu thấp hay đầu cao.',
   g:['Chìa khoá <b>An toàn &amp; dụng cụ</b>: nước làm lạnh luôn vào ở đầu thấp, ra ở đầu cao.','Theo hình: (1) là đầu thấp gần bình hứng, (2) là đầu cao gần bình cầu.','Vào (1) ra (2) = vào thấp ra cao, chảy ngược chiều hơi → đúng.'],
   giai:'Đúng. Nước vào ở đầu thấp (1), ra ở đầu cao (2): ống luôn đầy nước và chảy ngược chiều hơi nên ngưng tụ triệt để.', lab:['k2','q6d']}],
 ket:'a S – b Đ – c S – d Đ', nho:'Bình hứng là hỗn hợp; nước vào thấp ra cao; sôi gần nhau dùng chưng cất phân đoạn.'},

{id:'q7', so:'Câu 40', nguon:'Sở Vĩnh Long lần 1 – 2025', dang:'ds', ten:'Ethyl acrylate: nhiệt độ tối ưu và cách tách ester', keys:['k5','k4','k1'],
 de:`<p><b>Câu 40:</b> Để khảo sát ảnh hưởng của nhiệt độ đến quá trình tổng hợp ethyl acrylate, một loạt thí nghiệm được tiến hành với hỗn hợp phản ứng gồm acrylic acid và ethanol theo tỉ lệ mol 1 : 1 và {H2SO4} đặc được sử dụng làm chất xúc tác với nồng độ cố định. Quá trình phản ứng được thực hiện dưới điều kiện đun hồi lưu liên tục trong thời gian 6 giờ ở các mức nhiệt độ khác nhau (50 °C – 80 °C). Sau khi kết thúc phản ứng, hỗn hợp được làm nguội và xử lý nhằm tách sản phẩm, sau đó tiến hành phân tích để đánh giá hiệu suất tạo thành ethyl acrylate ở từng điều kiện nhiệt độ. Kết quả thí nghiệm được thể hiện như bảng dưới đây.</p>
<div class="tbl"><table><tr><th>Nhiệt độ (°C)*</th><th>50</th><th>55</th><th>60</th><th>65</th><th>70</th><th>75</th><th>80</th></tr><tr><td>Hàm lượng ethyl acrylate</td><td>78,65</td><td>80,60</td><td>82,59</td><td>85,05</td><td>86,48</td><td>85,08</td><td>82,15</td></tr></table></div>
<p class="note">*Đề in "Nhiệt độ sôi"; thực chất là nhiệt độ tiến hành phản ứng.</p>
<div class="tbl"><table><tr><th>Chất</th><th>Khối lượng riêng (g.mL<sup>−1</sup>)</th><th>Độ tan trong 100 g nước (g)</th><th>Nhiệt độ sôi (°C)</th></tr>
<tr><td>{H2O}</td><td>1,00</td><td>–</td><td>100</td></tr><tr><td>{CH2=CHCOOH}</td><td>1,05</td><td>Vô hạn</td><td>141</td></tr><tr><td>{C2H5OH}</td><td>0,79</td><td>Vô hạn</td><td>78,4</td></tr><tr><td>{CH2=CHCOOC2H5}</td><td>0,92</td><td>2,00</td><td>99,0</td></tr></table></div>`,
 dung:[
  {ic:'i-reflux', t:'Hồi lưu 6 giờ', p:'Acrylic acid + ethanol (1 : 1), {H2SO4} đặc, ở từng nhiệt độ 50–80 °C.', io:[['in','acid'],['in','ethanol']]},
  {ic:'i-chart', t:'Đo hàm lượng ester', p:'Mỗi nhiệt độ cho một con số → bảng số liệu.', io:[]},
  {ic:'i-funnel', t:'Chọn cách tách', p:'So ester với nước: nhiệt độ sôi, độ tan, khối lượng riêng.', io:[]}],
 y:[
  {id:'a', t:'Phản ứng tổng hợp trong thí nghiệm này là phản ứng thuỷ phân ester.', d:'S', k:'k5', bay:'tengoi',
   soi:'"thuỷ phân ester" → đối chiếu chiều phản ứng.',
   g:['Chìa khoá <b>Soi phân tử</b>: acid + alcohol → ester + nước gọi là phản ứng gì?','Thuỷ phân ester là chiều ngược lại: ester + nước → acid + alcohol.','Ở đây tạo ester từ acid và alcohol → phản ứng ester hoá.'],
   giai:'Sai. Acrylic acid + ethanol → ethyl acrylate + nước là phản ứng ester hoá; thuỷ phân ester là chiều ngược lại.', lab:['k5','builder-acr']},
  {id:'b', t:'Với các giá trị nhiệt độ khảo sát, hiệu suất tổng hợp ethyl acrylate tăng nhiều nhất trong khoảng nhiệt độ từ 60 °C đến 65 °C.', d:'D', k:'k4', bay:null,
   soi:'"tăng nhiều nhất" → so hiệu số từng khoảng, đừng nhìn đỉnh.',
   g:['Chìa khoá <b>Con số</b>: "tăng nhiều nhất" là hiệu số giữa hai mốc liền kề lớn nhất.','Hiệu số: +1,95; +1,99; +2,46; +1,43; −1,40; −2,93.','Lớn nhất +2,46 ở 60 → 65 °C.'],
   giai:'Đúng. Hiệu số lớn nhất là 85,05 − 82,59 = +2,46, ở khoảng 60 → 65 °C.', lab:['k4','bang-q7']},
  {id:'c', t:'Để tách ester ra khỏi hỗn hợp, sử dụng phương pháp chưng cất sẽ phù hợp hơn phương pháp chiết.', d:'S', k:'k1', bay:'tengoi',
   soi:'So hai phương pháp bằng số liệu: nhiệt độ sôi, độ tan, khối lượng riêng.',
   g:['Chìa khoá <b>Tách chất</b>: tách lớp được thì chiết; một lớp mới so nhiệt độ sôi.','Ester sôi 99,0 °C, nước 100 °C: gần trùng → chưng cất không tách được.','Ester chỉ tan 2 g/100 g nước, D = 0,92 → tự tách lớp nổi trên nước → chiết.'],
   giai:'Sai. Nhiệt độ sôi của ester (99,0 °C) gần trùng nước (100 °C) nên chưng cất không tách được; ester ít tan và nhẹ hơn nước nên chiết phù hợp hơn.', lab:['k1','q7']},
  {id:'d', t:'Từ kết quả thí nghiệm trên, phản ứng có nhiệt độ tối ưu ở 70 °C và kết luận được khi nhiệt độ tăng thì hiệu suất phản ứng càng tăng.', d:'S', k:'k4', bay:'xuhuong',
   soi:'"càng tăng" → đọc hết dãy, tìm chỗ đổi chiều.',
   g:['Chìa khoá <b>Con số</b>: "tối ưu" là đỉnh; "càng… càng" phải đúng trên cả dãy.','Đỉnh 86,48 ở 70 °C. Sau đó: 85,08 (75 °C), 82,15 (80 °C).','Có đỉnh rồi giảm → vế sau sai.'],
   giai:'Sai. Vế "tối ưu ở 70 °C" đúng, nhưng sau 70 °C hàm lượng giảm nên không thể kết luận nhiệt độ càng tăng hiệu suất càng tăng.', lab:['k4','bang-q7']}],
 ket:'a S – b Đ – c S – d S', nho:'+2,46 lớn nhất ở 60 → 65 °C; đỉnh 70 °C; ester sôi gần trùng nước nên chiết.'},

{id:'q8', so:'Câu 50', nguon:'Đề thi thử', dang:'sai', ten:'Acid béo: liên kết đôi, độ dài mạch và nhiệt độ nóng chảy', keys:['k6'],
 de:`<p><b>Câu 50:</b> Khi các acid béo không no có nhiều liên kết đôi (C=C) thì nhiệt độ nóng chảy của nó sẽ bé hơn các acid béo có cùng số nguyên tử carbon nhưng ít liên kết đôi hơn. Phát biểu nào sau đây là <b>sai</b>?</p>
<p class="note">Đã sửa lỗi in của đề gốc: palmitic acid là {C15H31COOH} (acid béo no), không phải {C15H29COOH}.</p>`,
 dung:[
  {ic:'i-hex', t:'Dựng mạch', p:'Acid béo = mạch carbon dài 16–18 C + nhóm –COOH.', io:[]},
  {ic:'i-thermo', t:'Hai yếu tố quyết định nhiệt độ nóng chảy', p:'Độ dài mạch (dài → cao) và số C=C cis (nhiều → thấp).', io:[['in','mạch dài ↑'],['out','C=C cis ↓']]},
  {ic:'i-lens', t:'Soi từng phát biểu', p:'Tìm phát biểu SAI: phát biểu nào phủ nhận một trong hai yếu tố?', io:[]}],
 y:[
  {id:'A', t:'Khi trong phân tử acid béo có nhiều liên kết đôi thì mức độ cồng kềnh càng lớn và do đó sự sắp xếp giữa các phân tử trở nên kém đặc khít.', d:'D', k:'k6', bay:null,
   soi:'Kiểm chuỗi lí lẽ: nhiều C=C → cồng kềnh → xếp kém khít.',
   g:['Chìa khoá <b>Tính chất vật lí</b>: C=C dạng cis làm mạch gấp khúc.','Mạch gấp khúc thì các phân tử có xếp sát nhau được không?','Không → sắp xếp kém đặc khít → đúng.'],
   giai:'Đúng. Mỗi liên kết đôi cis làm mạch gấp khúc, phân tử cồng kềnh hơn nên xếp kém đặc khít.', lab:['k6','fat-18']},
  {id:'B', t:'Nhiệt độ nóng chảy của oleic acid ({C17H33COOH}) sẽ cao hơn nhiệt độ nóng chảy của linoleic acid ({C17H31COOH}).', d:'D', k:'k6', bay:null,
   soi:'So hai acid cùng 18 C, khác số C=C.',
   g:['Chìa khoá <b>Tính chất vật lí</b>: cùng số C, acid nhiều C=C hơn có nhiệt độ nóng chảy thấp hơn.','Oleic {C17H33COOH} có 1 C=C; linoleic {C17H31COOH} có 2 C=C.','Oleic ít C=C hơn → nóng chảy cao hơn (khoảng 13 °C so với khoảng −5 °C).'],
   giai:'Đúng. Oleic (1 C=C, nóng chảy khoảng 13 °C) cao hơn linoleic (2 C=C, khoảng −5 °C).', lab:['k6','fat-ol-li']},
  {id:'C', t:'Các phân tử acid béo no và không no đều có tương tác Van der Waals mạnh hơn so với các carboxylic acid có số nguyên tử carbon thấp.', d:'D', k:'k6', bay:null,
   soi:'"đều… mạnh hơn" → kiểm cả acid no lẫn không no.',
   g:['Chìa khoá <b>Tính chất vật lí</b>: mạch carbon càng dài, tương tác Van der Waals càng mạnh.','Acid béo có 16–18 C; carboxylic acid thấp chỉ có vài C.','Kể cả khi gấp khúc, mạch 18 C vẫn có diện tích tiếp xúc lớn hơn nhiều → đúng.'],
   giai:'Đúng. Mạch 16–18 C dài hơn nhiều nên tương tác Van der Waals mạnh hơn các acid ít carbon, dù mạch no hay không no.', lab:['k6','fat-18']},
  {id:'D', t:'Chưa có cơ sở để so sánh nhiệt độ nóng chảy của oleic acid ({C17H33COOH}) với palmitic acid ({C15H31COOH}) vì chúng đều có một liên kết đôi (C=C) trong phân tử.', d: CHOT.q8==='D'?'S':'D', k:'k6', bay:'tuyetdoi',
   soi:'"Chưa có cơ sở" → chỉ cần chỉ ra một cơ sở là câu sai.',
   g:['Chìa khoá <b>Tính chất vật lí</b>: nhiệt độ nóng chảy phụ thuộc số C=C và độ dài mạch.','Đếm C=C từ công thức: gốc {C15H31} = C<sub>n</sub>H<sub>2n+1</sub> nên palmitic acid no; gốc {C17H33} thiếu 2 H nên oleic acid có 1 C=C.','Hai acid khác nhau ở số C=C, vậy có cơ sở so sánh. Vế "đều có một liên kết đôi" cũng sai.'],
   giai:'Sai. Palmitic acid {C15H31COOH} là acid no, oleic acid {C17H33COOH} có một C=C dạng cis. Acid no mạch thẳng xếp khít nên palmitic acid nóng chảy cao hơn (khoảng 63 °C so với khoảng 13 °C), dù mạch ngắn hơn 2 C.', lab:['k6','fat-pal']}],
 mc:{hoi:'Phát biểu sai là', o:[['A','Nhiều C=C → cồng kềnh, xếp kém khít'],['B','Oleic nóng chảy cao hơn linoleic'],['C','Van der Waals mạnh hơn acid ít carbon'],['D','"Chưa có cơ sở" so sánh oleic với palmitic']], d:CHOT.q8},
 ket:'Phát biểu sai: D', nho:'Palmitic acid là acid no; cùng số C=C thì so độ dài mạch.'},
];

/* ---------- 4 đề luyện mới ---------- */
const PRACTICE = [
{id:'p1', so:'Bài luyện 1', nguon:'Đề mới', dang:'ds', ten:'Điều chế ethyl acetate: hồi lưu, chưng cất, rửa, làm khan', keys:['k3','k2','k1','k4'],
 de:`<p><b>Bài luyện 1:</b> Một nhóm học sinh điều chế ethyl acetate theo các bước sau:</p>
<p>– <b>Bước 1:</b> Cho vào bình cầu 12,0 gam acetic acid, 23,0 mL ethanol (D = 0,79 g/mL), 2 mL {H2SO4} đặc và vài viên đá bọt. Lắp ống sinh hàn hồi lưu thẳng đứng, đun sôi nhẹ trong 30 phút.</p>
<p>– <b>Bước 2:</b> Để nguội, lắp lại thành bộ chưng cất, đun và thu lấy phần chất lỏng ngưng tụ khi nhiệt độ hơi dưới 80 °C.</p>
<p>– <b>Bước 3:</b> Lắc chất lỏng ở bình hứng với dung dịch {Na2CO3} bão hoà đến khi không còn khí thoát ra, chiết lấy lớp trên, làm khan bằng {Na2SO4} khan, thu được 10,56 gam ethyl acetate.</p>
<p>Cho nhiệt độ sôi: ethyl acetate 77,1 °C; ethanol 78,4 °C; nước 100 °C; acetic acid 117,9 °C.</p>`,
 dung:[
  {ic:'i-reflux', t:'Hồi lưu 30 phút', p:'Acid + ethanol + {H2SO4} đặc + đá bọt.', io:[['in','acid'],['in','ethanol']]},
  {ic:'i-distill', t:'Chưng cất, lấy phần dưới 80 °C', p:'Ethyl acetate 77,1 °C và ethanol 78,4 °C cùng bay.', io:[['in','bình hứng']]},
  {ic:'i-bubbles', t:'Rửa {Na2CO3}, chiết', p:'Trung hoà acid, lấy lớp ester ở trên.', io:[['out','{CO2}↑']]},
  {ic:'i-dry', t:'Làm khan, cân', p:'10,56 g ethyl acetate.', io:[['in','10,56 g']]}],
 y:[
  {id:'a', t:'Đá bọt được thêm vào để làm xúc tác cho phản ứng ester hoá.', d:'S', k:'k3', bay:'tengoi', soi:'"xúc tác" → trong bình có hai thứ "phụ", thứ nào mới là xúc tác?',
   g:['Chìa khoá <b>Vai trò hoá chất</b>: trong bình có {H2SO4} đặc và đá bọt. Mỗi thứ làm gì?','Chất nào ở đây là xúc tác acid?','{H2SO4} đặc là xúc tác; đá bọt chỉ giúp sôi êm.'],
   giai:'Sai. Xúc tác là {H2SO4} đặc. Đá bọt tạo tâm sôi để chất lỏng sôi êm, không bị sôi bùng.', lab:['k3','naoh']},
  {id:'b', t:'Ở bước 1, ống sinh hàn đặt thẳng đứng để hơi ngưng tụ chảy ngược về bình cầu, không làm hao hụt chất khi đun lâu.', d:'D', k:'k2', bay:null, soi:'Kiểm đúng mục đích của kiểu lắp.',
   g:['Chìa khoá <b>An toàn &amp; dụng cụ</b>: sinh hàn đứng (hồi lưu) khác sinh hàn nghiêng (chưng cất) ở đâu?','Hơi đi lên, gặp ống lạnh, ngưng lại thì chảy về đâu?','Chảy ngược về bình → đun lâu mà không mất chất.'],
   giai:'Đúng. Đó là đun hồi lưu: hơi ngưng tụ quay lại bình nên đun lâu được mà không mất chất.', lab:['k2','hoiluu']},
  {id:'c', t:'Chất lỏng thu được ở bình hứng trong bước 2 chỉ có ethyl acetate vì ethyl acetate có nhiệt độ sôi thấp nhất trong hỗn hợp.', d:'S', k:'k1', bay:'tuyetdoi', soi:'"chỉ có" + "vì": vế lí do đúng, nhưng kết luận "chỉ có" phải kiểm.',
   g:['Chìa khoá <b>Tách chất</b>: thu chất lỏng khi hơi dưới 80 °C. Chất nào sôi sát mốc này?','Ethyl acetate 77,1 °C, ethanol 78,4 °C: chênh 1,3 °C.','Gần trùng → ethanol bay theo; hơi nước, acid cũng lẫn vào.'],
   giai:'Sai. Ethanol sôi 78,4 °C, chỉ cao hơn ethyl acetate 1,3 °C nên bay theo; hơi nước và acid cũng lẫn vào. Vì vậy bước 3 mới phải rửa và làm khan.', lab:['k1','etoh']},
  {id:'d', t:'Hiệu suất phản ứng ester hoá là 60%.', d:'D', k:'k4', bay:null, soi:'Con số → tự tính theo chất thiếu.',
   g:['Chìa khoá <b>Con số</b>: tính số mol hai chất, chọn chất thiếu.','n(acetic acid) = 12,0 ÷ 60 = 0,2 mol; n(ethanol) = 23,0 × 0,79 ÷ 46 = 0,395 mol → acid thiếu.','Lí thuyết 0,2 × 88 = 17,6 g; H = 10,56 ÷ 17,6 = 60%.'],
   giai:'Đúng. Acid thiếu (0,2 mol) → lí thuyết 17,6 g ethyl acetate; 10,56 ÷ 17,6 = 0,60 → 60%.', lab:['k4','etac']}],
 ket:'a S – b Đ – c S – d Đ', nho:''},

{id:'p2', so:'Bài luyện 2', nguon:'Đề mới', dang:'ds', ten:'Hai ester cùng C₈H₈O₂: methyl benzoate và phenyl acetate', keys:['k5'],
 de:`<p><b>Bài luyện 2:</b> Hai ester X và Y có cùng công thức phân tử {C8H8O2}. X là methyl benzoate ({C6H5COOCH3}), dùng làm hương liệu. Y là phenyl acetate ({CH3COOC6H5}).</p>`,
 dung:[
  {ic:'i-hex', t:'Dựng X', p:'{C6H5}–COO–{CH3}: nhóm –COO– gắn với gốc methyl → ester của alcohol.', io:[]},
  {ic:'i-hex', t:'Dựng Y', p:'{CH3}–COO–{C6H5}: O của ester gắn thẳng vào vòng → ester của phenol.', io:[]},
  {ic:'i-lens', t:'Soi', p:'Cùng công thức phân tử nhưng khác chỗ gắn → khác phản ứng.', io:[]}],
 y:[
  {id:'a', t:'X và Y tác dụng tối đa với NaOH theo cùng một tỉ lệ mol.', d:'S', k:'k5', bay:'conso', soi:'"cùng một tỉ lệ" → đếm riêng từng chất.',
   g:['Chìa khoá <b>Soi phân tử</b>: O của nhóm ester gắn vào gốc alkyl hay gắn thẳng vào vòng benzene?','X: –COO–{CH3} (ester của methanol). Y: {CH3COO}–{C6H5} (ester của phenol).','X: 1 NaOH. Y: 2 NaOH (1 để thuỷ phân, 1 trung hoà phenol vừa sinh ra).'],
   giai:'Sai. X phản ứng 1 : 1; Y là ester của phenol nên phản ứng 1 : 2 (sinh {CH3COONa} và {C6H5ONa}).', lab:['k5','phac-naoh']},
  {id:'b', t:'Thuỷ phân Y trong dung dịch NaOH dư thu được hai muối.', d:'D', k:'k5', bay:null, soi:'Viết sản phẩm thuỷ phân rồi xét tiếp với NaOH dư.',
   g:['Chìa khoá <b>Soi phân tử</b>: ester của phenol thuỷ phân tạo gì?','Tạo acetic acid và phenol; cả hai đều phản ứng với NaOH dư.','Hai muối: {CH3COONa} và {C6H5ONa}.'],
   giai:'Đúng. {CH3COOC6H5} + 2NaOH → {CH3COONa} + {C6H5ONa} + {H2O}.', lab:['k5','phac-naoh']},
  {id:'c', t:'X được điều chế từ benzoic acid và methanol (xúc tác {H2SO4} đặc, đun nóng).', d:'D', k:'k5', bay:null, soi:'Tách ester thành gốc acid và gốc alcohol.',
   g:['Chìa khoá <b>Soi phân tử</b>: tách ester thành gốc acid và gốc alcohol.','{C6H5}CO– là gốc của benzoic acid; –O{CH3} là của methanol.','Acid + alcohol, xúc tác {H2SO4} đặc → ester hoá được.'],
   giai:'Đúng. {C6H5COOH} + {CH3OH} ⇌ {C6H5COOCH3} + {H2O} ({H2SO4} đặc, t°).', lab:['k5','builder-cin']},
  {id:'d', t:'Y được điều chế bằng phản ứng ester hoá giữa acetic acid và phenol (xúc tác {H2SO4} đặc, đun nóng).', d:'S', k:'k5', bay:'tengoi', soi:'Phenol có ester hoá trực tiếp với carboxylic acid được không?',
   g:['Chìa khoá <b>Soi phân tử</b>: phenol có ester hoá trực tiếp với carboxylic acid được không?','Nhớ Câu 8 (aspirin): để gắn nhóm acetyl vào –OH phenol, người ta dùng acetic anhydride chứ không dùng acetic acid.','Phenol không ester hoá trực tiếp với carboxylic acid → phải dùng anhydride.'],
   giai:'Sai. Phenol hầu như không tham gia phản ứng ester hoá với carboxylic acid; ester của phenol được điều chế từ anhydride acid: {(CH3CO)2O} + {C6H5OH} → {CH3COOC6H5} + {CH3COOH}.', lab:['k5','builder-cin']}],
 ket:'a S – b Đ – c Đ – d S', nho:''},

{id:'p3', so:'Bài luyện 3', nguon:'Đề mới', dang:'ds', ten:'Dùng dư ethanol: đọc bảng hiệu suất theo tỉ lệ mol', keys:['k3','k4'],
 de:`<p><b>Bài luyện 3:</b> Khảo sát ảnh hưởng của tỉ lệ mol ethanol : acetic acid đến hiệu suất tạo ethyl acetate (cùng nhiệt độ, cùng lượng xúc tác, phản ứng đạt cân bằng). Kết quả tính theo hằng số cân bằng K = 4 (làm tròn):</p>
<div class="tbl"><table><tr><th>Tỉ lệ mol ethanol : acid</th><th>1 : 1</th><th>2 : 1</th><th>3 : 1</th><th>4 : 1</th><th>5 : 1</th></tr><tr><td>Hiệu suất (%)</td><td>66,7</td><td>84,5</td><td>90,3</td><td>93,0</td><td>94,5</td></tr></table></div>`,
 dung:[
  {ic:'i-reflux', t:'Ester hoá thuận nghịch', p:'Acid + ethanol ⇌ ester + nước; thay đổi lượng ethanol.', io:[['in','ethanol dư dần']]},
  {ic:'i-chart', t:'Đọc bảng', p:'Hiệu suất tăng nhưng mỗi bước tăng ít dần.', io:[]}],
 y:[
  {id:'a', t:'Dùng dư ethanol làm cân bằng chuyển dịch theo chiều tạo ester nên hiệu suất tăng.', d:'D', k:'k3', bay:null, soi:'"nên" → kiểm lí do: có đúng là do cân bằng chuyển dịch?',
   g:['Chìa khoá <b>Vai trò hoá chất</b>: vì sao cho dư một chất đầu?','Ester hoá là phản ứng thuận nghịch. Tăng nồng độ chất đầu thì cân bằng chuyển dịch theo chiều nào?','Chiều thuận (tạo ester) → hiệu suất tính theo acid tăng.'],
   giai:'Đúng. Tăng lượng ethanol làm cân bằng chuyển dịch về phía tạo ester (nguyên lí Le Chatelier).', lab:['k4','bang-p3']},
  {id:'b', t:'Hiệu suất tăng nhiều nhất khi tỉ lệ mol tăng từ 1 : 1 lên 2 : 1.', d:'D', k:'k4', bay:null, soi:'"tăng nhiều nhất" → tính hiệu số từng khoảng.',
   g:['Chìa khoá <b>Con số</b>: tính hiệu số giữa hai cột liền kề.','+17,8; +5,8; +2,7; +1,5.','Lớn nhất +17,8 ở khoảng 1 : 1 → 2 : 1.'],
   giai:'Đúng. 84,5 − 66,7 = +17,8 là hiệu số lớn nhất.', lab:['k4','bang-p3']},
  {id:'c', t:'Tỉ lệ mol ethanol : acetic acid càng lớn thì hiệu suất tăng càng mạnh.', d:'S', k:'k4', bay:'xuhuong', soi:'"càng… càng mạnh" → xem mức tăng từng bước.',
   g:['Chìa khoá <b>Con số</b>: "tăng càng mạnh" nghĩa là hiệu số phải lớn dần.','Hiệu số: +17,8; +5,8; +2,7; +1,5.','Hiệu số nhỏ dần → hiệu suất tăng chậm dần.'],
   giai:'Sai. Hiệu suất vẫn tăng nhưng mức tăng nhỏ dần (+17,8 → +1,5), tức là tăng ngày càng chậm.', lab:['k4','bang-p3']},
  {id:'d', t:'Ở tỉ lệ 1 : 1, từ 0,5 mol acetic acid thu được khoảng 29,3 gam ethyl acetate.', d:'D', k:'k4', bay:null, soi:'Con số → tự tính.',
   g:['Chìa khoá <b>Con số</b>: tỉ lệ 1 : 1 thì hai chất bằng nhau, tính theo acid.','Lí thuyết 0,5 × 88 = 44 g.','44 × 66,7% ≈ 29,3 g.'],
   giai:'Đúng. 0,5 × 88 × 0,667 ≈ 29,3 g ethyl acetate.', lab:['k4','bang-p3']}],
 ket:'a Đ – b Đ – c S – d Đ', nho:''},

{id:'p4', so:'Bài luyện 4', nguon:'Đề mới', dang:'ds', ten:'Bốn acid béo: độ dài mạch, liên kết đôi, trạng thái', keys:['k6','k5'],
 de:`<p><b>Bài luyện 4:</b> Cho bốn acid béo: palmitic acid {C15H31COOH}, stearic acid {C17H35COOH}, oleic acid {C17H33COOH} và linoleic acid {C17H31COOH}.</p>`,
 dung:[
  {ic:'i-hex', t:'Dựng mạch', p:'Đếm C và đếm C=C: C<sub>n</sub>H<sub>2n+1</sub>COOH là acid no; mỗi C=C bớt 2 H.', io:[]},
  {ic:'i-thermo', t:'Xếp nhiệt độ nóng chảy', p:'No + dài → cao nhất; nhiều C=C → thấp.', io:[]}],
 y:[
  {id:'a', t:'Stearic acid có nhiệt độ nóng chảy cao nhất trong bốn acid trên.', d:'D', k:'k6', bay:null, soi:'"cao nhất" → so cả bốn.',
   g:['Chìa khoá <b>Tính chất vật lí</b>: acid no, mạch dài nhất → nóng chảy cao nhất.','Acid nào no? Palmitic (16 C) và stearic (18 C). Oleic, linoleic có C=C.','Stearic vừa no vừa dài nhất → cao nhất (khoảng 70 °C).'],
   giai:'Đúng. Stearic acid no và có mạch dài nhất nên nóng chảy cao nhất (khoảng 70 °C).', lab:['k6','fat-pal']},
  {id:'b', t:'Ở 25 °C, oleic acid ở trạng thái lỏng.', d:'D', k:'k6', bay:null, soi:'So 25 °C với nhiệt độ nóng chảy của oleic acid.',
   g:['Chìa khoá <b>Tính chất vật lí</b>: nhiệt độ cao hơn nhiệt độ nóng chảy thì chất ở thể lỏng.','Oleic acid nóng chảy khoảng 13 °C.','25 °C > 13 °C → lỏng.'],
   giai:'Đúng. Oleic acid nóng chảy khoảng 13 °C nên ở 25 °C là chất lỏng (dầu).', lab:['k6','fat-18']},
  {id:'c', t:'Palmitic acid có nhiệt độ nóng chảy thấp hơn oleic acid vì mạch carbon của palmitic acid ngắn hơn.', d:'S', k:'k6', bay:'nguyennhan', soi:'"vì" chỉ nêu một yếu tố; còn yếu tố C=C.',
   g:['Chìa khoá <b>Tính chất vật lí</b>: có hai yếu tố, không chỉ độ dài mạch.','Palmitic no (mạch thẳng, xếp khít); oleic có 1 C=C cis (gấp khúc).','Yếu tố gấp khúc thắng: palmitic khoảng 63 °C, oleic khoảng 13 °C.'],
   giai:'Sai. Palmitic acid no, mạch thẳng xếp khít nên nóng chảy khoảng 63 °C, cao hơn nhiều so với oleic acid (khoảng 13 °C) dù mạch ngắn hơn 2 C.', lab:['k6','fat-pal']},
  {id:'d', t:'Hydrogen hoá hoàn toàn linoleic acid (xúc tác Ni, t°) thu được stearic acid.', d:'D', k:'k5', bay:null, soi:'Đếm C=C, cộng H2, so công thức.',
   g:['Chìa khoá <b>Soi phân tử</b>: H<sub>2</sub> cộng vào C=C, số C giữ nguyên.','Linoleic {C17H31COOH} có 2 C=C → cộng 2 H<sub>2</sub>.','{C17H31COOH} + 2{H2} → {C17H35COOH} (stearic acid).'],
   giai:'Đúng. {C17H31COOH} + 2{H2} → {C17H35COOH}.', lab:['k6','fat-ol-li']}],
 ket:'a Đ – b Đ – c S – d Đ', nho:''},
];

/* ---------- ngân hàng an toàn (máy ra đề) ---------- */
const SAFETY = [
  {t:'Khi chưng cất, nước làm lạnh cho vào ở đầu cao của ống sinh hàn để nước chảy xuôi xuống.', d:'S', why:'Nước phải vào đầu thấp, ra đầu cao để ống luôn đầy nước và chảy ngược chiều hơi.'},
  {t:'Đá bọt giúp chất lỏng sôi êm, tránh hiện tượng sôi bùng.', d:'D', why:'Đá bọt tạo tâm sôi.'},
  {t:'Có thể đun hỗn hợp chứa diethyl ether bằng đèn cồn nếu đun thật nhẹ.', d:'S', why:'Hơi ether rất dễ bắt lửa; đun nhẹ vẫn là lửa trần.'},
  {t:'Để đuổi một dung môi dễ cháy sôi ở 40 °C, có thể dùng nồi cách thuỷ thay cho đèn cồn.', d:'D', why:'Nước nóng đủ nóng hơn 40 °C và không có lửa.'},
  {t:'Để chưng cất một chất lỏng sôi ở 142 °C, chỉ cần ngâm bình cầu trong nước sôi.', d:'S', why:'Nước sôi chỉ 100 °C, không đủ đưa chất lên 142 °C.'},
  {t:'Khi đun hồi lưu, ống sinh hàn được lắp thẳng đứng trên miệng bình cầu.', d:'D', why:'Hơi ngưng tụ chảy ngược về bình.'},
  {t:'Khi chưng cất, bầu nhiệt kế đặt ngang chỗ nối nhánh sang ống sinh hàn để đo nhiệt độ của hơi.', d:'D', why:'Đó là nhiệt độ của hơi đang đi sang ống sinh hàn.'},
  {t:'Khi dùng phễu chiết, mở khoá cho lớp trên chảy ra trước qua cuống phễu.', d:'S', why:'Lớp dưới chảy ra qua khoá trước; lớp trên rót ra từ miệng phễu.'},
  {t:'Khi lắc phễu chiết chứa dung môi dễ bay hơi, cần thỉnh thoảng mở khoá để xả bớt hơi.', d:'D', why:'Áp suất hơi tăng khi lắc, phải xả để phễu không bật nút.'},
  {t:'Rửa ester bằng dung dịch NaOH dư giúp loại acid nhanh hơn mà không ảnh hưởng đến ester.', d:'S', why:'NaOH dư thuỷ phân ester.'},
];

// TỆP SINH TỰ ĐỘNG — đừng sửa tay. Dựng: node scripts/loi-giai-kinh/dung-kiem-kinh.mjs

// ../../src/lib/loi-giai-kinh/kieu.ts
var PHIEN_BAN_KINH = 1;
var HINH_NHIP = ["binh", "ong-nghiem", "dun", "chiet", "loc", "can", "khi", "ket-tua", "mau", "nhiet", "ap-suat", "xuc-tac", "nguyen-tu", "phan-tu", "lien-ket", "dien", "pin", "do-thi", "mui-ten", "kinh-lup", "so-sanh", "cong-thuc"];
var MAU_LOP = ["trong", "xanh", "cam", "vang", "hong", "tim", "nau", "trang-duc"];

// ../../src/lib/doc-so-phan-iii.ts
function docSoPhanIII(raw) {
  var s2 = String(raw == null ? "" : raw);
  var MU = {
    "⁰": "0",
    "¹": "1",
    "²": "2",
    "³": "3",
    "⁴": "4",
    "⁵": "5",
    "⁶": "6",
    "⁷": "7",
    "⁸": "8",
    "⁹": "9",
    "⁻": "-",
    "⁺": "+"
  };
  s2 = s2.replace(/10([\s\u00a0\u202f]*)([\u2070\u00b9\u00b2\u00b3\u2074-\u2079\u207a\u207b]+)/g, function(_t, _k, m2) {
    var r = "10^";
    for (var i = 0; i < m2.length; i++) r += MU[m2.charAt(i)];
    return r;
  });
  if (s2.normalize) s2 = s2.normalize("NFKC");
  s2 = s2.replace(/\\times/g, "×").replace(/\\cdot/g, "·");
  s2 = s2.replace(/[\s\u00a0\u1680\u180e\u2000-\u200f\u2028\u2029\u202f\u205f\u2060\u3000\ufeff]+/g, "");
  s2 = s2.replace(/[\u2010-\u2015\u2212\ufe63\uff0d]/g, "-").replace(/[\u066b\u201a\u060c]/g, ",").toLowerCase();
  s2 = s2.replace(/^[+\u2248~=]+/, "").replace(/[.,;:!?]+$/, "");
  s2 = s2.replace(/\^+/g, "^");
  if (!s2) return null;
  var dinhTri = "";
  var mu = 0;
  var coMu = false;
  var duoi = "";
  var SO = "([+-]?(?:\\d[\\d.,]*|[.,]\\d+))";
  var MU10 = "10(?:\\^|\\*\\*)?[({]?([+-]?\\d+)[)}]?";
  var m = new RegExp("^" + SO + "[x×*·⋅∙]" + MU10 + "(.*)$").exec(s2) || new RegExp("^" + SO + "\\.10(?:\\^|\\*\\*)[({]?([+-]?\\d+)[)}]?(.*)$").exec(s2) || new RegExp("^" + SO + "e([+-]?\\d+)(.*)$").exec(s2);
  if (m) {
    dinhTri = m[1];
    mu = parseInt(m[2], 10);
    coMu = true;
    duoi = m[3];
  } else {
    var m10 = /^([+-]?)10(?:\^|\*\*)[({]?([+-]?\d+)[)}]?(.*)$/.exec(s2);
    if (m10) {
      dinhTri = m10[1] + "1";
      mu = parseInt(m10[2], 10);
      coMu = true;
      duoi = m10[3];
    } else {
      var mp = new RegExp("^" + SO + "(.*)$").exec(s2);
      if (!mp) return null;
      dinhTri = mp[1];
      duoi = mp[2];
    }
  }
  if (!isFinite(mu) || Math.abs(mu) > 400) return null;
  var dau = "";
  if (dinhTri.charAt(0) === "-" || dinhTri.charAt(0) === "+") {
    dau = dinhTri.charAt(0) === "-" ? "-" : "";
    dinhTri = dinhTri.slice(1);
  }
  var soCham = dinhTri.split(".").length - 1;
  var soPhay = dinhTri.split(",").length - 1;
  var nghin = "";
  var thapPhan = "";
  if (soCham && soPhay) {
    var cuoiCham = dinhTri.lastIndexOf(".");
    var cuoiPhay = dinhTri.lastIndexOf(",");
    thapPhan = cuoiCham > cuoiPhay ? "." : ",";
    nghin = thapPhan === "." ? "," : ".";
    if ((thapPhan === "." ? soCham : soPhay) !== 1) return null;
  } else if (soCham > 1) nghin = ".";
  else if (soPhay > 1) nghin = ",";
  else thapPhan = soCham ? "." : soPhay ? "," : "";
  var nguyen = dinhTri;
  var le = "";
  var coDauThapPhan = false;
  if (thapPhan) {
    var k = dinhTri.lastIndexOf(thapPhan);
    nguyen = dinhTri.slice(0, k);
    le = dinhTri.slice(k + 1);
    coDauThapPhan = true;
  }
  if (nghin) {
    var nhom = nguyen.split(nghin);
    if (!/^\d{1,3}$/.test(nhom[0])) return null;
    for (var j = 1; j < nhom.length; j++) if (!/^\d{3}$/.test(nhom[j])) return null;
    nguyen = nhom.join("");
  }
  if (!/^\d*$/.test(nguyen) || !/^\d*$/.test(le) || !nguyen && !le) return null;
  if (!coMu) {
    return { so: dau + nguyen + (coDauThapPhan ? "." + le : ""), donVi: duoi };
  }
  var chuSo = (nguyen || "0") + le;
  var viTri = (nguyen || "0").length + mu;
  if (viTri <= 0) {
    chuSo = new Array(1 - viTri + 1).join("0") + chuSo;
    viTri = 1;
  }
  if (viTri > chuSo.length) chuSo = chuSo + new Array(viTri - chuSo.length + 1).join("0");
  var phanNguyen = chuSo.slice(0, viTri).replace(/^0+(?=\d)/, "");
  var phanLe = chuSo.slice(viTri).replace(/0+$/, "");
  var ketQua = phanNguyen + (phanLe ? "." + phanLe : "");
  if (/^0(?:\.0*)?$/.test(ketQua)) dau = "";
  return { so: dau + ketQua, donVi: duoi };
}

// ../../src/lib/cham-so-policy.ts
var POLICY_VERSION = "CNH-1.0";
var THAM_SO_CHAM_CNH_1_0 = Object.freeze({
  policyVersion: POLICY_VERSION,
  /** Sai số tuyệt đối phải NHỎ HƠN giá trị này mới là bằng nhau (1e-4, không phải ≤). */
  saiSoTuyetDoiLoaiTru: 1e-4,
  /** Số chữ số thập phân tối đa cho phép ở `numeric-rounded-v1`. */
  soChuSoThapPhanToiDa: 12,
  policies: Object.freeze(["numeric-value-v1", "numeric-rounded-v1", "numeric-unit-v1", "literal-v1"])
});
var ChamInputError = class extends Error {
};
var ChamMaterialError = class extends Error {
  ma = "GRADING_MATERIAL_INVALID";
};
var KHOANG_TRANG = new RegExp("[\\s\\u00a0\\u1680\\u180e\\u2000-\\u200f\\u2028\\u2029\\u202f\\u205f\\u2060\\u3000\\ufeff]+", "g");
var DAU_TRU = new RegExp("[\\u2010-\\u2015\\u2212\\ufe63\\uff0d\\u207b]", "g");
var SO_THUAN = /^[+-]?(?:\d+\.?\d*|\.\d+)$/;
var PHAN_SO = /^([+-]?(?:\d+\.?\d*|\.\d+))\/([+-]?(?:\d+\.?\d*|\.\d+))$/;
var SO_ROI_DUOI = /^([+-]?(?:\d+\.?\d*|\.\d+))(.*)$/;
var KHOA_HOC_X10 = /^([+-]?(?:\d+\.?\d*|\.\d+))[x×*·]10\^?\(?([+-]?\d+)\)?$/;
var KHOA_HOC_E = /^([+-]?(?:\d+\.?\d*|\.\d+))e([+-]?\d+)$/;
function chuanHoaSoNhap(raw) {
  const doc = docSoPhanIII(raw);
  if (doc) return doc.so + doc.donVi;
  let s2 = String(raw ?? "").normalize("NFKC").replace(KHOANG_TRANG, "").replace(DAU_TRU, "-").replace(/[٫‚،]/g, ",").toLowerCase();
  s2 = s2.replace(/^[+≈~=]+/, "").replace(/[.,;:!?]+$/, "").replace(/,/g, ".");
  const x10 = KHOA_HOC_X10.exec(s2) ?? KHOA_HOC_E.exec(s2);
  if (x10) {
    const n = Number(`${x10[1]}e${x10[2]}`);
    if (Number.isFinite(n)) return String(n);
  }
  return s2;
}
var DON_VI_DA_BIET = /* @__PURE__ */ new Set([
  // độ dài / diện tích / thể tích
  "m",
  "dm",
  "cm",
  "mm",
  "km",
  "hm",
  "dam",
  "nm",
  "um",
  "µm",
  "μm",
  "met",
  "mét",
  "m2",
  "m²",
  "m3",
  "m³",
  "cm2",
  "cm²",
  "cm3",
  "cm³",
  "dm3",
  "dm³",
  "mm3",
  "mm³",
  "km2",
  "km²",
  "km3",
  "km³",
  "ha",
  "cc",
  "l",
  "ml",
  "cl",
  "dl",
  "lit",
  "lít",
  "mililit",
  "mililít",
  // khối lượng
  "g",
  "kg",
  "mg",
  "hg",
  "dag",
  "t",
  "tan",
  "tấn",
  "gam",
  "kilogam",
  // thời gian
  "s",
  "giay",
  "giây",
  "phut",
  "phút",
  "h",
  "gio",
  "giờ",
  "ms",
  "min",
  // lượng chất / nồng độ
  "mol",
  "mmol",
  "kmol",
  "umol",
  "µmol",
  "mol/l",
  "mol/lit",
  "mol/lít",
  "n",
  "kmol/m3",
  "kmol/m³",
  "mol/kg",
  "m/mol",
  // khối lượng riêng / khối lượng mol
  "g/mol",
  "kg/mol",
  "g/ml",
  "g/cm3",
  "g/cm³",
  "kg/m3",
  "kg/m³",
  "kg/l",
  "mg/ml",
  "g/l",
  // năng lượng / công suất / nhiệt
  "j",
  "kj",
  "jun",
  "kilojun",
  "cal",
  "kcal",
  "w",
  "kw",
  "mw",
  "wh",
  "kwh",
  "j/kg",
  "j/mol",
  "kj/mol",
  "j/g",
  "j/(mol.k)",
  // điện / từ / sóng
  "v",
  "mv",
  "kv",
  "a",
  "ma",
  "ohm",
  "ω",
  "f",
  "µf",
  "uf",
  "nf",
  "pf",
  "mh",
  "wb",
  "hz",
  "khz",
  "mhz",
  "ghz",
  // áp suất / lực
  "pa",
  "kpa",
  "mpa",
  "atm",
  "mmhg",
  "bar",
  "mbar",
  "psi",
  "n/m2",
  "n/m²",
  "n.m",
  // phần trăm / nhiệt độ / góc
  "%",
  "‰",
  "°c",
  "°k",
  "°f",
  "do",
  "độ",
  "rad",
  "sr",
  // vận tốc / tốc độ biến thiên
  "m/s",
  "km/h",
  "m/s2",
  "m/s²",
  "cm/s",
  "km/s",
  "g/s",
  "mol/s",
  "m3/s",
  "l/s",
  "l/min",
  // khác dùng trong đề
  "cd",
  "lm",
  "lux",
  "lx",
  "db",
  "eq",
  "dv",
  "đvc",
  "u",
  "amu"
]);
function chuanHoaDonVi(u) {
  const s2 = u.normalize("NFKC").toLowerCase().replace(KHOANG_TRANG, "");
  const trongNgoac = /^\((.*)\)$/.exec(s2) ?? /^\[(.*)\]$/.exec(s2);
  return trongNgoac ? trongNgoac[1] : s2;
}
function rutGon(x) {
  let tu = x.tu;
  let mau = x.mau;
  if (mau < 0n) {
    tu = -tu;
    mau = -mau;
  }
  let a = tu < 0n ? -tu : tu;
  let b = mau;
  while (b) {
    const t = a % b;
    a = b;
    b = t;
  }
  const g = a === 0n ? 1n : a;
  return { tu: tu / g, mau: mau / g };
}
function phanSoTuChuoiSo(s2) {
  const m = /^([+-]?)(\d*)(?:\.(\d*))?$/.exec(s2);
  if (!m) return null;
  const dau = m[1] ?? "";
  const nguyen = m[2] ?? "";
  const le = m[3] ?? "";
  if (!nguyen && !le) return null;
  const chuSo = (nguyen || "0") + le;
  if (!/^\d+$/.test(chuSo)) return null;
  const so = BigInt(chuSo);
  return rutGon({ tu: dau === "-" ? -so : so, mau: 10n ** BigInt(le.length) });
}
function bangNhau(a, b) {
  return a.tu * b.mau === b.tu * a.mau;
}
function lechNhoHon(a, b) {
  const hieu = a.tu * b.mau - b.tu * a.mau;
  const tuyetDoi = hieu < 0n ? -hieu : hieu;
  if (!(tuyetDoi * 10000n < a.mau * b.mau)) return false;
  const khoaTuyetDoi = b.tu < 0n ? -b.tu : b.tu;
  if (khoaTuyetDoi === 0n || khoaTuyetDoi * 100n >= b.mau) return true;
  return tuyetDoi * 100n < khoaTuyetDoi * a.mau;
}
function lamTron(gia, decimals) {
  const mu = 10n ** BigInt(decimals);
  const am = gia.tu < 0n;
  const duong = am ? -gia.tu : gia.tu;
  const moRong = duong * mu;
  const thuong = moRong / gia.mau;
  const du = moRong % gia.mau;
  const lam = du * 2n >= gia.mau ? thuong + 1n : thuong;
  return rutGon({ tu: am ? -lam : lam, mau: mu });
}
function tachSoVaDonVi(s2, allowFraction) {
  if (!s2) return { ok: false, loi: "unsupported-format" };
  if (allowFraction) {
    const m2 = PHAN_SO.exec(s2);
    if (m2) {
      const tu = phanSoTuChuoiSo(m2[1]);
      const mau = phanSoTuChuoiSo(m2[2]);
      if (!tu || !mau || mau.tu === 0n) return { ok: false, loi: "unsupported-format" };
      return { ok: true, so: { numText: s2, unit: null, gia: rutGon({ tu: tu.tu * mau.mau, mau: tu.mau * mau.tu }) } };
    }
  }
  if (SO_THUAN.test(s2)) {
    const gia2 = phanSoTuChuoiSo(s2);
    return gia2 ? { ok: true, so: { numText: s2, unit: null, gia: gia2 } } : { ok: false, loi: "unsupported-format" };
  }
  const m = SO_ROI_DUOI.exec(s2);
  if (!m) return { ok: false, loi: "unsupported-format" };
  const gia = phanSoTuChuoiSo(m[1]);
  if (!gia) return { ok: false, loi: "unsupported-format" };
  const don = chuanHoaDonVi(m[2]);
  if (!don || !DON_VI_DA_BIET.has(don)) return { ok: false, loi: "unsupported-format" };
  return { ok: true, so: { numText: m[1], unit: don, gia } };
}
function donViTuongThich(a, b) {
  return !(a.unit && b.unit && a.unit !== b.unit);
}
function dinhTriKhoa(key) {
  const s2 = String(key ?? "");
  const m = /^(.*?)(?:\s*[x×*·⋅∙]\s*10|\.10(?=\s*[\^⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]))\s*(?:\^|\*\*)?\s*[({]?\s*([+\-−⁻⁺]?[0-9⁰¹²³⁴⁵⁶⁷⁸⁹]+)/.exec(s2);
  if (!m || !m[1].trim()) return null;
  const mu = m[2].replace(/[⁻−]/g, "-").replace(/⁺/g, "").replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => String("⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(c)));
  if (!/^[+-]?\d+$/.test(mu) || Number(mu) === 0) return null;
  return m[1].trim();
}
function coSoMuRieng(answer) {
  return /[x×*·⋅∙]\s*10|10\s*[\^⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]|\d\s*e\s*[+-]?\d/i.test(String(answer ?? ""));
}
function laChuoiKhongRong(v, ten) {
  if (typeof v !== "string" || v.length === 0) throw new ChamInputError(`${ten} phải là chuỗi không rỗng`);
  return v;
}
function parseChamInput(raw) {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) throw new ChamInputError("chamTheoPolicy cần một đối tượng");
  const o = raw;
  const policy = o.policy;
  if (typeof policy !== "string" || !THAM_SO_CHAM_CNH_1_0.policies.includes(policy)) {
    throw new ChamInputError(`policy không nằm trong CNH-1.0: ${String(policy)}`);
  }
  const key = laChuoiKhongRong(o.key, "key");
  const answer = laChuoiKhongRong(o.answer, "answer");
  if (o.policyVersion !== void 0 && o.policyVersion !== POLICY_VERSION) {
    throw new ChamInputError(`policyVersion không khớp CNH-1.0: ${String(o.policyVersion)}`);
  }
  const out = { policy, key, answer };
  if (o.decimals !== void 0) {
    const d = o.decimals;
    if (typeof d !== "number" || !Number.isInteger(d) || d < 0 || d > THAM_SO_CHAM_CNH_1_0.soChuSoThapPhanToiDa) {
      throw new ChamInputError(`decimals phải là số nguyên 0..${THAM_SO_CHAM_CNH_1_0.soChuSoThapPhanToiDa}`);
    }
    out.decimals = d;
  }
  if (o.requiredUnit !== void 0) out.requiredUnit = laChuoiKhongRong(o.requiredUnit, "requiredUnit");
  if (o.allowFraction !== void 0) {
    if (typeof o.allowFraction !== "boolean") throw new ChamInputError("allowFraction phải là boolean");
    out.allowFraction = o.allowFraction;
  }
  for (const ten of ["allowedConversions", "accepted"]) {
    const v = o[ten];
    if (v === void 0) continue;
    if (!Array.isArray(v) || v.some((x) => typeof x !== "string" || !x.length)) throw new ChamInputError(`${ten} phải là mảng chuỗi không rỗng`);
    out[ten] = v;
  }
  if (policy === "numeric-unit-v1" && !out.requiredUnit) throw new ChamInputError("numeric-unit-v1 cần requiredUnit");
  if (policy === "numeric-rounded-v1" && out.decimals === void 0) throw new ChamInputError("numeric-rounded-v1 cần decimals");
  return out;
}
function docKhoaSo(key, allowFraction) {
  const parsed = tachSoVaDonVi(chuanHoaSoNhap(key), allowFraction);
  if (!parsed.ok) throw new ChamMaterialError("Đáp án số phía server không đúng định dạng của chính sách");
  return parsed.so;
}
function chamSoHoc(key, answer, allowFraction) {
  const k = docKhoaSo(key, allowFraction);
  const a = chuanHoaSoNhap(answer);
  if (!a) return { correct: false };
  const pa = tachSoVaDonVi(a, allowFraction);
  if (!pa.ok) return { correct: false, error: "unsupported-format" };
  if (!donViTuongThich(pa.so, k)) return { correct: false };
  if (bangNhau(pa.so.gia, k.gia) || lechNhoHon(pa.so.gia, k.gia)) return { correct: true };
  const dinhTri = coSoMuRieng(answer) ? null : dinhTriKhoa(key);
  if (dinhTri !== null) {
    const dt = tachSoVaDonVi(chuanHoaSoNhap(dinhTri), allowFraction);
    if (dt.ok && (bangNhau(pa.so.gia, dt.so.gia) || lechNhoHon(pa.so.gia, dt.so.gia))) return { correct: true };
  }
  return { correct: false };
}
function chamLamTron(key, answer, decimals) {
  const k = docKhoaSo(key, false);
  const a = chuanHoaSoNhap(answer);
  if (!a) return { correct: false };
  const pa = tachSoVaDonVi(a, false);
  if (!pa.ok) return { correct: false, error: "unsupported-format" };
  if (!donViTuongThich(pa.so, k)) return { correct: false };
  return { correct: bangNhau(lamTron(pa.so.gia, decimals), lamTron(k.gia, decimals)) };
}
function chamDonVi(key, answer, requiredUnit, allowedConversions) {
  const k = docKhoaSo(key, false);
  const dich = chuanHoaDonVi(requiredUnit);
  if (!DON_VI_DA_BIET.has(dich) || k.unit !== null && k.unit !== dich) {
    throw new ChamMaterialError("Đơn vị của đáp án server không khớp chính sách");
  }
  const a = chuanHoaSoNhap(answer);
  if (!a) return { correct: false };
  const pa = tachSoVaDonVi(a, false);
  if (!pa.ok) return { correct: false, error: "unsupported-format" };
  const dungDonVi = pa.so.unit === dich || pa.so.unit !== null && allowedConversions.map(chuanHoaDonVi).includes(pa.so.unit);
  if (!dungDonVi) return { correct: false };
  return { correct: bangNhau(pa.so.gia, k.gia) || lechNhoHon(pa.so.gia, k.gia) };
}
function chamLiteral(key, answer, accepted) {
  const a = chuanHoaSoNhap(answer);
  if (!a) return { correct: false };
  if (a === chuanHoaSoNhap(key)) return { correct: true };
  for (const moi of accepted ?? []) {
    if (a === chuanHoaSoNhap(moi)) return { correct: true };
  }
  return { correct: false };
}
function chamTheoPolicy(raw) {
  const input = parseChamInput(raw);
  switch (input.policy) {
    case "numeric-value-v1":
      return chamSoHoc(input.key, input.answer, input.allowFraction === true);
    case "numeric-rounded-v1":
      return chamLamTron(input.key, input.answer, input.decimals);
    case "numeric-unit-v1":
      return chamDonVi(input.key, input.answer, input.requiredUnit, input.allowedConversions ?? []);
    case "literal-v1":
      return chamLiteral(input.key, input.answer, input.accepted);
  }
}
var POLICY_MAC_DINH_PHAN_III = "numeric-value-v1";

// ../../src/lib/cau-tu-luan.ts
var YC = new RegExp("^(?:hãy )?(?:viết|xác định|tính(?! (?:chất|khử|oxi|acid|axit|base|tan|dẫn|dẻo))|giải thích|trình bày|nêu|so sánh|nhận xét|đề xuất|cho biết|tìm|(?:tại|vì) sao)(?!\\p{L})", "iu");

// ../../src/lib/loi-giai-kiem.ts
function tinhBieuThuc(bt) {
  const s2 = bt.replace(/\s+/g, "");
  if (!/^[0-9.+\-*/()eE]+$/.test(s2)) throw new Error("biểu thức có kí tự lạ: " + bt);
  let i = 0;
  const so = () => {
    if (s2[i] === "(") {
      i++;
      const v2 = cong();
      if (s2[i] !== ")") throw new Error("thiếu ngoặc đóng: " + bt);
      i++;
      return v2;
    }
    if (s2[i] === "-") {
      i++;
      return -so();
    }
    if (s2[i] === "+") {
      i++;
      return so();
    }
    const m = /^(\d+(\.\d+)?|\.\d+)([eE][+-]?\d+)?/.exec(s2.slice(i));
    if (!m) throw new Error("biểu thức hỏng: " + bt);
    i += m[0].length;
    return Number(m[0]);
  };
  const nhan = () => {
    let v2 = so();
    while (s2[i] === "*" || s2[i] === "/") {
      const op = s2[i++];
      const r = so();
      v2 = op === "*" ? v2 * r : v2 / r;
    }
    return v2;
  };
  const cong = () => {
    let v2 = nhan();
    while (s2[i] === "+" || s2[i] === "-") {
      const op = s2[i++];
      const r = nhan();
      v2 = op === "+" ? v2 + r : v2 - r;
    }
    return v2;
  };
  const v = cong();
  if (i !== s2.length) throw new Error("biểu thức thừa kí tự: " + bt);
  if (!Number.isFinite(v)) throw new Error("biểu thức ra vô cực: " + bt);
  return v;
}

// ../../src/lib/loi-giai-kinh/kiem.ts
var laObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
var s = (v, tran = 600) => typeof v === "string" || typeof v === "number" ? String(v).normalize("NFC").replace(/\s+/g, " ").trim().slice(0, tran) : "";
var mang = (v) => Array.isArray(v) ? v : [];
var chuanDoiChieu = (t) => t.normalize("NFC").toLowerCase().replace(/[«»"“”'‘’]/g, "").replace(/[.!?…\s]+$/u, "").replace(/\s+/g, " ").trim();
var RE_CAM = [
  [/[«»]/u, "có dấu «» (thầy: bỏ, in đậm thay)"],
  [/tiền(?! chất)|giàu|nghèo|thuế|nhà (?:thằng|bạn|giàu|nghèo)/iu, "dùng ẩn dụ tiền / nhà (thầy đã bỏ)"],
  [/bất bão hoà|bất bão hòa|độ không no|\bk\s*=\s*\d/iu, "dùng độ bất bão hoà k (ngoài SGK Kết nối tri thức)"],
  [/\bA\.?I\b|trí tuệ nhân tạo/u, "có chữ AI"],
  [/<\/?(?!(?:b|i|sub|sup)>)[a-z][a-z0-9]*(?:\s[^<>]*)?>/iu, "có thẻ HTML ngoài b/i/sub/sup"]
];
function chuCam(ban) {
  const chu = JSON.stringify(ban ?? "");
  for (const [re, ly] of RE_CAM) if (re.test(chu)) return ly;
  return null;
}
var KHOA_I = ["A", "B", "C", "D"];
var KHOA_II = ["a", "b", "c", "d"];
function docNhip(x) {
  if (!laObj(x)) return null;
  const chu = s(x.chu, 200);
  if (!chu) return null;
  const hinh = s(x.hinh, 20);
  return { chu, ...s(x.phu, 200) ? { phu: s(x.phu, 200) } : {}, ...HINH_NHIP.includes(hinh) ? { hinh } : {} };
}
function docCanh(x) {
  if (!laObj(x)) return null;
  if (x.loai === "can-bang") {
    const tac = mang(x.tacDong).map((t) => laObj(t) && ["thuan", "nghich", "khong"].includes(String(t.chieu)) && s(t.nut, 40) && s(t.chu, 200) ? { nut: s(t.nut, 40), chieu: t.chieu, chu: s(t.chu, 200) } : null);
    if (!s(x.trai, 80) || !s(x.phai, 80) || !tac.length || tac.length > 4 || tac.some((t) => !t)) return null;
    return { loai: "can-bang", trai: s(x.trai, 80), phai: s(x.phai, 80), ...s(x.nhanTrai, 30) ? { nhanTrai: s(x.nhanTrai, 30) } : {}, ...s(x.nhanPhai, 30) ? { nhanPhai: s(x.nhanPhai, 30) } : {}, tacDong: tac };
  }
  if (x.loai === "ong-nghiem") {
    const buoc = mang(x.buoc).map((b) => {
      if (!laObj(b) || !s(b.chu, 200)) return null;
      const lop = mang(b.lop).map((l) => laObj(l) && MAU_LOP.includes(String(l.mau)) ? { mau: l.mau, nhan: s(l.nhan, 30) } : null);
      if (!lop.length || lop.length > 2 || lop.some((l) => !l)) return null;
      return { chu: s(b.chu, 200), lop, ...b.dun === true ? { dun: true } : {}, ...b.khi === true ? { khi: true } : {}, ...b.ketTua === true ? { ketTua: true } : {} };
    });
    if (buoc.length < 2 || buoc.length > 5 || buoc.some((b) => !b)) return null;
    return { loai: "ong-nghiem", buoc };
  }
  if (x.loai === "so-sanh") {
    const ve = (v) => laObj(v) && s(v.ten, 60) ? { ten: s(v.ten, 60), y: mang(v.y).map((y) => s(y, 120)).filter(Boolean).slice(0, 4) } : null;
    const t = ve(x.trai), p = ve(x.phai);
    if (!t || !p || !t.y.length || !p.y.length) return null;
    return { loai: "so-sanh", trai: t, phai: p };
  }
  return null;
}
function docSoDo(x) {
  if (!laObj(x)) return void 0;
  const nut = mang(x.nut).map((n) => laObj(n) && s(n.chat, 60) ? { ...s(n.tong, 60) ? { tong: s(n.tong, 60) } : {}, chat: s(n.chat, 60), soLieu: mang(n.soLieu).map((v) => s(v, 60)).filter(Boolean).slice(0, 6) } : null);
  if (nut.length < 2 || nut.length > 3 || nut.some((n) => !n)) return void 0;
  const muiTen = mang(x.muiTen).map((m) => laObj(m) && Number.isFinite(Number(m.H)) && Number(m.H) > 0 && Number(m.H) <= 100 ? { H: Number(m.H) } : {});
  while (muiTen.length < nut.length - 1) muiTen.push({});
  return { nut, muiTen: muiTen.slice(0, nut.length - 1), chieu: x.chieu === "nguoc" ? "nguoc" : "xuoi" };
}
function docBuoc(x) {
  const b = mang(x).map((v) => {
    if (!laObj(v)) return null;
    const thuaSo = mang(v.thuaSo).map((t) => laObj(t) && s(t.so, 30) && s(t.nghia, 240) ? { so: s(t.so, 30), nghia: s(t.nghia, 240), ...s(t.denDay, 160) ? { denDay: s(t.denDay, 160) } : {} } : null);
    if (!s(v.ten, 60) || !thuaSo.length || thuaSo.some((t) => !t)) return null;
    return { ten: s(v.ten, 60), thuaSo, ...s(v.ketQua, 40) ? { ketQua: s(v.ketQua, 40) } : {}, ...s(v.donVi, 20) ? { donVi: s(v.donVi, 20) } : {} };
  });
  if (!b.length || b.length > 3 || b.some((x2) => !x2)) return void 0;
  return b;
}
function docSoViet(raw) {
  const t = raw.replace(/\s+/g, "").replace(/[×x·]10\^?\(?(-?\d+)\)?/u, "e$1").replace(/\.(?=\d{3}(?!\d))/g, "").replace(",", ".");
  const m = t.match(/^-?\d+(?:\.\d+)?(?:e-?\d+)?/);
  return m ? Number(m[0]) : null;
}
function khopLamTron(v, ghi) {
  const d = docSoViet(ghi);
  if (d === null || !Number.isFinite(v)) return false;
  const thapPhan = (ghi.split(/[eE×x]/)[0].split(",")[1] ?? "").replace(/\D/g, "").length;
  return Math.abs(v - d) <= Math.max(0.5 * 10 ** -thapPhan + 1e-9 * Math.abs(d), 5e-3 * Math.abs(d));
}
function docPhepTinh(x) {
  const ds = mang(x).map((p) => laObj(p) && s(p.ten, 60) && s(p.bieuThuc, 200) && s(p.ketQua, 40) ? { ten: s(p.ten, 60), bieuThuc: s(p.bieuThuc, 200), ketQua: s(p.ketQua, 40), ...p.laDapSo === true ? { laDapSo: true } : {}, ...s(p.nghia, 200) ? { nghia: s(p.nghia, 200) } : {} } : null);
  if (!ds.length || ds.length > 8 || ds.some((p) => !p)) return void 0;
  return ds;
}
function kiemPhepTinh(ds, phan, dapAn) {
  for (const p of ds) {
    let v;
    try {
      v = tinhBieuThuc(p.bieuThuc);
    } catch {
      return `biểu thức «${p.ten}» không tính được`;
    }
    if (!khopLamTron(v, p.ketQua)) return `«${p.ten}» tính lại ra ${v}, bản ghi ${p.ketQua}`;
  }
  if (phan === "III") {
    const cuoi = [...ds].reverse().find((p) => p.laDapSo);
    if (!cuoi) return "thiếu phép tính ra đáp số";
    const v = tinhBieuThuc(cuoi.bieuThuc);
    if (!khopLamTron(v, dapAn)) return "đáp số tính lại lệch đáp án kho";
  }
  return null;
}
function dungTheoKho(phan, dapAn) {
  const d = dapAn.trim().toUpperCase().replace(/Đ/g, "D");
  if (phan === "I") return /^[A-D]$/.test(d) ? new Map(KHOA_I.map((k) => [k, k === d])) : null;
  if (phan === "II") return /^[DS]{4}$/.test(d) ? new Map(KHOA_II.map((k, i) => [k, d[i] === "D"])) : null;
  return null;
}
function kiemBanKinh(tho, ctx) {
  const boKhoi = [];
  const hong = (ly) => ({ ket: "khong_kiem_duoc", lyDo: ly, ban: null, boKhoi });
  if (!laObj(tho)) return hong("không phải đối tượng JSON");
  const cl = laObj(tho.cotLoi) ? tho.cotLoi : {};
  const cotLoi = { chu: s(cl.chu, 260), ...s(cl.congThuc, 80) ? { congThuc: s(cl.congThuc, 80) } : {}, chip: mang(cl.chip).map((c) => laObj(c) && s(c.nhan, 30) && s(c.chu, 90) ? { nhan: s(c.nhan, 30), chu: s(c.chu, 90) } : null).filter((c) => !!c).slice(0, 3) };
  const phim = mang(tho.phim).map(docNhip).filter((n) => !!n).slice(0, 6);
  const lyDo = mang(tho.lyDo).map((l) => laObj(l) && s(l.khoa, 2) && s(l.chu, 400) ? { khoa: s(l.khoa, 2), dung: l.dung === true, chu: s(l.chu, 400) } : null).filter((l) => !!l);
  const hayNham = mang(tho.hayNham).map((h) => laObj(h) && s(h.nghi, 220) && s(h.dung, 260) ? { nghi: s(h.nghi, 220), dung: s(h.dung, 260) } : null).filter((h) => !!h).slice(0, 3);
  const th = laObj(tho.tuHoi) ? tho.tuHoi : {};
  const tuHoi = { hoi: s(th.hoi, 220), tra: s(th.tra, 400) };
  const theNho = mang(tho.theNho).map((t) => laObj(t) && s(t.truoc, 200) && s(t.sau, 220) ? { truoc: s(t.truoc, 200), sau: s(t.sau, 220), ...s(t.viSao, 220) ? { viSao: s(t.viSao, 220) } : {} } : null).filter((t) => !!t).slice(0, 4);
  const tcNguon = new Map(ctx.nguon.thanChu.map((t) => [chuanDoiChieu(t), t]));
  const thanChu = [...new Set(mang(tho.thanChu).map((t) => tcNguon.get(chuanDoiChieu(s(t, 160)))).filter((t) => !!t))].slice(0, 3);
  if (mang(tho.thanChu).length > thanChu.length) boKhoi.push("thần chú không có trong bảng của thầy");
  const noiNguon = new Map(ctx.nguon.thayNoi.map((t) => [chuanDoiChieu(t), t]));
  const thayNoiTho = s(tho.thayNoi, 300);
  const thayNoi = thayNoiTho ? noiNguon.get(chuanDoiChieu(thayNoiTho)) : void 0;
  if (thayNoiTho && !thayNoi) boKhoi.push("câu thầy nói không có trong mục kiến thức");
  const meoNguon = new Map(ctx.nguon.meo.map((t) => [chuanDoiChieu(t), t]));
  const meoTho = s(tho.meo, 300);
  const meo = meoTho ? meoNguon.get(chuanDoiChieu(meoTho)) : void 0;
  if (meoTho && !meo) boKhoi.push("mẹo không có trong mục kiến thức");
  const canhTho = tho.canh;
  const canh = canhTho === void 0 || canhTho === null ? null : docCanh(canhTho);
  if (canhTho && !canh) boKhoi.push("cảnh minh hoạ sai khuôn");
  const soDo = docSoDo(tho.soDo);
  const buoc = docBuoc(tho.buoc);
  const phepTinh = docPhepTinh(tho.phepTinh);
  const ban = {
    qid: ctx.qid,
    phienBan: PHIEN_BAN_KINH,
    phan: ctx.phan,
    cotLoi,
    phim,
    ...canh ? { canh } : {},
    thanChu,
    ...thayNoi ? { thayNoi } : {},
    ...meo ? { meo } : {},
    lyDo,
    ...soDo ? { soDo } : {},
    ...buoc ? { buoc } : {},
    ...phepTinh ? { phepTinh } : {},
    ...s(tho.ketQua, 40) ? { ketQua: s(tho.ketQua, 40) } : {},
    ...s(tho.kiemLai, 260) ? { kiemLai: s(tho.kiemLai, 260) } : {},
    hayNham,
    tuHoi,
    theNho
  };
  const thieu = [];
  if (!cotLoi.chu) thieu.push("kiến thức cốt lõi");
  if (phim.length < 3) thieu.push("phim ≥ 3 nhịp");
  if (!hayNham.length) thieu.push("chỗ hay nhầm");
  if (!tuHoi.hoi || !tuHoi.tra) thieu.push("câu tự trả lời");
  if (!theNho.length) thieu.push("thẻ nhớ");
  if (ctx.phan === "III" && !buoc && !phepTinh) thieu.push("phép tính có nghĩa từng số");
  const cam = chuCam(ban);
  if (cam) return { ket: "thieu", lyDo: cam, ban, boKhoi };
  if (thieu.length) return { ket: "thieu", lyDo: `thiếu: ${thieu.join(", ")}`, ban, boKhoi };
  const theoKho = dungTheoKho(ctx.phan, ctx.dapAn);
  if (ctx.phan === "I" || ctx.phan === "II") {
    if (!theoKho) return { ket: "khong_kiem_duoc", lyDo: "đáp án kho không đọc được", ban, boKhoi };
    const khoa = ctx.phan === "I" ? KHOA_I : KHOA_II;
    const gap = new Map(lyDo.map((l) => [l.khoa, l]));
    if (gap.size !== 4 || !khoa.every((k) => gap.has(k))) return { ket: "thieu", lyDo: "lý do chưa đủ bốn phương án / ý", ban, boKhoi };
    for (const k of khoa) if (gap.get(k).dung !== theoKho.get(k)) return { ket: "lech", lyDo: `lý do ${k} lệch đáp án kho`, ban, boKhoi };
    ban.lyDo = khoa.map((k) => gap.get(k));
  } else if (lyDo.length) ban.lyDo = [];
  if (phepTinh) {
    const loi = kiemPhepTinh(phepTinh, ctx.phan, ctx.dapAn);
    if (loi) return { ket: "lech", lyDo: loi, ban, boKhoi };
  }
  if (buoc && ctx.kiemSo) {
    const k = ctx.kiemSo({ ...soDo ? { soDo } : {}, buoc, ...ban.ketQua ? { ketQua: ban.ketQua } : {} });
    if (!k.ok) {
      if (ctx.phan === "III" && phepTinh) {
        delete ban.buoc;
        delete ban.soDo;
        boKhoi.push("chuỗi thừa số không khớp, giữ phép tính có tên");
      } else return { ket: ctx.phan === "III" ? "lech" : "thieu", lyDo: k.lyDo ?? "phép tính không khớp đáp án kho", ban, boKhoi };
    }
  }
  return { ket: "dat", lyDo: "", ban, boKhoi };
}
function banKinhDungDuoc(x, phan, dapAn) {
  if (!laObj(x) || typeof x.qid !== "string") return null;
  const k = kiemBanKinh(x, { phan, dapAn, qid: x.qid, nguon: { thanChu: mang(x.thanChu).map((t) => s(t, 160)), thayNoi: x.thayNoi ? [s(x.thayNoi, 300)] : [], meo: x.meo ? [s(x.meo, 300)] : [] } });
  return k.ket === "dat" ? k.ban : null;
}

// ../../src/lib/cham-so.ts
function soKhopSo(v, d, cheDo) {
  const a = chuanHoaSoNhap(v), b = chuanHoaSoNhap(d);
  if (!a || !b) return false;
  if (cheDo === "so_hoc") {
    try {
      return chamTheoPolicy({ policy: POLICY_MAC_DINH_PHAN_III, key: String(d ?? ""), answer: String(v ?? "") }).correct;
    } catch (e) {
      if (e instanceof ChamMaterialError) return false;
      throw e;
    }
  }
  const pa = tachSoVaDonVi(a, false), pb = tachSoVaDonVi(b, false);
  if (!pa.ok || !pb.ok) return false;
  if (pa.so.unit && pb.so.unit && pa.so.unit !== pb.so.unit) return false;
  if (pa.so.numText === pb.so.numText) return true;
  const dinhTri = coSoMuRieng(v) ? null : dinhTriKhoa(d);
  if (dinhTri === null) return false;
  const pdt = tachSoVaDonVi(chuanHoaSoNhap(dinhTri), false);
  return pdt.ok && pa.so.numText === pdt.so.numText;
}
var khopPhanIII = (cuaEm, dapAn) => soKhopSo(cuaEm, dapAn, "so_hoc");

// ../../server/src/so-do-cong.ts
var SO_BUOC_TOI_DA = 3;
var str = (v) => v == null ? "" : String(v);
var CO_MU = /(?:[×x*·]\s*10|\.\s*10\s*\^|\^|[eE][+-]?\d|[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺])/;
function docSo(raw) {
  const s2 = str(raw).trim();
  const d = docSoPhanIII(s2);
  if (!d) return null;
  const v = Number(d.so);
  if (!Number.isFinite(v)) return null;
  let donViCuoi;
  if (CO_MU.test(s2)) {
    const m = /^[+\-−]?\s*(\d+(?:[.,]\d+)?)/.exec(s2);
    const chuSo = (m?.[1] ?? "").replace(/[.,]/g, "").replace(/^0+/, "");
    const coNghia = Math.max(1, chuSo.length);
    donViCuoi = v === 0 ? 1 : Math.pow(10, Math.floor(Math.log10(Math.abs(v))) - coNghia + 1);
    if (/^[+\-−]?\s*10\s*(?:\^|[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺])/.test(s2)) donViCuoi = Math.abs(v) * 1e-9;
  } else {
    const tp = d.so.split(".")[1] ?? "";
    donViCuoi = Math.pow(10, -tp.length);
  }
  return { v, donViCuoi, donVi: d.donVi };
}
function trongLamTron(x, t) {
  return Math.abs(x.v - t) <= 0.5 * x.donViCuoi * (1 + 1e-9) + 1e-12 * Math.max(1, Math.abs(t));
}
var DON_VI_SO = /^[\p{L}%°³²/·.\s]{0,12}$/u;
var MU_NHO = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-", "⁺": "+" };
function chuanBieuThuc(so) {
  return so.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g, (m) => `^(${[...m].map((c) => MU_NHO[c]).join("")})`).replace(/[−–—‒]/g, "-").replace(/[×·∙⋅]/g, "*").replace(/:/g, "/").replace(/(\d)\s*\.\s*(?=10\s*\^)/g, "$1*").replace(/(\d)\s*[xX]\s*(?=10\s*\^)/g, "$1*").replace(/[\s ]+/g, " ").trim();
}
function giaTriThuaSo(so, ten = /* @__PURE__ */ new Map()) {
  const goc = str(so).trim();
  if (!goc) return null;
  if (ten.has(goc)) return ten.get(goc);
  const s2 = chuanBieuThuc(goc).replace(/^\*\s*/, "");
  const tenDai = [...ten.keys()].filter(Boolean).sort((a, b) => b.length - a.length);
  let i = 0;
  const trang = () => {
    while (s2[i] === " ") i++;
  };
  const xem = () => {
    trang();
    return s2[i] ?? "";
  };
  const loi = { v: NaN };
  function nguyenTo() {
    const c = xem();
    if (c === "(") {
      i++;
      const v2 = tong();
      if (xem() !== ")") throw loi;
      i++;
      return v2;
    }
    for (const t of tenDai) if (s2.startsWith(t, i)) {
      i += t.length;
      return ten.get(t);
    }
    const m = /^\d{1,3}(?: \d{3})+(?:,\d+)?(?![\d.])|^\d+(?:[.,]\d+)?/.exec(s2.slice(i));
    if (!m) throw loi;
    i += m[0].length;
    let v = Number(m[0].replace(/ /g, "").replace(",", "."));
    if (xem() === "%") {
      i++;
      v /= 100;
    }
    return v;
  }
  function luyThua() {
    const co = nguyenTo();
    if (xem() === "^") {
      i++;
      return Math.pow(co, motNgoi());
    }
    return co;
  }
  function motNgoi() {
    const c = xem();
    if (c === "-") {
      i++;
      return -motNgoi();
    }
    if (c === "+") {
      i++;
      return motNgoi();
    }
    return luyThua();
  }
  function tich() {
    let v = motNgoi();
    for (; ; ) {
      const c = xem();
      if (c === "*") {
        i++;
        v *= motNgoi();
      } else if (c === "/") {
        i++;
        const m = motNgoi();
        if (m === 0) throw loi;
        v /= m;
      } else return v;
    }
  }
  function tong() {
    let v = tich();
    for (; ; ) {
      const c = xem();
      if (c === "+") {
        i++;
        v += tich();
      } else if (c === "-") {
        i++;
        v -= tich();
      } else return v;
    }
  }
  try {
    const v = tong();
    if (xem() !== "") return null;
    return Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}
function tinhChuoi(ban) {
  const ten = /* @__PURE__ */ new Map();
  const giaTriBuoc = [], tienTo = [], nguyenVan = [];
  for (const [i, b] of ban.buoc.entries()) {
    const ds = Array.isArray(b?.thuaSo) ? b.thuaSo : [];
    if (!ds.length) return { ok: false, lyDo: `Bước ${i + 1} không có thừa số.` };
    let tich = 1;
    for (const [j, t] of ds.entries()) {
      const v = giaTriThuaSo(str(t?.so), ten);
      if (v === null) return { ok: false, lyDo: `Bước ${i + 1}: thừa số «${str(t?.so).slice(0, 40)}» không đọc được.` };
      const ve = str(t?.so).trim();
      if (!ten.has(ve) && docSoPhanIII(ve)) nguyenVan.push(v);
      tich *= v;
      if (j >= 1) tienTo.push(tich);
    }
    if (!Number.isFinite(tich)) return { ok: false, lyDo: `Bước ${i + 1} ra số không hữu hạn.` };
    giaTriBuoc.push(tich);
    const tenBuoc = str(b?.ten).trim();
    if (tenBuoc) ten.set(tenBuoc, tich);
  }
  return { ok: true, giaTriBuoc, tienTo, nguyenVan };
}
function chuTruocNop(ban) {
  const ra = [str(ban.deNoiGi), str(ban.chiaKhoa), str(ban.cauTuHoi)];
  if (ban.soDo) {
    for (const n of ban.soDo.nut ?? []) ra.push(str(n?.tong), str(n?.chat), ...Array.isArray(n?.soLieu) ? n.soLieu.map(str) : []);
    for (const m of ban.soDo.muiTen ?? []) if (m?.H != null) ra.push(`H = ${str(m.H)}%`);
  }
  for (const b of ban.buoc ?? []) for (const t of b?.thuaSo ?? []) ra.push(str(t?.nghia), str(t?.denDay));
  if (ban.hienTuong) {
    ra.push(...(ban.hienTuong.giaiThich ?? []).map(str));
    for (const k of ban.hienTuong.thiNghiem?.khung ?? []) ra.push(str(k?.tieuDe), str(k?.moTa));
  }
  return ra.filter((x) => x.trim());
}
var RE_SO_TRONG_CHU = /(?<![\p{L}\d_^.,])[-−]?\d+(?:[.,]\d+)*(?:\s*(?:[×x*·]|\.)\s*10\s*(?:\^\s*\(?[-−+]?\d+\)?|[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+))?(?:\^\s*\(?[-−+]?\d+\)?|[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+)?/gu;
function soTrongChu(chu) {
  const ra = [];
  for (const m of chu.matchAll(RE_SO_TRONG_CHU)) {
    const d = docSo(m[0]);
    if (d) ra.push(d);
  }
  return ra;
}
var trungDich = (x, t) => t !== 0 && trongLamTron(x, t) && Math.abs(x.v - t) <= 0.01 * Math.abs(t);
function noiChuCai(chu, x) {
  const L = x.toUpperCase();
  return new RegExp(`(?:đáp\\s*án|phương\\s*án|chọn|câu|ý)\\s*[:\\-–]?\\s*\\(?${L}\\)?(?![\\p{L}\\d])`, "iu").test(chu) || new RegExp(`\\(${L}\\)`, "u").test(chu) || new RegExp(`^\\s*${L}\\s*[.:)]`, "u").test(chu);
}
function timLo(ban, cau, tinh) {
  const chu = chuTruocNop(ban);
  const dich = [];
  const so = chu.flatMap((c) => soTrongChu(c));
  if (cau.phan === "III") {
    const d = docSo(cau.dapAn);
    if (d) dich.push({ t: d.v, ten: "đáp số cuối" });
  }
  if (cau.phan === "I") {
    const x = str(cau.dapAn).trim().toUpperCase();
    if (/^[ABCD]$/.test(x)) {
      if (chu.some((c) => noiChuCai(c, x))) return `Lộ chữ cái phương án đúng (${x}).`;
      const pa = str(cau.luaChon?.[x]);
      const d = docSo(pa);
      if (d && DON_VI_SO.test(d.donVi)) dich.push({ t: d.v, ten: `giá trị phương án đúng (${x})` });
    }
  }
  if (tinh.ok) {
    const nguyenVan = tinh.nguyenVan;
    const laNguyenVan = (t) => nguyenVan.some((v) => Math.abs(v - t) <= 1e-9 * Math.max(1, Math.abs(t)));
    tinh.giaTriBuoc.forEach((t, i) => dich.push({ t, ten: i === tinh.giaTriBuoc.length - 1 ? "kết quả phép tính" : `kết quả bước ${i + 1}` }));
    for (const t of tinh.tienTo) if (!laNguyenVan(t)) dich.push({ t, ten: "kết quả trung gian" });
  }
  for (const b of ban.buoc ?? []) {
    const d = docSo(b?.ketQua);
    if (d) dich.push({ t: d.v, ten: `kết quả ghi của bước «${str(b?.ten)}»` });
  }
  {
    const d = docSo(ban.ketQua);
    if (d) dich.push({ t: d.v, ten: "kết quả cuối ghi trong bản" });
  }
  for (const d of dich) {
    const x = so.find((s2) => trungDich(s2, d.t));
    if (x) return `Phần hiện trước khi nộp có số ${x.v} trùng ${d.ten}.`;
  }
  return null;
}
function hinhDangLoi(ban) {
  if (!ban || typeof ban !== "object") return "Bản không phải đối tượng.";
  if (!Array.isArray(ban.buoc)) return "Thiếu mảng bước tính.";
  if (ban.buoc.length > SO_BUOC_TOI_DA) return `Quá ${SO_BUOC_TOI_DA} bước tính.`;
  return null;
}
var LY_DO_THIEU_SO_DO = "Câu tính thiếu sơ đồ hoặc bước tính.";
function kiemCong(ban, cau) {
  const hd = hinhDangLoi(ban);
  if (hd) return { ket: "khong_kiem_duoc", lyDo: hd };
  const tinh = tinhChuoi(ban);
  const giaTri = tinh.ok ? tinh.giaTriBuoc[tinh.giaTriBuoc.length - 1] : void 0;
  const kem = giaTri === void 0 ? {} : { giaTri };
  const lo = timLo(ban, cau, tinh);
  if (lo) return { ket: "lo_dap_an", lyDo: lo, ...kem };
  if (cau.phan === "II") return { ket: "khong_kiem_duoc", lyDo: "Phần II chưa kiểm số (v1).", ...kem };
  if (!ban.soDo || !ban.buoc.length) return { ket: "khong_kiem_duoc", lyDo: LY_DO_THIEU_SO_DO };
  if (!tinh.ok) return { ket: "khong_kiem_duoc", lyDo: tinh.lyDo };
  const v = giaTri;
  for (const [i, b] of ban.buoc.entries()) {
    const d = docSo(b?.ketQua);
    if (str(b?.ketQua).trim() && (!d || !trongLamTron(d, tinh.giaTriBuoc[i]))) return { ket: "lech", lyDo: `Kết quả ghi của bước ${i + 1} («${str(b?.ketQua)}») lệch phép tính ${tinh.giaTriBuoc[i]}.`, giaTri: v };
  }
  if (str(ban.ketQua).trim()) {
    const d = docSo(ban.ketQua);
    if (!d || !trongLamTron(d, v)) return { ket: "lech", lyDo: `Kết quả cuối ghi trong bản («${str(ban.ketQua)}») lệch phép tính ${v}.`, giaTri: v };
  }
  if (cau.phan === "III") {
    const d = docSo(cau.dapAn);
    if (!d) return { ket: "khong_kiem_duoc", lyDo: "Đáp án kho không phải số.", giaTri: v };
    return khopDapAnSo(v, cau.dapAn, d) ? { ket: "dat", giaTri: v } : { ket: "lech", lyDo: `Phép tính ra ${v}, đáp án kho ${cau.dapAn}.`, giaTri: v };
  }
  const x = str(cau.dapAn).trim().toUpperCase();
  if (!/^[ABCD]$/.test(x)) return { ket: "khong_kiem_duoc", lyDo: "Đáp án Phần I không phải A–D.", giaTri: v };
  const doc = Object.fromEntries(Object.entries(cau.luaChon ?? {}).map(([k, s2]) => [k.toUpperCase(), docSo(s2)]));
  const dung = doc[x];
  if (!dung || !DON_VI_SO.test(dung.donVi)) return { ket: "khong_kiem_duoc", lyDo: "Phương án đúng không phải số.", giaTri: v };
  if (!khopDapAnSo(v, str(cau.luaChon?.[x]), dung)) return { ket: "lech", lyDo: `Phép tính ra ${v}, phương án đúng ${x} = ${str(cau.luaChon?.[x])}.`, giaTri: v };
  const khac = Object.entries(doc).find(([k, d]) => k !== x && d && DON_VI_SO.test(d.donVi) && khopDapAnSo(v, str(cau.luaChon?.[k]), d));
  if (khac) return { ket: "khong_kiem_duoc", lyDo: `Phép tính khớp cả phương án ${khac[0]}.`, giaTri: v };
  return { ket: "dat", giaTri: v };
}
function khopDapAnSo(v, dapAn, d) {
  if (trongLamTron(d, v)) return true;
  const soChu = d.donViCuoi >= 1 ? 0 : Math.min(12, Math.round(-Math.log10(d.donViCuoi)));
  return Math.abs(v) < 1e15 && khopPhanIII(v.toFixed(soChu), dapAn);
}

// ../../server/src/kinh-than-chu.ts
var THAN_CHU = [
  {
    "chu": "Tăng thu, giảm toả",
    "them": "",
    "dung": "chuyển dịch cân bằng theo nhiệt độ",
    "goc": "1.C1 Cân bằng hoá học · xét chuyển dịch cân bằng theo nhiệt độ"
  },
  {
    "chu": "Bình thông nhau",
    "them": "bên nào dâng thì chảy sang bên kia",
    "dung": "chuyển dịch theo nồng độ, áp suất",
    "goc": "1.C1 · xét chuyển dịch cân bằng theo nồng độ"
  },
  {
    "chu": "Chống lại sự thay đổi đó",
    "them": "",
    "dung": "nguyên lí Le Chatelier",
    "goc": "1.C1 · nguyên lý Lơ Sa-tơ-li-ê và các yếu tố ảnh hưởng"
  },
  {
    "chu": "Tăng áp suất chọn phía ít mol khí, giảm áp suất chọn phía nhiều mol khí",
    "them": "",
    "dung": "chuyển dịch theo áp suất",
    "goc": "1.C1 · xét chuyển dịch cân bằng theo áp suất"
  },
  {
    "chu": "Khử cho, O nhận",
    "them": "",
    "dung": "chất khử, chất oxi hoá",
    "goc": "2009 Chương 4 Kĩ thuật xác định số OXH · chất khử, chất oxi hoá"
  },
  {
    "chu": "Cứ trung gian thì vừa giảm được, vừa tăng được",
    "them": "thấp nhất chỉ tăng, cao nhất chỉ giảm",
    "dung": "đoán tính oxi hoá / khử từ số oxi hoá",
    "goc": "7.C2 Nitrogen · số oxi hoá đặc trưng và tính chất hai mặt của N₂"
  },
  {
    "chu": "Ba câu thần chú ion",
    "them": ": ion từ base yếu có tính acid yếu; ion từ acid yếu có tính base yếu; mạnh với mạnh thì trung tính",
    "dung": "môi trường của muối, tính chất ion",
    "goc": "2007 Chương 7 Nhóm IA · xét tính chất của ion bằng ba câu thần chú"
  },
  {
    "chu": "Chiến thắng thuộc về kẻ mạnh",
    "them": "",
    "dung": "muối acid mạnh – base yếu và ngược lại",
    "goc": "4.C1 Acid base · xét môi trường của muối"
  },
  {
    "chu": "Lưỡng là hai",
    "them": "năm ion lưỡng tính phải thuộc, không xét",
    "dung": "ion lưỡng tính HCO₃⁻, HSO₃⁻, HS⁻, H₂PO₄⁻, HPO₄²⁻",
    "goc": "2007 Chương 7 · năm ion lưỡng tính phải học thuộc"
  },
  {
    "chu": "Electron độc thân là electron đang FA",
    "them": ", hai electron là đã xây dựng gia đình",
    "dung": "electron độc thân, liên kết, N≡N",
    "goc": "4.C1 Cấu hình electron · ký hiệu và trạng thái của obitan"
  },
  {
    "chu": "Ion dương thì trừ e từ ngoài vào trong của cấu hình đúng",
    "them": "",
    "dung": "cấu hình electron ion dương",
    "goc": "5.C1 Kĩ thuật cấu hình electron · ion dương"
  },
  {
    "chu": "Ion âm điền thêm e theo dãy phân mức năng lượng",
    "them": "",
    "dung": "cấu hình electron ion âm",
    "goc": "5.C1 · ion âm"
  },
  {
    "chu": "Thụ động là có nhưng lại không ra sản phẩm được",
    "them": "",
    "dung": "Fe, Al, Cr với HNO₃ đặc nguội",
    "goc": "10.C2 Oxide của nitrogen và nitric acid · thụ động"
  },
  {
    "chu": "Phú dưỡng là môi trường bị gút",
    "them": "thừa NO₃⁻, PO₄³⁻",
    "dung": "phú dưỡng",
    "goc": "10.C2 · phú dưỡng"
  },
  {
    "chu": "Giống nhau thì chơi với nhau",
    "them": "",
    "dung": "độ tan của hợp chất hữu cơ",
    "goc": "2008 Chương 3 Nền tảng hữu cơ P1 · độ tan"
  },
  {
    "chu": "Thuyết cấu tạo là ánh sáng soi đường",
    "them": "",
    "dung": "thuyết cấu tạo hoá học",
    "goc": "2008 Nền tảng hữu cơ · ba luận điểm của thuyết cấu tạo"
  },
  {
    "chu": "Gộp thì dễ, tách thì khó",
    "them": "",
    "dung": "công thức cấu tạo thu gọn ↔ chi tiết",
    "goc": "2008 Nền tảng hữu cơ · công thức cấu tạo"
  },
  {
    "chu": "Thành cái khung xương thôi, bỏ cái phần thịt đi",
    "them": "",
    "dung": "công thức cấu tạo khung",
    "goc": "2008 Nền tảng hữu cơ · công thức cấu tạo khung"
  },
  {
    "chu": "Nhổ răng",
    "them": ": coi 1 H là một cái răng, nhổ một H thành gốc",
    "dung": "đếm đồng phân gốc hydrocarbon",
    "goc": "1.C1 Ester · quy tắc nhổ răng"
  },
  {
    "chu": "H₂ là hai đĩa rau, brom là hai đĩa thịt",
    "them": "thức ăn của liên kết π",
    "dung": "phản ứng cộng của liên kết π",
    "goc": "1.C1 Ester · thức ăn của liên kết pi"
  },
  {
    "chu": 'OH như "em yêu" chỉ yêu hai anh: carbon no và carbon thơm',
    "them": "",
    "dung": "nhóm OH bền, alcohol / phenol",
    "goc": "1.C1 Ester · quy luật nhóm OH bền"
  }
];
export {
  THAN_CHU,
  banKinhDungDuoc,
  chuCam,
  chuanDoiChieu,
  docSoViet,
  khopLamTron,
  kiemBanKinh,
  kiemCong,
  kiemPhepTinh
};

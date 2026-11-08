/* eslint-disable */
// TỆP SINH TỰ ĐỘNG — đừng sửa tay. Dựng: node scripts/loi-giai-kinh/dung-kiem-kinh.mjs

// src/lib/loi-giai-kinh/kieu.ts
var PHIEN_BAN_KINH = 1;
var HINH_NHIP = ["binh", "ong-nghiem", "dun", "chiet", "loc", "can", "khi", "ket-tua", "mau", "nhiet", "ap-suat", "xuc-tac", "nguyen-tu", "phan-tu", "lien-ket", "dien", "pin", "do-thi", "mui-ten", "kinh-lup", "so-sanh", "cong-thuc"];
var MANH_TEN = ["nhanh", "mach", "lien-ket", "chuc", "goc-ancol", "goc-acid"];
var MAU_LOP = ["trong", "xanh", "cam", "vang", "hong", "tim", "nau", "trang-duc"];

// src/lib/doc-so-phan-iii.ts
function docSoPhanIII(raw) {
  var s3 = String(raw == null ? "" : raw);
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
  s3 = s3.replace(/10([\s\u00a0\u202f]*)([\u2070\u00b9\u00b2\u00b3\u2074-\u2079\u207a\u207b]+)/g, function(_t, _k, m2) {
    var r = "10^";
    for (var i = 0; i < m2.length; i++) r += MU[m2.charAt(i)];
    return r;
  });
  if (s3.normalize) s3 = s3.normalize("NFKC");
  s3 = s3.replace(/\\times/g, "×").replace(/\\cdot/g, "·");
  s3 = s3.replace(/[\s\u00a0\u1680\u180e\u2000-\u200f\u2028\u2029\u202f\u205f\u2060\u3000\ufeff]+/g, "");
  s3 = s3.replace(/[\u2010-\u2015\u2212\ufe63\uff0d]/g, "-").replace(/[\u066b\u201a\u060c]/g, ",").toLowerCase();
  s3 = s3.replace(/^[+\u2248~=]+/, "").replace(/[.,;:!?]+$/, "");
  s3 = s3.replace(/\^+/g, "^");
  if (!s3) return null;
  var dinhTri = "";
  var mu = 0;
  var coMu = false;
  var duoi = "";
  var SO = "([+-]?(?:\\d[\\d.,]*|[.,]\\d+))";
  var MU10 = "10(?:\\^|\\*\\*)?[({]?([+-]?\\d+)[)}]?";
  var m = new RegExp("^" + SO + "[x×*·⋅∙]" + MU10 + "(.*)$").exec(s3) || new RegExp("^" + SO + "\\.10(?:\\^|\\*\\*)[({]?([+-]?\\d+)[)}]?(.*)$").exec(s3) || new RegExp("^" + SO + "e([+-]?\\d+)(.*)$").exec(s3);
  if (m) {
    dinhTri = m[1];
    mu = parseInt(m[2], 10);
    coMu = true;
    duoi = m[3];
  } else {
    var m10 = /^([+-]?)10(?:\^|\*\*)[({]?([+-]?\d+)[)}]?(.*)$/.exec(s3);
    if (m10) {
      dinhTri = m10[1] + "1";
      mu = parseInt(m10[2], 10);
      coMu = true;
      duoi = m10[3];
    } else {
      var mp = new RegExp("^" + SO + "(.*)$").exec(s3);
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
  var nguyen2 = dinhTri;
  var le = "";
  var coDauThapPhan = false;
  if (thapPhan) {
    var k = dinhTri.lastIndexOf(thapPhan);
    nguyen2 = dinhTri.slice(0, k);
    le = dinhTri.slice(k + 1);
    coDauThapPhan = true;
  }
  if (nghin) {
    var nhom = nguyen2.split(nghin);
    if (!/^\d{1,3}$/.test(nhom[0])) return null;
    for (var j = 1; j < nhom.length; j++) if (!/^\d{3}$/.test(nhom[j])) return null;
    nguyen2 = nhom.join("");
  }
  if (!/^\d*$/.test(nguyen2) || !/^\d*$/.test(le) || !nguyen2 && !le) return null;
  if (!coMu) {
    return { so: dau + nguyen2 + (coDauThapPhan ? "." + le : ""), donVi: duoi };
  }
  var chuSo = (nguyen2 || "0") + le;
  var viTri = (nguyen2 || "0").length + mu;
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

// src/lib/cham-so-policy.ts
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
  let s3 = String(raw ?? "").normalize("NFKC").replace(KHOANG_TRANG, "").replace(DAU_TRU, "-").replace(/[٫‚،]/g, ",").toLowerCase();
  s3 = s3.replace(/^[+≈~=]+/, "").replace(/[.,;:!?]+$/, "").replace(/,/g, ".");
  const x10 = KHOA_HOC_X10.exec(s3) ?? KHOA_HOC_E.exec(s3);
  if (x10) {
    const n = Number(`${x10[1]}e${x10[2]}`);
    if (Number.isFinite(n)) return String(n);
  }
  return s3;
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
  const s3 = u.normalize("NFKC").toLowerCase().replace(KHOANG_TRANG, "");
  const trongNgoac = /^\((.*)\)$/.exec(s3) ?? /^\[(.*)\]$/.exec(s3);
  return trongNgoac ? trongNgoac[1] : s3;
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
function phanSoTuChuoiSo(s3) {
  const m = /^([+-]?)(\d*)(?:\.(\d*))?$/.exec(s3);
  if (!m) return null;
  const dau = m[1] ?? "";
  const nguyen2 = m[2] ?? "";
  const le = m[3] ?? "";
  if (!nguyen2 && !le) return null;
  const chuSo = (nguyen2 || "0") + le;
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
function tachSoVaDonVi(s3, allowFraction) {
  if (!s3) return { ok: false, loi: "unsupported-format" };
  if (allowFraction) {
    const m2 = PHAN_SO.exec(s3);
    if (m2) {
      const tu = phanSoTuChuoiSo(m2[1]);
      const mau = phanSoTuChuoiSo(m2[2]);
      if (!tu || !mau || mau.tu === 0n) return { ok: false, loi: "unsupported-format" };
      return { ok: true, so: { numText: s3, unit: null, gia: rutGon({ tu: tu.tu * mau.mau, mau: tu.mau * mau.tu }) } };
    }
  }
  if (SO_THUAN.test(s3)) {
    const gia2 = phanSoTuChuoiSo(s3);
    return gia2 ? { ok: true, so: { numText: s3, unit: null, gia: gia2 } } : { ok: false, loi: "unsupported-format" };
  }
  const m = SO_ROI_DUOI.exec(s3);
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
  const s3 = String(key ?? "");
  const m = /^(.*?)(?:\s*[x×*·⋅∙]\s*10|\.10(?=\s*[\^⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]))\s*(?:\^|\*\*)?\s*[({]?\s*([+\-−⁻⁺]?[0-9⁰¹²³⁴⁵⁶⁷⁸⁹]+)/.exec(s3);
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

// src/lib/cau-tu-luan.ts
var YC = new RegExp("^(?:hãy )?(?:viết|xác định|tính(?! (?:chất|khử|oxi|acid|axit|base|tan|dẫn|dẻo))|giải thích|trình bày|nêu|so sánh|nhận xét|đề xuất|cho biết|tìm|(?:tại|vì) sao)(?!\\p{L})", "iu");

// src/lib/loi-giai-kiem.ts
function tinhBieuThuc(bt) {
  const s3 = bt.replace(/\s+/g, "");
  if (!/^[0-9.+\-*/()eE]+$/.test(s3)) throw new Error("biểu thức có kí tự lạ: " + bt);
  let i = 0;
  const so = () => {
    if (s3[i] === "(") {
      i++;
      const v2 = cong();
      if (s3[i] !== ")") throw new Error("thiếu ngoặc đóng: " + bt);
      i++;
      return v2;
    }
    if (s3[i] === "-") {
      i++;
      return -so();
    }
    if (s3[i] === "+") {
      i++;
      return so();
    }
    const m = /^(\d+(\.\d+)?|\.\d+)([eE][+-]?\d+)?/.exec(s3.slice(i));
    if (!m) throw new Error("biểu thức hỏng: " + bt);
    i += m[0].length;
    return Number(m[0]);
  };
  const nhan = () => {
    let v2 = so();
    while (s3[i] === "*" || s3[i] === "/") {
      const op = s3[i++];
      const r = so();
      v2 = op === "*" ? v2 * r : v2 / r;
    }
    return v2;
  };
  const cong = () => {
    let v2 = nhan();
    while (s3[i] === "+" || s3[i] === "-") {
      const op = s3[i++];
      const r = nhan();
      v2 = op === "+" ? v2 + r : v2 - r;
    }
    return v2;
  };
  const v = cong();
  if (i !== s3.length) throw new Error("biểu thức thừa kí tự: " + bt);
  if (!Number.isFinite(v)) throw new Error("biểu thức ra vô cực: " + bt);
  return v;
}

// src/lib/loi-giai-kinh/dong-phan.ts
var laObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
var mang = (v) => Array.isArray(v) ? v : [];
var s = (v, tran = 200) => typeof v === "string" || typeof v === "number" ? String(v).normalize("NFC").replace(/\s+/g, " ").trim().slice(0, tran) : "";
var nguyen = (v, a, b) => Number.isInteger(v) && Number(v) >= a && Number(v) <= b ? Number(v) : null;
var DAT_DP = ["nhom", "oh", "doi", "ba", "xeton", "chen"];
var DAT_NGUYEN_TU = /* @__PURE__ */ new Set(["nhom", "oh", "xeton"]);
var laDatNguyenTu = (d) => DAT_NGUYEN_TU.has(d);
function tinhK(n) {
  return (2 * n.C + 2 + (n.N ?? 0) - n.H - (n.X ?? 0)) / 2;
}
function dungKhung(k) {
  const chinh = nguyen(k.chinh, 1, 12);
  if (!chinh) return null;
  const cha = [], ten = [];
  for (let i = 0; i < chinh; i++) {
    cha.push(i - 1);
    ten.push(`C${i + 1}`);
  }
  const nhanh = [];
  for (const n of mang(k.nhanh)) {
    if (!laObj(n)) return null;
    const o = nguyen(n.o, 1, chinh), dai = nguyen(n.dai, 1, 5);
    if (!o || !dai) return null;
    const ds = [];
    for (let j = 0; j < dai; j++) {
      ds.push(cha.length);
      cha.push(j === 0 ? o - 1 : cha.length - 1);
      ten.push(`nhánh C${o}`);
    }
    nhanh.push({ o: o - 1, nguyenTu: ds });
  }
  if (cha.length > 14) return null;
  const bac = new Array(cha.length).fill(0);
  cha.forEach((c, i) => {
    if (c >= 0) {
      bac[c]++;
      bac[i]++;
    }
  });
  if (bac.some((b) => b > 4)) return null;
  return { cha, chinh, ten, nhanh };
}
var keCua = (cha) => {
  const ke = cha.map(() => []);
  cha.forEach((c, i) => {
    if (c >= 0) {
      ke[c].push(i);
      ke[i].push(c);
    }
  });
  return ke;
};
function machDaiNhat(cha) {
  const ke = keCua(cha);
  const xa = (goc) => {
    const d = new Array(cha.length).fill(-1);
    d[goc] = 0;
    const hang = [goc];
    for (let i = 0; i < hang.length; i++) for (const v of ke[hang[i]]) if (d[v] < 0) {
      d[v] = d[hang[i]] + 1;
      hang.push(v);
    }
    let m = goc;
    d.forEach((x, i) => {
      if (x > d[m]) m = i;
    });
    return { m, d: d[m] };
  };
  return xa(xa(0).m).d + 1;
}
function dangChuan(nhan, ke) {
  const n = nhan.length;
  if (n === 1) return nhan[0];
  const bac = ke.map((k) => k.length), con = new Set(nhan.map((_, i) => i));
  let la = [...con].filter((i) => bac[i] <= 1);
  while (con.size > 2) {
    const moi = [];
    for (const l of la) {
      con.delete(l);
      for (const v of ke[l]) if (con.has(v) && --bac[v] === 1) moi.push(v);
    }
    la = moi;
  }
  const ma = (u, p) => nhan[u] + "(" + ke[u].filter((v) => v !== p).map((v) => ma(v, u)).sort().join(",") + ")";
  return [...con].map((c) => ma(c, -1)).sort()[0];
}
var dangChuanKhung = (cha) => dangChuan(cha.map(() => "C"), keCua(cha));
function viTriCua(kd, dat) {
  if (laDatNguyenTu(dat)) return kd.cha.map((_, a) => ({ loai: "c", a }));
  return kd.cha.flatMap((c, b) => c >= 0 ? [{ loai: "lk", a: c, b }] : []);
}
var NGUOC = { OH: "HO", CHO: "OHC", COOH: "HOOC", NH2: "H2N", NO2: "O2N", CN: "NC", COOCH3: "CH3OOC", OCH3: "CH3O" };
var nguocNhan = (t) => NGUOC[t] ?? t;
var KY_LK = { doi: "=", ba: "≡" };
function gomThe(ds) {
  const dem = /* @__PURE__ */ new Map();
  for (const t of ds) dem.set(t, (dem.get(t) ?? 0) + 1);
  return [...dem].map(([t, r]) => /^(F|Cl|Br|I)$/.test(t) ? t + (r > 1 ? r : "") : `(${t})${r > 1 ? r : ""}`).join("");
}
function dungChat(kd, dat, viTri) {
  const n = kd.cha.length, ke = keCua(kd.cha);
  const H = ke.map((k) => 4 - k.length);
  const pi = new Array(n).fill(0), oh = new Array(n).fill(0), xeton = new Array(n).fill(false);
  const the = kd.cha.map(() => []);
  const canh = /* @__PURE__ */ new Map();
  const khoa = (a, b) => a < b ? `${a}-${b}` : `${b}-${a}`;
  for (let i = 0; i < dat.length; i++) {
    const d = dat[i], v = viTri[i];
    if (v.loai === "c") {
      if (d.loai === "xeton") {
        if (ke[v.a].length < 2) return { ok: false, ly: "nhóm CO ở đầu mạch thì một đầu là H ⇒ thành anđehit, chứ không phải xeton" };
        H[v.a] -= 2;
        xeton[v.a] = true;
      } else {
        if (d.loai === "oh") {
          if (oh[v.a]) return { ok: false, ly: "hai OH trên một C — không bền, không tính" };
          oh[v.a]++;
        }
        H[v.a]--;
        the[v.a].push(d.nhan);
      }
    } else {
      const k = khoa(v.a, v.b);
      if (canh.has(k)) return { ok: false, ly: "hai thứ cùng chen vào một liên kết" };
      canh.set(k, d);
      if (d.loai === "doi") {
        H[v.a]--;
        H[v.b]--;
        pi[v.a]++;
        pi[v.b]++;
      }
      if (d.loai === "ba") {
        H[v.a] -= 2;
        H[v.b] -= 2;
        pi[v.a] += 2;
        pi[v.b] += 2;
      }
    }
  }
  if (H.some((h) => h < 0)) return { ok: false, ly: "C quá 4 gạch — không điền được" };
  for (let a = 0; a < n; a++) {
    if (oh[a] && (pi[a] || xeton[a])) return { ok: false, ly: "OH chỉ cắm vào C no — OH gắn C nối đôi (enol) không tính" };
    if (xeton[a] && pi[a]) return { ok: false, ly: "C của nhóm CO không mang thêm nối đôi" };
  }
  const nhan = kd.cha.map((_, a) => xeton[a] ? "C=O" : "C");
  const ke2 = kd.cha.map(() => []);
  const noi = (a, b) => {
    ke2[a].push(b);
    ke2[b].push(a);
  };
  kd.cha.forEach((c, b) => {
    if (c < 0) return;
    const d = canh.get(khoa(c, b));
    if (!d) return noi(c, b);
    const m = nhan.length;
    nhan.push(d.loai === "chen" ? `-${d.nhan}-` : KY_LK[d.loai]);
    ke2.push([]);
    noi(c, m);
    noi(m, b);
  });
  the.forEach((ds, a) => ds.forEach((t) => {
    const m = nhan.length;
    nhan.push(t);
    ke2.push([]);
    noi(a, m);
  }));
  function chuC(u) {
    if (u >= n) return nhan[u];
    const h = H[u];
    return xeton[u] ? "CO" : `C${h ? "H" + (h > 1 ? h : "") : ""}`;
  }
  function lk(u, v) {
    const d = u < n && v < n ? canh.get(khoa(u, v)) : void 0;
    return d ? d.loai === "chen" ? `-${d.nhan}-` : KY_LK[d.loai] : "-";
  }
  function gonNhanh(v, tu) {
    if (v >= n) {
      const ky = nhan[v];
      if (ky === "=" || ky === "≡") {
        const sau = ke2[v].find((x) => x !== tu);
        return ky + gonNhanh(sau, v);
      }
      if (ky.startsWith("-")) {
        const sau = ke2[v].find((x) => x !== tu);
        return ky.slice(1) + gonNhanh(sau, v);
      }
      return ky;
    }
    return viet(v, tu);
  }
  function viet(u, tu) {
    const conC = ke[u].filter((v) => v !== tu);
    const theU = the[u];
    let chu = chuC(u);
    if (!conC.length && theU.length === 1) return chu + "-" + theU[0];
    chu += gomThe(theU);
    if (!conC.length) return chu;
    const tiep = conC[conC.length - 1];
    for (const v of conC.slice(0, -1)) chu += `(${lkNhanh(u, v)}${viet(v, u)})`;
    return chu + lk(u, tiep) + viet(tiep, u);
  }
  function lkNhanh(u, v) {
    const x = lk(u, v);
    return x === "-" ? "" : x.startsWith("-") ? x.slice(1) : x;
  }
  function vietMach() {
    const parts = [];
    for (let i = 0; i < kd.chinh; i++) {
      const u = i;
      const conNhanh = ke[u].filter((v) => v >= kd.chinh);
      let chu = chuC(u);
      const theU = the[u];
      if (i === 0 && theU.length === 1 && kd.chinh > 1) chu = nguocNhan(theU[0]) + "-" + chu;
      else if (i === kd.chinh - 1 && theU.length === 1 && kd.chinh > 1 && !conNhanh.length) chu = chu + "-" + theU[0];
      else if (kd.chinh === 1 && theU.length === 1 && !conNhanh.length) chu = chu + "-" + theU[0];
      else chu += gomThe(theU);
      for (const v of conNhanh) chu += `(${lkNhanh(u, v)}${viet(v, u)})`;
      parts.push(chu);
      if (i < kd.chinh - 1) parts.push(lk(i, i + 1));
    }
    return parts.join("");
  }
  const ma = (u, p) => nhan[u] + "(" + ke2[u].filter((v) => v !== p).map((v) => ma(v, u)).sort().join(",") + ")";
  const dau = [];
  let hinhHoc = 0;
  for (const [k, d] of canh) {
    if (d.loai !== "doi") continue;
    const [a, b] = k.split("-").map(Number);
    const giua = ke2[a].find((v) => nhan[v] === "=" && ke2[v].includes(b));
    const nhom = (x) => {
      const ds = ke2[x].filter((v) => v !== giua).map((v) => ({ ma: ma(v, x), chu: gonNhanh(v, x) }));
      for (let h = 0; h < H[x]; h++) ds.push({ ma: "H", chu: "H" });
      return ds;
    };
    const ta = nhom(a), tb = nhom(b);
    if (ta.length !== 2 || tb.length !== 2) continue;
    const co = ta[0].ma !== ta[1].ma && tb[0].ma !== tb[1].ma;
    if (co) hinhHoc++;
    dau.push({ trai: [ta[0].chu, ta[1].chu], phai: [tb[0].chu, tb[1].chu], co });
  }
  return { ok: true, nhan, ke: ke2, gon: vietMach(), hinhHoc, dau };
}
function lietKeMach(m) {
  const kd = dungKhung(m.khung);
  if (!kd || !m.dat.length || m.dat.length > 2) return null;
  const vt = m.dat.map((d) => viTriCua(kd, d.loai));
  const ds = [];
  if (m.dat.length === 1) for (const v of vt[0]) ds.push([v]);
  else {
    const cung = m.dat[0].loai === m.dat[1].loai && m.dat[0].nhan === m.dat[1].nhan;
    vt[0].forEach((v, i) => vt[1].forEach((w, j) => {
      if (cung && (laDatNguyenTu(m.dat[0].loai) ? j < i : j <= i)) return;
      ds.push([v, w]);
    }));
  }
  if (ds.length > 400) return null;
  const chon = m.chon && m.chon.length ? new Set(m.chon) : null;
  const da = /* @__PURE__ */ new Map();
  let soChat = 0, hinhHoc = 0;
  const toHop = ds.map((viTri, i) => {
    const so = i + 1;
    const c = dungChat(kd, m.dat, viTri);
    if (!c.ok) return { so, viTri, ket: "thua", ly: c.ly };
    const dc = dangChuan(c.nhan, c.ke);
    const chung = { gon: c.gon, hinhHoc: c.hinhHoc, dau: c.dau, dangChuan: dc };
    if (chon && !chon.has(so)) return { so, viTri, ket: "loai", ...chung };
    const truoc = da.get(dc);
    if (truoc) return { so, viTri, ket: "trung", trungVoi: truoc, ...chung };
    da.set(dc, so);
    soChat++;
    hinhHoc += c.hinhHoc;
    return { so, viTri, ket: "moi", chat: soChat, ...chung };
  });
  return { kd, toHop, soChat, hinhHoc };
}
var KHUNG_NHO = /* @__PURE__ */ new Map();
function moiKhung(n) {
  if (n < 1 || n > 9) return [];
  const co = KHUNG_NHO.get(n);
  if (co) return co;
  let lop = [[-1]];
  for (let k = 2; k <= n; k++) {
    const moi = /* @__PURE__ */ new Map();
    for (const cha of lop) {
      const bac = new Array(cha.length).fill(0);
      cha.forEach((c, i) => {
        if (c >= 0) {
          bac[c]++;
          bac[i]++;
        }
      });
      for (let a = 0; a < cha.length; a++) if (bac[a] < 4) {
        const x = [...cha, a];
        const d = dangChuanKhung(x);
        if (!moi.has(d)) moi.set(d, x);
      }
    }
    lop = [...moi.values()];
  }
  KHUNG_NHO.set(n, lop);
  return lop;
}
var SO_GOC = [1, 1, 1, 2, 4, 8, 17];
var toHopLap = (g, r) => {
  let t = 1;
  for (let i = 0; i < r; i++) t = t * (g + i) / (i + 1);
  return Math.round(t);
};
var tich = (a) => a.reduce((x, y) => x * y, 1);
function kiemHang(loai, h) {
  if (loai === "khac") return h.tich === tich(h.soCach) ? null : `dòng ${h.phan.join("–")}: tích ${tich(h.soCach)} chứ không phải ${h.tich}`;
  if (h.ghi) return h.tich === tich(h.soCach) || loai === "aren" ? null : `dòng ${h.phan.join("–")}: tích sai`;
  const g = h.phan.map((c) => SO_GOC[c]);
  if (g.some((x) => x === void 0)) return null;
  if (loai === "este") {
    if (h.phan.length !== 2 || h.phan[1] < 1) return "dòng ester phải có R (được là H) và R′ (không là H)";
    if (h.soCach[0] !== g[0] || h.soCach[1] !== g[1]) return `dòng ${h.phan.join("–")}: số gốc phải là ${g.join(" × ")}`;
    return h.tich === g[0] * g[1] ? null : `dòng ${h.phan.join("–")}: ${g.join(" × ")} = ${g[0] * g[1]}`;
  }
  const dem = /* @__PURE__ */ new Map();
  for (const c of h.phan) dem.set(c, (dem.get(c) ?? 0) + 1);
  if (h.soCach.some((x, i) => x !== g[i])) return `dòng ${h.phan.join("–")}: số gốc phải là ${g.join(", ")}`;
  let t = 1;
  for (const [c, r] of dem) t *= toHopLap(SO_GOC[c], r);
  if (loai === "aren") {
    const nh = h.phan.length, lap = [...dem.values()];
    if (nh === 2) t *= 3;
    if (nh === 3) {
      if ([...dem.keys()].some((c) => SO_GOC[c] > 1)) return null;
      t = lap.length === 1 ? 3 : lap.length === 2 ? 6 : 10;
    }
  }
  return h.tich === t ? null : `dòng ${h.phan.join("–")}: phải ra ${t}`;
}
function docDongPhan(x) {
  const hong = (loi) => ({ dp: null, loi });
  if (!laObj(x)) return hong("dongPhan không phải đối tượng");
  const ctpt = s(x.ctpt, 30);
  const nt = laObj(x.nguyenTu) ? x.nguyenTu : {};
  const C = nguyen(nt.C, 1, 120), H = nguyen(nt.H, 0, 250);
  const N = nt.N === void 0 ? 0 : nguyen(nt.N, 0, 6), X = nt.X === void 0 ? 0 : nguyen(nt.X, 0, 6), O = nt.O === void 0 ? 0 : nguyen(nt.O, 0, 12);
  if (!ctpt || C === null || H === null || N === null || X === null || O === null) return hong("thiếu công thức phân tử / số nguyên tử");
  const nguyenTu = { C, H, ...N ? { N } : {}, ...X ? { X } : {}, ...O ? { O } : {} };
  const K = tinhK(nguyenTu);
  if (!Number.isInteger(K) || K < 0) return hong(`K = ${K} không phải số nguyên không âm — kiểm lại công thức`);
  if (Number(x.K) !== K) return hong(`K = (2·${C} + 2${N ? ` + ${N}` : ""} − ${H}${X ? ` − ${X}` : ""}) / 2 = ${K} chứ không phải ${s(x.K, 6)}`);
  const hoi = x.hoi === "dong-phan" ? "dong-phan" : x.hoi === "cau-tao" ? "cau-tao" : null;
  if (!hoi) return hong("thiếu hoi: cau-tao (chỉ đếm cấu tạo) | dong-phan (tính cả hình học)");
  const mach = [];
  let tongMach = 0, tongHH = 0;
  const khungDa = /* @__PURE__ */ new Map();
  for (const [i, mt] of mang(x.mach).entries()) {
    if (!laObj(mt)) return hong(`mạch ${i + 1} hỏng`);
    const so = s(mt.so, 20).replace(/\s/g, "");
    const k = laObj(mt.khung) ? mt.khung : {};
    const khung = { chinh: Number(k.chinh), nhanh: mang(k.nhanh).map((n) => laObj(n) ? { o: Number(n.o), dai: Number(n.dai) } : { o: 0, dai: 0 }) };
    const dat = mang(mt.dat).map((d) => laObj(d) && DAT_DP.includes(String(d.loai)) ? { loai: d.loai, nhan: s(d.nhan, 12) || (d.loai === "doi" ? "C=C" : d.loai === "ba" ? "C≡C" : d.loai === "xeton" ? "CO" : "") } : null);
    if (!dat.length || dat.length > 2 || dat.some((d) => !d || !d.nhan)) return hong(`mạch ${so || i + 1}: dat phải có 1–2 thứ cắm (nhom/oh/doi/ba/xeton/chen + nhan)`);
    const chon = mt.chon === void 0 ? void 0 : mang(mt.chon).map(Number).filter((v) => Number.isInteger(v) && v > 0);
    const m = { so, khung, dat, ...chon && chon.length ? { chon } : {}, ...s(mt.loc, 140) ? { loc: s(mt.loc, 140) } : {}, soChat: Number(mt.soChat) };
    const kd = dungKhung(khung);
    if (!kd) return hong(`mạch ${so || i + 1}: khung hỏng (chinh 1–12, nhánh o trong mạch chính, C ≤ 4 liên kết)`);
    const phan = so.split("+").map(Number);
    const nhanhDai = kd.nhanh.map((n) => n.nguyenTu.length).sort((a, b) => b - a);
    if (phan.some((v) => !Number.isInteger(v) || v < 1) || phan[0] !== kd.chinh || phan.slice(1).sort((a, b) => b - a).join("+") !== nhanhDai.join("+")) return hong(`mạch ${so}: phép tính phải là ${[kd.chinh, ...nhanhDai].join("+")}`);
    if (machDaiNhat(kd.cha) !== kd.chinh) return hong(`mạch ${so}: nhánh dài bằng hoặc hơn phần mạch chính còn lại — mạch chính chưa phải mạch dài nhất`);
    const kq = lietKeMach(m);
    if (!kq) return hong(`mạch ${so}: quá nhiều tổ hợp hoặc thứ cắm hỏng`);
    if (m.chon && m.chon.some((c) => kq.toHop[c - 1]?.ket === "thua" || !kq.toHop[c - 1])) return hong(`mạch ${so}: chon có tổ hợp thừa hoá trị / không có`);
    if (m.soChat !== kq.soChat) return hong(`mạch ${so}: đếm lại được ${kq.soChat} chất chứ không phải ${s(mt.soChat, 6)}`);
    const kyDat = m.dat.map((d) => `${d.loai}:${d.nhan}`).join("|");
    const dc = dangChuanKhung(kd.cha) + "#" + kyDat + "#" + (m.loc ?? "");
    if (khungDa.has(dc)) return hong(`mạch ${so}: trùng khung với mạch ${khungDa.get(dc)}`);
    khungDa.set(dc, so);
    mach.push(m);
    tongMach += kq.soChat;
    tongHH += kq.hinhHoc;
  }
  if (mach.length > 12) return hong("quá 12 khung");
  const nhom = /* @__PURE__ */ new Map();
  const khungCoDinh = s(x.khungCoDinh, 140);
  for (const m of mach) {
    if (m.chon || khungCoDinh) continue;
    const kd = dungKhung(m.khung);
    const ky = `${kd.cha.length}#${m.dat.map((d) => `${d.loai}:${d.nhan}`).join("|")}`;
    nhom.set(ky, [...nhom.get(ky) ?? [], m]);
  }
  for (const [ky, ds] of nhom) {
    const n = Number(ky.split("#")[0]);
    const co = new Set(ds.map((m) => dangChuanKhung(dungKhung(m.khung).cha)));
    for (const cha of moiKhung(n)) {
      if (co.has(dangChuanKhung(cha))) continue;
      const thu = khungTuCha(cha);
      const kq = thu && lietKeMach({ khung: thu, dat: ds[0].dat });
      if (kq && kq.soChat > 0) return hong(`quên mạch ${[thu.chinh, ...thu.nhanh.map((h) => h.dai).sort((a, b) => b - a)].join("+")} (còn ${kq.soChat} chất)`);
    }
  }
  let bang, tongBang = 0;
  if (x.bang !== void 0 && x.bang !== null) {
    const b = laObj(x.bang) ? x.bang : {};
    const loai = ["este", "amin", "aren", "khac"].find((l) => l === b.loai);
    const hang = mang(b.hang).map((h) => laObj(h) ? { phan: mang(h.phan).map(Number), soCach: mang(h.soCach).map(Number), tich: Number(h.tich), ...s(h.ghi, 100) ? { ghi: s(h.ghi, 100) } : {} } : null);
    const cot = mang(b.cot).map((c) => s(c, 40)).filter(Boolean).slice(0, 4);
    if (!loai || !hang.length || hang.length > 10 || hang.some((h) => !h || !h.soCach.length || h.soCach.some((v) => !Number.isInteger(v) || v < 0) || h.phan.some((v) => !Number.isInteger(v) || v < 0) || !Number.isInteger(h.tich))) return hong("bảng phần cố định hỏng (loai este/amin/aren/khac, mỗi dòng phan + soCach + tich)");
    for (const h of hang) {
      const l = kiemHang(loai, h);
      if (l) return hong(`bảng: ${l}`);
    }
    bang = { loai, tieuDe: s(b.tieuDe, 80) || "Phần cố định, chia C còn lại", cot, hang };
    tongBang = hang.reduce((a, h) => a + h.tich, 0);
  }
  if (!mach.length && !bang) return hong("cần ít nhất một mạch đại số hoặc một bảng phần cố định");
  const tong = tongMach + tongBang + (hoi === "dong-phan" ? tongHH : 0);
  if (Number(x.tong) !== tong) return hong(`cộng lại được ${tong}${hoi === "dong-phan" && tongHH ? ` (có ${tongHH} hình học)` : ""} chứ không phải ${s(x.tong, 6)}`);
  return { dp: { ctpt, nguyenTu, K, ...s(x.tachK, 160) ? { tachK: s(x.tachK, 160) } : {}, hoi, ...khungCoDinh ? { khungCoDinh } : {}, ...mach.length ? { mach } : {}, ...bang ? { bang } : {}, tong }, loi: null };
}
function khungTuCha(cha) {
  const ke = keCua(cha), n = cha.length;
  const bfs = (g) => {
    const d2 = new Array(n).fill(-1), tr2 = new Array(n).fill(-1);
    d2[g] = 0;
    const q = [g];
    for (let i = 0; i < q.length; i++) for (const v of ke[q[i]]) if (d2[v] < 0) {
      d2[v] = d2[q[i]] + 1;
      tr2[v] = q[i];
      q.push(v);
    }
    return { d: d2, tr: tr2 };
  };
  const a = bfs(0).d.reduce((m, x, i, d2) => x > d2[m] ? i : m, 0);
  const { d, tr } = bfs(a);
  const b = d.reduce((m, x, i) => x > d[m] ? i : m, 0);
  const duong = [];
  for (let u = b; u >= 0; u = tr[u]) duong.push(u);
  const trong = new Set(duong);
  const nhanh = [];
  for (const [i, u] of duong.entries()) for (const v of ke[u]) {
    if (trong.has(v)) continue;
    let dai = 1, truoc = u, cur = v;
    for (; ; ) {
      const tiep = ke[cur].filter((w) => w !== truoc);
      if (tiep.length > 1) return null;
      if (!tiep.length) break;
      truoc = cur;
      cur = tiep[0];
      dai++;
    }
    nhanh.push({ o: i + 1, dai });
  }
  return { chinh: duong.length, nhanh };
}
function banTinDongPhan(x) {
  const dong = [];
  const o = laObj(x) ? x : {};
  for (const mt of mang(o.mach)) {
    if (!laObj(mt)) continue;
    const k2 = laObj(mt.khung) ? mt.khung : {};
    const m = { khung: { chinh: Number(k2.chinh), nhanh: mang(k2.nhanh).map((n) => laObj(n) ? { o: Number(n.o), dai: Number(n.dai) } : { o: 0, dai: 0 }) }, dat: mang(mt.dat).filter(laObj).map((d) => ({ loai: d.loai, nhan: s(d.nhan, 12) || "X" })), chon: mt.chon === void 0 ? void 0 : mang(mt.chon).map(Number) };
    const kq = lietKeMach(m);
    dong.push(`MẠCH ${s(mt.so, 20)} (khai ${s(mt.soChat, 6)} chất):`);
    if (!kq) {
      dong.push("  khung / thứ cắm hỏng");
      continue;
    }
    for (const t of kq.toHop) {
      const vt = t.viTri.map((v) => v.loai === "c" ? kq.kd.ten[v.a] : `${kq.kd.ten[v.a]}–${kq.kd.ten[v.b]}`).join(" + ");
      dong.push(`  #${t.so} ${vt}: ${t.ket === "moi" ? `CHẤT ${t.chat} ${t.gon}${t.hinhHoc ? ` (hình học +${t.hinhHoc})` : ""}` : t.ket === "trung" ? `trùng #${t.trungVoi} (${t.gon})` : t.ket === "loai" ? `loại theo điều kiện (${t.gon})` : `thừa: ${t.ly}`}`);
    }
    dong.push(`  ⇒ ${kq.soChat} chất${kq.hinhHoc ? `, ${kq.hinhHoc} nối đôi có hình học` : ""}`);
  }
  const k = docDongPhan(x);
  dong.push(k.loi ? `LỖI: ${k.loi}` : `ĐẠT: tổng ${k.dp.tong}`);
  return dong.join("\n");
}

// src/lib/loi-giai-kinh/kiem.ts
var laObj2 = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
var s2 = (v, tran = 600) => typeof v === "string" || typeof v === "number" ? String(v).normalize("NFC").replace(/\s+/g, " ").trim().slice(0, tran) : "";
var mang2 = (v) => Array.isArray(v) ? v : [];
var SGK = { axit: "acid", "bazơ": "base", oxit: "oxide", este: "ester", ancol: "alcohol", amin: "amine", "anđehit": "aldehyde", "andehit": "aldehyde", xeton: "ketone", lipit: "lipid", polyme: "polymer" };
var RE_SGK = new RegExp(`(^|[^\\p{L}])(${Object.keys(SGK).join("|")})(?=[^\\p{L}]|$)`, "giu");
var chuSgk = (t) => t.replace(RE_SGK, (_m, a, w) => a + (w[0] === w[0].toUpperCase() ? SGK[w.toLowerCase()].replace(/^./, (c) => c.toUpperCase()) : SGK[w.toLowerCase()]));
var chuanDoiChieu = (t) => chuSgk(t.normalize("NFC")).toLowerCase().replace(/[«»"“”'‘’]/g, "").replace(/[.!?…\s]+$/u, "").replace(/\s+/g, " ").trim();
var RE_CAM = [
  [/[«»]/u, "có dấu «» (thầy: bỏ, in đậm thay)"],
  [/tiền(?! chất)|giàu|nghèo|thuế|nhà (?:thằng|bạn|giàu|nghèo)/iu, "dùng ẩn dụ tiền / nhà (thầy đã bỏ)"],
  // Thầy 08/11 (skill đồng phân): «Bước 1 các em tính K» — K HOA (số π + số vòng) được dùng; vẫn cấm tên gọi «độ bất bão hoà» và k thường.
  [/bất bão hoà|bất bão hòa|độ không no/iu, "dùng tên độ bất bão hoà (ngoài SGK Kết nối tri thức) — gọi là K"],
  [/(^|[^\p{L}\p{N}])k\s*=\s*\d/u, "dùng k thường — thầy viết K hoa"],
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
  if (!laObj2(x)) return null;
  const chu = s2(x.chu, 200);
  if (!chu) return null;
  const hinh = s2(x.hinh, 20);
  return { chu, ...s2(x.phu, 200) ? { phu: s2(x.phu, 200) } : {}, ...HINH_NHIP.includes(hinh) ? { hinh } : {} };
}
function docCanh(x) {
  if (!laObj2(x)) return null;
  if (x.loai === "can-bang") {
    const tac = mang2(x.tacDong).map((t) => laObj2(t) && ["thuan", "nghich", "khong"].includes(String(t.chieu)) && s2(t.nut, 40) && s2(t.chu, 200) ? { nut: s2(t.nut, 40), chieu: t.chieu, chu: s2(t.chu, 200) } : null);
    if (!s2(x.trai, 80) || !s2(x.phai, 80) || !tac.length || tac.length > 4 || tac.some((t) => !t)) return null;
    return { loai: "can-bang", trai: s2(x.trai, 80), phai: s2(x.phai, 80), ...s2(x.nhanTrai, 30) ? { nhanTrai: s2(x.nhanTrai, 30) } : {}, ...s2(x.nhanPhai, 30) ? { nhanPhai: s2(x.nhanPhai, 30) } : {}, tacDong: tac };
  }
  if (x.loai === "ong-nghiem") {
    const buoc = mang2(x.buoc).map((b) => {
      if (!laObj2(b) || !s2(b.chu, 200)) return null;
      const lop = mang2(b.lop).map((l) => laObj2(l) && MAU_LOP.includes(String(l.mau)) ? { mau: l.mau, nhan: s2(l.nhan, 30) } : null);
      if (!lop.length || lop.length > 2 || lop.some((l) => !l)) return null;
      return { chu: s2(b.chu, 200), lop, ...b.dun === true ? { dun: true } : {}, ...b.khi === true ? { khi: true } : {}, ...b.ketTua === true ? { ketTua: true } : {} };
    });
    if (buoc.length < 2 || buoc.length > 5 || buoc.some((b) => !b)) return null;
    return { loai: "ong-nghiem", buoc };
  }
  if (x.loai === "so-sanh") {
    const ve = (v) => laObj2(v) && s2(v.ten, 60) ? { ten: s2(v.ten, 60), y: mang2(v.y).map((y) => s2(y, 120)).filter(Boolean).slice(0, 4) } : null;
    const t = ve(x.trai), p = ve(x.phai);
    if (!t || !p || !t.y.length || !p.y.length) return null;
    return { loai: "so-sanh", trai: t, phai: p };
  }
  if (x.loai === "dien-di") {
    const pH = Number(x.pH);
    const chat = mang2(x.chat).map((c) => {
      if (!laObj2(c) || !s2(c.ten, 24)) return null;
      const nhom = mang2(c.nhom).map((g) => laObj2(g) && s2(g.ten, 16) && Number.isInteger(g.dien) && Math.abs(Number(g.dien)) <= 2 ? { ten: s2(g.ten, 16), dien: Number(g.dien) } : null);
      if (!nhom.length || nhom.length > 4 || nhom.some((g) => !g)) return null;
      const pI = Number(c.pI);
      return { ten: s2(c.ten, 24), ...Number.isFinite(pI) && pI > 0 && pI < 14 ? { pI } : {}, nhom };
    });
    if (!Number.isFinite(pH) || pH < 0 || pH > 14 || !chat.length || chat.length > 3 || chat.some((c) => !c)) return null;
    for (const c of chat) {
      const tong = c.nhom.reduce((a, g) => a + g.dien, 0);
      if (c.pI !== void 0 && Math.abs(pH - c.pI) > 0.3 && Math.sign(tong) !== (pH < c.pI ? 1 : -1)) return null;
    }
    return { loai: "dien-di", pH, chat };
  }
  if (x.loai === "do-tan") {
    const Sds = mang2(x.S).map((v) => laObj2(v) && Number.isFinite(Number(v.t)) && Number(v.S) > 0 ? { t: Number(v.t), S: Number(v.S) } : null);
    const hang = mang2(x.hang).map((h) => laObj2(h) && s2(h.nhan, 60) && Number(h.ct) >= 0 && Number(h.nuoc) >= 0 && Number(h.ct) + Number(h.nuoc) > 0 ? { nhan: s2(h.nhan, 60), ct: Number(h.ct), nuoc: Number(h.nuoc), ...Number.isFinite(Number(h.baoHoa)) && h.baoHoa !== void 0 && h.baoHoa !== null ? { baoHoa: Number(h.baoHoa) } : {}, ...h.tachRa === true ? { tachRa: true } : {} } : null);
    if (!s2(x.chat, 30) || !Sds.length || Sds.length > 3 || Sds.some((v) => !v) || !hang.length || hang.length > 4 || hang.some((h) => !h)) return null;
    const gan = (a, b) => Math.abs(a - b) <= Math.max(0.05, 0.01 * Math.abs(b));
    for (const h of hang) if (h.baoHoa !== void 0) {
      const sv = Sds.find((v) => v.t === h.baoHoa);
      if (!sv || !h.nuoc || !gan(h.ct / h.nuoc * 100, sv.S)) return null;
    }
    const tach = hang.findIndex((h) => h.tachRa);
    if (tach > 0 && hang.length === 3) {
      const [a, b, c] = tach === 1 ? [hang[0], hang[1], hang[2]] : [hang[0], hang[2], hang[1]];
      if (!gan(a.ct, b.ct + c.ct) || !gan(a.nuoc, b.nuoc + c.nuoc)) return null;
    }
    return { loai: "do-tan", chat: s2(x.chat, 30), S: Sds, hang };
  }
  if (x.loai === "danh-phap") {
    const soC = Number.isInteger(x.soC) && Number(x.soC) >= 1 && Number(x.soC) <= 12 ? Number(x.soC) : void 0;
    const trongMach = (v, tran) => Number.isInteger(v) && Number(v) >= 1 && Number(v) <= tran;
    const nhom = (g) => laObj2(g) && s2(g.ten, 16) && (!soC || trongMach(g.viTri, soC)) ? { viTri: Number(g.viTri) || 1, ten: s2(g.ten, 16) } : null;
    const chuc = x.chuc === void 0 || x.chuc === null ? void 0 : nhom(x.chuc);
    const nhanh = mang2(x.nhanh).map(nhom);
    const pi = mang2(x.pi).map((q) => laObj2(q) && soC && trongMach(q.viTri, soC - 1) && (q.loai === "doi" || q.loai === "ba") ? { viTri: Number(q.viTri), loai: q.loai } : null);
    const manh = mang2(x.manh).map((m) => laObj2(m) && MANH_TEN.includes(String(m.loai)) && typeof m.chu === "string" && m.chu.trim() && s2(m.giai, 220) ? { loai: m.loai, chu: String(m.chu).slice(0, 40), giai: s2(m.giai, 220) } : null);
    const ten = s2(x.ten, 80);
    const gon = (t) => t.normalize("NFC").toLowerCase().replace(/[\s ]+/g, "");
    if (x.chuc !== void 0 && x.chuc !== null && !chuc) return null;
    if (nhanh.some((g) => !g) || pi.some((q) => !q) || manh.length < 2 || manh.length > 5 || manh.some((m) => !m) || !ten || nhanh.length > 6) return null;
    if (gon(manh.map((m) => m.chu).join("")) !== gon(ten)) return null;
    return { loai: "danh-phap", ...soC ? { soC } : {}, ...chuc ? { chuc } : {}, nhanh, pi, manh, ten };
  }
  return null;
}
function docSoDo(x) {
  if (!laObj2(x)) return void 0;
  const nut = mang2(x.nut).map((n) => laObj2(n) && s2(n.chat, 60) ? { ...s2(n.tong, 60) ? { tong: s2(n.tong, 60) } : {}, chat: s2(n.chat, 60), soLieu: mang2(n.soLieu).map((v) => s2(v, 60)).filter(Boolean).slice(0, 6) } : null);
  if (nut.length < 2 || nut.length > 3 || nut.some((n) => !n)) return void 0;
  const muiTen = mang2(x.muiTen).map((m) => laObj2(m) && Number.isFinite(Number(m.H)) && Number(m.H) > 0 && Number(m.H) <= 100 ? { H: Number(m.H) } : {});
  while (muiTen.length < nut.length - 1) muiTen.push({});
  return { nut, muiTen: muiTen.slice(0, nut.length - 1), chieu: x.chieu === "nguoc" ? "nguoc" : "xuoi" };
}
function docBuoc(x) {
  const b = mang2(x).map((v) => {
    if (!laObj2(v)) return null;
    const thuaSo = mang2(v.thuaSo).map((t) => laObj2(t) && s2(t.so, 30) && s2(t.nghia, 240) ? { so: s2(t.so, 30), nghia: s2(t.nghia, 240), ...s2(t.denDay, 160) ? { denDay: s2(t.denDay, 160) } : {} } : null);
    if (!s2(v.ten, 60) || !thuaSo.length || thuaSo.some((t) => !t)) return null;
    return { ten: s2(v.ten, 60), thuaSo, ...s2(v.ketQua, 40) ? { ketQua: s2(v.ketQua, 40) } : {}, ...s2(v.donVi, 20) ? { donVi: s2(v.donVi, 20) } : {} };
  });
  if (!b.length || b.length > 3 || b.some((x2) => !x2)) return void 0;
  return b;
}
function soTrongPhuongAn(t) {
  const m = /^\s*(\d{1,3})\s*(?:chất|đồng phân|công thức)?\s*\.?\s*$/u.exec(String(t ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " "));
  return m ? Number(m[1]) : null;
}
function docSoViet(raw) {
  const t = raw.replace(/\s+/g, "").replace(/^\+(?=\d)/, "").replace(/[×x·]10\^?\(?(-?\d+)\)?/u, "e$1").replace(/\.(?=\d{3}(?!\d))/g, "").replace(",", ".");
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
  const ds = mang2(x).map((p) => laObj2(p) && s2(p.ten, 60) && s2(p.bieuThuc, 200) && s2(p.ketQua, 40) ? { ten: s2(p.ten, 60), bieuThuc: s2(p.bieuThuc, 200), ketQua: s2(p.ketQua, 40), ...p.laDapSo === true ? { laDapSo: true } : {}, ...s2(p.nghia, 200) ? { nghia: s2(p.nghia, 200) } : {} } : null);
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
  if (!laObj2(tho)) return hong("không phải đối tượng JSON");
  const cl = laObj2(tho.cotLoi) ? tho.cotLoi : {};
  const cotLoi = { chu: s2(cl.chu, 260), ...s2(cl.congThuc, 80) ? { congThuc: s2(cl.congThuc, 80) } : {}, chip: mang2(cl.chip).map((c) => laObj2(c) && s2(c.nhan, 30) && s2(c.chu, 90) ? { nhan: s2(c.nhan, 30), chu: s2(c.chu, 90) } : null).filter((c) => !!c).slice(0, 3) };
  const phim = mang2(tho.phim).map(docNhip).filter((n) => !!n).slice(0, 6);
  const lyDo = mang2(tho.lyDo).map((l) => laObj2(l) && s2(l.khoa, 2) && s2(l.chu, 400) ? { khoa: s2(l.khoa, 2), dung: l.dung === true, chu: s2(l.chu, 400) } : null).filter((l) => !!l);
  const hayNham = mang2(tho.hayNham).map((h) => laObj2(h) && s2(h.nghi, 220) && s2(h.dung, 260) ? { nghi: s2(h.nghi, 220), dung: s2(h.dung, 260) } : null).filter((h) => !!h).slice(0, 3);
  const th = laObj2(tho.tuHoi) ? tho.tuHoi : {};
  const tuHoi = { hoi: s2(th.hoi, 220), tra: s2(th.tra, 400) };
  const theNho = mang2(tho.theNho).map((t) => laObj2(t) && s2(t.truoc, 200) && s2(t.sau, 220) ? { truoc: s2(t.truoc, 200), sau: s2(t.sau, 220), ...s2(t.viSao, 220) ? { viSao: s2(t.viSao, 220) } : {} } : null).filter((t) => !!t).slice(0, 4);
  const tcNguon = new Map(ctx.nguon.thanChu.map((t) => [chuanDoiChieu(t), t]));
  const thanChu = [...new Set(mang2(tho.thanChu).map((t) => tcNguon.get(chuanDoiChieu(s2(t, 160)))).filter((t) => !!t))].slice(0, 3);
  if (mang2(tho.thanChu).length > thanChu.length) boKhoi.push("thần chú không có trong bảng của thầy");
  const noiNguon = new Map(ctx.nguon.thayNoi.map((t) => [chuanDoiChieu(t), t]));
  const thayNoiTho = s2(tho.thayNoi, 300);
  const thayNoiGoc = thayNoiTho ? noiNguon.get(chuanDoiChieu(thayNoiTho)) : void 0;
  const thayNoi = thayNoiGoc ? chuSgk(thayNoiGoc) : void 0;
  if (thayNoiTho && !thayNoi) boKhoi.push("câu thầy nói không có trong mục kiến thức");
  const meoNguon = new Map(ctx.nguon.meo.map((t) => [chuanDoiChieu(t), t]));
  const meoTho = s2(tho.meo, 300);
  const meoGoc = meoTho ? meoNguon.get(chuanDoiChieu(meoTho)) : void 0;
  const meo = meoGoc ? chuSgk(meoGoc) : void 0;
  if (meoTho && !meo) boKhoi.push("mẹo không có trong mục kiến thức");
  const canhTho = tho.canh;
  const canh = canhTho === void 0 || canhTho === null ? null : docCanh(canhTho);
  if (canhTho && !canh) boKhoi.push("cảnh minh hoạ sai khuôn");
  let loiDongPhan = null;
  const dpKq = tho.dongPhan === void 0 || tho.dongPhan === null ? null : docDongPhan(tho.dongPhan);
  if (dpKq?.loi) {
    loiDongPhan = `khối đồng phân: ${dpKq.loi}`;
    boKhoi.push(loiDongPhan);
  }
  const dongPhan = dpKq?.dp ?? null;
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
    ...dongPhan ? { dongPhan } : {},
    thanChu,
    ...thayNoi ? { thayNoi } : {},
    ...meo ? { meo } : {},
    lyDo,
    ...soDo ? { soDo } : {},
    ...buoc ? { buoc } : {},
    ...phepTinh ? { phepTinh } : {},
    ...s2(tho.ketQua, 40) ? { ketQua: s2(tho.ketQua, 40) } : {},
    ...s2(tho.kiemLai, 260) ? { kiemLai: s2(tho.kiemLai, 260) } : {},
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
  if (ctx.phan === "III" && !ctx.tuLuan && !buoc && !phepTinh) thieu.push("phép tính có nghĩa từng số");
  if (ctx.tuLuan) {
    delete ban.buoc;
    delete ban.soDo;
    ban.lyDo = [];
    ban.tuLuan = true;
  }
  const cam = chuCam(ban);
  if (cam) return { ket: "thieu", lyDo: cam, ban, boKhoi };
  if (thieu.length) return { ket: "thieu", lyDo: `thiếu: ${thieu.join(", ")}`, ban, boKhoi };
  if (ctx.chatDongPhan && loiDongPhan) return { ket: "lech", lyDo: loiDongPhan, ban, boKhoi };
  if (dongPhan && ctx.chatDongPhan && !ctx.tuLuan) {
    const dapSo = ctx.phan === "III" ? docSoViet(ctx.dapAn) : ctx.phan === "I" && ctx.luaChon ? soTrongPhuongAn(ctx.luaChon[ctx.dapAn.trim().toUpperCase()]) : null;
    if (dapSo !== null && dapSo !== dongPhan.tong) return { ket: "lech", lyDo: `khối đồng phân: tổng ${dongPhan.tong} khác đáp án kho ${dapSo}`, ban, boKhoi };
  }
  const theoKho = dungTheoKho(ctx.phan, ctx.dapAn);
  if (ctx.tuLuan) {
    if (phepTinh) {
      const loi = kiemPhepTinh(phepTinh, ctx.dapAn && phepTinh.some((p) => p.laDapSo) ? "III" : "I", ctx.dapAn);
      if (loi) return { ket: "lech", lyDo: loi, ban, boKhoi };
    }
    return { ket: "dat", lyDo: "", ban, boKhoi };
  }
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
  if (!laObj2(x) || typeof x.qid !== "string") return null;
  const k = kiemBanKinh(x, { phan, dapAn, qid: x.qid, nguon: { thanChu: mang2(x.thanChu).map((t) => s2(t, 160)), thayNoi: x.thayNoi ? [s2(x.thayNoi, 300)] : [], meo: x.meo ? [s2(x.meo, 300)] : [] } });
  return k.ket === "dat" ? k.ban : null;
}
var soKhop = (t) => String(t ?? "").replace(/<[^>]*>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").normalize("NFC").toLowerCase().replace(/[\s ]+/g, "").replace(/[.。]+$/, "");
var soLong = (t) => soKhop(t).replace(/\.{2,}|…/g, "").replace(/[^\p{L}\p{N}+\-−]/gu, "");
function xepTheoCauPhat(tho, q) {
  if (!laObj2(tho)) return null;
  const { _goc, ...ban } = tho;
  const b = ban;
  if (!Array.isArray(b.lyDo)) return null;
  if (q.phan === "III" || b.tuLuan) {
    if (!b.tuLuan && b.ketQua && !khopLamTron(docSoViet(b.ketQua) ?? NaN, q.correct)) return null;
    return b;
  }
  const khoa = q.phan === "I" ? KHOA_I : KHOA_II;
  const hien = (q.phan === "I" ? q.choices : q.ideas) ?? [];
  const goc = (q.phan === "I" ? _goc?.pa : _goc?.y) ?? null;
  const theoGoc = new Map(b.lyDo.map((l) => [l.khoa, l]));
  let lyDo;
  let anLyDo = false;
  if (goc && hien.length === 4) {
    const ghepTheo = (f) => {
      const ds = Object.entries(goc).map(([k, v]) => [f(v), k]);
      if (new Set(ds.map(([t]) => t)).size !== ds.length) return null;
      const m = new Map(ds), g = hien.map((t) => m.get(f(t)));
      return g.some((k) => !k) || new Set(g).size !== 4 ? null : g;
    };
    const ghep = ghepTheo(soKhop) ?? ghepTheo(soLong);
    if (ghep) lyDo = ghep.map((k, i) => ({ ...theoGoc.get(k), khoa: khoa[i] }));
    else {
      const gocTheoThuTu = khoa.map((k) => soLong(goc[k]));
      if (hien.some((t, i) => soLong(t) !== gocTheoThuTu[i])) return null;
      lyDo = khoa.map((k) => theoGoc.get(k)).filter(Boolean);
      anLyDo = true;
    }
  } else lyDo = khoa.map((k) => theoGoc.get(k)).filter(Boolean);
  if (lyDo.length !== 4) return null;
  const d = dungTheoKho(q.phan, q.correct);
  if (!d || lyDo.some((l) => l.dung !== d.get(l.khoa))) return null;
  return { ...b, lyDo: anLyDo ? [] : lyDo };
}

// src/lib/cham-so.ts
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

// server/src/so-do-cong.ts
var SO_BUOC_TOI_DA = 3;
var str = (v) => v == null ? "" : String(v);
var CO_MU = /(?:[×x*·]\s*10|\.\s*10\s*\^|\^|[eE][+-]?\d|[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺])/;
function docSo(raw) {
  const s3 = str(raw).trim();
  const d = docSoPhanIII(s3);
  if (!d) return null;
  const v = Number(d.so);
  if (!Number.isFinite(v)) return null;
  let donViCuoi;
  if (CO_MU.test(s3)) {
    const m = /^[+\-−]?\s*(\d+(?:[.,]\d+)?)/.exec(s3);
    const chuSo = (m?.[1] ?? "").replace(/[.,]/g, "").replace(/^0+/, "");
    const coNghia = Math.max(1, chuSo.length);
    donViCuoi = v === 0 ? 1 : Math.pow(10, Math.floor(Math.log10(Math.abs(v))) - coNghia + 1);
    if (/^[+\-−]?\s*10\s*(?:\^|[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺])/.test(s3)) donViCuoi = Math.abs(v) * 1e-9;
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
  const s3 = chuanBieuThuc(goc).replace(/^\*\s*/, "");
  const tenDai = [...ten.keys()].filter(Boolean).sort((a, b) => b.length - a.length);
  let i = 0;
  const trang = () => {
    while (s3[i] === " ") i++;
  };
  const xem = () => {
    trang();
    return s3[i] ?? "";
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
    for (const t of tenDai) if (s3.startsWith(t, i)) {
      i += t.length;
      return ten.get(t);
    }
    const m = /^\d{1,3}(?: \d{3})+(?:,\d+)?(?![\d.])|^\d+(?:[.,]\d+)?/.exec(s3.slice(i));
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
  function tich2() {
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
    let v = tich2();
    for (; ; ) {
      const c = xem();
      if (c === "+") {
        i++;
        v += tich2();
      } else if (c === "-") {
        i++;
        v -= tich2();
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
    let tich2 = 1;
    for (const [j, t] of ds.entries()) {
      const v = giaTriThuaSo(str(t?.so), ten);
      if (v === null) return { ok: false, lyDo: `Bước ${i + 1}: thừa số «${str(t?.so).slice(0, 40)}» không đọc được.` };
      const ve = str(t?.so).trim();
      if (!ten.has(ve) && docSoPhanIII(ve)) nguyenVan.push(v);
      tich2 *= v;
      if (j >= 1) tienTo.push(tich2);
    }
    if (!Number.isFinite(tich2)) return { ok: false, lyDo: `Bước ${i + 1} ra số không hữu hạn.` };
    giaTriBuoc.push(tich2);
    const tenBuoc = str(b?.ten).trim();
    if (tenBuoc) ten.set(tenBuoc, tich2);
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
    const x = so.find((s3) => trungDich(s3, d.t));
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
  const doc = Object.fromEntries(Object.entries(cau.luaChon ?? {}).map(([k, s3]) => [k.toUpperCase(), docSo(s3)]));
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

// server/src/kinh-than-chu.ts
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
  banTinDongPhan,
  chuCam,
  chuSgk,
  chuanDoiChieu,
  docSoViet,
  khopLamTron,
  kiemBanKinh,
  kiemCong,
  kiemPhepTinh,
  xepTheoCauPhat
};

//#region server/src/do-tai.ts
var e = "DOTAI";
//#endregion
//#region server/src/luat-vao-thi.ts
function t(e) {
	let t = new Date(String(e ?? "")).getTime();
	return Number.isFinite(t) ? t : NaN;
}
function n(e, n, r, i) {
	if (!e) return {
		ok: !1,
		lyDo: "khong_co_ca"
	};
	if (e.trang_thai === "da_xoa") return {
		ok: !1,
		lyDo: "da_xoa"
	};
	if (e.trang_thai === "dong") return {
		ok: !1,
		lyDo: "da_dong"
	};
	let a = t(e.bat_dau);
	if (Number.isFinite(a) && i < a) return {
		ok: !1,
		lyDo: "chua_mo"
	};
	if (n) {
		if (n.trang_thai === "da_nop" || n.trang_thai === "khoa") return {
			ok: !1,
			lyDo: "da_nop",
			lanThu: n.lan_thu
		};
		if (n.trang_thai === "dang_lam") return n.id_thiet_bi && n.id_thiet_bi !== r ? {
			ok: !1,
			lyDo: "dang_lam_may_khac",
			lanThu: n.lan_thu
		} : {
			ok: !0,
			cach: "khoi_phuc",
			lanThu: n.lan_thu
		};
	}
	let o = t(e.het_han_vao);
	return Number.isFinite(o) && i > o ? {
		ok: !1,
		lyDo: "het_han_vao"
	} : {
		ok: !0,
		cach: "moi",
		lanThu: (n?.lan_thu ?? 0) + 1
	};
}
function r(e, t) {
	if (e.loai === "baitap") return e.han_nop || "";
	let n = Number(e.thoi_gian_phut) || 45;
	return new Date(t + n * 6e4).toISOString();
}
function i(e, t, n) {
	return `${e}|${t}|${n}`;
}
//#endregion
//#region server/src/index.ts
var a = {
	"access-control-allow-origin": "*",
	"access-control-allow-methods": "GET, POST, OPTIONS",
	"access-control-allow-headers": "content-type, x-ma-bi-mat",
	"access-control-max-age": "86400"
}, o = {
	"content-type": "application/json;charset=utf-8",
	...a
};
function s(e, t = 200) {
	return new Response(JSON.stringify({
		...e,
		serverNow: Date.now()
	}), {
		status: t,
		headers: o
	});
}
function c(e, t, n) {
	let r = String(n.secret ?? e.headers.get("x-ma-bi-mat") ?? "").trim();
	return r.length > 0 && r === String(t.MA_BI_MAT ?? "").trim();
}
async function l(e, t) {
	return await e.DB.prepare("SELECT * FROM ca WHERE ma_ca = ?").bind(t).first();
}
async function u(e, t, n) {
	return await e.DB.prepare("SELECT * FROM luot WHERE ma_ca = ? AND sbd = ? ORDER BY lan_thu DESC LIMIT 1").bind(t, n).first();
}
function d(e) {
	let t = String(e.khoaLuot ?? "").trim();
	if (t) return {
		sql: "khoa = ?",
		tham: [t]
	};
	let n = String(e.maCa ?? "").trim(), r = String(e.sbd ?? "").trim();
	return !n || !r ? null : {
		sql: "ma_ca = ? AND sbd = ? AND lan_thu = (SELECT MAX(lan_thu) FROM luot WHERE ma_ca = ? AND sbd = ?)",
		tham: [
			n,
			r,
			n,
			r
		]
	};
}
async function f(e, t) {
	let a = String(t.maCa ?? "").trim(), o = String(t.sbd ?? "").trim(), c = String(t.idThietBi ?? "").trim();
	if (!a || !o) return s({
		ok: !1,
		lyDo: "thieu",
		error: "Thiếu mã ca hoặc số báo danh"
	});
	let d = await l(e, a);
	if (d && await D(e) && !await E(e, o)) return s({
		ok: !1,
		lyDo: "khong_co_sbd",
		thoiGianPhut: d.thoi_gian_phut ?? 45
	});
	let f = await u(e, a, o), p = Date.now(), m = n(d, f, c, p);
	if (!m.ok || !d) return s({
		ok: !1,
		lyDo: m.lyDo,
		lanThu: m.lanThu,
		thoiGianPhut: d?.thoi_gian_phut ?? 45
	});
	if (Number(d.phong_cho ?? 0) === 1 && !d.bat_dau_thi_luc && !f) return await e.DB.prepare("INSERT INTO phong_cho (khoa, ma_ca, sbd, ho_ten, ghi_luc) VALUES (?,?,?,?,?)\n       ON CONFLICT(khoa) DO UPDATE SET ho_ten=excluded.ho_ten, ghi_luc=excluded.ghi_luc").bind(`${a}|${o}`, a, o, String(t.hoTen ?? ""), new Date(p).toISOString()).run(), s({
		ok: !0,
		cach: "cho",
		lop: d.lop ?? "",
		thoiGianPhut: d.thoi_gian_phut ?? 45,
		tenCa: d.ten_ca ?? "",
		congBo: d.cong_bo ?? "khong"
	});
	let h = m.lanThu ?? 1, g = i(a, o, h), _ = m.cach === "khoi_phuc" && f ? f.vao_luc : new Date(p).toISOString(), v = m.cach === "khoi_phuc" && f ? f.het_gio_luc || "" : r(d, p);
	return await e.DB.prepare("INSERT INTO luot (khoa, ma_ca, sbd, lan_thu, id_thiet_bi, vao_luc, het_gio_luc, trang_thai, cap_nhat_luc)\n     VALUES (?, ?, ?, ?, ?, ?, ?, 'dang_lam', ?)\n     ON CONFLICT(khoa) DO UPDATE SET id_thiet_bi = excluded.id_thiet_bi, cap_nhat_luc = excluded.cap_nhat_luc").bind(g, a, o, h, c, _, v, new Date(p).toISOString()).run(), s({
		ok: !0,
		cach: m.cach,
		khoaLuot: g,
		lanThu: h,
		vaoLuc: _,
		hetGioLuc: v,
		thoiGianPhut: d.thoi_gian_phut ?? 45,
		congBo: d.cong_bo ?? "khong",
		loai: d.loai === "baitap" ? "baitap" : "thi",
		hanNop: d.han_nop ?? "",
		tenCa: d.ten_ca ?? "",
		nguongLan: d.nguong_lan ?? 3,
		nguongGiay: d.nguong_giay ?? 10,
		lop: d.lop ?? "",
		giuDeDoc: Number(d.giu_de_doc ?? 0) === 1,
		anHanGiay: Number(d.an_han_giay ?? 0),
		soCau: d.so_cau_json ? JSON.parse(d.so_cau_json) : void 0,
		boTheoEm: d.bo_theo_em_json ? JSON.parse(d.bo_theo_em_json) : void 0,
		deUrl: d.bank_r2 ? `/de/${encodeURIComponent(a)}` : null
	});
}
async function p(e, t) {
	let n = d(t);
	return n ? (await e.DB.prepare(`UPDATE luot SET dap_an_json = ?, giay_cau_json = ?, cap_nhat_luc = ?
     WHERE ${n.sql} AND trang_thai = 'dang_lam'`).bind(JSON.stringify(t.dapAn ?? {}), t.giayCau ? JSON.stringify(t.giayCau) : null, (/* @__PURE__ */ new Date()).toISOString(), ...n.tham).run()).meta.changes === 0 ? s({
		ok: !1,
		lyDo: "khong_dang_lam"
	}) : s({ ok: !0 }) : s({
		ok: !1,
		lyDo: "thieu"
	});
}
async function m(e, t) {
	let n = d(t);
	if (!n) return s({
		ok: !1,
		lyDo: "thieu"
	});
	let r = t.integrity ?? {}, i = (/* @__PURE__ */ new Date()).toISOString(), a = r.blocked ? "khoa" : "da_nop";
	if ((await e.DB.prepare(`UPDATE luot SET nop_luc = ?, trang_thai = ?, dap_an_json = ?, giay_cau_json = ?,
            integrity_json = ?, so_lan_roi_man = ?, tong_giay_roi_man = ?, cap_nhat_luc = ?, da_day_sheet = 0
     WHERE ${n.sql} AND trang_thai = 'dang_lam'`).bind(i, a, JSON.stringify(t.dapAn ?? {}), t.giayCau ? JSON.stringify(t.giayCau) : null, JSON.stringify(r), Number(r.leaveCount ?? 0), Math.round(Number(r.totalHiddenMs ?? 0) / 1e3), i, ...n.tham).run()).meta.changes === 0) {
		let t = await e.DB.prepare(`SELECT trang_thai, nop_luc FROM luot WHERE ${n.sql}`).bind(...n.tham).first();
		return t && (t.trang_thai === "da_nop" || t.trang_thai === "khoa") ? s({
			ok: !0,
			daNhan: !0,
			nopLuc: t.nop_luc
		}) : s({
			ok: !1,
			lyDo: "khong_tim_thay"
		});
	}
	return s({
		ok: !0,
		nopLuc: i
	});
}
async function h(e, t) {
	let n = String(t.sbd ?? "").trim();
	if (!n) return s({
		ok: !1,
		lyDo: "thieu"
	});
	let r = (/* @__PURE__ */ new Date()).toISOString();
	return await e.DB.prepare("INSERT INTO trang_thai (sbd, ma_ca, lop, dang_lam, bat_dau_luc, da_lam_cau_hoi,\n                             tong_cau_hoi, so_lan_roi_app, blocked, cap_nhat_luc, da_day_sheet)\n     VALUES (?,?,?,?,?,?,?,?,?,?,0)\n     ON CONFLICT(sbd) DO UPDATE SET\n       ma_ca=excluded.ma_ca, lop=excluded.lop, dang_lam=excluded.dang_lam,\n       bat_dau_luc=excluded.bat_dau_luc, da_lam_cau_hoi=excluded.da_lam_cau_hoi,\n       tong_cau_hoi=excluded.tong_cau_hoi, so_lan_roi_app=excluded.so_lan_roi_app,\n       blocked=excluded.blocked, cap_nhat_luc=excluded.cap_nhat_luc, da_day_sheet=0").bind(n, String(t.maCa ?? ""), String(t.lop ?? ""), +!!t.dangLam, String(t.batDauLuc ?? r), Number(t.daLamCauHoi ?? 0), Number(t.tongCauHoi ?? 0), Number(t.soLanRoiApp ?? 0), +!!t.blocked, r).run(), s({ ok: !0 });
}
async function g(e, t) {
	if (!t) return s({
		ok: !1,
		lyDo: "thieu"
	});
	let n = await e.DB.prepare("SELECT * FROM trang_thai WHERE sbd = ?").bind(t).first();
	return s({
		ok: !0,
		found: !!n,
		trangThai: n ?? null
	});
}
async function _(e, t) {
	let n = await l(e, t);
	return s(n ? {
		ok: !0,
		phongCho: Number(n.phong_cho ?? 0) === 1,
		batDau: !!n.bat_dau_thi_luc,
		batDauLuc: n.bat_dau_thi_luc ?? "",
		trangThai: n.trang_thai
	} : {
		ok: !1,
		error: "Không tìm thấy ca kiểm tra"
	});
}
async function v(e, t) {
	let n = String(t.maCa ?? "").trim(), r = String(t.sbd ?? "").trim();
	return !n || !r ? s({
		ok: !1,
		lyDo: "thieu"
	}) : (await e.DB.prepare("INSERT INTO phong_cho (khoa, ma_ca, sbd, ho_ten, ghi_luc) VALUES (?,?,?,?,?)\n     ON CONFLICT(khoa) DO UPDATE SET ho_ten=excluded.ho_ten, ghi_luc=excluded.ghi_luc").bind(`${n}|${r}`, n, r, String(t.hoTen ?? ""), (/* @__PURE__ */ new Date()).toISOString()).run(), s({ ok: !0 }));
}
async function y(e, t) {
	let n = await l(e, t);
	if (!n?.bank_r2) return s({
		ok: !1,
		lyDo: "chua_co_de"
	}, 404);
	if (!e.DE) return s({
		ok: !1,
		lyDo: "chua_noi_r2"
	}, 500);
	let r = await e.DE.get(n.bank_r2);
	return r ? new Response(r.body, { headers: {
		...o,
		"cache-control": "public, max-age=86400",
		etag: r.httpEtag
	} }) : s({
		ok: !1,
		lyDo: "mat_goi_de"
	}, 404);
}
async function b(e, t) {
	let n = t.ca, r = String(n?.maCa ?? "").trim();
	if (!r) return s({
		ok: !1,
		error: "Thiếu mã ca"
	});
	let i = null;
	if (t.bank) {
		if (!e.DE) return s({
			ok: !1,
			error: "Chưa nối R2 — chưa đẩy gói đề được"
		}, 500);
		i = `de/${r}.json`, await e.DE.put(i, JSON.stringify(t.bank));
	}
	return await e.DB.prepare("INSERT INTO ca (ma_ca, ten_ca, trang_thai, bat_dau, het_han_vao, thoi_gian_phut, loai, han_nop,\n                     cong_bo, nguong_lan, nguong_giay, bank_r2, so_cau_json, bo_theo_em_json, cap_nhat_luc,\n                     lop, phong_cho, bat_dau_thi_luc, giu_de_doc, an_han_giay)\n     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)\n     ON CONFLICT(ma_ca) DO UPDATE SET\n       ten_ca=excluded.ten_ca, trang_thai=excluded.trang_thai, bat_dau=excluded.bat_dau,\n       het_han_vao=excluded.het_han_vao, thoi_gian_phut=excluded.thoi_gian_phut, loai=excluded.loai,\n       han_nop=excluded.han_nop, cong_bo=excluded.cong_bo, nguong_lan=excluded.nguong_lan,\n       nguong_giay=excluded.nguong_giay, so_cau_json=excluded.so_cau_json,\n       bo_theo_em_json=excluded.bo_theo_em_json, cap_nhat_luc=excluded.cap_nhat_luc,\n       lop=excluded.lop, phong_cho=excluded.phong_cho, giu_de_doc=excluded.giu_de_doc,\n       an_han_giay=excluded.an_han_giay,\n       -- KHÔNG ghi đè mốc bắt đầu bằng rỗng: thầy đẩy lại ca giữa giờ (sửa tên,\n       -- đổi hạn) mà xoá mốc này là cả lớp bị đá về phòng chờ, đồng hồ đang chạy.\n       bat_dau_thi_luc=COALESCE(excluded.bat_dau_thi_luc, ca.bat_dau_thi_luc),\n       bank_r2=COALESCE(excluded.bank_r2, ca.bank_r2)").bind(r, String(n.tenCa ?? ""), String(n.trangThai ?? "mo"), String(n.batDau ?? ""), String(n.hetHanVao ?? ""), Number(n.thoiGianPhut) || 45, String(n.loai ?? "thi"), String(n.hanNop ?? ""), String(n.congBo ?? "khong"), Number(n.nguongLan) || 3, Number(n.nguongGiay) || 10, i, n.soCau ? JSON.stringify(n.soCau) : null, n.boTheoEm ? JSON.stringify(n.boTheoEm) : null, (/* @__PURE__ */ new Date()).toISOString(), String(n.lop ?? ""), +!!n.phongCho, String(n.batDauThiLuc ?? "") || null, +!!n.giuDeDoc, Number(n.anHanGiay) || 0).run(), s({
		ok: !0,
		maCa: r,
		coDe: !!i
	});
}
async function x(e, t) {
	if (!t) return s({
		ok: !1,
		error: "Thiếu mã ca"
	});
	let n = (/* @__PURE__ */ new Date()).toISOString();
	return (await e.DB.prepare("UPDATE ca SET bat_dau_thi_luc = ?, cap_nhat_luc = ? WHERE ma_ca = ?").bind(n, n, t).run()).meta.changes === 0 ? s({
		ok: !1,
		error: "Không tìm thấy ca kiểm tra"
	}) : s({
		ok: !0,
		batDauLuc: n
	});
}
async function S(e, t) {
	let n = String(t.ma ?? "").trim();
	if (!n) return s({
		ok: !1,
		error: "Thiếu mã phiếu"
	});
	if (!e.DE) return s({
		ok: !1,
		error: "Chưa nối R2 — chưa đẩy phiếu được"
	}, 500);
	let r = {
		ma: n,
		maCa: String(t.maCa ?? ""),
		sbd: String(t.sbd ?? ""),
		hoTen: String(t.hoTen ?? ""),
		loai: String(t.loai ?? "ketqua"),
		phieu: t.phieu ?? null,
		ghiLuc: (/* @__PURE__ */ new Date()).toISOString()
	};
	return await e.DE.put(`phieu/${n}.json`, JSON.stringify(r)), s({ ok: !0 });
}
async function C(e, t) {
	let n = String(t ?? "").trim();
	if (!n) return s({
		ok: !1,
		lyDo: "thieu"
	}, 400);
	if (!e.DE) return s({
		ok: !1,
		lyDo: "khong_co"
	}, 404);
	let r = await e.DE.get(`phieu/${n}.json`);
	return r ? new Response(r.body, {
		status: 200,
		headers: {
			...o,
			"cache-control": "no-store"
		}
	}) : s({
		ok: !1,
		lyDo: "khong_co"
	}, 404);
}
async function w(e, t) {
	let n = String(t ?? "").trim();
	return n ? (e.DE && await e.DE.put(`phieu/${n}.json`, JSON.stringify({
		ma: n,
		thuHoi: !0,
		phieu: null,
		ghiLuc: (/* @__PURE__ */ new Date()).toISOString()
	})), s({ ok: !0 })) : s({
		ok: !1,
		error: "Thiếu mã phiếu"
	});
}
async function T(e, t) {
	let n = Array.isArray(t.ds) ? t.ds : [];
	if (n.length === 0) return s({
		ok: !1,
		error: "Danh sách rỗng"
	});
	let r = (/* @__PURE__ */ new Date()).toISOString(), i = n.map((e) => String(e.sbd ?? "").trim()).filter((e) => e.length > 0).map((t, i) => e.DB.prepare("INSERT INTO danh_sach (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc) VALUES (?,?,?,?,?)\n         ON CONFLICT(sbd) DO UPDATE SET ho_ten=excluded.ho_ten, nam_sinh=excluded.nam_sinh,\n           lop=excluded.lop, cap_nhat_luc=excluded.cap_nhat_luc").bind(String(n[i].sbd ?? "").trim(), String(n[i].hoTen ?? ""), String(n[i].namSinh ?? ""), String(n[i].lop ?? ""), r));
	for (let t = 0; t < i.length; t += 500) await e.DB.batch(i.slice(t, t + 500));
	return s({
		ok: !0,
		dem: i.length
	});
}
async function E(e, t) {
	return await e.DB.prepare("SELECT * FROM danh_sach WHERE sbd = ?").bind(t).first();
}
async function D(e) {
	return !!await e.DB.prepare("SELECT 1 AS co FROM danh_sach LIMIT 1").first();
}
async function O(e, t, n) {
	if (!t || !n) return s({
		ok: !1,
		lyDo: "thieu"
	});
	if (!await l(e, t)) return s({
		ok: !1,
		lyDo: "khong_co_ca"
	});
	if (!await D(e)) return s({
		ok: !0,
		hoTen: ""
	});
	let r = await E(e, n);
	return s(r ? {
		ok: !0,
		hoTen: String(r.ho_ten ?? "")
	} : {
		ok: !1,
		lyDo: "khong_co_sbd"
	});
}
async function k(e, t) {
	let n = await e.DB.prepare("SELECT * FROM trang_thai WHERE ma_ca = ? ORDER BY sbd").bind(t).all();
	return s({
		ok: !0,
		ds: n.results,
		dem: n.results.length
	});
}
async function A(e, t) {
	let n = await e.DB.prepare("SELECT * FROM phong_cho WHERE ma_ca = ? ORDER BY ghi_luc").bind(t).all();
	return s({
		ok: !0,
		ds: n.results,
		dem: n.results.length
	});
}
async function j(e, t) {
	let n = await e.DB.prepare("SELECT * FROM luot WHERE ma_ca = ? AND da_day_sheet = 0 ORDER BY sbd").bind(t).all();
	return s({
		ok: !0,
		luot: n.results,
		con: n.results.length
	});
}
async function M(e, t) {
	let n = Array.isArray(t.khoa) ? t.khoa : [];
	if (n.length === 0) return s({
		ok: !0,
		danhDau: 0
	});
	if (n.length > 500) return s({
		ok: !1,
		error: "Quá 500 khoá một lượt"
	});
	let r = n.map(() => "?").join(",");
	return s({
		ok: !0,
		danhDau: (await e.DB.prepare(`UPDATE luot SET da_day_sheet = 1 WHERE khoa IN (${r})`).bind(...n).run()).meta.changes
	});
}
async function N(t) {
	let n = Date.now();
	await t.DB.prepare("INSERT INTO ca (ma_ca, ten_ca, trang_thai, bat_dau, het_han_vao, thoi_gian_phut, loai,\n                     han_nop, cong_bo, nguong_lan, nguong_giay, cap_nhat_luc)\n     VALUES (?, 'Ca đo tải (không phải ca thật)', 'mo', ?, ?, 45, 'thi', '', 'khong', 3, 10, ?)\n     ON CONFLICT(ma_ca) DO UPDATE SET trang_thai='mo', bat_dau=excluded.bat_dau,\n       het_han_vao=excluded.het_han_vao, cap_nhat_luc=excluded.cap_nhat_luc").bind(e, (/* @__PURE__ */ new Date(n - 36e5)).toISOString(), new Date(n + 864e5).toISOString(), new Date(n).toISOString()).run();
}
async function P(t) {
	return s({
		ok: !0,
		xoa: (await t.DB.prepare("DELETE FROM luot WHERE ma_ca = ?").bind(e).run()).meta.changes
	});
}
var F = { async fetch(e, t) {
	let n = new URL(e.url), r = n.pathname;
	if (e.method === "OPTIONS") return new Response(null, {
		status: 204,
		headers: a
	});
	if (e.method === "GET" && r.startsWith("/phieu/")) return C(t, decodeURIComponent(r.slice(7)));
	if (e.method === "GET" && r === "/khoe") return s({
		ok: !0,
		ten: "may-chu-moi",
		coDB: !!t.DB,
		coR2: !!t.DE,
		coMat: !!t.MA_BI_MAT
	});
	if (e.method === "GET" && r.startsWith("/de/")) return y(t, decodeURIComponent(r.slice(4)));
	if (e.method === "GET" && r === "/do-tai") return await N(t), new Response("<!doctype html>\n<html lang=\"vi\"><head><meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n<title>Đo tải máy chủ mới</title>\n<style>\n:root{--nen:#faf9f7;--muc:#1c1a17;--mo:#6b6560;--vien:#e3ded7;--xanh:#1a7f5a;--do:#b3261e;--vang:#9a6b00}\n*{box-sizing:border-box}\nbody{margin:0;padding:24px 16px;background:var(--nen);color:var(--muc);\n  font:15px/1.55 -apple-system,BlinkMacSystemFont,\"Segoe UI\",system-ui,sans-serif}\nmain{max-width:880px;margin:0 auto}\nh1{font-size:22px;margin:0 0 4px}\np.mo{color:var(--mo);margin:0 0 20px;font-size:14px}\n.hop{background:#fff;border:1px solid var(--vien);border-radius:10px;padding:16px;margin-bottom:16px}\nbutton{font:inherit;font-weight:600;padding:10px 18px;border-radius:8px;border:1px solid var(--muc);\n  background:var(--muc);color:#fff;cursor:pointer}\nbutton.phu{background:#fff;color:var(--muc)}\nbutton:disabled{opacity:.45;cursor:not-allowed}\ntable{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums;font-size:14px}\nth,td{text-align:right;padding:7px 8px;border-bottom:1px solid var(--vien)}\nth:first-child,td:first-child{text-align:left}\nth{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--mo);font-weight:600}\n.dat{color:var(--xanh);font-weight:600}.truot{color:var(--do);font-weight:600}\n#nhatky{font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;\n  color:var(--mo);max-height:220px;overflow:auto;margin:0}\n.cuon{overflow-x:auto}\n</style></head><body><main>\n<h1>Đo tải máy chủ mới</h1>\n<p class=\"mo\">Mỗi “em ảo” chạy đủ ba bước thật: vào thi → lưu tạm → nộp. Dữ liệu ghi vào ca <code>DOTAI</code>, không đụng ca thật.</p>\n\n<div class=\"hop\">\n  <button id=\"chay\">Đo 10 · 20 · 30 · 50 lượt đồng thời</button>\n  <button id=\"don\" class=\"phu\">Dọn dữ liệu đo</button>\n</div>\n\n<div class=\"hop cuon\">\n  <table id=\"bang\"><thead><tr>\n    <th>Đồng thời</th><th>Lệnh</th><th>p50 ms</th><th>p95 ms</th><th>Cao nhất</th><th>Lỗi</th>\n  </tr></thead><tbody><tr><td colspan=\"6\" style=\"text-align:center;color:var(--mo)\">chưa đo</td></tr></tbody></table>\n</div>\n\n<div class=\"hop\"><pre id=\"nhatky\">sẵn sàng.</pre></div>\n</main>\n<script>\nconst $ = (s) => document.querySelector(s)\nconst ghi = (t) => { $('#nhatky').textContent += '\\n' + t; $('#nhatky').scrollTop = 1e9 }\nconst phanVi = (a, p) => { if (!a.length) return 0; const b=[...a].sort((x,y)=>x-y); return Math.round(b[Math.min(b.length-1, Math.floor(b.length*p))]) }\n\nasync function goi(duong, than) {\n  const t0 = performance.now()\n  try {\n    const r = await fetch(duong, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(than) })\n    const j = await r.json()\n    return { ms: performance.now() - t0, ok: r.ok && j.ok !== false, j }\n  } catch (e) { return { ms: performance.now() - t0, ok:false, loi:String(e) } }\n}\n\nasync function motEm(i) {\n  const sbd = 'DOTAI' + String(i).padStart(4,'0')\n  const a = await goi('/vao-thi', { maCa:'DOTAI', sbd, idThietBi:'do-tai-'+i })\n  const b = await goi('/luu-tam', { maCa:'DOTAI', sbd, dapAn:{ c1:'A', c2:'B', c3:'C' } })\n  const c = await goi('/nop',     { maCa:'DOTAI', sbd, dapAn:{ c1:'A', c2:'B', c3:'C' }, integrity:{ leaveCount:0, totalHiddenMs:0 } })\n  return { a, b, c }\n}\n\nasync function mucDo(n) {\n  await fetch('/do-tai/don', { method:'POST' })\n  const t0 = performance.now()\n  const kq = await Promise.all(Array.from({length:n}, (_,i) => motEm(i+1)))\n  const tong = Math.round(performance.now() - t0)\n  const hang = []\n  for (const [ten, khoa] of [['vào thi','a'],['lưu tạm','b'],['nộp','c']]) {\n    const ds = kq.map(k => k[khoa])\n    const ms = ds.map(x => x.ms)\n    hang.push({ n, ten, p50:phanVi(ms,.5), p95:phanVi(ms,.95), max:Math.round(Math.max(...ms)), loi:ds.filter(x=>!x.ok).length })\n  }\n  ghi(n + ' lượt đồng thời — xong cả ba bước trong ' + tong + ' ms')\n  const hong = kq.flatMap(k => [k.a,k.b,k.c]).filter(x => !x.ok)\n  if (hong.length) ghi('  lỗi mẫu: ' + JSON.stringify(hong[0].loi ?? hong[0].j))\n  return hang\n}\n\n$('#chay').onclick = async () => {\n  $('#chay').disabled = $('#don').disabled = true\n  $('#nhatky').textContent = 'bắt đầu đo…'\n  const tbody = $('#bang tbody'); tbody.innerHTML = ''\n  for (const n of [10,20,30,50]) {\n    for (const h of await mucDo(n)) {\n      const tr = document.createElement('tr')\n      tr.innerHTML = '<td>' + h.n + '</td><td>' + h.ten + '</td><td>' + h.p50 + '</td><td>' + h.p95 +\n        '</td><td>' + h.max + '</td><td class=\"' + (h.loi ? 'truot':'dat') + '\">' + h.loi + '</td>'\n      tbody.appendChild(tr)\n    }\n  }\n  ghi('đo xong.')\n  $('#chay').disabled = $('#don').disabled = false\n}\n\n$('#don').onclick = async () => {\n  const r = await (await fetch('/do-tai/don', { method:'POST' })).json()\n  ghi('đã dọn ' + (r.xoa ?? 0) + ' dòng của ca DOTAI.')\n}\n<\/script></body></html>", { headers: {
		"content-type": "text/html;charset=utf-8",
		...a
	} });
	if (e.method === "POST" && r === "/do-tai/don") return P(t);
	if (e.method === "GET" && r === "/trang-thai") return g(t, (n.searchParams.get("sbd") ?? "").trim());
	if (e.method === "GET" && r === "/phong-cho") return _(t, (n.searchParams.get("maCa") ?? "").trim());
	if (e.method === "GET" && r === "/ten-theo-sbd") return O(t, (n.searchParams.get("maCa") ?? "").trim(), (n.searchParams.get("sbd") ?? "").trim());
	if (e.method !== "POST") return s({
		ok: !1,
		error: "Chỉ nhận POST"
	}, 405);
	let i;
	try {
		i = await e.json();
	} catch {
		return s({
			ok: !1,
			error: "Thân gói không phải JSON"
		}, 400);
	}
	return r === "/vao-thi" ? f(t, i) : r === "/luu-tam" ? p(t, i) : r === "/nop" ? m(t, i) : r === "/trang-thai" ? h(t, i) : r === "/phong-cho" ? v(t, i) : c(e, t, i) ? r === "/ca/day" ? b(t, i) : r === "/danh-sach/day" ? T(t, i) : r === "/phieu/day" ? S(t, i) : r === "/phieu/xoa" ? w(t, String(i.ma ?? "")) : r === "/chua-day" ? j(t, String(i.maCa ?? "")) : r === "/da-day" ? M(t, i) : r === "/ca/bat-dau" ? x(t, String(i.maCa ?? "")) : r === "/theo-doi" ? k(t, String(i.maCa ?? "")) : r === "/cho" ? A(t, String(i.maCa ?? "")) : s({
		ok: !1,
		error: "Không có đường này"
	}, 404) : s({
		ok: !1,
		error: "Sai mã bí mật"
	}, 403);
} };
//#endregion
export { F as default, d as dieuKienLuot };

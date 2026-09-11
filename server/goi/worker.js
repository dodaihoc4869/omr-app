//#region server/src/do-tai.ts
var e = "DOTAI";
//#endregion
//#region server/src/danh-sach.ts
function t(e) {
	if (!Array.isArray(e)) return [];
	let t = [], n = /* @__PURE__ */ new Set();
	for (let r of e) {
		let e = r ?? {}, i = String(e.sbd ?? "").trim();
		!i || n.has(i) || (n.add(i), t.push({
			sbd: i,
			hoTen: String(e.hoTen ?? "").trim(),
			namSinh: String(e.namSinh ?? "").trim(),
			lop: String(e.lop ?? "").trim()
		}));
	}
	return t;
}
//#endregion
//#region server/src/luat-vao-thi.ts
function n(e) {
	let t = new Date(String(e ?? "")).getTime();
	return Number.isFinite(t) ? t : NaN;
}
function r(e, t, r, i) {
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
	let a = n(e.bat_dau);
	if (Number.isFinite(a) && i < a) return {
		ok: !1,
		lyDo: "chua_mo"
	};
	if (t) {
		if (t.trang_thai === "da_nop" || t.trang_thai === "khoa") return {
			ok: !1,
			lyDo: "da_nop",
			lanThu: t.lan_thu
		};
		if (t.trang_thai === "dang_lam") return t.id_thiet_bi && t.id_thiet_bi !== r ? {
			ok: !1,
			lyDo: "dang_lam_may_khac",
			lanThu: t.lan_thu
		} : {
			ok: !0,
			cach: "khoi_phuc",
			lanThu: t.lan_thu
		};
	}
	let o = n(e.het_han_vao);
	return Number.isFinite(o) && i > o ? {
		ok: !1,
		lyDo: "het_han_vao"
	} : {
		ok: !0,
		cach: "moi",
		lanThu: (t?.lan_thu ?? 0) + 1
	};
}
function i(e, t) {
	if (e.loai === "baitap") return e.han_nop || "";
	let n = Number(e.thoi_gian_phut) || 45;
	return new Date(t + n * 6e4).toISOString();
}
function a(e, t, n) {
	return `${e}|${t}|${n}`;
}
//#endregion
//#region server/src/index.ts
var o = {
	"access-control-allow-origin": "*",
	"access-control-allow-methods": "GET, POST, OPTIONS",
	"access-control-allow-headers": "content-type, x-ma-bi-mat",
	"access-control-max-age": "86400"
}, s = {
	"content-type": "application/json;charset=utf-8",
	...o
};
function c(e, t = 200) {
	return new Response(JSON.stringify({
		...e,
		serverNow: Date.now()
	}), {
		status: t,
		headers: s
	});
}
function l(e, t, n) {
	let r = String(n.secret ?? e.headers.get("x-ma-bi-mat") ?? "").trim();
	return r.length > 0 && r === String(t.MA_BI_MAT ?? "").trim();
}
async function u(e, t) {
	return await e.DB.prepare("SELECT * FROM ca WHERE ma_ca = ?").bind(t).first();
}
async function d(e, t, n) {
	return await e.DB.prepare("SELECT * FROM luot WHERE ma_ca = ? AND sbd = ? ORDER BY lan_thu DESC LIMIT 1").bind(t, n).first();
}
function f(e) {
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
async function p(e, t) {
	let n = String(t.maCa ?? "").trim(), o = String(t.sbd ?? "").trim(), s = String(t.idThietBi ?? "").trim();
	if (!n || !o) return c({
		ok: !1,
		lyDo: "thieu",
		error: "Thiếu mã ca hoặc số báo danh"
	});
	let l = await u(e, n);
	if (n !== "DOTAI" && l && await M(e) && !await j(e, o)) return c({
		ok: !1,
		lyDo: "khong_co_sbd",
		thoiGianPhut: l.thoi_gian_phut ?? 45
	});
	let f = await d(e, n, o), p = Date.now(), m = r(l, f, s, p);
	if (!m.ok || !l) return c({
		ok: !1,
		lyDo: m.lyDo,
		lanThu: m.lanThu,
		thoiGianPhut: l?.thoi_gian_phut ?? 45
	});
	if (Number(l.phong_cho ?? 0) === 1 && !l.bat_dau_thi_luc && !f) return await e.DB.prepare("INSERT INTO phong_cho (khoa, ma_ca, sbd, ho_ten, ghi_luc) VALUES (?,?,?,?,?)\n       ON CONFLICT(khoa) DO UPDATE SET ho_ten=excluded.ho_ten, ghi_luc=excluded.ghi_luc").bind(`${n}|${o}`, n, o, String(t.hoTen ?? ""), new Date(p).toISOString()).run(), c({
		ok: !0,
		cach: "cho",
		lop: l.lop ?? "",
		thoiGianPhut: l.thoi_gian_phut ?? 45,
		tenCa: l.ten_ca ?? "",
		congBo: l.cong_bo ?? "khong"
	});
	let h = m.lanThu ?? 1, g = a(n, o, h), _ = m.cach === "khoi_phuc" && f ? f.vao_luc : new Date(p).toISOString(), v = m.cach === "khoi_phuc" && f ? f.het_gio_luc || "" : i(l, p);
	return await e.DB.prepare("INSERT INTO luot (khoa, ma_ca, sbd, lan_thu, id_thiet_bi, vao_luc, het_gio_luc, trang_thai, cap_nhat_luc)\n     VALUES (?, ?, ?, ?, ?, ?, ?, 'dang_lam', ?)\n     ON CONFLICT(khoa) DO UPDATE SET id_thiet_bi = excluded.id_thiet_bi, cap_nhat_luc = excluded.cap_nhat_luc").bind(g, n, o, h, s, _, v, new Date(p).toISOString()).run(), c({
		ok: !0,
		cach: m.cach,
		khoaLuot: g,
		lanThu: h,
		vaoLuc: _,
		hetGioLuc: v,
		thoiGianPhut: l.thoi_gian_phut ?? 45,
		congBo: l.cong_bo ?? "khong",
		loai: l.loai === "baitap" ? "baitap" : "thi",
		hanNop: l.han_nop ?? "",
		tenCa: l.ten_ca ?? "",
		nguongLan: l.nguong_lan ?? 3,
		nguongGiay: l.nguong_giay ?? 10,
		lop: l.lop ?? "",
		giuDeDoc: Number(l.giu_de_doc ?? 0) === 1,
		anHanGiay: Number(l.an_han_giay ?? 0),
		soCau: l.so_cau_json ? JSON.parse(l.so_cau_json) : void 0,
		boTheoEm: l.bo_theo_em_json ? JSON.parse(l.bo_theo_em_json) : void 0,
		deUrl: l.bank_r2 ? `/de/${encodeURIComponent(n)}` : null
	});
}
async function m(e, t) {
	let n = f(t);
	return n ? (await e.DB.prepare(`UPDATE luot SET dap_an_json = ?, giay_cau_json = ?, cap_nhat_luc = ?
     WHERE ${n.sql} AND trang_thai = 'dang_lam'`).bind(JSON.stringify(t.dapAn ?? {}), t.giayCau ? JSON.stringify(t.giayCau) : null, (/* @__PURE__ */ new Date()).toISOString(), ...n.tham).run()).meta.changes === 0 ? c({
		ok: !1,
		lyDo: "khong_dang_lam"
	}) : c({ ok: !0 }) : c({
		ok: !1,
		lyDo: "thieu"
	});
}
async function h(e, t) {
	let n = f(t);
	if (!n) return c({
		ok: !1,
		lyDo: "thieu"
	});
	let r = t.integrity ?? {}, i = (/* @__PURE__ */ new Date()).toISOString(), a = r.blocked ? "khoa" : "da_nop";
	if ((await e.DB.prepare(`UPDATE luot SET nop_luc = ?, trang_thai = ?, dap_an_json = ?, giay_cau_json = ?,
            integrity_json = ?, so_lan_roi_man = ?, tong_giay_roi_man = ?, cap_nhat_luc = ?, da_day_sheet = 0
     WHERE ${n.sql} AND trang_thai = 'dang_lam'`).bind(i, a, JSON.stringify(t.dapAn ?? {}), t.giayCau ? JSON.stringify(t.giayCau) : null, JSON.stringify(r), Number(r.leaveCount ?? 0), Math.round(Number(r.totalHiddenMs ?? 0) / 1e3), i, ...n.tham).run()).meta.changes === 0) {
		let t = await e.DB.prepare(`SELECT trang_thai, nop_luc FROM luot WHERE ${n.sql}`).bind(...n.tham).first();
		return t && (t.trang_thai === "da_nop" || t.trang_thai === "khoa") ? c({
			ok: !0,
			daNhan: !0,
			nopLuc: t.nop_luc
		}) : c({
			ok: !1,
			lyDo: "khong_tim_thay"
		});
	}
	return c({
		ok: !0,
		nopLuc: i
	});
}
async function g(e, t) {
	let n = String(t.sbd ?? "").trim();
	if (!n) return c({
		ok: !1,
		lyDo: "thieu"
	});
	let r = (/* @__PURE__ */ new Date()).toISOString();
	return await e.DB.prepare("INSERT INTO trang_thai (sbd, ma_ca, lop, dang_lam, bat_dau_luc, da_lam_cau_hoi,\n                             tong_cau_hoi, so_lan_roi_app, blocked, cap_nhat_luc, da_day_sheet)\n     VALUES (?,?,?,?,?,?,?,?,?,?,0)\n     ON CONFLICT(sbd) DO UPDATE SET\n       ma_ca=excluded.ma_ca, lop=excluded.lop, dang_lam=excluded.dang_lam,\n       bat_dau_luc=excluded.bat_dau_luc, da_lam_cau_hoi=excluded.da_lam_cau_hoi,\n       tong_cau_hoi=excluded.tong_cau_hoi, so_lan_roi_app=excluded.so_lan_roi_app,\n       blocked=excluded.blocked, cap_nhat_luc=excluded.cap_nhat_luc, da_day_sheet=0").bind(n, String(t.maCa ?? ""), String(t.lop ?? ""), +!!t.dangLam, String(t.batDauLuc ?? r), Number(t.daLamCauHoi ?? 0), Number(t.tongCauHoi ?? 0), Number(t.soLanRoiApp ?? 0), +!!t.blocked, r).run(), c({ ok: !0 });
}
async function _(e, t) {
	if (!t) return c({
		ok: !1,
		lyDo: "thieu"
	});
	let n = await e.DB.prepare("SELECT * FROM trang_thai WHERE sbd = ?").bind(t).first();
	return c({
		ok: !0,
		found: !!n,
		trangThai: n ?? null
	});
}
async function v(e, t) {
	let n = await u(e, t);
	return c(n ? {
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
async function y(e, t) {
	let n = String(t.maCa ?? "").trim(), r = String(t.sbd ?? "").trim();
	return !n || !r ? c({
		ok: !1,
		lyDo: "thieu"
	}) : (await e.DB.prepare("INSERT INTO phong_cho (khoa, ma_ca, sbd, ho_ten, ghi_luc) VALUES (?,?,?,?,?)\n     ON CONFLICT(khoa) DO UPDATE SET ho_ten=excluded.ho_ten, ghi_luc=excluded.ghi_luc").bind(`${n}|${r}`, n, r, String(t.hoTen ?? ""), (/* @__PURE__ */ new Date()).toISOString()).run(), c({ ok: !0 }));
}
async function b(e, t) {
	let n = await u(e, t);
	if (!n?.bank_r2) return c({
		ok: !1,
		lyDo: "chua_co_de"
	}, 404);
	if (!e.DE) return c({
		ok: !1,
		lyDo: "chua_noi_r2"
	}, 500);
	let r = await e.DE.get(n.bank_r2);
	return r ? new Response(r.body, { headers: {
		...s,
		"cache-control": "public, max-age=86400",
		etag: r.httpEtag
	} }) : c({
		ok: !1,
		lyDo: "mat_goi_de"
	}, 404);
}
async function x(e, t) {
	let n = t.ca, r = String(n?.maCa ?? "").trim();
	if (!r) return c({
		ok: !1,
		error: "Thiếu mã ca"
	});
	let i = null;
	if (t.bank) {
		if (!e.DE) return c({
			ok: !1,
			error: "Chưa nối R2 — chưa đẩy gói đề được"
		}, 500);
		i = `de/${r}.json`, await e.DE.put(i, JSON.stringify(t.bank));
	}
	return await e.DB.prepare("INSERT INTO ca (ma_ca, ten_ca, trang_thai, bat_dau, het_han_vao, thoi_gian_phut, loai, han_nop,\n                     cong_bo, nguong_lan, nguong_giay, bank_r2, so_cau_json, bo_theo_em_json, cap_nhat_luc,\n                     lop, phong_cho, bat_dau_thi_luc, giu_de_doc, an_han_giay)\n     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)\n     ON CONFLICT(ma_ca) DO UPDATE SET\n       ten_ca=excluded.ten_ca, trang_thai=excluded.trang_thai, bat_dau=excluded.bat_dau,\n       het_han_vao=excluded.het_han_vao, thoi_gian_phut=excluded.thoi_gian_phut, loai=excluded.loai,\n       han_nop=excluded.han_nop, cong_bo=excluded.cong_bo, nguong_lan=excluded.nguong_lan,\n       nguong_giay=excluded.nguong_giay, so_cau_json=excluded.so_cau_json,\n       bo_theo_em_json=excluded.bo_theo_em_json, cap_nhat_luc=excluded.cap_nhat_luc,\n       lop=excluded.lop, phong_cho=excluded.phong_cho, giu_de_doc=excluded.giu_de_doc,\n       an_han_giay=excluded.an_han_giay,\n       -- KHÔNG ghi đè mốc bắt đầu bằng rỗng: thầy đẩy lại ca giữa giờ (sửa tên,\n       -- đổi hạn) mà xoá mốc này là cả lớp bị đá về phòng chờ, đồng hồ đang chạy.\n       bat_dau_thi_luc=COALESCE(excluded.bat_dau_thi_luc, ca.bat_dau_thi_luc),\n       bank_r2=COALESCE(excluded.bank_r2, ca.bank_r2)").bind(r, String(n.tenCa ?? ""), String(n.trangThai ?? "mo"), String(n.batDau ?? ""), String(n.hetHanVao ?? ""), Number(n.thoiGianPhut) || 45, String(n.loai ?? "thi"), String(n.hanNop ?? ""), String(n.congBo ?? "khong"), Number(n.nguongLan) || 3, Number(n.nguongGiay) || 10, i, n.soCau ? JSON.stringify(n.soCau) : null, n.boTheoEm ? JSON.stringify(n.boTheoEm) : null, (/* @__PURE__ */ new Date()).toISOString(), String(n.lop ?? ""), +!!n.phongCho, String(n.batDauThiLuc ?? "") || null, +!!n.giuDeDoc, Number(n.anHanGiay) || 0).run(), c({
		ok: !0,
		maCa: r,
		coDe: !!i
	});
}
async function S(e, t) {
	if (!t) return c({
		ok: !1,
		error: "Thiếu mã ca"
	});
	let n = (/* @__PURE__ */ new Date()).toISOString();
	return (await e.DB.prepare("UPDATE ca SET bat_dau_thi_luc = ?, cap_nhat_luc = ? WHERE ma_ca = ?").bind(n, n, t).run()).meta.changes === 0 ? c({
		ok: !1,
		error: "Không tìm thấy ca kiểm tra"
	}) : c({
		ok: !0,
		batDauLuc: n
	});
}
async function C(e, t) {
	let n = String(t.ma ?? "").trim();
	if (!n) return c({
		ok: !1,
		error: "Thiếu mã phiếu"
	});
	if (!e.DE) return c({
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
	return await e.DE.put(`phieu/${n}.json`, JSON.stringify(r)), c({ ok: !0 });
}
async function w(e, t) {
	let n = String(t ?? "").trim();
	if (!n) return c({
		ok: !1,
		lyDo: "thieu"
	}, 400);
	if (!e.DE) return c({
		ok: !1,
		lyDo: "khong_co"
	}, 404);
	let r = await e.DE.get(`phieu/${n}.json`);
	return r ? new Response(r.body, {
		status: 200,
		headers: {
			...s,
			"cache-control": "no-store"
		}
	}) : c({
		ok: !1,
		lyDo: "khong_co"
	}, 404);
}
async function T(e, t) {
	let n = String(t ?? "").trim();
	return n ? (e.DE && await e.DE.put(`phieu/${n}.json`, JSON.stringify({
		ma: n,
		thuHoi: !0,
		phieu: null,
		ghiLuc: (/* @__PURE__ */ new Date()).toISOString()
	})), c({ ok: !0 })) : c({
		ok: !1,
		error: "Thiếu mã phiếu"
	});
}
async function E(e, t) {
	let n = Array.isArray(t.ca) ? t.ca : [], r = Array.isArray(t.luot) ? t.luot : [];
	if (n.length === 0 && r.length === 0) return c({
		ok: !1,
		error: "Không có gì để đẩy"
	});
	let i = (/* @__PURE__ */ new Date()).toISOString(), a = [];
	for (let t of n) {
		let n = String(t.maCa ?? "").trim();
		n && a.push(e.DB.prepare("INSERT INTO ca (ma_ca, ten_ca, trang_thai, bat_dau, het_han_vao, thoi_gian_phut, loai, han_nop,\n                         cong_bo, cap_nhat_luc, lop, phong_cho, bat_dau_thi_luc, giu_de_doc, an_han_giay,\n                         mo_luc, pham_vi, len_bang, xoa_luc, dem_da_vao, dem_da_nop, dem_canh_bao, dem_luc)\n         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)\n         ON CONFLICT(ma_ca) DO UPDATE SET\n           ten_ca=excluded.ten_ca, trang_thai=excluded.trang_thai, bat_dau=excluded.bat_dau,\n           het_han_vao=excluded.het_han_vao, thoi_gian_phut=excluded.thoi_gian_phut,\n           loai=excluded.loai, han_nop=excluded.han_nop, cong_bo=excluded.cong_bo,\n           cap_nhat_luc=excluded.cap_nhat_luc, lop=excluded.lop, phong_cho=excluded.phong_cho,\n           giu_de_doc=excluded.giu_de_doc, an_han_giay=excluded.an_han_giay,\n           mo_luc=excluded.mo_luc, pham_vi=excluded.pham_vi, len_bang=excluded.len_bang,\n           xoa_luc=excluded.xoa_luc, dem_da_vao=excluded.dem_da_vao, dem_da_nop=excluded.dem_da_nop,\n           dem_canh_bao=excluded.dem_canh_bao, dem_luc=excluded.dem_luc,\n           -- Giữ nguyên mốc bắt đầu và khoá gói đề: xem ghi chú ở `dayCa`.\n           bat_dau_thi_luc=COALESCE(excluded.bat_dau_thi_luc, ca.bat_dau_thi_luc)").bind(n, String(t.tenCa ?? ""), String(t.trangThai ?? "mo"), String(t.batDau ?? ""), String(t.hetHanVao ?? ""), Number(t.thoiGianPhut) || 45, String(t.loai ?? "thi"), String(t.hanNop ?? ""), String(t.congBo ?? "khong"), i, String(t.lop ?? ""), +!!t.phongCho, String(t.batDauThiLuc ?? "") || null, +!!t.giuDeDoc, Number(t.anHanGiay) || 0, String(t.moLuc ?? ""), String(t.phamVi ?? "tu_do"), t.lenBang === !1 ? 0 : 1, String(t.xoaLuc ?? ""), Number(t.daVao) || 0, Number(t.daNop) || 0, Number(t.canhBao) || 0, i));
	}
	for (let t of r) {
		let n = String(t.maCa ?? "").trim(), r = String(t.sbd ?? "").trim();
		if (!n || !r) continue;
		let o = Number(t.lanThu) || 1;
		a.push(e.DB.prepare("INSERT INTO luot (khoa, ma_ca, sbd, lan_thu, vao_luc, het_gio_luc, nop_luc, trang_thai,\n                           so_lan_roi_man, tong_giay_roi_man, cap_nhat_luc, da_day_sheet)\n         VALUES (?,?,?,?,?,?,?,?,?,?,?,1)\n         ON CONFLICT(khoa) DO UPDATE SET\n           vao_luc=excluded.vao_luc, het_gio_luc=excluded.het_gio_luc, nop_luc=excluded.nop_luc,\n           trang_thai=excluded.trang_thai, so_lan_roi_man=excluded.so_lan_roi_man,\n           tong_giay_roi_man=excluded.tong_giay_roi_man, cap_nhat_luc=excluded.cap_nhat_luc,\n           da_day_sheet=1").bind(`${n}|${r}|${o}`, n, r, o, String(t.vaoLuc ?? "") || i, String(t.hetGioLuc ?? "") || null, String(t.nopLuc ?? "") || null, String(t.trangThai ?? "dang_lam"), Number(t.soLanRoiMan) || 0, Number(t.tongGiayRoiMan) || 0, i));
	}
	for (let t = 0; t < a.length; t += 200) await e.DB.batch(a.slice(t, t + 200));
	return c({
		ok: !0,
		soCa: n.length,
		soLuot: r.length,
		soCau: a.length
	});
}
async function D(e, t) {
	let n = await e.DB.prepare(t ? "SELECT * FROM ca WHERE trang_thai = 'da_xoa'" : "SELECT * FROM ca WHERE trang_thai <> 'da_xoa' AND ma_ca <> 'DOTAI'").all(), r = await e.DB.prepare("WITH moi AS (\n       SELECT l.ma_ca, l.trang_thai, l.so_lan_roi_man\n       FROM luot l\n       JOIN (SELECT ma_ca, sbd, MAX(lan_thu) AS m FROM luot GROUP BY ma_ca, sbd) x\n         ON l.ma_ca = x.ma_ca AND l.sbd = x.sbd AND l.lan_thu = x.m\n       WHERE l.trang_thai <> 'duoc_duyet_lai'\n     )\n     SELECT ma_ca,\n            COUNT(*) AS da_vao,\n            SUM(CASE WHEN trang_thai IN ('da_nop','khoa') THEN 1 ELSE 0 END) AS da_nop,\n            SUM(CASE WHEN trang_thai = 'khoa' OR so_lan_roi_man > 0 THEN 1 ELSE 0 END) AS canh_bao\n     FROM moi GROUP BY ma_ca").all(), i = {};
	for (let e of r.results ?? []) i[String(e.ma_ca)] = e;
	let a = (n.results ?? []).map((e) => {
		let t = String(e.ma_ca ?? ""), n = i[t] ?? {
			da_vao: 0,
			da_nop: 0,
			canh_bao: 0
		}, r = {
			da_vao: Number(e.dem_da_vao) || 0,
			da_nop: Number(e.dem_da_nop) || 0,
			canh_bao: Number(e.dem_canh_bao) || 0
		};
		return {
			maCa: t,
			lop: String(e.lop ?? ""),
			thoiGianPhut: Number(e.thoi_gian_phut) || 45,
			moLuc: String(e.mo_luc ?? ""),
			congBo: String(e.cong_bo ?? "khong"),
			batDau: String(e.bat_dau ?? ""),
			hetHanVao: String(e.het_han_vao ?? ""),
			trangThai: String(e.trang_thai ?? "mo"),
			tenCa: String(e.ten_ca ?? ""),
			phamVi: String(e.pham_vi ?? "tu_do"),
			loai: String(e.loai ?? "") === "baitap" ? "baitap" : "thi",
			hanNop: String(e.han_nop ?? ""),
			lenBang: Number(e.len_bang ?? 1) !== 0,
			giuDeDoc: Number(e.giu_de_doc ?? 0) === 1,
			anHanGiay: Number(e.an_han_giay) || 0,
			phongCho: Number(e.phong_cho ?? 0) === 1,
			batDauThiLuc: String(e.bat_dau_thi_luc ?? ""),
			xoaLuc: String(e.xoa_luc ?? ""),
			daVao: Math.max(Number(n.da_vao) || 0, r.da_vao),
			daNop: Math.max(Number(n.da_nop) || 0, r.da_nop),
			canhBao: Math.max(Number(n.canh_bao) || 0, r.canh_bao)
		};
	});
	a.sort((e, t) => O(t.moLuc || t.batDau) - O(e.moLuc || e.batDau));
	let o = await e.DB.prepare("SELECT * FROM dong_bo WHERE ma = ?").bind("ca_day_du").first(), s = await e.DB.prepare("SELECT COUNT(*) AS n FROM luot WHERE ma_ca <> 'DOTAI'").first();
	return c({
		ok: !0,
		items: a,
		dauDongBo: o ?? null,
		soDongLuot: Number(s?.n) || 0,
		serverNow: Date.now()
	});
}
function O(e) {
	let t = Date.parse(String(e || ""));
	return Number.isFinite(t) ? t : 0;
}
async function k(e, t) {
	let n = String(t.ma ?? "").trim();
	return n ? t.xoa === !0 ? (await e.DB.prepare("DELETE FROM dong_bo WHERE ma = ?").bind(n).run(), c({
		ok: !0,
		daXoa: !0
	})) : (await e.DB.prepare("INSERT INTO dong_bo (ma, luc, so_ca, so_luot, ghi_chu) VALUES (?,?,?,?,?)\n     ON CONFLICT(ma) DO UPDATE SET luc=excluded.luc, so_ca=excluded.so_ca,\n       so_luot=excluded.so_luot, ghi_chu=excluded.ghi_chu").bind(n, (/* @__PURE__ */ new Date()).toISOString(), Number(t.soCa) || 0, Number(t.soLuot) || 0, String(t.ghiChu ?? "")).run(), c({ ok: !0 })) : c({
		ok: !1,
		error: "Thiếu mã dấu"
	});
}
async function A(e, n) {
	let r = t(n.ds);
	if (r.length === 0) return c({
		ok: !1,
		error: "Danh sách rỗng"
	});
	let i = (/* @__PURE__ */ new Date()).toISOString(), a = r.map((t) => e.DB.prepare("INSERT INTO danh_sach (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc) VALUES (?,?,?,?,?)\n       ON CONFLICT(sbd) DO UPDATE SET ho_ten=excluded.ho_ten, nam_sinh=excluded.nam_sinh,\n         lop=excluded.lop, cap_nhat_luc=excluded.cap_nhat_luc").bind(t.sbd, t.hoTen, t.namSinh, t.lop, i));
	for (let t = 0; t < a.length; t += 500) await e.DB.batch(a.slice(t, t + 500));
	let o = await e.DB.prepare("DELETE FROM danh_sach WHERE cap_nhat_luc <> ?").bind(i).run();
	return c({
		ok: !0,
		dem: r.length,
		daBo: o.meta?.changes ?? 0
	});
}
async function j(e, t) {
	return await e.DB.prepare("SELECT * FROM danh_sach WHERE sbd = ?").bind(t).first();
}
async function M(e) {
	return !!await e.DB.prepare("SELECT 1 AS co FROM danh_sach LIMIT 1").first();
}
async function N(e, t, n) {
	if (!t || !n) return c({
		ok: !1,
		lyDo: "thieu"
	});
	if (!await u(e, t)) return c({
		ok: !1,
		lyDo: "khong_co_ca"
	});
	if (!await M(e)) return c({
		ok: !0,
		hoTen: ""
	});
	let r = await j(e, n);
	return c(r ? {
		ok: !0,
		hoTen: String(r.ho_ten ?? "")
	} : {
		ok: !1,
		lyDo: "khong_co_sbd"
	});
}
async function P(e, t) {
	if (!t) return c({
		ok: !1,
		error: "Thiếu mã ca"
	});
	let n = ((await e.DB.prepare("SELECT * FROM luot WHERE ma_ca = ? ORDER BY sbd, lan_thu").bind(t).all()).results ?? []).map((e) => ({
		sbd: String(e.sbd ?? ""),
		hoTen: "",
		lanThu: Number(e.lan_thu) || 1,
		trangThai: String(e.trang_thai ?? ""),
		vaoLuc: String(e.vao_luc ?? ""),
		hetGioLuc: String(e.het_gio_luc ?? ""),
		nopLuc: String(e.nop_luc ?? ""),
		soLanRoiMan: Number(e.so_lan_roi_man) || 0,
		tongGiayRoiMan: Number(e.tong_giay_roi_man) || 0,
		diemI: null,
		diemII: null,
		diemIII: null,
		tong: null,
		duyetBoi: "",
		duyetLuc: "",
		ghiChu: "",
		dapAn: null,
		integrity: null,
		giayCau: null
	}));
	return c({
		ok: !0,
		ds: n,
		dem: n.length
	});
}
async function F(e, t) {
	let n = await e.DB.prepare("SELECT * FROM trang_thai WHERE ma_ca = ? ORDER BY sbd").bind(t).all();
	return c({
		ok: !0,
		ds: n.results,
		dem: n.results.length
	});
}
async function I(e, t) {
	let n = await e.DB.prepare("SELECT * FROM phong_cho WHERE ma_ca = ? ORDER BY ghi_luc").bind(t).all();
	return c({
		ok: !0,
		ds: n.results,
		dem: n.results.length
	});
}
async function L(e, t) {
	let n = await e.DB.prepare("SELECT * FROM luot WHERE ma_ca = ? AND da_day_sheet = 0 ORDER BY sbd").bind(t).all();
	return c({
		ok: !0,
		luot: n.results,
		con: n.results.length
	});
}
async function R(e, t) {
	let n = Array.isArray(t.khoa) ? t.khoa : [];
	if (n.length === 0) return c({
		ok: !0,
		danhDau: 0
	});
	if (n.length > 500) return c({
		ok: !1,
		error: "Quá 500 khoá một lượt"
	});
	let r = n.map(() => "?").join(",");
	return c({
		ok: !0,
		danhDau: (await e.DB.prepare(`UPDATE luot SET da_day_sheet = 1 WHERE khoa IN (${r})`).bind(...n).run()).meta.changes
	});
}
async function z(t) {
	let n = Date.now();
	await t.DB.prepare("INSERT INTO ca (ma_ca, ten_ca, trang_thai, bat_dau, het_han_vao, thoi_gian_phut, loai,\n                     han_nop, cong_bo, nguong_lan, nguong_giay, cap_nhat_luc)\n     VALUES (?, 'Ca đo tải (không phải ca thật)', 'mo', ?, ?, 45, 'thi', '', 'khong', 3, 10, ?)\n     ON CONFLICT(ma_ca) DO UPDATE SET trang_thai='mo', bat_dau=excluded.bat_dau,\n       het_han_vao=excluded.het_han_vao, cap_nhat_luc=excluded.cap_nhat_luc").bind(e, (/* @__PURE__ */ new Date(n - 36e5)).toISOString(), new Date(n + 864e5).toISOString(), new Date(n).toISOString()).run();
}
async function B(t) {
	return c({
		ok: !0,
		xoa: (await t.DB.prepare("DELETE FROM luot WHERE ma_ca = ?").bind(e).run()).meta.changes
	});
}
var V = { async fetch(e, t) {
	let n = new URL(e.url), r = n.pathname;
	if (e.method === "OPTIONS") return new Response(null, {
		status: 204,
		headers: o
	});
	if (e.method === "GET" && r.startsWith("/phieu/")) return w(t, decodeURIComponent(r.slice(7)));
	if (e.method === "GET" && r === "/khoe") return c({
		ok: !0,
		ten: "may-chu-moi",
		coDB: !!t.DB,
		coR2: !!t.DE,
		coMat: !!t.MA_BI_MAT
	});
	if (e.method === "GET" && r.startsWith("/de/")) return b(t, decodeURIComponent(r.slice(4)));
	if (e.method === "GET" && r === "/do-tai") return await z(t), new Response("<!doctype html>\n<html lang=\"vi\"><head><meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n<title>Đo tải máy chủ mới</title>\n<style>\n:root{--nen:#faf9f7;--muc:#1c1a17;--mo:#6b6560;--vien:#e3ded7;--xanh:#1a7f5a;--do:#b3261e;--vang:#9a6b00}\n*{box-sizing:border-box}\nbody{margin:0;padding:24px 16px;background:var(--nen);color:var(--muc);\n  font:15px/1.55 -apple-system,BlinkMacSystemFont,\"Segoe UI\",system-ui,sans-serif}\nmain{max-width:880px;margin:0 auto}\nh1{font-size:22px;margin:0 0 4px}\np.mo{color:var(--mo);margin:0 0 20px;font-size:14px}\n.hop{background:#fff;border:1px solid var(--vien);border-radius:10px;padding:16px;margin-bottom:16px}\nbutton{font:inherit;font-weight:600;padding:10px 18px;border-radius:8px;border:1px solid var(--muc);\n  background:var(--muc);color:#fff;cursor:pointer}\nbutton.phu{background:#fff;color:var(--muc)}\nbutton:disabled{opacity:.45;cursor:not-allowed}\ntable{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums;font-size:14px}\nth,td{text-align:right;padding:7px 8px;border-bottom:1px solid var(--vien)}\nth:first-child,td:first-child{text-align:left}\nth{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--mo);font-weight:600}\n.dat{color:var(--xanh);font-weight:600}.truot{color:var(--do);font-weight:600}\n#nhatky{font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;\n  color:var(--mo);max-height:220px;overflow:auto;margin:0}\n.cuon{overflow-x:auto}\n</style></head><body><main>\n<h1>Đo tải máy chủ mới</h1>\n<p class=\"mo\">Mỗi “em ảo” chạy đủ ba bước thật: vào thi → lưu tạm → nộp. Dữ liệu ghi vào ca <code>DOTAI</code>, không đụng ca thật.</p>\n\n<div class=\"hop\">\n  <button id=\"chay\">Đo 10 · 20 · 30 · 50 lượt đồng thời</button>\n  <button id=\"don\" class=\"phu\">Dọn dữ liệu đo</button>\n</div>\n\n<div class=\"hop cuon\">\n  <table id=\"bang\"><thead><tr>\n    <th>Đồng thời</th><th>Lệnh</th><th>p50 ms</th><th>p95 ms</th><th>Cao nhất</th><th>Lỗi</th>\n  </tr></thead><tbody><tr><td colspan=\"6\" style=\"text-align:center;color:var(--mo)\">chưa đo</td></tr></tbody></table>\n</div>\n\n<div class=\"hop\"><pre id=\"nhatky\">sẵn sàng.</pre></div>\n</main>\n<script>\nconst $ = (s) => document.querySelector(s)\nconst ghi = (t) => { $('#nhatky').textContent += '\\n' + t; $('#nhatky').scrollTop = 1e9 }\nconst phanVi = (a, p) => { if (!a.length) return 0; const b=[...a].sort((x,y)=>x-y); return Math.round(b[Math.min(b.length-1, Math.floor(b.length*p))]) }\n\nasync function goi(duong, than) {\n  const t0 = performance.now()\n  try {\n    const r = await fetch(duong, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(than) })\n    const j = await r.json()\n    return { ms: performance.now() - t0, ok: r.ok && j.ok !== false, j }\n  } catch (e) { return { ms: performance.now() - t0, ok:false, loi:String(e) } }\n}\n\nasync function motEm(i) {\n  const sbd = 'DOTAI' + String(i).padStart(4,'0')\n  const a = await goi('/vao-thi', { maCa:'DOTAI', sbd, idThietBi:'do-tai-'+i })\n  const b = await goi('/luu-tam', { maCa:'DOTAI', sbd, dapAn:{ c1:'A', c2:'B', c3:'C' } })\n  const c = await goi('/nop',     { maCa:'DOTAI', sbd, dapAn:{ c1:'A', c2:'B', c3:'C' }, integrity:{ leaveCount:0, totalHiddenMs:0 } })\n  return { a, b, c }\n}\n\nasync function mucDo(n) {\n  await fetch('/do-tai/don', { method:'POST' })\n  const t0 = performance.now()\n  const kq = await Promise.all(Array.from({length:n}, (_,i) => motEm(i+1)))\n  const tong = Math.round(performance.now() - t0)\n  const hang = []\n  for (const [ten, khoa] of [['vào thi','a'],['lưu tạm','b'],['nộp','c']]) {\n    const ds = kq.map(k => k[khoa])\n    const ms = ds.map(x => x.ms)\n    hang.push({ n, ten, p50:phanVi(ms,.5), p95:phanVi(ms,.95), max:Math.round(Math.max(...ms)), loi:ds.filter(x=>!x.ok).length })\n  }\n  ghi(n + ' lượt đồng thời — xong cả ba bước trong ' + tong + ' ms')\n  const hong = kq.flatMap(k => [k.a,k.b,k.c]).filter(x => !x.ok)\n  if (hong.length) ghi('  lỗi mẫu: ' + JSON.stringify(hong[0].loi ?? hong[0].j))\n  return hang\n}\n\n$('#chay').onclick = async () => {\n  $('#chay').disabled = $('#don').disabled = true\n  $('#nhatky').textContent = 'bắt đầu đo…'\n  const tbody = $('#bang tbody'); tbody.innerHTML = ''\n  for (const n of [10,20,30,50]) {\n    for (const h of await mucDo(n)) {\n      const tr = document.createElement('tr')\n      tr.innerHTML = '<td>' + h.n + '</td><td>' + h.ten + '</td><td>' + h.p50 + '</td><td>' + h.p95 +\n        '</td><td>' + h.max + '</td><td class=\"' + (h.loi ? 'truot':'dat') + '\">' + h.loi + '</td>'\n      tbody.appendChild(tr)\n    }\n  }\n  ghi('đo xong.')\n  $('#chay').disabled = $('#don').disabled = false\n}\n\n$('#don').onclick = async () => {\n  const r = await (await fetch('/do-tai/don', { method:'POST' })).json()\n  ghi('đã dọn ' + (r.xoa ?? 0) + ' dòng của ca DOTAI.')\n}\n<\/script></body></html>", { headers: {
		"content-type": "text/html;charset=utf-8",
		...o
	} });
	if (e.method === "POST" && r === "/do-tai/don") return B(t);
	if (e.method === "GET" && r === "/trang-thai") return _(t, (n.searchParams.get("sbd") ?? "").trim());
	if (e.method === "GET" && r === "/phong-cho") return v(t, (n.searchParams.get("maCa") ?? "").trim());
	if (e.method === "GET" && r === "/ten-theo-sbd") return N(t, (n.searchParams.get("maCa") ?? "").trim(), (n.searchParams.get("sbd") ?? "").trim());
	if (e.method !== "POST") return c({
		ok: !1,
		error: "Chỉ nhận POST"
	}, 405);
	let i;
	try {
		i = await e.json();
	} catch {
		return c({
			ok: !1,
			error: "Thân gói không phải JSON"
		}, 400);
	}
	return r === "/vao-thi" ? p(t, i) : r === "/luu-tam" ? m(t, i) : r === "/nop" ? h(t, i) : r === "/trang-thai" ? g(t, i) : r === "/phong-cho" ? y(t, i) : l(e, t, i) ? r === "/ca/day" ? x(t, i) : r === "/danh-sach/day" ? A(t, i) : r === "/phieu/day" ? C(t, i) : r === "/phieu/xoa" ? T(t, String(i.ma ?? "")) : r === "/chua-day" ? L(t, String(i.maCa ?? "")) : r === "/da-day" ? R(t, i) : r === "/ca/bat-dau" ? S(t, String(i.maCa ?? "")) : r === "/theo-doi" ? F(t, String(i.maCa ?? "")) : r === "/ca/luot" ? P(t, String(i.maCa ?? "")) : r === "/ca/nhieu" ? E(t, i) : r === "/ca/danh-sach" ? D(t, i.daXoa === !0) : r === "/dong-bo/dau" ? k(t, i) : r === "/cho" ? I(t, String(i.maCa ?? "")) : c({
		ok: !1,
		error: "Không có đường này"
	}, 404) : c({
		ok: !1,
		error: "Sai mã bí mật"
	}, 403);
} };
//#endregion
export { V as default, f as dieuKienLuot };

// TerraFlow interactive behaviors: navigation, irrigation rules, validation and simple analytics.
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const safe = value => String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
function setError(id, message) { const el = $("#" + id + "Error"); if (el)
    el.textContent = message; }
document.addEventListener("DOMContentLoaded", () => {
    const navButton = $(".nav-toggle"), nav = $(".nav");
    if (navButton && nav)
        navButton.addEventListener("click", () => nav.classList.toggle("open"));
    $$('input[type="date"]').forEach(el => { el.max = todayISO(); if (!el.value)
        el.value = todayISO(); });
    const advisory = $("#advisoryForm");
    if (advisory)
        advisory.addEventListener("submit", e => {
            e.preventDefault();
            const moisture = Number($("#moisture").value), rain = $("#rain").value, stage = $("#stage").value;
            const out = $("#adviceResult");
            if ($("#moisture").value === "" || !Number.isFinite(moisture) || moisture < 0 || moisture > 100) {
                out.classList.remove("hidden");
                out.innerHTML = "<h3>Check your moisture reading</h3><p>Enter a value between 0 and 100.</p>";
                return;
            }
            let title, desc, cls = "";
            if (rain === "yes") {
                title = "Postpone and recheck";
                desc = "Rain is expected. Recheck soil moisture after rainfall before deciding to irrigate.";
                cls = "warn";
            }
            else if (moisture < 30) {
                title = "Low moisture — inspect soon";
                desc = "The reading is below the demo threshold. Inspect the field and irrigation equipment promptly.";
                cls = "alert";
            }
            else if (moisture <= 50) {
                title = "Monitor the field";
                desc = "The reading is in the monitoring band. Check again and consider soil type, crop stage, and recent weather.";
                cls = "warn";
            }
            else {
                title = "Irrigation may not be needed now";
                desc = "The reading is above the demo threshold. Confirm field conditions before making a decision.";
            }
            out.classList.remove("hidden");
            out.innerHTML = `<span class="pill ${cls}">Rule-based demo</span><h3>${title}</h3><p>${desc}</p><p><strong>Plot:</strong> ${safe($("#plotId").value || "Not specified")} · <strong>Stage:</strong> ${safe(stage)} · <strong>Moisture:</strong> ${moisture}%</p><p class="small-note">This is an educational rule set, not validated crop advice. No exact water volume is calculated.</p>`;
        });
    if (advisory)
        advisory.addEventListener("reset", () => setTimeout(() => $("#adviceResult").classList.add("hidden"), 0));
    const reg = $("#registrationForm");
    if (reg)
        reg.addEventListener("submit", e => {
            e.preventDefault();
            const v = { name: $("#name").value.trim(), mobile: $("#mobile").value.trim(), email: $("#email").value.trim(), village: $("#village").value.trim(), plot: $("#plot").value.trim().toUpperCase(), crop: $("#crop").value, soil: $("#soil").value, method: $("#method").value, area: $("#farmArea").value, date: $("#regDate").value };
            const errors = {};
            if (!/^[A-Za-z][A-Za-z .'-]{1,}$/.test(v.name))
                errors.name = "Enter a valid name.";
            if (!/^[6-9]\d{9}$/.test(v.mobile))
                errors.mobile = "Enter a 10-digit Indian mobile number.";
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email))
                errors.email = "Enter a valid email address.";
            if (!v.village)
                errors.village = "Enter a village or locality.";
            if (!/^TF-\d{4}$/.test(v.plot))
                errors.plot = "Use the format TF-1234.";
            if (!v.crop)
                errors.crop = "Select a crop.";
            if (!v.soil)
                errors.soil = "Select a soil type.";
            if (!v.method)
                errors.method = "Select an irrigation method.";
            if (!v.area || !Number.isFinite(Number(v.area)) || Number(v.area) <= 0)
                errors.farmArea = "Area must be greater than zero.";
            if (!v.date || v.date > todayISO())
                errors.regDate = "Choose today or an earlier date.";
            ["name", "mobile", "email", "village", "plot", "crop", "soil", "method", "farmArea", "regDate"].forEach(id => setError(id, ""));
            Object.entries(errors).forEach(([id, msg]) => setError(id, msg));
            const out = $("#regSuccess");
            if (Object.keys(errors).length) {
                out.classList.add("hidden");
                const first = Object.keys(errors)[0];
                $("#" + first).focus();
                return;
            }
            const records = JSON.parse(localStorage.getItem("terraFlowFarmers") || "[]");
            records.push({ ...v, savedAt: new Date().toISOString() });
            localStorage.setItem("terraFlowFarmers", JSON.stringify(records));
            out.classList.remove("hidden");
            out.innerHTML = `<h3>Registration validated successfully</h3><p>${safe(v.name)} · Plot ${safe(v.plot)} · ${safe(v.crop)}</p><p class="small-note">Saved in this browser only; no server is connected.</p>`;
            reg.reset();
            $("#regDate").value = todayISO();
        });
    if (reg)
        reg.addEventListener("reset", () => setTimeout(() => { ["name", "mobile", "email", "village", "plot", "crop", "soil", "method", "farmArea", "regDate"].forEach(id => setError(id, "")); $("#regSuccess").classList.add("hidden"); }, 0));
    const heat = $("#heatForm");
    if (heat)
        heat.addEventListener("submit", e => {
            e.preventDefault();
            const v = { location: $("#location").value.trim(), date: $("#obsDate").value, temp: $("#temperature").value, humidity: $("#humidity").value, rainfall: $("#rainfall").value || 0, impact: $("#cropImpact").value };
            const errors = {};
            if (v.location.length < 2)
                errors.location = "Enter a location name.";
            if (!v.date || v.date > todayISO())
                errors.obsDate = "Date must be today or earlier.";
            if (v.temp === "" || !Number.isFinite(Number(v.temp)) || Number(v.temp) < -10 || Number(v.temp) > 60)
                errors.temperature = "Enter a temperature from -10 to 60°C.";
            if (v.humidity === "" || !Number.isFinite(Number(v.humidity)) || Number(v.humidity) < 0 || Number(v.humidity) > 100)
                errors.humidity = "Humidity must be between 0 and 100%.";
            if (!v.impact)
                errors.cropImpact = "Select a crop stress observation.";
            ["location", "obsDate", "temperature", "humidity", "cropImpact"].forEach(id => setError(id, ""));
            Object.entries(errors).forEach(([id, msg]) => setError(id, msg));
            const out = $("#heatResult");
            if (Object.keys(errors).length) {
                out.classList.add("hidden");
                $("#" + Object.keys(errors)[0]).focus();
                return;
            }
            const temp = Number(v.temp), category = temp >= 40 ? "High" : temp >= 35 ? "Elevated" : "Lower demo band";
            const records = JSON.parse(localStorage.getItem("terraFlowHeat") || "[]");
            records.push({ ...v, temp, humidity: Number(v.humidity), rainfall: Number(v.rainfall), savedAt: new Date().toISOString() });
            localStorage.setItem("terraFlowHeat", JSON.stringify(records));
            out.classList.remove("hidden");
            out.innerHTML = `<span class="pill ${category === "High" ? "alert" : category === "Elevated" ? "warn" : ""}">${category}</span><h3>Observation recorded</h3><p><strong>${safe(v.location)}</strong> reported ${temp.toFixed(1)}°C, humidity ${safe(v.humidity)}%, and crop observation: ${safe(v.impact)}.</p><p class="small-note">Demo threshold only—not an official heatwave warning. Visit the Analytics page to include this record.</p>`;
        });
    if (heat)
        heat.addEventListener("reset", () => setTimeout(() => { ["location", "obsDate", "temperature", "humidity", "cropImpact"].forEach(id => setError(id, "")); $("#heatResult").classList.add("hidden"); }, 0));
    const search = $("#tableSearch"), status = $("#statusFilter");
    function filterTable() {
        const q = (search?.value || "").trim().toLowerCase(), st = status?.value || "all";
        let count = 0;
        $$("#sensorTable tbody tr").forEach(row => { const show = row.cells[0].textContent.toLowerCase().includes(q) && (st === "all" || row.dataset.status === st); row.classList.toggle("hidden", !show); if (show)
            count++; });
        const label = $("#tableCount");
        if (label)
            label.textContent = `Showing ${count} record(s).`;
    }
    if (search)
        search.addEventListener("input", filterTable);
    if (status)
        status.addEventListener("change", filterTable);
    const refresh = $("#refreshAnalytics");
    if (refresh)
        refresh.addEventListener("click", renderAnalytics);
    const download = $("#downloadAnalytics");
    if (download)
        download.addEventListener("click", exportAnalytics);
    if ($("#heatTable"))
        renderAnalytics();
});
function renderAnalytics() {
    const body = $("#heatTable tbody");
    if (!body)
        return;
    const samples = [
        { location: "North Field", date: "2026-10-09", temp: 36.5, humidity: 44, impact: "Leaf curling" },
        { location: "Canal Side", date: "2026-10-10", temp: 38.2, humidity: 39, impact: "Wilting" },
        { location: "East Plot", date: "2026-10-11", temp: 41, humidity: 31, impact: "Leaf scorch" },
        { location: "Village Farm", date: "2026-10-12", temp: 37.1, humidity: 48, impact: "No visible stress" }
    ];
    const saved = JSON.parse(localStorage.getItem("terraFlowHeat") || "[]").map(r => ({ location: r.location, date: r.date, temp: Number(r.temp), humidity: Number(r.humidity), impact: r.impact }));
    const all = [...samples, ...saved];
    body.innerHTML = all.map(r => { const c = r.temp >= 40 ? "High" : r.temp >= 35 ? "Elevated" : "Lower demo band"; const cls = c === "High" ? "alert" : c === "Elevated" ? "warn" : ""; return `<tr data-temp="${r.temp}"><td>${safe(r.location)}</td><td>${safe(r.date)}</td><td>${r.temp.toFixed(1)}°C</td><td>${safe(r.humidity)}%</td><td>${safe(r.impact)}</td><td><span class="pill ${cls}">${c}</span></td></tr>`; }).join("");
    const temps = all.map(r => r.temp), avg = temps.reduce((a, b) => a + b, 0) / temps.length;
    $("#avgTemp").textContent = avg.toFixed(1) + "°C";
    $("#maxTemp").textContent = Math.max(...temps).toFixed(1) + "°C";
    $("#obsCount").textContent = String(all.length);
    const msg = $("#analyticsMessage");
    if (msg)
        msg.textContent = `Showing ${samples.length} sample observation(s) and ${saved.length} locally saved observation(s).`;
}
function exportAnalytics() {
    const rows = $$("#heatTable tbody tr").map(tr => $$("td", tr).map(td => td.textContent.trim()));
    if (!rows.length)
        return;
    const csv = [["Location", "Date", "Max temperature", "Humidity", "Crop stress", "Demo category"], ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" }), url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url;
    a.download = "terraflow-heatwave-analytics.csv";
    a.click();
    URL.revokeObjectURL(url);
}

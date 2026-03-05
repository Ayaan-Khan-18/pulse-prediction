// ── CONFIG ──────────────────────────────────────
const API_URL = 'http://localhost:5000/predict';  // ← Change if deploying remotely

const STAGES = {
  0: { label:'Normal',               icon:'✅', color:'#10b981', bg:'#eafaf1', border:'#a9dfbf' },
  1: { label:'Elevated',             icon:'⚠️', color:'#d68910', bg:'#fef9ec', border:'#f9e79f' },
  2: { label:'Stage 1 Hypertension', icon:'🔴', color:'#c0392b', bg:'#fdecea', border:'#f1948a' },
  3: { label:'Stage 2 Hypertension', icon:'🚨', color:'#6c3483', bg:'#f5eef8', border:'#c39bd3' },
};

// ── TABS ─────────────────────────────────────────
function switchTab(id, btn) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + id).classList.add('active');
  btn.classList.add('active');
}

// ── SLIDER ───────────────────────────────────────
function updateSlider(el) {
  const pct = ((el.value - el.min) / (el.max - el.min)) * 100;
  el.style.setProperty('--pct', pct + '%');
  document.getElementById('stressDisp').textContent = el.value;
  document.getElementById('stressVal').textContent  = el.value;
}
(function(){
  const s = document.getElementById('stress');
  if (s) {
    const pct = ((s.value - s.min) / (s.max - s.min)) * 100;
    s.style.setProperty('--pct', pct + '%');
  }
})();

// ── RISK SCORE (local, for gauge only) ───────────
function riskScore(sys, dia, age, bmi, smoking, cigs, prevHyp, prevStroke, bpMeds, chol, bg, activity, stress) {
  let s = 0;
  if (sys > 140) s += 30; else if (sys > 130) s += 20; else if (sys > 120) s += 10;
  if (dia > 90)  s += 20; else if (dia > 80)  s += 10;
  if (age > 60)  s += 15; else if (age > 45)  s += 8;
  if (bmi > 30)  s += 12; else if (bmi > 25)  s += 6;
  if (smoking)   s += 10;
  if (cigs > 20) s += 8;  else if (cigs > 0)  s += 4;
  if (prevHyp)   s += 15;
  if (prevStroke) s += 12;
  if (bpMeds)    s += 8;
  if (chol > 240) s += 8; else if (chol > 200) s += 4;
  if (bg > 126)   s += 10; else if (bg > 100)  s += 5;
  if (activity === 0) s += 8;
  if (stress > 7) s += 6;
  return Math.min(s, 100);
}

// ── GAUGE ────────────────────────────────────────
function arcPath(cx, cy, r, startDeg, endDeg) {
  const toRad = d => d * Math.PI / 180;
  const x1 = cx + r * Math.cos(toRad(startDeg));
  const y1 = cy + r * Math.sin(toRad(startDeg));
  const x2 = cx + r * Math.cos(toRad(endDeg));
  const y2 = cy + r * Math.sin(toRad(endDeg));
  const large = (endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

function drawGauge(score, stage) {
  const cx = 100, cy = 95, r = 78;
  document.getElementById('gArc0').setAttribute('d', arcPath(cx,cy,r,-140,-73));
  document.getElementById('gArc1').setAttribute('d', arcPath(cx,cy,r,-70,-3));
  document.getElementById('gArc2').setAttribute('d', arcPath(cx,cy,r,0,66));
  document.getElementById('gArc3').setAttribute('d', arcPath(cx,cy,r,69,140));

  const angle = -140 + (score / 100) * 280;
  const rad   = angle * Math.PI / 180;
  const nx    = cx + 54 * Math.cos(rad);
  const ny    = cy + 54 * Math.sin(rad);
  const needle = document.getElementById('gNeedle');
  needle.setAttribute('x2', nx); needle.setAttribute('y2', ny);
  needle.setAttribute('stroke', STAGES[stage].color);
  document.getElementById('gHub').setAttribute('fill', STAGES[stage].color);
  const scoreEl = document.getElementById('gScore');
  scoreEl.textContent = score;
  scoreEl.setAttribute('fill', STAGES[stage].color);
}

// ── RENDER RESULT ────────────────────────────────
function renderResult(stage, probs, risk, recommendation) {
  const cfg = STAGES[stage];

  const banner = document.getElementById('resultBanner');
  banner.style.background  = cfg.bg;
  banner.style.borderColor = cfg.border;

  document.getElementById('resultIcon').textContent  = cfg.icon;
  document.getElementById('resultLabel').textContent = 'Prediction Result';
  document.getElementById('resultLabel').style.color = cfg.color;
  document.getElementById('resultName').textContent  = cfg.label;
  document.getElementById('resultName').style.color  = cfg.color;

  // Recommendation from API
  const titles = ['Excellent BP!', 'Monitor Closely', 'Medical Consultation Advised', 'Seek Immediate Medical Care'];
  document.getElementById('recTitle').textContent   = titles[stage];
  document.getElementById('recTitle').style.color   = cfg.color;
  document.getElementById('recText').textContent    = recommendation;
  const actEl = document.getElementById('recAction');
  const actions = ['📅 Schedule annual checkup','📅 Recheck BP in 3 months','📅 See doctor within 1 month','📅 See doctor this week'];
  actEl.textContent        = actions[stage];
  actEl.style.background   = cfg.border;
  actEl.style.color        = cfg.color;

  // Probabilities from ML model
  [0,1,2,3].forEach(i => {
    const pct = (probs[i] * 100).toFixed(1);
    document.getElementById('p'  + i).textContent = pct + '%';
    document.getElementById('pb' + i).style.width  = pct + '%';
  });

  drawGauge(risk, stage);

  document.getElementById('loadBar').classList.remove('show');
  const rs = document.getElementById('result-section');
  rs.classList.add('show');
  rs.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── PREDICT (calls Flask API) ─────────────────────
async function predict() {
  const btn = document.getElementById('predictBtn');
  btn.disabled    = true;
  btn.textContent = '🔄 Analyzing...';

  const lb = document.getElementById('loadBar');
  lb.classList.add('show');
  const lf = document.getElementById('loadFill');
  lf.style.animation = 'none';
  void lf.offsetWidth;
  lf.style.animation = 'loadBar .85s ease forwards';

  // Collect form values
  const age       = +document.getElementById('age').value;
  const bmi       = +document.getElementById('bmi').value;
  const systolic  = +document.getElementById('systolic').value;
  const diastolic = +document.getElementById('diastolic').value;
  const heartRate = +document.getElementById('heartRate').value;
  const chol      = +document.getElementById('cholesterol').value;
  const bg        = +document.getElementById('bloodGlucose').value;
  const smoking   = +document.getElementById('smoking').value;
  const cigs      = +document.getElementById('cigsPerDay').value;
  const bpMeds    = +document.getElementById('BPMeds').value;
  const prevStroke= +document.getElementById('prevalentStroke').value;
  const prevHyp   = +document.getElementById('prevalentHyp').value;
  const diabetes  = +document.getElementById('diabetes').value;
  const activity  = +document.getElementById('physicalActivity').value;
  const stress    = +document.getElementById('stress').value;

  const payload = {
    age, bmi, systolic, diastolic, heartRate,
    cholesterol: chol, bloodGlucose: bg,
    sex: 1,   // default; add a sex field to your form if needed
    smoking, cigsPerDay: cigs, BPMeds: bpMeds,
    prevalentStroke: prevStroke, prevalentHyp: prevHyp,
    diabetes, physicalActivity: activity, stress,
  };

  try {
    const response = await fetch(API_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`Server error ${response.status}`);
    const result = await response.json();

    const risk = riskScore(systolic, diastolic, age, bmi, smoking, cigs,
                            prevHyp, prevStroke, bpMeds, chol, bg, activity, stress);
    renderResult(result.stage, result.probabilities, risk, result.recommendation);

  } catch (err) {
    console.error('API error:', err);

    // ── Fallback: offline mode if API is unreachable ──
    const stage = systolic < 120 && diastolic < 80 ? 0
                : systolic < 130 && diastolic < 80 ? 1
                : systolic < 140 || diastolic < 90 ? 2 : 3;
    const probs = [0,0,0,0];
    probs[stage] = 0.82;
    const others = [0,1,2,3].filter(i => i !== stage);
    others.forEach((i,idx) => { probs[i] = (1-0.82) * [0.5,0.3,0.2][idx]; });
    const fallbackRecs = [
      'Your blood pressure is in the normal range. Keep up healthy habits.',
      'Your BP is elevated. Cut sodium below 2,300 mg/day and exercise more.',
      'Stage 1 Hypertension. Consult a doctor within 1 month.',
      'Stage 2 Hypertension. See a physician this week.',
    ];
    const risk = riskScore(systolic, diastolic, age, bmi, smoking, cigs,
                            prevHyp, prevStroke, bpMeds, chol, bg, activity, stress);
    renderResult(stage, probs, risk, fallbackRecs[stage]);

    // Show a subtle warning that API is offline
    const banner = document.getElementById('resultBanner');
    const warn = document.createElement('div');
    warn.style.cssText = 'margin-top:10px;padding:8px 14px;background:#fff3cd;border:1px solid #ffc107;border-radius:8px;font-size:.75rem;color:#856404';
    warn.textContent = '⚠️ API offline — showing rule-based estimate. Start app.py to get ML predictions.';
    if (!banner.querySelector('.api-warn')) {
      warn.className = 'api-warn';
      banner.appendChild(warn);
    }
  } finally {
    btn.disabled    = false;
    btn.textContent = '🔍 Predict Hypertension Stage';
  }
}

// ── RESET ────────────────────────────────────────
function resetForm() {
  document.getElementById('age').value             = 45;
  document.getElementById('bmi').value             = 27.0;
  document.getElementById('systolic').value        = 125;
  document.getElementById('diastolic').value       = 82;
  document.getElementById('heartRate').value       = 76;
  document.getElementById('cholesterol').value     = 210;
  document.getElementById('bloodGlucose').value    = 98;
  document.getElementById('smoking').value         = '0';
  document.getElementById('cigsPerDay').value      = 0;
  document.getElementById('BPMeds').value          = '0';
  document.getElementById('prevalentStroke').value = '0';
  document.getElementById('prevalentHyp').value    = '0';
  document.getElementById('diabetes').value        = '0';
  document.getElementById('physicalActivity').value= '1';
  const s = document.getElementById('stress');
  s.value = 5;
  updateSlider(s);
  document.getElementById('result-section').classList.remove('show');
  document.getElementById('loadBar').classList.remove('show');
  const warn = document.querySelector('.api-warn');
  if (warn) warn.remove();
}

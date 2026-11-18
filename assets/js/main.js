/* ==========================================================
   Al Noor Hospital, Tirur — site scripts
   Data (departments & doctors) lives in data.js
   ========================================================== */
(function () {
  'use strict';

  var CFG = window.ALNOOR || {};
  var WHATSAPP = CFG.whatsapp || '919562900010';
  var DEPTS = CFG.departments || [];
  var DOCTORS = CFG.doctors || [];

  /* ---------- helpers ---------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function digits(v) { return String(v || '').replace(/\D/g, ''); }
  function validPhone(v) { return digits(v).length === 10; }
  function deptBy(key) { return DEPTS.filter(function (d) { return d.key === key; })[0]; }
  function docBy(key) { return DOCTORS.filter(function (d) { return d.key === key; })[0]; }
  function param(name) { return new URLSearchParams(window.location.search).get(name); }
  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function days(n) {
    var out = [];
    for (var i = 0; i < n; i++) {
      var d = new Date(); d.setDate(d.getDate() + i);
      out.push({
        date: d,
        top: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short' }),
        num: d.getDate(),
        mon: d.toLocaleDateString('en-IN', { month: 'short' }),
        label: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
      });
    }
    return out;
  }
  function waLink(text) { return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(text); }
  function setActive(list, btn) { list.forEach(function (b) { b.classList.toggle('active', b === btn); b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); }); }

  var SLOTS_SHORT = ['09:30 AM', '10:30 AM', '11:30 AM', '04:00 PM', '05:00 PM', '06:00 PM'];
  var SLOTS_MOR = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM'];
  var SLOTS_EVE = ['04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM'];

  /* ---------- header & mobile nav ---------- */
  function initHeader() {
    var header = $('.site-header');
    if (header) {
      var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 10); };
      window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    }
    var nav = $('#mobile-nav');
    var toggle = $('.menu-toggle');
    if (!nav || !toggle) return;
    var open = function () { nav.classList.add('open'); nav.setAttribute('aria-hidden', 'false'); toggle.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; var c = $('.mobile-nav__close', nav); if (c) c.focus(); };
    var close = function () { nav.classList.remove('open'); nav.setAttribute('aria-hidden', 'true'); toggle.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; };
    toggle.addEventListener('click', open);
    $$('[data-close-nav]', nav).forEach(function (b) { b.addEventListener('click', close); });
    nav.addEventListener('click', function (e) { if (e.target === nav) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { close(); toggle.focus(); } });
  }

  /* ---------- reveal on scroll ---------- */
  function initReveal() {
    var items = $$('.reveal');
    if (!('IntersectionObserver' in window)) { items.forEach(function (i) { i.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (i) { io.observe(i); });
  }

  /* ---------- populate selects ---------- */
  function fillDeptSelect(sel, includeEmergency) {
    DEPTS.forEach(function (d) {
      if (d.key === 'em' && !includeEmergency) return;
      sel.appendChild(el('option', { value: d.key }, esc(d.name)));
    });
  }
  function fillDoctorSelect(sel, deptKey) {
    sel.innerHTML = '<option value="">First available doctor</option>';
    DOCTORS.forEach(function (d) {
      if (deptKey && d.dept !== deptKey) return;
      sel.appendChild(el('option', { value: d.key }, esc(d.name)));
    });
  }
  function renderChipDays(box, n, onPick) {
    var list = days(n); box.innerHTML = '';
    var btns = list.map(function (d, i) {
      var b = el('button', { type: 'button', class: 'chip' + (i === 0 ? ' active' : ''), 'aria-pressed': i === 0 ? 'true' : 'false' }, d.top);
      b.addEventListener('click', function () { setActive(btns, b); onPick(d); });
      box.appendChild(b); return b;
    });
    onPick(list[0]);
  }
  function renderDayGrid(box, n, onPick) {
    var list = days(n); box.innerHTML = '';
    var btns = list.map(function (d, i) {
      var b = el('button', { type: 'button', class: 'day' + (i === 0 ? ' active' : ''), 'aria-label': d.label, 'aria-pressed': i === 0 ? 'true' : 'false' }, '<small>' + d.top + '</small><b>' + d.num + '</b>' + (n > 7 ? '' : '<small>' + d.mon + '</small>'));
      b.addEventListener('click', function () { setActive(btns, b); onPick(d); });
      box.appendChild(b); return b;
    });
    onPick(list[0]);
  }
  function renderSlots(box, slots, onPick, preselect) {
    box.innerHTML = '';
    var btns = slots.map(function (t, i) {
      var b = el('button', { type: 'button', class: 'slot' + (i === preselect ? ' active' : ''), 'aria-pressed': i === preselect ? 'true' : 'false' }, t);
      b.addEventListener('click', function () { setActive(btns, b); onPick(t); });
      box.appendChild(b); return b;
    });
    if (preselect != null && preselect > -1) onPick(slots[preselect]);
    return btns;
  }

  /* ---------- hero booking widget ---------- */
  function initBookingWidget() {
    var w = $('[data-booking-widget]'); if (!w) return;
    var tabs = $$('[data-tab]', w);
    var panels = $$('[data-panel]', w);
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        setActive(tabs, t);
        tabs.forEach(function (x) { x.setAttribute('aria-selected', x === t ? 'true' : 'false'); });
        panels.forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== t.getAttribute('data-tab'); });
        $('[data-success]', w).hidden = true; $('[data-error]', w).hidden = true;
      });
    });
    var dept = $('[data-dept]', w), doc = $('[data-doctor]', w), phone = $('[data-phone]', w);
    var dept2 = $('[data-dept-find]', w);
    fillDeptSelect(dept, true); fillDeptSelect(dept2, false); fillDoctorSelect(doc, '');
    dept.addEventListener('change', function () { fillDoctorSelect(doc, dept.value); });
    var picked = null;
    renderChipDays($('[data-days]', w), 3, function (d) { picked = d; $('[data-date-label]', w).textContent = d.label; });
    var err = $('[data-error]', w), ok = $('[data-success]', w), form = $('[data-panel="book"]', w);
    $('[data-submit]', w).addEventListener('click', function () {
      if (!validPhone(phone.value)) { err.textContent = 'Please enter a valid 10-digit mobile number.'; err.hidden = false; phone.focus(); return; }
      err.hidden = true;
      var d = deptBy(dept.value), dr = docBy(doc.value);
      var summary = (dr ? dr.name : 'First available doctor') + ' · ' + (d ? d.name : 'General OP') + ' · ' + picked.label;
      $('[data-summary]', ok).textContent = summary + ' · +91 ' + digits(phone.value);
      $('[data-wa]', ok).href = waLink('Hello Al Noor Hospital, I would like to book an appointment.\n' + summary + '\nMobile: ' + digits(phone.value));
      form.hidden = true; ok.hidden = false;
    });
    $('[data-reset]', w).addEventListener('click', function () { ok.hidden = true; form.hidden = false; phone.value = ''; });
    $('[data-find]', w).addEventListener('click', function () {
      var q = $('[data-q]', w).value.trim();
      var url = 'doctors.html' + (dept2.value || q ? '?' : '') + (dept2.value ? 'dept=' + dept2.value : '') + (dept2.value && q ? '&' : '') + (q ? 'q=' + encodeURIComponent(q) : '');
      window.location.href = url;
    });
    // quick-links that preselect a department, e.g. data-pick-dept="or"
    $$('[data-pick-dept]').forEach(function (a) {
      a.addEventListener('click', function () {
        tabs[0].click(); dept.value = a.getAttribute('data-pick-dept'); fillDoctorSelect(doc, dept.value);
      });
    });
  }

  /* ---------- side booking card (department & doctor pages) ---------- */
  function initSideBooking() {
    $$('[data-side-booking]').forEach(function (card) {
      var subject = card.getAttribute('data-subject') || 'Appointment';
      var state = { day: null, slot: SLOTS_SHORT[1] };
      renderDayGrid($('[data-days]', card), 8, function (d) { state.day = d; $('[data-date-label]', card).textContent = d.label; });
      renderSlots($('[data-slots]', card), SLOTS_SHORT, function (t) { state.slot = t; }, 1);
      var phone = $('[data-phone]', card), err = $('[data-error]', card);
      var form = $('[data-form]', card), ok = $('[data-success]', card);
      $('[data-submit]', card).addEventListener('click', function () {
        if (!validPhone(phone.value)) { err.textContent = 'Please enter a valid 10-digit mobile number.'; err.hidden = false; phone.focus(); return; }
        err.hidden = true;
        var summary = subject + ' · ' + state.day.label + ', ' + state.slot;
        $('[data-summary]', ok).textContent = summary;
        $('[data-phone-out]', ok).textContent = '+91 ' + digits(phone.value);
        $('[data-wa]', ok).href = waLink('Hello Al Noor Hospital, I would like to book: ' + summary + '\nMobile: ' + digits(phone.value));
        form.hidden = true; ok.hidden = false;
      });
      $('[data-reset]', card).addEventListener('click', function () { ok.hidden = true; form.hidden = false; phone.value = ''; });
    });
  }

  /* ---------- doctors directory filter ---------- */
  function initDoctorFilter() {
    var root = $('[data-doctor-filter]'); if (!root) return;
    var chips = $$('[data-filter]', root), input = $('[data-search]', root);
    var cards = $$('[data-doc-card]'), count = $('[data-count]', root), empty = $('[data-empty]');
    var current = param('dept') || 'all';
    if (param('q')) input.value = param('q');
    function apply() {
      var q = input.value.trim().toLowerCase(), n = 0;
      cards.forEach(function (c) {
        var okDept = current === 'all' || c.getAttribute('data-dept') === current;
        var okQ = !q || c.getAttribute('data-search').indexOf(q) > -1;
        var show = okDept && okQ; c.hidden = !show; if (show) n++;
      });
      count.textContent = n + (n === 1 ? ' doctor' : ' doctors');
      empty.hidden = n !== 0;
      chips.forEach(function (ch) { var on = ch.getAttribute('data-filter') === current; ch.classList.toggle('active', on); ch.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    }
    chips.forEach(function (ch) { ch.addEventListener('click', function () { current = ch.getAttribute('data-filter'); apply(); }); });
    input.addEventListener('input', apply);
    var clear = $('[data-clear]'); if (clear) clear.addEventListener('click', function () { current = 'all'; input.value = ''; apply(); });
    apply();
  }

  /* ---------- full booking flow ---------- */
  function initBookingFlow() {
    var root = $('[data-booking-flow]'); if (!root) return;
    var s = { step: 1, dept: '', doc: '', day: null, slot: '', name: '', phone: '', age: '', gender: '', notes: '' };
    var steps = $$('[data-step-panel]', root), stepEls = $$('[data-step]', root);
    var err = $('[data-error]', root), back = $('[data-back]', root), next = $('[data-next]', root), foot = $('[data-foot]', root), stepper = $('[data-stepper]', root);
    var deptBox = $('[data-dept-list]', root), docBox = $('[data-doc-list]', root);

    // departments
    var deptBtns = DEPTS.filter(function (d) { return d.key !== 'em'; }).map(function (d) {
      var b = el('button', { type: 'button', class: 'sel', 'data-key': d.key },
        '<span class="icon-tile icon-tile--sm" style="background:' + d.bg + ';color:' + d.fg + '">' + d.icon + '</span>' + esc(d.name));
      b.addEventListener('click', function () { s.dept = d.key; s.doc = ''; renderDocs(); sync(); });
      deptBox.appendChild(b); return b;
    });
    function renderDocs() {
      docBox.innerHTML = '';
      var any = el('button', { type: 'button', class: 'sel' + (!s.doc ? ' active' : '') }, '<span class="ini" style="background:#EAF0FA;color:#2552C4">' + CFG.icons.users + '</span><span><b>First available doctor</b><small>Shortest waiting time</small></span>');
      any.addEventListener('click', function () { s.doc = ''; renderDocs(); sync(); });
      docBox.appendChild(any);
      DOCTORS.forEach(function (d) {
        if (s.dept && d.dept !== s.dept) return;
        var pic = d.img ? '<img src="' + d.img + '" alt="">' : '<span class="ini">' + esc(d.initials) + '</span>';
        var b = el('button', { type: 'button', class: 'sel' + (s.doc === d.key ? ' active' : '') }, pic + '<span><b>' + esc(d.name) + '</b><small>' + esc(deptBy(d.dept).name) + '</small></span>');
        b.addEventListener('click', function () { s.doc = d.key; s.dept = d.dept; renderDocs(); sync(); });
        docBox.appendChild(b);
      });
    }
    renderDayGrid($('[data-days]', root), 7, function (d) { s.day = d; sync(); });
    var allSlotBtns = [];
    function slotPick(t) { s.slot = t; allSlotBtns.forEach(function (b) { b.classList.toggle('active', b.textContent === t); }); sync(); }
    allSlotBtns = renderSlots($('[data-slots-mor]', root), SLOTS_MOR, slotPick, -1).concat(renderSlots($('[data-slots-eve]', root), SLOTS_EVE, slotPick, -1));
    $$('[data-gender]', root).forEach(function (g, i, arr) { g.addEventListener('click', function () { s.gender = g.getAttribute('data-gender'); setActive(arr, g); }); });

    // prefill from URL: ?dept=or&doctor=manu
    var pd = param('dept'), pdoc = param('doctor');
    if (pdoc && docBy(pdoc)) { s.doc = pdoc; s.dept = docBy(pdoc).dept; } else if (pd && deptBy(pd)) { s.dept = pd; }
    renderDocs();

    function sync() {
      deptBtns.forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-key') === s.dept); });
      var d = deptBy(s.dept), dr = docBy(s.doc);
      $('[data-sum-dept]').textContent = d ? d.name : '—';
      $('[data-sum-doc]').textContent = dr ? dr.name : 'First available doctor';
      $('[data-sum-date]').textContent = s.day ? s.day.label : '—';
      $('[data-sum-time]').textContent = s.slot || '—';
    }
    function show() {
      steps.forEach(function (p) { p.hidden = +p.getAttribute('data-step-panel') !== s.step; });
      stepEls.forEach(function (e) { var n = +e.getAttribute('data-step'); e.classList.toggle('active', n === s.step); e.classList.toggle('done', n < s.step); });
      back.hidden = s.step === 1 || s.step === 4;
      foot.hidden = s.step === 4; stepper.hidden = s.step === 4;
      next.firstChild.nodeValue = s.step === 3 ? 'Confirm Booking' : 'Continue';
      err.hidden = true;
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    function fail(msg) { err.textContent = msg; err.hidden = false; }
    next.addEventListener('click', function () {
      if (s.step === 1 && !s.dept) return fail('Please choose a department to continue.');
      if (s.step === 2 && !s.slot) return fail('Please choose a time slot.');
      if (s.step === 3) {
        s.name = $('[data-name]', root).value.trim(); s.phone = $('[data-phone]', root).value; s.age = $('[data-age]', root).value; s.notes = $('[data-notes]', root).value.trim();
        if (!s.name) return fail("Please enter the patient's name.");
        if (!validPhone(s.phone)) return fail('Please enter a valid 10-digit mobile number.');
        var ref = 'ALN-' + ((parseInt(digits(s.phone).slice(-4), 10) * 7 + s.day.num * 31 + s.slot.length * 13) % 9000 + 1000);
        var d = deptBy(s.dept), dr = docBy(s.doc);
        $('[data-done-name]', root).textContent = s.name;
        $('[data-done-phone]', root).textContent = '+91 ' + digits(s.phone);
        $('[data-done-ref]', root).textContent = ref;
        $('[data-done-date]', root).textContent = s.day.label;
        $('[data-done-time]', root).textContent = s.slot;
        $('[data-wa]', root).href = waLink('Hello Al Noor Hospital, I would like to confirm my appointment.\nRef: ' + ref + '\nPatient: ' + s.name + (s.age ? ' (' + s.age + ' yrs' + (s.gender ? ', ' + s.gender : '') + ')' : '') + '\nDepartment: ' + d.name + '\nDoctor: ' + (dr ? dr.name : 'First available') + '\nDate: ' + s.day.label + ', ' + s.slot + '\nMobile: ' + digits(s.phone) + (s.notes ? '\nReason: ' + s.notes : ''));
      }
      s.step++; show();
    });
    back.addEventListener('click', function () { s.step--; show(); });
    $('[data-restart]', root).addEventListener('click', function () { window.location.href = 'book-appointment.html'; });
    sync(); steps.forEach(function (p) { p.hidden = +p.getAttribute('data-step-panel') !== 1; });
  }

  /* ---------- contact form ---------- */
  function initContactForm() {
    var f = $('[data-contact-form]'); if (!f) return;
    var err = $('[data-error]', f), ok = $('[data-success]');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = f.name.value.trim(), phone = f.phone.value;
      if (!name) { err.textContent = 'Please enter your name.'; err.hidden = false; f.name.focus(); return; }
      if (!validPhone(phone)) { err.textContent = 'Please enter a valid 10-digit mobile number.'; err.hidden = false; f.phone.focus(); return; }
      err.hidden = true;
      $('[data-out-name]', ok).textContent = name;
      $('[data-out-phone]', ok).textContent = '+91 ' + digits(phone);
      $('[data-wa]', ok).href = waLink('Hello Al Noor Hospital,\nName: ' + name + '\nMobile: ' + digits(phone) + (f.department.value ? '\nDepartment: ' + f.department.value : '') + (f.message.value.trim() ? '\nMessage: ' + f.message.value.trim() : ''));
      f.hidden = true; ok.hidden = false;
    });
    $('[data-reset]', ok).addEventListener('click', function () { f.reset(); ok.hidden = true; f.hidden = false; });
  }

  /* ---------- footer year ---------- */
  function initYear() { $$('[data-year]').forEach(function (y) { y.textContent = new Date().getFullYear(); }); }

  document.addEventListener('DOMContentLoaded', function () {
    initHeader(); initReveal(); initBookingWidget(); initSideBooking(); initDoctorFilter(); initBookingFlow(); initContactForm(); initYear();
  });
})();

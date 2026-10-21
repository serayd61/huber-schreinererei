(function () {
  "use strict";

  // Jahr in der Fusszeile
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  // Mobile Navigation
  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Menü schliessen" : "Menü öffnen");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  // Sanftes Scrollen mit Rücksicht auf die feste Kopfzeile
  var head = document.querySelector(".site-head");
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href").slice(1);
      if (!id) return;
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      var offset = head ? head.offsetHeight + 8 : 0;
      var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: top, behavior: reduce ? "auto" : "smooth" });
      if (history.pushState) history.pushState(null, "", "#" + id);
    });
  });

  // Formular: Prüfung im Browser, Versand an Supabase.
  var form = document.getElementById("offerteForm");
  var status = document.getElementById("formStatus");
  if (!form) return;

  function setError(input, msg) {
    var field = input.closest(".field");
    if (!field) return;
    var err = field.querySelector(".error");
    if (!err) {
      err = document.createElement("p");
      err.className = "error";
      field.appendChild(err);
    }
    err.textContent = msg;
    field.classList.toggle("invalid", !!msg);
  }

  function validate() {
    var ok = true;
    var name = form.elements.name;
    var phone = form.elements.phone;
    var email = form.elements.email;
    var message = form.elements.message;

    setError(name, name.value.trim() ? "" : "Bitte Ihren Namen angeben.");
    setError(phone, phone.value.replace(/\D/g, "").length >= 9 ? "" : "Bitte eine gültige Telefonnummer angeben.");
    setError(email, !email.value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value) ? "" : "Bitte eine gültige E-Mail-Adresse angeben.");
    setError(message, message.value.trim().length >= 10 ? "" : "Bitte Ihr Vorhaben in ein paar Worten beschreiben.");

    var first = form.querySelector(".field.invalid input, .field.invalid textarea");
    if (first) { first.focus(); ok = false; }
    return ok;
  }

  // Versand an Supabase (Tabelle offerte_anfragen, nur INSERT für anonyme Besucher erlaubt).
  var SUPABASE_URL = "https://fwhfqbsheitlcorhhtwv.supabase.co";
  var SUPABASE_KEY = "sb_publishable_frGtndCLJgVtXXcDHHQP3w_gbTGHA41";

  function setBusy(busy) {
    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = busy;
    btn.textContent = busy ? "Wird gesendet" : "Offerte anfragen";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    status.className = "form-status";
    status.textContent = "";
    if (!validate()) {
      status.className = "form-status err";
      status.textContent = "Bitte die markierten Felder prüfen.";
      return;
    }
    if (form.elements["bot-field"] && form.elements["bot-field"].value) return; // Honeypot

    var f = form.elements;
    var payload = {
      name: f.name.value.trim(),
      phone: f.phone.value.trim(),
      email: f.email.value.trim() || null,
      service: f.service.value,
      message: f.message.value.trim(),
      page_url: location.href.slice(0, 300),
      user_agent: navigator.userAgent.slice(0, 400)
    };

    setBusy(true);
    fetch(SUPABASE_URL + "/rest/v1/offerte_anfragen", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      window.location.href = "danke";
    }).catch(function () {
      setBusy(false);
      status.className = "form-status err";
      status.textContent = "Senden hat nicht geklappt. Bitte rufen Sie uns an: 062 871 14 64, oder schreiben Sie an info@schreinerei-huber.ch.";
    });
  });

  // Fehler beim Tippen zurücksetzen
  form.addEventListener("input", function (e) {
    if (e.target.closest(".field.invalid")) setError(e.target, "");
  });
})();

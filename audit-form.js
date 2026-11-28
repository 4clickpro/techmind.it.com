/*
 * Free AI Visibility Audit form (progressive enhancement).
 *
 * The <form id="audit-form"> works as plain HTML (POST to its action).
 * This script upgrades it to an in-page fetch() submit with accessible
 * success / error messages. No dependencies, no cookies, no storage.
 *
 * The form endpoint lives ONLY in the form's `action` attribute. While it
 * still contains the FORM_ID placeholder the script refuses to send, so a
 * lead can never be silently lost to a dead endpoint.
 */
(function () {
  'use strict';

  var form = document.getElementById('audit-form');
  if (!form || !('fetch' in window) || !('FormData' in window)) return;

  var emailInput = document.getElementById('audit-email');
  var websiteInput = document.getElementById('audit-website');
  var honeypot = form.querySelector('input[name="_gotcha"]');
  var button = form.querySelector('button[type="submit"]');
  var success = document.getElementById('audit-form-success');
  var error = document.getElementById('audit-form-error');
  var idleLabel = button ? button.textContent : '';
  var FALLBACK_EMAIL = 'd5jygddg@mail.grokbot.com';

  function clearMessages() {
    [success, error].forEach(function (el) {
      el.textContent = '';
      el.className = 'text-sm';
    });
    [emailInput, websiteInput].forEach(function (input) {
      input.removeAttribute('aria-invalid');
    });
  }

  function show(el, text, tone, focus) {
    el.textContent = text;
    el.className = 'text-sm mt-3 ' + tone;
    if (focus) {
      el.setAttribute('tabindex', '-1');
      el.focus();
    }
  }

  function fail(text, input) {
    show(error, text, 'text-red-300', !input);
    if (input) {
      input.setAttribute('aria-invalid', 'true');
      input.focus();
    }
  }

  function normalizeWebsite(raw) {
    var value = String(raw || '').trim();
    if (!value) return null;
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) value = 'https://' + value;
    try {
      var url = new URL(value);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
      if (url.hostname.indexOf('.') === -1) return null;
      return url.href;
    } catch (e) {
      return null;
    }
  }

  function setBusy(busy) {
    form.setAttribute('aria-busy', busy ? 'true' : 'false');
    if (button) {
      button.disabled = busy;
      button.textContent = busy ? 'Sending\u2026' : idleLabel;
    }
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    clearMessages();

    var email = String(emailInput.value || '').trim();
    if (!email || !emailInput.checkValidity()) {
      fail('Please enter a valid email address.', emailInput);
      return;
    }
    var website = normalizeWebsite(websiteInput.value);
    if (!website) {
      fail('Please enter your website address, for example example.com.', websiteInput);
      return;
    }

    // Honeypot: a human never fills this in. Pretend success, send nothing.
    if (honeypot && honeypot.value) {
      form.reset();
      show(success, 'Thanks! We have your request.', 'text-emerald-300', true);
      return;
    }

    var endpoint = form.getAttribute('action') || '';
    if (!endpoint || endpoint.indexOf('FORM_ID') !== -1) {
      fail('This form is not connected yet. Please email ' + FALLBACK_EMAIL + ' with your website address.');
      return;
    }

    setBusy(true);
    var controller = 'AbortController' in window ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 15000) : null;

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email: email, website_url: website, _gotcha: '' }),
      signal: controller ? controller.signal : undefined
    })
      .then(function (response) {
        if (!response.ok) throw new Error('status ' + response.status);
        form.reset();
        show(
          success,
          'Thanks! We have your AI Visibility Audit request and will contact you at the email you gave us.',
          'text-emerald-300',
          true
        );
      })
      .catch(function () {
        fail('Sorry, that did not go through. Please try again, or email ' + FALLBACK_EMAIL + ' with your website address.');
      })
      .then(function () {
        if (timer) clearTimeout(timer);
        setBusy(false);
      });
  });
})();

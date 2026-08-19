/* main.js — SPA router + contadores + loader + modal popup (abre 3s em #one)
   Versão unificada: o schedulePopupForOne() está no mesmo escopo de showScreen().
*/
(function () {
  const __t = (k, fallback) => (window.__APP && typeof window.__APP.t === 'function') ? window.__APP.t(k) : (fallback || k);

  const getWithdrawMethod = () => {
    const app = window.__APP || {};
    return app.withdrawSelected || app.withdraw || "BANK";
  };
  /* ---------------------------
       Variáveis / helpers de modal
       --------------------------- */
  let modalTimer = null;
  let activeModalId = null;

  function showModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;

    activeModalId = id;
    modal.classList.add("is-modal", "is-active");
    modal.removeAttribute("aria-hidden");

    // Captura a posição atual do scroll APENAS se ainda não estiver travado
    if (!document.body.classList.contains("modal-open")) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";

      document.body.classList.add("modal-open");
      document.documentElement.classList.add("modal-open");
    }

    // Habilita o botão .btn-sacar em #one somente quando o primeiro popup (id="two") abrir
    if (id === "two") {
      const btnOneSacar = document.querySelector(
        "#one .container-saldo .btn-sacar"
      );
      if (btnOneSacar) {
        btnOneSacar.removeAttribute("disabled");
        btnOneSacar.style.pointerEvents = "auto";
        btnOneSacar.style.opacity = "";
      }

      // Anima o contador do popup quando ele for exibido
      setTimeout(() => {
        const popupCounter = modal.querySelector(
          ".valor-currency[data-amount-target]"
        );
        if (
          popupCounter &&
          typeof window.animateCurrencyCounter === "function"
        ) {
          const app = window.__APP || {};
          const locale = app.locale || "en";
          const currency = app.currency || "EUR";
          popupCounter.textContent = new Intl.NumberFormat(locale, { style: "currency", currency }).format(0);
          window.animateCurrencyCounter(popupCounter, true);
        }
      }, 50);
    }

    // overlay click: DESABILITADO - popups só fecham por botões específicos
    function overlayClickHandler(ev) {
      // Nenhum popup fecha ao clicar fora
      // Todos os popups só fecham através de botões específicos
      return;
    }
    modal.addEventListener("click", overlayClickHandler);
    modal._overlayHandler = overlayClickHandler;

    // fechar por botões com data-modal-close
    const closeButtons = Array.from(
      modal.querySelectorAll("[data-modal-close]")
    );
    modal._closeButtonHandlers = closeButtons.map((btn) => {
      const h = (ev) => {
        ev && ev.preventDefault();
        closeModal(id);
      };
      btn.addEventListener("click", h);
      return { btn, h };
    });

    // foco para primeiro elemento do modal
    const focusable = modal.querySelector(
      'button, a, input, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable) focusable.focus();
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;

    if (modal._overlayHandler)
      modal.removeEventListener("click", modal._overlayHandler);
    if (modal._closeButtonHandlers) {
      modal._closeButtonHandlers.forEach(({ btn, h }) =>
        btn.removeEventListener("click", h)
      );
    }

    modal.classList.remove("is-active", "is-modal");
    modal.setAttribute("aria-hidden", "true");

    // Verifica se ainda existe algum modal aberto
    const remainingModals = document.querySelectorAll(
      ".screen.is-modal.is-active"
    );
    if (remainingModals.length === 0) {
      // Só destrava se não houver mais nenhum modal
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, parseInt(scrollY || "0") * -1);

      document.body.classList.remove("modal-open");
      document.documentElement.classList.remove("modal-open");
    }

    activeModalId = null;

    // foco volta pra #one se existir
    const screenOne = document.getElementById("one");
    if (screenOne) {
      const f = screenOne.querySelector(
        'button, a, input, [tabindex]:not([tabindex="-1"])'
      );
      if (f) f.focus();
    }
  }

  function schedulePopupForOne() {
    clearModalTimer();
    modalTimer = setTimeout(() => {
      const one = document.getElementById("one");
      if (one && one.classList.contains("is-active")) {
        showModal("two");
      }
    }, 0);
  }

  function clearModalTimer() {
    if (modalTimer) {
      clearTimeout(modalTimer);
      modalTimer = null;
    }
  }

  // limpa timer ao sair da página
  window.addEventListener("beforeunload", clearModalTimer);

  /* ---------------------------
     Contadores (evergreen) — mantidos
     --------------------------- */
  function iniciarContadorInline(tempoTotal) {
    const timerElement = document.getElementById("timer");
    const textElement = document.getElementById("countdown-text");
    if (!timerElement || !textElement) return;

    let tempoRestante = tempoTotal;
    let contador = setInterval(() => {
      if (tempoRestante < 0) {
        clearInterval(contador);
        textElement.textContent = "SEU SALDO EXPIROU";
        return;
      }
      let minutos = Math.floor(tempoRestante / 60);
      let segundos = tempoRestante % 60;
      timerElement.textContent = `00 - ${String(minutos).padStart(
        2,
        "0"
      )} - ${String(segundos).padStart(2, "0")}`;
      tempoRestante--;
    }, 1000);
  }

  function iniciarContadorPopup(tempoTotal) {
    const todosOsTimersPopup = document.querySelectorAll(".expira-em-popup");
    if (!todosOsTimersPopup.length) return;

    todosOsTimersPopup.forEach((timerContainer, index) => {
      const minutesElement = timerContainer.querySelector(
        '[data-timer="minutes"]'
      );
      const secondsElement = timerContainer.querySelector(
        '[data-timer="seconds"]'
      );
      const labelElement = timerContainer.querySelector(".timer-label");
      if (!minutesElement || !secondsElement || !labelElement) return;

      let tempoRestante = tempoTotal;
      let contador = setInterval(() => {
        if (tempoRestante < 0) {
          clearInterval(contador);
          labelElement.textContent = __t('timer.expired', 'Caducado');
          minutesElement.textContent = "00";
          secondsElement.textContent = "00";
          return;
        }
        let minutos = Math.floor(tempoRestante / 60);
        let segundos = tempoRestante % 60;
        minutesElement.textContent = String(minutos).padStart(2, "0");
        secondsElement.textContent = String(segundos).padStart(2, "0");
        tempoRestante--;
      }, 1000);
    });
  }

  /* ---------------------------
     Loader (barra de progresso)
     --------------------------- */
  /* ---------------------------
     Loader (barra de progresso)
     --------------------------- */
  let loaderState = {
    timeouts: [],
    interval: null,
  };

  function resetLoader() {
    const loadingText = document.getElementById("loading-text");
    const progressBar = document.getElementById("progress-bar");
    if (!loadingText || !progressBar) return;

    // Clear all scheduled timeouts
    loaderState.timeouts.forEach((t) => clearTimeout(t));
    loaderState.timeouts = [];

    if (loaderState.interval) {
      clearInterval(loaderState.interval);
      loaderState.interval = null;
    }

    // Reset UI
    progressBar.style.transition = "none";
    progressBar.style.width = "0%";
    loadingText.textContent = "Starting...";
    loadingText.style.opacity = "1";
  }

  function startLoader() {
    const loadingText = document.getElementById("loading-text");
    const progressBar = document.getElementById("progress-bar");
    if (!loadingText || !progressBar) return;

    resetLoader(); // Ensure clean state

    const steps = [
      { text: __t('loader.validating', 'Validando tu información'), progress: 25 },
      { text: __t('loader.withdrawing', 'Completando retiro'), progress: 50 },
      { text: __t('loader.processing', 'Procesando transacción'), progress: 75 },
      { text: __t('loader.finishing', 'Finalizando'), progress: 100 },
    ];
    const stepDuration = 3000,
      textFadeDuration = 400,
      dotAnimationSpeed = 800;

    let currentStep = 0;

    // Restore transition
    // Force reflow before adding transition back
    void progressBar.offsetWidth;
    progressBar.style.transition = `width ${stepDuration / 1000}s linear`;

    function scheduleNextStep() {
      if (currentStep < steps.length) {
        if (loaderState.interval) clearInterval(loaderState.interval);

        loadingText.style.opacity = 0;

        const t1 = setTimeout(() => {
          const step = steps[currentStep];
          const baseText = step.text;
          loadingText.textContent = baseText;
          // Calcula a largura considerando o padding de 20px de cada lado
          const containerWidth = progressBar.parentElement.offsetWidth - 40; // 20px de cada lado
          progressBar.style.width =
            (containerWidth * step.progress) / 100 + "px";
          loadingText.style.opacity = 1;

          let dotCount = 0;
          loaderState.interval = setInterval(() => {
            dotCount = (dotCount % 3) + 1;
            loadingText.textContent = baseText + ".".repeat(dotCount);
          }, dotAnimationSpeed);

          currentStep++;
          const t2 = setTimeout(scheduleNextStep, stepDuration);
          loaderState.timeouts.push(t2);
        }, textFadeDuration);
        loaderState.timeouts.push(t1);
      } else {
        if (loaderState.interval) clearInterval(loaderState.interval);
        loadingText.style.opacity = 0;

        const t3 = setTimeout(() => {
          loadingText.textContent = "Withdrawal completed!";
          loadingText.style.opacity = 1;
        }, textFadeDuration);
        loaderState.timeouts.push(t3);
      }
    }

    // Start
    const tStart = setTimeout(scheduleNextStep, 500);
    loaderState.timeouts.push(tStart);
  }

  // Expose globally
  window.startLoader = startLoader;
  window.resetLoader = resetLoader;

  /* ---------------------------
     Nova animação de loading (#seven)
     --------------------------- */
  /* ---------------------------
     Nova animação de loading (#seven)
     --------------------------- */
  let newLoadingState = {
    interval: null,
    timeouts: [],
  };

  function startNewLoadingAnimation() {
    const loadingText = document.getElementById("new-loading-text");
    const progressBar = document.getElementById("new-progress-bar");

    if (!loadingText || !progressBar) return;

    // Reset state
    resetNewLoadingAnimation();

    // Force faster transition to match new speed
    progressBar.style.transition = "width 1.3s ease-in-out";

    const texts = [
      __t("loading.steps.validating"),
      __t("loading.steps.connecting"),
      __t("loading.steps.finishing"),
      __t("loading.steps.almost"),
    ];

    // Set initial text immediately
    loadingText.textContent = texts[0];

    let currentIndex = 0;
    const totalSteps = texts.length;
    const progressPerStep = 100 / totalSteps;

    function updateProgress() {
      const progress = (currentIndex + 1) * progressPerStep;
      progressBar.style.width = `${progress}%`;
    }

    // Inicializar progresso
    updateProgress();

    function changeText() {
      loadingText.style.opacity = 0;

      const t1 = setTimeout(() => {
        currentIndex++;
        loadingText.textContent = texts[currentIndex];
        loadingText.style.opacity = 1;

        // Atualizar progresso com transição suave
        updateProgress();
      }, 150);
      newLoadingState.timeouts.push(t1);
    }

    // Loop de textos
    newLoadingState.interval = setInterval(() => {
      if (currentIndex >= totalSteps - 1) {
        // Chegou no último passo ("Quase pronto...")
        clearInterval(newLoadingState.interval);

        // Finaliza e redireciona
        const tEnd = setTimeout(() => {
          if (typeof window.showScreen === "function") {
            window.showScreen("nine");
          } else {
            location.hash = "#nine";
          }
        }, 700);
        newLoadingState.timeouts.push(tEnd);
        return;
      }
      changeText();
    }, 1600);
  }

  function resetNewLoadingAnimation() {
    const loadingText = document.getElementById("new-loading-text");
    const progressBar = document.getElementById("new-progress-bar");

    if (newLoadingState.interval) {
      clearInterval(newLoadingState.interval);
      newLoadingState.interval = null;
    }
    newLoadingState.timeouts.forEach((t) => clearTimeout(t));
    newLoadingState.timeouts = [];

    if (loadingText) {
      loadingText.textContent = "Validating access...";
      loadingText.style.opacity = 1;
    }
    if (progressBar) {
      progressBar.style.transition = "none";
      progressBar.style.width = "0%";
      // Força reflow
      void progressBar.offsetWidth;
      progressBar.style.transition =
        "width 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
    }
  }

  // Expose globally
  window.startNewLoadingAnimation = startNewLoadingAnimation;
  window.resetNewLoadingAnimation = resetNewLoadingAnimation;

  /* ---------------------------
     Função para preencher página de confirmação (#nine)
     --------------------------- */
  function fillConfirmationPage() {
    // Tenta pegar do objeto global ou do localStorage
    let formData = window.__formData;
    if (!formData) {
      try {
        const stored = localStorage.getItem("userPixData");
        if (stored) {
          formData = JSON.parse(stored);
        }
      } catch (e) {
        console.error("Erro ao ler localStorage", e);
      }
    }

    if (!formData) return;

    // Função para formatar data atual
    function getCurrentDate() {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, "0");
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const year = now.getFullYear();
      return `${day}/${month}/${year}`;
    }

    // Preenche o nome
    const nameElement = document.getElementById("confirmation-name");
    if (nameElement && formData.nome) {
      nameElement.textContent = formData.nome;
    }

    // Preenche a data atual
    const dateElement = document.getElementById("confirmation-date");
    if (dateElement) {
      dateElement.textContent = getCurrentDate();
    }

    const method = formData.method || "PIX";

    // Ajusta el label del 3º campo del comprovante ("Clave de transferencia") para el método actual
    const keyTypeElement = document.getElementById("confirmation-key-type");
    if (keyTypeElement) {
      const item = keyTypeElement.closest(".confirmation-receipt-item");
      const labelEl = item ? item.querySelector(".confirmation-receipt-label") : null;
      const t = (window.__APP && typeof window.__APP.t === "function") ? window.__APP.t : (k => k);

      if (method === "PIX") {
        if (labelEl) labelEl.textContent = __t("confirmation.receipt.pix_key", "Clave de transferencia");
        let val = formData.tipoChave || "";
        // Se ainda for o placeholder, mostra "Transferencia"
        if (val.includes("Elija") || val.includes("Escolha") || !val) val = "Transferencia";
        keyTypeElement.textContent = val;
      } else if (method === "IBAN") {
        if (labelEl) labelEl.textContent = "IBAN";
        keyTypeElement.textContent = t("withdraw.method.iban", "Transferencia bancaria (IBAN)");
      } else if (method === "BANK") {
        if (labelEl) labelEl.textContent = "Cuenta";
        keyTypeElement.textContent = t("withdraw.method.bank", "Transferencia bancaria");
      } else if (method === "PAYPAL") {
        if (labelEl) labelEl.textContent = "PayPal";
        keyTypeElement.textContent = t("withdraw.method.paypal", "PayPal");
      } else if (method === "UK") {
        if (labelEl) labelEl.textContent = "Bank (UK)";
        keyTypeElement.textContent = "Sort code + Account";
      } else {
        if (labelEl) labelEl.textContent = "Método";
        keyTypeElement.textContent = t(`withdraw.method.${method.toLowerCase()}`, method);
      }
    }

    // Preenche o identificador digitado (PIX key / IBAN / Email / etc.)
    const pixKeyElement = document.getElementById("confirmation-pix-key");
    if (pixKeyElement && (formData.value || formData.chavePix)) {
      // O valor já deve estar formatado do input, mas garante formatação se necessário
      let formattedKey = formData.value || formData.chavePix;

      if (method === "UK") {
        const sc = (formData.sortCode || "").replace(/\D/g, "");
        const acc = (formData.value || "").replace(/\D/g, "");
        formattedKey = `Sort code: ${sc} • Account: ${acc}`;
      } else if ((method === "PIX" || method === "IBAN" || method === "BANK") && formData.tipoChave === "CPF") {
        // Se não estiver formatado, formata
        if (!formattedKey.includes(".") && !formattedKey.includes("-")) {
          const cleanCPF = formattedKey.replace(/\D/g, "");
          if (cleanCPF.length === 11) {
            formattedKey = cleanCPF
              .replace(/(\d{3})(\d)/, "$1.$2")
              .replace(/(\d{3})(\d)/, "$1.$2")
              .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
          }
        }
      } else if ((method === "PIX" || method === "IBAN" || method === "BANK") && formData.tipoChave === "Celular") {
        // Formata celular se necessário (opcional, geralmente já vem formatado)
        const cleanPhone = formattedKey.replace(/\D/g, "");
        if (
          cleanPhone.length >= 10 &&
          cleanPhone.length <= 11 &&
          !formattedKey.includes("(")
        ) {
          if (cleanPhone.length === 11) {
            formattedKey = cleanPhone.replace(
              /(\d{2})(\d{5})(\d{4})/,
              "($1) $2-$3"
            );
          } else if (cleanPhone.length === 10) {
            formattedKey = cleanPhone.replace(
              /(\d{2})(\d{4})(\d{4})/,
              "($1) $2-$3"
            );
          }
        }
      }
      // Para e-mail/IBAN, mantém como está

      pixKeyElement.textContent = formattedKey;
    }
  }

  // Expose globally
  window.fillConfirmationPage = fillConfirmationPage;

  /* ---------------------------
     SPA Router (inicia screens e navegação)
     --------------------------- */
  function initRouter() {
    const screens = Array.from(document.querySelectorAll("#screens .screen"));
    if (!screens.length) return;

    function showScreen(id, push = true) {
      const target = document.getElementById(id);
      if (!target) {
        console.warn(`Tela "${id}" não encontrada.`);
        return;
      }

      screens.forEach((s) => {
        if (s === target) {
          s.classList.add("is-active");
          s.removeAttribute("aria-hidden");
        } else {
          s.classList.remove("is-active");
          s.setAttribute("aria-hidden", "true");
        }
      });

      if (push) {
        try {
          history.pushState({ screen: id }, "", "#" + id);
        } catch (e) {
          location.hash = id;
        }
      }

      // Scroll to top when showing a new screen
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      // Para #nine, força scroll para o topo após renderização
      if (id === "nine") {
        // Scroll imediato
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

        // Scroll novamente após renderização para garantir
        setTimeout(() => {
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
          const nineElement = document.getElementById("nine");
          if (nineElement) {
            nineElement.scrollTop = 0;
            // Também força scroll no container se houver
            const container = nineElement.querySelector(
              ".confirmation-container"
            );
            if (container) {
              container.scrollTop = 0;
            }
          }
        }, 100);
      }

      const focusable = target.querySelector(
        'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable) focusable.focus({ preventScroll: true });

      // >>> Aqui garantimos que o popup seja agendado quando entrarmos em #one
      if (id === "one") {
        schedulePopupForOne();
      } else {
        clearModalTimer();

        // Garante que o sticky popup suma ao sair da #one
        const stickyPopup = document.getElementById("popup-um");
        if (stickyPopup) {
          stickyPopup.classList.remove("is-visible");
        }

        // Se for para #seven, fecha todos os modais e inicia novo loader
        if (id === "seven") {
          const modalIds = ["two", "four", "five", "six"];
          modalIds.forEach((modalId) => {
            const modal = document.getElementById(modalId);
            if (modal && modal.classList.contains("is-modal")) {
              closeModal(modalId);
            }
          });
          // Inicia a nova animação de loading
          if (typeof startNewLoadingAnimation === "function") {
            startNewLoadingAnimation();
          }
        } else {
          // Se não for #seven, reseta o loader
          if (typeof window.resetLoader === "function") {
            window.resetLoader();
          }

          // Reseta a nova animação de loading se estiver ativa
          if (typeof resetNewLoadingAnimation === "function") {
            resetNewLoadingAnimation();
          }

          if (activeModalId) {
            closeModal(activeModalId);
          }
        }
      }

      // Anima contador da tela #three quando ela for exibida
      if (
        id === "three" &&
        typeof window.animateCurrencyCounter === "function"
      ) {
        // Usa um timeout maior para garantir que a tela está totalmente renderizada
        // e cancela qualquer timeout anterior para evitar múltiplas animações
        if (target._threeAnimationTimeout) {
          clearTimeout(target._threeAnimationTimeout);
        }
        target._threeAnimationTimeout = setTimeout(() => {
          const threeCounter = target.querySelector(
            ".valor-currency[data-amount-target]"
          );
          if (threeCounter) {
            // Garante que o elemento ainda está visível antes de animar
            if (target.classList.contains("is-active")) {
              window.animateCurrencyCounter(threeCounter, true); // true = forceReset
            }
          }
          target._threeAnimationTimeout = null;
        }, 100);
      }

      // Preenche dados na página de confirmação (#nine) quando ela for exibida
      if (id === "nine") {
        // Garante que a página apareça no topo
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

        // Preenche imediatamente para evitar flash de conteúdo vazio
        fillConfirmationPage();

        setTimeout(() => {
          // Força scroll para o topo novamente após renderização
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
          const nineElement = document.getElementById("nine");
          if (nineElement) {
            nineElement.scrollTop = 0;
          }

          // Animação do saldo (pode ficar no timeout ou fora, mas fora é mais garantido de iniciar logo)
          const confirmationBalance = document.querySelector(
            ".confirmation-balance-amount[data-amount-target]"
          );
          if (
            confirmationBalance &&
            typeof window.animateCurrencyCounter === "function"
          ) {
            window.animateCurrencyCounter(confirmationBalance, true);
          }
        }, 150);
      }
    }

    window.addEventListener("popstate", (ev) => {
      const id =
        (ev.state && ev.state.screen) ||
        location.hash.replace("#", "") ||
        screens[0].id;
      showScreen(id, /*push*/ false);
    });

    // inicial: usa hash ou primeira screen
    const initial = location.hash.replace("#", "") || screens[0].id;
    showScreen(initial, /*push*/ false);

    // expõe globalmente se precisar (útil pra debugging)
    window.showScreen = showScreen;
  }

  // Se preferir JS: torna o botão .btn-sacar um link para a screen 'three'

  document.addEventListener("DOMContentLoaded", () => {
    const btnSacar =
      document.querySelector("#one .container-saldo .btn-sacar") ||
      document.querySelector(".btn-sacar");
    if (btnSacar) {
      btnSacar.addEventListener("click", function (ev) {
        ev.preventDefault();
        // fecha modal/timers caso haja algum aberto (opcional)
        if (typeof clearModalTimer === "function") clearModalTimer();
        if (typeof closeModal === "function" && activeModalId)
          closeModal(activeModalId);

        // usa a função global do router para trocar de tela
        if (typeof window.showScreen === "function") {
          window.showScreen("three");
        } else {
          // fallback: altera hash
          location.hash = "#three";
        }
      });
    }
  });

  /* ---------------------------
     Inicialização
     --------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    initRouter();

    // iniciadores de contador (evergreen) — ajuste o tempo aqui se quiser
    const tempoInicialEmSegundos = 16 * 60 + 38;
    iniciarContadorInline(tempoInicialEmSegundos);
    iniciarContadorPopup(tempoInicialEmSegundos);

    // initLoaderIfExists(); // Removido para iniciar apenas no #seven

    initStickyPopup();

    // Garante que o popup inicial seja agendado se estivermos na #one
    const currentHash = location.hash.replace("#", "") || "one";
    if (currentHash === "one") {
      schedulePopupForOne();
    }
  });

  /* ---------------------------
     Sticky Popup Logic
     --------------------------- */
  function initStickyPopup() {
    const saldoSection = document.querySelector("#one .saldo");
    const stickyPopup = document.getElementById("popup-um");
    const screenOne = document.getElementById("one");

    if (!saldoSection || !stickyPopup || !screenOne) return;

    // Configura botão de sacar do popup para funcionar igual ao principal
    const btnSacarPopup = stickyPopup.querySelector(".btn-sacar");
    if (btnSacarPopup) {
      btnSacarPopup.addEventListener("click", (ev) => {
        ev.preventDefault();
        if (typeof window.showScreen === "function") {
          window.showScreen("three");
        } else {
          location.hash = "#three";
        }
      });
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Se .saldo NÃO está intersectando (saiu da tela) E #one está ativo
          if (
            !entry.isIntersecting &&
            screenOne.classList.contains("is-active")
          ) {
            stickyPopup.classList.add("is-visible");
          } else {
            stickyPopup.classList.remove("is-visible");
          }
        });
      },
      {
        threshold: 0, // Dispara assim que qualquer parte sair/entrar
        rootMargin: "-50px 0px 0px 0px", // Ajuste fino para disparar um pouco antes de sumir totalmente
      }
    );

    observer.observe(saldoSection);

    // Expõe para ser usado no router
    window.__stickyObserver = observer;
  }

  // expõe helpers para caso queira manipular modal manualmente em console
  window.__spa_modal_helpers = {
    schedulePopupForOne,
    clearModalTimer,
    showModal,
    closeModal,
  };

  /* ===== Delegação para botões que fecham modal (funciona mesmo se botão não tiver listener) ===== */
  document.body.addEventListener("click", function (ev) {
    const btn = ev.target.closest("[data-modal-close]");
    if (!btn) return;
    ev.preventDefault();

    // procura o modal ancestor (section com class "screen")
    const modalAncestor = btn.closest(".screen");
    const modalId = modalAncestor ? modalAncestor.id : "two";

    // Se closeModal estiver no escopo (dentro da IIFE), usa diretamente.
    // Caso use outra instância, tenta o helper exposto window.__spa_modal_helpers.closeModal
    if (typeof closeModal === "function") {
      closeModal(modalId);
    } else if (
      window.__spa_modal_helpers &&
      typeof window.__spa_modal_helpers.closeModal === "function"
    ) {
      window.__spa_modal_helpers.closeModal(modalId);
    } else {
      // fallback: tenta esconder a section manualmente
      const modalEl = document.getElementById(modalId);
      if (modalEl) {
        modalEl.classList.remove("is-active", "is-modal");
        modalEl.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
      }
    }
  });

  /* ===== Delegação para abrir modais (pix-item abre #five) ===== */
  /* ===== Delegação para abrir modais (pix-item abre #five) ===== */
  document.body.addEventListener("click", function (ev) {
    const opener = ev.target.closest("[data-open-modal]");
    if (!opener) return;

    const modalId = opener.getAttribute("data-open-modal");
    if (!modalId) return;

    ev.preventDefault();
    ev.stopPropagation();

    // Se clicou em um método de saque (ex: IBAN / PayPal), salva o método antes de abrir o form
    if (modalId === "five") {
      const m = opener.getAttribute("data-withdraw-method");
      if (m && window.__APP && typeof window.__APP.setWithdrawMethod === "function") {
        window.__APP.setWithdrawMethod(m);
      } else if (m && window.__APP) {
        window.__APP.withdrawSelected = m;
      }
    }

    // Lógica específica para abrir o modal de seleção de tipo (#six)
    if (modalId === "six") {
      if (getWithdrawMethod() !== "PIX" && getWithdrawMethod() !== "IBAN" && getWithdrawMethod() !== "BANK") return;
      const selectorText = document.getElementById("pix-selector-text");
      if (selectorText) {
        const currentType = selectorText.textContent.trim();

        // Mapeamento de Texto -> ID do Radio
        const typeToId = {
          CPF: "key-cpf",
          "E-mail": "key-email",
          Celular: "key-celular",
          "Chave Aleatória": "key-aleatoria",
        };

        const radioId = typeToId[currentType];
        if (radioId) {
          const radio = document.getElementById(radioId);
          if (radio) radio.checked = true;
        }
      }
    }

    // Abre o modal usando a função showModal
    if (typeof showModal === "function") {
      showModal(modalId);
    } else if (
      window.__spa_modal_helpers &&
      typeof window.__spa_modal_helpers.showModal === "function"
    ) {
      window.__spa_modal_helpers.showModal(modalId);
    }
  });

  // Suporte para tecla Enter no pix-item (acessibilidade)
  document.body.addEventListener("keydown", function (ev) {
    if (ev.key !== "Enter" && ev.key !== " ") return;

    const opener = ev.target.closest("[data-open-modal]");
    if (!opener) return;

    const modalId = opener.getAttribute("data-open-modal");
    if (!modalId) return;

    ev.preventDefault();
    ev.stopPropagation();

    if (modalId === "five") {
      const m = opener.getAttribute("data-withdraw-method");
      if (m && window.__APP && typeof window.__APP.setWithdrawMethod === "function") {
        window.__APP.setWithdrawMethod(m);
      } else if (m && window.__APP) {
        window.__APP.withdrawSelected = m;
      }
    }

    if (modalId === "six" && getWithdrawMethod() !== "PIX" && getWithdrawMethod() !== "IBAN" && getWithdrawMethod() !== "BANK") return;

    if (typeof showModal === "function") {
      showModal(modalId);
    } else if (
      window.__spa_modal_helpers &&
      typeof window.__spa_modal_helpers.showModal === "function"
    ) {
      window.__spa_modal_helpers.showModal(modalId);
    }
  });

  /* ===== Função para fechar todos os modais abertos ===== */
  function closeAllModals() {
    const modalIds = ["two", "four", "five", "six"];
    modalIds.forEach((modalId) => {
      const modal = document.getElementById(modalId);
      if (modal && modal.classList.contains("is-modal")) {
        if (typeof closeModal === "function") {
          closeModal(modalId);
        } else if (
          window.__spa_modal_helpers &&
          typeof window.__spa_modal_helpers.closeModal === "function"
        ) {
          window.__spa_modal_helpers.closeModal(modalId);
        } else {
          // fallback: fecha manualmente
          modal.classList.remove("is-active", "is-modal");
          modal.setAttribute("aria-hidden", "true");
          document.body.classList.remove("modal-open");
        }
      }
    });
    activeModalId = null;
  }

  /* ===== Lógica de Selección de Clave y Validación ===== */

  // Helpers de Validação
  function validateCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, "");
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    let soma = 0,
      resto;
    for (let i = 1; i <= 9; i++)
      soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++)
      soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(cpf.substring(10, 11));
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validatePhone(phone) {
    const cleanPhone = phone.replace(/\D/g, "");
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  }

  function validateRandomKey(key) {
    // Validação simplificada de UUID (32 hex chars + 4 hifens = 36 chars)
    // Formato: 8-4-4-4-12
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
      key
    );
  }

  // Função de validação geral
  function validateIBAN(iban) {
    const clean = String(iban || "").replace(/\s+/g, "").toUpperCase();
    if (clean.length < 15 || clean.length > 34) return false;
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(clean)) return false;
    return true;
  }

  function validateSortCode(code) {
    const c = String(code || "").replace(/\D/g, "");
    return c.length === 6;
  }

  function validateAccountNumber(num) {
    const n = String(num || "").replace(/\D/g, "");
    return n.length >= 6 && n.length <= 10;
  }

  function checkWithdrawFormValidity() {
    const nomeInput = document.getElementById("nome");
    const keyInput = document.getElementById("pix-key-input");
    const selectorText = document.getElementById("pix-selector-text");
    const btnEnviar = document.getElementById("btn-enviar-pix");

    if (!nomeInput || !keyInput || !selectorText || !btnEnviar) return;

    const isNomeFilled = nomeInput.value.trim().length > 0;
    const method = getWithdrawMethod();
    const keyValue = keyInput.value.trim();

    // PIX / BANK
    if (method === "PIX" || method === "IBAN" || method === "BANK") {
      const selectedType = selectorText ? selectorText.textContent.trim() : "";
      const isTypeSelected = selectedType &&
        !selectedType.includes("Elija") &&
        !selectedType.includes("Escolha");
      let isKeyValid = false;

      if (isTypeSelected && keyValue.length > 0) {
        switch (selectedType) {
          case "CPF":
            isKeyValid = validateCPF(keyValue);
            break;
          case "E-mail":
            isKeyValid = validateEmail(keyValue);
            break;
          case "Celular":
            isKeyValid = validatePhone(keyValue);
            break;
          case "Chave Aleatória":
            isKeyValid = validateRandomKey(keyValue);
            break;
          default:
            isKeyValid = keyValue.length > 0;
        }
      }

      if (isNomeFilled && isTypeSelected && isKeyValid) {
        btnEnviar.classList.remove("btn-disabled");
      } else {
        btnEnviar.classList.add("btn-disabled");
      }
      return;
    }

    // PayPal
    if (method === "PAYPAL") {
      const ok = isNomeFilled && validateEmail(keyValue);
      btnEnviar.classList.toggle("btn-disabled", !ok);
      return;
    }

    // UK
    if (method === "UK") {
      const sortCode = document.getElementById("sortCode");
      const ok = isNomeFilled && validateSortCode(sortCode ? sortCode.value : "") && validateAccountNumber(keyValue);
      btnEnviar.classList.toggle("btn-disabled", !ok);
      return;
    }

    // IBAN
    if (method === "IBAN") {
      const ok = isNomeFilled && validateIBAN(keyValue);
      btnEnviar.classList.toggle("btn-disabled", !ok);
      return;
    }

    // BANK (genérico)
    const ok = isNomeFilled && keyValue.length > 3;
    btnEnviar.classList.toggle("btn-disabled", !ok);
    return;
  }

  // Listeners para validação em tempo real
  const nomeInput = document.getElementById("nome");
  if (nomeInput) {
    nomeInput.addEventListener("input", checkWithdrawFormValidity);
  }

  // Sort code (UK) - pode ser inserido dinamicamente
  document.body.addEventListener("input", function (ev) {
    if (ev && ev.target && ev.target.id === "sortCode") {
      checkWithdrawFormValidity();
    }
  });

  // 1. Seleção do Tipo de Chave (no popup #six)
  document.body.addEventListener("click", function (ev) {
    const optionRow = ev.target.closest("#six .option-row");
    if (!optionRow) return;

    if (getWithdrawMethod() !== "PIX" && getWithdrawMethod() !== "IBAN" && getWithdrawMethod() !== "BANK") return;

    ev.preventDefault();
    ev.stopPropagation();

    // Pega o texto da opção selecionada (ex: CPF, E-mail...)
    const optionTextEl = optionRow.querySelector(".option-text");
    const selectedType = optionTextEl
      ? optionTextEl.textContent.trim()
      : "Chave";

    // Atualiza o texto do seletor na tela #five
    const selectorText = document.getElementById("pix-selector-text");
    if (selectorText) {
      selectorText.textContent = selectedType;
      selectorText.style.color = "#000"; // Opcional: mudar cor para indicar seleção
    }

    // Habilita o input de chave
    const keyInput = document.getElementById("pix-key-input");
    const keyWrapper = document.getElementById("pix-key-wrapper");

    if (keyInput) {
      keyInput.value = ""; // Limpa o campo ao trocar o tipo
      keyInput.removeAttribute("disabled");
      keyInput.classList.remove("input-disabled");
      keyInput.focus();
    }

    if (keyWrapper) {
      keyWrapper.classList.remove("input-wrapper-disabled");
    }

    // Remove estado de erro do seletor se houver
    const selector = document.getElementById("pix-type-selector");
    if (selector) {
      selector.classList.remove("input-error", "shake-animation");
    }

    // Revalida o formulário após seleção
    checkWithdrawFormValidity();

    // Fecha o modal de seleção (#six)
    // Nota: não fecha todos, apenas o #six para voltar ao #five
    if (typeof closeModal === "function") {
      closeModal("six");
    } else if (
      window.__spa_modal_helpers &&
      typeof window.__spa_modal_helpers.closeModal === "function"
    ) {
      window.__spa_modal_helpers.closeModal("six");
    }
  });

  // 2. Feedback visual ao tentar clicar no input desabilitado
  document.body.addEventListener("click", function (ev) {
    // Verifica se clicou no wrapper do input desabilitado
    const wrapper = ev.target.closest("#pix-key-wrapper");
    if (!wrapper) return;

    if (getWithdrawMethod() !== "PIX" && getWithdrawMethod() !== "IBAN" && getWithdrawMethod() !== "BANK") return;

    // Se o input estiver desabilitado (wrapper tem a classe)
    if (wrapper.classList.contains("input-wrapper-disabled")) {
      const selector = document.getElementById("pix-type-selector");
      if (selector) {
        // Remove classes para reiniciar animação se já estiver rodando
        selector.classList.remove("shake-animation", "input-error");

        // Força reflow
        void selector.offsetWidth;

        // Adiciona classes de erro e animação
        selector.classList.add("input-error", "shake-animation");

        // Remove a animação depois que terminar
        setTimeout(() => {
          selector.classList.remove("shake-animation");
        }, 500);
      }
    }
  });

  // 3. Validação e Envio (Botão Enviar no #five)
  document.body.addEventListener("click", function (ev) {
    const btnEnviar = ev.target.closest("#btn-enviar-pix");
    if (!btnEnviar) return;

    ev.preventDefault();

    // Se o botão estiver desabilitado, executa validação visual (shake)
    if (btnEnviar.classList.contains("btn-disabled")) {
      const nomeInput = document.getElementById("nome");
      const selector = document.getElementById("pix-type-selector");
      const selectorText = document.getElementById("pix-selector-text");
      const keyInput = document.getElementById("pix-key-input");
      const method = getWithdrawMethod();

      // 1. Valida Nome
      if (nomeInput && nomeInput.value.trim() === "") {
        nomeInput.classList.remove("shake-animation", "input-error");
        void nomeInput.offsetWidth; // force reflow
        nomeInput.classList.add("input-error", "shake-animation");
        setTimeout(() => nomeInput.classList.remove("shake-animation"), 500);
      }

      // 2/3. Validação por método
      if (method === "PIX" || method === "IBAN" || method === "BANK") {
        const isTypeSelected = selectorText &&
          !selectorText.textContent.trim().includes("Elija") &&
          !selectorText.textContent.trim().includes("Escolha");
        if (!isTypeSelected && selector) {
          selector.classList.remove("shake-animation", "input-error");
          void selector.offsetWidth;
          selector.classList.add("input-error", "shake-animation");
          setTimeout(() => selector.classList.remove("shake-animation"), 500);
        }

        if (isTypeSelected && keyInput) {
          const keyValue = keyInput.value.trim();
          let isKeyValid = false;
          const selectedType = selectorText.textContent.trim();
          switch (selectedType) {
            case "CPF":
              isKeyValid = validateCPF(keyValue);
              break;
            case "E-mail":
              isKeyValid = validateEmail(keyValue);
              break;
            case "Celular":
              isKeyValid = validatePhone(keyValue);
              break;
            case "Chave Aleatória":
              isKeyValid = validateRandomKey(keyValue);
              break;
            default:
              isKeyValid = keyValue.length > 0;
          }

          if (!isKeyValid) {
            keyInput.classList.remove("shake-animation", "input-error");
            void keyInput.offsetWidth;
            keyInput.classList.add("input-error", "shake-animation");
            keyInput.focus();
            setTimeout(() => keyInput.classList.remove("shake-animation"), 500);
          }
        }
      } else {
        // Métodos não-PIX: valida o campo principal
        if (keyInput) {
          const v = keyInput.value.trim();
          let ok = v.length > 0;
          if (method === "PAYPAL") ok = validateEmail(v);
          if (method === "IBAN") ok = validateIBAN(v);
          if (method === "UK") ok = validateAccountNumber(v);

          if (!ok) {
            keyInput.classList.remove("shake-animation", "input-error");
            void keyInput.offsetWidth;
            keyInput.classList.add("input-error", "shake-animation");
            keyInput.focus();
            setTimeout(() => keyInput.classList.remove("shake-animation"), 500);
          }
        }

        // UK: valida sort code também
        if (method === "UK") {
          const sortCode = document.getElementById("sortCode");
          if (sortCode && !validateSortCode(sortCode.value)) {
            sortCode.classList.remove("shake-animation", "input-error");
            void sortCode.offsetWidth;
            sortCode.classList.add("input-error", "shake-animation");
            setTimeout(() => sortCode.classList.remove("shake-animation"), 500);
          }
        }
      }

      return; // Impede envio
    }

    // Se passou (botão habilitado), prossegue
    const nomeInput = document.getElementById("nome");
    const keyInput = document.getElementById("pix-key-input");
    const selectorText = document.getElementById("pix-selector-text");
    const method = getWithdrawMethod();

    // Captura os dados do formulário
    const formData = {
      nome: nomeInput ? nomeInput.value.trim() : "",
      method,
      tipoChave: (method === "PIX" || method === "IBAN" || method === "BANK") && selectorText ? selectorText.textContent.trim() : "",
      value: keyInput ? keyInput.value.trim() : "",
      sortCode: method === "UK" ? (document.getElementById("sortCode") ? document.getElementById("sortCode").value.trim() : "") : "",
    };

    // Armazena os dados para usar na página de confirmação
    window.__formData = formData;

    // Salva também no localStorage para persistência
    try {
      localStorage.setItem("userPixData", JSON.stringify(formData));
    } catch (e) {
      console.error("Erro ao salvar no localStorage", e);
    }

    // Sucesso: Fecha modais e vai para #seven
    closeAllModals();

    if (typeof window.showScreen === "function") {
      window.showScreen("seven");
    } else {
      location.hash = "#seven";
    }
  });

  // Helpers de Formatação (Máscaras)
  function formatPixKey(value, type) {
    if (!value) return "";

    if (type === "CPF") {
      value = value.replace(/\D/g, ""); // Remove tudo que não é dígito
      if (value.length > 11) value = value.slice(0, 11); // Limita a 11 dígitos

      // Aplica máscara: 000.000.000-00
      return value
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }

    if (type === "Celular") {
      value = value.replace(/\D/g, ""); // Remove tudo que não é dígito
      if (value.length > 11) value = value.slice(0, 11); // Limita a 11 dígitos

      // Aplica máscara: (00) 00000-0000
      if (value.length > 10) {
        return value.replace(/^(\d\d)(\d{5})(\d{4}).*/, "($1) $2-$3");
      } else if (value.length > 6) {
        return value.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, "($1) $2-$3");
      } else if (value.length > 2) {
        return value.replace(/^(\d\d)(\d{0,5})/, "($1) $2");
      } else {
        return value.replace(/^(\d*)/, "($1");
      }
    }

    if (type === "Chave Aleatória") {
      // Remove tudo que não é hex
      value = value.replace(/[^0-9a-fA-F]/g, "");
      if (value.length > 32) value = value.slice(0, 32); // Limita a 32 chars hex

      // Aplica máscara UUID: 8-4-4-4-12
      // xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      let result = "";
      if (value.length > 0) result += value.slice(0, 8);
      if (value.length > 8) result += "-" + value.slice(8, 12);
      if (value.length > 12) result += "-" + value.slice(12, 16);
      if (value.length > 16) result += "-" + value.slice(16, 20);
      if (value.length > 20) result += "-" + value.slice(20, 32);

      return result;
    }

    return value;
  }

  // 4. Restrição de caracteres e Máscaras no input
  const pixKeyInput = document.getElementById("pix-key-input");
  if (pixKeyInput) {
    pixKeyInput.addEventListener("input", function (ev) {
      // Máscaras só fazem sentido para PIX / BANK com campos conhecidos
      if (getWithdrawMethod() !== "PIX" && getWithdrawMethod() !== "IBAN" && getWithdrawMethod() !== "BANK") {
        // Revalida o formulário para outros métodos
        if (typeof checkWithdrawFormValidity === "function") checkWithdrawFormValidity();
        return;
      }
      const selectorText = document.getElementById("pix-selector-text");
      if (!selectorText) return;

      const selectedType = selectorText.textContent.trim();

      // Aplica formatação
      const formattedValue = formatPixKey(this.value, selectedType);

      // Atualiza o valor apenas se mudou (evita loop ou problemas de cursor em alguns casos simples)
      if (this.value !== formattedValue) {
        this.value = formattedValue;
      }

      // Revalida o formulário
      checkWithdrawFormValidity();
    });
  }
})();

/* =========================
   Anima valor e controla active dos botões em #three
   Cole este bloco dentro do seu main.js, idealmente dentro de DOMContentLoaded
   ========================= */

(function () {
  // --- helper: formata número como moeda EUR ---
  function formatEUR(value) {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  }

  // --- helper: converte "€ 723,30" -> number (723.30) ---
  function parseEUR(text) {
    if (!text) return 0;
    // remove tudo exceto dígitos e vírgula/ponto
    // suporta formatos: "€ 723,30" ou "723.30"
    const cleaned = String(text)
      .replace(/\s/g, "")
      .replace(/[€$R]/g, "") // remove símbolos de moeda
      .replace(/\./g, "") // remove separador de milhar
      .replace(/,/g, "."); // troca vírgula decimal para ponto
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }

  // --- anima número de 0 até target (ou de start -> target) ---
  function animateNumberTo(el, targetNumber, duration = 1400, startNumber = 0) {
    if (!el) return;
    const start = performance.now();
    const end = start + duration;
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      // easeOutQuad
      const eased = 1 - (1 - t) * (1 - t);
      const current = startNumber + (targetNumber - startNumber) * eased;
      el.textContent = formatEUR(current);
      if (now < end) {
        requestAnimationFrame(tick);
      } else {
        // garante valor final exato
        el.textContent = formatEUR(targetNumber);
      }
    }
    requestAnimationFrame(tick);
  }

  // --- encontra o elemento do valor na section three ---
  function findAmountElement() {
    // tenta vários seletores comuns (ajuste se quiser)
    const selectors = [
      "#three .valor", // se existir
      "#three .popup-valor",
      "#three .amount",
      "#three .big-valor",
      "#three .valor-principal",
      "#three .saldo-valor",
      "#three .valor-total",
      "#three [data-amount-target]", // data attribute
      "#three .amount-target",
      "#three h1 .valor",
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    // fallback: busca qualquer texto de moeda dentro de #three
    const three = document.getElementById("three");
    if (!three) return null;
    // procura por nós que contenham "€"
    const nodes = three.querySelectorAll("*");
    for (const n of nodes) {
      if (n.children.length === 0 && /[€$]\s*\d/.test(n.textContent || "")) {
        return n;
      }
    }
    return null;
  }

  // --- gerencia botões da linha .botoes-row-sacar ---

  function initBotoesRowSacar() {
    const container =
      document.querySelector("#three .botoes-row-sacar") ||
      document.querySelector(".botoes-row-sacar");
    if (!container) return;

    const buttons = Array.from(
      container.querySelectorAll('button, [role="button"], a')
    );

    // incluir manualmente o botão display-total
    const displayTotal = document.querySelector(".display-total");
    if (displayTotal) buttons.push(displayTotal);

    const activeClass = "btn-active";
    const sacarBtn = document.querySelector(".btn-sacar-dois");

    // começa bloqueado
    // quando o botão sacar estiver ativo e for clicado
    if (sacarBtn) {
      sacarBtn.addEventListener("click", () => {
        // só abre se estiver liberado
        if (!sacarBtn.classList.contains("btn-sacar-indisponivel")) {
          if (typeof window.__spa_modal_helpers.showModal === "function") {
            window.__spa_modal_helpers.showModal("four");
          } else {
            showModal("four"); // fallback caso esteja no escopo
          }
        }
      });
    }

    function removeActive() {
      buttons.forEach((btn) => btn.classList.remove(activeClass));
    }

    // === LISTENER CORRETO (somente 1 vez) ===
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        removeActive();
        btn.classList.add(activeClass);

        // liberar o botão SACAR imediatamente
        if (sacarBtn) {
          sacarBtn.classList.remove("btn-sacar-indisponivel");
          sacarBtn.removeAttribute("disabled");
          sacarBtn.style.pointerEvents = "auto";
          sacarBtn.style.opacity = "1";
        }
      });
    });

    // limpa o estado inicial
    removeActive();
  }

  // --- função principal a ser chamada quando #three for exibida ---
  function onShowThree() {
    // 1) animar valor - DESABILITADO: agora usamos animateCurrencyCounter unificada
    // A animação é feita diretamente no showScreen do router principal
    /*
    const amountEl = findAmountElement();
    if (amountEl) {
      // tenta ler target em data-target (ex: data-amount-target="723.30")
      let target = null;
      if (amountEl.dataset && amountEl.dataset.amountTarget) {
        target = parseFloat(amountEl.dataset.amountTarget);
      }
      if (target === null || isNaN(target)) {
        target = parseEUR(amountEl.textContent || amountEl.innerText);
      }
      // se não encontrou, ignore
      if (!isNaN(target) && target > 0) {
        // opcional: começar mostrando 0 formatado imediatamente
        amountEl.textContent = formatEUR(0);
        animateNumberTo(amountEl, target, 1400, 0);
      }
    }
    */

    // 2) init botoes
    initBotoesRowSacar();
  }

  // --- Hook: se seu router expõe showScreen, intercepta chamadas para 'three' ---
  // Se showScreen for global (como no main.js que usamos), monkey-patch para rodar onShowThree sempre que #three for mostrado.
  if (window.showScreen && typeof window.showScreen === "function") {
    const originalShowScreen = window.showScreen;
    window.showScreen = function (id, push) {
      originalShowScreen(id, push);
      if (String(id) === "three") {
        // pequeno timeout para dar tempo ao DOM ser mostrado/estilos aplicados
        setTimeout(onShowThree, 30);
      }
    };
  } else {
    // fallback: quando DOMContentLoaded e se já estiver em #three, executa
    document.addEventListener("DOMContentLoaded", () => {
      if (location.hash.replace("#", "") === "three") {
        setTimeout(onShowThree, 30);
      }
    });
  }

  // também expõe manualmente para caso queira disparar por console:
  window.__spa_helpers = window.__spa_helpers || {};
  window.__spa_helpers.onShowThree = onShowThree;
})();

// DESABILITADO: Agora usamos a função unificada animateCurrencyCounter
// que é chamada diretamente no showScreen do router principal
/*
// === Count-up robusto para #three (usa data-amount-target) ===
(function () {
  // evita múltiplas execuções
  let threeAnimated = false;

  function formatEUR(value) {
    return value.toLocaleString("es-ES", {
      style: "currency",
      currency: "EUR",
    });
  }

  function animateCountUp(el, target, duration = 1400) {
    if (!el) return;
    const start = performance.now();
    const from = 0;
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) * (1 - t); // easeOutQuad
      const current = from + (target - from) * eased;
      el.textContent = formatEUR(current);
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = formatEUR(target);
    }
    requestAnimationFrame(step);
  }

  function startCountUpThree() {
    // se já animou e você não quer repetir, pare aqui
    if (threeAnimated) return;
    const el = document.querySelector("#three [data-amount-target]");
    if (!el) return;
    const raw = el.getAttribute("data-amount-target");
    const target = parseFloat(raw);
    if (isNaN(target)) return;
    // mostra zero imediatamente e anima
    el.textContent = formatEUR(0);
    // pequeno timeout para garantir estilos aplicados / repaint
    setTimeout(() => animateCountUp(el, target, 1400), 30);
    threeAnimated = true;
  }

  // 1) Hook no showScreen (se existir)
  if (window.showScreen && typeof window.showScreen === "function") {
    const orig = window.showScreen;
    window.showScreen = function (id, push) {
      orig(id, push);
      if (String(id) === "three") {
        // reseta flag se quiser re-animar cada vez -> threeAnimated = false;
        startCountUpThree();
      }
    };
  }

  // 2) MutationObserver no próprio #three para detectar classes (fallback)
  const threeEl = document.getElementById("three");
  if (threeEl) {
    const mo = new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === "attributes" && r.attributeName === "class") {
          if (threeEl.classList.contains("is-active")) {
            startCountUpThree();
            break;
          }
        }
      }
    });
    mo.observe(threeEl, { attributes: true, attributeOldValue: true });
  }

  // 3) Caso já esteja ativa no carregamento (ex.: #three no hash), dispara agora
  document.addEventListener("DOMContentLoaded", () => {
    const threeNow = document.getElementById("three");
    if (threeNow && threeNow.classList.contains("is-active")) {
      // aguarda um tick para garantir render
      setTimeout(startCountUpThree, 20);
    }
  });

  // opcional: expor função para forçar re-execução via console
  window.__countup_helpers = window.__countup_helpers || {};
  window.__countup_helpers.startCountUpThree = function (force) {
    if (force) threeAnimated = false;
    startCountUpThree();
  };
})();
*/

// apaga akiiiiiiiiiiiiiiiii

/* ===== Count-up definitivo para o span em #three ===== */
(function () {
  const SEL = "#three .valor-currency-dois[data-amount-target]";

  function formatEUR(value) {
    return value.toLocaleString("es-ES", {
      style: "currency",
      currency: "EUR",
    });
  }

  function animateCountUpEl(el, target, duration = 1400) {
    if (!el) return;
    const startVal = 0;
    const startTime = performance.now();
    function step(now) {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - (1 - t) * (1 - t); // easeOutQuad
      const current = startVal + (target - startVal) * eased;
      el.textContent = formatEUR(current);
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = formatEUR(target); // garante valor final exato
    }
    requestAnimationFrame(step);
  }

  function triggerCountUp() {
    const el = document.querySelector(SEL);
    if (!el) return;
    const raw = el.getAttribute("data-amount-target");
    const target = parseFloat(raw);
    if (isNaN(target)) return;
    // zera e anima
    el.textContent = formatEUR(0);
    // timeout pequeno para garantir repaint antes da animação
    setTimeout(() => animateCountUpEl(el, target, 1400), 20);
  }

  // DESABILITADO: Agora usamos a função unificada animateCurrencyCounter
  // que é chamada diretamente no showScreen do router principal
  /*
  // 1) Hook no showScreen (se existir) — re-anima sempre que for para #three
  if (window.showScreen && typeof window.showScreen === "function") {
    const orig = window.showScreen;
    window.showScreen = function (id, push) {
      orig(id, push);
      if (String(id) === "three") {
        // força re-animação a cada entrada
        triggerCountUp();
      }
    };
  }

  // 2) MutationObserver no próprio #three (fallback para outros fluxos)
  const threeEl = document.getElementById("three");
  if (threeEl) {
    const mo = new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === "attributes" && r.attributeName === "class") {
          if (threeEl.classList.contains("is-active")) triggerCountUp();
        }
      }
    });
    mo.observe(threeEl, { attributes: true });
  }
  */

  // 3) Se já estiver ativa no carregamento (ex.: hash = #three), dispara agora
  document.addEventListener("DOMContentLoaded", () => {
    const threeNow = document.getElementById("three");
    if (threeNow && threeNow.classList.contains("is-active")) {
      setTimeout(triggerCountUp, 20);
    }
  });

  // expõe helper para testar no console: window.__countup.trigger(true)
  window.__countup = window.__countup || {};
  window.__countup.trigger = function (force) {
    if (force) {
      // força zerar e re-rodar
      const el = document.querySelector(SEL);
      if (el) el.textContent = formatEUR(0);
    }
    triggerCountUp();
  };
})();

// apaga abaixo

document.addEventListener("DOMContentLoaded", function () {
  // Garante que o SPA já inicializou o router
  setTimeout(() => {
    if (window.showScreen) {
      const originalShowScreen = window.showScreen;

      window.showScreen = function (id, push) {
        originalShowScreen(id, push);

        if (id === "three") {
          setTimeout(() => {
            if (window.__spa_helpers && window.__spa_helpers.onShowThree) {
              window.__spa_helpers.onShowThree();
            }
          }, 30);
        }
      };
    }
  }, 100);
});

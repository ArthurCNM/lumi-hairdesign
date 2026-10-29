(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Configurações do salão (edite aqui)
  // ---------------------------------------------------------------------------
  const WHATSAPP_NUMBER = "558198173239";
  const SALON_TIMEZONE = "America/Recife";

  // 0 = domingo ... 6 = sábado. Cada dia: [hora de abertura, hora de fechamento].
  const SCHEDULE = {
    2: [10, 19],
    3: [10, 19],
    4: [10, 19],
    5: [10, 19],
    6: [10, 19],
  };

  const DAY_NAMES = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  // ---------------------------------------------------------------------------
  // Funções puras (sem DOM)
  // ---------------------------------------------------------------------------

  // Dia da semana e minutos desde a meia-noite no fuso do salão,
  // não no do visitante.
  function getSalonTime(date) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: SALON_TIMEZONE,
      weekday: "short",
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
    }).formatToParts(date);
    const get = (type) => parts.find((part) => part.type === type).value;
    return {
      day: WEEKDAY_INDEX[get("weekday")],
      minutes: Number(get("hour")) * 60 + Number(get("minute")),
    };
  }

  function getOpenStatus(date = new Date()) {
    const { day, minutes } = getSalonTime(date);
    const today = SCHEDULE[day];

    if (today && minutes >= today[0] * 60 && minutes < today[1] * 60) {
      return { open: true, text: `Aberto agora · até ${today[1]}h` };
    }
    if (today && minutes < today[0] * 60) {
      return { open: false, text: `Fechado agora · abre hoje às ${today[0]}h` };
    }
    for (let ahead = 1; ahead <= 7; ahead++) {
      const next = (day + ahead) % 7;
      if (SCHEDULE[next]) {
        const when = ahead === 1 ? "amanhã" : DAY_NAMES[next];
        return { open: false, text: `Fechado agora · abre ${when} às ${SCHEDULE[next][0]}h` };
      }
    }
    return { open: false, text: "Fechado agora" };
  }

  function whatsappUrl(service) {
    const message = service
      ? `Olá! Gostaria de agendar ${service.toLowerCase()} na Lumi Hairdesign. Quais horários vocês têm disponíveis?`
      : "Olá! Gostaria de agendar um horário na Lumi Hairdesign.";
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { getOpenStatus, whatsappUrl };
  }
  if (typeof document === "undefined") return;

  // ---------------------------------------------------------------------------
  // WhatsApp: cada botão de agendar abre a conversa com a mensagem pronta.
  // Sem JavaScript, os links continuam levando à seção de contato.
  // ---------------------------------------------------------------------------
  function setupWhatsApp() {
    document.querySelectorAll("[data-whatsapp]").forEach((link) => {
      link.href = whatsappUrl(link.dataset.whatsapp);
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      const label = link.getAttribute("aria-label");
      if (label && !/whatsapp/i.test(label)) {
        link.setAttribute("aria-label", `${label} pelo WhatsApp`);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // "Aberto agora" no card de horário
  // ---------------------------------------------------------------------------
  function setupOpenStatus() {
    const element = document.querySelector("[data-open-status]");
    if (!element) return;

    function render() {
      try {
        const status = getOpenStatus();
        element.textContent = status.text;
        element.classList.toggle("is-open", status.open);
        element.hidden = false;
      } catch (error) {
        element.hidden = true; // navegador sem suporte a fusos: some em vez de errar
      }
    }

    render();
    setInterval(render, 60 * 1000);
  }

  // ---------------------------------------------------------------------------
  // Cabeçalho (fundo ao rolar), menu mobile, link ativo e botão flutuante
  // ---------------------------------------------------------------------------
  function setupNavigation() {
    const header = document.querySelector(".site-header");
    if (!header) return;

    const toggle = header.querySelector(".menu-toggle");
    const floatButton = document.querySelector(".whatsapp-float");
    let currentSection = "";

    function setMenu(open) {
      header.classList.toggle("menu-open", open);
      if (toggle) {
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
      }
    }

    if (toggle) {
      toggle.addEventListener("click", () => {
        setMenu(!header.classList.contains("menu-open"));
      });

      header.querySelectorAll(".nav-links a").forEach((link) => {
        link.addEventListener("click", () => setMenu(false));
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && header.classList.contains("menu-open")) {
          setMenu(false);
          toggle.focus();
        }
      });

      document.addEventListener("click", (event) => {
        if (!header.contains(event.target)) setMenu(false);
      });

      window.matchMedia("(min-width: 651px)").addEventListener("change", (event) => {
        if (event.matches) setMenu(false);
      });
    }

    function update() {
      const scrolled = window.scrollY > 24;
      header.classList.toggle("is-scrolled", scrolled);

      if (floatButton) {
        const show = window.scrollY > 480 && currentSection !== "contato";
        floatButton.classList.toggle("is-visible", show);
      }
    }

    window.addEventListener("scroll", update, { passive: true });
    update();

    // Marca no menu a seção que está no meio da tela.
    if ("IntersectionObserver" in window) {
      const links = new Map();
      header.querySelectorAll('.nav-links a[href^="#"]').forEach((link) => {
        links.set(link.getAttribute("href").slice(1), link);
      });

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            currentSection = entry.target.id;
            links.forEach((link, id) => {
              if (id === currentSection) {
                link.setAttribute("aria-current", "location");
              } else {
                link.removeAttribute("aria-current");
              }
            });
            update();
          });
        },
        { rootMargin: "-45% 0px -54% 0px" }
      );

      document.querySelectorAll("main > section").forEach((section) => observer.observe(section));
    }
  }

  // ---------------------------------------------------------------------------
  // Revelação ao rolar. Cada grupo é [seletor, escalonar?]: com escalonamento,
  // os itens do grupo entram um depois do outro. O hero fica de fora (usa só CSS).
  // ---------------------------------------------------------------------------
  const REVEAL_GROUPS = [
    [".intro-inner > *", true],
    [".section-heading > *", true],
    [".service-card", true],
    [".about-image", false],
    [".about-copy > *", true],
    [".quote-inner > *", true],
    [".contact-map", false],
    [".contact-card", true],
    [".contact-social", false],
  ];
  const REVEAL_STEP = 0.09; // segundos entre um item e o próximo
  const REVEAL_CLEANUP = 1400; // ms: depois disso o elemento volta ao CSS normal

  function setupReveal() {
    if (!("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets = [];
    REVEAL_GROUPS.forEach(([selector, stagger]) => {
      document.querySelectorAll(selector).forEach((element, index) => {
        element.setAttribute("data-reveal", "");
        if (stagger) element.style.setProperty("--reveal-delay", `${index * REVEAL_STEP}s`);
        targets.push(element);
      });
    });

    function reveal(element) {
      element.classList.add("is-visible");
      // Terminada a animação, devolve o elemento ao CSS normal: assim o hover
      // dos cards e outras transições não herdam o estado de revelação.
      setTimeout(() => {
        element.removeAttribute("data-reveal");
        element.classList.remove("is-visible");
        element.style.removeProperty("--reveal-delay");
      }, REVEAL_CLEANUP);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Quem já ficou para trás (página aberta no meio, por exemplo) aparece sem esperar.
          if (!entry.isIntersecting && entry.boundingClientRect.top >= 0) return;
          observer.unobserve(entry.target);
          reveal(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    targets.forEach((element) => observer.observe(element));
    document.documentElement.classList.add("reveal-ready");
  }

  setupWhatsApp();
  setupOpenStatus();
  setupNavigation();
  setupReveal();
})();

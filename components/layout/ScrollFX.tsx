"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/* Mesmos observadores do protótipo: revelação, contadores e barras das fatias. */

function countNum(
  el: HTMLElement,
  to: number,
  {
    pre = "",
    suf = "",
    dec = 0,
    dur = 1400,
  }: { pre?: string; suf?: string; dec?: number; dur?: number },
) {
  const t0 = performance.now();
  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    });
  (function f(t: number) {
    const k = Math.min(1, (t - t0) / dur);
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = pre + fmt(to * e) + suf;
    if (k < 1) requestAnimationFrame(f);
  })(t0);
}

export default function ScrollFX() {
  const pathname = usePathname();

  useEffect(() => {
    const $$ = (s: string) => [...document.querySelectorAll<HTMLElement>(s)];

    const ioReveal = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            ioReveal.unobserve(e.target);
          }
        }),
      { threshold: 0.15 },
    );
    $$("[data-reveal]").forEach((el) => ioReveal.observe(el));

    const ioCount = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement & { dataset: DOMStringMap };
          if (el.dataset.done) return;
          el.dataset.done = "1";
          countNum(el, parseFloat(el.dataset.count || "0"), {
            pre: el.dataset.pre || "",
            suf: el.dataset.suf || "",
            dec: parseInt(el.dataset.dec || "0"),
            dur: 1500,
          });
          ioCount.unobserve(el);
        }),
      { threshold: 0.4 },
    );
    $$("[data-count]").forEach((el) => ioCount.observe(el));

    const ioFita = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          const i = e.target as HTMLElement;
          i.style.width = i.dataset.w + "%";
          ioFita.unobserve(i);
        }),
      { threshold: 0.5 },
    );
    $$(".fatia-bar i[data-w]").forEach((el) => ioFita.observe(el));

    /* Elementos [data-reveal] que entram no DOM depois da montagem
       (cards re-renderizados pelos filtros de /vaquinhas, painel de
       sucesso dos formulários…) também precisam ser observados —
       senão ficam invisíveis (opacity 0) para sempre. Valem os dois
       casos: nó novo (childList) e nó reusado por React que só ganha
       o atributo (ex.: div.vt-grid que vira div.vt-vazio). */
    const registrar = (el: Node) => {
      if (el instanceof HTMLElement && el.hasAttribute("data-reveal"))
        ioReveal.observe(el);
    };
    const moReveal = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === "attributes") {
          registrar(m.target);
          continue;
        }
        for (const n of m.addedNodes) {
          if (!(n instanceof HTMLElement)) continue;
          registrar(n);
          n.querySelectorAll("[data-reveal]").forEach(registrar);
        }
      }
    });
    moReveal.observe(document.body, {
      childList: true,
      subtree: true,
      attributeFilter: ["data-reveal"],
    });

    return () => {
      ioReveal.disconnect();
      ioCount.disconnect();
      ioFita.disconnect();
      moReveal.disconnect();
    };
  }, [pathname]);

  return null;
}

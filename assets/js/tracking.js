window.LACARI_TRACKING_CONFIG = {
    googleTagManagerId: 'GTM-KDSGXGST',
    googleAdsId: '',
    googleAdsConversionLabel: '',
    metaPixelId: ''
};

(function () {
    const config = window.LACARI_TRACKING_CONFIG || {};
    const hasValue = value => typeof value === 'string' && value.trim() && !value.includes('XXXX');

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = window.gtag || gtag;

    function loadScript(src, id) {
        if (id && document.getElementById(id)) return;
        const script = document.createElement('script');
        script.async = true;
        script.src = src;
        if (id) script.id = id;
        document.head.appendChild(script);
    }

    function addClinicalReviewNotice() {
        if (document.querySelector('[data-clinical-review]')) return;
        const path = window.location.pathname;
        const isEducationalPage = path.includes('/blog/') || /-itaquera\.html$/.test(path) || path.includes('tratamento-de-canal-sem-dor');
        if (!isEducationalPage) return;

        const main = document.querySelector('main');
        if (!main) return;

        const section = document.createElement('section');
        section.className = 'section section-soft';
        section.setAttribute('data-clinical-review', 'true');
        section.innerHTML = `
            <div class="container">
                <div class="landing-card">
                    <h2>Informação revisada pela equipe clínica</h2>
                    <p>Conteúdo educativo revisado pela Dra. Tamara de Souza La Puma, cirurgiã-dentista da LaCari Odontologia.</p>
                    <p>As informações não substituem consulta, exame clínico ou diagnóstico individual. Resultados e indicações variam conforme cada paciente.</p>
                    <p><strong>Atualizado em:</strong> 22 de julho de 2026 · <a href="/sobre.html">Conheça a clínica</a> · <a href="/politica-editorial.html">Política editorial</a></p>
                </div>
            </div>`;
        main.appendChild(section);
    }

    function addLocalAreaNavigation() {
        if (document.querySelector('[data-local-navigation]')) return;
        const filename = window.location.pathname.split('/').pop() || '';
        const isLocalPage = filename.startsWith('dentista-') && filename !== 'dentista-em-itaquera.html' && filename !== 'dentista-infantil-itaquera.html';
        if (!isLocalPage) return;

        const main = document.querySelector('main');
        if (!main) return;

        const section = document.createElement('section');
        section.className = 'section section-soft';
        section.setAttribute('data-local-navigation', 'true');
        section.innerHTML = `
          <div class="container">
            <div class="content-link-strip">
              <div>
                <strong>Atendimento na Avenida Pires do Rio, em Itaquera</strong>
                <span>A LaCari possui um único endereço no Jardim Norma. Consulte outras regiões atendidas e confirme a rota antes de sair.</span>
              </div>
              <div class="inline-actions">
                <a href="/areas-atendidas.html" class="btn btn-light">Ver bairros atendidos</a>
                <a href="/dentista-em-itaquera.html" class="btn btn-primary">Conhecer a clínica</a>
              </div>
            </div>
          </div>`;
        main.appendChild(section);
    }

    function applyTechnicalEnhancements() {
        document.documentElement.classList.add('js');
        document.querySelectorAll('a[target="_blank"]').forEach(link => {
            const rel = new Set((link.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
            rel.add('noopener');
            rel.add('noreferrer');
            link.setAttribute('rel', Array.from(rel).join(' '));
        });
        document.querySelectorAll('img').forEach((image, index) => {
            if (!image.hasAttribute('decoding')) image.setAttribute('decoding', 'async');
            if (!image.hasAttribute('loading') && index > 0 && !image.closest('.landing-hero, .hero')) image.setAttribute('loading', 'lazy');
        });
        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) {
            const canonicalUrl = new URL(canonical.href, window.location.origin);
            canonicalUrl.hostname = 'clinicalacari.com.br';
            canonicalUrl.protocol = 'https:';
            canonical.href = canonicalUrl.href;
        }
        addLocalAreaNavigation();
        addClinicalReviewNotice();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyTechnicalEnhancements, { once: true });
    else applyTechnicalEnhancements();

    if (hasValue(config.googleTagManagerId)) {
        window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
        loadScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(config.googleTagManagerId)}`, 'lacari-gtm');
    }
    if (hasValue(config.googleAdsId)) {
        loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.googleAdsId)}`, 'lacari-google-ads');
        window.gtag('js', new Date());
        window.gtag('config', config.googleAdsId);
    }
    if (hasValue(config.metaPixelId)) {
        window.fbq = window.fbq || function () { window.fbq.callMethod ? window.fbq.callMethod.apply(window.fbq, arguments) : window.fbq.queue.push(arguments); };
        if (!window._fbq) window._fbq = window.fbq;
        window.fbq.push = window.fbq;
        window.fbq.loaded = true;
        window.fbq.version = '2.0';
        window.fbq.queue = [];
        loadScript('https://connect.facebook.net/en_US/fbevents.js', 'lacari-meta-pixel');
        window.fbq('init', config.metaPixelId);
        window.fbq('track', 'PageView');
    }

    window.lacariTrack = function (eventName, params = {}) {
        const payload = { event: eventName, page_path: window.location.pathname, page_title: document.title, ...params };
        window.dataLayer.push(payload);
        if (typeof window.gtag === 'function') {
            window.gtag('event', eventName, payload);
            if ((eventName === 'whatsapp_click' || eventName === 'form_submit') && hasValue(config.googleAdsId) && hasValue(config.googleAdsConversionLabel)) {
                window.gtag('event', 'conversion', { send_to: `${config.googleAdsId}/${config.googleAdsConversionLabel}`, event_category: 'lead', event_label: eventName });
            }
        }
        if (typeof window.fbq === 'function') {
            if (eventName === 'whatsapp_click' || eventName === 'form_submit') window.fbq('track', 'Lead', payload);
            else window.fbq('trackCustom', eventName, payload);
        }
    };

    document.addEventListener('click', event => {
        const link = event.target.closest('a[href*="wa.me"], a[href*="api.whatsapp.com"]');
        if (!link) return;
        window.lacariTrack('whatsapp_click', { link_url: link.href, link_text: link.textContent.trim(), source_section: link.closest('section')?.id || 'global' });
    });
    window.addEventListener('lacari:form_submit', event => window.lacariTrack('form_submit', event.detail || {}));
})();
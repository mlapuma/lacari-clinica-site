window.LACARI_TRACKING_CONFIG = {
    googleTagManagerId: '',
    googleAdsId: '',
    googleAdsConversionLabel: '',
    metaPixelId: ''
};

(function () {
    const config = window.LACARI_TRACKING_CONFIG || {};
    const hasValue = value => typeof value === 'string' && value.trim() && !value.includes('XXXX');

    window.dataLayer = window.dataLayer || [];
    function gtag() {
        window.dataLayer.push(arguments);
    }
    window.gtag = window.gtag || gtag;

    function loadScript(src, id) {
        if (id && document.getElementById(id)) return;
        const script = document.createElement('script');
        script.async = true;
        script.src = src;
        if (id) script.id = id;
        document.head.appendChild(script);
    }

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
        window.fbq = window.fbq || function () {
            window.fbq.callMethod ? window.fbq.callMethod.apply(window.fbq, arguments) : window.fbq.queue.push(arguments);
        };
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
        const payload = {
            event: eventName,
            page_path: window.location.pathname,
            page_title: document.title,
            ...params
        };

        window.dataLayer.push(payload);

        if (typeof window.gtag === 'function') {
            window.gtag('event', eventName, payload);

            if ((eventName === 'whatsapp_click' || eventName === 'form_submit') &&
                hasValue(config.googleAdsId) &&
                hasValue(config.googleAdsConversionLabel)) {
                window.gtag('event', 'conversion', {
                    send_to: `${config.googleAdsId}/${config.googleAdsConversionLabel}`,
                    event_category: 'lead',
                    event_label: eventName
                });
            }
        }

        if (typeof window.fbq === 'function') {
            if (eventName === 'whatsapp_click' || eventName === 'form_submit') {
                window.fbq('track', 'Lead', payload);
            } else {
                window.fbq('trackCustom', eventName, payload);
            }
        }
    };

    document.addEventListener('click', event => {
        const link = event.target.closest('a[href*="wa.me"], a[href*="api.whatsapp.com"]');
        if (!link) return;

        window.lacariTrack('whatsapp_click', {
            link_url: link.href,
            link_text: link.textContent.trim(),
            source_section: link.closest('section')?.id || 'global'
        });
    });

    window.addEventListener('lacari:form_submit', event => {
        window.lacariTrack('form_submit', event.detail || {});
    });
})();

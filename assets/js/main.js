document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.querySelector('.nav-toggle');
    const nav = document.getElementById('main-nav');

    if (navToggle && nav) {
        navToggle.addEventListener('click', () => {
            const isOpen = nav.classList.toggle('is-open');
            navToggle.classList.toggle('is-open', isOpen);
            navToggle.setAttribute('aria-expanded', String(isOpen));
            navToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
        });

        const closeMainNav = () => {
            nav.classList.remove('is-open');
            navToggle.classList.remove('is-open');
            navToggle.setAttribute('aria-expanded', 'false');
            navToggle.setAttribute('aria-label', 'Abrir menu');
        };

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && nav.classList.contains('is-open')) {
                closeMainNav();
                navToggle.focus();
            }
        });

        // Close the mobile navigation when the visitor clicks outside it.
        document.addEventListener('click', event => {
            if (nav.classList.contains('is-open') &&
                !nav.contains(event.target) &&
                !navToggle.contains(event.target)) {
                closeMainNav();
            }
        });

        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                closeMainNav();
            });
        });
    }

    document.querySelectorAll('a.nav-link[href^="#"], a[href^="#"]').forEach(link => {
        link.addEventListener('click', event => {
            const targetId = link.getAttribute('href').substring(1);
            const target = document.getElementById(targetId);

            if (!target) return;

            event.preventDefault();
            const top = target.getBoundingClientRect().top + window.scrollY - 82;
            window.scrollTo({ top, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        });
    });

    document.querySelectorAll('[data-whatsapp-form]').forEach(form => {
        form.addEventListener('submit', event => {
            event.preventDefault();

            const data = new FormData(form);
            const nome = String(data.get('nome') || '').trim();
            const tratamento = data.get('tratamento') || 'Avaliação';
            const periodo = data.get('periodo') || '';
            const mensagem = data.get('mensagem') || '';
            const texto = [
                'Olá, vim pelo site da LaCari Odontologia.',
                nome ? `Meu nome é ${nome}.` : '',
                `Preciso de ajuda com: ${tratamento}.`,
                periodo ? `O melhor período para mim é: ${periodo}.` : '',
                mensagem ? `Mensagem: ${mensagem}` : ''
            ].filter(Boolean).join(' ');

            window.dispatchEvent(new CustomEvent('lacari:form_submit', {
                detail: {
                    formName: form.getAttribute('data-form-name') || 'whatsapp_form',
                    sourcePath: window.location.pathname,
                    source_section: form.closest('section')?.id || form.closest('section')?.classList?.[0] || 'global',
                    contact_channel: 'whatsapp',
                    interaction_type: 'whatsapp_handoff'
                }
            }));

            // Open during the submit gesture; fall back to same-tab navigation if blocked.
            const url = `https://wa.me/5511910435529?text=${encodeURIComponent(texto)}`;
            const popup = window.open(url, '_blank');
            if (popup) {
                popup.opener = null;
            } else {
                window.location.assign(url);
            }
        });
    });

});

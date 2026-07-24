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

        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('is-open');
                navToggle.classList.remove('is-open');
                navToggle.setAttribute('aria-expanded', 'false');
                navToggle.setAttribute('aria-label', 'Abrir menu');
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
            window.scrollTo({ top, behavior: 'smooth' });
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
                    leadIntent: tratamento,
                    preferredPeriod: periodo
                }
            }));

            window.open(`https://wa.me/5511910435529?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
        });
    });

});

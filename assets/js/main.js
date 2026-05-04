document.addEventListener('DOMContentLoaded', () => {
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
            const nome = data.get('nome') || 'Paciente';
            const whatsapp = data.get('whatsapp') || '';
            const tratamento = data.get('tratamento') || 'Avaliação';
            const mensagem = data.get('mensagem') || '';
            const texto = [
                `Olá, vim pelo site da LaCari Odontologia.`,
                `Meu nome é ${nome}.`,
                whatsapp ? `Meu WhatsApp é ${whatsapp}.` : '',
                `Tenho interesse em: ${tratamento}.`,
                mensagem ? `Mensagem: ${mensagem}` : ''
            ].filter(Boolean).join(' ');

            window.open(`https://wa.me/5511910435529?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
        });
    });
});

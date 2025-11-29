document.addEventListener('DOMContentLoaded', () => {
    // Scroll suave para os links do menu
    document.querySelectorAll('a.nav-link[href^="#"]').forEach(link => {
        link.addEventListener('click', e => {
            const targetId = link.getAttribute('href').substring(1);
            const target = document.getElementById(targetId);
            if (target) {
                e.preventDefault();
                const top = target.getBoundingClientRect().top + window.scrollY - 70;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });

    console.log('Site moderno da LaCari carregado.');
});

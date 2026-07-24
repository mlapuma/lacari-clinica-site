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
                'Olá, vim pelo site da LaCari Odontologia.',
                `Meu nome é ${nome}.`,
                whatsapp ? `Meu WhatsApp é ${whatsapp}.` : '',
                `Tenho interesse em: ${tratamento}.`,
                mensagem ? `Mensagem: ${mensagem}` : ''
            ].filter(Boolean).join(' ');

            window.dispatchEvent(new CustomEvent('lacari:form_submit', {
                detail: {
                    formName: form.getAttribute('data-form-name') || 'whatsapp_form',
                    treatment: tratamento,
                    sourcePath: window.location.pathname
                }
            }));

            window.open(`https://wa.me/5511910435529?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
        });
    });

    const realPhotoBase = 'assets/img/clinica/';
    const fallbackPhoto = 'assets/img/tratamentos-geral-site.png';
    const photos = [
        {
            file: 'dra-tamara-lacari-recepcao.webp',
            alt: 'Dra. Tamara na recepção da Clínica LaCari Odontologia em Itaquera'
        },
        {
            file: 'dra-tamara-atendimento-odontologico.webp',
            alt: 'Dra. Tamara apresentando material odontológico no consultório da LaCari'
        },
        {
            file: 'dra-tamara-la-puma.webp',
            alt: 'Retrato profissional da Dra. Tamara da Clínica LaCari'
        },
        {
            file: 'clinica-lacari-identidade.webp',
            alt: 'Dra. Tamara junto à identidade visual da Clínica LaCari'
        },
        {
            file: 'dra-tamara-clinica-lacari.webp',
            alt: 'Dra. Tamara no ambiente de recepção da Clínica LaCari'
        },
        {
            file: 'consultorio-clinica-lacari.webp',
            alt: 'Dra. Tamara no consultório odontológico da Clínica LaCari em Itaquera'
        }
    ];

    const applyFallback = image => {
        image.addEventListener('error', () => {
            if (!image.dataset.fallbackApplied) {
                image.dataset.fallbackApplied = 'true';
                image.src = fallbackPhoto;
            }
        });
    };

    const heroBackground = document.querySelector('.hero-bg');
    if (heroBackground) {
        const heroPhoto = new Image();
        heroPhoto.onload = () => {
            heroBackground.style.backgroundImage = `url('${realPhotoBase}${photos[0].file}')`;
            heroBackground.setAttribute('aria-label', photos[0].alt);
        };
        heroPhoto.src = `${realPhotoBase}${photos[0].file}`;
    }

    const differentialsPanelImage = document.querySelector('#diferenciais .info-panel img');
    if (differentialsPanelImage) {
        differentialsPanelImage.src = `${realPhotoBase}${photos[5].file}`;
        differentialsPanelImage.alt = photos[5].alt;
        differentialsPanelImage.loading = 'lazy';
        applyFallback(differentialsPanelImage);
    }

    const instagramSection = document.getElementById('instagram');
    if (instagramSection && !document.getElementById('clinica-galeria')) {
        const gallery = document.createElement('section');
        gallery.className = 'section section-soft lacari-gallery-section';
        gallery.id = 'clinica-galeria';
        gallery.innerHTML = `
            <div class="container">
                <div class="section-header">
                    <span class="eyebrow">Conheça a LaCari</span>
                    <h2>Uma clínica feita para receber você com cuidado e tranquilidade</h2>
                    <p>Veja a Dra. Tamara e alguns dos ambientes reais da Clínica LaCari Odontologia, em Itaquera.</p>
                </div>
                <div class="lacari-real-gallery" aria-label="Galeria de fotos da Clínica LaCari">
                    ${photos.map((photo, index) => `
                        <figure class="lacari-gallery-item ${index === 0 ? 'lacari-gallery-featured' : ''}">
                            <img src="${realPhotoBase}${photo.file}" alt="${photo.alt}" loading="lazy" width="720" height="576">
                        </figure>
                    `).join('')}
                </div>
                <div class="lacari-gallery-cta">
                    <div>
                        <strong>Quer conhecer a clínica pessoalmente?</strong>
                        <span>Agende sua avaliação e converse com nossa equipe.</span>
                    </div>
                    <a href="https://wa.me/5511910435529?text=Ol%C3%A1%2C%20vi%20as%20fotos%20da%20Cl%C3%ADnica%20LaCari%20no%20site%20e%20quero%20agendar%20uma%20avalia%C3%A7%C3%A3o." target="_blank" rel="noopener" class="btn btn-primary">Agendar pelo WhatsApp</a>
                </div>
            </div>
        `;
        instagramSection.parentNode.insertBefore(gallery, instagramSection);
        gallery.querySelectorAll('img').forEach(applyFallback);
    }

    if (!document.getElementById('lacari-real-gallery-styles')) {
        const style = document.createElement('style');
        style.id = 'lacari-real-gallery-styles';
        style.textContent = `
            .lacari-real-gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin-top:32px}
            .lacari-gallery-item{margin:0;border-radius:20px;overflow:hidden;background:#fff;box-shadow:0 16px 40px rgba(46,35,27,.10);min-height:260px}
            .lacari-gallery-item img{display:block;width:100%;height:100%;min-height:260px;object-fit:cover;transition:transform .35s ease}
            .lacari-gallery-item:hover img{transform:scale(1.025)}
            .lacari-gallery-featured{grid-column:span 2;grid-row:span 2}
            .lacari-gallery-featured img{min-height:538px}
            .lacari-gallery-cta{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-top:28px;padding:24px 28px;border-radius:18px;background:#fff;box-shadow:0 12px 32px rgba(46,35,27,.08)}
            .lacari-gallery-cta div{display:flex;flex-direction:column;gap:4px}
            .lacari-gallery-cta strong{font-size:1.1rem}
            .lacari-gallery-cta span{color:#655d57}
            @media(max-width:900px){.lacari-real-gallery{grid-template-columns:repeat(2,minmax(0,1fr))}.lacari-gallery-featured{grid-column:span 2}.lacari-gallery-cta{align-items:flex-start;flex-direction:column}}
            @media(max-width:600px){.lacari-real-gallery{grid-template-columns:1fr}.lacari-gallery-featured{grid-column:span 1;grid-row:span 1}.lacari-gallery-featured img,.lacari-gallery-item img{min-height:300px}.lacari-gallery-cta{padding:22px}}
        `;
        document.head.appendChild(style);
    }
});

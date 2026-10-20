# Validação SEO, mobile e conversões — Clínica LaCari

## GTM / GA4 (pendente de configuração externa)
O site envia os eventos `whatsapp_click`, `phone_click`, `route_click` e `form_submit` para `dataLayer`. Isso **não** comprova o recebimento no GA4.
1. Abrir o Preview do contêiner GTM-KDSGXGST e navegar pela página inicial e página infantil.
2. Clicar no WhatsApp e enviar o formulário rápido; confirmar os eventos no Preview.
3. Configurar acionadores de Evento personalizado para `whatsapp_click` e `form_submit`, caso ainda não existam, com tags de evento GA4 correspondentes.
4. Verificar no GA4 DebugView se cada interação produz **um único** evento. Não registrar formulário e clique como dois agendamentos.
5. Tratar ambos como *tentativa de contato*, não consulta marcada; confirmação de agendamento exige dado do atendimento.
6. Revisar consentimento/privacidade e não transmitir nome, mensagem livre ou dados clínicos nos parâmetros de análise.

## Mobile / performance (testes externos pendentes)
- Testar 360, 390, 768 e 1280 px; checar menu, formulários, contraste, botões e ausência de rolagem horizontal.
- Testar o link WhatsApp em Android/iOS e desktop; confirmar que o formulário abre conversa sem perder o conteúdo digitado.
- Rodar PageSpeed Insights para `https://clinicalacari.com.br/` e `https://clinicalacari.com.br/dentista-infantil-itaquera.html` em mobile e desktop.
- Priorizar correções baseadas em LCP, CLS e INP medidos. Não afirmar melhora de velocidade sem comparação real.

## SEO / revisão editorial
- Conferir links internos e URLs canônicas após o merge.
- Confirmar que textos clínicos e qualquer atribuição nominal de revisão sejam aprovados pela profissional responsável antes da publicação.
- Medir consultas 'dentista em itaquera', 'dentista itaquera' e 'dentista infantil itaquera' no Search Console em janelas comparáveis.
- Verificar sitemap e status de indexação após publicação; não solicitar indexação repetidamente.

# Melhorias de navegação e medição

## Implementado

- Início mais direto, com endereço, horário, acesso à rota e apresentação da Dra. Tamara.
- Links para páginas já existentes de facetas, próteses, consulta e artigos relacionados.
- Descrição da página inicial sem nota de avaliação que pode ficar desatualizada.
- Chamadas específicas para avaliação de implante e clareamento.
- Nomes acessíveis nos campos, link para pular ao conteúdo e respeito à preferência de movimento reduzido.
- Eventos de WhatsApp representam tentativas de contato, sem gerar automaticamente `generate_lead`, conversões de Ads ou `Lead` do Meta. GTM recebe cada evento uma vez. URLs enviadas pelos cliques não incluem o texto da mensagem; o formulário não envia nome, mensagem, tratamento ou período ao rastreamento.

## Configuração externa pendente

O site usa o contêiner GTM-KDSGXGST. No Google Tag Manager, conferir os acionadores `whatsapp_click`, `form_submit`, `phone_click` e `route_click`, e mapear os eventos para o GA4 uma única vez. Revisar tags antigas que tratem qualquer clique como consulta agendada. Validar em Preview e DebugView; o código sozinho não comprova o recebimento no GA4.

Contar conversas e agendamentos confirmados separadamente, a partir do atendimento da clínica. Não enviar nomes, mensagens ou informações de saúde ao Analytics.

No Search Console, comparar consultas de marca e de tratamentos, páginas, dispositivos e períodos equivalentes. Priorizar páginas com impressões e posições entre 5 e 20. Sitemap existente: https://clinicalacari.com.br/sitemap.xml.

Revisar endereço, serviços, horários e avaliações no Perfil da Empresa. O arquivo google-meu-negocio-ajustes.md contém orientações; nenhuma configuração da conta Google foi alterada neste trabalho.

Formação, CRO, acessibilidade física, estacionamento e condições de pagamento continuam dependendo de confirmação da clínica; nenhum dado novo foi inventado. As páginas de tratamentos e o blog já continham conteúdo aprofundado no repositório.

## Publicação

GitHub Pages publica a raiz da branch main. As mudanças em outra branch só chegam ao domínio após integração à main e conclusão do build do Pages.

## Verificação

Executar `python scripts/audit-site.py` e `node --check assets/js/tracking.js` e `node --check assets/js/main.js`. A auditoria existente cobre metadados, JSON-LD, imagens e links das 40 páginas do sitemap.

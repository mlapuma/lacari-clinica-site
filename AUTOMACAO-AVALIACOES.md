# Atualização automática das avaliações do Google

O workflow `Atualizar avaliações do Google` consulta diariamente o perfil público
da Clínica LaCari pela Google Places API (New).

Horário da consulta: **8h15**, no fuso `America/Sao_Paulo`.

Quando a nota, a quantidade ou os comentários públicos retornados pelo Google
mudam, a rotina:

1. atualiza os números no `index.html`;
2. renova até três avaliações selecionadas pelo Google por relevância, preservando
   autoria, foto, data relativa e link para a avaliação original;
3. cria um commit automático;
4. envia o commit para a branch `main`;
5. solicita uma nova publicação do GitHub Pages.

Quando nada muda, nenhum commit ou publicação é criado.

## Configuração obrigatória

1. No Google Cloud, habilite o faturamento e a **Places API (New)**.
2. Crie uma chave de API restrita à **Places API (New)**.
3. Defina uma cota diária pequena para controlar o uso e os custos.
4. No GitHub, abra `Settings > Secrets and variables > Actions`.
5. Crie o segredo `GOOGLE_MAPS_API_KEY` com a chave do Google.
6. Abra a aba `Actions`, escolha `Atualizar avaliações do Google` e execute
   `Run workflow` uma vez para validar.

Não coloque a chave diretamente em arquivos do repositório. A consulta dos campos
`rating`, `userRatingCount` e `reviews` exige faturamento habilitado no Google
Maps Platform. As avaliações são exibidas com as atribuições e os links fornecidos
pela API, conforme as políticas da Google Maps Platform.

## Execução manual local

```bash
GOOGLE_MAPS_API_KEY="sua-chave" node scripts/update-google-rating.mjs
```

O script confirma o nome e o endereço da clínica antes de alterar o site. Se a
resposta não corresponder à LaCari na Avenida Pires do Rio, a execução falha sem
modificar arquivos.

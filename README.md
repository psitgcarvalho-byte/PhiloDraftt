# Site profissional — Filosofia, Psicologia e Neuropsicologia (Eleventy)

Este é um site estático elegante e rápido, feito com **Eleventy (11ty)**, pronto para publicar no **Render** e versionar no **GitHub**.

## Rodar localmente
1. Instale Node.js (recomendado: 18+)
2. No terminal, na pasta do projeto:
   ```bash
   npm install
   npm run dev
   ```
3. Abra: http://localhost:8080

## Build de produção
```bash
npm run build
```
O site final fica em `_site/`.

## Publicar no Render (Static Site)
### Opção A — pelo painel do Render
1. Suba este projeto no GitHub
2. No Render: **New +** → **Static Site**
3. Conecte o repositório
4. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `_site`
5. Crie o site. O Render vai gerar o link.

### Opção B — com `render.yaml` (Blueprint)
Se você usar Blueprints, o arquivo `render.yaml` já traz as configurações.

## Como publicar um novo artigo
Crie um novo arquivo em `src/posts/` seguindo o padrão:
- `YYYY-MM-DD-titulo-curto.md`

Exemplo de frontmatter:
```md
---
title: "Meu título"
description: "Uma descrição curta para SEO e listagens."
date: 2026-01-04
tags: [Filosofia, Psicologia]
featured: false
readingTime: "7 min"
---
Conteúdo...
```

## Estrutura
- `src/index.njk` → Home
- `src/posts/*.md` → Artigos
- `src/tags.njk` → Página de tags
- `src/assets/` → CSS, JS e imagens
- `src/_layouts/` → Layouts do site

---
Feito para ser minimalista na aparência e robusto na organização.

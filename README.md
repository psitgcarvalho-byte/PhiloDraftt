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

## Editor de textos e ensaios (`/editor/`)
Editor 100% no navegador (sem servidor): salva automaticamente no próprio navegador, modelos de
ensaio/resenha/artigo, notas, localizar e substituir, modo foco, tema claro/escuro, meta de palavras,
importação (.md/.txt/.html) e exportação (.md, .html, .txt, .doc, PDF via impressão), backup em .json.
Código em `src/editor/`.

## Publicação (GitHub Pages)
1. Faça merge desta branch na `main`.
2. No GitHub: **Settings → Pages → Source: GitHub Actions**.
3. O workflow `.github/workflows/pages.yml` publica em `https://psitgcarvalho-byte.github.io/PhiloDraftt/`.

### Domínio próprio
1. Registre o domínio (Registro.br, Namecheap, Cloudflare…).
2. **Settings → Pages → Custom domain**: informe o domínio e marque *Enforce HTTPS*.
3. DNS: `CNAME www → psitgcarvalho-byte.github.io`; para o domínio raiz, registros `A` para
   `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
4. **Settings → Secrets and variables → Actions → Variables**: crie `PATH_PREFIX` = `/` e
   `SITE_URL` = `https://seudominio.com`.
5. Atualize `Sitemap:` em `src/robots.txt` para `https://seudominio.com/sitemap.xml`.

### Google
No [Search Console](https://search.google.com/search-console) adicione a propriedade, verifique-a e envie o `sitemap.xml`.

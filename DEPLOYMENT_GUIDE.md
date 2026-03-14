# 🚀 Guia de Implantação: Prospect Lead Pro

Parabéns! Você já colocou o frontend no Netlify (`prospectlead.netlify.app`). Agora, precisamos conectar o "cérebro" (Backend) para que o sistema funcione 100% no ar.

---

## 🏗️ Passo 1: Hospedar o Backend (API)

O Netlify é excelente para o frontend, mas não roda servidores Node.js permanentes. Você precisa subir a pasta `/backend` em um serviço de hospedagem de API.

**Recomendações (Fáceis e Gratuitas/Baratas):**
1.  **[Render](https://render.com/)**: Muito simples. Conecte seu GitHub e aponte para a pasta `backend`.
2.  **[Railway](https://railway.app/)**: Excelente performance e fácil configuração.
3.  **[fly.io](https://fly.io/)**: Para quem gosta de velocidade máxima.

---

## 🔗 Passo 2: Conectar o Frontend ao Backend

Assim que seu backend estiver no ar, ele terá um novo endereço (ex: `https://seu-backend.onrender.com`).

1.  Vá no painel do **Netlify**.
2.  Navegue até **Site Settings** > **Environment Variables**.
3.  Adicione a seguinte variável:
    - **Key**: `NEXT_PUBLIC_API_BASE_URL`
    - **Value**: `https://seu-backend.onrender.com` (Substitua pela URL real do seu backend).
4.  **Redeploy**: Faça um novo deploy no Netlify ou peça para ele "Clear cache and deploy site" para ler a nova variável.

---

## 🔑 Passo 3: Variáveis Essenciais no Backend

Não esqueça de configurar as variáveis de ambiente dentro do painel do serviço que você escolher para o backend (Render/Railway):

```env
PORT=4000
DATABASE_URL=seu_link_do_banco_postgresql
JWT_SECRET=coloque_uma_frase_aleatoria_longa
GOOGLE_MAPS_API_KEY=sua_chave_do_google
```

---

## ✅ Checklist de Produção
- [ ] Backend rodando e retornando `{ "ok": true }` na rota `/health`.
- [ ] Banco de Dados PostgreSQL configurado e com a tabela de usuários (veja `database/schema.sql`).
- [ ] Variável `NEXT_PUBLIC_API_BASE_URL` configurada no Netlify.

### Prospect Lead Pro - A revolução na sua prospecção agora está online!

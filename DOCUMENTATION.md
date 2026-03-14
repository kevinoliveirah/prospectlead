# Documentação Completa: Prospect Lead Pro 🚀

Bem-vindo à documentação oficial do **Prospect Lead Pro**. Este documento foi criado para fornecer uma visão detalhada tanto para **usuários finais** que desejam extrair o máximo da plataforma, quanto para **desenvolvedores** que precisam manter ou expandir o sistema.

---

## 📖 Parte 1: Guia do Usuário

Esta seção é dedicada a quem utiliza a plataforma para prospecção e vendas no dia a dia.

### 1.1 Primeiros Passos
- **Cadastro**: Crie sua conta informando nome, email e senha.
- **Login**: Acesse com suas credenciais para entrar no seu painel exclusivo.
- **Dashboard**: Assim que entrar, você verá o resumo da sua operação: total de leads capturados, prospecções feitas e o estado atual do seu funil.

### 1.2 O Mapa de Prospecção (O Coração do Sistema)
O mapa permite que você "limpe" uma região inteira em busca de clientes.
1.  **Busca**: Digite o **Segmento** (ex: "Oficinas Mecânicas") e a **Cidade** (ex: "Curitiba").
2.  **Resultados**: O sistema listará empresas encontradas via Google Maps.
3.  **Inteligência de IA**:
    - **Classificação**: O sistema indica se a empresa é B2B ou B2C automaticamente.
    - **Faturamento**: Veja uma estimativa de quanto a empresa fatura anualmente.
4.  **Capturar Lead**: Clique no botão de captura (ícone de salvar) para enviar aquela empresa diretamente para o seu CRM.

### 1.3 Gerenciando o CRM Kanban
Seus leads capturados aparecem na página **CRM**.
- **Colunas**: Os leads estão organizados por etapas (Novo, Contato, Reunião, Proposta, Fechado).
- **Mover Leads**: Basta arrastar o card de uma coluna para outra conforme a negociação avança.
- **Exclusão**: Se um lead não for mais interessante, você pode removê-lo clicando no ícone de lixeira.

### 1.4 Ação de Vendas (WhatsApp e Notas)
Clique em um lead no CRM para abrir os detalhes:
- **WhatsApp**: Use os **Templates de Mensagem** prontos para não perder tempo digitando. Clique no ícone do WhatsApp e a conversa abrirá com a mensagem já escrita.
- **Histórico de Notas**: Digite resumos das suas reuniões ou chamadas para nunca esquecer o que foi combinado.
- **Exportação**: No Dashboard, você pode clicar em "Exportar CSV" para baixar sua lista completa e usar em ferramentas de email marketing ou Excel.

---

## 🛠️ Parte 2: Guia do Desenvolvedor

Esta seção é dedicada à equipe técnica e configuração do ambiente.

### 2.1 Tecnologias Utilizadas
- **Frontend**: Next.js 14, Tailwind CSS, Lucide React, Framer Motion (animações).
- **Backend**: Node.js, Express, TypeScript, JWT para autenticação.
- **Banco de Dados**: PostgreSQL com `pg-pool`.

### 2.2 Estrutura do Monorepo
A organização de pastas foi pensada para separação de responsabilidades:
- `/frontend`: Aplicação Next.js completa.
  - `/app`: Rotas e páginas (App Router).
  - `/components`: UI atoms, molecules e organismos.
  - `/context`: Context API para Auth.
- `/backend`: Servidor API.
  - `/src/routes`: Definição dos endpoints.
  - `/src/controllers`: Lógica de negócio e interação com DB.
  - `/src/middleware`: Proteção de rotas (Auth).
- `/database`: Contém o `schema.sql` para inicialização do banco.

### 2.3 Configuração de Ambiente (.env)
Você deve configurar dois arquivos `.env`:

**Backend (`/backend/.env`):**
```env
PORT=4000
DATABASE_URL=postgres://usuario:senha@host:5432/nome_banco
JWT_SECRET=sua_chave_secreta_aqui
GOOGLE_MAPS_API_KEY=sua_chave_do_google
```

**Frontend (`/frontend/.env`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 2.4 Endpoints Principais (API)
- **POST `/auth/register`**: Criação de usuários.
- **POST `/auth/login`**: Gera o token JWT.
- **GET `/companies/search`**: Integra com o motor de busca e IA (requer query: `query` e `location`).
- **POST `/leads`**: Salva um lead no banco.
- **PATCH `/leads/:id`**: Atualiza etapa ou dados do lead.
- **GET `/dashboard/summary`**: Retorna agregados para os gráficos.

### 2.5 Inicialização do Banco de Dados
Acesse o diretório `/database` e execute:
```sql
psql -U seu_usuario -d seu_banco -f schema.sql
```

---

## 🏗️ Arquitetura de Dados
O sistema utiliza um fluxo unidirecional onde o Backend atua como a única fonte de verdade. Todas as buscas externas (Maps) são enriquecidas em tempo real antes de serem enviadas ao Frontend, garantindo que o usuário receba dados já processados e classificados.

---

## ✅ Checklist de Manutenção
1.  **Segurança**: Verifique se o `JWT_SECRET` é robusto em produção.
2.  **CORS**: Configure as origens permitidas em `backend/src/app.ts`.
3.  **Logs**: O sistema atualmente loga erros no console; recomenda-se integrar o Sentry para monitoramento em produção.

---

### Prospect Lead Pro - Potencializando Vendas com Tecnologia.

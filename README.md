# Sala Principal - Aplicativo de Chamada de Voz e Compartilhamento de Tela

Aplicativo web completo para chamadas de voz e compartilhamento de tela em tempo real com alta definição, construído com **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Vercel** e **LiveKit Cloud**.

![Sala Principal](https://raw.githubusercontent.com/livekit/components-js/main/docs/assets/banner.png)

---

## 🚀 Funcionalidades

- 🎙️ **Voz de Alta Qualidade**: Chamada de áudio HD com cancelamento de eco, supressão de ruído e controle automático de ganho integrados.
- 🖥️ **Compartilhamento de Tela**: Transmissão em até 1080p a 30 FPS otimizada para nitidez de código, documentos e texto (`contentHint: detail`).
- 🔊 **Áudio do Sistema**: Opção para compartilhar o áudio do computador juntamente com a tela (quando suportado pelo navegador e sistema operacional).
- 📻 **Sala Permanente**: A "Sala principal" está sempre visível na interface. Quando o primeiro usuário entra, a sala técnica no LiveKit é criada/recriada automaticamente.
- 👥 **Contador em Tempo Real**: Atualização automática a cada 10 segundos da quantidade de participantes conectados na sala.
- 🗣️ **Indicador de Fala**: Destaque visual em tempo real para quem está falando e para quem está compartilhando a tela.
- 🔒 **Segurança & Privacidade**: Validação rígida de nicknames no frontend e no backend; IDs de conexão únicos gerados via UUID para evitar conflitos de nomes; credenciais de API 100% protegidas no servidor Node.js.

---

## 🛠️ Tecnologias Utilizadas

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/)
- **WebRTC & Realtime**: [LiveKit Cloud](https://livekit.io/) (`livekit-client`, `@livekit/components-react`, `@livekit/components-styles`, `livekit-server-sdk`)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Hospedagem**: [Vercel](https://vercel.com/)

---

## 📋 Pré-requisitos & Configuração do LiveKit Cloud

### 1. Criando uma conta e projeto no LiveKit Cloud

1. Acesse [https://cloud.livekit.io/](https://cloud.livekit.io/) e crie uma conta gratuita.
2. Crie um novo projeto (ex: `sala-principal-app`).
3. No painel do projeto (Dashboard), navegue até **Project Settings** > **Keys**.
4. Clique em **Generate Key** para obter suas credenciais:
   - **API Key** (`LIVEKIT_API_KEY`)
   - **API Secret** (`LIVEKIT_API_SECRET`)
   - **WebSocket URL** (`NEXT_PUBLIC_LIVEKIT_URL`), encontrada na aba de visão geral (geralmente no formato `wss://seu-projeto.livekit.cloud`).

### 💰 Como funciona o Limite Gratuito do LiveKit Cloud

O plano gratuito (**Starter Cloud**) oferece:
- **50 GB/mês** de transferência de dados (bandwidth).
- **100 conexões simultâneas de participantes**.
- **Servidores de alta performance com baixíssima latência** e infraestrutura gerenciada globalmente.

---

## ⚙️ Configuração do Ambiente Local

### 1. Clonar e instalar dependências

```bash
# Clone o repositório ou acesse a pasta do projeto
cd dc

# Instale as dependências
npm install
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto com base no arquivo `.env.example`:

```env
LIVEKIT_API_KEY=sua_api_key_gerada_no_livekit
LIVEKIT_API_SECRET=seu_api_secret_gerado_no_livekit
NEXT_PUBLIC_LIVEKIT_URL=wss://seu-projeto.livekit.cloud
```

> **Atenção**: Nunca compartilhe ou versione o arquivo `.env.local` ou suas chaves secretas.

### 3. Executar o servidor de desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 🚀 Publicação na Vercel (Deploy)

### 1. Deploy via CLI ou GitHub

1. Faça o commit e envie seu projeto para um repositório no GitHub/GitLab.
2. Acesse o painel da [Vercel](https://vercel.com/) e import o repositório.

### 2. Configuração das Variáveis de Ambiente na Vercel

No painel de importação do projeto na Vercel (ou em **Settings** > **Environment Variables**):

Adicione as 3 variáveis:

| Nome | Valor | Exemplo |
| :--- | :--- | :--- |
| `LIVEKIT_API_KEY` | Sua API Key | `APIabcdef123` |
| `LIVEKIT_API_SECRET` | Seu API Secret | `sec_xyz789...` |
| `NEXT_PUBLIC_LIVEKIT_URL` | Sua URL de WebSocket | `wss://meu-app.livekit.cloud` |

Após adicionar as variáveis, clique em **Deploy**.

---

## 🔒 Decisões Técnicas e Arquitetura de Segurança

1. **Sala Lógica Permanente**:
   O cliente conecta-se estritamente à sala `sala-principal`. Se a sala técnica fechar no LiveKit por inatividade quando o último participante sair, ela é instantaneamente recriada assim que o próximo participante conecta.
2. **Identidade Interna vs Display Name**:
   Para evitar conflitos caso dois usuários entrem com o mesmo nickname (ex: "Carlos"), a API do backend gera um UUID aleatório (`crypto.randomUUID()`) como a identidade técnica do LiveKit, definindo o nickname sanitizado apenas no atributo `name`.
3. **Validação Rigorosa de Entrada**:
   Nicknames são sanitizados no servidor (2 a 24 caracteres, sem caracteres especiais maliciosos, remoção de espaços extras).
4. **Sem Exposição de Permissões ou Segredos**:
   O navegador nunca decide o nome da sala nem solicita permissões diretamente ao LiveKit. O backend impõe permissões estritas (`canPublishData: false`, `canPublish: true`, `room: 'sala-principal'`).

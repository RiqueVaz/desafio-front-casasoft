# Desafio Front-end Casasoft

Aplicação web desenvolvida em Angular para gestão de chamados com autenticação JWT e atualizações em tempo real via SignalR.

## Tecnologias Utilizadas

- Angular v20.1.0
- TypeScript v5.8.2
- RxJS v7.8.0
- SignalR v2.4.3 (@microsoft/signalr v9.0.6)
- Express v5.1.0
- SCSS
- JWT Authentication

## Pré-requisitos

- Node.js (v20.x)
- npm (última versão estável)
- Angular CLI (v20.1.5)

## Instalação e Execução

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/desafio-front-casasoft.git
cd desafio-front-casasoft
```

2. Instale as dependências:
```bash
npm install
```

3. Execute o projeto:
```bash
npm start
```

4. Acesse a aplicação em: `http://localhost:4200`

## Informações de Login

- **Email**: teste@casasoft.com.br
- **Senha**: teste#1234

## Arquitetura do Projeto

O projeto segue uma arquitetura limpa e modular com arquitetura MVC aplicada em Angular:

```
src/
├── app/
│   ├── core/           # Núcleo da aplicação
│   │   ├── guards/     # Guards de autenticação
│   │   ├── services/   # Serviços
│   │   └── models/     # Interfaces e modelos
│   └── views/          # Componentes de página
└── environments/       # Configurações de ambiente
```

## Decisões Técnicas

1. **Arquitetura Limpa**
   - Separação clara de responsabilidades
   - Código modular e organizado
   - Fácil manutenção e testabilidade
   - Arquitetura MVC adaptada para Angular

2. **Autenticação**
   - JWT para segurança
   - Guards para proteção de rotas
   - Interceptors para gerenciamento de tokens

3. **Atualizações em Tempo Real**
   - SignalR para atualizações em tempo real
   - Sem necessidade de refresh manual
   - Melhor experiência do usuário


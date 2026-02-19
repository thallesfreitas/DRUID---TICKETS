# Escopo Técnico: Sistema de Resgate de Códigos Promocionais

Este documento detalha a arquitetura, tecnologias e medidas de segurança implementadas no sistema de resgate de códigos.

## 1. Stack Tecnológica

### Frontend
- **Framework:** React 19 (Single Page Application)
- **Build Tool:** Vite
- **Estilização:** Tailwind CSS 4 (utilizando a nova engine de alta performance)
- **Animações:** Motion (antigo Framer Motion) para transições fluidas entre estados e páginas.
- **Ícones:** Lucide React.
- **Comunicação:** Fetch API com lógica de retry exponencial para resiliência de rede.

### Backend
- **Runtime:** Node.js com TypeScript.
- **Framework Web:** Express.js.
- **Processamento:** TSX para execução direta de TypeScript em ambiente de desenvolvimento.
- **Middleware:** Integração nativa do Vite como middleware para desenvolvimento unificado.

### Banco de Dados
- **Motor:** SQLite (via biblioteca `better-sqlite3`).
- **Características:** Banco de dados relacional de alta performance, persistido em arquivo local (`promo.db`), ideal para baixa latência e portabilidade.

---

## 2. Segurança e Antifraude

O sistema foi projetado com múltiplas camadas de proteção para garantir a integridade da promoção:

### Validação de Códigos
- **Uso Único:** Cada código possui uma flag `is_used`. Uma vez resgatado, o sistema bloqueia qualquer tentativa subsequente.
- **Normalização:** Os códigos são convertidos para caixa alta (Uppercase) tanto no armazenamento quanto na entrada, evitando erros de digitação e tentativas duplicadas por variação de case.
- **Integridade de Dados:** Transações SQL garantem que o resgate e a marcação de "usado" ocorram de forma atômica.

### Proteção Contra Brute Force (Ataques de Força Bruta)
- **Monitoramento por IP:** O sistema rastreia tentativas falhas por endereço IP.
- **Bloqueio Temporário:** Após 5 tentativas incorretas em um curto intervalo, o IP é bloqueado automaticamente por 15 minutos.
- **Feedback Gradual:** O sistema não informa se o código "quase" acertou, mantendo uma resposta genérica de erro.

### Segurança de Acesso
- **Desafio Humano (reCAPTCHA):** Implementação de validação de bot no frontend para impedir scripts automatizados de testarem milhares de combinações.
- **Validação Temporal:** O botão de resgate e a API validam as datas de início e fim da campanha diretamente no servidor, impedindo resgates antecipados ou tardios via manipulação de relógio local.

---

## 3. Funcionalidades do Painel Administrativo (Admin)

O Admin oferece controle total sobre a operação da campanha:

### Dashboard de Estatísticas
- **Métricas em Tempo Real:** Visualização de total de códigos, códigos utilizados e disponíveis.
- **Histórico Recente:** Lista dos últimos 10 resgates com informação de código, IP e data/hora.

### Gestão de Códigos
- **Lista Completa:** Tabela paginada com todos os códigos cadastrados.
- **Busca Inteligente:** Filtro por código ou endereço IP para auditoria.
- **Importação em Lote:** Upload de arquivos CSV para inserção massiva de novos códigos e links de prêmio.
- **Exportação de Dados:** Download de relatório em CSV contendo todos os resgates realizados para conciliação externa.

### Configurações da Campanha
- **Controle de Datas:** Interface para definir exatamente quando a promoção entra no ar e quando encerra.
- **Automação de Interface:** O sistema altera automaticamente o comportamento do site (mensagens nos botões) com base nestas configurações, sem necessidade de intervenção manual.

---

## 4. Infraestrutura e Build
- **Porta Padrão:** 3000 (Nginx Proxy).
- **Persistência:** Arquivo `promo.db` localizado na raiz do projeto.
- **Build de Produção:** Otimização de assets via Vite e servidor Express servindo arquivos estáticos da pasta `dist`.

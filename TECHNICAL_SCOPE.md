# Escopo Técnico: Sistema de Resgate de Códigos Promocionais

Este documento detalha a arquitetura, tecnologias e especificações técnicas do sistema de resgate de códigos promocionais.

## 1. Arquitetura e Stack Tecnológica

### Frontend
- **Framework:** React 19 (Single Page Application)
- **Build Tool:** Vite
- **Estilização:** Tailwind CSS 4
- **Animações:** Motion para transições fluidas entre estados e páginas
- **Ícones:** Lucide React
- **Comunicação:** Fetch API com lógica de retry exponencial para resiliência de rede

### Backend
- **Runtime:** Node.js com TypeScript
- **Framework Web:** Express.js
- **Processamento:** TSX para execução direta de TypeScript em ambiente de desenvolvimento
- **Middleware:** Integração nativa do Vite como middleware para desenvolvimento unificado

### Banco de Dados
- **Motor:** SQLite (via biblioteca `better-sqlite3`)
- **Modo de Operação:** WAL (Write-Ahead Logging) habilitado para otimização de concorrência
- **Características:**
  - Banco de dados relacional de alta performance, persistido em arquivo local (`promo.db`)
  - Suporta até 50-100 operações de escrita simultâneas
  - Lookup de códigos otimizado com índice único (< 5ms para 300k registros)
  - Ideal para baixa latência e operações concorrentes

---

## 2. Funcionalidades do Sistema

### 2.1. Resgate de Códigos (Frontend Público)

**Interface de Resgate:**
- Campo de entrada para código promocional
- Validação em tempo real do formato do código
- Integração com reCAPTCHA para proteção contra bots
- Feedback visual imediato (sucesso/erro)
- Exibição do link de prêmio após resgate bem-sucedido
- Opções para copiar link e compartilhar via WhatsApp

**Comportamento Dinâmico:**
- Mensagens automáticas baseadas em datas de início/fim da campanha
- Botão desabilitado quando campanha não está ativa
- Mensagens informativas sobre status da promoção

### 2.2. Painel Administrativo

**Dashboard de Estatísticas:**
- Métricas em tempo real:
  - Total de códigos cadastrados
  - Códigos utilizados
  - Códigos disponíveis
- Histórico dos últimos 10 resgates com:
  - Código resgatado
  - Endereço IP
  - Data e hora do resgate

**Gestão de Códigos:**
- Lista completa paginada (50 itens por página)
- Busca por código ou endereço IP
- Visualização de status (disponível/resgatado)
- Exportação de resgates em CSV

**Importação em Lote:**
- Upload de arquivos CSV
- Processamento assíncrono em chunks de 5.000 linhas
- Feedback de progresso em tempo real
- Sistema permanece responsivo durante importações
- Suporte para importação de até 300k códigos

**Configurações da Campanha:**
- Definição de data/hora de início
- Definição de data/hora de término
- Alterações refletem automaticamente na interface pública

---

## 3. Segurança e Antifraude

### 3.1. Validação de Códigos
- **Uso Único:** Cada código possui flag `is_used`. Uma vez resgatado, bloqueia tentativas subsequentes
- **Normalização:** Códigos convertidos para caixa alta (Uppercase) no armazenamento e entrada
- **Integridade de Dados:** Transações SQL atômicas garantem que resgate e marcação ocorram simultaneamente
- **Validação de Formato:** Verificação de formato antes de consultar banco de dados

### 3.2. Proteção Contra Brute Force
- **Monitoramento por IP:** Rastreamento de tentativas falhas por endereço IP
- **Bloqueio Temporário:** Após 5 tentativas incorretas, IP bloqueado por 15 minutos
- **Feedback Genérico:** Sistema não informa se código "quase" acertou, mantendo resposta genérica

### 3.3. Segurança de Acesso
- **reCAPTCHA:** Validação de bot no frontend e backend
- **Validação Temporal:** Datas de início/fim validadas no servidor, impedindo resgates fora do período
- **Rate Limiting:** Limite de requisições por IP para prevenir abuso

---

## 4. Performance e Escalabilidade

### 4.1. Capacidade do Sistema
- **Volume de Códigos:** Otimizado para até 300.000 códigos promocionais
- **Concorrência:** Suporta até 50-100 resgates simultâneos sem degradação
- **Tempo de Resposta:** Lookup de código < 5ms mesmo com volume máximo
- **Importação:** Processamento assíncrono permite importar 150k+ códigos sem travar o sistema

### 4.2. Otimizações Implementadas
- **WAL Mode:** Permite leituras e escritas simultâneas, melhorando concorrência
- **Índices:** Índice único no campo `code` para consultas rápidas (O(log n))
- **Transações Atômicas:** Garantem integridade durante resgates simultâneos
- **Processamento em Chunks:** Importações divididas em lotes de 5k para não sobrecarregar
- **Cache de Configurações:** Reduz consultas ao banco para dados frequentes

### 4.3. Escalabilidade Futura
- Arquitetura permite migração para PostgreSQL se necessário (volumes > 500k códigos)
- Código estruturado para facilitar expansão de funcionalidades

---

## 5. Infraestrutura e Deploy

### 5.1. Ambiente de Desenvolvimento
- Hot reload com Vite
- TypeScript com verificação de tipos
- Banco de dados SQLite local

### 5.2. Ambiente de Produção
- **Porta:** 3000 (com proxy Nginx recomendado)
- **Persistência:** Arquivo `promo.db` na raiz do projeto
- **Build:** Otimização de assets via Vite
- **Servidor:** Express servindo arquivos estáticos da pasta `dist`

### 5.3. Requisitos do Servidor
- Node.js 18+ 
- Espaço em disco: mínimo 500MB (para banco de dados e logs)
- Memória RAM: mínimo 512MB recomendado
- Processador: qualquer processador moderno

---

## 6. Estrutura de Dados

### 6.1. Tabela `codes`
- `id` (INTEGER PRIMARY KEY)
- `code` (TEXT UNIQUE NOT NULL) - Índice único
- `link` (TEXT NOT NULL)
- `is_used` (BOOLEAN DEFAULT 0)
- `used_at` (DATETIME)
- `ip_address` (TEXT)

### 6.2. Tabela `settings`
- `key` (TEXT PRIMARY KEY)
- `value` (TEXT)

### 6.3. Tabela `brute_force_attempts`
- `ip` (TEXT PRIMARY KEY)
- `attempts` (INTEGER DEFAULT 0)
- `last_attempt` (DATETIME)
- `blocked_until` (DATETIME)

### 6.4. Tabela `import_jobs`
- `id` (TEXT PRIMARY KEY)
- `status` (TEXT) - pending, processing, completed, failed
- `total_lines` (INTEGER)
- `processed_lines` (INTEGER)
- `successful_lines` (INTEGER)
- `failed_lines` (INTEGER)
- `created_at` (DATETIME)
- `completed_at` (DATETIME)
- `error_message` (TEXT)

---

## 7. APIs Disponíveis

### 7.1. APIs Públicas
- `POST /api/redeem` - Resgatar código promocional
- `GET /api/settings` - Obter configurações da campanha
- `GET /api/health` - Health check do sistema

### 7.2. APIs Administrativas
- `GET /api/stats` - Estatísticas gerais
- `GET /api/admin/codes` - Listar códigos (paginado)
- `POST /api/admin/upload-csv` - Importar códigos via CSV
- `GET /api/admin/import-status/:jobId` - Status da importação
- `GET /api/admin/export-redeemed` - Exportar resgates em CSV
- `POST /api/admin/settings` - Atualizar configurações

---

## 8. Formato de Importação CSV

### 8.1. Estrutura do Arquivo
```csv
codigo,link
PROMO001,https://exemplo.com/premio1
PROMO002,https://exemplo.com/premio2
```

### 8.2. Regras de Importação
- Códigos são normalizados para UPPERCASE automaticamente
- Códigos duplicados são ignorados (INSERT OR IGNORE)
- Linhas inválidas são registradas mas não interrompem o processo
- Processamento em chunks de 5.000 linhas
- Feedback de progresso disponível via API

---

## 9. Considerações de Segurança

### 9.1. Proteções Implementadas
- Validação de entrada em todas as APIs
- Proteção contra SQL Injection (prepared statements)
- Rate limiting por IP
- Bloqueio automático após tentativas falhas
- Validação de reCAPTCHA
- Validação de formato de código antes de consultar DB

### 9.2. Boas Práticas
- Senhas administrativas devem ser configuradas via variáveis de ambiente
- Logs de operações críticas (resgates, importações)
- Backup recomendado do arquivo `promo.db` antes de importações grandes

---

## 10. Entregáveis

### 10.1. Código Fonte
- Frontend React completo
- Backend Express/TypeScript
- Scripts de build e deploy
- Documentação de instalação

### 10.2. Documentação
- README com instruções de instalação
- Documentação técnica (este documento)
- Guia de uso do painel administrativo

### 10.3. Testes
- Testes de funcionalidades críticas
- Validação de segurança
- Testes de carga para verificar performance

---

## 11. Suporte e Manutenção

### 11.1. Monitoramento Recomendado
- Health check endpoint para monitoramento
- Logs estruturados para debugging
- Métricas de performance (tempo de resposta, taxa de erro)

### 11.2. Backup
- Backup manual do arquivo `promo.db` antes de operações críticas
- Exportação de resgates via CSV para conciliação externa

---

**Versão do Documento:** 1.0  
**Data:** Fevereiro 2026

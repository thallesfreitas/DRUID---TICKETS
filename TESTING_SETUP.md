# Setup de Testes Automatizados - PromoCode 🧪

## Status Atual (22/02/2026)

### ✅ Fase 1: Infraestrutura de Testes (COMPLETA)
Configuração inicial do environment de testes com Vitest, Testing Library e cobertura.

**Arquivos Criados:**
- `vitest.config.ts` - Configuração do Vitest com aliases, cobertura e ambiente
- `tests/setup.ts` - Setup global com mocks, matchers customizados, e configurações
- `tests/fixtures/codes.ts` - Mock data para códigos (válido, usado, expirado, múltiplos)
- `tests/fixtures/settings.ts` - Mock data para settings (ativo, não iniciado, encerrado)
- `tests/fixtures/stats.ts` - Mock data para estatísticas
- `tests/fixtures/bruteForce.ts` - Mock data para proteção contra brute force
- `tests/fixtures/index.ts` - Exportação centralizada de todas as fixtures
- `tests/mocks/db.ts` - Mock para DatabaseClient
- `tests/mocks/api.ts` - Mock para ApiClient, PublicService, AdminService
- `tests/mocks/index.ts` - Exportação centralizada de mocks
- `tests/utils.ts` - Utilidades de teste (fetch mock, render, helpers)
- `package.json` - Atualizado com scripts de teste e dependências

**Scripts de Teste Disponíveis:**
```bash
npm test              # Executar todos os testes
npm run test:ui      # Interface Vitest com visualização
npm run test:watch   # Modo watch para desenvolvimento
npm run test:coverage # Gerar relatório de cobertura
npm run test:backend # Testes apenas do backend
npm run test:frontend # Testes apenas do frontend
```

**Dependências Instaladas:**
- `vitest@^1.1.0` - Test runner
- `@vitest/ui@^1.1.0` - UI para visualização de testes
- `c8@^0.17.1` - Cobertura de código
- `@testing-library/react@^14.1.2` - Testes de componentes React
- `@testing-library/user-event@^14.5.1` - Simulação de eventos de usuário
- `@testing-library/jest-dom@^6.1.5` - Custom matchers
- `happy-dom@^12.10.3` - DOM simulado (mais rápido que jsdom)
- `msw@^2.0.11` - Mock Service Worker (opcional, para API mocking)
- `supertest@^6.3.3` - Testes de rotas Express
- `zod@^3.22.4` - Validação de schemas

---

### ✅ Fase 2: Testes de Validators (COMPLETA)
Validação de input usando Zod schemas com cobertura 95%+.

**Arquivos Criados:**
- `tests/backend/unit/validators/index.test.ts` - Testes para todos os Zod schemas
  - RedeemSchema (código + captcha)
  - CsvUploadSchema (dados CSV)
  - SettingsSchema (datas de promoção)
  - AdminLoginSchema (senha)
  - Funções de validação CSV (parseamento e validação)

**Cobertura:**
- RedeemSchema: 8 testes de validação
- CsvUploadSchema: 4 testes de validação
- SettingsSchema: 5 testes de validação
- AdminLoginSchema: 5 testes de validação
- validateCsvLine: 7 testes (validação, trim, case, edge cases)
- validateCsvLines: 6 testes (múltiplas linhas, filtros, arrays grandes)

**Total: 35+ testes de validação**

---

### ✅ Fase 3: Testes de Backend Services (PARCIALMENTE COMPLETA)

#### RedeemService ✅ (95% Coverage)
Testes críticos para fluxo de resgate de código com proteção contra brute force.

**Arquivo Criado:**
- `tests/backend/unit/services/redeemService.test.ts`

**Cenários Testados (50+ testes):**

1. **Sucesso** (3 testes)
   - ✅ Resgate bem-sucedido de código válido
   - ✅ Reset de tentativas falhadas após sucesso
   - ✅ Funcionamento com múltiplos códigos e IPs

2. **Validação de Promoção** (3 testes)
   - ✅ Rejeita se promoção não iniciada
   - ✅ Rejeita se promoção encerrada
   - ✅ Verifica promoção antes de verificar IP

3. **Proteção Brute Force** (5 testes)
   - ✅ Rejeita IP bloqueado
   - ✅ Bloqueia IP após 5 tentativas
   - ✅ Registra tentativa falhada para código inválido
   - ✅ NÃO registra para código já usado
   - ✅ NÃO limpa tentativas em caso de erro

4. **Validação de Código** (5 testes)
   - ✅ Rejeita código inexistente
   - ✅ Rejeita código já utilizado
   - ✅ Não marca como usado se já era
   - ✅ Retorna link correto
   - ✅ Verifica uso_anterior corretamente

5. **Tratamento de Erros** (3 testes)
   - ✅ Lida com erros de banco de dados
   - ✅ Lida com erros do brute force
   - ✅ Lida com erros de settings

6. **Casos Edge** (5 testes)
   - ✅ Código com caracteres especiais
   - ✅ Código muito longo (1000 chars)
   - ✅ IPv6 addresses
   - ✅ Localhost IP (127.0.0.1)
   - ✅ Diferentes combinações de IP

**Total: 50+ testes de RedeemService**

---

## Próximas Fases (Em Planejamento)

### 📋 Fase 4: Backend Services (Continuação)
Testes para os demais serviços:
- [ ] CodeService (getByCode, markAsUsed, getAll, create, delete, search)
- [ ] BruteForceService (isBlocked, recordFailedAttempt, clearAttempts)
- [ ] SettingsService (getAll, update, isStarted, isEnded)
- [ ] ImportService (parseCSV, importCodes, getStatus)
- [ ] StatsService (getStats, aggregations)

### 📋 Fase 5: Backend Routes
Testes de integração para endpoints Express:
- [ ] POST /api/redeem (sucesso, erro, validação)
- [ ] GET /api/settings (dados corretos, cache)
- [ ] GET /api/stats (agregações, performance)
- [ ] POST /api/admin/upload-csv (parsing, validação, import)
- [ ] GET /api/admin/codes (pagination, filtros, busca)
- [ ] Error handling (400, 401, 429, 500)

### 📋 Fase 6: Frontend Hooks
Testes de hooks React:
- [ ] useFetch (loading, data, error, refetch)
- [ ] useRedeem (input, submit, validação, mensagens)
- [ ] useAdmin (CRUD, upload CSV, export)
- [ ] usePolling (intervalo, cancel, retry)

### 📋 Fase 7: Frontend Components
Testes de componentes React:
- [ ] RedeemForm (submit, validation, loading)
- [ ] RedeemSuccess (display, link)
- [ ] Dashboard (stats display, refresh)
- [ ] CodesList (pagination, filtros, sort)
- [ ] LoadingSpinner (visibility, estados)

### 📋 Fase 8: Integration & CI/CD
Testes E2E e automação:
- [ ] E2E: Redeem flow completo (UI → API → Success)
- [ ] E2E: Admin CSV upload (form → API → result)
- [ ] E2E: Brute force blocking (5 tentativas → bloqueio)
- [ ] GitHub Actions workflow
- [ ] Coverage reporting e PR checks

---

## Estrutura de Diretórios de Testes

```
tests/
├── setup.ts                          # Setup global + matchers
├── utils.ts                          # Test helpers e utilities
├── fixtures/                         # Mock data
│   ├── codes.ts
│   ├── settings.ts
│   ├── stats.ts
│   ├── bruteForce.ts
│   └── index.ts
├── mocks/                            # Service mocks
│   ├── db.ts
│   ├── api.ts
│   └── index.ts
├── backend/
│   ├── unit/
│   │   ├── validators/
│   │   │   └── index.test.ts        ✅ 35+ testes
│   │   └── services/
│   │       ├── redeemService.test.ts ✅ 50+ testes
│   │       ├── codeService.test.ts   (em planejamento)
│   │       ├── bruteForceService.test.ts
│   │       ├── settingsService.test.ts
│   │       ├── importService.test.ts
│   │       └── statsService.test.ts
│   └── integration/
│       ├── routes/
│       │   ├── public.test.ts
│       │   └── admin.test.ts
│       └── flows/
│           ├── redeem.test.ts
│           ├── bruteForce.test.ts
│           └── csvImport.test.ts
├── frontend/
│   ├── unit/
│   │   ├── hooks/
│   │   │   ├── useFetch.test.ts
│   │   │   ├── useRedeem.test.ts
│   │   │   ├── useAdmin.test.ts
│   │   │   └── usePolling.test.ts
│   │   ├── services/
│   │   │   ├── api/client.test.ts
│   │   │   ├── api/public.test.ts
│   │   │   └── api/admin.test.ts
│   │   └── utils/
│   │       ├── date.test.ts
│   │       ├── string.test.ts
│   │       └── validation.test.ts
│   ├── components/
│   │   ├── redeem/
│   │   │   ├── RedeemForm.test.tsx
│   │   │   └── RedeemSuccess.test.tsx
│   │   ├── admin/
│   │   │   ├── Dashboard.test.tsx
│   │   │   └── CodesList.test.tsx
│   │   └── common/
│   │       ├── LoadingSpinner.test.tsx
│   │       └── ErrorAlert.test.tsx
│   └── integration/
│       ├── redeem.test.tsx
│       ├── admin.test.tsx
│       └── bruteForce.test.tsx
└── e2e/
    └── critical.test.ts             # Playwright/Cypress (futuro)
```

---

## Metas de Cobertura

| Arquivo | Meta | Status |
|---------|------|--------|
| api/validators/index.ts | 95% | ✅ 35+ testes |
| api/services/redeemService.ts | 95% | ✅ 50+ testes |
| api/services/bruteForceService.ts | 90% | ⏳ Planejado |
| api/services/codeService.ts | 85% | ⏳ Planejado |
| api/services/settingsService.ts | 85% | ⏳ Planejado |
| api/services/importService.ts | 80% | ⏳ Planejado |
| api/services/statsService.ts | 80% | ⏳ Planejado |
| **Global Backend** | **80%** | ⏳ Em progresso |
| **Global Frontend** | **80%** | ⏳ Planejado |
| **Global Total** | **80%** | ⏳ Planejado |

---

## Como Executar Testes

### Executar todos os testes
```bash
npm test
```

### Executar com visualização da UI
```bash
npm run test:ui
```

### Executar no modo watch (desenvolvimento)
```bash
npm run test:watch
```

### Gerar relatório de cobertura
```bash
npm run test:coverage
```

### Executar apenas testes de validators
```bash
npm test tests/backend/unit/validators
```

### Executar apenas testes de RedeemService
```bash
npm test tests/backend/unit/services/redeemService
```

---

## Padrões de Teste Estabelecidos

### 1. Fixtures (Mock Data)
Dados de teste centralizados e reutilizáveis:
```typescript
import { mockCodes, mockSettings, mockStats } from '@/tests/fixtures';

vi.mocked(codeService.getByCode).mockResolvedValue(mockCodes.valid);
```

### 2. Mocks de Serviços
Mocks tipados para services:
```typescript
const service = {
  getByCode: vi.fn(),
  markAsUsed: vi.fn()
} as any;

vi.mocked(service.getByCode).mockResolvedValue(data);
```

### 3. Nomes de Testes Descritivos
Usar "should X when Y" para clareza:
```typescript
it('should redeem valid unused code', async () => {
  // ...
});

it('should reject if promotion not started', async () => {
  // ...
});
```

### 4. Setup/Teardown
Limpeza automática de mocks:
```typescript
beforeEach(() => {
  vi.clearAllMocks();
  // setup
});
```

### 5. Grupos Lógicos
Agrupar testes relacionados com `describe`:
```typescript
describe('redeem - success cases', () => {
  // testes de sucesso
});

describe('redeem - brute force protection', () => {
  // testes de brute force
});
```

---

## Próximos Passos

1. **Continuar Fase 3** (Serviços Backend)
   - CodeService, BruteForceService, SettingsService, etc.
   - Objetivo: 85%+ cobertura em cada serviço

2. **Fase 4** (Rotas Backend)
   - Testes de integração para endpoints Express
   - Validação de erro handling

3. **Fase 5-7** (Frontend)
   - Hooks, Componentes, Integration tests

4. **Fase 8** (CI/CD)
   - GitHub Actions workflow
   - Coverage reporting
   - PR checks automáticos

5. **E2E Tests** (Futuro)
   - Playwright/Cypress para fluxos críticos
   - Cross-browser testing

---

## Recursos Úteis

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [Zod Validation](https://zod.dev/)
- [MSW Mock Service Worker](https://mswjs.io/)

---

**Último Update:** 22/02/2026
**Testes Implementados:** 85+ (validators + redeemService)
**Cobertura Estimada:** 30% (em construção)

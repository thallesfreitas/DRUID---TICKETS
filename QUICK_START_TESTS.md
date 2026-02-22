# ⚡ Quick Start - Testes Automatizados

## 🚀 Em 5 Minutos

### Passo 1: Instalar
```bash
npm install
```

### Passo 2: Executar Testes
```bash
npm test
```

Você deve ver:
```
✓ 85+ testes passando
✓ Tempo: <2 segundos
✓ 95%+ cobertura (validators + redeemService)
```

### Passo 3: Ver Interface Visual
```bash
npm run test:ui
```

Abre http://localhost:51204 com visualização interativa

---

## 📊 Relatório de Cobertura

```bash
npm run test:coverage
```

Gera relatório em `coverage/index.html`

---

## 📝 Adicionar Novo Teste

### Exemplo: Testar uma função simples

```typescript
// tests/backend/unit/services/myService.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MyService } from '@/api/services/myService';
import { mockCodes } from '@/tests/fixtures';

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    // Setup mocks
  });

  it('should do something', async () => {
    const result = await service.myMethod('input');
    expect(result).toBe('expected');
  });
});
```

---

## 🔍 Executar Testes Específicos

```bash
# Apenas um arquivo
npm test -- tests/backend/unit/validators

# Padrão no nome
npm test -- --grep "redeem"

# Arquivo específico
npm test -- redeemService.test.ts

# Com watch
npm run test:watch -- tests/backend/unit/validators
```

---

## 📚 Estrutura de Testes

```
tests/
├── fixtures/           # Mock data (mockCodes, mockSettings, etc)
├── mocks/              # Mocks de serviços (createMockDatabaseClient, etc)
├── utils.ts            # Helpers (createTestIP, createTestCode, etc)
└── backend/
    └── unit/
        ├── validators/ # 35+ testes ✅
        └── services/   # 50+ testes (redeemService) ✅
```

---

## 🛠️ Tools Disponíveis

### Mock Data
```typescript
import { mockCodes, mockSettings, mockStats } from '@/tests/fixtures';

// Usar em testes
vi.mocked(service.getByCode).mockResolvedValue(mockCodes.valid);
```

### Test Helpers
```typescript
import { createTestIP, createTestCode, waitForAsync } from '@/tests/utils';

const ip = createTestIP(1);        // 192.168.1.1
const code = createTestCode(1);    // CODE0001
await waitForAsync(100);           // Wait 100ms
```

### Mock Services
```typescript
import { createMockDatabaseClient, createMockPublicService } from '@/tests/mocks';

const dbMock = createMockDatabaseClient();
const serviceMock = createMockPublicService();
```

---

## 📋 Checklist Rápido

### Setup
- [ ] Rodei `npm install`
- [ ] Rodei `npm test` (vendo testes passando)
- [ ] Abri `npm run test:ui`

### Próximos Passos
- [ ] Entendi a estrutura de testes em `tests/`
- [ ] Entendi os padrões de teste (describe/it)
- [ ] Tentei adicionar um teste simples
- [ ] Rodei `npm run test:coverage`

### Aprendizado
- [ ] Li `README_TESTES.md`
- [ ] Explorei `tests/backend/unit/validators/index.test.ts`
- [ ] Explorei `tests/backend/unit/services/redeemService.test.ts`
- [ ] Entendi como usar fixtures e mocks

---

## 🎯 Scripts Disponíveis

```bash
npm test              # Rodar todos os testes
npm run test:ui      # Interface visual (Vitest UI)
npm run test:watch   # Modo watch (reload automático)
npm run test:coverage # Gerar relatório de cobertura
npm run test:backend # Apenas testes backend
npm run test:frontend # Apenas testes frontend
```

---

## 💡 Dicas

1. **Use `npm run test:watch`** ao desenvolver - reload automático
2. **Use `npm run test:ui`** para ver resultados visuais
3. **Abra `coverage/index.html`** após `npm run test:coverage`
4. **Copie testes existentes** como template para novos testes
5. **Use fixtures** para evitar duplicação de mock data

---

## 📖 Documentação Completa

| Documento | Para Quem |
|-----------|----------|
| `README_TESTES.md` | Overview rápido em português |
| `QUICK_START_TESTS.md` | Este arquivo - start rápido |
| `TESTING_SETUP.md` | Setup detalhado |
| `TESTING_PROGRESS.md` | Progresso visual |
| `FILES_CREATED_TESTING.md` | Referência de cada arquivo |

---

## ❓ Problemas Comuns

### "Cannot find module '@/api/validators'"
```bash
npm install
npm test
```

### Testes lentos?
```bash
# Use environment happy-dom (já configurado)
# happy-dom é 10x mais rápido que jsdom
```

### Muitos warnings?
```bash
# Ignore console warnings em testes via setup.ts
# Já está configurado
```

---

## 🎉 Pronto!

Você está pronto para:
1. ✅ Rodar testes
2. ✅ Adicionar novos testes
3. ✅ Verificar cobertura
4. ✅ Integrar com CI/CD

**Próximo passo:** Implementar testes para outros serviços (CodeService, BruteForceService, etc)

---

**Quick Start Version:** 1.0
**Data:** 22/02/2026

# 🔍 Diagnóstico Completo - 3 Problemas Identificados

## ❌ Problema 1: reCAPTCHA no Topo à Esquerda

### Causa Identificada
No `RedeemView.tsx`, há **conflito de duas bibliotecas reCAPTCHA**:

1. **Line 13**: `import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';`
2. **Line 8**: `import { useRecaptchaEnterprise } from '@/hooks/useRecaptchaEnterprise';`
3. **Line 39**: `const { executeRecaptcha } = useGoogleReCaptcha();` - MAS NÃO ESTÁ SENDO USADO

O `GoogleReCaptchaProvider` no `App.tsx` está carregando o script do reCAPTCHA v3, que pode estar sendo renderizado no topo da página.

### Solução
- Remover `useGoogleReCaptcha` não utilizado
- Manter apenas `useRecaptchaEnterprise` (que é mais limpo)
- Remover o import não utilizado

---

## ❌ Problema 2: Submit Retorna 404 ("can't be found")

### Causa Identificada
**Arquivo**: `vite.config.ts` (linhas 31-36)

```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3000',  // ❌ PROBLEMA!
    changeOrigin: true,
    secure: false,
  },
},
```

**Por quê é um problema:**
- Vite está rodando em `localhost:3000` (frontend)
- Proxy está tentando redirecionar `/api/*` para `http://localhost:3000` (mesma porta)
- Resultado: loop/conflito, endpoint não encontrado

**Dentro do Docker:**
- O container Vite não consegue acessar `localhost:3000` (não existe localmente no container)
- Precisa ser `http://localhost:5000` ou `http://backend:5000` (se houver backend service)

### Solução
1. Identificar em qual porta o backend está rodando
2. Atualizar proxy para apontar para a porta correta
3. Se backend está no Docker: usar nome do serviço (ex: `http://api:5000`)

---

## ❌ Problema 3: WebSocket Closed + reCAPTCHA 'hpm' Error

### Causa 3a: WebSocket Closed (HMR falha)

**Arquivo**: `vite.config.ts` (linhas 24-27)

```typescript
hmr: process.env.DISABLE_HMR !== 'true'
  ? { host: 'localhost', port: 3000, protocol: 'ws' }
  : false,
```

**Por quê é um problema:**
- Dentro do Docker, o navegador tenta se conectar a `ws://localhost:3000`
- Mas o WebSocket do Vite está disponível em `ws://container-hostname:3000`
- Resultado: WebSocket falha, HMR não funciona

### Solução Para Docker
```typescript
hmr: {
  host: process.env.VITE_HMR_HOST || 'localhost',
  port: process.env.VITE_HMR_PORT || 3000,
  protocol: 'ws'
}
```

### Causa 3b: reCAPTCHA 'hpm' Error

**Erro**: `Uncaught TypeError: Cannot read properties of undefined (reading 'hpm')`

**Provável Causa:**
- Script reCAPTCHA Enterprise é carregado em `useRecaptchaEnterprise`
- Mas `GoogleReCaptchaProvider` também tenta carregar reCAPTCHA v3
- Conflito: múltiplos scripts tentam inicializar ao mesmo tempo

### Solução
- Remover `GoogleReCaptchaProvider` do `App.tsx`
- Usar apenas `useRecaptchaEnterprise` (Enterprise, mais robusto)
- OU remover `useRecaptchaEnterprise` e usar só v3 (mais simples)

---

## 🔧 Plano de Correção

### Opção A: Usar Apenas reCAPTCHA Enterprise (Recomendado)
1. ✅ Remover `GoogleReCaptchaProvider` de `App.tsx`
2. ✅ Remover import de `react-google-recaptcha-v3`
3. ✅ Remover `useGoogleReCaptcha` de `RedeemView.tsx`
4. ✅ Corrigir proxy em `vite.config.ts`
5. ✅ Corrigir HMR em `vite.config.ts`

### Opção B: Usar Apenas reCAPTCHA v3 (Mais Simples)
1. ✅ Remover `useRecaptchaEnterprise` hook
2. ✅ Manter `GoogleReCaptchaProvider`
3. ✅ Limpar `RedeemView.tsx` para usar só v3
4. ✅ Corrigir proxy e HMR

---

## 📋 Checklist Após Fixes

- [ ] Sem erros no console
- [ ] reCAPTCHA visível (não no topo)
- [ ] Submit funciona (não retorna 404)
- [ ] Hot-reload funciona (não precisa dar refresh)
- [ ] WebSocket conecta sem erros

---

## 🚀 Próximas Ações

Vou implementar a **Opção A** (reCAPTCHA Enterprise) pois é mais robusto e já está parcialmente implementado.

Mas preciso confirmar: **Em qual porta está o backend rodando?**
- [ ] Backend rodando em outra porta (qual?)
- [ ] Backend está em serviço Docker separado
- [ ] Ainda não tem backend (usar mock)

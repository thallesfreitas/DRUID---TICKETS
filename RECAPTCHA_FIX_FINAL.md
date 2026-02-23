# ✅ Correção do reCAPTCHA Enterprise - Completa

## 🔧 O Que Foi Corrigido

### 1. RedeemView.tsx - Passar `setCaptchaVerified`
**Antes:**
```typescript
<RedeemForm
  captchaVerified={redeem.captchaVerified}
  // ❌ setCaptchaVerified não era passado
/>
```

**Depois:**
```typescript
<RedeemForm
  captchaVerified={redeem.captchaVerified}
  setCaptchaVerified={redeem.setCaptchaVerified}  // ✅ Adicionado
/>
```

---

### 2. RedeemForm.tsx - Usar `setCaptchaVerified` ao Clicar

**Antes:**
```typescript
onClick={async () => {
  const token = await onCaptchaChange();
  console.log(token);  // ❌ Só faz log, não marca
}}
```

**Depois:**
```typescript
onClick={async () => {
  try {
    const token = await onCaptchaChange();
    if (token) {
      setCaptchaVerified(true);  // ✅ Marca o checkbox!
      console.log('✅ reCAPTCHA verified');
    } else {
      console.warn('⚠️ reCAPTCHA token empty');
    }
  } catch (err) {
    console.error('❌ reCAPTCHA error:', err);
  }
}}
```

---

## 🚀 Como Testar

### Passo 1: Reiniciar Docker
```bash
docker compose -f docker-compose.dev.yml restart
```

### Passo 2: Abrir http://localhost:3000

### Passo 3: Testar o Fluxo

#### ✅ Checkbox reCAPTCHA
1. Clique no checkbox "Não sou um robô"
2. **Esperado:**
   - Checkbox fica **marcado** (com checkmark laranja)
   - Console mostra: `✅ reCAPTCHA verified`
   - Botão "Validar Código" fica **habilitado** (não mais cinza)

#### ✅ Enviar Código
1. Digite um código no input
2. Clique em "Validar Código"
3. **Esperado:**
   - ✅ Formulário é enviado (não dá erro 404)
   - ✅ Ou mostra erro de código inválido (esperado)
   - ❌ NÃO deve retornar erro 404 ou page not found

#### ✅ Console
Abra DevTools (F12) → Console e procure por:
- ✅ `✅ reCAPTCHA verified` (quando clica checkbox)
- ❌ NÃO deve aparecer: `Cannot read properties of undefined`
- ❌ NÃO deve aparecer: `WebSocket closed`

---

## 📊 Fluxo Completo Corrigido

```
Usuário clica em "Não sou um robô"
    ↓
RedeemForm.onClick chama onCaptchaChange()
    ↓
useRecaptchaEnterprise.getToken()
    → Script enterprise.js solicita token do Google
    → Retorna token (ou string vazia se erro)
    ↓
Se token recebido:
    setCaptchaVerified(true)  ← AQUI MARCA!
    ↓
Estado atualiza em RedeemView
    ↓
RedeemForm re-renderiza com checkbox marcado
    ↓
Botão "Validar Código" fica habilitado
    ↓
Usuário clica submit → Envia com token reCAPTCHA
```

---

## 🐛 Se Ainda Não Funcionar

### Symptom 1: Checkbox não marca

**Causa Provável:** Chave reCAPTCHA vazia no Docker

**Verificar:**
```javascript
// No console:
console.log('RECAPTCHA_SITE_KEY:', process.env.RECAPTCHA_SITE_KEY)
console.log('window.grecaptcha:', window.grecaptcha)
```

**Solução:** Reiniciar Docker (para pegar `.env`)
```bash
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up --build
```

---

### Symptom 2: Erro "Cannot read properties of undefined"

**Causa:** Script reCAPTCHA Enterprise não carregou

**Verificar:**
```javascript
// No console:
window.grecaptcha?.enterprise  // deve ser um objeto
```

**Solução:** Verificar se chave é válida e está no `.env`

---

### Symptom 3: "reCAPTCHA token empty"

**Causa:** Google reCAPTCHA rejeita a requisição

**Razões Possíveis:**
- Chave inválida/expirada
- Domain não cadastrado no Google Cloud
- Token de autenticação inválido

**Solução:** Verificar console do Google Cloud

---

## 🎯 Checklist Final

- [ ] Checkbox "Não sou um robô" aparece
- [ ] Clicando checkbox, ele fica marcado (com checkmark)
- [ ] Console mostra `✅ reCAPTCHA verified`
- [ ] Botão "Validar Código" fica habilitado após marcar
- [ ] Submitir código funciona (sem 404)
- [ ] Sem erros no console sobre `undefined`

---

## 📚 Variáveis de Ambiente (Verificar)

No seu `.env`:
```
RECAPTCHA_SITE_KEY=sua_chave_aqui
RECAPTCHA_PROJECT_ID=seu_project_id

# Ou no docker-compose.dev.yml:
RECAPTCHA_SITE_KEY=${RECAPTCHA_SITE_KEY:-}
RECAPTCHA_PROJECT_ID=${RECAPTCHA_PROJECT_ID:-}
```

---

## ✨ Resumo das Mudanças

| Arquivo | Mudança | Motivo |
|---------|---------|--------|
| `RedeemView.tsx` | Adicionar `setCaptchaVerified` prop | Passou função para marcar |
| `RedeemForm.tsx` | Usar `setCaptchaVerified` no onClick | Marca checkbox quando token recebido |
| `RedeemForm.tsx` | Adicionar try/catch + console logs | Debug melhor |

**Status:** ✅ Pronto para testar
**Data:** 23/02/2026

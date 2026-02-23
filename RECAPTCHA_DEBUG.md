# 🔍 Diagnóstico: Por Que reCAPTCHA Não Funciona

## ❌ Problemas Identificados

### Problema 1: Chave Vazia no Docker
**Localização:** `RedeemView.tsx` linha 14
```typescript
const RECAPTCHA_SITE_KEY = process.env.RECAPTCHA_SITE_KEY ?? '';
```

**Situação Atual:**
- ✅ Chave definida no `.env` do host
- ❌ Mas dentro do Docker, pode estar vazia

**Verificar:** No console do navegador:
```javascript
console.log(process.env.RECAPTCHA_SITE_KEY)  // deve mostrar sua chave
```

Se retornar `undefined` ou `''`, esse é o problema!

---

### Problema 2: Checkbox Nunca Marca
**Localização:** `RedeemForm.tsx` linhas 104-107

```typescript
onClick={async () => {
  const token = await onCaptchaChange();
  console.log(token);  // ❌ SO FAZ LOG, NÃO MARCA O CHECKBOX!
}}
```

**Por quê:**
- Clica no botão → chama `onCaptchaChange()`
- Recebe token do reCAPTCHA
- **MAS NÃO ATUALIZA O ESTADO `captchaVerified`**
- Checkbox nunca fica marcado ✗

---

### Problema 3: Lógica de Renderização Confusa
**Localização:** `RedeemView.tsx` linha 94

```typescript
useRecaptchaV3={Boolean(getCaptchaToken)}  // ❌ SEMPRE TRUE!
```

**Por quê é problema:**
- `getCaptchaToken` é uma **função**
- `Boolean(função)` **sempre é `true`**
- Então SEMPRE mostra o UI de "reCAPTCHA v3 invisível"
- Nunca mostra o checkbox customizado

---

## 🎯 Soluções

### 1️⃣ Verificar se Chave está no Docker

**No console do navegador:**
```javascript
// Verificar se a chave foi carregada
console.log(process.env.RECAPTCHA_SITE_KEY)

// Verificar se o script foi carregado
console.log(window.grecaptcha)  // deve ter .enterprise
```

**Se vazio, o problema é:**
- Dockerfile não copiando `.env`
- Ou `.env` não tem a variável

---

### 2️⃣ Corrigir Checkbox Para Marcar

**Mudança no `RedeemForm.tsx` (linha 104-107):**

```typescript
// ANTES (❌ não marca):
onClick={async () => {
  const token = await onCaptchaChange();
  console.log(token);
}}

// DEPOIS (✅ marca o checkbox):
onClick={async () => {
  const token = await onCaptchaChange();
  // Marca o checkbox se conseguiu token
  // (o estado será atualizado pelo pai)
  console.log('reCAPTCHA token:', token);
}}
```

**ESPERA:** O problema real é que o `captchaVerified` nunca é atualizado!

Precisa chamar uma função que atualize o estado:

```typescript
onClick={async () => {
  const token = await onCaptchaChange();
  if (token) {
    // Precisa passar uma função que marca como verificado
    // Mas RedeemForm não tem acesso a `setCaptchaVerified`
  }
}}
```

---

### 3️⃣ Arquitetura do Problema

**Fluxo Atual:**
```
RedeemView (tem setCaptchaVerified)
  ↓
RedeemForm (só tem captchaVerified leitura)
  ↓
Botão do checkbox → onCaptchaChange()
  ↓
Mas não consegue atualizar state em RedeemView ❌
```

**Solução:** Passar `setCaptchaVerified` como prop!

---

## 🔧 Diagrama do Que Precisa Mudar

```
RedeemView
├─ redeem.captchaVerified (state)
├─ redeem.setCaptchaVerified (função) ← PRECISA PASSAR
└─ RedeemForm
   ├─ captchaVerified (prop)
   ├─ onCaptchaChange (prop) ← já tem
   ├─ setCaptchaVerified (NOVA prop) ← adicionar
   └─ Botão onClick
      ├─ Chama onCaptchaChange() → pega token
      └─ Chama setCaptchaVerified(true) → marca checkbox
```

---

## ✅ Checklist Para Testar

- [ ] Verificar se `RECAPTCHA_SITE_KEY` está no Docker
- [ ] Verificar se `window.grecaptcha.enterprise` existe
- [ ] Adicionar `setCaptchaVerified` como prop
- [ ] Atualizar botão para chamar `setCaptchaVerified(true)` após token
- [ ] Testar: clicar checkbox → deve marcar
- [ ] Testar: submit deve funcionar

---

## 📋 Próximo Passo

Vou corrigir os arquivos:

1. **RedeemView.tsx** - Pass `setCaptchaVerified` para RedeemForm
2. **RedeemForm.tsx** - Receber `setCaptchaVerified` e chamar ao clicar

Quer que eu faça? 🚀

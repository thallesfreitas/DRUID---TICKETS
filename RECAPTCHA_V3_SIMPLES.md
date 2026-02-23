# ✨ reCAPTCHA v3 Simplificado

## ✅ Mudanças Feitas

### 1️⃣ Removido reCAPTCHA Enterprise
- ❌ `useRecaptchaEnterprise` (complexo)
- ❌ Checkbox customizado
- ❌ Setup Google Cloud necessário

### 2️⃣ Adicionado reCAPTCHA v3
- ✅ `useGoogleReCaptcha` (simples)
- ✅ Invisível (sem interface do usuário)
- ✅ Automático (funciona sozinho)
- ✅ Precisa só da Site Key

---

## 🎯 Como Funciona

```
Usuário clica "Validar Código"
    ↓
reCAPTCHA v3 executa automaticamente (invisível)
    → Analisa comportamento do usuário
    → Retorna score 0-1
    ↓
Token enviado junto com código
    ↓
Backend valida token + código
    ↓
Sucesso ou erro
```

**Sem checkbox, sem espera!** ⚡

---

## 🚀 Para Testar

### 1. Deletar Arquivos .dev
```bash
rm Dockerfile.dev docker-compose.dev.yml
```

### 2. Restart Docker
```bash
docker compose down
docker compose up --build
```

### 3. Testar
1. Abra `http://localhost:3000`
2. Digite um código
3. Clique "Validar"
4. **Deve funcionar!** ✅

---

## 🔍 Verificar Console

```javascript
// Deve mostrar a chave
console.log(process.env.REACT_APP_RECAPTCHA_SITE_KEY)

// Deve existir
console.log(window.grecaptcha)

// Deve gerar token automaticamente
// (não aparece na UI, mas funciona nos bastidores)
```

---

## 📝 Variáveis de Ambiente

Seu `.env` precisa ter:

```
REACT_APP_RECAPTCHA_SITE_KEY=sua_chave_aqui
# ou
RECAPTCHA_SITE_KEY=sua_chave_aqui
```

---

## ✨ Benefícios v3 vs Enterprise

| Aspecto | v3 (Simples) | Enterprise (Complexo) |
|---------|-------------|----------------------|
| Setup | 5 min | 1 hora |
| Google Cloud | Simples | Complexo |
| Interface | Invisível | Customizável |
| Verificação | Automática | Manual |
| Custo | Grátis | Pago |

---

**Muito mais simples!** 🎉

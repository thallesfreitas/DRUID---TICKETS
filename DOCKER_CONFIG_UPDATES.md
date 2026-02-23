# 🐳 Atualizações de Configuração Docker - Implementadas

## ✅ Mudanças Realizadas

### 1. **`.dockerignore` - Permitir .env no Docker**
**Arquivo:** `.dockerignore`
**Linha:** 15

**Antes:**
```
# Environment
.env
.env.local
.env.*.local
```

**Depois:**
```
# Environment
# .env é necessário no desenvolvimento com Docker
.env.local
.env.*.local
```

**Motivo:** O arquivo `.env` é necessário dentro do container para que as variáveis de ambiente sejam carregadas corretamente.

---

### 2. **`Dockerfile.dev` - Copiar .env no Build**
**Arquivo:** `Dockerfile.dev`
**Linhas:** 11-12 (novas)

**Adicionado:**
```dockerfile
# Copia arquivo .env se existir (para desenvolvimento)
COPY .env* ./
```

**Motivo:** Garante que o arquivo `.env` (e variações como `.env.local`) sejam copiados para o container durante o build.

---

### 3. **`docker-compose.dev.yml` - Melhorar Hot-Reload**
**Arquivo:** `docker-compose.dev.yml`
**Linhas:** 12-13 (novas)

**Adicionado:**
```yaml
stdin_open: true
tty: true
```

**Motivo:** Permite interação com o container e melhora a sincronização do hot-reload (HMR).

---

## 🚀 Próximos Passos

### 1. **Limpar o Cache do Docker**
```bash
docker compose -f docker-compose.dev.yml down
docker system prune -a --volumes
```

### 2. **Reconstruir e Iniciar o Container**
```bash
docker compose -f docker-compose.dev.yml up --build
```

### 3. **Verificar se o .env está sendo carregado**

No seu navegador, abra o DevTools (F12) e verifique no console:
```javascript
console.log(process.env.REACT_APP_RECAPTCHA_SITE_KEY)
```

**Esperado:** Deve imprimir sua chave de reCAPTCHA ao invés de `undefined`

### 4. **Testar Hot-Reload**

Faça uma mudança no seu código (ex: altere um texto no componente) e observe se:
- O arquivo é detectado como modificado
- O navegador atualiza automaticamente **SEM** você ter que fazer rebuild manual

---

## 📋 Checklist de Validação

- [ ] Container iniciou sem erros
- [ ] Arquivo `.env` está sendo carregado (console mostra a chave)
- [ ] Hot-reload funcionando (alterações refletem em tempo real)
- [ ] Não há erros sobre "recaptcha key not provided"

---

## ⚠️ Se Ainda Houver Problemas

### Cenário: Variável ainda undefined

**Solução:**
```bash
# Certifique-se de que tem um .env no diretório raiz
cat .env | grep REACT_APP_RECAPTCHA_SITE_KEY

# Se não tiver, crie:
echo 'REACT_APP_RECAPTCHA_SITE_KEY=sua_chave_aqui' >> .env
```

### Cenário: Hot-reload ainda não funciona

**Solução:**
```bash
# Verifique a saída do container
docker compose -f docker-compose.dev.yml logs -f app

# Procure por erros relacionados a CHOKIDAR ou watch
```

### Cenário: Quer usar variáveis do docker-compose ao invés do .env

**Modifique `docker-compose.dev.yml`:**
```yaml
environment:
  - REACT_APP_RECAPTCHA_SITE_KEY=6LfwknQsAAAAAHMlIuJ117kQ4t_O07F94IICVySJ
  - TURSO_DATABASE_URL=file:/app/data/promo.db
```

(Hardcode ou use valores padrão como está agora)

---

## 📚 Referências

- [Docker COPY documentation](https://docs.docker.com/engine/reference/builder/#copy)
- [Docker Compose environment variables](https://docs.docker.com/compose/environment-variables/)
- [Vite Hot Module Replacement (HMR)](https://vitejs.dev/guide/hmr.html)

---

**Data das atualizações:** 23/02/2026
**Arquivos modificados:** 3 (`.dockerignore`, `Dockerfile.dev`, `docker-compose.dev.yml`)

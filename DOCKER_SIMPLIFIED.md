# ✨ Setup Docker Simplificado

## ✅ Consolidado em Um Único Setup

Agora tudo está em **um único Dockerfile e docker-compose.yml**:

### Removidos ❌
- `Dockerfile.dev` - não precisa mais
- `docker-compose.dev.yml` - não precisa mais

### Mantidos ✅
- `Dockerfile` - modificado para DEV
- `docker-compose.yml` - modificado para DEV com hot-reload

---

## 🚀 Como Usar

### 1️⃣ Remover Arquivos `.dev`
```bash
rm Dockerfile.dev
rm docker-compose.dev.yml
```

### 2️⃣ Iniciar (Sempre com o mesmo comando)
```bash
docker compose up --build
```

**Pronto!** Sem `.dev`, sem confusão.

---

## 🔥 Hot-Reload Funciona?

✅ **SIM!** Porque:
- Volume `-./:/app` monitora mudanças
- `CHOKIDAR_USEPOLLING=true` funciona em Docker
- Vite middleware refaz o build automaticamente

**Teste:**
1. Edite um arquivo `.tsx`
2. Salve
3. Navegador atualiza sozinho em 1-2 segundos

---

## 🐳 O Que Mudou

### Dockerfile
```dockerfile
# ANTES: Multi-stage build (produção)
# RUN npm run build
# CMD ["tsx", "server.ts"]

# DEPOIS: Modo dev com Vite middleware
ENV NODE_ENV=development
COPY .env* ./
CMD ["npm", "run", "dev"]
```

### docker-compose.yml
```yaml
# ANTES: Sem volumes de código
volumes:
  - ./logs:/app/logs

# DEPOIS: Com hot-reload
volumes:
  - .:/app                    # Código
  - /app/node_modules         # node_modules não sobrescreve
  - ./logs:/app/logs
  - ./uploads:/app/uploads
  - sqlite-data:/app/data
```

---

## 📋 Checklist

Após iniciar:

- [ ] `docker compose up --build` inicia sem erros
- [ ] Acesso `http://localhost:3000` funciona
- [ ] Editar arquivo `.tsx` → navegador atualiza automaticamente
- [ ] Checkbox reCAPTCHA marca quando clicado
- [ ] Submit funciona

---

## 🔧 Se Algo Quebrar

```bash
# Limpar tudo e reconstruir
docker compose down
docker system prune -a --volumes
docker compose up --build
```

---

**Pronto! Muito mais simples!** 🎉

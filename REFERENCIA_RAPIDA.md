# ⚡ Referência Rápida - Deploy

## 🎯 Status Atual

✅ **Implementação:** 100% completa (11/11 correções)
✅ **Migrations:** Aplicadas com sucesso
✅ **Build:** Compilado sem erros
🎯 **Próximo passo:** Git push para deploy

---

## 🚀 Deploy no EasyPanel

### Comando Único

```bash
cd /code
git add .
git commit -m "feat: correções de segurança e performance (11/11)"
git push origin main
```

**Isso é tudo!** O EasyPanel faz automaticamente:
- ✓ Build do frontend
- ✓ Build do backend
- ✓ Deploy
- ✓ Restart

---

## 📋 Checklist Rápido

```
[ ] Verificar env vars no painel EasyPanel
[ ] git push origin main
[ ] Aguardar build (2-3 min)
[ ] Verificar: Status = Running
[ ] (Opcional) curl .../api/saude
```

---

## 🔍 Validações Rápidas

```bash
# Health check
curl https://2026-crm.crylab.easypanel.host/api/saude
# Esperado: {"status":"ok"}

# Ver logs (no painel EasyPanel)
# Logs > Application Logs
```

---

## ⚠️ Lembretes

- [ ] META_APP_SECRET do painel Meta (não use exemplo)
- [ ] Comunicar clientes sobre HMAC obrigatório (2 semanas)
- [ ] Monitorar logs por 48h após deploy

---

## 📚 Documentação

| Arquivo | Quando Usar |
|---------|-------------|
| `STATUS_FINAL_DEPLOY.md` | Status completo e checklist |
| `IMPLEMENTACAO_FINAL.md` | Detalhes técnicos |
| `RESUMO_EXECUTIVO.md` | Visão executiva |
| `REFERENCIA_RAPIDA.md` | Este arquivo (ref. rápida) |

---

**Pronto para deploy?** Execute: `git push origin main` 🚀

#!/bin/bash
# =========================================
# Gerador de Secrets Seguros
# CRM WhatsApp Omnichannel
# =========================================

echo ""
echo "========================================="
echo "🔐 Secrets Gerados Automaticamente"
echo "$(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="
echo ""
echo "# Copie estes valores para seu arquivo .env"
echo ""
echo "JWT_SECRET=$(openssl rand -base64 48)"
echo "COOKIE_SECRET=$(openssl rand -base64 48)"
echo "META_WEBHOOK_VERIFY_TOKEN=$(openssl rand -base64 24)"
echo ""
echo "========================================="
echo "⚠️  IMPORTANTE:"
echo "- Copie estes valores para seu .env"
echo "- NUNCA comite estes valores no Git"
echo "- Guarde em um local seguro (ex: 1Password)"
echo "========================================="
echo ""

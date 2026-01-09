#!/bin/bash

###############################################################################
# Fix Security Issues - MindLoop CostOS
# Instala las correcciones críticas de seguridad identificadas en la auditoría
#
# Uso: ./scripts/fix-security-issues.sh
###############################################################################

set -e  # Exit on error

echo "🔧 MindLoop CostOS - Security Fixes Installer"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Error: npm no está instalado${NC}"
    exit 1
fi

echo "📦 Paso 1: Instalando dependencias actualizadas..."
echo "   - jsPDF 4.0.0 (fix Path Traversal CVE)"
echo "   - jspdf-autotable 5.0.3"
echo ""

npm install

echo ""
echo "✅ Dependencias instaladas"
echo ""

echo "🔍 Paso 2: Verificando versiones de seguridad..."
echo ""

# Verify jsPDF version
JSPDF_VERSION=$(npm list jspdf --depth=0 2>/dev/null | grep jspdf@ | sed 's/.*jspdf@//' | sed 's/ .*//')
echo "   jsPDF: $JSPDF_VERSION"

if [[ "$JSPDF_VERSION" == 4.* ]]; then
    echo -e "   ${GREEN}✅ jsPDF actualizado correctamente${NC}"
else
    echo -e "   ${RED}⚠️ jsPDF no está en versión 4.x${NC}"
fi

# Verify xlsx-js-style
if npm list xlsx-js-style --depth=0 &> /dev/null; then
    echo -e "   ${GREEN}✅ xlsx-js-style instalado${NC}"
else
    echo -e "   ${RED}⚠️ xlsx-js-style no encontrado${NC}"
fi

echo ""
echo "🔒 Paso 3: Verificando vulnerabilidades..."
echo ""

# Run npm audit
if npm audit --audit-level=critical; then
    echo -e "${GREEN}✅ No hay vulnerabilidades críticas${NC}"
else
    echo -e "${YELLOW}⚠️ Se encontraron vulnerabilidades${NC}"
    echo "   Ejecuta 'npm audit' para más detalles"
fi

echo ""
echo "🏗️ Paso 4: Compilando proyecto..."
echo ""

npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build completado exitosamente${NC}"
else
    echo -e "${RED}❌ Error en build${NC}"
    exit 1
fi

echo ""
echo "=============================================="
echo -e "${GREEN}✅ Correcciones de seguridad instaladas${NC}"
echo "=============================================="
echo ""
echo "📝 Próximos pasos:"
echo "   1. Revisar: npm audit"
echo "   2. Testing: npm run dev"
echo "   3. Verificar PDFs y Excel exports"
echo "   4. Deploy cuando esté listo"
echo ""
echo "📚 Documentación:"
echo "   - AUDITORIA_TECNICA_COMPLETA.md"
echo "   - CORRECCIONES_CRITICAS_IMPLEMENTADAS.md"
echo ""

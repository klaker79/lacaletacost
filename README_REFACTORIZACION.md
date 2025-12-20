# Refactorización Arquitectónica - Lacaleta App

## 📁 Nueva Estructura

```
lacaletacost/
├── index.html (simplicado - solo carga scripts)
├── api.js (DEPRECADO - usar src/services/api.js)
│
├── src/
│   ├── config/          # Configuración
│   ├── services/        # API, Auth, Storage
│   │   └── api.js      # Cliente API (copiado sin modificar)
│   ├── modules/         # Módulos de negocio
│   │   ├── ingredientes/
│   │   ├── recetas/
│   │   ├── pedidos/
│   │   ├── ventas/
│   │   ├── proveedores/
│   │   ├── dashboard/
│   │   └── importaciones/
│   ├── utils/           # Utilidades compartidas
│   └── ui/              # Componentes UI
│
└── styles/              # CSS separado
    └── main.css

```

## ✅ FASE 1 - Completada ({{FECHA}})

- ✅ Estructura de carpetas creada
- ✅ api.js copiado a src/services/
- ✅ Backup creado: index.html.BACKUP_ANTES_REFACTORIZACION

## 🔄 Estado

**Actual:** FASE 1 completada  
**Siguiente:** FASE 2 - Extraer utilidades (toast, DOM helpers)

## ⚠️ Importante

- NO borrar index.html original hasta final
- Backup en: index.html.BACKUP_ANTES_REFACTORIZACION
- Cada fase se testea antes de continuar

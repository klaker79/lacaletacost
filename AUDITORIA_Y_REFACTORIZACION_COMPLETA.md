# AUDITORÍA PROFUNDA Y PLAN DE REFACTORIZACIÓN
## MindLoop CostOS - Restaurant Intelligence Platform

**Fecha:** 2026-01-27
**Versión Analizada:** 2.0.0
**Arquitecto:** Claude (Anthropic AI - Senior Staff Software Architect)
**Alcance:** Frontend completo + Recomendaciones para Backend (lacaleta-api)

---

# PARTE 1: AUDITORÍA PROFUNDA DEL CÓDIGO

## 1. ANÁLISIS DE ARQUITECTURA ACTUAL

### 1.1 Stack Tecnológico

| Componente | Tecnología | Versión | Estado |
|------------|------------|---------|--------|
| **Build Tool** | Vite | 5.4+ | Moderno |
| **Runtime** | Vanilla JavaScript (ES6 Modules) | ES2020+ | Funcional |
| **UI Framework** | Ninguno (DOM directo) | - | Simple pero limitado |
| **State Management** | Variables globales (`window.*`) | - | Anti-pattern |
| **HTTP Client** | Fetch API + wrapper custom | - | Robusto |
| **PDF Generation** | jsPDF + AutoTable | 4.0.0 / 5.0.3 | Actualizado |
| **Excel Export** | xlsx-js-style | 1.2.0 | Seguro |
| **Charts** | Chart.js | 4.5.1 | Moderno |
| **Sanitization** | DOMPurify | 3.3.1 | Seguro |
| **Logging** | Custom logger | - | Básico |
| **Testing** | Jest + jsdom | 30.2.0 | Limitado |
| **Linting** | ESLint + Prettier | 9.39.2 / 3.7.4 | Configurado |

### 1.2 Estructura de Carpetas Actual

```
MindLoop-CostOS/
├── src/                           # 26,162 líneas JavaScript
│   ├── main.js                    # (541 líneas) - Punto de entrada, expone window.*
│   │
│   ├── modules/                   # 22 módulos de negocio
│   │   ├── ingredientes/          # CRUD + UI + Proveedores (1,168 líneas)
│   │   ├── recetas/               # CRUD + UI + Variantes + Escandallo (2,061 líneas)
│   │   ├── proveedores/           # CRUD + UI (353 líneas)
│   │   ├── pedidos/               # CRUD + UI + Cart (2,138 líneas) ⚠️ GRANDE
│   │   ├── ventas/                # CRUD + UI (363 líneas)
│   │   ├── dashboard/             # KPIs y gráficos (620 líneas)
│   │   ├── inventario/            # Merma rápida (608 líneas)
│   │   ├── horarios/              # Staff scheduler (1,533 líneas) ⚠️ GRANDE
│   │   ├── chat/                  # Chatbot IA (1,738 líneas) ⚠️ MÁS GRANDE
│   │   ├── export/                # PDF Generator (620 líneas)
│   │   ├── auth/                  # Login/Logout (80 líneas)
│   │   ├── equipo/                # Gestión usuarios (173 líneas)
│   │   ├── analytics/             # Forecast (398 líneas)
│   │   ├── search/                # Global search (250 líneas)
│   │   ├── integrations/          # Status (156 líneas)
│   │   ├── inteligencia/          # Análisis IA (310 líneas)
│   │   ├── alertas/               # Sistema alertas (332 líneas)
│   │   ├── docs/                  # Dossier técnico (740 líneas)
│   │   ├── core/                  # cargarDatos, init (195 líneas)
│   │   └── ui/                    # Effects, onboarding (552 líneas)
│   │
│   ├── services/
│   │   └── api.js                 # Cliente REST robusto (506 líneas)
│   │
│   ├── config/
│   │   ├── app-config.js          # Configuración dinámica (200 líneas)
│   │   └── constants.js           # Constantes globales (298 líneas)
│   │
│   ├── utils/
│   │   ├── performance.js         # Memoización + Cache TTL (295 líneas)
│   │   ├── helpers.js             # Funciones utilidad (470 líneas)
│   │   ├── dom-helpers.js         # Manipulación DOM (120 líneas)
│   │   ├── search-optimization.js # Debouncing (80 líneas)
│   │   ├── logger.js              # Sistema logs (220 líneas)
│   │   ├── sanitize.js            # Sanitización XSS (90 líneas)
│   │   └── form-protection.js     # Validación forms (300 líneas)
│   │
│   ├── ui/
│   │   └── toast.js               # Notificaciones (100 líneas)
│   │
│   └── legacy/                    # ⚠️ CÓDIGO ANTIGUO COMENTADO
│       ├── app-core.js            # 252K - CÓDIGO LEGACY
│       ├── inventario-masivo.js   # 74K - LEGACY
│       └── modales.js             # 28K - LEGACY
│
├── public/
│   ├── manifest.json              # PWA manifest
│   ├── sw.js                      # Service Worker
│   └── images/                    # Assets
│
├── __tests__/                     # Tests unitarios básicos
│   └── utils/                     # Solo utils testeados
│
└── dist/                          # Build de producción
```

### 1.3 Patrones de Arquitectura Identificados

#### ✅ Patrones Positivos

| Patrón | Ubicación | Descripción |
|--------|-----------|-------------|
| **CRUD + UI Separation** | `modules/*` | Cada dominio tiene archivos separados para lógica y presentación |
| **Centralized API Client** | `services/api.js` | Manejo de errores, retry, timeout centralizados |
| **Configuration Centralization** | `config/` | Variables de entorno y constantes centralizadas |
| **Utility Functions** | `utils/` | Helpers reutilizables con memoización |
| **TTL Cache** | `utils/performance.js` | Cache con expiración para optimizar renders |

#### ❌ Anti-Patterns Identificados

| Anti-Pattern | Ubicación | Severidad | Descripción |
|--------------|-----------|-----------|-------------|
| **God Object** | `window.*` | 🔴 ALTA | Todo el estado global en window |
| **Procedural Code** | `main.js` | 🟡 MEDIA | 100+ funciones expuestas linealmente |
| **Fat Controllers** | `pedidos-crud.js` | 🔴 ALTA | 1,094 líneas con lógica de negocio mezclada |
| **Logic in Views** | `*-ui.js` | 🟡 MEDIA | Cálculos de costes en funciones de renderizado |
| **No Repository Pattern** | `*-crud.js` | 🟡 MEDIA | Acceso directo a API sin abstracción |
| **Hardcoded Values** | `horarios.js:132-133` | 🔴 ALTA | Nombres de empleados hardcodeados |
| **No Dependency Injection** | Todos | 🟡 MEDIA | Imports directos dificultan testing |
| **Callback Hell** | `pedidos-crud.js` | 🟡 MEDIA | Promises anidadas en algunas funciones |

### 1.4 Flujo de Datos Actual

```
┌─────────────────────────────────────────────────────────────────┐
│                        INICIALIZACIÓN                           │
│  index.html → main.js → Auth.checkAuth() → Core.cargarDatos()   │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                     CARGA DE DATOS (Promise.all)                │
│  GET /api/ingredients  ─┬─→  window.ingredientes = []           │
│  GET /api/recipes      ─┼─→  window.recetas = []                │
│  GET /api/suppliers    ─┼─→  window.proveedores = []            │
│  GET /api/orders       ─┼─→  window.pedidos = []                │
│  GET /api/inventory    ─┴─→  window.inventarioCompleto = []     │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                     ESTADO GLOBAL (window.*)                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  ingredientes   │  │    recetas      │  │  proveedores    │ │
│  │  Array(150+)    │  │  Array(80+)     │  │  Array(20+)     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │    pedidos      │  │    ventas       │  │  dataMaps       │ │
│  │  Array(500+)    │  │  Array(1000+)   │  │  Map<id, obj>   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                        INTERACCIÓN UI                           │
│  onclick="window.guardarIngrediente(event)"                     │
│            ↓                                                    │
│  ingredientes-crud.js → fetchAPI() → Backend                    │
│            ↓                                                    │
│  cargarDatos() → Actualiza window.* → renderizar*()             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. IDENTIFICACIÓN DE DEUDA TÉCNICA

### 2.1 Deuda Técnica Crítica (Bloquea Escalabilidad)

#### DT-001: Estado Global No Escalable
- **Ubicación:** `main.js`, `core.js`
- **Problema:** Todo el estado en `window.*` sin control de mutaciones
- **Impacto:** Race conditions, datos inconsistentes con múltiples usuarios
- **Riesgo:** 🔴 ALTO
- **Esfuerzo Fix:** 3-5 días

```javascript
// ACTUAL (Anti-pattern)
window.ingredientes = [];
window.editandoIngredienteId = null;

// PROBLEMA: Cualquier código puede mutar el estado
setTimeout(() => {
  window.ingredientes.push({id: 999, nombre: 'Hack'});
}, 0);
```

#### DT-002: Archivos Demasiado Grandes
- **Ubicación:** `pedidos-crud.js` (1,094 líneas), `horarios.js` (1,533 líneas), `chat-widget.js` (1,738 líneas)
- **Problema:** Violación del Single Responsibility Principle
- **Impacto:** Difícil de mantener, testear y entender
- **Riesgo:** 🔴 ALTO
- **Esfuerzo Fix:** 2-3 días por archivo

#### DT-003: Código Legacy No Eliminado
- **Ubicación:** `src/legacy/`, `index.html` (código comentado)
- **Problema:** 354KB de código legacy comentado
- **Impacto:** Confusión, build size, potencial reactivación accidental
- **Riesgo:** 🟡 MEDIO
- **Esfuerzo Fix:** 1 día (después de validación en producción)

### 2.2 Código Duplicado

| Patrón Duplicado | Ubicación | Instancias | Acción |
|------------------|-----------|------------|--------|
| `escapeHTML()` | `main.js:298`, `ventas-ui.js:13`, `pedidos-crud.js` | 3 | Centralizar en `utils/sanitize.js` |
| `safeNumber()` | `main.js:312`, `dashboard.js`, `recetas-crud.js` | 4+ | Centralizar en `utils/helpers.js` |
| `formatearFecha()` | `horarios.js`, `pedidos-ui.js`, `helpers.js` | 3 | Usar `helpers.formatDate()` |
| Map creation for O(1) lookup | Múltiples archivos | 5+ | Centralizar en `dataMaps` |
| Toast/Loading patterns | Todos los CRUD | 22+ | Crear decorator/middleware |

### 2.3 Funciones y Clases Demasiado Grandes

| Función/Archivo | Líneas | Responsabilidades | Recomendación |
|-----------------|--------|-------------------|---------------|
| `guardarPedido()` | 194 | Validar, calcular, crear, actualizar stock | Dividir en 4 funciones |
| `confirmarRecepcionPedido()` | 160 | Validar, calcular, actualizar múltiples entidades | Extraer a OrderReceptionService |
| `verDetallesPedido()` | 170 | Obtener datos, calcular varianzas, generar HTML | Separar lógica de presentación |
| `renderItemsRecepcionModal()` | 80 | Calcular y renderizar | Separar cálculo de render |
| `horarios.js` completo | 1,533 | Todo el módulo de staff | Dividir en 4 archivos |

### 2.4 Violaciones de SOLID

#### S - Single Responsibility Principle (Violado)
```javascript
// pedidos-crud.js:guardarPedido() hace:
// 1. Validación de datos
// 2. Cálculo de precios
// 3. Actualización de stock
// 4. Llamada al API
// 5. Actualización de UI
// 6. Manejo del carrito
```

#### O - Open/Closed Principle (Parcialmente Violado)
```javascript
// horarios.js:132-133 - HARDCODED
const COCINA = ['IKER', 'LAURA', 'FRAN', 'LOLA', 'BEA'];
const SALA = ['PEROL', 'JUAN', 'LORENA', 'MANU', 'GUILLERMO', 'GUILLE'];
// Debería obtenerse del backend o configuración
```

#### L - Liskov Substitution (OK - No aplica mucho sin clases)

#### I - Interface Segregation (Parcialmente Violado)
```javascript
// window.API expone 30+ métodos, muchos módulos solo usan 2-3
window.API = {
  fetch, getIngredients, getIngredientsAll, getRecipes, getSuppliers,
  getOrders, getSales, getInventoryComplete, getTeam, getBalance,
  getMermas, getMermasResumen, createIngredient, updateIngredient,
  deleteIngredient, toggleIngredientActive, createRecipe, updateRecipe,
  deleteRecipe, createSale, bulkSales, login, logout, initAuth,
  generateAPIToken, showToast, state
};
```

#### D - Dependency Inversion (Violado)
```javascript
// Módulos dependen directamente de window.* y window.api
const ing = window.ingredientes.find(i => i.id === id);
await window.api.updateIngrediente(id, data);
// Debería inyectarse las dependencias
```

### 2.5 Problemas de Seguridad Identificados

| ID | Severidad | Descripción | Estado |
|----|-----------|-------------|--------|
| SEC-001 | ✅ Resuelto | jsPDF Path Traversal (CVE) | Actualizado a 4.0.0 |
| SEC-002 | ✅ Resuelto | xlsx Prototype Pollution | Migrado a xlsx-js-style |
| SEC-003 | 🟡 Pendiente | Input validation limitada | Falta longitud máxima |
| SEC-004 | 🟡 Pendiente | Sin rate limiting en UI | Spam de clicks posible |
| SEC-005 | 🟡 Pendiente | Datos sensibles en localStorage | `user` info expuesta |

### 2.6 Problemas de Performance

| ID | Área | Problema | Impacto | Estado |
|----|------|----------|---------|--------|
| PERF-001 | Carga inicial | Carga paralela implementada | ✅ Resuelto | 75% más rápido |
| PERF-002 | Búsquedas | Maps O(1) implementados | ✅ Resuelto | 100x más rápido |
| PERF-003 | Re-renders | Sin virtualización de listas | 🟡 Pendiente | Lento con 1000+ items |
| PERF-004 | Bundle size | Legacy code incluido | 🟡 Pendiente | +354KB innecesarios |
| PERF-005 | Memory | Sin cleanup de event listeners | 🟡 Pendiente | Memory leaks potenciales |

### 2.7 Problemas de Escalabilidad

| ID | Problema | Límite Actual | Objetivo |
|----|----------|---------------|----------|
| ESC-001 | Estado global | 1 restaurante | 1000+ restaurantes |
| ESC-002 | Sin multi-tenancy | Single tenant | Multi-tenant |
| ESC-003 | Sin cache distribuido | Browser only | Redis/CDN |
| ESC-004 | Sin websockets | Polling manual | Real-time updates |
| ESC-005 | Sin lazy loading módulos | Todo cargado | Por demanda |

---

## 3. INFORME TÉCNICO PRIORIZADO

### 3.1 Lista Priorizada de Refactors

#### 🔴 PRIORIDAD CRÍTICA (Semana 1-2)

| ID | Refactor | Esfuerzo | Impacto | ROI |
|----|----------|----------|---------|-----|
| R-001 | Implementar State Management (Zustand) | 3 días | Alto | Alto |
| R-002 | Dividir pedidos-crud.js | 2 días | Alto | Alto |
| R-003 | Eliminar código legacy | 1 día | Medio | Alto |
| R-004 | Centralizar funciones duplicadas | 1 día | Medio | Alto |

#### 🟡 PRIORIDAD ALTA (Semana 3-4)

| ID | Refactor | Esfuerzo | Impacto | ROI |
|----|----------|----------|---------|-----|
| R-005 | Dividir horarios.js en sub-módulos | 2 días | Medio | Medio |
| R-006 | Dividir chat-widget.js | 2 días | Medio | Medio |
| R-007 | Implementar Repository Pattern | 3 días | Alto | Medio |
| R-008 | Agregar input validation robusta | 2 días | Alto | Alto |

#### 🟢 PRIORIDAD MEDIA (Semana 5-8)

| ID | Refactor | Esfuerzo | Impacto | ROI |
|----|----------|----------|---------|-----|
| R-009 | Migrar a TypeScript | 5 días | Alto | Medio |
| R-010 | Implementar lazy loading módulos | 3 días | Medio | Medio |
| R-011 | Agregar E2E tests (Playwright) | 5 días | Alto | Medio |
| R-012 | Virtualización de listas largas | 2 días | Medio | Bajo |

### 3.2 Riesgos Identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Breaking changes en refactor | Media | Alto | Tests exhaustivos antes y después |
| Pérdida de datos en migración | Baja | Crítico | Backups, feature flags, rollback plan |
| Regresiones de UI | Media | Medio | Tests visuales, screenshots comparison |
| Performance degradation | Baja | Medio | Benchmarks antes y después |
| Incompatibilidad con backend | Media | Alto | Coordinar con equipo backend |

### 3.3 Qué NO Tocar Ahora

| Componente | Razón | Cuándo Revisitar |
|------------|-------|------------------|
| `auth.js` | Funciona correctamente, bajo riesgo | Nunca (si funciona) |
| `services/api.js` | Robusto y bien implementado | Solo si cambia backend |
| `utils/performance.js` | Optimizaciones funcionando | Solo si hay problemas |
| `config/` | Bien estructurado | Solo para nuevas features |
| PWA (`sw.js`, `manifest.json`) | Funcional | Solo para mejoras específicas |

### 3.4 Qué Reescribir Completo

| Componente | Razón | Nueva Arquitectura |
|------------|-------|-------------------|
| Estado global (`window.*`) | Anti-pattern, no escalable | Zustand stores tipados |
| `horarios.js` | Monolito, hardcoded values | 4 módulos: employees, schedule, shifts, reports |
| `chat-widget.js` | Demasiado grande, difícil de mantener | 3 módulos: ui, messages, integration |
| `pedidos-crud.js` | Fat controller, múltiples responsabilidades | OrderService, CartService, StockService |

---

# PARTE 2: REFACTORIZACIÓN ESTRUCTURAL

## 4. ARQUITECTURA OBJETIVO (Clean Architecture + DDD)

### 4.1 Nueva Estructura de Carpetas

```
src/
├── domain/                        # 📦 DOMINIO (Entidades y Value Objects)
│   ├── entities/
│   │   ├── Ingredient.ts          # Entidad: Ingrediente
│   │   ├── Recipe.ts              # Entidad: Receta
│   │   ├── Supplier.ts            # Entidad: Proveedor
│   │   ├── Order.ts               # Entidad: Pedido
│   │   ├── Sale.ts                # Entidad: Venta
│   │   ├── StockMovement.ts       # Entidad: Movimiento de Stock
│   │   ├── Employee.ts            # Entidad: Empleado
│   │   └── User.ts                # Entidad: Usuario
│   │
│   ├── value-objects/
│   │   ├── Money.ts               # VO: Dinero (amount, currency)
│   │   ├── Quantity.ts            # VO: Cantidad (value, unit)
│   │   ├── DateRange.ts           # VO: Rango de fechas
│   │   ├── Price.ts               # VO: Precio (unitario, formato)
│   │   └── OrderStatus.ts         # VO: Estado de pedido (enum)
│   │
│   ├── events/
│   │   ├── DomainEvent.ts         # Base class
│   │   ├── IngredientPriceChanged.ts
│   │   ├── OrderReceived.ts
│   │   ├── StockUpdated.ts
│   │   └── SaleRecorded.ts
│   │
│   └── repositories/              # Interfaces (contratos)
│       ├── IIngredientRepository.ts
│       ├── IRecipeRepository.ts
│       ├── IOrderRepository.ts
│       └── ...
│
├── application/                   # 🎯 CASOS DE USO / SERVICIOS
│   ├── services/
│   │   ├── IngredientService.ts   # CRUD + business rules
│   │   ├── RecipeService.ts       # Cálculo de costes, variantes
│   │   ├── OrderService.ts        # Gestión de pedidos
│   │   ├── ReceptionService.ts    # Recepción con varianza
│   │   ├── StockService.ts        # Control de inventario
│   │   ├── SaleService.ts         # Ventas y descuento de stock
│   │   ├── ScheduleService.ts     # Horarios de empleados
│   │   └── AnalyticsService.ts    # KPIs, forecast
│   │
│   ├── use-cases/
│   │   ├── ingredient/
│   │   │   ├── CreateIngredient.ts
│   │   │   ├── UpdateIngredientPrice.ts
│   │   │   └── ToggleIngredientActive.ts
│   │   ├── recipe/
│   │   │   ├── CalculateRecipeCost.ts
│   │   │   ├── CreateRecipeVariant.ts
│   │   │   └── GenerateEscandallo.ts
│   │   ├── order/
│   │   │   ├── CreateOrder.ts
│   │   │   ├── ReceiveOrder.ts
│   │   │   └── CalculateOrderVariance.ts
│   │   └── ...
│   │
│   ├── dto/                       # Data Transfer Objects
│   │   ├── IngredientDTO.ts
│   │   ├── RecipeDTO.ts
│   │   ├── CreateOrderDTO.ts
│   │   └── ...
│   │
│   └── validators/
│       ├── IngredientValidator.ts
│       ├── RecipeValidator.ts
│       └── OrderValidator.ts
│
├── infrastructure/                # 🔧 INFRAESTRUCTURA
│   ├── api/
│   │   ├── ApiClient.ts           # HTTP client base
│   │   ├── endpoints.ts           # Constantes de endpoints
│   │   └── interceptors/
│   │       ├── AuthInterceptor.ts
│   │       └── ErrorInterceptor.ts
│   │
│   ├── repositories/              # Implementaciones
│   │   ├── ApiIngredientRepository.ts
│   │   ├── ApiRecipeRepository.ts
│   │   ├── ApiOrderRepository.ts
│   │   └── ...
│   │
│   ├── cache/
│   │   ├── CacheManager.ts
│   │   ├── TTLCache.ts
│   │   └── LocalStorageCache.ts
│   │
│   ├── events/
│   │   ├── EventBus.ts            # Pub/Sub interno
│   │   └── EventHandlers.ts
│   │
│   └── external/
│       ├── ChatIntegration.ts     # n8n webhook
│       └── WhatsAppIntegration.ts
│
├── presentation/                  # 🎨 UI / INTERFACES
│   ├── stores/                    # State Management (Zustand)
│   │   ├── ingredientStore.ts
│   │   ├── recipeStore.ts
│   │   ├── orderStore.ts
│   │   ├── uiStore.ts
│   │   └── authStore.ts
│   │
│   ├── components/                # Componentes UI reutilizables
│   │   ├── common/
│   │   │   ├── Button.ts
│   │   │   ├── Modal.ts
│   │   │   ├── Toast.ts
│   │   │   ├── Table.ts
│   │   │   ├── Form.ts
│   │   │   └── SearchInput.ts
│   │   │
│   │   ├── ingredient/
│   │   │   ├── IngredientList.ts
│   │   │   ├── IngredientForm.ts
│   │   │   └── IngredientCard.ts
│   │   │
│   │   ├── recipe/
│   │   │   ├── RecipeList.ts
│   │   │   ├── RecipeForm.ts
│   │   │   ├── Escandallo.ts
│   │   │   └── CostTracker.ts
│   │   │
│   │   └── order/
│   │       ├── OrderList.ts
│   │       ├── OrderForm.ts
│   │       ├── Cart.ts
│   │       └── ReceptionModal.ts
│   │
│   ├── features/                  # Feature Modules (Lazy Loaded)
│   │   ├── ingredients/
│   │   │   ├── index.ts
│   │   │   └── ingredientsModule.ts
│   │   ├── recipes/
│   │   ├── orders/
│   │   ├── sales/
│   │   ├── dashboard/
│   │   ├── schedule/
│   │   ├── chat/
│   │   └── settings/
│   │
│   └── styles/
│       ├── design-tokens.css      # Variables CSS
│       ├── components/            # Estilos por componente
│       └── themes/
│
├── shared/                        # 🔗 COMPARTIDO
│   ├── utils/
│   │   ├── formatters.ts          # formatCurrency, formatDate
│   │   ├── validators.ts          # isEmail, isPhone, etc.
│   │   ├── sanitizers.ts          # escapeHTML, sanitizeInput
│   │   └── calculations.ts        # Cálculos de costes
│   │
│   ├── constants/
│   │   ├── units.ts               # UNITS: kg, l, ud, etc.
│   │   ├── categories.ts          # Familias, categorías
│   │   └── orderStatus.ts
│   │
│   ├── types/
│   │   ├── common.ts
│   │   └── api.ts
│   │
│   └── hooks/                     # Custom hooks (si usamos framework)
│       ├── useDebounce.ts
│       ├── useLocalStorage.ts
│       └── useFetch.ts
│
├── config/
│   ├── app.config.ts
│   ├── api.config.ts
│   └── cache.config.ts
│
├── main.ts                        # Entry point
└── app.ts                         # Application bootstrap
```

### 4.2 Entidades y Value Objects (DDD)

#### Ingredient Entity
```typescript
// domain/entities/Ingredient.ts
import { Money } from '../value-objects/Money';
import { Quantity } from '../value-objects/Quantity';

export class Ingredient {
  private constructor(
    public readonly id: number,
    public readonly nombre: string,
    public readonly unidad: string,
    public readonly familia: 'alimento' | 'bebida' | 'suministro',
    public readonly precio: Money,
    public readonly stockActual: Quantity,
    public readonly stockMinimo: Quantity,
    public readonly formatoCompra?: string,
    public readonly cantidadPorFormato?: number,
    public readonly proveedorId?: number,
    public readonly activo: boolean = true
  ) {}

  static create(props: IngredientProps): Ingredient {
    this.validate(props);
    return new Ingredient(
      props.id,
      props.nombre.trim(),
      props.unidad,
      props.familia,
      Money.create(props.precio, 'EUR'),
      Quantity.create(props.stockActual, props.unidad),
      Quantity.create(props.stockMinimo, props.unidad),
      props.formatoCompra,
      props.cantidadPorFormato,
      props.proveedorId,
      props.activo ?? true
    );
  }

  private static validate(props: IngredientProps): void {
    if (!props.nombre || props.nombre.trim().length === 0) {
      throw new ValidationError('El nombre es obligatorio');
    }
    if (props.nombre.length > 100) {
      throw new ValidationError('El nombre no puede exceder 100 caracteres');
    }
    if (props.precio < 0) {
      throw new ValidationError('El precio no puede ser negativo');
    }
    if (props.stockActual < 0) {
      throw new ValidationError('El stock no puede ser negativo');
    }
  }

  isLowStock(): boolean {
    return this.stockActual.value <= this.stockMinimo.value;
  }

  getDaysOfStock(dailyConsumption: number): number {
    if (dailyConsumption <= 0) return Infinity;
    return Math.floor(this.stockActual.value / dailyConsumption);
  }

  updateStock(delta: Quantity): Ingredient {
    const newStock = Quantity.create(
      this.stockActual.value + delta.value,
      this.unidad
    );

    return new Ingredient(
      this.id,
      this.nombre,
      this.unidad,
      this.familia,
      this.precio,
      newStock,
      this.stockMinimo,
      this.formatoCompra,
      this.cantidadPorFormato,
      this.proveedorId,
      this.activo
    );
  }

  updatePrice(newPrice: Money, previousStock: Quantity): Ingredient {
    // Cálculo de precio medio ponderado
    const totalValue = this.precio.amount * this.stockActual.value;
    const newValue = newPrice.amount * previousStock.value;
    const totalQuantity = this.stockActual.value + previousStock.value;

    const avgPrice = totalQuantity > 0
      ? (totalValue + newValue) / totalQuantity
      : newPrice.amount;

    return new Ingredient(
      this.id,
      this.nombre,
      this.unidad,
      this.familia,
      Money.create(avgPrice, 'EUR'),
      this.stockActual,
      this.stockMinimo,
      this.formatoCompra,
      this.cantidadPorFormato,
      this.proveedorId,
      this.activo
    );
  }
}
```

#### Recipe Entity
```typescript
// domain/entities/Recipe.ts
import { Money } from '../value-objects/Money';
import { Ingredient } from './Ingredient';

export interface RecipeIngredient {
  ingredientId: number;
  cantidad: number;
  unidad: string;
}

export interface RecipeVariant {
  id: string;
  nombre: string;
  multiplo: number;
  precioVenta: Money;
}

export class Recipe {
  private constructor(
    public readonly id: number,
    public readonly nombre: string,
    public readonly codigo: string,
    public readonly categoria: string,
    public readonly precioVenta: Money,
    public readonly porciones: number,
    public readonly ingredientes: RecipeIngredient[],
    public readonly variantes: RecipeVariant[] = []
  ) {}

  static create(props: RecipeProps): Recipe {
    this.validate(props);
    return new Recipe(
      props.id,
      props.nombre.trim(),
      props.codigo,
      props.categoria,
      Money.create(props.precioVenta, 'EUR'),
      props.porciones || 1,
      props.ingredientes || [],
      props.variantes || []
    );
  }

  private static validate(props: RecipeProps): void {
    if (!props.nombre || props.nombre.trim().length === 0) {
      throw new ValidationError('El nombre es obligatorio');
    }
    if (props.precioVenta < 0) {
      throw new ValidationError('El precio de venta no puede ser negativo');
    }
    if (props.porciones && props.porciones < 1) {
      throw new ValidationError('Las porciones deben ser al menos 1');
    }
  }

  calculateCost(ingredients: Map<number, Ingredient>): Money {
    let totalCost = 0;

    for (const item of this.ingredientes) {
      const ingredient = ingredients.get(item.ingredientId);
      if (!ingredient) continue;

      // Convertir unidades si es necesario
      const costPerUnit = ingredient.precio.amount;
      totalCost += costPerUnit * item.cantidad;
    }

    return Money.create(totalCost, 'EUR');
  }

  calculateMargin(ingredients: Map<number, Ingredient>): number {
    const cost = this.calculateCost(ingredients);
    if (this.precioVenta.amount === 0) return 0;

    return ((this.precioVenta.amount - cost.amount) / this.precioVenta.amount) * 100;
  }

  getCostPerPortion(ingredients: Map<number, Ingredient>): Money {
    const totalCost = this.calculateCost(ingredients);
    return Money.create(totalCost.amount / this.porciones, 'EUR');
  }

  addVariant(variant: RecipeVariant): Recipe {
    return new Recipe(
      this.id,
      this.nombre,
      this.codigo,
      this.categoria,
      this.precioVenta,
      this.porciones,
      this.ingredientes,
      [...this.variantes, variant]
    );
  }
}
```

#### Order Entity
```typescript
// domain/entities/Order.ts
import { Money } from '../value-objects/Money';
import { OrderStatus } from '../value-objects/OrderStatus';
import { DomainEvent } from '../events/DomainEvent';
import { OrderReceived } from '../events/OrderReceived';

export interface OrderItem {
  ingredienteId: number;
  cantidad: number;
  cantidadRecibida?: number;
  precioUnitario: number;
  precioReal?: number;
  estado: 'consolidado' | 'varianza' | 'no-entregado';
}

export class Order {
  private _domainEvents: DomainEvent[] = [];

  private constructor(
    public readonly id: number,
    public readonly proveedorId: number,
    public readonly fecha: Date,
    public readonly items: OrderItem[],
    public readonly estado: OrderStatus,
    public readonly total: Money,
    public readonly fechaRecepcion?: Date,
    public readonly totalRecibido?: Money,
    public readonly esCompraMercado: boolean = false,
    public readonly detalleMercado?: string
  ) {}

  static create(props: OrderProps): Order {
    return new Order(
      props.id,
      props.proveedorId,
      new Date(props.fecha),
      props.items.map(item => ({
        ...item,
        estado: 'consolidado' as const
      })),
      OrderStatus.PENDIENTE,
      Money.create(props.total, 'EUR'),
      undefined,
      undefined,
      props.esCompraMercado || false,
      props.detalleMercado
    );
  }

  markAsReceived(receptionData: ReceptionData): Order {
    const updatedItems = this.items.map(item => {
      const reception = receptionData.items.find(
        r => r.ingredienteId === item.ingredienteId
      );

      if (!reception) return item;

      return {
        ...item,
        cantidadRecibida: reception.cantidadRecibida,
        precioReal: reception.precioReal,
        estado: this.determineItemStatus(item, reception)
      };
    });

    const totalRecibido = this.calculateReceivedTotal(updatedItems);

    const receivedOrder = new Order(
      this.id,
      this.proveedorId,
      this.fecha,
      updatedItems,
      OrderStatus.RECIBIDO,
      this.total,
      new Date(),
      totalRecibido,
      this.esCompraMercado,
      this.detalleMercado
    );

    // Emitir evento de dominio
    receivedOrder._domainEvents.push(
      new OrderReceived(this.id, updatedItems, totalRecibido)
    );

    return receivedOrder;
  }

  private determineItemStatus(
    original: OrderItem,
    received: ReceptionItemData
  ): OrderItem['estado'] {
    if (received.cantidadRecibida === 0) {
      return 'no-entregado';
    }

    const hasQuantityVariance = Math.abs(
      received.cantidadRecibida - original.cantidad
    ) > 0.01;

    const hasPriceVariance = Math.abs(
      received.precioReal - original.precioUnitario
    ) > 0.01;

    if (hasQuantityVariance || hasPriceVariance) {
      return 'varianza';
    }

    return 'consolidado';
  }

  private calculateReceivedTotal(items: OrderItem[]): Money {
    const total = items.reduce((sum, item) => {
      if (item.estado === 'no-entregado') return sum;
      const cantidad = item.cantidadRecibida ?? item.cantidad;
      const precio = item.precioReal ?? item.precioUnitario;
      return sum + (cantidad * precio);
    }, 0);

    return Money.create(total, 'EUR');
  }

  calculateVariance(): Money {
    if (!this.totalRecibido) return Money.create(0, 'EUR');
    return Money.create(
      this.totalRecibido.amount - this.total.amount,
      'EUR'
    );
  }

  get domainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }
}
```

### 4.3 Value Objects

```typescript
// domain/value-objects/Money.ts
export class Money {
  private constructor(
    public readonly amount: number,
    public readonly currency: string
  ) {}

  static create(amount: number, currency: string = 'EUR'): Money {
    if (isNaN(amount) || !isFinite(amount)) {
      throw new ValidationError('Amount must be a valid number');
    }
    // Redondear a 2 decimales para evitar errores de punto flotante
    const rounded = Math.round(amount * 100) / 100;
    return new Money(rounded, currency);
  }

  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return Money.create(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    return Money.create(this.amount - other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return Money.create(this.amount * factor, this.currency);
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new ValidationError('Cannot operate on different currencies');
    }
  }

  format(): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: this.currency
    }).format(this.amount);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}

// domain/value-objects/Quantity.ts
export class Quantity {
  private constructor(
    public readonly value: number,
    public readonly unit: string
  ) {}

  static create(value: number, unit: string): Quantity {
    if (isNaN(value) || !isFinite(value)) {
      throw new ValidationError('Value must be a valid number');
    }
    if (value < 0) {
      throw new ValidationError('Quantity cannot be negative');
    }
    return new Quantity(value, unit);
  }

  add(other: Quantity): Quantity {
    this.ensureSameUnit(other);
    return Quantity.create(this.value + other.value, this.unit);
  }

  subtract(other: Quantity): Quantity {
    this.ensureSameUnit(other);
    const result = this.value - other.value;
    if (result < 0) {
      throw new ValidationError('Resulting quantity cannot be negative');
    }
    return Quantity.create(result, this.unit);
  }

  private ensureSameUnit(other: Quantity): void {
    if (this.unit !== other.unit) {
      throw new ValidationError('Cannot operate on different units');
    }
  }

  format(decimals: number = 2): string {
    return `${this.value.toFixed(decimals)} ${this.unit}`;
  }
}

// domain/value-objects/OrderStatus.ts
export enum OrderStatus {
  PENDIENTE = 'pendiente',
  CONFIRMADO = 'confirmado',
  RECIBIDO = 'recibido',
  CANCELADO = 'cancelado'
}

export function isOrderReceivable(status: OrderStatus): boolean {
  return status === OrderStatus.PENDIENTE || status === OrderStatus.CONFIRMADO;
}

export function canModifyOrder(status: OrderStatus): boolean {
  return status === OrderStatus.PENDIENTE;
}
```

### 4.4 Repository Interfaces

```typescript
// domain/repositories/IIngredientRepository.ts
import { Ingredient } from '../entities/Ingredient';

export interface IIngredientRepository {
  findAll(): Promise<Ingredient[]>;
  findById(id: number): Promise<Ingredient | null>;
  findBySupplier(supplierId: number): Promise<Ingredient[]>;
  findLowStock(): Promise<Ingredient[]>;
  save(ingredient: Ingredient): Promise<Ingredient>;
  update(ingredient: Ingredient): Promise<Ingredient>;
  delete(id: number): Promise<void>;
  toggleActive(id: number, active: boolean): Promise<Ingredient>;
}

// domain/repositories/IOrderRepository.ts
import { Order } from '../entities/Order';
import { OrderStatus } from '../value-objects/OrderStatus';

export interface IOrderRepository {
  findAll(): Promise<Order[]>;
  findById(id: number): Promise<Order | null>;
  findBySupplier(supplierId: number): Promise<Order[]>;
  findByStatus(status: OrderStatus): Promise<Order[]>;
  findByDateRange(start: Date, end: Date): Promise<Order[]>;
  save(order: Order): Promise<Order>;
  update(order: Order): Promise<Order>;
  delete(id: number): Promise<void>;
}
```

### 4.5 Application Services

```typescript
// application/services/RecipeService.ts
import { Recipe } from '../../domain/entities/Recipe';
import { Ingredient } from '../../domain/entities/Ingredient';
import { IRecipeRepository } from '../../domain/repositories/IRecipeRepository';
import { IIngredientRepository } from '../../domain/repositories/IIngredientRepository';
import { RecipeDTO, CreateRecipeDTO, UpdateRecipeDTO } from '../dto/RecipeDTO';
import { RecipeValidator } from '../validators/RecipeValidator';

export class RecipeService {
  constructor(
    private recipeRepository: IRecipeRepository,
    private ingredientRepository: IIngredientRepository,
    private validator: RecipeValidator
  ) {}

  async getAll(): Promise<RecipeDTO[]> {
    const [recipes, ingredients] = await Promise.all([
      this.recipeRepository.findAll(),
      this.ingredientRepository.findAll()
    ]);

    const ingredientMap = new Map(ingredients.map(i => [i.id, i]));

    return recipes.map(recipe => this.toDTO(recipe, ingredientMap));
  }

  async getById(id: number): Promise<RecipeDTO | null> {
    const recipe = await this.recipeRepository.findById(id);
    if (!recipe) return null;

    const ingredients = await this.ingredientRepository.findAll();
    const ingredientMap = new Map(ingredients.map(i => [i.id, i]));

    return this.toDTO(recipe, ingredientMap);
  }

  async create(dto: CreateRecipeDTO): Promise<RecipeDTO> {
    // Validar
    const validationResult = this.validator.validate(dto);
    if (!validationResult.isValid) {
      throw new ValidationError(validationResult.errors.join(', '));
    }

    // Crear entidad
    const recipe = Recipe.create({
      id: 0, // Backend asignará ID
      nombre: dto.nombre,
      codigo: dto.codigo,
      categoria: dto.categoria,
      precioVenta: dto.precioVenta,
      porciones: dto.porciones,
      ingredientes: dto.ingredientes,
      variantes: []
    });

    // Persistir
    const saved = await this.recipeRepository.save(recipe);

    // Retornar DTO con costes calculados
    const ingredients = await this.ingredientRepository.findAll();
    const ingredientMap = new Map(ingredients.map(i => [i.id, i]));

    return this.toDTO(saved, ingredientMap);
  }

  async calculateCost(recipeId: number): Promise<CostCalculationResult> {
    const recipe = await this.recipeRepository.findById(recipeId);
    if (!recipe) throw new NotFoundError(`Recipe ${recipeId} not found`);

    const ingredients = await this.ingredientRepository.findAll();
    const ingredientMap = new Map(ingredients.map(i => [i.id, i]));

    const cost = recipe.calculateCost(ingredientMap);
    const margin = recipe.calculateMargin(ingredientMap);
    const costPerPortion = recipe.getCostPerPortion(ingredientMap);

    // Desglose por ingrediente
    const breakdown = recipe.ingredientes.map(item => {
      const ing = ingredientMap.get(item.ingredientId);
      const itemCost = ing ? ing.precio.amount * item.cantidad : 0;

      return {
        ingredientId: item.ingredientId,
        ingredientName: ing?.nombre || 'Desconocido',
        cantidad: item.cantidad,
        unidad: item.unidad,
        precioUnitario: ing?.precio.amount || 0,
        costeTotal: itemCost,
        porcentaje: cost.amount > 0 ? (itemCost / cost.amount) * 100 : 0
      };
    });

    return {
      recipeId,
      recipeName: recipe.nombre,
      totalCost: cost,
      margin,
      costPerPortion,
      precioVenta: recipe.precioVenta,
      breakdown
    };
  }

  private toDTO(recipe: Recipe, ingredients: Map<number, Ingredient>): RecipeDTO {
    const cost = recipe.calculateCost(ingredients);
    const margin = recipe.calculateMargin(ingredients);

    return {
      id: recipe.id,
      nombre: recipe.nombre,
      codigo: recipe.codigo,
      categoria: recipe.categoria,
      precioVenta: recipe.precioVenta.amount,
      porciones: recipe.porciones,
      ingredientes: recipe.ingredientes,
      variantes: recipe.variantes,
      costeTotal: cost.amount,
      margen: margin,
      costePorPorcion: recipe.getCostPerPortion(ingredients).amount
    };
  }
}
```

### 4.6 State Management (Zustand)

```typescript
// presentation/stores/ingredientStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { IngredientDTO } from '../../application/dto/IngredientDTO';
import { IngredientService } from '../../application/services/IngredientService';

interface IngredientState {
  // State
  ingredients: IngredientDTO[];
  selectedIngredient: IngredientDTO | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    search: string;
    familia: string | null;
    showInactive: boolean;
    lowStockOnly: boolean;
  };

  // Actions
  fetchIngredients: () => Promise<void>;
  getIngredientById: (id: number) => IngredientDTO | undefined;
  createIngredient: (data: CreateIngredientDTO) => Promise<void>;
  updateIngredient: (id: number, data: UpdateIngredientDTO) => Promise<void>;
  deleteIngredient: (id: number) => Promise<void>;
  toggleActive: (id: number) => Promise<void>;
  setFilters: (filters: Partial<IngredientState['filters']>) => void;
  selectIngredient: (ingredient: IngredientDTO | null) => void;
  clearError: () => void;
}

// Instancia del servicio (se puede inyectar)
let ingredientService: IngredientService;

export const setIngredientService = (service: IngredientService) => {
  ingredientService = service;
};

export const useIngredientStore = create<IngredientState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        ingredients: [],
        selectedIngredient: null,
        isLoading: false,
        error: null,
        filters: {
          search: '',
          familia: null,
          showInactive: false,
          lowStockOnly: false
        },

        // Actions
        fetchIngredients: async () => {
          set({ isLoading: true, error: null });
          try {
            const ingredients = await ingredientService.getAll({
              includeInactive: get().filters.showInactive
            });
            set({ ingredients, isLoading: false });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Error cargando ingredientes',
              isLoading: false
            });
          }
        },

        getIngredientById: (id: number) => {
          return get().ingredients.find(i => i.id === id);
        },

        createIngredient: async (data) => {
          set({ isLoading: true, error: null });
          try {
            const created = await ingredientService.create(data);
            set(state => ({
              ingredients: [...state.ingredients, created],
              isLoading: false
            }));
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Error creando ingrediente',
              isLoading: false
            });
            throw error;
          }
        },

        updateIngredient: async (id, data) => {
          set({ isLoading: true, error: null });
          try {
            const updated = await ingredientService.update(id, data);
            set(state => ({
              ingredients: state.ingredients.map(i => i.id === id ? updated : i),
              isLoading: false
            }));
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Error actualizando ingrediente',
              isLoading: false
            });
            throw error;
          }
        },

        deleteIngredient: async (id) => {
          set({ isLoading: true, error: null });
          try {
            await ingredientService.delete(id);
            set(state => ({
              ingredients: state.ingredients.filter(i => i.id !== id),
              selectedIngredient: state.selectedIngredient?.id === id
                ? null
                : state.selectedIngredient,
              isLoading: false
            }));
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Error eliminando ingrediente',
              isLoading: false
            });
            throw error;
          }
        },

        toggleActive: async (id) => {
          const ingredient = get().ingredients.find(i => i.id === id);
          if (!ingredient) return;

          try {
            const updated = await ingredientService.toggleActive(id, !ingredient.activo);
            set(state => ({
              ingredients: state.ingredients.map(i => i.id === id ? updated : i)
            }));
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Error cambiando estado'
            });
            throw error;
          }
        },

        setFilters: (filters) => {
          set(state => ({
            filters: { ...state.filters, ...filters }
          }));
        },

        selectIngredient: (ingredient) => {
          set({ selectedIngredient: ingredient });
        },

        clearError: () => {
          set({ error: null });
        }
      }),
      {
        name: 'ingredient-storage',
        partialize: (state) => ({ filters: state.filters })
      }
    ),
    { name: 'IngredientStore' }
  )
);

// Selectores derivados
export const useFilteredIngredients = () => {
  const { ingredients, filters } = useIngredientStore();

  return ingredients.filter(ing => {
    // Filtro por búsqueda
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!ing.nombre.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Filtro por familia
    if (filters.familia && ing.familia !== filters.familia) {
      return false;
    }

    // Filtro por stock bajo
    if (filters.lowStockOnly && !ing.stockBajo) {
      return false;
    }

    return true;
  });
};

export const useLowStockCount = () => {
  const { ingredients } = useIngredientStore();
  return ingredients.filter(i => i.stockBajo).length;
};
```

---

## 5. PLAN DE IMPLEMENTACIÓN POR FASES

### Fase 1: Fundamentos (Semanas 1-2)

#### 1.1 State Management
```bash
# Instalar Zustand
npm install zustand

# Crear estructura básica de stores
mkdir -p src/presentation/stores
```

**Archivos a crear:**
- `src/presentation/stores/index.ts`
- `src/presentation/stores/ingredientStore.ts`
- `src/presentation/stores/recipeStore.ts`
- `src/presentation/stores/orderStore.ts`
- `src/presentation/stores/authStore.ts`
- `src/presentation/stores/uiStore.ts`

**Migración gradual:**
1. Crear store para ingredientes
2. Migrar `window.ingredientes` → `useIngredientStore`
3. Actualizar módulos que leen ingredientes
4. Verificar y repetir para otros dominios

#### 1.2 Eliminar Código Legacy
```bash
# Backup primero
cp -r src/legacy src/legacy.backup

# Después de verificar en producción (3 meses)
rm -rf src/legacy
```

#### 1.3 Centralizar Funciones Duplicadas
```typescript
// src/shared/utils/sanitizers.ts
export function escapeHTML(text: string | null | undefined): string {
  if (text === null || text === undefined) return '';
  const str = String(text);
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return str.replace(/[&<>"']/g, char => map[char]);
}

export function safeNumber(value: unknown, defaultValue = 0): number {
  const num = parseFloat(String(value));
  return isNaN(num) || !isFinite(num) ? defaultValue : num;
}
```

### Fase 2: Domain Layer (Semanas 3-4)

#### 2.1 Crear Entidades Base
```bash
mkdir -p src/domain/{entities,value-objects,events,repositories}
```

**Orden de implementación:**
1. Value Objects (Money, Quantity, OrderStatus)
2. Entidades simples (Ingredient, Supplier)
3. Entidades complejas (Recipe, Order)
4. Interfaces de Repository

#### 2.2 Dividir Módulos Grandes

**pedidos-crud.js → 4 archivos:**
```
src/application/services/
├── OrderService.ts          # CRUD básico
├── CartService.ts           # Gestión del carrito
├── ReceptionService.ts      # Recepción con varianza
└── StockUpdateService.ts    # Actualización de stock
```

**horarios.js → 4 archivos:**
```
src/features/schedule/
├── EmployeeManagement.ts    # CRUD empleados
├── ScheduleGrid.ts          # Grid visual de horarios
├── ShiftManagement.ts       # Gestión de turnos
└── ScheduleReports.ts       # Reportes y análisis
```

### Fase 3: Infrastructure (Semanas 5-6)

#### 3.1 Refactorizar API Client
```typescript
// src/infrastructure/api/ApiClient.ts
export class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor(config: ApiConfig) {
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout || 15000;
  }

  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      clearTimeout(timeoutId);
      return this.handleResponse<T>(response, endpoint, options);
    } catch (error) {
      clearTimeout(timeoutId);
      return this.handleError(error, endpoint, options);
    }
  }

  // ... métodos privados para manejo de errores, retry, etc.
}
```

#### 3.2 Implementar Repositories
```typescript
// src/infrastructure/repositories/ApiIngredientRepository.ts
import { IIngredientRepository } from '../../domain/repositories/IIngredientRepository';
import { Ingredient } from '../../domain/entities/Ingredient';
import { ApiClient } from '../api/ApiClient';

export class ApiIngredientRepository implements IIngredientRepository {
  constructor(private apiClient: ApiClient) {}

  async findAll(): Promise<Ingredient[]> {
    const data = await this.apiClient.get<IngredientDTO[]>('/api/ingredients');
    return data.map(dto => Ingredient.create(dto));
  }

  async findById(id: number): Promise<Ingredient | null> {
    try {
      const data = await this.apiClient.get<IngredientDTO>(`/api/ingredients/${id}`);
      return Ingredient.create(data);
    } catch (error) {
      if (error instanceof NotFoundError) return null;
      throw error;
    }
  }

  async save(ingredient: Ingredient): Promise<Ingredient> {
    const dto = this.toDTO(ingredient);
    const data = await this.apiClient.post<IngredientDTO>('/api/ingredients', dto);
    return Ingredient.create(data);
  }

  // ... más métodos
}
```

### Fase 4: Testing (Semanas 7-8)

#### 4.1 Unit Tests para Domain
```typescript
// __tests__/domain/entities/Ingredient.test.ts
import { Ingredient } from '../../../src/domain/entities/Ingredient';
import { Money } from '../../../src/domain/value-objects/Money';

describe('Ingredient', () => {
  const validProps = {
    id: 1,
    nombre: 'Tomate',
    unidad: 'kg',
    familia: 'alimento' as const,
    precio: 2.5,
    stockActual: 10,
    stockMinimo: 5,
    activo: true
  };

  describe('create', () => {
    it('should create ingredient with valid props', () => {
      const ingredient = Ingredient.create(validProps);

      expect(ingredient.id).toBe(1);
      expect(ingredient.nombre).toBe('Tomate');
      expect(ingredient.precio.amount).toBe(2.5);
    });

    it('should throw on empty name', () => {
      expect(() => Ingredient.create({ ...validProps, nombre: '' }))
        .toThrow('El nombre es obligatorio');
    });

    it('should throw on negative price', () => {
      expect(() => Ingredient.create({ ...validProps, precio: -1 }))
        .toThrow('El precio no puede ser negativo');
    });
  });

  describe('isLowStock', () => {
    it('should return true when stock below minimum', () => {
      const ingredient = Ingredient.create({
        ...validProps,
        stockActual: 3,
        stockMinimo: 5
      });

      expect(ingredient.isLowStock()).toBe(true);
    });

    it('should return false when stock above minimum', () => {
      const ingredient = Ingredient.create(validProps);
      expect(ingredient.isLowStock()).toBe(false);
    });
  });

  describe('updateStock', () => {
    it('should add stock correctly', () => {
      const ingredient = Ingredient.create(validProps);
      const updated = ingredient.updateStock(Quantity.create(5, 'kg'));

      expect(updated.stockActual.value).toBe(15);
    });
  });
});
```

#### 4.2 Integration Tests
```typescript
// __tests__/integration/ingredientFlow.test.ts
import { IngredientService } from '../../src/application/services/IngredientService';
import { ApiIngredientRepository } from '../../src/infrastructure/repositories/ApiIngredientRepository';

describe('Ingredient Flow', () => {
  let service: IngredientService;

  beforeEach(() => {
    // Setup con mock API o test server
  });

  it('should create, update and delete ingredient', async () => {
    // Create
    const created = await service.create({
      nombre: 'Test Ingredient',
      unidad: 'kg',
      familia: 'alimento',
      precio: 5.0,
      stockActual: 10,
      stockMinimo: 2
    });
    expect(created.id).toBeDefined();

    // Update
    const updated = await service.update(created.id, { precio: 6.0 });
    expect(updated.precio).toBe(6.0);

    // Delete
    await service.delete(created.id);
    const found = await service.getById(created.id);
    expect(found).toBeNull();
  });
});
```

#### 4.3 E2E Tests (Playwright)
```typescript
// e2e/ingredients.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Ingredients Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');
    await page.waitForSelector('[data-tab="ingredientes"]');
    await page.click('[data-tab="ingredientes"]');
  });

  test('should create new ingredient', async ({ page }) => {
    await page.click('[data-action="nuevo-ingrediente"]');

    await page.fill('#ing-nombre', 'Nuevo Tomate');
    await page.selectOption('#ing-unidad', 'kg');
    await page.fill('#ing-precio', '3.50');
    await page.fill('#ing-stock', '20');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=Nuevo Tomate')).toBeVisible();
  });

  test('should edit ingredient price', async ({ page }) => {
    await page.click('[data-ingredient-id="1"] [data-action="editar"]');

    await page.fill('#ing-precio', '4.00');
    await page.click('button[type="submit"]');

    await expect(page.locator('[data-ingredient-id="1"] .precio')).toContainText('4.00');
  });
});
```

---

---

# PARTE 3: AUDITORÍA COMPLETA DEL BACKEND (lacaleta-api)

## 6. ANÁLISIS DEL BACKEND

### 6.1 Stack Tecnológico del Backend

| Componente | Tecnología | Versión | Estado |
|------------|------------|---------|--------|
| **Framework** | Express.js | 4.18.2 | Estable |
| **Base de Datos** | PostgreSQL | pg 8.11.3 | Robusto |
| **Autenticación** | JWT | jsonwebtoken 9.0.2 | Seguro |
| **Hashing** | bcryptjs | 2.4.3 | Seguro |
| **CORS** | cors | 2.8.5 | Configurado |
| **Rate Limiting** | express-rate-limit | 7.1.5 | Implementado |
| **Email** | Resend | 6.6.0 | Opcional |
| **Cookies** | cookie-parser | 1.4.7 | httpOnly |
| **Node.js** | >= 16.0.0 | - | Requerido |

### 6.2 Estructura Actual del Backend

```
lacaleta-api/
├── server.js                      # 4,192 líneas - MONOLÍTICO ⚠️
├── package.json                   # v2.3.0
├── package-lock.json
├── .env                           # Configuración (sensible)
├── .gitignore
├── Dockerfile                     # Contenedor Docker
├── healthcheck.js                 # Health checks Docker
├── SCRIPTS-README.md              # Documentación de scripts
├── server.log                     # Logs JSON
├── scripts/
│   ├── daily-health-check.js      # Validación diaria
│   └── validate-data-integrity.js # Validación integridad
├── tests/
│   └── test-stock-calculation.js  # Tests de stock
└── backups/
    └── 2026-01-25/                # Backups versionados
```

### 6.3 Esquema de Base de Datos (17 Tablas)

#### Tablas Principales

| Tabla | Propósito | Campos Clave |
|-------|-----------|--------------|
| `restaurantes` | Multi-tenancy | id, nombre, email |
| `usuarios` | Autenticación | id, email, password_hash, rol, restaurante_id |
| `ingredientes` | Inventario base | id, nombre, precio, stock_actual, stock_minimo, familia, activo |
| `proveedores` | Suppliers | id, nombre, contacto, telefono, email |
| `ingredientes_proveedores` | Relación M:M | ingrediente_id, proveedor_id, precio, es_proveedor_principal |
| `recetas` | Platos/productos | id, nombre, categoria, precio_venta, porciones, ingredientes (JSONB) |
| `recetas_variantes` | Tamaños (copa/botella) | id, receta_id, nombre, factor |
| `empleados` | Staff | id, nombre, puesto, horas_contrato, color |
| `horarios` | Turnos | id, empleado_id, fecha, hora_inicio, hora_fin |
| `pedidos` | Órdenes de compra | id, proveedor_id, fecha, estado, ingredientes (JSONB), total |
| `ventas` | Registro de ventas | id, receta_id, cantidad, variante_id, factor_aplicado, deleted_at |
| `mermas` | Control de pérdidas | id, ingrediente_id, cantidad, motivo, valor_perdida |
| `inventory_snapshots_v2` | Histórico de stock | id, ingrediente_id, stock_virtual, stock_real, fecha |
| `precios_compra_diarios` | Costos de compra | ingrediente_id, fecha, precio (UNIQUE) |
| `api_tokens` | Tokens para n8n | id, token_hash, nombre, expires_at |
| `gastos_fijos` | Gastos recurrentes | id, nombre, monto, frecuencia |

#### Índices Implementados

```sql
idx_ventas_fecha
idx_ventas_receta
idx_usuarios_email
idx_ingredientes_restaurante
idx_precios_compra_fecha
idx_ventas_diarias_fecha
```

### 6.4 Endpoints del API (81 Total)

#### Autenticación (6)
```
POST   /api/auth/login              # Login + set cookie httpOnly
POST   /api/auth/register           # Registro (requiere código invitación)
POST   /api/auth/logout             # Clear cookie
GET    /api/auth/verify             # Verificar JWT
GET    /api/auth/verify-email       # Verificación de email
POST   /api/auth/api-token          # Generar token para n8n/Zapier
```

#### Ingredientes (11)
```
GET    /api/ingredients             # Lista (con matching engine)
POST   /api/ingredients             # Crear
PUT    /api/ingredients/:id         # Actualizar
DELETE /api/ingredients/:id         # Soft delete
PATCH  /api/ingredients/:id/toggle-active
GET    /api/ingredients-suppliers   # Relación M:M
GET    /api/ingredients/:id/suppliers
POST   /api/ingredients/:id/suppliers
PUT    /api/ingredients/:id/suppliers/:supplierId
DELETE /api/ingredients/:id/suppliers/:supplierId
POST   /api/ingredients/match       # ML matching
```

#### Recetas (9)
```
GET    /api/recipes                 # Lista
POST   /api/recipes                 # Crear
PUT    /api/recipes/:id             # Actualizar
DELETE /api/recipes/:id             # Soft delete
GET    /api/recipes-variants        # Todas las variantes
GET    /api/recipes/:id/variants    # Variantes de una receta
POST   /api/recipes/:id/variants    # Crear variante
PUT    /api/recipes/:id/variants/:variantId
DELETE /api/recipes/:id/variants/:variantId
```

#### Inventario (4)
```
GET    /api/inventory/complete      # Stock completo
PUT    /api/inventory/:id/stock-real
PUT    /api/inventory/bulk-update-stock
POST   /api/inventory/consolidate   # Snapshot
```

#### Pedidos (4)
```
GET    /api/orders
POST   /api/orders                  # Crear pedido
PUT    /api/orders/:id              # Recibir (registra costos)
DELETE /api/orders/:id              # Revierte stock
```

#### Ventas (4)
```
GET    /api/sales?fecha=YYYY-MM-DD
POST   /api/sales                   # Descuenta stock automáticamente
POST   /api/sales/bulk              # Carga masiva (n8n compatible)
DELETE /api/sales/:id               # Restaura stock (soft delete)
```

#### Análisis y Reportes (11)
```
GET    /api/balance/mes             # Resumen mensual
GET    /api/balance/comparativa     # Mes vs anterior
GET    /api/daily/purchases         # Compras del día
POST   /api/daily/purchases/bulk    # Carga masiva
GET    /api/daily/sales             # Ventas del día
GET    /api/monthly/summary         # Resumen mes
GET    /api/intelligence/freshness  # Productos próximos a vencer
GET    /api/intelligence/purchase-plan
GET    /api/intelligence/overstock
GET    /api/intelligence/price-check
GET    /api/intelligence/waste-stats
GET    /api/analysis/menu-engineering # Matriz BCG
```

#### Mermas (5)
```
POST   /api/mermas                  # Registrar pérdida
GET    /api/mermas                  # Listar
GET    /api/mermas/resumen          # Resumen mensual
DELETE /api/mermas/:id              # Borrar + restaurar stock
DELETE /api/mermas/reset            # Reset completo
```

#### Empleados y Horarios (10)
```
GET    /api/empleados
POST   /api/empleados
PUT    /api/empleados/:id
DELETE /api/empleados/:id
GET    /api/horarios
POST   /api/horarios
DELETE /api/horarios/:id
DELETE /api/horarios/empleado/:empleadoId/fecha/:fecha
DELETE /api/horarios/all
POST   /api/horarios/copiar-semana
```

### 6.5 Lógica de Negocio Crítica

#### Descuento de Stock en Ventas
```javascript
// Fórmula: (cantidad_receta ÷ porciones) × cantidad_vendida × factor_variante
const cantidadADescontar = ((ing.cantidad || 0) / porciones)
                          * cantidadValidada
                          * factorVariante;

// Ejemplo: Vino en botella (1L) vendido en copa (0.2)
// - Receta: 1 botella por porción
// - Porciones: 1
// - Venta: 1 copa
// - Factor: 0.2
// Resultado: (1/1) × 1 × 0.2 = 0.2 botellas consumidas
```

#### Menu Engineering - Matriz BCG
```javascript
// Clasificación de platos:
// ESTRELLA:  popular=true  + rentable=true   → Mantener/Promocionar
// CABALLO:   popular=true  + rentable=false  → Reducir costos
// PUZZLE:    popular=false + rentable=true   → Marketing
// PERRO:     popular=false + rentable=false  → Eliminar/Rediseñar

// Métricas:
// - Food Cost % = (coste_ingredientes / precio_venta) × 100
// - Popularidad = cantidad_vendida vs promedio
// - Rentabilidad = margen_contribución vs promedio
```

### 6.6 Seguridad Implementada

#### ✅ Controles Presentes

| Control | Implementación | Estado |
|---------|----------------|--------|
| JWT Authentication | Cookie httpOnly | ✅ Seguro |
| Password Hashing | bcryptjs | ✅ Seguro |
| Rate Limiting | 1000 req/15min global, 50/15min auth | ✅ Implementado |
| CORS | Whitelist de orígenes | ✅ Configurado |
| Input Validation | validateNumber, validatePrecio, validateCantidad | ✅ Parcial |
| Soft Delete | deleted_at en tablas críticas | ✅ Implementado |
| Transactions | BEGIN/COMMIT/ROLLBACK | ✅ En operaciones críticas |
| Error Handling | Global handlers para uncaughtException | ✅ Implementado |
| Logging | JSON estructurado a server.log | ✅ Persistente |

#### ⚠️ Vulnerabilidades/Mejoras Pendientes

| Problema | Severidad | Descripción | Solución |
|----------|-----------|-------------|----------|
| Archivo monolítico | 🔴 ALTA | 4,192 líneas en un solo archivo | Refactorizar a módulos |
| Sin schema validation | 🟡 MEDIA | Solo validación numérica básica | Implementar Joi/Zod |
| Pool max=10 | 🟡 MEDIA | Podría ser insuficiente bajo carga | Monitorear y ajustar |
| Console.log en producción | 🟡 MEDIA | Debug logs visibles | Usar niveles de log |
| Sin versionado de API | 🟡 MEDIA | Dificulta breaking changes | Añadir `/v1/` prefix |
| Sin test automation | 🔴 ALTA | Solo scripts manuales | Implementar Jest |

### 6.7 Integraciones Externas

| Integración | Propósito | Estado |
|-------------|-----------|--------|
| **n8n** | Automatización via API tokens | ✅ Funcional |
| **Resend** | Notificaciones por email | ⚠️ Opcional (falla silencioso si no hay API key) |
| **Uptime Kuma** | Monitoreo de disponibilidad | ✅ Heartbeat cada 60s |
| **Docker** | Containerización | ✅ Dockerfile incluido |

### 6.8 Scripts de Mantenimiento

```bash
# Health Check Diario
node scripts/daily-health-check.js
# Verifica: Conexión BD, tablas críticas, stock calculado, alertas

# Validación de Integridad
node scripts/validate-data-integrity.js
# Detecta: Recetas sin ingredientes, stock negativo, variantes sin factor

# Tests de Stock
node tests/test-stock-calculation.js
# Valida: Fórmulas de descuento, factores de variantes
```

---

## 7. PLAN DE REFACTORIZACIÓN DEL BACKEND

### 7.1 Estructura Objetivo (Clean Architecture)

```
lacaleta-api/
├── src/
│   ├── domain/                    # Entidades y reglas de negocio
│   │   ├── entities/
│   │   │   ├── Ingredient.js
│   │   │   ├── Recipe.js
│   │   │   ├── Order.js
│   │   │   └── Sale.js
│   │   ├── value-objects/
│   │   │   ├── Money.js
│   │   │   ├── Quantity.js
│   │   │   └── OrderStatus.js
│   │   └── services/
│   │       ├── StockCalculator.js
│   │       └── CostCalculator.js
│   │
│   ├── application/               # Casos de uso
│   │   ├── use-cases/
│   │   │   ├── ingredients/
│   │   │   ├── recipes/
│   │   │   ├── orders/
│   │   │   └── sales/
│   │   └── services/
│   │       ├── IngredientService.js
│   │       ├── RecipeService.js
│   │       └── AnalyticsService.js
│   │
│   ├── infrastructure/            # Implementaciones externas
│   │   ├── database/
│   │   │   ├── repositories/
│   │   │   │   ├── IngredientRepository.js
│   │   │   │   ├── RecipeRepository.js
│   │   │   │   └── OrderRepository.js
│   │   │   ├── migrations/
│   │   │   └── pool.js
│   │   ├── http/
│   │   │   ├── controllers/
│   │   │   │   ├── IngredientController.js
│   │   │   │   ├── RecipeController.js
│   │   │   │   └── SaleController.js
│   │   │   ├── routes/
│   │   │   │   ├── ingredientRoutes.js
│   │   │   │   ├── recipeRoutes.js
│   │   │   │   └── index.js
│   │   │   └── middleware/
│   │   │       ├── auth.js
│   │   │       ├── validation.js
│   │   │       └── errorHandler.js
│   │   └── external/
│   │       ├── ResendService.js
│   │       └── UptimeKumaService.js
│   │
│   ├── config/
│   │   ├── database.js
│   │   ├── cors.js
│   │   └── index.js
│   │
│   └── app.js                     # Bootstrap
│
├── tests/
│   ├── unit/
│   │   ├── domain/
│   │   └── application/
│   ├── integration/
│   └── e2e/
│
├── scripts/
├── server.js                      # Entry point (minimal)
├── package.json
└── Dockerfile
```

### 7.2 Fases de Refactorización del Backend

#### Fase B1: Separación de Rutas (Semana 1)

**Objetivo:** Dividir server.js en archivos de rutas modulares

```javascript
// Antes (server.js - 4,192 líneas)
app.get('/api/ingredients', authMiddleware, async (req, res) => {...});
app.post('/api/ingredients', authMiddleware, async (req, res) => {...});
// ... 81 endpoints más

// Después (routes/ingredientRoutes.js)
const router = express.Router();
router.get('/', IngredientController.getAll);
router.post('/', IngredientController.create);
module.exports = router;

// server.js (minimal)
app.use('/api/ingredients', authMiddleware, ingredientRoutes);
```

**Archivos a crear:**
- `routes/authRoutes.js` (6 endpoints)
- `routes/ingredientRoutes.js` (11 endpoints)
- `routes/recipeRoutes.js` (9 endpoints)
- `routes/orderRoutes.js` (4 endpoints)
- `routes/saleRoutes.js` (4 endpoints)
- `routes/inventoryRoutes.js` (4 endpoints)
- `routes/analyticsRoutes.js` (11 endpoints)
- `routes/employeeRoutes.js` (10 endpoints)
- `routes/mermaRoutes.js` (5 endpoints)

#### Fase B2: Controladores (Semana 2)

**Objetivo:** Extraer lógica de request/response a controllers

```javascript
// controllers/IngredientController.js
class IngredientController {
  static async getAll(req, res, next) {
    try {
      const { restauranteId } = req;
      const { include_inactive } = req.query;

      const ingredients = await IngredientService.findAll(
        restauranteId,
        { includeInactive: include_inactive === 'true' }
      );

      res.json(ingredients);
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const { restauranteId } = req;
      const data = req.body;

      // Validación con schema
      const validated = IngredientSchema.parse(data);

      const ingredient = await IngredientService.create(restauranteId, validated);
      res.status(201).json(ingredient);
    } catch (error) {
      next(error);
    }
  }
}
```

#### Fase B3: Servicios de Dominio (Semana 3)

**Objetivo:** Extraer lógica de negocio a servicios

```javascript
// services/SaleService.js
class SaleService {
  constructor(saleRepository, ingredientRepository, recipeRepository) {
    this.saleRepository = saleRepository;
    this.ingredientRepository = ingredientRepository;
    this.recipeRepository = recipeRepository;
  }

  async create(restauranteId, saleData) {
    const { recetaId, cantidad, varianteId } = saleData;

    // 1. Obtener receta con ingredientes
    const receta = await this.recipeRepository.findById(recetaId);
    if (!receta) throw new NotFoundError('Receta no encontrada');

    // 2. Obtener factor de variante
    const factor = varianteId
      ? await this.getVariantFactor(recetaId, varianteId)
      : 1.0;

    // 3. Calcular descuentos de stock
    const stockUpdates = this.calculateStockDeductions(
      receta.ingredientes,
      receta.porciones,
      cantidad,
      factor
    );

    // 4. Ejecutar en transacción
    return await this.executeInTransaction(async (client) => {
      // Crear venta
      const venta = await this.saleRepository.create(client, {
        recetaId,
        cantidad,
        varianteId,
        factorAplicado: factor,
        restauranteId
      });

      // Actualizar stocks
      for (const update of stockUpdates) {
        await this.ingredientRepository.updateStock(
          client,
          update.ingredienteId,
          -update.cantidad
        );
      }

      return venta;
    });
  }

  calculateStockDeductions(ingredientes, porciones, cantidad, factor) {
    return ingredientes.map(ing => ({
      ingredienteId: ing.ingredienteId,
      cantidad: ((ing.cantidad || 0) / porciones) * cantidad * factor
    }));
  }
}
```

#### Fase B4: Validación con Schemas (Semana 4)

**Objetivo:** Implementar validación robusta con Zod

```javascript
// schemas/ingredientSchema.js
const { z } = require('zod');

const IngredientSchema = z.object({
  nombre: z.string()
    .min(1, 'El nombre es obligatorio')
    .max(255, 'El nombre no puede exceder 255 caracteres')
    .transform(s => s.trim()),

  precio: z.number()
    .nonnegative('El precio no puede ser negativo')
    .max(999999, 'El precio es demasiado alto')
    .default(0),

  unidad: z.enum(['kg', 'l', 'ud', 'g', 'ml', 'und', 'paq'])
    .default('kg'),

  stock_actual: z.number()
    .nonnegative('El stock no puede ser negativo')
    .default(0),

  stock_minimo: z.number()
    .nonnegative('El stock mínimo no puede ser negativo')
    .default(0),

  familia: z.enum(['alimento', 'bebida', 'suministro'])
    .default('alimento'),

  proveedor_id: z.number().int().positive().optional(),

  formato_compra: z.string().max(100).optional(),

  cantidad_por_formato: z.number().positive().optional()
});

// Middleware de validación
const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validación fallida',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    next(error);
  }
};
```

#### Fase B5: Testing Automatizado (Semana 5)

```javascript
// tests/unit/services/SaleService.test.js
const { SaleService } = require('../../../src/services/SaleService');

describe('SaleService', () => {
  let saleService;
  let mockSaleRepo, mockIngredientRepo, mockRecipeRepo;

  beforeEach(() => {
    mockSaleRepo = { create: jest.fn() };
    mockIngredientRepo = { updateStock: jest.fn() };
    mockRecipeRepo = { findById: jest.fn() };

    saleService = new SaleService(
      mockSaleRepo,
      mockIngredientRepo,
      mockRecipeRepo
    );
  });

  describe('calculateStockDeductions', () => {
    it('should calculate correct deductions for single portion recipe', () => {
      const ingredientes = [
        { ingredienteId: 1, cantidad: 0.5 },
        { ingredienteId: 2, cantidad: 0.2 }
      ];

      const result = saleService.calculateStockDeductions(
        ingredientes,
        1,    // porciones
        2,    // cantidad vendida
        1.0   // factor
      );

      expect(result).toEqual([
        { ingredienteId: 1, cantidad: 1.0 },  // 0.5 * 2 * 1
        { ingredienteId: 2, cantidad: 0.4 }   // 0.2 * 2 * 1
      ]);
    });

    it('should apply variant factor correctly', () => {
      const ingredientes = [
        { ingredienteId: 1, cantidad: 1.0 }  // Botella de vino
      ];

      const result = saleService.calculateStockDeductions(
        ingredientes,
        1,     // porciones
        1,     // cantidad vendida (1 copa)
        0.2    // factor copa
      );

      expect(result).toEqual([
        { ingredienteId: 1, cantidad: 0.2 }  // 1 * 1 * 0.2 = 0.2 botellas
      ]);
    });
  });
});
```

### 7.3 Deuda Técnica del Backend

| ID | Problema | Severidad | Esfuerzo | Prioridad |
|----|----------|-----------|----------|-----------|
| BT-001 | server.js monolítico (4,192 líneas) | 🔴 Alta | 3 días | 1 |
| BT-002 | Sin schema validation | 🟡 Media | 2 días | 2 |
| BT-003 | Sin tests automatizados | 🔴 Alta | 5 días | 3 |
| BT-004 | Pool de conexiones fijo (max=10) | 🟡 Media | 1 día | 4 |
| BT-005 | Console.log en producción | 🟢 Baja | 0.5 días | 5 |
| BT-006 | Sin versionado de API | 🟡 Media | 1 día | 6 |
| BT-007 | Transacciones no en todos los lugares críticos | 🟡 Media | 2 días | 7 |

### 7.4 Métricas Objetivo del Backend

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| Archivos de código | 1 (server.js) | 25+ módulos |
| Líneas por archivo max | 4,192 | <300 |
| Test coverage | 0% | >70% |
| Cyclomatic complexity | ~50 | <15 |
| Response time p95 | ? | <200ms |
| Error rate | ? | <0.1% |

---

## 7. CHECKLIST DE MIGRACIÓN

### Pre-Migración
- [ ] Backup completo de base de datos
- [ ] Backup de código actual
- [ ] Documentar estado actual de tests
- [ ] Definir métricas de éxito
- [ ] Configurar feature flags

### Fase 1: State Management
- [ ] Instalar Zustand
- [ ] Crear store base para ingredientes
- [ ] Migrar `window.ingredientes`
- [ ] Verificar que UI funciona igual
- [ ] Repetir para recetas, proveedores, pedidos
- [ ] Eliminar variables `window.*`

### Fase 2: Domain Layer
- [ ] Crear Value Objects
- [ ] Crear entidades base
- [ ] Crear interfaces de Repository
- [ ] Escribir tests unitarios
- [ ] Verificar edge cases

### Fase 3: Refactorización
- [ ] Dividir `pedidos-crud.js`
- [ ] Dividir `horarios.js`
- [ ] Dividir `chat-widget.js`
- [ ] Centralizar funciones duplicadas
- [ ] Eliminar código legacy

### Fase 4: Testing
- [ ] Tests unitarios Domain (>80% coverage)
- [ ] Tests de integración
- [ ] Tests E2E críticos
- [ ] Performance benchmarks

### Post-Migración
- [ ] Verificar todas las funcionalidades
- [ ] Monitorear errores en producción
- [ ] Documentar nueva arquitectura
- [ ] Capacitar al equipo

---

## 8. MÉTRICAS DE ÉXITO

| Métrica | Actual | Objetivo | Medición |
|---------|--------|----------|----------|
| Tiempo de carga inicial | 500ms | <500ms | Lighthouse |
| Bundle size (gzip) | ~500KB | <400KB | Vite build |
| Test coverage | ~20% | >70% | Jest |
| Cyclomatic complexity max | 45 | <15 | ESLint |
| Files >500 lines | 5 | 0 | Custom script |
| Errores en producción/día | ? | <5 | Sentry |
| Time to fix bugs | ? | -50% | JIRA metrics |

---

## 9. CONCLUSIONES

### Estado Actual
MindLoop CostOS es una aplicación funcional con buenas optimizaciones de performance pero con deuda técnica significativa que limitará su escalabilidad. La arquitectura híbrida actual permite operación pero dificulta el mantenimiento y testing.

### Recomendación Principal
Implementar la refactorización en fases, comenzando por el State Management (Zustand) que proporcionará el mayor ROI inmediato sin romper funcionalidad existente.

### Riesgo de No Actuar
- Dificultad creciente para añadir features
- Bugs difíciles de reproducir por race conditions
- Imposibilidad de escalar a multi-tenant
- Tiempo de onboarding de nuevos desarrolladores elevado

### Próximos Pasos Inmediatos
1. **Semana 1:** Instalar Zustand y crear primer store
2. **Semana 2:** Migrar estado de ingredientes
3. **Semana 3:** Crear entidades de dominio base
4. **Semana 4:** Dividir primer archivo grande (pedidos-crud.js)

---

*Documento generado el 2026-01-27 por Claude (Anthropic AI)*
*Versión del documento: 1.0*

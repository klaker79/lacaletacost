# ⚡ Quick Start - Backups PostgreSQL en 5 minutos

Guía rápida para configurar backups automáticos de lacaleta-api.

---

## 🚀 Instalación Rápida

### 1. Conectar al servidor

```bash
ssh root@72.61.103.248
```

### 2. Verificar nombre de la base de datos

```bash
# Ver contenedores de PostgreSQL
docker ps | grep postgres

# Ver bases de datos disponibles
docker exec -it $(docker ps --filter "ancestor=postgres" --format "{{.Names}}" | head -1) psql -U postgres -c "\l"
```

**Anotar el nombre exacto de la base de datos** (probablemente "lacaleta" o "lacaleta_api")

### 3. Crear directorios

```bash
mkdir -p /var/backups/postgresql/lacaleta
mkdir -p /var/log/postgresql-backups
chmod 755 /var/backups/postgresql/lacaleta
chmod 755 /var/log/postgresql-backups
```

### 4. Crear script de backup

```bash
cat > /usr/local/bin/backup-db.sh << 'SCRIPT_EOF'
#!/bin/bash

# Configuración - EDITAR ESTAS LÍNEAS
DB_NAME="lacaleta"  # ← Cambiar si tu BD tiene otro nombre
DB_USER="postgres"
BACKUP_DIR="/var/backups/postgresql/lacaleta"
LOG_FILE="/var/log/postgresql-backups/backup.log"
RETENTION_DAYS=7

DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="${BACKUP_DIR}/lacaleta_${DATE}.sql.gz"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"; }

log "🔄 Iniciando backup de $DB_NAME"

# Buscar contenedor de PostgreSQL
POSTGRES_CONTAINER=$(docker ps --filter "ancestor=postgres" --format "{{.Names}}" | head -1)
if [ -z "$POSTGRES_CONTAINER" ]; then
    POSTGRES_CONTAINER=$(docker ps --filter "name=postgres" --format "{{.Names}}" | head -1)
fi

if [ -z "$POSTGRES_CONTAINER" ]; then
    log "❌ No se encontró contenedor de PostgreSQL"
    exit 1
fi

# Hacer backup
docker exec "$POSTGRES_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ ! -s "$BACKUP_FILE" ]; then
    log "❌ Error: backup vacío o falló"
    exit 1
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log "✅ Backup completado: $BACKUP_FILE ($BACKUP_SIZE)"

# Eliminar backups antiguos
DELETED=$(find "$BACKUP_DIR" -name "lacaleta_*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
log "🗑️  Eliminados $DELETED backups antiguos (>$RETENTION_DAYS días)"

log "✅ Proceso completado"
SCRIPT_EOF
```

### 5. Dar permisos de ejecución

```bash
chmod +x /usr/local/bin/backup-db.sh
```

### 6. Probar el backup manualmente

```bash
/usr/local/bin/backup-db.sh
```

Deberías ver:
```
[2026-01-04 15:30:00] 🔄 Iniciando backup de lacaleta
[2026-01-04 15:30:05] ✅ Backup completado: /var/backups/postgresql/lacaleta/lacaleta_2026-01-04_15-30-00.sql.gz (2.3M)
[2026-01-04 15:30:05] 🗑️  Eliminados 0 backups antiguos (>7 días)
[2026-01-04 15:30:05] ✅ Proceso completado
```

### 7. Verificar que el backup se creó

```bash
ls -lh /var/backups/postgresql/lacaleta/
```

### 8. Configurar cron para ejecución automática

```bash
crontab -e
```

**Agregar esta línea al final:**

```bash
# Backup diario a las 3:00 AM
0 3 * * * /usr/local/bin/backup-db.sh >> /var/log/postgresql-backups/cron.log 2>&1
```

Guardar y salir (Ctrl+X, Y, Enter en nano)

### 9. Verificar cron configurado

```bash
crontab -l
```

---

## 🔄 Restaurar un Backup

### Ver backups disponibles

```bash
ls -lth /var/backups/postgresql/lacaleta/ | head -10
```

### Restaurar el backup más reciente

```bash
# Obtener archivo más reciente
LATEST_BACKUP=$(ls -t /var/backups/postgresql/lacaleta/*.sql.gz | head -1)

# Obtener contenedor de PostgreSQL
POSTGRES_CONTAINER=$(docker ps --filter "ancestor=postgres" --format "{{.Names}}" | head -1)

# Restaurar
gunzip < "$LATEST_BACKUP" | docker exec -i "$POSTGRES_CONTAINER" psql -U postgres -d lacaleta

echo "✅ Restauración completada"
```

---

## 📊 Monitoreo

### Ver logs de backup

```bash
tail -f /var/log/postgresql-backups/backup.log
```

### Ver próxima ejecución de cron

```bash
crontab -l | grep backup
```

### Ver espacio usado por backups

```bash
du -sh /var/backups/postgresql/lacaleta/
```

---

## 🆘 Troubleshooting

### Backup no se ejecuta automáticamente

```bash
# Verificar que cron está corriendo
systemctl status cron

# Ver logs de cron
tail -f /var/log/postgresql-backups/cron.log
```

### Error: "No se encontró contenedor de PostgreSQL"

```bash
# Ver contenedores corriendo
docker ps

# Editar el script y cambiar la forma de buscar el contenedor
nano /usr/local/bin/backup-db.sh

# Cambiar esta línea por el nombre exacto de tu contenedor:
POSTGRES_CONTAINER="nombre_exacto_del_contenedor"
```

### Backup muy grande

```bash
# Ver tamaño de la base de datos
docker exec <contenedor> psql -U postgres -d lacaleta -c "SELECT pg_size_pretty(pg_database_size('lacaleta'));"
```

---

## ✅ Checklist de Verificación

- [ ] Directorio `/var/backups/postgresql/lacaleta` existe
- [ ] Script `/usr/local/bin/backup-db.sh` tiene permisos de ejecución
- [ ] Backup manual funciona correctamente
- [ ] Archivo de backup existe y no está vacío
- [ ] Cron configurado con `crontab -l`
- [ ] Test de restauración exitoso

---

## 📞 Comandos Útiles

```bash
# Ejecutar backup manual
/usr/local/bin/backup-db.sh

# Ver backups
ls -lh /var/backups/postgresql/lacaleta/

# Ver logs
tail -100 /var/log/postgresql-backups/backup.log

# Editar cron
crontab -e

# Ver tamaño de backups
du -sh /var/backups/postgresql/lacaleta/

# Descargar backup a tu PC
scp root@72.61.103.248:/var/backups/postgresql/lacaleta/lacaleta_*.sql.gz ~/Downloads/
```

---

**¡Listo!** Tus backups están configurados y se ejecutarán automáticamente cada día a las 3:00 AM.

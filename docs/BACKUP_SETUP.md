# 📦 Sistema de Backups Automáticos PostgreSQL - lacaleta-api

Documentación completa para configurar backups automáticos de la base de datos PostgreSQL.

---

## 📋 Índice

1. [Requisitos](#requisitos)
2. [Instalación](#instalación)
3. [Configuración de Cron](#configuración-de-cron)
4. [Uso del Script de Backup](#uso-del-script-de-backup)
5. [Restauración desde Backup](#restauración-desde-backup)
6. [Configuración de Cloud Storage](#configuración-de-cloud-storage)
7. [Verificación y Monitoreo](#verificación-y-monitoreo)
8. [Troubleshooting](#troubleshooting)

---

## 🔧 Requisitos

- Servidor: 72.61.103.248
- PostgreSQL (instalado o en contenedor Docker)
- Acceso SSH al servidor
- Espacio en disco: mínimo 5 GB para backups
- Permisos de root o sudo

**Verificar versión de PostgreSQL:**
```bash
# Si está en Docker
docker ps | grep postgres

# Si está instalado localmente
psql --version
```

---

## 🚀 Instalación

### Paso 1: Conectar al servidor

```bash
ssh root@72.61.103.248
# O si usas un usuario con sudo:
ssh usuario@72.61.103.248
```

### Paso 2: Crear estructura de directorios

```bash
# Crear directorios para backups y logs
sudo mkdir -p /var/backups/postgresql/lacaleta
sudo mkdir -p /var/log/postgresql-backups

# Dar permisos apropiados
sudo chmod 755 /var/backups/postgresql/lacaleta
sudo chmod 755 /var/log/postgresql-backups
```

### Paso 3: Copiar scripts al servidor

**Opción A: Subir scripts desde tu máquina local**

```bash
# Desde tu máquina local (donde tienes los scripts)
scp scripts/backup-db.sh root@72.61.103.248:/usr/local/bin/
scp scripts/restore-db.sh root@72.61.103.248:/usr/local/bin/
```

**Opción B: Crear scripts directamente en el servidor**

```bash
# Conectado al servidor
sudo nano /usr/local/bin/backup-db.sh
# Pegar el contenido del script backup-db.sh

sudo nano /usr/local/bin/restore-db.sh
# Pegar el contenido del script restore-db.sh
```

### Paso 4: Dar permisos de ejecución

```bash
sudo chmod +x /usr/local/bin/backup-db.sh
sudo chmod +x /usr/local/bin/restore-db.sh
```

### Paso 5: Configurar credenciales de base de datos

**Verificar nombre de la base de datos:**

```bash
# Si PostgreSQL está en Docker (Dokploy)
docker ps | grep postgres
docker exec -it <CONTAINER_NAME> psql -U postgres -c "\l"

# Debería mostrar una lista de bases de datos
# Buscar: lacaleta, lacaleta_api, lacaleta-api, etc.
```

**Editar configuración del script:**

```bash
sudo nano /usr/local/bin/backup-db.sh
```

Modificar estas líneas según tu configuración:

```bash
DB_NAME="lacaleta"          # ← Cambiar al nombre exacto de tu BD
DB_USER="postgres"          # ← Usuario de PostgreSQL
DB_HOST="localhost"
DB_PORT="5432"
```

---

## ⏰ Configuración de Cron

### Opción 1: Backup diario a las 3:00 AM (RECOMENDADO)

```bash
# Abrir crontab
sudo crontab -e
```

**Agregar esta línea al final del archivo:**

```bash
# Backup diario de lacaleta-api a las 3:00 AM
0 3 * * * /usr/local/bin/backup-db.sh >> /var/log/postgresql-backups/cron.log 2>&1
```

### Opción 2: Backup cada 6 horas

```bash
# Backup cada 6 horas (00:00, 06:00, 12:00, 18:00)
0 */6 * * * /usr/local/bin/backup-db.sh >> /var/log/postgresql-backups/cron.log 2>&1
```

### Opción 3: Backup semanal (Domingos a las 2:00 AM)

```bash
# Backup semanal los domingos a las 2:00 AM
0 2 * * 0 /usr/local/bin/backup-db.sh >> /var/log/postgresql-backups/cron.log 2>&1
```

### Verificar que cron está configurado correctamente

```bash
# Ver crontab actual
sudo crontab -l

# Ver logs de cron
sudo tail -f /var/log/postgresql-backups/cron.log
```

---

## 📥 Uso del Script de Backup

### Ejecutar backup manual

```bash
# Ejecutar backup ahora
sudo /usr/local/bin/backup-db.sh
```

### Ver backups disponibles

```bash
# Listar backups
ls -lh /var/backups/postgresql/lacaleta/

# Ver con formato más legible
sudo /usr/local/bin/backup-db.sh --list 2>/dev/null || \
  find /var/backups/postgresql/lacaleta -name "*.sql.gz" -type f -exec ls -lh {} \;
```

### Ver logs de backups

```bash
# Ver log completo
sudo tail -100 /var/log/postgresql-backups/backup.log

# Ver solo backups exitosos
sudo grep "✅" /var/log/postgresql-backups/backup.log

# Ver errores
sudo grep "❌" /var/log/postgresql-backups/backup.log
```

---

## 🔄 Restauración desde Backup

### Ver backups disponibles

```bash
sudo /usr/local/bin/restore-db.sh --list
```

### Restaurar el backup más reciente

```bash
sudo /usr/local/bin/restore-db.sh --latest
```

### Restaurar un backup específico

```bash
sudo /usr/local/bin/restore-db.sh /var/backups/postgresql/lacaleta/lacaleta_2026-01-04_03-00-00.sql.gz
```

### Restauración completa (eliminar BD actual y restaurar)

⚠️ **PRECAUCIÓN**: Esto elimina todos los datos actuales

```bash
sudo /usr/local/bin/restore-db.sh --drop-database --latest
```

### Descargar backup a tu máquina local

```bash
# Desde tu máquina local
scp root@72.61.103.248:/var/backups/postgresql/lacaleta/lacaleta_2026-01-04_03-00-00.sql.gz ~/Downloads/
```

### Restaurar localmente (para testing)

```bash
# En tu máquina local
gunzip < lacaleta_2026-01-04_03-00-00.sql.gz | psql -U postgres -d lacaleta_local
```

---

## ☁️ Configuración de Cloud Storage

### Opción 1: Google Drive (usando rclone)

**Instalar rclone:**

```bash
curl https://rclone.org/install.sh | sudo bash
```

**Configurar Google Drive:**

```bash
rclone config
# Seguir wizard para conectar Google Drive
# Nombre de remote: "gdrive"
```

**Obtener ID de carpeta de Google Drive:**

1. Crear carpeta "lacaleta-backups" en Google Drive
2. Abrir la carpeta en navegador
3. Copiar el ID de la URL: `https://drive.google.com/drive/folders/ESTE_ES_EL_ID`

**Editar script de backup:**

```bash
sudo nano /usr/local/bin/backup-db.sh
```

Cambiar estas líneas:

```bash
ENABLE_CLOUD_BACKUP=true
CLOUD_TYPE="gdrive"
GDRIVE_FOLDER_ID="PEGAR_ID_AQUI"
```

### Opción 2: AWS S3

**Instalar AWS CLI:**

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

**Configurar credenciales:**

```bash
aws configure
# AWS Access Key ID: <tu_access_key>
# AWS Secret Access Key: <tu_secret_key>
# Default region: us-east-1
```

**Crear bucket S3:**

```bash
aws s3 mb s3://lacaleta-backups
```

**Editar script de backup:**

```bash
sudo nano /usr/local/bin/backup-db.sh
```

```bash
ENABLE_CLOUD_BACKUP=true
CLOUD_TYPE="s3"
S3_BUCKET="lacaleta-backups"
```

### Opción 3: Dropbox

**Instalar Dropbox Uploader:**

```bash
cd ~
git clone https://github.com/andreafabrizi/Dropbox-Uploader.git
cd Dropbox-Uploader
chmod +x dropbox_uploader.sh
./dropbox_uploader.sh
# Seguir wizard de autenticación
```

---

## 🔍 Verificación y Monitoreo

### Verificar que el backup funciona

**Test 1: Ejecutar backup manual**

```bash
sudo /usr/local/bin/backup-db.sh
```

Debería ver output similar a:

```
[2026-01-04 15:30:00] ==========================================
[2026-01-04 15:30:00] 🚀 Iniciando proceso de backup
[2026-01-04 15:30:00] ==========================================
[2026-01-04 15:30:00] ✅ Directorios verificados
[2026-01-04 15:30:01] 📦 Usando contenedor Docker: postgres-1
[2026-01-04 15:30:01] 🔄 Iniciando backup de base de datos: lacaleta
[2026-01-04 15:30:05] ✅ Backup completado: /var/backups/postgresql/lacaleta/lacaleta_2026-01-04_15-30-00.sql.gz (2.3M)
[2026-01-04 15:30:05] 🗑️  Eliminando backups con más de 7 días
[2026-01-04 15:30:05] ✅ Proceso completado
```

**Test 2: Verificar archivo de backup**

```bash
# Verificar que el archivo existe y no está vacío
ls -lh /var/backups/postgresql/lacaleta/*.sql.gz

# Ver contenido (primeras líneas)
gunzip < /var/backups/postgresql/lacaleta/lacaleta_*.sql.gz | head -20
```

**Test 3: Test de restauración en base de datos temporal**

```bash
# Crear BD de prueba
docker exec postgres-1 psql -U postgres -c "CREATE DATABASE lacaleta_test;"

# Restaurar backup en BD de prueba
gunzip < /var/backups/postgresql/lacaleta/lacaleta_*.sql.gz | \
  docker exec -i postgres-1 psql -U postgres -d lacaleta_test

# Verificar tablas
docker exec postgres-1 psql -U postgres -d lacaleta_test -c "\dt"

# Eliminar BD de prueba
docker exec postgres-1 psql -U postgres -c "DROP DATABASE lacaleta_test;"
```

### Monitorear backups automáticos

**Ver próximas ejecuciones de cron:**

```bash
# Ver crontab
sudo crontab -l

# Verificar que cron está corriendo
sudo systemctl status cron
```

**Crear alerta si el backup falla (opcional):**

```bash
sudo nano /usr/local/bin/check-backup-health.sh
```

```bash
#!/bin/bash
LATEST_BACKUP=$(find /var/backups/postgresql/lacaleta -name "*.sql.gz" -type f -mtime -1 | wc -l)

if [ "$LATEST_BACKUP" -eq 0 ]; then
    echo "⚠️ ALERTA: No hay backups recientes (últimas 24 horas)"
    # Enviar notificación
    curl -X POST https://tu-webhook.com/alert -d "No hay backups recientes de lacaleta"
else
    echo "✅ Backup reciente encontrado"
fi
```

```bash
sudo chmod +x /usr/local/bin/check-backup-health.sh

# Agregar a cron (ejecutar cada hora)
# 0 * * * * /usr/local/bin/check-backup-health.sh
```

---

## 🆘 Troubleshooting

### Error: "pg_dump: command not found"

**Solución:** El script automáticamente detectará si PostgreSQL está en Docker.

Verificar:
```bash
docker ps | grep postgres
```

### Error: "Permission denied"

**Solución:** Ejecutar con sudo

```bash
sudo /usr/local/bin/backup-db.sh
```

### Error: "No space left on device"

**Solución:** Liberar espacio o reducir retención de backups

```bash
# Ver espacio en disco
df -h

# Eliminar backups manualmente
sudo rm /var/backups/postgresql/lacaleta/lacaleta_2025-*.sql.gz

# Reducir retención en el script (de 7 a 3 días)
sudo nano /usr/local/bin/backup-db.sh
# Cambiar: RETENTION_DAYS=3
```

### Backup tarda mucho tiempo

**Solución:** Optimizar configuración

```bash
# Ver tamaño de la base de datos
docker exec postgres-1 psql -U postgres -d lacaleta -c "\l+"

# Si es muy grande (>10GB), considerar:
# 1. Backup incremental (solo cambios)
# 2. Backup paralelo
# 3. Comprimir con mejor algoritmo
```

### No se pueden restaurar datos

**Solución:** Verificar integridad del backup

```bash
# Test de integridad
gunzip -t /var/backups/postgresql/lacaleta/lacaleta_*.sql.gz

# Si falla, usar backup anterior
sudo /usr/local/bin/restore-db.sh --list
```

---

## 📊 Comandos Útiles

### Ver espacio usado por backups

```bash
du -sh /var/backups/postgresql/lacaleta/
```

### Contar backups disponibles

```bash
find /var/backups/postgresql/lacaleta -name "*.sql.gz" | wc -l
```

### Ver backup más antiguo y más reciente

```bash
# Más antiguo
ls -lt /var/backups/postgresql/lacaleta/*.sql.gz | tail -1

# Más reciente
ls -lt /var/backups/postgresql/lacaleta/*.sql.gz | head -1
```

### Comprimir backup antiguo con mejor ratio

```bash
# Recomprimir con xz (mejor compresión pero más lento)
gunzip < backup.sql.gz | xz > backup.sql.xz
```

---

## 🎯 Resumen de Comandos Esenciales

| Acción | Comando |
|--------|---------|
| **Backup manual** | `sudo /usr/local/bin/backup-db.sh` |
| **Listar backups** | `ls -lh /var/backups/postgresql/lacaleta/` |
| **Restaurar último backup** | `sudo /usr/local/bin/restore-db.sh --latest` |
| **Ver logs** | `sudo tail -f /var/log/postgresql-backups/backup.log` |
| **Editar cron** | `sudo crontab -e` |
| **Test de backup** | `gunzip -t /var/backups/postgresql/lacaleta/*.sql.gz` |

---

## 📞 Soporte

Si tienes problemas:

1. Revisar logs: `/var/log/postgresql-backups/backup.log`
2. Verificar permisos: `ls -la /var/backups/postgresql/lacaleta/`
3. Verificar cron: `sudo crontab -l`
4. Verificar PostgreSQL: `docker ps | grep postgres`

---

**Última actualización:** 2026-01-04
**Versión:** 1.0.0

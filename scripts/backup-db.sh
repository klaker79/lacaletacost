#!/bin/bash

################################################################################
# Script de Backup Automático PostgreSQL para lacaleta-api
#
# Descripción: Realiza backup diario de la base de datos, comprime,
#              rotaciona backups antiguos y opcionalmente sube a cloud
#
# Uso: ./backup-db.sh
# Autor: MindLoop IA
# Fecha: 2026-01-04
################################################################################

# ============================================
# CONFIGURACIÓN
# ============================================

# Base de datos
DB_NAME="lacaleta"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# Directorios
BACKUP_DIR="/var/backups/postgresql/lacaleta"
LOG_DIR="/var/log/postgresql-backups"
LOG_FILE="${LOG_DIR}/backup.log"

# Retención
RETENTION_DAYS=7

# Fecha y timestamp
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="${BACKUP_DIR}/lacaleta_${DATE}.sql.gz"

# Notificaciones (opcional - configurar si se desea)
ENABLE_NOTIFICATIONS=false
WEBHOOK_URL=""  # URL de webhook (Discord, Slack, n8n, etc.)

# Cloud Storage (opcional)
ENABLE_CLOUD_BACKUP=false
CLOUD_TYPE="gdrive"  # opciones: gdrive, s3, dropbox
GDRIVE_FOLDER_ID=""  # ID de carpeta de Google Drive
S3_BUCKET=""         # Nombre del bucket S3

# ============================================
# FUNCIONES
# ============================================

# Función de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Función de error
error() {
    log "❌ ERROR: $1"
    send_notification "❌ Backup FAILED: $1"
    exit 1
}

# Función de notificación
send_notification() {
    if [ "$ENABLE_NOTIFICATIONS" = true ] && [ -n "$WEBHOOK_URL" ]; then
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"$1\"}" \
            --silent --output /dev/null
    fi
}

# Verificar que pg_dump está disponible
check_dependencies() {
    if ! command -v pg_dump &> /dev/null; then
        # Si no está instalado localmente, intentar usar Docker
        if command -v docker &> /dev/null; then
            log "ℹ️  pg_dump no encontrado localmente, usando contenedor Docker"
            USE_DOCKER=true
        else
            error "pg_dump no está instalado y Docker tampoco está disponible"
        fi
    else
        USE_DOCKER=false
    fi
}

# Crear directorios si no existen
create_directories() {
    mkdir -p "$BACKUP_DIR" || error "No se pudo crear directorio de backups"
    mkdir -p "$LOG_DIR" || error "No se pudo crear directorio de logs"
    log "✅ Directorios verificados"
}

# Realizar backup
do_backup() {
    log "🔄 Iniciando backup de base de datos: $DB_NAME"

    if [ "$USE_DOCKER" = true ]; then
        # Backup usando contenedor Docker (Dokploy típicamente usa este patrón)
        # Buscar contenedor de PostgreSQL
        POSTGRES_CONTAINER=$(docker ps --filter "ancestor=postgres" --format "{{.Names}}" | head -1)

        if [ -z "$POSTGRES_CONTAINER" ]; then
            # Intentar encontrar por nombre común
            POSTGRES_CONTAINER=$(docker ps --filter "name=postgres" --format "{{.Names}}" | head -1)
        fi

        if [ -z "$POSTGRES_CONTAINER" ]; then
            error "No se encontró contenedor de PostgreSQL"
        fi

        log "📦 Usando contenedor Docker: $POSTGRES_CONTAINER"

        # Ejecutar pg_dump dentro del contenedor
        docker exec "$POSTGRES_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"
    else
        # Backup usando pg_dump local
        PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"
    fi

    # Verificar que el backup se creó correctamente
    if [ ! -f "$BACKUP_FILE" ]; then
        error "El archivo de backup no se creó"
    fi

    # Verificar tamaño del backup
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

    if [ ! -s "$BACKUP_FILE" ]; then
        error "El archivo de backup está vacío"
    fi

    log "✅ Backup completado: $BACKUP_FILE ($BACKUP_SIZE)"
}

# Rotar backups antiguos
rotate_backups() {
    log "🗑️  Eliminando backups con más de $RETENTION_DAYS días"

    DELETED_COUNT=$(find "$BACKUP_DIR" -name "lacaleta_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete -print | wc -l)

    if [ "$DELETED_COUNT" -gt 0 ]; then
        log "✅ Eliminados $DELETED_COUNT backups antiguos"
    else
        log "ℹ️  No hay backups antiguos para eliminar"
    fi
}

# Listar backups disponibles
list_backups() {
    log "📋 Backups disponibles:"
    find "$BACKUP_DIR" -name "lacaleta_*.sql.gz" -type f -printf "%T@ %Tc %p %s\n" | sort -rn | head -10 | while read -r timestamp date time tz year path size; do
        SIZE_MB=$(echo "scale=2; $size / 1024 / 1024" | bc)
        log "   - $(basename "$path") (${SIZE_MB} MB) - $date $time $year"
    done
}

# Subir a Google Drive (requiere rclone configurado)
upload_to_gdrive() {
    if [ "$ENABLE_CLOUD_BACKUP" = true ] && [ "$CLOUD_TYPE" = "gdrive" ]; then
        log "☁️  Subiendo backup a Google Drive..."

        if ! command -v rclone &> /dev/null; then
            log "⚠️  rclone no está instalado, saltando backup en cloud"
            return
        fi

        rclone copy "$BACKUP_FILE" "gdrive:$GDRIVE_FOLDER_ID" || log "⚠️  Error al subir a Google Drive"
        log "✅ Backup subido a Google Drive"
    fi
}

# Subir a S3 (requiere aws-cli configurado)
upload_to_s3() {
    if [ "$ENABLE_CLOUD_BACKUP" = true ] && [ "$CLOUD_TYPE" = "s3" ]; then
        log "☁️  Subiendo backup a AWS S3..."

        if ! command -v aws &> /dev/null; then
            log "⚠️  AWS CLI no está instalado, saltando backup en cloud"
            return
        fi

        aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/backups/postgresql/" || log "⚠️  Error al subir a S3"
        log "✅ Backup subido a S3"
    fi
}

# ============================================
# SCRIPT PRINCIPAL
# ============================================

main() {
    log "=========================================="
    log "🚀 Iniciando proceso de backup"
    log "=========================================="

    # Verificar dependencias
    check_dependencies

    # Crear directorios
    create_directories

    # Realizar backup
    do_backup

    # Rotar backups antiguos
    rotate_backups

    # Listar backups
    list_backups

    # Subir a cloud (si está habilitado)
    if [ "$CLOUD_TYPE" = "gdrive" ]; then
        upload_to_gdrive
    elif [ "$CLOUD_TYPE" = "s3" ]; then
        upload_to_s3
    fi

    log "=========================================="
    log "✅ Proceso de backup completado exitosamente"
    log "=========================================="

    send_notification "✅ Backup completado: $BACKUP_FILE ($BACKUP_SIZE)"
}

# Ejecutar script principal
main

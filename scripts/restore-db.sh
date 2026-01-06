#!/bin/bash

################################################################################
# Script de Restauración PostgreSQL para lacaleta-api
#
# Descripción: Restaura la base de datos desde un archivo de backup
#
# Uso: ./restore-db.sh <archivo_backup.sql.gz>
# Ejemplo: ./restore-db.sh /var/backups/postgresql/lacaleta/lacaleta_2026-01-04_03-00-00.sql.gz
#
# Autor: MindLoop IA
# Fecha: 2026-01-04
################################################################################

# ============================================
# CONFIGURACIÓN
# ============================================

DB_NAME="lacaleta"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

BACKUP_DIR="/var/backups/postgresql/lacaleta"
LOG_DIR="/var/log/postgresql-backups"
LOG_FILE="${LOG_DIR}/restore.log"

# ============================================
# FUNCIONES
# ============================================

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
    log "❌ ERROR: $1"
    exit 1
}

show_usage() {
    echo ""
    echo "📘 Uso: $0 [OPCIONES] <archivo_backup>"
    echo ""
    echo "Opciones:"
    echo "  -l, --list              Listar backups disponibles"
    echo "  -h, --help              Mostrar esta ayuda"
    echo "  --latest                Restaurar el backup más reciente"
    echo "  --drop-database         Eliminar base de datos existente antes de restaurar"
    echo ""
    echo "Ejemplos:"
    echo "  $0 --list"
    echo "  $0 --latest"
    echo "  $0 /var/backups/postgresql/lacaleta/lacaleta_2026-01-04_03-00-00.sql.gz"
    echo "  $0 --drop-database --latest"
    echo ""
}

list_backups() {
    log "📋 Backups disponibles en $BACKUP_DIR:"
    echo ""

    if [ ! -d "$BACKUP_DIR" ]; then
        error "Directorio de backups no existe: $BACKUP_DIR"
    fi

    # Listar backups ordenados por fecha (más reciente primero)
    find "$BACKUP_DIR" -name "lacaleta_*.sql.gz" -type f -printf "%T@ %Tc %p %s\n" | sort -rn | nl -w2 -s'. ' | while read -r num timestamp date time tz year path size; do
        SIZE_MB=$(echo "scale=2; $size / 1024 / 1024" | bc 2>/dev/null || echo "N/A")
        printf "%2s. %-40s (%6s MB) - %s %s %s\n" "$num" "$(basename "$path")" "$SIZE_MB" "$date" "$time" "$year"
    done

    echo ""
}

get_latest_backup() {
    find "$BACKUP_DIR" -name "lacaleta_*.sql.gz" -type f -printf "%T@ %p\n" | sort -rn | head -1 | cut -d' ' -f2
}

check_docker() {
    if command -v docker &> /dev/null; then
        POSTGRES_CONTAINER=$(docker ps --filter "ancestor=postgres" --format "{{.Names}}" | head -1)

        if [ -z "$POSTGRES_CONTAINER" ]; then
            POSTGRES_CONTAINER=$(docker ps --filter "name=postgres" --format "{{.Names}}" | head -1)
        fi

        if [ -n "$POSTGRES_CONTAINER" ]; then
            log "📦 Usando contenedor Docker: $POSTGRES_CONTAINER"
            USE_DOCKER=true
        else
            USE_DOCKER=false
        fi
    else
        USE_DOCKER=false
    fi
}

drop_database() {
    log "⚠️  ADVERTENCIA: Eliminando base de datos existente: $DB_NAME"
    read -p "¿Estás seguro? Esta acción NO se puede deshacer. Escribe 'SI' para confirmar: " confirm

    if [ "$confirm" != "SI" ]; then
        log "❌ Restauración cancelada por el usuario"
        exit 0
    fi

    if [ "$USE_DOCKER" = true ]; then
        docker exec "$POSTGRES_CONTAINER" psql -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;"
        docker exec "$POSTGRES_CONTAINER" psql -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"
    else
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;"
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"
    fi

    log "✅ Base de datos recreada"
}

restore_backup() {
    local BACKUP_FILE="$1"

    log "=========================================="
    log "🔄 Iniciando restauración de base de datos"
    log "=========================================="

    # Verificar que el archivo existe
    if [ ! -f "$BACKUP_FILE" ]; then
        error "Archivo de backup no encontrado: $BACKUP_FILE"
    fi

    log "📂 Archivo: $BACKUP_FILE"
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "📦 Tamaño: $BACKUP_SIZE"

    # Verificar que el archivo no está vacío
    if [ ! -s "$BACKUP_FILE" ]; then
        error "El archivo de backup está vacío"
    fi

    log "⚠️  IMPORTANTE: La restauración sobrescribirá los datos actuales de la base de datos"
    read -p "¿Continuar con la restauración? (s/n): " -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
        log "❌ Restauración cancelada por el usuario"
        exit 0
    fi

    # Realizar restauración
    log "🔄 Restaurando base de datos..."

    if [ "$USE_DOCKER" = true ]; then
        # Restaurar usando contenedor Docker
        gunzip < "$BACKUP_FILE" | docker exec -i "$POSTGRES_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"
    else
        # Restaurar usando psql local
        gunzip < "$BACKUP_FILE" | PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"
    fi

    if [ $? -eq 0 ]; then
        log "✅ Restauración completada exitosamente"
        log "=========================================="
    else
        error "Error durante la restauración"
    fi
}

# ============================================
# SCRIPT PRINCIPAL
# ============================================

main() {
    mkdir -p "$LOG_DIR"

    # Verificar si se está usando Docker
    check_docker

    # Parsear argumentos
    DROP_DB=false
    USE_LATEST=false
    BACKUP_FILE=""

    while [[ $# -gt 0 ]]; do
        case $1 in
            -l|--list)
                list_backups
                exit 0
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            --latest)
                USE_LATEST=true
                shift
                ;;
            --drop-database)
                DROP_DB=true
                shift
                ;;
            *)
                BACKUP_FILE="$1"
                shift
                ;;
        esac
    done

    # Si no se especificó archivo y se pidió el más reciente
    if [ "$USE_LATEST" = true ]; then
        BACKUP_FILE=$(get_latest_backup)

        if [ -z "$BACKUP_FILE" ]; then
            error "No se encontraron backups en $BACKUP_DIR"
        fi

        log "📌 Usando backup más reciente: $(basename "$BACKUP_FILE")"
    fi

    # Validar que se especificó un archivo
    if [ -z "$BACKUP_FILE" ]; then
        show_usage
        error "Debes especificar un archivo de backup o usar --latest"
    fi

    # Eliminar base de datos si se solicitó
    if [ "$DROP_DB" = true ]; then
        drop_database
    fi

    # Restaurar backup
    restore_backup "$BACKUP_FILE"
}

# Ejecutar script principal
main "$@"

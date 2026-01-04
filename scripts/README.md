# 📦 Scripts de Backup PostgreSQL - lacaleta-api

Sistema automatizado de backups para la base de datos PostgreSQL de lacaleta-api.

---

## 📁 Contenido

| Archivo | Descripción |
|---------|-------------|
| `backup-db.sh` | Script principal de backup automático |
| `restore-db.sh` | Script de restauración de backups |
| `backup-config.env` | Plantilla de configuración |
| `QUICKSTART.md` | Guía de instalación rápida (5 minutos) |

---

## ⚡ Quick Start

**1. Leer la guía rápida:**
```bash
cat QUICKSTART.md
```

**2. Ejecutar backup manual:**
```bash
sudo /usr/local/bin/backup-db.sh
```

**3. Configurar cron para backups automáticos:**
```bash
sudo crontab -e
# Agregar: 0 3 * * * /usr/local/bin/backup-db.sh >> /var/log/postgresql-backups/cron.log 2>&1
```

---

## 📚 Documentación Completa

Ver documentación detallada en: [`/docs/BACKUP_SETUP.md`](../docs/BACKUP_SETUP.md)

Incluye:
- ✅ Instalación paso a paso
- ✅ Configuración de cron
- ✅ Restauración desde backup
- ✅ Integración con Google Drive / AWS S3
- ✅ Troubleshooting
- ✅ Monitoreo y alertas

---

## 🎯 Características

- ✅ **Backup automático diario** con compresión gzip
- ✅ **Rotación automática** de backups antiguos (7 días)
- ✅ **Compatible con Docker** (detecta automáticamente contenedores)
- ✅ **Logs detallados** de cada operación
- ✅ **Restauración fácil** con script dedicado
- ✅ **Cloud backup opcional** (Google Drive, S3, Dropbox)
- ✅ **Notificaciones** vía webhook (Discord, Slack, etc.)
- ✅ **Verificación de integridad** de backups

---

## 📊 Uso Básico

### Backup Manual
```bash
sudo /usr/local/bin/backup-db.sh
```

### Listar Backups
```bash
ls -lth /var/backups/postgresql/lacaleta/
```

### Restaurar Último Backup
```bash
sudo /usr/local/bin/restore-db.sh --latest
```

### Ver Logs
```bash
sudo tail -f /var/log/postgresql-backups/backup.log
```

---

## ⚙️ Configuración

### Editar Configuración del Script

```bash
sudo nano /usr/local/bin/backup-db.sh
```

Principales variables a configurar:

```bash
DB_NAME="lacaleta"          # Nombre de la base de datos
DB_USER="postgres"          # Usuario de PostgreSQL
RETENTION_DAYS=7            # Días de retención de backups
ENABLE_CLOUD_BACKUP=false   # Habilitar backup en la nube
```

### Configurar Cron (Backup Automático)

```bash
sudo crontab -e
```

Ejemplos de programación:

```bash
# Diario a las 3:00 AM (RECOMENDADO)
0 3 * * * /usr/local/bin/backup-db.sh >> /var/log/postgresql-backups/cron.log 2>&1

# Cada 6 horas
0 */6 * * * /usr/local/bin/backup-db.sh >> /var/log/postgresql-backups/cron.log 2>&1

# Semanal (Domingos 2:00 AM)
0 2 * * 0 /usr/local/bin/backup-db.sh >> /var/log/postgresql-backups/cron.log 2>&1
```

---

## 🔄 Restauración

### Ver Backups Disponibles
```bash
sudo /usr/local/bin/restore-db.sh --list
```

### Restaurar Backup Específico
```bash
sudo /usr/local/bin/restore-db.sh /var/backups/postgresql/lacaleta/lacaleta_2026-01-04_03-00-00.sql.gz
```

### Restaurar + Eliminar BD Actual (PRECAUCIÓN)
```bash
sudo /usr/local/bin/restore-db.sh --drop-database --latest
```

---

## 🔍 Monitoreo

### Verificar Último Backup

```bash
# Ver archivo más reciente
ls -lth /var/backups/postgresql/lacaleta/ | head -2

# Ver log del último backup
tail -20 /var/log/postgresql-backups/backup.log
```

### Verificar Cron Configurado

```bash
# Ver crontab actual
sudo crontab -l

# Ver logs de ejecuciones cron
sudo tail -f /var/log/postgresql-backups/cron.log
```

### Espacio en Disco

```bash
# Ver espacio usado por backups
du -sh /var/backups/postgresql/lacaleta/

# Ver espacio disponible en disco
df -h /var/backups/
```

---

## 🆘 Troubleshooting

### Backup no se ejecuta automáticamente

```bash
# 1. Verificar que cron está corriendo
sudo systemctl status cron

# 2. Ver errores en logs
sudo tail -50 /var/log/postgresql-backups/cron.log

# 3. Verificar permisos del script
ls -l /usr/local/bin/backup-db.sh
```

### Error: "pg_dump: command not found"

El script detecta automáticamente si PostgreSQL está en Docker. Verificar:

```bash
docker ps | grep postgres
```

### Backup vacío o muy pequeño

```bash
# Verificar tamaño de la base de datos
docker exec <postgres_container> psql -U postgres -d lacaleta -c "SELECT pg_size_pretty(pg_database_size('lacaleta'));"

# Verificar logs por errores
sudo grep "ERROR" /var/log/postgresql-backups/backup.log
```

---

## ☁️ Cloud Backup (Opcional)

### Google Drive con rclone

```bash
# 1. Instalar rclone
curl https://rclone.org/install.sh | sudo bash

# 2. Configurar
rclone config

# 3. Editar script
sudo nano /usr/local/bin/backup-db.sh
# Cambiar:
# ENABLE_CLOUD_BACKUP=true
# CLOUD_TYPE="gdrive"
# GDRIVE_FOLDER_ID="tu_folder_id"
```

### AWS S3

```bash
# 1. Instalar AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# 2. Configurar credenciales
aws configure

# 3. Editar script
sudo nano /usr/local/bin/backup-db.sh
# Cambiar:
# ENABLE_CLOUD_BACKUP=true
# CLOUD_TYPE="s3"
# S3_BUCKET="tu-bucket-name"
```

---

## 📞 Comandos de Referencia Rápida

| Acción | Comando |
|--------|---------|
| Backup manual | `sudo /usr/local/bin/backup-db.sh` |
| Listar backups | `ls -lth /var/backups/postgresql/lacaleta/` |
| Restaurar último | `sudo /usr/local/bin/restore-db.sh --latest` |
| Ver logs | `sudo tail -f /var/log/postgresql-backups/backup.log` |
| Editar cron | `sudo crontab -e` |
| Ver espacio usado | `du -sh /var/backups/postgresql/lacaleta/` |
| Descargar backup | `scp root@72.61.103.248:/var/backups/postgresql/lacaleta/backup.sql.gz ~/` |

---

## 📝 Notas Importantes

1. **Espacio en disco**: Asegurar al menos 5-10 GB libres
2. **Retención**: Por defecto 7 días, ajustar según necesidad
3. **Testing**: Probar restauración mensualmente
4. **Seguridad**: Los backups contienen datos sensibles, proteger adecuadamente
5. **Monitoreo**: Configurar alertas para backups fallidos

---

## 📄 Licencia

MIT License - Ver archivo LICENSE en la raíz del proyecto.

---

**Última actualización:** 2026-01-04
**Versión:** 1.0.0
**Autor:** MindLoop IA

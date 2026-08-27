#!/bin/sh
# ============================================================
# 生产 MySQL 备份：凭据来源与 compose 一致，读 server/.env.production，
# 宿主机 docker exec 直接 mysqldump 单库 gzip 写 ./backups/
# crontab 示例（每日 04:17）：
#   17 4 * * * cd /path/to/wallpaper && sh scripts/backup-mysql.sh >> backups/backup.log 2>&1
# ============================================================
set -eu

cd "$(dirname "$0")/.."

ENV_FILE=server/.env.production
[ -f "$ENV_FILE" ] || { echo "缺少 $ENV_FILE"; exit 1; }

# 只读生产 env；值可能为空则下方显式校验
read_env_var() {
  grep -E "^$1=" "$ENV_FILE" | tail -1 | cut -d= -f2-
}

MYSQL_ROOT_PASSWORD=$(read_env_var MYSQL_ROOT_PASSWORD)
DB_DATABASE=$(read_env_var DB_DATABASE)
DB_HOST_PORT=$(read_env_var DB_HOST_PORT)
DB_DATABASE=${DB_DATABASE:-wallpaper_site}

[ -n "$MYSQL_ROOT_PASSWORD" ] || { echo "MYSQL_ROOT_PASSWORD 未配置"; exit 1; }

CONTAINER=$(docker compose --env-file "$ENV_FILE" ps -q mysql)
[ -n "$CONTAINER" ] || { echo "mysql 容器未运行，请先 pnpm deploy"; exit 1; }

mkdir -p backups
umask 077 # 备份含全站数据，文件权限仅属主可读写

OUT="backups/$(date +%F)_${DB_DATABASE}.sql.gz"
TMP="${OUT}.part"
trap 'rm -f "$TMP"' EXIT

# mysqldump：-x 锁全部表保证一致性，-e 扩展 INSERT 缩小体积；
# gzip 在宿主机侧执行，产物不占容器磁盘
docker exec -e MYSQL_PWD="$MYSQL_ROOT_PASSWORD" -e DB="$DB_DATABASE" "$CONTAINER" \
  sh -c 'exec mysqldump -uroot -x -e "$DB"' | gzip > "$TMP"

# 空产物视为失败（管道里 mysqldump 的退出码无法直接透传）
[ -s "$TMP" ] || { echo "mysqldump 输出为空，备份失败"; exit 1; }

mv "$TMP" "$OUT"
echo "备份完成: $OUT (mysql 端口映射 ${DB_HOST_PORT:-3306})"

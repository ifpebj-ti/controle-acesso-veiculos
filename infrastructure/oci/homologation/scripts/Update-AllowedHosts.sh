#!/usr/bin/env bash

set -Eeuo pipefail

usage() {
  cat <<'EOF'
Usage:
  Update-AllowedHosts.sh \
    --deployment-directory /opt/controle-acesso-veiculos/infrastructure/docker \
    --hostname dat.example.test

Run this script only as an authorized operator on the application host. It
updates ALLOWED_HOSTS, validates the production Compose model and recreates only
the backend. The previous file is restored automatically if validation or the
backend replacement fails.
EOF
}

deployment_directory=''
hostname=''

while (($# > 0)); do
  case "$1" in
    --deployment-directory)
      deployment_directory="${2:-}"
      shift 2
      ;;
    --hostname)
      hostname="${2:-}"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ -z "$deployment_directory" || -z "$hostname" ]]; then
  usage >&2
  exit 2
fi

if [[ "$deployment_directory" != /* ]]; then
  echo 'The deployment directory must be an absolute path.' >&2
  exit 2
fi

if [[
  ! "$hostname" =~ ^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$
]]; then
  echo 'The hostname must be a lowercase DNS name without a scheme, path, port or wildcard.' >&2
  exit 2
fi

for command_name in awk cat cp docker grep mktemp rm; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Required command was not found: $command_name" >&2
    exit 1
  fi
done

environment_file="$deployment_directory/.env.production"
compose_file="$deployment_directory/docker-compose.production.yml"

if [[ ! -f "$environment_file" || -L "$environment_file" ]]; then
  echo 'The protected production environment file is missing or is a symbolic link.' >&2
  exit 1
fi

if [[ ! -f "$compose_file" || -L "$compose_file" ]]; then
  echo 'The production Compose file is missing or is a symbolic link.' >&2
  exit 1
fi

allowed_hosts_count="$(grep -c '^ALLOWED_HOSTS=' "$environment_file" || true)"
if [[ "$allowed_hosts_count" != 1 ]]; then
  echo 'The production environment must contain exactly one ALLOWED_HOSTS entry.' >&2
  exit 1
fi

umask 077
backup_file="$(mktemp "$deployment_directory/.env.production.rollback.XXXXXX")"
replacement_file="$(mktemp "$deployment_directory/.env.production.replacement.XXXXXX")"
rollback_required=true

cleanup() {
  local exit_code=$?
  set +e

  if [[ "$rollback_required" == true && -f "$backup_file" ]]; then
    cp --preserve=mode,ownership,timestamps -- "$backup_file" "$environment_file"
    docker compose \
      --env-file "$environment_file" \
      --file "$compose_file" \
      up --detach --no-deps --force-recreate --wait backend >/dev/null 2>&1 ||
      echo 'Warning: configuration was restored, but backend rollback requires operator attention.' >&2
  fi

  rm -f -- "$backup_file" "$replacement_file"
  exit "$exit_code"
}
trap cleanup EXIT

cp --preserve=mode,ownership,timestamps -- "$environment_file" "$backup_file"
awk -v replacement="ALLOWED_HOSTS=$hostname;localhost" '
  /^ALLOWED_HOSTS=/ { print replacement; next }
  { print }
' "$environment_file" >"$replacement_file"
cat -- "$replacement_file" >"$environment_file"

docker compose \
  --env-file "$environment_file" \
  --file "$compose_file" \
  config --quiet

docker compose \
  --env-file "$environment_file" \
  --file "$compose_file" \
  up --detach --no-deps --force-recreate --wait backend

rollback_required=false
echo 'AllowedHosts was updated and the backend replacement completed successfully.'
echo 'Validate the public readiness, login and session refresh before closing the change.'

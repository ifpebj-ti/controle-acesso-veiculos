#!/usr/bin/env bash

set -Eeuo pipefail

script_directory="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
subject="$script_directory/../Update-AllowedHosts.sh"
test_root="$(mktemp -d)"
trap 'rm -rf -- "$test_root"' EXIT

create_fixture() {
  local fixture="$1"
  mkdir -p -- "$fixture/bin" "$fixture/deployment" "$fixture/config"
  cat >"$fixture/config/.env.production" <<'EOF'
DEPLOYMENT_VERSION=0.4.0
ALLOWED_HOSTS=old.example.test;localhost
DATABASE_PASSWORD_FILE=/run/secrets/postgres_password
EOF
  printf 'services: {}\n' >"$fixture/deployment/docker-compose.production.yml"
  cat >"$fixture/bin/docker" <<'EOF'
#!/usr/bin/env bash
set -Eeuo pipefail
printf '%s\n' "$*" >>"$DOCKER_CALL_LOG"
if [[
  "${FAIL_BACKEND_REPLACEMENT:-false}" == true &&
  "$*" == *' up '* &&
  ! -f "$DOCKER_FAILURE_MARKER"
]]; then
  touch "$DOCKER_FAILURE_MARKER"
  exit 1
fi
EOF
  chmod +x "$fixture/bin/docker"
}

success_fixture="$test_root/success"
create_fixture "$success_fixture"
export DOCKER_CALL_LOG="$success_fixture/docker.log"
export DOCKER_FAILURE_MARKER="$success_fixture/docker.failure"
PATH="$success_fixture/bin:$PATH" "$subject" \
  --deployment-directory "$success_fixture/deployment" \
  --environment-file "$success_fixture/config/.env.production" \
  --hostname 'dat.example.test'
grep -qx 'ALLOWED_HOSTS=dat.example.test;localhost' "$success_fixture/config/.env.production"
grep -q 'config --quiet' "$DOCKER_CALL_LOG"
grep -q 'up --detach --no-deps --force-recreate --wait backend' "$DOCKER_CALL_LOG"

rollback_fixture="$test_root/rollback"
create_fixture "$rollback_fixture"
export DOCKER_CALL_LOG="$rollback_fixture/docker.log"
export DOCKER_FAILURE_MARKER="$rollback_fixture/docker.failure"
export FAIL_BACKEND_REPLACEMENT=true
if PATH="$rollback_fixture/bin:$PATH" "$subject" \
  --deployment-directory "$rollback_fixture/deployment" \
  --environment-file "$rollback_fixture/config/.env.production" \
  --hostname 'dat.example.test'; then
  echo 'The script accepted a failed backend replacement.' >&2
  exit 1
fi
unset FAIL_BACKEND_REPLACEMENT
grep -qx 'ALLOWED_HOSTS=old.example.test;localhost' "$rollback_fixture/config/.env.production"

invalid_fixture="$test_root/invalid"
create_fixture "$invalid_fixture"
export DOCKER_CALL_LOG="$invalid_fixture/docker.log"
export DOCKER_FAILURE_MARKER="$invalid_fixture/docker.failure"
if PATH="$invalid_fixture/bin:$PATH" "$subject" \
  --deployment-directory "$invalid_fixture/deployment" \
  --environment-file "$invalid_fixture/config/.env.production" \
  --hostname '*.example.test'; then
  echo 'The script accepted a wildcard hostname.' >&2
  exit 1
fi

printf 'ALLOWED_HOSTS=duplicate.example.test;localhost\n' >>"$invalid_fixture/config/.env.production"
if PATH="$invalid_fixture/bin:$PATH" "$subject" \
  --deployment-directory "$invalid_fixture/deployment" \
  --environment-file "$invalid_fixture/config/.env.production" \
  --hostname 'dat.example.test'; then
  echo 'The script accepted duplicate ALLOWED_HOSTS entries.' >&2
  exit 1
fi

if find "$test_root" -type f -name '.*.production.*.*' -print -quit | grep -q .; then
  echo 'A temporary environment copy was not removed.' >&2
  exit 1
fi

echo 'AllowedHosts maintenance tests passed.'

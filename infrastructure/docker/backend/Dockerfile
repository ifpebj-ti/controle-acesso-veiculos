# Keep the shipped runtime explicit; a cached floating tag can retain a vulnerable patch.
FROM mcr.microsoft.com/dotnet/aspnet:10.0.14 AS base
WORKDIR /app
EXPOSE 8080

# Protect the first APT download too: the inherited client may predate USN-8996-1.
# Keep archive signature/TLS verification enabled and upgrade only affected packages.
RUN sed -i 's|http://|https://|g' /etc/apt/sources.list.d/ubuntu.sources \
    && for attempt in 1 2 3; do \
        echo "Refreshing APT indexes (attempt ${attempt}/3)."; \
        if apt-get -o Acquire::Retries=0 -o Acquire::https::Timeout=15 --error-on=any update; then \
            break; \
        fi; \
        if [ "$attempt" -eq 3 ]; then \
            echo "APT index refresh failed after three attempts; refusing package installation." >&2; \
            exit 1; \
        fi; \
        sleep "$attempt"; \
    done \
    && apt-get -o Acquire::Retries=0 install --only-upgrade --no-install-recommends -y \
        apt \
        libapt-pkg6.0t64 \
        libssl3t64 \
        openssl \
    && dpkg --compare-versions "$(dpkg-query -W -f='${Version}' apt)" ge 2.8.4ubuntu0.1 \
    && dpkg --compare-versions "$(dpkg-query -W -f='${Version}' libapt-pkg6.0t64)" ge 2.8.4ubuntu0.1 \
    && rm -rf /var/lib/apt/lists/*

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copiar os projetos preservando a estrutura usada pelos ProjectReference.
COPY ["src/backend/ControleAcessoVeiculos.API/ControleAcessoVeiculos.API.csproj", "src/backend/ControleAcessoVeiculos.API/"]
COPY ["src/backend/ControleAcessoVeiculos.Application/ControleAcessoVeiculos.Application.csproj", "src/backend/ControleAcessoVeiculos.Application/"]
COPY ["src/backend/ControleAcessoVeiculos.Domain/ControleAcessoVeiculos.Domain.csproj", "src/backend/ControleAcessoVeiculos.Domain/"]
COPY ["src/backend/ControleAcessoVeiculos.Infrastructure/ControleAcessoVeiculos.Infrastructure.csproj", "src/backend/ControleAcessoVeiculos.Infrastructure/"]

# Restore
RUN dotnet restore "src/backend/ControleAcessoVeiculos.API/ControleAcessoVeiculos.API.csproj"

# Copiar o código-fonte para a mesma árvore dos projetos restaurados.
COPY . .

# Build
WORKDIR "/src/src/backend/ControleAcessoVeiculos.API"
RUN dotnet build "ControleAcessoVeiculos.API.csproj" -c Release -o /app/build

# Publish
FROM build AS publish
RUN dotnet publish "ControleAcessoVeiculos.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
RUN mkdir -p /var/lib/controle-acesso-veiculos/data-protection \
    && chown -R "$APP_UID:$APP_UID" /var/lib/controle-acesso-veiculos
COPY --from=publish /app/publish .
USER $APP_UID
ENTRYPOINT ["dotnet", "ControleAcessoVeiculos.API.dll"]

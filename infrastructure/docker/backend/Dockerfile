FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["src/backend/ControleAcessoVeiculos.API/ControleAcessoVeiculos.API.csproj", "ControleAcessoVeiculos.API/"]
COPY ["src/backend/ControleAcessoVeiculos.Application/ControleAcessoVeiculos.Application.csproj", "ControleAcessoVeiculos.Application/"]
COPY ["src/backend/ControleAcessoVeiculos.Domain/ControleAcessoVeiculos.Domain.csproj", "ControleAcessoVeiculos.Domain/"]
COPY ["src/backend/ControleAcessoVeiculos.Infrastructure/ControleAcessoVeiculos.Infrastructure.csproj", "ControleAcessoVeiculos.Infrastructure/"]
RUN dotnet restore "ControleAcessoVeiculos.API/ControleAcessoVeiculos.API.csproj"
COPY . .
WORKDIR "/src/ControleAcessoVeiculos.API"
RUN dotnet build "ControleAcessoVeiculos.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "ControleAcessoVeiculos.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ControleAcessoVeiculos.API.dll"]
using System.Data;
using System.Text.Json;
using ControleAcessoVeiculos.Application.CampusDrivers;
using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Enums;
using ControleAcessoVeiculos.Domain.Policies;
using ControleAcessoVeiculos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace ControleAcessoVeiculos.Infrastructure.CampusDrivers;

public sealed class CampusDriverStore(ControleAcessoVeiculosDbContext db) : ICampusDriverStore
{
    public async Task<CampusDriverResult> RegisterAsync(RegisterCampusDriverCommand command,
        int actorId, DateTime nowUtc, DateOnly today, CancellationToken ct)
    {
        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        try
        {
            var name = Escape(command.Name);
            if (!command.ConfirmPossibleDuplicate && await db.Pessoas.AnyAsync(p =>
                p.CadastroCampusConferidoEm != null && p.DataNascimento == command.BirthDate &&
                EF.Functions.ILike(p.Nome, name, "\\"), ct))
                return Conflict("possibleDuplicate", "Há um cadastro possivelmente correspondente. Confira a pessoa existente; homônimos não são mesclados automaticamente.");
            var vehicle = await GetOrCreateVehicleAsync(command.Plate, command.VehicleType, ct);
            if (vehicle is null) return Conflict("vehicle", "Veículo indisponível, institucional ou com tipo diferente. Confira o cadastro existente.");
            var person = new Pessoa(command.Name);
            person.CadastrarCondutorCampus(command.Affiliation, command.BirthDate, actorId, nowUtc, today);
            db.Pessoas.Add(person);
            await db.SaveChangesAsync(ct);
            db.PessoasVeiculos.Add(new PessoaVeiculo(person.Id, vehicle.Id, "Condutor", today));
            Audit(person, actorId, nowUtc, "register", vehicle.Id);
            await db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            return Success(person, vehicle);
        }
        catch (Exception ex) when (IsConcurrencyConflict(ex))
        {
            await tx.RollbackAsync(ct);
            return Conflict("registration", "O cadastro mudou durante a operação. Confira o resultado antes de tentar novamente.");
        }
    }

    public async Task<CampusDriverResult> AddVehicleAsync(int personId,
        AddCampusDriverVehicleCommand command, int actorId, DateTime nowUtc,
        DateOnly today, CancellationToken ct)
    {
        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        try
        {
            var person = await db.Pessoas.FromSqlInterpolated(
                $"SELECT * FROM dbo.pessoas WHERE id = {personId} FOR UPDATE").SingleOrDefaultAsync(ct);
            if (person is null || !person.Ativo || !person.CadastroCampusAtivo ||
                !person.DataNascimento.HasValue || !CampusDriverPolicy.IsAdult(person.DataNascimento.Value, today))
                return new(CampusDriverStatus.NotFound, null, new Dictionary<string, string[]>());
            var vehicle = await GetOrCreateVehicleAsync(command.Plate, command.VehicleType, ct);
            if (vehicle is null) return Conflict("vehicle", "Veículo indisponível, institucional ou com tipo diferente.");
            if (await db.PessoasVeiculos.AnyAsync(x => x.PessoaId == personId &&
                x.VeiculoId == vehicle.Id && x.TipoRelacao == "Condutor", ct))
                return Conflict("vehicle", "O vínculo pessoa–veículo já existe; confira seu estado.");
            db.PessoasVeiculos.Add(new PessoaVeiculo(personId, vehicle.Id, "Condutor", today));
            Audit(person, actorId, nowUtc, "associate-vehicle", vehicle.Id);
            await db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            return Success(person, vehicle);
        }
        catch (Exception ex) when (IsConcurrencyConflict(ex))
        {
            await tx.RollbackAsync(ct);
            return Conflict("registration", "Conflito de cadastro. Confira o resultado antes de nova tentativa.");
        }
    }

    public async Task<bool> DeactivateAsync(int personId, int actorId, DateTime nowUtc, CancellationToken ct)
    {
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var person = await db.Pessoas.FromSqlInterpolated(
            $"SELECT * FROM dbo.pessoas WHERE id = {personId} FOR UPDATE").SingleOrDefaultAsync(ct);
        if (person is null || !person.CadastroCampusAtivo) return false;
        person.DesativarCadastroCampus(nowUtc);
        Audit(person, actorId, nowUtc, "deactivate", null);
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return true;
    }

    public async Task<CampusDriverPage> SearchAsync(string? query, int page, int pageSize,
        bool includeInactive, CancellationToken ct)
    {
        var rows = from rel in db.PessoasVeiculos.AsNoTracking()
                   join p in db.Pessoas.AsNoTracking() on rel.PessoaId equals p.Id
                   join v in db.Veiculos.AsNoTracking() on rel.VeiculoId equals v.Id
                   where p.CadastroCampusConferidoEm != null && rel.TipoRelacao == "Condutor" &&
                       !v.EhInstitucional && (includeInactive || (p.Ativo && p.CadastroCampusAtivo && rel.Ativo && v.Ativo))
                   select new { P = p, V = v, R = rel };
        if (!string.IsNullOrWhiteSpace(query))
        {
            var pattern = "%" + Escape(query) + "%";
            rows = rows.Where(x => EF.Functions.ILike(x.P.Nome, pattern, "\\") ||
                EF.Functions.ILike(x.V.Placa!, pattern, "\\"));
        }
        var count = await rows.CountAsync(ct);
        var items = await rows.OrderBy(x => x.P.Nome).ThenBy(x => x.P.Id).ThenBy(x => x.V.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => new CampusDriverRecord(x.P.Id, x.V.Id, x.P.Nome, x.P.TipoVinculo!,
                x.V.Placa!, x.V.Tipo, x.P.Ativo && x.P.CadastroCampusAtivo && x.R.Ativo && x.V.Ativo,
                x.P.CadastroCampusConferidoEm!.Value)).ToListAsync(ct);
        return new(items, count, page, pageSize);
    }

    public async Task<IReadOnlyList<EntrySuggestion>> SuggestAsync(string query, string platePrefix,
        int actorId, EntrySuggestionWindow window, CancellationToken ct)
    {
        var pattern = "%" + Escape(query) + "%";
        var visits = db.RegistrosAcesso.AsNoTracking().Where(x => x.CriadoPorId == actorId &&
            x.DataHoraEntrada >= window.FromUtc && x.DataHoraEntrada < window.ToExclusiveUtc);
        var rows = from rel in db.PessoasVeiculos.AsNoTracking()
                   join p in db.Pessoas.AsNoTracking() on rel.PessoaId equals p.Id
                   join v in db.Veiculos.AsNoTracking() on rel.VeiculoId equals v.Id
                   where p.Ativo && v.Ativo && !v.EhInstitucional && v.Placa != null &&
                       rel.Ativo && rel.TipoRelacao == "Condutor" &&
                       (!rel.DataInicio.HasValue || rel.DataInicio <= window.Today) &&
                       (!rel.DataFim.HasValue || rel.DataFim >= window.Today) &&
                       ((p.CadastroCampusAtivo && p.CadastroCampusConferidoEm != null &&
                         p.DataNascimento.HasValue && p.DataNascimento <= window.AdultBirthDateCutoff) ||
                        (p.CadastroCampusConferidoEm == null && visits.Any(x => x.PessoaId == p.Id && x.VeiculoId == v.Id))) &&
                       ((platePrefix != "" && v.Placa.StartsWith(platePrefix)) || EF.Functions.ILike(p.Nome, pattern, "\\"))
                   orderby (v.Placa == platePrefix) descending, p.CadastroCampusAtivo descending,
                       v.Placa, p.Nome, rel.Id
                   select new EntrySuggestion(v.Id, p.Id, v.Placa!, p.Nome, v.Tipo,
                       p.CadastroCampusAtivo ? "CampusRegistration" : "SameDayVisit",
                       p.CadastroCampusAtivo ? p.TipoVinculo : null,
                       visits.Where(x => x.PessoaId == p.Id && x.VeiculoId == v.Id)
                           .OrderByDescending(x => x.DataHoraEntrada).ThenByDescending(x => x.Id)
                           .Select(x => x.Objetivo).FirstOrDefault(),
                       db.RegistrosAcesso.Any(x => x.VeiculoId == v.Id && x.DataHoraSaida == null),
                       p.CadastroCampusAtivo ? null : window.ToExclusiveUtc);
        return await rows.Take(10).ToListAsync(ct);
    }

    private async Task<Veiculo?> GetOrCreateVehicleAsync(string plate, string type, CancellationToken ct)
    {
        var vehicle = await db.Veiculos.SingleOrDefaultAsync(v => v.Placa == plate, ct);
        if (vehicle is not null) return vehicle.Ativo && !vehicle.EhInstitucional &&
            string.Equals(vehicle.Tipo, type, StringComparison.OrdinalIgnoreCase) ? vehicle : null;
        vehicle = new Veiculo(plate, type, null, false);
        db.Veiculos.Add(vehicle);
        await db.SaveChangesAsync(ct);
        return vehicle;
    }

    private void Audit(Pessoa person, int actorId, DateTime nowUtc, string operation, int? vehicleId) =>
        db.Auditorias.Add(new Auditoria(nowUtc, operation == "register" ? TipoAcaoAuditoria.Inclusao : TipoAcaoAuditoria.Alteracao, nameof(Pessoa),
            person.Id, actorId, dadosNovos: JsonSerializer.Serialize(new
            {
                source = "campus-driver-registry",
                operation,
                vehicleId,
                active = person.CadastroCampusAtivo
            }),
            detalhes: "Campus driver registry changed; birth date intentionally omitted from audit payload."));

    private static bool IsConcurrencyConflict(Exception ex) =>
        (ex is DbUpdateException update && update.InnerException is PostgresException p &&
            p.SqlState is PostgresErrorCodes.UniqueViolation or PostgresErrorCodes.SerializationFailure) ||
        (ex is PostgresException direct && direct.SqlState == PostgresErrorCodes.SerializationFailure);
    private static string Escape(string value) => value.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");
    private static CampusDriverResult Success(Pessoa p, Veiculo v) => new(CampusDriverStatus.Success,
        new(p.Id, v.Id, p.Nome, p.TipoVinculo!, v.Placa!, v.Tipo, p.CadastroCampusAtivo,
            p.CadastroCampusConferidoEm!.Value), new Dictionary<string, string[]>());
    private static CampusDriverResult Conflict(string field, string message) =>
        new(CampusDriverStatus.Conflict, null, new Dictionary<string, string[]> { [field] = [message] });
}

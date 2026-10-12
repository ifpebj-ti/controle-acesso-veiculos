using ControleAcessoVeiculos.Application.OperationalSummaries;
using ControleAcessoVeiculos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ControleAcessoVeiculos.Infrastructure.OperationalSummaries;

public sealed class OperationalSummaryStore(
    ControleAcessoVeiculosDbContext dbContext) : IOperationalSummaryStore
{
    public async Task<OperationalSummaryTotals> GetAsync(
        OperationalSummaryCriteria criteria,
        CancellationToken cancellationToken)
    {
        var generalAccess = await dbContext.RegistrosAcesso
            .AsNoTracking()
            .GroupBy(_ => 1)
            .Select(records => new GeneralAccessDailyTotals(
                records.Count(record =>
                    record.DataHoraEntrada >= criteria.PeriodStartUtc &&
                    record.DataHoraEntrada < criteria.PeriodEndUtcExclusive),
                records.Count(record =>
                    record.DataHoraSaida >= criteria.PeriodStartUtc &&
                    record.DataHoraSaida < criteria.PeriodEndUtcExclusive),
                records.Count(record =>
                    record.DataHoraRegularizacao >= criteria.PeriodStartUtc &&
                    record.DataHoraRegularizacao < criteria.PeriodEndUtcExclusive),
                records.Count(record =>
                    record.DataHoraEntrada < criteria.PeriodStartUtc &&
                    ((record.DataHoraSaida ?? record.DataHoraRegularizacao) == null ||
                        (record.DataHoraSaida ?? record.DataHoraRegularizacao) >
                            criteria.PeriodStartUtc)),
                records.Count(record =>
                    record.DataHoraEntrada < criteria.PeriodEndUtcExclusive &&
                    ((record.DataHoraSaida ?? record.DataHoraRegularizacao) == null ||
                        (record.DataHoraSaida ?? record.DataHoraRegularizacao) >
                            criteria.PeriodEndUtcExclusive))))
            .SingleOrDefaultAsync(cancellationToken) ?? new(0, 0, 0, 0, 0);

        var institutionalUsages = await dbContext.UsosVeiculosInstitucionais
            .AsNoTracking()
            .GroupBy(_ => 1)
            .Select(usages => new InstitutionalUsageDailyTotals(
                usages.Count(usage =>
                    usage.DataHoraSaida >= criteria.PeriodStartUtc &&
                    usage.DataHoraSaida < criteria.PeriodEndUtcExclusive),
                usages.Count(usage =>
                    usage.DataHoraEntrada >= criteria.PeriodStartUtc &&
                    usage.DataHoraEntrada < criteria.PeriodEndUtcExclusive),
                usages.Count(usage =>
                    usage.DataHoraSaida < criteria.PeriodStartUtc &&
                    (usage.DataHoraEntrada == null ||
                        usage.DataHoraEntrada > criteria.PeriodStartUtc)),
                usages.Count(usage =>
                    usage.DataHoraSaida < criteria.PeriodEndUtcExclusive &&
                    (usage.DataHoraEntrada == null ||
                        usage.DataHoraEntrada > criteria.PeriodEndUtcExclusive))))
            .SingleOrDefaultAsync(cancellationToken) ?? new(0, 0, 0, 0);

        var linkedEntries =
            from accessRecord in dbContext.RegistrosAcesso.AsNoTracking()
            join vehicleRule in dbContext.AutorizacoesVeiculosEventos.AsNoTracking()
                on accessRecord.AutorizacaoVeiculoEventoId equals (int?)vehicleRule.Id
            where accessRecord.DataHoraEntrada >= criteria.PeriodStartUtc &&
                accessRecord.DataHoraEntrada < criteria.PeriodEndUtcExclusive
            select new { vehicleRule.EventoAcessoId };

        var eventAccess = new EventAccessDailyTotals(
            await linkedEntries.CountAsync(cancellationToken),
            await linkedEntries
                .Select(entry => entry.EventoAcessoId)
                .Distinct()
                .CountAsync(cancellationToken));

        var selectedDayEntries = dbContext.RegistrosAcesso
            .AsNoTracking()
            .Where(record =>
                record.DataHoraEntrada >= criteria.PeriodStartUtc &&
                record.DataHoraEntrada < criteria.PeriodEndUtcExclusive);

        var trendEntryTimesUtc = await dbContext.RegistrosAcesso
            .AsNoTracking()
            .Where(record =>
                record.DataHoraEntrada >= criteria.TrendStartUtc &&
                record.DataHoraEntrada < criteria.PeriodEndUtcExclusive)
            .Select(record => record.DataHoraEntrada)
            .ToListAsync(cancellationToken);
        var trendExitTimesUtc = await dbContext.RegistrosAcesso
            .AsNoTracking()
            .Where(record =>
                record.DataHoraSaida >= criteria.TrendStartUtc &&
                record.DataHoraSaida < criteria.PeriodEndUtcExclusive)
            .Select(record => record.DataHoraSaida!.Value)
            .ToListAsync(cancellationToken);
        var selectedDayEntryTimesUtc = trendEntryTimesUtc
            .Where(timestamp =>
                timestamp >= criteria.PeriodStartUtc &&
                timestamp < criteria.PeriodEndUtcExclusive)
            .ToArray();
        var selectedDayExitTimesUtc = trendExitTimesUtc
            .Where(timestamp =>
                timestamp >= criteria.PeriodStartUtc &&
                timestamp < criteria.PeriodEndUtcExclusive)
            .ToArray();

        var accessCategories = await (
            from record in selectedDayEntries
            join category in dbContext.CategoriasAcesso.AsNoTracking()
                on record.CategoriaAcessoId equals category.Id
            group record by category.Nome into categoryGroup
            orderby categoryGroup.Count() descending, categoryGroup.Key
            select new NamedOperationalCount(
                categoryGroup.Key,
                categoryGroup.Count()))
            .ToListAsync(cancellationToken);

        var vehicleTypes = await (
            from record in selectedDayEntries
            join vehicle in dbContext.Veiculos.AsNoTracking()
                on record.VeiculoId equals vehicle.Id
            let vehicleType = vehicle.Tipo == null || vehicle.Tipo == string.Empty
                ? "Não informado"
                : vehicle.Tipo
            group record by vehicleType into vehicleTypeGroup
            orderby vehicleTypeGroup.Count() descending, vehicleTypeGroup.Key
            select new NamedOperationalCount(
                vehicleTypeGroup.Key,
                vehicleTypeGroup.Count()))
            .ToListAsync(cancellationToken);

        var aggregates = new OperationalAggregateSource(
            selectedDayEntryTimesUtc,
            selectedDayExitTimesUtc,
            trendEntryTimesUtc,
            trendExitTimesUtc,
            accessCategories,
            vehicleTypes);

        return new(
            generalAccess,
            institutionalUsages,
            eventAccess,
            aggregates);
    }
}

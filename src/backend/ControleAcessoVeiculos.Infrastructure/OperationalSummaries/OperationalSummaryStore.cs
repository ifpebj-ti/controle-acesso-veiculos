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
                    record.DataHoraEntrada < criteria.PeriodStartUtc &&
                    (record.DataHoraSaida == null ||
                        record.DataHoraSaida > criteria.PeriodStartUtc)),
                records.Count(record =>
                    record.DataHoraEntrada < criteria.PeriodEndUtcExclusive &&
                    (record.DataHoraSaida == null ||
                        record.DataHoraSaida > criteria.PeriodEndUtcExclusive))))
            .SingleOrDefaultAsync(cancellationToken) ?? new(0, 0, 0, 0);

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

        return new(generalAccess, institutionalUsages, eventAccess);
    }
}

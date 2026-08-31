namespace ControleAcessoVeiculos.Application.OperationalSummaries;

public interface IOperationalSummaryStore
{
    Task<OperationalSummaryTotals> GetAsync(
        OperationalSummaryCriteria criteria,
        CancellationToken cancellationToken);
}

namespace ControleAcessoVeiculos.Application.Auditing;

public interface IAuditTrailStore
{
    Task<PagedAuditTrailResult> SearchAsync(
        AuditTrailSearchCriteria criteria,
        CancellationToken cancellationToken);
}

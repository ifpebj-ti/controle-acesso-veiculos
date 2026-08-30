namespace ControleAcessoVeiculos.Application.EventAuthorizations;

public interface IEventAuthorizationStore
{
    Task<EventAuthorizationStoreResult> TryCreateAsync(
        EventAuthorizationData data,
        int actorUserId,
        DateTime occurredAtUtc,
        CancellationToken cancellationToken);

    Task<PagedEventAuthorizations> SearchAsync(
        EventAuthorizationSearchCriteria criteria,
        CancellationToken cancellationToken);

    Task<EventAuthorizationStoreResult> TryUpdateAsync(
        int eventId,
        EventAuthorizationData data,
        int actorUserId,
        DateTime occurredAtUtc,
        CancellationToken cancellationToken);

    Task<EventAuthorizationStoreStatus> TryCancelAsync(
        int eventId,
        int actorUserId,
        DateTime occurredAtUtc,
        CancellationToken cancellationToken);
}

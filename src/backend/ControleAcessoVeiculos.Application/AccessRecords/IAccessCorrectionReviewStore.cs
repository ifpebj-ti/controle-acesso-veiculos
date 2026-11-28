using ControleAcessoVeiculos.Domain.Enums;

namespace ControleAcessoVeiculos.Application.AccessRecords;

public interface IAccessCorrectionReviewStore
{
    Task<AccessCorrectionOperationResult> SubmitAsync(
        int accessRecordId, SubmitAccessCorrectionCommand command, int actorId,
        DateTime nowUtc, CancellationToken cancellationToken);

    Task<AccessCorrectionOperationResult> DecideAsync(
        int requestId, StatusSolicitacaoCorrecao decision, string reason,
        int actorId, DateTime nowUtc, CancellationToken cancellationToken);

    Task<AccessCorrectionRecord?> GetAsync(
        int requestId, int actorId, bool canReview, CancellationToken cancellationToken);

    Task<AccessCorrectionRecord?> GetByKeyAsync(
        Guid requestKey, int actorId, CancellationToken cancellationToken);

    Task<AccessCorrectionPage> SearchAsync(
        int actorId, bool canReview, StatusSolicitacaoCorrecao? status,
        int page, int pageSize, CancellationToken cancellationToken);
}

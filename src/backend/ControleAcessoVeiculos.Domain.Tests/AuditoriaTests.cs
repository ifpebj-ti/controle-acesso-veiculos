using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Enums;

namespace ControleAcessoVeiculos.Domain.Tests;

public sealed class AuditoriaTests
{
    [Fact]
    public void SystemAuditAllowsMissingUserActor()
    {
        var audit = new Auditoria(
            DateTime.UtcNow,
            TipoAcaoAuditoria.Inclusao,
            nameof(Usuario),
            registroId: 1,
            usuarioId: null);

        Assert.Null(audit.UsuarioId);
    }

    [Fact]
    public void AuditRejectsInvalidUserActor()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new Auditoria(
            DateTime.UtcNow,
            TipoAcaoAuditoria.Inclusao,
            nameof(Usuario),
            registroId: 1,
            usuarioId: 0));
    }
}

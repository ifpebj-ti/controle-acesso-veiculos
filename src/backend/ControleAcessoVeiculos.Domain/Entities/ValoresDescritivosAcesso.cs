namespace ControleAcessoVeiculos.Domain.Entities;

public sealed record ValoresDescritivosAcesso
{
    public ValoresDescritivosAcesso(int categoriaAcessoId, string objetivo, string? observacao)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(categoriaAcessoId);
        ArgumentException.ThrowIfNullOrWhiteSpace(objetivo);

        objetivo = objetivo.Trim();
        observacao = string.IsNullOrWhiteSpace(observacao) ? null : observacao.Trim();
        if (objetivo.Length > 500 || observacao?.Length > 1000)
        {
            throw new ArgumentException("Os dados descritivos excedem os limites permitidos.");
        }

        CategoriaAcessoId = categoriaAcessoId;
        Objetivo = objetivo;
        Observacao = observacao;
    }

    public int CategoriaAcessoId { get; }
    public string Objetivo { get; }
    public string? Observacao { get; }
}

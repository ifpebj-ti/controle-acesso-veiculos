namespace ControleAcessoVeiculos.Domain.Entities;

public class EventoAcesso
{
    private EventoAcesso()
    {
    }

    public EventoAcesso(
        string nome,
        string responsavel,
        DateTime inicio,
        DateTime fim,
        string localArea,
        bool permitePernoite,
        string? observacao,
        int criadoPorId,
        DateTime dataCriacao)
    {
        Validar(nome, responsavel, inicio, fim, localArea, observacao);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(criadoPorId);

        if (dataCriacao == default)
        {
            throw new ArgumentOutOfRangeException(nameof(dataCriacao));
        }

        Nome = nome;
        Responsavel = responsavel;
        Inicio = inicio;
        Fim = fim;
        LocalArea = localArea;
        PermitePernoite = permitePernoite;
        Observacao = observacao;
        Ativo = true;
        CriadoPorId = criadoPorId;
        DataCriacao = dataCriacao;
    }

    public int Id { get; private set; }
    public string Nome { get; private set; } = null!;
    public string Responsavel { get; private set; } = null!;
    public DateTime Inicio { get; private set; }
    public DateTime Fim { get; private set; }
    public string LocalArea { get; private set; } = null!;
    public bool PermitePernoite { get; private set; }
    public string? Observacao { get; private set; }
    public bool Ativo { get; private set; }
    public int CriadoPorId { get; private set; }
    public int? AtualizadoPorId { get; private set; }
    public DateTime DataCriacao { get; private set; }
    public DateTime? DataAlteracao { get; private set; }

    public bool Atualizar(
        string nome,
        string responsavel,
        DateTime inicio,
        DateTime fim,
        string localArea,
        bool permitePernoite,
        string? observacao,
        int atualizadoPorId,
        DateTime dataAlteracao)
    {
        Validar(nome, responsavel, inicio, fim, localArea, observacao);
        ValidarAlteracao(atualizadoPorId, dataAlteracao);

        if (!Ativo)
        {
            throw new InvalidOperationException("O evento está cancelado.");
        }

        var alterado = Nome != nome ||
            Responsavel != responsavel ||
            Inicio != inicio ||
            Fim != fim ||
            LocalArea != localArea ||
            PermitePernoite != permitePernoite ||
            Observacao != observacao;

        if (!alterado)
        {
            return false;
        }

        Nome = nome;
        Responsavel = responsavel;
        Inicio = inicio;
        Fim = fim;
        LocalArea = localArea;
        PermitePernoite = permitePernoite;
        Observacao = observacao;
        RegistrarAlteracao(atualizadoPorId, dataAlteracao);

        return true;
    }

    public void RegistrarAlteracao(int atualizadoPorId, DateTime dataAlteracao)
    {
        ValidarAlteracao(atualizadoPorId, dataAlteracao);

        if (!Ativo)
        {
            throw new InvalidOperationException("O evento está cancelado.");
        }

        AtualizadoPorId = atualizadoPorId;
        DataAlteracao = dataAlteracao;
    }

    public void Cancelar(int atualizadoPorId, DateTime dataAlteracao)
    {
        ValidarAlteracao(atualizadoPorId, dataAlteracao);

        if (!Ativo)
        {
            throw new InvalidOperationException("O evento já está cancelado.");
        }

        Ativo = false;
        AtualizadoPorId = atualizadoPorId;
        DataAlteracao = dataAlteracao;
    }

    private static void Validar(
        string nome,
        string responsavel,
        DateTime inicio,
        DateTime fim,
        string localArea,
        string? observacao)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nome);
        ArgumentException.ThrowIfNullOrWhiteSpace(responsavel);
        ArgumentException.ThrowIfNullOrWhiteSpace(localArea);

        if (inicio == default || fim <= inicio)
        {
            throw new ArgumentOutOfRangeException(nameof(fim));
        }

        if (nome.Length > 200 || responsavel.Length > 200 || localArea.Length > 200)
        {
            throw new ArgumentOutOfRangeException(nameof(nome));
        }

        if (observacao?.Length > 1000)
        {
            throw new ArgumentOutOfRangeException(nameof(observacao));
        }
    }

    private void ValidarAlteracao(int atualizadoPorId, DateTime dataAlteracao)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(atualizadoPorId);

        if (dataAlteracao < DataCriacao)
        {
            throw new ArgumentOutOfRangeException(nameof(dataAlteracao));
        }
    }
}

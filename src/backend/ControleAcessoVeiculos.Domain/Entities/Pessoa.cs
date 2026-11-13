using ControleAcessoVeiculos.Domain.Policies;

namespace ControleAcessoVeiculos.Domain.Entities;

public class Pessoa
{
    private Pessoa()
    {
    }

    public Pessoa(
        string nome,
        string? documentoTipo = null,
        string? documentoNumero = null,
        string? tipoVinculo = null,
        string? email = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nome);

        if (string.IsNullOrWhiteSpace(documentoTipo) != string.IsNullOrWhiteSpace(documentoNumero))
        {
            throw new ArgumentException(
                "O tipo e o número do documento devem ser informados em conjunto.");
        }

        Nome = nome;
        DocumentoTipo = documentoTipo;
        DocumentoNumero = documentoNumero;
        TipoVinculo = tipoVinculo;
        Email = email;
        Ativo = true;
        DataCriacao = DateTime.UtcNow;
    }

    public void CadastrarCondutorCampus(string tipoVinculo, DateOnly nascimento,
        int conferidoPorId, DateTime conferidoEmUtc, DateOnly hoje)
    {
        var canonical = CampusDriverPolicy.NormalizeAffiliation(tipoVinculo);
        if (canonical is null || !CampusDriverPolicy.IsAdult(nascimento, hoje))
            throw new ArgumentException("Vínculo válido e idade mínima de 18 anos são necessários.");
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(conferidoPorId);
        TipoVinculo = canonical;
        DataNascimento = nascimento;
        CadastroCampusConferidoPorId = conferidoPorId;
        CadastroCampusConferidoEm = conferidoEmUtc;
        CadastroCampusAtivo = true;
    }

    public void DesativarCadastroCampus(DateTime alteradoEmUtc)
    {
        CadastroCampusAtivo = false;
        DataAlteracao = alteradoEmUtc;
    }

    public DateOnly? DataNascimento { get; private set; }
    public bool CadastroCampusAtivo { get; private set; }
    public int? CadastroCampusConferidoPorId { get; private set; }
    public DateTime? CadastroCampusConferidoEm { get; private set; }

    public int Id { get; private set; }
    public string Nome { get; private set; } = null!;
    public string? DocumentoTipo { get; private set; }
    public string? DocumentoNumero { get; private set; }
    public string? TipoVinculo { get; private set; }
    public string? Email { get; private set; }
    public bool Ativo { get; private set; }
    public DateTime DataCriacao { get; private set; }
    public DateTime? DataAlteracao { get; private set; }
}

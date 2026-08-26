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

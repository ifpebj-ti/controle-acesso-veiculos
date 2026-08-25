namespace ControleAcessoVeiculos.Domain.Entities;

public class Veiculo
{
    private Veiculo()
    {
    }

    public Veiculo(string placa, string marca, string modelo, string cor, int ano, int pessoaId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(placa);
        ArgumentException.ThrowIfNullOrWhiteSpace(marca);
        ArgumentException.ThrowIfNullOrWhiteSpace(modelo);
        ArgumentException.ThrowIfNullOrWhiteSpace(cor);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(ano);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(pessoaId);

        Placa = placa;
        Marca = marca;
        Modelo = modelo;
        Cor = cor;
        Ano = ano;
        PessoaId = pessoaId;
        Ativo = true;
        DataCriacao = DateTime.UtcNow;
    }

    public int Id { get; private set; }
    public string Placa { get; private set; } = null!;
    public string Marca { get; private set; } = null!;
    public string Modelo { get; private set; } = null!;
    public string Cor { get; private set; } = null!;
    public int Ano { get; private set; }
    public int PessoaId { get; private set; }
    public bool Ativo { get; private set; }
    public DateTime DataCriacao { get; private set; }
    public DateTime? DataAlteracao { get; private set; }
}

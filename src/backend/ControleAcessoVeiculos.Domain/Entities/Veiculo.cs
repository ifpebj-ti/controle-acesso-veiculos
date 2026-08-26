namespace ControleAcessoVeiculos.Domain.Entities;

public class Veiculo
{
    private Veiculo()
    {
    }

    public Veiculo(
        string? placa,
        string? tipo,
        string? identificacaoVeiculo,
        bool ehInstitucional,
        string? marca = null,
        string? modelo = null,
        string? cor = null,
        int? ano = null)
    {
        if (string.IsNullOrWhiteSpace(placa) && string.IsNullOrWhiteSpace(identificacaoVeiculo))
        {
            throw new ArgumentException(
                "A placa ou outra identificação do veículo deve ser informada.");
        }

        if (ano is <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(ano));
        }

        Placa = placa;
        Tipo = tipo;
        IdentificacaoVeiculo = identificacaoVeiculo;
        EhInstitucional = ehInstitucional;
        Marca = marca;
        Modelo = modelo;
        Cor = cor;
        Ano = ano;
        Ativo = true;
        DataCriacao = DateTime.UtcNow;
    }

    public int Id { get; private set; }
    public string? Placa { get; private set; }
    public string? Tipo { get; private set; }
    public string? IdentificacaoVeiculo { get; private set; }
    public bool EhInstitucional { get; private set; }
    public string? Marca { get; private set; }
    public string? Modelo { get; private set; }
    public string? Cor { get; private set; }
    public int? Ano { get; private set; }
    public bool Ativo { get; private set; }
    public DateTime DataCriacao { get; private set; }
    public DateTime? DataAlteracao { get; private set; }
}

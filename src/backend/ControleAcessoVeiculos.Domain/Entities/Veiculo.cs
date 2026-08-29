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

        Placa = string.IsNullOrWhiteSpace(placa) ? null : NormalizarPlaca(placa);
        Tipo = tipo?.Trim();
        IdentificacaoVeiculo = string.IsNullOrWhiteSpace(identificacaoVeiculo)
            ? null
            : NormalizarIdentificacao(identificacaoVeiculo);
        EhInstitucional = ehInstitucional;
        Marca = marca?.Trim();
        Modelo = modelo?.Trim();
        Cor = cor?.Trim();
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

    public static string NormalizarPlaca(string placa)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(placa);

        var placaNormalizada = string.Concat(
            placa.Where(char.IsLetterOrDigit)).ToUpperInvariant();

        if (string.IsNullOrWhiteSpace(placaNormalizada))
        {
            throw new ArgumentException("A placa deve conter letras ou números.", nameof(placa));
        }

        return placaNormalizada;
    }

    public static string NormalizarIdentificacao(string identificacaoVeiculo)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(identificacaoVeiculo);

        return identificacaoVeiculo.Trim().ToUpperInvariant();
    }

    public bool AtualizarDados(
        string? placa,
        string? tipo,
        string? identificacaoVeiculo,
        string? marca,
        string? modelo,
        string? cor,
        int? ano,
        DateTime dataAlteracao)
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

        ValidateChangeDate(dataAlteracao);
        var normalizedPlate = string.IsNullOrWhiteSpace(placa)
            ? null
            : NormalizarPlaca(placa);
        var normalizedIdentification = string.IsNullOrWhiteSpace(identificacaoVeiculo)
            ? null
            : NormalizarIdentificacao(identificacaoVeiculo);
        var normalizedType = tipo?.Trim();
        var normalizedBrand = marca?.Trim();
        var normalizedModel = modelo?.Trim();
        var normalizedColor = cor?.Trim();
        var changed = Placa != normalizedPlate ||
            Tipo != normalizedType ||
            IdentificacaoVeiculo != normalizedIdentification ||
            Marca != normalizedBrand ||
            Modelo != normalizedModel ||
            Cor != normalizedColor ||
            Ano != ano;

        if (!changed)
        {
            return false;
        }

        Placa = normalizedPlate;
        Tipo = normalizedType;
        IdentificacaoVeiculo = normalizedIdentification;
        Marca = normalizedBrand;
        Modelo = normalizedModel;
        Cor = normalizedColor;
        Ano = ano;
        DataAlteracao = dataAlteracao;
        return true;
    }

    public void Desativar(DateTime dataAlteracao)
    {
        ValidateChangeDate(dataAlteracao);

        if (!Ativo)
        {
            throw new InvalidOperationException("O veículo já está inativo.");
        }

        Ativo = false;
        DataAlteracao = dataAlteracao;
    }

    public void Reativar(DateTime dataAlteracao)
    {
        ValidateChangeDate(dataAlteracao);

        if (Ativo)
        {
            throw new InvalidOperationException("O veículo já está ativo.");
        }

        Ativo = true;
        DataAlteracao = dataAlteracao;
    }

    private void ValidateChangeDate(DateTime dataAlteracao)
    {
        if (dataAlteracao == default || dataAlteracao < DataCriacao)
        {
            throw new ArgumentOutOfRangeException(nameof(dataAlteracao));
        }
    }
}

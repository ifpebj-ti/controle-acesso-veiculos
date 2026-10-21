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
        var placaNormalizada = NormalizarCaracteresPlaca(placa);
        var formatoAntigo =
            placaNormalizada.Length == 7 &&
            placaNormalizada[..3].All(IsAsciiLetter) &&
            placaNormalizada[3..].All(IsAsciiDigit);
        var formatoMercosul =
            placaNormalizada.Length == 7 &&
            placaNormalizada[..3].All(IsAsciiLetter) &&
            IsAsciiDigit(placaNormalizada[3]) &&
            IsAsciiLetter(placaNormalizada[4]) &&
            placaNormalizada[5..].All(IsAsciiDigit);

        if (!formatoAntigo && !formatoMercosul)
        {
            throw new ArgumentException(
                "A placa deve seguir o formato ABC-1234 ou ABC1D23.",
                nameof(placa));
        }

        return placaNormalizada;
    }

    public static string NormalizarFiltroPlaca(string placa)
    {
        var placaNormalizada = NormalizarCaracteresPlaca(placa);
        if (placaNormalizada.Length > 7)
        {
            throw new ArgumentException(
                "O filtro de placa deve possuir até 7 caracteres.",
                nameof(placa));
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

    private static string NormalizarCaracteresPlaca(string placa)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(placa);

        if (placa.Any(character =>
                !IsAsciiLetter(character) &&
                !IsAsciiDigit(character) &&
                character != '-' &&
                !char.IsWhiteSpace(character)))
        {
            throw new ArgumentException(
                "A placa pode conter apenas letras, números, espaços ou hífen.",
                nameof(placa));
        }

        var placaNormalizada = string.Concat(
            placa.Where(character => character != '-' && !char.IsWhiteSpace(character)))
            .ToUpperInvariant();
        if (placaNormalizada.Length == 0)
        {
            throw new ArgumentException("A placa deve conter letras ou números.", nameof(placa));
        }

        return placaNormalizada;
    }

    private static bool IsAsciiLetter(char character) =>
        character is >= 'A' and <= 'Z' or >= 'a' and <= 'z';

    private static bool IsAsciiDigit(char character) =>
        character is >= '0' and <= '9';
}

namespace ControleAcessoVeiculos.API.Endpoints;

internal static class VehiclePlateOpenApi
{
    public const string CompletePlate =
        "Placas completas aceitam os formatos brasileiros LLLNNNN e LLLNLNN. " +
        "Espaços e hífen são normalizados; a API persiste sete caracteres ASCII " +
        "em maiúsculas. Formato válido não comprova emissão ou regularidade.";

    public const string OptionalCompletePlate =
        "Quando informada, a placa aceita os formatos brasileiros LLLNNNN e LLLNLNN. " +
        "Espaços e hífen são normalizados; identificação interna não é placa.";

    public const string PartialPlateFilter =
        "O filtro de placa aceita de um a sete caracteres parciais, além de espaços " +
        "e hífen normalizáveis. Ele serve somente para pesquisa e não valida uma placa completa.";
}

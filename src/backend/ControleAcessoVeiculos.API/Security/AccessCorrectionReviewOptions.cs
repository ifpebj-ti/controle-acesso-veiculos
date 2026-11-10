namespace ControleAcessoVeiculos.API.Security;

public sealed class AccessCorrectionReviewOptions
{
    public const string SectionName = "AccessCorrections";

    // Compatibility override is server-side and temporary; new deployments require review by default.
    public bool RequireApproval { get; set; } = true;
}

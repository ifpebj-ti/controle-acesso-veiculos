using ControleAcessoVeiculos.Application.AccessRecords;
using ControleAcessoVeiculos.Application.Accounts;
using ControleAcessoVeiculos.Application.InstitutionalDrivers;
using ControleAcessoVeiculos.Application.InstitutionalVehicles;

namespace ControleAcessoVeiculos.Application.Tests;

public sealed class ApplicationResultContractTests
{
    [Fact]
    public void InstitutionalRegistrationConflictsExposeStableErrorFields()
    {
        var driver = AuthorizeInstitutionalDriverResult.Conflict();
        var vehicle = CreateInstitutionalVehicleResult.Conflict();
        var access = RegisterVehicleEntryResult.Conflict(
            "There is already an open access record.");

        Assert.Equal(AuthorizeInstitutionalDriverStatus.Conflict, driver.Status);
        Assert.Contains("driver", driver.Errors.Keys);
        Assert.Equal(CreateInstitutionalVehicleStatus.Conflict, vehicle.Status);
        Assert.Contains("vehicle", vehicle.Errors.Keys);
        Assert.Equal(RegisterVehicleEntryStatus.Conflict, access.Status);
        Assert.Equal(
            "There is already an open access record.",
            Assert.Single(access.Errors["accessRecord"]));
    }

    [Theory]
    [InlineData(ChangeAccountProfileStatus.NotFound)]
    [InlineData(ChangeAccountProfileStatus.Inactive)]
    [InlineData(ChangeAccountProfileStatus.SelfChange)]
    [InlineData(ChangeAccountProfileStatus.ProfileNotFound)]
    [InlineData(ChangeAccountProfileStatus.Conflict)]
    [InlineData(ChangeAccountProfileStatus.LastAdministrator)]
    public void ProfileChangeTerminalResultsDoNotLeakCredentialData(
        ChangeAccountProfileStatus expectedStatus)
    {
        var result = expectedStatus switch
        {
            ChangeAccountProfileStatus.NotFound => ChangeAccountProfileResult.NotFound(),
            ChangeAccountProfileStatus.Inactive => ChangeAccountProfileResult.Inactive(),
            ChangeAccountProfileStatus.SelfChange => ChangeAccountProfileResult.SelfChange(),
            ChangeAccountProfileStatus.ProfileNotFound =>
                ChangeAccountProfileResult.ProfileNotFound(),
            ChangeAccountProfileStatus.Conflict => ChangeAccountProfileResult.Conflict(),
            ChangeAccountProfileStatus.LastAdministrator =>
                ChangeAccountProfileResult.LastAdministrator(),
            _ => throw new InvalidOperationException("Unexpected test status.")
        };

        Assert.Equal(expectedStatus, result.Status);
        Assert.Null(result.TemporaryCredential);
        Assert.Null(result.TemporaryCredentialExpiresAtUtc);
        Assert.Empty(result.Errors);
    }
}

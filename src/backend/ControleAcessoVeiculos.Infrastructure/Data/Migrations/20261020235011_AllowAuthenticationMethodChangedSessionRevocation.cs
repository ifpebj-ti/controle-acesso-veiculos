using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ControleAcessoVeiculos.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AllowAuthenticationMethodChangedSessionRevocation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_sessoes_autenticacao_motivo_revogacao",
                schema: "dbo",
                table: "sessoes_autenticacao");

            migrationBuilder.AddCheckConstraint(
                name: "ck_sessoes_autenticacao_motivo_revogacao",
                schema: "dbo",
                table: "sessoes_autenticacao",
                sql: "motivo_revogacao IS NULL OR motivo_revogacao IN ('Rotacao', 'Logout', 'Expiracao', 'ContaDesativada', 'ReutilizacaoDetectada', 'SenhaAlterada', 'RedefinicaoAdministrativa', 'MetodoAutenticacaoAlterado')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_sessoes_autenticacao_motivo_revogacao",
                schema: "dbo",
                table: "sessoes_autenticacao");

            migrationBuilder.AddCheckConstraint(
                name: "ck_sessoes_autenticacao_motivo_revogacao",
                schema: "dbo",
                table: "sessoes_autenticacao",
                sql: "motivo_revogacao IS NULL OR motivo_revogacao IN ('Rotacao', 'Logout', 'Expiracao', 'ContaDesativada', 'ReutilizacaoDetectada', 'SenhaAlterada', 'RedefinicaoAdministrativa')");
        }
    }
}

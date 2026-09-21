using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ControleAcessoVeiculos.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAuthenticatedPasswordChange : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_sessoes_autenticacao_motivo_revogacao",
                schema: "dbo",
                table: "sessoes_autenticacao");

            migrationBuilder.AddColumn<int>(
                name: "versao_credencial",
                schema: "dbo",
                table: "usuarios",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddCheckConstraint(
                name: "ck_sessoes_autenticacao_motivo_revogacao",
                schema: "dbo",
                table: "sessoes_autenticacao",
                sql: "motivo_revogacao IS NULL OR motivo_revogacao IN ('Rotacao', 'Logout', 'Expiracao', 'ContaDesativada', 'ReutilizacaoDetectada', 'SenhaAlterada')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_sessoes_autenticacao_motivo_revogacao",
                schema: "dbo",
                table: "sessoes_autenticacao");

            migrationBuilder.DropColumn(
                name: "versao_credencial",
                schema: "dbo",
                table: "usuarios");

            migrationBuilder.AddCheckConstraint(
                name: "ck_sessoes_autenticacao_motivo_revogacao",
                schema: "dbo",
                table: "sessoes_autenticacao",
                sql: "motivo_revogacao IS NULL OR motivo_revogacao IN ('Rotacao', 'Logout', 'Expiracao', 'ContaDesativada', 'ReutilizacaoDetectada')");
        }
    }
}

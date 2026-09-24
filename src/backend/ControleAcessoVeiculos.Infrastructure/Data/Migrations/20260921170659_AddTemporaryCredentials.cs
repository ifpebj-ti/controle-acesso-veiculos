using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ControleAcessoVeiculos.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTemporaryCredentials : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_sessoes_autenticacao_motivo_revogacao",
                schema: "dbo",
                table: "sessoes_autenticacao");

            migrationBuilder.AddColumn<DateTime>(
                name: "credencial_temporaria_expira_em",
                schema: "dbo",
                table: "usuarios",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "credencial_temporaria_utilizada_em",
                schema: "dbo",
                table: "usuarios",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "troca_senha_obrigatoria",
                schema: "dbo",
                table: "usuarios",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddCheckConstraint(
                name: "ck_usuarios_credencial_temporaria",
                schema: "dbo",
                table: "usuarios",
                sql: "(troca_senha_obrigatoria AND credencial_temporaria_expira_em IS NOT NULL AND (credencial_temporaria_utilizada_em IS NULL OR credencial_temporaria_utilizada_em < credencial_temporaria_expira_em)) OR (NOT troca_senha_obrigatoria AND credencial_temporaria_expira_em IS NULL AND credencial_temporaria_utilizada_em IS NULL)");

            migrationBuilder.AddCheckConstraint(
                name: "ck_sessoes_autenticacao_motivo_revogacao",
                schema: "dbo",
                table: "sessoes_autenticacao",
                sql: "motivo_revogacao IS NULL OR motivo_revogacao IN ('Rotacao', 'Logout', 'Expiracao', 'ContaDesativada', 'ReutilizacaoDetectada', 'SenhaAlterada', 'RedefinicaoAdministrativa')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_usuarios_credencial_temporaria",
                schema: "dbo",
                table: "usuarios");

            migrationBuilder.DropCheckConstraint(
                name: "ck_sessoes_autenticacao_motivo_revogacao",
                schema: "dbo",
                table: "sessoes_autenticacao");

            migrationBuilder.DropColumn(
                name: "credencial_temporaria_expira_em",
                schema: "dbo",
                table: "usuarios");

            migrationBuilder.DropColumn(
                name: "credencial_temporaria_utilizada_em",
                schema: "dbo",
                table: "usuarios");

            migrationBuilder.DropColumn(
                name: "troca_senha_obrigatoria",
                schema: "dbo",
                table: "usuarios");

            migrationBuilder.AddCheckConstraint(
                name: "ck_sessoes_autenticacao_motivo_revogacao",
                schema: "dbo",
                table: "sessoes_autenticacao",
                sql: "motivo_revogacao IS NULL OR motivo_revogacao IN ('Rotacao', 'Logout', 'Expiracao', 'ContaDesativada', 'ReutilizacaoDetectada', 'SenhaAlterada')");
        }
    }
}

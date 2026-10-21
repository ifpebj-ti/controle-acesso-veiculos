using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ControleAcessoVeiculos.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddExplicitAuthenticationMethods : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_usuarios_vinculo_google",
                schema: "dbo",
                table: "usuarios");

            migrationBuilder.AlterColumn<string>(
                name: "senha_hash",
                schema: "dbo",
                table: "usuarios",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(255)",
                oldMaxLength: 255);

            migrationBuilder.AddColumn<string>(
                name: "metodo_autenticacao",
                schema: "dbo",
                table: "usuarios",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "Local");

            migrationBuilder.Sql(
                """
                UPDATE dbo.usuarios
                SET metodo_autenticacao = 'Google',
                    senha_hash = NULL,
                    troca_senha_obrigatoria = FALSE,
                    credencial_temporaria_expira_em = NULL,
                    credencial_temporaria_utilizada_em = NULL,
                    tentativas_falhas = 0,
                    bloqueado_ate = NULL,
                    versao_credencial = versao_credencial + 1,
                    data_alteracao = CURRENT_TIMESTAMP
                WHERE google_subject IS NOT NULL;

                ALTER TABLE dbo.usuarios
                    ALTER COLUMN metodo_autenticacao DROP DEFAULT;
                """);

            migrationBuilder.AddCheckConstraint(
                name: "ck_usuarios_vinculo_google",
                schema: "dbo",
                table: "usuarios",
                sql: "(metodo_autenticacao = 'Local' AND senha_hash IS NOT NULL AND google_subject IS NULL AND google_vinculado_em IS NULL) OR (metodo_autenticacao = 'Google' AND senha_hash IS NULL AND ((google_subject IS NULL AND google_vinculado_em IS NULL) OR (google_subject IS NOT NULL AND google_vinculado_em IS NOT NULL)))");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_usuarios_vinculo_google",
                schema: "dbo",
                table: "usuarios");

            migrationBuilder.Sql(
                """
                UPDATE dbo.usuarios
                SET senha_hash = 'INVALIDATED_GOOGLE_ACCOUNT'
                WHERE senha_hash IS NULL;
                """);

            migrationBuilder.DropColumn(
                name: "metodo_autenticacao",
                schema: "dbo",
                table: "usuarios");

            migrationBuilder.AlterColumn<string>(
                name: "senha_hash",
                schema: "dbo",
                table: "usuarios",
                type: "character varying(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(255)",
                oldMaxLength: 255,
                oldNullable: true);

            migrationBuilder.AddCheckConstraint(
                name: "ck_usuarios_vinculo_google",
                schema: "dbo",
                table: "usuarios",
                sql: "(google_subject IS NULL AND google_vinculado_em IS NULL) OR (google_subject IS NOT NULL AND google_vinculado_em IS NOT NULL)");
        }
    }
}

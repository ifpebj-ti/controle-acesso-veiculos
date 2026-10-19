using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ControleAcessoVeiculos.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddMasterAdministratorGovernance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "administrador_mestre",
                schema: "dbo",
                table: "usuarios",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            // Preserve a recoverable authority chain on existing installations without
            // elevating every administrator. The oldest active administrator becomes
            // the initial master; future changes must use the audited governance flow.
            migrationBuilder.Sql(
                """
                UPDATE dbo.usuarios AS usuario
                SET administrador_mestre = TRUE
                WHERE usuario.id = (
                    SELECT candidate.id
                    FROM dbo.usuarios AS candidate
                    INNER JOIN dbo.perfis AS perfil ON perfil.id = candidate.perfil_id
                    WHERE candidate.ativo = TRUE
                      AND perfil.ativo = TRUE
                      AND perfil.nome = 'Administrador'
                    ORDER BY candidate.data_criacao, candidate.id
                    LIMIT 1
                );
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "administrador_mestre",
                schema: "dbo",
                table: "usuarios");
        }
    }
}

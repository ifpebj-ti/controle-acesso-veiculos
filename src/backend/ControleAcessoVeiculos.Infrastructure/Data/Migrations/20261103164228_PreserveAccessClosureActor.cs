using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ControleAcessoVeiculos.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class PreserveAccessClosureActor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "encerrado_por_id",
                schema: "dbo",
                table: "registros_acesso",
                type: "integer",
                nullable: true);

            // Restore only an unambiguous closure audit; the last editor is not the exit author.
            migrationBuilder.Sql("""
                UPDATE dbo.registros_acesso AS r
                SET encerrado_por_id = evidence.usuario_id
                FROM (
                    SELECT registro_id, MIN(usuario_id) AS usuario_id
                    FROM dbo.auditorias
                    WHERE entidade = 'RegistroAcesso'
                      AND usuario_id IS NOT NULL
                      AND dados_novos->>'status' = 'Encerrado'
                      AND detalhes IN ('Vehicle access exit registered.', 'Vehicle access exceptionally closed.')
                    GROUP BY registro_id
                    HAVING COUNT(DISTINCT usuario_id) = 1
                ) AS evidence
                WHERE r.id = evidence.registro_id AND r.status = 'Encerrado';
                """);

            migrationBuilder.CreateIndex(
                name: "ix_registros_acesso_encerrado_por_id",
                schema: "dbo",
                table: "registros_acesso",
                column: "encerrado_por_id");

            migrationBuilder.AddForeignKey(
                name: "fk_registros_acesso_usuarios_encerrado_por_id",
                schema: "dbo",
                table: "registros_acesso",
                column: "encerrado_por_id",
                principalSchema: "dbo",
                principalTable: "usuarios",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_registros_acesso_usuarios_encerrado_por_id",
                schema: "dbo",
                table: "registros_acesso");

            migrationBuilder.DropIndex(
                name: "ix_registros_acesso_encerrado_por_id",
                schema: "dbo",
                table: "registros_acesso");

            migrationBuilder.DropColumn(
                name: "encerrado_por_id",
                schema: "dbo",
                table: "registros_acesso");
        }
    }
}

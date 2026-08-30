using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ControleAcessoVeiculos.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class LinkEventAuthorizationsToAccessRecords : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "autorizacao_veiculo_evento_id",
                schema: "dbo",
                table: "registros_acesso",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_registros_acesso_autorizacao_evento_id",
                schema: "dbo",
                table: "registros_acesso",
                column: "autorizacao_veiculo_evento_id");

            migrationBuilder.AddForeignKey(
                name: "fk_registros_acesso_autorizacoes_eventos",
                schema: "dbo",
                table: "registros_acesso",
                column: "autorizacao_veiculo_evento_id",
                principalSchema: "dbo",
                principalTable: "autorizacoes_veiculos_eventos",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_registros_acesso_autorizacoes_eventos",
                schema: "dbo",
                table: "registros_acesso");

            migrationBuilder.DropIndex(
                name: "ix_registros_acesso_autorizacao_evento_id",
                schema: "dbo",
                table: "registros_acesso");

            migrationBuilder.DropColumn(
                name: "autorizacao_veiculo_evento_id",
                schema: "dbo",
                table: "registros_acesso");
        }
    }
}

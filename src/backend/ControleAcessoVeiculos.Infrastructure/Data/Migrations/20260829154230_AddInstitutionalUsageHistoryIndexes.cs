using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ControleAcessoVeiculos.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddInstitutionalUsageHistoryIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_usos_institucionais_motorista_id",
                schema: "dbo",
                table: "usos_veiculos_institucionais");

            migrationBuilder.CreateIndex(
                name: "ix_usos_institucionais_motorista_saida",
                schema: "dbo",
                table: "usos_veiculos_institucionais",
                columns: new[] { "motorista_id", "data_hora_saida" });

            migrationBuilder.CreateIndex(
                name: "ix_usos_institucionais_saida",
                schema: "dbo",
                table: "usos_veiculos_institucionais",
                column: "data_hora_saida");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_usos_institucionais_motorista_saida",
                schema: "dbo",
                table: "usos_veiculos_institucionais");

            migrationBuilder.DropIndex(
                name: "ix_usos_institucionais_saida",
                schema: "dbo",
                table: "usos_veiculos_institucionais");

            migrationBuilder.CreateIndex(
                name: "ix_usos_institucionais_motorista_id",
                schema: "dbo",
                table: "usos_veiculos_institucionais",
                column: "motorista_id");
        }
    }
}

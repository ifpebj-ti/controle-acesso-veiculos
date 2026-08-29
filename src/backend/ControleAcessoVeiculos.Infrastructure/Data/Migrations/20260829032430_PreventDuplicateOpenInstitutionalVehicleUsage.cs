using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ControleAcessoVeiculos.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class PreventDuplicateOpenInstitutionalVehicleUsage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "ux_usos_institucionais_veiculo_aberto",
                schema: "dbo",
                table: "usos_veiculos_institucionais",
                column: "veiculo_id",
                unique: true,
                filter: "status IN ('EmUso', 'PendenteRetorno')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ux_usos_institucionais_veiculo_aberto",
                schema: "dbo",
                table: "usos_veiculos_institucionais");
        }
    }
}

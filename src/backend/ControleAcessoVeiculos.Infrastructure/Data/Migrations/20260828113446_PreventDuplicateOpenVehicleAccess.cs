using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ControleAcessoVeiculos.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class PreventDuplicateOpenVehicleAccess : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "ux_registros_acesso_veiculo_aberto",
                schema: "dbo",
                table: "registros_acesso",
                column: "veiculo_id",
                unique: true,
                filter: "status = 'Aberto'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ux_registros_acesso_veiculo_aberto",
                schema: "dbo",
                table: "registros_acesso");
        }
    }
}

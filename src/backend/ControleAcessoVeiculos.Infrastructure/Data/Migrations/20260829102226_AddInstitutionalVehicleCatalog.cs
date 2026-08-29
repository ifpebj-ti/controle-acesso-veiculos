using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ControleAcessoVeiculos.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddInstitutionalVehicleCatalog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1
                        FROM dbo.veiculos
                        WHERE eh_institucional = TRUE
                          AND identificacao_veiculo IS NOT NULL
                        GROUP BY UPPER(BTRIM(identificacao_veiculo))
                        HAVING COUNT(*) > 1
                    ) THEN
                        RAISE EXCEPTION 'A migração AddInstitutionalVehicleCatalog encontrou identificações institucionais duplicadas após normalização.';
                    END IF;
                END $$;

                UPDATE dbo.veiculos
                SET identificacao_veiculo = UPPER(BTRIM(identificacao_veiculo))
                WHERE eh_institucional = TRUE
                  AND identificacao_veiculo IS NOT NULL;
                """);

            migrationBuilder.CreateIndex(
                name: "ux_veiculos_identificacao_institucional",
                schema: "dbo",
                table: "veiculos",
                column: "identificacao_veiculo",
                unique: true,
                filter: "identificacao_veiculo IS NOT NULL AND eh_institucional = TRUE");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ux_veiculos_identificacao_institucional",
                schema: "dbo",
                table: "veiculos");
        }
    }
}

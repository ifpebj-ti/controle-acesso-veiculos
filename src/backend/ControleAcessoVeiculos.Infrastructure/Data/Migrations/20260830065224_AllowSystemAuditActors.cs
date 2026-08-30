using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ControleAcessoVeiculos.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AllowSystemAuditActors : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "usuario_id",
                schema: "dbo",
                table: "auditorias",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1
                        FROM dbo.auditorias
                        WHERE usuario_id IS NULL
                    ) THEN
                        RAISE EXCEPTION 'Cannot require an audit actor while system audit records exist.';
                    END IF;
                END $$;
                """);

            migrationBuilder.AlterColumn<int>(
                name: "usuario_id",
                schema: "dbo",
                table: "auditorias",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);
        }
    }
}

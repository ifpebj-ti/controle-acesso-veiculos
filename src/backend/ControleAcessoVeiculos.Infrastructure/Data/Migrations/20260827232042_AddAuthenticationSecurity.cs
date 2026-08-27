using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ControleAcessoVeiculos.Infrastructure.Data.Migrations;

/// <inheritdoc />
public partial class AddAuthenticationSecurity : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTime>(
            name: "bloqueado_ate",
            schema: "dbo",
            table: "usuarios",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.AddColumn<int>(
            name: "tentativas_falhas",
            schema: "dbo",
            table: "usuarios",
            type: "integer",
            nullable: false,
            defaultValue: 0);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "bloqueado_ate",
            schema: "dbo",
            table: "usuarios");

        migrationBuilder.DropColumn(
            name: "tentativas_falhas",
            schema: "dbo",
            table: "usuarios");
    }
}

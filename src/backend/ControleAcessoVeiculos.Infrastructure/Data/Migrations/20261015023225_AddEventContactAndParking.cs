using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ControleAcessoVeiculos.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddEventContactAndParking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "contato_responsavel",
                schema: "dbo",
                table: "eventos_acesso",
                type: "character varying(254)",
                maxLength: 254,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "local_estacionamento",
                schema: "dbo",
                table: "eventos_acesso",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "ADefinir");

            migrationBuilder.AddCheckConstraint(
                name: "ck_eventos_acesso_local_estacionamento",
                schema: "dbo",
                table: "eventos_acesso",
                sql: "local_estacionamento IN ('ADefinir', 'Interno', 'Externo')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_eventos_acesso_local_estacionamento",
                schema: "dbo",
                table: "eventos_acesso");

            migrationBuilder.DropColumn(
                name: "contato_responsavel",
                schema: "dbo",
                table: "eventos_acesso");

            migrationBuilder.DropColumn(
                name: "local_estacionamento",
                schema: "dbo",
                table: "eventos_acesso");
        }
    }
}

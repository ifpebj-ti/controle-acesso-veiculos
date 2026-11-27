using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ControleAcessoVeiculos.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCampusDriverRegistry : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "cadastro_campus_ativo",
                schema: "dbo",
                table: "pessoas",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "cadastro_campus_conferido_em",
                schema: "dbo",
                table: "pessoas",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "cadastro_campus_conferido_por_id",
                schema: "dbo",
                table: "pessoas",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "data_nascimento",
                schema: "dbo",
                table: "pessoas",
                type: "date",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_pessoas_cadastro_campus_ativo_tipo_vinculo",
                schema: "dbo",
                table: "pessoas",
                columns: new[] { "cadastro_campus_ativo", "tipo_vinculo" });

            migrationBuilder.CreateIndex(
                name: "IX_pessoas_cadastro_campus_conferido_por_id",
                schema: "dbo",
                table: "pessoas",
                column: "cadastro_campus_conferido_por_id");

            migrationBuilder.AddForeignKey(
                name: "FK_pessoas_usuarios_cadastro_campus_conferido_por_id",
                schema: "dbo",
                table: "pessoas",
                column: "cadastro_campus_conferido_por_id",
                principalSchema: "dbo",
                principalTable: "usuarios",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_pessoas_usuarios_cadastro_campus_conferido_por_id",
                schema: "dbo",
                table: "pessoas");

            migrationBuilder.DropIndex(
                name: "IX_pessoas_cadastro_campus_ativo_tipo_vinculo",
                schema: "dbo",
                table: "pessoas");

            migrationBuilder.DropIndex(
                name: "IX_pessoas_cadastro_campus_conferido_por_id",
                schema: "dbo",
                table: "pessoas");

            migrationBuilder.DropColumn(
                name: "cadastro_campus_ativo",
                schema: "dbo",
                table: "pessoas");

            migrationBuilder.DropColumn(
                name: "cadastro_campus_conferido_em",
                schema: "dbo",
                table: "pessoas");

            migrationBuilder.DropColumn(
                name: "cadastro_campus_conferido_por_id",
                schema: "dbo",
                table: "pessoas");

            migrationBuilder.DropColumn(
                name: "data_nascimento",
                schema: "dbo",
                table: "pessoas");
        }
    }
}

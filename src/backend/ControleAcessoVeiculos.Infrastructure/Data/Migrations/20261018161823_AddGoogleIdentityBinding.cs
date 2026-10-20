using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ControleAcessoVeiculos.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddGoogleIdentityBinding : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "google_subject",
                schema: "dbo",
                table: "usuarios",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "google_vinculado_em",
                schema: "dbo",
                table: "usuarios",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ux_usuarios_google_subject",
                schema: "dbo",
                table: "usuarios",
                column: "google_subject",
                unique: true,
                filter: "google_subject IS NOT NULL");

            migrationBuilder.AddCheckConstraint(
                name: "ck_usuarios_vinculo_google",
                schema: "dbo",
                table: "usuarios",
                sql: "(google_subject IS NULL AND google_vinculado_em IS NULL) OR (google_subject IS NOT NULL AND google_vinculado_em IS NOT NULL)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ux_usuarios_google_subject",
                schema: "dbo",
                table: "usuarios");

            migrationBuilder.DropCheckConstraint(
                name: "ck_usuarios_vinculo_google",
                schema: "dbo",
                table: "usuarios");

            migrationBuilder.DropColumn(
                name: "google_subject",
                schema: "dbo",
                table: "usuarios");

            migrationBuilder.DropColumn(
                name: "google_vinculado_em",
                schema: "dbo",
                table: "usuarios");
        }
    }
}

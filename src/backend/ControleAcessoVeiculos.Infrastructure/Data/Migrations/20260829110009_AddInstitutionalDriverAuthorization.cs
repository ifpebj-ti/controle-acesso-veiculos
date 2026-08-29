using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ControleAcessoVeiculos.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddInstitutionalDriverAuthorization : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "motoristas_institucionais",
                schema: "dbo",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    pessoa_id = table.Column<int>(type: "integer", nullable: false),
                    ativo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    criado_por_id = table.Column<int>(type: "integer", nullable: false),
                    atualizado_por_id = table.Column<int>(type: "integer", nullable: true),
                    data_criacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    data_alteracao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_motoristas_institucionais", x => x.id);
                    table.ForeignKey(
                        name: "fk_motoristas_institucionais_pessoas",
                        column: x => x.pessoa_id,
                        principalSchema: "dbo",
                        principalTable: "pessoas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_motoristas_institucionais_usuarios_atualizado_por",
                        column: x => x.atualizado_por_id,
                        principalSchema: "dbo",
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_motoristas_institucionais_usuarios_criado_por",
                        column: x => x.criado_por_id,
                        principalSchema: "dbo",
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_motoristas_institucionais_ativo",
                schema: "dbo",
                table: "motoristas_institucionais",
                column: "ativo");

            migrationBuilder.CreateIndex(
                name: "ix_motoristas_institucionais_atualizado_por_id",
                schema: "dbo",
                table: "motoristas_institucionais",
                column: "atualizado_por_id");

            migrationBuilder.CreateIndex(
                name: "ix_motoristas_institucionais_criado_por_id",
                schema: "dbo",
                table: "motoristas_institucionais",
                column: "criado_por_id");

            migrationBuilder.CreateIndex(
                name: "ux_motoristas_institucionais_pessoa_id",
                schema: "dbo",
                table: "motoristas_institucionais",
                column: "pessoa_id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "motoristas_institucionais",
                schema: "dbo");
        }
    }
}

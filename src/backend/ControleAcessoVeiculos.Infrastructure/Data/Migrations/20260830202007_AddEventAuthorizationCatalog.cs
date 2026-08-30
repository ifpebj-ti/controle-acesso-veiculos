using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ControleAcessoVeiculos.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddEventAuthorizationCatalog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "eventos_acesso",
                schema: "dbo",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    responsavel = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    inicio = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    fim = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    local_area = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    permite_pernoite = table.Column<bool>(type: "boolean", nullable: false),
                    observacao = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ativo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    criado_por_id = table.Column<int>(type: "integer", nullable: false),
                    atualizado_por_id = table.Column<int>(type: "integer", nullable: true),
                    data_criacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    data_alteracao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_eventos_acesso", x => x.id);
                    table.CheckConstraint("ck_eventos_acesso_periodo", "fim > inicio");
                    table.ForeignKey(
                        name: "fk_eventos_acesso_usuarios_atualizado_por",
                        column: x => x.atualizado_por_id,
                        principalSchema: "dbo",
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_eventos_acesso_usuarios_criado_por",
                        column: x => x.criado_por_id,
                        principalSchema: "dbo",
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "autorizacoes_veiculos_eventos",
                schema: "dbo",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    evento_acesso_id = table.Column<int>(type: "integer", nullable: false),
                    tipo_veiculo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    quantidade = table.Column<int>(type: "integer", nullable: false),
                    placa = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_autorizacoes_veiculos_eventos", x => x.id);
                    table.CheckConstraint("ck_autorizacoes_veiculos_eventos_quantidade", "quantidade > 0 AND (placa IS NULL OR quantidade = 1)");
                    table.ForeignKey(
                        name: "fk_autorizacoes_veiculos_eventos_eventos_acesso",
                        column: x => x.evento_acesso_id,
                        principalSchema: "dbo",
                        principalTable: "eventos_acesso",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_autorizacoes_veiculos_eventos_evento_id",
                schema: "dbo",
                table: "autorizacoes_veiculos_eventos",
                column: "evento_acesso_id");

            migrationBuilder.CreateIndex(
                name: "ux_autorizacoes_veiculos_eventos_evento_placa",
                schema: "dbo",
                table: "autorizacoes_veiculos_eventos",
                columns: new[] { "evento_acesso_id", "placa" },
                unique: true,
                filter: "placa IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ux_autorizacoes_veiculos_eventos_evento_tipo_sem_placa",
                schema: "dbo",
                table: "autorizacoes_veiculos_eventos",
                columns: new[] { "evento_acesso_id", "tipo_veiculo" },
                unique: true,
                filter: "placa IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_eventos_acesso_ativo",
                schema: "dbo",
                table: "eventos_acesso",
                column: "ativo");

            migrationBuilder.CreateIndex(
                name: "ix_eventos_acesso_atualizado_por_id",
                schema: "dbo",
                table: "eventos_acesso",
                column: "atualizado_por_id");

            migrationBuilder.CreateIndex(
                name: "ix_eventos_acesso_criado_por_id",
                schema: "dbo",
                table: "eventos_acesso",
                column: "criado_por_id");

            migrationBuilder.CreateIndex(
                name: "ix_eventos_acesso_periodo",
                schema: "dbo",
                table: "eventos_acesso",
                columns: new[] { "inicio", "fim" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "autorizacoes_veiculos_eventos",
                schema: "dbo");

            migrationBuilder.DropTable(
                name: "eventos_acesso",
                schema: "dbo");
        }
    }
}

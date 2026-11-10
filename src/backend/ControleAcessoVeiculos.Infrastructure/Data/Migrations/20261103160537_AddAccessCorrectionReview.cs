using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ControleAcessoVeiculos.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAccessCorrectionReview : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "solicitacoes_correcao_acesso",
                schema: "dbo",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    chave_requisicao = table.Column<Guid>(type: "uuid", nullable: false),
                    registro_acesso_id = table.Column<int>(type: "integer", nullable: false),
                    solicitado_por_id = table.Column<int>(type: "integer", nullable: false),
                    original_categoria_id = table.Column<int>(type: "integer", nullable: false),
                    original_objetivo = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    original_observacao = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    proposto_categoria_id = table.Column<int>(type: "integer", nullable: false),
                    proposto_objetivo = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    proposto_observacao = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    justificativa = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    solicitado_em_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    decidido_por_id = table.Column<int>(type: "integer", nullable: true),
                    decidido_em_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    motivo_decisao = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_solicitacoes_correcao_acesso", x => x.id);
                    table.CheckConstraint("ck_solicitacao_correcao_chave", "chave_requisicao <> '00000000-0000-0000-0000-000000000000'::uuid");
                    table.CheckConstraint("ck_solicitacao_correcao_estado", "(status = 'Pendente' AND decidido_por_id IS NULL AND decidido_em_utc IS NULL AND motivo_decisao IS NULL) OR (status IN ('Aprovada', 'Rejeitada', 'Cancelada') AND decidido_por_id IS NOT NULL AND decidido_em_utc IS NOT NULL AND decidido_em_utc >= solicitado_em_utc AND motivo_decisao IS NOT NULL AND ((status = 'Cancelada' AND decidido_por_id = solicitado_por_id) OR (status <> 'Cancelada' AND decidido_por_id <> solicitado_por_id)))");
                    table.CheckConstraint("ck_solicitacao_correcao_motivos", "length(btrim(justificativa)) BETWEEN 10 AND 500 AND (motivo_decisao IS NULL OR length(btrim(motivo_decisao)) BETWEEN 10 AND 500)");
                    table.ForeignKey(
                        name: "FK_solicitacoes_correcao_acesso_categorias_acesso_original_cat~",
                        column: x => x.original_categoria_id,
                        principalSchema: "dbo",
                        principalTable: "categorias_acesso",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_solicitacoes_correcao_acesso_categorias_acesso_proposto_cat~",
                        column: x => x.proposto_categoria_id,
                        principalSchema: "dbo",
                        principalTable: "categorias_acesso",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_solicitacoes_correcao_acesso_registros_acesso_registro_aces~",
                        column: x => x.registro_acesso_id,
                        principalSchema: "dbo",
                        principalTable: "registros_acesso",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_solicitacoes_correcao_acesso_usuarios_decidido_por_id",
                        column: x => x.decidido_por_id,
                        principalSchema: "dbo",
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_solicitacoes_correcao_acesso_usuarios_solicitado_por_id",
                        column: x => x.solicitado_por_id,
                        principalSchema: "dbo",
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_solicitacoes_correcao_acesso_decidido_por_id",
                schema: "dbo",
                table: "solicitacoes_correcao_acesso",
                column: "decidido_por_id");

            migrationBuilder.CreateIndex(
                name: "IX_solicitacoes_correcao_acesso_original_categoria_id",
                schema: "dbo",
                table: "solicitacoes_correcao_acesso",
                column: "original_categoria_id");

            migrationBuilder.CreateIndex(
                name: "IX_solicitacoes_correcao_acesso_proposto_categoria_id",
                schema: "dbo",
                table: "solicitacoes_correcao_acesso",
                column: "proposto_categoria_id");

            migrationBuilder.CreateIndex(
                name: "IX_solicitacoes_correcao_acesso_registro_acesso_id",
                schema: "dbo",
                table: "solicitacoes_correcao_acesso",
                column: "registro_acesso_id",
                unique: true,
                filter: "status = 'Pendente'");

            migrationBuilder.CreateIndex(
                name: "IX_solicitacoes_correcao_acesso_solicitado_por_id_chave_requis~",
                schema: "dbo",
                table: "solicitacoes_correcao_acesso",
                columns: new[] { "solicitado_por_id", "chave_requisicao" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_solicitacoes_correcao_acesso_status_solicitado_em_utc_id",
                schema: "dbo",
                table: "solicitacoes_correcao_acesso",
                columns: new[] { "status", "solicitado_em_utc", "id" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "solicitacoes_correcao_acesso",
                schema: "dbo");
        }
    }
}

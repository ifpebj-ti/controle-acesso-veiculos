using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ControleAcessoVeiculos.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPaperReconciliation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "incidentes_contingencia",
                schema: "dbo",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    chave_incidente = table.Column<Guid>(type: "uuid", nullable: false),
                    referencia_papel = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    inicio_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    fim_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    criado_por_id = table.Column<int>(type: "integer", nullable: false),
                    criado_em_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_incidentes_contingencia", x => x.id);
                    table.UniqueConstraint("AK_incidentes_contingencia_chave_incidente", x => x.chave_incidente);
                    table.CheckConstraint("ck_incidentes_contingencia_datas", "inicio_utc <= fim_utc AND fim_utc <= criado_em_utc");
                    table.ForeignKey(
                        name: "FK_incidentes_contingencia_usuarios_criado_por_id",
                        column: x => x.criado_por_id,
                        principalSchema: "dbo",
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "reconciliacoes_contingencia",
                schema: "dbo",
                columns: table => new
                {
                    registro_acesso_id = table.Column<int>(type: "integer", nullable: false),
                    chave_intencao = table.Column<Guid>(type: "uuid", nullable: false),
                    assinatura_intencao = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    incidente_id = table.Column<Guid>(type: "uuid", nullable: false),
                    numero_linha = table.Column<int>(type: "integer", nullable: false),
                    referencia_autor_papel = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    digitado_por_id = table.Column<int>(type: "integer", nullable: false),
                    entrada_observada_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    saida_observada_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    digitado_em_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    justificativa = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    conferido_por_id = table.Column<int>(type: "integer", nullable: true),
                    conferido_em_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    motivo_conferencia = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_reconciliacoes_contingencia", x => x.registro_acesso_id);
                    table.CheckConstraint("ck_reconciliacoes_conferencia", "(status = 'Pendente' AND conferido_por_id IS NULL AND conferido_em_utc IS NULL AND motivo_conferencia IS NULL) OR (status IN ('Conferida','Recusada') AND conferido_por_id IS NOT NULL AND conferido_por_id <> digitado_por_id AND conferido_em_utc IS NOT NULL AND conferido_em_utc >= digitado_em_utc AND motivo_conferencia IS NOT NULL)");
                    table.CheckConstraint("ck_reconciliacoes_datas", "entrada_observada_utc <= digitado_em_utc AND (saida_observada_utc IS NULL OR (saida_observada_utc >= entrada_observada_utc AND saida_observada_utc <= digitado_em_utc))");
                    table.CheckConstraint("ck_reconciliacoes_linha", "numero_linha > 0");
                    table.ForeignKey(
                        name: "FK_reconciliacoes_contingencia_incidentes_contingencia_inciden~",
                        column: x => x.incidente_id,
                        principalSchema: "dbo",
                        principalTable: "incidentes_contingencia",
                        principalColumn: "chave_incidente",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_reconciliacoes_contingencia_registros_acesso_registro_acess~",
                        column: x => x.registro_acesso_id,
                        principalSchema: "dbo",
                        principalTable: "registros_acesso",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_reconciliacoes_contingencia_usuarios_conferido_por_id",
                        column: x => x.conferido_por_id,
                        principalSchema: "dbo",
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_reconciliacoes_contingencia_usuarios_digitado_por_id",
                        column: x => x.digitado_por_id,
                        principalSchema: "dbo",
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_incidentes_contingencia_criado_por_id",
                schema: "dbo",
                table: "incidentes_contingencia",
                column: "criado_por_id");

            migrationBuilder.CreateIndex(
                name: "IX_incidentes_contingencia_inicio_utc_id",
                schema: "dbo",
                table: "incidentes_contingencia",
                columns: new[] { "inicio_utc", "id" });

            migrationBuilder.CreateIndex(
                name: "IX_reconciliacoes_contingencia_conferido_por_id",
                schema: "dbo",
                table: "reconciliacoes_contingencia",
                column: "conferido_por_id");

            migrationBuilder.CreateIndex(
                name: "IX_reconciliacoes_contingencia_digitado_por_id_chave_intencao",
                schema: "dbo",
                table: "reconciliacoes_contingencia",
                columns: new[] { "digitado_por_id", "chave_intencao" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_reconciliacoes_contingencia_incidente_id_numero_linha",
                schema: "dbo",
                table: "reconciliacoes_contingencia",
                columns: new[] { "incidente_id", "numero_linha" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_reconciliacoes_contingencia_status_digitado_em_utc_registro~",
                schema: "dbo",
                table: "reconciliacoes_contingencia",
                columns: new[] { "status", "digitado_em_utc", "registro_acesso_id" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "reconciliacoes_contingencia",
                schema: "dbo");

            migrationBuilder.DropTable(
                name: "incidentes_contingencia",
                schema: "dbo");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ControleAcessoVeiculos.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSecureAuthenticationSessions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "sessoes_autenticacao",
                schema: "dbo",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    usuario_id = table.Column<int>(type: "integer", nullable: false),
                    familia_id = table.Column<Guid>(type: "uuid", nullable: false),
                    token_hash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    token_substituto_hash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    criada_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ultima_atividade_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    expira_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    consumida_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    revogada_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    motivo_revogacao = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_sessoes_autenticacao", x => x.id);
                    table.CheckConstraint("ck_sessoes_autenticacao_motivo_revogacao", "motivo_revogacao IS NULL OR motivo_revogacao IN ('Rotacao', 'Logout', 'Expiracao', 'ContaDesativada', 'ReutilizacaoDetectada')");
                    table.CheckConstraint("ck_sessoes_autenticacao_periodo", "expira_em > criada_em");
                    table.CheckConstraint("ck_sessoes_autenticacao_revogacao", "(revogada_em IS NULL AND motivo_revogacao IS NULL) OR (revogada_em IS NOT NULL AND motivo_revogacao IS NOT NULL)");
                    table.CheckConstraint("ck_sessoes_autenticacao_rotacao", "(consumida_em IS NULL AND token_substituto_hash IS NULL) OR (consumida_em IS NOT NULL AND token_substituto_hash IS NOT NULL AND motivo_revogacao = 'Rotacao')");
                    table.CheckConstraint("ck_sessoes_autenticacao_token_hash", "token_hash ~ '^[0-9a-f]{64}$'");
                    table.CheckConstraint("ck_sessoes_autenticacao_token_substituto_hash", "token_substituto_hash IS NULL OR token_substituto_hash ~ '^[0-9a-f]{64}$'");
                    table.ForeignKey(
                        name: "fk_sessoes_autenticacao_usuarios_usuario_id",
                        column: x => x.usuario_id,
                        principalSchema: "dbo",
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_sessoes_autenticacao_familia_revogada_em",
                schema: "dbo",
                table: "sessoes_autenticacao",
                columns: new[] { "familia_id", "revogada_em" });

            migrationBuilder.CreateIndex(
                name: "ix_sessoes_autenticacao_usuario_expira_em",
                schema: "dbo",
                table: "sessoes_autenticacao",
                columns: new[] { "usuario_id", "expira_em" });

            migrationBuilder.CreateIndex(
                name: "ux_sessoes_autenticacao_token_hash",
                schema: "dbo",
                table: "sessoes_autenticacao",
                column: "token_hash",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "sessoes_autenticacao",
                schema: "dbo");
        }
    }
}

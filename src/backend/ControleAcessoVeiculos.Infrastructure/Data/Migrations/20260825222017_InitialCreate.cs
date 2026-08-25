using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ControleAcessoVeiculos.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "dbo");

            migrationBuilder.CreateTable(
                name: "categorias_acesso",
                schema: "dbo",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nome = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    descricao = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    tempo_validade_dias = table.Column<int>(type: "integer", nullable: false),
                    ativo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_categorias_acesso", x => x.id);
                    table.CheckConstraint("ck_categorias_acesso_tempo_validade", "tempo_validade_dias >= 0");
                });

            migrationBuilder.CreateTable(
                name: "perfis",
                schema: "dbo",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nome = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    descricao = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ativo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_perfis", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "pessoas",
                schema: "dbo",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nome = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    email = table.Column<string>(type: "character varying(254)", maxLength: 254, nullable: false),
                    documento = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ativo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    data_criacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    data_alteracao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_pessoas", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "usuarios",
                schema: "dbo",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    email = table.Column<string>(type: "character varying(254)", maxLength: 254, nullable: false),
                    senha_hash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    pessoa_id = table.Column<int>(type: "integer", nullable: false),
                    perfil_id = table.Column<int>(type: "integer", nullable: false),
                    ativo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    data_criacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    data_alteracao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_usuarios", x => x.id);
                    table.ForeignKey(
                        name: "fk_usuarios_perfis_perfil_id",
                        column: x => x.perfil_id,
                        principalSchema: "dbo",
                        principalTable: "perfis",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_usuarios_pessoas_pessoa_id",
                        column: x => x.pessoa_id,
                        principalSchema: "dbo",
                        principalTable: "pessoas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "veiculos",
                schema: "dbo",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    placa = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    marca = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    modelo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    cor = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    ano = table.Column<int>(type: "integer", nullable: false),
                    pessoa_id = table.Column<int>(type: "integer", nullable: false),
                    ativo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    data_criacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    data_alteracao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_veiculos", x => x.id);
                    table.CheckConstraint("ck_veiculos_ano", "ano > 0");
                    table.ForeignKey(
                        name: "fk_veiculos_pessoas_pessoa_id",
                        column: x => x.pessoa_id,
                        principalSchema: "dbo",
                        principalTable: "pessoas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "auditorias",
                schema: "dbo",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    data_hora = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    tipo_acao = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    tabela = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    registro_id = table.Column<int>(type: "integer", nullable: false),
                    usuario_id = table.Column<int>(type: "integer", nullable: false),
                    detalhes = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_auditorias", x => x.id);
                    table.ForeignKey(
                        name: "fk_auditorias_usuarios_usuario_id",
                        column: x => x.usuario_id,
                        principalSchema: "dbo",
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "registros_acesso",
                schema: "dbo",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    veiculo_id = table.Column<int>(type: "integer", nullable: false),
                    categoria_acesso_id = table.Column<int>(type: "integer", nullable: false),
                    data_hora_entrada = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    data_hora_saida = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    observacao = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_registros_acesso", x => x.id);
                    table.CheckConstraint("ck_registros_acesso_periodo", "data_hora_saida IS NULL OR data_hora_saida >= data_hora_entrada");
                    table.ForeignKey(
                        name: "fk_registros_acesso_categorias_categoria_id",
                        column: x => x.categoria_acesso_id,
                        principalSchema: "dbo",
                        principalTable: "categorias_acesso",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_registros_acesso_veiculos_veiculo_id",
                        column: x => x.veiculo_id,
                        principalSchema: "dbo",
                        principalTable: "veiculos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_auditorias_data_hora",
                schema: "dbo",
                table: "auditorias",
                column: "data_hora");

            migrationBuilder.CreateIndex(
                name: "ix_auditorias_tabela_registro_id",
                schema: "dbo",
                table: "auditorias",
                columns: new[] { "tabela", "registro_id" });

            migrationBuilder.CreateIndex(
                name: "ix_auditorias_usuario_id",
                schema: "dbo",
                table: "auditorias",
                column: "usuario_id");

            migrationBuilder.CreateIndex(
                name: "ix_categorias_acesso_ativo",
                schema: "dbo",
                table: "categorias_acesso",
                column: "ativo");

            migrationBuilder.CreateIndex(
                name: "ux_categorias_acesso_nome",
                schema: "dbo",
                table: "categorias_acesso",
                column: "nome",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_perfis_ativo",
                schema: "dbo",
                table: "perfis",
                column: "ativo");

            migrationBuilder.CreateIndex(
                name: "ux_perfis_nome",
                schema: "dbo",
                table: "perfis",
                column: "nome",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_pessoas_ativo",
                schema: "dbo",
                table: "pessoas",
                column: "ativo");

            migrationBuilder.CreateIndex(
                name: "ux_pessoas_documento",
                schema: "dbo",
                table: "pessoas",
                column: "documento",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ux_pessoas_email",
                schema: "dbo",
                table: "pessoas",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_registros_acesso_categoria_id",
                schema: "dbo",
                table: "registros_acesso",
                column: "categoria_acesso_id");

            migrationBuilder.CreateIndex(
                name: "ix_registros_acesso_status",
                schema: "dbo",
                table: "registros_acesso",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_registros_acesso_veiculo_data_entrada",
                schema: "dbo",
                table: "registros_acesso",
                columns: new[] { "veiculo_id", "data_hora_entrada" });

            migrationBuilder.CreateIndex(
                name: "ix_usuarios_ativo",
                schema: "dbo",
                table: "usuarios",
                column: "ativo");

            migrationBuilder.CreateIndex(
                name: "ix_usuarios_perfil_id",
                schema: "dbo",
                table: "usuarios",
                column: "perfil_id");

            migrationBuilder.CreateIndex(
                name: "ux_usuarios_email",
                schema: "dbo",
                table: "usuarios",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ux_usuarios_pessoa_id",
                schema: "dbo",
                table: "usuarios",
                column: "pessoa_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_veiculos_ativo",
                schema: "dbo",
                table: "veiculos",
                column: "ativo");

            migrationBuilder.CreateIndex(
                name: "ix_veiculos_pessoa_id",
                schema: "dbo",
                table: "veiculos",
                column: "pessoa_id");

            migrationBuilder.CreateIndex(
                name: "ux_veiculos_placa",
                schema: "dbo",
                table: "veiculos",
                column: "placa",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "auditorias",
                schema: "dbo");

            migrationBuilder.DropTable(
                name: "registros_acesso",
                schema: "dbo");

            migrationBuilder.DropTable(
                name: "usuarios",
                schema: "dbo");

            migrationBuilder.DropTable(
                name: "categorias_acesso",
                schema: "dbo");

            migrationBuilder.DropTable(
                name: "veiculos",
                schema: "dbo");

            migrationBuilder.DropTable(
                name: "perfis",
                schema: "dbo");

            migrationBuilder.DropTable(
                name: "pessoas",
                schema: "dbo");
        }
    }
}

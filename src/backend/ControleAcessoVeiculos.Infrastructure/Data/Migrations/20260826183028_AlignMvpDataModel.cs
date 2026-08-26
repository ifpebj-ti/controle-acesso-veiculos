using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ControleAcessoVeiculos.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AlignMvpDataModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DO $$
                BEGIN
                    IF EXISTS (SELECT 1 FROM dbo.registros_acesso) THEN
                        RAISE EXCEPTION 'A migração AlignMvpDataModel exige que dbo.registros_acesso esteja vazia, pois objetivo e usuário responsável não existiam no modelo anterior.';
                    END IF;
                END $$;
                """);

            migrationBuilder.DropForeignKey(
                name: "fk_veiculos_pessoas_pessoa_id",
                schema: "dbo",
                table: "veiculos");

            migrationBuilder.DropIndex(
                name: "ix_veiculos_pessoa_id",
                schema: "dbo",
                table: "veiculos");

            migrationBuilder.DropIndex(
                name: "ux_veiculos_placa",
                schema: "dbo",
                table: "veiculos");

            migrationBuilder.DropCheckConstraint(
                name: "ck_veiculos_ano",
                schema: "dbo",
                table: "veiculos");

            migrationBuilder.DropIndex(
                name: "ux_pessoas_documento",
                schema: "dbo",
                table: "pessoas");

            migrationBuilder.DropIndex(
                name: "ux_pessoas_email",
                schema: "dbo",
                table: "pessoas");

            migrationBuilder.DropCheckConstraint(
                name: "ck_categorias_acesso_tempo_validade",
                schema: "dbo",
                table: "categorias_acesso");

            migrationBuilder.RenameColumn(
                name: "documento",
                schema: "dbo",
                table: "pessoas",
                newName: "documento_numero");

            migrationBuilder.RenameColumn(
                name: "tabela",
                schema: "dbo",
                table: "auditorias",
                newName: "entidade");

            migrationBuilder.RenameIndex(
                name: "ix_auditorias_tabela_registro_id",
                schema: "dbo",
                table: "auditorias",
                newName: "ix_auditorias_entidade_registro_id");

            migrationBuilder.AlterColumn<string>(
                name: "placa",
                schema: "dbo",
                table: "veiculos",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(10)",
                oldMaxLength: 10);

            migrationBuilder.AlterColumn<string>(
                name: "modelo",
                schema: "dbo",
                table: "veiculos",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "marca",
                schema: "dbo",
                table: "veiculos",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(80)",
                oldMaxLength: 80);

            migrationBuilder.AlterColumn<DateTime>(
                name: "data_criacao",
                schema: "dbo",
                table: "veiculos",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "CURRENT_TIMESTAMP");

            migrationBuilder.AlterColumn<string>(
                name: "cor",
                schema: "dbo",
                table: "veiculos",
                type: "character varying(40)",
                maxLength: 40,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(40)",
                oldMaxLength: 40);

            migrationBuilder.AlterColumn<int>(
                name: "ano",
                schema: "dbo",
                table: "veiculos",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<bool>(
                name: "eh_institucional",
                schema: "dbo",
                table: "veiculos",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "identificacao_veiculo",
                schema: "dbo",
                table: "veiculos",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "tipo",
                schema: "dbo",
                table: "veiculos",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "atualizado_por_id",
                schema: "dbo",
                table: "registros_acesso",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "criado_por_id",
                schema: "dbo",
                table: "registros_acesso",
                type: "integer",
                nullable: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "data_alteracao",
                schema: "dbo",
                table: "registros_acesso",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "data_criacao",
                schema: "dbo",
                table: "registros_acesso",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP");

            migrationBuilder.AddColumn<string>(
                name: "objetivo",
                schema: "dbo",
                table: "registros_acesso",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false);

            migrationBuilder.AddColumn<int>(
                name: "pessoa_id",
                schema: "dbo",
                table: "registros_acesso",
                type: "integer",
                nullable: false);

            migrationBuilder.AlterColumn<string>(
                name: "nome",
                schema: "dbo",
                table: "pessoas",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(150)",
                oldMaxLength: 150);

            migrationBuilder.AlterColumn<string>(
                name: "email",
                schema: "dbo",
                table: "pessoas",
                type: "character varying(254)",
                maxLength: 254,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(254)",
                oldMaxLength: 254);

            migrationBuilder.AlterColumn<DateTime>(
                name: "data_criacao",
                schema: "dbo",
                table: "pessoas",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "CURRENT_TIMESTAMP");

            migrationBuilder.AlterColumn<string>(
                name: "documento_numero",
                schema: "dbo",
                table: "pessoas",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20);

            migrationBuilder.AddColumn<string>(
                name: "documento_tipo",
                schema: "dbo",
                table: "pessoas",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "tipo_vinculo",
                schema: "dbo",
                table: "pessoas",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "descricao",
                schema: "dbo",
                table: "perfis",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500);

            migrationBuilder.AddColumn<DateTime>(
                name: "data_alteracao",
                schema: "dbo",
                table: "perfis",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "data_criacao",
                schema: "dbo",
                table: "perfis",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP");

            migrationBuilder.AlterColumn<int>(
                name: "tempo_validade_dias",
                schema: "dbo",
                table: "categorias_acesso",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<string>(
                name: "descricao",
                schema: "dbo",
                table: "categorias_acesso",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500);

            migrationBuilder.AddColumn<DateTime>(
                name: "data_alteracao",
                schema: "dbo",
                table: "categorias_acesso",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "data_criacao",
                schema: "dbo",
                table: "categorias_acesso",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP");

            migrationBuilder.AlterColumn<string>(
                name: "detalhes",
                schema: "dbo",
                table: "auditorias",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<string>(
                name: "dados_anteriores",
                schema: "dbo",
                table: "auditorias",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "dados_novos",
                schema: "dbo",
                table: "auditorias",
                type: "jsonb",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "pessoas_veiculos",
                schema: "dbo",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    pessoa_id = table.Column<int>(type: "integer", nullable: false),
                    veiculo_id = table.Column<int>(type: "integer", nullable: false),
                    tipo_relacao = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ativo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    data_inicio = table.Column<DateOnly>(type: "date", nullable: true),
                    data_fim = table.Column<DateOnly>(type: "date", nullable: true),
                    data_criacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    data_alteracao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_pessoas_veiculos", x => x.id);
                    table.CheckConstraint("ck_pessoas_veiculos_periodo", "data_fim IS NULL OR data_inicio IS NULL OR data_fim >= data_inicio");
                    table.ForeignKey(
                        name: "fk_pessoas_veiculos_pessoas",
                        column: x => x.pessoa_id,
                        principalSchema: "dbo",
                        principalTable: "pessoas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_pessoas_veiculos_veiculos",
                        column: x => x.veiculo_id,
                        principalSchema: "dbo",
                        principalTable: "veiculos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.Sql(
                """
                INSERT INTO dbo.pessoas_veiculos
                    (pessoa_id, veiculo_id, tipo_relacao, ativo, data_criacao)
                SELECT pessoa_id, id, 'Responsavel', TRUE, CURRENT_TIMESTAMP
                FROM dbo.veiculos;
                """);

            migrationBuilder.DropColumn(
                name: "pessoa_id",
                schema: "dbo",
                table: "veiculos");

            migrationBuilder.CreateTable(
                name: "usos_veiculos_institucionais",
                schema: "dbo",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    veiculo_id = table.Column<int>(type: "integer", nullable: false),
                    motorista_id = table.Column<int>(type: "integer", nullable: false),
                    registro_acesso_id = table.Column<int>(type: "integer", nullable: true),
                    data_hora_saida = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    quilometragem_saida = table.Column<int>(type: "integer", nullable: false),
                    itinerario = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    data_hora_entrada = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    quilometragem_entrada = table.Column<int>(type: "integer", nullable: true),
                    status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    criado_por_id = table.Column<int>(type: "integer", nullable: false),
                    atualizado_por_id = table.Column<int>(type: "integer", nullable: true),
                    data_criacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    data_alteracao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_usos_veiculos_institucionais", x => x.id);
                    table.CheckConstraint("ck_usos_veiculos_institucionais_periodo", "data_hora_entrada IS NULL OR data_hora_entrada >= data_hora_saida");
                    table.CheckConstraint("ck_usos_veiculos_institucionais_quilometragem", "quilometragem_saida >= 0 AND (quilometragem_entrada IS NULL OR quilometragem_entrada >= quilometragem_saida)");
                    table.ForeignKey(
                        name: "fk_usos_institucionais_motoristas",
                        column: x => x.motorista_id,
                        principalSchema: "dbo",
                        principalTable: "pessoas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_usos_institucionais_registros_acesso",
                        column: x => x.registro_acesso_id,
                        principalSchema: "dbo",
                        principalTable: "registros_acesso",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_usos_institucionais_usuarios_atualizado_por",
                        column: x => x.atualizado_por_id,
                        principalSchema: "dbo",
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_usos_institucionais_usuarios_criado_por",
                        column: x => x.criado_por_id,
                        principalSchema: "dbo",
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_usos_institucionais_veiculos",
                        column: x => x.veiculo_id,
                        principalSchema: "dbo",
                        principalTable: "veiculos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_veiculos_institucional",
                schema: "dbo",
                table: "veiculos",
                column: "eh_institucional");

            migrationBuilder.CreateIndex(
                name: "ux_veiculos_placa",
                schema: "dbo",
                table: "veiculos",
                column: "placa",
                unique: true,
                filter: "placa IS NOT NULL");

            migrationBuilder.AddCheckConstraint(
                name: "ck_veiculos_ano",
                schema: "dbo",
                table: "veiculos",
                sql: "ano IS NULL OR ano > 0");

            migrationBuilder.AddCheckConstraint(
                name: "ck_veiculos_identificacao",
                schema: "dbo",
                table: "veiculos",
                sql: "placa IS NOT NULL OR identificacao_veiculo IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_registros_acesso_atualizado_por_id",
                schema: "dbo",
                table: "registros_acesso",
                column: "atualizado_por_id");

            migrationBuilder.CreateIndex(
                name: "ix_registros_acesso_criado_por_id",
                schema: "dbo",
                table: "registros_acesso",
                column: "criado_por_id");

            migrationBuilder.CreateIndex(
                name: "ix_registros_acesso_pessoa_id",
                schema: "dbo",
                table: "registros_acesso",
                column: "pessoa_id");

            migrationBuilder.CreateIndex(
                name: "ux_pessoas_documento",
                schema: "dbo",
                table: "pessoas",
                columns: new[] { "documento_tipo", "documento_numero" },
                unique: true,
                filter: "documento_tipo IS NOT NULL AND documento_numero IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ux_pessoas_email",
                schema: "dbo",
                table: "pessoas",
                column: "email",
                unique: true,
                filter: "email IS NOT NULL");

            migrationBuilder.AddCheckConstraint(
                name: "ck_categorias_acesso_tempo_validade",
                schema: "dbo",
                table: "categorias_acesso",
                sql: "tempo_validade_dias IS NULL OR tempo_validade_dias >= 0");

            migrationBuilder.CreateIndex(
                name: "ix_pessoas_veiculos_ativo",
                schema: "dbo",
                table: "pessoas_veiculos",
                column: "ativo");

            migrationBuilder.CreateIndex(
                name: "ix_pessoas_veiculos_veiculo_id",
                schema: "dbo",
                table: "pessoas_veiculos",
                column: "veiculo_id");

            migrationBuilder.CreateIndex(
                name: "ux_pessoas_veiculos_relacao",
                schema: "dbo",
                table: "pessoas_veiculos",
                columns: new[] { "pessoa_id", "veiculo_id", "tipo_relacao" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_usos_institucionais_motorista_id",
                schema: "dbo",
                table: "usos_veiculos_institucionais",
                column: "motorista_id");

            migrationBuilder.CreateIndex(
                name: "ix_usos_institucionais_status",
                schema: "dbo",
                table: "usos_veiculos_institucionais",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_usos_institucionais_veiculo_saida",
                schema: "dbo",
                table: "usos_veiculos_institucionais",
                columns: new[] { "veiculo_id", "data_hora_saida" });

            migrationBuilder.CreateIndex(
                name: "IX_usos_veiculos_institucionais_atualizado_por_id",
                schema: "dbo",
                table: "usos_veiculos_institucionais",
                column: "atualizado_por_id");

            migrationBuilder.CreateIndex(
                name: "IX_usos_veiculos_institucionais_criado_por_id",
                schema: "dbo",
                table: "usos_veiculos_institucionais",
                column: "criado_por_id");

            migrationBuilder.CreateIndex(
                name: "ux_usos_institucionais_registro_acesso_id",
                schema: "dbo",
                table: "usos_veiculos_institucionais",
                column: "registro_acesso_id",
                unique: true,
                filter: "registro_acesso_id IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "fk_registros_acesso_pessoas_pessoa_id",
                schema: "dbo",
                table: "registros_acesso",
                column: "pessoa_id",
                principalSchema: "dbo",
                principalTable: "pessoas",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_registros_acesso_usuarios_atualizado_por_id",
                schema: "dbo",
                table: "registros_acesso",
                column: "atualizado_por_id",
                principalSchema: "dbo",
                principalTable: "usuarios",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_registros_acesso_usuarios_criado_por_id",
                schema: "dbo",
                table: "registros_acesso",
                column: "criado_por_id",
                principalSchema: "dbo",
                principalTable: "usuarios",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_registros_acesso_pessoas_pessoa_id",
                schema: "dbo",
                table: "registros_acesso");

            migrationBuilder.DropForeignKey(
                name: "fk_registros_acesso_usuarios_atualizado_por_id",
                schema: "dbo",
                table: "registros_acesso");

            migrationBuilder.DropForeignKey(
                name: "fk_registros_acesso_usuarios_criado_por_id",
                schema: "dbo",
                table: "registros_acesso");

            migrationBuilder.AddColumn<int>(
                name: "pessoa_id",
                schema: "dbo",
                table: "veiculos",
                type: "integer",
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE dbo.veiculos AS v
                SET pessoa_id = (
                    SELECT pv.pessoa_id
                    FROM dbo.pessoas_veiculos AS pv
                    WHERE pv.veiculo_id = v.id
                    ORDER BY pv.ativo DESC, pv.id
                    LIMIT 1
                );

                DO $$
                BEGIN
                    IF EXISTS (SELECT 1 FROM dbo.veiculos WHERE pessoa_id IS NULL) THEN
                        RAISE EXCEPTION 'Não é possível reverter AlignMvpDataModel: há veículo sem pessoa relacionada.';
                    END IF;
                END $$;
                """);

            migrationBuilder.AlterColumn<int>(
                name: "pessoa_id",
                schema: "dbo",
                table: "veiculos",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.DropTable(
                name: "pessoas_veiculos",
                schema: "dbo");

            migrationBuilder.DropTable(
                name: "usos_veiculos_institucionais",
                schema: "dbo");

            migrationBuilder.DropIndex(
                name: "ix_veiculos_institucional",
                schema: "dbo",
                table: "veiculos");

            migrationBuilder.DropIndex(
                name: "ux_veiculos_placa",
                schema: "dbo",
                table: "veiculos");

            migrationBuilder.DropCheckConstraint(
                name: "ck_veiculos_ano",
                schema: "dbo",
                table: "veiculos");

            migrationBuilder.DropCheckConstraint(
                name: "ck_veiculos_identificacao",
                schema: "dbo",
                table: "veiculos");

            migrationBuilder.DropIndex(
                name: "ix_registros_acesso_atualizado_por_id",
                schema: "dbo",
                table: "registros_acesso");

            migrationBuilder.DropIndex(
                name: "ix_registros_acesso_criado_por_id",
                schema: "dbo",
                table: "registros_acesso");

            migrationBuilder.DropIndex(
                name: "ix_registros_acesso_pessoa_id",
                schema: "dbo",
                table: "registros_acesso");

            migrationBuilder.DropIndex(
                name: "ux_pessoas_documento",
                schema: "dbo",
                table: "pessoas");

            migrationBuilder.DropIndex(
                name: "ux_pessoas_email",
                schema: "dbo",
                table: "pessoas");

            migrationBuilder.DropCheckConstraint(
                name: "ck_categorias_acesso_tempo_validade",
                schema: "dbo",
                table: "categorias_acesso");

            migrationBuilder.DropColumn(
                name: "eh_institucional",
                schema: "dbo",
                table: "veiculos");

            migrationBuilder.DropColumn(
                name: "identificacao_veiculo",
                schema: "dbo",
                table: "veiculos");

            migrationBuilder.DropColumn(
                name: "tipo",
                schema: "dbo",
                table: "veiculos");

            migrationBuilder.DropColumn(
                name: "atualizado_por_id",
                schema: "dbo",
                table: "registros_acesso");

            migrationBuilder.DropColumn(
                name: "criado_por_id",
                schema: "dbo",
                table: "registros_acesso");

            migrationBuilder.DropColumn(
                name: "data_alteracao",
                schema: "dbo",
                table: "registros_acesso");

            migrationBuilder.DropColumn(
                name: "data_criacao",
                schema: "dbo",
                table: "registros_acesso");

            migrationBuilder.DropColumn(
                name: "objetivo",
                schema: "dbo",
                table: "registros_acesso");

            migrationBuilder.DropColumn(
                name: "pessoa_id",
                schema: "dbo",
                table: "registros_acesso");

            migrationBuilder.AlterColumn<string>(
                name: "documento_numero",
                schema: "dbo",
                table: "pessoas",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20,
                oldNullable: true);

            migrationBuilder.RenameColumn(
                name: "documento_numero",
                schema: "dbo",
                table: "pessoas",
                newName: "documento");

            migrationBuilder.DropColumn(
                name: "documento_tipo",
                schema: "dbo",
                table: "pessoas");

            migrationBuilder.DropColumn(
                name: "tipo_vinculo",
                schema: "dbo",
                table: "pessoas");

            migrationBuilder.DropColumn(
                name: "data_alteracao",
                schema: "dbo",
                table: "perfis");

            migrationBuilder.DropColumn(
                name: "data_criacao",
                schema: "dbo",
                table: "perfis");

            migrationBuilder.DropColumn(
                name: "data_alteracao",
                schema: "dbo",
                table: "categorias_acesso");

            migrationBuilder.DropColumn(
                name: "data_criacao",
                schema: "dbo",
                table: "categorias_acesso");

            migrationBuilder.DropColumn(
                name: "dados_anteriores",
                schema: "dbo",
                table: "auditorias");

            migrationBuilder.DropColumn(
                name: "dados_novos",
                schema: "dbo",
                table: "auditorias");

            migrationBuilder.RenameColumn(
                name: "entidade",
                schema: "dbo",
                table: "auditorias",
                newName: "tabela");

            migrationBuilder.RenameIndex(
                name: "ix_auditorias_entidade_registro_id",
                schema: "dbo",
                table: "auditorias",
                newName: "ix_auditorias_tabela_registro_id");

            migrationBuilder.AlterColumn<string>(
                name: "placa",
                schema: "dbo",
                table: "veiculos",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(10)",
                oldMaxLength: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "modelo",
                schema: "dbo",
                table: "veiculos",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "marca",
                schema: "dbo",
                table: "veiculos",
                type: "character varying(80)",
                maxLength: 80,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(80)",
                oldMaxLength: 80,
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "data_criacao",
                schema: "dbo",
                table: "veiculos",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP",
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<string>(
                name: "cor",
                schema: "dbo",
                table: "veiculos",
                type: "character varying(40)",
                maxLength: 40,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(40)",
                oldMaxLength: 40,
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "ano",
                schema: "dbo",
                table: "veiculos",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "nome",
                schema: "dbo",
                table: "pessoas",
                type: "character varying(150)",
                maxLength: 150,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(200)",
                oldMaxLength: 200);

            migrationBuilder.AlterColumn<string>(
                name: "email",
                schema: "dbo",
                table: "pessoas",
                type: "character varying(254)",
                maxLength: 254,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(254)",
                oldMaxLength: 254,
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "data_criacao",
                schema: "dbo",
                table: "pessoas",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP",
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<string>(
                name: "descricao",
                schema: "dbo",
                table: "perfis",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "tempo_validade_dias",
                schema: "dbo",
                table: "categorias_acesso",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "descricao",
                schema: "dbo",
                table: "categorias_acesso",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "detalhes",
                schema: "dbo",
                table: "auditorias",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

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

            migrationBuilder.AddCheckConstraint(
                name: "ck_veiculos_ano",
                schema: "dbo",
                table: "veiculos",
                sql: "ano > 0");

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

            migrationBuilder.AddCheckConstraint(
                name: "ck_categorias_acesso_tempo_validade",
                schema: "dbo",
                table: "categorias_acesso",
                sql: "tempo_validade_dias >= 0");

            migrationBuilder.AddForeignKey(
                name: "fk_veiculos_pessoas_pessoa_id",
                schema: "dbo",
                table: "veiculos",
                column: "pessoa_id",
                principalSchema: "dbo",
                principalTable: "pessoas",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}

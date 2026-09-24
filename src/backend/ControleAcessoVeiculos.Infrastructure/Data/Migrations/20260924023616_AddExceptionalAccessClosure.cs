using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ControleAcessoVeiculos.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddExceptionalAccessClosure : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "data_hora_regularizacao",
                schema: "dbo",
                table: "registros_acesso",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "motivo_encerramento_excepcional",
                schema: "dbo",
                table: "registros_acesso",
                type: "character varying(40)",
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "observacao_encerramento_excepcional",
                schema: "dbo",
                table: "registros_acesso",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "tipo_encerramento",
                schema: "dbo",
                table: "registros_acesso",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_registros_acesso_data_regularizacao",
                schema: "dbo",
                table: "registros_acesso",
                column: "data_hora_regularizacao");

            migrationBuilder.Sql(
                """
                UPDATE dbo.registros_acesso
                SET tipo_encerramento = 'Regular'
                WHERE status = 'Encerrado';
                """);

            migrationBuilder.AddCheckConstraint(
                name: "ck_registros_acesso_encerramento",
                schema: "dbo",
                table: "registros_acesso",
                sql: "(status <> 'Encerrado' AND tipo_encerramento IS NULL AND motivo_encerramento_excepcional IS NULL AND observacao_encerramento_excepcional IS NULL AND data_hora_regularizacao IS NULL) OR (status = 'Encerrado' AND atualizado_por_id IS NOT NULL AND ((tipo_encerramento = 'Regular' AND data_hora_saida IS NOT NULL AND motivo_encerramento_excepcional IS NULL AND observacao_encerramento_excepcional IS NULL AND data_hora_regularizacao IS NULL) OR (tipo_encerramento = 'Excepcional' AND motivo_encerramento_excepcional IS NOT NULL AND observacao_encerramento_excepcional IS NOT NULL AND data_hora_regularizacao IS NOT NULL)))");

            migrationBuilder.AddCheckConstraint(
                name: "ck_registros_acesso_periodo_regularizacao",
                schema: "dbo",
                table: "registros_acesso",
                sql: "data_hora_regularizacao IS NULL OR (data_hora_regularizacao >= data_hora_entrada AND (data_hora_saida IS NULL OR data_hora_saida <= data_hora_regularizacao))");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_registros_acesso_data_regularizacao",
                schema: "dbo",
                table: "registros_acesso");

            migrationBuilder.DropCheckConstraint(
                name: "ck_registros_acesso_encerramento",
                schema: "dbo",
                table: "registros_acesso");

            migrationBuilder.DropCheckConstraint(
                name: "ck_registros_acesso_periodo_regularizacao",
                schema: "dbo",
                table: "registros_acesso");

            migrationBuilder.DropColumn(
                name: "data_hora_regularizacao",
                schema: "dbo",
                table: "registros_acesso");

            migrationBuilder.DropColumn(
                name: "motivo_encerramento_excepcional",
                schema: "dbo",
                table: "registros_acesso");

            migrationBuilder.DropColumn(
                name: "observacao_encerramento_excepcional",
                schema: "dbo",
                table: "registros_acesso");

            migrationBuilder.DropColumn(
                name: "tipo_encerramento",
                schema: "dbo",
                table: "registros_acesso");
        }
    }
}

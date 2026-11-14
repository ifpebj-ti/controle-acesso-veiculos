using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ControleAcessoVeiculos.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class GuardCampusRegistryAndIndexDailySuggestions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "ix_registros_acesso_operador_pessoa_veiculo_data",
                schema: "dbo",
                table: "registros_acesso",
                columns: new[] { "criado_por_id", "pessoa_id", "veiculo_id", "data_hora_entrada" });

            migrationBuilder.AddCheckConstraint(
                name: "ck_pessoas_cadastro_campus_completo",
                schema: "dbo",
                table: "pessoas",
                sql: "NOT cadastro_campus_ativo OR (data_nascimento IS NOT NULL AND cadastro_campus_conferido_em IS NOT NULL AND cadastro_campus_conferido_por_id IS NOT NULL AND tipo_vinculo IN ('Aluno', 'Terceirizado', 'Federal'))");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_registros_acesso_operador_pessoa_veiculo_data",
                schema: "dbo",
                table: "registros_acesso");

            migrationBuilder.DropCheckConstraint(
                name: "ck_pessoas_cadastro_campus_completo",
                schema: "dbo",
                table: "pessoas");
        }
    }
}

using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ControleAcessoVeiculos.Infrastructure.Data.Configurations;

public class RegistroAcessoConfiguration : IEntityTypeConfiguration<RegistroAcesso>
{
    public void Configure(EntityTypeBuilder<RegistroAcesso> builder)
    {
        builder.ToTable("registros_acesso", "dbo", table =>
            table.HasCheckConstraint(
                "ck_registros_acesso_periodo",
                "data_hora_saida IS NULL OR data_hora_saida >= data_hora_entrada"));

        builder.HasKey(registro => registro.Id)
            .HasName("pk_registros_acesso");

        builder.Property(registro => registro.Id)
            .HasColumnName("id")
            .HasColumnType("integer")
            .ValueGeneratedOnAdd();

        builder.Property(registro => registro.VeiculoId)
            .HasColumnName("veiculo_id")
            .HasColumnType("integer")
            .IsRequired();

        builder.Property(registro => registro.PessoaId)
            .HasColumnName("pessoa_id")
            .HasColumnType("integer")
            .IsRequired();

        builder.Property(registro => registro.CategoriaAcessoId)
            .HasColumnName("categoria_acesso_id")
            .HasColumnType("integer")
            .IsRequired();

        builder.Property(registro => registro.DataHoraEntrada)
            .HasColumnName("data_hora_entrada")
            .HasColumnType("timestamp with time zone")
            .IsRequired();

        builder.Property(registro => registro.DataHoraSaida)
            .HasColumnName("data_hora_saida")
            .HasColumnType("timestamp with time zone");

        builder.Property(registro => registro.Objetivo)
            .HasColumnName("objetivo")
            .HasColumnType("character varying(500)")
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(registro => registro.Status)
            .HasColumnName("status")
            .HasColumnType("character varying(20)")
            .HasMaxLength(20)
            .HasConversion<string>()
            .IsRequired();

        builder.Property(registro => registro.CriadoPorId)
            .HasColumnName("criado_por_id")
            .HasColumnType("integer")
            .IsRequired();

        builder.Property(registro => registro.AtualizadoPorId)
            .HasColumnName("atualizado_por_id")
            .HasColumnType("integer");

        builder.Property(registro => registro.Observacao)
            .HasColumnName("observacao")
            .HasColumnType("character varying(1000)")
            .HasMaxLength(1000);

        builder.Property(registro => registro.DataCriacao)
            .HasColumnName("data_criacao")
            .HasColumnType("timestamp with time zone")
            .IsRequired();

        builder.Property(registro => registro.DataAlteracao)
            .HasColumnName("data_alteracao")
            .HasColumnType("timestamp with time zone");

        builder.HasIndex(registro => new { registro.VeiculoId, registro.DataHoraEntrada })
            .HasDatabaseName("ix_registros_acesso_veiculo_data_entrada");

        builder.HasIndex(registro => registro.CategoriaAcessoId)
            .HasDatabaseName("ix_registros_acesso_categoria_id");

        builder.HasIndex(registro => registro.PessoaId)
            .HasDatabaseName("ix_registros_acesso_pessoa_id");

        builder.HasIndex(registro => registro.CriadoPorId)
            .HasDatabaseName("ix_registros_acesso_criado_por_id");

        builder.HasIndex(registro => registro.AtualizadoPorId)
            .HasDatabaseName("ix_registros_acesso_atualizado_por_id");

        builder.HasIndex(registro => registro.Status)
            .HasDatabaseName("ix_registros_acesso_status");

        builder.HasOne<Veiculo>()
            .WithMany()
            .HasForeignKey(registro => registro.VeiculoId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_registros_acesso_veiculos_veiculo_id");

        builder.HasOne<CategoriaAcesso>()
            .WithMany()
            .HasForeignKey(registro => registro.CategoriaAcessoId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_registros_acesso_categorias_categoria_id");

        builder.HasOne<Pessoa>()
            .WithMany()
            .HasForeignKey(registro => registro.PessoaId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_registros_acesso_pessoas_pessoa_id");

        builder.HasOne<Usuario>()
            .WithMany()
            .HasForeignKey(registro => registro.CriadoPorId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_registros_acesso_usuarios_criado_por_id");

        builder.HasOne<Usuario>()
            .WithMany()
            .HasForeignKey(registro => registro.AtualizadoPorId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_registros_acesso_usuarios_atualizado_por_id");
    }
}

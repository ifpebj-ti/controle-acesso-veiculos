using ControleAcessoVeiculos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ControleAcessoVeiculos.Infrastructure.Data.Configurations;

public sealed class MotoristaInstitucionalConfiguration :
    IEntityTypeConfiguration<MotoristaInstitucional>
{
    public void Configure(EntityTypeBuilder<MotoristaInstitucional> builder)
    {
        builder.ToTable("motoristas_institucionais", "dbo");

        builder.HasKey(driver => driver.Id)
            .HasName("pk_motoristas_institucionais");

        builder.Property(driver => driver.Id)
            .HasColumnName("id")
            .HasColumnType("integer")
            .ValueGeneratedOnAdd();

        builder.Property(driver => driver.PessoaId)
            .HasColumnName("pessoa_id")
            .HasColumnType("integer")
            .IsRequired();

        builder.Property(driver => driver.Ativo)
            .HasColumnName("ativo")
            .HasColumnType("boolean")
            .HasDefaultValue(true)
            .IsRequired();

        builder.Property(driver => driver.CriadoPorId)
            .HasColumnName("criado_por_id")
            .HasColumnType("integer")
            .IsRequired();

        builder.Property(driver => driver.AtualizadoPorId)
            .HasColumnName("atualizado_por_id")
            .HasColumnType("integer");

        builder.Property(driver => driver.DataCriacao)
            .HasColumnName("data_criacao")
            .HasColumnType("timestamp with time zone")
            .IsRequired();

        builder.Property(driver => driver.DataAlteracao)
            .HasColumnName("data_alteracao")
            .HasColumnType("timestamp with time zone");

        builder.HasIndex(driver => driver.PessoaId)
            .IsUnique()
            .HasDatabaseName("ux_motoristas_institucionais_pessoa_id");

        builder.HasIndex(driver => driver.Ativo)
            .HasDatabaseName("ix_motoristas_institucionais_ativo");

        builder.HasIndex(driver => driver.CriadoPorId)
            .HasDatabaseName("ix_motoristas_institucionais_criado_por_id");

        builder.HasIndex(driver => driver.AtualizadoPorId)
            .HasDatabaseName("ix_motoristas_institucionais_atualizado_por_id");

        builder.HasOne<Pessoa>()
            .WithOne()
            .HasForeignKey<MotoristaInstitucional>(driver => driver.PessoaId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_motoristas_institucionais_pessoas");

        builder.HasOne<Usuario>()
            .WithMany()
            .HasForeignKey(driver => driver.CriadoPorId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_motoristas_institucionais_usuarios_criado_por");

        builder.HasOne<Usuario>()
            .WithMany()
            .HasForeignKey(driver => driver.AtualizadoPorId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_motoristas_institucionais_usuarios_atualizado_por");
    }
}

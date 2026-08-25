using ControleAcessoVeiculos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ControleAcessoVeiculos.Infrastructure.Data.Configurations;

public class PessoaConfiguration : IEntityTypeConfiguration<Pessoa>
{
    public void Configure(EntityTypeBuilder<Pessoa> builder)
    {
        builder.ToTable("pessoas", "dbo");

        builder.HasKey(pessoa => pessoa.Id)
            .HasName("pk_pessoas");

        builder.Property(pessoa => pessoa.Id)
            .HasColumnName("id")
            .HasColumnType("integer")
            .ValueGeneratedOnAdd();

        builder.Property(pessoa => pessoa.Nome)
            .HasColumnName("nome")
            .HasColumnType("character varying(150)")
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(pessoa => pessoa.Email)
            .HasColumnName("email")
            .HasColumnType("character varying(254)")
            .HasMaxLength(254)
            .IsRequired();

        builder.Property(pessoa => pessoa.Documento)
            .HasColumnName("documento")
            .HasColumnType("character varying(20)")
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(pessoa => pessoa.Ativo)
            .HasColumnName("ativo")
            .HasColumnType("boolean")
            .HasDefaultValue(true)
            .IsRequired();

        builder.Property(pessoa => pessoa.DataCriacao)
            .HasColumnName("data_criacao")
            .HasColumnType("timestamp with time zone")
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.Property(pessoa => pessoa.DataAlteracao)
            .HasColumnName("data_alteracao")
            .HasColumnType("timestamp with time zone");

        builder.HasIndex(pessoa => pessoa.Email)
            .IsUnique()
            .HasDatabaseName("ux_pessoas_email");

        builder.HasIndex(pessoa => pessoa.Documento)
            .IsUnique()
            .HasDatabaseName("ux_pessoas_documento");

        builder.HasIndex(pessoa => pessoa.Ativo)
            .HasDatabaseName("ix_pessoas_ativo");
    }
}

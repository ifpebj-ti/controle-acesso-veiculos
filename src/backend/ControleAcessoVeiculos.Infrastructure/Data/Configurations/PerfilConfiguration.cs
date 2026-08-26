using ControleAcessoVeiculos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ControleAcessoVeiculos.Infrastructure.Data.Configurations;

public class PerfilConfiguration : IEntityTypeConfiguration<Perfil>
{
    public void Configure(EntityTypeBuilder<Perfil> builder)
    {
        builder.ToTable("perfis", "dbo");

        builder.HasKey(perfil => perfil.Id)
            .HasName("pk_perfis");

        builder.Property(perfil => perfil.Id)
            .HasColumnName("id")
            .HasColumnType("integer")
            .ValueGeneratedOnAdd();

        builder.Property(perfil => perfil.Nome)
            .HasColumnName("nome")
            .HasColumnType("character varying(100)")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(perfil => perfil.Descricao)
            .HasColumnName("descricao")
            .HasColumnType("character varying(500)")
            .HasMaxLength(500);

        builder.Property(perfil => perfil.Ativo)
            .HasColumnName("ativo")
            .HasColumnType("boolean")
            .HasDefaultValue(true)
            .IsRequired();

        builder.Property(perfil => perfil.DataCriacao)
            .HasColumnName("data_criacao")
            .HasColumnType("timestamp with time zone")
            .IsRequired();

        builder.Property(perfil => perfil.DataAlteracao)
            .HasColumnName("data_alteracao")
            .HasColumnType("timestamp with time zone");

        builder.HasIndex(perfil => perfil.Nome)
            .IsUnique()
            .HasDatabaseName("ux_perfis_nome");

        builder.HasIndex(perfil => perfil.Ativo)
            .HasDatabaseName("ix_perfis_ativo");
    }
}

using ControleAcessoVeiculos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ControleAcessoVeiculos.Infrastructure.Data.Configurations;

public class CategoriaAcessoConfiguration : IEntityTypeConfiguration<CategoriaAcesso>
{
    public void Configure(EntityTypeBuilder<CategoriaAcesso> builder)
    {
        builder.ToTable("categorias_acesso", "dbo", table =>
            table.HasCheckConstraint("ck_categorias_acesso_tempo_validade", "tempo_validade_dias >= 0"));

        builder.HasKey(categoria => categoria.Id)
            .HasName("pk_categorias_acesso");

        builder.Property(categoria => categoria.Id)
            .HasColumnName("id")
            .HasColumnType("integer")
            .ValueGeneratedOnAdd();

        builder.Property(categoria => categoria.Nome)
            .HasColumnName("nome")
            .HasColumnType("character varying(100)")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(categoria => categoria.Descricao)
            .HasColumnName("descricao")
            .HasColumnType("character varying(500)")
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(categoria => categoria.TempoValidadeDias)
            .HasColumnName("tempo_validade_dias")
            .HasColumnType("integer")
            .IsRequired();

        builder.Property(categoria => categoria.Ativo)
            .HasColumnName("ativo")
            .HasColumnType("boolean")
            .HasDefaultValue(true)
            .IsRequired();

        builder.HasIndex(categoria => categoria.Nome)
            .IsUnique()
            .HasDatabaseName("ux_categorias_acesso_nome");

        builder.HasIndex(categoria => categoria.Ativo)
            .HasDatabaseName("ix_categorias_acesso_ativo");
    }
}

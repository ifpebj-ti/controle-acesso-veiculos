using ControleAcessoVeiculos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ControleAcessoVeiculos.Infrastructure.Data.Configurations;

public class VeiculoConfiguration : IEntityTypeConfiguration<Veiculo>
{
    public void Configure(EntityTypeBuilder<Veiculo> builder)
    {
        builder.ToTable("veiculos", "dbo", table =>
        {
            table.HasCheckConstraint(
                "ck_veiculos_identificacao",
                "placa IS NOT NULL OR identificacao_veiculo IS NOT NULL");
            table.HasCheckConstraint(
                "ck_veiculos_ano",
                "ano IS NULL OR ano > 0");
        });

        builder.HasKey(veiculo => veiculo.Id)
            .HasName("pk_veiculos");

        builder.Property(veiculo => veiculo.Id)
            .HasColumnName("id")
            .HasColumnType("integer")
            .ValueGeneratedOnAdd();

        builder.Property(veiculo => veiculo.Placa)
            .HasColumnName("placa")
            .HasColumnType("character varying(10)")
            .HasMaxLength(10);

        builder.Property(veiculo => veiculo.Tipo)
            .HasColumnName("tipo")
            .HasColumnType("character varying(50)")
            .HasMaxLength(50);

        builder.Property(veiculo => veiculo.IdentificacaoVeiculo)
            .HasColumnName("identificacao_veiculo")
            .HasColumnType("character varying(100)")
            .HasMaxLength(100);

        builder.Property(veiculo => veiculo.EhInstitucional)
            .HasColumnName("eh_institucional")
            .HasColumnType("boolean")
            .HasDefaultValue(false)
            .IsRequired();

        builder.Property(veiculo => veiculo.Marca)
            .HasColumnName("marca")
            .HasColumnType("character varying(80)")
            .HasMaxLength(80);

        builder.Property(veiculo => veiculo.Modelo)
            .HasColumnName("modelo")
            .HasColumnType("character varying(100)")
            .HasMaxLength(100);

        builder.Property(veiculo => veiculo.Cor)
            .HasColumnName("cor")
            .HasColumnType("character varying(40)")
            .HasMaxLength(40);

        builder.Property(veiculo => veiculo.Ano)
            .HasColumnName("ano")
            .HasColumnType("integer");

        builder.Property(veiculo => veiculo.Ativo)
            .HasColumnName("ativo")
            .HasColumnType("boolean")
            .HasDefaultValue(true)
            .IsRequired();

        builder.Property(veiculo => veiculo.DataCriacao)
            .HasColumnName("data_criacao")
            .HasColumnType("timestamp with time zone")
            .IsRequired();

        builder.Property(veiculo => veiculo.DataAlteracao)
            .HasColumnName("data_alteracao")
            .HasColumnType("timestamp with time zone");

        builder.HasIndex(veiculo => veiculo.Placa)
            .IsUnique()
            .HasFilter("placa IS NOT NULL")
            .HasDatabaseName("ux_veiculos_placa");

        builder.HasIndex(veiculo => veiculo.IdentificacaoVeiculo)
            .IsUnique()
            .HasFilter("identificacao_veiculo IS NOT NULL AND eh_institucional = TRUE")
            .HasDatabaseName("ux_veiculos_identificacao_institucional");

        builder.HasIndex(veiculo => veiculo.EhInstitucional)
            .HasDatabaseName("ix_veiculos_institucional");

        builder.HasIndex(veiculo => veiculo.Ativo)
            .HasDatabaseName("ix_veiculos_ativo");
    }
}

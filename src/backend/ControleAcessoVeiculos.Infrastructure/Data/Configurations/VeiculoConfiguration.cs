using ControleAcessoVeiculos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ControleAcessoVeiculos.Infrastructure.Data.Configurations;

public class VeiculoConfiguration : IEntityTypeConfiguration<Veiculo>
{
    public void Configure(EntityTypeBuilder<Veiculo> builder)
    {
        builder.ToTable("veiculos", "dbo", table =>
            table.HasCheckConstraint("ck_veiculos_ano", "ano > 0"));

        builder.HasKey(veiculo => veiculo.Id)
            .HasName("pk_veiculos");

        builder.Property(veiculo => veiculo.Id)
            .HasColumnName("id")
            .HasColumnType("integer")
            .ValueGeneratedOnAdd();

        builder.Property(veiculo => veiculo.Placa)
            .HasColumnName("placa")
            .HasColumnType("character varying(10)")
            .HasMaxLength(10)
            .IsRequired();

        builder.Property(veiculo => veiculo.Marca)
            .HasColumnName("marca")
            .HasColumnType("character varying(80)")
            .HasMaxLength(80)
            .IsRequired();

        builder.Property(veiculo => veiculo.Modelo)
            .HasColumnName("modelo")
            .HasColumnType("character varying(100)")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(veiculo => veiculo.Cor)
            .HasColumnName("cor")
            .HasColumnType("character varying(40)")
            .HasMaxLength(40)
            .IsRequired();

        builder.Property(veiculo => veiculo.Ano)
            .HasColumnName("ano")
            .HasColumnType("integer")
            .IsRequired();

        builder.Property(veiculo => veiculo.PessoaId)
            .HasColumnName("pessoa_id")
            .HasColumnType("integer")
            .IsRequired();

        builder.Property(veiculo => veiculo.Ativo)
            .HasColumnName("ativo")
            .HasColumnType("boolean")
            .HasDefaultValue(true)
            .IsRequired();

        builder.Property(veiculo => veiculo.DataCriacao)
            .HasColumnName("data_criacao")
            .HasColumnType("timestamp with time zone")
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.Property(veiculo => veiculo.DataAlteracao)
            .HasColumnName("data_alteracao")
            .HasColumnType("timestamp with time zone");

        builder.HasIndex(veiculo => veiculo.Placa)
            .IsUnique()
            .HasDatabaseName("ux_veiculos_placa");

        builder.HasIndex(veiculo => veiculo.PessoaId)
            .HasDatabaseName("ix_veiculos_pessoa_id");

        builder.HasIndex(veiculo => veiculo.Ativo)
            .HasDatabaseName("ix_veiculos_ativo");

        builder.HasOne<Pessoa>()
            .WithMany()
            .HasForeignKey(veiculo => veiculo.PessoaId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_veiculos_pessoas_pessoa_id");
    }
}

using ControleAcessoVeiculos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ControleAcessoVeiculos.Infrastructure.Data.Configurations;

public sealed class AutorizacaoVeiculoEventoConfiguration :
    IEntityTypeConfiguration<AutorizacaoVeiculoEvento>
{
    public void Configure(EntityTypeBuilder<AutorizacaoVeiculoEvento> builder)
    {
        builder.ToTable("autorizacoes_veiculos_eventos", "dbo", table =>
            table.HasCheckConstraint(
                "ck_autorizacoes_veiculos_eventos_quantidade",
                "quantidade > 0 AND (placa IS NULL OR quantidade = 1)"));

        builder.HasKey(regra => regra.Id)
            .HasName("pk_autorizacoes_veiculos_eventos");
        builder.Property(regra => regra.Id)
            .HasColumnName("id")
            .HasColumnType("integer")
            .ValueGeneratedOnAdd();
        builder.Property(regra => regra.EventoAcessoId)
            .HasColumnName("evento_acesso_id")
            .HasColumnType("integer")
            .IsRequired();
        builder.Property(regra => regra.TipoVeiculo)
            .HasColumnName("tipo_veiculo")
            .HasColumnType("character varying(50)")
            .HasMaxLength(50)
            .IsRequired();
        builder.Property(regra => regra.Quantidade)
            .HasColumnName("quantidade")
            .HasColumnType("integer")
            .IsRequired();
        builder.Property(regra => regra.Placa)
            .HasColumnName("placa")
            .HasColumnType("character varying(10)")
            .HasMaxLength(10);

        builder.HasIndex(regra => regra.EventoAcessoId)
            .HasDatabaseName("ix_autorizacoes_veiculos_eventos_evento_id");
        builder.HasIndex(regra => new { regra.EventoAcessoId, regra.Placa })
            .IsUnique()
            .HasFilter("placa IS NOT NULL")
            .HasDatabaseName("ux_autorizacoes_veiculos_eventos_evento_placa");
        builder.HasIndex(regra => new { regra.EventoAcessoId, regra.TipoVeiculo })
            .IsUnique()
            .HasFilter("placa IS NULL")
            .HasDatabaseName("ux_autorizacoes_veiculos_eventos_evento_tipo_sem_placa");

        builder.HasOne<EventoAcesso>()
            .WithMany()
            .HasForeignKey(regra => regra.EventoAcessoId)
            .OnDelete(DeleteBehavior.Cascade)
            .HasConstraintName("fk_autorizacoes_veiculos_eventos_eventos_acesso");
    }
}

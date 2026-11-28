using ControleAcessoVeiculos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ControleAcessoVeiculos.Infrastructure.Data.Configurations;

public sealed class ReconciliacaoContingenciaConfiguration : IEntityTypeConfiguration<ReconciliacaoContingencia>
{
    public void Configure(EntityTypeBuilder<ReconciliacaoContingencia> b)
    {
        b.ToTable("reconciliacoes_contingencia", "dbo", t =>
        {
            t.HasCheckConstraint("ck_reconciliacoes_linha", "numero_linha > 0");
            t.HasCheckConstraint("ck_reconciliacoes_datas", "entrada_observada_utc <= digitado_em_utc AND " +
                "(saida_observada_utc IS NULL OR (saida_observada_utc >= entrada_observada_utc AND saida_observada_utc <= digitado_em_utc))");
            t.HasCheckConstraint("ck_reconciliacoes_conferencia", "(status = 'Pendente' AND conferido_por_id IS NULL AND conferido_em_utc IS NULL AND motivo_conferencia IS NULL) OR " +
                "(status IN ('Conferida','Recusada') AND conferido_por_id IS NOT NULL AND conferido_por_id <> digitado_por_id AND conferido_em_utc IS NOT NULL AND conferido_em_utc >= digitado_em_utc AND motivo_conferencia IS NOT NULL)");
        });
        b.HasKey(x => x.RegistroAcessoId);
        b.Property(x => x.RegistroAcessoId).HasColumnName("registro_acesso_id").ValueGeneratedNever();
        b.Property(x => x.IncidenteId).HasColumnName("incidente_id");
        b.Property(x => x.NumeroLinha).HasColumnName("numero_linha");
        b.Property(x => x.ChaveIntencao).HasColumnName("chave_intencao");
        b.Property(x => x.AssinaturaIntencao).HasColumnName("assinatura_intencao").HasMaxLength(64).IsRequired();
        b.Property(x => x.ReferenciaAutorPapel).HasColumnName("referencia_autor_papel").HasMaxLength(120).IsRequired();
        b.Property(x => x.DigitadoPorId).HasColumnName("digitado_por_id");
        b.Property(x => x.EntradaObservadaUtc).HasColumnName("entrada_observada_utc");
        b.Property(x => x.SaidaObservadaNoPapelUtc).HasColumnName("saida_observada_utc");
        b.Property(x => x.DigitadoEmUtc).HasColumnName("digitado_em_utc");
        b.Property(x => x.Justificativa).HasColumnName("justificativa").HasMaxLength(500).IsRequired();
        b.Property(x => x.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(20);
        b.Property(x => x.ConferidoPorId).HasColumnName("conferido_por_id");
        b.Property(x => x.ConferidoEmUtc).HasColumnName("conferido_em_utc");
        b.Property(x => x.MotivoConferencia).HasColumnName("motivo_conferencia").HasMaxLength(500);
        b.HasIndex(x => new { x.IncidenteId, x.NumeroLinha }).IsUnique();
        b.HasIndex(x => new { x.DigitadoPorId, x.ChaveIntencao }).IsUnique();
        b.HasIndex(x => new { x.Status, x.DigitadoEmUtc, x.RegistroAcessoId });
        b.HasOne<IncidenteContingencia>().WithMany().HasForeignKey(x => x.IncidenteId).HasPrincipalKey(x => x.ChaveIncidente).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<RegistroAcesso>().WithOne().HasForeignKey<ReconciliacaoContingencia>(x => x.RegistroAcessoId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<Usuario>().WithMany().HasForeignKey(x => x.DigitadoPorId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<Usuario>().WithMany().HasForeignKey(x => x.ConferidoPorId).OnDelete(DeleteBehavior.Restrict);
    }
}

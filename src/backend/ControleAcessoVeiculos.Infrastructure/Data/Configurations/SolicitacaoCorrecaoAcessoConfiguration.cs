using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ControleAcessoVeiculos.Infrastructure.Data.Configurations;

public sealed class SolicitacaoCorrecaoAcessoConfiguration : IEntityTypeConfiguration<SolicitacaoCorrecaoAcesso>
{
    public void Configure(EntityTypeBuilder<SolicitacaoCorrecaoAcesso> builder)
    {
        builder.ToTable("solicitacoes_correcao_acesso", "dbo", table =>
        {
            table.HasCheckConstraint("ck_solicitacao_correcao_chave",
                "chave_requisicao <> '00000000-0000-0000-0000-000000000000'::uuid");
            table.HasCheckConstraint("ck_solicitacao_correcao_estado",
                "(status = 'Pendente' AND decidido_por_id IS NULL AND decidido_em_utc IS NULL AND motivo_decisao IS NULL) OR " +
                "(status IN ('Aprovada', 'Rejeitada', 'Cancelada') AND decidido_por_id IS NOT NULL AND " +
                "decidido_em_utc IS NOT NULL AND decidido_em_utc >= solicitado_em_utc AND motivo_decisao IS NOT NULL AND " +
                "((status = 'Cancelada' AND decidido_por_id = solicitado_por_id) OR " +
                "(status <> 'Cancelada' AND decidido_por_id <> solicitado_por_id)))");
            table.HasCheckConstraint("ck_solicitacao_correcao_motivos",
                "length(btrim(justificativa)) BETWEEN 10 AND 500 AND " +
                "(motivo_decisao IS NULL OR length(btrim(motivo_decisao)) BETWEEN 10 AND 500)");
        });
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.ChaveRequisicao).HasColumnName("chave_requisicao");
        builder.Property(x => x.RegistroAcessoId).HasColumnName("registro_acesso_id");
        builder.Property(x => x.SolicitadoPorId).HasColumnName("solicitado_por_id");
        builder.Property(x => x.SolicitadoEmUtc).HasColumnName("solicitado_em_utc");
        builder.Property(x => x.Justificativa).HasColumnName("justificativa").HasMaxLength(500).IsRequired();
        builder.Property(x => x.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(20);
        builder.Property(x => x.DecididoPorId).HasColumnName("decidido_por_id");
        builder.Property(x => x.DecididoEmUtc).HasColumnName("decidido_em_utc");
        builder.Property(x => x.MotivoDecisao).HasColumnName("motivo_decisao").HasMaxLength(500);
        builder.OwnsOne(x => x.Original, snapshot => ConfigureValues(snapshot, "original"));
        builder.OwnsOne(x => x.Proposto, snapshot => ConfigureValues(snapshot, "proposto"));
        builder.Navigation(x => x.Original).IsRequired();
        builder.Navigation(x => x.Proposto).IsRequired();
        builder.HasIndex(x => new { x.SolicitadoPorId, x.ChaveRequisicao }).IsUnique();
        builder.HasIndex(x => x.RegistroAcessoId).IsUnique().HasFilter("status = 'Pendente'");
        builder.HasIndex(x => new { x.Status, x.SolicitadoEmUtc, x.Id });
        builder.HasOne<RegistroAcesso>().WithMany().HasForeignKey(x => x.RegistroAcessoId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Usuario>().WithMany().HasForeignKey(x => x.SolicitadoPorId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Usuario>().WithMany().HasForeignKey(x => x.DecididoPorId).OnDelete(DeleteBehavior.Restrict);
    }

    private static void ConfigureValues(
        OwnedNavigationBuilder<SolicitacaoCorrecaoAcesso, ValoresDescritivosAcesso> snapshot, string prefix)
    {
        snapshot.Property(x => x.CategoriaAcessoId).HasColumnName($"{prefix}_categoria_id");
        snapshot.Property(x => x.Objetivo).HasColumnName($"{prefix}_objetivo").HasMaxLength(500).IsRequired();
        snapshot.Property(x => x.Observacao).HasColumnName($"{prefix}_observacao").HasMaxLength(1000);
        snapshot.HasOne<CategoriaAcesso>().WithMany().HasForeignKey(x => x.CategoriaAcessoId).OnDelete(DeleteBehavior.Restrict);
    }
}

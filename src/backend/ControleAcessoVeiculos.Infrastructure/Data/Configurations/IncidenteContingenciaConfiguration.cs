using ControleAcessoVeiculos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ControleAcessoVeiculos.Infrastructure.Data.Configurations;

public sealed class IncidenteContingenciaConfiguration : IEntityTypeConfiguration<IncidenteContingencia>
{
    public void Configure(EntityTypeBuilder<IncidenteContingencia> b)
    {
        b.ToTable("incidentes_contingencia", "dbo", t => t.HasCheckConstraint(
            "ck_incidentes_contingencia_datas", "inicio_utc <= fim_utc AND fim_utc <= criado_em_utc"));
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();
        b.Property(x => x.ChaveIncidente).HasColumnName("chave_incidente");
        b.HasAlternateKey(x => x.ChaveIncidente);
        b.Property(x => x.ReferenciaPapel).HasColumnName("referencia_papel").HasMaxLength(120).IsRequired();
        b.Property(x => x.InicioUtc).HasColumnName("inicio_utc");
        b.Property(x => x.FimUtc).HasColumnName("fim_utc");
        b.Property(x => x.CriadoPorId).HasColumnName("criado_por_id");
        b.Property(x => x.CriadoEmUtc).HasColumnName("criado_em_utc");
        b.HasIndex(x => new { x.InicioUtc, x.Id });
        b.HasOne<Usuario>().WithMany().HasForeignKey(x => x.CriadoPorId).OnDelete(DeleteBehavior.Restrict);
    }
}

using ControleAcessoVeiculos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ControleAcessoVeiculos.Infrastructure.Data.Configurations;

public class AuditoriaConfiguration : IEntityTypeConfiguration<Auditoria>
{
    public void Configure(EntityTypeBuilder<Auditoria> builder)
    {
        builder.ToTable("auditorias", "dbo");

        builder.HasKey(auditoria => auditoria.Id)
            .HasName("pk_auditorias");

        builder.Property(auditoria => auditoria.Id)
            .HasColumnName("id")
            .HasColumnType("integer")
            .ValueGeneratedOnAdd();

        builder.Property(auditoria => auditoria.DataHora)
            .HasColumnName("data_hora")
            .HasColumnType("timestamp with time zone")
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.Property(auditoria => auditoria.TipoAcao)
            .HasColumnName("tipo_acao")
            .HasColumnType("character varying(20)")
            .HasMaxLength(20)
            .HasConversion<string>()
            .IsRequired();

        builder.Property(auditoria => auditoria.Tabela)
            .HasColumnName("tabela")
            .HasColumnType("character varying(100)")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(auditoria => auditoria.RegistroId)
            .HasColumnName("registro_id")
            .HasColumnType("integer")
            .IsRequired();

        builder.Property(auditoria => auditoria.UsuarioId)
            .HasColumnName("usuario_id")
            .HasColumnType("integer")
            .IsRequired();

        builder.Property(auditoria => auditoria.Detalhes)
            .HasColumnName("detalhes")
            .HasColumnType("text")
            .IsRequired();

        builder.HasIndex(auditoria => auditoria.DataHora)
            .HasDatabaseName("ix_auditorias_data_hora");

        builder.HasIndex(auditoria => auditoria.UsuarioId)
            .HasDatabaseName("ix_auditorias_usuario_id");

        builder.HasIndex(auditoria => new { auditoria.Tabela, auditoria.RegistroId })
            .HasDatabaseName("ix_auditorias_tabela_registro_id");

        builder.HasOne<Usuario>()
            .WithMany()
            .HasForeignKey(auditoria => auditoria.UsuarioId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_auditorias_usuarios_usuario_id");
    }
}

using ControleAcessoVeiculos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ControleAcessoVeiculos.Infrastructure.Data.Configurations;

public sealed class SessaoAutenticacaoConfiguration
    : IEntityTypeConfiguration<SessaoAutenticacao>
{
    public void Configure(EntityTypeBuilder<SessaoAutenticacao> builder)
    {
        builder.ToTable("sessoes_autenticacao", "dbo", table =>
        {
            table.HasCheckConstraint(
                "ck_sessoes_autenticacao_periodo",
                "expira_em > criada_em");
            table.HasCheckConstraint(
                "ck_sessoes_autenticacao_token_hash",
                "token_hash ~ '^[0-9a-f]{64}$'");
            table.HasCheckConstraint(
                "ck_sessoes_autenticacao_token_substituto_hash",
                "token_substituto_hash IS NULL OR token_substituto_hash ~ '^[0-9a-f]{64}$'");
            table.HasCheckConstraint(
                "ck_sessoes_autenticacao_revogacao",
                "(revogada_em IS NULL AND motivo_revogacao IS NULL) OR " +
                "(revogada_em IS NOT NULL AND motivo_revogacao IS NOT NULL)");
            table.HasCheckConstraint(
                "ck_sessoes_autenticacao_rotacao",
                "(consumida_em IS NULL AND token_substituto_hash IS NULL) OR " +
                "(consumida_em IS NOT NULL AND token_substituto_hash IS NOT NULL " +
                "AND motivo_revogacao = 'Rotacao')");
            table.HasCheckConstraint(
                "ck_sessoes_autenticacao_motivo_revogacao",
                "motivo_revogacao IS NULL OR motivo_revogacao IN (" +
                "'Rotacao', 'Logout', 'Expiracao', 'ContaDesativada', " +
                "'ReutilizacaoDetectada', 'SenhaAlterada', 'RedefinicaoAdministrativa')");
        });

        builder.HasKey(session => session.Id)
            .HasName("pk_sessoes_autenticacao");

        builder.Property(session => session.Id)
            .HasColumnName("id")
            .HasColumnType("integer")
            .ValueGeneratedOnAdd();

        builder.Property(session => session.UsuarioId)
            .HasColumnName("usuario_id")
            .HasColumnType("integer")
            .IsRequired();

        builder.Property(session => session.FamiliaId)
            .HasColumnName("familia_id")
            .HasColumnType("uuid")
            .IsRequired();

        builder.Property(session => session.TokenHash)
            .HasColumnName("token_hash")
            .HasColumnType("character varying(64)")
            .HasMaxLength(64)
            .IsRequired();

        builder.Property(session => session.TokenSubstitutoHash)
            .HasColumnName("token_substituto_hash")
            .HasColumnType("character varying(64)")
            .HasMaxLength(64);

        builder.Property(session => session.CriadaEm)
            .HasColumnName("criada_em")
            .HasColumnType("timestamp with time zone")
            .IsRequired();

        builder.Property(session => session.UltimaAtividadeEm)
            .HasColumnName("ultima_atividade_em")
            .HasColumnType("timestamp with time zone")
            .IsRequired();

        builder.Property(session => session.ExpiraEm)
            .HasColumnName("expira_em")
            .HasColumnType("timestamp with time zone")
            .IsRequired();

        builder.Property(session => session.ConsumidaEm)
            .HasColumnName("consumida_em")
            .HasColumnType("timestamp with time zone");

        builder.Property(session => session.RevogadaEm)
            .HasColumnName("revogada_em")
            .HasColumnType("timestamp with time zone");

        builder.Property(session => session.MotivoRevogacao)
            .HasColumnName("motivo_revogacao")
            .HasConversion<string>()
            .HasColumnType("character varying(32)")
            .HasMaxLength(32);

        builder.HasIndex(session => session.TokenHash)
            .IsUnique()
            .HasDatabaseName("ux_sessoes_autenticacao_token_hash");

        builder.HasIndex(session => new { session.FamiliaId, session.RevogadaEm })
            .HasDatabaseName("ix_sessoes_autenticacao_familia_revogada_em");

        builder.HasIndex(session => new { session.UsuarioId, session.ExpiraEm })
            .HasDatabaseName("ix_sessoes_autenticacao_usuario_expira_em");

        builder.HasOne<Usuario>()
            .WithMany()
            .HasForeignKey(session => session.UsuarioId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_sessoes_autenticacao_usuarios_usuario_id");
    }
}

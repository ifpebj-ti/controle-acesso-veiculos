using ControleAcessoVeiculos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ControleAcessoVeiculos.Infrastructure.Data.Configurations;

public sealed class EventoAcessoConfiguration : IEntityTypeConfiguration<EventoAcesso>
{
    public void Configure(EntityTypeBuilder<EventoAcesso> builder)
    {
        builder.ToTable("eventos_acesso", "dbo", table =>
            table.HasCheckConstraint(
                "ck_eventos_acesso_periodo",
                "fim > inicio"));

        builder.HasKey(evento => evento.Id).HasName("pk_eventos_acesso");

        builder.Property(evento => evento.Id)
            .HasColumnName("id")
            .HasColumnType("integer")
            .ValueGeneratedOnAdd();
        builder.Property(evento => evento.Nome)
            .HasColumnName("nome")
            .HasColumnType("character varying(200)")
            .HasMaxLength(200)
            .IsRequired();
        builder.Property(evento => evento.Responsavel)
            .HasColumnName("responsavel")
            .HasColumnType("character varying(200)")
            .HasMaxLength(200)
            .IsRequired();
        builder.Property(evento => evento.Inicio)
            .HasColumnName("inicio")
            .HasColumnType("timestamp with time zone")
            .IsRequired();
        builder.Property(evento => evento.Fim)
            .HasColumnName("fim")
            .HasColumnType("timestamp with time zone")
            .IsRequired();
        builder.Property(evento => evento.LocalArea)
            .HasColumnName("local_area")
            .HasColumnType("character varying(200)")
            .HasMaxLength(200)
            .IsRequired();
        builder.Property(evento => evento.PermitePernoite)
            .HasColumnName("permite_pernoite")
            .HasColumnType("boolean")
            .IsRequired();
        builder.Property(evento => evento.Observacao)
            .HasColumnName("observacao")
            .HasColumnType("character varying(1000)")
            .HasMaxLength(1000);
        builder.Property(evento => evento.Ativo)
            .HasColumnName("ativo")
            .HasColumnType("boolean")
            .HasDefaultValue(true)
            .IsRequired();
        builder.Property(evento => evento.CriadoPorId)
            .HasColumnName("criado_por_id")
            .HasColumnType("integer")
            .IsRequired();
        builder.Property(evento => evento.AtualizadoPorId)
            .HasColumnName("atualizado_por_id")
            .HasColumnType("integer");
        builder.Property(evento => evento.DataCriacao)
            .HasColumnName("data_criacao")
            .HasColumnType("timestamp with time zone")
            .IsRequired();
        builder.Property(evento => evento.DataAlteracao)
            .HasColumnName("data_alteracao")
            .HasColumnType("timestamp with time zone");

        builder.HasIndex(evento => new { evento.Inicio, evento.Fim })
            .HasDatabaseName("ix_eventos_acesso_periodo");
        builder.HasIndex(evento => evento.Ativo)
            .HasDatabaseName("ix_eventos_acesso_ativo");
        builder.HasIndex(evento => evento.CriadoPorId)
            .HasDatabaseName("ix_eventos_acesso_criado_por_id");
        builder.HasIndex(evento => evento.AtualizadoPorId)
            .HasDatabaseName("ix_eventos_acesso_atualizado_por_id");

        builder.HasOne<Usuario>()
            .WithMany()
            .HasForeignKey(evento => evento.CriadoPorId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_eventos_acesso_usuarios_criado_por");
        builder.HasOne<Usuario>()
            .WithMany()
            .HasForeignKey(evento => evento.AtualizadoPorId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_eventos_acesso_usuarios_atualizado_por");
    }
}

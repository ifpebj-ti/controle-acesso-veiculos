using ControleAcessoVeiculos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ControleAcessoVeiculos.Infrastructure.Data.Configurations;

public class UsuarioConfiguration : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> builder)
    {
        builder.ToTable("usuarios", "dbo");

        builder.HasKey(usuario => usuario.Id)
            .HasName("pk_usuarios");

        builder.Property(usuario => usuario.Id)
            .HasColumnName("id")
            .HasColumnType("integer")
            .ValueGeneratedOnAdd();

        builder.Property(usuario => usuario.Email)
            .HasColumnName("email")
            .HasColumnType("character varying(254)")
            .HasMaxLength(254)
            .IsRequired();

        builder.Property(usuario => usuario.SenhaHash)
            .HasColumnName("senha_hash")
            .HasColumnType("character varying(255)")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(usuario => usuario.PessoaId)
            .HasColumnName("pessoa_id")
            .HasColumnType("integer")
            .IsRequired();

        builder.Property(usuario => usuario.PerfilId)
            .HasColumnName("perfil_id")
            .HasColumnType("integer")
            .IsRequired();

        builder.Property(usuario => usuario.Ativo)
            .HasColumnName("ativo")
            .HasColumnType("boolean")
            .HasDefaultValue(true)
            .IsRequired();

        builder.Property(usuario => usuario.DataCriacao)
            .HasColumnName("data_criacao")
            .HasColumnType("timestamp with time zone")
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.Property(usuario => usuario.DataAlteracao)
            .HasColumnName("data_alteracao")
            .HasColumnType("timestamp with time zone");

        builder.HasIndex(usuario => usuario.Email)
            .IsUnique()
            .HasDatabaseName("ux_usuarios_email");

        builder.HasIndex(usuario => usuario.PessoaId)
            .IsUnique()
            .HasDatabaseName("ux_usuarios_pessoa_id");

        builder.HasIndex(usuario => usuario.PerfilId)
            .HasDatabaseName("ix_usuarios_perfil_id");

        builder.HasIndex(usuario => usuario.Ativo)
            .HasDatabaseName("ix_usuarios_ativo");

        builder.HasOne<Pessoa>()
            .WithMany()
            .HasForeignKey(usuario => usuario.PessoaId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_usuarios_pessoas_pessoa_id");

        builder.HasOne<Perfil>()
            .WithMany()
            .HasForeignKey(usuario => usuario.PerfilId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_usuarios_perfis_perfil_id");
    }
}

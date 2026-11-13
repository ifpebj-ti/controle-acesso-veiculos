using ControleAcessoVeiculos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ControleAcessoVeiculos.Infrastructure.Data.Configurations;

public class PessoaConfiguration : IEntityTypeConfiguration<Pessoa>
{
    public void Configure(EntityTypeBuilder<Pessoa> builder)
    {
        builder.ToTable("pessoas", "dbo", table => table.HasCheckConstraint(
            "ck_pessoas_cadastro_campus_completo",
            "NOT cadastro_campus_ativo OR (data_nascimento IS NOT NULL AND cadastro_campus_conferido_em IS NOT NULL AND cadastro_campus_conferido_por_id IS NOT NULL AND tipo_vinculo IN ('Aluno', 'Terceirizado', 'Federal'))"));

        builder.Property(x => x.DataNascimento).HasColumnName("data_nascimento").HasColumnType("date");
        builder.Property(x => x.CadastroCampusAtivo).HasColumnName("cadastro_campus_ativo").HasDefaultValue(false);
        builder.Property(x => x.CadastroCampusConferidoPorId).HasColumnName("cadastro_campus_conferido_por_id");
        builder.Property(x => x.CadastroCampusConferidoEm).HasColumnName("cadastro_campus_conferido_em");
        builder.HasOne<Usuario>().WithMany().HasForeignKey(x => x.CadastroCampusConferidoPorId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(x => new { x.CadastroCampusAtivo, x.TipoVinculo });

        builder.HasKey(pessoa => pessoa.Id)
            .HasName("pk_pessoas");

        builder.Property(pessoa => pessoa.Id)
            .HasColumnName("id")
            .HasColumnType("integer")
            .ValueGeneratedOnAdd();

        builder.Property(pessoa => pessoa.Nome)
            .HasColumnName("nome")
            .HasColumnType("character varying(200)")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(pessoa => pessoa.DocumentoTipo)
            .HasColumnName("documento_tipo")
            .HasColumnType("character varying(10)")
            .HasMaxLength(10);

        builder.Property(pessoa => pessoa.DocumentoNumero)
            .HasColumnName("documento_numero")
            .HasColumnType("character varying(20)")
            .HasMaxLength(20);

        builder.Property(pessoa => pessoa.TipoVinculo)
            .HasColumnName("tipo_vinculo")
            .HasColumnType("character varying(50)")
            .HasMaxLength(50);

        builder.Property(pessoa => pessoa.Email)
            .HasColumnName("email")
            .HasColumnType("character varying(254)")
            .HasMaxLength(254);

        builder.Property(pessoa => pessoa.Ativo)
            .HasColumnName("ativo")
            .HasColumnType("boolean")
            .HasDefaultValue(true)
            .IsRequired();

        builder.Property(pessoa => pessoa.DataCriacao)
            .HasColumnName("data_criacao")
            .HasColumnType("timestamp with time zone")
            .IsRequired();

        builder.Property(pessoa => pessoa.DataAlteracao)
            .HasColumnName("data_alteracao")
            .HasColumnType("timestamp with time zone");

        builder.HasIndex(pessoa => new { pessoa.DocumentoTipo, pessoa.DocumentoNumero })
            .IsUnique()
            .HasFilter("documento_tipo IS NOT NULL AND documento_numero IS NOT NULL")
            .HasDatabaseName("ux_pessoas_documento");

        builder.HasIndex(pessoa => pessoa.Email)
            .IsUnique()
            .HasFilter("email IS NOT NULL")
            .HasDatabaseName("ux_pessoas_email");

        builder.HasIndex(pessoa => pessoa.Ativo)
            .HasDatabaseName("ix_pessoas_ativo");
    }
}

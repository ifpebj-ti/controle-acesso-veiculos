using ControleAcessoVeiculos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ControleAcessoVeiculos.Infrastructure.Data.Configurations;

public class PessoaVeiculoConfiguration : IEntityTypeConfiguration<PessoaVeiculo>
{
    public void Configure(EntityTypeBuilder<PessoaVeiculo> builder)
    {
        builder.ToTable("pessoas_veiculos", "dbo", table =>
            table.HasCheckConstraint(
                "ck_pessoas_veiculos_periodo",
                "data_fim IS NULL OR data_inicio IS NULL OR data_fim >= data_inicio"));

        builder.HasKey(relacao => relacao.Id)
            .HasName("pk_pessoas_veiculos");

        builder.Property(relacao => relacao.Id)
            .HasColumnName("id")
            .HasColumnType("integer")
            .ValueGeneratedOnAdd();

        builder.Property(relacao => relacao.PessoaId)
            .HasColumnName("pessoa_id")
            .HasColumnType("integer")
            .IsRequired();

        builder.Property(relacao => relacao.VeiculoId)
            .HasColumnName("veiculo_id")
            .HasColumnType("integer")
            .IsRequired();

        builder.Property(relacao => relacao.TipoRelacao)
            .HasColumnName("tipo_relacao")
            .HasColumnType("character varying(50)")
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(relacao => relacao.Ativo)
            .HasColumnName("ativo")
            .HasColumnType("boolean")
            .HasDefaultValue(true)
            .IsRequired();

        builder.Property(relacao => relacao.DataInicio)
            .HasColumnName("data_inicio")
            .HasColumnType("date");

        builder.Property(relacao => relacao.DataFim)
            .HasColumnName("data_fim")
            .HasColumnType("date");

        builder.Property(relacao => relacao.DataCriacao)
            .HasColumnName("data_criacao")
            .HasColumnType("timestamp with time zone")
            .IsRequired();

        builder.Property(relacao => relacao.DataAlteracao)
            .HasColumnName("data_alteracao")
            .HasColumnType("timestamp with time zone");

        builder.HasIndex(relacao => new
            {
                relacao.PessoaId,
                relacao.VeiculoId,
                relacao.TipoRelacao
            })
            .IsUnique()
            .HasDatabaseName("ux_pessoas_veiculos_relacao");

        builder.HasIndex(relacao => relacao.VeiculoId)
            .HasDatabaseName("ix_pessoas_veiculos_veiculo_id");

        builder.HasIndex(relacao => relacao.Ativo)
            .HasDatabaseName("ix_pessoas_veiculos_ativo");

        builder.HasOne<Pessoa>()
            .WithMany()
            .HasForeignKey(relacao => relacao.PessoaId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_pessoas_veiculos_pessoas");

        builder.HasOne<Veiculo>()
            .WithMany()
            .HasForeignKey(relacao => relacao.VeiculoId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_pessoas_veiculos_veiculos");
    }
}

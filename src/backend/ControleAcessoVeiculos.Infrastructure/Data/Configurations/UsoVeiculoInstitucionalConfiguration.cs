using ControleAcessoVeiculos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ControleAcessoVeiculos.Infrastructure.Data.Configurations;

public class UsoVeiculoInstitucionalConfiguration :
    IEntityTypeConfiguration<UsoVeiculoInstitucional>
{
    public void Configure(EntityTypeBuilder<UsoVeiculoInstitucional> builder)
    {
        builder.ToTable("usos_veiculos_institucionais", "dbo", table =>
        {
            table.HasCheckConstraint(
                "ck_usos_veiculos_institucionais_periodo",
                "data_hora_entrada IS NULL OR data_hora_entrada >= data_hora_saida");
            table.HasCheckConstraint(
                "ck_usos_veiculos_institucionais_quilometragem",
                "quilometragem_saida >= 0 AND " +
                "(quilometragem_entrada IS NULL OR quilometragem_entrada >= quilometragem_saida)");
        });

        builder.HasKey(uso => uso.Id)
            .HasName("pk_usos_veiculos_institucionais");

        builder.Property(uso => uso.Id)
            .HasColumnName("id")
            .HasColumnType("integer")
            .ValueGeneratedOnAdd();

        builder.Property(uso => uso.VeiculoId)
            .HasColumnName("veiculo_id")
            .HasColumnType("integer")
            .IsRequired();

        builder.Property(uso => uso.MotoristaId)
            .HasColumnName("motorista_id")
            .HasColumnType("integer")
            .IsRequired();

        builder.Property(uso => uso.RegistroAcessoId)
            .HasColumnName("registro_acesso_id")
            .HasColumnType("integer");

        builder.Property(uso => uso.DataHoraSaida)
            .HasColumnName("data_hora_saida")
            .HasColumnType("timestamp with time zone")
            .IsRequired();

        builder.Property(uso => uso.QuilometragemSaida)
            .HasColumnName("quilometragem_saida")
            .HasColumnType("integer")
            .IsRequired();

        builder.Property(uso => uso.Itinerario)
            .HasColumnName("itinerario")
            .HasColumnType("character varying(500)")
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(uso => uso.DataHoraEntrada)
            .HasColumnName("data_hora_entrada")
            .HasColumnType("timestamp with time zone");

        builder.Property(uso => uso.QuilometragemEntrada)
            .HasColumnName("quilometragem_entrada")
            .HasColumnType("integer");

        builder.Property(uso => uso.Status)
            .HasColumnName("status")
            .HasColumnType("character varying(30)")
            .HasMaxLength(30)
            .HasConversion<string>()
            .IsRequired();

        builder.Property(uso => uso.CriadoPorId)
            .HasColumnName("criado_por_id")
            .HasColumnType("integer")
            .IsRequired();

        builder.Property(uso => uso.AtualizadoPorId)
            .HasColumnName("atualizado_por_id")
            .HasColumnType("integer");

        builder.Property(uso => uso.DataCriacao)
            .HasColumnName("data_criacao")
            .HasColumnType("timestamp with time zone")
            .IsRequired();

        builder.Property(uso => uso.DataAlteracao)
            .HasColumnName("data_alteracao")
            .HasColumnType("timestamp with time zone");

        builder.HasIndex(uso => new { uso.VeiculoId, uso.DataHoraSaida })
            .HasDatabaseName("ix_usos_institucionais_veiculo_saida");

        builder.HasIndex(uso => uso.VeiculoId)
            .IsUnique()
            .HasFilter("status IN ('EmUso', 'PendenteRetorno')")
            .HasDatabaseName("ux_usos_institucionais_veiculo_aberto");

        builder.HasIndex(uso => new { uso.MotoristaId, uso.DataHoraSaida })
            .HasDatabaseName("ix_usos_institucionais_motorista_saida");

        builder.HasIndex(uso => uso.DataHoraSaida)
            .HasDatabaseName("ix_usos_institucionais_saida");

        builder.HasIndex(uso => uso.RegistroAcessoId)
            .IsUnique()
            .HasFilter("registro_acesso_id IS NOT NULL")
            .HasDatabaseName("ux_usos_institucionais_registro_acesso_id");

        builder.HasIndex(uso => uso.Status)
            .HasDatabaseName("ix_usos_institucionais_status");

        builder.HasOne<Veiculo>()
            .WithMany()
            .HasForeignKey(uso => uso.VeiculoId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_usos_institucionais_veiculos");

        builder.HasOne<Pessoa>()
            .WithMany()
            .HasForeignKey(uso => uso.MotoristaId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_usos_institucionais_motoristas");

        builder.HasOne<RegistroAcesso>()
            .WithOne()
            .HasForeignKey<UsoVeiculoInstitucional>(uso => uso.RegistroAcessoId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_usos_institucionais_registros_acesso");

        builder.HasOne<Usuario>()
            .WithMany()
            .HasForeignKey(uso => uso.CriadoPorId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_usos_institucionais_usuarios_criado_por");

        builder.HasOne<Usuario>()
            .WithMany()
            .HasForeignKey(uso => uso.AtualizadoPorId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_usos_institucionais_usuarios_atualizado_por");
    }
}

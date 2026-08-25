using ControleAcessoVeiculos.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ControleAcessoVeiculos.Infrastructure.Data;

public class ControleAcessoVeiculosDbContext(
    DbContextOptions<ControleAcessoVeiculosDbContext> options) : DbContext(options)
{
    public DbSet<Pessoa> Pessoas => Set<Pessoa>();
    public DbSet<Veiculo> Veiculos => Set<Veiculo>();
    public DbSet<CategoriaAcesso> CategoriasAcesso => Set<CategoriaAcesso>();
    public DbSet<Perfil> Perfis => Set<Perfil>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<RegistroAcesso> RegistrosAcesso => Set<RegistroAcesso>();
    public DbSet<Auditoria> Auditorias => Set<Auditoria>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("dbo");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ControleAcessoVeiculosDbContext).Assembly);

        base.OnModelCreating(modelBuilder);
    }
}

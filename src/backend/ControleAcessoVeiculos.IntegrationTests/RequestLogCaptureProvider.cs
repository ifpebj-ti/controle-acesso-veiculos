using System.Collections.Concurrent;
using ControleAcessoVeiculos.API.Middleware;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace ControleAcessoVeiculos.IntegrationTests;

public sealed class RequestLogCaptureProvider : ILoggerProvider
{
    private readonly ConcurrentQueue<string> _messages = new();

    public IReadOnlyCollection<string> Messages => _messages.ToArray();

    public ILogger CreateLogger(string categoryName) =>
        categoryName == typeof(RequestSafetyMiddleware).FullName
            ? new CaptureLogger(_messages)
            : NullLogger.Instance;

    public void Clear() => _messages.Clear();

    public void Dispose()
    {
    }

    private sealed class CaptureLogger(ConcurrentQueue<string> messages) : ILogger
    {
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull =>
            NullScope.Instance;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter) =>
            messages.Enqueue(formatter(state, exception));
    }

    private sealed class NullScope : IDisposable
    {
        public static NullScope Instance { get; } = new();

        public void Dispose()
        {
        }
    }
}

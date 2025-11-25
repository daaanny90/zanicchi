/**
 * Server Entry Point
 * 
 * This is the main entry point for the backend application.
 * It:
 * 1. Tests database connection
 * 2. Starts the HTTP server
 * 3. Handles graceful shutdown
 * 
 * Run with: npm run dev (development) or npm start (production)
 */

import app from './app';
import { config } from './config/app.config';
import { testConnection, closePool } from './config/database';

/**
 * Start the server
 * 
 * Attempts to connect to the database and then starts
 * listening for HTTP requests on the configured port.
 */
async function startServer(): Promise<void> {
  try {
    // Test database connection
    console.log('Testing database connection...');
    await testConnection();
    
    // Start HTTP server
    const PORT = config.server.port;
    app.listen(PORT, '0.0.0.0', () => {
      console.log('═══════════════════════════════════════════════');
      console.log('  Freelancer Finance Manager API');
      console.log('═══════════════════════════════════════════════');
      console.log(`  Environment: ${config.server.env}`);
      console.log(`  Server running on: http://0.0.0.0:${PORT}`);
      console.log(`  Health check: http://0.0.0.0:${PORT}/health`);
      console.log(`  API endpoints: http://0.0.0.0:${PORT}/api`);
      console.log('═══════════════════════════════════════════════');
      console.log('  Ready to accept connections on local network');
      console.log('═══════════════════════════════════════════════');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Graceful Shutdown Handler
 * 
 * Properly close database connections and stop the server
 * when the application receives a shutdown signal.
 * This ensures data integrity and clean shutdown.
 */
async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  try {
    // Close database pool
    await closePool();
    console.log('Database connections closed');
    
    // Exit process
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

/**
 * Register shutdown handlers
 * 
 * Listen for termination signals and perform graceful shutdown.
 * Common signals:
 * - SIGTERM: Termination signal (e.g., from Docker, systemd)
 * - SIGINT: Interrupt signal (Ctrl+C in terminal)
 */
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

/**
 * Handle uncaught exceptions
 * 
 * Log and exit if an unhandled exception occurs.
 * This prevents the app from running in an undefined state.
 */
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

/**
 * Handle unhandled promise rejections
 * 
 * Log and exit if a promise rejection is not handled.
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start the server
startServer();


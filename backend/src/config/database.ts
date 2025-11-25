/**
 * Database Configuration
 * 
 * This module sets up and manages the MySQL database connection pool.
 * Connection pooling improves performance by reusing database connections
 * instead of creating new ones for each query.
 * 
 * The pool is configured with:
 * - Connection limits to prevent resource exhaustion
 * - Timezone settings for consistent date handling
 * - Promise-based API for async/await support
 */

import mysql from 'mysql2';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * MySQL Connection Pool
 * 
 * Creates a pool of reusable database connections.
 * Configuration is loaded from environment variables.
 * 
 * Pool settings:
 * - connectionLimit: Maximum number of connections in the pool
 * - waitForConnections: Queue requests when pool is at capacity
 * - queueLimit: Maximum number of queued connection requests
 * - timezone: Set to UTC for consistent date/time handling
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'freelancer_finance',
  // Connection pool settings
  connectionLimit: 10,          // Max connections in pool
  waitForConnections: true,     // Queue when all connections busy
  queueLimit: 0,                // Unlimited queue size
  // Timezone setting - store dates in UTC
  timezone: '+00:00'
});

/**
 * Promise-based pool interface
 * 
 * Wraps the connection pool with promise support for async/await.
 * This makes database queries much cleaner in the application code.
 */
export const promisePool = pool.promise();

/**
 * Test database connection
 * 
 * Attempts to acquire a connection from the pool and execute a simple query.
 * This is useful for verifying that the database is accessible on startup.
 * 
 * @returns Promise that resolves if connection successful, rejects otherwise
 */
export async function testConnection(): Promise<void> {
  try {
    const connection = await promisePool.getConnection();
    console.log('✓ Database connection established successfully');
    
    // Test query to verify database is working
    await connection.query('SELECT 1');
    
    // Release connection back to pool
    connection.release();
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    throw error;
  }
}

/**
 * Close all connections in the pool
 * 
 * Should be called when shutting down the application gracefully.
 * This ensures all database connections are properly closed.
 * 
 * @returns Promise that resolves when all connections are closed
 */
export async function closePool(): Promise<void> {
  return new Promise((resolve, reject) => {
    pool.end((err) => {
      if (err) {
        console.error('Error closing database pool:', err);
        reject(err);
      } else {
        console.log('Database pool closed successfully');
        resolve();
      }
    });
  });
}

// Export the pool as default for convenient importing
export default promisePool;


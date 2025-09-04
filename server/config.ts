import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Environment variable validation schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "postgresql://neondb_owner:npg_OKt6axr7VCyQ@ep-rapid-art-a1e02v55-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"),
  
  // Server
  PORT: z.string().transform(val => parseInt(val, 10)).default("5000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  
  // Authentication & Session
  SESSION_SECRET: z.string().min(32, "930d6c68e87810385c1f81a5636863b24a7bcbe32d90f7c90195b755b5324f67"),
  REPLIT_DOMAINS: z.string().optional(),
  ISSUER_URL: z.string().url().optional(),
  REPL_ID: z.string().optional(),
  
  // Email Service
  SMTP_HOST: z.string().default("smtp.gmail.com"),
  SMTP_PORT: z.string().transform(val => parseInt(val, 10)).default("587"),
  SMTP_USER: z.string().email().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),
  
  // AI Services
  OPENAI_API_KEY: z.string().optional(),
  
  // File Upload
  MAX_FILE_SIZE: z.string().transform(val => parseInt(val, 10)).default("10485760"),
  ALLOWED_FILE_TYPES: z.string().default("image/jpeg,image/png,image/webp,application/pdf"),
  
  // Security
  CORS_ORIGINS: z.string().default("http://localhost:3000,http://localhost:5000"),
  RATE_LIMIT_WINDOW_MS: z.string().transform(val => parseInt(val, 10)).default("900000"),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(val => parseInt(val, 10)).default("100"),
  
  // Logging
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  ENABLE_REQUEST_LOGGING: z.string().transform(val => val === "true").default("true"),
});

// Validate and parse environment variables
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => err.path.join('.')).join(', ');
      throw new Error(`❌ Invalid environment variables: ${missingVars}`);
    }
    throw error;
  }
}

// Export validated configuration
export const config = validateEnv();

// Configuration helper functions
export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test';

// Database configuration
export const dbConfig = {
  url: config.DATABASE_URL,
};

// Server configuration
export const serverConfig = {
  port: config.PORT,
  nodeEnv: config.NODE_ENV,
};

// Authentication configuration
export const authConfig = {
  sessionSecret: config.SESSION_SECRET,
  // replitDomains: config.REPLIT_DOMAINS?.split(',').map(domain => domain.trim()) || [],
  // issuerUrl: config.ISSUER_URL || 'https://replit.com/oidc',
  replId: config.REPL_ID,
};

// Email configuration
export const emailConfig = {
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  user: config.SMTP_USER,
  pass: config.SMTP_PASS,
  from: config.SMTP_FROM || config.SMTP_USER,
  isConfigured: !!(config.SMTP_USER && config.SMTP_PASS),
};

// File upload configuration
export const uploadConfig = {
  maxFileSize: config.MAX_FILE_SIZE,
  allowedTypes: config.ALLOWED_FILE_TYPES.split(',').map(type => type.trim()),
};

// Security configuration
export const securityConfig = {
  corsOrigins: config.CORS_ORIGINS.split(',').map(origin => origin.trim()),
  rateLimit: {
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    maxRequests: config.RATE_LIMIT_MAX_REQUESTS,
  },
};

// Logging configuration
export const loggingConfig = {
  level: config.LOG_LEVEL,
  enableRequestLogging: config.ENABLE_REQUEST_LOGGING,
};

// AI configuration
export const aiConfig = {
  openaiApiKey: config.OPENAI_API_KEY,
  isConfigured: !!config.OPENAI_API_KEY,
};

// Configuration validation helper
export function validateRequiredConfig() {
  const errors: string[] = [];
  
  if (!config.DATABASE_URL) {
    errors.push("DATABASE_URL is required");
  }
  
  if (!config.SESSION_SECRET || config.SESSION_SECRET.length < 32) {
    errors.push("SESSION_SECRET must be at least 32 characters long");
  }
  
  // if (isProduction && !config.REPLIT_DOMAINS) {
  //   errors.push("REPLIT_DOMAINS is required in production");
  // }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

// Log configuration status (without sensitive data)
export function logConfigStatus() {
  console.log('🔧 Configuration Status:');
  console.log(`   Environment: ${config.NODE_ENV}`);
  console.log(`   Port: ${config.PORT}`);
  console.log(`   Database: ${config.DATABASE_URL ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Session Secret: ${config.SESSION_SECRET ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Email Service: ${emailConfig.isConfigured ? '✅ Configured' : '⚠️  Not configured'}`);
  console.log(`   AI Services: ${aiConfig.isConfigured ? '✅ Configured' : '⚠️  Not configured'}`);
  console.log(`   Replit Auth: ${config.REPLIT_DOMAINS ? '✅ Configured' : '⚠️  Not configured'}`);
}

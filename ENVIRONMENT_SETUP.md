# Environment Setup Guide

This guide will help you set up the environment variables for FinancePilot.

## Quick Setup

1. **Run the setup script** (recommended):
   ```bash
   npm run setup
   ```

2. **Or manually create .env file**:
   ```bash
   cp env.example .env
   ```

## Required Environment Variables

### 🔐 Essential Variables (Required)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/financepilot` |
| `SESSION_SECRET` | Secret key for session encryption | `your-32-character-secret-key` |

### 🌐 Server Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `NODE_ENV` | `development` | Environment (development/production/test) |

### 🔑 Authentication (Replit)

| Variable | Description | Example |
|----------|-------------|---------|
| `REPLIT_DOMAINS` | Comma-separated allowed domains | `myapp.username.repl.co` |
| `ISSUER_URL` | OIDC issuer URL | `https://replit.com/oidc` |
| `REPL_ID` | Replit project ID | Auto-set in Replit |

### 📧 Email Service (Optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `SMTP_HOST` | `smtp.gmail.com` | SMTP server host |
| `SMTP_PORT` | `587` | SMTP server port |
| `SMTP_USER` | - | Email username |
| `SMTP_PASS` | - | Email password/app password |
| `SMTP_FROM` | - | From email address |

### 🤖 AI Services (Optional)

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key for AI categorization |

### 📁 File Upload

| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_FILE_SIZE` | `10485760` | Max file size in bytes (10MB) |
| `ALLOWED_FILE_TYPES` | `image/jpeg,image/png,image/webp,application/pdf` | Allowed MIME types |

### 🔒 Security

| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ORIGINS` | `http://localhost:3000,http://localhost:5000` | Allowed CORS origins |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 minutes) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window |

### 📊 Logging

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | Log level (error/warn/info/debug) |
| `ENABLE_REQUEST_LOGGING` | `true` | Enable request logging |

## Database Setup

### Local PostgreSQL

1. **Install PostgreSQL** on your system
2. **Create a database**:
   ```sql
   CREATE DATABASE financepilot;
   CREATE USER financepilot_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE financepilot TO financepilot_user;
   ```
3. **Set DATABASE_URL**:
   ```
   DATABASE_URL=postgresql://financepilot_user:your_password@localhost:5432/financepilot
   ```

### Cloud Database Options

#### Neon (Recommended)
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Set as `DATABASE_URL`

#### Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string
5. Set as `DATABASE_URL`

## Email Service Setup

### Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security > 2-Step Verification > App passwords
   - Generate a new app password
3. **Set email variables**:
   ```
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=your-email@gmail.com
   ```

### Other Email Providers

Update the SMTP settings according to your provider:

```bash
# Outlook/Hotmail
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587

# Yahoo
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587

# Custom SMTP
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
```

## Replit Deployment

If deploying on Replit:

1. **Set environment variables** in Replit's Secrets tab
2. **Required secrets**:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `REPLIT_DOMAINS` (auto-set)
   - `REPL_ID` (auto-set)

## Security Best Practices

1. **Never commit .env files** to version control
2. **Use strong session secrets** (32+ characters)
3. **Rotate secrets regularly** in production
4. **Use environment-specific configurations**
5. **Validate all environment variables** on startup

## Troubleshooting

### Common Issues

1. **"DATABASE_URL is required"**
   - Check your `.env` file exists
   - Verify the database connection string
   - Test database connectivity

2. **"SESSION_SECRET must be at least 32 characters"**
   - Generate a new secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

3. **Email not sending**
   - Verify SMTP credentials
   - Check if 2FA is enabled (for Gmail)
   - Use app passwords instead of regular passwords

4. **CORS errors**
   - Add your frontend URL to `CORS_ORIGINS`
   - Separate multiple origins with commas

### Validation

The application validates all environment variables on startup. Check the console output for any configuration errors.

## Development vs Production

### Development
- Use local database
- Enable debug logging
- Use HTTP (not HTTPS)
- Allow localhost origins

### Production
- Use cloud database
- Use HTTPS only
- Restrict CORS origins
- Use strong secrets
- Enable rate limiting
- Set appropriate log levels

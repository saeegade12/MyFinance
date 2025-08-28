#!/usr/bin/env node

import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 FinancePilot Environment Setup');
console.log('=====================================\n');

// Check if .env already exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists!');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('Do you want to overwrite it? (y/N): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      createEnvFile();
    } else {
      console.log('Setup cancelled.');
    }
    readline.close();
  });
} else {
  createEnvFile();
}

function createEnvFile() {
  try {
    // Read the example file
    if (!fs.existsSync(envExamplePath)) {
      console.error('❌ env.example file not found!');
      process.exit(1);
    }

    let envContent = fs.readFileSync(envExamplePath, 'utf8');
    
    // Generate a secure session secret
    const sessionSecret = crypto.randomBytes(32).toString('hex');
    
    // Replace placeholder values
    envContent = envContent.replace(
      /SESSION_SECRET=your-super-secret-session-key-here/g,
      `SESSION_SECRET=${sessionSecret}`
    );
    
    // Write the .env file
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ .env file created successfully!');
    console.log('✅ Secure session secret generated');
    console.log('\n📝 Next steps:');
    console.log('1. Edit the .env file with your actual values');
    console.log('2. Set up your PostgreSQL database');
    console.log('3. Configure your email service (optional)');
    console.log('4. Run: npm install');
    console.log('5. Run: npm run db:push');
    console.log('6. Run: npm run dev');
    console.log('\n🔐 Your session secret has been automatically generated and saved.');
    console.log('⚠️  Keep your .env file secure and never commit it to version control!');
    
  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
    process.exit(1);
  }
}

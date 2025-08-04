#!/usr/bin/env node

const fs = require('fs-extra')
const path = require('path')
const inquirer = require('inquirer')
const chalk = require('chalk')

async function main() {
  console.log(chalk.blue.bold('\n🚀 CDP Onramp Guest Checkout Setup\n'))
  console.log(chalk.gray('Setting up Next.js guest checkout with embedded wallets and onramp integration\n'))
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectPath',
      message: 'Where do you want to create the project?',
      default: './cdp-onramp-guest-checkout'
    },
    {
      type: 'confirm',
      name: 'configureCDP',
      message: 'Would you like to configure your CDP credentials now? (optional, can be done later)',
      default: false
    }
  ])

  let cdpConfig = {}
  if (answers.configureCDP) {
    console.log(chalk.yellow('\n📋 CDP Configuration (get these from https://portal.cdp.coinbase.com)\n'))
    
    cdpConfig = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectId',
        message: 'CDP Project ID (for Embedded Wallets):',
        validate: input => input.length > 0 || 'Project ID is required'
      },
      {
        type: 'input',
        name: 'apiKeyName',
        message: 'CDP API Key Name (e.g., organizations/your-org-id/apiKeys/your-key-id):',
        validate: input => input.length > 0 || 'API Key Name is required'
      },
      {
        type: 'input',
        name: 'privateKey',
        message: 'CDP API Private Key (base64 encoded):',
        validate: input => input.length > 0 || 'Private Key is required'
      }
    ])
  }

  const templatePath = path.join(__dirname, '..', 'templates', 'nextjs-guest-checkout')
  const targetPath = path.resolve(answers.projectPath)

  try {
    // Create target directory if it doesn't exist
    await fs.ensureDir(targetPath)
    
    // Copy template files
    await fs.copy(templatePath, targetPath)
    
    // Configure .env file if credentials were provided
    if (answers.configureCDP && cdpConfig.projectId) {
      await configureEnvFile(targetPath, cdpConfig)
    }
    
    console.log(chalk.green.bold(`\n✅ Successfully created CDP Onramp Guest Checkout at: ${targetPath}\n`))
    
    // Show next steps
    showNextSteps(targetPath, answers.configureCDP)
    
  } catch (error) {
    console.error(chalk.red.bold('❌ Error creating files:'), error.message)
    process.exit(1)
  }
}

async function configureEnvFile(targetPath, cdpConfig) {
  const envPath = path.join(targetPath, '.env')
  const envExamplePath = path.join(targetPath, '.env.example')
  
  try {
    // Read the .env.example file
    let envContent = await fs.readFile(envExamplePath, 'utf8')
    
    // Replace placeholder values with actual configuration
    envContent = envContent
      .replace('your-project-id-here', cdpConfig.projectId)
      .replace('organizations/your-org-id/apiKeys/your-key-id', cdpConfig.apiKeyName)
      .replace('your-base64-encoded-private-key-here', cdpConfig.privateKey)
      .replace('your-super-secret-nextauth-secret-here', generateRandomSecret())
    
    // Write the configured .env file
    await fs.writeFile(envPath, envContent)
    
    console.log(chalk.green('✅ Created .env file with your CDP configuration'))
    
  } catch (error) {
    console.log(chalk.yellow('⚠️  Could not automatically configure .env file, please set it up manually'))
  }
}

function generateRandomSecret() {
  return require('crypto').randomBytes(32).toString('hex')
}

function showNextSteps(targetPath, configuredCDP) {
  console.log(chalk.yellow.bold('📋 Next Steps:\n'))
  
  console.log(chalk.white('1. Navigate to your project:'))
  console.log(chalk.gray(`   cd ${path.relative(process.cwd(), targetPath)}\n`))
  
  console.log(chalk.white('2. Install dependencies:'))
  console.log(chalk.gray('   npm install\n'))
  
  if (!configuredCDP) {
    console.log(chalk.white('3. Set up your CDP API credentials:'))
    console.log(chalk.gray('   - Create a CDP project at https://portal.cdp.coinbase.com'))
    console.log(chalk.gray('   - Get your API keys and Project ID'))
    console.log(chalk.gray('   - Copy .env.example to .env and add your credentials\n'))
    
    console.log(chalk.white('4. Configure domain settings:'))
    console.log(chalk.gray('   - Add your domain to CDP Portal (important for CORS)'))
    console.log(chalk.gray('   - See .env.example for configuration links\n'))
    
    console.log(chalk.white('5. Start the development server:'))
    console.log(chalk.gray('   npm run dev\n'))
  } else {
    console.log(chalk.white('3. Configure domain settings:'))
    console.log(chalk.gray('   - Add your domain to CDP Portal (important for CORS)'))
    console.log(chalk.gray('   - Embedded Wallets: https://portal.cdp.coinbase.com/products/embedded-wallets/cors'))
    console.log(chalk.gray('   - Onramp: https://portal.cdp.coinbase.com/products/onramp\n'))
    
    console.log(chalk.white('4. Start the development server:'))
    console.log(chalk.gray('   npm run dev\n'))
  }
  
  console.log(chalk.white(`${configuredCDP ? '5' : '6'}. Read the documentation:`))
  console.log(chalk.gray(`   Check out ${path.relative(process.cwd(), targetPath)}/README.md for detailed instructions\n`))
  
  console.log(chalk.blue('🎉 Happy building with CDP Onramp Guest Checkout!'))
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { main }
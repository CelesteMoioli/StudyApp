const fs = require('fs');
const path = require('path');

// Lee el .env manualmente sin dependencias externas
const envPath = path.join(__dirname, '../.env');
const envVars = {};

if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8')
    .split('\n')
    .forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const [key, ...rest] = trimmed.split('=');
      envVars[key.trim()] = rest.join('=').trim();
    });
} else {
  console.error('ERROR: no se encontró el archivo .env');
  console.error('Copiá .env.example a .env y completá los valores.');
  process.exit(1);
}

const content = `export const environment = {
  production: false,
  cognito: {
    region: '${envVars.COGNITO_REGION}',
    userPoolId: '${envVars.COGNITO_USER_POOL_ID}',
    clientId: '${envVars.COGNITO_CLIENT_ID}'
  },
  firebase: {
    apiKey: '${envVars.FIREBASE_API_KEY}',
    authDomain: '${envVars.FIREBASE_AUTH_DOMAIN}',
    databaseURL: '${envVars.FIREBASE_DATABASE_URL}',
    projectId: '${envVars.FIREBASE_PROJECT_ID}',
    storageBucket: '${envVars.FIREBASE_STORAGE_BUCKET}',
    messagingSenderId: '${envVars.FIREBASE_MESSAGING_SENDER_ID}',
    appId: '${envVars.FIREBASE_APP_ID}'
  }
};
`;

const outPath = path.join(__dirname, '../src/environments/environment.ts');
fs.writeFileSync(outPath, content);
console.log('✔ environment.ts generado desde .env');

# StudyApp

Aplicación móvil para estudiantes desarrollada con Ionic + Angular. Permite gestionar salas de estudio colaborativas, agenda de eventos, recursos y perfil de usuario.

## Tecnologías

- [Ionic Framework](https://ionicframework.com/) + [Angular](https://angular.dev/)
- [Firebase Realtime Database](https://firebase.google.com/) — salas, agenda, recursos, chat en tiempo real y presencia
- [Amazon Cognito](https://aws.amazon.com/cognito/) — autenticación de usuarios (registro, login, recuperación de contraseña)

## Funcionalidades

| Tab | Descripción |
|-----|-------------|
| **Salas** | Lista de salas de estudio. Al entrar a una sala se ve el chat en tiempo real y quién está conectado. |
| **Agenda** | Calendario semanal con navegación entre semanas. Los eventos se filtran por día seleccionado. |
| **Recursos** | Listado de recursos compartidos (links, apuntes, etc.). |
| **Wiki** | Buscador integrado de Wikipedia. |
| **Perfil** | Datos del usuario autenticado. |

## Requisitos previos

- Node.js >= 20.19
- Ionic CLI: `npm install -g @ionic/cli`

## Configuración

1. Clonar el repositorio:
   ```bash
   git clone <url-del-repo>
   cd StudyApp
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Crear el archivo `.env` a partir del ejemplo:
   ```bash
   cp .env.example .env
   ```

4. Completar `.env` con las credenciales reales:
   ```env
   # Cognito
   COGNITO_REGION=
   COGNITO_USER_POOL_ID=
   COGNITO_CLIENT_ID=

   # Firebase
   FIREBASE_API_KEY=
   FIREBASE_AUTH_DOMAIN=
   FIREBASE_DATABASE_URL=
   FIREBASE_PROJECT_ID=
   FIREBASE_STORAGE_BUCKET=
   FIREBASE_MESSAGING_SENDER_ID=
   FIREBASE_APP_ID=
   ```

5. Levantar la app (el script de entorno se ejecuta automáticamente):
   ```bash
   npm start
   ```

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Genera `environment.ts` desde `.env` y levanta el servidor de desarrollo |
| `npm run build` | Genera `environment.ts` desde `.env` y compila para producción |
| `npm run set-env` | Solo regenera `environment.ts` (útil si cambiaste el `.env` sin reiniciar) |

> **Nota:** El archivo `.env` está en `.gitignore` y nunca se sube al repositorio. Cada desarrollador debe crearlo localmente.

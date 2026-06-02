import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

type CognitoLibrary = typeof import('amazon-cognito-identity-js');
type CognitoUserPoolInstance = InstanceType<CognitoLibrary['CognitoUserPool']>;
type CognitoUserSessionInstance = InstanceType<CognitoLibrary['CognitoUserSession']>;

export interface AuthenticatedUser {
  email: string;
  idToken: string;
  accessToken: string;
}

export interface RegisterUserData {
  name: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Datos de Cognito que vienen del environment. Asi no dejamos los valores repartidos por toda la app.
  private readonly poolData = environment.cognito;
  private cognitoLibrary?: Promise<CognitoLibrary>;
  private userPool?: CognitoUserPoolInstance;

  get isConfigured(): boolean {
    // Validamos que el User Pool tenga formato real antes de intentar loguear al usuario.
    return /^[a-z]{2}-[a-z]+-\d_[A-Za-z0-9]+$/.test(this.poolData.userPoolId) && Boolean(this.poolData.clientId);
  }

  async signIn(email: string, password: string): Promise<AuthenticatedUser> {
    // Login principal: Cognito revisa mail y clave, y si esta todo bien devuelve los tokens.
    const cognito = await this.loadCognito();
    const user = await this.createUser(email);
    const authDetails = new cognito.AuthenticationDetails({
      Username: email,
      Password: password
    });

    return new Promise((resolve, reject) => {
      user.authenticateUser(authDetails, {
        onSuccess: (session) => resolve(this.mapSession(email, session)),
        onFailure: (error) => reject(error)
      });
    });
  }

  async signUp(data: RegisterUserData): Promise<void> {
    // Registro de usuario nuevo. Mandamos mail y nombre como atributos para que Cognito cree la cuenta.
    const cognito = await this.loadCognito();
    const userPool = await this.getUserPool();
    const attributes = [
      new cognito.CognitoUserAttribute({ Name: 'email', Value: data.email }),
      new cognito.CognitoUserAttribute({ Name: 'name', Value: data.name })
    ];

    return new Promise((resolve, reject) => {
      userPool.signUp(data.email, data.password, attributes, [], (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  async confirmSignUp(email: string, code: string): Promise<void> {
    // Confirmacion del codigo que llega por mail despues del registro.
    const user = await this.createUser(email);

    return new Promise((resolve, reject) => {
      user.confirmRegistration(code, true, (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  async resendConfirmationCode(email: string): Promise<void> {
    // Si el usuario perdio o vencio el codigo, pedimos a Cognito que mande uno nuevo.
    const user = await this.createUser(email);

    return new Promise((resolve, reject) => {
      user.resendConfirmationCode((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  async forgotPassword(email: string): Promise<void> {
    // Inicio de recuperacion de clave: Cognito envia un codigo al mail del usuario.
    const user = await this.createUser(email);

    return new Promise((resolve, reject) => {
      user.forgotPassword({
        onSuccess: () => resolve(),
        onFailure: (error) => reject(error),
        inputVerificationCode: () => resolve()
      });
    });
  }

  async confirmNewPassword(email: string, code: string, newPassword: string): Promise<void> {
    // Cierre de recuperacion: con el codigo recibido se define una clave nueva.
    const user = await this.createUser(email);

    return new Promise((resolve, reject) => {
      user.confirmPassword(code, newPassword, {
        onSuccess: () => resolve(),
        onFailure: (error) => reject(error)
      });
    });
  }

  async signOut(): Promise<void> {
    // Cierra la sesion guardada por Cognito en el navegador/dispositivo.
    const userPool = await this.getUserPool();
    userPool.getCurrentUser()?.signOut();
  }

  async getCurrentUser(): Promise<AuthenticatedUser | null> {
    // Revisa si ya existe una sesion valida. Esto nos permite proteger la app al abrirla.
    const userPool = await this.getUserPool();
    const user = userPool.getCurrentUser();

    if (!user) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      user.getSession((error: Error | null, session: CognitoUserSessionInstance | null) => {
        if (error || !session?.isValid()) {
          resolve(null);
          return;
        }

        resolve(this.mapSession(user.getUsername(), session));
      });
    });
  }

  private async createUser(email: string) {
    // Cognito trabaja con objetos usuario; esta funcion evita repetir la misma creacion en cada operacion.
    const cognito = await this.loadCognito();
    const userPool = await this.getUserPool();

    return new cognito.CognitoUser({
      Username: email,
      Pool: userPool
    });
  }

  private async getUserPool(): Promise<CognitoUserPoolInstance> {
    // Creamos el User Pool una sola vez y lo reutilizamos para login, registro y recuperacion.
    if (this.userPool) {
      return this.userPool;
    }

    const cognito = await this.loadCognito();
    this.userPool = new cognito.CognitoUserPool({
      UserPoolId: this.poolData.userPoolId || 'us-east-1_placeholder',
      ClientId: this.poolData.clientId || 'placeholder'
    });

    return this.userPool;
  }

  private loadCognito(): Promise<CognitoLibrary> {
    // Import dinamico para que Angular no cargue Cognito antes de tiempo y evitar errores de inicializacion.
    this.cognitoLibrary ??= import('amazon-cognito-identity-js');
    return this.cognitoLibrary;
  }

  private mapSession(email: string, session: CognitoUserSessionInstance): AuthenticatedUser {
    // Dejamos la sesion en un formato simple para que el resto de la app no dependa directo de Cognito.
    return {
      email,
      idToken: session.getIdToken().getJwtToken(),
      accessToken: session.getAccessToken().getJwtToken()
    };
  }
}

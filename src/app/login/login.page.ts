import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, AuthenticatedUser } from '../services/auth.service';

type AuthMode = 'signin' | 'signup' | 'confirm' | 'forgot' | 'reset';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
  standalone: false,
})
export class LoginPage {
  mode: AuthMode = 'signin';
  name = '';
  email = '';
  password = '';
  confirmationCode = '';
  user: AuthenticatedUser | null = null;
  isLoading = false;
  message = '';
  errorMessage = '';

  constructor(public authService: AuthService, private router: Router) {}


  /**
   * @function ionViewWillEnter
   * @description Se ejecuta cuando la vista va a entrar en pantalla.
   */
  ionViewWillEnter(): void {
    // Si ya hay sesion activa, no mostramos login otra vez y mandamos al usuario a la app.
    this.authService.getCurrentUser().then((user) => {
      this.user = user;

      if (user && this.router.url === '/login') {
        this.router.navigateByUrl('/tabs/tab1');
      }
    });
  }


  /**
   * @function setMode
   * @description Cambia el modo de autenticación.
   */
  setMode(mode: AuthMode): void {
    // Cambia el formulario visible y limpia mensajes para que no queden errores viejos en pantalla.
    this.mode = mode;
    this.message = '';
    this.errorMessage = '';
  }


  /**
   * @function submit
   * @description Maneja el envío del formulario de autenticación, adaptándose al modo actual. 
   * Valida los campos necesarios y muestra mensajes de error o éxito según corresponda.
   */
  submit(): void {
    // Punto central del formulario: segun el modo decide si ingresa, registra, confirma o recupera clave.
    if (!this.authService.isConfigured) {
      this.errorMessage = 'Falta configurar el inicio de sesión.';
      return;
    }

    if (!this.email.trim()) {
      this.errorMessage = 'Completá tu mail.';
      return;
    }

    if (this.mode === 'confirm') {
      this.confirmAccount();
      return;
    }

    if (this.mode === 'forgot') {
      this.sendPasswordResetCode();
      return;
    }

    if (this.mode === 'reset') {
      this.resetPassword();
      return;
    }

    if (!this.password) {
      this.errorMessage = 'Completá la clave.';
      return;
    }

    if (this.mode === 'signup' && !this.name.trim()) {
      this.errorMessage = 'Completá tu nombre.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.message = '';


  /**
   * @function request
   * @description Realiza la solicitud de autenticación correspondiente según el modo actual. 
   */
    const request = this.mode === 'signin'
      ? this.authService.signIn(this.email.trim(), this.password)
      : this.authService.signUp({
          name: this.name.trim(),
          email: this.email.trim(),
          password: this.password
        });

    request
      .then((result) => {
        // Si era login correcto, ya entramos. Si era registro, pasamos a pedir el codigo del mail.
        if (this.mode === 'signin') {
          this.user = result as AuthenticatedUser;
          this.message = 'Sesión iniciada correctamente.';
          this.router.navigateByUrl('/tabs/tab1');
          return;
        }

        this.mode = 'confirm';
        this.message = 'Cuenta creada. Ingresá el código que recibiste por mail.';
      })
      .catch((error: unknown) => {
        // Si Cognito avisa que falta confirmar, llevamos directo al paso del codigo.
        console.warn('Cognito rechazo la operacion:', error);
        if (this.isUserNotConfirmed(error)) {
          this.mode = 'confirm';
          this.message = 'Tu cuenta existe, pero falta confirmar el código que te mandamos por mail.';
        }
        this.errorMessage = this.getErrorMessage(error);
      })
      .finally(() => {
        this.isLoading = false;
      });
  }


    /**
   * @function sendPasswordResetCode
   * @description Inicia el proceso de recuperación de contraseña enviando un código al mail del usuario.
   */
  sendPasswordResetCode(): void {
    // Primer paso de "olvide mi clave": se pide el codigo de recuperacion por mail.
    this.isLoading = true;
    this.errorMessage = '';
    this.message = '';

    this.authService.forgotPassword(this.email.trim())
      .then(() => {
        this.mode = 'reset';
        this.message = 'Te enviamos un código para recuperar tu clave.';
      })
      .catch((error: unknown) => {
        console.warn('Cognito rechazo la recuperacion:', error);
        this.errorMessage = this.getErrorMessage(error);
      })
      .finally(() => {
        this.isLoading = false;
      });
  }


  /**
   * @function resetPassword
   * @description Completa el proceso de recuperación de contraseña confirmando el código recibido y estableciendo una nueva clave.
   */
  resetPassword(): void {
    // Segundo paso de recuperacion: el usuario carga codigo y nueva clave.
    if (!this.confirmationCode.trim()) {
      this.errorMessage = 'Ingresá el código que recibiste por mail.';
      return;
    }

    if (!this.password) {
      this.errorMessage = 'Ingresá tu nueva clave.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.message = '';

    this.authService.confirmNewPassword(this.email.trim(), this.confirmationCode.trim(), this.password)
      .then(() => {
        this.mode = 'signin';
        this.confirmationCode = '';
        this.password = '';
        this.message = 'Clave actualizada. Ya podés iniciar sesión.';
      })
      .catch((error: unknown) => {
        console.warn('Cognito rechazo el cambio de clave:', error);
        this.errorMessage = this.getErrorMessage(error);
      })
      .finally(() => {
        this.isLoading = false;
      });
  }


  /**
   * @function confirmAccount
   * @description Confirma la cuenta del usuario utilizando el código recibido por mail. 
   * Si la confirmación es exitosa y se tiene la clave, también inicia sesión automáticamente.
   */
  confirmAccount(): void {
    // Confirma la cuenta con el codigo recibido. Si tenemos la clave, tambien iniciamos sesion.
    if (!this.confirmationCode.trim()) {
      this.errorMessage = 'Ingresá el código de confirmación.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.message = '';

    this.authService.confirmSignUp(this.email.trim(), this.confirmationCode.trim())
      .then(() => {
        this.confirmationCode = '';

        if (!this.password) {
          this.mode = 'signin';
          this.message = 'Cuenta confirmada. Ya podés iniciar sesión.';
          return;
        }

        return this.authService.signIn(this.email.trim(), this.password)
          .then((user) => {
            this.user = user;
            this.message = 'Cuenta confirmada. Sesión iniciada correctamente.';
            this.router.navigateByUrl('/tabs/tab1');
          });
      })
      .catch((error: unknown) => {
        console.warn('Cognito rechazo la confirmacion:', error);
        this.errorMessage = this.getErrorMessage(error);
      })
      .finally(() => {
        this.isLoading = false;
      });
  }


  /**
   * @function resendCode
   * @description Permite al usuario solicitar un nuevo código de confirmación en caso de no haber recibido el original.
   */
  resendCode(): void {
    // Boton para reenviar codigo cuando el usuario no lo encontro o tardo demasiado.
    if (!this.email.trim()) {
      this.errorMessage = 'Completá tu mail para reenviar el código.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.message = '';

    this.authService.resendConfirmationCode(this.email.trim())
      .then(() => {
        this.message = 'Enviamos un nuevo código a tu mail.';
      })
      .catch((error: unknown) => {
        console.warn('Cognito rechazo el reenvio:', error);
        this.errorMessage = this.getErrorMessage(error);
      })
      .finally(() => {
        this.isLoading = false;
      });
  }


  /**
   * @function signOut
   * @description Permite al usuario cerrar sesión manualmente desde la pantalla de cuenta/login. 
   */
  signOut(): void {
    // Cierre de sesion manual desde la pantalla de cuenta/login.
    this.authService.signOut();
    this.user = null;
    this.password = '';
    this.message = 'Sesión cerrada.';
    this.router.navigateByUrl('/login');
  }


  /**
   * @function getErrorMessage
   * @description Traduce errores técnicos de Cognito a mensajes claros para el usuario.
   */
  private getErrorMessage(error: unknown): string {
    // Traduce errores tecnicos de Cognito a mensajes claros para un usuario de Argentina/Latam.
    const message = this.extractErrorMessage(error);

    if (message.includes('NotAuthorizedException') || message.includes('Incorrect username or password')) {
      return 'Mail o clave incorrectos. Revisá los datos e intentá otra vez.';
    }

    if (message.includes('UserNotFoundException') || message.includes('User does not exist')) {
      return 'No encontramos una cuenta con ese mail. Revisá el dato o registrate.';
    }

    if (message.includes('PasswordResetRequiredException')) {
      return 'Tenés que cambiar tu clave para poder ingresar.';
    }

    if (message.includes('Too many failed attempts') || message.includes('Attempt limit exceeded')) {
      return 'Hubo demasiados intentos. Esperá unos minutos y volvé a probar.';
    }

    if (message.includes('TooManyRequestsException')) {
      return 'Se hicieron demasiados pedidos. Esperá unos minutos y volvé a intentar.';
    }

    if (message.includes('Password did not conform with policy')) {
      return 'La clave no cumple la política: usá mayúscula, minúscula, número y un símbolo. Ejemplo: Estudio123!';
    }

    if (message.includes('User already exists')) {
      return 'Ya existe una cuenta con ese mail. Probá iniciar sesión.';
    }

    if (message.includes('Invalid email address format')) {
      return 'Ingresá un mail válido. Ejemplo: alumno@studyapp.com';
    }

    if (message.includes('Username should be an email')) {
      return 'El usuario debe ser un mail válido. Ejemplo: alumno@studyapp.com';
    }

    if (message.includes('InvalidParameterException')) {
      return 'Revisá los datos ingresados e intentá otra vez.';
    }

   if (message.includes('InvalidPasswordException')) {
      return 'La clave no cumple los requisitos. Usá mayúscula, minúscula, número y un símbolo (ej: Estudio123!)';
    }

    if (message.includes('Unable to verify secret hash')) {
      return 'La configuración del inicio de sesión no está lista para usar en la app.';
    }

    if (message.includes('Invalid verification code provided')) {
      return 'El código no es válido. Revisalo en tu mail e intentá otra vez.';
    }

    if (message.includes('User cannot be confirmed')) {
      return 'La cuenta ya fue confirmada. Probá iniciar sesión.';
    }

    if (message.includes('UserNotConfirmedException')) {
      return 'Tu cuenta todavía no está confirmada. Ingresá el código que recibiste por mail.';
    }

    if (message.includes('LimitExceededException')) {
      return 'Se pidieron demasiados códigos. Esperá unos minutos antes de reenviar otro.';
    }

    if (message.includes('Username/client id combination not found')) {
      return 'No encontramos ese mail. Revisá que sea el mismo que usaste al registrarte.';
    }

    if (message.includes('CodeMismatchException')) {
      return 'El código no coincide. Revisalo en tu mail e intentá otra vez.';
    }

    if (message.includes('ExpiredCodeException')) {
      return 'El código venció. Pedí uno nuevo e intentá otra vez.';
    }

    if (message.includes('NetworkError')) {
      return 'No pudimos conectar con el servicio de inicio de sesión. Revisá tu conexión.';
    }

    return 'No pudimos completar la operación.';
  }


  /**
   * @function extractErrorMessage
   * @description Extrae un mensaje de error legible a partir de la estructura de error que devuelve Cognito.
   */
  private extractErrorMessage(error: unknown): string {
    // Cognito puede devolver errores con formas distintas; aca los convertimos a texto para analizarlos.
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'object' && error !== null) {
      const maybeError = error as { message?: unknown; name?: unknown; code?: unknown };
      const parts = [maybeError.name, maybeError.code, maybeError.message]
        .filter((part): part is string => typeof part === 'string' && part.length > 0);

      return parts.join(': ');
    }

    return String(error ?? '');
  }


  /**
   * @function isUserNotConfirmed
   * @description Detecta si el error corresponde a una cuenta que aún no está confirmada.
   */
  private isUserNotConfirmed(error: unknown): boolean {
    // Detecta el caso especial donde la cuenta existe pero todavia falta confirmar el mail.
    return this.extractErrorMessage(error).includes('UserNotConfirmedException');
  }
}

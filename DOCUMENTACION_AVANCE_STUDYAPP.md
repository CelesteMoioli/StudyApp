# StudyApp - Documentacion de avance

## 1. Contexto del trabajo

Este documento resume el avance realizado en StudyApp para el Trabajo Practico Final de la materia Desarrollo de Aplicaciones para Dispositivos Moviles.

La consigna de aprobacion pide que la app este desarrollada con TypeScript e Ionic, que tenga login, que consuma una API publica para una funcionalidad principal, que use almacenamiento local o alguna funcionalidad del dispositivo, y que el codigo este documentado para poder explicar su funcionamiento.

## 2. Objetivo de la app

StudyApp busca ser una aplicacion de estudio para estudiantes. La idea es que el usuario pueda ingresar con una cuenta, buscar temas academicos, leer contenido dentro de la app, guardar avances y preparar material para compartir con salas de estudio.

El objetivo principal es que el usuario no tenga que salir de la aplicacion para estudiar. Por eso la seccion Wiki permite buscar temas en Wikipedia y leerlos dentro de StudyApp.


## 3. Login y autenticacion

Se integro Amazon Cognito como sistema de autenticacion.

Datos configurados:

- Region: `us-east-2`
- User Pool: `us-east-2_qELFXPeXl`
- Client ID: `5pkiqvlajre00djkjck5o26k9t`

Flujo armado:

- Si el usuario no esta logueado, primero ve la pantalla de login.
- Si tiene cuenta, ingresa con mail y clave.
- Si no tiene cuenta, puede registrarse desde la misma pantalla.
- Despues del registro, Cognito envia un codigo al mail.
- La app permite confirmar la cuenta con ese codigo.
- Si intenta ingresar sin confirmar la cuenta, la app muestra automaticamente el paso para cargar el codigo.
- Se agrego reenvio de codigo.
- Se agrego recuperacion de clave con codigo por mail.

Se ajustaron los mensajes para que esten en espanol latino/argentino, evitando errores tecnicos en ingles para el usuario final.

## 4. API publica utilizada

La funcionalidad principal de lectura usa la API publica de Wikipedia en espanol.

Servicio usado:

`https://es.wikipedia.org/w/api.php`

Acciones utilizadas:

- `opensearch`: busca temas y devuelve titulo, descripcion y URL.
- `parse`: obtiene el contenido completo del articulo en HTML.

La app no redirige al usuario a Wikipedia para leer. El articulo se procesa y se muestra dentro de StudyApp.

## 5. Lector interno de Wiki

Se mejoro la seccion Wiki para que funcione como un lector interno.

Funcionalidades agregadas:

- Buscar temas desde Wikipedia.
- Mostrar un Top 5 de resultados relevantes.
- Abrir el tema dentro de StudyApp.
- Volver al listado de resultados.
- Ver porcentaje de lectura.
- Subir y bajar por tramos desde el menu del lector.
- Buscar palabras dentro del articulo.
- Guardar manualmente el punto de lectura.
- Guardar automaticamente el avance mientras el usuario lee.
- Retomar una lectura desde el ultimo punto guardado.
- Marcar temas como favoritos.
- Ver lecturas recientes desde "Seguir".
- Ver favoritos desde la seccion de accesos rapidos.
- Compartir el tema con la funcion nativa del navegador/dispositivo cuando esta disponible.
- Preparar la accion de compartir en salas para una etapa posterior.

## 6. Uso de LocalStorage

Se utiliza LocalStorage para guardar datos propios de StudyApp, excepto usuarios de ingreso.

Datos guardados:

- Favoritos de Wiki.
- Progreso de lectura por articulo.
- Posicion exacta del scroll para retomar.
- Lecturas recientes.

Esto cumple con el requisito de almacenamiento local indicado en la consigna.

## 7. Funcionalidad nativa o del dispositivo

La app usa almacenamiento local del dispositivo/navegador mediante LocalStorage.

Ademas, el lector intenta usar la API nativa de compartir cuando esta disponible:

- En celular puede abrir el menu nativo de compartir.
- En navegador sin soporte, copia el enlace al portapapeles como alternativa.

## 8. Pantallas y componentes principales trabajados

### Login / cuenta

Componentes:

- Input de email.
- Input de contrasena.
- Boton ingresar.
- Registro para usuario nuevo.
- Confirmacion de codigo.
- Reenvio de codigo.
- Recuperacion de clave.

Objetivo:

Permitir que solo usuarios autenticados puedan avanzar a la app.

### Wiki

Componentes:

- Buscador de temas.
- Resultados de Wikipedia.
- Accesos rapidos a "Seguir", "Favoritos" y "Compartidos".
- Lector interno.
- Menu de lectura con subir, bajar, buscar, guardar, favorito y compartir.

Objetivo:

Permitir estudiar desde la app sin abrir paginas externas.

## 9. Archivos principales modificados

- `src/app/tab4/tab4.page.ts`: logica de busqueda, lector, progreso, favoritos, recientes y compartir.
- `src/app/tab4/tab4.page.html`: estructura visual de la pantalla Wiki y lector interno.
- `src/app/tab4/tab4.page.scss`: estilos del buscador, resultados y experiencia de lectura.
- `src/app/services/wikipedia.service.ts`: consumo de la API publica de Wikipedia.
- `src/app/tab5/*`: pantalla de login, registro, confirmacion y recuperacion.
- `src/app/services/auth.service.ts`: integracion con Cognito.
- `src/app/guards/auth.guard.ts`: bloqueo de rutas si no hay sesion.
- `src/app/tabs/*`: ocultar la barra inferior cuando se usa el lector.
- `src/environments/environment.ts`: configuracion de Cognito.
- `src/assets/icon/*`: favicon e icono visible en el navegador.
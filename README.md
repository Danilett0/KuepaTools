# KuepaTools

## Configuración del Entorno

Para ejecutar la aplicación, necesitas configurar las variables de entorno:

1. Copia el archivo `.env.example` a `.env`
2. En el archivo `.env`, establece el valor de `REACT_APP_LOGIN_PASSWORD` con la contraseña deseada

```bash
REACT_APP_LOGIN_PASSWORD=tu_contraseña_aqui
```

### Importante
- El archivo `.env` nunca debe ser compartido o subido al repositorio
- Para despliegues en Netlify, configura la variable de entorno `REACT_APP_LOGIN_PASSWORD` en la configuración del sitio:
  1. Ve a la configuración del sitio en Netlify
  2. Navega a "Site settings" > "Build & deploy" > "Environment"
  3. Agrega una nueva variable de entorno:
     - Key: `REACT_APP_LOGIN_PASSWORD`
     - Value: [tu contraseña]

## Desarrollo Local

```bash
npm install
npm start
```
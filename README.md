# App de Fichaje y Control Horario (React + Next.js)

Una aplicación sencilla, moderna y responsiva para fichar horas de trabajo, seleccionando la fecha y la modalidad de trabajo (🏢 Oficina o 🏠 Teletrabajo/Casa). Cuenta con un temporizador dinámico integrado en el propio botón de acción y persistencia automática en el navegador.

## ✨ Características

- 📅 **Selector de fecha**: Desplegable/selector para elegir el día de la jornada laboral (por defecto la fecha actual).
- 🏢 / 🏠 **Selector de ubicación**: Elige fácilmente si estás trabajando en la **Oficina** o en **Casa** (Teletrabajo).
- ⏱️ **Botón "START" con contador en vivo**:
  - En reposo muestra el botón **START**.
  - Al pulsar, el botón se transforma mostrando el **contador en tiempo real** (`HH:MM:SS`) y la opción de **Detener y Guardar**.
- 💾 **Persistencia con LocalStorage**:
  - Si recargas la página o cierras el navegador, el contador activo no se pierde; calcula con precisión el tiempo real transcurrido (`Date.now() - startTime`).
  - Todo el historial de fichajes queda almacenado localmente.
- 📊 **Resumen y Estadísticas**:
  - Visualización del total de horas trabajadas hoy.
  - Desglose de horas acumuladas en Oficina y en Casa.
- 📋 **Historial de Jornadas**:
  - Listado con fecha, hora de entrada, hora de salida, lugar de trabajo y duración total.
  - Opción de añadir notas descriptivas a cada jornada.
  - Exportación de registros a formato **CSV** (ideal para enviar a RRHH o control de empresa).
  - Posibilidad de eliminar registros o limpiar el historial.

---

## 🚀 Puesta en Marcha Local

1. Instalar dependencias (si no están instaladas):
   ```bash
   npm install
   ```

2. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

3. Abre en tu navegador [http://localhost:3000](http://localhost:3000).

---

## 🌐 Despliegue en Next.js

Esta aplicación está construida con la arquitectura estándar de **Next.js** (App Router), por lo que puedes desplegarla en cuestión de segundos:

### Opción 1: Despliegue en Vercel (Recomendado para Next.js)
1. Sube este repositorio a tu cuenta de GitHub, GitLab o Bitbucket:
   ```bash
   git add .
   git commit -m "feat: app de fichaje de horas con temporizador"
   git push origin main
   ```
2. Entra en [vercel.com](https://vercel.com) e importa el repositorio.
3. Vercel detectará automáticamente la configuración de Next.js y realizará el despliegue con un solo clic.

### Opción 2: Despliegue en Netlify
1. Conecta tu repositorio en [netlify.com](https://netlify.com).
2. El comando de build es `npm run build` y el directorio de publicación es `.next`.

### Opción 3: Despliegue en Servidor Node / Docker
```bash
npm run build
npm run start
```
El servidor escuchará en el puerto 3000.


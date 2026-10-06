# Cine Blossom

Plataforma web para la venta de entradas y la gestión de un cine: compra online con selección de butacas, candy bar, puntos, cupones, validación de entradas y reportes para el administrador.

**Demo:** [https://tu-proyecto.vercel.app](https://cine-blossom-web.vercel.app/home)
**Repositorio:** https://github.com/LautaroDistefano/cine-blossom-web

Proyecto de parcial de Programación. Autor: Lautaro Torres Distefano.

## Tecnologías
...

- Angular (standalone components y signals)
- Supabase: base de datos, autenticación, Storage y Realtime
- Chart.js, jsPDF, qrcode y html5-qrcode
- Despliegue en Vercel

## Funcionalidades

**Clientes**
- Compra de entradas con mapa de butacas en tiempo real, incluso sin registro
- Entrada en PDF con código QR y código escrito
- Candy bar con combos y productos canjeables con puntos
- Un punto por cada peso pagado
- Cupones de descuento, incluido uno para mayores de 50 años
- Cancelación hasta 2 horas antes de la función, con el monto como crédito
- Reseñas y calificaciones de películas

**Empleado**
- Validación de entradas por cámara o ingreso manual del código

**Administrador**
- Gestión de películas, funciones y productos del candy bar
- Asignación automática de sala, sin superposiciones y con 30 minutos de margen
- Reporte de facturación con gráficos de ventas
- Registro de actividad

## Roles

`cliente`, `admin` y `empleado`. El rol se guarda en la columna `rol` de la tabla `perfiles`.

## Instalación

```bash
npm install
ng serve
```

La aplicación queda disponible en `http://localhost:4200/`.

Antes de iniciar, completá la URL y la clave pública de tu proyecto de Supabase en `src/app/environments/environments.ts`.

## Pruebas

```bash
ng test
```

## Pendiente

- Exportar el reporte de facturación a PDF y Excel

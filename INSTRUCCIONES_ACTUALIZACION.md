# Instrucciones para Actualizar el Dashboard de Blanes Capital

## Archivo de Datos Maestros

El archivo `DATOS_MAESTROS_BLANES_CAPITAL.csv` contiene todos los datos que se muestran en el dashboard.

### Como abrir el archivo

1. **En Excel**: Abrir > Seleccionar archivo > En el asistente de importacion:
   - Delimitado por: Punto y coma (;)
   - Codificacion: UTF-8

2. **En Google Sheets**: Archivo > Importar > Subir archivo

---

## Estructura del Archivo

### SECCION 1: Configuracion del Periodo
- Titulo y fecha de cada periodo

### SECCION 2: Datos Totales
- Patrimonio combinado
- Rentabilidad promedio
- Rentas inmobiliarias totales
- Costes de estructura

### SECCION 3: Datos Pablo
- Patrimonio (total, bajo gestion, empresarial)
- Rentabilidad
- Composicion de cartera (RF, RV, MP)
- Distribucion por bancos

### SECCION 4: Datos Alejandro
- Misma estructura que Pablo

### SECCION 5: Estructura de Costes
- Gastos mensuales
- Budget vs Real

### SECCION 6: Datos Historicos
- Evolucion patrimonial por anos

### SECCION 7: Cash Flow
- Ingresos anuales
- Ingresos optimizados (solo inmuebles)

### SECCION 8: Datos Fiscales
- Impuestos (IP, IS, IRPF)
- Ganancias realizadas vs latentes

---

## Como Actualizar para un Nuevo Periodo

### Paso 1: Rellenar el Excel
1. Abre `DATOS_MAESTROS_BLANES_CAPITAL.csv`
2. Busca la columna del nuevo periodo (ej: `2S_2025`)
3. Rellena todos los campos con los nuevos valores

### Paso 2: Actualizar app.js
Abre el archivo `app.js` y actualiza el objeto `periodData`:

```javascript
const periodData = {
    '2024': { ... },      // Ya existe
    '1s2025': { ... },    // Ya existe
    '2s2025': {           // NUEVO PERIODO
        title: '2do Semestre 2025',
        date: '31 de diciembre de 2025',
        total: {
            bajoGestion: XXX,
            rentabilidad: XXX,
            rentasInmob: XXX,
            costeEstructura: XXX,
            costeEstructuraTotal: XXX
        },
        pablo: {
            patrimonioTotal: XXX,
            bajoGestion: XXX,
            empresarial: XXX,
            rentabilidad: XXX,
            rentabilidadSinUSD: XXX,
            rentasInmob: XXX,
            carteraFinanciera: XXX,
            carteraInmobiliaria: XXX,
            alternativas: XXX,
            rotacion: XXX,
            exposicionUSD: XXX,
            ocupacion: XXX,
            rf: XX, rv: XX, mp: XX,
            bancos: { jp: XX, gs: XX, march: XX, andbank: XX }
        },
        ale: {
            // Misma estructura que pablo
        },
        estructura: {
            total: XXXXX,
            ratio: X.XX,
            budget: XXXXX,
            mensual: {
                ene: XX, feb: XX, mar: XX, abr: XX, may: XX, jun: XX,
                jul: XX, ago: XX, sep: XX, oct: XX, nov: XX, dic: XX
            }
        }
    }
};
```

### Paso 3: Actualizar Datos Historicos
Si es fin de ano, actualiza `historicalData`:

```javascript
const historicalData = {
    years: ['2020', '2021', '2022', '2023', '2024', '2025', '2026'],
    pablo: {
        bajoGestion: [111.9, 86.5, 85.0, 87.9, 88.43, XX.X, XX.X],
        empresarial: [20.2, 27.5, 43.5, 36.1, 37.66, XX.X, XX.X]
    },
    ale: {
        bajoGestion: [91.2, 67.6, 66.8, 70.0, 72.63, XX.X, XX.X],
        empresarial: [40.9, 56.5, 91.8, 74.7, 77.45, XX.X, XX.X]
    }
};
```

### Paso 4: Actualizar Selector de Periodo en HTML
En `index.html`, anade el nuevo boton:

```html
<div class="period-buttons">
    <button class="period-btn" data-period="2024">Cierre 2024</button>
    <button class="period-btn" data-period="1s2025">1S 2025</button>
    <button class="period-btn active" data-period="2s2025">2S 2025</button>  <!-- NUEVO -->
</div>
```

### Paso 5: Subir Cambios
```bash
git add .
git commit -m "Actualizar datos para [PERIODO]"
git push
```

### Paso 6: Actualizar en PythonAnywhere
```bash
cd ~/Blanescapital-Board
git pull
# Luego hacer Reload en la pestana Web
```

---

## Unidades de Medida

| Simbolo | Significado |
|---------|-------------|
| M | Millones de euros |
| K | Miles de euros |
| % | Porcentaje |

---

## Campos Importantes

### Rentabilidad
- `rentabilidad`: Rentabilidad total incluyendo efecto divisa
- `rentabilidadSinUSD`: Rentabilidad excluyendo efecto dolar (para ver rendimiento real)

### Patrimonio
- `patrimonioTotal`: Todo el patrimonio
- `bajoGestion`: Patrimonio gestionado activamente (carteras financieras + inmuebles)
- `empresarial`: Participaciones en empresas (no liquido)

### Composicion Cartera
- `rf`: Renta Fija (bonos)
- `rv`: Renta Variable (acciones)
- `mp`: Mercado Monetario (liquidez)

---

## Contacto

Para dudas sobre actualizacion: alejandro@blanescapital.com

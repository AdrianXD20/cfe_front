const meses = {
  'Enero': 0,
  'Febrero': 1,
  'Marzo': 2,
  'Abril': 3,
  'Mayo': 4,
  'Junio': 5,
  'Julio': 6,
  'Agosto': 7,
  'Septiembre': 8,
  'Octubre': 9,
  'Noviembre': 10,
  'Diciembre': 11
};

// Almacenar metas globalmente
let metas = {};

async function fetchIndicadores(endpoint) {
  try {
    const response = await fetch(`https://cfe-indicadores-back.onrender.com${endpoint}`); //here
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    const indicadores = await response.json();
    return indicadores;
  } catch (error) {
    console.error('Error al obtener indicadores:', error);
    alert('No se pudieron cargar los datos de la API. Verifica que el servidor esté corriendo.');
    return [];
  }
}

function procesarIndicadores(indicadores) {
  const metasProcesadas = {};
  indicadores.forEach(indicador => {
    if (indicador.Departamento && indicador.month && meses[indicador.month] !== undefined) {
      const key = `${indicador.Departamento}-${meses[indicador.month]}`;
      metasProcesadas[key] = {
        meta: indicador.meta,
        real: indicador.real,
        acumulado: indicador.acumulado
      };
    } else {
      console.warn('Documento ignorado:', indicador);
    }
  });
  return metasProcesadas;
}

async function cargarDatos(endpoint) {
  const indicadores = await fetchIndicadores(endpoint);
  console.log('Indicadores obtenidos:', indicadores);
  metas = procesarIndicadores(indicadores);
  console.log('Metas procesadas:', metas);

  const circles = document.querySelectorAll('.circle');
  circles.forEach(circle => {
    const row = circle.dataset.row;
    const col = circle.dataset.col;
    const key = `${row}-${col}`;
    const data = metas[key];

    if (data) {
      let colorClass = '';
      if (data.real > data.meta) {
        colorClass = 'verde';
      } else if (data.real < data.meta) {
        colorClass = 'rojo';
      } else {
        colorClass = 'amarillo';
      }

      const parentTd = circle.parentElement;
      parentTd.innerHTML = `
        <div class="cell-content">
          <div class="circle ${colorClass}">${data.real}</div>
          <div class="data-text">
            <div>Meta: <strong>${data.meta}</strong></div>
            <div>Real: <strong>${data.real}</strong></div>
            <div>Acumulado: <strong>${data.acumulado}</strong></div>
          </div>
        </div>
      `;
    } else {
      console.warn(`No se encontraron datos para ${key}`);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const endpoint = window.endpoint || '/api/inconformidades';
  cargarDatos(endpoint);
});

function generarPDF() {
  const tabla = document.getElementById('hola');
  const opt = {
    margin: [0.5, 0.5, 0.5, 0.5],
    filename: 'tabla-Indicadores.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 3,
      useCORS: true,
      scrollY: 0
    },
    jsPDF: {
      unit: 'in',
      format: 'a2',
      orientation: 'landscape'
    },
    pagebreak: {
      mode: ['avoid-all', 'css', 'legacy']
    }
  };
  html2pdf().set(opt).from(tabla).save();
}

function exportarExcel() {
  if (!metas || Object.keys(metas).length === 0) {
    alert('No hay datos cargados para exportar. Por favor, espera a que los datos se carguen o verifica la conexión con el servidor.');
    return;
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Reporte_Indicadores');

  // Encabezado superior (Indicador + Meses)
  ws.mergeCells('A1:A2');
  ws.getCell('A1').value = 'Indicador';
  ws.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getCell('A1').font = { bold: true };

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio',
                 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  meses.forEach((mes, i) => {
    const colIndex = i * 2 + 2;
    const col1 = ws.getColumn(colIndex);
    const col2 = ws.getColumn(colIndex + 1);
    col1.width = 12;
    col2.width = 12;

    const cell1 = ws.getCell(1, colIndex);
    cell1.value = mes;
    cell1.alignment = { horizontal: 'center' };
    cell1.font = { bold: true };
    ws.mergeCells(1, colIndex, 1, colIndex + 1);

    ws.getCell(2, colIndex).value = 'Meta';
    ws.getCell(2, colIndex + 1).value = 'Real';
    ws.getCell(2, colIndex).alignment = { horizontal: 'center' };
    ws.getCell(2, colIndex + 1).alignment = { horizontal: 'center' };
    ws.getCell(2, colIndex).font = { bold: true };
    ws.getCell(2, colIndex + 1).font = { bold: true };
  });

  // Datos
  let filaIndex = 3;
  const indicadores = ["Centro", "Norte", "Sur", "Oriente", "Poniente", "Progreso", "Hunucma", "Uman", "Acanceh", "Conkal","total"];

  indicadores.forEach(indicador => {
    const fila = ws.getRow(filaIndex);
    fila.getCell(1).value = indicador;
    fila.getCell(1).alignment = { horizontal: 'left' };

    for (let i = 0; i < 12; i++) {
      const key = `${indicador}-${i}`;
      const datos = metas[key] || { meta: 'N/A', real: 'N/A' };
      const colBase = i * 2 + 2;
      fila.getCell(colBase).value = datos.meta;
      fila.getCell(colBase + 1).value = datos.real;

      let color = 'FFFFFF';
      if (typeof datos.real === 'number' && typeof datos.meta === 'number') {
        if (datos.real > datos.meta) color = '00FF00';
        else if (datos.real < datos.meta) color = 'FF0000';
        else color = 'FFFF00';
      }
      fila.getCell(colBase + 1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: color }
      };
    }

    filaIndex++;
  });

  ws.getRows(1, 2).forEach(row => {
    row.eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0F0F0' }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
      };
    });
  });

  wb.xlsx.writeBuffer().then(buffer => {
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Reporte_Indicadores.xlsx";
    link.click();
    URL.revokeObjectURL(link.href);
  }).catch(error => {
    console.error('Error al generar el Excel:', error);
    alert('Error al generar el archivo Excel. Revisa la consola para más detalles.');
  });
}

function toggleModo() {
  document.body.classList.toggle('modo-oscuro');
  localStorage.setItem('modo', document.body.classList.contains('modo-oscuro') ? 'oscuro' : 'claro');
}

window.onload = () => {
  if (localStorage.getItem('modo') === 'oscuro') {
    document.body.classList.add('modo-oscuro');
  }
};
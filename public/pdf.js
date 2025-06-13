import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function generarPDF() {
  const tabla = document.querySelector('.tabla-indicadores');

  html2canvas(tabla).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('landscape');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
    pdf.save('tabla.pdf');
  });
}

export default generarPDF;
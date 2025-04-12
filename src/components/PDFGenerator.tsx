'use client'

import { useCallback } from 'react';

export default function PDFGenerator() {
  const generatePDF = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const html2pdf = (await import('html2pdf.js')).default;

    const element = document.getElementById('proforma');
    if (!element) {
      alert('No se encontró el contenido para generar el PDF');
      return;
    }

    const opt = {
      margin: 0.5,
      filename: 'proforma.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, logging: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  }, []);

  return (
    <button
      onClick={generatePDF}
      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
    >
      Generar PDF
    </button>
  );
}

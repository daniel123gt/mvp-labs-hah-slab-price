import puppeteer from "puppeteer";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { html } = await req.json();

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  // Inyectar CSS de forma dinámica si es necesario
  await page.setContent(`
    <html>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"> <!-- Asegúrate que Tailwind esté cargado -->
        <!-- Aquí puedes agregar más links a CSS si es necesario -->
      </head>
      <body>
        ${html} <!-- Contenido HTML generado dinámicamente -->
      </body>
    </html>
  `, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
  });

  await browser.close();

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=proforma.pdf",
    },
  });
}

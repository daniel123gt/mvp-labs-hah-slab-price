import chromium from "@sparticuz/chromium";
import { NextResponse } from "next/server";
import puppeteer from "puppeteer-core";

export async function POST(req: Request) {
  const { html } = await req.json();

  const isDev = process.env.NODE_ENV === "development";

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: isDev ? true : ("new" as any), // solución segura para producción
  });

  const page = await browser.newPage();

  await page.setContent(
    `
    <html>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
      </head>
      <body>
        ${html}
      </body>
    </html>
  `,
    { waitUntil: "networkidle0" }
  );

  const pdfBuffer = await page.pdf({
    format: "a4",
    printBackground: true,
    margin: { top: "50px", bottom: "20px", left: "20px", right: "20px" },
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

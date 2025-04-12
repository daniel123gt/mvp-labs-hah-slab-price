import chromium from "chrome-aws-lambda";
import { NextResponse } from "next/server";
import puppeteer from "puppeteer-core";

export async function POST(req: Request) {
  const { html } = await req.json();

  const executablePath = await chromium.executablePath;

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: executablePath || undefined,
    headless: chromium.headless,
  });

  const page = await browser.newPage();

  await page.setContent(`
    <html>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
      </head>
      <body>
        ${html}
      </body>
    </html>
  `, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "a4",
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

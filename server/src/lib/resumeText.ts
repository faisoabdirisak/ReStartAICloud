import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import mammoth from 'mammoth';

export async function extractResumeText(file: Buffer, extension: 'pdf' | 'docx') {
  if (extension === 'docx') {
    const { value } = await mammoth.extractRawText({ buffer: file });
    return value;
  }

  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const require = createRequire(import.meta.url);
  const packageRoot = dirname(require.resolve('pdfjs-dist/package.json'));
  const task = getDocument({
    standardFontDataUrl: pathToFileURL(join(packageRoot, 'standard_fonts')).href + '/',
    data: new Uint8Array(file),
    disableFontFace: true,
    useSystemFonts: false,
    stopAtErrors: true,
  });
  try {
    const document = await task.promise;
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= Math.min(document.numPages, 10); pageNumber++) {
      const page = await document.getPage(pageNumber);
      const { items } = await page.getTextContent();
      pages.push(
        items.map((item) => ('str' in item ? item.str + (item.hasEOL ? '\n' : '') : '')).join('')
      );
      page.cleanup();
    }
    return pages.join('\n');
  } finally {
    await task.destroy();
  }
}

const MAX_PDF_BYTES = 20 * 1024 * 1024;

export async function readValidatedPdf(file: File, label: string) {
  if (file.size === 0) throw new Error(`請上傳${label} PDF。`);
  if (file.size > MAX_PDF_BYTES) throw new Error(`${label}不得超過 20 MB。`);

  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension !== 'pdf' || (file.type && file.type !== 'application/pdf')) {
    throw new Error(`${label}僅接受 PDF 檔案。`);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.subarray(0, 5).toString('ascii') !== '%PDF-') {
    throw new Error(`上傳的${label}不是有效的 PDF 檔案。`);
  }

  return bytes;
}

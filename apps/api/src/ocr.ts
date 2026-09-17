export type InvoiceLine = {
  name: string;
  ean?: string;
  quantity?: number;
  unit?: string;
  netPrice?: number;
  grossPrice?: number;
  eurocashIndex?: string;
};

export type InvoiceExtraction = {
  supplier?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  lines: InvoiceLine[];
  rawText?: string;
  confidence: number;
};

export async function extractInvoiceText(buffer: Buffer): Promise<InvoiceExtraction> {
  // OCR provider is deliberately isolated behind this function.
  // Production deployment can connect an OCR service/API without changing the invoice module.
  void buffer;
  return { lines: [], confidence: 0, rawText: "" };
}

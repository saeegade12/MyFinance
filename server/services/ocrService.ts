import { createWorker } from 'tesseract.js';
import fs from 'fs';
import path from 'path';

export interface OCRResult {
  text: string;
  data: {
    merchant?: string;
    amount?: number;
    date?: string;
    items?: Array<{
      name: string;
      price: number;
    }>;
  };
}

export async function processReceiptOCR(receiptId: string, filePath: string): Promise<OCRResult> {
  let worker;
  
  try {
    // Create Tesseract worker
    worker = await createWorker('eng');
    
    // Read the image file
    const imageBuffer = fs.readFileSync(filePath);
    
    // Perform OCR
    const { data: { text } } = await worker.recognize(imageBuffer);
    
    // Parse the OCR text to extract structured data
    const parsedData = parseReceiptText(text);
    
    return {
      text,
      data: parsedData,
    };
  } catch (error) {
    console.error('OCR processing failed:', error);
    throw new Error('Failed to process receipt with OCR');
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}

function parseReceiptText(text: string): OCRResult['data'] {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const result: OCRResult['data'] = {};
  
  // Extract merchant (usually the first line or a line in all caps)
  const merchantLine = lines.find(line => 
    line.length > 3 && 
    (line === line.toUpperCase() || lines.indexOf(line) === 0)
  );
  if (merchantLine) {
    result.merchant = merchantLine;
  }
  
  // Extract total amount (look for patterns like "TOTAL $XX.XX" or "Amount: $XX.XX")
  const amountRegex = /(?:total|amount|sum)[\s:]*\$?(\d+\.?\d*)/i;
  const dollarRegex = /\$(\d+\.?\d{2})/g;
  
  for (const line of lines) {
    const amountMatch = line.match(amountRegex);
    if (amountMatch) {
      result.amount = parseFloat(amountMatch[1]);
      break;
    }
  }
  
  // If no total found, look for the largest dollar amount
  if (!result.amount) {
    let maxAmount = 0;
    const allAmounts = text.match(dollarRegex);
    if (allAmounts) {
      for (const amount of allAmounts) {
        const value = parseFloat(amount.replace('$', ''));
        if (value > maxAmount) {
          maxAmount = value;
        }
      }
      if (maxAmount > 0) {
        result.amount = maxAmount;
      }
    }
  }
  
  // Extract date (look for common date patterns)
  const dateRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
  for (const line of lines) {
    const dateMatch = line.match(dateRegex);
    if (dateMatch) {
      const [, month, day, year] = dateMatch;
      const fullYear = year.length === 2 ? `20${year}` : year;
      result.date = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      break;
    }
  }
  
  // Extract items (basic implementation - look for lines with prices)
  result.items = [];
  for (const line of lines) {
    const itemMatch = line.match(/^(.+?)\s+\$?(\d+\.?\d{2})$/);
    if (itemMatch && !line.toLowerCase().includes('total') && !line.toLowerCase().includes('tax')) {
      const [, name, price] = itemMatch;
      result.items.push({
        name: name.trim(),
        price: parseFloat(price),
      });
    }
  }
  
  return result;
}

export async function validateReceiptFile(filePath: string): Promise<boolean> {
  try {
    const stats = fs.statSync(filePath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    
    // Check file size (max 10MB)
    if (fileSizeInMB > 10) {
      return false;
    }
    
    // Check file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
    const fileExtension = path.extname(filePath).toLowerCase();
    
    return allowedExtensions.includes(fileExtension);
  } catch (error) {
    return false;
  }
}

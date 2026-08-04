import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';


export interface ParsedCvData extends Prisma.JsonObject {
  fullText: string;
  fileType: 'pdf' | 'docx';
  pageCount?: number;
}

@Injectable()
export class CvParserService {
  async parse(fileBuffer: Buffer, mimeType: string): Promise<ParsedCvData> {
    if (mimeType === 'application/pdf') {
      return this.parsePdf(fileBuffer);
    }

    if (
      mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      return this.parseDocx(fileBuffer);
    }

    throw new BadRequestException(
      `Unsupported file type for parsing: ${mimeType}`,
    );
  }

  private async parsePdf(buffer: Buffer): Promise<ParsedCvData> {
    const parser = new PDFParse({
      data: new Uint8Array(buffer),
    });

    try {
      const textResult = await parser.getText();
      const infoResult = await parser.getInfo();

      return {
        fullText: textResult.text,
        fileType: 'pdf',
        pageCount: infoResult.total,
      };
    } finally {
      await parser.destroy();
    }
  }

  private async parseDocx(buffer: Buffer): Promise<ParsedCvData> {
    const result = await mammoth.extractRawText({ buffer });
    return {
      fullText: result.value.trim(),
      fileType: 'docx',
    };
  }
}

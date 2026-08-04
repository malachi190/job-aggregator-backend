import { Injectable } from '@nestjs/common';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from 'docx';
import { TailoredContent } from '../../ai/interfaces/ai-provider.interface';

@Injectable()
export class DocxGeneratorService {
  async generateCvDocx(content: TailoredContent['cv']): Promise<Buffer> {
    const safe = {
      title: content?.title || 'Professional CV',
      contact: content?.contact || { email: '', phone: '' },
      summary: content?.summary || '',
      skills: content?.skills || {},
      experience: Array.isArray(content?.experience) ? content.experience : [],
      education: Array.isArray(content?.education) ? content.education : [],
      projects: Array.isArray(content?.projects) ? content.projects : [],
    };

    const children: any[] = [];

    // Header: Name + Title
    children.push(
      new Paragraph({
        text: safe.title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
    );

    // Contact line
    const contactParts = [
      safe.contact.email,
      safe.contact.phone,
      safe.contact.linkedin,
      safe.contact.github,
      safe.contact.portfolio,
    ].filter(Boolean);

    if (contactParts.length > 0) {
      const contactChildren: TextRun[] = [];
      contactParts.forEach((part, i) => {
        contactChildren.push(new TextRun({ text: part, size: 20 }));
        if (i < contactParts.length - 1) {
          contactChildren.push(
            new TextRun({ text: ' | ', size: 20, color: '666666' }),
          );
        }
      });

      children.push(
        new Paragraph({
          children: contactChildren,
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
        }),
      );
    }

    // Professional Summary
    if (safe.summary) {
      children.push(this.sectionHeading('PROFESSIONAL SUMMARY'));
      children.push(
        new Paragraph({
          children: [new TextRun({ text: safe.summary, size: 22 })],
          spacing: { after: 200 },
        }),
      );
    }

    // Skills
    if (Object.keys(safe.skills).length > 0) {
      children.push(this.sectionHeading('SKILLS / AREAS OF EXPERTISE'));
      for (const [category, items] of Object.entries(safe.skills)) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${category} `, size: 22, bold: true }),
              new TextRun({ text: String(items), size: 22 }),
            ],
            spacing: { after: 80 },
          }),
        );
      }
      children.push(new Paragraph({ spacing: { after: 100 } }));
    }

    // Experience
    if (safe.experience.length > 0) {
      children.push(this.sectionHeading('PROFESSIONAL EXPERIENCE'));
      for (const exp of safe.experience) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: exp.title, size: 22, bold: true })],
            spacing: { after: 40 },
          }),
        );
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: exp.company, size: 22 }),
              new TextRun({
                text: `    ${exp.dates}`,
                size: 20,
                color: '666666',
              }),
            ],
            spacing: { after: 80 },
          }),
        );
        for (const bullet of exp.bullets) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `• ${bullet}`, size: 22 })],
              spacing: { after: 60 },
              indent: { left: 360 },
            }),
          );
        }
        children.push(new Paragraph({ spacing: { after: 150 } }));
      }
    }

    // Education
    if (safe.education.length > 0) {
      children.push(this.sectionHeading('EDUCATION'));
      for (const edu of safe.education) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: edu.degree, size: 22, bold: true })],
            spacing: { after: 40 },
          }),
        );
        children.push(
          new Paragraph({
            children: [new TextRun({ text: edu.institution, size: 22 })],
            spacing: { after: 100 },
          }),
        );
      }
    }

    // Projects
    if (safe.projects.length > 0) {
      children.push(this.sectionHeading('PROJECTS'));
      for (const proj of safe.projects) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: proj.name, size: 22, bold: true })],
            spacing: { after: 40 },
          }),
        );
        if (proj.tech) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Tech: ', size: 22, bold: true }),
                new TextRun({ text: proj.tech, size: 22 }),
              ],
              spacing: { after: 60 },
            }),
          );
        }
        children.push(
          new Paragraph({
            children: [new TextRun({ text: proj.description, size: 22 })],
            spacing: { after: 150 },
          }),
        );
      }
    }

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            },
          },
          children,
        },
      ],
    });

    return Packer.toBuffer(doc);
  }

  async generateCoverLetterDocx(
    content: TailoredContent['coverLetter'],
  ): Promise<Buffer> {
    const safe = {
      greeting: content?.greeting || 'Dear Hiring Manager,',
      body: content?.body || '',
      closing: content?.closing || 'Sincerely,',
    };

    const paragraphs = safe.body
      .split(/\n\s*\n/)
      .map((para) => para.trim())
      .filter(Boolean);

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            },
          },
          children: [
            new Paragraph({
              children: [new TextRun({ text: safe.greeting, size: 22 })],
              spacing: { after: 300 },
            }),
            ...paragraphs.map(
              (para) =>
                new Paragraph({
                  children: [new TextRun({ text: para, size: 22 })],
                  spacing: { after: 300 },
                }),
            ),
            new Paragraph({
              children: [new TextRun({ text: safe.closing, size: 22 })],
              spacing: { before: 400 },
            }),
          ],
        },
      ],
    });

    return Packer.toBuffer(doc);
  }

  private sectionHeading(text: string): Paragraph {
    return new Paragraph({
      text,
      heading: HeadingLevel.HEADING_1,
      border: {
        bottom: {
          color: '000000',
          space: 1,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
      spacing: { before: 300, after: 150 },
    });
  }
}

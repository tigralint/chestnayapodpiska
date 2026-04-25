/**
 * Generates and downloads a professional .docx file using the 'docx' library.
 */
export const downloadWordDoc = async (
  fileName: string,
  recipientTitle: string,
  recipientName: string,
  senderInfo: string,
  mainHeading: string,
  subHeading: string,
  content: string
) => {
  // Load docx dynamically to improve initial page load performance
  const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } = await import('docx');

  // 1. Create the Document
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Times New Roman",
            size: 24, // 12pt
            color: "000000",
          },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1134,    // 2cm
            bottom: 1134, // 2cm
            left: 1701,   // 3cm
            right: 850,    // 1.5cm
          },
        },
      },
      children: [
        // --- RECIPIENT BLOCK (Шапка - вправо) ---
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { after: 200 },
          children: [
            new TextRun({ text: recipientTitle, bold: true }),
            new TextRun({ text: `\n${recipientName}`, break: 1 }),
          ],
        }),

        // --- SENDER BLOCK (вправо) ---
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { after: 600 },
          children: [
            new TextRun({ text: "От: ", bold: true }),
            new TextRun({ text: senderInfo }),
          ],
        }),

        // --- MAIN HEADING (центр, капсом) ---
        new Paragraph({
          alignment: AlignmentType.CENTER,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 100 },
          children: [
            new TextRun({ text: mainHeading, bold: true, size: 28 }),
          ],
        }),

        // --- SUB HEADING (центр, если есть) ---
        ...(subHeading ? [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({ text: subHeading, size: 24 }),
            ],
          })
        ] : []),

        // --- CONTENT BODY ---
        ...content.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .map(line =>
            new Paragraph({
              alignment: AlignmentType.BOTH,
              spacing: { line: 360, before: 120, after: 120 }, // 1.5 line spacing
              indent: { firstLine: 708 }, // 1.25cm indent
              children: [
                new TextRun({ text: line }),
              ],
            })
          ),

        // --- SIGNATURE BLOCK ---
        new Paragraph({
          spacing: { before: 800 },
          children: [
            new TextRun({
              text: `«___» ___________ 202_ г.                Подпись ________ / ________ /`,
            }),
          ],
        }),
      ],
    }],
  });

  // 2. Generate and Download
  try {
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error: unknown) {
    if (import.meta.env.DEV) console.error("Error generating DOCX:", error);
    throw new Error("Произошла ошибка при создании файла. Пожалуйста, скопируйте текст вручную.");
  }
};

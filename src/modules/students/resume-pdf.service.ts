import PDFDocument from "pdfkit";

type ResumePdfProfile = {
  name: string;
  course: string;
  skills: string[];
  availability: string[];
  headline?: string | null;
  summary?: string | null;
  city?: string | null;
  state?: string | null;
  semester?: string | null;
  university?: string | null;
  cr?: string | null;
  portfolio?: string | null;
};

function addOptionalLine(document: PDFKit.PDFDocument, label: string, value?: string | null) {
  if (value) document.font("Helvetica").text(`${label}: ${value}`);
}

export function generateResumePdf(profile: ResumePdfProfile): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({ size: "A4", margin: 56 });
    const chunks: Buffer[] = [];

    document.on("data", (chunk: Buffer) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    document.font("Helvetica-Bold").fontSize(22).text(profile.name);
    if (profile.headline) document.font("Helvetica").fontSize(12).text(profile.headline);

    document.moveDown(0.8).fontSize(10);
    addOptionalLine(document, "Curso", profile.course);
    addOptionalLine(document, "Universidade", profile.university);
    addOptionalLine(document, "Localização", [profile.city, profile.state].filter(Boolean).join(", "));
    addOptionalLine(document, "Semestre", profile.semester);
    addOptionalLine(document, "CR", profile.cr);
    addOptionalLine(document, "Portfólio", profile.portfolio);

    if (profile.summary) {
      document.moveDown().font("Helvetica-Bold").fontSize(12).text("Resumo");
      document.moveDown(0.25).font("Helvetica").fontSize(10).text(profile.summary);
    }

    document.moveDown().font("Helvetica-Bold").fontSize(12).text("Habilidades");
    document.moveDown(0.25).font("Helvetica").fontSize(10).text(profile.skills.join(" • "));

    document.moveDown().font("Helvetica-Bold").fontSize(12).text("Disponibilidade");
    document.moveDown(0.25).font("Helvetica").fontSize(10).text(profile.availability.join(", "));

    document.end();
  });
}

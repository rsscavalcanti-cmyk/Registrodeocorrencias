/**
 * Gerador de PDF Profissional para Relatórios de Ocorrência
 * Versão aprimorada com suporte a múltiplas fotos em grid
 */

class ProfessionalPDFGenerator {
  constructor() {
    this.pageWidth = 210; // A4 width in mm
    this.pageHeight = 297; // A4 height in mm
    this.margin = 20;
    this.contentWidth = this.pageWidth - 2 * this.margin;
    this.colors = {
      primary: [14, 165, 233],
      secondary: [100, 116, 139],
      text: [15, 23, 42],
      lightGray: [248, 250, 252],
      border: [226, 232, 240]
    };
  }

  async generateReport(formData, photos = []) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    let currentY = this.addHeader(pdf, formData.reference);
    currentY = this.addFormFields(pdf, formData, currentY);
    
    if (photos.length > 0) {
      currentY = await this.addPhotosSection(pdf, photos, currentY);
    }
    
    this.addFooter(pdf);
    
    return pdf;
  }

  addHeader(pdf, reference) {
    // Cabeçalho com gradiente simulado
    pdf.setFillColor(...this.colors.primary);
    pdf.rect(0, 0, this.pageWidth, 45, 'F');
    
    // Adicionar uma faixa mais clara para simular gradiente
    pdf.setFillColor(56, 189, 248);
    pdf.rect(0, 0, this.pageWidth, 25, 'F');
    
    // Título principal
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RELATÓRIO DE OCORRÊNCIA', this.margin, 20);
    
    // Subtítulo
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Sistema de Gestão de Obras', this.margin, 30);
    
    // Referência
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Ref: ${reference}`, this.margin, 40);
    
    // Data/hora no canto direito
    const now = new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const dateText = `Gerado em: ${now}`;
    const dateWidth = pdf.getTextWidth(dateText);
    pdf.setFontSize(10);
    pdf.text(dateText, this.pageWidth - this.margin - dateWidth, 40);
    
    return 60; // Retorna posição Y após o cabeçalho
  }

  addFormFields(pdf, data, startY) {
    pdf.setTextColor(...this.colors.text);
    let currentY = startY;
    const lineHeight = 8;
    const sectionSpacing = 12;
    
    // Seção: Identificação da Ocorrência
    currentY = this.addSectionTitle(pdf, 'IDENTIFICAÇÃO DA OCORRÊNCIA', currentY);
    currentY += 5;
    
    currentY = this.addField(pdf, 'Tipo de Ocorrência', data.tipo, currentY, true);
    currentY = this.addField(pdf, 'Bloco/Setor', data.bloco, currentY);
    currentY = this.addField(pdf, 'Pavimento/Unidade', data.pavimento, currentY);
    currentY = this.addField(pdf, 'Local Detalhado', data.local, currentY);
    
    currentY += sectionSpacing;
    
    // Seção: Descrição
    currentY = this.addSectionTitle(pdf, 'DESCRIÇÃO DA OCORRÊNCIA', currentY);
    currentY += 5;
    
    currentY = this.addField(pdf, 'Descrição Objetiva', data.descricao, currentY, false, true);
    
    currentY += sectionSpacing;
    
    // Seção: Ações e Prioridades
    currentY = this.addSectionTitle(pdf, 'AÇÕES E PRIORIDADES', currentY);
    currentY += 5;
    
    currentY = this.addField(pdf, 'Ação Solicitada', data.acao, currentY);
    currentY = this.addField(pdf, 'Prioridade', data.prioridade, currentY, true);
    currentY = this.addField(pdf, 'Prazo Desejado', data.prazo, currentY);
    currentY = this.addField(pdf, 'Responsável/Equipe', data.responsavel, currentY);
    
    return currentY + sectionSpacing;
  }

  addSectionTitle(pdf, title, y) {
    // Fundo da seção
    pdf.setFillColor(...this.colors.lightGray);
    pdf.rect(this.margin - 5, y - 5, this.contentWidth + 10, 12, 'F');
    
    // Borda esquerda colorida
    pdf.setFillColor(...this.colors.primary);
    pdf.rect(this.margin - 5, y - 5, 3, 12, 'F');
    
    // Texto do título
    pdf.setTextColor(...this.colors.primary);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, this.margin, y + 2);
    
    return y + 15;
  }

  addField(pdf, label, value, y, isBold = false, isMultiline = false) {
    const lineHeight = 6;
    
    // Label
    pdf.setTextColor(...this.colors.secondary);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text(label + ':', this.margin, y);
    
    // Value
    pdf.setTextColor(...this.colors.text);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    
    const labelWidth = pdf.getTextWidth(label + ': ') + 5;
    const maxWidth = this.contentWidth - labelWidth;
    
    let displayValue = value || '-';
    
    if (isMultiline && displayValue.length > 80) {
      const lines = pdf.splitTextToSize(displayValue, maxWidth);
      pdf.text(lines, this.margin + labelWidth, y);
      return y + (lines.length * lineHeight) + 4;
    } else {
      // Truncar se muito longo para uma linha
      if (displayValue.length > 60) {
        displayValue = displayValue.substring(0, 57) + '...';
      }
      pdf.text(displayValue, this.margin + labelWidth, y);
      return y + lineHeight + 2;
    }
  }

  async addPhotosSection(pdf, photos, startY) {
    let currentY = startY;
    
    // Verificar se precisa de nova página
    if (currentY > this.pageHeight - 100) {
      pdf.addPage();
      currentY = this.margin;
    }
    
    // Título da seção de fotos
    currentY = this.addSectionTitle(pdf, 'ANEXOS FOTOGRÁFICOS', currentY);
    currentY += 10;
    
    // Configurações do grid de fotos
    const photosPerRow = 2;
    const photoSpacing = 10;
    const photoWidth = (this.contentWidth - photoSpacing) / photosPerRow;
    const photoHeight = photoWidth * 0.75; // Proporção 4:3
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const row = Math.floor(i / photosPerRow);
      const col = i % photosPerRow;
      
      const x = this.margin + col * (photoWidth + photoSpacing);
      const y = currentY + row * (photoHeight + 25);
      
      // Verificar se a foto cabe na página atual
      if (y + photoHeight > this.pageHeight - this.margin) {
        pdf.addPage();
        currentY = this.margin + 20;
        const newY = currentY + (row - Math.floor(i / photosPerRow)) * (photoHeight + 25);
        await this.addSinglePhoto(pdf, photo, x, newY, photoWidth, photoHeight, i + 1);
      } else {
        await this.addSinglePhoto(pdf, photo, x, y, photoWidth, photoHeight, i + 1);
      }
    }
    
    // Calcular a posição Y final
    const totalRows = Math.ceil(photos.length / photosPerRow);
    return currentY + (totalRows * (photoHeight + 25)) + 10;
  }

  async addSinglePhoto(pdf, photo, x, y, width, height, photoNumber) {
    try {
      // Criar canvas para redimensionar a imagem
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          // Definir tamanho do canvas para qualidade otimizada
          canvas.width = 600;
          canvas.height = 450;
          
          // Desenhar imagem redimensionada
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Converter para base64 com qualidade otimizada
          const imgData = canvas.toDataURL('image/jpeg', 0.85);
          
          // Adicionar borda à foto
          pdf.setDrawColor(...this.colors.border);
          pdf.setLineWidth(0.5);
          pdf.rect(x, y, width, height);
          
          // Adicionar imagem
          pdf.addImage(imgData, 'JPEG', x + 1, y + 1, width - 2, height - 2);
          
          // Adicionar legenda
          pdf.setTextColor(...this.colors.secondary);
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          const caption = `Foto ${photoNumber}: ${photo.file.name}`;
          const captionWidth = pdf.getTextWidth(caption);
          const captionX = x + (width - captionWidth) / 2;
          pdf.text(caption, captionX, y + height + 8);
          
          resolve();
        };
        
        img.onerror = () => {
          // Fallback: adicionar placeholder de erro
          pdf.setFillColor(245, 245, 245);
          pdf.rect(x, y, width, height, 'F');
          
          pdf.setTextColor(...this.colors.secondary);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text('Erro ao carregar imagem', x + 10, y + height/2);
          pdf.text(photo.file.name, x + 10, y + height/2 + 10);
          
          resolve();
        };
        
        img.src = photo.url;
      });
      
    } catch (error) {
      console.error('Erro ao processar foto:', error);
      
      // Fallback: adicionar placeholder
      pdf.setFillColor(245, 245, 245);
      pdf.rect(x, y, width, height, 'F');
      
      pdf.setTextColor(...this.colors.secondary);
      pdf.setFontSize(10);
      pdf.text('Imagem não disponível', x + 10, y + height/2);
    }
  }

  addFooter(pdf) {
    const footerY = this.pageHeight - 15;
    
    // Linha separadora
    pdf.setDrawColor(...this.colors.border);
    pdf.setLineWidth(0.5);
    pdf.line(this.margin, footerY - 5, this.pageWidth - this.margin, footerY - 5);
    
    // Texto do rodapé
    pdf.setTextColor(...this.colors.secondary);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    
    const footerText = 'Documento gerado automaticamente pelo Sistema de Registro de Ocorrências - Gestão Profissional';
    const textWidth = pdf.getTextWidth(footerText);
    const centerX = (this.pageWidth - textWidth) / 2;
    
    pdf.text(footerText, centerX, footerY);
    
    // Número da página (se houver múltiplas páginas)
    const pageCount = pdf.internal.getNumberOfPages();
    if (pageCount > 1) {
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.text(`Página ${i} de ${pageCount}`, this.pageWidth - this.margin - 20, footerY);
      }
    }
  }
}

// Exportar para uso global
window.ProfessionalPDFGenerator = ProfessionalPDFGenerator;

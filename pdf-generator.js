/**
 * Gerador de PDF Profissional para Relatórios de Ocorrência
 * Versão System Engenharia - Layout técnico e conciso em 1 página
 */

class SystemEngenhariaPDFGenerator {
  constructor() {
    this.pageWidth = 210; // A4 width in mm
    this.pageHeight = 297; // A4 height in mm
    this.margin = 15;
    this.contentWidth = this.pageWidth - 2 * this.margin;
    
    // Paleta de cores da System Engenharia
    this.colors = {
      primary: [0, 123, 255],      // Azul principal #007bff
      secondary: [40, 167, 69],    // Verde #28a745
      text: [51, 51, 51],          // Cinza escuro #333333
      lightGray: [248, 249, 250],  // Cinza claro #f8f9fa
      border: [222, 226, 230],     // Borda #dee2e6
      white: [255, 255, 255]       // Branco
    };
    
    // Logo da System Engenharia (base64 será carregado dinamicamente)
    this.logoBase64 = null;
  }

  async loadLogo() {
    try {
      // Tentar carregar o logo da System Engenharia
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          canvas.width = 200;
          canvas.height = 50;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          this.logoBase64 = canvas.toDataURL('image/png');
          resolve();
        };
        img.onerror = () => {
          console.warn('Logo não encontrado, usando texto alternativo');
          resolve();
        };
        img.src = 'system_engenharia_logo.png';
      });
    } catch (error) {
      console.warn('Erro ao carregar logo:', error);
    }
  }

  async generateReport(formData, photos = []) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Carregar logo antes de gerar o PDF
    await this.loadLogo();
    
    let currentY = this.addHeader(pdf, formData.reference);
    currentY = this.addFormFieldsCompact(pdf, formData, currentY);
    
    if (photos.length > 0) {
      currentY = await this.addPhotosCompact(pdf, photos, currentY);
    }
    
    this.addFooter(pdf);
    
    return pdf;
  }

  addHeader(pdf, reference) {
    // Cabeçalho com cores da System Engenharia
    pdf.setFillColor(...this.colors.primary);
    pdf.rect(0, 0, this.pageWidth, 35, 'F');
    
    // Logo da System Engenharia (se disponível)
    if (this.logoBase64) {
      try {
        pdf.addImage(this.logoBase64, 'PNG', this.margin, 8, 40, 10);
      } catch (error) {
        console.warn('Erro ao adicionar logo:', error);
      }
    } else {
      // Texto alternativo se logo não estiver disponível
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SYSTEM ENGENHARIA', this.margin, 15);
    }
    
    // Título principal
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RELATÓRIO TÉCNICO DE OCORRÊNCIA', this.margin + 50, 15);
    
    // Referência e data na mesma linha
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Ref: ${reference}`, this.margin, 28);
    
    const now = new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const dateText = `Gerado: ${now}`;
    const dateWidth = pdf.getTextWidth(dateText);
    pdf.text(dateText, this.pageWidth - this.margin - dateWidth, 28);
    
    return 45; // Retorna posição Y após o cabeçalho
  }

  addFormFieldsCompact(pdf, data, startY) {
    pdf.setTextColor(...this.colors.text);
    let currentY = startY;
    const lineHeight = 6;
    const sectionSpacing = 8;
    
    // Layout em duas colunas para economizar espaço
    const colWidth = (this.contentWidth - 10) / 2;
    
    // Seção: Identificação (compacta)
    currentY = this.addSectionTitleCompact(pdf, 'IDENTIFICAÇÃO DA OCORRÊNCIA', currentY);
    currentY += 3;
    
    // Primeira linha: Tipo e Bloco
    currentY = this.addFieldInline(pdf, 'Tipo', data.tipo, this.margin, currentY, colWidth);
    this.addFieldInline(pdf, 'Bloco/Setor', data.bloco, this.margin + colWidth + 10, currentY, colWidth);
    currentY += lineHeight;
    
    // Segunda linha: Pavimento e Local
    currentY = this.addFieldInline(pdf, 'Pavimento', data.pavimento, this.margin, currentY, colWidth);
    this.addFieldInline(pdf, 'Local', data.local, this.margin + colWidth + 10, currentY, colWidth);
    currentY += lineHeight + 3;
    
    // Descrição (linha completa)
    currentY = this.addFieldFullWidth(pdf, 'Descrição', data.descricao, currentY);
    currentY += sectionSpacing;
    
    // Seção: Ações (compacta)
    currentY = this.addSectionTitleCompact(pdf, 'AÇÕES E PRIORIDADES', currentY);
    currentY += 3;
    
    // Primeira linha: Ação e Prioridade
    currentY = this.addFieldInline(pdf, 'Ação', data.acao, this.margin, currentY, colWidth);
    this.addFieldInline(pdf, 'Prioridade', data.prioridade, this.margin + colWidth + 10, currentY, colWidth);
    currentY += lineHeight;
    
    // Segunda linha: Prazo e Responsável
    currentY = this.addFieldInline(pdf, 'Prazo', data.prazo, this.margin, currentY, colWidth);
    this.addFieldInline(pdf, 'Responsável', data.responsavel, this.margin + colWidth + 10, currentY, colWidth);
    currentY += lineHeight + sectionSpacing;
    
    return currentY;
  }

  addSectionTitleCompact(pdf, title, y) {
    // Fundo da seção mais compacto
    pdf.setFillColor(...this.colors.lightGray);
    pdf.rect(this.margin - 3, y - 3, this.contentWidth + 6, 8, 'F');
    
    // Borda esquerda colorida
    pdf.setFillColor(...this.colors.primary);
    pdf.rect(this.margin - 3, y - 3, 2, 8, 'F');
    
    // Texto do título
    pdf.setTextColor(...this.colors.primary);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, this.margin, y + 1);
    
    return y + 10;
  }

  addFieldInline(pdf, label, value, x, y, maxWidth) {
    // Label
    pdf.setTextColor(...this.colors.secondary);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text(label + ':', x, y);
    
    // Value
    pdf.setTextColor(...this.colors.text);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    
    const labelWidth = pdf.getTextWidth(label + ': ') + 2;
    const valueWidth = maxWidth - labelWidth;
    
    let displayValue = value || '-';
    
    // Truncar se necessário
    const maxChars = Math.floor(valueWidth / 2); // Aproximação
    if (displayValue.length > maxChars) {
      displayValue = displayValue.substring(0, maxChars - 3) + '...';
    }
    
    pdf.text(displayValue, x + labelWidth, y);
    
    return y;
  }

  addFieldFullWidth(pdf, label, value, y) {
    // Label
    pdf.setTextColor(...this.colors.secondary);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text(label + ':', this.margin, y);
    
    // Value (pode ser multilinha)
    pdf.setTextColor(...this.colors.text);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    
    const labelWidth = pdf.getTextWidth(label + ': ') + 2;
    const maxWidth = this.contentWidth - labelWidth;
    
    let displayValue = value || '-';
    
    if (displayValue.length > 100) {
      const lines = pdf.splitTextToSize(displayValue, maxWidth);
      pdf.text(lines.slice(0, 3), this.margin + labelWidth, y); // Máximo 3 linhas
      return y + (Math.min(lines.length, 3) * 4) + 2;
    } else {
      pdf.text(displayValue, this.margin + labelWidth, y);
      return y + 6;
    }
  }

  async addPhotosCompact(pdf, photos, startY) {
    let currentY = startY;
    
    // Verificar espaço disponível
    const availableHeight = this.pageHeight - currentY - 30; // Reservar espaço para rodapé
    
    if (availableHeight < 60) {
      // Não há espaço suficiente, adicionar apenas referência às fotos
      currentY = this.addSectionTitleCompact(pdf, 'ANEXOS FOTOGRÁFICOS', currentY);
      pdf.setTextColor(...this.colors.text);
      pdf.setFontSize(8);
      pdf.text(`${photos.length} foto(s) anexada(s) - Ver arquivo digital completo`, this.margin, currentY + 5);
      return currentY + 15;
    }
    
    // Título da seção
    currentY = this.addSectionTitleCompact(pdf, 'ANEXOS FOTOGRÁFICOS', currentY);
    currentY += 5;
    
    // Grid compacto de fotos (2x2 ou 4x1 dependendo do espaço)
    const maxPhotos = Math.min(photos.length, 4);
    const photosPerRow = availableHeight > 80 ? 2 : 4;
    const photoSpacing = 5;
    const photoWidth = (this.contentWidth - (photosPerRow - 1) * photoSpacing) / photosPerRow;
    const photoHeight = Math.min(photoWidth * 0.6, (availableHeight - 20) / 2); // Proporção mais compacta
    
    for (let i = 0; i < maxPhotos; i++) {
      const photo = photos[i];
      const row = Math.floor(i / photosPerRow);
      const col = i % photosPerRow;
      
      const x = this.margin + col * (photoWidth + photoSpacing);
      const y = currentY + row * (photoHeight + 15);
      
      await this.addSinglePhotoCompact(pdf, photo, x, y, photoWidth, photoHeight, i + 1);
    }
    
    const totalRows = Math.ceil(maxPhotos / photosPerRow);
    return currentY + (totalRows * (photoHeight + 15)) + 5;
  }

  async addSinglePhotoCompact(pdf, photo, x, y, width, height, photoNumber) {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          // Canvas menor para PDF compacto
          canvas.width = 300;
          canvas.height = 200;
          
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const imgData = canvas.toDataURL('image/jpeg', 0.7); // Qualidade menor para economizar espaço
          
          // Borda da foto
          pdf.setDrawColor(...this.colors.border);
          pdf.setLineWidth(0.3);
          pdf.rect(x, y, width, height);
          
          // Adicionar imagem
          pdf.addImage(imgData, 'JPEG', x + 0.5, y + 0.5, width - 1, height - 1);
          
          // Legenda compacta
          pdf.setTextColor(...this.colors.secondary);
          pdf.setFontSize(6);
          pdf.setFont('helvetica', 'normal');
          const caption = `Foto ${photoNumber}`;
          pdf.text(caption, x, y + height + 8);
          
          resolve();
        };
        
        img.onerror = () => {
          // Placeholder de erro
          pdf.setFillColor(245, 245, 245);
          pdf.rect(x, y, width, height, 'F');
          
          pdf.setTextColor(...this.colors.secondary);
          pdf.setFontSize(6);
          pdf.text('Erro', x + 5, y + height/2);
          
          resolve();
        };
        
        img.src = photo.url;
      });
      
    } catch (error) {
      console.error('Erro ao processar foto:', error);
      
      // Placeholder
      pdf.setFillColor(245, 245, 245);
      pdf.rect(x, y, width, height, 'F');
      
      pdf.setTextColor(...this.colors.secondary);
      pdf.setFontSize(6);
      pdf.text('N/A', x + 5, y + height/2);
    }
  }

  addFooter(pdf) {
    const footerY = this.pageHeight - 10;
    
    // Linha separadora
    pdf.setDrawColor(...this.colors.border);
    pdf.setLineWidth(0.3);
    pdf.line(this.margin, footerY - 5, this.pageWidth - this.margin, footerY - 5);
    
    // Texto do rodapé
    pdf.setTextColor(...this.colors.secondary);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    
    const footerText = 'System Engenharia - Relatório Técnico Automatizado | www.systemengenharia.com.br';
    const textWidth = pdf.getTextWidth(footerText);
    const centerX = (this.pageWidth - textWidth) / 2;
    
    pdf.text(footerText, centerX, footerY);
  }
}

// Exportar para uso global
window.SystemEngenhariaPDFGenerator = SystemEngenhariaPDFGenerator;

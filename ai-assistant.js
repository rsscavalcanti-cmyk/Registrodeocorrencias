/**
 * Assistente de IA para Correção Ortográfica e Melhoria de Texto
 * Integração com OpenAI para análise inteligente de relatórios
 */

class AITextAssistant {
  constructor() {
    this.apiKey = null; // Será configurado dinamicamente
    this.baseURL = 'https://api.openai.com/v1';
    this.model = 'gpt-4.1-mini';
    this.isProcessing = false;
    
    // Dicionário básico de correções ortográficas em português
    this.spellCorrections = {
      'vazamento': 'vazamento',
      'entupimento': 'entupimento', 
      'quebrado': 'danificado',
      'ruim': 'em más condições',
      'muito': 'significativamente',
      'bem': 'adequadamente',
      'mal': 'inadequadamente',
      'defeituoso': 'com defeito',
      'estragado': 'danificado',
      'furado': 'perfurado',
      'rachado': 'com fissuras',
      'solto': 'desencaixado',
      'apertado': 'com folga insuficiente'
    };

    // Padrões de melhoria técnica
    this.technicalPatterns = [
      {
        pattern: /\b(quebr[ao]d[ao]s?)\b/gi,
        replacement: 'danificado(s)',
        suggestion: 'Use "danificado" em vez de "quebrado" para maior precisão técnica.'
      },
      {
        pattern: /\b(muito|bem)\s+/gi,
        replacement: '',
        suggestion: 'Evite advérbios vagos. Seja mais específico sobre a intensidade ou qualidade.'
      },
      {
        pattern: /\b(ruim|péssim[ao]s?)\b/gi,
        replacement: 'em condições inadequadas',
        suggestion: 'Descreva especificamente o que está inadequado.'
      },
      {
        pattern: /\b(não funciona|não está funcionando)\b/gi,
        replacement: 'apresenta falha operacional',
        suggestion: 'Seja mais específico sobre o tipo de falha.'
      }
    ];
  }

  /**
   * Configura a chave da API dinamicamente
   */
  setApiKey(key) {
    this.apiKey = key;
  }

  /**
   * Verifica ortografia básica usando dicionário local
   */
  checkBasicSpelling(text) {
    const corrections = [];
    const words = text.toLowerCase().split(/\s+/);
    
    words.forEach((word, index) => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (this.spellCorrections[cleanWord] && this.spellCorrections[cleanWord] !== cleanWord) {
        corrections.push({
          original: word,
          suggestion: this.spellCorrections[cleanWord],
          position: index,
          type: 'spelling'
        });
      }
    });

    return corrections;
  }

  /**
   * Aplica padrões de melhoria técnica
   */
  applyTechnicalPatterns(text) {
    const suggestions = [];
    let improvedText = text;

    this.technicalPatterns.forEach(pattern => {
      if (pattern.pattern.test(text)) {
        suggestions.push({
          type: 'technical',
          suggestion: pattern.suggestion,
          pattern: pattern.pattern.source
        });
        improvedText = improvedText.replace(pattern.pattern, pattern.replacement);
      }
    });

    return { improvedText, suggestions };
  }

  /**
   * Análise básica de clareza sem IA
   */
  analyzeClarityBasic(text) {
    const issues = [];
    
    // Verificar comprimento
    if (text.length < 20) {
      issues.push({
        type: 'length',
        severity: 'medium',
        message: 'Descrição muito curta. Adicione mais detalhes sobre o problema.',
        suggestion: 'Inclua informações sobre quando foi observado, extensão do problema e possíveis causas.'
      });
    }

    // Verificar pontuação
    if (text.length > 50 && !text.includes('.') && !text.includes('!') && !text.includes('?')) {
      issues.push({
        type: 'punctuation',
        severity: 'low',
        message: 'Considere dividir o texto em frases menores.',
        suggestion: 'Use pontos para separar ideias e melhorar a legibilidade.'
      });
    }

    // Verificar palavras vagas
    const vagueWords = ['coisa', 'negócio', 'troço', 'isso', 'aquilo'];
    const hasVagueWords = vagueWords.some(word => text.toLowerCase().includes(word));
    if (hasVagueWords) {
      issues.push({
        type: 'vague',
        severity: 'medium',
        message: 'Evite palavras vagas como "coisa", "negócio", etc.',
        suggestion: 'Seja específico sobre os objetos e situações mencionados.'
      });
    }

    // Verificar repetições
    const words = text.toLowerCase().split(/\s+/);
    const wordCount = {};
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 3) {
        wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
      }
    });

    const repeatedWords = Object.entries(wordCount).filter(([word, count]) => count > 2);
    if (repeatedWords.length > 0) {
      issues.push({
        type: 'repetition',
        severity: 'low',
        message: `Palavras repetidas: ${repeatedWords.map(([word]) => word).join(', ')}`,
        suggestion: 'Use sinônimos para evitar repetições excessivas.'
      });
    }

    return issues;
  }

  /**
   * Análise avançada com IA (OpenAI)
   */
  async analyzeWithAI(text, context = {}) {
    if (!this.apiKey || this.isProcessing) {
      return this.analyzeClarityBasic(text);
    }

    this.isProcessing = true;

    try {
      const prompt = this.buildAnalysisPrompt(text, context);
      
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'Você é um especialista em redação técnica para relatórios de obra e construção civil. Analise textos e forneça sugestões específicas para melhorar clareza, precisão técnica e profissionalismo.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 300,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const aiAnalysis = data.choices[0]?.message?.content || '';
      
      return this.parseAIResponse(aiAnalysis);

    } catch (error) {
      console.warn('Erro na análise de IA, usando análise básica:', error);
      return this.analyzeClarityBasic(text);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Constrói o prompt para análise de IA
   */
  buildAnalysisPrompt(text, context) {
    const contextInfo = context.tipo ? `Tipo de ocorrência: ${context.tipo}\n` : '';
    
    return `${contextInfo}Analise o seguinte texto de descrição de ocorrência em obra:

"${text}"

Forneça sugestões específicas para:
1. Correções ortográficas (se houver)
2. Melhorias na clareza e precisão técnica
3. Termos mais profissionais
4. Estrutura da frase

Responda em formato JSON:
{
  "corrections": ["correção1", "correção2"],
  "suggestions": ["sugestão1", "sugestão2"],
  "improvedText": "texto melhorado",
  "score": número de 1-10
}`;
  }

  /**
   * Processa a resposta da IA
   */
  parseAIResponse(aiResponse) {
    try {
      // Tentar extrair JSON da resposta
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          type: 'ai',
          corrections: parsed.corrections || [],
          suggestions: parsed.suggestions || [],
          improvedText: parsed.improvedText || '',
          score: parsed.score || 7,
          hasAI: true
        };
      }
    } catch (e) {
      console.warn('Erro ao processar resposta da IA:', e);
    }

    // Fallback: análise básica
    return {
      type: 'basic',
      suggestions: ['Análise de IA não disponível. Verifique a conexão.'],
      hasAI: false
    };
  }

  /**
   * Análise completa combinando métodos
   */
  async analyzeText(text, context = {}) {
    // Análise básica sempre disponível
    const basicSpelling = this.checkBasicSpelling(text);
    const technicalAnalysis = this.applyTechnicalPatterns(text);
    const clarityIssues = this.analyzeClarityBasic(text);

    // Tentar análise com IA se disponível
    let aiAnalysis = null;
    if (this.apiKey && text.length > 10) {
      try {
        aiAnalysis = await this.analyzeWithAI(text, context);
      } catch (error) {
        console.warn('IA não disponível:', error);
      }
    }

    return {
      spelling: basicSpelling,
      technical: technicalAnalysis,
      clarity: clarityIssues,
      ai: aiAnalysis,
      hasAI: !!aiAnalysis?.hasAI,
      overallScore: this.calculateOverallScore(basicSpelling, clarityIssues, aiAnalysis)
    };
  }

  /**
   * Calcula pontuação geral do texto
   */
  calculateOverallScore(spelling, clarity, aiAnalysis) {
    let score = 10;
    
    // Penalizar erros ortográficos
    score -= spelling.length * 0.5;
    
    // Penalizar problemas de clareza
    clarity.forEach(issue => {
      switch (issue.severity) {
        case 'high': score -= 2; break;
        case 'medium': score -= 1; break;
        case 'low': score -= 0.5; break;
      }
    });

    // Usar pontuação da IA se disponível
    if (aiAnalysis?.score) {
      score = (score + aiAnalysis.score) / 2;
    }

    return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
  }

  /**
   * Aplica correções automáticas
   */
  applyCorrections(text, corrections) {
    let correctedText = text;
    
    // Aplicar correções ortográficas
    corrections.spelling?.forEach(correction => {
      const regex = new RegExp(`\\b${correction.original}\\b`, 'gi');
      correctedText = correctedText.replace(regex, correction.suggestion);
    });

    // Aplicar melhorias técnicas
    if (corrections.technical?.improvedText) {
      correctedText = corrections.technical.improvedText;
    }

    // Aplicar texto melhorado da IA
    if (corrections.ai?.improvedText && corrections.ai.improvedText.length > 10) {
      correctedText = corrections.ai.improvedText;
    }

    return correctedText;
  }

  /**
   * Gera sugestões consolidadas
   */
  generateSuggestions(analysis) {
    const suggestions = [];

    // Sugestões de ortografia
    if (analysis.spelling.length > 0) {
      suggestions.push(`Correções ortográficas: ${analysis.spelling.length} encontradas`);
    }

    // Sugestões técnicas
    if (analysis.technical.suggestions.length > 0) {
      suggestions.push(...analysis.technical.suggestions.map(s => s.suggestion));
    }

    // Sugestões de clareza
    if (analysis.clarity.length > 0) {
      suggestions.push(...analysis.clarity.map(issue => issue.suggestion));
    }

    // Sugestões da IA
    if (analysis.ai?.suggestions) {
      suggestions.push(...analysis.ai.suggestions);
    }

    return suggestions.slice(0, 3); // Limitar a 3 sugestões principais
  }
}

// Exportar para uso global
window.AITextAssistant = AITextAssistant;

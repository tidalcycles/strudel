// Mock Strudel AI Engine - Pattern Context Analysis and Generation

export class StrudelAI {
  constructor() {
    this.patternAnalysis = new PatternAnalyzer();
    this.codeGenerator = new StrudelCodeGenerator();
  }

  async processQuery(userInput, currentPatterns) {
    const context = this.patternAnalysis.analyze(currentPatterns);
    const intent = this.parseIntent(userInput);
    
    return this.generateResponse(intent, context, userInput);
  }

  parseIntent(input) {
    const lowerInput = input.toLowerCase();
    
    // Drum patterns
    if (lowerInput.match(/(add|create).*(kick|bd|bass drum)/)) {
      return { type: 'drum', instrument: 'kick', ...this.extractRhythm(input) };
    }
    if (lowerInput.match(/(add|create).*(snare|sd|clap)/)) {
      return { type: 'drum', instrument: 'snare', ...this.extractRhythm(input) };
    }
    if (lowerInput.match(/(add|create).*(hat|hh|hihat|hi-hat)/)) {
      const closed = lowerInput.includes('closed') || lowerInput.includes('ch');
      return { type: 'drum', instrument: closed ? 'closed_hat' : 'open_hat', ...this.extractRhythm(input) };
    }
    
    // Bass patterns
    if (lowerInput.match(/(add|create).*(bass|low|sub)/)) {
      return { type: 'bass', style: this.extractStyle(input), ...this.extractRhythm(input) };
    }
    
    // Melodic patterns
    if (lowerInput.match(/(add|create).*(melody|lead|synth)/)) {
      return { type: 'melody', style: this.extractStyle(input), ...this.extractRhythm(input) };
    }
    
    // Tempo/groove modifications
    if (lowerInput.match(/(make|change).*(faster|slower|tempo)/)) {
      return { type: 'tempo', direction: lowerInput.includes('faster') ? 'faster' : 'slower' };
    }
    
    // Pattern modifications
    if (lowerInput.match(/(make|change).*(syncopated|complex|simple)/)) {
      return { type: 'modify', complexity: lowerInput.includes('syncopated') || lowerInput.includes('complex') ? 'complex' : 'simple' };
    }
    
    return { type: 'unknown', raw: input };
  }

  extractRhythm(input) {
    const rhythm = {};
    
    if (input.includes('16th') || input.includes('sixteenth')) {
      rhythm.subdivision = '16th';
      rhythm.pattern = '*16';
    } else if (input.includes('8th') || input.includes('eighth')) {
      rhythm.subdivision = '8th';
      rhythm.pattern = '*8';
    } else if (input.includes('quarter')) {
      rhythm.subdivision = 'quarter';
      rhythm.pattern = '*4';
    } else if (input.includes('every beat') || input.includes('4 on floor')) {
      rhythm.subdivision = 'quarter';
      rhythm.pattern = '';
    }
    
    return rhythm;
  }

  extractStyle(input) {
    if (input.includes('peter hook') || input.includes('hook')) return 'peter_hook';
    if (input.includes('acid')) return 'acid';
    if (input.includes('techno')) return 'techno';
    if (input.includes('house')) return 'house';
    if (input.includes('ambient')) return 'ambient';
    return 'generic';
  }

  async generateResponse(intent, context, originalInput) {
    await this.simulateThinking(); // Mock API delay
    
    switch (intent.type) {
      case 'drum':
        return this.generateDrumPattern(intent, context);
      case 'bass':
        return this.generateBassPattern(intent, context);
      case 'melody':
        return this.generateMelodyPattern(intent, context);
      case 'tempo':
        return this.generateTempoChange(intent, context);
      case 'modify':
        return this.generateModification(intent, context);
      default:
        return this.generateHelpfulResponse(originalInput, context);
    }
  }

  generateDrumPattern(intent, context) {
    const { instrument, subdivision, pattern } = intent;
    const bank = context.drumMachine || 'RolandTR909';
    
    let code, description;
    
    switch (instrument) {
      case 'kick':
        if (context.hasKick) {
          code = `$: sound("bd ~ bd ~ ~ bd ~ ~").bank("${bank}")`;
          description = "Modified your kick pattern to be more syncopated.";
        } else {
          code = `$: sound("bd ~ ~ ~").bank("${bank}")`;
          description = "Added a classic 4/4 kick pattern.";
        }
        break;
        
      case 'snare':
        code = `$: sound("~ sd ~ sd").bank("${bank}")`;
        description = "Added snare on beats 2 and 4.";
        break;
        
      case 'closed_hat':
        if (subdivision === '16th') {
          code = `$: sound("hh*16").bank("${bank}").gain(0.6)`;
          description = "Added closed hi-hats on 16th notes.";
        } else {
          code = `$: sound("hh*8").bank("${bank}").gain(0.6)`;
          description = "Added closed hi-hats on 8th notes.";
        }
        break;
        
      case 'open_hat':
        code = `$: sound("~ ~ oh ~").bank("${bank}").gain(0.7)`;
        description = "Added open hi-hat accents.";
        break;
    }
    
    return {
      text: description,
      code: code,
      explanation: this.explainCode(code)
    };
  }

  generateBassPattern(intent, context) {
    const { style } = intent;
    let code, description;
    
    switch (style) {
      case 'peter_hook':
        code = `$: note("c2 c2 ~ eb2 ~ g2 c3 ~").sound("sawtooth").lpf(400).gain(0.8)`;
        description = "Created a Peter Hook-style bassline with melodic movement.";
        break;
      case 'acid':
        code = `$: note("c2 ~ c2 eb2 ~ g2 ~ bb2").sound("sawtooth").lpf(sine.range(200,800).slow(4)).resonance(0.8)`;
        description = "Generated an acid bassline with filter modulation.";
        break;
      default:
        code = `$: note("c2 ~ ~ ~ eb2 ~ ~ ~").sound("sawtooth").lpf(600)`;
        description = "Added a simple bass pattern.";
    }
    
    return {
      text: description,
      code: code,
      explanation: this.explainCode(code)
    };
  }

  generateMelodyPattern(intent, context) {
    const code = `$: note("c4 e4 g4 e4 f4 e4 d4 c4").sound("casio").delay(0.3).room(0.2)`;
    const description = "Created a melodic pattern with some atmosphere.";
    
    return {
      text: description,
      code: code,
      explanation: this.explainCode(code)
    };
  }

  generateTempoChange(intent, context) {
    const factor = intent.direction === 'faster' ? '2' : '0.5';
    const description = `Making everything ${intent.direction}...`;
    
    return {
      text: description,
      code: `setcps(${context.currentTempo || 0.5} * ${factor})`,
      explanation: "Changes the global tempo for all patterns."
    };
  }

  generateModification(intent, context) {
    if (context.hasKick) {
      const code = intent.complexity === 'complex' 
        ? `$: sound("bd ~ bd ~ ~ bd ~ bd").bank("RolandTR909")`
        : `$: sound("bd ~ ~ ~").bank("RolandTR909")`;
      
      return {
        text: `Made the kick pattern more ${intent.complexity}.`,
        code: code,
        explanation: this.explainCode(code)
      };
    }
    
    return {
      text: "I'd love to help modify your patterns! Try adding some drums first, then I can make them more complex.",
      code: null
    };
  }

  generateHelpfulResponse(input, context) {
    const suggestions = [
      "Try: 'add a 909 kick pattern'",
      "Try: 'add closed hats on 16th notes'", 
      "Try: 'create a bassline like Peter Hook'",
      "Try: 'make it more syncopated'",
      "Try: 'add a snare on 2 and 4'"
    ];
    
    return {
      text: `I'm not sure how to help with "${input}" yet. Here are some things I can do:\n\n${suggestions.join('\n')}`,
      code: null
    };
  }

  explainCode(code) {
    if (!code) return null;
    
    // Simple code explanation
    if (code.includes('sound(')) {
      return "This creates a drum pattern using samples.";
    }
    if (code.includes('note(')) {
      return "This creates a melodic pattern with specific pitches.";
    }
    if (code.includes('setcps')) {
      return "This changes the global tempo.";
    }
    
    return "This is Strudel pattern code.";
  }

  async simulateThinking() {
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
  }
}

class PatternAnalyzer {
  analyze(codeString) {
    if (!codeString) {
      return {
        hasKick: false,
        hasSnare: false,
        hasHats: false,
        hasBass: false,
        hasMelody: false,
        drumMachine: null,
        currentTempo: null,
        complexity: 'simple'
      };
    }
    
    const context = {
      hasKick: this.hasPattern(codeString, /sound\([^)]*bd/),
      hasSnare: this.hasPattern(codeString, /sound\([^)]*sd/),
      hasHats: this.hasPattern(codeString, /sound\([^)]*hh/),
      hasBass: this.hasPattern(codeString, /note\([^)]*[a-g][0-3]/i),
      hasMelody: this.hasPattern(codeString, /note\([^)]*[a-g][4-7]/i),
      drumMachine: this.extractDrumMachine(codeString),
      currentTempo: this.extractTempo(codeString),
      complexity: this.assessComplexity(codeString)
    };
    
    return context;
  }

  hasPattern(code, regex) {
    return regex.test(code);
  }

  extractDrumMachine(code) {
    const match = code.match(/\.bank\(["']([^"']+)["']\)/);
    return match ? match[1] : 'RolandTR909';
  }

  extractTempo(code) {
    const match = code.match(/setcps\(([^)]+)\)/);
    return match ? parseFloat(match[1]) : 0.5;
  }

  assessComplexity(code) {
    const patterns = code.match(/\$:/g) || [];
    const hasComplexRhythms = /\*\d+|\/\d+|\([^)]+\)/.test(code);
    
    if (patterns.length > 3 || hasComplexRhythms) return 'complex';
    if (patterns.length > 1) return 'medium';
    return 'simple';
  }
}

class StrudelCodeGenerator {
  // Future: More sophisticated code generation logic
  constructor() {
    this.templates = {
      kick: ['bd ~ ~ ~', 'bd ~ bd ~', 'bd ~ bd ~ ~ bd ~ ~'],
      snare: ['~ sd ~ sd', '~ ~ sd ~', '~ sd ~ sd ~ ~ sd ~'],
      hats: ['hh*8', 'hh*16', 'hh ~ hh ~ hh ~ hh ~']
    };
  }
}
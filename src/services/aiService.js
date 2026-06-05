import axios from 'axios';

export const AI_PROVIDERS = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  OLLAMA: 'ollama'
};

class AIService {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    const saved = localStorage.getItem('ai_config');
    return saved ? JSON.parse(saved) : {
      provider: AI_PROVIDERS.OLLAMA,
      baseUrl: 'http://localhost:11434',
      model: 'llama3',
      apiKey: ''
    };
  }

  saveConfig(config) {
    this.config = config;
    localStorage.setItem('ai_config', JSON.stringify(config));
  }

  async generate(prompt, systemPrompt = "You are a helpful assistant specialized in Spec-Driven Development.") {
    const { provider, baseUrl, model, apiKey } = this.config;

    switch (provider) {
      case AI_PROVIDERS.OLLAMA:
        return this.callOllama(prompt, systemPrompt, baseUrl, model);
      case AI_PROVIDERS.OPENAI:
        return this.callOpenAI(prompt, systemPrompt, apiKey, model);
      case AI_PROVIDERS.ANTHROPIC:
        return this.callAnthropic(prompt, systemPrompt, apiKey, model);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  async callOllama(prompt, systemPrompt, baseUrl, model) {
    const response = await axios.post(`${baseUrl}/api/generate`, {
      model,
      prompt: `${systemPrompt}\n\nUser: ${prompt}`,
      stream: false
    });
    return response.data.response;
  }

  async callOpenAI(prompt, systemPrompt, apiKey, model) {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: model || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]
    }, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    return response.data.choices[0].message.content;
  }

  async callAnthropic(prompt, systemPrompt, apiKey, model) {
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: model || 'claude-3-5-sonnet-20240620',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        { role: 'user', content: prompt }
      ]
    }, {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      }
    });
    return response.data.content[0].text;
  }

  // Specialized SDD tasks
  async generateGherkin(specContent) {
    const prompt = `Based on the following functional specification, generate a set of Gherkin (Cucumber) test scenarios. Return ONLY the Gherkin code.\n\nSpecification:\n${specContent}`;
    return this.generate(prompt, "You are a QA Engineer specialized in BDD and Gherkin.");
  }

  async checkConsistency(specContent) {
    const prompt = `Analyze the following specification for contradictions, ambiguities, or missing edge cases. Provide a concise report.\n\nSpecification:\n${specContent}`;
    return this.generate(prompt, "You are a Senior Product Manager and System Architect.");
  }
}

export const aiService = new AIService();

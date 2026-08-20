export interface ValidationResult {
  isValid: boolean;
  sanitized: string;
  error?: string;
}

/**
 * Valida e sanitiza o nickname informado pelo usuário.
 * 
 * Regras:
 * - Obrigatório
 * - Entre 2 e 24 caracteres após sanitização
 * - Permite letras (incluindo acentuadas), números, espaços, hífen e underline
 * - Remove espaços extras nas extremidades e colapsa múltiplos espaços internos
 */
export function validateNickname(rawNickname: string | null | undefined): ValidationResult {
  if (!rawNickname) {
    return {
      isValid: false,
      sanitized: '',
      error: 'O nickname é obrigatório.',
    };
  }

  // Sanitiza removendo espaços nas extremidades e colapsando múltiplos espaços
  const sanitized = rawNickname.replace(/\s+/g, ' ').trim();

  if (sanitized.length === 0) {
    return {
      isValid: false,
      sanitized: '',
      error: 'O nickname não pode conter apenas espaços.',
    };
  }

  if (sanitized.length < 2) {
    return {
      isValid: false,
      sanitized,
      error: 'O nickname deve ter no mínimo 2 caracteres.',
    };
  }

  if (sanitized.length > 24) {
    return {
      isValid: false,
      sanitized,
      error: 'O nickname deve ter no máximo 24 caracteres.',
    };
  }

  // Regex permitindo caracteres alfanuméricos (com acentos), espaços, hífen e underline
  const validRegex = /^[a-zA-Z0-9 _\-áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]+$/;

  if (!validRegex.test(sanitized)) {
    return {
      isValid: false,
      sanitized,
      error: 'O nickname deve conter apenas letras, números, espaços, hífen ou underline.',
    };
  }

  return {
    isValid: true,
    sanitized,
  };
}

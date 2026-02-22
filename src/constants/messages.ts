/**
 * Mensagens padronizadas do Frontend
 */

export const ERROR_MESSAGES = {
  INVALID_CODE: 'Código inválido. Verifique se digitou corretamente.',
  CODE_USED: 'Este código já foi utilizado anteriormente.',
  PROMO_NOT_STARTED: 'A promoção ainda não começou.',
  PROMO_ENDED: 'Promoção encerrada.',
  IP_BLOCKED: 'Muitas tentativas. Tente novamente em {minutes} minutos.',
  CAPTCHA_REQUIRED: 'Por favor, complete o desafio de segurança.',
  NETWORK_ERROR: 'Erro de conexão. Tente novamente.',
  INTERNAL_ERROR: 'Ocorreu um erro interno no servidor.',
  CSV_EMPTY: 'Arquivo CSV vazio ou inválido.',
  SETTINGS_ERROR: 'Erro ao salvar configurações.',
} as const;

export const SUCCESS_MESSAGES = {
  REDEEMED: 'Resgate Concluído!',
  SETTINGS_SAVED: 'Configurações salvas com sucesso!',
  IMPORT_STARTED: 'Importação iniciada.',
} as const;

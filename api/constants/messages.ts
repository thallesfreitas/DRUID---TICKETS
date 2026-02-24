/**
 * Mensagens de erro e sucesso padronizadas
 */

export const ERROR_MESSAGES = {
  DB_NOT_CONNECTED: 'Conexão com banco de dados não estabelecida.',
  MISSING_FIELDS: 'Campos obrigatórios ausentes na requisição.',
  INVALID_CREDENTIALS: 'Senha incorreta.',
  CAPTCHA_REQUIRED: 'Por favor, complete o desafio de segurança.',
  INVALID_CODE: 'Código inválido. Verifique se digitou corretamente.',
  CODE_USED: 'Este código já foi utilizado anteriormente.',
  PROMO_NOT_STARTED: 'A promoção ainda não começou.',
  PROMO_ENDED: 'Promoção encerrada.',
  IP_BLOCKED: 'Muitas tentativas. Tente novamente em {minutes} minutos.',
  INTERNAL_ERROR: 'Ocorreu um erro interno no servidor.',
  CSV_EMPTY: 'CSV vazio ou inválido.',
  JOB_NOT_FOUND: 'Job de importação não encontrado.',
} as const;

export const SUCCESS_MESSAGES = {
  SETTINGS_UPDATED: 'Configurações salvas com sucesso!',
  REDEEMED: 'Código resgatado com sucesso!',
  IMPORT_STARTED: 'Importação iniciada. Processando {lines} linhas em chunks de {chunkSize}k...',
} as const;

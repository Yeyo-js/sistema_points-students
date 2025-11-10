class Validators {
  // Validar email
  static isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return emailRegex.test(email);
  }

  // Validar username (solo letras, números, guiones y guiones bajos)
  static isValidUsername(username) {
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    return usernameRegex.test(username);
  }

  // Validar contraseña fuerte
  static isStrongPassword(password) {
    // Al menos 8 caracteres, una mayúscula, una minúscula, un número
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
  }

  // Validar que no contenga SQL injection
  static isSafeInput(input) {
    const sqlInjectionPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b|--|;|\/\*|\*\/|xp_)/gi;
    return !sqlInjectionPattern.test(input);
  }

  // Validar que no contenga XSS
  static isSafeFromXSS(input) {
    const xssPattern = /<script|<iframe|javascript:|onerror=|onload=/gi;
    return !xssPattern.test(input);
  }

  // Sanitizar input (remover caracteres peligrosos)
  static sanitize(input) {
    if (typeof input !== 'string') return input;
    return input
      .trim()
      .replace(/[<>]/g, '') // Remover < y >
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Validar número positivo
  static isPositiveInteger(value) {
    return Number.isInteger(value) && value > 0;
  }

  // Validar longitud de texto
  static isValidLength(text, min, max) {
    if (typeof text !== 'string') return false;
    const length = text.trim().length;
    return length >= min && length <= max;
  }
}

module.exports = Validators;
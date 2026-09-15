function digitsOnly(value) {
  return String(value ?? '').replace(/\D/g, '');
}

export function normalizePhone(value) {
  let digits = digitsOnly(value);

  // Permite colar o telefone brasileiro com 55, mas a aplicação trabalha
  // internamente apenas com DDD + número nacional.
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2);
  }

  if (digits.length !== 10 && digits.length !== 11) return null;

  const ddd = digits.slice(0, 2);
  let subscriber = digits.slice(2);

  // Telefones móveis antigos com 8 dígitos recebem o 9º dígito.
  if (subscriber.length === 8) subscriber = `9${subscriber}`;
  if (subscriber.length !== 9) return null;

  return `${ddd}${subscriber}`;
}

export function formatPhone(value) {
  let digits = digitsOnly(value);

  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2);
  }

  digits = digits.slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;

  const ddd = digits.slice(0, 2);
  const subscriber = digits.slice(2);

  if (subscriber.length <= 4) {
    return `(${ddd}) ${subscriber}`;
  }

  if (subscriber.length <= 8) {
    return `(${ddd}) ${subscriber.slice(0, 4)}-${subscriber.slice(4)}`;
  }

  return `(${ddd}) ${subscriber.slice(0, 5)}-${subscriber.slice(5, 9)}`;
}

export function applyMask(input) {
  const oldValue = input.value;
  const oldCursor = input.selectionStart ?? oldValue.length;
  const digitsBeforeCursor = digitsOnly(oldValue.slice(0, oldCursor)).length;

  const formatted = formatPhone(oldValue);
  input.value = formatted;

  // Reposiciona o cursor pelo número de dígitos, não pelo número de caracteres.
  // Isso evita o salto do cursor ao passar por "(", ")", espaço e "-".
  let cursor = formatted.length;
  if (digitsBeforeCursor === 0) {
    cursor = 0;
  } else {
    let seen = 0;
    cursor = 0;
    while (cursor < formatted.length) {
      if (/\d/.test(formatted[cursor])) seen += 1;
      cursor += 1;
      if (seen >= digitsBeforeCursor) break;
    }
  }

  try { input.setSelectionRange(cursor, cursor); } catch (_) {}
}

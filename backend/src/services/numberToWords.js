// services/numberToWords.js
// Converts numbers to Indian Rupees format words

const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'
];

const teens = [
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
  'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
  'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertLessThanThousand(num) {
  if (num === 0) return '';

  let result = '';

  if (num >= 100) {
    result += ones[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }

  if (num >= 10 && num <= 19) {
    result += teens[num - 10] + ' ';
  } else if (num >= 20 || num > 0) {
    result += tens[Math.floor(num / 10)] + ' ';
    result += ones[num % 10] + ' ';
  }

  return result.trim();
}

export function numberToWords(amount) {
  if (amount === 0) return 'Zero Rupees Only';

  // Handle negative numbers
  if (amount < 0) {
    return 'Minus ' + numberToWords(Math.abs(amount));
  }

  // Split into rupees and paise
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let words = '';

  // Indian numbering system: Crore, Lakh, Thousand, Hundred
  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const remainder = rupees % 1000;

  if (crore > 0) {
    words += convertLessThanThousand(crore) + ' Crore ';
  }

  if (lakh > 0) {
    words += convertLessThanThousand(lakh) + ' Lakh ';
  }

  if (thousand > 0) {
    words += convertLessThanThousand(thousand) + ' Thousand ';
  }

  if (remainder > 0) {
    words += convertLessThanThousand(remainder);
  }

  words = words.trim();

  // Add "Rupees"
  if (words) {
    words += ' Rupees';
  }

  // Add paise if present
  if (paise > 0) {
    const paiseWords = convertLessThanThousand(paise);
    words += ' and ' + paiseWords + ' Paise';
  }

  // Add "Only" at the end
  words += ' Only';

  return words;
}

// Example usage:
// numberToWords(364440) => "Three Lakh Sixty Four Thousand Four Hundred Forty Rupees Only"
// numberToWords(125125.50) => "One Lakh Twenty Five Thousand One Hundred Twenty Five Rupees and Fifty Paise Only"
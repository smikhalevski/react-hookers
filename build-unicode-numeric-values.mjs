import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import prettier from 'prettier';

const UNICODE_VERSION = '16.0.0';

const UCD_URL = `https://www.unicode.org/Public/${UNICODE_VERSION}/ucd`;

const UNICODE_DIR = 'node_modules/__unicode';

const OUTPUT_FILE = './src/main/components/formatted-input/unicode-numeric-values.ts';

if (!existsSync(UNICODE_DIR)) {
  // Download Unicode Character Database

  mkdirSync(UNICODE_DIR, { recursive: true });

  await Promise.all([
    fetch(UCD_URL + '/UCD.zip')
      .then(_ => _.bytes())
      .then(_ => writeFileSync(UNICODE_DIR + '/UCD.zip', _))
      .then(_ => execSync('unzip -o UCD.zip -d UCD', { cwd: UNICODE_DIR })),

    fetch(UCD_URL + '/Unihan.zip')
      .then(_ => _.bytes())
      .then(_ => writeFileSync(UNICODE_DIR + '/Unihan.zip', _))
      .then(_ => execSync('unzip -o Unihan.zip -d Unihan', { cwd: UNICODE_DIR })),
  ]);
}

function* parseCSV(csv, separator) {
  for (let i = 0, j = 0; i < csv.length; i = j + 1) {
    j = csv.indexOf('\n', i);

    if (j === -1) {
      j = csv.length;
    }

    const line = csv.substring(i, j);

    if (line.length === 0 || line.charAt(0) === '#') {
      continue;
    }

    yield line.split(separator);
  }
}

const numericValues = {};

function registerNumericValue(codePoint, numericValue) {
  if (numericValue.length !== 1) {
    // Skip non-single digit numeric values
    return;
  }

  (numericValues[numericValue] = numericValues[numericValue] || new Set()).add(codePoint);
}

for (const row of parseCSV(readFileSync(UNICODE_DIR + '/UCD/UnicodeData.txt', 'utf8'), ';')) {
  //  0 Code Point
  //  1 Name
  //  2 General Category
  //  3 Canonical Combining Class
  //  4 Bidi Class
  //  5 Decomposition Type and Decomposition Mapping
  //  6 Numeric Type
  //  7 Numeric Value for Type Digit
  //  8 Numeric Value for Type Numeric
  //  9 Bidi Mirrored
  // 10 Unicode 1 Name
  // 11 ISO Comment
  // 12 Simple Uppercase Mapping
  // 13 Simple Lowercase Mapping
  // 14 Simple Titlecase Mapping

  if (row[5] !== '') {
    // Skip composite chars
    continue;
  }

  registerNumericValue(parseInt(row[0], 16), row[8]);
}

for (const row of parseCSV(readFileSync(UNICODE_DIR + '/Unihan/Unihan_NumericValues.txt', 'utf8'), '\t')) {
  registerNumericValue(parseInt(row[0].substring(2), 16), row[2]);
}

const src = `
  // GENERATED ${UCD_URL}

  export default [
    ${Object.entries(numericValues).map(
      ([numericValue, codePoints]) =>
        `{
          value: '${numericValue}',
          codePoints: [
            ${Array.from(codePoints)
              .map(codePoint => `${codePoint}, // ${String.fromCodePoint(codePoint)}`)
              .join('\n')}
          ]
        }`
    )}
  ];
`;

const prettierConfig = await prettier.resolveConfig('./package.json');

writeFileSync(OUTPUT_FILE, await prettier.format(src, { ...prettierConfig, parser: 'typescript' }));

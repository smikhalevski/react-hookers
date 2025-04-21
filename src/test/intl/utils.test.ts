import { stripDiacritics } from '../../main';

describe('stripDiacritics', () => {
  test('strips diacritics', () => {
    expect(stripDiacritics('àáãâäéèêëíìîïóòõôöúùûüñçÀÁÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÑÇ')).toEqual(
      'aaaaaeeeeiiiiooooouuuuncAAAAAEEEEIIIIOOOOOUUUUNC'
    );
  });

  test('does not strip special characters', () => {
    expect(stripDiacritics('@_$><=-#!,.`\'"')).toEqual('@_$><=-#!,.`\'"');
  });

  test('does not strip german letter ß', () => {
    expect(stripDiacritics('ß')).toEqual('ß');
  });
});

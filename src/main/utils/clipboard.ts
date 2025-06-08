/**
 * Copies text to clipboard.
 *
 * **Note:** This only works in scope of the keyboard or mouse event handler, noop otherwise.
 *
 * @param text Text to write to clipboard.
 * @returns `true` if text was successfully written, or `false` otherwise.
 * @group Other
 */
export function writeToClipboard(text: string): boolean {
  const element = document.createElement('textarea');

  element.style.position = 'fixed';
  element.style.opacity = '0';
  element.style.height = '1px';
  element.style.width = '1px';
  element.style.left = '0';
  element.style.top = '0';
  element.tabIndex = -2;

  document.body.append(element);

  try {
    element.value = text;
    element.select();
    element.setSelectionRange(0, element.value.length);

    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    element.remove();
  }
}

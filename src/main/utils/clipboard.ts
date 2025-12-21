/**
 * Copies text to the clipboard.
 *
 * **Note:** This only works within the scope of a keyboard or mouse event handler. Otherwise, it is a no-op.
 *
 * @param text The text to write to the clipboard.
 * @returns `true` if the text was successfully written; otherwise, `false`.
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

/** True where the system share sheet takes files: most phones, some desktop browsers. */
export function canShareFiles(): boolean {
  if (typeof navigator === 'undefined' || !navigator.canShare) return false;
  try {
    return navigator.canShare({
      files: [new File(['x'], 'x.png', { type: 'image/png' })],
    });
  } catch {
    return false;
  }
}

/** Opens the share sheet with a file. Returns false when the person closed it without picking an app. */
export async function shareFile(file: File): Promise<boolean> {
  try {
    await navigator.share({ files: [file] });
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError')
      return false;
    throw error;
  }
}

/** Opens the share sheet with text only, for chats that build their own link preview. */
export async function shareText(text: string): Promise<boolean> {
  try {
    await navigator.share({ text });
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError')
      return false;
    throw error;
  }
}

export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement('a'), {
    href: url,
    download: name,
  });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

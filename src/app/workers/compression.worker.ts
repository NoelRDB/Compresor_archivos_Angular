/// <reference lib="webworker" />
import JSZip from 'jszip';

addEventListener('message', async ({ data }) => {
  const { id, file, mode } = data as {
    id: number;
    file: File;
    mode: 'gzip' | 'zip';
  };

  try {
    let outFile: File;

    if (mode === 'gzip') {
      const cs = new CompressionStream('gzip');
      const blob = await new Response(file.stream().pipeThrough(cs)).blob();
      outFile = new File([blob], file.name + '.gz', { type: 'application/gzip' });
    } else { // zip
      const zip = new JSZip();
      zip.file(file.name, await file.arrayBuffer());
      const blob = await zip.generateAsync({ type: 'blob' }, ({ percent }) =>
        postMessage({ id, progress: percent })
      );
      outFile = new File([blob], file.name + '.zip', { type: 'application/zip' });
    }

    postMessage({ id, done: true, outFile });
  } catch (error) {
    postMessage({ id, error: (error as Error).message });
  }
});

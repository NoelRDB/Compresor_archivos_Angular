/// <reference lib="webworker" />
import JSZip from 'jszip';

addEventListener('message', async ({ data }) => {
  const { id, file, action, mode } = data as {
    id: number;
    file: File;
    action: 'compress' | 'decompress';
    mode: 'gzip' | 'zip';
  };

  try {
    /* ---------- COMPRESIÓN ---------- */
    if (action === 'compress') {
      let outFile: File;

      if (mode === 'gzip') {
        const cs = new CompressionStream('gzip');
        const blob = await new Response(file.stream().pipeThrough(cs)).blob();
        outFile = new File([blob], file.name + '.gz', { type: 'application/gzip' });
      } else {
        const zip = new JSZip();
        zip.file(file.name, await file.arrayBuffer());
        const blob = await zip.generateAsync({ type: 'blob' }, ({ percent }) =>
          postMessage({ id, progress: percent })
        );
        outFile = new File([blob], file.name + '.zip', { type: 'application/zip' });
      }

      postMessage({ id, done: true, outFile });
      return;              // 👈 evitamos continuar
    }

    /* ---------- DESCOMPRESIÓN ---------- */
    if (action === 'decompress') {
      // --- .gz ---
      if (/\.gz$/i.test(file.name)) {
        const ds = new DecompressionStream('gzip');
        const blob = await new Response(file.stream().pipeThrough(ds)).blob();
        const outFile = new File([blob], file.name.replace(/\.gz$/i, ''), {
          type: 'application/octet-stream'
        });
        postMessage({ id, done: true, outFile });
        return;
      }

      // --- .zip ---
      if (/\.zip$/i.test(file.name)) {
        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        for (const zf of Object.values(zip.files)) {
          if (zf.dir) continue;
          const content = await zf.async('blob');
          postMessage({
            id,
            outFile: new File([content], zf.name)
          });
        }
        // señal de fin
        postMessage({ id, done: true });
        return;
      }

      throw new Error('Formato no soportado');
    }
  } catch (err) {
    postMessage({ id, error: (err as Error).message });
  }
});

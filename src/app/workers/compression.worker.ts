/// <reference lib="webworker" />
import JSZip from 'jszip';

addEventListener('message', async ({ data }) => {
  const { id, file, action, mode } = data as {
    id: number;
    file: File;
    action: 'compress' | 'decompress';
    mode: 'gzip' | 'zip';        // solo relevante para compress
  };

  try {
    let outFile: File;

    if (action === 'compress') 
    {
      const cs = new CompressionStream('gzip');
      const blob = await new Response(file.stream().pipeThrough(cs)).blob();
      outFile = new File([blob], file.name + '.gz', { type: 'application/gzip' });
      postMessage({ id, done: true, outFile });
    }
    
    else 
    { // zip
      const zip = new JSZip();
      zip.file(file.name, await file.arrayBuffer());
      const blob = await zip.generateAsync({ type: 'blob' }, ({ percent }) =>
        postMessage({ id, progress: percent })
      );
      outFile = new File([blob], file.name + '.zip', { type: 'application/zip' });
    }

    // Nueva rama para descomprimir
    if (action === 'decompress') {
      if (file.name.endsWith('.gz')) {
        const ds = new DecompressionStream('gzip');
        const blob = await new Response(
          file.stream().pipeThrough(ds)
        ).blob();
        const outFile = new File([blob], file.name.replace(/\.gz$/, ''), {
          type: 'application/octet-stream'
        });
        postMessage({ id, done: true, outFile });
      } else if (file.name.endsWith('.zip')) {
        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        const files = Object.values(zip.files);
        for (const zf of files) {
          if (zf.dir) continue;
          const content = await zf.async('blob');
          postMessage({ id, partial: true, outFile: new File([content], zf.name) });
        }
        postMessage({ id, done: true });
      } else {
        throw new Error('Formato no soportado');
      }
    }
  } catch (error) {
    postMessage({ id, error: (error as Error).message });
  }
});

import { Readable } from 'stream';

import * as csvParser from 'csv-parser';

export async function parseCsv<T>(buffer: Buffer): Promise<T[]> {
  const results: T[] = [];

  return new Promise((resolve, reject) => {
    const stream = Readable.from(buffer);
    stream
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
}

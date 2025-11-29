import { Readable } from 'stream';

import * as csvParser from 'csv-parser';

export async function parseCsv<T>(buffer: Buffer): Promise<T[]> {
  const results: T[] = [];

  return new Promise((resolve, reject) => {
    const stream = Readable.from(buffer.toString()); // treat buffer as text
    stream
      .pipe(
        csvParser({ headers: ['full_name', 'email'], skipLines: 1 }), // ✅ only email + full_name
      )
      .on('data', (data) => {
        const cleaned = Object.fromEntries(
          Object.entries(data).map(([key, value]) => [
            key,
            typeof value === 'string' ? value.trim() : value,
          ]),
        );
        results.push(cleaned as T);
      })
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
}

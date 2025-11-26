// import { Readable } from 'stream';

// import * as csvParser from 'csv-parser';

// export async function parseCsv<T>(buffer: Buffer): Promise<T[]> {
//   const results: T[] = [];

//   return new Promise((resolve, reject) => {
//     const stream = Readable.from(buffer);
//     stream
//       .pipe(csvParser())
//       .on('data', (data) => results.push(data))
//       .on('end', () => resolve(results))
//       .on('error', (err) => reject(err));
//   });
// }

import { Readable } from 'stream';

import * as csvParser from 'csv-parser';

export async function parseCsv<T>(buffer: Buffer): Promise<T[]> {
  const results: T[] = [];

  return new Promise((resolve, reject) => {
    const stream = Readable.from(buffer.toString()); // ensure it's treated as text
    stream
      .pipe(
        csvParser({ headers: ['email', 'role', 'full_name'], skipLines: 1 }),
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

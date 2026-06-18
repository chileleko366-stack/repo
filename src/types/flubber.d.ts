declare module 'flubber' {
  type InterpolateFn = (t: number) => string;

  interface InterpolateOptions {
    maxSegmentLength?: number;
    string?: boolean;
  }

  export function interpolate(
    fromPath: string,
    toPath: string,
    options?: InterpolateOptions,
  ): InterpolateFn;

  export function separate(
    fromPath: string,
    toPaths: string[],
    options?: InterpolateOptions,
  ): InterpolateFn[];

  export function combine(
    fromPaths: string[],
    toPath: string,
    options?: InterpolateOptions,
  ): InterpolateFn[];

  export function interpolateAll(
    fromPaths: string[],
    toPaths: string[],
    options?: InterpolateOptions,
  ): InterpolateFn[];
}

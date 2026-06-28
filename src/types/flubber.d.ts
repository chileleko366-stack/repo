declare module "flubber" {
  export function interpolate(
    fromPath: string,
    toPath: string,
    options?: { maxSegmentLength?: number }
  ): (t: number) => string;
  export function separate(
    fromPath: string,
    toPaths: string[],
    options?: { maxSegmentLength?: number; single?: boolean }
  ): ((t: number) => string)[];
  export function combine(
    fromPaths: string[],
    toPath: string,
    options?: { maxSegmentLength?: number; single?: boolean }
  ): ((t: number) => string)[];
}

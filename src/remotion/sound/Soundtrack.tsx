import React from 'react';
import { Audio, Loop } from 'remotion';

interface Props {
  src: string;
  volume?: number;
}

export const Soundtrack: React.FC<Props> = ({ src, volume = 0.15 }) => (
  <Audio src={src} volume={volume} />
);

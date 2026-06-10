import type { Config } from 'tailwindcss';
import bcsPreset from '@blueprint/design-tokens/tailwind';

const config: Config = {
  presets: [bcsPreset as Config],
  content: [
    './src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand teal darkened one notch for SMALL text on white: the token
        // brand (oklch .55) measures 4.43:1 — under AA for 11px labels.
        'brand-strong': 'oklch(0.50 0.13 215 / <alpha-value>)',
      },
    },
  },
};

export default config;

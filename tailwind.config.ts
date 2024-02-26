import {Config} from "tailwindcss";

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        '1inch-bg-1': '#0b121f',
        '1inch-bg-2': '#131823',
        '1inch-text-1': '#fff',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
        'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'btn-color': 'linear-gradient(269.27deg, #2f8af5 0.52%, #0361ce 48.96%, #0fbee4 100%)',
        'btn-active-color': 'linear-gradient(\n' +
          '    269.27deg,\n' +
          '    rgba(47, 138, 245, 0.85) 0.52%,\n' +
          '    rgba(3, 97, 206, 0.85) 48.96%,\n' +
          '    rgba(15, 190, 228, 0.85) 100%\n' +
          '  )',
      },
    },
  },
  plugins: [],
}
export default config

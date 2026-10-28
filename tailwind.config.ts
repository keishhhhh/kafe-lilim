import type { Config } from "tailwindcss";
export default { darkMode:"class", content:["./app/**/*.{ts,tsx}","./components/**/*.{ts,tsx}"],theme:{extend:{fontFamily:{sans:["var(--font-sans)","system-ui"],serif:["Georgia","serif"]},colors:{cream:"#F7F0E5",espresso:"#493629",caramel:"#B78354",sage:"#89957A"}}},plugins:[] } satisfies Config;

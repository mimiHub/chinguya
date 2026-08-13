import globals from "globals";
import pluginNext from "@next/eslint-plugin-next";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import { config as base } from "./base.js";

/** ESLint config for the Next.js apps. */
export const config = [
  ...base,
  {
    ...pluginReact.configs.flat.recommended,
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: { ...globals.browser },
    },
  },
  // 최신 JSX 트랜스폼: React 를 스코프에 import 하지 않아도 됨
  pluginReact.configs.flat["jsx-runtime"],
  {
    plugins: { "@next/next": pluginNext },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs["core-web-vitals"].rules,
    },
  },
  {
    plugins: { "react-hooks": pluginReactHooks },
    settings: { react: { version: "detect" } },
    rules: { ...pluginReactHooks.configs.recommended.rules },
  },
];

export default config;

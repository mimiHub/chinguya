import globals from "globals";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import { config as base } from "./base.js";

/** ESLint config for internal React libraries (e.g. @chinguya/ui). */
export const config = [
  ...base,
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat["jsx-runtime"],
  { languageOptions: { globals: { ...globals.browser } } },
  {
    plugins: { "react-hooks": pluginReactHooks },
    settings: { react: { version: "detect" } },
    rules: { ...pluginReactHooks.configs.recommended.rules },
  },
];

export default config;

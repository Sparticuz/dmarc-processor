import myConfig from "@sparticuz/eslint-config";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist", "coverage", "node_modules", ".serverless"],
  },
  ...myConfig,
  {
    rules: { "sonarjs/prefer-enum-initializers": "off" },
  },
);

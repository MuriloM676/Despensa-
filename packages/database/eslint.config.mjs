import base from "@despensa/config/eslint/base.js";

export default [
  ...base,
  {
    files: ["prisma/seed.ts"],
    rules: {
      "no-console": "off",
    },
  },
];

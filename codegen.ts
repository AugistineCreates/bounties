import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "./lib/graphql/schema.graphql",
  documents: [
    "lib/graphql/operations/**/*.graphql",
    "lib/graphql/operations/**/*.ts",
    "lib/graphql/operations/**/*.tsx",
  ],
  ignoreNoDocuments: true,
  generates: {
    "./lib/graphql/generated.ts": {
      plugins: [
        {
          add: {
            content: [
              'export { TypedDocumentString } from "./typed-document-string";',
              'import { TypedDocumentString } from "./typed-document-string";',
            ].join("\n"),
          },
        },
        "typescript",
        "typescript-operations",
        "typescript-react-query",
      ],
      config: {
        fetcher: {
          func: "./client#fetcher",
          isReactHook: false,
        },
        exposeQueryKeys: true,
        reactQueryVersion: 5,
        documentMode: "string",
        scalars: {
          DateTime: "string",
          JSON: "Record<string, any>",
        },
      },
    },
  },
};

export default config;

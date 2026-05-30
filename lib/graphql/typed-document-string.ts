/**
 * TypedDocumentString is a runtime class used by generated GraphQL documents.
 * It extends String to hold the GraphQL query string and carries type metadata.
 * Lives here (not in generated.ts) so pnpm codegen never overwrites it.
 */
export class TypedDocumentString<
  TResult = unknown,
  TVariables extends object = Record<string, unknown>,
> extends String {
  __apiType?: ((variables: TVariables) => TResult) | undefined;
  private value: string;
  __meta__?: Record<string, unknown> | undefined;

  constructor(value: string, __meta__?: Record<string, unknown> | undefined) {
    super(value);
    this.value = value;
    this.__meta__ = __meta__;
  }

  override toString(): string {
    return this.value;
  }
}

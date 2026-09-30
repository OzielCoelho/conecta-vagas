export const uuidSchema = {
  type: "string",
  pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
} as const;

export const emptyQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {},
} as const;


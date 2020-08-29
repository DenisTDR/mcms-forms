export interface IOpenApiDocument {
  components: {
    schemas: {
      [key: string]: IOpenApiSchema,
    }
  };
  translations: {
    defaultLanguage: string,
    translations: { [key: string]: { [key: string]: string } },
  };
}

export interface IOpenApiReferenceObject {
  $ref: string;
  allOf: IOpenApiSchema[];
}

export interface IOpenApiSchema extends IOpenApiReferenceObject {
  type: 'string' | 'textarea' | 'object' | 'array';
  properties: { [key: string]: IExtendedOpenApiProperty };
  additionalProperties: any[];
  required: string[];
  enum: any[];
}

export interface IOpenApiProperty extends IOpenApiReferenceObject {
  type: string;
  format: string;
  minLength: number;
  nullable: boolean;
  items: IOpenApiSchema;
}

export interface IExtendedOpenApiProperty extends IOpenApiProperty {
  validators: any[];
  'x-validators': any[];
  'x-props': { [key: string]: any };
  subGroupRefs?: string[];
}

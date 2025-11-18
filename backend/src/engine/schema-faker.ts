import jsf from 'json-schema-faker';

export class SchemaFaker {
  /**
   * Generate fake data from JSON Schema
   */
  static generate(schema: any): any {
    if (!schema) {
      return { message: 'No schema defined' };
    }

    // Configure json-schema-faker
    jsf.option({
      useDefaultValue: true,
      useExamplesValue: true,
      failOnInvalidFormat: false,
      alwaysFakeOptionals: true,
      minItems: 1,
      maxItems: 5,
    });

    try {
      return jsf.generate(schema);
    } catch (error) {
      console.error('Error generating fake data:', error);
      return { error: 'Failed to generate mock data' };
    }
  }

  /**
   * Generate an array of fake data
   */
  static generateArray(schema: any, count: number = 3): any[] {
    const items = [];
    for (let i = 0; i < count; i++) {
      items.push(this.generate(schema));
    }
    return items;
  }
}

/**
 * Base Entity class for all domain entities
 * Provides common properties like id, createdAt, updatedAt
 */
export abstract class BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(id?: string, createdAt?: Date, updatedAt?: Date) {
    this.id = id || this.generateId();
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  protected generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}

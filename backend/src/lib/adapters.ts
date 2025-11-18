/**
 * Adapter interfaces for extending the mock server
 * These allow external integrations without modifying core code
 */

export interface DomainEvent {
  type: string;
  timestamp: Date;
  projectId?: string;
  data: Record<string, any>;
}

export interface NotificationConfig {
  destination: string;
  headers?: Record<string, string>;
  retryAttempts?: number;
}

/**
 * Notification adapter for sending events to external systems
 * Implementations: Webhook, Email, Slack, Discord, etc.
 */
export interface INotificationAdapter {
  name: string;
  send(event: DomainEvent, config: NotificationConfig): Promise<void>;
  supports(eventType: string): boolean;
}

export interface RequestMetric {
  projectId: string;
  environmentId?: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  timestamp: Date;
}

export interface GenerationMetric {
  projectId: string;
  schemaType: string;
  generationTimeMs: number;
  timestamp: Date;
}

export interface MetricFilter {
  projectId?: string;
  startDate?: Date;
  endDate?: Date;
  metricName?: string;
}

export interface Metric {
  name: string;
  value: number;
  labels: Record<string, string>;
  timestamp: Date;
}

/**
 * Metrics adapter for tracking usage and performance
 * Implementations: Prometheus, Datadog, CloudWatch, in-memory, etc.
 */
export interface IMetricsAdapter {
  name: string;
  recordRequest(metric: RequestMetric): void;
  recordGeneration(metric: GenerationMetric): void;
  query(filter: MetricFilter): Promise<Metric[]>;
}

export interface RequestContext {
  projectId: string;
  environmentId?: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: any;
}

/**
 * External data source adapter for realistic mocking
 * Implementations: Database, API, File system, etc.
 */
export interface IDataSourceAdapter {
  name: string;
  supports(schema: any): boolean;
  fetch(schema: any, context: RequestContext): Promise<any>;
}

/**
 * Custom response generator plugin
 * Allows custom logic for generating mock responses
 */
export interface IResponseGenerator {
  name: string;
  priority: number; // Lower number = higher priority
  supports(schema: any): boolean;
  generate(schema: any, context: RequestContext): any;
}

/**
 * Plugin registry for managing custom generators
 */
export class PluginRegistry {
  private generators: IResponseGenerator[] = [];
  private dataSourceAdapters: IDataSourceAdapter[] = [];
  private notificationAdapters: INotificationAdapter[] = [];
  private metricsAdapters: IMetricsAdapter[] = [];

  registerGenerator(generator: IResponseGenerator): void {
    this.generators.push(generator);
    this.generators.sort((a, b) => a.priority - b.priority);
  }

  registerDataSource(adapter: IDataSourceAdapter): void {
    this.dataSourceAdapters.push(adapter);
  }

  registerNotificationAdapter(adapter: INotificationAdapter): void {
    this.notificationAdapters.push(adapter);
  }

  registerMetricsAdapter(adapter: IMetricsAdapter): void {
    this.metricsAdapters.push(adapter);
  }

  getGenerator(schema: any): IResponseGenerator | null {
    return this.generators.find(g => g.supports(schema)) || null;
  }

  getDataSource(schema: any): IDataSourceAdapter | null {
    return this.dataSourceAdapters.find(ds => ds.supports(schema)) || null;
  }

  getNotificationAdapters(eventType: string): INotificationAdapter[] {
    return this.notificationAdapters.filter(na => na.supports(eventType));
  }

  getMetricsAdapters(): IMetricsAdapter[] {
    return this.metricsAdapters;
  }
}

// Global registry instance
export const pluginRegistry = new PluginRegistry();

/**
 * Example implementations
 */

// Webhook notification adapter
export class WebhookNotificationAdapter implements INotificationAdapter {
  name = 'webhook';

  supports(eventType: string): boolean {
    return true; // Supports all events
  }

  async send(event: DomainEvent, config: NotificationConfig): Promise<void> {
    const payload = {
      event: event.type,
      timestamp: event.timestamp.toISOString(),
      data: event.data,
    };

    const response = await fetch(config.destination, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook delivery failed: ${response.statusText}`);
    }
  }
}

// In-memory metrics adapter (for development)
export class InMemoryMetricsAdapter implements IMetricsAdapter {
  name = 'in-memory';
  private metrics: Metric[] = [];

  recordRequest(metric: RequestMetric): void {
    this.metrics.push({
      name: 'mock.request',
      value: metric.durationMs,
      labels: {
        projectId: metric.projectId,
        method: metric.method,
        path: metric.path,
        statusCode: String(metric.statusCode),
      },
      timestamp: metric.timestamp,
    });
  }

  recordGeneration(metric: GenerationMetric): void {
    this.metrics.push({
      name: 'mock.generation',
      value: metric.generationTimeMs,
      labels: {
        projectId: metric.projectId,
        schemaType: metric.schemaType,
      },
      timestamp: metric.timestamp,
    });
  }

  async query(filter: MetricFilter): Promise<Metric[]> {
    let filtered = this.metrics;

    if (filter.projectId) {
      filtered = filtered.filter(m => m.labels.projectId === filter.projectId);
    }

    if (filter.startDate) {
      filtered = filtered.filter(m => m.timestamp >= filter.startDate!);
    }

    if (filter.endDate) {
      filtered = filtered.filter(m => m.timestamp <= filter.endDate!);
    }

    if (filter.metricName) {
      filtered = filtered.filter(m => m.name === filter.metricName);
    }

    return filtered;
  }
}

// Register default adapters
pluginRegistry.registerNotificationAdapter(new WebhookNotificationAdapter());
pluginRegistry.registerMetricsAdapter(new InMemoryMetricsAdapter());

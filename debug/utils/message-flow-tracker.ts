/**
 * Message Flow Tracker
 *
 * Monitors and tracks inter-component communication across Chrome extension contexts.
 * Provides message routing validation and communication failure debugging.
 */

export interface MessageFlowEvent {
  id: string;
  timestamp: Date;
  source: ExtensionContext;
  target: ExtensionContext;
  messageType: string;
  payload: any;
  status: 'sent' | 'received' | 'failed' | 'timeout';
  latency?: number;
  error?: string;
}

export interface MessageRoute {
  from: ExtensionContext;
  to: ExtensionContext;
  messageTypes: string[];
  expectedLatency: number;
  failureCount: number;
  successCount: number;
}

export interface CommunicationFailure {
  id: string;
  timestamp: Date;
  route: MessageRoute;
  failureType:
    | 'timeout'
    | 'routing_error'
    | 'serialization_error'
    | 'permission_denied';
  errorDetails: string;
  recoveryAttempts: number;
  resolved: boolean;
}

export type ExtensionContext =
  | 'service-worker'
  | 'content-script'
  | 'offscreen'
  | 'ui';

export class MessageFlowTracker {
  private messageEvents: Map<string, MessageFlowEvent> = new Map();
  private messageRoutes: Map<string, MessageRoute> = new Map();
  private communicationFailures: CommunicationFailure[] = [];
  private isTracking: boolean = false;
  private trackingStartTime: Date | null = null;

  /**
   * Start tracking message flow across extension contexts
   */
  async startTracking(): Promise<void> {
    this.isTracking = true;
    this.trackingStartTime = new Date();
    this.messageEvents.clear();
    this.communicationFailures = [];

    console.log(
      '[MessageFlowTracker] Started tracking inter-component communication'
    );
  }

  /**
   * Stop tracking and generate summary report
   */
  async stopTracking(): Promise<MessageFlowSummary> {
    this.isTracking = false;

    const summary: MessageFlowSummary = {
      trackingDuration: this.trackingStartTime
        ? Date.now() - this.trackingStartTime.getTime()
        : 0,
      totalMessages: this.messageEvents.size,
      successfulMessages: Array.from(this.messageEvents.values()).filter(
        event => event.status === 'received'
      ).length,
      failedMessages: Array.from(this.messageEvents.values()).filter(
        event => event.status === 'failed'
      ).length,
      averageLatency: this.calculateAverageLatency(),
      routes: Array.from(this.messageRoutes.values()),
      failures: this.communicationFailures,
      recommendations: this.generateRecommendations(),
    };

    console.log('[MessageFlowTracker] Stopped tracking. Summary:', summary);
    return summary;
  }

  /**
   * Track a message being sent between components
   */
  trackMessageSent(
    source: ExtensionContext,
    target: ExtensionContext,
    messageType: string,
    payload: any
  ): string {
    if (!this.isTracking) return '';

    const messageId = this.generateMessageId();
    const event: MessageFlowEvent = {
      id: messageId,
      timestamp: new Date(),
      source,
      target,
      messageType,
      payload: this.sanitizePayload(payload),
      status: 'sent',
    };

    this.messageEvents.set(messageId, event);
    this.updateMessageRoute(source, target, messageType);

    console.log(
      `[MessageFlowTracker] Message sent: ${source} -> ${target} (${messageType})`
    );
    return messageId;
  }

  /**
   * Track a message being received by a component
   */
  trackMessageReceived(messageId: string, latency?: number): void {
    if (!this.isTracking || !messageId) return;

    const event = this.messageEvents.get(messageId);
    if (event) {
      event.status = 'received';
      event.latency = latency || Date.now() - event.timestamp.getTime();

      const routeKey = `${event.source}->${event.target}`;
      const route = this.messageRoutes.get(routeKey);
      if (route) {
        route.successCount++;
      }

      console.log(
        `[MessageFlowTracker] Message received: ${event.source} -> ${event.target} (${event.latency}ms)`
      );
    }
  }

  /**
   * Track a message failure
   */
  trackMessageFailure(
    messageId: string,
    failureType: CommunicationFailure['failureType'],
    errorDetails: string
  ): void {
    if (!this.isTracking || !messageId) return;

    const event = this.messageEvents.get(messageId);
    if (event) {
      event.status = 'failed';
      event.error = errorDetails;

      const routeKey = `${event.source}->${event.target}`;
      const route = this.messageRoutes.get(routeKey);
      if (route) {
        route.failureCount++;

        const failure: CommunicationFailure = {
          id: this.generateFailureId(),
          timestamp: new Date(),
          route,
          failureType,
          errorDetails,
          recoveryAttempts: 0,
          resolved: false,
        };

        this.communicationFailures.push(failure);
      }

      console.error(
        `[MessageFlowTracker] Message failed: ${event.source} -> ${event.target} - ${errorDetails}`
      );
    }
  }

  /**
   * Validate message routing configuration
   */
  async validateMessageRouting(): Promise<RoutingValidationResult> {
    const results: RoutingValidationResult = {
      validRoutes: [],
      invalidRoutes: [],
      missingRoutes: [],
      recommendations: [],
    };

    // Check expected routes based on extension architecture
    const expectedRoutes = this.getExpectedRoutes();

    for (const expectedRoute of expectedRoutes) {
      const routeKey = `${expectedRoute.from}->${expectedRoute.to}`;
      const actualRoute = this.messageRoutes.get(routeKey);

      if (actualRoute) {
        if (actualRoute.failureCount === 0) {
          results.validRoutes.push(actualRoute);
        } else {
          results.invalidRoutes.push(actualRoute);
        }
      } else {
        results.missingRoutes.push(expectedRoute);
      }
    }

    // Generate routing recommendations
    results.recommendations = this.generateRoutingRecommendations(results);

    return results;
  }

  /**
   * Get communication statistics for a specific route
   */
  getRouteStatistics(
    source: ExtensionContext,
    target: ExtensionContext
  ): RouteStatistics | null {
    const routeKey = `${source}->${target}`;
    const route = this.messageRoutes.get(routeKey);

    if (!route) return null;

    const routeMessages = Array.from(this.messageEvents.values()).filter(
      event => event.source === source && event.target === target
    );

    return {
      route,
      totalMessages: routeMessages.length,
      successRate:
        route.successCount / (route.successCount + route.failureCount),
      averageLatency:
        routeMessages
          .filter(msg => msg.latency)
          .reduce((sum, msg) => sum + (msg.latency || 0), 0) /
        routeMessages.length,
      recentFailures: this.communicationFailures.filter(
        failure =>
          failure.route.from === source &&
          failure.route.to === target &&
          Date.now() - failure.timestamp.getTime() < 300000 // Last 5 minutes
      ),
    };
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFailureId(): string {
    return `fail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sanitizePayload(payload: any): any {
    // Remove sensitive data and limit size for tracking
    if (typeof payload === 'object' && payload !== null) {
      const sanitized = { ...payload };
      delete sanitized.apiKey;
      delete sanitized.token;
      delete sanitized.password;

      // Limit payload size for tracking
      const payloadStr = JSON.stringify(sanitized);
      if (payloadStr.length > 1000) {
        return {
          ...sanitized,
          _truncated: true,
          _originalSize: payloadStr.length,
        };
      }
      return sanitized;
    }
    return payload;
  }

  private updateMessageRoute(
    source: ExtensionContext,
    target: ExtensionContext,
    messageType: string
  ): void {
    const routeKey = `${source}->${target}`;
    let route = this.messageRoutes.get(routeKey);

    if (!route) {
      route = {
        from: source,
        to: target,
        messageTypes: [],
        expectedLatency: this.getExpectedLatency(source, target),
        failureCount: 0,
        successCount: 0,
      };
      this.messageRoutes.set(routeKey, route);
    }

    if (!route.messageTypes.includes(messageType)) {
      route.messageTypes.push(messageType);
    }
  }

  private getExpectedLatency(
    source: ExtensionContext,
    target: ExtensionContext
  ): number {
    // Expected latencies based on Chrome extension architecture
    const latencyMap: Record<string, number> = {
      'service-worker->content-script': 50,
      'content-script->service-worker': 50,
      'service-worker->offscreen': 100,
      'offscreen->service-worker': 100,
      'service-worker->ui': 30,
      'ui->service-worker': 30,
      'content-script->offscreen': 150,
      'offscreen->content-script': 150,
    };

    return latencyMap[`${source}->${target}`] || 200;
  }

  private calculateAverageLatency(): number {
    const messagesWithLatency = Array.from(this.messageEvents.values()).filter(
      event => event.latency && event.status === 'received'
    );

    if (messagesWithLatency.length === 0) return 0;

    return (
      messagesWithLatency.reduce(
        (sum, event) => sum + (event.latency || 0),
        0
      ) / messagesWithLatency.length
    );
  }

  private getExpectedRoutes(): MessageRoute[] {
    // Define expected communication routes based on extension architecture
    return [
      {
        from: 'content-script',
        to: 'service-worker',
        messageTypes: ['content-extracted', 'user-interaction', 'error-report'],
        expectedLatency: 50,
        failureCount: 0,
        successCount: 0,
      },
      {
        from: 'service-worker',
        to: 'offscreen',
        messageTypes: ['process-content', 'ai-request', 'cache-operation'],
        expectedLatency: 100,
        failureCount: 0,
        successCount: 0,
      },
      {
        from: 'offscreen',
        to: 'service-worker',
        messageTypes: ['processing-complete', 'ai-response', 'error-occurred'],
        expectedLatency: 100,
        failureCount: 0,
        successCount: 0,
      },
      {
        from: 'service-worker',
        to: 'ui',
        messageTypes: ['data-update', 'state-change', 'error-notification'],
        expectedLatency: 30,
        failureCount: 0,
        successCount: 0,
      },
    ];
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // Check for high failure rates
    for (const route of this.messageRoutes.values()) {
      const totalMessages = route.successCount + route.failureCount;
      if (totalMessages > 0) {
        const failureRate = route.failureCount / totalMessages;
        if (failureRate > 0.1) {
          recommendations.push(
            `High failure rate (${(failureRate * 100).toFixed(1)}%) on route ${route.from} -> ${route.to}. Consider implementing retry logic.`
          );
        }
      }
    }

    // Check for high latency
    const avgLatency = this.calculateAverageLatency();
    if (avgLatency > 200) {
      recommendations.push(
        `Average message latency is high (${avgLatency.toFixed(0)}ms). Consider optimizing message payload size or processing logic.`
      );
    }

    // Check for missing expected routes
    const expectedRoutes = this.getExpectedRoutes();
    for (const expectedRoute of expectedRoutes) {
      const routeKey = `${expectedRoute.from}->${expectedRoute.to}`;
      if (!this.messageRoutes.has(routeKey)) {
        recommendations.push(
          `Missing communication route: ${expectedRoute.from} -> ${expectedRoute.to}. Verify component integration.`
        );
      }
    }

    return recommendations;
  }

  private generateRoutingRecommendations(
    results: RoutingValidationResult
  ): string[] {
    const recommendations: string[] = [];

    if (results.invalidRoutes.length > 0) {
      recommendations.push(
        `${results.invalidRoutes.length} routes have communication failures. Review error logs and implement error handling.`
      );
    }

    if (results.missingRoutes.length > 0) {
      recommendations.push(
        `${results.missingRoutes.length} expected routes are missing. Verify component initialization and message handlers.`
      );
    }

    return recommendations;
  }
}

// Supporting interfaces
export interface MessageFlowSummary {
  trackingDuration: number;
  totalMessages: number;
  successfulMessages: number;
  failedMessages: number;
  averageLatency: number;
  routes: MessageRoute[];
  failures: CommunicationFailure[];
  recommendations: string[];
}

export interface RoutingValidationResult {
  validRoutes: MessageRoute[];
  invalidRoutes: MessageRoute[];
  missingRoutes: MessageRoute[];
  recommendations: string[];
}

export interface RouteStatistics {
  route: MessageRoute;
  totalMessages: number;
  successRate: number;
  averageLatency: number;
  recentFailures: CommunicationFailure[];
}

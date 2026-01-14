// MatchBrokerService - Stub implementation
// This service manages match requests, responses, and real-time match coordination

class MatchBrokerService {
  private static instance: MatchBrokerService;
  private listeners: Map<string, ((...args: unknown[]) => void)[]> = new Map();

  public static getInstance(): MatchBrokerService {
    if (!MatchBrokerService.instance) {
      MatchBrokerService.instance = new MatchBrokerService();
    }
    return MatchBrokerService.instance;
  }

  /**
   * Add listener for match-related events
   */
  addListener(event: string, callback: (...args: unknown[]) => void): void {
    console.log('🤝 MatchBrokerService: Adding listener for', event);
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  /**
   * Remove listener for match-related events
   */
  removeListener(event: string, callback: (...args: unknown[]) => void): void {
    console.log('🤝 MatchBrokerService: Removing listener for', event);
    const eventListeners = this.listeners.get(event);
    if (eventListeners && Array.isArray(eventListeners)) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  /**
   * Create a new match request
   */
  async createMatchRequest(request: {
    userId: string;
    preferences: unknown;
    location: {
      latitude: number;
      longitude: number;
      radius: number;
    };
    timeSlot: {
      date: string;
      startTime: string;
      endTime: string;
    };
  }): Promise<string> {
    console.log('🤝 MatchBrokerService: Creating match request', request);
    // Stub: Generate mock request ID
    const requestId = `match_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Stub: Simulate match request processing
    setTimeout(() => {
      this.notifyListeners('match_request_created', { requestId, ...request });
    }, 100);

    return requestId;
  }

  /**
   * Respond to a match request
   */
  async respondToMatchRequest(
    requestId: string,
    response: {
      userId: string;
      accepted: boolean;
      message?: string;
    }
  ): Promise<void> {
    console.log('🤝 MatchBrokerService: Responding to match request', { requestId, response });

    // Stub: Simulate response processing
    setTimeout(() => {
      this.notifyListeners('match_response_received', {
        requestId,
        ...response,
      });

      if (response.accepted) {
        this.notifyListeners('match_confirmed', {
          requestId,
          matchId: `match_${Date.now()}`,
          players: [response.userId],
        });
      }
    }, 100);
  }

  /**
   * Get active match requests for a user
   */
  async getActiveRequests(userId: string): Promise<
    {
      id: string;
      userId: string;
      status: string;
      createdAt: Date;
      preferences: {
        skillLevel: string;
        gameType: string;
        location: string;
      };
    }[]
  > {
    console.log('🤝 MatchBrokerService: Getting active requests for', userId);
    return [
      {
        id: `req_${Date.now()}`,
        userId,
        status: 'pending',
        createdAt: new Date(),
        preferences: {
          skillLevel: 'intermediate',
          gameType: 'singles',
        },
      },
    ];
  }

  /**
   * Cancel a match request
   */
  async cancelMatchRequest(requestId: string, userId: string): Promise<void> {
    console.log('🤝 MatchBrokerService: Cancelling match request', { requestId, userId });

    setTimeout(() => {
      this.notifyListeners('match_request_cancelled', { requestId, userId });
    }, 100);
  }

  /**
   * Get nearby match opportunities
   */
  async getNearbyOpportunities(
    location: {
      latitude: number;
      longitude: number;
      radius: number;
    },
    preferences: unknown
  ): Promise<
    {
      id: string;
      partnerId: string;
      partnerName: string;
      skillLevel: string;
      distance: number;
      availableTime: string;
      gameType: string;
      location: { name: string; latitude: number; longitude: number };
    }[]
  > {
    console.log('🤝 MatchBrokerService: Getting nearby opportunities', { location, preferences });

    // Stub: Return mock opportunities
    return [
      {
        id: `opp_${Date.now()}`,
        distance: Math.random() * 5 + 1, // 1-6 km
        skillLevel: 'intermediate',
        availableTime: new Date(Date.now() + Math.random() * 86400000), // Next 24 hours
        userId: 'mock_user_id',
        userName: 'Pickleball Partner',
      },
    ];
  }

  /**
   * Notify all listeners for a specific event
   */
  private notifyListeners(event: string, data: unknown): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }
}

export default MatchBrokerService.getInstance();

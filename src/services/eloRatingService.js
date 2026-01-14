/**
 * ELO Rating Service for Lightning Tennis
 * Calculates and manages player ELO ratings based on match results
 */

/**
 * ELO Rating System Configuration
 */
const ELO_CONFIG = {
  // Starting rating for new players
  INITIAL_RATING: 1200,

  // K-factor values (rating change sensitivity)
  K_FACTOR: {
    NOVICE: 32, // Players under 30 games
    AVERAGE: 24, // Players 30-100 games
    EXPERIENCED: 16, // Players over 100 games
    EXPERT: 8, // Players over 500 games or rating > 2000
  },

  // Rating thresholds
  RATING_THRESHOLDS: {
    BRONZE: 1000,
    SILVER: 1200,
    GOLD: 1400,
    PLATINUM: 1600,
    DIAMOND: 1800,
    MASTER: 2000,
    GRANDMASTER: 2200,
  },

  // Maximum rating change per game
  MAX_RATING_CHANGE: 40,
  MIN_RATING_CHANGE: 1,
};

/**
 * ELO Rating Service Class
 */
class EloRatingService {
  constructor() {
    console.log('🏆 EloRatingService initialized');
  }

  /**
   * Calculate new ELO ratings after a match
   * @param {Object} player1 - First player data
   * @param {Object} player2 - Second player data
   * @param {string} result - Match result: 'player1_wins', 'player2_wins', 'draw'
   * @param {Object} matchDetails - Additional match information
   * @returns {Object} New ratings for both players
   */
  calculateNewRatings(player1, player2, result, matchDetails = {}) {
    try {
      // Validate input
      if (!this.validatePlayerData(player1) || !this.validatePlayerData(player2)) {
        throw new Error('Invalid player data provided');
      }

      if (!['player1_wins', 'player2_wins', 'draw'].includes(result)) {
        throw new Error('Invalid match result. Must be: player1_wins, player2_wins, or draw');
      }

      // Get current ratings
      const rating1 = player1.stats?.eloRating || ELO_CONFIG.INITIAL_RATING;
      const rating2 = player2.stats?.eloRating || ELO_CONFIG.INITIAL_RATING;
      const games1 = player1.stats?.totalMatches || 0;
      const games2 = player2.stats?.totalMatches || 0;

      console.log(
        `📊 ELO Calculation - ${player1.profile?.displayName} (${rating1}) vs ${player2.profile?.displayName} (${rating2})`
      );

      // Calculate expected scores (probability of winning)
      const expectedScore1 = this.calculateExpectedScore(rating1, rating2);
      const expectedScore2 = this.calculateExpectedScore(rating2, rating1);

      // Determine actual scores based on result
      let actualScore1, actualScore2;
      switch (result) {
        case 'player1_wins':
          actualScore1 = 1;
          actualScore2 = 0;
          break;
        case 'player2_wins':
          actualScore1 = 0;
          actualScore2 = 1;
          break;
        case 'draw':
          actualScore1 = 0.5;
          actualScore2 = 0.5;
          break;
      }

      // Calculate K-factors
      const kFactor1 = this.calculateKFactor(rating1, games1);
      const kFactor2 = this.calculateKFactor(rating2, games2);

      // Apply match importance multiplier
      const importanceMultiplier = this.calculateImportanceMultiplier(matchDetails);
      const adjustedK1 = Math.min(kFactor1 * importanceMultiplier, ELO_CONFIG.MAX_RATING_CHANGE);
      const adjustedK2 = Math.min(kFactor2 * importanceMultiplier, ELO_CONFIG.MAX_RATING_CHANGE);

      // Calculate rating changes
      let ratingChange1 = Math.round(adjustedK1 * (actualScore1 - expectedScore1));
      let ratingChange2 = Math.round(adjustedK2 * (actualScore2 - expectedScore2));

      // Apply minimum change rule
      if (Math.abs(ratingChange1) < ELO_CONFIG.MIN_RATING_CHANGE) {
        ratingChange1 =
          ratingChange1 >= 0 ? ELO_CONFIG.MIN_RATING_CHANGE : -ELO_CONFIG.MIN_RATING_CHANGE;
      }
      if (Math.abs(ratingChange2) < ELO_CONFIG.MIN_RATING_CHANGE) {
        ratingChange2 =
          ratingChange2 >= 0 ? ELO_CONFIG.MIN_RATING_CHANGE : -ELO_CONFIG.MIN_RATING_CHANGE;
      }

      // Calculate new ratings (minimum 800, maximum 3000)
      const newRating1 = Math.max(800, Math.min(3000, rating1 + ratingChange1));
      const newRating2 = Math.max(800, Math.min(3000, rating2 + ratingChange2));

      const ratingResult = {
        player1: {
          userId: player1.userId,
          previousRating: rating1,
          newRating: newRating1,
          ratingChange: ratingChange1,
          expectedScore: Math.round(expectedScore1 * 1000) / 1000,
          actualScore: actualScore1,
          kFactor: adjustedK1,
          tier: this.getRatingTier(newRating1),
        },
        player2: {
          userId: player2.userId,
          previousRating: rating2,
          newRating: newRating2,
          ratingChange: ratingChange2,
          expectedScore: Math.round(expectedScore2 * 1000) / 1000,
          actualScore: actualScore2,
          kFactor: adjustedK2,
          tier: this.getRatingTier(newRating2),
        },
        matchDetails: {
          result,
          importanceMultiplier,
          timestamp: new Date().toISOString(),
        },
      };

      console.log('✅ ELO calculation completed:', {
        player1Change: `${rating1} → ${newRating1} (${ratingChange1 >= 0 ? '+' : ''}${ratingChange1})`,
        player2Change: `${rating2} → ${newRating2} (${ratingChange2 >= 0 ? '+' : ''}${ratingChange2})`,
      });

      return ratingResult;
    } catch (error) {
      console.error('❌ ELO calculation failed:', error);
      throw error;
    }
  }

  /**
   * Calculate expected score (probability of winning) using ELO formula
   * @param {number} ratingA - Player A's rating
   * @param {number} ratingB - Player B's rating
   * @returns {number} Expected score (0-1)
   */
  calculateExpectedScore(ratingA, ratingB) {
    const powerOf10 = Math.pow(10, (ratingB - ratingA) / 400);
    return 1 / (1 + powerOf10);
  }

  /**
   * Calculate K-factor based on rating and experience
   * @param {number} rating - Current rating
   * @param {number} gamesPlayed - Total games played
   * @returns {number} K-factor
   */
  calculateKFactor(rating, gamesPlayed) {
    // Expert players (high rating or many games)
    if (rating >= 2000 || gamesPlayed >= 500) {
      return ELO_CONFIG.K_FACTOR.EXPERT;
    }

    // Experienced players
    if (gamesPlayed >= 100) {
      return ELO_CONFIG.K_FACTOR.EXPERIENCED;
    }

    // Average players
    if (gamesPlayed >= 30) {
      return ELO_CONFIG.K_FACTOR.AVERAGE;
    }

    // Novice players (high volatility for quick adjustment)
    return ELO_CONFIG.K_FACTOR.NOVICE;
  }

  /**
   * Calculate match importance multiplier
   * @param {Object} matchDetails - Match details
   * @returns {number} Importance multiplier
   */
  calculateImportanceMultiplier(matchDetails) {
    let multiplier = 1.0;

    // Tournament matches are more important
    if (matchDetails.isTournament) {
      multiplier *= 1.5;
    }

    // Championship/final matches
    if (matchDetails.isFinal) {
      multiplier *= 1.3;
    }

    // Club matches (slightly less important than individual matches)
    if (matchDetails.isClubMatch) {
      multiplier *= 0.9;
    }

    // Casual/practice matches
    if (matchDetails.isCasual) {
      multiplier *= 0.8;
    }

    return Math.round(multiplier * 100) / 100;
  }

  /**
   * Get rating tier based on ELO rating
   * @param {number} rating - ELO rating
   * @returns {Object} Tier information
   */
  getRatingTier(rating) {
    const thresholds = ELO_CONFIG.RATING_THRESHOLDS;

    if (rating >= thresholds.GRANDMASTER) {
      return { name: 'Grandmaster', color: '#FF6B00', icon: '👑' };
    } else if (rating >= thresholds.MASTER) {
      return { name: 'Master', color: '#9C27B0', icon: '💎' };
    } else if (rating >= thresholds.DIAMOND) {
      return { name: 'Diamond', color: '#00BCD4', icon: '💎' };
    } else if (rating >= thresholds.PLATINUM) {
      return { name: 'Platinum', color: '#607D8B', icon: '⭐' };
    } else if (rating >= thresholds.GOLD) {
      return { name: 'Gold', color: '#FF9800', icon: '🏆' };
    } else if (rating >= thresholds.SILVER) {
      return { name: 'Silver', color: '#9E9E9E', icon: '🥈' };
    } else {
      return { name: 'Bronze', color: '#795548', icon: '🥉' };
    }
  }

  /**
   * Get leaderboard rankings
   * @param {Array} players - Array of player objects
   * @param {number} limit - Number of top players to return
   * @returns {Array} Sorted leaderboard
   */
  getLeaderboard(players, limit = 50) {
    return players
      .filter(player => player.stats?.eloRating && player.stats?.totalMatches >= 5)
      .sort((a, b) => (b.stats.eloRating || 0) - (a.stats.eloRating || 0))
      .slice(0, limit)
      .map((player, index) => ({
        rank: index + 1,
        userId: player.userId,
        nickname: player.profile?.displayName,
        eloRating: player.stats.eloRating,
        totalMatches: player.stats.totalMatches,
        winRate: player.stats.wins / player.stats.totalMatches,
        tier: this.getRatingTier(player.stats.eloRating),
        recent5Games: player.stats.recentResults?.slice(-5) || [],
      }));
  }

  /**
   * Calculate rating distribution statistics
   * @param {Array} players - Array of player objects
   * @returns {Object} Distribution statistics
   */
  getRatingDistribution(players) {
    const distribution = {
      Bronze: 0,
      Silver: 0,
      Gold: 0,
      Platinum: 0,
      Diamond: 0,
      Master: 0,
      Grandmaster: 0,
    };

    let totalRating = 0;
    let activePlayersCount = 0;

    players.forEach(player => {
      if (player.stats?.eloRating && player.stats?.totalMatches >= 5) {
        const tier = this.getRatingTier(player.stats.eloRating);
        distribution[tier.name]++;
        totalRating += player.stats.eloRating;
        activePlayersCount++;
      }
    });

    const averageRating = activePlayersCount > 0 ? Math.round(totalRating / activePlayersCount) : 0;

    return {
      distribution,
      averageRating,
      totalActivePlayers: activePlayersCount,
      distributionPercentages: Object.keys(distribution).reduce((acc, tier) => {
        acc[tier] =
          activePlayersCount > 0 ? Math.round((distribution[tier] / activePlayersCount) * 100) : 0;
        return acc;
      }, {}),
    };
  }

  /**
   * Validate player data
   * @param {Object} player - Player object
   * @returns {boolean} Validation result
   */
  validatePlayerData(player) {
    return (
      player &&
      player.userId &&
      typeof player.userId === 'string' &&
      player.profile &&
      typeof player.profile === 'object'
    );
  }

  /**
   * Get rating change preview without applying it
   * @param {Object} player1 - First player data
   * @param {Object} player2 - Second player data
   * @param {string} result - Hypothetical match result
   * @returns {Object} Preview of rating changes
   */
  previewRatingChange(player1, player2, result) {
    try {
      return this.calculateNewRatings(player1, player2, result, { preview: true });
    } catch (error) {
      console.error('Failed to preview rating change:', error);
      return null;
    }
  }
}

// Create and export singleton instance
const eloRatingService = new EloRatingService();

export default eloRatingService;

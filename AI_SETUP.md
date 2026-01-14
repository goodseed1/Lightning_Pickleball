# Lightning Pickleball AI Chatbot Setup

## Overview

Lightning Pickleball now includes a comprehensive AI chatbot powered by Google's Gemini AI. The chatbot provides pickleball-related assistance including rules, techniques, strategy advice, match analysis, and personalized recommendations.

## Features

### 🎾 Pickleball Expertise

- **Rules & Scoring**: Complete pickleball rule explanations and scoring system guidance
- **Technique Tips**: Stroke mechanics, improvement suggestions, and form corrections
- **Strategy Advice**: Singles/doubles tactics, match preparation, mental game
- **Equipment Recommendations**: Racquet, strings, shoes based on skill level

### 🤖 AI Capabilities

- **RAG System**: Retrieval-Augmented Generation with pickleball knowledge base
- **Multi-language Support**: English and Korean (한국어) responses
- **Personalized Advice**: Tailored to user's skill level, playing style, and goals
- **Match Analysis**: Performance analysis with improvement suggestions
- **Context Awareness**: Maintains conversation history for relevant responses

### 📱 User Experience

- **Quick Actions**: One-tap access to common pickleball questions
- **Typing Indicators**: Real-time feedback during AI response generation
- **Confidence Scoring**: AI confidence levels for response quality
- **Knowledge Sources**: Displays number of sources used for each response

## Setup Instructions

### 1. Get Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com)
2. Sign in with your Google account
3. Click "Get API Key" or "Create API Key"
4. Copy the generated API key

### 2. Configure Environment Variables

1. Open `.env` file in the project root
2. Add your Gemini API key:

```
EXPO_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
```

### 3. Install Dependencies

The required dependencies are already added to package.json:

- `@google/generative-ai`: Google Gemini AI SDK
- `@react-navigation/material-top-tabs`: For competition tabs
- `react-native-tab-view`: Tab view support

Run to install:

```bash
npm install
```

### 4. Test the AI Chat

1. Run the app: `npm start`
2. Navigate to Profile screen
3. Tap the green AI chat button (floating action button)
4. Try asking pickleball-related questions:
   - "Explain pickleball scoring system"
   - "How can I improve my backhand?"
   - "What's the best strategy for doubles?"
   - "Recommend a racquet for beginners"

## AI Features in Detail

### Pickleball Knowledge Base (RAG)

The AI uses a comprehensive pickleball knowledge base covering:

**Rules & Regulations**

- Scoring system (love, 15, 30, 40, game)
- Set and match formats
- Serving rules and rotation
- Court dimensions and lines

**Techniques & Strokes**

- Forehand mechanics and tips
- Backhand (one-handed vs two-handed)
- Serve technique and power
- Volley and net play
- Return of serve strategies

**Strategy & Tactics**

- Singles court positioning
- Doubles communication and formation
- Mental game and focus
- Match preparation routines

**Equipment & Gear**

- Racquet selection by skill level
- String tension recommendations
- Pickleball shoe requirements
- Grip sizes and materials

### Personalized Responses

The AI considers user profile data:

- **LPR Skill Level**: Tailors advice complexity
- **Playing Style**: Matches recommendations to preferred style
- **Recent Matches**: References performance history
- **Current Goals**: Aligns advice with improvement objectives

### Multi-language Support

**English Features:**

- Professional pickleball terminology
- Clear, actionable advice
- Beginner-friendly explanations
- Advanced tactical discussions

**Korean Features (한국어):**

- Pickleball terms in Korean
- Cultural context for Korean pickleball community
- Bilingual explanations when helpful
- Korean-specific pickleball culture references

## Usage Examples

### Basic Pickleball Questions

```
User: "What does 'love' mean in pickleball?"
AI: "In pickleball, 'love' means zero points. The scoring goes: love (0), 15, 30, 40, then game. The term 'love' likely comes from the French word 'l'oeuf' (the egg), representing the oval shape of zero."
```

### Skill-Specific Advice

```
User: "I'm an intermediate player. How can I improve my serve?"
AI: "For intermediate players, focus on these serve improvements:
1. Toss consistency - same height and position every time
2. Pronation - snap your wrist on contact for spin and power
3. Target practice - aim for corners of service boxes
4. Second serve development - add topspin for safety and bounce"
```

### Match Analysis

```
User: "I lost 6-4, 6-2. What went wrong?"
AI: "Based on your straight-set loss, here are areas to analyze:
- First set was competitive (6-4) but you lost momentum
- Second set shows possible fitness or mental fatigue
- Focus on maintaining intensity throughout the match
- Work on closing out tight sets when you're ahead"
```

### Equipment Recommendations

```
User: "I'm a beginner. What racquet should I buy?"
AI: "For beginners, I recommend:
- Head size: 105-110 square inches (more forgiving)
- Weight: 9-10 oz (easier to maneuver)
- String pattern: 16x19 (more power and spin)
- Popular models: Babolat Drive, Wilson Clash, Head Ti series
- Budget: $50-150 for a quality starter racquet"
```

## Troubleshooting

### API Key Issues

- Ensure API key is correctly copied without extra spaces
- Verify the key hasn't expired or reached usage limits
- Check Google Cloud Console for API quotas

### Connection Issues

- Check internet connectivity
- Verify firewall settings allow AI API requests
- Try restarting the app if responses seem slow

### Response Quality

- Be specific with questions for better responses
- Include your skill level for personalized advice
- Ask follow-up questions for clarification

## Future Enhancements

### Planned Features

- **Video Analysis**: Upload match videos for AI analysis
- **Practice Drills**: Custom drill recommendations
- **Tournament Prep**: Competition-specific advice
- **Injury Prevention**: Health and fitness guidance
- **Court Booking**: Integration with local court systems

### Integration Possibilities

- **Wearable Data**: Apple Watch/Fitbit match statistics
- **Social Features**: Share AI insights with friends
- **Coach Collaboration**: AI recommendations + human coaching
- **Club Integration**: Team-wide AI analysis and tips

## Support

For AI chatbot issues:

1. Check this documentation
2. Verify API key configuration
3. Test with simple questions first
4. Contact support with specific error messages

The Lightning Pickleball AI is designed to be your personal pickleball assistant, helping you improve your game through intelligent, personalized advice. Enjoy exploring the world of pickleball with AI-powered insights! 🎾🤖

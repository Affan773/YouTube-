import { BaseAgent } from './BaseAgent.js';
import { AgentId, GameDiscoveryData, TrendingGameItem, WorkflowJob } from '../../types.js';
import { generateJSON } from '../gemini.js';
import { memory } from '../memory.js';

export class GameDiscoveryAgent extends BaseAgent {
  public readonly id: AgentId = 'game_discovery';
  public readonly name = 'Game Discovery Agent';
  public readonly role = 'Identifies trending games, search demand, competition & fresh viral ideas';

  public async run(job: WorkflowJob): Promise<GameDiscoveryData> {
    this.updateProgress(job.id, 15, 'Scanning global gaming trends, search demand & viral patterns...');
    this.log(job.id, 'Analyzing YouTube Gaming search velocity, Shorts viewer demand & competition gaps...');

    const userGame = job.options.game?.trim();
    const userTopic = job.options.topic?.trim();
    const isAutoDiscover = Boolean(
      job.options.autoGameDiscovery ||
      !userGame ||
      userGame.toLowerCase().includes('trending') ||
      userGame.toLowerCase().includes('auto') ||
      userTopic?.toLowerCase().includes('trending') ||
      userTopic?.toLowerCase().includes('today')
    );

    // Retrieve past recent topics to avoid duplicate/repetitive ideas
    const pastJobs = memory.getAllJobs().filter((j) => j.id !== job.id);
    const pastTopics = pastJobs.map((j) => `${j.game || ''}: ${j.topic}`).slice(0, 15);

    const prompt = `
You are the Game Discovery Agent for a universal YouTube Gaming Studio.
Your task is to analyze gaming market demand and recommend viral content opportunities across ANY game (e.g. Minecraft, GTA 5/6, Roblox, Fortnite, PUBG/BGMI, Free Fire, Valorant, Counter-Strike 2, Call of Duty, EA Sports FC, Forza Horizon, Red Dead Redemption, Elden Ring, Horror games, Simulator games, Indie breakout hits, and newly trending releases).

USER INPUT CONTEXT:
- Specific Game Specified: ${userGame || 'None (Auto-Discovery Mode Enabled)'}
- Specific Topic Specified: ${userTopic || 'None (Auto-Discovery Mode Enabled)'}
- Preferred Format: ${job.options.format || 'shorts'}
- Recent Past Topics Created (AVOID DUPLICATING THESE):
${pastTopics.length > 0 ? pastTopics.map((t) => `  - ${t}`).join('\n') : '  - None yet'}

REQUIREMENTS:
1. Provide a curated list of at least 4 top-trending games right now with search volume, competition level (Low/Medium/High), trending topic angles, and hook ideas.
2. Select the optimal game for this specific video. If the user specified a game, use that game and find its freshest angle; if auto-discovery, choose the highest-opportunity trending game.
3. Identify a clear, viral content recommendation and explanation of why this will win on YouTube (Shorts or Long-form).

Return strictly JSON conforming to this structure:
{
  "trendingGames": [
    {
      "name": "Game Name",
      "genre": "Genre",
      "popularityScore": 95,
      "searchVolume": "2.1M monthly searches (High)",
      "competitionLevel": "Medium",
      "trendingTopics": ["Topic Idea 1", "Topic Idea 2", "Topic Idea 3"],
      "recommendedFormat": "shorts",
      "hookIdeas": ["Hook 1", "Hook 2"]
    }
  ],
  "selectedGame": "Chosen Game Name",
  "discoveryReason": "Why this game and angle have peak viral momentum right now",
  "searchDemandAnalysis": "Search intent analysis and viewer query trends",
  "competitionAnalysis": "Low competition gap identified for this specific angle",
  "recommendedIdea": "Specific title/concept for the video",
  "contentAngle": "The unique twist or narrative hook that prevents audience drop-off",
  "isAutoDiscovered": ${isAutoDiscover}
}
`;

    const fallbackDiscovery: GameDiscoveryData = {
      trendingGames: [
        {
          name: userGame || 'Minecraft',
          genre: 'Sandbox / Survival',
          popularityScore: 96,
          searchVolume: '3.8M monthly searches (Very High)',
          competitionLevel: 'Medium',
          trendingTopics: [
            '10 Secret Hidden Base Builds Nobody Knows',
            'Illegal Minecraft Building Tricks Pro Builders Use',
            'Surviving 100 Days in Hardcore Impossible Mode',
          ],
          recommendedFormat: job.options.format || 'shorts',
          hookIdeas: ['Only 0.1% of Minecraft players know this door trick...', 'Stop building basic secret bases!'],
        },
        {
          name: 'GTA 5 / GTA 6',
          genre: 'Action / Open World',
          popularityScore: 94,
          searchVolume: '2.9M monthly searches (High)',
          competitionLevel: 'High',
          trendingTopics: [
            '5-Star Police Chase Impossible Escape',
            'Secret Underground Bunkers Most Players Missed',
            'Testing Mythical Car Physics at Maximum Speed',
          ],
          recommendedFormat: 'shorts',
          hookIdeas: ['Can you survive a 5-star wanted level without leaving this bridge?', 'I found the secret bunker!'],
        },
        {
          name: 'Roblox',
          genre: 'Multiplayer / Sandbox',
          popularityScore: 95,
          searchVolume: '4.1M monthly searches (Extreme)',
          competitionLevel: 'Medium',
          trendingTopics: [
            'Funniest Impostor Fails in Roblox',
            'Secret Badge Locations in Trending Horror Games',
            'Top 5 Games You Need to Try With Friends',
          ],
          recommendedFormat: 'shorts',
          hookIdeas: ['This Roblox developer hid an impossible secret...', 'Wait for the plot twist at the end!'],
        },
        {
          name: 'Elden Ring',
          genre: 'Action RPG / Souls-like',
          popularityScore: 90,
          searchVolume: '1.6M monthly searches (High)',
          competitionLevel: 'Low',
          trendingTopics: [
            'Secret Bosses That 99% of Tarnished Skipped',
            'Overpowered Early Game Weapons in 5 Minutes',
            'Hidden Lore Secrets That Change Everything',
          ],
          recommendedFormat: 'landscape',
          hookIdeas: ['This secret weapon makes the hardest boss look easy...', 'Did you find this hidden cave?'],
        },
      ],
      selectedGame: userGame || 'Minecraft',
      discoveryReason: userGame
        ? `Optimized viral angle for user-selected game: ${userGame}`
        : 'Minecraft has surging viral demand for secret build mechanics with high Shorts completion rates.',
      searchDemandAnalysis: 'High interest around compact building hacks, secret redstone mechanics, and surprising easter eggs.',
      competitionAnalysis: 'Specific modular builds have lower saturation compared to generic playthroughs.',
      recommendedIdea: userTopic || (userGame ? `${userGame} - 10 Insane Secrets & Tricks` : 'Minecraft: 10 Secret Builds You Did Not Know'),
      contentAngle: 'Fast-paced reveal structure with instant payoff in the first 2 seconds.',
      isAutoDiscovered: isAutoDiscover,
    };

    this.updateProgress(job.id, 60, 'Synthesizing competitive demand matrix with Gemini AI...');

    const discoveryData = await generateJSON<GameDiscoveryData>(
      prompt,
      'You are a senior YouTube Gaming Market Analyst and Data Strategist. Output valid JSON only.',
      () => fallbackDiscovery
    );

    // Apply discovered game to job if not already set or if auto-discovery was requested
    if (!job.game || isAutoDiscover) {
      job.game = discoveryData.selectedGame;
    }
    if (!job.topic || job.topic.toLowerCase().includes('trending') || job.topic.toLowerCase().includes('today')) {
      job.topic = discoveryData.recommendedIdea;
    }

    this.updateProgress(job.id, 100, `Selected Game: "${discoveryData.selectedGame}" - Idea: "${discoveryData.recommendedIdea}"`);
    this.log(
      job.id,
      `Discovery Complete: Selected "${discoveryData.selectedGame}" | Angle: "${discoveryData.contentAngle}" | Competition: ${discoveryData.competitionAnalysis.slice(0, 60)}...`,
      'success'
    );

    memory.setArtifact(job.id, 'gameDiscovery', discoveryData);
    return discoveryData;
  }
}

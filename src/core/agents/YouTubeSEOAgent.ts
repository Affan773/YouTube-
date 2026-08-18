import { BaseAgent } from './BaseAgent.js';
import { AgentId, SEOData, WorkflowJob } from '../../types.js';
import { generateJSON } from '../gemini.js';
import { memory } from '../memory.js';

export class YouTubeSEOAgent extends BaseAgent {
  public readonly id: AgentId = 'seo';
  public readonly name = 'YouTube SEO Agent';
  public readonly role = 'High-CTR Title Options, Viral Description, Gaming Tags & Search Optimization';

  public async run(job: WorkflowJob): Promise<SEOData> {
    const game = job.game || job.artifacts.script?.game || 'Gaming';
    const topic = job.topic || job.artifacts.script?.titleHook || `${game} Top Secrets`;
    const format = job.options.format || 'shorts';
    const isShorts = format === 'shorts';

    this.updateProgress(job.id, 25, `Synthesizing YouTube SEO & high-CTR metadata for [${game}]...`);
    this.log(job.id, `Generating viral title candidates, structured description, chapters & gaming tags for [${game}]...`);

    const prompt = `
You are the YouTube SEO & Metadata Optimization Agent for a universal YouTube Gaming Studio.
Your mission is to craft authentic, high-converting, compliant YouTube metadata for:

- Game: "${game}"
- Topic: "${topic}"
- Format: ${format} (${isShorts ? 'YouTube Shorts (9:16)' : 'Long-form (16:9)'})
- Script Hook: "${job.artifacts.script?.titleHook || 'Epic Gameplay Moments'}"
- Thumbnail Headline: "${job.artifacts.thumbnail?.headlineText || 'PRO SECRET'}"

REQUIREMENTS:
1. Provide 5 distinct high-CTR Title Options (under 65 chars, high curiosity, zero false clickbait).
2. Select the single best title into "selectedTitle". Include #Shorts and #${game.replace(/\s+/g, '')} if format is shorts.
3. Write a rich formatted YouTube Description including summary, key moments, call-to-action, and relevant gaming hashtags.
4. Provide 15-20 specific YouTube Tags (mix of broad e.g. "${game}", specific e.g. "${game} secret tricks", and format e.g. "gaming shorts").
5. Provide 4-6 Hashtags.
6. Set categoryId to '20' (Gaming).
7. Recommend a playlist name for the channel.
8. Calculate an overall SEO score (0-100) based on keyword density and search intent match.

Return strictly valid JSON:
{
  "titleOptions": [
    "Title Option 1",
    "Title Option 2",
    "Title Option 3",
    "Title Option 4",
    "Title Option 5"
  ],
  "selectedTitle": "The #1 Selected Title #Shorts",
  "description": "Full rich description with timestamps and links...",
  "tags": ["tag1", "tag2", "tag3"],
  "hashtags": ["#Tag1", "#Tag2", "#Tag3"],
  "categoryId": "20",
  "seoScore": 96,
  "searchKeywords": ["keyword1", "keyword2", "keyword3"],
  "playlistRecommendation": "Best ${game} Secrets & Pro Tips",
  "audienceTargeting": "Gamers, ${game} players, competitive & casual community"
}
`;

    const fallbackSEO: SEOData = {
      titleOptions: [
        `${game}: 10 Secret Tricks You NEVER Knew! #Shorts`,
        `Only 0.1% Of ${game} Players Know This Secret... #Shorts`,
        `How Pro ${game} Players Actually Do This Trick! #Shorts`,
        `The Most Insane Trick In ${game} History #Shorts`,
        `I Tested The Rarest Secret In ${game} #Shorts`,
      ],
      selectedTitle: isShorts
        ? `${game}: The Secret Trick 99% Of Players Don't Know #Shorts`
        : `${game} Masterclass - The Secret Mechanics Nobody Told You About`,
      description: `Can you believe this secret exists in ${game}?\n\nIn this video, we break down an insane pro mechanic and hidden trick that changes how you play.\n\n🎮 GAME: ${game}\n🔔 SUBSCRIBE for daily gaming secrets, tips & viral highlights!\n\n#${game.replace(/[^a-zA-Z0-9]/g, '')} #Gaming #GamingShorts #TipsAndTricks #Viral`,
      tags: [
        game,
        `${game} secrets`,
        `${game} tricks`,
        `${game} guide`,
        `${game} pro tips`,
        `${game} gameplay`,
        `${game} shorts`,
        'gaming shorts',
        'viral gaming',
        'how to',
        'secret tricks',
      ],
      hashtags: [`#${game.replace(/[^a-zA-Z0-9]/g, '')}`, '#Gaming', '#GamingShorts', '#ProTips', '#Viral'],
      categoryId: '20',
      seoScore: 95,
      searchKeywords: [`${game} secrets`, `${game} tutorial`, `${game} tips`, `${game} gameplay`],
      playlistRecommendation: `Ultimate ${game} Guides & Viral Moments`,
      audienceTargeting: `Dedicated ${game} fans and YouTube gaming community`,
    };

    this.updateProgress(job.id, 75, 'Analyzing keyword density & YouTube search algorithms...');

    const seoData = await generateJSON<SEOData>(
      prompt,
      'You are a senior YouTube SEO specialist and metadata optimization expert for gaming. Output valid JSON only.',
      () => fallbackSEO
    );

    memory.setArtifact(job.id, 'seo', seoData);
    this.complete(job.id, `SEO metadata finalized (Score: ${seoData.seoScore}/100, Title: "${seoData.selectedTitle}")`, {
      selectedTitle: seoData.selectedTitle,
      seoScore: seoData.seoScore,
      tagsCount: seoData.tags.length,
    });

    return seoData;
  }
}

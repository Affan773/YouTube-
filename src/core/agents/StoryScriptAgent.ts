import { BaseAgent } from './BaseAgent.js';
import { AgentId, ScriptData, ScriptLine, WorkflowJob } from '../../types.js';
import { generateJSON } from '../gemini.js';
import { memory } from '../memory.js';

export class StoryScriptAgent extends BaseAgent {
  public readonly id: AgentId = 'script';
  public readonly name = 'Story & Script Agent';
  public readonly role = 'Drafts viral dialogue, pacing lines, timestamps & psychological narrative hooks';

  public async run(job: WorkflowJob): Promise<ScriptData> {
    const game = job.game || job.artifacts.research?.game || 'Gaming';
    const topic = job.topic || job.artifacts.research?.topic || `${game} Secrets`;
    const format = job.options.format || 'shorts';
    const research = job.artifacts.research;
    const strategy = job.artifacts.contentStrategy;

    this.updateProgress(job.id, 20, `Writing narrative script & dialogue for [${game}]...`);
    this.log(job.id, `Drafting high-retention script for [${game}] - Topic: "${topic}" (${format.toUpperCase()})...`);

    const targetSeconds = format === 'shorts' ? (job.options.targetDurationSeconds || 32) : (job.options.targetDurationSeconds || 180);

    const prompt = `
You are the Story & Script Agent for a universal YouTube Gaming Studio.
Write an electrifying, ultra-engaging YouTube script for:

- Game: "${game}"
- Topic: "${topic}"
- Format: ${format} (${format === 'shorts' ? '30-40 seconds fast-paced Short' : '180-240 seconds long-form video'})
- Target Duration: ~${targetSeconds} seconds
- Hook Concept from Research: "${research?.hookConcept || 'Immediate viral visual interrupt'}"
- Tone: "${research?.tone || 'Energetic and thrilling'}"
- Pacing Strategy: "${strategy?.pacingStrategy || 'Fast-paced with sound effects and dramatic reveals'}"
- Key Moments to hit: ${research?.keyMoments ? JSON.stringify(research.keyMoments) : 'Step 1, Step 2, Climax'}

SCRIPT REQUIREMENTS:
1. First line (0-3s) MUST be an irresistible curiosity hook (no generic "Hey guys welcome back").
2. Total speaking duration must be approximately ${targetSeconds} seconds (roughly 2.5 words per second).
3. Break into distinct sequential lines with exact timestampStart and timestampEnd (seconds).
4. Include emotion tags ('hyped', 'mysterious', 'shocked', 'urgent', 'triumphant').
5. Include sfxCue for each line (e.g. 'WHOOSH', 'VINE_BOOM', 'POLICE_SIREN', 'RECORD_SCRATCH', 'ANVIL_DING', 'BASS_DROP').
6. Strong call-to-action or seamless infinite loop ending line.

Return strictly valid JSON:
{
  "game": "${game}",
  "titleHook": "Viral Hook Title",
  "synopsis": "Short overview of the video narrative arc",
  "totalDurationSeconds": ${targetSeconds},
  "lines": [
    {
      "id": "line_1",
      "timestampStart": 0,
      "timestampEnd": 3.5,
      "speaker": "Host",
      "emotion": "shocked",
      "text": "Only 0.1% of players know this secret exists in ${game}!",
      "sfxCue": "VINE_BOOM"
    },
    {
      "id": "line_2",
      "timestampStart": 3.5,
      "timestampEnd": 8.0,
      "speaker": "Host",
      "emotion": "urgent",
      "text": "If you combine these two hidden items right here, you bypass the entire security system.",
      "sfxCue": "WHOOSH"
    }
  ],
  "callToAction": "Subscribe to unlock more secret gaming tricks every single day!"
}
`;

    const fallbackScript: ScriptData = {
      game,
      titleHook: `${game}: The Secret That Changes Everything`,
      synopsis: `A fast-paced breakdown of a mindblowing trick and hidden mechanic in ${game}.`,
      totalDurationSeconds: 32,
      lines: [
        {
          id: 'line_1',
          timestampStart: 0,
          timestampEnd: 4.0,
          speaker: 'Host',
          emotion: 'shocked',
          text: `Stop scrolling if you play ${game}! 99% of players have no idea this hidden trick is in the game.`,
          sfxCue: 'VINE_BOOM',
        },
        {
          id: 'line_2',
          timestampStart: 4.0,
          timestampEnd: 11.0,
          speaker: 'Host',
          emotion: 'urgent',
          text: `When you trigger this exact mechanic at the right angle, you completely break the physics and double your speed.`,
          sfxCue: 'WHOOSH',
        },
        {
          id: 'line_3',
          timestampStart: 11.0,
          timestampEnd: 19.0,
          speaker: 'Host',
          emotion: 'hyped',
          text: `Watch closely: place the block, activate the trigger, and look at what happens next. It works every single time!`,
          sfxCue: 'BASS_DROP',
        },
        {
          id: 'line_4',
          timestampStart: 19.0,
          timestampEnd: 26.0,
          speaker: 'Host',
          emotion: 'triumphant',
          text: `You can use this in your very next match to leave every opponent completely speechless.`,
          sfxCue: 'ANVIL_DING',
        },
        {
          id: 'line_5',
          timestampStart: 26.0,
          timestampEnd: 32.0,
          speaker: 'Host',
          emotion: 'urgent',
          text: `Tag a friend who needs to see this and subscribe for daily ${game} secrets!`,
          sfxCue: 'WHOOSH',
        },
      ],
      callToAction: `Subscribe for more daily ${game} secrets!`,
    };

    this.updateProgress(job.id, 70, 'Refining comedic/dramatic cadence with Gemini AI...');

    const scriptData = await generateJSON<ScriptData>(
      prompt,
      'You are an award-winning YouTube Gaming scriptwriter known for scripting multi-million view viral Shorts and videos. Output valid JSON only.',
      () => fallbackScript
    );

    this.updateProgress(job.id, 100, `Script finalized: ${scriptData.lines.length} lines (~${scriptData.totalDurationSeconds}s).`);
    this.log(
      job.id,
      `Script complete for [${game}]: "${scriptData.titleHook}" | ${scriptData.lines.length} spoken dialogue cues (~${scriptData.totalDurationSeconds}s)`,
      'success'
    );

    memory.setArtifact(job.id, 'script', scriptData);
    return scriptData;
  }
}

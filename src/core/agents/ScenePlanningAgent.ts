import { BaseAgent } from './BaseAgent.js';
import { AgentId, ScenePlanningData, SceneItem, WorkflowJob } from '../../types.js';
import { generateJSON } from '../gemini.js';
import { memory } from '../memory.js';

export class ScenePlanningAgent extends BaseAgent {
  public readonly id: AgentId = 'scene_planning';
  public readonly name = 'Scene & Storyboard Agent';
  public readonly role = 'Plans visual storyboards, camera motion, gameplay cues & audio-visual timing';

  public async run(job: WorkflowJob): Promise<ScenePlanningData> {
    const game = job.game || job.artifacts.script?.game || 'Gaming';
    const script = job.artifacts.script;
    const format = job.options.format || 'shorts';

    this.updateProgress(job.id, 20, `Storyboarding scenes & camera angles for [${game}]...`);
    this.log(job.id, `Generating audio-visual storyboard and scene timing breakdown for ${format.toUpperCase()}...`);

    const prompt = `
You are the Scene Planning & Storyboard Agent for a universal YouTube Gaming Studio.
Your job is to translate the script into visual scenes with exact camera movements, gameplay action descriptions, and subtitle cues.

CONTEXT:
- Game: "${game}"
- Format: ${format} (${format === 'shorts' ? '9:16 Vertical Storyboard' : '16:9 Landscape Storyboard'})
- Script Lines: ${JSON.stringify(script?.lines || [])}
- Title Hook: "${script?.titleHook || 'Epic Gameplay Moments'}"

REQUIREMENTS:
1. Create a storyboard scene corresponding to each script line or key moment (4-7 scenes).
2. Specify durationSeconds for each scene (matching script timestamps).
3. visualPrompt: Detailed prompt for generating high-energy visual artwork/render for ${game}.
4. cameraMovement: Dynamic camera direction (e.g. 'Rapid push-in zoom', 'Whip pan right', 'Cinematic drone orbit', 'Extreme close-up shake').
5. actionDescription: What is happening in the gameplay on screen.
6. subtitleText: The punchy text to render in animated captions.
7. sfxCue: Associated sound effect.
8. visualStyleTag: Aesthetics (e.g. 'Neon High Contrast', 'Dark Cinematic Suspense', 'Golden Hour Raytraced', 'Vibrant Retro Pixel').

Return strictly valid JSON:
{
  "scenes": [
    {
      "sceneNumber": 1,
      "durationSeconds": 4.0,
      "visualPrompt": "High-octane cinematic gameplay shot in ${game}, vibrant neon lighting, dynamic action perspective, 4K raytracing",
      "cameraMovement": "Crash zoom push-in",
      "actionDescription": "Player character triggering hidden mechanism with glowing particles",
      "subtitleText": "0.1% KNOW THIS SECRET!",
      "sfxCue": "VINE_BOOM",
      "visualStyleTag": "High Energy Vibrant"
    }
  ],
  "musicStyle": "Driving energetic gaming phonk / upbeat electronic synthwave",
  "colorPalette": "Electric Cyan & Neon Gold with deep shadow contrast",
  "energyCurve": "Explosive opening -> Rising curiosity -> Peak climax -> Fast loop"
}
`;

    const fallbackStoryboard: ScenePlanningData = {
      scenes: (script?.lines || []).map((line, idx) => ({
        sceneNumber: idx + 1,
        durationSeconds: Math.max(2, line.timestampEnd - line.timestampStart),
        visualPrompt: `High-octane 4k action gameplay scene in ${game}, cinematic camera angle, raytraced lighting, ultra detailed`,
        cameraMovement: idx === 0 ? 'Crash push-in zoom' : idx % 2 === 0 ? 'Dynamic tilt down' : 'Fast tracking pan',
        actionDescription: `Action sequence in ${game} illustrating "${line.text.slice(0, 40)}..."`,
        subtitleText: line.text.toUpperCase().slice(0, 30),
        sfxCue: line.sfxCue || 'WHOOSH',
        visualStyleTag: 'Neon High Contrast',
      })),
      musicStyle: 'Fast energetic electronic gaming beat with deep basslines',
      colorPalette: 'High-contrast vibrant gaming colors with dark neutral backdrop',
      energyCurve: '100% opening hook -> 80% build -> 95% climax payoff',
    };

    if (fallbackStoryboard.scenes.length === 0) {
      fallbackStoryboard.scenes = [
        {
          sceneNumber: 1,
          durationSeconds: 4,
          visualPrompt: `Cinematic title hook shot for ${game}, vibrant colors, high contrast`,
          cameraMovement: 'Crash zoom push-in',
          actionDescription: `Epic opening reveal in ${game}`,
          subtitleText: 'THE SECRET NOBODY KNOWS!',
          sfxCue: 'VINE_BOOM',
          visualStyleTag: 'Neon High Contrast',
        },
        {
          sceneNumber: 2,
          durationSeconds: 10,
          visualPrompt: `Detailed gameplay demonstration in ${game}, pro mechanics, UI overlay`,
          cameraMovement: 'Smooth tracking pan',
          actionDescription: `Executing the hidden trick step-by-step in ${game}`,
          subtitleText: 'FOLLOW THESE STEPS',
          sfxCue: 'WHOOSH',
          visualStyleTag: 'Detailed Gameplay Focus',
        },
        {
          sceneNumber: 3,
          durationSeconds: 12,
          visualPrompt: `Climax payoff in ${game}, explosive results, pro mastery`,
          cameraMovement: 'Dynamic shake zoom',
          actionDescription: `Final astonishing result in ${game}`,
          subtitleText: 'INSTANT VICTORY!',
          sfxCue: 'BASS_DROP',
          visualStyleTag: 'High Energy Climax',
        },
      ];
    }

    this.updateProgress(job.id, 70, 'Simulating camera dynamics & pacing rhythm with Gemini...');

    const scenePlanData = await generateJSON<ScenePlanningData>(
      prompt,
      'You are a premier YouTube gaming video director and cinematographer. Output valid JSON only.',
      () => fallbackStoryboard
    );

    this.updateProgress(job.id, 100, `Storyboard completed: ${scenePlanData.scenes.length} visual scenes planned.`);
    this.log(
      job.id,
      `Storyboard mapped: ${scenePlanData.scenes.length} scenes | Energy: ${scenePlanData.energyCurve} | Music: ${scenePlanData.musicStyle.slice(0, 40)}...`,
      'success'
    );

    memory.setArtifact(job.id, 'scenePlan', scenePlanData);
    return scenePlanData;
  }
}

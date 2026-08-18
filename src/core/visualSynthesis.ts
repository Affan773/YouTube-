import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logInfo, logWarn } from './config.js';

const execAsync = promisify(exec);

export interface SceneVisualOptions {
  outputPath: string;
  game: string;
  sceneNumber: number;
  totalScenes: number;
  visualPrompt: string;
  actionDescription: string;
  subtitleText: string;
  isShorts: boolean;
}

export class VisualSynthesizer {
  /**
   * Generates a rich, full-resolution, game-accurate graphic scene
   */
  public static async generateGameSceneVisual(options: SceneVisualOptions): Promise<string> {
    const { outputPath, game, sceneNumber, totalScenes, visualPrompt, actionDescription, isShorts } = options;
    const width = isShorts ? 1080 : 1920;
    const height = isShorts ? 1920 : 1080;

    const outDir = path.dirname(outputPath);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const svgPath = outputPath.replace(/\.[a-zA-Z0-9]+$/, '.svg');
    const svgContent = VisualSynthesizer.buildSceneSvg({
      width,
      height,
      game,
      sceneNumber,
      totalScenes,
      visualPrompt,
      actionDescription,
      isShorts,
    });

    fs.writeFileSync(svgPath, svgContent, 'utf-8');

    try {
      // Rasterize SVG using FFmpeg's librsvg engine to high-resolution PNG
      await execAsync(`ffmpeg -y -i "${svgPath}" -vf "scale=${width}:${height}" "${outputPath}"`);
      if (fs.existsSync(svgPath)) {
        try {
          fs.unlinkSync(svgPath);
        } catch {
          // ignore
        }
      }
      return outputPath;
    } catch (err: any) {
      logWarn('VisualSynthesizer', `SVG rasterization fallback: ${err.message}`);
      // Fallback rasterization
      await execAsync(`ffmpeg -y -f lavfi -i "color=c=0x1E293B:s=${width}x${height}:d=1" -vframes 1 "${outputPath}"`);
      return outputPath;
    }
  }

  /**
   * Constructs SVG artwork tailored to the specific game and scene topic
   */
  private static buildSceneSvg(opts: {
    width: number;
    height: number;
    game: string;
    sceneNumber: number;
    totalScenes: number;
    visualPrompt: string;
    actionDescription: string;
    isShorts: boolean;
  }): string {
    const { width, height, game, sceneNumber, visualPrompt, actionDescription, isShorts } = opts;
    const lowerGame = game.toLowerCase();

    if (lowerGame.includes('mine')) {
      return VisualSynthesizer.buildMinecraftSvg(width, height, sceneNumber, visualPrompt, actionDescription, isShorts);
    }
    if (lowerGame.includes('gta') || lowerGame.includes('auto') || lowerGame.includes('race')) {
      return VisualSynthesizer.buildGtaActionSvg(width, height, sceneNumber, visualPrompt, actionDescription, isShorts);
    }
    if (lowerGame.includes('roblox') || lowerGame.includes('obby')) {
      return VisualSynthesizer.buildRobloxSvg(width, height, sceneNumber, visualPrompt, actionDescription, isShorts);
    }
    if (lowerGame.includes('fortnite') || lowerGame.includes('royale')) {
      return VisualSynthesizer.buildFortniteSvg(width, height, sceneNumber, visualPrompt, actionDescription, isShorts);
    }
    if (lowerGame.includes('elden') || lowerGame.includes('soul') || lowerGame.includes('rpg')) {
      return VisualSynthesizer.buildEldenRingSvg(width, height, sceneNumber, visualPrompt, actionDescription, isShorts);
    }
    if (lowerGame.includes('valorant') || lowerGame.includes('strike') || lowerGame.includes('cs') || lowerGame.includes('fps')) {
      return VisualSynthesizer.buildTacticalFpsSvg(width, height, sceneNumber, visualPrompt, actionDescription, isShorts);
    }

    return VisualSynthesizer.buildUniversalGamingSvg(width, height, game, sceneNumber, visualPrompt, actionDescription, isShorts);
  }

  /**
   * Minecraft-specific procedural voxel landscape, structures, lighting & HUD
   */
  private static buildMinecraftSvg(
    width: number,
    height: number,
    sceneIndex: number,
    prompt: string,
    action: string,
    isShorts: boolean
  ): string {
    const horizonY = isShorts ? Math.floor(height * 0.52) : Math.floor(height * 0.58);
    const sunX = (sceneIndex * 210 + 350) % (width - 200) + 100;
    const sunY = isShorts ? 320 : 180;

    // Distinct themes per scene index
    const skyGradients = [
      { top: '#0F172A', mid: '#1E3A8A', bottom: '#3B82F6' }, // Daybreak Azure
      { top: '#1E1B4B', mid: '#4C1D95', bottom: '#BE185D' }, // Sunset Violet
      { top: '#020617', mid: '#0F172A', bottom: '#1E293B' }, // Midnight Cave
      { top: '#450A0A', mid: '#7F1D1D', bottom: '#DC2626' }, // Nether Crimson
      { top: '#064E3B', mid: '#047857', bottom: '#10B981' }, // Lush Jungle Emerald
    ];
    const sky = skyGradients[(sceneIndex - 1) % skyGradients.length];

    // Build specific structures based on scene context
    let structureSvg = '';
    const desc = (prompt + ' ' + action).toLowerCase();

    if (desc.includes('dirt') || desc.includes('hut') || sceneIndex === 1) {
      // Scene 1: Dirt Hut vs Modern Survival Base split or Dirt Hut Upgrade
      structureSvg = `
        <!-- Dirt Hut & Upgrade Blueprint -->
        <g id="dirt_hut" transform="translate(${width * 0.15}, ${horizonY - 260})">
          <!-- Dirt Hut (Left) -->
          <rect x="0" y="60" width="220" height="200" fill="#5A3D28" stroke="#3D2817" stroke-width="6"/>
          <rect x="20" y="80" width="180" height="40" fill="#2E6930"/>
          <rect x="70" y="150" width="80" height="110" fill="#2B1A0E"/>
          <circle cx="130" cy="205" r="8" fill="#FACC15"/>
          <!-- Torch on Wall -->
          <rect x="195" y="120" width="12" height="40" fill="#78350F"/>
          <rect x="191" y="105" width="20" height="20" fill="#F59E0B" filter="drop-shadow(0 0 12px #FBBF24)"/>
          <text x="110" y="40" text-anchor="middle" fill="#EF4444" font-family="sans-serif" font-size="28" font-weight="900">❌ NOOB HUT</text>
        </g>
        <!-- Modern Survival Stronghold (Right) -->
        <g id="modern_base" transform="translate(${width * 0.52}, ${horizonY - 380})">
          <rect x="0" y="80" width="380" height="300" fill="#475569" stroke="#1E293B" stroke-width="8"/>
          <!-- Oak Wood Accents -->
          <rect x="20" y="100" width="340" height="30" fill="#78350F"/>
          <rect x="20" y="220" width="340" height="20" fill="#78350F"/>
          <!-- Glass Windows with Glow -->
          <rect x="40" y="145" width="120" height="60" fill="#38BDF8" opacity="0.85" stroke="#E2E8F0" stroke-width="4"/>
          <rect x="220" y="145" width="120" height="60" fill="#38BDF8" opacity="0.85" stroke="#E2E8F0" stroke-width="4"/>
          <!-- Double Oak Door -->
          <rect x="140" y="240" width="100" height="140" fill="#451A03"/>
          <circle cx="160" cy="300" r="8" fill="#FACC15"/>
          <circle cx="220" cy="300" r="8" fill="#FACC15"/>
          <!-- Lanterns -->
          <rect x="30" y="60" width="24" height="30" fill="#F59E0B" filter="drop-shadow(0 0 16px #F59E0B)"/>
          <rect x="325" y="60" width="24" height="30" fill="#F59E0B" filter="drop-shadow(0 0 16px #F59E0B)"/>
          <!-- Roof Battlement -->
          <rect x="-20" y="40" width="420" height="40" fill="#334155" stroke="#0F172A" stroke-width="6"/>
          <text x="190" y="15" text-anchor="middle" fill="#22C55E" font-family="sans-serif" font-size="28" font-weight="900">PRO SECRET BASE</text>
        </g>
      `;
    } else if (desc.includes('entrance') || desc.includes('trapdoor') || sceneIndex === 2) {
      // Scene 2: Hidden Trapdoor Entrance & Mountain Secret Base
      structureSvg = `
        <!-- Hidden Underground Entrance -->
        <g transform="translate(${width * 0.2}, ${horizonY - 320})">
          <!-- Mountain Cliff Layer -->
          <polygon points="0,320 180,60 480,120 680,320" fill="#334155" stroke="#1E293B" stroke-width="6"/>
          <!-- Secret Piston Door Opening -->
          <rect x="240" y="150" width="180" height="170" fill="#020617"/>
          <rect x="250" y="160" width="160" height="150" fill="#0B132B"/>
          <!-- Interior Glow -->
          <circle cx="330" cy="220" r="80" fill="#38BDF8" opacity="0.35"/>
          <!-- Redstone Dust Trail -->
          <circle cx="180" cy="310" r="10" fill="#EF4444" filter="drop-shadow(0 0 8px #EF4444)"/>
          <circle cx="210" cy="290" r="10" fill="#EF4444" filter="drop-shadow(0 0 8px #EF4444)"/>
          <circle cx="240" cy="270" r="10" fill="#EF4444" filter="drop-shadow(0 0 8px #EF4444)"/>
          <!-- Secret Lever -->
          <rect x="150" y="270" width="20" height="30" fill="#78350F"/>
          <line x1="160" y1="270" x2="140" y2="240" stroke="#94A3B8" stroke-width="6"/>
          <!-- Badge -->
          <rect x="190" y="10" width="280" height="48" rx="12" fill="#0F172A" stroke="#38BDF8" stroke-width="3"/>
          <text x="330" y="42" text-anchor="middle" fill="#38BDF8" font-family="sans-serif" font-size="24" font-weight="900">HIDDEN PISTON GATE</text>
        </g>
      `;
    } else if (desc.includes('storage') || desc.includes('chest') || sceneIndex === 3) {
      // Scene 3: Compact Auto Storage Vault & Diamond Chests
      structureSvg = `
        <!-- Underground Vault & Auto Storage -->
        <g transform="translate(${width * 0.15}, ${horizonY - 340})">
          <rect x="0" y="40" width="760" height="300" fill="#1E293B" stroke="#0F172A" stroke-width="8"/>
          <!-- Chest Rows (6 Voxel Chests) -->
          <g transform="translate(60, 80)">
            <rect x="0" y="0" width="160" height="90" fill="#78350F" stroke="#451A03" stroke-width="4"/>
            <rect x="70" y="30" width="20" height="25" fill="#FACC15"/>
            <rect x="220" y="0" width="160" height="90" fill="#78350F" stroke="#451A03" stroke-width="4"/>
            <rect x="290" y="30" width="20" height="25" fill="#FACC15"/>
            <rect x="440" y="0" width="160" height="90" fill="#0284C7" stroke="#0369A1" stroke-width="4"/>
            <rect x="510" y="30" width="20" height="25" fill="#38BDF8"/>
            <text x="520" y="-15" text-anchor="middle" fill="#38BDF8" font-size="20" font-weight="bold">DIAMOND CHEST</text>
          </g>
          <g transform="translate(60, 200)">
            <rect x="0" y="0" width="160" height="90" fill="#78350F" stroke="#451A03" stroke-width="4"/>
            <rect x="70" y="30" width="20" height="25" fill="#FACC15"/>
            <rect x="220" y="0" width="160" height="90" fill="#78350F" stroke="#451A03" stroke-width="4"/>
            <rect x="290" y="30" width="20" height="25" fill="#FACC15"/>
            <rect x="440" y="0" width="160" height="90" fill="#047857" stroke="#064E3B" stroke-width="4"/>
            <rect x="510" y="30" width="20" height="25" fill="#34D399"/>
            <text x="520" y="-15" text-anchor="middle" fill="#34D399" font-size="20" font-weight="bold">EMERALD VAULT</text>
          </g>
          <!-- Item Sorter Hopper Tube -->
          <rect x="40" y="50" width="680" height="15" fill="#475569"/>
          <!-- Glowing Item Frame -->
          <circle cx="680" cy="180" r="40" fill="#F59E0B" opacity="0.3"/>
          <text x="380" y="15" text-anchor="middle" fill="#FACC15" font-family="sans-serif" font-size="26" font-weight="900">AUTO-SORTING MATRIX</text>
        </g>
      `;
    } else if (desc.includes('defense') || desc.includes('wall') || desc.includes('mob') || sceneIndex === 4) {
      // Scene 4: Auto Mob Defense Wall & Lava Moat
      structureSvg = `
        <!-- Auto Defense Perimeter Wall & Lava Trap -->
        <g transform="translate(${width * 0.12}, ${horizonY - 350})">
          <!-- Fortified Stone Wall -->
          <rect x="0" y="50" width="820" height="240" fill="#334155" stroke="#1E293B" stroke-width="8"/>
          <!-- Spikes & Dispensers -->
          <rect x="100" y="110" width="80" height="80" fill="#475569" stroke="#0F172A" stroke-width="4"/>
          <circle cx="140" cy="150" r="18" fill="#020617"/>
          <rect x="370" y="110" width="80" height="80" fill="#475569" stroke="#0F172A" stroke-width="4"/>
          <circle cx="410" cy="150" r="18" fill="#020617"/>
          <rect x="640" y="110" width="80" height="80" fill="#475569" stroke="#0F172A" stroke-width="4"/>
          <circle cx="680" cy="150" r="18" fill="#020617"/>
          <!-- Lava Moat Trench -->
          <rect x="-40" y="280" width="900" height="70" fill="#EA580C" filter="drop-shadow(0 0 24px #F97316)"/>
          <rect x="-40" y="295" width="900" height="35" fill="#FACC15"/>
          <!-- Shield Wall Badge -->
          <rect x="240" y="0" width="340" height="45" rx="10" fill="#DC2626"/>
          <text x="410" y="32" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="24" font-weight="900">MOB DEFENSE PERIMETER</text>
        </g>
      `;
    } else {
      // Scene 5: Ultimate Underground Bunker / Fortress Safehouse
      structureSvg = `
        <!-- Ultimate Underground Safehouse Fortress -->
        <g transform="translate(${width * 0.1}, ${horizonY - 400})">
          <rect x="0" y="60" width="880" height="350" fill="#0F172A" stroke="#0284C7" stroke-width="6"/>
          <!-- Multi-Floor Layout -->
          <!-- Floor 1: Enchanting Room -->
          <rect x="40" y="90" width="380" height="140" fill="#1E293B"/>
          <rect x="180" y="140" width="80" height="50" fill="#9333EA"/>
          <polygon points="190,140 220,110 250,140" fill="#C084FC"/>
          <!-- Bookshelves -->
          <rect x="60" y="100" width="100" height="120" fill="#78350F"/>
          <text x="220" y="80" text-anchor="middle" fill="#C084FC" font-size="20" font-weight="bold">ENCHANTING SUITE</text>
          <!-- Floor 2: Nether Portal Chamber -->
          <rect x="460" y="90" width="380" height="140" fill="#1E293B"/>
          <rect x="580" y="100" width="120" height="120" fill="#18181B" stroke="#581C87" stroke-width="8"/>
          <rect x="600" y="110" width="80" height="100" fill="#A855F7" opacity="0.85" filter="drop-shadow(0 0 16px #A855F7)"/>
          <text x="650" y="80" text-anchor="middle" fill="#A855F7" font-size="20" font-weight="bold">NETHER PORTAL</text>
          <!-- Bottom Floor: Armor Stands & Trophy Room -->
          <rect x="40" y="250" width="800" height="130" fill="#1E293B"/>
          <!-- Diamond Armor Sets -->
          <circle cx="200" cy="285" r="16" fill="#38BDF8"/>
          <rect x="188" y="305" width="24" height="45" fill="#0284C7"/>
          <circle cx="440" cy="285" r="16" fill="#FACC15"/>
          <rect x="428" y="305" width="24" height="45" fill="#EAB308"/>
          <circle cx="680" cy="285" r="16" fill="#34D399"/>
          <rect x="668" y="305" width="24" height="45" fill="#059669"/>
          <!-- Title Banner -->
          <rect x="220" y="10" width="440" height="48" rx="12" fill="#0284C7"/>
          <text x="440" y="44" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="26" font-weight="900">ULTIMATE SAFE HOUSE</text>
        </g>
      `;
    }

    // Minecraft Voxel Terrain Ground Layers
    const terrainSvg = `
      <!-- Grass Top Layer with Voxel Stepping -->
      <path d="M0,${horizonY} L${width * 0.3},${horizonY - 15} L${width * 0.6},${horizonY + 10} L${width},${horizonY - 5} L${width},${height} L0,${height} Z" fill="#2E7D32"/>
      <path d="M0,${horizonY + 25} L${width},${horizonY + 25} L${width},${horizonY + 140} L0,${horizonY + 140} Z" fill="#5D4037"/>
      <!-- Stone & Ore Strata Layers -->
      <path d="M0,${horizonY + 140} L${width},${horizonY + 140} L${width},${height} L0,${height} Z" fill="#424242"/>
      <!-- Diamond Ore Veins -->
      <rect x="${width * 0.2}" y="${horizonY + 220}" width="40" height="40" fill="#38BDF8" stroke="#0284C7" stroke-width="4"/>
      <rect x="${width * 0.25}" y="${horizonY + 240}" width="35" height="35" fill="#38BDF8"/>
      <rect x="${width * 0.7}" y="${horizonY + 190}" width="40" height="40" fill="#FACC15" stroke="#CA8A04" stroke-width="4"/>
      <rect x="${width * 0.76}" y="${horizonY + 210}" width="35" height="35" fill="#FACC15"/>
    `;

    // Minecraft HUD (Hearts, Armor, Hunger & Hotbar)
    const hudSvg = `
      <!-- In-Game Minecraft Hotbar & Status HUD -->
      <g transform="translate(${(width - 540) / 2}, ${isShorts ? height - 320 : height - 160})">
        <!-- Background Hotbar Slot Frame -->
        <rect x="0" y="40" width="540" height="60" rx="6" fill="#18181B" stroke="#52525B" stroke-width="4" opacity="0.95"/>
        ${[0, 1, 2, 3, 4, 5, 6, 7, 8]
          .map((slot) => {
            const x = slot * 60;
            const isSelected = slot === 0;
            return `
              <rect x="${x}" y="40" width="60" height="60" fill="${isSelected ? '#3F3F46' : 'transparent'}" stroke="${isSelected ? '#FFFFFF' : '#3F3F46'}" stroke-width="${isSelected ? '4' : '2'}"/>
            `;
          })
          .join('')}
        <!-- Hotbar Items Icons -->
        <rect x="18" y="55" width="24" height="30" fill="#38BDF8"/> <!-- Diamond Sword -->
        <rect x="78" y="55" width="24" height="30" fill="#78350F"/> <!-- Pickaxe -->
        <rect x="138" y="58" width="24" height="24" fill="#FACC15"/> <!-- Golden Apple -->
        <rect x="198" y="55" width="24" height="30" fill="#EA580C"/> <!-- Lava Bucket -->
        <rect x="258" y="55" width="24" height="30" fill="#A855F7"/> <!-- Ender Pearl -->
        <rect x="318" y="55" width="24" height="30" fill="#22C55E"/> <!-- Oak Logs -->
        <rect x="378" y="55" width="24" height="30" fill="#DC2626"/> <!-- Redstone -->
        <rect x="438" y="55" width="24" height="30" fill="#9333EA"/> <!-- Obsidian -->
        <rect x="498" y="55" width="24" height="30" fill="#F59E0B"/> <!-- Torches -->

        <!-- Health Hearts & Food Drumsticks HUD -->
        <g transform="translate(10, 10)">
          ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
            .map((h) => `<polygon points="${h * 24 + 10},0 ${h * 24 + 20},0 ${h * 24 + 24},10 ${h * 24 + 10},22 ${h * 24 - 4},10" fill="#EF4444"/>`)
            .join('')}
        </g>
        <g transform="translate(300, 10)">
          ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
            .map((d) => `<circle cx="${d * 24 + 10}" cy="10" r="8" fill="#B45309"/>`)
            .join('')}
        </g>
      </g>
    `;

    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${sky.top}"/>
            <stop offset="50%" stop-color="${sky.mid}"/>
            <stop offset="100%" stop-color="${sky.bottom}"/>
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- Sky Background -->
        <rect width="${width}" height="${height}" fill="url(#skyGrad)"/>

        <!-- Minecraft Pixel Sun/Moon -->
        <rect x="${sunX}" y="${sunY}" width="140" height="140" fill="#FEF08A" filter="drop-shadow(0 0 35px #FACC15)"/>
        <rect x="${sunX + 20}" y="${sunY + 20}" width="100" height="100" fill="#FFFFFF"/>

        <!-- Pixel Clouds -->
        <g fill="#FFFFFF" opacity="0.85">
          <rect x="80" y="${sunY + 90}" width="280" height="60" rx="8"/>
          <rect x="140" y="${sunY + 60}" width="160" height="40" rx="6"/>
          <rect x="${width - 450}" y="${sunY + 120}" width="360" height="70" rx="8"/>
        </g>

        <!-- Distant Mountain Ranges (Voxel Peaks) -->
        <polygon points="0,${horizonY} 160,${horizonY - 140} 380,${horizonY} 580,${horizonY - 180} 820,${horizonY} ${width},${horizonY - 100} ${width},${horizonY}" fill="#1E293B" opacity="0.6"/>

        <!-- Procedural Structure Layer -->
        ${structureSvg}

        <!-- Foreground Terrain -->
        ${terrainSvg}

        <!-- In-game HUD -->
        ${hudSvg}

        <!-- Game Watermark / Secret Indicator Pill -->
        <g transform="translate(${isShorts ? 40 : 60}, ${isShorts ? 60 : 40})">
          <rect x="0" y="0" width="260" height="54" rx="27" fill="#0F172A" opacity="0.9" stroke="#22C55E" stroke-width="3"/>
          <circle cx="28" cy="27" r="12" fill="#22C55E"/>
          <text x="54" y="35" fill="#FFFFFF" font-family="sans-serif" font-size="20" font-weight="900">MINECRAFT PRO</text>
          <text x="215" y="35" fill="#FACC15" font-family="sans-serif" font-size="18" font-weight="bold">#${sceneIndex}</text>
        </g>
      </svg>
    `;
  }

  /**
   * GTA / Action scene visual generator
   */
  private static buildGtaActionSvg(
    width: number,
    height: number,
    sceneIndex: number,
    prompt: string,
    action: string,
    isShorts: boolean
  ): string {
    const horizonY = Math.floor(height * 0.65);
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <linearGradient id="gtaSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#09090B"/>
            <stop offset="60%" stop-color="#7C2D12"/>
            <stop offset="100%" stop-color="#EA580C"/>
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#gtaSky)"/>
        <!-- Skyscraper Silhouettes -->
        <rect x="50" y="${horizonY - 420}" width="160" height="420" fill="#18181B"/>
        <rect x="250" y="${horizonY - 560}" width="220" height="560" fill="#09090B"/>
        <rect x="520" y="${horizonY - 380}" width="180" height="380" fill="#18181B"/>
        <rect x="740" y="${horizonY - 480}" width="240" height="480" fill="#09090B"/>
        <!-- City Highway Road with Speed Streaks -->
        <rect x="0" y="${horizonY}" width="${width}" height="${height - horizonY}" fill="#18181B"/>
        <line x1="0" y1="${horizonY + 80}" x2="${width}" y2="${horizonY + 80}" stroke="#EAB308" stroke-dasharray="40 30" stroke-width="8"/>
        <!-- Supercar Silhouette -->
        <g transform="translate(${(width - 500) / 2}, ${horizonY - 60})">
          <polygon points="40,90 120,30 360,30 460,90 480,120 20,120" fill="#DC2626"/>
          <circle cx="110" cy="120" r="35" fill="#09090B" stroke="#71717A" stroke-width="8"/>
          <circle cx="390" cy="120" r="35" fill="#09090B" stroke="#71717A" stroke-width="8"/>
          <polygon points="460,90 490,95 460,105" fill="#FACC15" filter="drop-shadow(0 0 20px #FACC15)"/>
        </g>
        <!-- GTA Wanted Stars HUD -->
        <g transform="translate(${width - 280}, ${isShorts ? 60 : 40})">
          <rect x="0" y="0" width="240" height="50" rx="10" fill="#000000" opacity="0.85" stroke="#EF4444" stroke-width="2"/>
          <text x="20" y="34" fill="#EF4444" font-size="28">★★★★★</text>
        </g>
      </svg>
    `;
  }

  /**
   * Roblox dynamic obby visual generator
   */
  private static buildRobloxSvg(
    width: number,
    height: number,
    sceneIndex: number,
    prompt: string,
    action: string,
    isShorts: boolean
  ): string {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <linearGradient id="robloxSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0284C7"/>
            <stop offset="100%" stop-color="#38BDF8"/>
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#robloxSky)"/>
        <!-- Floating Obby Platforms -->
        <g transform="translate(100, 300)">
          <rect x="0" y="100" width="220" height="60" rx="12" fill="#F43F5E" stroke="#881337" stroke-width="6"/>
          <rect x="280" y="240" width="240" height="60" rx="12" fill="#10B981" stroke="#064E3B" stroke-width="6"/>
          <rect x="580" y="380" width="260" height="60" rx="12" fill="#FBBF24" stroke="#78350F" stroke-width="6"/>
        </g>
        <rect x="0" y="${height - 200}" width="${width}" height="200" fill="#EF4444" opacity="0.9"/>
        <text x="${width / 2}" y="${height - 100}" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="36" font-weight="900">LAVA ZONE - DON'T TOUCH!</text>
      </svg>
    `;
  }

  /**
   * Fortnite / Battle Royale visual generator
   */
  private static buildFortniteSvg(
    width: number,
    height: number,
    sceneIndex: number,
    prompt: string,
    action: string,
    isShorts: boolean
  ): string {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <linearGradient id="fnSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#4C1D95"/>
            <stop offset="100%" stop-color="#8B5CF6"/>
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#fnSky)"/>
        <!-- Supply Drop -->
        <g transform="translate(${(width - 240) / 2}, 300)">
          <polygon points="120,0 20,80 220,80" fill="#38BDF8" opacity="0.85"/>
          <rect x="70" y="100" width="100" height="100" fill="#1E293B" stroke="#FACC15" stroke-width="6"/>
          <text x="120" y="160" text-anchor="middle" fill="#FACC15" font-size="28" font-weight="bold">★</text>
        </g>
        <rect x="0" y="${height - 400}" width="${width}" height="400" fill="#15803D"/>
      </svg>
    `;
  }

  /**
   * Elden Ring / Dark RPG visual generator
   */
  private static buildEldenRingSvg(
    width: number,
    height: number,
    sceneIndex: number,
    prompt: string,
    action: string,
    isShorts: boolean
  ): string {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <linearGradient id="erSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0C0A09"/>
            <stop offset="100%" stop-color="#1C1917"/>
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#erSky)"/>
        <!-- Golden Erdtree Rays -->
        <line x1="${width / 2}" y1="0" x2="100" y2="${height}" stroke="#FDE68A" stroke-width="3" opacity="0.25"/>
        <line x1="${width / 2}" y1="0" x2="${width - 100}" y2="${height}" stroke="#FDE68A" stroke-width="3" opacity="0.25"/>
        <!-- Bonfire Grace -->
        <g transform="translate(${width / 2}, ${height * 0.7})">
          <circle cx="0" cy="0" r="50" fill="#F59E0B" opacity="0.4" filter="drop-shadow(0 0 30px #F59E0B)"/>
          <polygon points="-20,20 0,-40 20,20" fill="#FDE68A"/>
        </g>
      </svg>
    `;
  }

  /**
   * Tactical FPS / Valorant / CS visual generator
   */
  private static buildTacticalFpsSvg(
    width: number,
    height: number,
    sceneIndex: number,
    prompt: string,
    action: string,
    isShorts: boolean
  ): string {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <linearGradient id="fpsSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0F172A"/>
            <stop offset="100%" stop-color="#1E293B"/>
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#fpsSky)"/>
        <!-- Tactical Grid Floor -->
        <line x1="0" y1="${height * 0.6}" x2="${width}" y2="${height * 0.6}" stroke="#06B6D4" stroke-width="4"/>
        <!-- Bomb Site Blueprint Marker -->
        <circle cx="${width / 2}" cy="${height / 2}" r="140" fill="none" stroke="#F43F5E" stroke-width="6" stroke-dasharray="20 10"/>
        <text x="${width / 2}" y="${height / 2 + 15}" text-anchor="middle" fill="#F43F5E" font-family="sans-serif" font-size="48" font-weight="900">PLANT SITE A</text>
      </svg>
    `;
  }

  /**
   * Universal gaming visual generator
   */
  private static buildUniversalGamingSvg(
    width: number,
    height: number,
    game: string,
    sceneIndex: number,
    prompt: string,
    action: string,
    isShorts: boolean
  ): string {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <linearGradient id="uniSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0B0F19"/>
            <stop offset="60%" stop-color="#1E1B4B"/>
            <stop offset="100%" stop-color="#312E81"/>
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#uniSky)"/>
        <!-- Hologram Grid Stage -->
        <g stroke="#6366F1" stroke-width="2" opacity="0.4">
          <line x1="0" y1="${height * 0.65}" x2="${width}" y2="${height * 0.65}"/>
          <line x1="0" y1="${height * 0.75}" x2="${width}" y2="${height * 0.75}"/>
          <line x1="0" y1="${height * 0.85}" x2="${width}" y2="${height * 0.85}"/>
        </g>
        <circle cx="${width / 2}" cy="${height * 0.45}" r="180" fill="#4F46E5" opacity="0.3" filter="drop-shadow(0 0 40px #818CF8)"/>
        <text x="${width / 2}" y="${height * 0.46}" text-anchor="middle" fill="#38BDF8" font-family="sans-serif" font-size="44" font-weight="900">${game.toUpperCase()}</text>
      </svg>
    `;
  }
}

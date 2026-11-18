import * as THREE from 'three';
import opentype from 'opentype.js';
import fs from 'node:fs';
import path from 'node:path';

const fontsDir = 'public/fonts';
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

const languages = [
  {
    id: 'en',
    name: 'English',
    text: 'PRINSON',
    fontFamily: 'Cinzel:wght@700',
    targetWidth: 14.0,
    targetHeight: 2.5,
  },
  {
    id: 'ja',
    name: 'Japanese',
    text: 'プリンソン',
    fontFamily: 'Noto+Serif+JP:wght@700',
    targetWidth: 13.0,
    targetHeight: 2.6,
  },
  {
    id: 'zh',
    name: 'Chinese',
    text: '普林森',
    fontFamily: 'Noto+Serif+SC:wght@700',
    targetWidth: 10.0,
    targetHeight: 2.9,
  },
  {
    id: 'fr',
    name: 'French',
    text: 'PRINSON',
    fontFamily: 'Cinzel:wght@700',
    targetWidth: 14.0,
    targetHeight: 2.5,
  },
  {
    id: 'ru',
    name: 'Russian',
    text: 'ПРИНСОН',
    fontFamily: 'Noto+Serif:wght@700',
    targetWidth: 14.2,
    targetHeight: 2.5,
  },
  {
    id: 'ko',
    name: 'Korean',
    text: '프린슨',
    fontFamily: 'Noto+Serif+KR:wght@700',
    targetWidth: 10.2,
    targetHeight: 2.9,
  },
];

async function fetchFont(family, text) {
  const encodedText = encodeURIComponent(text);
  const cssUrl = `https://fonts.googleapis.com/css2?family=${family}&text=${encodedText}`;
  const css = await (await fetch(cssUrl)).text();
  const match = css.match(/url\((https:\/\/[^)]+)\)/);
  if (!match) throw new Error(`Could not find font URL for ${family} (${text})`);
  const fontBuffer = await (await fetch(match[1])).arrayBuffer();
  return { buffer: fontBuffer, font: opentype.parse(fontBuffer) };
}

function opentypeToShapePath(commands) {
  const shapePath = new THREE.ShapePath();
  for (const cmd of commands) {
    if (cmd.type === 'M') {
      shapePath.moveTo(cmd.x, -cmd.y);
    } else if (cmd.type === 'L') {
      shapePath.lineTo(cmd.x, -cmd.y);
    } else if (cmd.type === 'C') {
      shapePath.bezierCurveTo(cmd.x1, -cmd.y1, cmd.x2, -cmd.y2, cmd.x, -cmd.y);
    } else if (cmd.type === 'Q') {
      shapePath.quadraticCurveTo(cmd.x1, -cmd.y1, cmd.x, -cmd.y);
    } else if (cmd.type === 'Z') {
      shapePath.closePath();
    }
  }
  return shapePath;
}

async function main() {
  console.log('Generating PRINSON multilingual glyph data for 6 languages...\n');

  const glyphDataMap = {};

  for (const lang of languages) {
    console.log(`Processing ${lang.name}: "${lang.text}" (${lang.fontFamily})...`);
    const { buffer, font } = await fetchFont(lang.fontFamily, lang.text);

    // Save font to public/fonts
    const fontFileName = `${lang.id}-${lang.fontFamily.split(':')[0].replace(/\+/g, '-')}.ttf`;
    fs.writeFileSync(path.join(fontsDir, fontFileName), Buffer.from(buffer));

    // Generate path commands at base scale
    const baseFontSize = 72;
    const fontPath = font.getPath(lang.text, 0, 0, baseFontSize);
    const bbox = fontPath.getBoundingBox();

    // Store simplified command list
    const commands = fontPath.commands.map((c) => {
      const obj = { type: c.type };
      if (c.x !== undefined) obj.x = Math.round(c.x * 100) / 100;
      if (c.y !== undefined) obj.y = Math.round(c.y * 100) / 100;
      if (c.x1 !== undefined) obj.x1 = Math.round(c.x1 * 100) / 100;
      if (c.y1 !== undefined) obj.y1 = Math.round(c.y1 * 100) / 100;
      if (c.x2 !== undefined) obj.x2 = Math.round(c.x2 * 100) / 100;
      if (c.y2 !== undefined) obj.y2 = Math.round(c.y2 * 100) / 100;
      return obj;
    });

    glyphDataMap[lang.id] = {
      id: lang.id,
      name: lang.name,
      text: lang.text,
      targetWidth: lang.targetWidth,
      targetHeight: lang.targetHeight,
      bbox: {
        x1: bbox.x1,
        y1: bbox.y1,
        x2: bbox.x2,
        y2: bbox.y2,
        width: bbox.x2 - bbox.x1,
        height: bbox.y2 - bbox.y1,
      },
      commands,
    };

    // Verify Three.js ExtrudeGeometry creation
    const shapePath = opentypeToShapePath(fontPath.commands);
    const shapes = shapePath.toShapes(true);
    const geom = new THREE.ExtrudeGeometry(shapes, {
      depth: 0.3,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.03,
      bevelSegments: 3,
    });
    geom.center();
    geom.computeBoundingBox();

    console.log(`✓ ${lang.name} validated: ${shapes.length} shapes, ${geom.attributes.position.count} vertices.`);
    console.log(`  Dimensions: W=${(geom.boundingBox.max.x - geom.boundingBox.min.x).toFixed(2)}, H=${(geom.boundingBox.max.y - geom.boundingBox.min.y).toFixed(2)}\n`);
  }

  // Write TypeScript data module
  const tsContent = `// Auto-generated multilingual glyph vector paths for PRINSON 3D Title
// Supported Languages: English, Japanese, Chinese, French, Russian, Korean (Zero Arabic)

export interface GlyphCommand {
  type: 'M' | 'L' | 'C' | 'Q' | 'Z';
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
}

export interface LanguageGlyphEntry {
  id: string;
  name: string;
  text: string;
  targetWidth: number;
  targetHeight: number;
  bbox: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    width: number;
    height: number;
  };
  commands: GlyphCommand[];
}

export const PRINSON_LANGUAGES: LanguageGlyphEntry[] = ${JSON.stringify(
    languages.map((l) => glyphDataMap[l.id]),
    null,
    2
  )};
`;

  const outDir = 'src/components/Scene/Title';
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(path.join(outDir, 'prinsonGlyphData.ts'), tsContent, 'utf-8');
  console.log('Saved vector glyph definitions to src/components/Scene/Title/prinsonGlyphData.ts!');
}

main().catch(console.error);


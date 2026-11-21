import { NodeIO } from '@gltf-transform/core';
import { draco, prune, dedup, resample, weld } from '@gltf-transform/functions';
import { KHRDracoMeshCompression } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import path from 'node:path';
import fs from 'node:fs';

async function main() {
  console.log('=== Optimizing & Injecting Character Animations ===');

  const encoderModule = await draco3d.createEncoderModule();
  const decoderModule = await draco3d.createDecoderModule();
  const io = new NodeIO()
    .registerExtensions([KHRDracoMeshCompression])
    .registerDependencies({
      'draco3d.encoder': encoderModule,
      'draco3d.decoder': decoderModule,
    });

  const homeDoc = await io.read('public/models/home-island.glb');
  const homeAnims = new Map(homeDoc.getRoot().listAnimations().map(a => [a.getName(), a]));

  const characters = [
    {
      file: 'frieren.glb',
      injections: [
        { from: 'Frieren_Read', to: 'frieren_read' },
        { from: 'Frieren_Cast', to: 'frieren_cast' },
        { from: 'Frieren_Flowers', to: 'frieren_flowers' },
        { from: 'Frieren_Walk', to: 'frieren_walk' },
        { from: 'Frieren_Listen', to: 'frieren_listen' },
        { from: 'Frieren_Speak', to: 'frieren_speak' },
        { from: 'Frieren_Watch', to: 'frieren_watch' },
      ],
      handSockets: { right: 'FrierenHandR', left: 'FrierenHandL' },
    },
    {
      file: 'himmel.glb',
      injections: [
        { from: 'Himmel_Sword', to: 'himmel_sword' },
        { from: 'Himmel_SwordForm', to: 'himmel_sword_form' },
        { from: 'Himmel_Talk', to: 'himmel_talk' },
        { from: 'Himmel_Walk', to: 'himmel_walk' },
        { from: 'Himmel_Listen', to: 'himmel_listen' },
        { from: 'Himmel_Speak', to: 'himmel_speak' },
        { from: 'Himmel_Watch', to: 'himmel_watch' },
      ],
      handSockets: { right: 'HimmelHandR', left: 'HimmelHandL' },
    },
    {
      file: 'heiter.glb',
      injections: [
        { from: 'Heiter_Drink', to: 'heiter_drink' },
        { from: 'Heiter_Talk', to: 'heiter_talk' },
        { from: 'Heiter_Walk', to: 'heiter_walk' },
        { from: 'Heiter_Listen', to: 'heiter_listen' },
        { from: 'Heiter_Speak', to: 'heiter_speak' },
        { from: 'Heiter_Watch', to: 'heiter_watch' },
      ],
      handSockets: null,
    },
    {
      file: 'eisen.glb',
      injections: [
        { from: 'Eisen_Chop', to: 'eisen_chop' },
        { from: 'Eisen_Axe', to: 'eisen_axe' },
        { from: 'Eisen_Lift', to: 'eisen_craft' },
      ],
      handSockets: null,
    },
  ];

  for (const char of characters) {
    const charPath = path.join('public/models/transition', char.file);
    const doc = await io.read(charPath);
    const targetNodes = new Map(doc.getRoot().listNodes().map(n => [n.getName(), n]));

    // 1. Standardize existing animations to snake_case
    for (const anim of doc.getRoot().listAnimations()) {
      const origName = anim.getName();
      const snake = origName
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .toLowerCase();
      anim.setName(snake);
    }

    // 2. Inject target animations from home-island
    for (const inj of char.injections) {
      const srcAnim = homeAnims.get(inj.from);
      if (!srcAnim) {
        console.warn(`[WARN] Animation '${inj.from}' not found in home-island.glb`);
        continue;
      }

      // Check if target already has this animation
      const existing = doc.getRoot().listAnimations().find(a => a.getName() === inj.to);
      if (existing) {
        continue;
      }

      const destAnim = doc.createAnimation(inj.to);
      for (const ch of srcAnim.listChannels()) {
        const nodeName = ch.getTargetNode()?.getName();
        const destNode = targetNodes.get(nodeName);
        if (!destNode) continue;

        const srcSampler = ch.getSampler();
        const srcInput = srcSampler.getInput();
        const srcOutput = srcSampler.getOutput();

        const destInput = doc.createAccessor()
          .setArray(srcInput.getArray().slice())
          .setType(srcInput.getType());

        const destOutput = doc.createAccessor()
          .setArray(srcOutput.getArray().slice())
          .setType(srcOutput.getType());

        const destSampler = doc.createAnimationSampler()
          .setInterpolation(srcSampler.getInterpolation())
          .setInput(destInput)
          .setOutput(destOutput);

        const destChannel = doc.createAnimationChannel()
          .setTargetPath(ch.getTargetPath())
          .setTargetNode(destNode)
          .setSampler(destSampler);

        destAnim.addSampler(destSampler);
        destAnim.addChannel(destChannel);
      }
    }

    // 3. Add hand socket locators
    if (char.handSockets) {
      const rightHand = targetNodes.get(char.handSockets.right);
      if (rightHand && !rightHand.listChildren().some(c => c.getName() === 'Socket_Hand_R')) {
        const socketR = doc.createNode('Socket_Hand_R');
        rightHand.addChild(socketR);
      }

      const leftHand = targetNodes.get(char.handSockets.left);
      if (leftHand && !leftHand.listChildren().some(c => c.getName() === 'Socket_Hand_L')) {
        const socketL = doc.createNode('Socket_Hand_L');
        leftHand.addChild(socketL);
      }
    }

    // 4. Apply deduplication, welding, resampling, pruning, and Draco mesh compression
    await doc.transform(
      weld({ tolerance: 0.0001 }),
      resample({ tolerance: 0.001 }),
      dedup(),
      prune(),
      draco({
        quantizePositionBits: 14,
        quantizeNormalBits: 10,
        quantizeTexcoordBits: 12,
        quantizeGenericBits: 10,
      })
    );

    const binary = await io.writeBinary(doc);
    fs.writeFileSync(charPath, binary);
    const sizeKB = (binary.length / 1024).toFixed(1);
    const animCount = doc.getRoot().listAnimations().length;
    console.log(`[Optimized] ${char.file.padEnd(14)} -> ${sizeKB.padStart(6)} KB (${animCount} anims)`);
    if (binary.length > 600 * 1024) {
      console.warn(`[ALERT] ${char.file} exceeds 600 KB: ${sizeKB} KB`);
    }
  }

  console.log('=== Character Optimization Completed Successfully ===\n');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

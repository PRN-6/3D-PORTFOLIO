import * as THREE from 'three';

// Rows in each character's embedded texture atlas. The UVs in the GLB point
// at the neutral row, including when the file is opened in a regular viewer.
const faceRows = { neutral: 0, blink: 1, speaking: 2, smile: 3 } as const;
type Expression = keyof typeof faceRows;

export function createPartyPalette() {
  const bands = new THREE.DataTexture(
    new Uint8Array([104, 104, 145, 145, 191, 191, 237, 237]),
    8, 1, THREE.RedFormat,
  );
  bands.minFilter = bands.magFilter = THREE.NearestFilter;
  bands.needsUpdate = true;

  const ink = new THREE.MeshBasicMaterial({
    color: '#50424b',
    side: THREE.BackSide,
    depthWrite: false,
  });
  ink.name = 'Party silhouette ink';
  ink.onBeforeCompile = shader => {
    // Extrude after skinning so every ink contour follows the posed surface.
    shader.vertexShader = shader.vertexShader.replace(
      '#include <project_vertex>',
      `float viewDepth = abs((modelViewMatrix * vec4(transformed, 1.0)).z);
       transformed += normalize(objectNormal) * clamp(viewDepth * 0.00043, 0.0026, 0.007);
       #include <project_vertex>`,
    );
  };

  function dress(root: THREE.Object3D) {
    const mesh = root.getObjectByName(root.name + 'Costume') as THREE.SkinnedMesh | undefined;
    if (!mesh?.isSkinnedMesh || !mesh.parent) return;
    const original = mesh.material as THREE.MeshStandardMaterial;
    if (!original.map || original.userData.expressionRows !== 4) return;

    const map = original.map.clone();
    map.needsUpdate = true;
    const paint = new THREE.MeshToonMaterial({
      map,
      vertexColors: true,
      gradientMap: bands,
      color: original.color,
    });
    paint.name = root.name + ' cel paint';
    const outline = mesh.clone(false);
    outline.name = root.name + 'Ink';
    outline.material = ink;
    outline.renderOrder = mesh.renderOrder + 1;
    outline.castShadow = false;
    outline.receiveShadow = false;
    outline.raycast = () => {};
    mesh.parent.add(outline);
    mesh.material = paint;

    return {
      setExpression(expression: Expression) {
        map.offset.y = faceRows[expression] / 4;
      },
      dispose() {
        outline.removeFromParent();
        mesh.material = original;
        paint.dispose();
        map.dispose();
      },
    };
  }
  return { dress, dispose() { ink.dispose(); bands.dispose(); } };
}

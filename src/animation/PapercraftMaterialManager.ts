import * as THREE from 'three';

/**
 * Non-destructive Material Manager that toggles between
 * the original model materials and a handcrafted matte papercraft cardstock aesthetic.
 */
export class PapercraftMaterialManager {
  private static originalMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
  private static paperMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
  private static isPapercraftActive = false;

  /**
   * Applies handcrafted matte papercraft cardstock materials to all meshes under root.
   */
  public static enablePapercraft(root: THREE.Object3D): void {
    if (this.isPapercraftActive) return;

    root.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) return;

      // Cache original material if not cached
      if (!this.originalMaterials.has(mesh)) {
        this.originalMaterials.set(mesh, mesh.material);
      }

      // Create or reuse papercraft material
      let paperMat = this.paperMaterials.get(mesh);
      if (!paperMat) {
        if (Array.isArray(mesh.material)) {
          paperMat = mesh.material.map((m) => this.convertToPaperMaterial(m));
        } else {
          paperMat = this.convertToPaperMaterial(mesh.material);
        }
        this.paperMaterials.set(mesh, paperMat);
      }

      mesh.material = paperMat;
    });

    this.isPapercraftActive = true;
  }

  /**
   * Restores exact original materials with zero loss.
   */
  public static restoreOriginalMaterials(root: THREE.Object3D): void {
    if (!this.isPapercraftActive) return;

    root.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh) return;

      const orig = this.originalMaterials.get(mesh);
      if (orig) {
        mesh.material = orig;
      }
    });

    this.isPapercraftActive = false;
  }

  public static isPapercraft(): boolean {
    return this.isPapercraftActive;
  }

  public static togglePapercraft(root: THREE.Object3D): boolean {
    if (this.isPapercraftActive) {
      this.restoreOriginalMaterials(root);
    } else {
      this.enablePapercraft(root);
    }
    return this.isPapercraftActive;
  }

  /**
   * Converts a standard material into a soft matte papercraft cardstock material.
   */
  private static convertToPaperMaterial(sourceMat: THREE.Material): THREE.MeshStandardMaterial {
    const std = sourceMat as THREE.MeshStandardMaterial;
    const baseColor = std.color ? std.color.clone() : new THREE.Color('#f4eee0');

    // Soften and warm saturation slightly for anime paper diorama look
    const hsl = { h: 0, s: 0, l: 0 };
    baseColor.getHSL(hsl);
    baseColor.setHSL(hsl.h, Math.min(0.65, hsl.s * 0.85), Math.max(0.35, Math.min(0.85, hsl.l * 1.05)));

    return new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.82,
      metalness: 0.0,
      map: std.map || null,
      flatShading: false,
      shadowSide: THREE.DoubleSide,
    });
  }

  public static dispose(): void {
    this.originalMaterials.clear();
    this.paperMaterials.forEach((mat) => {
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat.dispose();
    });
    this.paperMaterials.clear();
    this.isPapercraftActive = false;
  }
}


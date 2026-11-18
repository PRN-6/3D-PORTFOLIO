import { useEffect } from 'react';
import * as THREE from 'three';

/**
 * Standard Global Orbit Controls Configuration
 * RULE: ROTATION IS ALLOWED. ZOOM IS NEVER ALLOWED.
 * CAMERA DISTANCE MUST REMAIN FIXED DURING MANUAL ROTATION.
 */
export const GLOBAL_ORBIT_CONFIG = {
  enableZoom: false,
  enablePan: false,
  enableDamping: true,
  dampingFactor: 0.07,
  rotateSpeed: 0.75,
  zoomSpeed: 0,
  panSpeed: 0,
  touches: {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.ROTATE,
  },
  mouseButtons: {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.ROTATE,
    RIGHT: THREE.MOUSE.ROTATE,
  },
} as const;

/**
 * Enforces strict mathematical spherical radius locking during any user rotation.
 * Keeps camera at exact fixed distance from target.
 */
export function enforceFixedDistance(
  camera: THREE.Camera,
  target: THREE.Vector3,
  fixedDistance: number,
  minY?: number
): void {
  const offset = camera.position.clone().sub(target);
  if (offset.lengthSq() > 0.0001) {
    offset.setLength(fixedDistance);
    camera.position.copy(target).add(offset);
  }
  if (typeof minY === 'number' && camera.position.y < minY) {
    camera.position.y = minY;
  }
}

/**
 * Hook to block all mouse wheel, trackpad pinch, touch gesture, and keyboard zoom events
 * across the entire 3D portfolio window.
 */
export function usePreventZoomGestures(): void {
  useEffect(() => {
    // 1. Block mouse wheel and trackpad scroll zoom
    const handleWheel = (e: WheelEvent) => {
      // Prevent wheel zooming
      e.preventDefault();
    };

    // 2. Block Safari/iOS gesture zoom (pinch-to-zoom)
    const handleGesture = (e: Event) => {
      e.preventDefault();
    };

    // 3. Block keyboard zoom shortcuts (Ctrl + / -, Cmd + / -)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '_' || e.key === '0')
      ) {
        e.preventDefault();
      }
    };

    // 4. Block multi-touch pinch gestures
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('gesturestart', handleGesture, { passive: false });
    window.addEventListener('gesturechange', handleGesture, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('gesturestart', handleGesture);
      window.removeEventListener('gesturechange', handleGesture);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);
}


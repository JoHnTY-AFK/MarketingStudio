import * as THREE from 'three';

export class CameraPathUtil {
  static generateSnapshots(
    modelBoundingSphere: THREE.Sphere,
    cameraFov: number,
    aspectRatio: number,
    markers: { position: [number, number, number], label?: string }[],
    targetFeatures: string[],
    northPoleAngle: number,
    stepDistance: number,
    snapshotsPerPath?: number
  ): THREE.Vector3[] {
    const fovRad = (cameraFov * Math.PI) / 180;
    let rCam = modelBoundingSphere.radius / Math.sin(fovRad / 2);
    if (aspectRatio < 1) {
      rCam = modelBoundingSphere.radius / Math.sin(fovRad / 2) / aspectRatio;
    }

    const pivot = modelBoundingSphere.center;
    const angleRad = (northPoleAngle * Math.PI) / 180;
    const northPoleRel = new THREE.Vector3(
      -rCam * Math.sin(angleRad),
      rCam * Math.cos(angleRad),
      0
    );
    
    const snapshots: THREE.Vector3[] = [];
    const camera = new THREE.PerspectiveCamera(cameraFov, aspectRatio, 0.1, 1000);
    const targetMarkers = markers.filter(m => m.label && targetFeatures.includes(m.label));

    const generatePos = (latitude: number, longitude: number) => {
      const x = rCam * Math.cos(latitude) * Math.cos(longitude);
      const z = rCam * Math.cos(latitude) * Math.sin(longitude);
      const y = rCam * Math.sin(latitude);

      const posStandard = new THREE.Vector3(x, y, z);
      const up = new THREE.Vector3(0, 1, 0);
      const npDir = northPoleRel.clone().normalize();
      
      let quaternion = new THREE.Quaternion();
      if (npDir.y === -1) {
          quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
      } else {
          quaternion.setFromUnitVectors(up, npDir);
      }

      posStandard.applyQuaternion(quaternion);
      return posStandard.add(pivot);
    };

    const addSnapshotIfVisible = (camPos: THREE.Vector3) => {
      camera.position.copy(camPos);
      camera.lookAt(pivot);
      camera.updateMatrixWorld();
      camera.updateProjectionMatrix();

      const frustum = new THREE.Frustum();
      const projScreenMatrix = new THREE.Matrix4();
      projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      frustum.setFromProjectionMatrix(projScreenMatrix);

      let allVisible = true;
      for (const tm of targetMarkers) {
        const tmPos = new THREE.Vector3(...tm.position);
        if (!frustum.containsPoint(tmPos)) {
          allVisible = false;
          break;
        }
      }

      if (allVisible && targetMarkers.length > 0) {
        snapshots.push(camPos.clone());
      } else if (targetMarkers.length === 0) {
        snapshots.push(camPos.clone());
      }
    };

    if (snapshotsPerPath !== undefined && snapshotsPerPath > 0) {
      // Add North Pole
      addSnapshotIfVisible(generatePos(Math.PI / 2, 0));
      
      // Add intermediate nodes
      for (let meridianIdx = 0; meridianIdx < 8; meridianIdx++) {
        const longitude = (meridianIdx * Math.PI) / 4;
        for (let i = 1; i <= snapshotsPerPath; i++) {
          const latitude = Math.PI / 2 - (i / (snapshotsPerPath + 1)) * Math.PI;
          addSnapshotIfVisible(generatePos(latitude, longitude));
        }
      }

      // Add South Pole
      addSnapshotIfVisible(generatePos(-Math.PI / 2, 0));
    } else {
      const numSteps = Math.max(2, Math.floor((Math.PI * rCam) / stepDistance));
      for (let meridianIdx = 0; meridianIdx < 8; meridianIdx++) {
        const longitude = (meridianIdx * Math.PI) / 4;
        for (let stepIdx = 0; stepIdx <= numSteps; stepIdx++) {
          const latitude = Math.PI / 2 - (stepIdx / numSteps) * Math.PI;
          addSnapshotIfVisible(generatePos(latitude, longitude));
        }
      }
    }

    return snapshots;
  }
}

export class ScreenFramingUtil {
  static adjustCamera(
    cameraPos: THREE.Vector3,
    pivot: THREE.Vector3,
    markers: { position: [number, number, number], label?: string }[],
    targetFeatures: string[],
    fillRatio: number,
    alignment: string,
    dispersionMin: number,
    dispersionMax: number,
    cameraFov: number,
    aspectRatio: number
  ): THREE.Vector3 | null {
    const targetMarkers = markers.filter(m => m.label && targetFeatures.includes(m.label));
    if (targetMarkers.length === 0) return null;

    const camera = new THREE.PerspectiveCamera(cameraFov, aspectRatio, 0.1, 1000);
    camera.position.copy(cameraPos);
    camera.lookAt(pivot);
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    const ndcPoints: THREE.Vector2[] = [];

    for (const tm of targetMarkers) {
      const pt = new THREE.Vector3(...tm.position);
      pt.project(camera);
      ndcPoints.push(new THREE.Vector2(pt.x, pt.y));
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    }

    const currentW = maxX - minX;
    const currentH = maxY - minY;
    const currentArea = currentW * currentH;

    if (currentArea <= 0.000001) return null;

    const targetArea = fillRatio * 4;
    const distanceRatio = Math.sqrt(currentArea / targetArea);

    const currentDist = cameraPos.distanceTo(pivot);
    const newDist = currentDist * distanceRatio;

    const newW = currentW / distanceRatio;
    const newH = currentH / distanceRatio;

    if (newW > 2 || newH > 2) return null;

    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    let totalDist = 0;
    for (const pt of ndcPoints) {
      totalDist += pt.distanceTo(new THREE.Vector2(midX, midY));
    }
    const avgDist = totalDist / ndcPoints.length;
    const dispersionScale = avgDist / Math.sqrt(8);

    if (dispersionScale < dispersionMin || dispersionScale > dispersionMax) {
      return null;
    }

    const boundX = 1 - newW / 2;
    const boundY = 1 - newH / 2;

    let targetMidX = 0;
    let targetMidY = 0;

    if (alignment.includes('left')) targetMidX = -boundX;
    else if (alignment.includes('right')) targetMidX = boundX;

    if (alignment.includes('bottom')) targetMidY = -boundY;
    else if (alignment.includes('top')) targetMidY = boundY;

    const newMidX = midX / distanceRatio;
    const newMidY = midY / distanceRatio;

    const deltaX = targetMidX - newMidX;
    const deltaY = targetMidY - newMidY;

    const fovRad = (cameraFov * Math.PI) / 180;
    const shiftX = -deltaX * newDist * Math.tan(fovRad / 2) * aspectRatio;
    const shiftY = -deltaY * newDist * Math.tan(fovRad / 2);

    const dir = new THREE.Vector3().subVectors(cameraPos, pivot).normalize();
    const newCamPos = pivot.clone().add(dir.multiplyScalar(newDist));

    camera.position.copy(newCamPos);
    camera.lookAt(pivot);
    camera.updateMatrixWorld();

    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).normalize();
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion).normalize();

    newCamPos.add(right.multiplyScalar(shiftX));
    newCamPos.add(up.multiplyScalar(shiftY));

    return newCamPos;
  }
}

export class FocusRaycastUtil {
  static placeOnLineOfSight(
    cameraPosition: THREE.Vector3,
    focalPoint: THREE.Vector3,
    distanceFromFocus: number
  ): THREE.Vector3 {
    const dir = new THREE.Vector3().subVectors(focalPoint, cameraPosition).normalize();
    return focalPoint.clone().add(dir.multiplyScalar(distanceFromFocus));
  }
}

export class SilhouetteClearanceUtil {
  static calculateRevealOffset(
    cameraPosition: THREE.Vector3,
    targetPosition: THREE.Vector3,
    occluderSphere: THREE.Sphere,
    verticalOffset: 'obscured' | 'revealed_top' | 'revealed_bottom',
    horizontalOffset: 'center' | 'revealed_left' | 'revealed_right'
  ): THREE.Vector3 {
    const camToTarget = new THREE.Vector3().subVectors(targetPosition, cameraPosition).normalize();
    const worldUp = new THREE.Vector3(0, 1, 0);
    
    let right = new THREE.Vector3().crossVectors(camToTarget, worldUp);
    if (right.lengthSq() < 0.001) {
        right = new THREE.Vector3(1, 0, 0);
    } else {
        right.normalize();
    }
    const up = new THREE.Vector3().crossVectors(right, camToTarget).normalize();

    const finalPos = targetPosition.clone();
    const revealDist = occluderSphere.radius * 1.5;

    if (verticalOffset === 'revealed_top') finalPos.add(up.clone().multiplyScalar(revealDist));
    if (verticalOffset === 'revealed_bottom') finalPos.add(up.clone().multiplyScalar(-revealDist));
    
    if (horizontalOffset === 'revealed_right') finalPos.add(right.clone().multiplyScalar(revealDist));
    if (horizontalOffset === 'revealed_left') finalPos.add(right.clone().multiplyScalar(-revealDist));

    return finalPos;
  }
}

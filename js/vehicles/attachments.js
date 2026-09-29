// Attachment mesh builders (procedurale).
// Fiecare returneaza THREE.Group ready-to-attach la bladeAnchor.

import * as THREE from 'three';
import { RoundedBoxGeometry } from '../lib/RoundedBoxGeometry.js';

function plowBladeMesh(width, height = 0.55, color = 0xf4a030) {
  const grp = new THREE.Group();
  const blade = new THREE.Mesh(
    new RoundedBoxGeometry(width, height, 0.15, 3, 0.05),
    new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.5 })
  );
  blade.position.set(0, 0.08, 0.4);
  blade.rotation.x = -0.35;
  blade.castShadow = true;
  grp.add(blade);

  // Bottom edge (darker)
  const edge = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.08, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 })
  );
  edge.position.set(0, -0.2, 0.55);
  grp.add(edge);

  // Support arms
  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.06, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x555555 })
  );
  arm.position.set(-width * 0.35, -0.05, 0.15);
  grp.add(arm);
  const arm2 = arm.clone(); arm2.position.x = width * 0.35;
  grp.add(arm2);

  return grp;
}

function bucketMesh(width, color = 0xd8a020) {
  const grp = new THREE.Group();
  // Bucket body — U shape (bottom + back + walls)
  const bottom = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.1, 0.9),
    new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.4 })
  );
  bottom.position.set(0, 0, 0.55);
  bottom.castShadow = true;
  grp.add(bottom);

  const back = new THREE.Mesh(
    new RoundedBoxGeometry(width, 0.6, 0.15, 3, 0.05),
    new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.4 })
  );
  back.position.set(0, 0.28, 0.15);
  back.castShadow = true;
  grp.add(back);

  const wall1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.6, 0.9),
    new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.4 })
  );
  wall1.position.set(-width / 2 + 0.05, 0.28, 0.55);
  grp.add(wall1);
  const wall2 = wall1.clone(); wall2.position.x = width / 2 - 0.05;
  grp.add(wall2);

  return grp;
}

export function buildAttachment(id) {
  switch (id) {
    case 'plow_small':   return plowBladeMesh(1.8, 0.5, 0xf4a030);
    case 'plow_medium':  return plowBladeMesh(3.0, 0.6, 0xef8010);
    case 'plow_large':   return plowBladeMesh(4.2, 0.7, 0xd85008);
    case 'bucket_small': return bucketMesh(2.5, 0.6);
    case 'bucket_large': return bucketMesh(3.8, 0.7);
    default: return null;
  }
}

// Adaugat: buildXxx exports individuale
export function buildPlowSmall()  { return plowBladeMesh(1.8, 0.5, 0xf4a030); }
export function buildPlowMedium() { return plowBladeMesh(3.0, 0.6, 0xef8010); }
export function buildPlowLarge()  { return plowBladeMesh(4.2, 0.7, 0xd85008); }
export function buildBucketSmall() { return bucketMesh(2.5, 0.6); }
export function buildBucketLarge() { return bucketMesh(3.8, 0.7); }

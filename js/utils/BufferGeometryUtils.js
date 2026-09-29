// Minimal shim pentru GLTFLoader — furnizeaza doar `toTrianglesDrawMode`.
// GLB-urile standard folosesc triunghiuri normale; functia intra doar pentru
// triangle-strip/fan care sunt foarte rar folosite. Cazul rar =>
// convertim manual la triunghiuri prin duplicare de indici.

import { BufferAttribute, TriangleFanDrawMode, TriangleStripDrawMode } from 'three';

export function toTrianglesDrawMode(geometry, drawMode) {
  if (drawMode !== TriangleFanDrawMode && drawMode !== TriangleStripDrawMode) {
    // deja triangles, sau ceva necunoscut — returneaza cum e
    return geometry;
  }

  let index = geometry.getIndex();
  if (index === null) {
    const indices = [];
    const position = geometry.getAttribute('position');
    if (position !== undefined) {
      for (let i = 0; i < position.count; i++) indices.push(i);
      geometry.setIndex(indices);
      index = geometry.getIndex();
    } else {
      console.warn('BufferGeometryUtils.toTrianglesDrawMode(): fara position, skip.');
      return geometry;
    }
  }

  const numberOfTriangles = index.count - 2;
  const newIndices = [];

  if (drawMode === TriangleFanDrawMode) {
    for (let i = 1; i <= numberOfTriangles; i++) {
      newIndices.push(index.getX(0));
      newIndices.push(index.getX(i));
      newIndices.push(index.getX(i + 1));
    }
  } else {
    for (let i = 0; i < numberOfTriangles; i++) {
      if (i % 2 === 0) {
        newIndices.push(index.getX(i));
        newIndices.push(index.getX(i + 1));
        newIndices.push(index.getX(i + 2));
      } else {
        newIndices.push(index.getX(i + 2));
        newIndices.push(index.getX(i + 1));
        newIndices.push(index.getX(i));
      }
    }
  }

  if ((newIndices.length / 3) !== numberOfTriangles) {
    console.error('BufferGeometryUtils.toTrianglesDrawMode(): eroare la conversie.');
  }

  const newGeometry = geometry.clone();
  newGeometry.setIndex(newIndices);
  newGeometry.clearGroups();
  return newGeometry;
}

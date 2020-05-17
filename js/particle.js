"use strict";

// Particle constructor
function Particle(x, y, z, mass) {
  this.position = new THREE.Vector3(); // position
  this.previous = new THREE.Vector3(); // previous
  this.original = new THREE.Vector3(); // original
  initParameterizedPosition(x, y, this.position);
  initParameterizedPosition(x, y, this.previous);
  initParameterizedPosition(x, y, this.original);

  this.netForce = new THREE.Vector3(); // net force acting on particle
  this.mass = mass; // mass of the particle
  this.correction = new THREE.Vector3(); // offset to apply to enforce constraints
}

// Snap a particle back to its original position
Particle.prototype.lockToOriginal = function() {
  this.position.copy(this.original);
  this.previous.copy(this.original);
};

// Snap a particle back to its previous position
Particle.prototype.lock = function() {
  this.position.copy(this.previous);
  this.previous.copy(this.previous);
};

// Add the given force to a particle's total netForce.
// Params:
// * force: THREE.Vector3 - the force to add
Particle.prototype.addForce = function(force) {
  // ----------- STUDENT CODE BEGIN ------------
  // ----------- Our reference solution uses 1 lines of code.
  this.netForce.add(force);
  // ----------- STUDENT CODE END ------------
};

// Perform Verlet integration on this particle with the provided
// timestep deltaT.
// Params:
// * deltaT: Number - the length of time dt over which to integrate
Particle.prototype.integrate = function(deltaT) {
  const DAMPING = SceneParams.DAMPING;

  // ----------- STUDENT CODE BEGIN ------------
  // You need to:
  // (1) Save the old (i.e. current) position into this.previous.
  // (2) Compute the new position of this particle using Verlet integration,
  //     and store it into this.position.
  // (3) Reset the net force acting on the particle (i.e. make it (0, 0, 0) again).
  // ----------- Our reference solution uses 13 lines of code.

  var vdt = new THREE.Vector3(0,0,0).subVectors(this.position, this.previous);
  this.previous = this.position.clone();
  this.position.add(vdt.multiplyScalar(1.0 - DAMPING));
  var a = this.netForce.clone().divideScalar(this.mass);
  this.position.add(a.multiplyScalar(deltaT * deltaT));
  this.netForce = new THREE.Vector3(0,0,0);

  // ----------- STUDENT CODE END ------------
};

// Handle collisions between this Particle and the provided floor.
// Note: the fields of floor are documented for completeness, but you
//       *WILL NOT* need to use all of them.
// Params:
// * floor: An object representing the floor of the scene, with properties:
//    - mesh: THREE.Mesh - the physical representation in the scene
//    - geometry: THREE.PlaneBufferGeometry - the abstract geometric representation
//    - material: THREE.MeshPhongMaterial - material information for lighting
Particle.prototype.handleFloorCollision = function(floor) {
  let floorMesh = floor.mesh;
  let floorPosition = floorMesh.position;
  const EPS = 3;
  // ----------- STUDENT CODE BEGIN ------------
  // Handle collision of this particle with the floor.
  // ----------- Our reference solution uses 4 lines of code.
  if (this.position.y < floorPosition.y) {
    let newPos = new THREE.Vector3(this.position.x, floorPosition.y + EPS, this.position.z);
    this.position = newPos;
  }
  // ----------- STUDENT CODE END ------------
};

// Handle collisions between this Particle and the provided sphere.
// Note: the fields of sphere are documented for completeness, but you
//       *WILL NOT* need to use all of them.
// Params:
// * sphere: An object representing a sphere in the scene, with properties:
//    - mesh: THREE.Mesh - the physical representation in the scene
//    - geometry: THREE.SphereGeometry - the abstract geometric representation
//    - material: THREE.MeshPhongMaterial - material information for lighting
//    - radius: number - the radius of the sphere
//    - position: THREE.Vector3 - the sphere's position in this frame
//    - prevPosition: THREE.Vector3 - the sphere's position in the previous frame
Particle.prototype.handleSphereCollision = function(sphere) {
  if (sphere.mesh.visible) {
    const friction = SceneParams.friction;
    let spherePosition = sphere.position.clone();
    let prevSpherePosition = sphere.prevPosition.clone();
    let EPS = 5; // empirically determined
    // ----------- STUDENT CODE BEGIN ------------
    // Handle collision of this particle with the sphere.
    // As with the floor, use EPS to prevent clipping.
    let posFriction = new THREE.Vector3();
    let posNoFriction = new THREE.Vector3();
    // ----------- Our reference solution uses 28 lines of code.

    var diff = new THREE.Vector3(0,0,0).subVectors(this.position, spherePosition);
    if (diff.length() < sphere.radius + EPS) {
      diff.normalize();
      posNoFriction = spherePosition.add(diff.multiplyScalar(sphere.radius + EPS));
    }
    else {
      return;
    }
    var prevDiff = new THREE.Vector3(0,0,0).subVectors(prevSpherePosition, this.position);
    if (prevDiff.length() >= sphere.radius + EPS) {
      posFriction = this.previous.add(spherePosition.sub(prevSpherePosition));
      this.position = posFriction.multiplyScalar(friction).add(
                                posNoFriction.multiplyScalar(1.0 - friction));
    }
    else {
      this.position = posNoFriction;
    }

    // ----------- STUDENT CODE END ------------
  }
};

// Handle collisions between this Particle and the provided axis-aligned box.
// Note: the fields of box are documented for completeness, but you
//       *WILL NOT* need to use all of them.
// Params:
// * box: An object representing an axis-aligned box in the scene, with properties:
//    - mesh: THREE.Mesh - the physical representation in the scene
//    - geometry: THREE.BoxGeometry - the abstract geometric representation
//    - material: THREE.MeshPhongMaterial - material information for lighting
//    - boundingBox: THREE.Box3 - the bounding box of the box in the scene
Particle.prototype.handleBoxCollision = function(box) {
  if (box.mesh.visible) {
    const friction = SceneParams.friction;
    let boundingBox = box.boundingBox.clone();
    const EPS = 10; // empirically determined
    // ----------- STUDENT CODE BEGIN ------------
    // Handle collision of this particle with the axis-aligned box.
    // As before, use EPS to prevent clipping
    let posFriction = new THREE.Vector3();
    let posNoFriction = new THREE.Vector3();
    // ----------- Our reference solution uses 66 lines of code.

    function closestXYZ(position, xyz) {
      let diffX = Math.abs(position.x - xyz.x) + EPS;
      let diffY = Math.abs(position.y - xyz.y) + EPS;
      let diffZ = Math.abs(position.z - xyz.z) + EPS;
      if (diffX <= diffY && diffX <= diffZ) {
        posNoFriction.x = xyz.x;
      }
      else if (diffY <= diffX && diffY <= diffZ) {
        posNoFriction.y = xyz.y;
      }
      else {
        posNoFriction.z = xyz.z;
      }
    }

    boundingBox.expandByScalar(EPS);
    posNoFriction = this.position.clone();

    if (boundingBox.containsPoint(this.position)) {
      if (this.position.x > 0) {
        if (this.position.y > 0) {
          // all pos
          if (this.position.z > 0) {
            closestXYZ(this.position, boundingBox.max);
          }
          // z neg
          else {
            closestXYZ(this.position, new THREE.Vector3(boundingBox.max.x, boundingBox.max.y, boundingBox.min.z));
          }
        }
        else {
          // y neg, z pos
          if (this.position.z > 0) {
            closestXYZ(this.position, new THREE.Vector3(boundingBox.max.x, boundingBox.min.y, boundingBox.max.z));
          }
          // y neg, z neg
          else {
            closestXYZ(this.position, new THREE.Vector3(boundingBox.max.x, boundingBox.min.y, boundingBox.min.z));
          }
        }
      }
      else {
        if (this.position.y > 0) {
          // x neg, y pos, z pos
          if (this.position.z > 0) {
            closestXYZ(this.position, new THREE.Vector3(boundingBox.min.x, boundingBox.max.y, boundingBox.max.z));
          }
          // x neg, y pos, z neg
          else {
            closestXYZ(this.position, new THREE.Vector3(boundingBox.min.x, boundingBox.max.y, boundingBox.min.z));
          }
        }
        else {
          // x neg, y neg, z pos
          if (this.position.z > 0) {
            closestXYZ(this.position, new THREE.Vector3(boundingBox.min.x, boundingBox.min.y, boundingBox.max.z));
          }
          // x neg, y neg, z neg
          else {
            closestXYZ(this.position, boundingBox.min);
          }
        }
      }
    }
    else {
      return;
    }
    if (!boundingBox.containsPoint(this.previous)) {
      posFriction = this.previous;
      posNoFriction.addScalar(EPS);
      this.position = posFriction.multiplyScalar(friction).add(
        posNoFriction.multiplyScalar(1.0 - friction));
    }
    else {
      this.position = posNoFriction;
    }



    // ----------- STUDENT CODE END ------------
  }
};

// ------------------------ Don't worry about this ---------------------------
// Apply the cached correction vector to this particle's position, and
// then zero out the correction vector.
// Particle.prototype.applyCorrection = function() {
//   this.position.add(this.correction);
//   this.correction.set(0,0,0);
// }

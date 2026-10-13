/**
 * GestureFlow Reality Engine — Undo / Redo Manager
 * Action stack for restoring spawned, deleted, duplicated, or transformed entities.
 */

export class UndoManager {
  constructor(spawnManager) {
    this.spawnManager = spawnManager;
    this.history = [];
    this.maxHistory = 30;
  }

  record(actionType, data) {
    this.history.push({ type: actionType, data, timestamp: Date.now() });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  undo() {
    if (this.history.length === 0) return null;
    const action = this.history.pop();

    switch (action.type) {
      case 'SPAWN':
        // Undo spawn: remove the object
        if (action.data.object && action.data.object.parent) {
          this.spawnManager.remove(action.data.object);
        }
        break;

      case 'DELETE':
        // Undo delete: respawn the item
        if (action.data.itemDef) {
          this.spawnManager.spawn(action.data.itemDef, action.data.position);
        }
        break;

      case 'TRANSFORM':
        // Restore transform
        if (action.data.object && action.data.prevPosition) {
          action.data.object.position.copy(action.data.prevPosition);
          if (action.data.prevRotation) action.data.object.rotation.copy(action.data.prevRotation);
          if (action.data.prevScale) action.data.object.scale.copy(action.data.prevScale);
        }
        break;
    }

    return action;
  }

  clear() {
    this.history = [];
  }
}

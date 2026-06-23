# 3D Model Library — Dopamine Studios

All `.glb` files in this folder are loaded via `staticFile('models/<filename>.glb')` in Remotion components.

## Adding a model
1. Add the download URL to `scripts/download_models.py`
2. Run `python scripts/download_models.py`
3. Import from `src/remotion/assets/ModelLibrary.tsx` using the `MODELS` registry

## Sources
- KhronosGroup/glTF-Sample-Assets — official Khronos GLTF samples
- mrdoob/three.js — three.js example models
- All URLs verified HTTP 200 before inclusion

## Duplicating to a new repo
Copy the entire `public/models/` folder. All paths are relative and self-contained.
Run `python scripts/download_models.py` to re-fetch any missing files.

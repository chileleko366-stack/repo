#!/usr/bin/env python3
"""
download_models.py — fetch all verified 3D GLB models from GitHub.

Run from repo root:
    python scripts/download_models.py

All URLs verified HTTP 200 with real content-length before being added here.
Safe to re-run — skips files that already exist and are valid size.
"""

import os
import sys
import urllib.request
import urllib.error
from pathlib import Path

# ── Output directory ──────────────────────────────────────────────────────────
MODELS_DIR = Path("public/models")
MODELS_DIR.mkdir(parents=True, exist_ok=True)

# ── User-Agent (required by some GitHub servers) ──────────────────────────────
UA = "DopamineStudios-ModelFetcher/1.0"

# ── Model manifest ────────────────────────────────────────────────────────────
# Format: (output_filename, source_url, min_expected_bytes)
# min_expected_bytes: safety check — if file is smaller, it's a 404 page, reject it

BASE_K = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models"
BASE_T = "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf"

MODELS = [
    # ── Anatomical / Scientific ───────────────────────────────────────────────
    ("brain_stem.glb",        f"{BASE_K}/BrainStem/glTF-Binary/BrainStem.glb",                           500_000),
    ("skull.glb",             f"{BASE_K}/ScatteringSkull/glTF-Binary/ScatteringSkull.glb",               500_000),
    ("mosquito_amber.glb",    f"{BASE_K}/MosquitoInAmber/glTF-Binary/MosquitoInAmber.glb",             1_000_000),

    # ── Human Figures ─────────────────────────────────────────────────────────
    ("face_cap.glb",          f"{BASE_T}/facecap.glb",                                                    50_000),
    ("michelle.glb",          f"{BASE_T}/Michelle.glb",                                                  500_000),
    ("soldier.glb",           f"{BASE_T}/Soldier.glb",                                                   500_000),
    ("xbot.glb",              f"{BASE_T}/Xbot.glb",                                                      500_000),
    ("kira.glb",              f"{BASE_T}/kira.glb",                                                    1_000_000),
    ("nemetona.glb",          f"{BASE_T}/nemetona.glb",                                                  500_000),
    ("cesium_man.glb",        f"{BASE_K}/CesiumMan/glTF-Binary/CesiumMan.glb",                           50_000),
    ("rigged_figure.glb",     f"{BASE_K}/RiggedFigure/glTF-Binary/RiggedFigure.glb",                    10_000),
    ("corset.glb",            f"{BASE_K}/Corset/glTF-Binary/Corset.glb",                               1_000_000),

    # ── Masks / Busts / Sculptures ────────────────────────────────────────────
    ("venice_mask.glb",       f"{BASE_T}/venice_mask.glb",                                               500_000),
    ("tennyson_bust.glb",     f"{BASE_T}/tennyson-bust.glb",                                              50_000),
    ("suzanne.glb",           f"{BASE_K}/IridescenceSuzanne/glTF-Binary/IridescenceSuzanne.glb",         50_000),

    # ── Animals ───────────────────────────────────────────────────────────────
    ("flamingo.glb",          f"{BASE_T}/Flamingo.glb",                                                   10_000),
    ("horse.glb",             f"{BASE_T}/Horse.glb",                                                      50_000),
    ("parrot.glb",            f"{BASE_T}/Parrot.glb",                                                     10_000),
    ("stork.glb",             f"{BASE_T}/Stork.glb",                                                      10_000),
    ("duck.glb",              f"{BASE_K}/Duck/glTF-Binary/Duck.glb",                                      10_000),
    ("fox.glb",               f"{BASE_K}/Fox/glTF-Binary/Fox.glb",                                        50_000),
    ("fish.glb",              f"{BASE_K}/BarramundiFish/glTF-Binary/BarramundiFish.glb",               1_000_000),

    # ── Vehicles ──────────────────────────────────────────────────────────────
    ("ferrari.glb",           f"{BASE_T}/ferrari.glb",                                                   500_000),
    ("car_concept.glb",       f"{BASE_K}/CarConcept/glTF-Binary/CarConcept.glb",                       1_000_000),
    ("toy_car.glb",           f"{BASE_K}/ToyCar/glTF-Binary/ToyCar.glb",                               1_000_000),
    ("milk_truck.glb",        f"{BASE_K}/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb",               50_000),
    ("carbon_bike.glb",       f"{BASE_T}/CarbonFrameBike.glb",                                           500_000),

    # ── Cameras / Optics ──────────────────────────────────────────────────────
    ("antique_camera.glb",    f"{BASE_K}/AntiqueCamera/glTF-Binary/AntiqueCamera.glb",                 1_000_000),
    ("steampunk_camera.glb",  f"{BASE_T}/steampunk_camera.glb",                                          500_000),

    # ── Watches / Jewelry ─────────────────────────────────────────────────────
    ("chronograph_watch.glb", f"{BASE_K}/ChronographWatch/glTF-Binary/ChronographWatch.glb",           1_000_000),
    ("rolex.glb",             f"{BASE_T}/rolex.glb",                                                     500_000),
    ("sunglasses.glb",        f"{BASE_K}/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb",          50_000),

    # ── Furniture ─────────────────────────────────────────────────────────────
    ("velvet_sofa.glb",       f"{BASE_K}/GlamVelvetSofa/glTF-Binary/GlamVelvetSofa.glb",               500_000),
    ("damask_chair.glb",      f"{BASE_K}/ChairDamaskPurplegold/glTF-Binary/ChairDamaskPurplegold.glb", 500_000),
    ("sheen_chair.glb",       f"{BASE_K}/SheenChair/glTF-Binary/SheenChair.glb",                       500_000),
    ("leather_sofa.glb",      f"{BASE_K}/SheenWoodLeatherSofa/glTF-Binary/SheenWoodLeatherSofa.glb", 1_000_000),
    ("silk_pouf.glb",         f"{BASE_K}/SpecularSilkPouf/glTF-Binary/SpecularSilkPouf.glb",           500_000),

    # ── Glass / Decorative ────────────────────────────────────────────────────
    ("candle_holder.glb",     f"{BASE_K}/GlassHurricaneCandleHolder/glTF-Binary/GlassHurricaneCandleHolder.glb", 500_000),
    ("vase_flowers.glb",      f"{BASE_K}/GlassVaseFlowers/glTF-Binary/GlassVaseFlowers.glb",           500_000),
    ("broken_window.glb",     f"{BASE_K}/GlassBrokenWindow/glTF-Binary/GlassBrokenWindow.glb",         100_000),
    ("iridescence_lamp.glb",  f"{BASE_K}/IridescenceLamp/glTF-Binary/IridescenceLamp.glb",             500_000),
    ("lantern.glb",           f"{BASE_K}/Lantern/glTF-Binary/Lantern.glb",                            1_000_000),
    ("lamp.glb",              f"{BASE_K}/LightsPunctualLamp/glTF-Binary/LightsPunctualLamp.glb",        500_000),

    # ── Appliances / Electronics ──────────────────────────────────────────────
    ("refrigerator.glb",      f"{BASE_K}/CommercialRefrigerator/glTF-Binary/CommercialRefrigerator.glb", 1_000_000),
    ("coffee_machine.glb",    f"{BASE_T}/coffeemat.glb",                                               500_000),
    ("coffee_mug.glb",        f"{BASE_T}/coffeeMug.glb",                                                50_000),
    ("boombox.glb",           f"{BASE_K}/BoomBox/glTF-Binary/BoomBox.glb",                           1_000_000),

    # ── Food / Nature ─────────────────────────────────────────────────────────
    ("avocado.glb",           f"{BASE_K}/Avocado/glTF-Binary/Avocado.glb",                            1_000_000),
    ("plant.glb",             f"{BASE_K}/DiffuseTransmissionPlant/glTF-Binary/DiffuseTransmissionPlant.glb", 500_000),
    ("teacup.glb",            f"{BASE_K}/DiffuseTransmissionTeacup/glTF-Binary/DiffuseTransmissionTeacup.glb", 500_000),
    ("dish_olives.glb",       f"{BASE_K}/IridescentDishWithOlives/glTF-Binary/IridescentDishWithOlives.glb", 500_000),
    ("pot_coals.glb",         f"{BASE_K}/PotOfCoals/glTF-Binary/PotOfCoals.glb",                       500_000),

    # ── Fashion ───────────────────────────────────────────────────────────────
    ("shoe.glb",              f"{BASE_K}/MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb", 1_000_000),

    # ── Water / Glass ─────────────────────────────────────────────────────────
    ("water_bottle.glb",      f"{BASE_K}/WaterBottle/glTF-Binary/WaterBottle.glb",                   1_000_000),

    # ── Specimens ─────────────────────────────────────────────────────────────
    ("abalone.glb",           f"{BASE_K}/IridescenceAbalone/glTF-Binary/IridescenceAbalone.glb",      1_000_000),

    # ── Spheres / Abstract ────────────────────────────────────────────────────
    ("metal_spheres.glb",     f"{BASE_K}/MetalRoughSpheres/glTF-Binary/MetalRoughSpheres.glb",        1_000_000),
    ("sphere_clean.glb",      f"{BASE_K}/MetalRoughSpheresNoTextures/glTF-Binary/MetalRoughSpheresNoTextures.glb", 50_000),
    ("carbon_fibre_ball.glb", f"{BASE_K}/CarbonFibre/glTF-Binary/CarbonFibre.glb",                      50_000),
    ("dragon.glb",            f"{BASE_K}/DragonAttenuation/glTF-Binary/DragonAttenuation.glb",        1_000_000),
    ("suzanne_monkey.glb",    f"{BASE_K}/IridescenceSuzanne/glTF-Binary/IridescenceSuzanne.glb",        50_000),

    # ── Cities / Environments ─────────────────────────────────────────────────
    ("virtual_city.glb",      f"{BASE_K}/VirtualCity/glTF-Binary/VirtualCity.glb",                      500_000),
    ("littlest_tokyo.glb",    f"{BASE_T}/LittlestTokyo.glb",                                          1_000_000),

    # ── Sci-Fi / Space ────────────────────────────────────────────────────────
    ("ion_drive.glb",         f"{BASE_T}/PrimaryIonDrive.glb",                                        1_000_000),
    ("spaceship_hallway.glb", f"{BASE_T}/space_ship_hallway.glb",                                       500_000),

    # ── Historical / Art ──────────────────────────────────────────────────────
    ("damaged_helmet.glb",    f"{BASE_K}/DamagedHelmet/glTF-Binary/DamagedHelmet.glb",                  500_000),
    ("bath_day.glb",          f"{BASE_T}/bath_day.glb",                                                   50_000),
    ("pool.glb",              f"{BASE_T}/pool.glb",                                                       50_000),

    # ── Mechanical ────────────────────────────────────────────────────────────
    ("gears.glb",             f"{BASE_T}/gears.glb",                                                      10_000),

    # ── Material Showcases (visually interesting) ─────────────────────────────
    ("shader_ball.glb",       f"{BASE_T}/ShaderBall.glb",                                               100_000),
    ("sheen_wood_sofa.glb",   f"{BASE_K}/SheenWoodLeatherSofa/glTF-Binary/SheenWoodLeatherSofa.glb", 1_000_000),
]


def download(filename: str, url: str, min_bytes: int) -> str:
    """
    Download a GLB file if not already present or if too small.
    Returns: 'downloaded', 'skipped' (already valid), or 'failed'
    """
    out = MODELS_DIR / filename

    # Already exists and valid size — skip
    if out.exists() and out.stat().st_size >= min_bytes:
        return "skipped"

    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = resp.read()
    except urllib.error.URLError as e:
        print(f"  ✗ NETWORK ERROR: {e}")
        return "failed"

    if len(data) < min_bytes:
        print(f"  ✗ TOO SMALL ({len(data)} bytes, expected ≥{min_bytes}) — likely 404 page")
        return "failed"

    out.write_bytes(data)
    mb = len(data) / 1_048_576
    print(f"  ✓ {mb:.2f}MB")
    return "downloaded"


def main() -> None:
    print(f"Downloading {len(MODELS)} models to {MODELS_DIR}/\n")
    downloaded = skipped = failed = 0

    for filename, url, min_bytes in MODELS:
        print(f"{filename}")
        result = download(filename, url, min_bytes)
        if result == "downloaded":
            downloaded += 1
        elif result == "skipped":
            print(f"  → already present, skipping")
            skipped += 1
        else:
            failed += 1

    print(f"\n{'='*50}")
    print(f"Downloaded: {downloaded}")
    print(f"Skipped (already present): {skipped}")
    print(f"Failed: {failed}")
    print(f"Total in public/models/: {len(list(MODELS_DIR.glob('*.glb')))}")

    if failed:
        print(f"\nWARNING: {failed} model(s) failed. Check URLs.")
        sys.exit(1)
    else:
        print("\nAll models ready ✓")


if __name__ == "__main__":
    main()

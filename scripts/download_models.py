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

BASE_K  = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models"
BASE_T  = "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf"
BASE_MV = "https://raw.githubusercontent.com/google/model-viewer/master/packages/shared-assets/models"
BASE_PM = "https://raw.githubusercontent.com/ToxSam/cc0-models-Polygonal-Mind/main/projects"

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
    ("nefertiti.glb",         f"{BASE_T}/Nefertiti.glb",                                                 500_000),
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

    # ── Channel-prefixed aliases ───────────────────────────────────────────────
    # ModelLibrary.tsx and the ch-specific components request these exact filenames.
    # They are identical source files as above, just downloaded under the ch-prefixed
    # name the components expect. Both copies coexist in public/models/.
    ("ch1_xbot.glb",          f"{BASE_T}/Xbot.glb",                                                      500_000),
    ("ch1_michelle.glb",      f"{BASE_T}/Michelle.glb",                                                   500_000),
    ("ch1_kira.glb",          f"{BASE_T}/kira.glb",                                                     1_000_000),
    ("ch1_flamingo.glb",      f"{BASE_T}/Flamingo.glb",                                                    10_000),
    ("ch1_fox.glb",           f"{BASE_K}/Fox/glTF-Binary/Fox.glb",                                        50_000),
    ("ch1_velvet_sofa.glb",   f"{BASE_K}/GlamVelvetSofa/glTF-Binary/GlamVelvetSofa.glb",                 500_000),
    ("ch1_sheen_chair.glb",   f"{BASE_K}/SheenChair/glTF-Binary/SheenChair.glb",                         500_000),
    ("ch1_venice_mask.glb",   f"{BASE_T}/venice_mask.glb",                                                500_000),

    ("ch2_watch.glb",         f"{BASE_K}/ChronographWatch/glTF-Binary/ChronographWatch.glb",           1_000_000),
    ("ch2_rolex.glb",         f"{BASE_T}/rolex.glb",                                                     500_000),
    ("ch2_gears.glb",         f"{BASE_T}/gears.glb",                                                      10_000),
    ("ch2_virtual_city.glb",  f"{BASE_K}/VirtualCity/glTF-Binary/VirtualCity.glb",                       500_000),
    ("ch2_shoe.glb",          f"{BASE_K}/MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb", 1_000_000),
    ("ch2_carbon_bike.glb",   f"{BASE_T}/CarbonFrameBike.glb",                                           500_000),
    ("ch2_toy_car.glb",       f"{BASE_K}/ToyCar/glTF-Binary/ToyCar.glb",                               1_000_000),
    ("ch2_sunglasses.glb",    f"{BASE_K}/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb",           50_000),
    ("ch2_tokyo.glb",         f"{BASE_T}/LittlestTokyo.glb",                                           1_000_000),
    ("ch2_car_concept.glb",   f"{BASE_K}/CarConcept/glTF-Binary/CarConcept.glb",                       1_000_000),

    ("ch3_skull.glb",         f"{BASE_K}/ScatteringSkull/glTF-Binary/ScatteringSkull.glb",               500_000),
    ("ch3_lantern.glb",       f"{BASE_K}/Lantern/glTF-Binary/Lantern.glb",                             1_000_000),
    ("ch3_soldier.glb",       f"{BASE_T}/Soldier.glb",                                                   500_000),
    ("ch3_broken_window.glb", f"{BASE_K}/GlassBrokenWindow/glTF-Binary/GlassBrokenWindow.glb",          100_000),
    ("ch3_coals.glb",         f"{BASE_K}/PotOfCoals/glTF-Binary/PotOfCoals.glb",                        500_000),
    ("ch3_bust.glb",          f"{BASE_T}/tennyson-bust.glb",                                              50_000),
    ("ch3_steampunk_cam.glb", f"{BASE_T}/steampunk_camera.glb",                                          500_000),

    ("ch4_skull.glb",         f"{BASE_K}/ScatteringSkull/glTF-Binary/ScatteringSkull.glb",               500_000),
    ("ch4_plant.glb",         f"{BASE_K}/DiffuseTransmissionPlant/glTF-Binary/DiffuseTransmissionPlant.glb", 500_000),
    ("ch4_fish.glb",          f"{BASE_K}/BarramundiFish/glTF-Binary/BarramundiFish.glb",               1_000_000),
    ("ch4_metal_spheres.glb", f"{BASE_K}/MetalRoughSpheres/glTF-Binary/MetalRoughSpheres.glb",        1_000_000),
    ("ch4_crystal_dragon.glb",f"{BASE_K}/DragonAttenuation/glTF-Binary/DragonAttenuation.glb",        1_000_000),
    ("ch4_glass_vase.glb",    f"{BASE_K}/GlassVaseFlowers/glTF-Binary/GlassVaseFlowers.glb",            500_000),
    ("ch4_mosquito_amber.glb",f"{BASE_K}/MosquitoInAmber/glTF-Binary/MosquitoInAmber.glb",           1_000_000),

    ("ch5_candle.glb",        f"{BASE_K}/GlassHurricaneCandleHolder/glTF-Binary/GlassHurricaneCandleHolder.glb", 500_000),
    ("ch5_lantern.glb",       f"{BASE_K}/Lantern/glTF-Binary/Lantern.glb",                             1_000_000),
    ("ch5_soldier.glb",       f"{BASE_T}/Soldier.glb",                                                   500_000),
    ("ch5_boombox.glb",       f"{BASE_K}/BoomBox/glTF-Binary/BoomBox.glb",                            1_000_000),
    ("ch5_milk_truck.glb",    f"{BASE_K}/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb",               50_000),
    ("ch5_venice_mask.glb",   f"{BASE_T}/venice_mask.glb",                                               500_000),
    ("ch5_corset.glb",        f"{BASE_K}/Corset/glTF-Binary/Corset.glb",                              1_000_000),

    ("ch6_ion_drive.glb",     f"{BASE_T}/PrimaryIonDrive.glb",                                        1_000_000),
    ("ch6_ship_hallway.glb",  f"{BASE_T}/space_ship_hallway.glb",                                       500_000),
    ("ch6_metal_spheres.glb", f"{BASE_K}/MetalRoughSpheres/glTF-Binary/MetalRoughSpheres.glb",        1_000_000),
    ("ch6_crystal.glb",       f"{BASE_K}/IridescenceSuzanne/glTF-Binary/IridescenceSuzanne.glb",        50_000),
    ("ch6_dispersion.glb",    f"{BASE_K}/DragonAttenuation/glTF-Binary/DragonAttenuation.glb",        1_000_000),
    ("ch6_glass_shatter.glb", f"{BASE_K}/GlassBrokenWindow/glTF-Binary/GlassBrokenWindow.glb",         100_000),
    ("ch6_shader_ball.glb",   f"{BASE_T}/ShaderBall.glb",                                               100_000),

    # ── Khronos extras (not yet in list) ──────────────────────────────────────
    ("a_beautiful_game.glb",         f"{BASE_K}/ABeautifulGame/glTF-Binary/ABeautifulGame.glb",                               5_000_000),
    ("anisotropy_barn_lamp.glb",     f"{BASE_K}/AnisotropyBarnLamp/glTF-Binary/AnisotropyBarnLamp.glb",                       500_000),
    ("cesium_man.glb",               f"{BASE_K}/CesiumMan/glTF-Binary/CesiumMan.glb",                                         100_000),
    ("clearcoat_car_paint.glb",      f"{BASE_K}/ClearCoatCarPaint/glTF-Binary/ClearCoatCarPaint.glb",                          50_000),
    ("clearcoat_wicker.glb",         f"{BASE_K}/ClearcoatWicker/glTF-Binary/ClearcoatWicker.glb",                             100_000),
    ("commercial_refrigerator.glb",  f"{BASE_K}/CommercialRefrigerator/glTF-Binary/CommercialRefrigerator.glb",              1_000_000),
    ("diffuse_teacup.glb",           f"{BASE_K}/DiffuseTransmissionTeacup/glTF-Binary/DiffuseTransmissionTeacup.glb",         500_000),
    ("dispersion_test.glb",          f"{BASE_K}/DispersionTest/glTF-Binary/DispersionTest.glb",                               200_000),
    ("dragon_dispersion.glb",        f"{BASE_K}/DragonDispersion/glTF-Binary/DragonDispersion.glb",                           500_000),
    ("iridescent_dish_olives.glb",   f"{BASE_K}/IridescentDishWithOlives/glTF-Binary/IridescentDishWithOlives.glb",           500_000),
    ("metal_rough_no_tex.glb",       f"{BASE_K}/MetalRoughSpheresNoTextures/glTF-Binary/MetalRoughSpheresNoTextures.glb",      50_000),
    ("rigged_simple.glb",            f"{BASE_K}/RiggedSimple/glTF-Binary/RiggedSimple.glb",                                    10_000),
    ("specular_silk_pouf.glb",       f"{BASE_K}/SpecularSilkPouf/glTF-Binary/SpecularSilkPouf.glb",                           500_000),
    ("carbon_fibre.glb",             f"{BASE_K}/CarbonFibre/glTF-Binary/CarbonFibre.glb",                                     50_000),
    ("iridescence_lamp_k.glb",       f"{BASE_K}/IridescenceLamp/glTF-Binary/IridescenceLamp.glb",                             500_000),
    ("pot_coals_anim.glb",           f"{BASE_K}/PotOfCoalsAnimationPointer/glTF-Binary/PotOfCoalsAnimationPointer.glb",        500_000),
    ("anisotropy_disc.glb",          f"{BASE_K}/AnisotropyDiscTest/glTF-Binary/AnisotropyDiscTest.glb",                        50_000),
    ("play_set_light.glb",           f"{BASE_K}/PlaysetLightTest/glTF-Binary/PlaysetLightTest.glb",                         1_000_000),

    # ── three.js extras not yet in list ───────────────────────────────────────
    ("dungeon.glb",                  f"{BASE_T}/dungeon_warkarma.glb",                                                        500_000),
    ("coffee_mat.glb",               f"{BASE_T}/coffeemat.glb",                                                               500_000),
    ("readyplayer.glb",              f"{BASE_T}/readyplayer.me.glb",                                                          100_000),
    ("shader_ball2.glb",             f"{BASE_T}/ShaderBall2.glb",                                                              50_000),
    ("collision_world.glb",          f"{BASE_T}/collision-world.glb",                                                          50_000),

    # ── Google model-viewer ───────────────────────────────────────────────────
    ("astronaut.glb",                f"{BASE_MV}/Astronaut.glb",                                                              200_000),
    ("robot_expressive.glb",         f"{BASE_MV}/RobotExpressive.glb",                                                        50_000),
    ("neil_armstrong.glb",           f"{BASE_MV}/NeilArmstrong.glb",                                                         500_000),

    # ── ToxSam/Polygonal-Mind — Medieval Fair (CC0) ───────────────────────────
    ("pm_barrel.glb",                f"{BASE_PM}/medieval-fair/Barrel.glb",                                                    50_000),
    ("pm_beer.glb",                  f"{BASE_PM}/medieval-fair/Beer.glb",                                                      50_000),
    ("pm_cart.glb",                  f"{BASE_PM}/medieval-fair/Cart.glb",                                                      50_000),
    ("pm_coin.glb",                  f"{BASE_PM}/medieval-fair/Coin_PolygonalMind.glb",                                        50_000),
    ("pm_fair_lamp.glb",             f"{BASE_PM}/medieval-fair/Lamp.glb",                                                      50_000),
    ("pm_signpost.glb",              f"{BASE_PM}/medieval-fair/SignPost.glb",                                                   50_000),
    ("pm_stage_bg.glb",              f"{BASE_PM}/medieval-fair/StageBackground.glb",                                           50_000),
    ("pm_table_dinner.glb",          f"{BASE_PM}/medieval-fair/Table_Dinner.glb",                                              50_000),
    ("pm_pretzel.glb",               f"{BASE_PM}/medieval-fair/Pretzel.glb",                                                   50_000),

    # ── ToxSam/Polygonal-Mind — Chromatic Chaos / Vaporwave (CC0) ────────────
    ("pm_building_corner.glb",       f"{BASE_PM}/chromatic-chaos/Building_Corner_01.glb",                                      50_000),
    ("pm_building_vapor.glb",        f"{BASE_PM}/chromatic-chaos/Building_Vapor_Ramp_01.glb",                                  50_000),
    ("pm_cellphone_retro.glb",       f"{BASE_PM}/chromatic-chaos/CellPhone_Retro.glb",                                         50_000),
    ("pm_column_vapor.glb",          f"{BASE_PM}/chromatic-chaos/Column_Vapor_01.glb",                                         50_000),
    ("pm_computer_retro.glb",        f"{BASE_PM}/chromatic-chaos/Computer_Retro.glb",                                          50_000),
    ("pm_david_retro.glb",           f"{BASE_PM}/chromatic-chaos/David_Retro.glb",                                             50_000),
    ("pm_floppy_retro.glb",          f"{BASE_PM}/chromatic-chaos/FloppyDisk_Retro.glb",                                        50_000),
    ("pm_frame_neon_01.glb",         f"{BASE_PM}/chromatic-chaos/Frame_Neon_Vapor_01.glb",                                     50_000),
    ("pm_frame_neon_02.glb",         f"{BASE_PM}/chromatic-chaos/Frame_Neon_Vapor_02.glb",                                     50_000),
    ("pm_frame_neon_03.glb",         f"{BASE_PM}/chromatic-chaos/Frame_Neon_Vapor_03.glb",                                     50_000),
    ("pm_glass_corner.glb",          f"{BASE_PM}/chromatic-chaos/Glass_Corner_Vapor.glb",                                      50_000),
    ("pm_icon_computer.glb",         f"{BASE_PM}/chromatic-chaos/Icon_Computer_01.glb",                                        50_000),
    ("pm_icon_folder.glb",           f"{BASE_PM}/chromatic-chaos/Icon_Folder_01.glb",                                          50_000),
    ("pm_icon_mouse.glb",            f"{BASE_PM}/chromatic-chaos/Icon_Mouse_01.glb",                                           50_000),
    ("pm_keyboard_retro.glb",        f"{BASE_PM}/chromatic-chaos/Keyboard_Retro.glb",                                          50_000),
    ("pm_mobilephone_retro.glb",     f"{BASE_PM}/chromatic-chaos/MobilePhone_Retro.glb",                                       50_000),
    ("pm_screen_retro_01.glb",       f"{BASE_PM}/chromatic-chaos/Screen_Retro_01.glb",                                         50_000),
    ("pm_screen_retro_02.glb",       f"{BASE_PM}/chromatic-chaos/Screen_Retro_02.glb",                                         50_000),
    ("pm_venus_retro.glb",           f"{BASE_PM}/chromatic-chaos/Venus_Retro.glb",                                             50_000),

    # ── ToxSam/Polygonal-Mind — Aero System / Sci-Fi Transit (CC0) ───────────
    ("pm_airship.glb",               f"{BASE_PM}/aero-system/Aero_Airship_01.glb",                                             50_000),
    ("pm_aero_door.glb",             f"{BASE_PM}/aero-system/Aero_Door_01.glb",                                                50_000),
    ("pm_aero_ground_hex.glb",       f"{BASE_PM}/aero-system/Aero_Ground_Hexagon_Art.glb",                                     50_000),
    ("pm_aero_lampost.glb",          f"{BASE_PM}/aero-system/Aero_Lampost_01.glb",                                             50_000),
    ("pm_aero_station.glb",          f"{BASE_PM}/aero-system/Aero_Station_01_Art.glb",                                         50_000),
    ("pm_aero_ring.glb",             f"{BASE_PM}/aero-system/Aero_Station_Ring_Art.glb",                                       50_000),
    ("pm_floating_island.glb",       f"{BASE_PM}/aero-system/Floating_Island_01_Art.glb",                                      50_000),
    ("pm_aero_tree.glb",             f"{BASE_PM}/aero-system/Tree_01_Art.glb",                                                  50_000),

    # ── ToxSam/Polygonal-Mind — Tomb Chaser / Egyptian (CC0) ─────────────────
    ("pm_coins_art.glb",             f"{BASE_PM}/tomb-chaser-1/Coins_Art.glb",                                                 50_000),
    ("pm_column_art.glb",            f"{BASE_PM}/tomb-chaser-1/Column_Art.glb",                                                50_000),
    ("pm_door_art.glb",              f"{BASE_PM}/tomb-chaser-1/Door_Art.glb",                                                  50_000),
    ("pm_fire_torch_01.glb",         f"{BASE_PM}/tomb-chaser-1/FireTorch01_Art.glb",                                           50_000),
    ("pm_fire_torch_02.glb",         f"{BASE_PM}/tomb-chaser-1/FireTorch02_Art.glb",                                           50_000),
    ("pm_gem_01.glb",                f"{BASE_PM}/tomb-chaser-1/Gem01_Art.glb",                                                  50_000),
    ("pm_gem_02.glb",                f"{BASE_PM}/tomb-chaser-1/Gem02_Art.glb",                                                  50_000),
    ("pm_gem_03.glb",                f"{BASE_PM}/tomb-chaser-1/Gem03_Art.glb",                                                  50_000),
    ("pm_ghost.glb",                 f"{BASE_PM}/tomb-chaser-1/GhostArmature.glb",                                              50_000),
    ("pm_god_anubis.glb",            f"{BASE_PM}/tomb-chaser-1/GodAnubis_Art.glb",                                              50_000),
    ("pm_god_bastet.glb",            f"{BASE_PM}/tomb-chaser-1/GodBastet_Art.glb",                                              50_000),
    ("pm_god_ra.glb",                f"{BASE_PM}/tomb-chaser-1/GodRa_Art.glb",                                                  50_000),
    ("pm_jar_01.glb",                f"{BASE_PM}/tomb-chaser-1/Jar01_Art.glb",                                                  50_000),
    ("pm_jar_02.glb",                f"{BASE_PM}/tomb-chaser-1/Jar02_Art.glb",                                                  50_000),
    ("pm_lance.glb",                 f"{BASE_PM}/tomb-chaser-1/Lance_Art.glb",                                                  50_000),
    ("pm_obelisk.glb",               f"{BASE_PM}/tomb-chaser-1/Obelisk_Art.glb",                                                50_000),
    ("pm_palmtree.glb",              f"{BASE_PM}/tomb-chaser-1/PalmTree_Art.glb",                                               50_000),
    ("pm_temple_arch_01.glb",        f"{BASE_PM}/tomb-chaser-1/TempleArch01_Art.glb",                                          50_000),
    ("pm_temple_arch_02.glb",        f"{BASE_PM}/tomb-chaser-1/TempleArch02_Art.glb",                                          50_000),
    ("pm_temple_floor_01.glb",       f"{BASE_PM}/tomb-chaser-1/TempleFloor01_Art.glb",                                         50_000),
    ("pm_torch.glb",                 f"{BASE_PM}/tomb-chaser-1/Torch_Art.glb",                                                  50_000),
    ("pm_trap.glb",                  f"{BASE_PM}/tomb-chaser-1/Trap_Art.glb",                                                   50_000),

    # ── ToxSam/Polygonal-Mind — Crystal Crossroads / Sci-Fi (CC0) ────────────
    ("pm_crystal_base.glb",          f"{BASE_PM}/crystal-crossroads/Crystal_Base.glb",                                         50_000),
    ("pm_crystal_cluster.glb",       f"{BASE_PM}/crystal-crossroads/Crystal_Cluster.glb",                                      50_000),
    ("pm_crystal_small_01.glb",      f"{BASE_PM}/crystal-crossroads/Crystal_Small_01.glb",                                     50_000),
    ("pm_crystal_small_02.glb",      f"{BASE_PM}/crystal-crossroads/Crystal_Small_02.glb",                                     50_000),
    ("pm_crystal_small_03.glb",      f"{BASE_PM}/crystal-crossroads/Crystal_Small_03.glb",                                     50_000),
    ("pm_scifi_antenna.glb",         f"{BASE_PM}/crystal-crossroads/SciFi_Antenna.glb",                                        50_000),
    ("pm_scifi_battery.glb",         f"{BASE_PM}/crystal-crossroads/SciFi_Battery.glb",                                        50_000),
    ("pm_scifi_capsule.glb",         f"{BASE_PM}/crystal-crossroads/SciFi_Capsule.glb",                                        50_000),
    ("pm_scifi_drone.glb",           f"{BASE_PM}/crystal-crossroads/SciFi_Drone.glb",                                          50_000),
    ("pm_scifi_glassscreen.glb",     f"{BASE_PM}/crystal-crossroads/SciFi_GlassScreen.glb",                                    50_000),
    ("pm_scifi_machine.glb",         f"{BASE_PM}/crystal-crossroads/SciFi_Machine.glb",                                        50_000),
    ("pm_scifi_bridge.glb",          f"{BASE_PM}/crystal-crossroads/SciFi_Bridge.glb",                                         50_000),
    ("pm_vase_broken.glb",           f"{BASE_PM}/crystal-crossroads/Vase_Broken.glb",                                          50_000),
    ("pm_wall_broken.glb",           f"{BASE_PM}/crystal-crossroads/Wall_Broken_01.glb",                                       50_000),
    ("pm_arc.glb",                   f"{BASE_PM}/crystal-crossroads/Arc.glb",                                                   50_000),
    ("pm_column_regular.glb",        f"{BASE_PM}/crystal-crossroads/Column_Regular.glb",                                       50_000),
    ("pm_floor_tiles_large.glb",     f"{BASE_PM}/crystal-crossroads/Floor_Tiles_Large.glb",                                    50_000),
    ("pm_flowerpot_large.glb",       f"{BASE_PM}/crystal-crossroads/FlowerPot_Large_01.glb",                                   50_000),
    ("pm_pictureframe.glb",          f"{BASE_PM}/crystal-crossroads/PictureFrame_Regular.glb",                                 50_000),
    ("pm_propellant.glb",            f"{BASE_PM}/crystal-crossroads/Propellant.glb",                                           50_000),

    # ── ToxSam/Polygonal-Mind — Towers (Finance/Architecture/Space) (CC0) ─────
    ("pm_blockchain_eth.glb",        f"{BASE_PM}/towers/BlockChain_Eth_Art.glb",                                               50_000),
    ("pm_blockchain_tower.glb",      f"{BASE_PM}/towers/BlockChain_Tower_Art.glb",                                             50_000),
    ("pm_blockchain_bridge.glb",     f"{BASE_PM}/towers/BlockChain_Bridge_Art.glb",                                            50_000),
    ("pm_colony_rocket.glb",         f"{BASE_PM}/towers/Colony_Rocket_Art.glb",                                                50_000),
    ("pm_colony_ufo.glb",            f"{BASE_PM}/towers/Colony_UFO_Art.glb",                                                   50_000),
    ("pm_colony_planet.glb",         f"{BASE_PM}/towers/Colony_Planet_Art.glb",                                                50_000),
    ("pm_colony_monolith.glb",       f"{BASE_PM}/towers/Colony_Monolith_Art.glb",                                              50_000),
    ("pm_colony_drone.glb",          f"{BASE_PM}/towers/Colony_Egg_Art.glb",                                                   50_000),
    ("pm_colony_tower.glb",          f"{BASE_PM}/towers/Colony_Tower_Art.glb",                                                 50_000),
    ("pm_spooky_tower.glb",          f"{BASE_PM}/towers/Spooky_Tower_Floating_Cabin_01_Art.glb",                               50_000),
    ("pm_spooky_tree.glb",           f"{BASE_PM}/towers/Spooky_Tree_Art.glb",                                                  50_000),
    ("pm_spooky_lantern.glb",        f"{BASE_PM}/towers/Spooky_Tower_Lantern_Art.glb",                                         50_000),
    ("pm_lovedeath_hand.glb",        f"{BASE_PM}/towers/LoveDeath_Hand_Art.glb",                                               50_000),
    ("pm_lovedeath_cage.glb",        f"{BASE_PM}/towers/LoveDeath_Cage_Art.glb",                                               50_000),
    ("pm_lovedeath_tower.glb",       f"{BASE_PM}/towers/LoveDeath_Tower_Art.glb",                                              50_000),
    ("pm_tower_base.glb",            f"{BASE_PM}/towers/Tower_Base_01_Art.glb",                                                50_000),
    ("pm_bridge_nexus.glb",          f"{BASE_PM}/towers/Bridge_Nexus_Art.glb",                                                  50_000),
    ("pm_meme_terminal.glb",         f"{BASE_PM}/towers/MemeFactory_Terminal_Art.glb",                                         50_000),

    # ── ToxSam/Polygonal-Mind — XYZ Creatures (CC0) ──────────────────────────
    ("pm_triangulon.glb",            f"{BASE_PM}/xyz/001_Triangulon_Art.glb",                                                   50_000),
    ("pm_squaresquid.glb",           f"{BASE_PM}/xyz/002_Squaresquid_Art.glb",                                                  50_000),
    ("pm_hexabear.glb",              f"{BASE_PM}/xyz/003_Hexabear_Art.glb",                                                     50_000),
    ("pm_xenguin.glb",               f"{BASE_PM}/xyz/004_Xenguin_Art.glb",                                                      50_000),
    ("pm_pentachick.glb",            f"{BASE_PM}/xyz/005_Pentachick_Art.glb",                                                   50_000),
    ("pm_rectashark.glb",            f"{BASE_PM}/xyz/011_Rectashark_Art.glb",                                                   50_000),
    ("pm_octogecko.glb",             f"{BASE_PM}/xyz/013_Octogecko_Art.glb",                                                    50_000),
    ("pm_slothocto.glb",             f"{BASE_PM}/xyz/015_Slothocto_Art.glb",                                                    50_000),
    ("pm_raptorous.glb",             f"{BASE_PM}/xyz/016_Raptorous_Art.glb",                                                    50_000),
    ("pm_mewphinx.glb",              f"{BASE_PM}/xyz/018_Mewphinx_Art.glb",                                                     50_000),
    ("pm_hexowl.glb",                f"{BASE_PM}/xyz/028_Hexowl_Art.glb",                                                       50_000),
    ("pm_monkeylon.glb",             f"{BASE_PM}/xyz/029_Monkeylon_Art.glb",                                                    50_000),
    ("pm_crabylon.glb",              f"{BASE_PM}/xyz/030_Crabylon_Art.glb",                                                     50_000),
    ("pm_giraffaxon.glb",            f"{BASE_PM}/xyz/038_Giraffaxon_Art.glb",                                                   50_000),
    ("pm_frogaxon.glb",              f"{BASE_PM}/xyz/048_Frogaxon_Art.glb",                                                     50_000),
    ("pm_turtlelion.glb",            f"{BASE_PM}/xyz/049_Turtlelion_Art.glb",                                                   50_000),
    ("pm_cacturnion.glb",            f"{BASE_PM}/xyz/051_Cacturnion_Art.glb",                                                   50_000),
    ("pm_owltron.glb",               f"{BASE_PM}/xyz/052_Owltron_Art.glb",                                                      50_000),
    ("pm_penguiton.glb",             f"{BASE_PM}/xyz/053_Penguiton_Art.glb",                                                    50_000),
    ("pm_scorpy.glb",                f"{BASE_PM}/xyz/054_Scorpy_Art.glb",                                                       50_000),

    # ── ToxSam/Polygonal-Mind — MomusPark / Nature (CC0) ─────────────────────
    ("pm_bench.glb",                 f"{BASE_PM}/MomusPark/Bench_01_Art.glb",                                                   50_000),
    ("pm_bush_01.glb",               f"{BASE_PM}/MomusPark/Bush_01_Art.glb",                                                    50_000),
    ("pm_butterfly.glb",             f"{BASE_PM}/MomusPark/Butterfly.glb",                                                      50_000),
    ("pm_deer.glb",                  f"{BASE_PM}/MomusPark/DeerArmature.glb",                                                   50_000),
    ("pm_flower_01.glb",             f"{BASE_PM}/MomusPark/Flower_01_a.glb",                                                    50_000),
    ("pm_flower_02.glb",             f"{BASE_PM}/MomusPark/Flower_02_a_Art.glb",                                                50_000),
    ("pm_floating_island_park.glb",  f"{BASE_PM}/MomusPark/Floating_Island_01_Art.glb",                                        50_000),
    ("pm_mountain_lion.glb",         f"{BASE_PM}/MomusPark/MountainLion.glb",                                                   50_000),
    ("pm_mushroom_01.glb",           f"{BASE_PM}/MomusPark/Mushroom_01_Art.glb",                                                50_000),
    ("pm_owl.glb",                   f"{BASE_PM}/MomusPark/Owl.glb",                                                            50_000),
    ("pm_pig.glb",                   f"{BASE_PM}/MomusPark/PigArmature.glb",                                                    50_000),
    ("pm_rock_01.glb",               f"{BASE_PM}/MomusPark/Rock_01_Art.glb",                                                    50_000),
    ("pm_rock_02.glb",               f"{BASE_PM}/MomusPark/Rock_02_Art.glb",                                                    50_000),
    ("pm_statue_greek_01.glb",       f"{BASE_PM}/MomusPark/Statue_greek_01_Art.glb",                                           50_000),
    ("pm_statue_greek_02.glb",       f"{BASE_PM}/MomusPark/Statue_greek_02_Art.glb",                                           50_000),
    ("pm_amphitheater.glb",          f"{BASE_PM}/MomusPark/Str_Amphitheater_01_Art.glb",                                       50_000),
    ("pm_fountain.glb",              f"{BASE_PM}/MomusPark/Str_Fountain_01_Art.glb",                                           50_000),
    ("pm_ruins_01.glb",              f"{BASE_PM}/MomusPark/Str_Ruins_01_Art.glb",                                               50_000),
    ("pm_ruins_02.glb",              f"{BASE_PM}/MomusPark/Str_Ruins_02_Art.glb",                                               50_000),
    ("pm_tree_01.glb",               f"{BASE_PM}/MomusPark/Tree_01_Art.glb",                                                    50_000),
    ("pm_tree_02.glb",               f"{BASE_PM}/MomusPark/Tree_02_Art.glb",                                                    50_000),
    ("pm_waterfall.glb",             f"{BASE_PM}/MomusPark/Water_Fall_01_Art.glb",                                              50_000),

    # ── ToxSam/Polygonal-Mind — Lunar Year / East Asian (CC0) ────────────────
    ("pm_arch_banner.glb",           f"{BASE_PM}/lunar-year/ArchBanner.glb",                                                    50_000),
    ("pm_bell.glb",                  f"{BASE_PM}/lunar-year/Bell.glb",                                                          50_000),
    ("pm_bell_structure.glb",        f"{BASE_PM}/lunar-year/BellStructure.glb",                                                  50_000),
    ("pm_lunar_column.glb",          f"{BASE_PM}/lunar-year/Column.glb",                                                        50_000),
    ("pm_lunar_dragon.glb",          f"{BASE_PM}/lunar-year/Dragon.glb",                                                        50_000),
    ("pm_drum.glb",                  f"{BASE_PM}/lunar-year/Drum.glb",                                                          50_000),
    ("pm_lamp_01.glb",               f"{BASE_PM}/lunar-year/Lamp01.glb",                                                        50_000),
    ("pm_lamp_02.glb",               f"{BASE_PM}/lunar-year/Lamp02.glb",                                                        50_000),
    ("pm_lamp_wreath.glb",           f"{BASE_PM}/lunar-year/LampWreath.glb",                                                    50_000),
    ("pm_main_altar.glb",            f"{BASE_PM}/lunar-year/MainAltar.glb",                                                     50_000),
    ("pm_portal.glb",                f"{BASE_PM}/lunar-year/Portal.glb",                                                        50_000),
    ("pm_sakura.glb",                f"{BASE_PM}/abm/Sakura01_Art.glb",                                                         50_000),
    ("pm_tiger_logo.glb",            f"{BASE_PM}/lunar-year/TigerLogo.glb",                                                     50_000),

    # ── ToxSam/Polygonal-Mind — ABM Museum / Blockchain (CC0) ────────────────
    ("pm_dome_01.glb",               f"{BASE_PM}/abm/Dome01_Art.glb",                                                           50_000),
    ("pm_dome_02.glb",               f"{BASE_PM}/abm/Dome02_Art.glb",                                                           50_000),
    ("pm_holobush.glb",              f"{BASE_PM}/abm/HoloBush01_Art.glb",                                                       50_000),
    ("pm_holotree.glb",              f"{BASE_PM}/abm/HoloTree01_Art.glb",                                                       50_000),
    ("pm_infopanel.glb",             f"{BASE_PM}/abm/InfoPanel01_Art.glb",                                                      50_000),
    ("pm_teleporter.glb",            f"{BASE_PM}/abm/Teleporter01_Art.glb",                                                     50_000),
    ("pm_gong.glb",                  f"{BASE_PM}/abm/Gong01_Art.glb",                                                           50_000),
    ("pm_petals.glb",                f"{BASE_PM}/abm/Petals01_Art.glb",                                                         50_000),

    # ── ToxSam/Polygonal-Mind — Trash Polka / Industrial (CC0) ───────────────
    ("pm_robot_tp.glb",              f"{BASE_PM}/trash-polka/Robot.glb",                                                        50_000),
    ("pm_tank.glb",                  f"{BASE_PM}/trash-polka/Tank.glb",                                                         50_000),
    ("pm_screen_tp.glb",             f"{BASE_PM}/trash-polka/Screen.glb",                                                       50_000),
    ("pm_kiosco.glb",                f"{BASE_PM}/trash-polka/Kiosco.glb",                                                       50_000),
    ("pm_light_01.glb",              f"{BASE_PM}/trash-polka/Light01.glb",                                                      50_000),
    ("pm_light_02.glb",              f"{BASE_PM}/trash-polka/Light02.glb",                                                      50_000),
    ("pm_structure_01.glb",          f"{BASE_PM}/trash-polka/Structure01.glb",                                                  50_000),
    ("pm_structure_02.glb",          f"{BASE_PM}/trash-polka/Structure02.glb",                                                  50_000),
]


def download(filename: str, url: str, min_bytes: int, retries: int = 3) -> str:
    """
    Download a GLB file if not already present or if too small.
    Returns: 'downloaded', 'skipped' (already valid), or 'failed'
    """
    import time
    out = MODELS_DIR / filename

    # Already exists and valid size — skip
    if out.exists() and out.stat().st_size >= min_bytes:
        return "skipped"

    for attempt in range(1, retries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = resp.read()
            if len(data) < min_bytes:
                print(f"  ✗ TOO SMALL ({len(data)} bytes, expected ≥{min_bytes}) — likely 404 page")
                return "failed"
            out.write_bytes(data)
            mb = len(data) / 1_048_576
            print(f"  ✓ {mb:.2f}MB")
            return "downloaded"
        except urllib.error.URLError as e:
            if attempt < retries:
                print(f"  ↺ attempt {attempt} failed ({e}), retrying in {2**attempt}s...")
                time.sleep(2 ** attempt)
            else:
                print(f"  ✗ NETWORK ERROR after {retries} attempts: {e}")
                return "failed"
    return "failed"


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

    total = downloaded + skipped + failed
    if failed == 0:
        print("\nAll models ready ✓")
    elif total > 0 and failed / total > 0.20:
        print(f"\nERROR: {failed}/{total} models failed (>20% threshold). Aborting.")
        sys.exit(1)
    else:
        print(f"\nWARNING: {failed}/{total} models failed — within tolerance, continuing.")
        print("Renders will fall back to SphereFallback3D for missing models.")


if __name__ == "__main__":
    main()

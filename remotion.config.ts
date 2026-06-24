import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// swangle = ANGLE on SwiftShader: explicit software WebGL for GPU-less CI runners.
// Remotion uses this as its default for Lambda; set it here so Studio preview and
// CI renders both use the same path and never hit Chrome's deprecated auto-fallback.
Config.setChromiumOpenGlRenderer('swangle');

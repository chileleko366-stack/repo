import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setConcurrency(2);
Config.setChromiumOpenGlRenderer("swangle");
Config.setPixelFormat("yuv420p");
Config.setCodec("h264");

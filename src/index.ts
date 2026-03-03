import { detect } from "./detect.js";
import { generatePath } from "./storage.js";

const env = detect();
console.log(JSON.stringify(env, null, 2));

const filePath = generatePath();
console.log("Would save to:", filePath);

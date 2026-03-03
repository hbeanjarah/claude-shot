import { detect } from "./detect.js";

const env = detect();
console.log(JSON.stringify(env, null, 2));

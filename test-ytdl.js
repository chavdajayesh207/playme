import pkg from 'youtube-dl-exec';
const { exec } = pkg;
import fs from "fs";

console.log("Starting yt-dlp download...");
const subprocess = exec("https://www.youtube.com/watch?v=dQw4w9WgXcQ", {
  format: "bestaudio",
  output: "-",
}, { stdio: ['ignore', 'pipe', 'ignore'] });

subprocess.stdout.pipe(fs.createWriteStream("/tmp/test.mp3"));

subprocess.on("close", (code) => {
  console.log("Done! Exit code:", code);
});

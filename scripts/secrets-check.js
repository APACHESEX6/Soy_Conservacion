#!/usr/bin/env node
const { execFileSync } = require("child_process");

const secretPattern =
  /AIza[0-9A-Za-z-_]{35}|ghp_[0-9A-Za-z]{36}|xox[baprs]-[0-9]{12}-[0-9]{12}-[a-zA-Z0-9]{24}/;

const stagedFiles = execFileSync("git", ["diff", "--cached", "--name-only"], {
  encoding: "utf8",
})
  .split(/\r?\n/)
  .filter(Boolean);

for (const file of stagedFiles) {
  try {
    const content = execFileSync("git", ["show", `:${file}`], {
      encoding: "utf8",
    });

    if (secretPattern.test(content)) {
      console.error(`Potential secret found in staged file: ${file}`);
      process.exit(1);
    }
  } catch {
    // ignore files that cannot be read from the index
  }
}

process.exit(0);

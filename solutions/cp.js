spawn = require("win-spawn");
proc = spawn("java GreatestCommonDivisorCorrect", [], {stdio: "pipe"})
console.log(proc.stdin.write);
proc.stdin.write("21 14\n");
proc.stdin.end();

proc.stdout.on('data', function (data) {
  console.log('stdout: ' + data);
});

proc.stderr.on('data', function (data) {
  console.log('stderr: ' + data);
});

proc.on('close', function (code) {
  console.log('child process exited with code ' + code);
});
# Slope Mod Kit — start here

**Your uploaded Slope build is running in this kit.** It includes a replacement local launcher, the game files needed by that launcher, speed controls, jumping, ball images/colors, map colors, a course filter, experimental autopilot, a memory scanner, and the recovered executable code.

## Run the game

1. Extract the complete ZIP. Keep the folders together.
2. Install **Node.js 20 or newer** if needed: [official download](https://nodejs.org/en/download).
3. Double-click **Start-Mac.command** or **Start-Windows.bat**. Alternatively, open Terminal in this folder and run:

   ```sh
   node start.cjs
   ```

4. The launcher opens your browser. Click **Start game**, then **Play** inside Slope's menu.
5. Use the arrow keys or A/D to steer. Use Space to jump once the ball is near the ground. The left workshop panel holds appearance, course, and bot controls; the right panel holds speed and pause. Press B to toggle the bot.

Keep the terminal open while playing. Press Ctrl+C there to stop the server. If your OS won't open the launcher file, use the terminal command above. If the browser doesn't open automatically, copy the exact `http://127.0.0.1:PORT` address printed in the terminal. Opening `game/index.html` directly as a file will not load the game correctly; use the launcher.

No npm install, Unity installation, or original HTML/Unity loader is required. The browser needs working WebGL support and roughly 256 MiB for the game's Wasm memory, plus browser overhead.

## Included cheats

- **0.25× and 0.5×:** slow the game's simulation.
- **1×:** normal game speed.
- **Pause / Resume:** freeze the simulation, then return to the previous nonzero speed.
- **Speed slider:** select a speed from 0.1× to 8× (or press 4× for super speed).
- **Keep selected speed:** reapply that time scale when game events reset it. Turn it off if a menu or transition should manage its own time scale.
- **Reset to normal:** stop holding the speed and restore 1×.
- **More controls → Open memory scanner:** search and modify other live values. Those variables still require identifying their addresses.

These are real calls to this build's native Unity time-scale getter/setter. They slow the whole simulation, rather than changing only the ball's maximum velocity. Jumping is enabled by default, but only changes velocity when you press Space or the Jump button. High time scales can make gaps and collisions harder to handle.

The provided launcher restricts the game to local resources. Play as **Guest**. Online login, tracking, and leaderboard services are unavailable in this local practice version. Service errors in the developer console are expected; they did not prevent the tested game from loading and entering gameplay.

## Workshop controls

- **Jump:** Space or the Jump button. A physics ray checks ground contact; jumping launches the real Rigidbody away from the slope. Strength is adjustable from 6 to 22. It does not provide unlimited air jumps. Low tunnel ceilings can block a jump.
- **Autopilot:** check the box or press B. It samples track ahead using Unity physics raycasts, adjusts lateral ball velocity, and attempts jumps over gaps or obstructions. This is an **experimental steering bot**, not a guaranteed endless-run bot. It can miss complex sections, especially at high speed. Turn it off to resume manual steering.
- **Ball color / map color:** recolor the actual textures while keeping their grid/arrow patterns. Red hazard textures remain red. Reset buttons restore the originals.
- **Ball image:** choose a local image (under 12 MB). It is resized to 256×256 and wrapped around the sphere. It stays in your browser. Color changes tint the uploaded image; resetting the ball restores the original grid and tiling.
- **Custom course filter:** choose **one to three** of the nine available section types, then Apply filter. The original spawner uses those choices for future easy/medium/hard runs. Already-spawned sections, connecting tunnels, and starting sections remain. Tilted tracks and doglegs can alternate their left/right variants. This is a generator filter, not a free-placement track editor or a fixed-order course. Original course restores the original transitions and weights.
- **Export / Import settings:** saves speed, jump strength/enabled state, colors, and course selections in JSON. Images are selected separately, and the bot is not automatically enabled on import. Changes otherwise last for the current browser session.

The original executable is unchanged. The three ground/ball texture assets have been made readable, and the shared ball grid has been enlarged to 256×256 so runtime image uploads work. Original archive members remain under `recovered/data-archive-contents/`.

## Edit or add cheats

The workshop implementation is **`game/mods.js`**; time controls are in **`game/practice.js`**. Make a backup, edit it in a text editor, then reload the game page. Its controls call the exposed `SlopePractice` API after the runtime is ready:

```js
SlopePractice.ready();   // true when this build is initialized
SlopePractice.get();     // current time scale
SlopePractice.set(0.5);  // half speed
SlopePractice.set(0);    // pause
SlopePractice.reset();   // normal speed, stop the held value
```

The recovered runtime is exposed as `window.SlopeModule`. This profile checks a known string and the initialized TimeManager pointer before allowing a native time-scale call. The constants are specific to the uploaded build; they should not be reused for unrelated games.

### Use the memory scanner

Open the scanner from the practice panel. Search for a visible number, change that number in the game, and filter the results. Int32 is for whole-number fields; Float32 is a useful starting point for movement-related fields. Once you have identified the correct address, use **Write once** or **Freeze value**. A wrong address can crash the local game. Reloading restarts the session, and addresses can move between runs.

The scanner's JavaScript API becomes available as `UnityWebLab`. It supports `scan`, `next`, `read`, `write`, `freeze`, `unfreeze`, and `undo`. It is a general scanner, so it cannot automatically name every Slope variable. Metadata indices and file offsets are not memory addresses.

## Recovered code and data

| File | What it contains |
| --- | --- |
| `game/slope.wasm` | Exact decompressed original executable from `slope_wasmcode.unityweb` |
| `game/runtime.js` | The recovered WebAssembly framework, assigned to `window.createSlopeRuntime` for the replacement launcher |
| `game/slope.data` | Repacked data archive with three editable texture assets |
| `recovered/slope-complete.wat` | Complete WebAssembly text: **49,674 defined functions**, plus imports, globals, exports, table entries, and data |
| `recovered/time-scale-functions.txt` | Selected time-scale functions decompiled into C-like pseudocode, with meaningful analysis labels |
| `recovered/classes-and-methods.txt` | Readable metadata index of **27 assemblies, 3,346 types, and 22,316 method declarations** |
| `recovered/metadata-index.json` | Structured names, fields, and metadata indices |
| `recovered/data-archive-contents/` | All nine raw members of the data archive, including `global-metadata.dat` and the UnityFS asset bundle |

The game bundle identifies **Unity 2017.4.0f1**, and its IL2CPP metadata uses format 24. Gameplay includes PlayMaker state machines, so some behavior is represented in the serialized game assets as well as the executable.

The original one-pass WABT text export was incomplete on this large executable. I reconstructed the final export in pieces, reassembled it, and compared the binary sections: **all 49,674 function bodies and all non-code section payloads match the original**. Differences in the overall file size came from section/body length encodings, not changed game logic. The game in this kit uses the exact original decoded Wasm bytes.

The full C-like decompiler failed on the whole module. The included pseudocode therefore covers the selected time-scale functions only. The complete recovered executable representation is the `.wat` file, about 169 MB uncompressed. A capable text editor may be needed to open it.

## Rebuild edited executable code

Prefer editing `game/mods.js` or `game/practice.js` for the included controls. For an actual compiled-code change:

1. Copy `recovered/slope-complete.wat` to a new file such as `edited.wat`.
2. Edit the specific function you have identified. WAT is WebAssembly text, not C#.
3. Run:

   ```sh
   node rebuild.cjs edited.wat
   ```

The script compiles and validates the new binary, creates `game/slope.wasm.original` once as a backup, and installs the new `game/slope.wasm`. Reload the game to test it. To restore, replace `game/slope.wasm` with that backup. Rebuilding a large module can require considerable memory. A structurally valid binary can still contain an incorrect gameplay change.

## Use the controls with your existing HTML instead

This optional patch contains **only the time controls and scanner**. Use the provided launcher for jumping, images, colors, course filters, and the bot. Those require `mods.js` and the updated data archive.

1. Back up your existing `slope_wasmframework*.unityweb` file.
2. Replace it with `patch-for-existing-game/slope_wasmframework(1).unityweb`, renaming the replacement to the **exact filename your current loader requests** if necessary.
3. Keep your other existing game files and loader settings.
4. Put the included `trainer.js` beside your HTML if you want the additional scanner.
5. Reload without using an old browser/service-worker cache.

This derivative framework includes the practice panel in its runtime callback. Its original gzip filename/comment header is preserved. The helper uses the same native control functions tested in the supplied launcher, but your original HTML/loader was not available, so that separate loader combination has not been tested end-to-end.

To regenerate the derivative after editing the helper, use Python 3:

```sh
python3 source/build-framework-patch.py ORIGINAL_FRAMEWORK.unityweb game/practice.js NEW_FRAMEWORK.unityweb
```

## About the Unity Editor

**This is not the original Unity Editor project.** Compiled `.unityweb` files cannot simply be imported into Unity to restore the original C# scripts, scenes, and project setup. The metadata preserves names and declarations, while IL2CPP turns managed code into native executable code. Recreating an editable Editor project would require source recovery/manual reconstruction and asset conversion; that has not been done here. [Unity's IL2CPP overview](https://docs.unity3d.com/6000.1/Documentation/Manual/scripting-backends-il2cpp.html)

You can already modify this local build through the JavaScript helper or recovered WebAssembly. Downloading Unity is unnecessary for that workflow.

## Verification and notices

The actual uploaded game was tested in a Chromium browser with WebGL: the menu loaded, Play entered the running ball scene, and quarter-speed, pause, resume, and 4× changed the live engine time scale correctly. Workshop checks verified a grounded jump followed by an airborne state, real texture uploads, color changes, course transition/weight updates, and active bot velocity control. The verification also checked that the recovered WAT rebuild preserves the executable function bodies and other section payloads. It is not a claim that every menu, level, browser, or possible modification has been tested.

Your original uploaded files were not overwritten. The replacement HTML, launcher, and practice helper are new code; the game executable/data derive from your supplied files. WABT 1.0.39 command-line tools are bundled for rebuilding, with their Apache license in `tools/WABT-LICENSE`. Metadata layout was checked against the [Il2CppDumper format definitions](https://github.com/Perfare/Il2CppDumper/blob/master/Il2CppDumper/Il2Cpp/MetadataClass.cs). This kit is independent of Unity and the game's publisher.

### Reproduce the texture preparation

The included game is already prepared; these commands are only for development:

```sh
python3 -m pip install -r source/requirements.txt
python3 source/prepare-textures.py
```

This rebuilds `game/slope.data` from the preserved archive members. It changes only textures 24, 32, and 38 in `sharedassets0.assets` plus bundle/archive serialization. The Wasm executable is unchanged.

# scratch-similarity-experiments

*Experiment to determine the similarity between two Scratch projects to identify exact clones and substantial remixes.*

On the Scratch websites, users can remix projects. Sometimes users remix a project without making any changes/changes that have no impact on the project, and on the other hand, sometimes people upload entirely different projects as remixes to try to game the system.

The goal of this project is to determine the similarity of a project against an original project, to try and identify whether it makes substantial changes to a project (without being an entirely different project pretending to be a remix). It could be valuable to build a better system to display prominent remixes on the project page.

This attempt uses a simple method where project JSONs are compared against each other using the Jaccard similarity between their strings representationss based on their n-grams (default n = 10)

## Usage

Run index.js and provide the name of a directory in `./projects/` This repo comes with some named projects for testing, but they can also be downloaded using a script provided in the repo (see below).

`node index.js <project_name>`

This yields okay results, and is relatively fast. However it can be slow on extremely large projects (eg. 700ms+ for Paper Minecraft remixes)

## Example

Running `node index.js cat-witch-game` (https://scratch.mit.edu/projects/1045176470/) produces the `./projects/cat-witch-game/output.json` file included in this repo.

Three projects, 1050215094, 1050261561, 1050411312 are identical clones as indicated by the similarity value of `1`.

1050139652 is the most different remix, with a similarity of `0.9619643116807578`

and project IDs 1050075105, 1050390438, 1050072464 and 1050073474 are likely entirely different projects, with low similarity values between `0.11789276276532265` and 0.`05650535459558432`.

`1d-platformer` (https://scratch.mit.edu/projects/298884837/) has some of the most varied results. The output is also provided in this repo.

* Project 300393957 https://scratch.mit.edu/projects/300393957 has the most substantial changes from the original (but is still a remix!) with a similarity of `0.028204670666696408`, but applying the same heuristic to weed out entirely different projects as the cat-witch-game would suggest that the remix is not really a remix.

## Downloading projects
This repo also comes with a script to download project remixes. From the root directory run `node ./download-all-remixes.js 1045176470`

This will create a directory like `./projects/1045176470/`, then run `node index.js 1045176470` to try it out

## Shortcomings & a potential new approach

This method of comparing project similarity is very simple, and the similarity values it generates are hard to compare, because they are scaled entirely differently for different projects. I also found that it tends to consider tiny changes to assets as much more important than changes to blocks (as changing a costume recalculates the entire MD5 hash included in the project JSON, whereas moving/editing a block may only change the ordering of the JSON)

But.. Scratch already adds unique identifiers that could be useful to compare instead:

A potentially more valuable approach would include parsing project JSONs to look for IDs (they look like `0803/QZYdH}Su@-k!c`), they identify unique blocks, variables, sprites, costumes, etc. and do not change unless a user directly moves them. They also carry over when using the backpack. If a remix of a project does not contain any of the same IDs, it's almost certainly an entirely different project uploaded as a remix. If a remix includes some of the same IDs, then we know it was actually based on the same original project.

It should be possible to extract all the IDs from two projects, and compare to see whether the second project includes new IDs, to tell if it was just slightly moving blocks/making no real changes, or actually includes a substantial change. (adding new IDs). This, combined with comparing the MD5 hashes of assets, should help identify whether a project includes any substantial changes in a more controlled manner. (it would be possible to set weightings for different changes, eg. additions may be more valuable than removals, etc.).

Then, the weightings can be experimented with and tuned to try and find a range where a remix makes substantial and valuable changes to a project.
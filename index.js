const fs = require('node:fs/promises')
const path = require('path')

if (process.argv.length !== 3) {
    console.error('Usage: node index.js <project_name> (eg. node index.js cat-witch-game)');
    process.exit(1);
}

// jaccard similarity from chatgpt
function getNGrams(str, n) {
    let nGrams = new Set();
    for (let i = 0; i <= str.length - n; i++) {
        nGrams.add(str.substr(i, n));
    }
    return nGrams;
}

function jaccardSimilarityNGrams(str1, str2, n = 10) {
    let set1 = getNGrams(str1, n);
    let set2 = getNGrams(str2, n);

    let intersection = new Set([...set1].filter(x => set2.has(x)));
    let union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
}

function removeXY(obj) {
    // hacky function that removes any keys called x or y from an array of objects, with any nesting
    if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
            obj[index] = removeXY(item);
        });
    } else if (obj && typeof obj === 'object') {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (key === 'x' || key === 'y') {
                    delete obj[key];
                } else {
                    obj[key] = removeXY(obj[key]);
                }
            }
        }
    }
    return obj;
}

function preprocessProject(projectJSON) {
    // remove some additional project metadata that will be different for each project
    let project = JSON.parse(projectJSON)
    delete project.meta
    project = removeXY(project)
    return JSON.stringify(project)
}

/* async function main() {
    // just compare two projects against one original
    let original = await fs.readFile('./projects/paper-mc.json', 'utf-8')
    let exact = await fs.readFile('./projects/paper-mc-clone.json', 'utf-8')
    let entirelyDifferent = await fs.readFile('./projects/paper-mc-supermod.json', 'utf-8')

    let processedOriginal = preprocessProject(original)
    let processedExact = preprocessProject(exact)
    let processedEntirelyDifferent = preprocessProject(entirelyDifferent)

    console.time()
    console.log(jaccardSimilarityNGrams(processedOriginal, processedExact))
    console.log(jaccardSimilarityNGrams(processedOriginal, processedEntirelyDifferent))
    console.timeEnd()
} */

async function main() {
    // comparing ./projects/:project/original.json against remixes
    const directoryPath = './projects/' + process.argv[2];
    const originalFilePath = path.join(directoryPath, 'original.json');

    // Read the original project JSON
    let original = await fs.readFile(originalFilePath, 'utf-8');
    let processedOriginal = preprocessProject(original);

    // Read all files in the directory
    let files = await fs.readdir(directoryPath);

    let similarities = [];

    for (const file of files) {
        if (file == 'output.json') return; // don't include the output data in the comparisons
        const filePath = path.join(directoryPath, file);

        // Read and process each project file
        let project = await fs.readFile(filePath, 'utf-8');
        let processedProject = preprocessProject(project);

        console.time(`Comparison with ${file}`);
        let similarity = jaccardSimilarityNGrams(processedOriginal, processedProject);
        console.timeEnd(`Comparison with ${file}`);

        console.log(`${file}: ${similarity}`);

        similarities.push({ file, similarity });
    }

    similarities.sort((a, b) => b.similarity - a.similarity);

    // Write the sorted similarities to output.json
    const outputFilePath = path.join(directoryPath, 'output.json');
    await fs.writeFile(outputFilePath, JSON.stringify(similarities, null, 2));

    console.log(`Similarities written to ${outputFilePath}`);
}


main()
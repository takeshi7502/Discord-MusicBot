const fs = require('fs');
const translate = require('@iamtraction/google-translate');

async function doTranslate() {
    const vi = JSON.parse(fs.readFileSync('locales/vi.json', 'utf8'));
    let en = {};
    if (fs.existsSync('locales/en.json')) {
        en = JSON.parse(fs.readFileSync('locales/en.json', 'utf8'));
    }

    let changed = false;

    const traverseAndTranslate = async (viObj, enObj) => {
        for (const key of Object.keys(viObj)) {
            if (typeof viObj[key] === 'object' && viObj[key] !== null) {
                if (!enObj[key]) enObj[key] = {};
                await traverseAndTranslate(viObj[key], enObj[key]);
            } else {
                if (key.startsWith('auto_')) {
                    // Check if it's the exact same as Vietnamese (meaning it fell back or hasn't been translated)
                    if (!enObj[key] || enObj[key] === viObj[key]) {
                        try {
                            const original = viObj[key];
                            // Temporary replace variables {var1} with __var1__ to protect them
                            let textToTranslate = original.replace(/\{([^}]+)\}/g, '__$1__');
                            
                            const result = await translate(textToTranslate, { to: 'en' });
                            let translated = result.text;
                            
                            // Restore variables
                            translated = translated.replace(/__([^_]+)__/g, '{$1}');
                            
                            enObj[key] = translated;
                            console.log(`Translated [${key}]: ${translated}`);
                            changed = true;
                            // slight sleep
                            await new Promise(r => setTimeout(r, 1000));
                        } catch (e) {
                            console.error(`Failed to translate ${key}: ${e.message}`);
                            enObj[key] = viObj[key]; 
                            await new Promise(r => setTimeout(r, 2000));
                        }
                    }
                }
            }
        }
    };

    console.log("Starting translation...");
    await traverseAndTranslate(vi, en);
    if (changed) {
        fs.writeFileSync('locales/en.json', JSON.stringify(en, null, 2));
    }
    console.log("Translation complete!");
}

doTranslate();

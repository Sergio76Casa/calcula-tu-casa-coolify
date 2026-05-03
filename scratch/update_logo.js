const fs = require('fs');
const path = require('path');

const imagePath = path.join(__dirname, '..', 'imagenes', 'logo4.jpg');
const outputPath = path.join(__dirname, '..', 'src', 'lib', 'logoBase64.ts');

try {
    const data = fs.readFileSync(imagePath).toString('base64');
    const content = `export const LOGO_BASE64 = "data:image/jpeg;base64,${data}";\n`;
    fs.writeFileSync(outputPath, content);
    console.log('Logo actualizado correctamente en src/lib/logoBase64.ts');
} catch (err) {
    console.error('Error al actualizar el logo:', err);
    process.exit(1);
}

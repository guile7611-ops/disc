const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIcoModule = require('png-to-ico');
const pngToIco = typeof pngToIcoModule === 'function' ? pngToIcoModule : pngToIcoModule.default;

async function processIcon() {
  const inputPath = path.join(__dirname, '../build/icon.png');
  const squarePngPath = path.join(__dirname, '../build/icon_square.png');
  const icoPath = path.join(__dirname, '../build/icon.ico');
  const publicIconPath = path.join(__dirname, '../public/icon.png');

  // Redimensiona a imagem enviada para um quadrado perfeito 512x512 mantendo transparência
  await sharp(inputPath)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toFile(squarePngPath);

  fs.copyFileSync(squarePngPath, inputPath);
  fs.copyFileSync(squarePngPath, publicIconPath);

  // Gera o arquivo icon.ico com suporte a múltiplas resoluções para o Windows
  const buf = await pngToIco(squarePngPath);
  fs.writeFileSync(icoPath, buf);
  console.log('Ícones icon.png e icon.ico quadrados (512x512) gerados com sucesso!');
}

processIcon().catch(console.error);

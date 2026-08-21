const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIcoModule = require('png-to-ico');
const pngToIco = typeof pngToIcoModule === 'function' ? pngToIcoModule : pngToIcoModule.default;

async function processIcon() {
  const inputPath = path.join(__dirname, '../build/2445b282c3986a19eb1ee749817f4578.jpg');
  const squarePngPath = path.join(__dirname, '../build/icon_square.png');
  const buildIconPath = path.join(__dirname, '../build/icon.png');
  const publicIconPath = path.join(__dirname, '../public/icon.png');
  const icoPath = path.join(__dirname, '../build/icon.ico');

  // Redimensiona a imagem do Psyduck de fone de ouvido para um quadrado perfeito 512x512
  await sharp(inputPath)
    .resize(512, 512, {
      fit: 'cover'
    })
    .png()
    .toFile(squarePngPath);

  fs.copyFileSync(squarePngPath, buildIconPath);
  fs.copyFileSync(squarePngPath, publicIconPath);

  // Gera o arquivo icon.ico nativo do Windows com o Psyduck
  const buf = await pngToIco(squarePngPath);
  fs.writeFileSync(icoPath, buf);
  console.log('Ícone do Psyduck com fone gerado com sucesso!');
}

processIcon().catch(console.error);

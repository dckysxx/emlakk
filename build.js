const fs = require('fs');

try {
    let html = fs.readFileSync('index.html', 'utf8');
    const css = fs.readFileSync('css/style.css', 'utf8');
    const js = fs.readFileSync('js/app.js', 'utf8');

    html = html.replace('<link rel="stylesheet" href="./css/style.css">', '<style>\n' + css + '\n</style>');
    html = html.replace('<script src="./js/app.js"></script>', '<script>\n' + js + '\n</script>');

    fs.writeFileSync('emlak_tek_dosya.html', html);
    console.log("Başarıyla oluşturuldu: emlak_tek_dosya.html");
} catch (e) {
    console.error("Hata oluştu:", e);
}

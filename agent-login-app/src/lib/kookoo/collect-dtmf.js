const { DOMImplementation } = require('xmldom');
const implementation = new DOMImplementation();

class CollectDtmf {
    constructor(maxDigits = null, termChar = null, timeOut = 4000) {
        this.doc = implementation.createDocument(null, 'collectdtmf', null);
        this.collectDtmf = this.doc.documentElement;

        if (maxDigits !== null) {
            this.setMaxDigits(maxDigits);
        }
        if (termChar !== null) {
            this.setTermChar(termChar);
        }
        if (timeOut !== null) {
            this.setTimeOut(timeOut);
        }
    }

    setMaxDigits(maxDigits) {
        this.collectDtmf.setAttribute('l', maxDigits);
    }

    setTermChar(termChar) {
        this.collectDtmf.setAttribute('t', termChar);
    }

    setTimeOut(timeOut = 4000) {
        this.collectDtmf.setAttribute('o', timeOut);
    }

    addPlayText(text, speed = 2, lang = 'EN', quality = 'best') {
        const playText = this.doc.createElement('playtext');
        playText.textContent = text;
        playText.setAttribute('speed', speed);
        playText.setAttribute('lang', lang);
        playText.setAttribute('quality', quality);
        this.collectDtmf.appendChild(playText);
    }

    addPlayAudio(url) {
        const playAudio = this.doc.createElement('playaudio');
        playAudio.textContent = url;
        this.collectDtmf.appendChild(playAudio);
    }

    getRoot() {
        return this.collectDtmf;
    }
}

module.exports = CollectDtmf;
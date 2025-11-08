/**
 * Copyright (c) 2010-2011 Ozonetel Pvt Ltd.
 * 
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

const { DOMImplementation, XMLSerializer } = require('xmldom');
const implementation = new DOMImplementation();

class Response {
    constructor(sid = null) {
        const constructorTimestamp = new Date().toISOString();
        console.log(`[Response] ${constructorTimestamp} - 🏗️  Creating new Response object`);
        console.log(`[Response] SID: ${sid || 'NOT PROVIDED'}`);
        
        this.doc = implementation.createDocument(null, 'response', null);
        this.response = this.doc.documentElement;
        
        if (sid) {
            this.setSid(sid);
        }
        
        console.log(`[Response] ${new Date().toISOString()} - ✅ Response object initialized`);
    }

    setSid(sid) {
        console.log(`[Response] ${new Date().toISOString()} - 🔖 Setting SID: ${sid}`);
        this.response.setAttribute('sid', sid);
    }

    setFiller(filler) {
        this.response.setAttribute('filler', filler);
    }

    addPlayText(text, speed = 2, lang = 'EN', quality = 'best') {
        console.log(`[Response] ${new Date().toISOString()} - 🔊 Adding PlayText: "${text}" (speed=${speed}, lang=${lang})`);
        
        const playText = this.doc.createElement('playtext');
        playText.textContent = text;
        playText.setAttribute('lang', lang);
        playText.setAttribute("type", "ggl");
       // playText.setAttribute("lang", lang);
     
        playText.setAttribute('speed', speed);
        playText.setAttribute('quality', quality);
        this.response.appendChild(playText);
    }

    addSayAs(text, formatCode = 501, lang = 'EN') {
        const sayAs = this.doc.createElement('Say-As');
        sayAs.textContent = text;
        sayAs.setAttribute('format', formatCode);
        sayAs.setAttribute('lang', lang);
        this.response.appendChild(sayAs);
    }

    addHangup() {
        console.log(`[Response] ${new Date().toISOString()} - ☎️  Adding Hangup command`);
        
        const hangup = this.doc.createElement('hangup');
        this.response.appendChild(hangup);
        
        console.log(`[Response] ${new Date().toISOString()} - ✅ Hangup element added to XML`);
    }

    addDial(no, options = {}) {
        const {
            record = 'false',
            limittime = '1000',
            timeout,
            moh = 'default',
            promptToCalledNumber = 'no',
            caller_id
        } = options;

        const dial = this.doc.createElement('dial');
        dial.textContent = no;
        dial.setAttribute('record', record);
        dial.setAttribute('limittime', limittime);
        if (timeout) dial.setAttribute('timeout', timeout);
        dial.setAttribute('moh', moh);
        dial.setAttribute('promptToCalledNumber', promptToCalledNumber);
        if (caller_id) dial.setAttribute('caller_id', caller_id);
        this.response.appendChild(dial);
    }

    addConference(confno, options = {}) {
        const {
            caller_id = '',
            record = 'true',
            timeout = '-1',
            version = '1'
        } = options;

        const conf = this.doc.createElement('conference');
        conf.textContent = confno;
        conf.setAttribute('caller_id', caller_id);
        conf.setAttribute('record', record);
        conf.setAttribute('version', version);
        conf.setAttribute('timeout', timeout);
        this.response.appendChild(conf);
    }

    sendSms(text, no) {
        const sendSms = this.doc.createElement('sendsms');
        sendSms.textContent = text;
        sendSms.setAttribute('to', no);
        this.response.appendChild(sendSms);
    }

    addPlayAudio(url) {
        const playAudio = this.doc.createElement('playaudio');
        playAudio.textContent = url;
        this.response.appendChild(playAudio);
    }

    addGoto(url) {
        const goto = this.doc.createElement('gotourl');
        goto.textContent = url;
        this.response.appendChild(goto);
    }

    playDtmf() {
        const playDtmf = this.doc.createElement('playdtmf-i');
        this.response.appendChild(playDtmf);
    }

    addCollectDtmf(collectDtmf) {
        const importedNode = this.doc.importNode(collectDtmf.getRoot(), true);
        this.response.appendChild(importedNode);
    }

    addRecord(filename, options = {}) {
        const {
            silence = '4',
            maxduration = '60',
            termchar = '#'
        } = options;

        const record = this.doc.createElement('record');
        record.textContent = filename;
        record.setAttribute('silence', silence);
        record.setAttribute('maxduration', maxduration);
        record.setAttribute('termchar', termchar);
        this.response.appendChild(record);
    }

    addRecognize(options = {}) {
        const {
            type = 'zena',
            timeout = '5',
            silence = '10',
            lang = 'en',
            length = '1',
            grammar = 'digits'
        } = options;

        const recognize = this.doc.createElement('recognize');
        recognize.setAttribute('type', type);
        recognize.setAttribute('timeout', timeout);
        recognize.setAttribute('silence', silence);
        recognize.setAttribute('lang', lang);
        recognize.setAttribute('length', length);
        recognize.setAttribute('grammar', grammar);
        this.response.appendChild(recognize);
    }

    addStream(streamNumber, wsurl, record = 'false') {
        console.log(`[Response] ${new Date().toISOString()} - 📡 Adding Stream: number="${streamNumber}", wsurl="${wsurl}", record=${record}`);
        
        const stream = this.doc.createElement('stream');
        stream.textContent = streamNumber;
        stream.setAttribute("is_sip", "true");
        stream.setAttribute("url", wsurl);
        stream.setAttribute('record', record);
        this.response.appendChild(stream);
        
        console.log(`[Response] ${new Date().toISOString()} - ✅ Stream element added to XML`);
    }

    getXML() {
        const xmlTimestamp = new Date().toISOString();
        const serializer = new XMLSerializer();
        const xmlString = serializer.serializeToString(this.doc);
        
        console.log(`[Response] ${xmlTimestamp} - 📝 XML Serialization completed:`);
        console.log(`[Response] XML Length: ${xmlString.length} characters`);
        console.log(`[Response] =============== GENERATED XML ===============`);
        console.log(xmlString);
        console.log(`[Response] ============== END XML OUTPUT ==============`);
        
        return xmlString;
    }

    send(res) {
        const sendTimestamp = new Date().toISOString();
        const xmlContent = this.getXML();
        
        console.log(`[Response] ${sendTimestamp} - 📤 Sending XML response to client`);
        console.log(`[Response] Content-Type: text/xml`);
        console.log(`[Response] Content-Length: ${xmlContent.length} bytes`);
        
        if (res) {
            res.set('Content-Type', 'text/xml');
            res.send(xmlContent);
            console.log(`[Response] ${new Date().toISOString()} - ✅ XML response sent successfully`);
        }
        return xmlContent;
    }
}

module.exports = Response;
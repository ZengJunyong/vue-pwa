"use strict";

let appid = 3104114736;

module.exports = {
    appid: appid,
    _config: {
        appid: appid,
        idName: "v" + new Date().getTime(),
        idAudioName: "a" + new Date().getTime(), // begin with 'a' is audio.
        nickName: "u" + new Date().getTime(),
        server: "wss://wsliveroom" + appid + "-api.zego.im:8282/ws",//"wss://wsliveroom-alpha.zego.im:8282/ws",
        logLevel: 2,
        logUrl: "",
        remoteLogLevel: 0,
        audienceCreateRoom: true
    },
    _otherConfig: {
        cgi_token: "",
        roomlist: "",
        signal: "",
        token: "https://wsliveroom-demo.zego.im:8282/token"//"https://wsliveroom"+appid+"-api.zego.im:8282/token",
    }
};
